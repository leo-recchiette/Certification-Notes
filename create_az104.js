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
    ['$schema',{text:'Si\'',bold:true},'URL dello schema JSON che descrive la versione del linguaggio del template.'],
    ['contentVersion',{text:'Si\'',bold:true},'Versione del template (es. 1.0.0.0). Non viene usata da Azure, ma utile per il versioning interno.'],
    ['parameters','No','Valori passati dall\'esterno al momento della distribuzione per personalizzare il template.'],
    ['variables','No','Valori calcolati una volta e riusati nel template per evitare ripetizioni.'],
    ['functions','No','Funzioni ARM personalizzate definite dall\'utente (user-defined functions).'],
    ['resources',{text:'Si\'',bold:true},'Le risorse Azure da distribuire o aggiornare (VM, storage, rete, ecc.).'],
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
    ['Assegnazione','Solo statica. L\'IP viene assegnato al momento della creazione della risorsa IP pubblica.'],
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
    tocHeading('3.3 — Ospitare il dominio in DNS di Azure'),
    tocEntry('3.3.1 — Introduzione'),
    tocEntry('3.3.2 — Cos\'e\' DNS e come funziona'),
    tocEntry('3.3.3 — Tipi di record DNS'),
    tocEntry('3.3.4 — Cos\'e\' DNS di Azure e perche\' usarlo'),
    tocEntry('3.3.5 — Configurare una zona DNS pubblica'),
    tocEntry('3.3.6 — Configurare una zona DNS privata'),
    tocEntry('3.3.7 — Record alias e dominio apex'),
    tocMacro('Implementare e gestire l\'archiviazione in Azure'),
    tocMacro('Distribuire e gestire risorse di calcolo di Azure'),
    tocMacro('Monitorare ed eseguire il backup delle risorse di Azure'),
  ];
}

