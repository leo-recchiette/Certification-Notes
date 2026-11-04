# Certification Notes

Note di studio per certificazioni IT, scritte in **italiano** e generate in formato Word (`.docx`) con esportazione automatica in **PDF** tramite script Node.js.

Ogni certificazione vive in una propria cartella sotto `docs/<provider>/<certificazione>/` ed è autonoma: contenuti, immagini, generatore e guida di stile stanno insieme. Il tooling (Node + la dipendenza `docx`) è invece condiviso dalla radice del repository, e questo README è l'unica documentazione del progetto: copre tutte le certificazioni.

In tutte le certificazioni il contenuto risiede nei file `chapters/MODULE_*.md` (**unica fonte di verità**): il generatore li legge e produce il documento. Per aggiornare un documento si modifica il `.md` e si rigenera — non serve toccare il codice JS, che va modificato solo per cambiare stili, marcatori o logica di parsing (vedi la `style/STYLE_GUIDE.md` della certificazione).

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
├── docs/
│   ├── microsoft/
│   │   └── AZ-104/
│   │       ├── chapters/      ← contenuto: MODULE_1..6.md + COVER_TOC.md (fonte di verità)
│   │       ├── img/           ← figure, in sottocartelle per modulo
│   │       ├── script/        ← create_az104.js (generatore .md → .docx → .pdf)
│   │       ├── style/         ← STYLE_GUIDE.md (stili + marcatori Markdown)
│   │       └── CLAUDE.md
│   └── hashicorp/
│       └── TA-004/
│           ├── chapters/      ← MODULE_1..8.md + COVER_TOC.md
│           ├── img/
│           ├── pocketguide/   ← variante sintetica (10 capitoli)
│           ├── script/        ← create_ta004.js
│           ├── style/
│           └── CLAUDE.md
├── package.json               ← dipendenza condivisa + script di build per certificazione
├── .gitignore
├── .gitattributes
├── README.md                  ← questo file (documentazione di tutte le certificazioni)
└── CLAUDE.md                  ← guida per Claude Code a livello di monorepo
```

---

## Prerequisiti

- [Node.js](https://nodejs.org/) v18 o superiore
- Dipendenze npm, installate **una volta sola dalla radice del repository** (`npm install`): la singola dipendenza `docx` è condivisa da tutti i generatori
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
```

I `.docx`/`.pdf` vengono scritti nella cartella della certificazione e sono artefatti di build ignorati da Git. Non ci sono test né linter: la verifica consiste nel rigenerare il documento e aprirlo.

### Esportazione in PDF

Dopo aver generato il `.docx`, lo script esporta **automaticamente** anche un `.pdf` con lo stesso nome (es. `AZ-104_Note_di_Studio.pdf`), in tutte le modalità. La conversione usa, in ordine di preferenza:

1. **Microsoft Word** (via automazione COM, solo Windows): apre il documento, **aggiorna il Sommario e i numeri di pagina** e lo esporta in PDF. È il motore preferito perché il PDF risulta già impaginato correttamente — l'indice riporta i numeri di pagina giusti, senza dover premere `F9` come accade aprendo il `.docx`. Funziona solo in una sessione interattiva (non headless, non come servizio).
2. **LibreOffice** (`soffice --headless`, multipiattaforma): fallback se Word non è installato. In tal caso i numeri di pagina del Sommario potrebbero non essere aggiornati (in alternativa apri il `.docx` in Word, premi `F9` e ri-esporta).

Se non è disponibile né Word né LibreOffice, il `.docx` viene comunque creato e si riceve solo un avviso. Per saltare del tutto la conversione usa `--no-pdf`.

---

## AZ-104 — Azure Administrator (Microsoft)

Note di studio per la certificazione **Microsoft AZ-104 (Azure Administrator)**, in `docs/microsoft/AZ-104/`. Generatore: `script/create_az104.js`.

```
docs/microsoft/AZ-104/
├── script/
│   └── create_az104.js    ← generatore (parser .md → .docx, + export .pdf)
├── chapters/              ← contenuto del documento (unica fonte di verità)
│   ├── COVER_TOC.md       ← copertina (il sommario è generato da Word)
│   ├── MODULE_1.md        ← Prerequisiti per gli amministratori di Azure
│   ├── MODULE_2.md        ← Gestire identità e governance in Azure
│   ├── MODULE_3.md        ← Configurare e gestire reti virtuali
│   ├── MODULE_4.md        ← Implementare e gestire l'archiviazione
│   ├── MODULE_5.md        ← Distribuire e gestire risorse di calcolo
│   └── MODULE_6.md        ← Monitorare ed eseguire il backup
├── style/
│   └── STYLE_GUIDE.md     ← stili + marcatori Markdown riconosciuti dal parser
├── img/                   ← figure (sottocartelle per modulo)
│   ├── Module 1 - Prerequisiti per gli amministratori di Azure/
│   ├── Module 2 - Gestire identità e governance in Azure/
│   ├── Module 3 - Configurare e gestire reti virtuali/
│   └── ...
└── CLAUDE.md
```

