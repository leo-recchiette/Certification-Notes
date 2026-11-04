# Style Guide — convenzioni di scrittura dei `.md`

Riferimento unico per **tutte** le certificazioni del repo. Descrive i marcatori che il
parser riconosce e gli stili con cui li rende il motore condiviso
[`packages/doc-engine`](../packages/doc-engine).

I file `chapters/MODULE_*.md` sono l'**unica fonte di verità** del contenuto: il motore non
contiene testo, lo legge dai `.md` interpretando i marcatori qui sotto. Per aggiornare un
documento si modifica il `.md` e si rigenera — nessuna modifica al JS.

Quel che cambia da una certificazione all'altra (palette, copertina, elenco dei moduli, nomi
dei file prodotti) sta nella sua `script/config.js`; i valori condivisi stanno in
[`packages/doc-engine/theme.js`](../packages/doc-engine/theme.js).

---

## Come generare i documenti

Vedi il [README](../README.md). In breve, dalla radice del repo: `npm run build:az104`,
`npm run build:ta004`, `npm run build:ta004:pocket`; `--help` su un generatore elenca tutte
le opzioni.

---

## Marcatori Markdown riconosciuti dal parser

Rispettare questi marcatori garantisce che il contenuto venga reso con lo stile corretto.

| Nel `.md` | Reso come |
|---|---|
| `# Titolo` (prima riga) | Titolo del modulo; finisce anche nel Sommario. Un prefisso `Modulo N — ` viene rimosso dal testo mostrato |
| `_Testo in corsivo_` subito sotto il titolo | Introduzione del modulo (corsivo, giustificata) |
| `**Immagini usate in questo modulo:**` … fino a `---` | **Ignorato** (manifest, non entra nel documento) |
| `## Titolo` | Intestazione di sezione (h2) + voce di Sommario |
| `### Titolo` | Intestazione di sottosezione (h3) + voce di Sommario |
| `**Titolo** _(stepTitle)_` | Titolo di step (grassetto nero) |
| Paragrafo normale | Corpo testo. `**grassetto**`, `*corsivo*`, `` `codice` `` e `[testo](url)` sono ridotti a testo semplice; gli asterischi dentro il codice inline, come in `` `*.auto.tfvars` ``, restano intatti |
| Paragrafo che inizia con `**Etichetta**` | L'etichetta resta in grassetto, il resto normale (usato per i quiz) |
| `- voce` oppure `* voce` | Punto elenco; con indentazione ≥ 2 spazi diventa sotto-livello |
| `1. voce` | Punto elenco con il numero mantenuto nel testo |
| `- testo [link](https://…)` | Nei punti elenco i link `http(s)` restano **cliccabili** nel `.docx` e nel `.pdf` |
| `> **Etichetta**: testo` (+ riga `_(infoBox)_`) | Box informativo (etichetta in grassetto, bordo sinistro colorato) |
| `![](img/file.png) _(dimensioni: L×A px)_` | Immagine (dimensioni di visualizzazione dal marcatore) |
| `*Didascalia* _(caption)_` subito dopo un'immagine o una tabella | Didascalia, **numerata dal motore** (vedi sotto) |
| `[TABELLA: nomeFunzione]` | Tabella generata da codice (vedi sotto) |
| Tabella markdown `\| a \| b \|` con riga separatore `\|---\|` | Tabella stilizzata (celle `**x**` rese in grassetto) |
| Blocco indentato di ≥ 4 spazi, oppure blocco ```` ``` ```` | Blocco di codice (Courier New, sfondo chiaro) |
| `---` | Separatore (ignorato) |
| Riga di solo marcatore, es. `_(h2: ...)_` | Ignorata (annotazione descrittiva) |

> **Immagini**: il path nel `.md` può essere semplificato (es. `img/file.png`). Il parser
> risolve il file per **nome**, cercandolo ricorsivamente nella `img/` di quella
> certificazione: non serve indicare la sottocartella esatta, ma il nome del file deve
> essere **univoco all'interno della certificazione**. Gli `.svg` non sono supportati dalla
> libreria `docx`: il motore avvisa se ne incontra uno.

### Il livello delle intestazioni dipende dal numero di `#`, non dalla numerazione

`#` → livello 0, `##` → 1, `###` → 2. La forma `## N.M — Titolo` usata nei moduli è una
**convenzione editoriale**, non un contratto del parser: è per questo che la pocket guide di
TA-004, che usa titoli liberi, si genera con lo stesso parser senza modifiche.

