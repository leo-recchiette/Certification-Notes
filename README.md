# AZ-104 — Note di Studio

Note di studio per la certificazione **Microsoft AZ-104 (Azure Administrator)**, generate tramite script Node.js in formato Word (.docx).

---

## Struttura del repository

```
az-104-appunti/
├── create_az104.js        ← script di generazione del documento Word
├── STYLE_GUIDE.md         ← font, colori, helper functions, note tecniche
├── COVER_TOC.md           ← copertina e sommario
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

### Generazione

```bash
node create_az104.js
```

Il documento viene salvato in output come `AZ-104_Note_di_Studio.docx`.

> **Nota**: lo script si aspetta che la cartella `img/` si trovi nella stessa directory di `create_az104.js`.

---

## Workflow di aggiornamento

Ogni modifica segue il pattern branch → PR → merge:

```bash
git checkout -b feature/update-module-X
# modifica MODULE_X.md e/o create_az104.js
git add .
git commit -m "feat: update MODULE_X - descrizione modifica"
git push origin feature/update-module-X
# apri PR su GitHub e mergia in main
```