| Comando | Output | Descrizione |
|---|---|---|
| `npm run build:az104` | `AZ-104_Note_di_Studio.docx` + `.pdf` | Documento completo |
| `npm run build:az104:toc` | `AZ-104_Sommario.docx` + `.pdf` | Solo copertina e sommario |
| `node docs/microsoft/AZ-104/script/create_az104.js --module N` | `AZ-104_Modulo_N.docx` + `.pdf` | Solo il modulo N (1–6) |
| `node docs/microsoft/AZ-104/script/create_az104.js --no-pdf` | solo `.docx` | Salta l'esportazione in PDF |

Esempi:

```bash
npm run build:az104                                               # documento completo
npm run build:az104:toc                                           # solo il sommario
node docs/microsoft/AZ-104/script/create_az104.js --module 2      # solo il Modulo 2
node docs/microsoft/AZ-104/script/create_az104.js --no-pdf        # completo, senza PDF
```

Guida di stile: [docs/microsoft/AZ-104/style/STYLE_GUIDE.md](docs/microsoft/AZ-104/style/STYLE_GUIDE.md).

---

## Terraform Associate (004) (HashiCorp)

Note di studio per la certificazione **HashiCorp Certified: Terraform Associate (004)**, in `docs/hashicorp/TA-004/`. Generatore: `script/create_ta004.js`.

Il contenuto segue la [exam content list](https://developer.hashicorp.com/terraform/tutorials/certification-004/associate-review-004) e il [percorso di studio](https://developer.hashicorp.com/terraform/tutorials/certification-004/associate-study-004) ufficiali HashiCorp. Ogni modulo traduce in forma discorsiva le pagine collegate per il relativo obiettivo d'esame, nell'ordine del percorso di studio, e ogni sezione indica la pagina di origine.

```
docs/hashicorp/TA-004/
├── script/create_ta004.js   ← generatore (parser .md → .docx, + export .pdf)
├── chapters/
│   ├── COVER_TOC.md         ← copertina (il sommario è generato da Word)
│   ├── MODULE_1.md          ← IaC con Terraform                (obiettivo 1)
│   ├── MODULE_2.md          ← Fondamenti di Terraform          (obiettivo 2)
│   ├── MODULE_3.md          ← Core Terraform workflow          (obiettivo 3)
│   ├── MODULE_4.md          ← Configurazione Terraform         (obiettivo 4)
│   ├── MODULE_5.md          ← Moduli Terraform                 (obiettivo 5)
│   ├── MODULE_6.md          ← Gestione dello state             (obiettivo 6)
│   ├── MODULE_7.md          ← Manutenzione dell'infrastruttura (obiettivo 7)
│   └── MODULE_8.md          ← HCP Terraform                    (obiettivo 8)
├── pocketguide/             ← variante sintetica: 01-…md … 10-Appendice-CLI.md
├── style/STYLE_GUIDE.md     ← stili + marcatori Markdown riconosciuti dal parser
├── img/                     ← figure (sottocartelle per modulo)
└── CLAUDE.md
```

| Comando | Output | Descrizione |
|---|---|---|
| `npm run build:ta004` | `TA-004_Note_di_Studio.docx` + `.pdf` | Documento completo |
| `npm run build:ta004:toc` | `TA-004_Sommario.docx` + `.pdf` | Solo copertina e sommario |
| `npm run build:ta004:pocket` | `TA-004_Pocket_Guide.docx` + `.pdf` | Pocket guide (10 capitoli) |
| `node docs/hashicorp/TA-004/script/create_ta004.js --module N` | `TA-004_Modulo_N.docx` + `.pdf` | Solo il modulo N (1–8) |
| `node docs/hashicorp/TA-004/script/create_ta004.js --no-pdf` | solo `.docx` | Salta l'esportazione in PDF |

La modalità `--pocket` legge **tutti** i `.md` in `pocketguide/` in ordine di nome file (da qui i prefissi `NN-`): aggiungere un capitolo significa aggiungere un file numerato correttamente, nulla di più.

Guida di stile: [docs/hashicorp/TA-004/style/STYLE_GUIDE.md](docs/hashicorp/TA-004/style/STYLE_GUIDE.md).

---

## Aggiungere una certificazione

1. Crea `docs/<provider>/<CERTIFICAZIONE>/` con le sottocartelle `chapters/`, `img/`, `script/`, `style/`. I nomi dei provider sono in minuscolo (`microsoft/`, `hashicorp/`), le cartelle delle certificazioni mantengono il codice ufficiale in maiuscolo (`AZ-104`, `TA-004`).
2. Metti il generatore in `script/`: deve risolvere i percorsi con `ROOT = path.join(__dirname, '..')`, così `chapters/` e `img/` restano relativi alla certificazione (vedi i due script esistenti come riferimento).
3. Aggiungi gli script `build:<cert>` e `build:<cert>:toc` in [package.json](package.json).
4. Aggiungi la riga nella tabella **Certificazioni** qui sopra e una sezione dedicata in questo README.
5. Aggiungi un `CLAUDE.md` nella nuova cartella (è la guida autorevole per quel generatore).

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
