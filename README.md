# Kalkulátor lisů ELKOPLAST CZ — Self-Contained verze 3.1

Vše v jednom souboru. HTML aplikace je embeddovaná přímo v `server.js`.

## Obsah balíčku

- **server.js** (~445 KB) — Node.js server + embeddovaná HTML aplikace
- **package.json** — bez externích závislostí
- **railway.json** — Railway konfigurace
- **.gitignore**

To je vše. **Žádná složka `public/`**, žádné externí soubory.

## Cenový model

- **Bramidan** (vertikální lisy) — fixní sazba **2,8 % z nákupní ceny stroje bez DPH** (návratnost 36 měsíců). Žádné jiné varianty.
- **Zentex** (mobilní lisovací stroje) — fixní cena dle objemu kontejneru:
  - 6 m³ = 8 500 Kč
  - 10 m³ = 8 800 Kč
  - 14 m³ = 9 100 Kč
  - 16 m³ = 9 200 Kč
  - **20 m³ = 9 500 Kč** (referenční)
  - 22 m³ = 10 000 Kč
  - 24 m³ = 10 500 Kč

V kartě každého Zentex stroje se zobrazuje **efektivní sazba %** dopočítaná z nákupní ceny.

## Nasazení na Railway

1. Nahrajte tyto 4 soubory do root GitHub repozitáře.
2. Railway automaticky detekuje commit a nasadí.
3. Po deployi je aplikace na vaší Railway URL.

## Persistentní volume

V Railway projektu → **Settings → Volumes**:
- Mount path: `/data`
- Velikost: 1 GB
- V **Variables**: `DATA_DIR = /data`

## Aktualizace

Stačí nahradit `server.js` novou verzí a push. Data v `/data/db.json` zůstanou.

## Lokální spuštění

```bash
node server.js
```

Otevřete `http://localhost:3000`. Funguje i bez Railway, bez složek, bez závislostí.
