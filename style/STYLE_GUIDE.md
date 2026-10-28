# Terraform Associate (004) — Style Guide

Riferimento di stile e **convenzioni di scrittura** dei file `MODULE_*.md`, da cui
`create_ta004.js` genera il documento Word `TA-004_Note_di_Studio.docx` (Node.js + libreria `docx`).

I file `MODULE_*.md` sono l'**unica fonte di verità** del contenuto: lo script non contiene
testo, lo legge dai `.md` interpretando i marcatori descritti sotto. Per aggiornare il
documento si modifica il `.md` e si rigenera — nessuna modifica al JS.

---

## Come generare il documento

```
npm install docx                  # una tantum (crea node_modules/)
node create_ta004.js              # documento completo  -> TA-004_Note_di_Studio.docx
node create_ta004.js --module 2   # un singolo modulo   -> TA-004_Modulo_2.docx
node create_ta004.js --toc        # copertina + sommario -> TA-004_Sommario.docx
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
| Paragrafo normale | Corpo testo (`**grassetto**`, `*corsivo*`, `` `codice` `` e link `[testo](url)` sono ridotti a testo semplice; gli asterischi dentro il codice inline, come in `` `*.auto.tfvars` ``, restano intatti) |
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

Il meccanismo `[TABELLA: nomeFunzione]` esiste ancora (registro `TABLE_FUNCS` in `create_ta004.js`) ma è vuoto: tutte le tabelle di questo repo sono tabelle Markdown inline.

---

## Font e colori

| Elemento | Font | Dimensione | Colore |
|---|---|---|---|
| Default corpo | Calibri | 11pt (22 half-pt) | #333333 |
| Titolo copertina | Calibri | 48pt (96 half-pt) grassetto | #2E1A59 |
| Sottotitolo copertina | Calibri | 26pt (52 half-pt) grassetto | #7B42BC |
| Descrizione copertina | Calibri | 13pt (26 half-pt) corsivo | #555555 |
| moduloTitle | Calibri | 24pt (48 half-pt) grassetto | #2E1A59 |
| h2 | Calibri | 14pt (28 half-pt) grassetto keepNext | #7B42BC |
| h3 | Calibri | 12pt (24 half-pt) grassetto keepNext | #5C4EE5 |
| stepTitle | Calibri | 11pt (22 half-pt) grassetto nero keepNext | #000000 |
| bullet | Calibri | 11pt (22 half-pt) | #333333 |
| codeBlock | Courier New | 9pt (18 half-pt) sfondo #F3EFF8 | #2E1A59 |
| caption | Calibri | 9pt (18 half-pt) corsivo centrato | #888888 |
| infoBox label | Calibri | 11pt grassetto | #7B42BC |
| infoBox testo | Calibri | 11pt | #333333 |
| tocMacro | Calibri | 12pt (24 half-pt) grassetto | #2E1A59 |
| tocHeading | Calibri | 11pt (22 half-pt) grassetto | #7B42BC |
| tocEntry | Calibri | 10pt (20 half-pt) | #5C4EE5 |
| tocEntry numero pagina | Calibri | 10pt (20 half-pt) | #888888 |

## Margini, bordi, pagina

- **Margini**: Top/Right/Bottom/Left **1440 DXA** (1 inch / 2.54 cm)
- **Formato pagina**: A4, 11906 × 16838 DXA
- Linea sotto 'Sommario' e moduloTitle: `BorderStyle.SINGLE size 8 color #7B42BC space 4`
- infoBox: sfondo `#F1E9FB`, bordo sinistro `SINGLE size 12 color #7B42BC`, indent left 360 right 360
- Tabelle: intestazione sfondo `#4A2A85` testo bianco; righe pari `#F7F3FC`, dispari `#FFFFFF`; bordi `SINGLE size 1 color #CCCCCC`; `cantSplit: true` su tutte le righe
- Larghezza delle colonne: calcolata dal contenuto da `tableWidths()` (come il layout automatico delle tabelle HTML: ogni colonna riceve almeno la sua parola più lunga, lo spazio che avanza va alle colonne con più testo) e applicata con layout fisso, così Word non spezza le parole; i percorsi `a/b/c` possono andare a capo
- Una tabella resta unita su una pagina, salvo quando `estTableHeight()` la stima più alta di una pagina: in quel caso solo l'intestazione resta agganciata alla prima riga, e la tabella non lascia una pagina quasi vuota prima di sé
- Tab stop sommario: `TabStopType.RIGHT position 9000 leader 'dot'` (allinea a destra il numero di pagina)

