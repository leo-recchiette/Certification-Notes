'use strict';
const fs = require('fs');
const path = require('path');
const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, ImageRun,
  AlignmentType, LevelFormat, TabStopType,
  BorderStyle, WidthType, ShadingType, VerticalAlign, PageBreak
} = require('docx');

const C = {
  titleBlue: '1B3A6B', sectionBlue: '0078D4', tocEntry: '2D5F8A',
  bodyText: '333333', subtle: '555555', caption: '888888',
  white: 'FFFFFF', headerBg: '1F4E78', rowEven: 'F5F8FC',
  infoBoxBg: 'E8F0FB', codeBg: 'EEF3F8', codeText: '1B3A6B', border: 'CCCCCC',
};

const IMG_DIR = path.join(__dirname, 'img');
function loadImg(f) {
  try { return fs.readFileSync(path.join(IMG_DIR, f)); }
  catch(e) { console.warn('  [WARN] Img not found: ' + f); return null; }
}
const imgs = {
  cloudShell:       loadImg('Module 1 - Prerequisiti per gli amministratori di Azure/cloud-shell-powershell.png'),
  entraDS:          loadImg('Module 2 - Gestire identità e governance in Azure/entra-domain-services.png'),
  entraUsers:       loadImg('Module 2 - Gestire identità e governance in Azure/entra-users.png'),
  entraGroups:      loadImg('Module 2 - Gestire identità e governance in Azure/entra-groups.png'),
  cloudGovSteps:    loadImg('Module 2 - Gestire identità e governance in Azure/cloud-governance-steps.png'),
  azureGovHierarchy:loadImg('Module 2 - Gestire identità e governance in Azure/azure-governance-hierarchy.png'),
  azurePolicyArm:   loadImg('Module 2 - Gestire identità e governance in Azure/azure-policy-arm.png'),
  rbacSecPrincipal: loadImg('Module 2 - Gestire identità e governance in Azure/rbac-security-principal.png'),
  rbacRoleDef:      loadImg('Module 2 - Gestire identità e governance in Azure/rbac-role-definition.png'),
  rbacRolesHierarchy:loadImg('Module 2 - Gestire identità e governance in Azure/rbac-roles-hierarchy.png'),
  rbacIamPortal:    loadImg('Module 2 - Gestire identità e governance in Azure/rbac-iam-portal.png'),
  ipAddressing:     loadImg('Module 3 - Configurare e gestire reti virtuali/ip-addressing.png'),
  nsgPortal:        loadImg('Module 3 - Configurare e gestire reti virtuali/nsg-portal.png'),
  nsgInbound:       loadImg('Module 3 - Configurare e gestire reti virtuali/nsg-inbound-rules.png'),
  nsgOutbound:      loadImg('Module 3 - Configurare e gestire reti virtuali/nsg-outbound-rules.png'),
  nsgMultiple:      loadImg('Module 3 - Configurare e gestire reti virtuali/nsg-multiple.png'),
  nsgEffective:     loadImg('Module 3 - Configurare e gestire reti virtuali/nsg-effective-rules.png'),
  asgDiagram:       loadImg('Module 3 - Configurare e gestire reti virtuali/asg-diagram.png'),
};

const noSpacing = {before:0,after:0};
const stdSpacing = {before:60,after:60};

function body(text, opts={}) {
  return new Paragraph({ spacing:stdSpacing,
    children:[new TextRun({text, font:'Calibri', size:22, color:C.bodyText, ...opts})] });
}
function h2(text) {
  return new Paragraph({ spacing:{before:200,after:80}, keepNext:true,
    children:[new TextRun({text, font:'Calibri', size:28, bold:true, color:C.sectionBlue})] });
}
function h3(text) {
  return new Paragraph({ spacing:{before:140,after:60}, keepNext:true,
    children:[new TextRun({text, font:'Calibri', size:24, bold:true, color:C.tocEntry})] });
}
function stepTitle(text) {
  return new Paragraph({ spacing:{before:100,after:40}, keepNext:true,
    children:[new TextRun({text, font:'Calibri', size:22, bold:true, color:'000000'})] });
}
function bullet(text, level=0) {
  return new Paragraph({ spacing:{before:40,after:40}, numbering:{reference:'bullets',level},
    children:[new TextRun({text, font:'Calibri', size:22, color:C.bodyText})] });
}
function caption(text) {
  return new Paragraph({ alignment:AlignmentType.CENTER, spacing:{before:40,after:80},
    children:[new TextRun({text, font:'Calibri', size:18, italics:true, color:C.caption})] });
}
function codeBlock(lines) {
  const arr = Array.isArray(lines)?lines:[lines];
  return arr.map(line => new Paragraph({ spacing:noSpacing,
    shading:{fill:C.codeBg, type:ShadingType.CLEAR}, indent:{left:360,right:360},
    children:[new TextRun({text:line, font:'Courier New', size:18, color:C.codeText})] }));
}
function infoBox(label, text) {
  const children = [];
  if(label) children.push(new TextRun({text:label+' ', font:'Calibri', size:22, bold:true, color:C.sectionBlue}));
  children.push(new TextRun({text, font:'Calibri', size:22, color:C.bodyText}));
  return new Paragraph({ spacing:stdSpacing, indent:{left:360,right:360},
    border:{left:{style:BorderStyle.SINGLE, size:12, color:C.sectionBlue}},
    shading:{fill:C.infoBoxBg, type:ShadingType.CLEAR}, children });
}
function spacer(n=1) {
  return Array.from({length:n}, ()=>new Paragraph({spacing:noSpacing, children:[new TextRun('')]}));
}
function figImg(data, ext, origW, origH, label) {
  const MAX_W_EMU=6123000;
  const origW_emu=origW*9144, origH_emu=origH*9144;
  let dw=origW_emu, dh=origH_emu;
  if(dw>MAX_W_EMU){dh=Math.round(dh*MAX_W_EMU/dw);dw=MAX_W_EMU;}
  const items=[];
  if(data) items.push(new Paragraph({ alignment:AlignmentType.CENTER, spacing:{before:80,after:0},
    children:[new ImageRun({data, transformation:{width:Math.round(dw/9144), height:Math.round(dh/9144)}, type:ext})] }));
  if(label) items.push(caption(label));
  return items;
}

const FULL_WIDTH=8640;
function tableCell(text, opts={}) {
  const {fill=C.white, bold=false, color=C.bodyText, width} = opts;
  const tblBorder={style:BorderStyle.SINGLE, size:1, color:C.border};
  return new TableCell({ width:width?{size:width,type:WidthType.DXA}:undefined,
    shading:{fill, type:ShadingType.CLEAR}, margins:{top:80,bottom:80,left:120,right:120},
    borders:{top:tblBorder,bottom:tblBorder,left:tblBorder,right:tblBorder},
    verticalAlign:VerticalAlign.CENTER,
    children:[new Paragraph({ spacing:noSpacing,
      children:[new TextRun({text, font:'Calibri', size:20, bold,
        color:fill===C.headerBg?C.white:color})] })] });
}
function makeTable(headers, rows, colWidths) {
  const widths=colWidths||headers.map(()=>Math.floor(FULL_WIDTH/headers.length));
  const tblBorder={style:BorderStyle.SINGLE, size:1, color:C.border};
  const borders={top:tblBorder,bottom:tblBorder,left:tblBorder,right:tblBorder,insideH:tblBorder,insideV:tblBorder};
  const headerRow=new TableRow({ cantSplit:true,
    children:headers.map((h,i)=>tableCell(h,{fill:C.headerBg, bold:true, width:widths[i]})) });
  const dataRows=rows.map((row,ri)=>{
    const fill=ri%2===0?C.rowEven:C.white;
    return new TableRow({ cantSplit:true,
      children:row.map((cell,ci)=>{
        if(typeof cell==='object'&&cell.text!==undefined)
          return tableCell(cell.text,{fill, bold:cell.bold, width:widths[ci]});
        return tableCell(cell,{fill, width:widths[ci]});
      }) });
  });
  return new Table({ width:{size:FULL_WIDTH,type:WidthType.DXA}, columnWidths:widths, borders, rows:[headerRow,...dataRows] });
}

function moduloTitle(text) {
  return new Paragraph({ spacing:{before:0,after:120}, pageBreakBefore:true,
    border:{bottom:{style:BorderStyle.SINGLE, size:8, color:C.sectionBlue, space:4}},
    children:[new TextRun({text, font:'Calibri', size:48, bold:true, color:C.titleBlue})] });
}
function moduloIntro(text) {
  return new Paragraph({ spacing:{before:80,after:120},
    children:[new TextRun({text, font:'Calibri', size:22, italics:true, color:C.bodyText})] });
}

function tocTitle() {
  return new Paragraph({ spacing:{before:0,after:80},
    border:{bottom:{style:BorderStyle.SINGLE, size:8, color:C.sectionBlue, space:4}},
    children:[new TextRun({text:'Sommario', font:'Calibri', size:36, bold:true, color:C.titleBlue})] });
}
function tocMacro(text) {
  return new Paragraph({ spacing:{before:120,after:40},
    children:[new TextRun({text, font:'Calibri', size:24, bold:true, color:C.titleBlue})] });
}
function tocHeading(text) {
  return new Paragraph({ spacing:{before:60,after:20}, indent:{left:360},
    children:[new TextRun({text, font:'Calibri', size:22, bold:true, color:C.sectionBlue})] });
}
function tocEntry(text) {
  const tabStop={type:TabStopType.RIGHT, position:8200, leader:'dot'};
  return new Paragraph({ spacing:{before:20,after:20}, indent:{left:720}, tabStops:[tabStop],
    children:[
      new TextRun({text, font:'Calibri', size:20, color:C.tocEntry}),
      new TextRun({text:'\t...', font:'Calibri', size:20, color:C.caption}),
    ] });
}