// ─── Argomenti da riga di comando ────────────────────────────────────────────
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
    body('Microsoft Entra ID (precedentemente Azure Active Directory) e\' il servizio di gestione delle identita\' e degli accessi basato su cloud di Microsoft.'),
    bullet('Non e\' la versione cloud di Active Directory Domain Services (AD DS) — sono servizi distinti con scopi diversi.'),
    bullet('Puo\' essere usato da organizzazioni di qualsiasi dimensione, anche senza infrastruttura on-premise.'),
    bullet('Ogni tenant Azure ha automaticamente un tenant Entra ID associato.'),
    stepTitle('Entra ID e\' un servizio PaaS'),
    body('Entra ID fa parte dell\'offerta PaaS di Azure: e\' un servizio di directory interamente gestito da Microsoft nel cloud.'),
    bullet('Configurazione dell\'accesso alle applicazioni e Single Sign-On (SSO) per app SaaS cloud.'),
    bullet('Gestione di utenti, gruppi e provisioning automatico.'),
    bullet('Abilitazione della federazione tra organizzazioni e autenticazione a piu\' fattori (MFA).'),
    stepTitle('Il concetto di Tenant'),
    body('Un tenant rappresenta una singola istanza di Microsoft Entra ID associata a un\'organizzazione. E\' il confine di sicurezza e il contenitore per tutti gli oggetti Entra ID.'),
    bullet('A ogni tenant viene assegnato automaticamente un dominio DNS predefinito nel formato prefisso.onmicrosoft.com.'),
    bullet('Una sottoscrizione Azure e\' associata a un solo tenant Entra ID alla volta, ma lo stesso tenant puo\' essere associato a piu\' sottoscrizioni.'),
    h3('2.1.2 — Confronto tra Microsoft Entra ID e Active Directory Domain Services'),
    body('AD DS e\' un servizio di directory tradizionale on-premise basato su protocolli Kerberos e LDAP. Microsoft Entra ID e\' invece un servizio cloud basato su HTTP/HTTPS, OAuth 2.0 e SAML.'),
    bullet('AD DS usa strutture gerarchiche (foreste, domini, OU); Entra ID usa un modello flat con tenant.'),
    bullet('Entra ID supporta autenticazione moderna: OAuth 2.0, OpenID Connect, SAML.'),
    bullet('I due servizi possono coesistere in ambienti ibridi tramite Microsoft Entra Connect.'),
    h3('2.1.3 — Esaminare Microsoft Entra ID come servizio directory per le app cloud'),
    body('Microsoft Entra ID e\' il sistema di identita\' nativo per le applicazioni cloud e SaaS.'),
    bullet('Single Sign-On (SSO) — un utente accede una volta sola e puo\' usare tutte le app integrate.'),
    bullet('Supporto per migliaia di app SaaS pre-integrate nella galleria di Entra ID.'),
    h3('2.1.4 — Confrontare i piani P1 e P2 di Microsoft Entra ID'),
    bullet('Free — gestione utenti e gruppi di base, SSO per massimo 10 app, autenticazione MFA.'),
    bullet('P1 (Premium 1) — aggiunge accesso condizionale, gruppi dinamici, SSPR on-premise.'),
    bullet('P2 (Premium 2) — include tutto P1 piu\' Entra ID Protection e Privileged Identity Management (PIM).'),
    h3('2.1.5 — Esaminare Microsoft Entra Domain Services'),
    body('Microsoft Entra Domain Services (Entra DS) e\' un servizio gestito che fornisce funzionalita\' di dominio tradizionali (join al dominio, criteri di gruppo, LDAP, Kerberos/NTLM) senza dover distribuire domain controller.'),
    ...figImg(imgs.entraDS,'png',850,437,'Figura 2 — Microsoft Entra Domain Services fornisce un dominio gestito nella VNet di Azure, sincronizzato da Microsoft Entra ID.'),
    h2('2.2 — Creare, configurare e gestire identita\''),
    h3('2.2.1 — Creare, configurare e gestire utenti'),
    body('Ogni utente che deve accedere alle risorse Azure necessita di un account in Microsoft Entra ID.'),
    stepTitle('Tipi di identita\' utente'),
    bullet('Identita\' cloud — esistono solo in Microsoft Entra ID.'),
    bullet('Identita\' sincronizzate con directory — esistono in un\'Active Directory on-premise.'),
    bullet('Utenti guest — identita\' esterne invitate tramite Microsoft Entra B2B.'),
    ...figImg(imgs.entraUsers,'png',946,398,'Figura 3 — Visualizzazione degli utenti nel portale Microsoft Entra ID.'),
    h3('2.2.2 — Creare, configurare e gestire gruppi'),
    bullet('Gruppi di sicurezza — usati per controllare l\'accesso a risorse Azure, applicazioni e licenze.'),
    bullet('Gruppi Microsoft 365 — includono anche mailbox condivisa, calendario e sito SharePoint.'),
    bullet('Assegnata — i membri vengono aggiunti manualmente da un amministratore.'),
    bullet('Dinamica utente — i membri vengono aggiunti automaticamente in base a regole. Richiede P1 o P2.'),
    ...figImg(imgs.entraGroups,'png',940,378,'Figura 4 — Visualizzazione dei gruppi nel portale Microsoft Entra ID.'),
    h3('2.2.3 — Configurare e gestire la registrazione dei dispositivi'),
    stepTitle('1. Registrazione in Microsoft Entra ID (BYOD)'),
    bullet('Destinatari: utenti con dispositivi personali.'),
    bullet('Sistemi operativi supportati: Windows 10+, macOS 10.15+, iOS 15+, Android, Linux.'),
    stepTitle('2. Aggiunta a Microsoft Entra ID (cloud-only)'),
    bullet('Destinatari: organizzazioni cloud-first o cloud-only, senza infrastruttura AD DS on-premise.'),
    stepTitle('3. Aggiunta ibrida a Microsoft Entra ID'),
    bullet('Destinatari: organizzazioni con Active Directory on-premise esistente.'),
    h3('2.2.4 — Gestire le licenze'),
    bullet('Assegnazione diretta — la licenza viene assegnata singolarmente a ogni utente.'),
    bullet('Assegnazione basata su gruppo — la licenza viene assegnata a un gruppo; tutti i membri la ricevono automaticamente.'),
    h3('2.2.5 — Creare attributi di sicurezza personalizzati'),
    body('Gli attributi di sicurezza personalizzati sono coppie chiave-valore definite dall\'amministratore che possono essere aggiunte a utenti, gruppi, applicazioni e service principal.'),
    h3('2.2.6 — Esplorare la creazione automatica degli utenti'),
    body('Il provisioning automatico (SCIM Provisioning) permette di creare, aggiornare e disabilitare automaticamente gli account in applicazioni SaaS in base agli account presenti in Entra ID.'),
    h2('2.3 — Descrivere i componenti architetturali principali di Azure'),
    h3('2.3.1 — Introduzione'),
    body('Azure e\' la piattaforma cloud Microsoft che offre oltre 200 servizi per creare, eseguire e gestire applicazioni su data center globali.'),
    h3('2.3.2 — Che cos\'e\' Microsoft Azure'),
    body('Azure copre tutte le principali categorie di servizi cloud: Calcolo, Rete, Archiviazione, Database, AI/ML, IoT e molto altro.'),
    h3('2.3.3 — Introduzione agli account Azure'),
    body('L\'organizzazione delle risorse in Azure segue una gerarchia a quattro livelli.'),
    h3('2.3.4 — Descrivere l\'infrastruttura fisica di Azure'),
    bullet('Data Center: strutture fisiche con server, alimentazione ridondante, raffreddamento e rete dedicata.'),
    bullet('Aree geografiche (Regions): cluster di data center nelle vicinanze, collegati da rete a bassa latenza.'),
    bullet('Zone di disponibilita\' (Availability Zones): strutture fisicamente separate all\'interno di una regione.'),
    bullet('Coppie di aree (Region Pairs): ogni regione Azure e\' abbinata a un\'altra nella stessa geografia.'),
    h3('2.3.5 — Descrivere l\'infrastruttura di gestione di Azure'),
    body('L\'infrastruttura di gestione comprende quattro livelli: Risorse, Gruppi di risorse, Sottoscrizioni e Gruppi di gestione.'),
    infoBox('Gerarchia Azure:','La gerarchia completa e\': Tenant Root Group -> Gruppi di gestione -> Sottoscrizioni -> Gruppi di risorse -> Risorse.'),
    h2('2.4 — Iniziative di Criteri di Azure'),
    h3('2.4.1 — Introduzione'),
    body('Azure Policy e\' il servizio di governance di Azure che consente di creare, assegnare e gestire policy che applicano regole ed effetti sulle risorse Azure.'),
    h3('2.4.2 — Cloud Adoption Framework for Azure'),
    ...figImg(imgs.cloudGovSteps,'png',2031,278,'Figura 21 — I 5 step della cloud governance.'),
    h3('2.4.3 — Principi di progettazione di Azure Policy'),
    ...figImg(imgs.azureGovHierarchy,'png',1459,955,'Figura 22 — Gerarchia di governance Azure.'),
    ...figImg(imgs.azurePolicyArm,'png',1853,964,'Figura 23 — Azure Policy e Azure Resource Manager.'),
    h3('2.4.4 — Risorse di Azure Policy'),
    bullet('Definizioni (Definitions) — Built-in o Custom.'),
    bullet('Iniziative (Initiatives / Policy Set) — raccolta di piu\' definizioni per un obiettivo comune.'),
    bullet('Assegnazioni (Assignments) — collegamento tra definizione e ambito specifico.'),
    bullet('Esenzioni (Exemptions) — esclusioni temporanee o alternative dalla conformita\'.'),
    h3('2.4.5 — Definizioni di Azure Policy'),
    bullet('Deny — blocca la richiesta se non conforme.'),
    bullet('Audit — crea un evento di avviso senza bloccare.'),
    bullet('DeployIfNotExists — distribuisce automaticamente una risorsa mancante.'),
    bullet('Modify — aggiunge, aggiorna o rimuove proprieta\' durante creazione o aggiornamento.'),
    h3('2.4.6 — Valutazione delle risorse tramite Azure Policy'),
    bullet('Compliant — la risorsa rispetta tutte le condizioni della policy.'),
    bullet('Non-compliant — la risorsa non rispetta una o piu\' condizioni.'),
    bullet('Ciclo standard di valutazione della conformita\' ogni 24 ore.'),
    h2('2.5 — Proteggere le risorse con Azure RBAC'),
    h3('2.5.1 — Introduzione'),
    body('Azure RBAC (Role-Based Access Control) garantisce che gli utenti abbiano esattamente l\'accesso di cui hanno bisogno.'),
    h3('2.5.2 — Che cos\'e\' Azure RBAC?'),
    ...figImg(imgs.rbacRolesHierarchy,'png',895,598,'Figura 26 — Relazione tra ruoli di Azure AD, ruoli di Azure e ruoli di amministratore.'),
    ...figImg(imgs.rbacSecPrincipal,'png',357,134,'Figura 24 — Entita\' di sicurezza: utente, gruppo ed entita\' servizio.'),
    ...figImg(imgs.rbacRoleDef,'png',537,352,'Figura 25 — Definizione del ruolo.'),
    ...figImg(imgs.rbacIamPortal,'png',1069,708,'Figura 27 — Riquadro Controllo di accesso (IAM) nel portale Azure.'),
    bullet('Proprietario — accesso completo, incluso il diritto di delegare l\'accesso ad altri.'),
    bullet('Collaboratore — puo\' creare e gestire risorse, ma non puo\' concedere accesso ad altri.'),
    bullet('Lettore — puo\' solo visualizzare le risorse Azure esistenti.'),
    bullet('Amministratore Accesso Utenti — gestisce gli accessi utente alle risorse Azure.'),
    h2('2.6 — Reimpostazione della password self-service (SSPR)'),
    h3('2.6.1 — Introduzione'),
    body('La reimpostazione della password self-service (SSPR) consente agli utenti di cambiare o reimpostare la propria password senza intervento dell\'amministratore.'),
    h3('2.6.2 — Che cos\'e\' la reimpostazione autonoma della password in Microsoft Entra ID?'),
    bullet('1. Localizzazione — il portale rileva le impostazioni locali del browser.'),
    bullet('2. Verifica — l\'utente immette il proprio nome utente e supera un test CAPTCHA.'),
    bullet('3. Autenticazione — l\'utente immette i dati del metodo di autenticazione registrato.'),
    bullet('4. Reimpostazione della password — l\'utente imposta la nuova password.'),
    bullet('5. Notifica — viene inviata una notifica all\'utente per confermare la reimpostazione.'),
    h3('2.6.3 — Implementare la reimpostazione della password self-service'),
    bullet('Portale Azure -> Microsoft Entra ID -> Sicurezza -> Reimpostazione password self-service.'),
    bullet('Scegliere l\'ambito: Nessuno, Selezionati (gruppi specifici) o Tutti.'),
    bullet('Configurare i metodi di autenticazione: quanti richiesti (1 o 2) e quali abilitare.'),
  ]; }