### Numeri di pagina

- **Sommario**: è un **campo TOC nativo di Word** (`TableOfContents`, istruzione `TOC \o "1-3" \u \h`). Le intestazioni sono marcate con un **livello di struttura** (`outlineLevel` 0/1/2 su titolo modulo / `## N.M` / `### N.M.K`) e Word genera automaticamente le voci, i **numeri di pagina**, i dot leader e gli hyperlink. L'aspetto delle voci deriva dagli stili `TOC1`/`TOC2`/`TOC3` definiti nel documento (palette viola coerente). NB: l'approccio con campi `PAGEREF` manuali NON funziona, perché la classe high-level `Bookmark` di docx assegna a tutti i segnalibri lo stesso `w:id` → Word risolve ogni `PAGEREF` a "pagina 1".
- **Pie' di pagina**: il documento è diviso in **due sezioni** — (1) copertina + sommario **senza** numero di pagina, (2) contenuto dei moduli con campo `PAGE` centrato nel footer e numerazione che **riparte da 1**. Lo stacco tra le due sezioni sostituisce il `pageBreakBefore` del primo titolo-modulo (gli altri moduli sono separati da un `PageBreak` esplicito) per evitare una pagina bianca.
- **Aggiornamento**: i numeri sono **campi calcolati da Word** (la libreria `docx` non impagina). Il documento ha `features.updateFields = true`: Word aggiorna il Sommario all'apertura. Se il Sommario appare vuoto o con un segnaposto, clic destro su di esso → **Aggiorna campo** → "Aggiorna intero sommario" (oppure `Ctrl+A` poi `F9`).

---

## Helper di resa (interni a `create_ta004.js`)

Non si chiamano a mano: il parser li invoca in base ai marcatori. Riferimento:

| Funzione | Descrizione |
|---|---|
| `body(text)` | Paragrafo corpo testo, Calibri 11pt #333333 |
| `h2(text)` / `h3(text)` | Intestazioni sezione / sottosezione (grassetto, keepNext) |
| `stepTitle(text)` | Titolo di step, Calibri 11pt nero grassetto keepNext |
| `bullet(text, level)` | Punto elenco (level 0 = normale, 1 = indentato) |
| `caption(text)` | Didascalia, 9pt corsivo grigio centrato |
| `codeBlock(lines)` | Blocco codice, Courier New 9pt sfondo #F3EFF8 |
| `infoBox(label, text)` | Box con bordo sinistro blu |
| `figImg(data, ext, w, h, label)` | Immagine scalata a max ~6.5 inch + didascalia opzionale |
| `makeTable(headers, rows, widths)` | Tabella stilizzata con header #4A2A85 |
| `moduloTitle(text)` / `moduloIntro(text)` | Titolo macro-modulo (pageBreak) e intro corsiva |
| `tocTitle/tocMacro/tocHeading/tocEntry` | Righe del Sommario (auto-generato) |

---

## Immagini

Le immagini risiedono in `img/` (una sottocartella per modulo, es. `img/Module 4 - Configurazione/`) e si risolvono per **nome file**, che deve essere univoco. Dimensioni dal marcatore `_(dimensioni: L×A px)_`.

Le figure provengono da HashiCorp Developer (didascalia con "Fonte: HashiCorp Developer") e sono numerate in modo continuo nelle didascalie: M1 1–3, M2 4, M3 5–10, M4 11–13, M5 14, M7 15–16, M8 17–30 (il Modulo 6 non ha figure).

---

## Note tecniche

- Bullets: `LevelFormat.BULLET` con reference `'bullets'` (livelli • e ◦) — mai unicode diretti nel testo
- Shading: `ShadingType.CLEAR` (mai `SOLID`)
- `cantSplit: true` su tutte le righe di tabella; `keepNext: true` su h2/h3/stepTitle
- `figImg()` scala automaticamente se la larghezza supera 6123000 EMU (~6.5 inch)
- `stepTitle` usa nero `#000000` (non blu) per distinguersi da h2/h3
- Corpo testo, punti elenco, infoBox e introduzione dei moduli sono giustificati (`AlignmentType.JUSTIFIED`); titoli, didascalie, codice e tabelle no
- Il parser rimuove un eventuale **BOM UTF-8** in testa ai `.md` (un BOM rompe il riconoscimento del titolo `#`)
- Salvare i `MODULE_*.md` in **UTF-8 senza BOM**
