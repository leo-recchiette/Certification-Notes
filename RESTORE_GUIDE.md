# AZ-104 Note di Studio — Restore Guide completo

## STILE DEL DOCUMENTO

### Font e colori
| Elemento | Font | Dimensione | Colore |
|---|---|---|---|
| Default corpo | Calibri | 11pt (22 half-pt) | #333333 |
| Titolo copertina | Calibri | 48pt (96 half-pt) grassetto | #1B3A6B |
| Sottotitolo copertina | Calibri | 26pt (52 half-pt) grassetto | #0078D4 |
| Descrizione copertina | Calibri | 13pt (26 half-pt) corsivo | #555555 |
| moduloTitle | Calibri | 24pt (48 half-pt) grassetto | #1B3A6B |
| h2 | Calibri | 14pt (28 half-pt) grassetto keepNext | #0078D4 |
| h3 | Calibri | 12pt (24 half-pt) grassetto keepNext | #2D5F8A |
| stepTitle | Calibri | 11pt (22 half-pt) grassetto nero keepNext | #000000 |
| bullet | Calibri | 11pt (22 half-pt) | #333333 |
| codeBlock | Courier New | 9pt (18 half-pt) sfondo #EEF3F8 | #1B3A6B |
| caption | Calibri | 9pt (18 half-pt) corsivo centrato | #888888 |
| infoBox label | Calibri | 11pt grassetto | #0078D4 |
| infoBox testo | Calibri | 11pt | #333333 |
| tocMacro | Calibri | 12pt (24 half-pt) grassetto | #1B3A6B |
| tocHeading | Calibri | 11pt (22 half-pt) grassetto | #0078D4 |
| tocEntry | Calibri | 10pt (20 half-pt) | #2D5F8A |
| tocEntry numero pagina | Calibri | 10pt (20 half-pt) | #888888 |

### Margini pagina
Top, Right, Bottom, Left: 1440 DXA (1 inch / 2.54 cm)

### Bordi e sfondi
- Linea sotto titolo 'Sommario' e moduloTitle: BorderStyle.SINGLE size 8 color #0078D4 space 4
- infoBox: sfondo #E8F0FB, bordo sinistro SINGLE size 12 color #0078D4, indent left 360 right 360
- Tabelle intestazione: sfondo #1F4E78, testo bianco
- Tabelle righe pari: sfondo #F5F8FC | righe dispari: #FFFFFF
- Tabelle bordi: SINGLE size 1 color #CCCCCC
- cantSplit: true su tutte le righe di tutte le tabelle

### Tab stop sommario
TabStopType.RIGHT position 8200 leader 'dot'

---

## IMMAGINI

Tutte le immagini sono nella cartella `img/`. Mapping figure → file:

| Figura | File | Dimensioni originali |
|---|---|---|
| Figura 1 | cloud-shell-powershell.png | 955×576 |
| Tabella 1 (strumenti Cloud Shell) | — (generata da codice) | — |
| Tabella 2 (struttura ARM) | — (generata da codice) | — |
| Figura 2 | entra-domain-services.png | 850×437 |
| Figura 3 | entra-users.png | 946×398 |
| Figura 4 | entra-groups.png | 940×378 |
| Figura 12 | Figura_12_Azure_Service_Categories.jpg | 460×204 |
| Figura 13 | Figura_13_Azure_Account_Scope_Levels.jpg | 460×298 |
| Figura 14 | Figura_14_Azure_Physical_Infrastructure.jpg | 580×212 |
| Figura 15 | Figura_15_Availability_Zones_in_a_Region.jpg | 460×233 |
| Figura 16 | Figura_16_Azure_Service_Categories_for_AZ.jpg | 460×219 |
| Figura 17 | Figura_17_Azure_Region_Pairs.jpg | 460×241 |
| Figura 18 | Figura_18_Resource_Group_Rules.jpg | 460×180 |
| Figura 19 | Figura_19_Management_Group_Hierarchy.jpg | 460×277 |
| Figura 20 | Figura_20_Azure_Subscription_Boundaries.jpg | 460×204 |
| Figura 21 | cloud-governance-steps.png | 2031×278 |
| Figura 22 | azure-governance-hierarchy.png | 1459×955 |
| Figura 23 | azure-policy-arm.png | 1853×964 |
| Figura 24 | rbac-security-principal.png | 357×134 |
| Figura 25 | rbac-role-definition.png | 537×352 |
| Figura 26 | rbac-roles-hierarchy.png | 895×598 |
| Figura 27 | rbac-iam-portal.png | 1069×708 |
| Figura 28 | ip-addressing.png | 850×138 |
| Figura 29 | nsg-portal.png | 861×191 |
| Figura 30 | nsg-inbound-rules.png | 858×247 |
| Figura 31 | nsg-outbound-rules.png | 858×236 |
| Figura 32 | nsg-multiple.png | 650×478 |
| Figura 33 | nsg-effective-rules.png | 859×65 |
| Figura 34 | asg-diagram.png | 320×274 (ridimensionata da 547×468) |

---

## CONTENUTO DEL DOCUMENTO

---

### PAGINA 1 — COPERTINA