Il parser è **fence-aware**: una riga che inizia con `#` dentro un blocco di codice resta
codice e non diventa un'intestazione (nei `.md` ce ne sono circa 140, commenti HCL e bash).

### Didascalie: il numero lo mette il motore

**Non scrivere i numeri di figura e tabella nei `.md`.** Il motore numera figure e tabelle in
ordine di documento, con due contatori distinti che attraversano i moduli, e produce
`Figura N — didascalia` / `Tabella N — didascalia`. Un numero scritto a mano viene
riconosciuto e **sovrascritto**, quindi non rompe nulla, ma è inutile e fuorviante.

Conseguenze pratiche:

- inserire una figura in mezzo a un modulo **non** richiede di rinumerare quelle successive;
- anche `--module N` produce i numeri del documento completo, perché il motore parsifica
  comunque tutti i sorgenti nell'ordine giusto;
- una figura o una tabella **senza** didascalia non consuma un numero;
- **la prosa non cita i numeri di figura** ("come mostrato nella figura precedente", non
  "in Figura 124"): i numeri cambiano appena si inserisce una figura. Verificabile con
  `grep -rnE '(Figura|Tabella) [0-9]+' docs/*/*/chapters` → zero righe.

### Tabelle generate da codice

Il meccanismo `[TABELLA: nomeFunzione]` serve alle poche tabelle che non si possono esprimere
in Markdown. Le funzioni stanno nel `script/tables.js` della certificazione e sono passate al
motore come registry da `script/config.js`; ricevono il contesto di resa iniettato
(`({ makeTable }) => makeTable(headers, rows)`) e non importano nulla.

- **AZ-104**: 7 tabelle — `toolsTable`, `armStructureTable`, `reservedTable`,
  `publicIpAssocTable`, `publicIpSkuTable`, `privateIpTable`, `nsgRuleSettingsTable`.
- **TA-004**: nessuna (`tables: {}`): ogni tabella è Markdown inline.

Tutto il resto va scritto come normale tabella Markdown.

---

## Font e colori

Font: **Calibri** per tutto, **Courier New** per i blocchi di codice.

