# AZ-104 — Style Guide

Questo file contiene tutte le informazioni di stile, font, colori e helper function
utilizzate per generare il documento Word AZ-104_Note_di_Studio.docx tramite Node.js
e la libreria `docx`. Ogni sessione di generazione deve caricare questo file insieme
al modulo di contenuto da aggiornare.

---

## Font e colori

| Elemento | Font | Dimensione | Colore |
|---|---|---|---|
| Default corpo | Calibri | 11pt (22 half-pt) | #333333 |
| Titolo copertina | Calibri | 48pt (96 half-pt) grassetto | #1B3A6B |
| Sottotitolo copertina | Calibri | 26pt (52 half-pt) grassetto | #0078D4 |
| Descrizione copertina | Calibri | 13pt (26 half-pt) corsivo | #555555 |
| moduloTitle | Calibri | 24pt (48 half-pt) grassetto | #1B3A6B |
| h2 | Calibri | 14pt (28 half-pt) grassetto keepNext | #0078D4 |
| h3 | Calibri | 12pt (24 half-pt) grassetto keepNext | #2D5F8A |
| stepTitle | Calibri | 11pt (22 half-pt) grassetto nero keepNext | #000000 |
| bullet | Calibri | 11pt (22 half-pt) | #333333 |
| codeBlock | Courier New | 9pt (18 half-pt) sfondo #EEF3F8 | #1B3A6B |
| caption | Calibri | 9pt (18 half-pt) corsivo centrato | #888888 |
| infoBox label | Calibri | 11pt grassetto | #0078D4 |
| infoBox testo | Calibri | 11pt | #333333 |
| tocMacro | Calibri | 12pt (24 half-pt) grassetto | #1B3A6B |
| tocHeading | Calibri | 11pt (22 half-pt) grassetto | #0078D4 |
| tocEntry | Calibri | 10pt (20 half-pt) | #2D5F8A |
| tocEntry numero pagina | Calibri | 10pt (20 half-pt) | #888888 |

---

## Margini pagina

Top, Right, Bottom, Left: **1440 DXA** (1 inch / 2.54 cm)

---

## Bordi e sfondi

- Linea sotto titolo 'Sommario' e moduloTitle: `BorderStyle.SINGLE size 8 color #0078D4 space 4`
- infoBox: sfondo `#E8F0FB`, bordo sinistro `SINGLE size 12 color #0078D4`, indent left 360 right 360
- Tabelle intestazione: sfondo `#1F4E78`, testo bianco
- Tabelle righe pari: sfondo `#F5F8FC` | righe dispari: `#FFFFFF`
- Tabelle bordi: `SINGLE size 1 color #CCCCCC`
- `cantSplit: true` su tutte le righe di tutte le tabelle

---

## Tab stop sommario

`TabStopType.RIGHT position 8200 leader 'dot'`

---

## Formato pagina

- Tipo: A4
- Dimensioni: 11906 × 16838 DXA

---

## Helper functions (script Node.js)

Tutte le funzioni sono definite in `/home/claude/create_az104_v6.js`.

| Funzione | Descrizione |
|---|---|
| `body(text)` | Paragrafo corpo testo, Calibri 11pt #333333 |
| `h2(text)` | Titolo sezione, Calibri 14pt #0078D4 grassetto keepNext |
| `h3(text)` | Sottotitolo sezione, Calibri 12pt #2D5F8A grassetto keepNext |
| `stepTitle(text)` | Titolo step, Calibri 11pt nero grassetto keepNext |
| `bullet(text, level)` | Punto elenco (level 0=normale, 1=indentato) |
| `caption(text)` | Didascalia immagine/tabella, 9pt corsivo grigio centrato |
| `codeBlock(text)` | Blocco codice, Courier New 9pt sfondo #EEF3F8 |
| `infoBox(label, text)` | Box informazioni con bordo sinistro blu |
| `spacer()` | Paragrafo vuoto separatore |
| `figImg(filename, w, h)` | Immagine scalata a max 6123000 EMU (~6.5 inch) |
| `makeTable(headers, rows, widths)` | Tabella stilizzata con header #1F4E78 |
| `moduloTitle(text)` | Titolo macro-modulo 24pt #1B3A6B con bordo blu e pageBreak |
| `moduloIntro(text)` | Testo introduttivo corsivo sotto il titolo modulo |
| `tocTitle()` | Titolo 'Sommario' con bordo blu sotto |
| `tocMacro(text)` | Riga sommario livello modulo |
| `tocHeading(text)` | Riga sommario livello sezione |
| `tocEntry(num, text)` | Riga sommario livello sottosezione con dot-leader |