**AZ-104** _(Calibri 48pt grassetto #1B3A6B centrato)_

**Amministratore di Microsoft Azure** _(Calibri 26pt grassetto #0078D4 centrato)_

_Note di studio e riassunti del percorso di apprendimento Microsoft Learn_ _(Calibri 13pt corsivo #555555 centrato)_

---

### PAGINA 2 — SOMMARIO
_(Titolo 'Sommario' Calibri 18pt #1B3A6B con linea blu sotto)_

**Prerequisiti per gli amministratori di Azure** _(tocMacro: #1B3A6B 12pt grassetto)_

&nbsp;&nbsp;**1.1 — Introduzione ad Azure Cloud Shell** _(tocHeading: #0078D4 11pt grassetto)_
&nbsp;&nbsp;&nbsp;&nbsp;1.1.1 — Introduzione ........... ...
&nbsp;&nbsp;&nbsp;&nbsp;1.1.2 — Che cos'è Azure Cloud Shell? ........... ...
&nbsp;&nbsp;&nbsp;&nbsp;1.1.3 — Come funziona Azure Cloud Shell? ........... ...
&nbsp;&nbsp;&nbsp;&nbsp;1.1.4 — Quando è consigliabile usare Azure Cloud Shell? ........... ...
&nbsp;&nbsp;**1.2 — Distribuire l'infrastruttura con i modelli ARM JSON** _(tocHeading: #0078D4 11pt grassetto)_
&nbsp;&nbsp;&nbsp;&nbsp;1.2.1 — Introduzione ........... ...
&nbsp;&nbsp;&nbsp;&nbsp;1.2.2 — Esplorare la struttura dei modelli di Azure Resource Manager ........... ...
&nbsp;&nbsp;&nbsp;&nbsp;1.2.3 — Esercizio — Creare e distribuire un modello ARM ........... ...
&nbsp;&nbsp;&nbsp;&nbsp;1.2.4 — Aggiungere flessibilità al modello ARM con parametri e output ........... ...
&nbsp;&nbsp;&nbsp;&nbsp;1.2.5 — Esercizio — Aggiungere parametri e output al modello ARM ........... ...
**Gestire identità e governance in Azure** _(tocMacro: #1B3A6B 12pt grassetto)_

&nbsp;&nbsp;**2.1 — Conoscere Microsoft Entra ID** _(tocHeading: #0078D4 11pt grassetto)_
&nbsp;&nbsp;&nbsp;&nbsp;2.1.1 — Introduzione ........... ...
&nbsp;&nbsp;&nbsp;&nbsp;2.1.2 — Esaminare Microsoft Entra ID ........... ...
&nbsp;&nbsp;&nbsp;&nbsp;2.1.3 — Confronto tra Microsoft Entra ID e Active Directory Domain Services ........... ...
&nbsp;&nbsp;&nbsp;&nbsp;2.1.4 — Esaminare Microsoft Entra ID come servizio directory per le app cloud ........... ...
&nbsp;&nbsp;&nbsp;&nbsp;2.1.5 — Confrontare i piani P1 e P2 di Microsoft Entra ID ........... ...
&nbsp;&nbsp;&nbsp;&nbsp;2.1.6 — Esaminare Microsoft Entra Domain Services ........... ...
&nbsp;&nbsp;**2.2 — Creare, configurare e gestire identità** _(tocHeading: #0078D4 11pt grassetto)_
&nbsp;&nbsp;&nbsp;&nbsp;2.2.1 — Creare, configurare e gestire utenti ........... ...
&nbsp;&nbsp;&nbsp;&nbsp;2.2.2 — Esercizio — Assegnare le licenze agli utenti ........... ...
&nbsp;&nbsp;&nbsp;&nbsp;2.2.3 — Esercizio — Ripristinare o rimuovere gli utenti eliminati ........... ...
&nbsp;&nbsp;&nbsp;&nbsp;2.2.4 — Creare, configurare e gestire gruppi ........... ...
&nbsp;&nbsp;&nbsp;&nbsp;2.2.5 — Esercizio — Aggiungere gruppi in Microsoft Entra ID ........... ...
&nbsp;&nbsp;&nbsp;&nbsp;2.2.6 — Configurare e gestire la registrazione dei dispositivi ........... ...
&nbsp;&nbsp;&nbsp;&nbsp;2.2.7 — Gestire le licenze ........... ...
&nbsp;&nbsp;&nbsp;&nbsp;2.2.8 — Esercizio — Modificare le assegnazioni di licenze di gruppo ........... ...
&nbsp;&nbsp;&nbsp;&nbsp;2.2.9 — Esercizio — Modificare le assegnazioni di licenze utente ........... ...
&nbsp;&nbsp;&nbsp;&nbsp;2.2.10 — Creare attributi di sicurezza personalizzati ........... ...
&nbsp;&nbsp;&nbsp;&nbsp;2.2.11 — Esplorare la creazione automatica degli utenti ........... ...
&nbsp;&nbsp;**2.3 — Descrivere i componenti architetturali principali di Azure** _(tocHeading: #0078D4 11pt grassetto)_
&nbsp;&nbsp;&nbsp;&nbsp;2.3.1 — Introduzione ........... ...
&nbsp;&nbsp;&nbsp;&nbsp;2.3.2 — Che cos'è Microsoft Azure ........... ...
&nbsp;&nbsp;&nbsp;&nbsp;2.3.3 — Introduzione agli account Azure ........... ...
&nbsp;&nbsp;&nbsp;&nbsp;2.3.4 — Descrivere l'infrastruttura fisica di Azure ........... ...
&nbsp;&nbsp;&nbsp;&nbsp;2.3.5 — Descrivere l'infrastruttura di gestione di Azure ........... ...
&nbsp;&nbsp;&nbsp;&nbsp;_Riepilogo_ ........... ...

&nbsp;&nbsp;**2.4 — Iniziative di Criteri di Azure** _(tocHeading: #0078D4 11pt grassetto)_
&nbsp;&nbsp;&nbsp;&nbsp;2.4.1 — Introduzione ........... ...
&nbsp;&nbsp;&nbsp;&nbsp;2.4.2 — Cloud Adoption Framework for Azure ........... ...
&nbsp;&nbsp;&nbsp;&nbsp;2.4.3 — Principi di progettazione di Azure Policy ........... ...
&nbsp;&nbsp;&nbsp;&nbsp;2.4.4 — Risorse di Azure Policy ........... ...
&nbsp;&nbsp;&nbsp;&nbsp;2.4.5 — Definizioni di Azure Policy ........... ...
&nbsp;&nbsp;&nbsp;&nbsp;2.4.6 — Valutazione delle risorse tramite Azure Policy ........... ...
&nbsp;&nbsp;**2.5 — Proteggere le risorse con Azure RBAC** _(tocHeading: #0078D4 11pt grassetto)_
&nbsp;&nbsp;&nbsp;&nbsp;2.5.1 — Introduzione ........... ...
&nbsp;&nbsp;&nbsp;&nbsp;2.5.2 — Che cos'è il controllo degli accessi in base al ruolo di Azure? ........... ...
&nbsp;&nbsp;**2.6 — Reimpostazione della password self-service (SSPR)** _(tocHeading: #0078D4 11pt grassetto)_
&nbsp;&nbsp;&nbsp;&nbsp;2.6.1 — Introduzione ........... ...
&nbsp;&nbsp;&nbsp;&nbsp;2.6.2 — Che cos'è la reimpostazione autonoma della password in Microsoft Entra ID? ........... ...
&nbsp;&nbsp;&nbsp;&nbsp;2.6.3 — Implementare la reimpostazione della password self-service di Microsoft Entra ........... ...
**Configurare e gestire reti virtuali per amministratori di Azure** _(tocMacro: #1B3A6B 12pt grassetto)_

&nbsp;&nbsp;**3.1 — Configurare reti virtuali** _(tocHeading: #0078D4 11pt grassetto)_
&nbsp;&nbsp;&nbsp;&nbsp;3.1.1 — Introduzione ........... ...
&nbsp;&nbsp;&nbsp;&nbsp;3.1.2 — Pianificare le reti virtuali ........... ...
&nbsp;&nbsp;&nbsp;&nbsp;3.1.3 — Creare subnet ........... ...
&nbsp;&nbsp;&nbsp;&nbsp;3.1.4 — Creare reti virtuali ........... ...
&nbsp;&nbsp;&nbsp;&nbsp;3.1.5 — Pianificare l'indirizzamento IP ........... ...
&nbsp;&nbsp;&nbsp;&nbsp;3.1.6 — Creare indirizzi IP pubblici ........... ...
&nbsp;&nbsp;&nbsp;&nbsp;3.1.7 — Associare indirizzi IP pubblici ........... ...
&nbsp;&nbsp;&nbsp;&nbsp;3.1.8 — Allocare o assegnare indirizzi IP privati ........... ...
&nbsp;&nbsp;**3.2 — Configurare i gruppi di sicurezza di rete** _(tocHeading: #0078D4 11pt grassetto)_
&nbsp;&nbsp;&nbsp;&nbsp;3.2.1 — Introduzione ........... ...
&nbsp;&nbsp;&nbsp;&nbsp;3.2.2 — Implementare i gruppi di sicurezza di rete ........... ...
&nbsp;&nbsp;&nbsp;&nbsp;3.2.3 — Determinare le regole dei gruppi di sicurezza di rete ........... ...
&nbsp;&nbsp;&nbsp;&nbsp;3.2.4 — Determinare le regole effettive dei gruppi di sicurezza di rete ........... ...
&nbsp;&nbsp;&nbsp;&nbsp;3.2.5 — Creare regole del gruppo di sicurezza di rete ........... ...
&nbsp;&nbsp;&nbsp;&nbsp;3.2.6 — Implementare gruppi di sicurezza delle applicazioni ........... ...
**Implementare e gestire l'archiviazione in Azure** _(tocMacro: #1B3A6B 12pt grassetto)_

**Distribuire e gestire risorse di calcolo di Azure** _(tocMacro: #1B3A6B 12pt grassetto)_

**Monitorare ed eseguire il backup delle risorse di Azure** _(tocMacro: #1B3A6B 12pt grassetto)_


---

### PAGINA 3 — MACRO MODULO 1


# Prerequisiti per gli amministratori di Azure
_(moduloTitle: Calibri 24pt grassetto #1B3A6B, bordo blu sotto, pageBreakBefore)_

_Questo percorso introduce i fondamenti operativi per lavorare come amministratore di Microsoft Azure, con focus sugli strumenti di gestione interattiva e sull'automazione dell'infrastruttura tramite template dichiarativi._


## 1.1 — Introduzione ad Azure Cloud Shell
_(h2: Calibri 14pt grassetto #0078D4 keepNext)_


### 1.1.1 — Che cos'è Azure Cloud Shell?
_(h3: Calibri 12pt grassetto #2D5F8A keepNext)_

Azure Cloud Shell è un ambiente shell interattivo e autenticato accessibile direttamente dal browser, senza necessità di installare nulla in locale. Supporta sia Bash che PowerShell e si integra nativamente con la sottoscrizione Azure dell'utente.

![imgCloudShell](img/imgCloudShell) _(dimensioni: 955×576 px)_

*Figura 1 — Sessione di Azure Cloud Shell in modalità PowerShell all'interno del portale di Azure.* _(caption: Calibri 9pt corsivo grigio centrato)_


### 1.1.2 — Come funziona Azure Cloud Shell?
_(h3: Calibri 12pt grassetto #2D5F8A keepNext)_

- Viene eseguita in un container temporaneo su un host gestito da Microsoft.
- Ogni sessione riceve un ambiente fresco; i file persistono solo nel File Share di Azure collegato (Azure CloudDrive).
- Ha accesso diretto agli strumenti pre-installati: Azure CLI, Azure PowerShell, kubectl, Terraform, git e molti altri.
- L'autenticazione è automatica tramite le credenziali della sessione Azure già attiva.

### 1.1.3 — Quando è consigliabile usare Azure Cloud Shell?
_(h3: Calibri 12pt grassetto #2D5F8A keepNext)_

Cloud Shell è la scelta ideale quando si lavora da un dispositivo senza strumenti Azure installati, si vogliono eseguire script occasionali senza configurare un ambiente locale, oppure si desidera un accesso rapido e sicuro alla CLI da qualsiasi browser.

[TABELLA: toolsTable] _(tabella generata da codice — vedere JS per la struttura)_

*Tabella 1 — Strumenti disponibili in una sessione Cloud Shell.* _(caption: Calibri 9pt corsivo grigio centrato)_


## 1.2 — Distribuire l'infrastruttura con i modelli ARM JSON
_(h2: Calibri 14pt grassetto #0078D4 keepNext)_


### 1.2.1 — Struttura dei modelli di Azure Resource Manager
_(h3: Calibri 12pt grassetto #2D5F8A keepNext)_

L'infrastruttura come codice (IaC) consente di descrivere tramite codice l'intera infrastruttura necessaria per un'applicazione, gestendola insieme al codice applicativo in un repository centrale. I vantaggi principali sono:

- Configurazioni coerenti — ogni distribuzione produce lo stesso risultato, eliminando la deriva della configurazione.
- Scalabilità migliorata — è semplice replicare ambienti identici (dev, test, prod) senza lavoro manuale.
- Distribuzioni più veloci — Resource Manager crea le risorse in parallelo dove possibile.
- Migliore tracciabilità — ogni modifica al template è tracciata nel sistema di controllo versione (es. Git).
- Idempotenza — distribuire lo stesso template più volte produce sempre lo stesso stato finale, senza duplicati.
Un modello ARM è un file JSON che usa sintassi dichiarativa: si descrive cosa distribuire, non come farlo passo per passo. Resource Manager interpreta il file e gestisce l'orchestrazione. Gli elementi del file modello sono:

[TABELLA: armStructureTable] _(tabella generata da codice — vedere JS per la struttura)_

*Tabella 2 — Elementi di un file modello ARM (* = obbligatorio).* _(caption: Calibri 9pt corsivo grigio centrato)_

Esempio di template ARM completo per la distribuzione di un account di archiviazione:

    {
      "$schema": "https://schema.management.azure.com/schemas/2019-04-01/deploymentTemplate.json#",
      "contentVersion": "1.0.0.1",
      "parameters": {},
      "variables": {},
      "functions": [],
      "resources": [
        {
          "type": "Microsoft.Storage/storageAccounts",
          "apiVersion": "2025-01-01",
          "name": "learntemplatestorage123",
          "location": "westus",
          "sku": { "name": "Standard_LRS" },
          "kind": "StorageV2",
          "properties": { "supportsHttpsTrafficOnly": true }
        }
      ],
      "outputs": {}
    }
Aggiungere risorse al modello significa popolare la sezione resources con gli oggetti che si vuole creare in Azure. Per ogni risorsa occorre indicare il provider e il tipo nel formato {provider}/{tipo}, la versione dell'API (apiVersion) e le proprietà specifiche. I provider seguono la logica del servizio Azure: Microsoft.Storage per lo storage, Microsoft.Compute per le VM, Microsoft.Network per le reti e così via.

Alcune risorse dipendono da altre per funzionare: in questi casi si usa la proprietà dependsOn per dire ad Azure Resource Manager l'ordine di creazione. Ad esempio, una Azure Function App richiede obbligatoriamente tre risorse nel template:

- Microsoft.Storage/storageAccounts — lo storage account, usato dalla Function App per trigger, log e stato interno.
- Microsoft.Web/serverfarms — il piano di hosting (Consumption, Premium o Dedicated).
Resource Manager legge le dipendenze e crea le risorse nell'ordine corretto, in parallelo dove possibile. Questo è uno dei vantaggi principali dei template rispetto agli script imperativi: basta dichiarare cosa si vuole e le relazioni tra le risorse, il resto lo gestisce Azure.


### 1.2.2 — Esercizio: Creare e distribuire un modello ARM
_(h3: Calibri 12pt grassetto #2D5F8A keepNext)_


**Setup ambiente** _(stepTitle: Calibri 11pt grassetto #000000 keepNext)_

- Installare PowerShell 7 (versione x64) da aka.ms/powershell.
- In VS Code, installare l'estensione PowerShell di Microsoft: Ctrl+P → ext install powershell.
- Impostare PowerShell 7 come shell di default: Ctrl+Shift+P → PowerShell: Show Session Menu.
- Installare il modulo Az da terminale PS7:
    Install-Module -Name Az -Scope CurrentUser -Repository PSGallery -Force

**Login ad Azure** _(stepTitle: Calibri 11pt grassetto #000000 keepNext)_

- Eseguire il login con device code flow (utile quando il browser non si apre automaticamente):
    Connect-AzAccount -UseDeviceAuthentication
- Aprire manualmente https://microsoft.com/devicelogin e inserire il codice mostrato nel terminale.

**Preparazione Resource Group** _(stepTitle: Calibri 11pt grassetto #000000 keepNext)_

- Creare il resource group rsg-1 in Italy North (da portale o da PS7):
    New-AzResourceGroup -Name "rsg-1" -Location "Italy North"
- Nota: il valore di -Location con spazio va tra virgolette.
- Impostare il resource group di default per evitare di specificarlo ad ogni comando:
    Set-AzDefault -ResourceGroupName "rsg-1"

**ARM Template — Fase 1: Template vuoto** _(stepTitle: Calibri 11pt grassetto #000000 keepNext)_

- Creare il file azuredeploy.json in VS Code con la struttura base:
    {
      "$schema": "https://schema.management.azure.com/schemas/2019-04-01/deploymentTemplate.json#",
      "contentVersion": "1.0.0.0",
      "parameters": {},
      "functions": [],
      "variables": {},
      "resources": [],
      "outputs": {}
    }
- Distribuire il template vuoto su Azure:
    $templateFile = "azuredeploy.json"
    $today = Get-Date -Format "MM-dd-yyyy"
    $deploymentName = "blanktemplate-" + $today
    New-AzResourceGroupDeployment -Name $deploymentName -TemplateFile $templateFile
- Verificare l'esito: ProvisioningState: Succeeded nel terminale. Sul portale: Gruppi di risorse → rsg-1 → Distribuzioni.

**ARM Template — Fase 2: Aggiunta Storage Account** _(stepTitle: Calibri 11pt grassetto #000000 keepNext)_

- Aggiornare azuredeploy.json aggiungendo una risorsa nella sezione resources. Il nome deve essere univoco globale, solo minuscole e numeri, 3-24 caratteri:
    "resources": [
      {
        "type": "Microsoft.Storage/storageAccounts",
        "apiVersion": "2025-01-01",
        "name": "nomeunico123",
        "tags": { "displayName": "nomeunico123" },
        "location": "[resourceGroup().location]",
        "kind": "StorageV2",
        "sku": { "name": "Standard_LRS" }
      }
    ]
- Ridistribuire il template con un nuovo nome di deployment:
    $templateFile = "azuredeploy.json"
    $today = Get-Date -Format "MM-dd-yyyy"
    $deploymentName = "addstorage-" + $today
    New-AzResourceGroupDeployment -Name $deploymentName -TemplateFile $templateFile
- Verificare sul portale: Gruppi di risorse → rsg-1 → Distribuzioni → 2 deployment riusciti + storage account visibile tra le risorse.

### 1.2.3 — Parametri e output nei modelli ARM
_(h3: Calibri 12pt grassetto #2D5F8A keepNext)_

I parametri rendono il template riutilizzabile: invece di scrivere valori fissi nel JSON, li si riceve dall'esterno al momento della distribuzione. Gli output invece espongono valori prodotti dalla distribuzione (es. endpoint, ID risorse) verso sistemi esterni o step successivi di una pipeline.


**Parametri — concetti base** _(stepTitle: Calibri 11pt grassetto #000000 keepNext)_

Ogni parametro viene dichiarato nella sezione parameters con tipo, vincoli opzionali e descrizione:

- type — tipo del valore: string, int, bool, object, array, secureString, secureObject.
- minLength / maxLength — lunghezza minima e massima per le stringhe.
- defaultValue — valore usato se non ne viene passato uno.
- allowedValues — lista di valori accettati; se si passa un valore fuori lista la distribuzione fallisce in fase di validazione, prima ancora di creare risorse.
- metadata.description — descrizione leggibile del parametro, utile per documentazione e IntelliSense in VS Code.

**Esempio 1 — Parametro per il nome dello storage account** _(stepTitle: Calibri 11pt grassetto #000000 keepNext)_

Aggiungere un parametro storageName per rendere dinamico il nome della risorsa. Il nome deve essere univoco globalmente in Azure, solo minuscole e numeri, tra 3 e 24 caratteri:

    "parameters": {
      "storageName": {
        "type": "string",
        "minLength": 3,
        "maxLength": 24,
        "metadata": {
          "description": "The name of the Azure storage resource"
        }
      }
    },
Per usare il parametro nella sezione resources si usa la funzione parameters():

Per distribuire passando il valore del parametro da PowerShell:

    $today = Get-Date -Format "MM-dd-yyyy"
    $deploymentName = "addnameparameter-" + $today
    New-AzResourceGroupDeployment `
      -Name $deploymentName `
      -TemplateFile $templateFile `
      -storageName {your-unique-name}

**Esempio 2 — Parametro con allowedValues per limitare lo SKU** _(stepTitle: Calibri 11pt grassetto #000000 keepNext)_

    "storageSKU": {
      "type": "string",
      "defaultValue": "Standard_LRS",
      "allowedValues": [
        "Standard_LRS",
        "Standard_GRS",
        "Standard_RAGRS",
        "Standard_ZRS",
        "Premium_LRS",
        "Premium_ZRS",
        "Standard_GZRS",
        "Standard_RAGZRS"
      ]
    }
Usare il parametro nella sezione sku della risorsa:

Distribuzione con SKU valido (Standard_GRS) — ha esito positivo:

    New-AzResourceGroupDeployment `
      -Name "addSkuParameter-$today" `
      -TemplateFile $templateFile `
      -storageName {your-unique-name} `
      -storageSKU Standard_GRS
Distribuzione con SKU non consentito (Basic) — ha esito negativo con errore di validazione:

    New-AzResourceGroupDeployment `
      -Name "addSkuParameter-$today" `
      -TemplateFile $templateFile `
      -storageName {your-unique-name} `
      -storageSKU Basic

**Esempio 3 — Output per esporre gli endpoint dello storage** _(stepTitle: Calibri 11pt grassetto #000000 keepNext)_

Gli output permettono di recuperare valori generati dalla distribuzione. In questo esempio si espone l'oggetto primaryEndpoints dello storage account usando la funzione reference(), che legge le proprietà della risorsa appena creata:

    "outputs": {
      "storageEndpoint": {
        "type": "object",
      }
    }
Distribuire il template e osservare l'output nel terminale:

    $deploymentName = "addOutputs-" + $today
    New-AzResourceGroupDeployment `
      -Name $deploymentName `
      -TemplateFile $templateFile `
      -storageName {your-unique-name} `
      -storageSKU Standard_LRS
Al termine della distribuzione, PowerShell mostra nel terminale l'oggetto JSON con gli endpoint primari (blob, file, queue, table). Gli stessi output sono consultabili anche dal portale Azure: Gruppi di risorse → rsg-1 → Distribuzioni → addOutputs → Output.

---

### PAGINA 1 — COPERTINA

**AZ-104** _(Calibri 48pt grassetto #1B3A6B centrato)_

**Amministratore di Microsoft Azure** _(Calibri 26pt grassetto #0078D4 centrato)_

_Note di studio e riassunti del percorso di apprendimento Microsoft Learn_ _(Calibri 13pt corsivo #555555 centrato)_


# Gestire identità e governance in Azure
_(moduloTitle: Calibri 24pt grassetto #1B3A6B, bordo blu sotto, pageBreakBefore)_

_Questo percorso affronta la gestione delle identità digitali e la governance dell'infrastruttura Azure. Una corretta configurazione di identità, accessi e policy è fondamentale per sicurezza e conformità._


## 2.1 — Conoscere Microsoft Entra ID
_(h2: Calibri 14pt grassetto #0078D4 keepNext)_


### 2.1.1 — Esaminare Microsoft Entra ID
_(h3: Calibri 12pt grassetto #2D5F8A keepNext)_

Microsoft Entra ID (precedentemente Azure Active Directory) è il servizio di gestione delle identità e degli accessi basato su cloud di Microsoft. Consente a dipendenti, partner ed utenti di accedere in modo sicuro a risorse esterne (Microsoft 365, portale Azure, SaaS) e interne (app sulla rete aziendale e in cloud).

- Non è la versione cloud di Active Directory Domain Services (AD DS) — sono servizi distinti con scopi diversi.
- Può essere usato da organizzazioni di qualsiasi dimensione, anche senza infrastruttura on-premise.
- Ogni tenant Azure ha automaticamente un tenant Entra ID associato.

**Entra ID è un servizio PaaS** _(stepTitle: Calibri 11pt grassetto #000000 keepNext)_

Entra ID fa parte dell'offerta PaaS (Platform as a Service) di Azure: è un servizio di directory interamente gestito da Microsoft nel cloud. Non richiede di distribuire VM, installare controller di dominio o applicare patch. Microsoft si occupa di disponibilità, scalabilità e manutenzione. Il livello base è incluso gratuitamente in ogni sottoscrizione Azure; le funzionalità avanzate richiedono i piani P1 o P2.

Le principali operazioni che si possono gestire tramite Entra ID includono:

- Configurazione dell'accesso alle applicazioni e Single Sign-On (SSO) per app SaaS cloud.
- Gestione di utenti, gruppi e provisioning automatico.
- Abilitazione della federazione tra organizzazioni e autenticazione a più fattori (MFA).
- Identificazione delle attività di accesso irregolari e configurazione dell'accesso condizionale.
- Estensione delle implementazioni AD DS on-premise tramite Microsoft Entra Connect.
- Configurazione di Application Proxy per esporre app interne all'esterno in modo sicuro.

**Il concetto di Tenant** _(stepTitle: Calibri 11pt grassetto #000000 keepNext)_

Un tenant rappresenta una singola istanza di Microsoft Entra ID associata a un'organizzazione. È il confine di sicurezza e il contenitore per tutti gli oggetti Entra ID: utenti, gruppi, applicazioni e dispositivi.

- A ogni tenant viene assegnato automaticamente un dominio DNS predefinito nel formato prefisso.onmicrosoft.com. È possibile aggiungere domini personalizzati (es. azienda.com).
- Una sottoscrizione Azure è associata a un solo tenant Entra ID alla volta, ma lo stesso tenant può essere associato a più sottoscrizioni.
- È possibile creare più tenant all'interno di una stessa organizzazione, ad esempio per ambienti di test isolati.
- Entra ID è la directory multi-tenant più grande del mondo: oltre un milione di istanze e miliardi di autenticazioni settimanali.

**Schema di Entra ID vs AD DS** _(stepTitle: Calibri 11pt grassetto #000000 keepNext)_

Lo schema di Entra ID è più semplice e flessibile rispetto a quello di AD DS, ed è ottimizzato per le identità cloud:

- Nessuna classe OU (Organizational Unit) — non è possibile organizzare oggetti in gerarchie di contenitori. L'organizzazione avviene tramite gruppi e appartenenza dinamica.
- Nessuna classe Computer — solo la classe Device, con un processo di join diverso da AD DS (Azure AD Join o Hybrid Join).
- Nessun GPO (Group Policy Object) — la gestione dei dispositivi avviene tramite soluzioni moderne come Microsoft Intune.
- Classi Application e ServicePrincipal — ogni app registrata in Entra ID crea un oggetto Application (definizione) e un ServicePrincipal (istanza nel tenant). Questo permette di registrare un'app una volta e usarla in più tenant.
- Lo schema è estendibile e le estensioni sono completamente reversibili, a differenza di AD DS.

### 2.1.2 — Confronto tra Microsoft Entra ID e Active Directory Domain Services
_(h3: Calibri 12pt grassetto #2D5F8A keepNext)_

AD DS è un servizio di directory tradizionale on-premise basato su protocolli Kerberos e LDAP, progettato per gestire oggetti in una rete locale. Microsoft Entra ID è invece un servizio cloud basato su HTTP/HTTPS, OAuth 2.0 e SAML, pensato per identità distribuite su internet.

- AD DS usa strutture gerarchiche (foreste, domini, OU); Entra ID usa un modello flat con tenant.
- AD DS gestisce computer, stampanti e criteri di gruppo (GPO); Entra ID non supporta GPO nativamente.
- Entra ID supporta autenticazione moderna: OAuth 2.0, OpenID Connect, SAML — protocolli non disponibili in AD DS.
- I due servizi possono coesistere in ambienti ibridi tramite Microsoft Entra Connect (sincronizzazione delle identità).

### 2.1.3 — Esaminare Microsoft Entra ID come servizio directory per le app cloud
_(h3: Calibri 12pt grassetto #2D5F8A keepNext)_

Microsoft Entra ID è il sistema di identità nativo per le applicazioni cloud e SaaS. Le applicazioni si registrano nel tenant Entra ID e ottengono un'identità (App Registration) con cui possono autenticare utenti, richiedere permessi e accedere ad altre risorse Azure tramite token OAuth 2.0.

- Single Sign-On (SSO) — un utente accede una volta sola e può usare tutte le app integrate senza reinserire le credenziali.
- Supporto per migliaia di app SaaS pre-integrate nella galleria di Entra ID (Salesforce, ServiceNow, GitHub, ecc.).
- Le app possono essere registrate manualmente per ottenere Client ID e Client Secret da usare nei flussi OAuth.

### 2.1.4 — Confrontare i piani P1 e P2 di Microsoft Entra ID
_(h3: Calibri 12pt grassetto #2D5F8A keepNext)_

Microsoft Entra ID è disponibile in quattro livelli. I piani a pagamento aggiungono funzionalità avanzate di sicurezza e governance:

- Free — gestione utenti e gruppi di base, SSO per massimo 10 app, autenticazione MFA.
- Microsoft 365 Apps — include le funzionalità Free più gestione delle identità per le app Microsoft 365.
- P1 (Premium 1) — aggiunge accesso condizionale, gruppi dinamici, self-service password reset (SSPR) on-premise, e Hybrid Entra ID Join.
- P2 (Premium 2) — include tutto P1 più Entra ID Protection (rilevamento rischi e utenti compromessi) e Privileged Identity Management (PIM) per l'assegnazione JIT dei ruoli privilegiati.

### 2.1.5 — Esaminare Microsoft Entra Domain Services
_(h3: Calibri 12pt grassetto #2D5F8A keepNext)_

Microsoft Entra Domain Services (Entra DS) è un servizio gestito che fornisce funzionalità di dominio tradizionali (join al dominio, criteri di gruppo, LDAP, Kerberos/NTLM) senza dover distribuire, gestire o applicare patch a domain controller. È utile per eseguire in cloud applicazioni legacy che non supportano autenticazione moderna.

- Microsoft gestisce i domain controller: alta disponibilità, backup e aggiornamenti sono automatici.
- Si sincronizza unidirezionalmente da Microsoft Entra ID: utenti e gruppi di Entra ID sono disponibili nel dominio gestito.
- Non è possibile estendere lo schema del dominio gestito né creare OU personalizzate con piena libertà come in AD DS on-premise.
- Caso d'uso tipico: lift-and-shift di applicazioni legacy su Azure VM che richiedono LDAP o Kerberos, senza mantenere DC on-premise.
![imgEntraDS](img/imgEntraDS) _(dimensioni: 850×437 px)_

*Figura 2 — Microsoft Entra Domain Services fornisce un dominio gestito nella VNet di Azure, sincronizzato da Microsoft Entra ID.* _(caption: Calibri 9pt corsivo grigio centrato)_


**Vantaggi principali** _(stepTitle: Calibri 11pt grassetto #000000 keepNext)_

- Gli amministratori non devono gestire, aggiornare o monitorare i domain controller.
- Non è necessario distribuire e gestire la replica di Active Directory.
- Non servono i gruppi Domain Admins o Enterprise Admins per i domini gestiti.

**Limitazioni da tenere in considerazione** _(stepTitle: Calibri 11pt grassetto #000000 keepNext)_

- È supportato solo l'oggetto Active Directory Computer di base — lo schema non è estendibile.
- La struttura delle OU è flat: le unità organizzative nidificate non sono supportate.
- Esiste un solo GPO predefinito per account utente e computer; non è possibile usare filtri WMI o filtri per gruppi di sicurezza.
- Non è possibile fare riferimento a OU con GPO personalizzati.

## 2.2 — Creare, configurare e gestire identità
_(h2: Calibri 14pt grassetto #0078D4 keepNext)_


### 2.2.1 — Creare, configurare e gestire utenti
_(h3: Calibri 12pt grassetto #2D5F8A keepNext)_

Ogni utente che deve accedere alle risorse Azure necessita di un account in Microsoft Entra ID. L'account contiene tutte le informazioni per autenticare l'utente durante il login. Dopo l'autenticazione, Entra ID compila un token di accesso che autorizza l'utente e determina a quali risorse può accedere e cosa può fare con esse.


**Tipi di identità utente** _(stepTitle: Calibri 11pt grassetto #000000 keepNext)_

- Identità cloud — questi utenti esistono solo in Microsoft Entra ID, senza alcuna controparte on-premise. Includono gli account amministratore e tutti gli utenti creati e gestiti direttamente nel portale Entra. Se l'account viene eliminato dalla directory principale viene rimosso definitivamente. L'origine mostrata nel portale è Microsoft Entra ID oppure External Microsoft Entra Directory se l'utente è definito in un altro tenant Entra ma deve accedere alle risorse di questa directory.
- Identità sincronizzate con directory — questi utenti esistono in un'Active Directory on-premise e vengono resi disponibili in Entra ID tramite sincronizzazione. Sono riconoscibili perché la loro origine nel portale è Windows Server AD. Lo strumento raccomandato è Microsoft Entra Cloud Sync (agente leggero, cloud-managed, supporta foreste disconnesse); Microsoft Entra Connect Sync rimane disponibile per scenari complessi come la sincronizzazione dei dispositivi o gruppi con più di 50.000 membri.
- Utenti guest — identità esterne all'organizzazione, invitate tramite Microsoft Entra B2B (Business to Business). Possono essere account di altri provider cloud (Google, Facebook) o account Microsoft personali. L'origine nel portale è Utente invitato. Sono utili per fornitori, terzisti o partner che devono accedere temporaneamente a risorse aziendali. Quando la collaborazione termina, l'account guest può essere rimosso revocando tutti gli accessi associati senza impattare l'identità originale dell'utente nel suo tenant.
![imgEntraUsers](img/imgEntraUsers) _(dimensioni: 946×398 px)_

*Figura 3 — Visualizzazione degli utenti nel portale Microsoft Entra ID con tipo utente, UPN, paese e ruolo.* _(caption: Calibri 9pt corsivo grigio centrato)_


**Gestione degli account** _(stepTitle: Calibri 11pt grassetto #000000 keepNext)_

- UPN (User Principal Name) — identificatore univoco nel formato utente@dominio.com, usato per il login.
- Gli account possono essere creati singolarmente dal portale, in blocco tramite CSV, o tramite PowerShell/CLI.
- Un utente eliminato rimane nel cestino per 30 giorni ed è ripristinabile; dopo 30 giorni viene eliminato definitivamente.
- A ogni utente si assegnano licenze Microsoft 365 / Entra ID direttamente o tramite appartenenza a gruppi.

### 2.2.2 — Creare, configurare e gestire gruppi
_(h3: Calibri 12pt grassetto #2D5F8A keepNext)_

I gruppi in Entra ID permettono di gestire l'accesso a risorse e applicazioni in modo centralizzato. Esistono due tipi principali:

- Gruppi di sicurezza — usati per controllare l'accesso a risorse Azure, applicazioni e licenze.
- Gruppi Microsoft 365 — includono anche mailbox condivisa, calendario e sito SharePoint; usati per la collaborazione.
I gruppi possono avere tre modalità di appartenenza:

- Assegnata — i membri vengono aggiunti manualmente da un amministratore.
- Dinamica utente — i membri vengono aggiunti automaticamente in base a regole sulle proprietà utente (es. reparto, ruolo, paese). Richiede licenza Entra ID P1 o P2.
- Dinamica dispositivo — come la dinamica utente ma basata su proprietà dei dispositivi.
![imgEntraGroups](img/imgEntraGroups) _(dimensioni: 940×378 px)_

*Figura 4 — Visualizzazione dei gruppi nel portale Microsoft Entra ID con tipo gruppo (Security e Microsoft 365).* _(caption: Calibri 9pt corsivo grigio centrato)_


### 2.2.3 — Configurare e gestire la registrazione dei dispositivi
_(h3: Calibri 12pt grassetto #2D5F8A keepNext)_

Con la proliferazione dei dispositivi personali (BYOD) i team IT devono bilanciare due obiettivi opposti: consentire agli utenti di lavorare da qualsiasi dispositivo e ovunque, proteggendo allo stesso tempo le risorse aziendali. Microsoft Entra ID risolve questo problema tramite la gestione delle identità dei dispositivi, abilitando il Single Sign-On a dispositivi, app e servizi da qualsiasi posizione.

Esistono tre modalità di registrazione, ciascuna pensata per scenari diversi:


**1. Registrazione in Microsoft Entra ID (Workplace Join — BYOD)** _(stepTitle: Calibri 11pt grassetto #000000 keepNext)_

- Destinatari: utenti con dispositivi personali (smartphone, tablet, PC di casa) che devono accedere a risorse aziendali.
- Il dispositivo non richiede un account aziendale per il login locale — l'utente accede con le sue credenziali personali e aggiunge l'account aziendale separatamente.
- Sistemi operativi supportati: Windows 10+, macOS 10.15+, iOS 15+, Android, Linux (Ubuntu, RHEL).
- Gestione tramite Microsoft Intune (MDM) o criteri di protezione delle app (MAM).
- Scenario tipico: un dipendente vuole leggere la posta aziendale dal PC di casa. Aggiunge l'account aziendale nelle impostazioni di Windows — il dispositivo viene registrato e Intune applica i criteri richiesti (es. crittografia, complessità password).

**2. Aggiunta a Microsoft Entra ID (Entra Join — cloud-only)** _(stepTitle: Calibri 11pt grassetto #000000 keepNext)_

- Destinatari: organizzazioni cloud-first o cloud-only, senza infrastruttura AD DS on-premise.
- Il dispositivo richiede un account aziendale per il login — è un dispositivo di proprietà dell'organizzazione, gestito interamente nel cloud.
- Sistemi operativi supportati: Windows 10/11 (escluse edizioni Home), Windows Server 2019+ su Azure VM, macOS 13+ (anteprima).
- Gestione tramite Microsoft Intune o Configuration Manager in co-gestione.
- Supporta SSO sia alle risorse cloud che on-premise quando il dispositivo è in rete aziendale.
- Scenario tipico: lavoratori stagionali, collaboratori esterni, filiali remote senza infrastruttura locale, o aziende che vogliono eliminare completamente AD DS on-premise.

**3. Aggiunta ibrida a Microsoft Entra ID (Hybrid Join)** _(stepTitle: Calibri 11pt grassetto #000000 keepNext)_

- Destinatari: organizzazioni con Active Directory on-premise esistente che vogliono estendere le identità al cloud.
- Il dispositivo è membro del dominio AD DS locale ed è anche registrato in Entra ID — ottiene SSO sia per risorse cloud che on-premise.
- Sistemi operativi supportati: Windows 10/11 (escluse edizioni Home), Windows Server 2016/2019/2022.
- Gestione tramite Criteri di gruppo, Configuration Manager o co-gestione con Intune.
- Scenario tipico: aziende con app Win32 legacy che dipendono dall'autenticazione AD, o che vogliono continuare a usare Group Policy per la configurazione dei dispositivi.

**Cloud Kerberos Trust** _(stepTitle: Calibri 11pt grassetto #000000 keepNext)_

Il writeback dei dispositivi (Device Writeback) non è più supportato ed è stato sostituito da Cloud Kerberos Trust. Questo approccio consente ai dispositivi Entra Join e Hybrid Join di autenticarsi alle risorse on-premise senza dover scrivere oggetti dispositivo in Active Directory locale — semplificando la configurazione degli ambienti ibridi e abilitando Windows Hello for Business senza infrastruttura aggiuntiva.

La gestione dei dispositivi registrati avviene tramite Microsoft Intune (MDM) o criteri di accesso condizionale che verificano la conformità del dispositivo prima di concedere l'accesso.


### 2.2.4 — Gestire le licenze
_(h3: Calibri 12pt grassetto #2D5F8A keepNext)_

Le licenze Microsoft (Microsoft 365, Entra ID P1/P2, Dynamics 365, ecc.) si assegnano a ogni utente che deve accedere ai servizi a pagamento. Microsoft Entra ID è l'infrastruttura sottostante che archivia gli stati di assegnazione delle licenze. La gestione avviene tramite l'interfaccia di amministrazione di Microsoft 365 o tramite PowerShell e Microsoft Graph API.


**Assegnazione diretta vs basata su gruppo** _(stepTitle: Calibri 11pt grassetto #000000 keepNext)_

- Assegnazione diretta — la licenza viene assegnata singolarmente a ogni utente. Semplice ma difficile da scalare: aggiungere o rimuovere licenze per grandi organizzazioni richiederebbe script PowerShell complessi con chiamate individuali per ogni utente.
- Assegnazione basata su gruppo — la licenza viene assegnata a un gruppo; tutti i membri ricevono automaticamente la licenza. Quando un utente entra nel gruppo ottiene la licenza; quando viene rimosso la perde. Le modifiche sono valide entro pochi minuti.

**Requisiti per le licenze basate su gruppo** _(stepTitle: Calibri 11pt grassetto #000000 keepNext)_

Per usare la funzionalità di distribuzione automatica delle licenze tramite gruppo, il tenant deve avere almeno una sottoscrizione Entra ID P1 attiva. Questo non significa che ogni gruppo debba avere P1 — significa che quella funzionalità specifica (l'automatismo che distribuisce le licenze ai membri del gruppo) è una capacità avanzata di Entra ID disponibile solo dal piano P1 in su.

In pratica, le aziende medio-grandi sono operativamente obbligate ad avere P1: gestire manualmente le licenze per centinaia o migliaia di dipendenti — nuovi assunti, cambi di reparto, persone che lasciano l'azienda — sarebbe impossibile senza errori. Con P1 e i gruppi, tutto avviene automaticamente.

Le grandi aziende però raramente acquistano P1 separatamente, perché è già incluso nei bundle Microsoft 365 che usano comunque per lavorare:

- Microsoft 365 E3 → include Entra ID P1
- Microsoft 365 E5 → include Entra ID P2
Il numero di licenze disponibili nel tenant deve essere sufficiente a coprire tutti i membri univoci dei gruppi con licenza. Ad esempio, se 1.000 utenti fanno parte di gruppi con licenza, occorrono almeno 1.000 licenze.


**Funzionalità avanzate** _(stepTitle: Calibri 11pt grassetto #000000 keepNext)_

- Disabilitare piani di servizio specifici — quando si assegna una licenza a un gruppo è possibile disabilitare singoli servizi del prodotto. Ad esempio si può assegnare Microsoft 365 a un reparto disabilitando temporaneamente Viva Engage se l'organizzazione non è ancora pronta ad usarlo.
- Licenze da più origini — un utente può essere membro di più gruppi con licenza e avere anche licenze assegnate direttamente. Se riceve la stessa licenza da più origini, essa viene contata e usata una volta sola.
- Errori di assegnazione — se le licenze disponibili sono insufficienti o ci sono servizi in conflitto, Entra ID segnala gli utenti per cui l'assegnazione non è riuscita. Gli amministratori possono visualizzare questi errori nel portale e intraprendere azioni correttive.

**Posizione di utilizzo** _(stepTitle: Calibri 11pt grassetto #000000 keepNext)_

Alcuni servizi Microsoft non sono disponibili in tutte le aree geografiche. Prima di assegnare una licenza a un utente occorre impostare la posizione di utilizzo nel profilo utente. Per le licenze basate su gruppo, gli utenti senza posizione specificata ereditano la posizione della directory. È buona pratica impostare sempre la posizione di utilizzo al momento della creazione dell'utente, per evitare che ricevano servizi non disponibili nella loro area.


### 2.2.5 — Creare attributi di sicurezza personalizzati
_(h3: Calibri 12pt grassetto #2D5F8A keepNext)_

Gli attributi di sicurezza personalizzati (Custom Security Attributes) sono coppie chiave-valore definite dall'amministratore e specifiche per il tenant, che possono essere aggiunte a utenti, gruppi, applicazioni e service principal. Permettono di arricchire i profili delle identità con metadati aziendali e di usarli per filtrare oggetti o controllare l'accesso a risorse specifiche.


**Perché usarli — casi d'uso concreti** _(stepTitle: Calibri 11pt grassetto #000000 keepNext)_

- Estendere il profilo utente con informazioni aziendali sensibili — ad esempio aggiungere lo stipendio orario al profilo di ogni dipendente, visibile solo agli amministratori HR e non agli utenti stessi.
- Categorizzare migliaia di applicazioni registrate nel tenant per creare un inventario filtrabile utile a scopo di audit e governance.
- Controllare l'accesso a risorse Azure specifiche — ad esempio concedere l'accesso ai blob di Azure Storage solo agli utenti che hanno un determinato attributo (ABAC, Attribute-Based Access Control).
- Applicare governance degli attributi: definire chi può leggere e chi può scrivere ciascun attributo, con controllo granulare per set di attributi.

**Caratteristiche principali** _(stepTitle: Calibri 11pt grassetto #000000 keepNext)_

- Disponibili a livello di tenant — una volta definiti sono accessibili in tutta la directory.
- Tipi di dati supportati: booleano, intero, stringa.
- Supportano valori singoli o multipli sullo stesso attributo.
- Supportano valori in formato libero (inseriti dall'utente) o valori predefiniti (lista chiusa).
- Funzionano anche su utenti sincronizzati da Active Directory on-premise tramite Entra Connect o Cloud Sync.
- Differiscono dalle estensioni di directory: sono progettati specificamente per scenari di sicurezza e controllo degli accessi, con governance integrata.

**Limitazioni importanti** _(stepTitle: Calibri 11pt grassetto #000000 keepNext)_

- Non sono supportati in Microsoft Entra Domain Services.
- Non sono inclusi nelle attestazioni dei token SAML o nei JSON Web Token (JWT) — non possono quindi essere usati direttamente nelle applicazioni che leggono i token per decidere i permessi.

### 2.2.6 — Esplorare la creazione automatica degli utenti
_(h3: Calibri 12pt grassetto #2D5F8A keepNext)_

Il provisioning automatico degli utenti (SCIM Provisioning) permette di creare, aggiornare e disabilitare automaticamente gli account in applicazioni SaaS (Salesforce, ServiceNow, Workday, ecc.) in base agli account presenti in Entra ID, senza intervento manuale. La chiave è mantenere sempre aggiornati i sistemi di gestione delle identità: se un utente viene rimosso dal sistema HR, viene deprovisionato automaticamente da Entra ID, riducendo il rischio di account orfani e potenziali violazioni.


**I 4 componenti del processo SCIM** _(stepTitle: Calibri 11pt grassetto #000000 keepNext)_

- Sistema HCM (Human Capital Management) — applicazioni HR come Workday o SAP SuccessFactors che gestiscono il ciclo di vita dei dipendenti (assunzione, cambio ruolo, uscita). È la fonte autoritativa delle identità.
- Servizio Microsoft Entra Provisioning — usa il protocollo SCIM 2.0 per connettersi all'endpoint SCIM dell'applicazione di destinazione e automatizzare il provisioning e deprovisioning di utenti e gruppi tramite API REST.
- Microsoft Entra ID — repository centrale delle identità, usato per gestire il ciclo di vita e i diritti di accesso di ogni utente.
- Sistema di destinazione — applicazione o sistema (es. Salesforce, GitHub, ServiceNow) con endpoint SCIM che riceve le operazioni di provisioning da Entra ID.

**Perché usare SCIM** _(stepTitle: Calibri 11pt grassetto #000000 keepNext)_

- Usa il protocollo standard aperto SCIM 2.0 (System for Cross-domain Identity Management).
- Il provisioning può essere configurato anche in direzione inversa (inbound): Workday o SuccessFactors creano automaticamente gli utenti in Entra ID.
- Il ciclo di provisioning iniziale sincronizza tutti gli utenti; i cicli incrementali successivi gestiscono solo le modifiche.
- I log di provisioning nel portale Azure mostrano ogni operazione eseguita, utile per il troubleshooting.

**Provisioning in ingresso basato su API** _(stepTitle: Calibri 11pt grassetto #000000 keepNext)_

Non tutti i sistemi HR espongono un endpoint SCIM nativo. Per questi scenari, da marzo 2024 Microsoft Entra ID supporta il provisioning in ingresso basato su API: invece di richiedere al sistema HR di inviare i dati tramite SCIM, qualsiasi strumento di automazione o script può recuperare i dati della forza lavoro da qualsiasi sistema di record e inviarli direttamente all'API di provisioning di Entra ID. Le origini supportate includono Workday, SAP SuccessFactors e qualsiasi sistema HR personalizzato. Questo approccio offre la flessibilità necessaria per automatizzare la gestione del ciclo di vita delle identità indipendentemente dalle capacità di integrazione nativa del sistema HR.


---

### MODULO 2.3


## 2.3 — Descrivere i componenti architetturali principali di Azure
_(h2: Calibri 14pt grassetto #0078D4 keepNext)_


### 2.3.1 — Introduzione
_(h3: Calibri 12pt grassetto #2D5F8A keepNext)_

Azure è la piattaforma cloud Microsoft che offre oltre 200 servizi per creare, eseguire e gestire applicazioni su data center globali.


### 2.3.2 — Che cos'è Microsoft Azure
_(h3: Calibri 12pt grassetto #2D5F8A keepNext)_

Azure copre tutte le principali categorie di servizi cloud: Calcolo, Rete, Archiviazione, Database, AI/ML, IoT e molto altro, accessibili tramite il portale Azure, CLI, API o PowerShell.


> **Portale Azure**: Il portale Azure (portal.azure.com) è l'interfaccia grafica web per creare, gestire e monitorare tutte le risorse cloud. Disponibile 24/7, aggiornato continuamente senza downtime.
_(infoBox: sfondo #E8F0FB bordo sinistro #0078D4)_


### 2.3.3 — Introduzione agli account Azure
_(h3: Calibri 12pt grassetto #2D5F8A keepNext)_

L'organizzazione delle risorse in Azure segue una gerarchia a quattro livelli:


> **Account gratuito Azure**: Con l'account gratuito Azure si ottengono 200 $ di credito per 30 giorni, accesso gratuito ai servizi più diffusi per 12 mesi e oltre 55 servizi sempre gratuiti.
_(infoBox: sfondo #E8F0FB bordo sinistro #0078D4)_


### 2.3.4 — Descrivere l'infrastruttura fisica di Azure
_(h3: Calibri 12pt grassetto #2D5F8A keepNext)_

L'infrastruttura fisica di Azure è organizzata in una gerarchia dal più ampio al più specifico: Geography → Region → Availability Zone → Datacenter.

Data Center: strutture fisiche con server, alimentazione ridondante, raffreddamento e rete dedicata. Non sono direttamente accessibili; le risorse vengono distribuite nelle Regioni.

Aree geografiche (Regions): cluster di data center nelle vicinanze, collegati da rete a bassa latenza. Ogni regione è identificata con un nome (es. East US, West Europe).

Zone di disponibilità (Availability Zones): una o più strutture fisicamente separate all'interno di una regione, ciascuna con alimentazione, raffreddamento e rete indipendenti. Garantiscono continuità operativa in caso di guasto di un data center.

Coppie di aree (Region Pairs): ogni regione Azure è abbinata a un'altra regione nella stessa geografia, distante almeno 480 km. In caso di interruzione estesa, una regione viene ripristinata prioritariamente rispetto all'altra.

Aree sovrane: istanze separate e isolate di Azure per requisiti legali e di conformità specifici (es. Azure Government per enti federali USA, Azure China gestita da 21Vianet).


### 2.3.5 — Descrivere l'infrastruttura di gestione di Azure
_(h3: Calibri 12pt grassetto #2D5F8A keepNext)_

L'infrastruttura di gestione comprende quattro livelli gerarchici: Risorse, Gruppi di risorse, Sottoscrizioni e Gruppi di gestione.

Risorse Azure: qualsiasi elemento creabile in Azure (VM, database, rete virtuale, storage account, ecc.). Ogni risorsa deve appartenere a esattamente un gruppo di risorse.

Gruppi di risorse: contenitori logici che raccolgono risorse correlate. Servono per applicare policy, controllo degli accessi e lifecycle management in modo uniforme.

- Ogni risorsa appartiene a un solo gruppo di risorse; può essere spostata ma non duplicata.
- I gruppi non sono annidabili e non possono essere rinominati dopo la creazione.
- Eliminare un gruppo di risorse elimina in cascata tutte le risorse al suo interno.

> **Gerarchia Azure**: La gerarchia completa è: Tenant Root Group → Gruppi di gestione → Sottoscrizioni → Gruppi di risorse → Risorse. Ogni livello eredita le policy e i controlli di accesso dal livello superiore.
_(infoBox: sfondo #E8F0FB bordo sinistro #0078D4)_

Gruppi di gestione: contenitori per gestire l'accesso, le policy e la conformità su più sottoscrizioni. Le policy applicate a un gruppo si propagano automaticamente a tutte le sottoscrizioni figlie.

Sottoscrizioni: unità logica di Azure che collega un account utente e le risorse create da quell'account. Ogni sottoscrizione ha due confini principali:


### Riepilogo 2.3
_(h3: Calibri 12pt grassetto #2D5F8A keepNext)_

- Azure organizza le risorse in una gerarchia: Geography → Region → Availability Zone → Datacenter.
- Le Region Pairs garantiscono continuità operativa con failover automatico tra regioni distanti almeno 480 km.
- La gerarchia di gestione (Gruppi di gestione → Sottoscrizioni → Gruppi di risorse → Risorse) consente di applicare policy e controllo accessi in modo scalabile.
- Ogni risorsa appartiene a un solo gruppo di risorse; eliminare il gruppo elimina tutto il suo contenuto.

> **Obiettivi modulo 2.3**: Al termine di questo modulo si è in grado di: descrivere le regioni, le zone di disponibilità e le coppie di aree di Azure; spiegare la struttura gerarchica delle risorse; distinguere il confine di fatturazione da quello di controllo degli accessi.
_(infoBox: sfondo #E8F0FB bordo sinistro #0078D4)_


---

### MODULO 2.4


## 2.4 — Iniziative di Criteri di Azure
_(h2: Calibri 14pt grassetto #0078D4 keepNext)_


### 2.4.1 — Introduzione
_(h3: Calibri 12pt grassetto #2D5F8A keepNext)_

Azure Policy è il servizio di governance di Azure che consente di creare, assegnare e gestire policy che applicano regole ed effetti sulle risorse Azure, garantendo che rimangano conformi agli standard IT aziendali e agli accordi sul livello di servizio. Le policy sono descritte in formato JSON e sono note come definizioni di policy.

Le iniziative di Azure Policy sono raccolte di definizioni di policy raggruppate verso un obiettivo specifico. Consolidando più policy in un unico elemento, le iniziative consentono un controllo centralizzato e l'applicazione delle configurazioni su tutte le risorse Azure.

Organizzazioni in settori regolamentati come governo, finanza e pubblica amministrazione usano iniziative di policy mirate per soddisfare requisiti normativi nazionali e regionali, ridurre i tempi di audit e creare guardrail cloud coerenti con i framework di conformità.


### 2.4.2 — Cloud Adoption Framework for Azure
_(h3: Calibri 12pt grassetto #2D5F8A keepNext)_

Il Cloud Adoption Framework (CAF) è una guida Microsoft che aiuta le organizzazioni ad adottare il cloud in modo strutturato. Definisce le best practice per la governance, la sicurezza e la gestione delle risorse Azure. Azure Policy è uno degli strumenti chiave raccomandati dal CAF per implementare la governance.

- Strategia — definire motivazioni e obiettivi del passaggio al cloud.
- Pianificazione — allineare i piani di adozione del cloud agli obiettivi aziendali.
- Preparazione — predisporre l'ambiente cloud con landing zone sicure e conformi.
- Adozione — migrare e innovare carichi di lavoro nel cloud.
- Governance — applicare policy, controlli di costo e standard di sicurezza.
- Gestione — monitorare e ottimizzare le operazioni cloud nel tempo.

**I 5 step della cloud governance** _(stepTitle: Calibri 11pt grassetto #000000 keepNext)_

La cloud governance è un processo continuo che richiede monitoraggio, valutazione e adattamento costante. Il CAF la suddivide in cinque passi:

- 1. Costituire un team di governance — un team dedicato responsabile di definire, mantenere e rendicontare le policy di governance cloud.
- 2. Valutare i rischi cloud — analisi approfondita dei rischi specifici dell'organizzazione: conformità normativa, sicurezza, operazioni, costi, gestione dei dati, risorse e AI.
- 3. Documentare le policy di governance — policy chiare che definiscono l'uso accettabile del cloud e le regole per mitigare i rischi identificati.
- 4. Applicare le policy di governance — implementazione sistematica tramite strumenti automatizzati e supervisione manuale per garantire la conformità.
- 5. Monitorare la governance cloud — monitoraggio regolare dell'uso del cloud per verificare la conformità continua alle policy stabilite.
![imgCloudGovSteps](img/imgCloudGovSteps) _(dimensioni: 2031×278 px)_

*Figura 21 — I 5 step della cloud governance: processo iterativo da Build a cloud governance team fino a Monitor cloud governance.* _(caption: Calibri 9pt corsivo grigio centrato)_


> **Processo iterativo**: I passi 1-5 vanno completati per stabilire la governance. In seguito è necessario iterare regolarmente sui passi 2-5 per mantenere la governance nel tempo.
_(infoBox: sfondo #E8F0FB bordo sinistro #0078D4)_


**Le 3 considerazioni chiave per definire una policy** _(stepTitle: Calibri 11pt grassetto #000000 keepNext)_

- Rischio aziendale — documentare i rischi in evoluzione e la tolleranza al rischio dell'organizzazione in base alla classificazione dei dati e alla criticità delle applicazioni.
- Policy e conformità — tradurre le decisioni sui rischi in dichiarazioni di policy per definire in modo efficiente i confini di adozione del cloud.
- Processo — stabilire processi per monitorare le violazioni e l'aderenza alle policy aziendali.

**Le 5 discipline fondamentali della cloud governance** _(stepTitle: Calibri 11pt grassetto #000000 keepNext)_

- Cost Management — valutazione e monitoraggio dei costi, controllo delle spese IT e adeguamento delle risorse alla domanda.
- Security Baseline — applicazione di una baseline di sicurezza a tutti gli sforzi di adozione cloud per garantire conformità ai requisiti di sicurezza IT.
- Resource Consistency — coerenza nella configurazione delle risorse e applicazione di pratiche per l'onboarding, il ripristino e la individuazione.
- Identity Baseline — applicazione coerente di definizioni e assegnazioni di ruoli per garantire la baseline di identità e accesso.
- Deployment Acceleration — accelerazione del deployment tramite centralizzazione, coerenza e standardizzazione dei template.

**Esempi pratici di governance con Azure Policy** _(stepTitle: Calibri 11pt grassetto #000000 keepNext)_

Alcune azioni di governance applicabili concretamente con Azure Policy:

- Consentire il deployment di risorse Azure solo in aree geografiche approvate.
- Applicare regole di geo-replication per rispettare i requisiti di data residency.
- Limitare i tipi di VM consentiti nell'ambiente cloud.
- Imporre l'applicazione coerente di tag su tutte le risorse.
- Richiedere l'autenticazione a più fattori (MFA) per tutti gli account delle sottoscrizioni.
- Obbligare le risorse a inviare log di diagnostica a un workspace di Azure Monitor.

> **Bilanciamento controllo/velocità**: Una policy ben progettata bilancia controllo e stabilità con velocità operativa. Troppo controllo rallenta i team; troppa libertà genera rischi. È buona pratica valutare attentamente l'impatto prima di introdurre nuove policy restrittive.
_(infoBox: sfondo #E8F0FB bordo sinistro #0078D4)_


### 2.4.3 — Principi di progettazione di Azure Policy
_(h3: Calibri 12pt grassetto #2D5F8A keepNext)_

Azure Policy segue un approccio dichiarativo: si definisce lo stato desiderato delle risorse e Azure si occupa di valutare e applicare le regole. I principi chiave sono:

- Separazione dei ruoli — chi definisce le policy è separato da chi le applica e da chi gestisce le risorse.
- Ereditarietà — le policy applicate a un livello superiore (es. Management Group) si propagano automaticamente ai livelli inferiori (sottoscrizioni, gruppi di risorse, risorse).
- Non interferenza — Azure Policy valuta e segnala la non conformità, ma non modifica le risorse esistenti a meno che non venga configurata una remediation esplicita.
- Granularità — è possibile applicare policy a livello di Management Group, sottoscrizione, gruppo di risorse o singola risorsa.
![imgAzureGovHierarchy](img/imgAzureGovHierarchy) _(dimensioni: 1459×955 px)_

*Figura 22 — Gerarchia di governance Azure: Tenant Root Group → Management Groups → Subscriptions → Resource Groups → Resources.* _(caption: Calibri 9pt corsivo grigio centrato)_


**Azure Resource Manager e i due piani** _(stepTitle: Calibri 11pt grassetto #000000 keepNext)_

Azure Resource Manager (ARM) è il servizio di deployment e gestione di Azure. Tutte le operazioni Azure si dividono in due categorie:

- Control plane — gestisce le risorse nella sottoscrizione (creare, aggiornare, eliminare). Azure Policy opera qui, integrata con ARM, valutando ogni richiesta prima che venga eseguita. Quando arrivi una richiesta tramite portale, CLI, PowerShell o API, ARM autentica, verifica RBAC e poi valuta Azure Policy nell'ordine indicato.
- Data plane — gestisce le operazioni sui dati all'interno di una risorsa già esistente (es. caricare un file su uno storage account, leggere un segreto da Key Vault). Queste operazioni bypassano ARM e vengono gestite direttamente dal resource provider del servizio.
![imgAzurePolicyARM](img/imgAzurePolicyARM) _(dimensioni: 1853×964 px)_

*Figura 23 — Azure Policy e Azure Resource Manager: il Control Plane riceve le richieste da CLI, PowerShell, HTTP e portale Azure, le elabora tramite Azure Policy, RBAC, ARM Templates e altri servizi, e le instrada ai Resource Provider.* _(caption: Calibri 9pt corsivo grigio centrato)_


> **RBAC prima di Azure Policy**: Quando una richiesta arriva ad ARM, viene valutato prima RBAC e poi Azure Policy. Se l'utente non ha i permessi RBAC necessari, Azure Policy non viene nemmeno considerata — la richiesta fallisce già al controllo dei permessi.
_(infoBox: sfondo #E8F0FB bordo sinistro #0078D4)_


**Greenfield vs Brownfield** _(stepTitle: Calibri 11pt grassetto #000000 keepNext)_

Azure Resource Manager gestisce due scenari distinti per l'applicazione delle policy:

- Greenfield (policy-first) — la policy esiste già quando si crea o aggiorna una risorsa. La valutazione avviene in tempo reale: ARM riceve la richiesta, verifica RBAC, valuta Azure Policy e blocca immediatamente se la risorsa non è conforme. Per gli aggiornamenti parziali, ARM legge lo stato attuale della risorsa, applica il delta ricevuto e valuta il risultato finale contro le policy.
- Brownfield (resource-first) — le risorse esistono già quando viene assegnata una nuova policy. La valutazione avviene tramite compliance scan automatico ogni 24 ore o manuale su richiesta. Le risorse esistenti non conformi vengono segnalate ma non eliminate; i tentativi futuri di creare risorse non conformi vengono bloccati.

> **Esempio pratico**: Si crea una policy che vieta la creazione di risorse fuori dall'area West Europe. Le VM già esistenti in East US non vengono cancellate ma risultano non conformi nel report. Qualsiasi nuova VM creata in East US viene bloccata immediatamente.
_(infoBox: sfondo #E8F0FB bordo sinistro #0078D4)_


### 2.4.4 — Risorse di Azure Policy
_(h3: Calibri 12pt grassetto #2D5F8A keepNext)_

Azure Policy mette a disposizione 6 risorse principali che lavorano insieme per implementare la governance: Definizioni, Iniziative, Assegnazioni, Esenzioni, Attestazioni e Remediation task.


**Definizioni (Definitions)** _(stepTitle: Calibri 11pt grassetto #000000 keepNext)_

La regola vera e propria, scritta in JSON. Descrive la condizione da valutare e l'effetto da applicare. Possono essere di due tipi:

- Built-in — generate da Azure Resource Providers, disponibili per default. Azure ne offre centinaia pronte all'uso per Storage, Networking, Compute, Security e Monitoring.
- Custom — scritte dall'utente quando nessuna built-in copre il requisito specifico dell'organizzazione.

**Iniziative (Initiatives / Policy Set)** _(stepTitle: Calibri 11pt grassetto #000000 keepNext)_

Raccolta di più definizioni di policy raggruppate per un obiettivo comune (es. conformità PCI-DSS, standard di sicurezza baseline). Semplifica l'assegnazione di molte policy in una sola operazione. Anche le iniziative possono essere built-in o custom.


> **Built-in vs Custom**: Le iniziative built-in coprono i principali framework normativi (ISO 27001, NIST, CIS). Le custom permettono di costruire un set di policy su misura per i requisiti specifici dell'organizzazione.
_(infoBox: sfondo #E8F0FB bordo sinistro #0078D4)_


**Assegnazioni (Assignments)** _(stepTitle: Calibri 11pt grassetto #000000 keepNext)_

Il collegamento tra una definizione/iniziativa e uno specifico ambito (Management Group, sottoscrizione, gruppo di risorse o risorsa). Proprietà configurabili:

- Resource selectors — rollout graduale basato su tipo o posizione delle risorse.
- Overrides — modificare l'effetto di una policy senza cambiare la definizione originale.
- Excluded scopes — escludere specifici sotto-ambiti o risorse dall'assegnazione.
- Noncompliance messages — messaggi personalizzati mostrati quando una risorsa non è conforme.
- Managed identity — richiesta per le policy con effetto deployIfNotExists o modify che necessitano di eseguire remediation automatiche.

**Esenzioni (Exemptions)** _(stepTitle: Calibri 11pt grassetto #000000 keepNext)_

Permettono di escludere una risorsa o una gerarchia dalla valutazione di una policy, pur conteggiandola nel report di conformità generale. Si creano dopo l'assegnazione, non durante. Due categorie:

- Mitigated — l'obiettivo della policy è raggiunto tramite un metodo alternativo (es. un controllo manuale o uno strumento diverso).
- Waiver — la non conformità è temporaneamente accettata (es. durante una migrazione in corso).

**Attestazioni (Attestations)** _(stepTitle: Calibri 11pt grassetto #000000 keepNext)_

Usate per impostare manualmente lo stato di conformità su risorse che richiedono verifica umana — ad esempio policy che verificano processi organizzativi non rilevabili automaticamente. Ogni risorsa applicabile richiede una singola attestazione per ogni assegnazione di policy manuale.


**Remediation task** _(stepTitle: Calibri 11pt grassetto #000000 keepNext)_

Attività di correzione per portare risorse non conformi a uno stato conforme. Applicabili solo alle definizioni con effetto modify o deployIfNotExists. Le risorse create o aggiornate dopo l'assegnazione vengono corrette automaticamente; quelle già esistenti richiedono un remediation task esplicito.


> **Ambito (Scope)**: L'ambito definisce dove viene applicata la policy. Una policy assegnata a un Management Group si applica a tutte le sottoscrizioni e risorse sotto di esso. È possibile escludere specifici sotto-ambiti tramite le eccezioni.
_(infoBox: sfondo #E8F0FB bordo sinistro #0078D4)_


### 2.4.5 — Definizioni di Azure Policy
_(h3: Calibri 12pt grassetto #2D5F8A keepNext)_

Una definizione di policy descrive le condizioni di conformità di una risorsa e l'effetto da applicare se la condizione è soddisfatta. Si compone di due parti fondamentali: una condizione (if) che valuta le proprietà della risorsa, e un effetto (then) che determina cosa succede se la condizione è vera.


**Anatomia di una definizione JSON** _(stepTitle: Calibri 11pt grassetto #000000 keepNext)_

- displayName — nome identificativo della policy (max 128 caratteri).
- description — contesto d'uso della policy (max 512 caratteri).
- policyType — origine della definizione (sola lettura): Built-in (Microsoft), Custom (utente), Static (Regulatory Compliance, ownership Microsoft).
- mode — target della policy: All (valuta gruppi di risorse, sottoscrizioni e tutti i tipi di risorse) o Indexed (valuta solo i tipi che supportano tag e posizione). Per i Resource Provider modes (Kubernetes, KeyVault, Network) si usano modalità specifiche.
- metadata — informazioni sulla policy: versione, categoria nel portale, flag preview/deprecated.
- parameters — valori configurabili che rendono la definizione riutilizzabile. Supportano i tipi: String, Array, Object, Boolean, Integer, Float, DateTime. Ogni parametro può avere defaultValue, allowedValues e schema.
- policyRule — la regola vera e propria, composta dal blocco if (condizione) e dal blocco then (effetto).

**Operatori logici nel blocco if** _(stepTitle: Calibri 11pt grassetto #000000 keepNext)_

Nel blocco if è possibile combinare più condizioni tramite operatori logici:

- allOf — equivalente all'AND logico: tutte le condizioni devono essere vere.
- anyOf — equivalente all'OR logico: almeno una condizione deve essere vera.
- not — inverte il risultato di una condizione.
Gli operatori possono essere annidati per creare logiche complesse (es. not dentro un allOf).


**Tipi di condizioni** _(stepTitle: Calibri 11pt grassetto #000000 keepNext)_

- Fields — valutano le proprietà della risorsa: name, location, type, tags, identity.type, property aliases.
- Value — valutano un valore calcolato tramite funzioni (es. nome del resource group, output di una funzione ARM).
- Count — contano quanti elementi di un array soddisfano un criterio. Usano la funzione current() per accedere all'elemento corrente dell'array.
I criteri di valutazione principali sono: equals/notEquals, like/notLike, contains/notContains, in/notIn, containsKey/notContainsKey, exists, greater/less/greaterOrEquals/lessOrEquals (per date, stringhe e interi).


**Effetti disponibili (blocco then)** _(stepTitle: Calibri 11pt grassetto #000000 keepNext)_

Gli effetti si dividono in sincroni (valutati in tempo reale durante la richiesta), asincroni (valutati dopo) e manuali:

- Disabled — disattiva la policy senza rimuoverla. Viene verificato per primo. Permette di disattivare una singola assegnazione senza toccare la definizione.
- Deny — blocca la richiesta se non conforme. Valutazione sincrona.
- DenyAction — blocca azioni specifiche su risorse esistenti. Attualmente supporta solo l'azione DELETE. Valutazione sincrona.
- Append — aggiunge campi alla risorsa durante la creazione. Largamente sostituito da Modify. Valutazione sincrona.
- Modify — aggiunge, aggiorna o rimuove proprietà e tag durante creazione o aggiornamento. Valutazione sincrona.
- Audit — crea un evento di avviso nel log attività senza bloccare la richiesta. Valutazione asincrona.
- AuditIfNotExists — segnala se una risorsa correlata non esiste (es. manca il log di diagnostica). Valutazione asincrona.
- DeployIfNotExists — distribuisce automaticamente una risorsa mancante per rimediare la non conformità. Valutazione asincrona.
- Manual — consente di attestare manualmente la conformità di risorse o ambiti tramite attestazioni personalizzate. Non intercambiabile con altri effetti.

> **Effetti intercambiabili**: audit, deny e modify/append sono spesso intercambiabili tra loro. auditIfNotExists e deployIfNotExists sono spesso intercambiabili. disabled è intercambiabile con qualsiasi effetto. manual non è intercambiabile.
_(infoBox: sfondo #E8F0FB bordo sinistro #0078D4)_


**Cumulative most restrictive** _(stepTitle: Calibri 11pt grassetto #000000 keepNext)_

Più policy possono essere assegnate alla stessa risorsa, allo stesso ambito o ad ambiti diversi. Ogni policy viene valutata in modo indipendente. Il risultato finale è il cosiddetto cumulative most restrictive: se una policy Deny e una policy Audit si applicano alla stessa risorsa, prevale il Deny. L'effetto più restrittivo vince sempre.

La seguente definizione built-in limita le aree geografiche in cui è possibile distribuire risorse. Il parametro listOfAllowedLocations è un array configurabile al momento dell'assegnazione. La condizione allOf richiede che tutte e tre le sotto-condizioni siano vere contemporaneamente affinché il Deny venga applicato:

    {
      "displayName": "Allowed locations",
      "description": "Restricts the locations your organization can specify when deploying resources.",
      "policyType": "BuiltIn",
      "mode": "Indexed",
      "metadata": { "version": "1.0.0", "category": "General" },
      "parameters": {
        "listOfAllowedLocations": {
          "type": "Array",
          "metadata": {
            "description": "The list of locations that can be specified when deploying resources.",
            "strongType": "location",
            "displayName": "Allowed locations"
          }
        }
      },
      "policyRule": {
        "if": {
          "allOf": [
            { "field": "location", "notEquals": "global" },
            { "field": "type", "notEquals": "Microsoft.AzureActiveDirectory/b2cDirectories" }
          ]
        },
        "then": { "effect": "deny" }
      }
    }

### 2.4.6 — Valutazione delle risorse tramite Azure Policy
_(h3: Calibri 12pt grassetto #2D5F8A keepNext)_


**Trigger di valutazione** _(stepTitle: Calibri 11pt grassetto #000000 keepNext)_

La valutazione delle policy assegnate avviene in risposta a diversi eventi:

- Una policy o iniziativa viene assegnata per la prima volta a un ambito.
- Una policy o iniziativa già assegnata viene aggiornata.
- Una risorsa viene creata o aggiornata nell'ambito tramite ARM, REST API o SDK.
- Una sottoscrizione viene creata o spostata in una gerarchia di Management Group con policy assegnate.
- Un'esenzione di policy viene creata, aggiornata o eliminata.
- Ciclo standard di valutazione della conformità (ogni 24 ore).
- Scansione on-demand avviata manualmente: az policy state trigger-scan.

**Tempi e fattori che influenzano la scansione** _(stepTitle: Calibri 11pt grassetto #000000 keepNext)_

Quando si assegna una nuova policy, può esserci un ritardo fino a 30 minuti prima che entri in vigore, dovuto alla cache di ARM. Per bypassarlo è possibile disconnettersi e riconnettersi al portale. I fattori che influenzano la durata di una scansione sono:

- Dimensione e complessità delle definizioni di policy.
- Numero di policy applicate all'ambito.
- Dimensione dell'ambito (numero di risorse da valutare).
- Carico di sistema — le scansioni di conformità sono operazioni a bassa priorità e vengono posticipate se il sistema è impegnato in operazioni più critiche.

**Stati di conformità delle risorse** _(stepTitle: Calibri 11pt grassetto #000000 keepNext)_

Dopo la valutazione, Azure Policy assegna uno dei seguenti stati a ogni risorsa:

- Compliant — la risorsa rispetta tutte le condizioni della policy.
- Non-compliant — la risorsa non rispetta una o più condizioni.
- Error — errore nel template o nella valutazione della policy.
- Conflicting — due o più policy nello stesso ambito hanno regole contraddittorie (es. due policy che aggiungono lo stesso tag con valori diversi).
- Protected — la risorsa è coperta da un'assegnazione con effetto denyAction.
- Exempted — la risorsa è esclusa dalla valutazione tramite un'esenzione.
- Unknown — stato predefinito per le definizioni con effetto manual, in attesa di attestazione.
La percentuale di conformità si calcola dividendo le risorse Compliant + Exempt + Unknown per il totale delle risorse (incluse Non-compliant, Error e Conflicting). Quando più stati si sovrappongono su una stessa risorsa, prevale quello con rango più alto nell'ordine elencato sopra.


**EnforcementMode — modalità What-If** _(stepTitle: Calibri 11pt grassetto #000000 keepNext)_

L'enforcementMode è una proprietà dell'assegnazione che permette di disattivare l'applicazione dell'effetto mantenendo attiva la valutazione. Diverso dall'effetto disabled: disabled impedisce la valutazione del tutto; enforcementMode permette la valutazione senza applicare l'effetto.

- Enabled (Default) — l'effetto viene applicato durante la creazione o aggiornamento della risorsa.
- Disabled (DoNotEnforce) — l'effetto NON viene applicato ma la conformità viene comunque valutata e registrata. Nessuna voce viene scritta nell'Activity Log. I remediation task per deployIfNotExists possono essere avviati anche con DoNotEnforce.

**Safe deployment best practices** _(stepTitle: Calibri 11pt grassetto #000000 keepNext)_

Applicare policy a un ambiente di produzione senza test adeguati può causare comportamenti indesiderati. Le best practice prevedono due approcci:

- Iniziare con enforcementMode Disabled — assegnare la policy in modalità what-if per osservare la conformità senza bloccare operazioni. Questo permette di identificare problemi prima di attivare l'enforcement.
- Deployment rings — distribuire le policy gradualmente su sottoinsiemi sempre più grandi: prima ambienti di test/sviluppo, poi produzione in subset crescenti. Ogni ring viene validato prima di espandere allo successivo.

**Reazione ai cambiamenti di stato** _(stepTitle: Calibri 11pt grassetto #000000 keepNext)_

Azure Policy si integra con Azure Event Grid per permettere alle applicazioni di reagire automaticamente ai cambiamenti di stato di conformità, senza polling manuale. Gli eventi di policy vengono pubblicati su Event Grid e instradati agli Event Handler configurati — Azure Functions, Logic Apps, webhook personalizzati — che possono intraprendere azioni correttive automatiche.


> **Conformità vs Applicazione**: Una policy con effetto Audit non impedisce la creazione di risorse non conformi — le segnala soltanto. Solo il Deny blocca attivamente. È buona pratica iniziare con Audit o enforcementMode Disabled per valutare l'impatto prima di passare a Deny con enforcement attivo.
_(infoBox: sfondo #E8F0FB bordo sinistro #0078D4)_


---

### MODULO 2.5


## 2.5 — Proteggere le risorse con Azure RBAC
_(h2: Calibri 14pt grassetto #0078D4 keepNext)_


### 2.5.1 — Introduzione
_(h3: Calibri 12pt grassetto #2D5F8A keepNext)_

La gestione degli accessi alle risorse cloud è una funzione fondamentale per qualsiasi organizzazione. Azure RBAC (Role-Based Access Control) risolve due problemi chiave: garantire che gli utenti perdano l'accesso alle risorse quando lasciano l'organizzazione, e trovare il giusto equilibrio tra autonomia dei team e governance centrale.


### 2.5.2 — Che cos'è Azure RBAC?
_(h3: Calibri 12pt grassetto #2D5F8A keepNext)_

Azure RBAC è un sistema di autorizzazione basato su Azure Resource Manager che offre una gestione degli accessi con granularità fine alle risorse Azure. Permette di concedere agli utenti esattamente il tipo di accesso di cui hanno bisogno — niente di più, niente di meno.

Ogni sottoscrizione Azure è associata a una singola directory Microsoft Entra. Utenti, gruppi e applicazioni in quella directory possono gestire le risorse nella sottoscrizione tramite SSO. Quando un account AD on-premise viene disabilitato tramite Entra Connect, perde automaticamente l'accesso a tutte le sottoscrizioni Azure collegate.

![imgRbacRolesHierarchy](img/imgRbacRolesHierarchy) _(dimensioni: 895×598 px)_

*Figura 26 — Relazione tra ruoli di Azure AD, ruoli di Azure e ruoli di amministratore della sottoscrizione classica nella gerarchia Management Group → Sottoscrizione → Gruppo di risorse → Risorsa.* _(caption: Calibri 9pt corsivo grigio centrato)_


**I tre elementi di un'assegnazione di ruolo** _(stepTitle: Calibri 11pt grassetto #000000 keepNext)_

Per creare un'assegnazione di ruolo servono tre elementi — chi, cosa e dove:

- Entità di sicurezza (chi) — l'oggetto a cui si concede l'accesso: utente, gruppo, entità servizio o identità gestita.
![imgRbacSecPrincipal](img/imgRbacSecPrincipal) _(dimensioni: 357×134 px)_

*Figura 24 — Entità di sicurezza: utente, gruppo ed entità servizio.* _(caption: Calibri 9pt corsivo grigio centrato)_

- Definizione del ruolo (cosa) — raccolta di autorizzazioni che definisce cosa si può fare. Può essere un ruolo predefinito o personalizzato.
![imgRbacRoleDefinition](img/imgRbacRoleDefinition) _(dimensioni: 537×352 px)_

*Figura 25 — Definizione del ruolo: elenco dei ruoli predefiniti e personalizzati con dettaglio del ruolo Collaboratore (Actions, NotActions, DataActions, AssignableScopes).* _(caption: Calibri 9pt corsivo grigio centrato)_

- Ambito (dove) — il livello a cui si applica l'accesso: gruppo di gestione, sottoscrizione, gruppo di risorse o risorsa singola. Gli ambiti figlio ereditano automaticamente i ruoli assegnati all'ambito padre.

> **Assegnazione di ruolo**: Un'assegnazione di ruolo è il collegamento tra entità di sicurezza, definizione del ruolo e ambito. Per concedere l'accesso si crea un'assegnazione; per revocarlo si rimuove. Es: al gruppo Marketing viene assegnato il ruolo Collaboratore sull'ambito del gruppo di risorse Sales.
_(infoBox: sfondo #E8F0FB bordo sinistro #0078D4)_


**I 4 ruoli predefiniti fondamentali** _(stepTitle: Calibri 11pt grassetto #000000 keepNext)_

- Proprietario — accesso completo a tutte le risorse, incluso il diritto di delegare l'accesso ad altri.
- Collaboratore — può creare e gestire tutti i tipi di risorse Azure, ma non può concedere l'accesso ad altri.
- Lettore — può solo visualizzare le risorse Azure esistenti, nessuna modifica.
- Amministratore Accesso Utenti — gestisce gli accessi utente alle risorse Azure, ma non può gestire le risorse stesse.
Se i ruoli predefiniti non coprono le esigenze specifiche è possibile creare ruoli personalizzati.


**Actions, NotActions e autorizzazioni effettive** _(stepTitle: Calibri 11pt grassetto #000000 keepNext)_

Azure RBAC è un modello additivo: le assegnazioni di ruolo si sommano. Se hai lettura da un ruolo e scrittura da un altro, avrai entrambe. La definizione di ruolo usa due proprietà chiave:

- Actions — operazioni consentite. Il carattere jolly (*) indica tutte le operazioni sul piano di controllo.
- NotActions — operazioni da sottrarre dalle Actions. Le autorizzazioni effettive si calcolano come: Actions − NotActions = Autorizzazioni effettive.
Esempio: il ruolo Collaboratore ha (*) in Actions ma in NotActions esclude la gestione di ruoli e assegnazioni, impedendo di delegare l'accesso ad altri — pur potendo fare tutto il resto.


**RBAC nel portale Azure** _(stepTitle: Calibri 11pt grassetto #000000 keepNext)_

In ogni risorsa, gruppo di risorse o sottoscrizione è presente il riquadro Controllo di accesso (IAM) — Identity and Access Management. Da qui è possibile visualizzare chi ha accesso e con quale ruolo, aggiungere o rimuovere assegnazioni di ruolo, e verificare i propri permessi effettivi.

![imgRbacIamPortal](img/imgRbacIamPortal) _(dimensioni: 1069×708 px)_

*Figura 27 — Riquadro Controllo di accesso (IAM) nel portale Azure: scheda Assegnazioni di ruolo con utenti, gruppi, service principal e managed identity con i relativi ruoli e ambiti.* _(caption: Calibri 9pt corsivo grigio centrato)_


**Scenari pratici di utilizzo** _(stepTitle: Calibri 11pt grassetto #000000 keepNext)_

- Consentire a un utente di gestire le macchine virtuali in una sottoscrizione e a un altro di gestire le reti virtuali nella stessa sottoscrizione.
- Consentire a un gruppo di amministratori di database di gestire i database SQL in una sottoscrizione.
- Consentire a un utente di gestire tutte le risorse in un gruppo di risorse — VM, siti Web, subnet.
- Consentire a un'applicazione di accedere a tutte le risorse in un gruppo di risorse.

**RBAC è un modello additivo** _(stepTitle: Calibri 11pt grassetto #000000 keepNext)_


> **RBAC vs Azure Policy**: RBAC controlla chi può fare cosa sulle risorse (autorizzazione). Azure Policy controlla come devono essere configurate le risorse (governance). Operano su livelli diversi e si complementano: RBAC può permettere a un utente di creare una VM, ma Azure Policy può impedire che venga creata in una regione non consentita.
_(infoBox: sfondo #E8F0FB bordo sinistro #0078D4)_


---

### MODULO 2.6


## 2.6 — Reimpostazione della password self-service (SSPR)
_(h2: Calibri 14pt grassetto #0078D4 keepNext)_


### 2.6.1 — Introduzione
_(h3: Calibri 12pt grassetto #2D5F8A keepNext)_

La reimpostazione della password self-service (SSPR) di Microsoft Entra consente agli utenti di cambiare o reimpostare la propria password senza intervento dell'amministratore o dell'help desk. Se un account viene bloccato o l'utente dimentica la password, può seguire autonomamente le istruzioni per sbloccarsi e tornare al lavoro. Riduce le chiamate all'help desk e la perdita di produttività.


### 2.6.2 — Che cos'è la reimpostazione autonoma della password in Microsoft Entra ID?
_(h3: Calibri 12pt grassetto #2D5F8A keepNext)_


**Perché usare SSPR** _(stepTitle: Calibri 11pt grassetto #000000 keepNext)_

In Microsoft Entra ID qualsiasi utente che abbia già eseguito l'accesso può modificare la password in autonomia. Se invece non ha mai eseguito l'accesso, la password è dimenticata, scaduta o bloccata, deve poterla reimpostare senza dover chiamare il supporto. SSPR riduce il carico degli amministratori, limita la perdita di produttività e consente agli utenti di sbloccarsi da qualsiasi browser o dalla schermata di accesso Windows.


**I 5 step del processo SSPR** _(stepTitle: Calibri 11pt grassetto #000000 keepNext)_

- 1. Localizzazione — il portale rileva le impostazioni locali del browser e mostra la pagina nella lingua appropriata.
- 2. Verifica — l'utente immette il proprio nome utente e supera un test CAPTCHA per dimostrare di essere umano.
- 3. Autenticazione — l'utente immette i dati del metodo di autenticazione registrato (codice app, email, SMS, ecc.).
- 4. Reimpostazione della password — se l'autenticazione ha successo, l'utente imposta la nuova password.
- 5. Notifica — viene inviata una notifica all'utente per confermare la reimpostazione.

**Metodi di autenticazione supportati** _(stepTitle: Calibri 11pt grassetto #000000 keepNext)_

Prima di usare SSPR, ogni utente deve registrare almeno un metodo di autenticazione. È consigliabile registrarne due per maggiore flessibilità. I metodi disponibili sono:

- Notifica dell'app per dispositivi mobili (Microsoft Authenticator) — Azure invia una notifica all'app che l'utente conferma o rifiuta.
- Codice app per dispositivi mobili — l'utente immette il codice OTP generato dall'app Authenticator.
- Email — Azure invia un codice OTP all'indirizzo email esterno ad Azure registrato.
- Telefono cellulare — Azure invia un SMS con codice OTP; è possibile anche scegliere la chiamata automatica.
- Telefono ufficio — si riceve una chiamata automatica, si preme il tasto #.

> **Numero di metodi richiesti**: L'amministratore può configurare se richiedere 1 o 2 metodi per la reimpostazione. Se si passa da 1 a 2 metodi, gli utenti che hanno registrato solo 1 metodo non possono più usare SSPR finché non ne registrano un secondo.
_(infoBox: sfondo #E8F0FB bordo sinistro #0078D4)_


**Consigli pratici sui metodi** _(stepTitle: Calibri 11pt grassetto #000000 keepNext)_

- Abilitare due o più metodi di autenticazione per la reimpostazione.
- Usare la notifica dell'app per dispositivi mobili come metodo primario. Abilitare anche metodi basati su email o telefono ufficio per supportare utenti senza dispositivi mobili.
- Il metodo SMS non è consigliato perché è possibile inviare messaggi SMS fraudolenti.
- Le domande di sicurezza sono il metodo meno consigliato — le risposte possono essere note ad altre persone. Usarle solo in combinazione con almeno un altro metodo.

**Account associati a ruoli di amministratore** _(stepTitle: Calibri 11pt grassetto #000000 keepNext)_

- Gli account con ruolo di amministratore hanno sempre applicati i criteri a due metodi, indipendentemente dalla configurazione definita per gli altri utenti.
- Il metodo delle domande di sicurezza non è disponibile per gli account con ruolo di amministratore.

**Notifiche** _(stepTitle: Calibri 11pt grassetto #000000 keepNext)_

- Notifica all'utente — se abilitata, l'utente riceve una notifica sugli indirizzi email primari e secondari quando la password viene reimpostata. Se la reimpostazione è stata eseguita da un utente malintenzionato, questa notifica avvisa l'utente che può eseguire operazioni di prevenzione.
- Notifica agli amministratori — se abilitata, tutti gli amministratori ricevono una notifica quando un altro amministratore reimposta la propria password.

**Requisiti di licenza** _(stepTitle: Calibri 11pt grassetto #000000 keepNext)_

Le edizioni di Microsoft Entra ID sono due: Premium P1 e Premium P2. La funzionalità SSPR dipende dal tipo di edizione:

- Modifica della password (utente già connesso) — disponibile con qualsiasi edizione di Entra ID, inclusa quella gratuita.
- Reimpostazione della password dimenticata o scaduta — richiede Entra ID P1, P2, Microsoft 365 Apps for Business o Microsoft 365.
- Writeback in ambienti ibridi — richiede Entra ID P1 o P2. Disponibile anche con Microsoft 365 Apps per le aziende.

**Opzioni di distribuzione** _(stepTitle: Calibri 11pt grassetto #000000 keepNext)_

Il writeback delle password può essere distribuito tramite Microsoft Entra Connect o tramite la sincronizzazione cloud, a seconda delle esigenze. Le due opzioni possono coesistere side-by-side per set diversi di utenti — ad esempio, utenti in domini disconnessi a causa di fusioni aziendali possono usare Entra Connect, mentre i nuovi utenti acquisiti possono usare la sincronizzazione cloud.


> **Sincronizzazione cloud vs Entra Connect**: La sincronizzazione cloud offre alta disponibilità maggiore perché non si basa su una singola istanza di Microsoft Entra Connect. È la scelta consigliata per i nuovi deployment ibridi.
_(infoBox: sfondo #E8F0FB bordo sinistro #0078D4)_


### 2.6.3 — Implementare la reimpostazione della password self-service
_(h3: Calibri 12pt grassetto #2D5F8A keepNext)_


**Abilitare SSPR nel portale Azure** _(stepTitle: Calibri 11pt grassetto #000000 keepNext)_

- Portale Azure → Microsoft Entra ID → Sicurezza → Reimpostazione password self-service.
- Scegliere l'ambito: Nessuno (disabilitato), Selezionati (gruppi specifici) o Tutti.
- Configurare i metodi di autenticazione: quanti richiesti (1 o 2) e quali abilitare.
- Configurare le notifiche e le personalizzazioni (logo aziendale, link al supporto).

**Integrazione con ambienti ibridi — Password Writeback** _(stepTitle: Calibri 11pt grassetto #000000 keepNext)_

In ambienti ibridi con AD DS on-premise, il writeback delle password permette di sincronizzare le reimpostazioni da Entra ID verso la directory locale. Senza writeback, gli utenti sincronizzati non possono reimpostare la password tramite SSPR.

- Writeback abilitato — utenti federati, con autenticazione pass-through o con hash delle password sincronizzato possono reimpostare la password.
- Writeback disabilitato — questi utenti non possono usare SSPR e devono contattare l'amministratore.
- È possibile separare sblocco account e reimpostazione password: con l'opzione abilitata, un utente può sbloccare l'account locale senza dover reimpostare la password.

**SSPR per utenti B2B** _(stepTitle: Calibri 11pt grassetto #000000 keepNext)_

La reimpostazione della password è supportata per tutte le configurazioni B2B:

- Utenti guest con tenant Entra ID — il reset segue la policy del tenant del partner.
- Utenti B2B invitati tramite Entra B2B — possono reimpostare la password con l'email registrata durante l'invito.

> **Limitazione importante**: Gli account Microsoft personali (Hotmail, Outlook.com, ecc.) invitati come guest non possono usare SSPR di Microsoft Entra — devono usare il portale di recupero account Microsoft.
_(infoBox: sfondo #E8F0FB bordo sinistro #0078D4)_


# Configurare e gestire reti virtuali per amministratori di Azure
_(moduloTitle: Calibri 24pt grassetto #1B3A6B, bordo blu sotto, pageBreakBefore)_

_Questo percorso copre la progettazione e la gestione dell'infrastruttura di rete in Azure. Una rete ben configurata garantisce connettività sicura, isolamento delle risorse e prestazioni ottimali._


## 3.1 — Configurare reti virtuali
_(h2: Calibri 14pt grassetto #0078D4 keepNext)_


### 3.1.1 — Introduzione
_(h3: Calibri 12pt grassetto #2D5F8A keepNext)_

Le reti virtuali di Azure (VNet) sono il blocco fondamentale della rete privata in Azure. Consentono a molti tipi di risorse Azure di comunicare in modo sicuro tra loro, con Internet e con le reti locali on-premise. Una VNet è simile a una rete tradizionale operata in un datacenter fisico, ma offre i vantaggi aggiuntivi dell'infrastruttura cloud: scalabilità, disponibilità e isolamento.


### 3.1.2 — Pianificare le reti virtuali
_(h3: Calibri 12pt grassetto #2D5F8A keepNext)_

Prima di creare una VNet è necessario pianificarne attentamente la struttura. Ogni VNet ha uno spazio di indirizzi IP definito in notazione CIDR (es. 10.0.0.0/16) che non può sovrapporsi con altri spazi di indirizzi nella stessa rete o con reti on-premise collegate.


**Scenari di utilizzo delle reti virtuali** _(stepTitle: Calibri 11pt grassetto #000000 keepNext)_

- Rete virtuale dedicata al cloud privato — quando non è necessaria una configurazione cross-premise, i servizi e le VM nella VNet comunicano direttamente e in modo sicuro tra loro. È possibile configurare endpoint per le risorse che richiedono accesso a Internet.
- Estensione sicura del data center — è possibile creare VPN site-to-site per ridimensionare in modo sicuro la capacità del data center. Le VPN site-to-site usano IPSec per fornire una connessione sicura tra il gateway VPN aziendale e Azure.
- Scenari cloud ibridi — le VNet offrono la flessibilità per connettere applicazioni cloud a qualsiasi tipo di sistema locale, inclusi mainframe e sistemi Unix, quando i blocchi CIDR delle reti non si sovrappongono.

**Considerazioni di progettazione** _(stepTitle: Calibri 11pt grassetto #000000 keepNext)_

- Assicurarsi che lo spazio di indirizzi non si sovrapponga ad altri intervalli di rete dell'organizzazione.
- Azure riserva 5 indirizzi IP in ogni subnet: i primi 4 e l'ultimo. Es. in 10.0.0.0/24 gli indirizzi 10.0.0.0, .1, .2, .3 e .255 non sono utilizzabili.
- Una VNet appartiene a una sola regione Azure e a una sola sottoscrizione.
- Più VNet possono essere collegate tramite VNet Peering per comunicare tra loro.
- I DNS possono essere configurati a livello di VNet: si può usare il DNS di Azure (168.63.129.16) o DNS personalizzati.

> **Spazio di indirizzi privati**: Azure supporta gli spazi di indirizzi privati RFC 1918: 10.0.0.0/8, 172.16.0.0/12 e 192.168.0.0/16. È consigliabile usare questi range per le VNet aziendali.
_(infoBox: sfondo #E8F0FB bordo sinistro #0078D4)_


**Capire la notazione CIDR** _(stepTitle: Calibri 11pt grassetto #000000 keepNext)_

Un indirizzo IPv4 è composto da 32 bit totali, scritti in 4 gruppi da 8 bit (es. 10.0.0.0). Il numero dopo lo slash (/) indica quanti bit sono fissi per identificare la rete — i restanti bit sono liberi e identificano i singoli host.

- 10.0.0.0/16 → 16 bit fissi (10.0), 16 bit liberi → 2¹⁶ = 65.536 indirizzi, da 10.0.0.0 a 10.0.255.255
- 10.0.0.0/24 → 24 bit fissi (10.0.0), 8 bit liberi → 2⁸ = 256 indirizzi, da 10.0.0.0 a 10.0.0.255
- 10.0.0.0/28 → 28 bit fissi, 4 bit liberi → 2⁴ = 16 indirizzi
La formula generale è: indirizzi disponibili = 2^(32 − prefisso). Più piccolo è il valore dopo lo /, più grande è la rete. Non è obbligatorio usare multipli di 8 — /20, /22, /26 sono valori perfettamente validi, usati quando servono dimensioni intermedie precise. I multipli di 8 (/8, /16, /24) sono solo i più comuni perché coincidono con i confini degli ottetti e sono più intuitivi da leggere.


> **Limite Azure per le subnet**: Azure riserva sempre 5 indirizzi per ogni subnet (i primi 4 e l'ultimo). Per questo il prefisso minimo consigliato per una subnet è /28, che garantisce 16 − 5 = 11 indirizzi utilizzabili.
_(infoBox: sfondo #E8F0FB bordo sinistro #0078D4)_


### 3.1.3 — Creare subnet
_(h3: Calibri 12pt grassetto #2D5F8A keepNext)_

Una subnet è una suddivisione dello spazio di indirizzi della VNet. Permette di segmentare la rete in sezioni più piccole per organizzare le risorse, migliorare la sicurezza, le prestazioni e semplificare la gestione. Ogni risorsa Azure in una VNet deve essere collocata in una subnet.


**Indirizzi riservati per ogni subnet** _(stepTitle: Calibri 11pt grassetto #000000 keepNext)_

Per ogni subnet Azure riserva sempre 5 indirizzi IP che non possono essere assegnati alle risorse. Esempio con 192.168.1.0/24:

[TABELLA: reservedTable] _(tabella generata da codice — vedere JS per la struttura)_

*Tabella 3 — I 5 indirizzi riservati da Azure in ogni subnet (esempio con 192.168.1.0/24).* _(caption: Calibri 9pt corsivo grigio centrato)_


**Considerazioni di progettazione** _(stepTitle: Calibri 11pt grassetto #000000 keepNext)_

- Ogni subnet deve avere un intervallo CIDR univoco che rientra nello spazio di indirizzi della VNet padre.
- Gli intervalli delle subnet non possono sovrapporsi tra loro all'interno della stessa VNet.
- Alcune subnet speciali sono richieste da determinati servizi Azure: GatewaySubnet (per i gateway VPN/ExpressRoute), AzureFirewallSubnet, AzureBastionSubnet.
- Requisiti di servizio — ogni servizio distribuito in una VNet può richiedere la propria subnet dedicata con requisiti specifici di routing e traffico. Lasciare sempre spazio non allocato sufficiente per i servizi futuri.
- Appliance virtuali di rete (NVA) — per default Azure instrada il traffico tra tutte le subnet della stessa VNet automaticamente. Se si vuole che il traffico tra risorse passi attraverso una NVA (firewall virtuale, load balancer), le risorse devono essere collocate in subnet separate e il routing personalizzato tramite Route Table.
- Network Security Group (NSG) — è possibile associare zero o un NSG a ogni subnet per filtrare il traffico in entrata e in uscita. Lo stesso NSG può essere associato a più subnet.
- Azure Private Link — permette connettività privata da una VNet a servizi PaaS (Storage, SQL, Key Vault, ecc.) senza esporre il traffico a Internet pubblico. Semplifica l'architettura eliminando la necessità di IP pubblici per accedere ai servizi Azure gestiti.

### 3.1.4 — Creare reti virtuali
_(h3: Calibri 12pt grassetto #2D5F8A keepNext)_

Una VNet può essere creata tramite il portale Azure, Azure CLI, PowerShell o template ARM. I parametri fondamentali sono il nome, la regione, la sottoscrizione, il gruppo di risorse e lo spazio di indirizzi.


**Creazione tramite Azure CLI** _(stepTitle: Calibri 11pt grassetto #000000 keepNext)_

    az network vnet create \\
      --resource-group rsg-1 \\
      --name MyVNet \\
      --address-prefix 10.0.0.0/16 \\
      --subnet-name MySubnet \\
      --subnet-prefix 10.0.0.0/24

### 3.1.5 — Pianificare l'indirizzamento IP
_(h3: Calibri 12pt grassetto #2D5F8A keepNext)_

In Azure gli indirizzi IP possono essere pubblici o privati, e assegnati in modo statico o dinamico.

![imgIpAddressing](img/imgIpAddressing) _(dimensioni: 850×138 px)_

*Figura 28 — Una risorsa Azure con indirizzo IP privato (comunicazione con VNet, reti locali, VPN Gateway, ExpressRoute) e indirizzo IP pubblico (comunicazione con Internet e servizi pubblici).* _(caption: Calibri 9pt corsivo grigio centrato)_


**Indirizzi IP pubblici** _(stepTitle: Calibri 11pt grassetto #000000 keepNext)_

- Dinamici — assegnati quando la risorsa viene avviata e rilasciati quando viene arrestata. L'indirizzo può cambiare a ogni riavvio.
- Statici — rimangono assegnati finché la risorsa esiste, indipendentemente dallo stato. Necessari per DNS, certificati TLS, firewall e scenari che richiedono un IP fisso.
- SKU Basic — supporta assegnazione dinamica e statica, non è ridondante per zona.
- SKU Standard — supporta solo assegnazione statica, è ridondante per zona per default, richiede NSG esplicito. Raccomandato per nuovi deployment.

**Indirizzi IP privati** _(stepTitle: Calibri 11pt grassetto #000000 keepNext)_

- Dinamici — assegnati tramite DHCP dall'intervallo della subnet. Possono cambiare se la risorsa viene riallocata.
- Statici — l'amministratore specifica un indirizzo fisso nell'intervallo della subnet. Usati per DNS server, domain controller, firewall, database.
- È possibile separare le risorse con IP dinamici e statici in subnet diverse per una gestione più ordinata e per applicare policy differenti.

**Quando usare indirizzi IP statici** _(stepTitle: Calibri 11pt grassetto #000000 keepNext)_

Gli IP statici sono necessari in questi scenari specifici:

- Risoluzione dei nomi DNS — una modifica dell'indirizzo IP richiederebbe l'aggiornamento manuale dei record host.
- Modelli di sicurezza basati su IP — app o servizi che devono essere sempre raggiungibili allo stesso indirizzo.
- Certificati TLS/SSL — i certificati sono spesso collegati a un indirizzo IP specifico.
- Regole del firewall — le regole che permettono o negano traffico in base a intervalli IP richiedono indirizzi stabili.
- VM basate su ruolo — controller di dominio, server DNS e altri server di infrastruttura devono avere sempre lo stesso indirizzo.

> **Best practice**: Usare indirizzi statici per tutte le risorse che fungono da server o che vengono referenziate da altri servizi tramite IP. Usare dinamici per VM client e workload temporanei.
_(infoBox: sfondo #E8F0FB bordo sinistro #0078D4)_


### 3.1.6 — Creare indirizzi IP pubblici
_(h3: Calibri 12pt grassetto #2D5F8A keepNext)_

Un indirizzo IP pubblico è una risorsa autonoma in Azure che può essere associata a vari tipi di risorse: VM, load balancer, gateway VPN, firewall. Si crea separatamente dalla risorsa a cui viene associato, e può essere disassociato e riassociato a risorse diverse.


**Impostazioni da configurare alla creazione** _(stepTitle: Calibri 11pt grassetto #000000 keepNext)_

- Versione IP — gli IP pubblici supportano IPv4, IPv6 o dual-stack (entrambi). IPv4 e IPv6 vengono addebitati alla stessa tariffa. Possono essere associati a un load balancer o a un'interfaccia di rete (NIC).
- SKU — Basic o Standard. Lo SKU dell'IP pubblico deve corrispondere allo SKU del load balancer con cui viene usato. Raccomandato Standard per i nuovi deployment.
- Livello (Tier) — Regional (default) o Global. Un IP Global è usato con un bilanciatore di carico interregionale che distribuisce il traffico tra back-end in regioni diverse. Un IP Regional gestisce il traffico all'interno della stessa regione. Il livello dell'IP deve corrispondere al livello del load balancer associato.
- Assegnazione — Statica o Dinamica. Gli IP statici vengono assegnati al momento della creazione della risorsa IP pubblica e non vengono rilasciati finché la risorsa IP non viene eliminata esplicitamente — indipendentemente dalla VM o dal servizio a cui sono associati.

**Note operative** _(stepTitle: Calibri 11pt grassetto #000000 keepNext)_

- Gli IP pubblici Standard sono ridondanti per zona per default e supportano scenari di alta disponibilità.
- Un IP pubblico non associato ad alcuna risorsa genera comunque un costo.
- Gli IP pubblici vengono spesso usati con i servizi di bilanciamento del carico.

### 3.1.7 — Associare indirizzi IP pubblici
_(h3: Calibri 12pt grassetto #2D5F8A keepNext)_

Un indirizzo IP pubblico può essere associato a diverse risorse Azure. Il punto di configurazione varia a seconda del tipo di risorsa:

[TABELLA: publicIpAssocTable] _(tabella generata da codice — vedere JS per la struttura)_

*Tabella 4 — Come associare un IP pubblico in base al tipo di risorsa Azure.* _(caption: Calibri 9pt corsivo grigio centrato)_


**Funzionalità dello SKU Standard** _(stepTitle: Calibri 11pt grassetto #000000 keepNext)_

[TABELLA: publicIpSkuTable] _(tabella generata da codice — vedere JS per la struttura)_

*Tabella 5 — Funzionalità dello SKU Standard per gli indirizzi IP pubblici.* _(caption: Calibri 9pt corsivo grigio centrato)_


### 3.1.8 — Allocare o assegnare indirizzi IP privati
_(h3: Calibri 12pt grassetto #2D5F8A keepNext)_

Gli indirizzi IP privati vengono assegnati alle risorse che risiedono all'interno di una VNet. Le risorse con IP privato possono comunicare con altre risorse nella stessa VNet, con reti collegate tramite peering e con reti on-premise tramite VPN o ExpressRoute.


**Risorse che supportano IP privati** _(stepTitle: Calibri 11pt grassetto #000000 keepNext)_

[TABELLA: privateIpTable] _(tabella generata da codice — vedere JS per la struttura)_

*Tabella 6 — Risorse Azure che supportano indirizzi IP privati e modalità di assegnazione.* _(caption: Calibri 9pt corsivo grigio centrato)_


**Metodi di assegnazione** _(stepTitle: Calibri 11pt grassetto #000000 keepNext)_

- Dinamico — Azure assegna il prossimo indirizzo disponibile non assegnato o non riservato nell'intervallo della subnet. È il metodo predefinito. Esempio: se 10.0.0.4–10.0.0.9 sono già assegnati, Azure assegna 10.0.0.10 alla nuova risorsa.
- Statico — l'amministratore sceglie un indirizzo specifico disponibile nell'intervallo della subnet. Esempio: con subnet 10.0.0.0/16 e indirizzi 10.0.0.4–10.0.0.9 già usati, è possibile assegnare qualsiasi indirizzo tra 10.0.0.10 e 10.0.255.254.
L'assegnazione statica è consigliata per: server DNS, domain controller, database, firewall e qualsiasi risorsa referenziata da altri servizi tramite IP fisso.


---

### MODULO 3.2


## 3.2 — Configurare i gruppi di sicurezza di rete
_(h2: Calibri 14pt grassetto #0078D4 keepNext)_


### 3.2.1 — Introduzione
_(h3: Calibri 12pt grassetto #2D5F8A keepNext)_

Un gruppo di sicurezza di rete (NSG) è un filtro del traffico di rete che consente o nega il traffico verso le risorse Azure. Ogni NSG contiene regole di sicurezza che valutano il traffico in entrata (inbound) e in uscita (outbound) in base a: protocollo, porta, indirizzo IP di origine e di destinazione. Un NSG può essere associato a una subnet, a una NIC o a entrambe.


### 3.2.2 — Implementare i gruppi di sicurezza di rete
_(h3: Calibri 12pt grassetto #2D5F8A keepNext)_

Gli NSG operano a livello di subnet e/o di interfaccia di rete (NIC). Possono essere associati a più subnet e NIC, ma una subnet o NIC può essere associata a un solo NSG alla volta.


**Come funzionano gli NSG** _(stepTitle: Calibri 11pt grassetto #000000 keepNext)_

- Traffico in entrata — Azure valuta prima le regole dell'NSG associato alla subnet, poi quelle dell'NSG associato alla NIC.
- Traffico in uscita — Azure valuta prima le regole dell'NSG associato alla NIC, poi quelle dell'NSG associato alla subnet.
- Se nessun NSG è associato, tutto il traffico è consentito tra le risorse nella stessa VNet.
- Un NSG è una risorsa autonoma che può essere creata indipendentemente dalle subnet o NIC a cui verrà associato.

**NSG e subnet — zona DMZ** _(stepTitle: Calibri 11pt grassetto #000000 keepNext)_

Assegnando un NSG a una subnet si crea una subnet protetta, detta anche zona demilitarizzata (DMZ). La DMZ funge da buffer tra le risorse interne alla VNet e Internet, consentendo solo il traffico esplicitamente autorizzato. Ogni subnet può avere al massimo un NSG associato.


**NSG e interfacce di rete** _(stepTitle: Calibri 11pt grassetto #000000 keepNext)_

È possibile assegnare un NSG anche direttamente a una NIC per controllare tutto il traffico che transita attraverso quell'interfaccia. A ogni NIC presente in una subnet è possibile associare zero o un NSG. La pagina Panoramica di una VM nel portale mostra tutti gli NSG associati, le subnet e le NIC assegnate e le regole di sicurezza definite.

![imgNsgPortal](img/imgNsgPortal) _(dimensioni: 861×191 px)_

*Figura 29 — Panoramica di un NSG nel portale Azure: gruppo di risorse, località, subnet e interfacce di rete associati, regole personalizzate in entrata e in uscita.* _(caption: Calibri 9pt corsivo grigio centrato)_


> **Best practice**: Associare NSG a livello di subnet anziché di singola NIC per una gestione più semplice e scalabile. Usare gli NSG a livello di NIC solo per casi eccezionali che richiedono regole differenziate per VM nella stessa subnet.
_(infoBox: sfondo #E8F0FB bordo sinistro #0078D4)_


### 3.2.3 — Determinare le regole dei gruppi di sicurezza di rete
_(h3: Calibri 12pt grassetto #2D5F8A keepNext)_

Ogni NSG contiene un insieme di regole di sicurezza predefinite che non possono essere eliminate, ma possono essere sostituite da regole personalizzate con priorità più alta. Ogni regola è definita da:

- Nome — identificatore univoco della regola nell'NSG.
- Priorità — numero tra 100 e 4096. Le regole vengono elaborate in ordine crescente di priorità. Una volta trovata una corrispondenza, l'elaborazione si ferma.
- Origine/Destinazione — indirizzo IP, intervallo CIDR, tag di servizio o gruppo di sicurezza delle applicazioni (ASG).
- Protocollo — TCP, UDP, ICMP, ESP, AH o Any. ESP (Encapsulating Security Payload) e AH (Authentication Header) sono disponibili solo tramite template JSON e PowerShell.
- Direzione — Inbound o Outbound.
- Intervallo di porte — porta singola (es. 80), intervallo (es. 8080-8090) o wildcard (*).
- Azione — Allow o Deny.
Non è possibile rimuovere le regole predefinite, ma è possibile eseguirne l'override creando una nuova regola con priorità più alta (numero più basso).


> **Comportamento predefinito degli NSG**: Le regole predefinite negano tutto il traffico in entrata ad eccezione di quello proveniente dalla VNet e dal load balancer Azure. In uscita, consentono tutto il traffico verso la VNet e verso Internet. Qualsiasi traffico non coperto da una regola esplicita viene negato dalla regola DenyAll finale.
_(infoBox: sfondo #E8F0FB bordo sinistro #0078D4)_


**Tabella impostazioni configurabili per una regola** _(stepTitle: Calibri 11pt grassetto #000000 keepNext)_

[TABELLA: nsgRuleSettingsTable] _(tabella generata da codice — vedere JS per la struttura)_

*Tabella 7 — Impostazioni configurabili per una regola di sicurezza NSG.* _(caption: Calibri 9pt corsivo grigio centrato)_


**Regole predefinite inbound** _(stepTitle: Calibri 11pt grassetto #000000 keepNext)_

![imgNsgInbound](img/imgNsgInbound) _(dimensioni: 858×247 px)_

*Figura 30 — Regole di sicurezza in ingresso predefinite: AllowVnetInBound (65000), AllowAzureLoadBalancerInBound (65001), DenyAllInBound (65500).* _(caption: Calibri 9pt corsivo grigio centrato)_


**Regole predefinite outbound** _(stepTitle: Calibri 11pt grassetto #000000 keepNext)_

![imgNsgOutbound](img/imgNsgOutbound) _(dimensioni: 858×236 px)_

*Figura 31 — Regole di sicurezza in uscita predefinite: AllowVnetOutBound (65000), AllowInternetOutBound (65001), DenyAllOutBound (65500).* _(caption: Calibri 9pt corsivo grigio centrato)_


### 3.2.4 — Determinare le regole effettive dei gruppi di sicurezza di rete
_(h3: Calibri 12pt grassetto #2D5F8A keepNext)_

Ogni NSG e le sue regole vengono valutati in modo indipendente. Azure elabora le condizioni di ogni regola per ogni VM nella configurazione.

- Traffico in entrata — Azure elabora prima le regole dell'NSG della subnet, poi quelle dell'NSG della NIC.
- Traffico in uscita — Azure elabora prima le regole dell'NSG della NIC, poi quelle dell'NSG della subnet.
- Azure considera anche il traffico intra-subnet: le regole dell'NSG associato a una subnet possono influire sul traffico tra VM nella stessa subnet.
![imgNsgMultiple](img/imgNsgMultiple) _(dimensioni: 650×478 px)_

*Figura 32 — Due NSG applicati a una subnet: NSG1 associato alla NIC di VM1 e NSG2 associato alla subnet. Ogni NSG viene valutato in modo indipendente per determinare le regole effettive.* _(caption: Calibri 9pt corsivo grigio centrato)_


**Considerazioni per regole efficaci** _(stepTitle: Calibri 11pt grassetto #000000 keepNext)_

- Consentire tutto il traffico — se non è necessario regolare il traffico verso una risorsa a un determinato livello, non associare un NSG a quel livello. In assenza di NSG, le regole predefinite Azure consentono tutto il traffico.
- Importanza delle regole di autorizzazione — se un NSG è associato sia alla subnet che alla NIC, occorre definire una regola Allow a entrambi i livelli. Se manca la regola Allow a uno dei livelli, il traffico viene bloccato.
- Traffico intra-subnet — le regole NSG della subnet si applicano anche al traffico tra VM nella stessa subnet. Per bloccare la comunicazione intra-subnet è sufficiente aggiungere una regola Deny per tutto il traffico in ingresso e in uscita.
- Priorità delle regole — assegnare valori di priorità con intervalli (100, 200, 300, ecc.) per poter inserire nuove regole in futuro senza dover rinumerare quelle esistenti.

**Visualizzare le regole di sicurezza effettive** _(stepTitle: Calibri 11pt grassetto #000000 keepNext)_

Se sono presenti più NSG e non si è certi delle regole applicate, è possibile usare il collegamento Regole di sicurezza valide nel portale Azure. Si trova nella pagina della VM → Rete → Regole di sicurezza valide.

![imgNsgEffective](img/imgNsgEffective) _(dimensioni: 859×65 px)_


> **Network Watcher**: Azure Network Watcher offre una visualizzazione consolidata delle regole NSG e delle regole di amministrazione della sicurezza. La funzionalità IP Flow Verify valuta il traffico rispetto alle regole effettive e indica se una connessione specifica verrebbe consentita o negata.
_(infoBox: sfondo #E8F0FB bordo sinistro #0078D4)_


### 3.2.5 — Creare regole del gruppo di sicurezza di rete
_(h3: Calibri 12pt grassetto #2D5F8A keepNext)_

Le regole NSG si creano dal portale Azure, PowerShell, CLI o template ARM. Ogni regola usa un approccio a 5 tuple per valutare il traffico: IP sorgente, porta sorgente, IP destinazione, porta destinazione e protocollo. Questo permette di creare regole allow/deny precise e granulari.


**Gli NSG sono stateful** _(stepTitle: Calibri 11pt grassetto #000000 keepNext)_

Gli NSG sono dispositivi stateful: tengono traccia delle connessioni attive tramite flow record. Questo significa che se si crea una regola outbound sulla porta 80, non è necessario creare una regola inbound separata per il traffico di risposta — viene automaticamente consentito come parte della connessione stabilita.


> **Stateful vs Stateless**: Un firewall stateful ricorda le connessioni aperte. Un firewall stateless valuta ogni pacchetto in modo indipendente. Gli NSG Azure sono stateful — la risposta a una connessione consentita è sempre permessa, senza dover scrivere regole bidirezionali.
_(infoBox: sfondo #E8F0FB bordo sinistro #0078D4)_


**Creazione di regole — considerazioni** _(stepTitle: Calibri 11pt grassetto #000000 keepNext)_

- Le regole con priorità più bassa (numero più piccolo) vengono elaborate prima e hanno precedenza.
- Non è possibile creare due regole con la stessa priorità nella stessa direzione.
- Usare il campo Servizio per selezionare protocolli predefiniti come RDP, SSH, HTTPS, oppure specificare porte personalizzate.
- Esempio — consentire traffico RDP (porta 3389) da un IP specifico: priorità 300, TCP, source 203.0.113.10, dest *, porta 3389, Allow.
- Esempio — bloccare tutto il traffico HTTP in entrata: priorità 400, TCP, source *, dest *, porta 80, Deny.

**Tag di servizio** _(stepTitle: Calibri 11pt grassetto #000000 keepNext)_

I tag di servizio sono identificatori predefiniti che rappresentano gruppi di prefissi IP di servizi Azure. Eliminano la necessità di aggiornare manualmente le regole quando cambiano gli indirizzi IP dei servizi. I più usati:

- Internet — tutti gli indirizzi IP pubblici esterni alla VNet.
- VirtualNetwork — tutto lo spazio di indirizzi della VNet e delle reti connesse.
- AzureLoadBalancer — indirizzo IP virtuale del load balancer Azure (168.63.129.16).
- AzureCloud — tutti gli indirizzi IP pubblici di Azure, inclusi i datacenter.
- Storage, Sql, AzureActiveDirectory — tag specifici per servizi Azure.

**Regole di sicurezza aumentate** _(stepTitle: Calibri 11pt grassetto #000000 keepNext)_

Una singola regola NSG può contenere più valori nei campi Origine, Destinazione e Servizio. Questo approccio riduce il numero totale di regole necessarie e semplifica la gestione:

- Più indirizzi IP — combinare più indirizzi IP o intervalli CIDR in una sola regola anziché crearne una per ciascuno.
- Più porte — specificare più porte e intervalli nel campo Servizio (es. 80, 443, 8080-8090 in un'unica regola).
- Mix di origine — combinare tag di servizio, ASG e indirizzi IP all'interno della stessa regola.

> **Esempio pratico**: Invece di creare 4 regole separate per le porte 80, 443, 8080 e 8090, creare una sola regola con tutte le porte nel campo Servizio. In ambienti aziendali con molti intervalli IP o servizi, le regole aumentate evitano la proliferazione delle regole NSG.
_(infoBox: sfondo #E8F0FB bordo sinistro #0078D4)_


### 3.2.6 — Implementare gruppi di sicurezza delle applicazioni
_(h3: Calibri 12pt grassetto #2D5F8A keepNext)_

I gruppi di sicurezza delle applicazioni (ASG) permettono di raggruppare le VM in base al ruolo applicativo e usare questi gruppi nelle regole NSG al posto di indirizzi IP specifici. Questo semplifica enormemente la gestione della sicurezza in ambienti con molte VM.


**Come funzionano gli ASG** _(stepTitle: Calibri 11pt grassetto #000000 keepNext)_

- Si crea un ASG (es. WebServers, AppServers, DbServers) e si assegna a ogni NIC delle VM del gruppo.
- Nelle regole NSG si usa il nome dell'ASG come origine o destinazione al posto di indirizzi IP.
- Quando si aggiunge una nuova VM al gruppo, basta associare la NIC all'ASG — le regole NSG si applicano automaticamente senza modifiche.
- Una NIC può essere associata a più ASG. Un ASG può essere usato sia come origine che come destinazione nella stessa regola.

**Scenario di esempio — rivenditore online** _(stepTitle: Calibri 11pt grassetto #000000 keepNext)_

Scenario con due livelli: WebServers (gestiscono traffico HTTP/HTTPS da Internet) e AppLServers (elaborano richieste SQL dai WebServers).

![imgAsgDiagram](img/imgAsgDiagram) _(dimensioni: 320×274 px)_

*Figura 34 — ASG applicati a una VNet: Internet accede ai WebServers su porte 80/443; i WebServers accedono agli AppLServers sulla porta SQL 1433.* _(caption: Calibri 9pt corsivo grigio centrato)_

La configurazione richiede 3 regole NSG:

- Regola 1 (priorità 100) — consenti traffico da Internet verso ASG WebServers su porte 80 e 443. La priorità più bassa garantisce che i clienti possano sempre accedere al catalogo online.
- Regola 2 (priorità 110) — consenti traffico da ASG WebServers verso ASG AppLServers sulla porta 1433 (SQL).
- Regola 3 (priorità 120) — nega tutto il traffico verso ASG AppLServers su porte 80 e 443. La combinazione di Regola 2 e Regola 3 garantisce che solo i WebServers possano raggiungere i server di database, proteggendoli da accessi esterni diretti.

**Vantaggi degli ASG** _(stepTitle: Calibri 11pt grassetto #000000 keepNext)_

- Gestione degli indirizzi IP — non è necessario specificare IP singoli nelle regole. Se una VM viene sostituita o aggiunto un nuovo server, basta aggiungere la NIC all'ASG senza toccare le regole NSG.
- Nessun vincolo di subnet — le VM possono essere organizzate logicamente per applicazione e scopo, indipendentemente dalla subnet in cui si trovano.
- Regole semplificate — una sola regola NSG copre tutte le VM dell'ASG. Le nuove regole si applicano automaticamente a tutte le VM nel gruppo designato.
- Supporto dei carichi di lavoro — la configurazione rispecchia la struttura applicativa (WebServers, AppServers, DbServers) rendendola più leggibile e manutenibile.

> **ASG vs tag di servizio**: I tag di servizio semplificano la gestione degli indirizzi IP per i servizi Azure gestiti (Storage, SQL, AzureCloud, ecc.). Gli ASG invece raggruppano le VM personalizzate e gestiscono i criteri di sicurezza in base a quei gruppi. I due strumenti sono complementari e possono essere usati insieme nella stessa regola NSG.
_(infoBox: sfondo #E8F0FB bordo sinistro #0078D4)_


---

### PAGINA 6 — MACRO MODULO 4


# Implementare e gestire l'archiviazione in Azure
_(moduloTitle: Calibri 24pt grassetto #1B3A6B, bordo blu sotto, pageBreakBefore)_

_Questo percorso illustra le soluzioni di archiviazione in Azure, dalla configurazione degli account alle strategie di ridondanza. La scelta corretta è cruciale per performance, costi e conformità normativa._


---

### PAGINA 7 — MACRO MODULO 5


# Distribuire e gestire risorse di calcolo di Azure
_(moduloTitle: Calibri 24pt grassetto #1B3A6B, bordo blu sotto, pageBreakBefore)_

_Questo percorso copre le principali risorse di calcolo in Azure, dalla gestione delle macchine virtuali alle soluzioni container e PaaS. Un amministratore deve saper scegliere e configurare la risorsa più adatta al carico di lavoro._


---

### PAGINA 8 — MACRO MODULO 6


# Monitorare ed eseguire il backup delle risorse di Azure
_(moduloTitle: Calibri 24pt grassetto #1B3A6B, bordo blu sotto, pageBreakBefore)_

_Questo percorso affronta il monitoraggio proattivo delle risorse Azure e le strategie di backup e disaster recovery. Un amministratore deve garantire visibilità sull'infrastruttura e piani di ripristino efficaci._