// ─── TABELLE DATI ─────────────────────────────────────────────────────────────
function toolsTable() {
  return makeTable(['Strumento','Descrizione'],[
    ['Azure CLI','Interfaccia a riga di comando multipiattaforma per gestire risorse Azure tramite comandi az.'],
    ['Azure PowerShell (Az module)','Modulo PowerShell con cmdlet per gestire risorse Azure (New-Az*, Get-Az*, Set-Az*, Remove-Az*).'],
    ['kubectl','Strumento CLI per gestire cluster Kubernetes, inclusi quelli su Azure Kubernetes Service (AKS).'],
    ['Terraform','Strumento IaC open-source di HashiCorp per definire e distribuire infrastruttura in modo dichiarativo.'],
    ['git','Sistema di controllo versione distribuito, preinstallato per gestire template e script.'],
    ['Editors (vim, nano, code)','Editor di testo e VS Code Server per modificare file direttamente nella sessione Cloud Shell.'],
  ],[2160,6480]);
}
function armStructureTable() {
  return makeTable(['Elemento','Obbligatorio','Descrizione'],[
    ['$schema',{text:'Sì',bold:true},'URL dello schema JSON che descrive la versione del linguaggio del template.'],
    ['contentVersion',{text:'Sì',bold:true},'Versione del template (es. 1.0.0.0). Non viene usata da Azure, ma utile per il versioning interno.'],
    ['parameters','No','Valori passati dall\'esterno al momento della distribuzione per personalizzare il template.'],
    ['variables','No','Valori calcolati una volta e riusati nel template per evitare ripetizioni.'],
    ['functions','No','Funzioni ARM personalizzate definite dall\'utente (user-defined functions).'],
    ['resources',{text:'Sì',bold:true},'Le risorse Azure da distribuire o aggiornare (VM, storage, rete, ecc.).'],
    ['outputs','No','Valori restituiti al termine della distribuzione (endpoint, ID risorse, chiavi, ecc.).'],
  ],[2160,1440,5040]);
}
function reservedTable() {
  return makeTable(['Indirizzo','Motivo della riserva'],[
    ['192.168.1.0','Indirizzo di rete (network address).'],
    ['192.168.1.1','Gateway predefinito di Azure.'],
    ['192.168.1.2','DNS di Azure mappato allo spazio di indirizzi virtuale.'],
    ['192.168.1.3','DNS di Azure mappato allo spazio di indirizzi virtuale (secondo DNS).'],
    ['192.168.1.255','Indirizzo di broadcast della subnet.'],
  ],[2160,6480]);
}
function publicIpAssocTable() {
  return makeTable(['Tipo di risorsa','Come associare l\'IP pubblico'],[
    ['Macchina virtuale (VM)','Configurazione della NIC (scheda di rete) della VM.'],
    ['Load Balancer','Configurazione del front-end del load balancer.'],
    ['Gateway VPN','Configurazione del gateway.'],
    ['Gateway applicazione','Configurazione del front-end del gateway applicazione.'],
    ['Firewall di Azure','Configurazione del firewall.'],
    ['NAT Gateway','Configurazione del NAT Gateway.'],
  ],[3240,5400]);
}
function publicIpSkuTable() {
  return makeTable(['Funzionalita\'','Descrizione'],[
    ['Zona di disponibilita\'','Ridondante per zona per impostazione predefinita.'],
    ['Routing','Supporta preferenza routing: rete Microsoft (default) o Internet.'],
    ['Indirizzi IPv4 e IPv6','Supporta entrambi i protocolli con dual-stack.'],
    ['Assegnazione','Solo statica. L\'IP viene assegnato al momento della creazione.'],
    ['Sicurezza','Richiede NSG esplicito — secure by default (tutto negato finche\' non autorizzato).'],
    ['Tier globale','Supporta indirizzi IP globali per load balancer interregionali.'],
  ],[3240,5400]);
}
function privateIpTable() {
  return makeTable(['Risorsa','Punto di assegnazione','Metodi'],[
    ['Macchina virtuale (VM)','Configurazione IP della NIC','Dinamico o Statico'],
    ['Load balancer interno','Configurazione front-end','Dinamico o Statico'],
    ['Gateway applicazione','Configurazione front-end','Dinamico o Statico'],
  ],[2880,3600,2160]);
}
function nsgRuleSettingsTable() {
  return makeTable(['Impostazione','Descrizione'],[
    ['Nome','Identificatore univoco della regola nell\'NSG (max 80 caratteri).'],
    ['Priorita\'','Numero tra 100 e 4096. Piu\' basso = maggiore precedenza.'],
    ['Porta','Porta singola (80), intervallo (8080-8090) o wildcard (*).'],
    ['Protocollo','TCP, UDP, ICMP, ESP, AH o Any.'],
    ['Direzione','Inbound (in entrata) o Outbound (in uscita).'],
    ['Origine','IP, CIDR, tag di servizio o ASG da cui proviene il traffico.'],
    ['Destinazione','IP, CIDR, tag di servizio o ASG verso cui e\' diretto il traffico.'],
    ['Azione','Allow (consenti) o Deny (nega).'],
  ],[2160,6480]);
}

// ─── COPERTINA ────────────────────────────────────────────────────────────────
function coverPage() {
  return [
    ...spacer(10),
    new Paragraph({ alignment:AlignmentType.CENTER, spacing:noSpacing,
      children:[new TextRun({text:'AZ-104', font:'Calibri', size:96, bold:true, color:C.titleBlue})] }),
    new Paragraph({ alignment:AlignmentType.CENTER, spacing:{before:40,after:40},
      children:[new TextRun({text:'Amministratore di Microsoft Azure', font:'Calibri', size:52, bold:true, color:C.sectionBlue})] }),
    new Paragraph({ alignment:AlignmentType.CENTER, spacing:{before:20,after:0},
      children:[new TextRun({text:'Note di studio e riassunti del percorso di apprendimento Microsoft Learn', font:'Calibri', size:26, italics:true, color:C.subtle})] }),
  ];
}

// ─── SOMMARIO ─────────────────────────────────────────────────────────────────
function sommario() {
  return [
    new Paragraph({pageBreakBefore:true, spacing:noSpacing, children:[new TextRun('')]}),
    tocTitle(),
    tocMacro('Prerequisiti per gli amministratori di Azure'),
    tocHeading('1.1 — Introduzione ad Azure Cloud Shell'),
    tocEntry('1.1.1 — Che cos\'e\' Azure Cloud Shell?'),
    tocEntry('1.1.2 — Come funziona Azure Cloud Shell?'),
    tocEntry('1.1.3 — Quando e\' consigliabile usare Azure Cloud Shell?'),
    tocHeading('1.2 — Distribuire l\'infrastruttura con i modelli ARM JSON'),
    tocEntry('1.2.1 — Struttura dei modelli di Azure Resource Manager'),
    tocEntry('1.2.2 — Esercizio: Creare e distribuire un modello ARM'),
    tocEntry('1.2.3 — Parametri e output nei modelli ARM'),
    tocMacro('Gestire identita\' e governance in Azure'),
    tocHeading('2.1 — Conoscere Microsoft Entra ID'),
    tocEntry('2.1.1 — Esaminare Microsoft Entra ID'),
    tocEntry('2.1.2 — Confronto tra Microsoft Entra ID e Active Directory Domain Services'),
    tocEntry('2.1.3 — Esaminare Microsoft Entra ID come servizio directory per le app cloud'),
    tocEntry('2.1.4 — Confrontare i piani P1 e P2 di Microsoft Entra ID'),
    tocEntry('2.1.5 — Esaminare Microsoft Entra Domain Services'),
    tocHeading('2.2 — Creare, configurare e gestire identita\''),
    tocEntry('2.2.1 — Creare, configurare e gestire utenti'),
    tocEntry('2.2.2 — Creare, configurare e gestire gruppi'),
    tocEntry('2.2.3 — Configurare e gestire la registrazione dei dispositivi'),
    tocEntry('2.2.4 — Gestire le licenze'),
    tocEntry('2.2.5 — Creare attributi di sicurezza personalizzati'),
    tocEntry('2.2.6 — Esplorare la creazione automatica degli utenti'),
    tocHeading('2.3 — Descrivere i componenti architetturali principali di Azure'),
    tocEntry('2.3.1 — Introduzione'),
    tocEntry('2.3.2 — Che cos\'e\' Microsoft Azure'),
    tocEntry('2.3.3 — Introduzione agli account Azure'),
    tocEntry('2.3.4 — Descrivere l\'infrastruttura fisica di Azure'),
    tocEntry('2.3.5 — Descrivere l\'infrastruttura di gestione di Azure'),
    tocEntry('Riepilogo'),
    tocHeading('2.4 — Iniziative di Criteri di Azure'),
    tocEntry('2.4.1 — Introduzione'),
    tocEntry('2.4.2 — Cloud Adoption Framework for Azure'),
    tocEntry('2.4.3 — Principi di progettazione di Azure Policy'),
    tocEntry('2.4.4 — Risorse di Azure Policy'),
    tocEntry('2.4.5 — Definizioni di Azure Policy'),
    tocEntry('2.4.6 — Valutazione delle risorse tramite Azure Policy'),
    tocHeading('2.5 — Proteggere le risorse con Azure RBAC'),
    tocEntry('2.5.1 — Introduzione'),
    tocEntry('2.5.2 — Che cos\'e\' il controllo degli accessi in base al ruolo di Azure?'),
    tocHeading('2.6 — Reimpostazione della password self-service (SSPR)'),
    tocEntry('2.6.1 — Introduzione'),
    tocEntry('2.6.2 — Che cos\'e\' la reimpostazione autonoma della password in Microsoft Entra ID?'),
    tocEntry('2.6.3 — Implementare la reimpostazione della password self-service'),
    tocMacro('Configurare e gestire reti virtuali per amministratori di Azure'),
    tocHeading('3.1 — Configurare reti virtuali'),
    tocEntry('3.1.1 — Introduzione'),
    tocEntry('3.1.2 — Pianificare le reti virtuali'),
    tocEntry('3.1.3 — Creare subnet'),
    tocEntry('3.1.4 — Creare reti virtuali'),
    tocEntry('3.1.5 — Pianificare l\'indirizzamento IP'),
    tocEntry('3.1.6 — Creare indirizzi IP pubblici'),
    tocEntry('3.1.7 — Associare indirizzi IP pubblici'),
    tocEntry('3.1.8 — Allocare o assegnare indirizzi IP privati'),
    tocHeading('3.2 — Configurare i gruppi di sicurezza di rete'),
    tocEntry('3.2.1 — Introduzione'),
    tocEntry('3.2.2 — Implementare i gruppi di sicurezza di rete'),
    tocEntry('3.2.3 — Determinare le regole dei gruppi di sicurezza di rete'),
    tocEntry('3.2.4 — Determinare le regole effettive dei gruppi di sicurezza di rete'),
    tocEntry('3.2.5 — Creare regole del gruppo di sicurezza di rete'),
    tocEntry('3.2.6 — Implementare gruppi di sicurezza delle applicazioni'),
    tocMacro('Implementare e gestire l\'archiviazione in Azure'),
    tocMacro('Distribuire e gestire risorse di calcolo di Azure'),
    tocMacro('Monitorare ed eseguire il backup delle risorse di Azure'),
  ];
}

