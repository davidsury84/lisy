# Kalkulátor lisů ELKOPLAST CZ — v3.3

Self-contained verze. HTML embeddované v `server.js`.

## Cenový model

### Bramidan (vertikální lisy)
**Fixní sazba 2,8 % z nákupní ceny stroje bez DPH.** Návratnost 36 měsíců. Servis se kalkuluje samostatně (rozložen do 12 měsíčních splátek).

### Zentex (mobilní lisovací stroje)
Fixní cena dle objemu **vč. kompletního servisu**:

| Objem | Cena vč. servisu | ~ % z nákupní |
|---|---|---|
| 6 m³ | 9 700 Kč | 2,8 % |
| 10 m³ | 10 000 Kč | 2,8 % |
| 14 m³ | 10 300 Kč | 2,9 % |
| 16 m³ | 10 600 Kč | 2,7 % |
| **20 m³** | **10 900 Kč** | **2,7 %** |
| 22 m³ | 11 500 Kč | 2,7 % |
| 24 m³ | 11 800 Kč | 3,0 % |

V kartě každého stroje se zobrazuje přesné % dopočítané z konkrétní nákupní ceny modelu.

## Nasazení

1. Nahrajte 4 soubory do root GitHub repozitáře.
2. Railway automaticky detekuje commit a nasadí.

## Persistentní volume
- Settings → Volumes → `/data`, 1 GB
- Variables → `DATA_DIR = /data`