---

## Note tecniche importanti

- Bullets: usare `LevelFormat.BULLET` con reference `'bullets'` — mai unicode bullets diretti
- Shading: usare `ShadingType.CLEAR` — mai `SOLID`
- `cantSplit: true` su tutte le righe di ogni tabella
- `keepNext: true` su h2, h3, stepTitle (il contenuto resta attaccato al titolo)
- `figImg()` scala automaticamente le immagini: se larghezza > 6123000 EMU riduce proporzionalmente
- `stepTitle` usa colore nero `#000000` — NON blu, per non confondersi con h2/h3
- Le apostrofi nei codici JS heredoc vanno gestite con escape `\'`

---

## Immagini

Tutte le immagini sono nella cartella `img/`.

| Figura | File | Dimensioni originali |
|---|---|---|
| Figura 1 | cloud-shell-powershell.png | 955×576 |
| Figura 2 | entra-domain-services.png | 850×437 |
| Figura 3 | entra-users.png | 946×398 |
| Figura 4 | entra-groups.png | 940×378 |
| Figura 12 | Figura_12_Azure_Service_Categories.jpg | 460×204 |
| Figura 13 | Figura_13_Azure_Account_Scope_Levels.jpg | 460×298 |
| Figura 14 | Figura_14_Azure_Physical_Infrastructure.jpg | 580×212 |
| Figura 15 | Figura_15_Availability_Zones_in_a_Region.jpg | 460×233 |
| Figura 16 | Figura_16_Azure_Service_Categories_for_AZ.jpg | 460×219 |
| Figura 17 | Figura_17_Azure_Region_Pairs.jpg | 460×241 |
| Figura 18 | Figura_18_Resource_Group_Rules.jpg | 460×180 |
| Figura 19 | Figura_19_Management_Group_Hierarchy.jpg | 460×277 |
| Figura 20 | Figura_20_Azure_Subscription_Boundaries.jpg | 460×204 |
| Figura 21 | cloud-governance-steps.png | 2031×278 |
| Figura 22 | azure-governance-hierarchy.png | 1459×955 |
| Figura 23 | azure-policy-arm.png | 1853×964 |
| Figura 24 | rbac-security-principal.png | 357×134 |
| Figura 25 | rbac-role-definition.png | 537×352 |
| Figura 26 | rbac-roles-hierarchy.png | 895×598 |
| Figura 27 | rbac-iam-portal.png | 1069×708 |
| Figura 28 | ip-addressing.png | 850×138 |
| Figura 29 | nsg-portal.png | 861×191 |
| Figura 30 | nsg-inbound-rules.png | 858×247 |
| Figura 31 | nsg-outbound-rules.png | 858×236 |
| Figura 32 | nsg-multiple.png | 650×478 |
| Figura 33 | nsg-effective-rules.png | 859×65 |
| Figura 34 | asg-diagram.png | 320×274 (ridimensionata da 547×468) |
| Figura 44 | route5-system-routes.png | 772×548 (da SVG 386×274, visualizzata a 550×390) |
| Figura 45 | route5-vnet-peering-udrs.png | 1014×640 (da SVG 507×320, visualizzata a 550×347) |
| Figura 46 | route5-vnet-gateway.png | 1002×530 (da SVG 501×265, visualizzata a 550×291) |
| Figura 47 | route5-bgp.png | 900×324 (da SVG 450×162, visualizzata a 550×198) |
| Figura 48 | route5-nva.png | 1250×834 (da SVG 625×417, visualizzata a 550×367) |

> **Nota**: Le tabelle generate da codice (Tabella 1-7) non hanno un file immagine — vengono costruite
> direttamente nelle funzioni `toolsTable()`, `armStructureTable()`, `reservedTable()`,
> `publicIpAssocTable()`, `publicIpSkuTable()`, `privateIpTable()`, `nsgRuleSettingsTable()` dello script JS.
