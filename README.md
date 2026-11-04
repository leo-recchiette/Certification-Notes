# Certification Notes

Note di studio per certificazioni IT, scritte in **italiano** e generate in formato Word (`.docx`) con esportazione automatica in **PDF**.

Ogni certificazione vive in una propria cartella sotto `docs/<provider>/<certificazione>/` e contiene solo i contenuti: i `.md`, le immagini e un file di configurazione. Tutta la logica di generazione sta in un **motore condiviso** ([`packages/doc-engine`](packages/doc-engine)). Questo README è l'unica documentazione del progetto e copre tutte le certificazioni.

In tutte le certificazioni il contenuto risiede nei file `chapters/MODULE_*.md` (**unica fonte di verità**): il motore li legge e produce il documento. Per aggiornare un documento si modifica il `.md` e si rigenera — non serve toccare il codice JS, che va modificato solo per cambiare stili, marcatori o logica di parsing (vedi la [guida di stile](docs/STYLE_GUIDE.md)).

---

## Certificazioni

| Certificazione | Provider | Contenuto | Cartella | Build |
|---|---|---|---|---|
| [AZ-104 — Azure Administrator](#az-104--azure-administrator-microsoft) | Microsoft | 6 moduli | `docs/microsoft/AZ-104/` | `npm run build:az104` |
| [Terraform Associate (004)](#terraform-associate-004-hashicorp) | HashiCorp | 8 moduli + pocket guide (10 capitoli) | `docs/hashicorp/TA-004/` | `npm run build:ta004` |

---

## Struttura del repository

```
Certification-Notes/
├── packages/
│   └── doc-engine/            ← il motore condiviso (tutta la logica)
│       ├── index.js           ← build(config): parse → assembla → .docx → .pdf
│       ├── theme.js           ← stili comuni; geometria derivata da un solo valore
│       ├── inline.js          ← markup inline (marcatori, grassetto, corsivo, link)
│       ├── images.js          ← indice delle immagini per nome file, per certificazione
│       ├── render.js          ← gli helper di resa (paragrafi, tabelle, figure, copertina)
│       ├── parser.js          ← la macchina a stati che legge i .md
│       ├── document.js        ← campo TOC, sezioni, stili, numerazione
│       ├── pdf.js             ← .docx → .pdf (Word via COM, altrimenti LibreOffice)
│       ├── cli.js             ← opzioni da riga di comando, dedotte dalla configurazione
│       └── bin/inspect-docx.js ← ispettore .docx per verificare le modifiche
├── docs/
│   ├── STYLE_GUIDE.md         ← marcatori Markdown + tutti gli stili (per tutte le cert.)
│   ├── COVER_TOC.md           ← come nascono copertina e Sommario
│   ├── microsoft/
│   │   └── AZ-104/
│   │       ├── chapters/      ← contenuto: MODULE_1..6.md (fonte di verità)
│   │       ├── img/           ← figure, in sottocartelle per modulo
│   │       ├── script/        ← config.js + tables.js + entry point
│   │       └── CLAUDE.md
│   └── hashicorp/
│       └── TA-004/
│           ├── chapters/      ← MODULE_1..8.md
│           ├── img/
│           ├── pocketguide/   ← variante sintetica (10 capitoli)
│           ├── script/        ← config.js + entry point
│           └── CLAUDE.md
├── package.json               ← dipendenza condivisa, workspace, script di build
├── .gitignore
├── .gitattributes
├── README.md                  ← questo file (documentazione di tutte le certificazioni)
└── CLAUDE.md                  ← guida per Claude Code a livello di monorepo
```

---

## Il motore condiviso

I due generatori erano lo stesso programma duplicato: 560 righe su 709 identiche, l'export PDF uguale byte per byte. Ora c'è un solo motore, e di ciascuna certificazione resta solo ciò che la distingue davvero.

Il motore è un **npm workspace** (`@certification-notes/doc-engine`), quindi i generatori lo risolvono risalendo al `node_modules/` di radice, esattamente come fanno con `docx`: funziona a qualunque profondità di annidamento. Serve `npm install` dalla radice; senza, l'entry point stampa un messaggio chiaro invece di un errore oscuro.

**Cosa sta nella certificazione** — `script/config.js`, una quarantina di righe:

| Voce | Cosa contiene |
|---|---|
| `id`, `banner` | il codice della certificazione e l'etichetta nei log |
| `root` | la radice della certificazione: **l'unico punto in cui si calcola** |
| `palette` | le 8 chiavi di colore di brand (le altre 5 sono comuni) |
| `cover` | titolo, sottotitolo, descrizione, logo opzionale |
| `tables` | le tabelle generate da codice (vuoto se non ce ne sono) |
| `deliverables` | i documenti producibili: sorgenti, nomi dei file, opzioni ammesse |

L'entry point è di una quindicina di righe e non fa altro che `build(require('./config'))`.

`root` è il punto delicato: il motore **non** lo calcola mai (lì `__dirname` sarebbe la cartella del motore), lo calcola `script/config.js` con `path.resolve(__dirname, '..')` e il motore lo valida. Da `root` derivano `chapters/`, `img/`, `pocketguide/` e i file prodotti: per questo i generatori funzionano da qualunque directory e i documenti finiscono sempre nella cartella della certificazione.

### Varianti di un documento

Una variante — la pocket guide di TA-004, o un eventuale quaderno di quiz — **non** è una nuova certificazione: è una voce in più in `deliverables`, che dichiara dove sono i sorgenti, come si chiama l'output e cosa cambia in copertina. Le opzioni ammesse si deducono da quello che la voce dichiara: la pocket guide non ha un sommario proprio né moduli numerati, quindi `--toc` e `--module` vengono rifiutati con un messaggio chiaro. Vedi `deliverables.pocket` in [docs/hashicorp/TA-004/script/config.js](docs/hashicorp/TA-004/script/config.js).

### Numerazione automatica di figure e tabelle

Figure e tabelle sono numerate dal motore, in ordine di documento, con due contatori che attraversano i moduli. **Nei `.md` non si scrivono numeri**: un numero scritto a mano viene riconosciuto e sovrascritto.

- Inserire una figura in mezzo a un modulo non richiede di rinumerare quelle successive.
- Anche `--module N` produce i numeri del documento completo.
- La prosa non cita i numeri di figura ("come mostrato nella figura precedente", non "in Figura 124"): cambierebbero al primo inserimento.

---

## Prerequisiti

- [Node.js](https://nodejs.org/) v18 o superiore
- Dipendenze npm, installate **una volta sola dalla radice del repository** (`npm install`): la dipendenza `docx` e il motore condiviso sono comuni a tutti i generatori
- Per l'**esportazione in PDF** (automatica dopo il `.docx`): **Microsoft Word** (Windows, usato via automazione COM) oppure **LibreOffice**. Senza nessuno dei due il `.docx` viene prodotto comunque e viene solo stampato un avviso.

> **Node portable (alternativa all'installazione di sistema)**
> Invece di un'installazione classica, si può usare una versione **portable** di Node
> (archivio `.zip` scaricabile da [nodejs.org](https://nodejs.org/), senza installer). Dopo averla
> estratta, **aggiungere al `PATH`** la cartella che contiene `node.exe` e `npm.cmd`: in questo modo
> `node` e `npm` sono richiamabili direttamente da qualsiasi cartella e i comandi qui sotto funzionano
> senza dover indicare il percorso completo dell'eseguibile.
>
> Esempio di percorso usato su una delle macchine di sviluppo:
> `C:\Users\<utente>\AppData\Local\node-portable\node-v24.16.0-win-x64\`

---

## Come generare i documenti

```bash
npm install                  # una volta sola, dalla radice del repo

npm run build:az104          # AZ-104  → docs/microsoft/AZ-104/AZ-104_Note_di_Studio.docx + .pdf
npm run build:az104:toc      # AZ-104  → solo copertina + sommario
npm run build:ta004          # TA-004  → docs/hashicorp/TA-004/TA-004_Note_di_Studio.docx + .pdf
npm run build:ta004:toc      # TA-004  → solo copertina + sommario
npm run build:ta004:pocket   # TA-004  → docs/hashicorp/TA-004/TA-004_Pocket_Guide.docx + .pdf
```

Per le opzioni non coperte dagli script di `package.json` si invoca direttamente il generatore (i percorsi sono risolti rispetto alla cartella della certificazione, quindi si può lanciare da qualunque directory):

```bash
node docs/microsoft/AZ-104/script/create_az104.js --module 3   # un singolo modulo (1-6)
node docs/hashicorp/TA-004/script/create_ta004.js --module 4   # un singolo modulo (1-8)
node <generatore> --no-pdf                                     # salta l'export PDF
node <generatore> --help                                       # tutte le opzioni disponibili
```

`--help` elenca le opzioni ricavandole dalla configurazione, quindi è sempre aggiornato. Le opzioni sconosciute e le combinazioni incompatibili danno errore invece di essere ignorate in silenzio.

I `.docx`/`.pdf` vengono scritti nella cartella della certificazione e sono artefatti di build ignorati da Git.

### Esportazione in PDF

Dopo aver generato il `.docx`, il motore esporta **automaticamente** anche un `.pdf` con lo stesso nome (es. `AZ-104_Note_di_Studio.pdf`), in tutte le modalità. La conversione usa, in ordine di preferenza:

1. **Microsoft Word** (via automazione COM, solo Windows): apre il documento, **aggiorna il Sommario e i numeri di pagina** e lo esporta in PDF. È il motore preferito perché il PDF risulta già impaginato correttamente — l'indice riporta i numeri di pagina giusti, senza dover premere `F9` come accade aprendo il `.docx`. Funziona solo in una sessione interattiva (non headless, non come servizio).
2. **LibreOffice** (`soffice --headless`, multipiattaforma): fallback se Word non è installato. In tal caso i numeri di pagina del Sommario potrebbero non essere aggiornati (in alternativa apri il `.docx` in Word, premi `F9` e ri-esporta).

Se non è disponibile né Word né LibreOffice, il `.docx` viene comunque creato e si riceve solo un avviso. Per saltare del tutto la conversione usa `--no-pdf`.

### Verificare una modifica al motore

Non ci sono test automatici: la verifica consiste nel **rigenerare e confrontare**. Due `.docx` non si confrontano byte per byte né per md5 (la libreria `docx` genera gli id delle relazioni in modo casuale e lo zip porta i timestamp, quindi due esecuzioni dello stesso codice danno file diversi). Si confronta il contenuto estratto:

```bash
npm run inspect:docx -- docs/hashicorp/TA-004/TA-004_Note_di_Studio.docx
```

Produce quattro file di testo: `counts` (paragrafi, tabelle, immagini, livelli di struttura), `spine` (la sequenza delle intestazioni), `text` (un paragrafo per riga, senza formattazione) e `captions` (le didascalie). **`text` è quello da confrontare con `diff`**: ignora l'impaginazione e mostra solo le differenze di contenuto. Il modo di procedere è salvare i dump *prima* della modifica e confrontarli dopo.

Senza Node installato, tutto quanto sopra si esegue in un container:

```bash
docker run --rm -v "$PWD":/repo -w /repo -e HOME=/tmp -u "$(id -u):$(id -g)" \
  node:22-bookworm-slim sh -c 'npm install && npm run build:ta004 -- --no-pdf'
```

In container va sempre passato `--no-pdf`: l'export PDF richiede Word o LibreOffice e non è verificabile lì.

---

## AZ-104 — Azure Administrator (Microsoft)

Note di studio per la certificazione **Microsoft AZ-104 (Azure Administrator)**, in `docs/microsoft/AZ-104/`.

```
docs/microsoft/AZ-104/
├── chapters/              ← contenuto del documento (unica fonte di verità)
│   ├── MODULE_1.md        ← Prerequisiti per gli amministratori di Azure
│   ├── MODULE_2.md        ← Gestire identità e governance in Azure
│   ├── MODULE_3.md        ← Configurare e gestire reti virtuali
│   ├── MODULE_4.md        ← Implementare e gestire l'archiviazione
│   ├── MODULE_5.md        ← Distribuire e gestire risorse di calcolo
│   └── MODULE_6.md        ← Monitorare ed eseguire il backup
├── script/
│   ├── config.js          ← palette, copertina, moduli, nomi dei file prodotti
│   ├── tables.js          ← le 7 tabelle generate da codice
│   └── create_az104.js    ← entry point
├── img/                   ← figure (sottocartelle per modulo)
└── CLAUDE.md
```

| Comando | Output | Descrizione |
|---|---|---|
| `npm run build:az104` | `AZ-104_Note_di_Studio.docx` + `.pdf` | Documento completo |
| `npm run build:az104:toc` | `AZ-104_Sommario.docx` + `.pdf` | Solo copertina e sommario |
| `node docs/microsoft/AZ-104/script/create_az104.js --module N` | `AZ-104_Modulo_N.docx` + `.pdf` | Solo il modulo N (1–6) |

Le poche tabelle che non si possono esprimere in Markdown sono funzioni JS in `script/tables.js`, riferite dai `.md` come `[TABELLA: nome]`: `toolsTable`, `armStructureTable`, `reservedTable`, `publicIpAssocTable`, `publicIpSkuTable`, `privateIpTable`, `nsgRuleSettingsTable`. Tutto il resto è una normale tabella Markdown.

---

## Terraform Associate (004) (HashiCorp)

Note di studio per la certificazione **HashiCorp Certified: Terraform Associate (004)**, in `docs/hashicorp/TA-004/`.

Il contenuto segue la [exam content list](https://developer.hashicorp.com/terraform/tutorials/certification-004/associate-review-004) e il [percorso di studio](https://developer.hashicorp.com/terraform/tutorials/certification-004/associate-study-004) ufficiali HashiCorp. Ogni modulo traduce in forma discorsiva le pagine collegate per il relativo obiettivo d'esame, nell'ordine del percorso di studio, e ogni sezione indica la pagina di origine con un link cliccabile anche nel documento finale.

```
docs/hashicorp/TA-004/
├── chapters/
│   ├── MODULE_1.md          ← IaC con Terraform                (obiettivo 1)
│   ├── MODULE_2.md          ← Fondamenti di Terraform          (obiettivo 2)
│   ├── MODULE_3.md          ← Core Terraform workflow          (obiettivo 3)
│   ├── MODULE_4.md          ← Configurazione Terraform         (obiettivo 4)
│   ├── MODULE_5.md          ← Moduli Terraform                 (obiettivo 5)
│   ├── MODULE_6.md          ← Gestione dello state             (obiettivo 6)
│   ├── MODULE_7.md          ← Manutenzione dell'infrastruttura (obiettivo 7)
│   └── MODULE_8.md          ← HCP Terraform                    (obiettivo 8)
├── pocketguide/             ← variante sintetica: 01-…md … 10-Appendice-CLI.md
├── script/
│   ├── config.js            ← palette, copertina con logo, moduli, i due deliverable
│   └── create_ta004.js      ← entry point
├── img/                     ← figure (sottocartelle per modulo) + img/Cover/
└── CLAUDE.md
```

| Comando | Output | Descrizione |
|---|---|---|
| `npm run build:ta004` | `TA-004_Note_di_Studio.docx` + `.pdf` | Documento completo |
| `npm run build:ta004:toc` | `TA-004_Sommario.docx` + `.pdf` | Solo copertina e sommario |
| `npm run build:ta004:pocket` | `TA-004_Pocket_Guide.docx` + `.pdf` | Pocket guide (10 capitoli) |
| `node docs/hashicorp/TA-004/script/create_ta004.js --module N` | `TA-004_Modulo_N.docx` + `.pdf` | Solo il modulo N (1–8) |

La pocket guide legge **tutti** i `.md` in `pocketguide/` in ordine di nome file (da qui i prefissi `NN-`): aggiungere un capitolo significa aggiungere un file numerato correttamente, nulla di più.

---

## Aggiungere una certificazione

1. Crea `docs/<provider>/<CERTIFICAZIONE>/` con le sottocartelle `chapters/` e `img/`. I nomi dei provider sono in minuscolo (`microsoft/`, `hashicorp/`), le cartelle delle certificazioni mantengono il codice ufficiale in maiuscolo (`AZ-104`, `TA-004`).
2. Scrivi `script/config.js` (`id`, `root`, `banner`, `palette`, `cover`, `deliverables`) e un entry point di una quindicina di righe che chiami `build(require('./config'))`. Copiali da una certificazione esistente: **non c'è nessun generatore da duplicare**.
3. Aggiungi gli script `build:<cert>` e `build:<cert>:toc` in [package.json](package.json).
4. Aggiungi la riga nella tabella **Certificazioni** qui sopra e una sezione dedicata in questo README.
5. Aggiungi un `CLAUDE.md` nella nuova cartella (contiene le note specifiche di quella certificazione).

Per una **variante** di un documento esistente non serve niente di tutto questo: basta una voce in più in `deliverables`.

---

## Workflow

Le modifiche vanno su un branch dedicato, poi PR e merge in `main`. Messaggi di commit in italiano, stile Conventional Commits (`feat:`, `fix:`, `chore:`, `docs:`).

```bash
git checkout -b feature/az104-modulo-3
# modifica docs/microsoft/AZ-104/chapters/MODULE_3.md (il contenuto sta nei .md, non nel JS)
npm run build:az104          # rigenera e verifica
git commit -am "feat: aggiorna AZ-104 MODULE_3 - descrizione"
git push -u origin feature/az104-modulo-3
# apri PR su GitHub e mergia in main
```

Una modifica al motore condiviso riguarda **tutte** le certificazioni: rigenera entrambi i documenti e confronta i dump prima di aprire la PR.
