'use strict';
// ─────────────────────────────────────────────────────────────────────────────
// AZ-104 — Generatore documento Word (.docx)
//
// ARCHITETTURA: questo script NON contiene il testo del documento. Legge i file
// chapters/MODULE_1.md ... chapters/MODULE_6.md (unica fonte di verita') e li converte in .docx
// interpretando i marker di formattazione: _(stepTitle)_, _(infoBox)_, _(caption)_,
// immagini ![alt](path) _(dimensioni: WxH px)_, tabelle markdown inline, blocchi di
// codice indentati/fenced e i riferimenti [TABELLA: nomeFunzione] alle tabelle
// generate da codice. Il Sommario viene generato automaticamente dalle intestazioni.
//
// Per aggiornare il documento: modifica il .md e rigenera. Nessuna modifica al JS.
//
// Uso:  node script/create_az104.js            -> documento completo
//       node script/create_az104.js --module 2 -> solo Modulo 2
//       node script/create_az104.js --toc      -> solo copertina + sommario
// ─────────────────────────────────────────────────────────────────────────────
const fs = require('fs');
const path = require('path');
const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, ImageRun,
  AlignmentType, LevelFormat, TabStopType,
  BorderStyle, WidthType, ShadingType, VerticalAlign, PageBreak,
  Footer, PageNumber, NumberFormat, TableOfContents
} = require('docx');

const C = {
  titleBlue: '1B3A6B', sectionBlue: '0078D4', tocEntry: '2D5F8A',
  bodyText: '333333', subtle: '555555', caption: '888888',
  white: 'FFFFFF', headerBg: '1F4E78', rowEven: 'F5F8FC',
  infoBoxBg: 'E8F0FB', codeBg: 'EEF3F8', codeText: '1B3A6B', border: 'CCCCCC',
};

// ─── RISOLUZIONE IMMAGINI (ricorsiva, per nome file) ──────────────────────────
// I path nei .md sono semplificati (es. img/entra-users.png) ma i file risiedono
// in sottocartelle (es. img/Module 2 - .../entra-users.png). Risolviamo per
// basename indicizzando ricorsivamente la cartella img/.
// Lo script vive in <root>/script/: la radice del repo e' la cartella superiore.
const ROOT = path.join(__dirname, '..');
const IMG_DIR = path.join(ROOT, 'img');
let _imgIndex = null;
function buildImgIndex() {
  const index = {};
  (function walk(dir) {
    let entries;
    try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch (e) { return; }
    for (const e of entries) {
      const full = path.join(dir, e.name);
      if (e.isDirectory()) walk(full);
      else { const k = e.name.toLowerCase(); if (!(k in index)) index[k] = full; }
    }
  })(IMG_DIR);
  return index;
}
function resolveImg(ref) {
  if (!_imgIndex) _imgIndex = buildImgIndex();
  return _imgIndex[path.basename(ref).toLowerCase()] || null;
}
function loadImg(ref) {
  const full = resolveImg(ref);
  if (!full) { console.warn('  [WARN] Immagine non trovata: ' + ref); return null; }
  try { return fs.readFileSync(full); }
  catch (e) { console.warn('  [WARN] Errore lettura immagine: ' + full); return null; }
}

// ─── HELPER DI RESA (stile invariato rispetto allo STYLE_GUIDE) ───────────────
const noSpacing = {before:0,after:0};
const stdSpacing = {before:60,after:60};

