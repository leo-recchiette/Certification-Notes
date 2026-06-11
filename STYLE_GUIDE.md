# AZ-104 — Style Guide

Riferimento di stile e **convenzioni di scrittura** dei file `MODULE_*.md`, da cui
`create_az104.js` genera il documento Word `AZ-104_Note_di_Studio.docx` (Node.js + libreria `docx`).

I file `MODULE_*.md` sono l'**unica fonte di verità** del contenuto: lo script non contiene
testo, lo legge dai `.md` interpretando i marcatori descritti sotto. Per aggiornare il
documento si modifica il `.md` e si rigenera — nessuna modifica al JS.

---

## Come generare il documento

```
npm install docx                  # una tantum (crea node_modules/)
node create_az104.js              # documento completo  -> AZ-104_Note_di_Studio.docx
node create_az104.js --module 2   # un singolo modulo   -> AZ-104_Modulo_2.docx
node create_az104.js --toc        # copertina + sommario -> AZ-104_Sommario.docx
```

---

## Marcatori Markdown riconosciuti dal parser

Rispettare questi marcatori garantisce che il contenuto venga reso con lo stile corretto.

| Nel `.md` | Reso come |
|---|---|
| `# Modulo N — Titolo` (prima riga) | Titolo del modulo (il prefisso "Modulo N — " è rimosso); finisce anche nel Sommario |
| `_Testo in corsivo_` subito sotto il titolo | Introduzione del modulo (corsivo) |
| `**Immagini usate in questo modulo:**` … fino a `---` | **Ignorato** (manifest, non entra nel documento) |
| `## N.M — Titolo` | Intestazione di sezione (h2) + voce di Sommario |
| `### N.M.K — Titolo` | Intestazione di sottosezione (h3) + voce di Sommario |
| `**Titolo** _(stepTitle)_` | Titolo di step (grassetto nero) |
| Paragrafo normale | Corpo testo (`**grassetto**`, `` `codice` `` e link `[testo](url)` sono ridotti a testo semplice) |
| `- voce` oppure `* voce` | Punto elenco; con indentazione ≥ 2 spazi diventa sotto-livello |
| `1. voce` | Punto elenco con il numero mantenuto nel testo |
| `> **Etichetta**: testo` (+ riga `_(infoBox)_`) | Box informativo (etichetta in grassetto blu, bordo sinistro) |
| `![alt](img/file.png) _(dimensioni: L×A px)_` | Immagine (dimensioni di visualizzazione dal marcatore) |
| `*Didascalia* _(caption)_` subito dopo un'immagine | Didascalia della figura (centrata, corsivo) |
| `[TABELLA: nomeFunzione]` | Tabella generata da codice (vedi sotto) |
| Tabella markdown `\| a \| b \|` con riga separatore `\|---\|` | Tabella stilizzata (celle `**x**` rese in grassetto) |
| Blocco indentato di ≥ 4 spazi, oppure blocco ```` ``` ```` | Blocco di codice (Courier New, sfondo chiaro) |
| `---` | Separatore (ignorato) |
| Riga di solo marcatore, es. `_(h2: ...)_` | Ignorata (annotazione descrittiva sotto le intestazioni) |

> **Immagini**: il path nel `.md` può essere semplificato (es. `img/file.png`). Il parser
> risolve il file per **nome**, cercandolo ricorsivamente in `img/`: non serve indicare la
> sottocartella esatta.

### Tabelle generate da codice

Alcune tabelle "fisse" sono definite come funzioni JS in `create_az104.js` e richiamate dal
`.md` con `[TABELLA: nome]`: `toolsTable`, `armStructureTable`, `reservedTable`,
`publicIpAssocTable`, `publicIpSkuTable`, `privateIpTable`, `nsgRuleSettingsTable`.
Tutte le altre tabelle si scrivono direttamente in markdown nel `.md`.

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

## Margini, bordi, pagina

- **Margini**: Top/Right/Bottom/Left **1440 DXA** (1 inch / 2.54 cm)
- **Formato pagina**: A4, 11906 × 16838 DXA
- Linea sotto 'Sommario' e moduloTitle: `BorderStyle.SINGLE size 8 color #0078D4 space 4`
- infoBox: sfondo `#E8F0FB`, bordo sinistro `SINGLE size 12 color #0078D4`, indent left 360 right 360
- Tabelle: intestazione sfondo `#1F4E78` testo bianco; righe pari `#F5F8FC`, dispari `#FFFFFF`; bordi `SINGLE size 1 color #CCCCCC`; `cantSplit: true` su tutte le righe
- Tab stop sommario: `TabStopType.RIGHT position 9000 leader 'dot'` (allinea a destra il numero di pagina)

### Numeri di pagina

- **Sommario**: ogni voce (titolo modulo, `## N.M`, `### N.M.K`) riporta a destra il **numero di pagina** tramite un campo `PAGEREF` agganciato a un **segnalibro** posto sull'intestazione corrispondente (`bkm<modulo>_<n>`). Lo stile del numero (Calibri 10pt grigio) deriva dal `docDefaults` del documento, perché il campo `PAGEREF` è "nudo" (un `TextRun` che lo avvolge produrrebbe XML non valido con run annidati).
- **Pie' di pagina**: il documento è diviso in **due sezioni** — (1) copertina + sommario **senza** numero di pagina, (2) contenuto dei moduli con campo `PAGE` centrato nel footer e numerazione che **riparte da 1**. Lo stacco tra le due sezioni sostituisce il `pageBreakBefore` del primo titolo-modulo (gli altri moduli sono separati da un `PageBreak` esplicito) per evitare una pagina bianca.
- **Aggiornamento**: i numeri sono **campi calcolati da Word**, non valori fissi (la libreria `docx` non impagina). Il documento ha `features.updateFields = true`, quindi Word aggiorna Sommario e numeri all'apertura (potrebbe chiedere conferma con "Aggiornare i campi?"). In stampa/anteprima senza aggiornamento i numeri possono apparire vuoti finché non si preme `F9`.