// ─── Argomenti da riga di comando ────────────────────────────────────────────
// node create_az104.js              → documento completo
// node create_az104.js --toc        → solo copertina + sommario
// node create_az104.js --module 2   → solo copertina + Modulo 2
function parseArgs() {
  const args = process.argv.slice(2);
  if (args.includes('--toc')) return { mode: 'toc' };
  const mi = args.indexOf('--module');
  if (mi !== -1 && args[mi + 1]) {
    const n = parseInt(args[mi + 1], 10);
    if (isNaN(n) || n < 1 || n > 6) {
      console.error('Errore: --module accetta un numero da 1 a 6');
      process.exit(1);
    }
    return { mode: 'module', n };
  }
  return { mode: 'full' };
}

function outputPath(mode, n) {
  if (mode === 'toc')    return '/mnt/user-data/outputs/AZ-104_Sommario.docx';
  if (mode === 'module') return `/mnt/user-data/outputs/AZ-104_Modulo_${n}.docx`;
  return '/mnt/user-data/outputs/AZ-104_Note_di_Studio.docx';
}

// ─── Blocchi di contenuto per modulo ─────────────────────────────────────────
function modulo1(imgs) { return [
    moduloTitle('Prerequisiti per gli amministratori di Azure'),
    moduloIntro('Questo percorso introduce i fondamenti operativi per lavorare come amministratore di Microsoft Azure, con focus sugli strumenti di gestione interattiva e sull\'automazione dell\'infrastruttura tramite template dichiarativi.'),
    h2('1.1 — Introduzione ad Azure Cloud Shell'),
    h3('1.1.1 — Che cos\'e\' Azure Cloud Shell?'),
    body('Azure Cloud Shell e\' un ambiente shell interattivo e autenticato accessibile direttamente dal browser, senza necessita\' di installare nulla in locale. Supporta sia Bash che PowerShell e si integra nativamente con la sottoscrizione Azure dell\'utente.'),
    ...figImg(imgs.cloudShell,'png',955,576,'Figura 1 — Sessione di Azure Cloud Shell in modalita\' PowerShell all\'interno del portale di Azure.'),
    h3('1.1.2 — Come funziona Azure Cloud Shell?'),
    bullet('Viene eseguita in un container temporaneo su un host gestito da Microsoft.'),
    bullet('Ogni sessione riceve un ambiente fresco; i file persistono solo nel File Share di Azure collegato (Azure CloudDrive).'),
    bullet('Ha accesso diretto agli strumenti pre-installati: Azure CLI, Azure PowerShell, kubectl, Terraform, git e molti altri.'),
    bullet('L\'autenticazione e\' automatica tramite le credenziali della sessione Azure gia\' attiva.'),
    h3('1.1.3 — Quando e\' consigliabile usare Azure Cloud Shell?'),
    body('Cloud Shell e\' la scelta ideale quando si lavora da un dispositivo senza strumenti Azure installati, si vogliono eseguire script occasionali senza configurare un ambiente locale, oppure si desidera un accesso rapido e sicuro alla CLI da qualsiasi browser.'),
    ...spacer(1),
    toolsTable(),
    caption('Tabella 1 — Strumenti disponibili in una sessione Cloud Shell.'),
    h2('1.2 — Distribuire l\'infrastruttura con i modelli ARM JSON'),
    h3('1.2.1 — Struttura dei modelli di Azure Resource Manager'),
    body('L\'infrastruttura come codice (IaC) consente di descrivere tramite codice l\'intera infrastruttura necessaria per un\'applicazione. I vantaggi principali sono:'),
    bullet('Configurazioni coerenti — ogni distribuzione produce lo stesso risultato, eliminando la deriva della configurazione.'),
    bullet('Scalabilita\' migliorata — e\' semplice replicare ambienti identici (dev, test, prod) senza lavoro manuale.'),
    bullet('Distribuzioni piu\' veloci — Resource Manager crea le risorse in parallelo dove possibile.'),
    bullet('Migliore tracciabilita\' — ogni modifica al template e\' tracciata nel sistema di controllo versione (es. Git).'),
    bullet('Idempotenza — distribuire lo stesso template piu\' volte produce sempre lo stesso stato finale, senza duplicati.'),
    body('Un modello ARM e\' un file JSON che usa sintassi dichiarativa: si descrive cosa distribuire, non come farlo passo per passo. Gli elementi del file modello sono:'),
    ...spacer(1),
    armStructureTable(),
    caption('Tabella 2 — Elementi di un file modello ARM (* = obbligatorio).'),
    body('Esempio di template ARM completo per la distribuzione di un account di archiviazione:'),
    ...codeBlock(['{','  "$schema": "https://schema.management.azure.com/schemas/2019-04-01/deploymentTemplate.json#",','  "contentVersion": "1.0.0.1",','  "parameters": {},','  "variables": {},','  "functions": [],','  "resources": [','    {','      "type": "Microsoft.Storage/storageAccounts",','      "apiVersion": "2025-01-01",','      "name": "learntemplatestorage123",','      "location": "westus",','      "sku": { "name": "Standard_LRS" },','      "kind": "StorageV2",','      "properties": { "supportsHttpsTrafficOnly": true }','    }','  ],','  "outputs": {}','}']),
    body('Per dichiarare dipendenze tra risorse si usa la proprieta\' dependsOn. Ad esempio, una Azure Function App richiede obbligatoriamente: Microsoft.Storage/storageAccounts e Microsoft.Web/serverfarms.'),
    h3('1.2.2 — Esercizio: Creare e distribuire un modello ARM'),
    stepTitle('Setup ambiente'),
    bullet('Installare PowerShell 7 (versione x64) da aka.ms/powershell.'),
    bullet('In VS Code, installare l\'estensione PowerShell di Microsoft: Ctrl+P -> ext install powershell.'),
    bullet('Impostare PowerShell 7 come shell di default: Ctrl+Shift+P -> PowerShell: Show Session Menu.'),
    bullet('Installare il modulo Az da terminale PS7:'),
    ...codeBlock('Install-Module -Name Az -Scope CurrentUser -Repository PSGallery -Force'),
    stepTitle('Login ad Azure'),
    bullet('Eseguire il login con device code flow:'),
    ...codeBlock('Connect-AzAccount -UseDeviceAuthentication'),
    bullet('Aprire manualmente https://microsoft.com/devicelogin e inserire il codice mostrato nel terminale.'),
    stepTitle('Preparazione Resource Group'),
    bullet('Creare il resource group rsg-1 in Italy North:'),
    ...codeBlock('New-AzResourceGroup -Name "rsg-1" -Location "Italy North"'),
    bullet('Impostare il resource group di default:'),
    ...codeBlock('Set-AzDefault -ResourceGroupName "rsg-1"'),
    stepTitle('ARM Template — Fase 1: Template vuoto'),
    ...codeBlock(['{','  "$schema": "https://schema.management.azure.com/schemas/2019-04-01/deploymentTemplate.json#",','  "contentVersion": "1.0.0.0",','  "parameters": {},','  "functions": [],','  "variables": {},','  "resources": [],','  "outputs": {}','}']),
    ...codeBlock(['$templateFile = "azuredeploy.json"','$today = Get-Date -Format "MM-dd-yyyy"','$deploymentName = "blanktemplate-" + $today','New-AzResourceGroupDeployment -Name $deploymentName -TemplateFile $templateFile']),
    stepTitle('ARM Template — Fase 2: Aggiunta Storage Account'),
    ...codeBlock(['"resources": [','  {','    "type": "Microsoft.Storage/storageAccounts",','    "apiVersion": "2025-01-01",','    "name": "nomeunico123",','    "tags": { "displayName": "nomeunico123" },','    "location": "[resourceGroup().location]",','    "kind": "StorageV2",','    "sku": { "name": "Standard_LRS" }','  }',']']),
    ...codeBlock(['$deploymentName = "addstorage-" + $today','New-AzResourceGroupDeployment -Name $deploymentName -TemplateFile $templateFile']),
    h3('1.2.3 — Parametri e output nei modelli ARM'),
    body('I parametri rendono il template riutilizzabile. Gli output espongono valori prodotti dalla distribuzione verso sistemi esterni o step successivi di una pipeline.'),
    stepTitle('Parametri — concetti base'),
    bullet('type — tipo del valore: string, int, bool, object, array, secureString, secureObject.'),
    bullet('defaultValue — valore usato se non ne viene passato uno.'),
    bullet('allowedValues — lista di valori accettati; se si passa un valore fuori lista la distribuzione fallisce in fase di validazione.'),
    stepTitle('Esempio 1 — Parametro per il nome dello storage account'),
    ...codeBlock(['"parameters": {','  "storageName": {','    "type": "string",','    "minLength": 3,','    "maxLength": 24,','    "metadata": { "description": "The name of the Azure storage resource" }','  }','},']),
    ...codeBlock(['New-AzResourceGroupDeployment `','  -Name $deploymentName `','  -TemplateFile $templateFile `','  -storageName {your-unique-name}']),
    stepTitle('Esempio 2 — Parametro con allowedValues per limitare lo SKU'),
    ...codeBlock(['"storageSKU": {','  "type": "string",','  "defaultValue": "Standard_LRS",','  "allowedValues": ["Standard_LRS","Standard_GRS","Standard_RAGRS","Standard_ZRS","Premium_LRS","Premium_ZRS","Standard_GZRS","Standard_RAGZRS"]','}']),
    stepTitle('Esempio 3 — Output per esporre gli endpoint dello storage'),
    ...codeBlock(['"outputs": {','  "storageEndpoint": {','    "type": "object"','  }','}']),
    body('Al termine della distribuzione, PowerShell mostra l\'oggetto JSON con gli endpoint primari (blob, file, queue, table). Consultabili anche dal portale Azure: Gruppi di risorse -> rsg-1 -> Distribuzioni -> addOutputs -> Output.'),
  ]; }