function body(text, opts={}, paraOpts={}) {
  return new Paragraph({ spacing:stdSpacing, keepLines:true, ...paraOpts,
    children:[new TextRun({text, font:'Calibri', size:22, color:C.bodyText, ...opts})] });
}
function h2(text) {
  return new Paragraph({ spacing:{before:200,after:80}, keepNext:true, keepLines:true, outlineLevel:1,
    children:[new TextRun({text, font:'Calibri', size:28, bold:true, color:C.sectionBlue})] });
}
function h3(text) {
  return new Paragraph({ spacing:{before:140,after:60}, keepNext:true, keepLines:true, outlineLevel:2,
    children:[new TextRun({text, font:'Calibri', size:24, bold:true, color:C.tocEntry})] });
}
function stepTitle(text) {
  return new Paragraph({ spacing:{before:100,after:40}, keepNext:true, keepLines:true,
    children:[new TextRun({text, font:'Calibri', size:22, bold:true, color:'000000'})] });
}
function bullet(text, level=0, paraOpts={}) {
  return new Paragraph({ spacing:{before:40,after:40}, keepLines:true, numbering:{reference:'bullets',level}, ...paraOpts,
    children:[new TextRun({text, font:'Calibri', size:22, color:C.bodyText})] });
}
function caption(text) {
  return new Paragraph({ alignment:AlignmentType.CENTER, spacing:{before:40,after:80}, keepLines:true,
    children:[new TextRun({text, font:'Calibri', size:18, italics:true, color:C.caption})] });
}
function codeBlock(lines) {
  const arr = Array.isArray(lines)?lines:[lines];
  return arr.map((line, idx) => new Paragraph({ spacing:noSpacing, keepLines:true, keepNext: idx < arr.length-1,
    shading:{fill:C.codeBg, type:ShadingType.CLEAR}, indent:{left:360,right:360},
    children:[new TextRun({text:line, font:'Courier New', size:18, color:C.codeText})] }));
}
function infoBox(label, text) {
  const children = [];
  if(label) children.push(new TextRun({text:label+' ', font:'Calibri', size:22, bold:true, color:C.sectionBlue}));
  children.push(new TextRun({text, font:'Calibri', size:22, color:C.bodyText}));
  return new Paragraph({ spacing:stdSpacing, keepLines:true, indent:{left:360,right:360},
    border:{left:{style:BorderStyle.SINGLE, size:12, color:C.sectionBlue}},
    shading:{fill:C.infoBoxBg, type:ShadingType.CLEAR}, children });
}
function spacer(n=1) {
  return Array.from({length:n}, ()=>new Paragraph({spacing:noSpacing, children:[new TextRun('')]}));
}
function figImg(data, ext, origW, origH, label) {
  // docx converte la transformation px->EMU a 9525 EMU/px (96 DPI). La colonna di testo
  // utile e' 11906 - 1440*2 = 9026 twip = 6.27in ~= 601 px: oltre, l'immagine sconfina nel
  // margine destro. Clampiamo larghezza (e altezza) scalando in proporzione.
  const MAX_W_PX = 600;   // ~6.25in: resta dentro la colonna
  const MAX_H_PX = 420;   // ~4.4in: figure piu' basse -> meno spazio vuoto prima di una figura
                          // alta che altrimenti non entra in fondo pagina (vedi "Caso 2").
  let w = origW, h = origH;
  if (w > MAX_W_PX) { h = Math.round(h * MAX_W_PX / w); w = MAX_W_PX; }
  if (h > MAX_H_PX) { w = Math.round(w * MAX_H_PX / h); h = MAX_H_PX; }
  const items = [];
  // keepNext: l'immagine resta attaccata alla sua didascalia (e all'intestazione precedente).
  if (data) items.push(new Paragraph({ alignment:AlignmentType.CENTER, spacing:{before:80,after:0}, keepNext:true,
    children:[new ImageRun({data, transformation:{width:w, height:h}, type:ext})] }));
  if (label) items.push(caption(label));
  return items;
}

