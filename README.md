# Certification Notes

Note di studio per certificazioni IT, scritte in **italiano** e generate in formato Word (`.docx`) con esportazione automatica in **PDF** tramite script Node.js.

Ogni certificazione vive in una propria cartella sotto `docs/<provider>/<certificazione>/` ed è autonoma: contenuti, immagini, generatore e guida di stile stanno insieme. Il tooling (Node + la dipendenza `docx`) è invece condiviso dalla radice del repository.

---

## Certificazioni

| Certificazione | Provider | Contenuto | Cartella | Build |
|---|---|---|---|---|
| [AZ-104 — Azure Administrator](docs/microsoft/AZ-104/README.md) | Microsoft | 6 moduli | `docs/microsoft/AZ-104/` | `npm run build:az104` |
| [Terraform Associate (004)](docs/hashicorp/TA-004/README.md) | HashiCorp | 8 moduli + pocket guide (10 capitoli) | `docs/hashicorp/TA-004/` | `npm run build:ta004` |

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
│   │       ├── README.md
│   │       └── CLAUDE.md
│   └── hashicorp/
│       └── TA-004/
│           ├── chapters/      ← MODULE_1..8.md + COVER_TOC.md
│           ├── img/
│           ├── pocketguide/   ← variante sintetica (10 capitoli)
│           ├── script/        ← create_ta004.js
│           ├── style/
│           ├── README.md
│           └── CLAUDE.md
├── package.json               ← dipendenza condivisa + script di build per certificazione
├── .gitignore
├── .gitattributes
├── README.md                  ← questo file
└── CLAUDE.md                  ← guida per Claude Code a livello di monorepo
```

---

## Come generare i documenti

Prerequisiti: [Node.js](https://nodejs.org/) v18+ e, per l'export PDF, **Microsoft Word** (Windows, via COM) oppure **LibreOffice**. Senza nessuno dei due il `.docx` viene prodotto comunque e viene solo stampato un avviso.

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
node docs/hashicorp/TA-004/script/create_ta004.js --no-pdf     # salta l'export PDF
node docs/hashicorp/TA-004/script/create_ta004.js --module 4   # un singolo modulo (1-8)
```

I `.docx`/`.pdf` vengono scritti nella cartella della certificazione e sono artefatti di build ignorati da Git.

---

## Aggiungere una certificazione

1. Crea `docs/<provider>/<CERTIFICAZIONE>/` con le sottocartelle `chapters/`, `img/`, `script/`, `style/`.
2. Metti il generatore in `script/`: deve risolvere i percorsi con `ROOT = path.join(__dirname, '..')`, così `chapters/` e `img/` restano relativi alla certificazione (vedi i due script esistenti come riferimento).
3. Aggiungi gli script `build:<cert>` e `build:<cert>:toc` in [package.json](package.json).
4. Aggiungi la riga nella tabella **Certificazioni** qui sopra e un `README.md` nella nuova cartella.

---

## Workflow

Le modifiche vanno su un branch dedicato, poi PR e merge in `main`. Messaggi di commit in italiano, stile Conventional Commits (`feat:`, `fix:`, `chore:`, `docs:`).

```bash
git checkout -b feature/az104-modulo-3
# modifica docs/microsoft/AZ-104/chapters/MODULE_3.md
npm run build:az104          # rigenera e verifica
git commit -am "feat: aggiorna AZ-104 MODULE_3 - descrizione"
git push -u origin feature/az104-modulo-3
```
