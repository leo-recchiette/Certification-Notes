# Terraform Associate (004) — Note di Studio

Note di studio per la certificazione **HashiCorp Certified: Terraform Associate (004)**, in italiano, generate in formato Word (.docx) con esportazione automatica in **PDF** tramite uno script Node.js.

Il contenuto segue la [exam content list](https://developer.hashicorp.com/terraform/tutorials/certification-004/associate-review-004) e il [percorso di studio](https://developer.hashicorp.com/terraform/tutorials/certification-004/associate-study-004) ufficiali HashiCorp. Ogni modulo traduce in forma discorsiva le pagine collegate per il relativo obiettivo d'esame, nell'ordine del percorso di studio, e ogni sezione indica la pagina di origine. Il contenuto risiede nei file `chapters/MODULE_*.md` (**unica fonte di verità**): lo script `script/create_ta004.js` li legge e produce il documento.

Questa certificazione fa parte del monorepo [Certification Notes](../../../README.md): il tooling (Node + la dipendenza `docx`) è condiviso dalla radice del repository, i contenuti sono tutti qui.

---

## Struttura della cartella

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
├── README.md
└── CLAUDE.md
```

Alla radice del repository stanno invece i file condivisi: `package.json` (dipendenza `docx` + script di build), `.gitignore`, `.gitattributes`.

---

## Come generare il documento

Prerequisiti: [Node.js](https://nodejs.org/) v18+ e, per il PDF, **Microsoft Word** (Windows, via COM) oppure **LibreOffice**.

```bash
npm install                  # una volta sola, dalla radice del repo

npm run build:ta004          # documento completo -> TA-004_Note_di_Studio.docx + .pdf
npm run build:ta004:toc      # copertina+sommario -> TA-004_Sommario.docx + .pdf
npm run build:ta004:pocket   # pocket guide       -> TA-004_Pocket_Guide.docx + .pdf
```

Per le modalità non coperte dagli script npm si invoca direttamente il generatore (funziona da qualunque directory, i percorsi sono relativi a questa cartella):

```bash
node docs/hashicorp/TA-004/script/create_ta004.js --module 4   # solo il modulo 4 (1-8)
node docs/hashicorp/TA-004/script/create_ta004.js --no-pdf     # solo .docx
```

I `.docx`/`.pdf` vengono scritti in `docs/hashicorp/TA-004/` (la cartella superiore a `script/`, risolta dallo script stesso) e sono artefatti di build ignorati da Git.

---

## Workflow di aggiornamento

```bash
git checkout -b feature/ta004-modulo-X
# modifica docs/hashicorp/TA-004/chapters/MODULE_X.md
npm run build:ta004          # rigenera e verifica
git commit -am "feat: aggiorna TA-004 MODULE_X - descrizione"
git push -u origin feature/ta004-modulo-X
# apri PR e mergia in main
```

Lo script va modificato solo per cambiare stile, marcatori o logica di parsing (vedi [STYLE_GUIDE.md](style/STYLE_GUIDE.md)).