const FULL_WIDTH=8640;
function tableCell(text, opts={}) {
  const {fill=C.white, bold=false, color=C.bodyText, width, keepNext=false} = opts;
  const tblBorder={style:BorderStyle.SINGLE, size:1, color:C.border};
  return new TableCell({ width:width?{size:width,type:WidthType.DXA}:undefined,
    shading:{fill, type:ShadingType.CLEAR}, margins:{top:80,bottom:80,left:120,right:120},
    borders:{top:tblBorder,bottom:tblBorder,left:tblBorder,right:tblBorder},
    verticalAlign:VerticalAlign.CENTER,
    children:[new Paragraph({ spacing:noSpacing, keepNext, keepLines:true,
      children:[new TextRun({text, font:'Calibri', size:20, bold,
        color:fill===C.headerBg?C.white:color})] })] });
}
function makeTable(headers, rows, colWidths, opts={}) {
  // keepWithNext: l'ultima riga resta "incollata" al paragrafo seguente (la didascalia).
  // Default true (le tabelle hanno quasi sempre una didascalia sotto). Il parser lo mette a
  // false quando dopo la tabella c'e' un'immagine/intestazione: cosi' la tabella non trascina
  // quel blocco a pagina nuova lasciando un buco sopra.
  const keepWithNext = opts.keepWithNext !== false;
  const widths=colWidths||headers.map(()=>Math.floor(FULL_WIDTH/headers.length));
  const tblBorder={style:BorderStyle.SINGLE, size:1, color:C.border};
  const borders={top:tblBorder,bottom:tblBorder,left:tblBorder,right:tblBorder,insideH:tblBorder,insideV:tblBorder};
  // tableHeader: l'intestazione si ripete se la tabella e' costretta a spezzarsi.
  // cantSplit (riga) + keepNext (celle delle righe non finali): la tabella resta unita.
  const headerRow=new TableRow({ cantSplit:true, tableHeader:true,
    children:headers.map((h,i)=>tableCell(h,{fill:C.headerBg, bold:true, width:widths[i], keepNext:true})) });
  const lastIdx=rows.length-1;
  const dataRows=rows.map((row,ri)=>{
    const fill=ri%2===0?C.rowEven:C.white;
    const rowKeepNext = ri<lastIdx ? true : keepWithNext;   // ultima riga: solo se richiesto
    return new TableRow({ cantSplit:true,
      children:row.map((cell,ci)=>{
        if(typeof cell==='object'&&cell.text!==undefined)
          return tableCell(cell.text,{fill, bold:cell.bold, width:widths[ci], keepNext:rowKeepNext});
        return tableCell(cell,{fill, width:widths[ci], keepNext:rowKeepNext});
      }) });
  });
  return new Table({ width:{size:FULL_WIDTH,type:WidthType.DXA}, columnWidths:widths, borders, rows:[headerRow,...dataRows] });
}

function moduloTitle(text) {
  // Niente pageBreakBefore: lo stacco tra moduli e' gestito in fase di assemblaggio
  // (interruzione di pagina tra un modulo e l'altro; il primo sfrutta lo stacco di sezione).
  return new Paragraph({ spacing:{before:0,after:120}, keepNext:true, keepLines:true, outlineLevel:0,
    border:{bottom:{style:BorderStyle.SINGLE, size:8, color:C.sectionBlue, space:4}},
    children:[new TextRun({text, font:'Calibri', size:48, bold:true, color:C.titleBlue})] });
}
function moduloIntro(text) {
  return new Paragraph({ spacing:{before:80,after:120}, keepNext:true, keepLines:true,
    children:[new TextRun({text, font:'Calibri', size:22, italics:true, color:C.bodyText})] });
}

function tocTitle() {
  return new Paragraph({ spacing:{before:0,after:80},
    border:{bottom:{style:BorderStyle.SINGLE, size:8, color:C.sectionBlue, space:4}},
    children:[new TextRun({text:'Sommario', font:'Calibri', size:36, bold:true, color:C.titleBlue})] });
}

// ─── TABELLE GENERATE DA CODICE (riferite nei .md come [TABELLA: nome]) ───────
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
const TABLE_FUNCS = {
  toolsTable, armStructureTable, reservedTable,
  publicIpAssocTable, publicIpSkuTable, privateIpTable, nsgRuleSettingsTable,
};

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

