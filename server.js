/* ELKOPLAST – Kalkulátor lisů
 * Server: statické soubory + REST API pro účty a historii nabídek/modelací.
 * Bez externích závislostí – jen Node.js built-in moduly.
 * Data: JSON soubor s atomickými zápisy (process.env.DATA_DIR nebo ./data).
 */
const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = path.join(__dirname, 'public');
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

try { fs.mkdirSync(DATA_DIR, { recursive: true }); } catch(e) {}

const MIME = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg',
  '.ico': 'image/x-icon', '.woff2': 'font/woff2'
};

/* ---------- DB ---------- */
let _dbLock = Promise.resolve();
function readDB() {
  try {
    if (!fs.existsSync(DB_FILE)) return { users: [], sessions: [], items: [] };
    return JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
  } catch (e) { console.error('DB read error:', e); return { users: [], sessions: [], items: [] }; }
}
function writeDB(db) {
  const tmp = DB_FILE + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(db, null, 2));
  fs.renameSync(tmp, DB_FILE);
}
async function withDB(fn) {
  const prev = _dbLock;
  let release;
  _dbLock = new Promise(r => { release = r; });
  await prev;
  try {
    const db = readDB();
    const result = await fn(db);
    writeDB(db);
    return result;
  } finally { release(); }
}

/* ---------- Hash + token ---------- */
function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return { salt, hash };
}
function verifyPassword(password, salt, expectedHash) {
  try {
    const hash = crypto.scryptSync(password, salt, 64).toString('hex');
    return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(expectedHash, 'hex'));
  } catch(e) { return false; }
}
function generateToken() { return crypto.randomBytes(32).toString('hex'); }
function getUserFromAuth(req, db) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) return null;
  const token = auth.slice(7);
  const session = db.sessions.find(s => s.token === token);
  if (!session) return null;
  if (new Date(session.expiresAt) < new Date()) return null;
  return db.users.find(u => u.id === session.userId);
}

/* ---------- HTTP utility ---------- */
function readBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', c => {
      data += c;
      if (data.length > 2e6) { req.destroy(); reject(new Error('Příliš velký požadavek')); }
    });
    req.on('end', () => {
      try { resolve(data ? JSON.parse(data) : {}); }
      catch (e) { reject(new Error('Neplatný JSON')); }
    });
    req.on('error', reject);
  });
}
function sendJSON(res, status, body) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
  res.end(JSON.stringify(body));
}
function isValidEmail(e) { return typeof e === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e); }

/* ---------- API HANDLERS ---------- */
async function handleRegister(req, res) {
  try {
    const body = await readBody(req);
    const email = (body.email || '').trim().toLowerCase();
    const name = (body.name || '').trim();
    const password = body.password || '';
    if (!isValidEmail(email)) return sendJSON(res, 400, { error: 'Neplatný formát e-mailu' });
    if (password.length < 6) return sendJSON(res, 400, { error: 'Heslo musí mít alespoň 6 znaků' });
    const result = await withDB(async (db) => {
      if (db.users.find(u => u.email === email)) return { status: 409, body: { error: 'Účet s tímto e-mailem už existuje' } };
      const { salt, hash } = hashPassword(password);
      const user = {
        id: 'u_' + crypto.randomBytes(8).toString('hex'),
        email, name: name || email.split('@')[0],
        passwordHash: hash, salt, createdAt: new Date().toISOString()
      };
      db.users.push(user);
      const token = generateToken();
      db.sessions.push({ token, userId: user.id, expiresAt: new Date(Date.now() + 30*24*3600*1000).toISOString() });
      return { status: 201, body: { token, user: { id: user.id, email: user.email, name: user.name } } };
    });
    sendJSON(res, result.status, result.body);
  } catch (e) { sendJSON(res, 400, { error: e.message }); }
}

async function handleLogin(req, res) {
  try {
    const body = await readBody(req);
    const email = (body.email || '').trim().toLowerCase();
    const password = body.password || '';
    if (!email || !password) return sendJSON(res, 400, { error: 'E-mail a heslo jsou povinné' });
    const result = await withDB(async (db) => {
      const user = db.users.find(u => u.email === email);
      if (!user) return { status: 401, body: { error: 'Nesprávné přihlašovací údaje' } };
      if (!verifyPassword(password, user.salt, user.passwordHash)) return { status: 401, body: { error: 'Nesprávné přihlašovací údaje' } };
      const token = generateToken();
      db.sessions.push({ token, userId: user.id, expiresAt: new Date(Date.now() + 30*24*3600*1000).toISOString() });
      db.sessions = db.sessions.filter(s => new Date(s.expiresAt) > new Date());
      return { status: 200, body: { token, user: { id: user.id, email: user.email, name: user.name } } };
    });
    sendJSON(res, result.status, result.body);
  } catch (e) { sendJSON(res, 400, { error: e.message }); }
}

