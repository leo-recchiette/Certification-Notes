# AZ-104 — Note di Studio

Note di studio per la certificazione **Microsoft AZ-104 (Azure Administrator)**, generate in formato Word (.docx) tramite uno script Node.js.

Il contenuto risiede nei file `MODULE_*.md` (**unica fonte di verità**): lo script `create_az104.js` li legge e produce il documento. Per aggiornare il documento si modifica il `.md` e si rigenera — non serve toccare il codice JS.

---

## Struttura del repository

```
az-104-appunti/
├── create_az104.js        ← script di generazione (parser .md → .docx)
├── package.json           ← dipendenza docx + script npm
├── .gitignore             ← ignora node_modules/ e i .docx generati
├── STYLE_GUIDE.md         ← stili + marcatori Markdown riconosciuti dal parser
├── COVER_TOC.md           ← copertina (il sommario è auto-generato)
├── MODULE_1.md            ← Prerequisiti per gli amministratori di Azure
├── MODULE_2.md            ← Gestire identità e governance in Azure
├── MODULE_3.md            ← Configurare e gestire reti virtuali
├── MODULE_4.md            ← Implementare e gestire l'archiviazione (placeholder)
├── MODULE_5.md            ← Distribuire e gestire risorse di calcolo (placeholder)
├── MODULE_6.md            ← Monitorare ed eseguire il backup (placeholder)
└── img/
    ├── Module 1 - Prerequisiti per gli amministratori di Azure/
    ├── Module 2 - Gestire identità e governance in Azure/
    └── Module 3 - Configurare e gestire reti virtuali/
```

---

## Come generare il documento

### Prerequisiti

- [Node.js](https://nodejs.org/) v18 o superiore
- Dipendenze npm:

```bash
npm install docx
```

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

Lo script supporta tre modalità tramite argomenti da riga di comando:

| Comando | Output | Descrizione |
|---|---|---|
| `node create_az104.js` | `AZ-104_Note_di_Studio.docx` | Documento completo |
| `node create_az104.js --toc` | `AZ-104_Sommario.docx` | Solo copertina e sommario |
| `node create_az104.js --module N` | `AZ-104_Modulo_N.docx` | Solo il modulo N (1–6) |

Esempi:

```bash
# Documento completo
node create_az104.js

# Solo il sommario
node create_az104.js --toc

# Solo il Modulo 2 — Gestire identità e governance in Azure
node create_az104.js --module 2

# Solo il Modulo 3 — Configurare e gestire reti virtuali
node create_az104.js --module 3
```

> **Nota**: lo script si aspetta che la cartella `img/` si trovi nella stessa directory di `create_az104.js`.

---

## Workflow di aggiornamento

Ogni modifica segue il pattern branch → PR → merge:

```bash
git checkout -b feature/update-module-X
# modifica MODULE_X.md (il contenuto sta nei .md, non nel JS)
git add .
git commit -m "feat: update MODULE_X - descrizione modifica"
git push origin feature/update-module-X
# apri PR su GitHub e mergia in main
```

Dopo le modifiche, rigenera il `.docx` (vedi sopra). Lo script `create_az104.js`
va modificato solo per cambiare stile, marcatori o logica di parsing
(vedi [STYLE_GUIDE.md](STYLE_GUIDE.md)).
