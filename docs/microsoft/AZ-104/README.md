# AZ-104 — Note di Studio

Note di studio per la certificazione **Microsoft AZ-104 (Azure Administrator)**, generate in formato Word (.docx) — con esportazione automatica anche in **PDF** — tramite uno script Node.js.

Il contenuto risiede nei file `chapters/MODULE_*.md` (**unica fonte di verità**): lo script `script/create_az104.js` li legge e produce il documento. Per aggiornare il documento si modifica il `.md` e si rigenera — non serve toccare il codice JS.

Questa certificazione fa parte del monorepo [Certification Notes](../../../README.md): il tooling (Node + la dipendenza `docx`) è condiviso dalla radice del repository, i contenuti sono tutti qui.

---

## Struttura della cartella

```
docs/microsoft/AZ-104/
├── script/
│   └── create_az104.js    ← script di generazione (parser .md → .docx, + export .pdf)
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
├── README.md
└── CLAUDE.md
```

Alla radice del repository stanno invece i file condivisi: `package.json` (dipendenza `docx` + script di build), `.gitignore`, `.gitattributes`.

---

## Come generare il documento

### Prerequisiti

- [Node.js](https://nodejs.org/) v18 o superiore
- Dipendenze npm, installate **una volta sola dalla radice del repository**:

```bash
npm install
```

- Per l'**esportazione in PDF** (automatica dopo il `.docx`): **Microsoft Word**
  (Windows, usato via automazione COM) oppure **LibreOffice**. Senza nessuno dei due
  il `.docx` viene comunque generato (vedi *Esportazione in PDF* più sotto).

> **Node portable (alternativa all'installazione di sistema)**
> Invece di un'installazione classica, si può usare una versione **portable** di Node
> (archivio `.zip` scaricabile da [nodejs.org](https://nodejs.org/), senza installer). Dopo averla
> estratta, **aggiungere al `PATH`** la cartella che contiene `node.exe` e `npm.cmd`: in questo modo
> `node` e `npm` sono richiamabili direttamente da qualsiasi cartella e i comandi qui sotto funzionano
> senza dover indicare il percorso completo dell'eseguibile.
>
> Esempio di percorso usato su questa macchina:
> `C:\Users\<utente>\AppData\Local\node-portable\node-v24.16.0-win-x64\`

### Generazione

Dalla radice del repository, tramite gli script npm:

| Comando | Output | Descrizione |
|---|---|---|
| `npm run build:az104` | `AZ-104_Note_di_Studio.docx` + `.pdf` | Documento completo |
| `npm run build:az104:toc` | `AZ-104_Sommario.docx` + `.pdf` | Solo copertina e sommario |

Per le modalità non coperte dagli script npm si invoca direttamente il generatore (i percorsi sono risolti rispetto a questa cartella, quindi il comando funziona da qualunque directory):

| Comando | Output | Descrizione |
|---|---|---|
| `node docs/microsoft/AZ-104/script/create_az104.js --module N` | `AZ-104_Modulo_N.docx` + `.pdf` | Solo il modulo N (1–6) |
| `node docs/microsoft/AZ-104/script/create_az104.js --no-pdf` | solo `.docx` | Salta l'esportazione in PDF |

Esempi:

```bash
# Documento completo
npm run build:az104

# Solo il sommario
npm run build:az104:toc

# Solo il Modulo 2 — Gestire identità e governance in Azure
node docs/microsoft/AZ-104/script/create_az104.js --module 2

# Documento completo senza esportazione PDF (solo .docx)
node docs/microsoft/AZ-104/script/create_az104.js --no-pdf
```

> **Nota**: lo script risolve `img/`, `chapters/` e i file di output rispetto alla **cartella della certificazione** (`docs/microsoft/AZ-104/`, cioè la cartella superiore a `script/`), non rispetto alla directory corrente. I `.docx` e i `.pdf` generati finiscono quindi in `docs/microsoft/AZ-104/` e sono ignorati da Git.

### Esportazione in PDF

Dopo aver generato il `.docx`, lo script esporta **automaticamente** anche un `.pdf` con
lo stesso nome (es. `AZ-104_Note_di_Studio.pdf`), in tutte le modalità. La conversione
usa, in ordine di preferenza:

1. **Microsoft Word** (via automazione COM, solo Windows): apre il documento, **aggiorna
   il Sommario e i numeri di pagina** e lo esporta in PDF. È il motore preferito perché il
   PDF risulta già impaginato correttamente — l'indice riporta i numeri di pagina giusti,
   senza dover premere `F9` come accade aprendo il `.docx`.
2. **LibreOffice** (`soffice --headless`, multipiattaforma): fallback se Word non è
   installato. In tal caso i numeri di pagina del Sommario potrebbero non essere aggiornati
   (in alternativa apri il `.docx` in Word, premi `F9` e ri-esporta).

Se non è disponibile né Word né LibreOffice, il `.docx` viene comunque creato e si riceve
solo un avviso. Per saltare del tutto la conversione usa `--no-pdf`.

---

## Workflow di aggiornamento

Ogni modifica segue il pattern branch → PR → merge:

```bash
git checkout -b feature/az104-modulo-X
# modifica docs/microsoft/AZ-104/chapters/MODULE_X.md (il contenuto sta nei .md, non nel JS)
npm run build:az104          # rigenera e verifica
git add .
git commit -m "feat: aggiorna AZ-104 MODULE_X - descrizione modifica"
git push -u origin feature/az104-modulo-X
# apri PR su GitHub e mergia in main
```

Lo script `script/create_az104.js` va modificato solo per cambiare stile, marcatori o
logica di parsing (vedi [STYLE_GUIDE.md](style/STYLE_GUIDE.md)).