function modulo2(imgs) { return [
    moduloTitle('Gestire identita\' e governance in Azure'),
    moduloIntro('Questo percorso affronta la gestione delle identita\' digitali e la governance dell\'infrastruttura Azure. Una corretta configurazione di identita\', accessi e policy e\' fondamentale per sicurezza e conformita\'.'),
    h2('2.1 — Conoscere Microsoft Entra ID'),
    h3('2.1.1 — Esaminare Microsoft Entra ID'),
    body('Microsoft Entra ID (precedentemente Azure Active Directory) e\' il servizio di gestione delle identita\' e degli accessi basato su cloud di Microsoft. Consente a dipendenti, partner ed utenti di accedere in modo sicuro a risorse esterne (Microsoft 365, portale Azure, SaaS) e interne.'),
    bullet('Non e\' la versione cloud di Active Directory Domain Services (AD DS) — sono servizi distinti con scopi diversi.'),
    bullet('Puo\' essere usato da organizzazioni di qualsiasi dimensione, anche senza infrastruttura on-premise.'),
    bullet('Ogni tenant Azure ha automaticamente un tenant Entra ID associato.'),
    stepTitle('Entra ID e\' un servizio PaaS'),
    body('Entra ID fa parte dell\'offerta PaaS di Azure: e\' un servizio di directory interamente gestito da Microsoft nel cloud. Non richiede di distribuire VM, installare controller di dominio o applicare patch. Il livello base e\' incluso gratuitamente; le funzionalita\' avanzate richiedono i piani P1 o P2.'),
    bullet('Configurazione dell\'accesso alle applicazioni e Single Sign-On (SSO) per app SaaS cloud.'),
    bullet('Gestione di utenti, gruppi e provisioning automatico.'),
    bullet('Abilitazione della federazione tra organizzazioni e autenticazione a piu\' fattori (MFA).'),
    bullet('Identificazione delle attivita\' di accesso irregolari e configurazione dell\'accesso condizionale.'),
    stepTitle('Il concetto di Tenant'),
    body('Un tenant rappresenta una singola istanza di Microsoft Entra ID associata a un\'organizzazione. E\' il confine di sicurezza e il contenitore per tutti gli oggetti Entra ID.'),
    bullet('A ogni tenant viene assegnato automaticamente un dominio DNS predefinito nel formato prefisso.onmicrosoft.com.'),
    bullet('Una sottoscrizione Azure e\' associata a un solo tenant Entra ID alla volta, ma lo stesso tenant puo\' essere associato a piu\' sottoscrizioni.'),
    stepTitle('Schema di Entra ID vs AD DS'),
    bullet('Nessuna classe OU (Organizational Unit) — l\'organizzazione avviene tramite gruppi e appartenenza dinamica.'),
    bullet('Nessuna classe Computer — solo la classe Device, con un processo di join diverso da AD DS.'),
    bullet('Nessun GPO (Group Policy Object) — la gestione dei dispositivi avviene tramite Microsoft Intune.'),
    bullet('Lo schema e\' estendibile e le estensioni sono completamente reversibili, a differenza di AD DS.'),
    h3('2.1.2 — Confronto tra Microsoft Entra ID e Active Directory Domain Services'),
    body('AD DS e\' un servizio di directory tradizionale on-premise basato su protocolli Kerberos e LDAP. Microsoft Entra ID e\' invece un servizio cloud basato su HTTP/HTTPS, OAuth 2.0 e SAML.'),
    bullet('AD DS usa strutture gerarchiche (foreste, domini, OU); Entra ID usa un modello flat con tenant.'),
    bullet('Entra ID supporta autenticazione moderna: OAuth 2.0, OpenID Connect, SAML.'),
    bullet('I due servizi possono coesistere in ambienti ibridi tramite Microsoft Entra Connect.'),
    h3('2.1.3 — Esaminare Microsoft Entra ID come servizio directory per le app cloud'),
    body('Microsoft Entra ID e\' il sistema di identita\' nativo per le applicazioni cloud e SaaS. Le applicazioni si registrano nel tenant Entra ID e ottengono un\'identita\' con cui possono autenticare utenti tramite token OAuth 2.0.'),
    bullet('Single Sign-On (SSO) — un utente accede una volta sola e puo\' usare tutte le app integrate.'),
    bullet('Supporto per migliaia di app SaaS pre-integrate nella galleria di Entra ID (Salesforce, ServiceNow, GitHub, ecc.).'),
    h3('2.1.4 — Confrontare i piani P1 e P2 di Microsoft Entra ID'),
    bullet('Free — gestione utenti e gruppi di base, SSO per massimo 10 app, autenticazione MFA.'),
    bullet('Microsoft 365 Apps — include le funzionalita\' Free piu\' gestione delle identita\' per le app Microsoft 365.'),
    bullet('P1 (Premium 1) — aggiunge accesso condizionale, gruppi dinamici, SSPR on-premise, e Hybrid Entra ID Join.'),
    bullet('P2 (Premium 2) — include tutto P1 piu\' Entra ID Protection e Privileged Identity Management (PIM).'),
    h3('2.1.5 — Esaminare Microsoft Entra Domain Services'),
    body('Microsoft Entra Domain Services (Entra DS) e\' un servizio gestito che fornisce funzionalita\' di dominio tradizionali (join al dominio, criteri di gruppo, LDAP, Kerberos/NTLM) senza dover distribuire domain controller.'),
    bullet('Microsoft gestisce i domain controller: alta disponibilita\', backup e aggiornamenti sono automatici.'),
    bullet('Non e\' possibile estendere lo schema del dominio gestito ne\' creare OU personalizzate.'),
    bullet('Caso d\'uso tipico: lift-and-shift di applicazioni legacy su Azure VM che richiedono LDAP o Kerberos.'),
    ...figImg(imgs.entraDS,'png',850,437,'Figura 2 — Microsoft Entra Domain Services fornisce un dominio gestito nella VNet di Azure, sincronizzato da Microsoft Entra ID.'),
    stepTitle('Vantaggi principali'),
    bullet('Gli amministratori non devono gestire, aggiornare o monitorare i domain controller.'),
    bullet('Non servono i gruppi Domain Admins o Enterprise Admins per i domini gestiti.'),
    stepTitle('Limitazioni da tenere in considerazione'),
    bullet('E\' supportato solo l\'oggetto Active Directory Computer di base — lo schema non e\' estendibile.'),
    bullet('La struttura delle OU e\' flat: le unita\' organizzative nidificate non sono supportate.'),
    bullet('Esiste un solo GPO predefinito; non e\' possibile usare filtri WMI o filtri per gruppi di sicurezza.'),
    h2('2.2 — Creare, configurare e gestire identita\''),
    h3('2.2.1 — Creare, configurare e gestire utenti'),
    body('Ogni utente che deve accedere alle risorse Azure necessita di un account in Microsoft Entra ID.'),
    stepTitle('Tipi di identita\' utente'),
    bullet('Identita\' cloud — esistono solo in Microsoft Entra ID. Origine nel portale: Microsoft Entra ID.'),
    bullet('Identita\' sincronizzate con directory — esistono in un\'Active Directory on-premise. Origine: Windows Server AD.'),
    bullet('Utenti guest — identita\' esterne invitate tramite Microsoft Entra B2B. Origine: Utente invitato.'),
    ...figImg(imgs.entraUsers,'png',946,398,'Figura 3 — Visualizzazione degli utenti nel portale Microsoft Entra ID con tipo utente, UPN, paese e ruolo.'),
    stepTitle('Gestione degli account'),
    bullet('UPN (User Principal Name) — identificatore univoco nel formato utente@dominio.com.'),
    bullet('Un utente eliminato rimane nel cestino per 30 giorni ed e\' ripristinabile.'),
    bullet('A ogni utente si assegnano licenze direttamente o tramite appartenenza a gruppi.'),
    h3('2.2.2 — Creare, configurare e gestire gruppi'),
    bullet('Gruppi di sicurezza — usati per controllare l\'accesso a risorse Azure, applicazioni e licenze.'),
    bullet('Gruppi Microsoft 365 — includono anche mailbox condivisa, calendario e sito SharePoint.'),
    body('Modalita\' di appartenenza:'),
    bullet('Assegnata — i membri vengono aggiunti manualmente da un amministratore.'),
    bullet('Dinamica utente — i membri vengono aggiunti automaticamente in base a regole. Richiede P1 o P2.'),
    bullet('Dinamica dispositivo — come la dinamica utente ma basata su proprieta\' dei dispositivi.'),
    ...figImg(imgs.entraGroups,'png',940,378,'Figura 4 — Visualizzazione dei gruppi nel portale Microsoft Entra ID con tipo gruppo (Security e Microsoft 365).'),
    h3('2.2.3 — Configurare e gestire la registrazione dei dispositivi'),
    body('Microsoft Entra ID gestisce le identita\' dei dispositivi tramite tre modalita\':'),
    stepTitle('1. Registrazione in Microsoft Entra ID (Workplace Join — BYOD)'),
    bullet('Destinatari: utenti con dispositivi personali.'),
    bullet('Sistemi operativi supportati: Windows 10+, macOS 10.15+, iOS 15+, Android, Linux.'),
    stepTitle('2. Aggiunta a Microsoft Entra ID (Entra Join — cloud-only)'),
    bullet('Destinatari: organizzazioni cloud-first o cloud-only, senza infrastruttura AD DS on-premise.'),
    bullet('Sistemi operativi supportati: Windows 10/11 (escluse edizioni Home).'),
    stepTitle('3. Aggiunta ibrida a Microsoft Entra ID (Hybrid Join)'),
    bullet('Destinatari: organizzazioni con Active Directory on-premise esistente.'),
    bullet('Il dispositivo e\' membro del dominio AD DS locale ed e\' anche registrato in Entra ID.'),
    stepTitle('Cloud Kerberos Trust'),
    body('Il writeback dei dispositivi e\' stato sostituito da Cloud Kerberos Trust, che consente ai dispositivi Entra Join e Hybrid Join di autenticarsi alle risorse on-premise senza scrivere oggetti dispositivo in Active Directory locale.'),
    h3('2.2.4 — Gestire le licenze'),
    stepTitle('Assegnazione diretta vs basata su gruppo'),
    bullet('Assegnazione diretta — la licenza viene assegnata singolarmente a ogni utente.'),
    bullet('Assegnazione basata su gruppo — la licenza viene assegnata a un gruppo; tutti i membri ricevono automaticamente la licenza.'),
    stepTitle('Requisiti per le licenze basate su gruppo'),
    body('Il tenant deve avere almeno una sottoscrizione Entra ID P1 attiva.'),
    bullet('Microsoft 365 E3 -> include Entra ID P1'),
    bullet('Microsoft 365 E5 -> include Entra ID P2'),
    stepTitle('Funzionalita\' avanzate'),
    bullet('Disabilitare piani di servizio specifici — e\' possibile disabilitare singoli servizi del prodotto.'),
    bullet('Licenze da piu\' origini — se un utente riceve la stessa licenza da piu\' origini, essa viene contata e usata una volta sola.'),
    h3('2.2.5 — Creare attributi di sicurezza personalizzati'),
    body('Gli attributi di sicurezza personalizzati (Custom Security Attributes) sono coppie chiave-valore definite dall\'amministratore che possono essere aggiunte a utenti, gruppi, applicazioni e service principal.'),
    stepTitle('Casi d\'uso concreti'),
    bullet('Estendere il profilo utente con informazioni aziendali sensibili — es. stipendio orario, visibile solo agli HR.'),
    bullet('Categorizzare applicazioni registrate nel tenant per audit e governance.'),
    bullet('Controllare l\'accesso a risorse Azure specifiche tramite ABAC (Attribute-Based Access Control).'),
    stepTitle('Limitazioni importanti'),
    bullet('Non sono supportati in Microsoft Entra Domain Services.'),
    bullet('Non sono inclusi nelle attestazioni dei token SAML o JWT.'),
    h3('2.2.6 — Esplorare la creazione automatica degli utenti'),
    body('Il provisioning automatico degli utenti (SCIM Provisioning) permette di creare, aggiornare e disabilitare automaticamente gli account in applicazioni SaaS in base agli account presenti in Entra ID.'),
    stepTitle('Perche\' usare SCIM'),
    bullet('Usa il protocollo standard aperto SCIM 2.0 (System for Cross-domain Identity Management).'),
    bullet('Il ciclo di provisioning iniziale sincronizza tutti gli utenti; i cicli incrementali gestiscono solo le modifiche.'),
    stepTitle('Provisioning in ingresso basato su API'),
    body('Da marzo 2024 Microsoft Entra ID supporta il provisioning in ingresso basato su API: qualsiasi strumento di automazione puo\' recuperare dati da qualsiasi sistema HR e inviarli direttamente all\'API di provisioning di Entra ID.'),
    h2('2.3 — Descrivere i componenti architetturali principali di Azure'),
    h3('2.3.1 — Introduzione'),
    body('Azure e\' la piattaforma cloud Microsoft che offre oltre 200 servizi per creare, eseguire e gestire applicazioni su data center globali.'),
    h3('2.3.2 — Che cos\'e\' Microsoft Azure'),
    body('Azure copre tutte le principali categorie di servizi cloud: Calcolo, Rete, Archiviazione, Database, AI/ML, IoT e molto altro.'),
    infoBox('Portale Azure:','Il portale Azure (portal.azure.com) e\' l\'interfaccia grafica web per creare, gestire e monitorare tutte le risorse cloud. Disponibile 24/7, aggiornato continuamente senza downtime.'),
    h3('2.3.3 — Introduzione agli account Azure'),
    body('L\'organizzazione delle risorse in Azure segue una gerarchia a quattro livelli.'),
    infoBox('Account gratuito Azure:','Con l\'account gratuito Azure si ottengono 200 $ di credito per 30 giorni, accesso gratuito ai servizi piu\' diffusi per 12 mesi e oltre 55 servizi sempre gratuiti.'),
    h3('2.3.4 — Descrivere l\'infrastruttura fisica di Azure'),
    body('L\'infrastruttura fisica di Azure e\' organizzata in una gerarchia: Geography -> Region -> Availability Zone -> Datacenter.'),
    bullet('Data Center: strutture fisiche con server, alimentazione ridondante, raffreddamento e rete dedicata.'),
    bullet('Aree geografiche (Regions): cluster di data center nelle vicinanze, collegati da rete a bassa latenza.'),
    bullet('Zone di disponibilita\' (Availability Zones): strutture fisicamente separate all\'interno di una regione.'),
    bullet('Coppie di aree (Region Pairs): ogni regione Azure e\' abbinata a un\'altra nella stessa geografia, distante almeno 480 km.'),
    bullet('Aree sovrane: istanze separate e isolate di Azure per requisiti legali e di conformita\' specifici.'),
    h3('2.3.5 — Descrivere l\'infrastruttura di gestione di Azure'),
    body('L\'infrastruttura di gestione comprende quattro livelli gerarchici: Risorse, Gruppi di risorse, Sottoscrizioni e Gruppi di gestione.'),
    bullet('Ogni risorsa appartiene a un solo gruppo di risorse; puo\' essere spostata ma non duplicata.'),
    bullet('I gruppi non sono annidabili e non possono essere rinominati dopo la creazione.'),
    bullet('Eliminare un gruppo di risorse elimina in cascata tutte le risorse al suo interno.'),
    infoBox('Gerarchia Azure:','La gerarchia completa e\': Tenant Root Group -> Gruppi di gestione -> Sottoscrizioni -> Gruppi di risorse -> Risorse. Ogni livello eredita le policy e i controlli di accesso dal livello superiore.'),
    h3('Riepilogo 2.3'),
    bullet('Azure organizza le risorse in una gerarchia: Geography -> Region -> Availability Zone -> Datacenter.'),
    bullet('Le Region Pairs garantiscono continuita\' operativa con failover automatico tra regioni distanti almeno 480 km.'),
    bullet('La gerarchia di gestione consente di applicare policy e controllo accessi in modo scalabile.'),
    h2('2.4 — Iniziative di Criteri di Azure'),
    h3('2.4.1 — Introduzione'),
    body('Azure Policy e\' il servizio di governance di Azure che consente di creare, assegnare e gestire policy che applicano regole ed effetti sulle risorse Azure, garantendo la conformita\' agli standard IT aziendali.'),
    h3('2.4.2 — Cloud Adoption Framework for Azure'),
    body('Il Cloud Adoption Framework (CAF) e\' una guida Microsoft che aiuta le organizzazioni ad adottare il cloud in modo strutturato.'),
    stepTitle('I 5 step della cloud governance'),
    bullet('1. Costituire un team di governance — un team dedicato responsabile di definire e mantenere le policy.'),
    bullet('2. Valutare i rischi cloud — analisi approfondita dei rischi specifici dell\'organizzazione.'),
    bullet('3. Documentare le policy di governance — policy chiare che definiscono l\'uso accettabile del cloud.'),
    bullet('4. Applicare le policy di governance — implementazione tramite strumenti automatizzati.'),
    bullet('5. Monitorare la governance cloud — monitoraggio regolare per verificare la conformita\'.'),
    ...figImg(imgs.cloudGovSteps,'png',2031,278,'Figura 21 — I 5 step della cloud governance: processo iterativo da Build a cloud governance team fino a Monitor cloud governance.'),
    infoBox('Processo iterativo:','I passi 1-5 vanno completati per stabilire la governance. In seguito e\' necessario iterare regolarmente sui passi 2-5 per mantenere la governance nel tempo.'),
    stepTitle('Le 5 discipline fondamentali della cloud governance'),
    bullet('Cost Management — valutazione e monitoraggio dei costi, controllo delle spese IT.'),
    bullet('Security Baseline — applicazione di una baseline di sicurezza a tutti gli sforzi di adozione cloud.'),
    bullet('Resource Consistency — coerenza nella configurazione delle risorse.'),
    bullet('Identity Baseline — applicazione coerente di definizioni e assegnazioni di ruoli.'),
    bullet('Deployment Acceleration — accelerazione del deployment tramite standardizzazione dei template.'),
    h3('2.4.3 — Principi di progettazione di Azure Policy'),
    body('Azure Policy segue un approccio dichiarativo: si definisce lo stato desiderato delle risorse e Azure si occupa di valutare e applicare le regole.'),
    bullet('Separazione dei ruoli — chi definisce le policy e\' separato da chi le applica.'),
    bullet('Ereditarieta\' — le policy applicate a un livello superiore si propagano automaticamente ai livelli inferiori.'),
    bullet('Non interferenza — Azure Policy valuta e segnala la non conformita\', ma non modifica le risorse esistenti senza remediation esplicita.'),
    ...figImg(imgs.azureGovHierarchy,'png',1459,955,'Figura 22 — Gerarchia di governance Azure: Tenant Root Group -> Management Groups -> Subscriptions -> Resource Groups -> Resources.'),
    stepTitle('Azure Resource Manager e i due piani'),
    bullet('Control plane — gestisce le risorse nella sottoscrizione (creare, aggiornare, eliminare). Azure Policy opera qui.'),
    bullet('Data plane — gestisce le operazioni sui dati all\'interno di una risorsa gia\' esistente. Bypassa ARM.'),
    ...figImg(imgs.azurePolicyArm,'png',1853,964,'Figura 23 — Azure Policy e Azure Resource Manager: il Control Plane riceve le richieste da CLI, PowerShell, HTTP e portale Azure e le instrada ai Resource Provider.'),
    infoBox('RBAC prima di Azure Policy:','Quando una richiesta arriva ad ARM, viene valutato prima RBAC e poi Azure Policy. Se l\'utente non ha i permessi RBAC necessari, Azure Policy non viene nemmeno considerata.'),
    stepTitle('Greenfield vs Brownfield'),
    bullet('Greenfield (policy-first) — la policy esiste gia\' quando si crea la risorsa. Blocco in tempo reale.'),
    bullet('Brownfield (resource-first) — le risorse esistono gia\' quando viene assegnata una nuova policy. Compliance scan ogni 24 ore.'),
    infoBox('Esempio pratico:','Si crea una policy che vieta la creazione di risorse fuori dall\'area West Europe. Le VM gia\' esistenti in East US non vengono cancellate ma risultano non conformi. Le nuove vengono bloccate immediatamente.'),
    h3('2.4.4 — Risorse di Azure Policy'),
    stepTitle('Definizioni (Definitions)'),
    bullet('Built-in — generate da Azure Resource Providers, disponibili per default.'),
    bullet('Custom — scritte dall\'utente quando nessuna built-in copre il requisito specifico.'),
    stepTitle('Iniziative (Initiatives / Policy Set)'),
    body('Raccolta di piu\' definizioni di policy raggruppate per un obiettivo comune (es. conformita\' PCI-DSS).'),
    infoBox('Built-in vs Custom:','Le iniziative built-in coprono i principali framework normativi (ISO 27001, NIST, CIS). Le custom permettono di costruire un set di policy su misura.'),
    stepTitle('Assegnazioni (Assignments)'),
    body('Il collegamento tra una definizione/iniziativa e uno specifico ambito.'),
    bullet('Resource selectors — rollout graduale basato su tipo o posizione delle risorse.'),
    bullet('Excluded scopes — escludere specifici sotto-ambiti o risorse dall\'assegnazione.'),
    bullet('Managed identity — richiesta per le policy con effetto deployIfNotExists o modify.'),
    stepTitle('Esenzioni (Exemptions)'),
    bullet('Mitigated — l\'obiettivo della policy e\' raggiunto tramite un metodo alternativo.'),
    bullet('Waiver — la non conformita\' e\' temporaneamente accettata.'),
    stepTitle('Remediation task'),
    body('Attivita\' di correzione per portare risorse non conformi a uno stato conforme. Applicabili solo alle definizioni con effetto modify o deployIfNotExists.'),
    h3('2.4.5 — Definizioni di Azure Policy'),
    stepTitle('Effetti disponibili (blocco then)'),
    bullet('Disabled — disattiva la policy senza rimuoverla.'),
    bullet('Deny — blocca la richiesta se non conforme. Valutazione sincrona.'),
    bullet('DenyAction — blocca azioni specifiche su risorse esistenti (attualmente solo DELETE).'),
    bullet('Modify — aggiunge, aggiorna o rimuove proprieta\' e tag durante creazione o aggiornamento.'),
    bullet('Audit — crea un evento di avviso nel log attivita\' senza bloccare la richiesta. Valutazione asincrona.'),
    bullet('AuditIfNotExists — segnala se una risorsa correlata non esiste. Valutazione asincrona.'),
    bullet('DeployIfNotExists — distribuisce automaticamente una risorsa mancante. Valutazione asincrona.'),
    bullet('Manual — consente di attestare manualmente la conformita\'. Non intercambiabile.'),
    infoBox('Effetti intercambiabili:','audit, deny e modify/append sono spesso intercambiabili. auditIfNotExists e deployIfNotExists sono spesso intercambiabili. manual non lo e\'.'),
    stepTitle('Cumulative most restrictive'),
    body('Se piu\' policy si applicano alla stessa risorsa, prevale quella piu\' restrittiva. Esempio di definizione built-in:'),
    ...codeBlock(['{','  "displayName": "Allowed locations",','  "policyType": "BuiltIn",','  "mode": "Indexed",','  "parameters": { "listOfAllowedLocations": { "type": "Array" } },','  "policyRule": {','    "if": { "allOf": [','      { "field": "location", "notEquals": "global" },','      { "field": "type", "notEquals": "Microsoft.AzureActiveDirectory/b2cDirectories" }','    ] },','    "then": { "effect": "deny" }','  }','}']),
    h3('2.4.6 — Valutazione delle risorse tramite Azure Policy'),
    stepTitle('Trigger di valutazione'),
    bullet('Una policy o iniziativa viene assegnata per la prima volta a un ambito.'),
    bullet('Una risorsa viene creata o aggiornata nell\'ambito tramite ARM.'),
    bullet('Ciclo standard di valutazione della conformita\' (ogni 24 ore).'),
    bullet('Scansione on-demand avviata manualmente: az policy state trigger-scan.'),
    stepTitle('Stati di conformita\' delle risorse'),
    bullet('Compliant — la risorsa rispetta tutte le condizioni della policy.'),
    bullet('Non-compliant — la risorsa non rispetta una o piu\' condizioni.'),
    bullet('Error — errore nel template o nella valutazione della policy.'),
    bullet('Conflicting — due o piu\' policy hanno regole contraddittorie.'),
    bullet('Protected — la risorsa e\' coperta da un\'assegnazione con effetto denyAction.'),
    bullet('Exempted — la risorsa e\' esclusa dalla valutazione tramite un\'esenzione.'),
    bullet('Unknown — stato predefinito per le definizioni con effetto manual.'),
    stepTitle('EnforcementMode — modalita\' What-If'),
    bullet('Enabled (Default) — l\'effetto viene applicato durante la creazione o aggiornamento della risorsa.'),
    bullet('Disabled (DoNotEnforce) — l\'effetto NON viene applicato ma la conformita\' viene comunque valutata.'),
    infoBox('Conformita\' vs Applicazione:','Una policy con effetto Audit non impedisce la creazione di risorse non conformi. Solo il Deny blocca attivamente.'),
    h2('2.5 — Proteggere le risorse con Azure RBAC'),
    h3('2.5.1 — Introduzione'),
    body('La gestione degli accessi alle risorse cloud e\' una funzione fondamentale. Azure RBAC (Role-Based Access Control) garantisce che gli utenti abbiano esattamente l\'accesso di cui hanno bisogno.'),
    h3('2.5.2 — Che cos\'e\' Azure RBAC?'),
    body('Azure RBAC e\' un sistema di autorizzazione basato su Azure Resource Manager. Ogni sottoscrizione Azure e\' associata a una singola directory Microsoft Entra.'),
    ...figImg(imgs.rbacRolesHierarchy,'png',895,598,'Figura 26 — Relazione tra ruoli di Azure AD, ruoli di Azure e ruoli di amministratore della sottoscrizione classica nella gerarchia.'),
    stepTitle('I tre elementi di un\'assegnazione di ruolo'),
    bullet('Entita\' di sicurezza (chi) — utente, gruppo, entita\' servizio o identita\' gestita.'),
    ...figImg(imgs.rbacSecPrincipal,'png',357,134,'Figura 24 — Entita\' di sicurezza: utente, gruppo ed entita\' servizio.'),
    bullet('Definizione del ruolo (cosa) — raccolta di autorizzazioni che definisce cosa si puo\' fare.'),
    ...figImg(imgs.rbacRoleDef,'png',537,352,'Figura 25 — Definizione del ruolo: elenco dei ruoli predefiniti e personalizzati.'),
    bullet('Ambito (dove) — il livello a cui si applica l\'accesso: gruppo di gestione, sottoscrizione, gruppo di risorse o risorsa singola.'),
    infoBox('Assegnazione di ruolo:','Un\'assegnazione di ruolo e\' il collegamento tra entita\' di sicurezza, definizione del ruolo e ambito. Per concedere l\'accesso si crea un\'assegnazione; per revocarlo si rimuove.'),
    stepTitle('I 4 ruoli predefiniti fondamentali'),
    bullet('Proprietario — accesso completo a tutte le risorse, incluso il diritto di delegare l\'accesso ad altri.'),
    bullet('Collaboratore — puo\' creare e gestire tutti i tipi di risorse Azure, ma non puo\' concedere l\'accesso ad altri.'),
    bullet('Lettore — puo\' solo visualizzare le risorse Azure esistenti, nessuna modifica.'),
    bullet('Amministratore Accesso Utenti — gestisce gli accessi utente alle risorse Azure.'),
    stepTitle('Actions, NotActions e autorizzazioni effettive'),
    body('Azure RBAC e\' un modello additivo: le assegnazioni di ruolo si sommano. Autorizzazioni effettive = Actions - NotActions.'),
    ...figImg(imgs.rbacIamPortal,'png',1069,708,'Figura 27 — Riquadro Controllo di accesso (IAM) nel portale Azure: scheda Assegnazioni di ruolo.'),
    infoBox('RBAC vs Azure Policy:','RBAC controlla chi puo\' fare cosa sulle risorse (autorizzazione). Azure Policy controlla come devono essere configurate le risorse (governance). I due si complementano.'),
    h2('2.6 — Reimpostazione della password self-service (SSPR)'),
    h3('2.6.1 — Introduzione'),
    body('La reimpostazione della password self-service (SSPR) di Microsoft Entra consente agli utenti di cambiare o reimpostare la propria password senza intervento dell\'amministratore. Riduce le chiamate all\'help desk e la perdita di produttivita\'.'),
    h3('2.6.2 — Che cos\'e\' la reimpostazione autonoma della password in Microsoft Entra ID?'),
    stepTitle('I 5 step del processo SSPR'),
    bullet('1. Localizzazione — il portale rileva le impostazioni locali del browser.'),
    bullet('2. Verifica — l\'utente immette il proprio nome utente e supera un test CAPTCHA.'),
    bullet('3. Autenticazione — l\'utente immette i dati del metodo di autenticazione registrato.'),
    bullet('4. Reimpostazione della password — se l\'autenticazione ha successo, l\'utente imposta la nuova password.'),
    bullet('5. Notifica — viene inviata una notifica all\'utente per confermare la reimpostazione.'),
    stepTitle('Metodi di autenticazione supportati'),
    bullet('Notifica dell\'app per dispositivi mobili (Microsoft Authenticator).'),
    bullet('Codice app per dispositivi mobili — il codice OTP generato dall\'app Authenticator.'),
    bullet('Email — codice OTP all\'indirizzo email esterno ad Azure registrato.'),
    bullet('Telefono cellulare — SMS con codice OTP o chiamata automatica.'),
    bullet('Telefono ufficio — chiamata automatica, premere il tasto #.'),
    infoBox('Numero di metodi richiesti:','L\'amministratore puo\' configurare se richiedere 1 o 2 metodi. Se si passa da 1 a 2, gli utenti con solo 1 metodo registrato non possono piu\' usare SSPR finche\' non ne registrano un secondo.'),
    stepTitle('Requisiti di licenza'),
    bullet('Modifica password (utente gia\' connesso) — qualsiasi edizione Entra ID, inclusa quella gratuita.'),
    bullet('Reimpostazione password dimenticata o scaduta — richiede Entra ID P1, P2 o Microsoft 365.'),
    bullet('Writeback in ambienti ibridi — richiede Entra ID P1 o P2.'),
    h3('2.6.3 — Implementare la reimpostazione della password self-service'),
    stepTitle('Abilitare SSPR nel portale Azure'),
    bullet('Portale Azure -> Microsoft Entra ID -> Sicurezza -> Reimpostazione password self-service.'),
    bullet('Scegliere l\'ambito: Nessuno, Selezionati (gruppi specifici) o Tutti.'),
    bullet('Configurare i metodi di autenticazione: quanti richiesti (1 o 2) e quali abilitare.'),
    stepTitle('Integrazione con ambienti ibridi — Password Writeback'),
    body('In ambienti ibridi con AD DS on-premise, il writeback permette di sincronizzare le reimpostazioni da Entra ID verso la directory locale.'),
    infoBox('Sincronizzazione cloud vs Entra Connect:','La sincronizzazione cloud offre alta disponibilita\' maggiore. E\' la scelta consigliata per i nuovi deployment ibridi.'),
  ]; }

