# Kalkulátor lisů ELKOPLAST CZ — Self-Contained verze

Vše v jednom souboru. HTML aplikace je embeddovaná přímo v `server.js`.

## Co je v balíčku

- **server.js** (~446 KB) — Node.js server + embeddovaná HTML aplikace
- **package.json** — bez externích závislostí
- **railway.json** — Railway konfigurace

To je vše. **Žádná složka `public/`**, žádné externí soubory.

## Nasazení

1. Nahrajte tyto 3 soubory do root GitHub repozitáře.
2. Railway automaticky detekuje commit a nasadí.
3. Po deployi je aplikace na vaší Railway URL.

## Persistentní volume (důležité pro účty)

V Railway projektu → **Settings → Volumes**:
- Mount path: `/data`
- Velikost: 1 GB
- V **Variables**: `DATA_DIR = /data`

Bez volume Railway smaže databázi účtů při každém deployi.

## Aktualizace

Stačí nahradit `server.js` novou verzí a push. Data v `/data/db.json` zůstanou.