| Elemento | Dimensione | Colore |
|---|---|---|
| Default corpo | 11pt (22 half-pt) | `bodyText` |
| Titolo copertina | 48pt (96) grassetto | `titleBlue` |
| Sottotitolo copertina | 26pt (52) grassetto | `sectionBlue` |
| Descrizione copertina | 13pt (26) corsivo | `subtle` |
| moduloTitle | 24pt (48) grassetto | `titleBlue` |
| h2 | 14pt (28) grassetto, keepNext | `sectionBlue` |
| h3 | 12pt (24) grassetto, keepNext | `tocEntry` |
| stepTitle | 11pt (22) grassetto, keepNext | nero `#000000` |
| bullet | 11pt (22) | `bodyText` |
| codeBlock | 9pt (18), sfondo `codeBg` | `codeText` |
| caption | 8pt (16) corsivo centrato | `caption` |
| cella di tabella | 9pt (18) | `bodyText` (bianco nell'intestazione) |
| infoBox etichetta | 11pt grassetto | `sectionBlue` |
| titolo 'Sommario' | 18pt (36) grassetto | `titleBlue` |
| voci Sommario TOC1 / TOC2 / TOC3 | 12pt / 11pt / 10pt | `titleBlue` / `sectionBlue` / `tocEntry` |
| numero di pagina nel pie' | 9pt (18) | `caption` |

I nomi dei colori sono le chiavi della palette. Le 5 comuni a tutte le certificazioni stanno
in `theme.js`: `bodyText #333333`, `subtle #555555`, `caption #888888`, `white #FFFFFF`,
`border #CCCCCC`. Le 8 di brand stanno nella `script/config.js` di ciascuna:

| Chiave | AZ-104 (blu Azure) | TA-004 (viola HashiCorp) |
|---|---|---|
| `titleBlue` | `#1B3A6B` | `#2E1A59` |
| `sectionBlue` | `#0078D4` | `#7B42BC` |
| `tocEntry` | `#2D5F8A` | `#5C4EE5` |
| `headerBg` | `#1F4E78` | `#4A2A85` |
| `rowEven` | `#F5F8FC` | `#F7F3FC` |
| `infoBoxBg` | `#E8F0FB` | `#F1E9FB` |
| `codeBg` | `#EEF3F8` | `#F3EFF8` |
| `codeText` | `#1B3A6B` | `#2E1A59` |

---

## Margini, bordi, pagina

- **Formato pagina**: A4, 11906 × 16838 twip.
- **Margini**: superiore e inferiore **1008** twip (0,7"), laterali **1080**. I margini
  ridotti danno più altezza utile, così le figure entrano più spesso in fondo pagina.
- **Geometria derivata**, da non scrivere a mano: la colonna di testo (**9746**), la
  larghezza delle tabelle (**9600**) e il tab stop del Sommario (**9700**) si calcolano dal
  margine laterale in `theme.js`. Sono tre valori che devono muoversi insieme.
- Linea sotto 'Sommario' e moduloTitle: `BorderStyle.SINGLE size 8 color sectionBlue space 4`.
- infoBox: sfondo `infoBoxBg`, bordo sinistro `SINGLE size 12 color sectionBlue`, indent
  left/right 360.
- Blocchi di codice: indent left/right 240, sfondo `codeBg`. Un blocco di più di **15** righe
  può spezzarsi fra due pagine, invece di essere spinto intero a pagina nuova lasciando un
  buco in quella precedente.
- Figure: scalate proporzionalmente per restare entro **560 × 340 px** di visualizzazione.
- Tabelle: intestazione sfondo `headerBg` con testo bianco, righe pari `rowEven` e dispari
  bianche, bordi `SINGLE size 1 color border`, `cantSplit: true` su tutte le righe.
- **Larghezza delle colonne**: calcolata dal contenuto da `tableWidths()`, come il layout
  automatico delle tabelle HTML — ogni colonna riceve almeno la sua parola più lunga, lo
  spazio che avanza va alle colonne con più testo — e applicata con layout fisso, così Word
  non spezza le parole. I percorsi `a/b/c` possono andare a capo.
- Una tabella resta unita su una pagina, salvo quando `estTableHeight()` la stima più alta di
  una pagina: in quel caso solo l'intestazione resta agganciata alla prima riga, e la tabella
  non lascia una pagina quasi vuota prima di sé.

### Numeri di pagina e Sommario

- **Sommario**: è un **campo TOC nativo di Word** (`TableOfContents`, istruzione
  `TOC \h \o "1-3" \u`). Le intestazioni portano un **livello di struttura**
  (`outlineLevel` 0/1/2) e Word genera voci, numeri di pagina, dot leader e hyperlink;
  l'aspetto deriva dagli stili `TOC1`/`TOC2`/`TOC3` definiti nel documento. **Mai mantenerlo
  a mano.** NB: i campi `PAGEREF` manuali **non** sono un'alternativa, perché la classe
  `Bookmark` di `docx` assegna a tutti i segnalibri lo stesso `w:id` → Word risolve ogni
  `PAGEREF` a "pagina 1".
- **Pie' di pagina**: il documento è in **due sezioni** — (1) copertina + Sommario **senza**
  numero di pagina, (2) contenuto dei moduli con campo `PAGE` centrato e numerazione che
  **riparte da 1**. Lo stacco fra le due sezioni evita una pagina bianca prima del primo
  modulo; gli altri moduli sono separati da un `PageBreak` esplicito.
- **Aggiornamento**: i numeri sono **campi calcolati da Word** (la libreria `docx` non
  impagina). Il documento ha `features.updateFields = true`, quindi Word aggiorna il Sommario
  all'apertura; se appare vuoto, `Ctrl+A` poi `F9`. L'export PDF via Word aggiorna i campi
  prima di esportare, quello via LibreOffice no.

---

## Note tecniche

- Punti elenco: `LevelFormat.BULLET` con reference `'bullets'` (livelli • e ◦) — mai caratteri
  unicode diretti nel testo.
- Sfondi: `ShadingType.CLEAR` (mai `SOLID`).
- `keepNext` su h2/h3/stepTitle e sulle righe di tabella non finali; `cantSplit` su tutte le
  righe di tabella. Il "collante" di impaginazione è intenzionale: tiene la frase introduttiva
  attaccata al blocco che segue e la didascalia attaccata alla sua figura o tabella. Le
  immagini di proposito **non** si incollano al paragrafo precedente, altrimenti una figura
  alta trascinerebbe giù del testo che starebbe nella pagina prima.
- `stepTitle` usa nero `#000000` (non il colore di sezione) per distinguersi da h2/h3.
- Corpo testo, punti elenco, infoBox e introduzione dei moduli sono **giustificati**; titoli,
  didascalie, codice e tabelle no.
- Salvare i `.md` in **UTF-8 senza BOM**: un BOM rompe il riconoscimento del titolo `#`. Il
  parser ne rimuove uno in testa per sicurezza, ma lo segnala con un avviso.