async function handleLogout(req, res) {
  const auth = req.headers.authorization;
  if (auth && auth.startsWith('Bearer ')) {
    const token = auth.slice(7);
    await withDB(async (db) => { db.sessions = db.sessions.filter(s => s.token !== token); });
  }
  sendJSON(res, 200, { ok: true });
}

async function handleMe(req, res) {
  const db = readDB();
  const user = getUserFromAuth(req, db);
  if (!user) return sendJSON(res, 401, { error: 'Neautorizováno' });
  sendJSON(res, 200, { user: { id: user.id, email: user.email, name: user.name } });
}

async function handleItems(req, res, urlPath) {
  const db = readDB();
  const user = getUserFromAuth(req, db);
  if (!user) return sendJSON(res, 401, { error: 'Neautorizováno' });

  if (req.method === 'GET' && urlPath === '/api/items') {
    const url = new URL(req.url, 'http://x');
    const kind = url.searchParams.get('kind');
    let items = db.items.filter(i => i.userId === user.id);
    if (kind) items = items.filter(i => i.kind === kind);
    items = items.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    return sendJSON(res, 200, { items });
  }
  if (req.method === 'POST' && urlPath === '/api/items') {
    try {
      const body = await readBody(req);
      const kind = body.kind || 'offer';
      if (!['offer', 'model', 'export', 'contract'].includes(kind)) return sendJSON(res, 400, { error: 'Neplatný typ záznamu' });
      const result = await withDB(async (db) => {
        const item = {
          id: 'i_' + crypto.randomBytes(8).toString('hex'),
          userId: user.id, kind, createdAt: new Date().toISOString(),
          data: body.data || {}
        };
        db.items.push(item);
        const mine = db.items.filter(i => i.userId === user.id);
        if (mine.length > 500) {
          const sorted = mine.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
          const toRemove = new Set(sorted.slice(0, mine.length - 500).map(i => i.id));
          db.items = db.items.filter(i => !toRemove.has(i.id));
        }
        return item;
      });
      return sendJSON(res, 201, { item: result });
    } catch (e) { return sendJSON(res, 400, { error: e.message }); }
  }
  if (req.method === 'DELETE' && urlPath.startsWith('/api/items/')) {
    const id = urlPath.slice('/api/items/'.length);
    await withDB(async (db) => { db.items = db.items.filter(i => !(i.id === id && i.userId === user.id)); });
    return sendJSON(res, 200, { ok: true });
  }
  if (req.method === 'DELETE' && urlPath === '/api/items') {
    await withDB(async (db) => { db.items = db.items.filter(i => i.userId !== user.id); });
    return sendJSON(res, 200, { ok: true });
  }
  sendJSON(res, 404, { error: 'Nenalezeno' });
}

/* ---------- HLAVNÍ SERVER ---------- */
const server = http.createServer(async (req, res) => {
  if (req.url === '/health' || req.url === '/healthz') {
    res.writeHead(200, { 'Content-Type': 'text/plain' }); return res.end('OK');
  }
  const urlObj = new URL(req.url, 'http://x');
  const urlPath = urlObj.pathname;

  if (urlPath.startsWith('/api/')) {
    try {
      if (req.method === 'POST' && urlPath === '/api/register') return await handleRegister(req, res);
      if (req.method === 'POST' && urlPath === '/api/login') return await handleLogin(req, res);
      if (req.method === 'POST' && urlPath === '/api/logout') return await handleLogout(req, res);
      if (req.method === 'GET' && urlPath === '/api/me') return await handleMe(req, res);
      if (urlPath.startsWith('/api/items')) return await handleItems(req, res, urlPath);
      sendJSON(res, 404, { error: 'Endpoint nenalezen' });
    } catch (e) {
      console.error('API error:', e);
      sendJSON(res, 500, { error: 'Interní chyba serveru' });
    }
    return;
  }

  let staticPath = decodeURIComponent(urlPath);
  if (staticPath === '/' || staticPath === '') staticPath = '/index.html';
  const filePath = path.join(PUBLIC_DIR, path.normalize(staticPath).replace(/^(\.\.[/\\])+/, ''));
  if (!filePath.startsWith(PUBLIC_DIR)) { res.writeHead(403); return res.end('Forbidden'); }
  fs.readFile(filePath, (err, data) => {
    if (err) {
      fs.readFile(path.join(PUBLIC_DIR, 'index.html'), (e2, html) => {
        if (e2) { res.writeHead(404); return res.end('Soubor nenalezen'); }
        res.writeHead(200, { 'Content-Type': MIME['.html'] }); res.end(html);
      });
      return;
    }
    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
    res.end(data);
  });
});

server.listen(PORT, () => {
  console.log('ELKOPLAST kalkulátor lisů běží na portu ' + PORT);
  console.log('DATA_DIR =', DATA_DIR);
});
