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
  dns3CreateZone:   loadImg('Module 3 - Configurare e gestire reti virtuali/3-create-dns-zone.png'),
  dns3NameServer:   loadImg('Module 3 - Configurare e gestire reti virtuali/3-name-server.png'),
  dns3PrivateZone:  loadImg('Module 3 - Configurare e gestire reti virtuali/3-create-private-dns-zone.png'),
  dns3VnetLink:     loadImg('Module 3 - Configurare e gestire reti virtuali/3-virtual-network-link-option.png'),
  dns3AddVnetLink:  loadImg('Module 3 - Configurare e gestire reti virtuali/3-add-virtual-network-link.png'),
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
    tocEntry('3.3.2 — Cos\'e\' DNS di Azure?'),
    tocEntry('3.3.3 — Configurare DNS di Azure per ospitare il dominio'),
    tocEntry('3.3.4 — Risolvere dinamicamente il nome di una risorsa con un record alias'),
    tocHeading('3.4 — Configurare il peering di rete virtuale'),
    tocEntry('3.4.1 — Introduzione'),
    tocEntry('3.4.2 — Determinare gli usi del peering della rete virtuale'),
    tocEntry('3.4.3 — Determinare il transito e la connettivita\' del gateway'),
    tocEntry('3.4.4 — Creare il peering di reti virtuali'),
    tocEntry('3.4.5 — Estendere il peering con route definite dall\'utente e il concatenamento dei servizi'),
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
  if (mode === 'toc')    return 'AZ-104_Sommario.docx';
  if (mode === 'module') return `AZ-104_Modulo_${n}.docx`;
  return 'AZ-104_Note_di_Studio.docx';
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
    ...figImg(imgs.nsgMultiple,'png',380,279,'Figura 32 — Due NSG applicati a una subnet: NSG1 associato alla NIC di VM1 e NSG2 associato alla subnet.'),
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
    body('DNS di Azure consente di ospitare i record DNS per i domini nell\'infrastruttura di Azure, usando le stesse credenziali, API, strumenti e fatturazione degli altri servizi Azure.'),
    body('Scenario tipico: un\'azienda acquista un nome di dominio personalizzato (es. wideworldimports.com) da un registrar di terze parti e ha bisogno di un servizio di hosting DNS che risolva il dominio nell\'indirizzo IP del server Web. DNS di Azure e\' la soluzione integrata in Azure per questo scopo.'),
    stepTitle('Obiettivi del modulo'),
    bullet('Configurare DNS di Azure per ospitare un dominio pubblico.'),
    bullet('Creare e configurare una zona DNS privata.'),
    bullet('Risolvere dinamicamente il nome di una risorsa Azure tramite record alias.'),
    infoBox('Prerequisito:','Conoscenza dei concetti di rete di base — risoluzione dei nomi e indirizzi IP.'),
    h3('3.3.2 — Cos\'e\' DNS di Azure?'),
    body('DNS (Domain Name System) e\' un protocollo TCP/IP che traduce nomi di dominio leggibili (es. www.wideworldimports.com) in indirizzi IP. E\' una directory distribuita ospitata su server in tutto il mondo.'),
    stepTitle('Le due funzioni principali di un server DNS'),
    bullet('Cache locale — mantiene una cache dei nomi usati di recente con i relativi IP. Se la risposta e\' in cache la restituisce subito, altrimenti passa la richiesta ad altri server DNS fino alla corrispondenza o al timeout.'),
    bullet('Autorita\' su una zona — gestisce il database delle coppie nome/IP per tutti gli host e sottodomini su cui ha autorita\' (Web, posta, altri servizi Internet del dominio).'),
    stepTitle('Processo di risoluzione di un nome'),
    bullet('Se il nome e\' in cache locale, il server DNS risponde direttamente.'),
    bullet('Se non e\' in cache, interroga altri server DNS fino a trovare una corrispondenza.'),
    bullet('Se non viene trovata risposta, restituisce un errore "impossibile trovare il dominio".'),
    stepTitle('IPv4 e IPv6'),
    bullet('IPv4 — quattro gruppi di numeri (0-255) separati da punto (es. 127.0.0.1). Standard dominante, ma insufficiente per la crescita dei dispositivi IoT.'),
    bullet('IPv6 — otto gruppi esadecimali separati da due punti (es. fe80::e884:edb0:ddee:fea3). Standard piu\' recente, destinato a sostituire IPv4. DNS di Azure supporta entrambi.'),
    stepTitle('Tipi di record DNS'),
    bullet('A — mappa un dominio o nome host a un indirizzo IPv4. Tipo piu\' comune.'),
    bullet('AAAA — analogo al record A ma per indirizzi IPv6.'),
    bullet('CNAME — nome canonico: crea un alias da un nome di dominio a un altro.'),
    bullet('MX — mail exchange: instrada il traffico e-mail verso il server di posta.'),
    bullet('TXT — associa stringhe di testo a un dominio. Usato da Azure e Microsoft 365 per verificare la proprieta\' del dominio.'),
    bullet('NS — server dei nomi: indica quali server DNS sono autorevoli per la zona. Creato automaticamente con la zona.'),
    bullet('SOA — Start of Authority: contiene informazioni amministrative sulla zona. Creato automaticamente.'),
    body('Sono inoltre disponibili: caratteri jolly (coprono sottodomini non definiti), CAA (autorizza specifiche CA a emettere certificati), SPF (server autorizzati a inviare email, via TXT), SRV (host e porta per servizi come VoIP).'),
    infoBox('Set di record:','Alcuni tipi (A, AAAA) supportano piu\' valori in un unico record — detti set di record. Ad esempio un record A con due IP consente il bilanciamento del traffico. I record SOA e CNAME non possono avere set di record.'),
    stepTitle('Cos\'e\' DNS di Azure'),
    body('DNS di Azure e\' un servizio di hosting per zone DNS basato sull\'infrastruttura Microsoft Azure. Permette di gestire i record DNS dei propri domini con le stesse credenziali, fatturazione e contratto di supporto degli altri servizi Azure. Funge da origine di autorita\' (SOA) per il dominio.'),
    infoBox('Importante:','DNS di Azure NON consente di registrare nuovi nomi di dominio — questa operazione va effettuata presso un registrar di terze parti. DNS di Azure gestisce solo l\'hosting e la risoluzione dei record per un dominio gia\' registrato.'),
    stepTitle('Vantaggi principali'),
    bullet('Sicurezza — RBAC per controllo granulare degli accessi, log attivita\' per audit, blocco risorse per proteggere zone critiche.'),
    bullet('Semplicita\' — gestisce i record DNS per servizi Azure e risorse esterne tramite portale, PowerShell, CLI e API REST.'),
    bullet('Zone DNS private — risoluzione dei nomi per VM nelle VNet senza esporre i record su Internet. Supporta split-horizon DNS.'),
    bullet('Record alias — i record DNS puntano direttamente a risorse Azure e si aggiornano automaticamente al variare dell\'IP.'),
    infoBox('Limitazione:','DNS di Azure non supporta DNSSEC. Se necessario, occorre ospitare quei componenti presso un provider di terze parti.'),
    h3('3.3.3 — Configurare DNS di Azure per ospitare il dominio'),
    stepTitle('Configurare una zona DNS pubblica'),
    body('Una zona DNS pubblica ospita i record DNS di un dominio rendendoli visibili su Internet.'),
    bullet('Passo 1 — Creare la zona DNS in Azure: nel portale Azure creare una nuova risorsa "Zona DNS" specificando sottoscrizione, gruppo di risorse e nome del dominio (es. wideworldimports.com).'),
    ...figImg(imgs.dns3CreateZone,'png',550,331,'Figura 35 — Pagina Crea zona DNS nel portale Azure.'),
    bullet('Passo 2 — Ottenere i server DNS di Azure: dopo la creazione, Azure assegna quattro server dei nomi (record NS) alla zona.'),
    ...figImg(imgs.dns3NameServer,'png',550,234,'Figura 36 — Dettagli del server dei nomi nella zona DNS.'),
    bullet('Passo 3 — Aggiornare il registrar: sostituire i server dei nomi del registrar con i quattro forniti da Azure. Questa operazione si chiama delega del dominio.'),
    bullet('Passo 4 — Verificare la delega con nslookup:'),
    ...codeBlock(['nslookup -type=SOA wideworldimports.com']),
    bullet('Passo 5 — Configurare i record personalizzati: aggiungere record A (nome host + TTL + IP) e record CNAME (es. www -> wideworldimports.com, TTL 600s).'),
    stepTitle('Configurare una zona DNS privata'),
    body('Le zone DNS private risolvono i nomi solo all\'interno delle VNet collegate, senza esporre i record su Internet e senza richiedere un registrar.'),
    bullet('Passo 1 — Creare la zona DNS privata: nel portale Azure cercare "Zone DNS private" e creare una nuova zona (es. private.wideworldimports.com).'),
    ...figImg(imgs.dns3PrivateZone,'png',550,423,'Figura 37 — Pagina Crea zona DNS privata nel portale Azure.'),
    bullet('Passo 2 — Identificare le reti virtuali: individuare le VNet in cui risiedono le VM che devono risolvere i nomi privati.'),
    bullet('Passo 3 — Collegare la VNet alla zona privata: nella zona DNS privata selezionare "Collegamenti di rete virtuale" -> "Aggiungi" e scegliere la VNet. Ripetere per ogni VNet.'),
    ...figImg(imgs.dns3VnetLink,'png',550,314,'Figura 38 — Pagina dei collegamenti di rete virtuale in una zona DNS privata.'),
    ...figImg(imgs.dns3AddVnetLink,'png',550,326,'Figura 39 — Pagina Aggiungi collegamento alla rete virtuale.'),
    infoBox('Vantaggi delle zone private:','Nessuna infrastruttura DNS dedicata, supporto per tutti i tipi di record (A, AAAA, CNAME, MX, TXT, SOA, PTR, SRV), aggiornamento automatico dei nomi host delle VM, supporto split-horizon DNS.'),
    h3('3.3.4 — Risolvere dinamicamente il nome di una risorsa con un record alias'),
    stepTitle('Il problema del dominio apex'),
    body('Il dominio apex (o apice di zona) e\' il livello radice del dominio — es. wideworldimports.com senza prefissi. Viene indicato con il simbolo @. I record NS e SOA vengono creati automaticamente sull\'apex.'),
    body('I record CNAME non sono supportati a livello di apex di zona. Questo e\' un problema quando si vuole puntare il dominio radice a un servizio Azure come Traffic Manager o un CDN, che richiedono un nome anziche\' un IP fisso.'),
    stepTitle('Cosa sono i record alias'),
    body('I record alias di Azure permettono a un record sull\'apex di zona (tipo A, AAAA o CNAME) di fare riferimento direttamente a una risorsa Azure invece di un indirizzo IP statico. Il collegamento e\' dinamico: se l\'IP della risorsa cambia, il record DNS si aggiorna automaticamente.'),
    body('Le risorse Azure supportate dai record alias sono: Profilo di Traffic Manager, Endpoint di Azure CDN, Indirizzo IP pubblico di Azure, Profilo Azure Front Door.'),
    stepTitle('Vantaggi dei record alias'),
    bullet('Impedisce il "dangling DNS" — i record non rimangono a puntare a risorse eliminate o con IP cambiato, perche\' il ciclo di vita del record e\' legato alla risorsa Azure.'),
    bullet('Aggiornamento automatico — se l\'IP sottostante cambia, tutti i record alias associati si aggiornano senza intervento manuale.'),
    bullet('Bilanciamento del carico sull\'apex — consente di collegare wideworldimports.com direttamente a Traffic Manager.'),
    bullet('Routing verso CDN — consente di fare riferimento direttamente a un\'istanza di Azure CDN.'),
    infoBox('Esempio pratico:','Un\'azienda vuole che wideworldimports.com punti al proprio load balancer. Non si puo\' usare un record A statico (l\'IP puo\' cambiare) ne\' un CNAME sull\'apex. La soluzione e\' un record alias di tipo A che punta all\'indirizzo IP pubblico Azure o al profilo Traffic Manager associato al load balancer.'),

    // ─── 3.4 — Configurare il peering di rete virtuale ───────────────────────
    h2('3.4 — Configurare il peering di rete virtuale'),
    h3('3.4.1 — Introduzione'),
    body('Il peering di reti virtuali di Azure consente di connettere reti virtuali nella stessa area o in aree diverse, facendo comunicare le risorse in modo privato attraverso la rete backbone Microsoft, senza passare per Internet.'),
    body('Scenario tipico: un\'azienda sta migrando i propri servizi su Azure distribuendoli in reti virtuali separate. Le unita\' aziendali hanno bisogno che certi servizi comunichino tra loro privatamente, senza esporre traffico su Internet.'),
    stepTitle('Obiettivi del modulo'),
    bullet('Identificare i casi d\'uso e le funzionalita\' del peering di reti virtuali di Azure.'),
    bullet('Configurare il Gateway VPN di Azure come punto di transito per la connettivita\' tra reti.'),
    bullet('Estendere il peering tramite reti hub-spoke, route definite dall\'utente e concatenamento dei servizi.'),
    infoBox('Prerequisito:','Conoscenza di base delle reti virtuali Azure e delle macchine virtuali.'),

    h3('3.4.2 — Determinare gli usi del peering della rete virtuale'),
    body('Il peering di reti virtuali e\' il modo piu\' semplice e rapido per connettere due reti virtuali Azure. Dopo il peering le due reti operano come un\'unica rete ai fini della connettivita\'.'),
    stepTitle('Tipi di peering'),
    bullet('Peering a livello di area — connette reti virtuali nella stessa area Azure (cloud pubblico, Azure Cina o Azure per enti pubblici).'),
    bullet('Peering globale — connette reti virtuali in aree diverse (solo cloud pubblico o Azure Cina; non consentito tra aree diverse di Azure per enti pubblici).'),
    stepTitle('Vantaggi'),
    makeTable(
      ['Vantaggio','Descrizione'],
      [
        ['Connessione privata','Il traffico rimane sulla rete backbone Microsoft — nessun gateway, nessun Internet pubblico, nessuna crittografia richiesta.'],
        ['Alte prestazioni','Bassa latenza e alta larghezza di banda grazie all\'infrastruttura Azure.'],
        ['Comunicazione semplice','Le risorse nelle reti con peering comunicano come se fossero sulla stessa rete.'],
        ['Trasferimento dati flessibile','Supporta trasferimenti tra sottoscrizioni, modelli di distribuzione e aree diverse.'],
        ['Nessun downtime','Il peering si crea e gestisce senza interruzioni per le risorse esistenti.'],
      ]
    ),
    stepTitle('Requisiti e limitazioni'),
    makeTable(
      ['Requisito / Limitazione','Descrizione'],
      [
        ['Spazi indirizzi non sovrapposti','Le reti con peering devono avere spazi IP non sovrapposti. Il peering fallisce in caso di sovrapposizione.'],
        ['Modifica dello spazio indirizzi','Per modificare l\'intervallo IP di una rete con peering attivo, eliminare il peering, aggiornare lo spazio e riconfigurare il peering.'],
        ['Load Balancer Basic','Le risorse non possono comunicare con gli IP di un Load Balancer Basic interno nelle reti con peering globale. Usare Load Balancer Standard.'],
        ['Risoluzione DNS','La risoluzione dei nomi predefinita di Azure non funziona tra reti con peering. Usare zone DNS private o server DNS personalizzati.'],
      ]
    ),
    infoBox('Nota:','Le reti rimangono risorse separate dopo il peering. E\' possibile eseguire il peering tra sottoscrizioni e tenant diversi.'),

    h3('3.4.3 — Determinare il transito e la connettivita\' del gateway'),
    body('Il Gateway VPN di Azure puo\' essere configurato come punto di transito in una rete hub: le reti spoke usano il gateway dell\'hub per accedere a risorse esterne senza dover avere un proprio gateway VPN.'),
    stepTitle('Scenario tipico'),
    bullet('Rete Hub — contiene la subnet del gateway e il Gateway VPN di Azure.'),
    bullet('Reti A e B — entrambe in peering con l\'Hub; la rete B usa il gateway remoto dell\'Hub per accedere a risorse esterne (on-premises o altre VNet).'),
    stepTitle('Impostazioni chiave nella configurazione del peering'),
    makeTable(
      ['Impostazione','Descrizione'],
      [
        ['Traffico verso la rete virtuale remota','Controlla se il traffico puo\' fluire da questa rete alla rete remota.'],
        ['Traffico inoltrato dalla rete virtuale remota','Controlla se accettare traffico inoltrato (non originato) dalla rete con peering.'],
        ['Gateway di rete virtuale o Server di route','Abilita il transito: consente alle reti con peering di usare il gateway VPN o il Route Server di questa rete.'],
        ['Gateway di rete virtuale remoto o Route Server','Permette a questa rete di usare il gateway VPN o il Route Server della rete remota.'],
      ]
    ),
    stepTitle('Caratteristiche del Gateway VPN con peering'),
    bullet('Una rete virtuale puo\' avere un solo gateway VPN.'),
    bullet('Il transito e\' supportato sia per il peering a livello di area che globale.'),
    bullet('Con il transito abilitato, il gateway hub puo\' gestire: VPN da sito a sito verso on-premises, connessioni VNet-to-VNet, VPN da punto a sito per client remoti.'),
    bullet('Le reti spoke condividono il gateway dell\'hub senza bisogno di un gateway dedicato.'),
    infoBox('NSG e peering:','E\' possibile applicare gruppi di sicurezza di rete per bloccare o consentire il traffico tra reti con peering, anche dopo la creazione del peering.'),

    h3('3.4.4 — Creare il peering di reti virtuali'),
    body('Il peering si configura tramite il portale Azure, PowerShell o l\'interfaccia della riga di comando. I passaggi seguenti si riferiscono al portale Azure con reti distribuite tramite Azure Resource Manager.'),
    stepTitle('Prerequisiti'),
    bullet('L\'account Azure deve avere il ruolo Network Contributor (o un ruolo personalizzato con le autorizzazioni di peering necessarie).'),
    bullet('Devono esistere due reti virtuali — la seconda e\' chiamata rete remota.'),
    bullet('Gli spazi indirizzi non devono sovrapporsi.'),
    stepTitle('Creare il peering dal portale'),
    bullet('Passo 1 — Aprire la prima rete virtuale nel portale Azure e selezionare Peering -> Aggiungi.'),
    bullet('Passo 2 — Specificare un nome per il collegamento verso la rete remota e un nome per il collegamento inverso.'),
    bullet('Passo 3 — Selezionare la rete virtuale remota (per sottoscrizione, ID risorsa o ricerca nel portale).'),
    bullet('Passo 4 — Configurare le impostazioni di traffico e gateway in base alle esigenze.'),
    bullet('Passo 5 — Confermare: Azure crea automaticamente entrambi i collegamenti (bidirezionale).'),
    stepTitle('Verificare lo stato del peering'),
    bullet('Avviato — il peering e\' stato creato dalla prima rete verso la remota, ma non e\' ancora bidirezionale.'),
    bullet('Connesso — entrambe le reti hanno stabilito il peering correttamente.'),
    infoBox('Importante:','Finche\' entrambe le reti non sono in stato Connesso, le macchine virtuali non possono comunicare tra loro.'),

    h3('3.4.5 — Estendere il peering con route definite dall\'utente e il concatenamento dei servizi'),
    body('Il peering di rete virtuale non e\' transitivo: se A e\' in peering con B e B e\' in peering con C, A e C non possono comunicare automaticamente. Per estendere la connettivita\' oltre il peering diretto occorre usare meccanismi aggiuntivi.'),
    stepTitle('Meccanismi per estendere il peering'),
    makeTable(
      ['Meccanismo','Descrizione'],
      [
        ['Rete hub-spoke','La rete hub ospita componenti condivisi (NVA, Gateway VPN). Tutte le reti spoke eseguono il peering verso l\'hub. Il traffico tra spoke fluisce attraverso le appliance o il gateway nell\'hub.'],
        ['Route definita dall\'utente (UDR)','Permette route personalizzate in cui l\'hop successivo e\' l\'IP di una VM o di un gateway VPN in una rete con peering, superando il routing predefinito.'],
        ['Concatenamento dei servizi','Indirizza il traffico verso una NVA o un gateway tramite UDR che puntano a VM in reti con peering come hop successivo.'],
        ['Azure Virtual Network Manager','Gestisce centralmente topologie hub-spoke o mesh su larga scala, automatizzando la creazione del peering.'],
      ]
    ),
    stepTitle('Topologia hub-spoke'),
    body('Nella topologia hub-spoke il traffico tra due reti spoke non scorre direttamente, ma transita sempre attraverso la rete hub dove risiedono le risorse condivise (NVA, firewall, gateway VPN). Questo centralizza il controllo e la sicurezza del traffico.'),
    infoBox('Esempio:','La rete A vuole raggiungere la rete C. Entrambe sono in peering con l\'hub B. Senza UDR la comunicazione non e\' possibile. Con una UDR che instrada il traffico di A verso la NVA nell\'hub, il traffico transita per B e raggiunge C.'),
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
