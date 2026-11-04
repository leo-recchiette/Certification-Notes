'use strict';

/**
 * Tabelle generate da codice, riferite nei .md come [TABELLA: nomeFunzione].
 *
 * Sono le poche tabelle di AZ-104 che non sono espresse in Markdown inline. Ogni
 * funzione riceve il contesto di resa iniettato dal motore ({ makeTable, ... }) e
 * non importa nulla: cosi' non si crea un accoppiamento (ne' un ciclo) fra questo
 * file e il motore.
 *
 * Le larghezze delle colonne non sono piu' indicate a mano: le calcola
 * tableWidths() in base al contenuto, come per ogni altra tabella del documento.
 *
 * Per aggiungerne una: scrivi la funzione, esportala qui, riferiscila dal .md.
 * Tutto il resto deve essere una normale tabella Markdown.
 */

module.exports = {
  toolsTable: ({ makeTable }) => makeTable(['Strumento', 'Descrizione'], [
    ['Azure CLI', 'Interfaccia a riga di comando multipiattaforma per gestire risorse Azure tramite comandi az.'],
    ['Azure PowerShell (Az module)', 'Modulo PowerShell con cmdlet per gestire risorse Azure (New-Az*, Get-Az*, Set-Az*, Remove-Az*).'],
    ['kubectl', 'Strumento CLI per gestire cluster Kubernetes, inclusi quelli su Azure Kubernetes Service (AKS).'],
    ['Terraform', 'Strumento IaC open-source di HashiCorp per definire e distribuire infrastruttura in modo dichiarativo.'],
    ['git', 'Sistema di controllo versione distribuito, preinstallato per gestire template e script.'],
    ['Editors (vim, nano, code)', 'Editor di testo e VS Code Server per modificare file direttamente nella sessione Cloud Shell.'],
  ]),

  armStructureTable: ({ makeTable }) => makeTable(['Elemento', 'Obbligatorio', 'Descrizione'], [
    ['$schema', { text: 'Si\'', bold: true }, 'URL dello schema JSON che descrive la versione del linguaggio del template.'],
    ['contentVersion', { text: 'Si\'', bold: true }, 'Versione del template (es. 1.0.0.0). Non viene usata da Azure, ma utile per il versioning interno.'],
    ['parameters', 'No', 'Valori passati dall\'esterno al momento della distribuzione per personalizzare il template.'],
    ['variables', 'No', 'Valori calcolati una volta e riusati nel template per evitare ripetizioni.'],
    ['functions', 'No', 'Funzioni ARM personalizzate definite dall\'utente (user-defined functions).'],
    ['resources', { text: 'Si\'', bold: true }, 'Le risorse Azure da distribuire o aggiornare (VM, storage, rete, ecc.).'],
    ['outputs', 'No', 'Valori restituiti al termine della distribuzione (endpoint, ID risorse, chiavi, ecc.).'],
  ]),

  reservedTable: ({ makeTable }) => makeTable(['Indirizzo', 'Motivo della riserva'], [
    ['192.168.1.0', 'Indirizzo di rete (network address).'],
    ['192.168.1.1', 'Gateway predefinito di Azure.'],
    ['192.168.1.2', 'DNS di Azure mappato allo spazio di indirizzi virtuale.'],
    ['192.168.1.3', 'DNS di Azure mappato allo spazio di indirizzi virtuale (secondo DNS).'],
    ['192.168.1.255', 'Indirizzo di broadcast della subnet.'],
  ]),

  publicIpAssocTable: ({ makeTable }) => makeTable(['Tipo di risorsa', 'Come associare l\'IP pubblico'], [
    ['Macchina virtuale (VM)', 'Configurazione della NIC (scheda di rete) della VM.'],
    ['Load Balancer', 'Configurazione del front-end del load balancer.'],
    ['Gateway VPN', 'Configurazione del gateway.'],
    ['Gateway applicazione', 'Configurazione del front-end del gateway applicazione.'],
    ['Firewall di Azure', 'Configurazione del firewall.'],
    ['NAT Gateway', 'Configurazione del NAT Gateway.'],
  ]),

  publicIpSkuTable: ({ makeTable }) => makeTable(['Funzionalita\'', 'Descrizione'], [
    ['Zona di disponibilita\'', 'Ridondante per zona per impostazione predefinita.'],
    ['Routing', 'Supporta preferenza routing: rete Microsoft (default) o Internet.'],
    ['Indirizzi IPv4 e IPv6', 'Supporta entrambi i protocolli con dual-stack.'],
    ['Assegnazione', 'Solo statica. L\'IP viene assegnato al momento della creazione della risorsa IP pubblica.'],
    ['Sicurezza', 'Richiede NSG esplicito — secure by default (tutto negato finche\' non autorizzato).'],
    ['Tier globale', 'Supporta indirizzi IP globali per load balancer interregionali.'],
  ]),

  privateIpTable: ({ makeTable }) => makeTable(['Risorsa', 'Punto di assegnazione', 'Metodi'], [
    ['Macchina virtuale (VM)', 'Configurazione IP della NIC', 'Dinamico o Statico'],
    ['Load balancer interno', 'Configurazione front-end', 'Dinamico o Statico'],
    ['Gateway applicazione', 'Configurazione front-end', 'Dinamico o Statico'],
  ]),

  nsgRuleSettingsTable: ({ makeTable }) => makeTable(['Impostazione', 'Descrizione'], [
    ['Nome', 'Identificatore univoco della regola nell\'NSG (max 80 caratteri).'],
    ['Priorita\'', 'Numero tra 100 e 4096. Piu\' basso = maggiore precedenza.'],
    ['Porta', 'Porta singola (80), intervallo (8080-8090) o wildcard (*).'],
    ['Protocollo', 'TCP, UDP, ICMP, ESP, AH o Any.'],
    ['Direzione', 'Inbound (in entrata) o Outbound (in uscita).'],
    ['Origine', 'IP, CIDR, tag di servizio o ASG da cui proviene il traffico.'],
    ['Destinazione', 'IP, CIDR, tag di servizio o ASG verso cui e\' diretto il traffico.'],
    ['Azione', 'Allow (consenti) o Deny (nega).'],
  ]),
};
