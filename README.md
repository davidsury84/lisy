# Kalkulátor lisů ELKOPLAST CZ

Webová aplikace pro kalkulaci nabídek lisů Bramidan a Zentex.

**Funkce**: profily obchodníků, **uživatelské účty se sdílenou historií**, nabídky (PDF/Excel/e-mail), modelace ROI, generování smluv, návratová křivka.

## Architektura

```
.
├── public/
│   └── index.html      ← celá aplikace (single-file, 235 KB)
├── server.js           ← Node.js server (statika + REST API)
├── package.json        ← bez externích závislostí
├── railway.json        ← konfigurace Railway
└── data/               ← JSON databáze (vytvoří se automaticky)
    └── db.json
```

**Bez externích závislostí** — používá jen Node.js built-in moduly (`http`, `fs`, `crypto`). Rychlý build, žádné kompilace, žádné npm install.

**Bezpečnost**: hesla hashována pomocí scrypt (Node.js built-in), session tokeny generované přes `crypto.randomBytes(32)`, atomic JSON zápisy.

## Účty a historie

- **Bez přihlášení** aplikace funguje offline — historie nabídek se ukládá lokálně v localStorage prohlížeče.
- **Po přihlášení** se historie ukládá na server pod účtem uživatele a je dostupná z jakéhokoli zařízení.
- Účet vytvoří uživatel sám (kliknutím na tlačítko **Účet** v horní liště → **Vytvořit účet**).
- Historie obsahuje: nabídky (PDF/Excel/e-mail), modelace ROI, smlouvy.

## Nasazení na Railway

### 1. Vytvoření projektu

**Přes GitHub (doporučeno):**
1. Nahrajte tento adresář do GitHub repozitáře:
   ```bash
   git init && git add . && git commit -m "Init" && git branch -M main
   git remote add origin https://github.com/VAS-UCET/elkoplast-kalkulator.git
   git push -u origin main
   ```
2. Na [railway.app](https://railway.app): **New Project → Deploy from GitHub repo** → vyberte repozitář.

**Nebo přes CLI:**
```bash
npm i -g @railway/cli
railway login
railway init
railway up
```

### 2. ⚠️ DŮLEŽITÉ: Persistentní volume pro databázi

Bez volume Railway smaže databázi při každém deployi. Nastavení:

1. V Railway projektu otevřete **Settings → Volumes → New Volume**
2. **Mount path**: `/data`
3. **Velikost**: stačí 1 GB
4. V **Variables** přidejte: `DATA_DIR = /data`

Po této úpravě databáze přetrvá deploy, restart i scale.

### 3. Veřejná adresa

V **Settings → Networking → Generate Domain** získáte URL (např. `elkoplast-kalkulator.up.railway.app`).

## API endpointy

| Metoda | Cesta | Popis |
|---|---|---|
| `POST` | `/api/register` | Registrace ({email, name, password}) — vrátí {token, user} |
| `POST` | `/api/login` | Přihlášení ({email, password}) — vrátí {token, user} |
| `POST` | `/api/logout` | Odhlášení (Authorization: Bearer ...) |
| `GET` | `/api/me` | Aktuální uživatel |
| `GET` | `/api/items[?kind=offer|model|contract]` | Historie záznamů |
| `POST` | `/api/items` | Uložit záznam ({kind, data}) |
| `DELETE` | `/api/items/:id` | Smazat záznam |
| `DELETE` | `/api/items` | Smazat celou historii |
| `GET` | `/health` | Health check (Railway) |

## Lokální spuštění

```bash
node server.js
```
Pak otevřete `http://localhost:3000`. Lze nastavit `PORT` a `DATA_DIR` přes env proměnné.

## Aktualizace

Stačí nahradit `public/index.html` novou verzí a deploy (přes `git push` nebo `railway up`). Data v `/data/db.json` se zachovají.

## Záloha databáze

Databáze je jeden JSON soubor. Pro stažení backupu z Railway:
```bash
railway run cat /data/db.json > backup-$(date +%F).json
```