function modulo3(imgs) { return [
    moduloTitle('Configurare e gestire reti virtuali per amministratori di Azure'),
    moduloIntro('Questo percorso illustra la configurazione delle reti virtuali in Azure, dalla pianificazione degli indirizzi IP alla sicurezza del traffico tramite NSG.'),
    h2('3.1 — Configurare reti virtuali'),
    h3('3.1.1 — Introduzione'),
    body('Le reti virtuali (VNet) in Azure sono il fondamento per la comunicazione sicura tra le risorse cloud.'),
    h3('3.1.2 — Pianificare le reti virtuali'),
    stepTitle('Scenari di utilizzo delle reti virtuali'),
    bullet('Rete virtuale dedicata al cloud privato — quando non e\' necessaria una configurazione cross-premise.'),
    bullet('Estensione sicura del data center — VPN site-to-site tramite IPSec.'),
    bullet('Scenari cloud ibridi — connettere applicazioni cloud a sistemi locali, inclusi mainframe e sistemi Unix.'),
    stepTitle('Considerazioni di progettazione'),
    bullet('Assicurarsi che lo spazio di indirizzi non si sovrapponga ad altri intervalli di rete.'),
    bullet('Una VNet appartiene a una sola regione Azure e a una sola sottoscrizione.'),
    bullet('Piu\' VNet possono essere collegate tramite VNet Peering.'),
    infoBox('Spazio di indirizzi privati:','Azure supporta gli spazi di indirizzi privati RFC 1918: 10.0.0.0/8, 172.16.0.0/12 e 192.168.0.0/16.'),
    stepTitle('Capire la notazione CIDR'),
    bullet('10.0.0.0/16 -> 2^16 = 65.536 indirizzi, da 10.0.0.0 a 10.0.255.255'),
    bullet('10.0.0.0/24 -> 2^8 = 256 indirizzi, da 10.0.0.0 a 10.0.0.255'),
    bullet('10.0.0.0/28 -> 2^4 = 16 indirizzi'),
    infoBox('Limite Azure per le subnet:','Azure riserva sempre 5 indirizzi per ogni subnet (i primi 4 e l\'ultimo). Il prefisso minimo consigliato e\' /28, che garantisce 11 indirizzi utilizzabili.'),
    h3('3.1.3 — Creare subnet'),
    body('Una subnet e\' una suddivisione dello spazio di indirizzi della VNet.'),
    stepTitle('Indirizzi riservati per ogni subnet'),
    ...spacer(1),
    reservedTable(),
    caption('Tabella 3 — I 5 indirizzi riservati da Azure in ogni subnet (esempio con 192.168.1.0/24).'),
    stepTitle('Considerazioni di progettazione'),
    bullet('Ogni subnet deve avere un intervallo CIDR univoco che rientra nello spazio di indirizzi della VNet padre.'),
    bullet('Gli intervalli delle subnet non possono sovrapporsi tra loro.'),
    bullet('Alcune subnet speciali sono richieste da determinati servizi: GatewaySubnet, AzureFirewallSubnet, AzureBastionSubnet.'),
    bullet('Network Security Group (NSG) — e\' possibile associare zero o un NSG a ogni subnet.'),
    bullet('Azure Private Link — connettivita\' privata da una VNet a servizi PaaS senza esporre il traffico a Internet.'),
    h3('3.1.4 — Creare reti virtuali'),
    body('Una VNet puo\' essere creata tramite il portale Azure, Azure CLI, PowerShell o template ARM.'),
    stepTitle('Creazione tramite Azure CLI'),
    ...codeBlock(['az network vnet create \\','  --resource-group rsg-1 \\','  --name MyVNet \\','  --address-prefix 10.0.0.0/16 \\','  --subnet-name MySubnet \\','  --subnet-prefix 10.0.0.0/24']),
    h3('3.1.5 — Pianificare l\'indirizzamento IP'),
    body('In Azure gli indirizzi IP possono essere pubblici o privati, e assegnati in modo statico o dinamico.'),
    ...figImg(imgs.ipAddressing,'png',850,138,'Figura 28 — Una risorsa Azure con indirizzo IP privato (VNet, reti locali) e indirizzo IP pubblico (Internet e servizi pubblici).'),
    stepTitle('Indirizzi IP pubblici'),
    bullet('Dinamici — assegnati quando la risorsa viene avviata e rilasciati quando viene arrestata.'),
    bullet('Statici — rimangono assegnati finche\' la risorsa esiste. Necessari per DNS, TLS, firewall.'),
    bullet('SKU Basic — supporta assegnazione dinamica e statica, non e\' ridondante per zona.'),
    bullet('SKU Standard — solo assegnazione statica, ridondante per zona, richiede NSG esplicito. Raccomandato.'),
    stepTitle('Indirizzi IP privati'),
    bullet('Dinamici — assegnati tramite DHCP dall\'intervallo della subnet.'),
    bullet('Statici — l\'amministratore specifica un indirizzo fisso. Usati per DNS server, domain controller, database.'),
    infoBox('Best practice:','Usare indirizzi statici per tutte le risorse che fungono da server. Usare dinamici per VM client e workload temporanei.'),
    h3('3.1.6 — Creare indirizzi IP pubblici'),
    body('Un indirizzo IP pubblico e\' una risorsa autonoma in Azure che puo\' essere associata a VM, load balancer, gateway VPN, firewall.'),
    stepTitle('Impostazioni da configurare alla creazione'),
    bullet('Versione IP — IPv4, IPv6 o dual-stack.'),
    bullet('SKU — Basic o Standard (raccomandato per nuovi deployment).'),
    bullet('Livello (Tier) — Regional (default) o Global.'),
    bullet('Assegnazione — Statica o Dinamica.'),
    h3('3.1.7 — Associare indirizzi IP pubblici'),
    ...spacer(1),
    publicIpAssocTable(),
    caption('Tabella 4 — Come associare un IP pubblico in base al tipo di risorsa Azure.'),
    stepTitle('Funzionalita\' dello SKU Standard'),
    ...spacer(1),
    publicIpSkuTable(),
    caption('Tabella 5 — Funzionalita\' dello SKU Standard per gli indirizzi IP pubblici.'),
    h3('3.1.8 — Allocare o assegnare indirizzi IP privati'),
    body('Gli indirizzi IP privati vengono assegnati alle risorse che risiedono all\'interno di una VNet.'),
    ...spacer(1),
    privateIpTable(),
    caption('Tabella 6 — Risorse Azure che supportano indirizzi IP privati e modalita\' di assegnazione.'),
    stepTitle('Metodi di assegnazione'),
    bullet('Dinamico — Azure assegna il prossimo indirizzo disponibile non assegnato nell\'intervallo della subnet.'),
    bullet('Statico — l\'amministratore sceglie un indirizzo specifico disponibile nell\'intervallo della subnet.'),
    h2('3.2 — Configurare i gruppi di sicurezza di rete'),
    h3('3.2.1 — Introduzione'),
    body('Un gruppo di sicurezza di rete (NSG) e\' un filtro del traffico di rete che consente o nega il traffico verso le risorse Azure. Ogni NSG puo\' essere associato a una subnet, a una NIC o a entrambe.'),
    h3('3.2.2 — Implementare i gruppi di sicurezza di rete'),
    stepTitle('Come funzionano gli NSG'),
    bullet('Traffico in entrata — Azure valuta prima le regole dell\'NSG della subnet, poi quelle dell\'NSG della NIC.'),
    bullet('Traffico in uscita — Azure valuta prima le regole dell\'NSG della NIC, poi quelle dell\'NSG della subnet.'),
    bullet('Se nessun NSG e\' associato, tutto il traffico e\' consentito tra le risorse nella stessa VNet.'),
    stepTitle('NSG e subnet — zona DMZ'),
    body('Assegnando un NSG a una subnet si crea una subnet protetta (DMZ), che funge da buffer tra le risorse interne e Internet.'),
    stepTitle('NSG e interfacce di rete'),
    body('E\' possibile assegnare un NSG direttamente a una NIC. A ogni NIC e\' possibile associare zero o un NSG.'),
    ...figImg(imgs.nsgPortal,'png',861,191,'Figura 29 — Panoramica di un NSG nel portale Azure: gruppo di risorse, localita\', subnet e interfacce di rete associati.'),
    infoBox('Best practice:','Associare NSG a livello di subnet anziche\' di singola NIC per una gestione piu\' semplice e scalabile.'),
    h3('3.2.3 — Determinare le regole dei gruppi di sicurezza di rete'),
    body('Ogni NSG contiene regole di sicurezza predefinite che non possono essere eliminate, ma possono essere sostituite da regole con priorita\' piu\' alta. Ogni regola e\' definita da:'),
    bullet('Nome — identificatore univoco della regola nell\'NSG.'),
    bullet('Priorita\' — numero tra 100 e 4096. Regole elaborate in ordine crescente di priorita\'.'),
    bullet('Origine/Destinazione — indirizzo IP, CIDR, tag di servizio o ASG.'),
    bullet('Protocollo — TCP, UDP, ICMP, ESP, AH o Any.'),
    bullet('Direzione — Inbound o Outbound.'),
    bullet('Intervallo di porte — porta singola, intervallo o wildcard (*).'),
    bullet('Azione — Allow o Deny.'),
    infoBox('Comportamento predefinito degli NSG:','Le regole predefinite negano tutto il traffico in entrata ad eccezione di quello proveniente dalla VNet e dal load balancer Azure.'),
    stepTitle('Tabella impostazioni configurabili per una regola'),
    ...spacer(1),
    nsgRuleSettingsTable(),
    caption('Tabella 7 — Impostazioni configurabili per una regola di sicurezza NSG.'),
    stepTitle('Regole predefinite inbound'),
    ...figImg(imgs.nsgInbound,'png',858,247,'Figura 30 — Regole di sicurezza in ingresso predefinite: AllowVnetInBound (65000), AllowAzureLoadBalancerInBound (65001), DenyAllInBound (65500).'),
    stepTitle('Regole predefinite outbound'),
    ...figImg(imgs.nsgOutbound,'png',858,236,'Figura 31 — Regole di sicurezza in uscita predefinite: AllowVnetOutBound (65000), AllowInternetOutBound (65001), DenyAllOutBound (65500).'),
    h3('3.2.4 — Determinare le regole effettive dei gruppi di sicurezza di rete'),
    bullet('Traffico in entrata — elabora prima le regole dell\'NSG della subnet, poi quelle dell\'NSG della NIC.'),
    bullet('Traffico in uscita — elabora prima le regole dell\'NSG della NIC, poi quelle dell\'NSG della subnet.'),
    ...figImg(imgs.nsgMultiple,'png',650,478,'Figura 32 — Due NSG applicati a una subnet: NSG1 associato alla NIC di VM1 e NSG2 associato alla subnet.'),
    stepTitle('Considerazioni per regole efficaci'),
    bullet('Se un NSG e\' associato sia alla subnet che alla NIC, occorre definire una regola Allow a entrambi i livelli.'),
    bullet('Traffico intra-subnet — le regole NSG della subnet si applicano anche al traffico tra VM nella stessa subnet.'),
    bullet('Priorita\' delle regole — assegnare valori di priorita\' con intervalli (100, 200, 300) per inserire nuove regole in futuro.'),
    stepTitle('Visualizzare le regole di sicurezza effettive'),
    body('Usare il collegamento Regole di sicurezza valide nel portale Azure. Si trova nella pagina della VM -> Rete -> Regole di sicurezza valide.'),
    ...figImg(imgs.nsgEffective,'png',859,65,null),
    infoBox('Network Watcher:','Azure Network Watcher offre una visualizzazione consolidata delle regole NSG. IP Flow Verify valuta il traffico rispetto alle regole effettive.'),
    h3('3.2.5 — Creare regole del gruppo di sicurezza di rete'),
    body('Le regole NSG si creano dal portale Azure, PowerShell, CLI o template ARM. Ogni regola usa un approccio a 5 tuple.'),
    stepTitle('Gli NSG sono stateful'),
    body('Gli NSG sono dispositivi stateful: tengono traccia delle connessioni attive tramite flow record. La risposta a una connessione consentita e\' automaticamente permessa.'),
    infoBox('Stateful vs Stateless:','Un firewall stateful ricorda le connessioni aperte. Un firewall stateless valuta ogni pacchetto in modo indipendente. Gli NSG Azure sono stateful.'),
    stepTitle('Tag di servizio'),
    bullet('Internet — tutti gli indirizzi IP pubblici esterni alla VNet.'),
    bullet('VirtualNetwork — tutto lo spazio di indirizzi della VNet e delle reti connesse.'),
    bullet('AzureLoadBalancer — indirizzo IP virtuale del load balancer Azure (168.63.129.16).'),
    bullet('AzureCloud — tutti gli indirizzi IP pubblici di Azure, inclusi i datacenter.'),
    stepTitle('Regole di sicurezza aumentate'),
    body('Una singola regola NSG puo\' contenere piu\' valori nei campi Origine, Destinazione e Servizio. Questo riduce il numero totale di regole necessarie.'),
    infoBox('Esempio pratico:','Invece di creare 4 regole separate per le porte 80, 443, 8080 e 8090, creare una sola regola con tutte le porte nel campo Servizio.'),
    h3('3.2.6 — Implementare gruppi di sicurezza delle applicazioni'),
    body('I gruppi di sicurezza delle applicazioni (ASG) permettono di raggruppare le VM in base al ruolo applicativo e usare questi gruppi nelle regole NSG al posto di indirizzi IP specifici.'),
    stepTitle('Come funzionano gli ASG'),
    bullet('Si crea un ASG (es. WebServers, AppServers) e si assegna a ogni NIC delle VM del gruppo.'),
    bullet('Nelle regole NSG si usa il nome dell\'ASG come origine o destinazione.'),
    bullet('Quando si aggiunge una nuova VM, basta associare la NIC all\'ASG — le regole NSG si applicano automaticamente.'),
    stepTitle('Scenario di esempio — rivenditore online'),
    ...figImg(imgs.asgDiagram,'png',320,274,'Figura 34 — ASG applicati a una VNet: Internet accede ai WebServers su porte 80/443; i WebServers accedono agli AppLServers sulla porta SQL 1433.'),
    bullet('Regola 1 (priorita\' 100) — consenti traffico da Internet verso ASG WebServers su porte 80 e 443.'),
    bullet('Regola 2 (priorita\' 110) — consenti traffico da ASG WebServers verso ASG AppLServers sulla porta 1433 (SQL).'),
    bullet('Regola 3 (priorita\' 120) — nega tutto il traffico verso ASG AppLServers su porte 80 e 443.'),
    stepTitle('Vantaggi degli ASG'),
    bullet('Gestione degli indirizzi IP — non e\' necessario specificare IP singoli nelle regole.'),
    bullet('Nessun vincolo di subnet — le VM possono essere organizzate logicamente per applicazione.'),
    bullet('Regole semplificate — una sola regola NSG copre tutte le VM dell\'ASG.'),
    infoBox('ASG vs tag di servizio:','I tag di servizio gestiscono i servizi Azure. Gli ASG raggruppano le VM personalizzate. I due strumenti sono complementari e possono essere usati insieme.'),
  ]; }