// ─── PARSER MARKDOWN → ELEMENTI DOCX ──────────────────────────────────────────
const RE_TAG = /\s*_\(([^)]*)\)_\s*$/;            // marker finale: ..._(stepTitle)_
function splitTag(s) {
  const m = s.match(RE_TAG);
  if (m) return { text: s.slice(0, m.index).replace(/\s+$/, ''), tag: m[1].trim() };
  return { text: s, tag: null };
}
function stripStars(s) { return s.replace(/^\s*\*+/, '').replace(/\*+\s*$/, '').trim(); }
function inlineText(s) {
  return s
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '')      // immagini inline residue
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')    // link [testo](url) -> testo
    .replace(/\*\*([^*]+)\*\*/g, '$1')          // grassetto
    .replace(/`([^`]+)`/g, '$1')                // codice inline
    .replace(/_\([^)]*\)_/g, '')                // marker residui
    .trim();
}

function parseModule(md, modNum = 0) {
  if (md.charCodeAt(0) === 0xFEFF) md = md.slice(1);   // rimuovi eventuale BOM UTF-8
  const L = md.split(/\r?\n/);
  const N = L.length;
  const elements = [];
  const headings = [];
  let title = '';
  let i = 0;
  // Segnalibri univoci per i riferimenti di pagina del Sommario (PAGEREF -> pagina dell'intestazione)
  const titleBk = 'bkm' + modNum + '_t';
  let bkCount = 0;
  const nextBk = () => 'bkm' + modNum + '_' + (++bkCount);

  const peekNonBlank = (j) => { while (j < N && L[j].trim() === '') j++; return j; };

  // --- Preambolo: titolo (# ...) + intro (_..._) ---
  while (i < N && !/^#\s+/.test(L[i])) i++;
  if (i < N) {
    title = L[i].replace(/^#\s+/, '').replace(/^Modulo\s+\d+\s*[—–-]\s*/, '').trim();
    i++;
  } else {
    i = 0;   // nessun titolo h1 trovato: interpreta dall'inizio
  }
  elements.push(moduloTitle(title, titleBk));
  i = peekNonBlank(i);
  if (i < N && /^_/.test(L[i].trim()) && !/^#/.test(L[i])) {
    const introLines = [];
    while (i < N && L[i].trim() !== '') { introLines.push(L[i].trim()); i++; }
    const intro = inlineText(introLines.join(' ').replace(/^_/, '').replace(/_$/, ''));
    if (intro) elements.push(moduloIntro(intro));
  }

  // --- Corpo ---
  let buf = [];
  let leadIn = null;   // ultimo body/bullet emesso: { idx, kind, make } per agganciarlo al blocco seguente
  const flush = () => {
    if (!buf.length) return;
    const t = inlineText(buf.join(' '));
    if (t) { elements.push(body(t)); leadIn = { idx: elements.length - 1, kind: 'body', make: () => body(t, {}, { keepNext: true }) }; }
    buf = [];
  };
  // Aggancia (keepNext) l'ultimo body/bullet al blocco che segue, se e' ancora l'ultimo elemento
  // emesso: cosi' la frase/voce introduttiva non resta separata dal blocco a fine pagina, anche
  // quando nel sorgente c'e' una riga vuota in mezzo (le righe vuote non emettono paragrafi).
  const glueLeadIn = (kinds) => {
    if (leadIn && leadIn.idx === elements.length - 1 && kinds.includes(leadIn.kind)) elements[leadIn.idx] = leadIn.make();
  };
  let skipManifest = false;

  while (i < N) {
    const raw = L[i];
    const line = raw.trim();

    // Salta il manifest "Immagini usate in questo modulo:" fino al ---
    if (skipManifest) { if (/^---+$/.test(line)) skipManifest = false; i++; continue; }
    if (/^\*\*Immagini usate/.test(line)) { flush(); skipManifest = true; i++; continue; }

    if (line === '') { flush(); i++; continue; }
    if (/^---+$/.test(line)) { flush(); i++; continue; }
    if (/^_\([^)]*\)_$/.test(line)) { i++; continue; }   // marker standalone (es. _(h2: ...)_)

    let m;
    // Intestazioni
    if ((m = line.match(/^###\s+(.+)$/))) {
      flush(); const t = inlineText(splitTag(m[1]).text); const bk = nextBk();
      elements.push(h3(t, bk)); headings.push({ level: 3, text: t, bk }); i++; continue;
    }
    if ((m = line.match(/^##\s+(.+)$/))) {
      flush(); const t = inlineText(splitTag(m[1]).text); const bk = nextBk();
      elements.push(h2(t, bk)); headings.push({ level: 2, text: t, bk }); i++; continue;
    }
    if (/^#\s+/.test(line)) { i++; continue; }   // eventuale altro h1

    // Immagine
    if ((m = line.match(/^!\[[^\]]*\]\(([^)]+)\)/))) {
      flush();   // niente glueLeadIn: il paragrafo introduttivo NON va saldato all'immagine,
                 // altrimenti una figura alta trascina giu' anche testo che starebbe nella pagina prima.
      const imgPath = m[1].trim();
      const dim = line.match(/(\d+)\s*[×x]\s*(\d+)\s*px/);
      const w = dim ? parseInt(dim[1], 10) : 550;
      const h = dim ? parseInt(dim[2], 10) : 350;
      const ext = (imgPath.split('.').pop() || 'png').toLowerCase().replace('jpeg', 'jpg');
      let label = null;
      const j = peekNonBlank(i + 1);
      if (j < N) {
        const cs = splitTag(L[j].trim());
        if (cs.tag === 'caption' || /^\*.+\*$/.test(cs.text)) { label = inlineText(stripStars(cs.text)); i = j; }
      }
      elements.push(...figImg(loadImg(imgPath), ext, w, h, label));
      i++; continue;
    }

    // Tabella generata da codice
    if ((m = line.match(/^\[TABELLA:\s*([A-Za-z0-9_]+)\]/))) {
      flush();   // niente glueLeadIn: vedi nota nel ramo immagini.
      const fn = TABLE_FUNCS[m[1]];
      if (fn) elements.push(fn()); else console.warn('  [WARN] Tabella sconosciuta: ' + m[1]);
      i++; continue;
    }

    // Tabella markdown inline
    if (/^\|.+\|/.test(line)) {
      const rows = [];
      while (i < N && /^\s*\|.+\|/.test(L[i].trim())) { rows.push(L[i].trim()); i++; }
      const cells = (r) => r.replace(/^\s*\|/, '').replace(/\|\s*$/, '').split('|').map(c => c.trim());
      if (rows.length >= 2 && /^[\s|:-]+$/.test(rows[1]) && rows[1].includes('-')) {
        flush();   // niente glueLeadIn: vedi nota nel ramo immagini.
        const headers = cells(rows[0]).map(c => inlineText(c));
        const data = rows.slice(2).map(r => cells(r).map(c => {
          const b = c.match(/^\*\*(.+)\*\*$/);
          return b ? { text: inlineText(b[1]), bold: true } : inlineText(c);
        }));
        // Aggancia l'ultima riga al paragrafo seguente solo se e' la didascalia della tabella.
        const cap = peekNonBlank(i);
        const capTxt = cap < N ? splitTag(L[cap].trim()) : null;
        const nextIsCaption = !!capTxt && (capTxt.tag === 'caption' || /^\*.+\*$/.test(capTxt.text));
        elements.push(makeTable(headers, data, undefined, { keepWithNext: nextIsCaption }));
      } else { for (const r of rows) buf.push(r); }
      continue;
    }

    // Blockquote -> infoBox
    if (/^>\s?/.test(line)) {
      flush(); glueLeadIn(['body', 'bullet']);
      const bq = [];
      while (i < N && /^\s*>\s?/.test(L[i])) { bq.push(L[i].replace(/^\s*>\s?/, '')); i++; }
      const j = peekNonBlank(i);
      if (j < N && /^_\(infoBox\)_$/.test(L[j].trim())) i = j + 1;
      let txt = splitTag(bq.join(' ').trim()).text;
      let label = null;
      const lm = txt.match(/^\*\*(.+?)\*\*\s*:?\s*([\s\S]*)$/);
      if (lm) { label = lm[1].trim() + ':'; txt = lm[2].trim(); }
      elements.push(infoBox(label, inlineText(txt)));
      continue;
    }

    // Codice fenced ```
    if (/^```/.test(line)) {
      flush(); glueLeadIn(['body', 'bullet']); i++;
      const code = [];
      while (i < N && !/^```/.test(L[i].trim())) { code.push(L[i]); i++; }
      i++;
      elements.push(...codeBlock(code.length ? code : ['']));
      continue;
    }

    // Elenco puntato/numerato (eventualmente indentato)
    if ((m = raw.match(/^(\s*)([-*]|\d+\.)\s+(.+)$/))) {
      flush();
      glueLeadIn(['body']);   // un body introduttivo si aggancia al primo bullet (non bullet-a-bullet)
      const level = m[1].length >= 2 ? 1 : 0;
      let t = inlineText(splitTag(m[3]).text);
      if (/^\d+\.$/.test(m[2])) t = m[2] + ' ' + t;   // mantiene la numerazione
      elements.push(bullet(t, level));
      leadIn = { idx: elements.length - 1, kind: 'bullet', make: () => bullet(t, level, { keepNext: true }) };
      i++; continue;
    }

    // Blocco di codice indentato (>=4 spazi, non elenco)
    if (/^ {4,}\S/.test(raw)) {
      flush(); glueLeadIn(['body', 'bullet']);
      const code = [];
      while (i < N && (/^ {4,}\S/.test(L[i]) || (L[i].trim() === '' && i + 1 < N && /^ {4,}\S/.test(L[i + 1])))) {
        code.push(L[i]); i++;
      }
      const indents = code.filter(l => l.trim() !== '').map(l => l.match(/^ */)[0].length);
      const min = indents.length ? Math.min(...indents) : 0;
      const stripped = code.map(l => l.slice(min));
      while (stripped.length && stripped[stripped.length - 1].trim() === '') stripped.pop();
      elements.push(...codeBlock(stripped));
      continue;
    }

    // stepTitle / caption (per marker) o testo normale
    const st = splitTag(line);
    if (st.tag === 'stepTitle') { flush(); elements.push(stepTitle(inlineText(stripStars(st.text)))); i++; continue; }
    if (st.tag === 'caption')   { flush(); elements.push(caption(inlineText(stripStars(st.text)))); i++; continue; }
    buf.push(st.text);
    i++;
  }
  flush();

  return { title, headings, elements, titleBk, modNum };
}

