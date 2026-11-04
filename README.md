# Certification Notes

Note di studio per certificazioni IT, scritte in **italiano** e generate in formato Word (`.docx`) con esportazione automatica in **PDF**.

Ogni certificazione vive in una propria cartella sotto `docs/<provider>/<certificazione>/` e contiene solo i contenuti: i `.md`, le immagini e un file di configurazione. Tutta la logica di generazione sta in un **motore condiviso** ([`packages/doc-engine`](packages/doc-engine)), e l'intero processo — `.md` → `.docx` → `.pdf` — gira in un **container Docker**: sulla macchina non serve altro. Questo README è l'unica documentazione del progetto e copre tutte le certificazioni.

In tutte le certificazioni il contenuto risiede nei file `chapters/MODULE_*.md` (**unica fonte di verità**): il motore li legge e produce il documento. Per aggiornare un documento si modifica il `.md` e si rigenera — non serve toccare il codice JS, che va modificato solo per cambiare stili, marcatori o logica di parsing (vedi la [guida di stile](docs/STYLE_GUIDE.md)).

---

## Certificazioni

| Certificazione | Provider | Contenuto | Cartella | Script |
|---|---|---|---|---|
| [AZ-104 — Azure Administrator](#az-104--azure-administrator-microsoft) | Microsoft | 6 moduli | `docs/microsoft/AZ-104/` | `build:az104` |
| [Terraform Associate (004)](#terraform-associate-004-hashicorp) | HashiCorp | 8 moduli + pocket guide (10 capitoli) | `docs/hashicorp/TA-004/` | `build:ta004`, `build:ta004:pocket` |

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
│       ├── pdf.js             ← .docx → .pdf: sceglie il motore (LibreOffice-UNO, Word)
│       ├── docx2pdf.py        ← pilota LibreOffice via UNO: aggiorna il Sommario ed esporta
│       ├── cli.js             ← opzioni da riga di comando, dedotte dalla configurazione
│       └── bin/
│           ├── build-all.js   ← build:all, tutti i documenti
│           ├── inspect-docx.js ← dump del .docx, per verificare le modifiche
│           └── check-pdf.js   ← verifica del PDF: Sommario, numeri di pagina, font
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
├── Dockerfile                 ← l'immagine: Node, LibreOffice, i font, le dipendenze npm
├── compose.yaml               ← come si avvia il container (mount, opzioni)
├── docker/entrypoint.sh       ← inoltra a npm lo script richiesto con le sue opzioni
├── package.json               ← dipendenza condivisa, workspace, script di build
├── .dockerignore
├── .gitignore
├── .gitattributes
├── README.md                  ← questo file (documentazione di tutte le certificazioni)
└── CLAUDE.md                  ← guida per Claude Code a livello di monorepo
```

---

## Il motore condiviso

I due generatori erano lo stesso programma duplicato: 560 righe su 709 identiche, l'export PDF uguale byte per byte. Ora c'è un solo motore, e di ciascuna certificazione resta solo ciò che la distingue davvero.

Il motore è un **npm workspace** (`@certification-notes/doc-engine`), quindi i generatori lo risolvono risalendo al `node_modules/` di radice, esattamente come fanno con `docx`: funziona a qualunque profondità di annidamento. Nell'immagine Docker le dipendenze sono già installate.

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

Una variante — la pocket guide di TA-004, o un eventuale quaderno di quiz — **non** è una nuova certificazione: è una voce in più in `deliverables`, che dichiara dove sono i sorgenti, come si chiama l'output e cosa cambia in copertina. Le opzioni ammesse si deducono da quello che la voce dichiara: la pocket guide non ha moduli numerati, quindi `--module` viene rifiutato con un messaggio chiaro. Vedi `deliverables.pocket` in [docs/hashicorp/TA-004/script/config.js](docs/hashicorp/TA-004/script/config.js).

### Numerazione automatica di figure e tabelle

Figure e tabelle sono numerate dal motore, in ordine di documento, con due contatori che attraversano i moduli. **Nei `.md` non si scrivono numeri**: un numero scritto a mano viene riconosciuto e sovrascritto.

- Inserire una figura in mezzo a un modulo non richiede di rinumerare quelle successive.
- Anche `--module N` produce i numeri del documento completo.
- La prosa non cita i numeri di figura ("come mostrato nella figura precedente", non "in Figura 124"): cambierebbero al primo inserimento.

---

## Prerequisiti

Solo **Docker** (su macOS e Windows: [Docker Desktop](https://www.docker.com/products/docker-desktop/)). Node, LibreOffice e i font stanno nell'immagine.

---

## Come generare i documenti

Dalla radice del repository, con comandi identici in zsh/bash e in PowerShell:

```bash
docker compose build                                  # la prima volta (qualche minuto: scarica LibreOffice)

docker compose run --rm docs build:all                # tutti i documenti, .docx + .pdf
docker compose run --rm docs build:az104              # AZ-104  → docs/microsoft/AZ-104/AZ-104_Note_di_Studio.docx + .pdf
docker compose run --rm docs build:ta004              # TA-004  → docs/hashicorp/TA-004/TA-004_Note_di_Studio.docx + .pdf
docker compose run --rm docs build:ta004:pocket       # TA-004  → docs/hashicorp/TA-004/TA-004_Pocket_Guide.docx + .pdf

docker compose run --rm docs build:az104 --module 3   # un singolo modulo
docker compose run --rm docs build:all --no-pdf       # solo i .docx
docker compose run --rm docs build:ta004 --help       # tutte le opzioni di un generatore
docker compose run --rm docs                          # elenca gli script disponibili
```

I documenti vengono scritti nella cartella della certificazione, sull'host, e sono artefatti di build ignorati da Git. AZ-104, il più pesante (151 immagini, circa 200 pagine), richiede meno di dieci secondi.

Contenuti e motore non stanno nell'immagine: vengono montati dall'host a ogni esecuzione, quindi modificare un `.md` o il motore **non** richiede di ricostruire nulla. `docker compose build` serve solo la prima volta e quando cambiano `Dockerfile` o le dipendenze in `package.json` — in quel caso il container lo dice e si ferma, invece di fallire con un errore oscuro.

`--help` elenca le opzioni ricavandole dalla configurazione, quindi è sempre aggiornato. Le opzioni sconosciute e le combinazioni incompatibili danno errore invece di essere ignorate in silenzio.

> **Su Linux**, se il tuo utente non ha uid 1000, aggiungi `--user "$(id -u):$(id -g)"` dopo `run` perché il container possa scrivere i documenti. Su macOS e Windows non serve.

> **Senza Docker**, con Node 18+ installato, `npm install` dalla radice e poi `npm run build:az104` (e così via) funzionano ancora. Per il PDF serve però Word o LibreOffice sulla macchina: vedi sotto.

### Esportazione in PDF

Dopo il `.docx` il motore esporta **automaticamente** anche il `.pdf` con lo stesso nome (`--no-pdf` per saltarlo). Il punto delicato è il **Sommario**: è un campo di Word che va calcolato prima di esportare, altrimenti nel PDF esce vuoto. I motori, in ordine:

1. **LibreOffice via UNO** — quello del container, e quindi il **PDF di riferimento**. Lo script [`docx2pdf.py`](packages/doc-engine/docx2pdf.py) apre il documento, forza l'impaginazione, aggiorna il Sommario e solo allora esporta. I font sono **Carlito**, metricamente compatibile con Calibri (stesse larghezze, quindi stessi a capo), e **Liberation Mono** al posto di Courier New. Nel container è l'unico motore ammesso: se fallisce, il comando fallisce, invece di produrre in silenzio un PDF col Sommario vuoto.
2. **Microsoft Word** via COM — solo lanciando il motore direttamente su Windows, fuori da Docker. Aggiorna anch'esso Sommario e numeri di pagina. L'impaginazione è molto simile a quella di LibreOffice ma non identica pagina per pagina.
3. **`soffice --convert-to`** — ultimo ripiego fuori da Docker: esporta **senza** aggiornare il Sommario, che esce vuoto, e lo segnala con un avviso.

### Verificare una modifica al motore

Non ci sono test automatici: la verifica consiste nel **rigenerare e confrontare**. Due strumenti, entrambi nel container:

```bash
docker compose run --rm docs check:pdf                                  # tutti i PDF generati
docker compose run --rm docs inspect:docx --out .regress/dopo docs/hashicorp/TA-004/TA-004_Note_di_Studio.docx
```

**`check:pdf`** verifica ogni PDF contro il suo `.docx`: il Sommario ha tante voci quante sono le intestazioni, con gli stessi titoli; ogni voce rimanda alla pagina in cui l'intestazione compare davvero; la numerazione è contigua; i font sono quelli previsti e incorporati.

**`inspect:docx`** estrae dal `.docx` quattro file di testo in `.regress/` (ignorata da Git): `counts` (paragrafi, tabelle, immagini, livelli di struttura), `spine` (la sequenza delle intestazioni), `text` (un paragrafo per riga, senza formattazione) e `captions` (le didascalie). Due `.docx` non si confrontano byte per byte né per md5 — la libreria `docx` genera id casuali e lo zip porta i timestamp, quindi due esecuzioni dello stesso codice danno file diversi — ma i dump sì. **`text` è quello da confrontare**: ignora l'impaginazione e mostra solo le differenze di contenuto. Si salvano i dump *prima* della modifica e si confrontano dopo:

```bash
docker compose run --rm --entrypoint diff docs -r .regress/prima .regress/dopo
```

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

| Comando (`docker compose run --rm docs …`) | Output | Descrizione |
|---|---|---|
| `build:az104` | `AZ-104_Note_di_Studio.docx` + `.pdf` | Documento completo |
| `build:az104 --module N` | `AZ-104_Modulo_N.docx` + `.pdf` | Solo il modulo N (1–6) |

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

| Comando (`docker compose run --rm docs …`) | Output | Descrizione |
|---|---|---|
| `build:ta004` | `TA-004_Note_di_Studio.docx` + `.pdf` | Documento completo |
| `build:ta004 --module N` | `TA-004_Modulo_N.docx` + `.pdf` | Solo il modulo N (1–8) |
| `build:ta004:pocket` | `TA-004_Pocket_Guide.docx` + `.pdf` | Pocket guide (10 capitoli) |

La pocket guide legge **tutti** i `.md` in `pocketguide/` in ordine di nome file (da qui i prefissi `NN-`): aggiungere un capitolo significa aggiungere un file numerato correttamente, nulla di più.

---

## Aggiungere una certificazione

1. Crea `docs/<provider>/<CERTIFICAZIONE>/` con le sottocartelle `chapters/` e `img/`. I nomi dei provider sono in minuscolo (`microsoft/`, `hashicorp/`), le cartelle delle certificazioni mantengono il codice ufficiale in maiuscolo (`AZ-104`, `TA-004`).
2. Scrivi `script/config.js` (`id`, `root`, `banner`, `palette`, `cover`, `deliverables`) e un entry point di una quindicina di righe che chiami `build(require('./config'))`. Copiali da una certificazione esistente: **non c'è nessun generatore da duplicare**.
3. Aggiungi lo script `build:<cert>` in [package.json](package.json): `build:all` lo include da solo.
4. Aggiungi la riga nella tabella **Certificazioni** qui sopra e una sezione dedicata in questo README.
5. Aggiungi un `CLAUDE.md` nella nuova cartella (contiene le note specifiche di quella certificazione).

Per una **variante** di un documento esistente non serve niente di tutto questo: basta una voce in più in `deliverables`.

---

## Workflow

Le modifiche vanno su un branch dedicato, poi PR e merge in `main`. Messaggi di commit in italiano, stile Conventional Commits (`feat:`, `fix:`, `chore:`, `docs:`).

```bash
git checkout -b feature/az104-modulo-3
# modifica docs/microsoft/AZ-104/chapters/MODULE_3.md (il contenuto sta nei .md, non nel JS)
docker compose run --rm docs build:az104      # rigenera
docker compose run --rm docs check:pdf        # verifica il PDF
git commit -am "feat: aggiorna AZ-104 MODULE_3 - descrizione"
git push -u origin feature/az104-modulo-3
# apri PR su GitHub e mergia in main
```

Una modifica al motore condiviso riguarda **tutte** le certificazioni: rigenera tutto con `build:all`, confronta i dump e lancia `check:pdf` prima di aprire la PR.
