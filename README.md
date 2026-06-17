# Kalkulátor lisů ELKOPLAST CZ — v3.9

## Co je nového v 3.9: Forma dodávky LEASING jako třetí možnost

Vedle Pronájmu a Prodeje má teď hero panel třetí tlačítko **⚡ Leasing**, které
zapne operativní leasing s opcí výkupu (Bramidan-style anuita) pro všechny
Bramidan modely. Pro Zentex leasing není dostupný (mají vlastní cenový model).

### Hero panel
- **Forma dodávky:** Pronájem / ⚡ Leasing / Prodej lisu
- **Parametry leasingu:** Úrok 7,9 % p.a. · Doba 60 měs (5 let) · FV 30 % zůstatková
- Anuita PMT z TVM vzorce: PV × (1+i)^N − FV

### PDF nabídka pro Leasing
- Hlavička: "Forma: Operativní leasing s opcí výkupu" + doba leasingu
- Karty lisů: cena 6 671 Kč/měs (anuita PMT + servis), zůstatková hodnota, doba
- Souhrn cen: sloupec "Měsíční leasing vč. servisu" + "Celkem za 60 měs vč. FV"
- DPH 21 % automaticky
- Poznámka o třech opcích konce smlouvy (výkup / vrácení / prodloužení)

### Příklad - Bramidan X40 wide (nákup 336 000 Kč)
| Forma | Měsíční částka | Celkem |
|---|---|---|
| Pronájem 2,8 % | 10 658 Kč/měs | 383 688 Kč/3 roky |
| **Leasing anuita** | **6 671 Kč/měs** | 426 082 Kč/5 let vč. FV |
| Prodej | 436 800 Kč (s marží 30 %) | + jednorázové |

## Nasazení
1. Nahrajte soubory do GitHub repozitáře
2. Railway redeployuje automaticky