function modulo4() { return [
    moduloTitle('Implementare e gestire l\'archiviazione in Azure'),
    moduloIntro('Questo percorso illustra le soluzioni di archiviazione in Azure, dalla configurazione degli account alle strategie di ridondanza. La scelta corretta e\' cruciale per performance, costi e conformita\' normativa.'),
  ]; }

function modulo5() { return [
    moduloTitle('Distribuire e gestire risorse di calcolo di Azure'),
    moduloIntro('Questo percorso copre le principali risorse di calcolo in Azure, dalla gestione delle macchine virtuali alle soluzioni container e PaaS.'),
  ]; }

function modulo6() { return [
    moduloTitle('Monitorare ed eseguire il backup delle risorse di Azure'),
    moduloIntro('Questo percorso affronta il monitoraggio proattivo delle risorse Azure e le strategie di backup e disaster recovery.'),
  ]; }

// ─── Mappa modulo numero → funzione ──────────────────────────────────────────
const MODULI = {
  1: (i) => modulo1(i),
  2: (i) => modulo2(i),
  3: (i) => modulo3(i),
  4: ()  => modulo4(),
  5: ()  => modulo5(),
  6: ()  => modulo6(),
};

const MODULI_LABELS = {
  1: 'Modulo 1 — Prerequisiti',
  2: 'Modulo 2 — Identità e Governance',
  3: 'Modulo 3 — Reti Virtuali',
  4: 'Modulo 4 — Archiviazione',
  5: 'Modulo 5 — Calcolo',
  6: 'Modulo 6 — Monitoraggio e Backup',
};

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  const { mode, n } = parseArgs();

  const modeLabel = mode === 'full'   ? 'documento completo'
                  : mode === 'toc'    ? 'solo sommario'
                  : `solo ${MODULI_LABELS[n]}`;
  console.log(`Costruzione AZ-104 — ${modeLabel}...`);

  let children = [...coverPage()];

  if (mode === 'toc') {
    children.push(...sommario());
  } else if (mode === 'module') {
    children.push(...sommario());
    children.push(...MODULI[n](imgs));
  } else {
    // full
    children.push(...sommario());
    for (let m = 1; m <= 6; m++) {
      children.push(...MODULI[m](imgs));
    }
  }

  const doc = new Document({
    numbering: { config: [{ reference:'bullets', levels:[
      {level:0, format:LevelFormat.BULLET, text:'\u2022', alignment:AlignmentType.LEFT,
       style:{paragraph:{indent:{left:360,hanging:180}}}},
      {level:1, format:LevelFormat.BULLET, text:'\u25E6', alignment:AlignmentType.LEFT,
       style:{paragraph:{indent:{left:720,hanging:180}}}},
    ]}] },
    sections:[{
      properties:{page:{size:{width:11906,height:16838}, margin:{top:1440,right:1440,bottom:1440,left:1440}}},
      children,
    }],
  });

  const buffer = await Packer.toBuffer(doc);
  const outPath = outputPath(mode, n);
  fs.writeFileSync(outPath, buffer);
  console.log('Documento salvato: ' + outPath);
  console.log('Dimensione: ' + (buffer.length/1024).toFixed(1) + ' KB');
}

main().catch(console.error);
