# Terraform Associate (004) — Note di Studio

Note di studio per la certificazione **HashiCorp Certified: Terraform Associate (004)**, in italiano, generate in formato Word (.docx) con esportazione automatica in **PDF** tramite uno script Node.js.

Il contenuto segue la [exam content list](https://developer.hashicorp.com/terraform/tutorials/certification-004/associate-review-004) e il [percorso di studio](https://developer.hashicorp.com/terraform/tutorials/certification-004/associate-study-004) ufficiali HashiCorp. Il contenuto risiede nei file `chapters/MODULE_*.md` (**unica fonte di verità**): lo script `script/create_ta004.js` li legge e produce il documento.

---

## Struttura del repository

```
TA-004-Appunti/
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
├── style/STYLE_GUIDE.md     ← stili + marcatori Markdown riconosciuti dal parser
├── img/                     ← figure (opzionale)
├── package.json
└── CLAUDE.md
```

---

## Come generare il documento

Prerequisiti: [Node.js](https://nodejs.org/) v18+ e, per il PDF, **Microsoft Word** (Windows, via COM) oppure **LibreOffice**.

```bash
npm install
node script/create_ta004.js              # documento completo -> TA-004_Note_di_Studio.docx + .pdf
node script/create_ta004.js --module 4   # solo il modulo 4   -> TA-004_Modulo_4.docx + .pdf
node script/create_ta004.js --toc        # copertina+sommario -> TA-004_Sommario.docx + .pdf
node script/create_ta004.js --no-pdf     # solo .docx
```

Esegui i comandi dalla radice del repo. I `.docx`/`.pdf` sono artefatti di build ignorati da Git.

---

## Workflow di aggiornamento

```bash
git checkout -b feature/update-module-X
# modifica chapters/MODULE_X.md
git commit -am "feat: aggiorna MODULE_X - descrizione"
git push origin feature/update-module-X
# apri PR e mergia in main
```

Lo script va modificato solo per cambiare stile, marcatori o logica di parsing (vedi [STYLE_GUIDE.md](style/STYLE_GUIDE.md)).