// ─── SOMMARIO (generato dalle intestazioni dei moduli) ────────────────────────
function buildSommario() {
  // Campo TOC nativo di Word: raccoglie le intestazioni tramite i livelli di struttura
  // (outlineLevel 0/1/2 -> livelli 1/2/3) e genera voci, numeri di pagina, dot leader e
  // hyperlink. Word lo compila all'apertura (updateFields) o con F9 / "Aggiorna campo".
  return [
    new Paragraph({ pageBreakBefore:true, spacing:noSpacing, children:[new TextRun('')] }),
    tocTitle(),
    new TableOfContents('Sommario', {
      hyperlink: true,
      headingStyleRange: '1-3',
      useAppliedParagraphOutlineLevel: true,
    }),
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

const MODULI_LABELS = {
  1: 'Modulo 1 — Prerequisiti', 2: 'Modulo 2 — Identita\' e Governance', 3: 'Modulo 3 — Reti Virtuali',
  4: 'Modulo 4 — Archiviazione', 5: 'Modulo 5 — Calcolo', 6: 'Modulo 6 — Monitoraggio e Backup',
};

async function main() {
  const { mode, n } = parseArgs();
  const modeLabel = mode === 'full' ? 'documento completo'
                  : mode === 'toc'  ? 'solo sommario'
                  : `solo ${MODULI_LABELS[n]}`;
  console.log(`Costruzione AZ-104 — ${modeLabel}...`);

  // Parsifica tutti i moduli (servono per il Sommario completo in ogni modalita')
  const parsed = {};
  for (let m = 1; m <= 6; m++) {
    const p = path.join(ROOT, 'chapters', `MODULE_${m}.md`);
    if (fs.existsSync(p)) {
      try { parsed[m] = parseModule(fs.readFileSync(p, 'utf8'), m); }
      catch (e) { console.error(`  [ERRORE] parsing MODULE_${m}.md: ${e.message}`); parsed[m] = null; }
    } else { parsed[m] = null; }
  }
  const tocModules = [];
  for (let m = 1; m <= 6; m++) if (parsed[m]) tocModules.push(parsed[m]);

  if (mode === 'module' && !parsed[n]) { console.error(`MODULE_${n}.md non trovato o non parsabile`); process.exit(1); }

  // Sezione 1: copertina + sommario (campo TOC nativo; senza numero di pagina nel footer).
  const frontMatter = [...coverPage(), ...buildSommario()];

  // Sezione 2: contenuto dei moduli. Interruzione di pagina tra un modulo e l'altro;
  // il primo modulo sfrutta gia' lo stacco di sezione (niente pagina bianca).
  const content = [];
  if (mode === 'module') {
    content.push(...parsed[n].elements);
  } else if (mode === 'full') {
    let first = true;
    for (let m = 1; m <= 6; m++) if (parsed[m]) {
      if (!first) content.push(new Paragraph({ spacing:noSpacing, children:[new PageBreak()] }));
      content.push(...parsed[m].elements);
      first = false;
    }
  }

  // margini sup/inf a 1008 twip (0,7"): piu' altezza utile -> le figure entrano piu' spesso.
  const pageProps = { size:{width:11906,height:16838}, margin:{top:1008,right:1440,bottom:1008,left:1440} };
  const pageFooter = new Footer({ children:[ new Paragraph({ alignment:AlignmentType.CENTER, spacing:noSpacing,
    children:[ new TextRun({ children:[PageNumber.CURRENT], font:'Calibri', size:18, color:C.caption }) ] }) ] });

  const sections = [ { properties:{ page:pageProps }, children:frontMatter } ];
  if (content.length) {
    sections.push({
      properties:{ page:{ ...pageProps, pageNumbers:{ start:1, formatType:NumberFormat.DECIMAL } } },
      footers:{ default:pageFooter },
      children:content,
    });
  }

  const doc = new Document({
    features: { updateFields: true },   // Word aggiorna il Sommario (campo TOC) all'apertura
    styles: {
      default: { document: { run: { font:'Calibri', size:22, color:C.bodyText } } },
      // Stili applicati da Word alle voci del Sommario generato (livelli 1/2/3 = TOC1/2/3).
      paragraphStyles: [
        { id:'TOC1', name:'toc 1', basedOn:'Normal', next:'Normal',
          run:{ font:'Calibri', size:24, bold:true, color:C.titleBlue },
          paragraph:{ spacing:{before:120,after:40}, tabStops:[{type:TabStopType.RIGHT, position:9000, leader:'dot'}] } },
        { id:'TOC2', name:'toc 2', basedOn:'Normal', next:'Normal',
          run:{ font:'Calibri', size:22, bold:true, color:C.sectionBlue },
          paragraph:{ spacing:{before:60,after:20}, indent:{left:360}, tabStops:[{type:TabStopType.RIGHT, position:9000, leader:'dot'}] } },
        { id:'TOC3', name:'toc 3', basedOn:'Normal', next:'Normal',
          run:{ font:'Calibri', size:20, color:C.tocEntry },
          paragraph:{ spacing:{before:20,after:20}, indent:{left:720}, tabStops:[{type:TabStopType.RIGHT, position:9000, leader:'dot'}] } },
      ],
    },
    numbering: { config: [{ reference:'bullets', levels:[
      {level:0, format:LevelFormat.BULLET, text:'•', alignment:AlignmentType.LEFT,
       style:{paragraph:{indent:{left:360,hanging:180}}}},
      {level:1, format:LevelFormat.BULLET, text:'◦', alignment:AlignmentType.LEFT,
       style:{paragraph:{indent:{left:720,hanging:180}}}},
    ]}] },
    sections,
  });

  const buffer = await Packer.toBuffer(doc);
  const outName = outputPath(mode, n);
  const outPath = path.join(ROOT, outName);   // output sempre nella radice del repo
  fs.writeFileSync(outPath, buffer);
  console.log('Documento salvato: ' + outName);
  console.log('Dimensione: ' + (buffer.length/1024).toFixed(1) + ' KB');
}

if (require.main === module) main().catch(console.error);
else module.exports = { parseModule, buildSommario, parseArgs };