---

## Helper di resa (interni a `create_az104.js`)

Non si chiamano a mano: il parser li invoca in base ai marcatori. Riferimento:

| Funzione | Descrizione |
|---|---|
| `body(text)` | Paragrafo corpo testo, Calibri 11pt #333333 |
| `h2(text)` / `h3(text)` | Intestazioni sezione / sottosezione (grassetto, keepNext) |
| `stepTitle(text)` | Titolo di step, Calibri 11pt nero grassetto keepNext |
| `bullet(text, level)` | Punto elenco (level 0 = normale, 1 = indentato) |
| `caption(text)` | Didascalia, 9pt corsivo grigio centrato |
| `codeBlock(lines)` | Blocco codice, Courier New 9pt sfondo #EEF3F8 |
| `infoBox(label, text)` | Box con bordo sinistro blu |
| `figImg(data, ext, w, h, label)` | Immagine scalata a max ~6.5 inch + didascalia opzionale |
| `makeTable(headers, rows, widths)` | Tabella stilizzata con header #1F4E78 |
| `moduloTitle(text)` / `moduloIntro(text)` | Titolo macro-modulo (pageBreak) e intro corsiva |
| `tocTitle/tocMacro/tocHeading/tocEntry` | Righe del Sommario (auto-generato) |

---

## Immagini

Le immagini risiedono in `img/` (anche in sottocartelle: il parser le risolve per nome).
Le **dimensioni di visualizzazione** sono prese dal marcatore `_(dimensioni: L×A px)_` nel
`.md`; `figImg()` riduce proporzionalmente se la larghezza supera ~6.5 inch.

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
| Figura 21 | microsoft-caf-for-azure.png | 2058×964 |
| Figura 22 | cloud-governance-steps.png | 2031×278 |
| Figura 23 | cloud-governance.png | 2220×1022 |
| Figura 24 | azure-governance-hierarchy.png | 1459×955 |
| Figura 25 | azure-policy-arm.png | 1853×964 |
| Figura 26 | operation-flows.png | 1996×978 |
| Figura 27 | policy-resources.png | 2070×984 |
| Figura 28 | safe-deployment.png | 2026×848 |
| Figura 29 | reacting-to-policy-changes.png | 1312×1104 |
| Figura 30 | rbac-security-principal.png | 357×134 |
| Figura 31 | rbac-role-definition.png | 537×352 |
| Figura 32 | rbac-roles-hierarchy.png | 895×598 |
| Figura 33 | rbac-iam-portal.png | 1069×708 |
| Figura 34 | 3-enable-sspr.png | 1327×450 |
| Figura 35 | 3-auth-methods.png | 1327×858 |
| Figura 36 | 3-registration-options.png | 1872×629 |
| Figura 37 | 3-notification-settings.png | 995×489 |
| Figura 38 | 3-customization-settings.png | 1324×445 |
| Figura 28 (M3) | ip-addressing.png | 850×138 |
| Figura 29 (M3) | nsg-portal.png | 861×191 |
| Figura 30 (M3) | nsg-inbound-rules.png | 858×247 |
| Figura 31 (M3) | nsg-outbound-rules.png | 858×236 |
| Figura 32 (M3) | nsg-multiple.png | 650×478 |
| Figura 33 (M3) | nsg-effective-rules.png | 859×65 |
| Figura 34 (M3) | asg-diagram.png | 547×468 |
| Figura 35–39 (M3) | 3-create-dns-zone / 3-name-server / 3-create-private-dns-zone / 3-virtual-network-link-option / 3-add-virtual-network-link | varie |
| Figura 40–61 (M3) | vnet-peering-* / route5-* / lb-* / app-gateway / network-watcher | varie (vedi i `.md`) |
| Figura 62–87 (M4) | storage-* / blob-* / *-redundant-storage / file-* / *-explorer ecc. | varie (vedi il manifest in `MODULE_4.md`) |
| Figura 88–110 (M5) | 3-create-new-resource / *-scaling / *-scale-sets / autoscale / deployment-* / container-* ecc. | varie (vedi il manifest in `MODULE_5.md`) |
| Figura 111–147 (M6) | architecture-on-premises-mars / azure-backup-* / backup-* / *-restore-* / *-vm-* / create-dcr-* ecc. | varie (vedi il manifest in `MODULE_6.md`) |

> **Nota**: la numerazione delle figure è gestita nelle didascalie dentro i `MODULE_*.md`.
> Modulo 2 e Modulo 3 hanno serie di numeri parzialmente sovrapposte (eredità storica);
> dal Modulo 3 in poi la numerazione è continua: M3 termina a 61, M4 va 62–87, M5 va 88–110, M6 va 111–147.

---

## Note tecniche

- Bullets: `LevelFormat.BULLET` con reference `'bullets'` (livelli • e ◦) — mai unicode diretti nel testo
- Shading: `ShadingType.CLEAR` (mai `SOLID`)
- `cantSplit: true` su tutte le righe di tabella; `keepNext: true` su h2/h3/stepTitle
- `figImg()` scala automaticamente se la larghezza supera 6123000 EMU (~6.5 inch)
- `stepTitle` usa nero `#000000` (non blu) per distinguersi da h2/h3
- Il parser rimuove un eventuale **BOM UTF-8** in testa ai `.md` (un BOM rompe il riconoscimento del titolo `#`)
- Salvare i `MODULE_*.md` in **UTF-8 senza BOM**