function modulo3(imgs) { return [
    moduloTitle('Configurare e gestire reti virtuali per amministratori di Azure'),
    moduloIntro('Questo percorso illustra la configurazione delle reti virtuali in Azure, dalla pianificazione degli indirizzi IP alla sicurezza del traffico tramite NSG e alla gestione DNS.'),
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
    ...spacer(1),
    publicIpSkuTable(),
    caption('Tabella 5 — Funzionalita\' dello SKU Standard per gli indirizzi IP pubblici.'),
    h3('3.1.8 — Allocare o assegnare indirizzi IP privati'),
    body('Gli indirizzi IP privati vengono assegnati alle risorse che risiedono all\'interno di una VNet.'),
    ...spacer(1),
    privateIpTable(),
    caption('Tabella 6 — Risorse Azure che supportano indirizzi IP privati e modalita\' di assegnazione.'),
    stepTitle('Metodi di assegnazione'),
    bullet('Dinamico — Azure assegna il prossimo indirizzo disponibile nell\'intervallo della subnet.'),
    bullet('Statico — l\'amministratore sceglie un indirizzo specifico disponibile nell\'intervallo della subnet.'),
    h2('3.2 — Configurare i gruppi di sicurezza di rete'),
    h3('3.2.1 — Introduzione'),
    body('Un gruppo di sicurezza di rete (NSG) e\' un filtro del traffico di rete che consente o nega il traffico verso le risorse Azure. Ogni NSG puo\' essere associato a una subnet, a una NIC o a entrambe.'),
    h3('3.2.2 — Implementare i gruppi di sicurezza di rete'),
    stepTitle('Come funzionano gli NSG'),
    bullet('Traffico in entrata — Azure valuta prima le regole dell\'NSG della subnet, poi quelle dell\'NSG della NIC.'),
    bullet('Traffico in uscita — Azure valuta prima le regole dell\'NSG della NIC, poi quelle dell\'NSG della subnet.'),
    bullet('Se nessun NSG e\' associato, tutto il traffico e\' consentito tra le risorse nella stessa VNet.'),
    ...figImg(imgs.nsgPortal,'png',861,191,'Figura 29 — Panoramica di un NSG nel portale Azure.'),
    infoBox('Best practice:','Associare NSG a livello di subnet anziche\' di singola NIC per una gestione piu\' semplice e scalabile.'),
    h3('3.2.3 — Determinare le regole dei gruppi di sicurezza di rete'),
    body('Ogni NSG contiene regole di sicurezza predefinite che non possono essere eliminate. Ogni regola e\' definita da: Nome, Priorita\', Origine/Destinazione, Protocollo, Direzione, Intervallo di porte e Azione.'),
    infoBox('Comportamento predefinito degli NSG:','Le regole predefinite negano tutto il traffico in entrata ad eccezione di quello proveniente dalla VNet e dal load balancer Azure.'),
    ...spacer(1),
    nsgRuleSettingsTable(),
    caption('Tabella 7 — Impostazioni configurabili per una regola di sicurezza NSG.'),
    ...figImg(imgs.nsgInbound,'png',858,247,'Figura 30 — Regole di sicurezza in ingresso predefinite: AllowVnetInBound (65000), AllowAzureLoadBalancerInBound (65001), DenyAllInBound (65500).'),
    ...figImg(imgs.nsgOutbound,'png',858,236,'Figura 31 — Regole di sicurezza in uscita predefinite: AllowVnetOutBound (65000), AllowInternetOutBound (65001), DenyAllOutBound (65500).'),
    h3('3.2.4 — Determinare le regole effettive dei gruppi di sicurezza di rete'),
    bullet('Traffico in entrata — elabora prima le regole dell\'NSG della subnet, poi quelle dell\'NSG della NIC.'),
    bullet('Traffico in uscita — elabora prima le regole dell\'NSG della NIC, poi quelle dell\'NSG della subnet.'),
    ...figImg(imgs.nsgMultiple,'png',650,478,'Figura 32 — Due NSG applicati a una subnet: NSG1 associato alla NIC di VM1 e NSG2 associato alla subnet.'),
    stepTitle('Considerazioni per regole efficaci'),
    bullet('Se un NSG e\' associato sia alla subnet che alla NIC, occorre definire una regola Allow a entrambi i livelli.'),
    bullet('Traffico intra-subnet — le regole NSG della subnet si applicano anche al traffico tra VM nella stessa subnet.'),
    bullet('Priorita\' delle regole — assegnare valori con intervalli (100, 200, 300) per inserire nuove regole in futuro.'),
    ...figImg(imgs.nsgEffective,'png',859,65,null),
    infoBox('Network Watcher:','Azure Network Watcher offre una visualizzazione consolidata delle regole NSG. IP Flow Verify valuta il traffico rispetto alle regole effettive.'),
    h3('3.2.5 — Creare regole del gruppo di sicurezza di rete'),
    body('Le regole NSG si creano dal portale Azure, PowerShell, CLI o template ARM. Ogni regola usa un approccio a 5 tuple.'),
    stepTitle('Gli NSG sono stateful'),
    infoBox('Stateful vs Stateless:','Un firewall stateful ricorda le connessioni aperte. Gli NSG Azure sono stateful — la risposta a una connessione consentita e\' sempre permessa senza dover scrivere regole bidirezionali.'),
    stepTitle('Tag di servizio'),
    bullet('Internet — tutti gli indirizzi IP pubblici esterni alla VNet.'),
    bullet('VirtualNetwork — tutto lo spazio di indirizzi della VNet e delle reti connesse.'),
    bullet('AzureLoadBalancer — indirizzo IP virtuale del load balancer Azure (168.63.129.16).'),
    bullet('AzureCloud — tutti gli indirizzi IP pubblici di Azure, inclusi i datacenter.'),
    stepTitle('Regole di sicurezza aumentate'),
    infoBox('Esempio pratico:','Invece di creare 4 regole separate per le porte 80, 443, 8080 e 8090, creare una sola regola con tutte le porte nel campo Servizio.'),
    h3('3.2.6 — Implementare gruppi di sicurezza delle applicazioni'),
    body('I gruppi di sicurezza delle applicazioni (ASG) permettono di raggruppare le VM in base al ruolo applicativo e usare questi gruppi nelle regole NSG al posto di indirizzi IP specifici.'),
    stepTitle('Come funzionano gli ASG'),
    bullet('Si crea un ASG (es. WebServers, AppServers) e si assegna a ogni NIC delle VM del gruppo.'),
    bullet('Nelle regole NSG si usa il nome dell\'ASG come origine o destinazione.'),
    bullet('Quando si aggiunge una nuova VM, basta associare la NIC all\'ASG — le regole si applicano automaticamente.'),
    ...figImg(imgs.asgDiagram,'png',320,274,'Figura 34 — ASG applicati a una VNet: Internet accede ai WebServers su porte 80/443; i WebServers accedono agli AppLServers sulla porta SQL 1433.'),
    bullet('Regola 1 (priorita\' 100) — consenti traffico da Internet verso ASG WebServers su porte 80 e 443.'),
    bullet('Regola 2 (priorita\' 110) — consenti traffico da ASG WebServers verso ASG AppLServers sulla porta 1433 (SQL).'),
    bullet('Regola 3 (priorita\' 120) — nega tutto il traffico verso ASG AppLServers su porte 80 e 443.'),
    infoBox('ASG vs tag di servizio:','I tag di servizio gestiscono i servizi Azure. Gli ASG raggruppano le VM personalizzate. I due strumenti sono complementari e possono essere usati insieme.'),
    // ─── 3.3 — Ospitare il dominio in DNS di Azure ───────────────────────────
    h2('3.3 — Ospitare il dominio in DNS di Azure'),
    h3('3.3.1 — Introduzione'),
    body('DNS di Azure e\' un servizio di hosting per zone DNS che utilizza l\'infrastruttura Microsoft Azure per la risoluzione dei nomi. In questa sezione si imparera\' cos\'e\' il DNS e come funziona, come configurare DNS di Azure per ospitare un dominio, e come usare i record alias per collegare dinamicamente il dominio apex a risorse Azure come load balancer, Traffic Manager e CDN.'),
    h3('3.3.2 — Cos\'e\' DNS e come funziona'),
    body('DNS (Domain Name System) e\' un protocollo dello standard TCP/IP che traduce i nomi di dominio leggibili (es. www.contoso.com) in indirizzi IP. E\' una directory distribuita ospitata su server in tutto il mondo: quando un client richiede la risoluzione di un nome, il server DNS cerca nella cache locale o interroga altri server DNS finche\' trova una corrispondenza.'),
    stepTitle('Le due funzioni principali di un server DNS'),
    bullet('Cache locale — il server mantiene una cache dei nomi di dominio usati di recente con i relativi indirizzi IP. Se la risposta e\' in cache, la restituisce subito. Se non la trova, passa la richiesta a un altro server DNS fino alla corrispondenza o al timeout.'),
    bullet('Autorita\' su una zona — il server gestisce il database delle coppie nome/IP per tutti gli host e sottodomini su cui ha autorita\'. Tipicamente associata a Web, posta elettronica e altri servizi Internet del dominio.'),
    stepTitle('Come viene assegnato il server DNS'),
    bullet('Connessione da rete locale — le impostazioni DNS provengono dal server della rete (es. Active Directory, router aziendale).'),
    bullet('Connessione da posizione esterna — le impostazioni DNS vengono fornite dal provider di servizi Internet (ISP).'),
    bullet('In Azure — DNS di Azure usa l\'indirizzo 168.63.129.16 come resolver ricorsivo per le VNet. E\' possibile sovrascriverlo con server DNS personalizzati a livello di VNet.'),
    infoBox('SOA e origine di autorita\':','Quando si configura DNS di Azure come SOA (Start of Authority) per il proprio dominio, Azure diventa il punto di riferimento autorevole per quel dominio su Internet. Gli altri server DNS lo interrogheranno come fonte di verita\'.'),
    stepTitle('Processo di risoluzione di un nome'),
    bullet('Se il nome e\' in cache locale, il server DNS risponde direttamente.'),
    bullet('Se non e\' in cache, interroga altri server DNS sul Web fino a trovare una corrispondenza.'),
    bullet('Se non viene trovata risposta dopo un numero ragionevole di tentativi, restituisce un errore "impossibile trovare il dominio".'),
    stepTitle('IPv4 e IPv6'),
    bullet('IPv4 — quattro gruppi di numeri da 0 a 255 separati da punto (es. 127.0.0.1). Standard ancora piu\' diffuso, ma insufficiente per l\'esplosione di dispositivi IoT.'),
    bullet('IPv6 — otto gruppi esadecimali separati da due punti (es. fe80::e884:edb0:ddee:fea3). Standard piu\' recente destinato a sostituire IPv4. DNS di Azure supporta entrambi.'),
    h3('3.3.3 — Tipi di record DNS'),
    body('Le informazioni di configurazione DNS sono archiviate come record all\'interno di una zona. I principali tipi di record sono:'),
    bullet('A — record host: mappa un dominio o nome host a un indirizzo IPv4. Tipo piu\' comune.'),
    bullet('AAAA — record host per IPv6: analogo al record A ma per indirizzi IPv6.'),
    bullet('CNAME — nome canonico: crea un alias da un nome di dominio a un altro. Utile se piu\' domini puntano allo stesso sito.'),
    bullet('MX — mail exchange: instrada il traffico e-mail verso il server di posta, sia on-premise che cloud.'),
    bullet('TXT — record di testo: associa stringhe di testo a un dominio. Usato da Azure e Microsoft 365 per verificare la proprieta\' del dominio.'),
    bullet('NS — server dei nomi: indica quali server DNS sono autorevoli per la zona. Creato automaticamente con la zona.'),
    bullet('SOA — Start of Authority: rappresenta il dominio e contiene informazioni amministrative sulla zona. Creato automaticamente.'),
    infoBox('Set di record:','Alcuni tipi (es. A, AAAA) supportano piu\' valori in un unico record. Ad esempio, un record A con due indirizzi IP consente il bilanciamento del traffico. I record SOA e CNAME non possono avere set di record.'),
    h3('3.3.4 — Cos\'e\' DNS di Azure e perche\' usarlo'),
    body('DNS di Azure e\' un servizio di hosting per zone DNS basato sull\'infrastruttura Microsoft Azure. Permette di gestire i record DNS dei propri domini usando le stesse credenziali, fatturazione e contratto di supporto degli altri servizi Azure. Funge da origine di autorita\' (SOA) per il dominio.'),
    infoBox('Attenzione:','DNS di Azure NON consente di registrare nuovi nomi di dominio. La registrazione va effettuata presso un registrar di terze parti. DNS di Azure gestisce solo l\'hosting e la risoluzione dei record per un dominio gia\' registrato.'),
    stepTitle('Vantaggi principali'),
    bullet('Sicurezza — RBAC per controllo granulare degli accessi, log attivita\' per audit, blocco risorse per proteggere zone critiche.'),
    bullet('Integrazione con Azure — gestisce i record DNS per servizi Azure e risorse esterne. Supporta portale, PowerShell, CLI e API REST.'),
    bullet('Zone DNS private — risoluzione dei nomi per VM in reti virtuali senza esporre i record su Internet. Supporta split-horizon DNS.'),
    bullet('Record alias — i record DNS possono puntare direttamente a risorse Azure e si aggiornano automaticamente al variare dell\'IP della risorsa.'),
    infoBox('Limitazione:','DNS di Azure non supporta DNSSEC (Domain Name System Security Extensions). Se necessario, occorre ospitare quei componenti presso un provider di terze parti.'),
    h3('3.3.5 — Configurare una zona DNS pubblica'),
    body('Una zona DNS pubblica ospita i record DNS di un dominio rendendoli visibili su Internet.'),
    stepTitle('Passo 1 — Creare la zona DNS in Azure'),
    body('Nel portale Azure si crea una nuova risorsa "Zona DNS". I parametri richiesti sono: sottoscrizione, gruppo di risorse, nome del dominio (es. contoso.com) e area del gruppo di risorse.'),
    stepTitle('Passo 2 — Ottenere i server DNS di Azure'),
    body('Dopo la creazione, Azure assegna quattro server dei nomi (record NS) alla zona. Questi server sono il punto di riferimento a cui il registrar del dominio deve delegare la risoluzione.'),
    stepTitle('Passo 3 — Aggiornare il registrar'),
    body('Accedere al pannello di gestione del registrar e sostituire i server dei nomi esistenti con i quattro forniti da Azure. Questa operazione si chiama delega del dominio e puo\' richiedere da 10 minuti ad alcune ore per propagarsi.'),
    stepTitle('Passo 4 — Verificare la delega'),
    ...codeBlock(['nslookup -type=SOA contoso.com']),
    stepTitle('Passo 5 — Configurare i record personalizzati'),
    bullet('Record A — mappa un nome host (es. webserver1) a un indirizzo IPv4. Richiede nome, tipo A, TTL e indirizzo IP.'),
    bullet('Record CNAME — crea un alias verso un altro nome. Es. www -> contoso.com con TTL 600s.'),
    h3('3.3.6 — Configurare una zona DNS privata'),
    body('Le zone DNS private risolvono i nomi solo all\'interno delle reti virtuali collegate, senza esporre i record su Internet e senza richiedere un registrar esterno.'),
    stepTitle('Passo 1 — Creare la zona DNS privata'),
    body('Nel portale Azure cercare "Zone DNS private" e creare una nuova zona specificando un gruppo di risorse e un nome (es. private.contoso.com).'),
    stepTitle('Passo 2 — Identificare le reti virtuali'),
    body('Individuare le VNet in cui risiedono le VM che devono poter risolvere i nomi privati.'),
    stepTitle('Passo 3 — Collegare la VNet alla zona privata'),
    body('Nella zona DNS privata, selezionare "Collegamenti di rete virtuale" -> "Aggiungi" e scegliere la VNet da collegare.'),
    bullet('I nomi host delle VM nella VNet vengono mantenuti automaticamente nella zona privata.'),
    bullet('Il supporto split-horizon consente di avere lo stesso nome in zona pubblica e privata, risolto diversamente in base alla sorgente della richiesta.'),
    infoBox('Vantaggi delle zone private:','Nessun investimento in infrastruttura DNS dedicata. Supporta tutti i tipi di record (A, AAAA, CNAME, MX, TXT, SOA, PTR, SRV). Aggiornamento automatico dei nomi host delle VM.'),
    h3('3.3.7 — Record alias e dominio apex'),
    body('Il dominio apex (o apice di zona) e\' il livello radice del dominio, ad esempio contoso.com senza prefissi. Viene spesso indicato con il simbolo @. I record NS e SOA vengono creati automaticamente sull\'apex.'),
    stepTitle('Il problema dei record CNAME sull\'apex'),
    body('I record CNAME non possono essere usati a livello di dominio apex. Questo crea un problema quando si vuole puntare contoso.com verso un servizio come Traffic Manager o un CDN, che richiedono un nome invece di un IP fisso.'),
    stepTitle('Soluzione — record alias'),
    body('I record alias di Azure permettono a un record sull\'apex di zona (tipo A, AAAA o CNAME) di puntare direttamente a una risorsa Azure. Il collegamento e\' dinamico: se l\'IP della risorsa cambia, il record DNS si aggiorna automaticamente.'),
    stepTitle('Risorse supportate dai record alias'),
    bullet('Profilo di Traffic Manager — per bilanciamento del carico globale e failover automatico.'),
    bullet('Endpoint di Azure CDN — per distribuzione dei contenuti geograficamente distribuita.'),
    bullet('Indirizzo IP pubblico di Azure — utile quando l\'IP pubblico puo\' cambiare nel tempo.'),
    bullet('Profilo Azure Front Door — per applicazioni globali con routing avanzato.'),
    stepTitle('Vantaggi dei record alias'),
    bullet('Impedisce il "dangling DNS" — i record DNS non rimangono a puntare a risorse eliminate o con IP cambiato.'),
    bullet('Aggiornamento automatico — se l\'IP sottostante cambia, tutti i record alias associati si aggiornano senza intervento manuale.'),
    bullet('Supporto per il bilanciamento del carico sull\'apex — consente di collegare contoso.com direttamente a Traffic Manager.'),
    bullet('Ciclo di vita integrato — il record alias e\' legato alla risorsa Azure di destinazione.'),
    infoBox('Esempio pratico:','Una societa\' vuole che contoso.com punti al proprio servizio di bilanciamento del carico. Non si puo\' usare un record A statico perche\' l\'IP del load balancer puo\' cambiare, e non si puo\' usare un CNAME sull\'apex. La soluzione e\' un record alias di tipo A che punta all\'indirizzo IP pubblico Azure o al profilo Traffic Manager.'),
  ]; }

function modulo4() { return [
    moduloTitle('Implementare e gestire l\'archiviazione in Azure'),
    moduloIntro('Questo percorso illustra le soluzioni di archiviazione in Azure, dalla configurazione degli account alle strategie di ridondanza.'),
  ]; }

function modulo5() { return [
    moduloTitle('Distribuire e gestire risorse di calcolo di Azure'),
    moduloIntro('Questo percorso copre le principali risorse di calcolo in Azure, dalla gestione delle macchine virtuali alle soluzioni container e PaaS.'),
  ]; }

function modulo6() { return [
    moduloTitle('Monitorare ed eseguire il backup delle risorse di Azure'),
    moduloIntro('Questo percorso affronta il monitoraggio proattivo delle risorse Azure e le strategie di backup e disaster recovery.'),
  ]; }

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
    children.push(...sommario());
    for (let m = 1; m <= 6; m++) children.push(...MODULI[m](imgs));
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
