# Modulo 5 — Distribuire e gestire risorse di calcolo di Azure

_Questo percorso copre le principali risorse di calcolo in Azure, dalla gestione delle macchine virtuali alle soluzioni PaaS di App Service fino ai container. Un amministratore deve saper scegliere e configurare la risorsa di calcolo più adatta a ciascun carico di lavoro, bilanciando controllo, scalabilità, costi e semplicità operativa._

**Immagini usate in questo modulo:**
- `img/3-create-new-resource.png` (1804×778) — Figura 88
- `img/3-notifications.png` (357×241) — Figura 89
- `img/3-public-ip-address.png` (1279×573) — Figura 90
- `img/4-automation-script.png` (474×296) — Figura 91
- `img/4-auto-shutdown-option.png` (1114×418) — Figura 92
- `img/6-backup-server.png` (515×346) — Figura 93
- `img/update-fault-domains-c1ceee00.png` (578×312) — Figura 94
- `img/vertical-scaling-cdafa792.png` (304×167) — Figura 95
- `img/horizontal-scaling-3e457e75.png` (342×187) — Figura 96
- `img/implement-scale-sets-61516afb.png` (831×592) — Figura 97
- `img/autoscale-45b054e0.png` (751×219) — Figura 98
- `img/scale-methods.png` (651×252) — Figura 99
- `img/implement-autoscale-74d25345.png` (551×648) — Figura 100
- `img/web-app-autoscale-94c4da54.png` (1081×487) — Figura 101
- `img/web-app-configuration-27facdc5.png` (881×471) — Figura 102
- `img/continuous-development-a0dfd350.png` (582×260) — Figura 103
- `img/deployment-center.png` (926×442) — Figura 104
- `img/deployment-slots-5b3660cc.png` (570×302) — Figura 105
- `img/custom-domain.png` (557×661) — Figura 106
- `img/open-backups-page.png` (982×582) — Figura 107
- `img/app-insights-16629887.png` (1379×734) — Figura 108
- `img/container-overview-0e72c2ba.png` (358×424) — Figura 109
- `img/container-groups-ea19ee6b.png` (763×354) — Figura 110

---

## 5.1 — Introduzione alle macchine virtuali di Azure

### 5.1.1 — Introduzione

Immagina di lavorare per un'azienda di ricerca medica e di essere responsabile della gestione dei server on-premises. Questi server eseguono tutta l'infrastruttura aziendale, dai web server ai database, ma l'hardware sta invecchiando e fatica a sostenere le nuove applicazioni di analisi dati. Aggiornare tutto l'hardware fisico non è la soluzione ideale: i server sono distribuiti in tutto il mondo con personale ridotto in ogni sede, il software personalizzato gira su versioni e configurazioni eterogenee di Windows e Linux difficili da replicare, e la rapida crescita del business richiede una capacità di scalare che l'acquisto di hardware tradizionale non garantisce in modo flessibile. Per questi motivi conviene esplorare il cloud, spostando i server uno alla volta in Azure tramite **Azure Virtual Machines** (VM).

Le VM di Azure sono una delle diverse risorse di calcolo scalabili e on-demand offerte dalla piattaforma: danno controllo completo sulla configurazione, permettono di installare qualsiasi software necessario ed eliminano l'esigenza di acquistare hardware fisico per scalare o estendere il datacenter. In questa sezione imparerai a compilare una checklist delle decisioni da prendere prima di creare una macchina virtuale, a conoscere le opzioni per crearle e gestirle, e a scoprire i servizi aggiuntivi che Azure mette a disposizione per monitorare, proteggere e amministrare le VM, inclusi gli aggiornamenti e le patch del sistema operativo.

### 5.1.2 — Stilare una checklist per creare una macchina virtuale

Migrare i server on-premises verso Azure non è un'operazione da improvvisare: richiede pianificazione e attenzione. Puoi spostare tutti i server in un'unica volta oppure, scelta più prudente, procedere a piccoli lotti o addirittura un server alla volta. Il punto chiave è che, prima ancora di creare una singola VM, conviene fermarsi a disegnare il modello dell'infrastruttura attuale e ragionare su come questa si traduce nel cloud. È un investimento iniziale di tempo che evita errori difficili e costosi da correggere più avanti.

**Che cos'è una risorsa di Azure** _(stepTitle)_

Una **risorsa di Azure** è un elemento gestibile all'interno di Azure. Esattamente come un computer fisico nel tuo datacenter, una VM non vive da sola: ha bisogno di diversi componenti per svolgere il proprio lavoro. Gli elementi tipici sono:

- La VM in sé
- I dischi per l'archiviazione
- Una rete virtuale (virtual network)
- Un'interfaccia di rete per comunicare sulla rete
- Un gruppo di sicurezza di rete (Network Security Group, NSG) per proteggere il traffico
- Un indirizzo IP (pubblico, privato o entrambi)

Azure crea automaticamente tutte queste risorse quando servono, oppure puoi fornire risorse già esistenti durante la fase di distribuzione. Ogni risorsa ha bisogno di un nome che la identifichi. Ed ecco un dettaglio importante: se è Azure a creare la risorsa, ne genera il nome a partire dal nome della VM. Questo è un ottimo motivo per essere coerenti nella scelta dei nomi delle macchine virtuali, perché quel nome si propaga a tutto il resto.

**Le risorse necessarie per le VM IaaS** _(stepTitle)_

Ragioniamo per punti, come una vera e propria checklist mentale da percorrere prima di ogni distribuzione:

- La rete
- Il nome della VM
- La località (region)
- La dimensione (size) della VM
- I dischi
- Il sistema operativo

**La rete** _(stepTitle)_

La prima cosa a cui pensare non è affatto la macchina virtuale: è la rete. Questo è controintuitivo per chi è abituato a partire dal server, ma è esattamente il punto. Osserva uno dei tuoi server on-premises e poniti due domande:

- Con cosa comunica il server?
- Quali porte sono aperte?

Le reti virtuali (VNet) in Azure forniscono connettività privata tra le macchine virtuali e gli altri servizi Azure. VM e servizi che appartengono alla stessa rete virtuale possono comunicare tra loro. Per impostazione predefinita, invece, i servizi esterni alla rete virtuale non possono connettersi ai servizi interni. Puoi comunque configurare la rete per consentire l'accesso a servizi esterni, inclusi i tuoi server on-premises.

Proprio quest'ultimo aspetto è il motivo per cui vale la pena dedicare tempo alla configurazione di rete. Indirizzi e subnet non sono banali da modificare una volta che sono in produzione. Se prevedi di collegare la rete aziendale privata ai servizi Azure, devi ragionare con attenzione sulla topologia prima di mettere in campo le VM.

Quando configuri una rete virtuale, specifichi gli spazi di indirizzi disponibili, le subnet e la sicurezza. Se la VNet è connessa ad altre VNet, devi selezionare intervalli di indirizzi che non si sovrappongano. Questo è l'intervallo di indirizzi privati che le VM e i servizi della tua rete possono usare. Puoi usare indirizzi IP non instradabili come `10.0.0.0/8`, `172.16.0.0/12` o `192.168.0.0/16`, oppure definire un intervallo personalizzato. Azure considera qualsiasi intervallo come parte dello spazio di indirizzamento IP privato della VNet se è raggiungibile solo all'interno della VNet, all'interno di VNet interconnesse e dalla tua sede on-premises. Se la gestione delle reti interne è responsabilità di un'altra persona, coordinati con lei prima di scegliere lo spazio di indirizzamento per evitare sovrapposizioni: comunica quale spazio intendi usare, così non rischierà di assegnare lo stesso intervallo di indirizzi IP.

**Segmentare la rete** _(stepTitle)_

Dopo aver deciso gli spazi di indirizzi della rete virtuale, puoi creare una o più subnet. Le subnet servono a spezzare la rete in sezioni più gestibili. Per esempio, potresti assegnare `10.1.0.0` alle VM, `10.2.0.0` ai servizi di back-end e `10.3.0.0` alle VM con SQL Server. Questa suddivisione logica rende la rete più ordinata e più semplice da governare.

> **Nota**: Azure riserva a sé i primi quattro indirizzi e l'ultimo indirizzo di ogni subnet. Tienine conto quando dimensioni gli intervalli.
_(infoBox)_

**Mettere in sicurezza la rete** _(stepTitle)_

Per impostazione predefinita non esiste alcun confine di sicurezza tra le subnet, quindi i servizi di ciascuna subnet possono dialogare liberamente tra loro. Puoi però configurare i gruppi di sicurezza di rete (Network Security Group, NSG), che ti permettono di controllare il flusso di traffico da e verso le subnet e da e verso le VM. Gli NSG agiscono come firewall software, applicando regole personalizzate a ogni richiesta in ingresso o in uscita, sia a livello di interfaccia di rete sia a livello di subnet. In questo modo hai pieno controllo su ogni richiesta di rete che entra o esce dalla VM.

**Pianificare ogni distribuzione di VM** _(stepTitle)_

Una volta mappati requisiti di comunicazione e di rete, puoi iniziare a ragionare sulle VM da creare. Un buon metodo è selezionare un server e farne l'inventario, rispondendo a queste domande:

- Quale sistema operativo viene usato?
- Quanto spazio su disco è effettivamente occupato?
- Che tipo di dati gestisce? Esistono vincoli (legali o di altro tipo) su come vengono archiviati o su dove devono risiedere fisicamente?
- Che carico di CPU, memoria e I/O su disco ha il server? È previsto traffico a picchi (burst) di cui tenere conto?

Con queste risposte in mano puoi iniziare a rispondere alle domande che Azure pone quando crei una nuova macchina virtuale.

**Il nome della VM** _(stepTitle)_

Il nome della VM viene usato come nome del computer, impostato come parte del sistema operativo. Puoi specificare un nome fino a 64 caratteri su una VM Linux e fino a 15 caratteri su una VM Windows.

Questo nome identifica anche una **risorsa di Azure** gestibile, e cambiarlo in seguito non è banale. Per questo conviene scegliere nomi significativi e coerenti, così da capire a colpo d'occhio cosa fa ciascuna VM. Una buona convenzione è includere nel nome le seguenti informazioni:

| **Elemento** | **Esempio** | **Note** |
| --- | --- | --- |
| **Ambiente** | dev, prod, QA | Identifica l'ambiente della risorsa |
| **Località** | `eus` per East US, `jw` per Japan West | Identifica la region in cui la risorsa è distribuita |
| **Istanza** | 01, 02 | Per risorse che hanno più istanze con lo stesso nome (es. web server) |
| **Prodotto o servizio** | service | Identifica il prodotto, l'applicazione o il servizio supportato |
| **Ruolo** | sql, web, messaging | Identifica il ruolo della risorsa associata |

Per esempio, `deveus-webvm01` potrebbe rappresentare il primo web server di sviluppo ospitato nella località East US.

**Scegliere la località della VM** _(stepTitle)_

Azure dispone di datacenter in tutto il mondo, pieni di server e dischi. Questi datacenter sono raggruppati in *region* geografiche ('West US', 'North Europe', 'Southeast Asia', ecc.) per fornire ridondanza e disponibilità.

Quando crei e distribuisci una macchina virtuale, devi selezionare la region in cui allocare le risorse. Conviene posizionare le VM il più vicino possibile ai tuoi utenti, sia per migliorare le prestazioni sia per soddisfare eventuali requisiti legali, di conformità o fiscali.

Ci sono altri due aspetti da considerare nella scelta della località. Primo: la località può limitare le opzioni disponibili, perché ogni region dispone di hardware diverso e alcune configurazioni non sono disponibili ovunque. Secondo: esistono differenze di prezzo tra le località. Se il tuo carico di lavoro non è vincolato a una località specifica, può rivelarsi molto conveniente verificare la configurazione richiesta in più region per individuare il prezzo più basso.

**Determinare la dimensione della VM** _(stepTitle)_

Definiti nome e località, devi decidere la dimensione (size) della VM. Invece di specificare separatamente potenza di calcolo, memoria e capacità di archiviazione, Azure fornisce diverse *dimensioni di VM* che combinano questi elementi in proporzioni differenti. La gamma è ampia, così puoi scegliere il mix più adatto di calcolo, memoria e archiviazione per ciò che devi fare.

Il modo migliore per individuare la dimensione corretta è partire dal tipo di carico di lavoro che la VM deve eseguire. In base al carico, scegli un sottoinsieme delle dimensioni disponibili. Su Azure le opzioni di carico di lavoro sono classificate così:

| **Opzione** | **Descrizione** |
| --- | --- |
| **General purpose** | VM con rapporto bilanciato tra CPU e memoria. Ideali per test e sviluppo, database di piccole e medie dimensioni e web server a traffico medio-basso. |
| **Compute optimized** | VM con alto rapporto CPU-memoria. Adatte a web server a traffico medio, network appliance, processi batch e application server. |
| **Memory optimized** | VM con alto rapporto memoria-CPU. Ottime per server di database relazionali, cache di medie e grandi dimensioni e analisi in memoria. |
| **Storage optimized** | VM con elevato throughput e IO su disco. Ideali per VM che eseguono database. |
| **GPU** | VM specializzate per rendering grafico pesante e montaggio video. Ottime anche per il training e l'inferencing di modelli di deep learning. |
| **High performance compute** | Le VM con CPU più veloci e potenti, con interfacce di rete ad alto throughput opzionali. |

Quando configuri la dimensione della VM in Azure puoi filtrare per tipo di carico di lavoro. La dimensione scelta incide direttamente sul costo del servizio: più CPU, memoria e GPU servono, più alto è il prezzo.

**E se le mie esigenze di dimensione cambiano?** _(stepTitle)_

Azure permette di modificare la dimensione della VM quando quella attuale non è più adeguata. Puoi fare upgrade o downgrade della VM, a patto che la configurazione hardware corrente sia compatibile con la nuova dimensione. Questa flessibilità garantisce un approccio agile e scalabile alla gestione delle VM.

La dimensione può essere cambiata anche mentre la VM è in esecuzione, purché la nuova dimensione sia disponibile nel cluster hardware su cui la VM gira al momento. Il portale di Azure semplifica le cose mostrandoti solo le scelte effettivamente disponibili; gli strumenti da riga di comando, invece, restituiscono un errore se tenti di ridimensionare verso una dimensione non disponibile. Cambiare la dimensione di una VM in esecuzione ne comporta il riavvio automatico per completare la richiesta.

Se invece arresti e dealloca la VM, potrai poi selezionare qualsiasi dimensione disponibile nella tua region, perché la deallocazione rimuove la VM dal cluster su cui era in esecuzione.

> **Avviso**: presta attenzione nel ridimensionare le VM di produzione: verranno riavviate automaticamente, il che può causare un'interruzione temporanea e modificare alcune impostazioni di configurazione, come l'indirizzo IP.
_(infoBox)_

**Le parti di una VM e come vengono fatturate** _(stepTitle)_

Quando crei una macchina virtuale, crei anche le risorse che la supportano. Queste risorse hanno costi propri di cui tenere conto. La tabella seguente riepiloga le risorse predefinite a supporto di una VM e il relativo modello di addebito:

| **Risorsa** | **Descrizione** | **Costo** |
| --- | --- | --- |
| **Rete virtuale** | Consente alla VM di comunicare con altre risorse | Tariffato secondo il prezzo della Virtual Network |
| **Scheda di interfaccia di rete (NIC) virtuale** | Serve per connettersi alla rete virtuale | Nessun costo separato per le NIC. Esiste però un limite al numero di NIC utilizzabili in base alla dimensione della VM: dimensiona la VM di conseguenza. |
| **Indirizzo IP privato e, talvolta, pubblico** | Per la comunicazione e lo scambio di dati sulla tua rete e con reti esterne | Tariffato secondo il prezzo degli IP Address |
| **Gruppo di sicurezza di rete (NSG)** | Per gestire il traffico in entrata e in uscita dalla VM. Per esempio, potresti aprire la porta 22 per l'accesso SSH ma bloccare il traffico verso la porta 80: l'apertura e il blocco delle porte si gestiscono tramite l'NSG. | Nessun costo aggiuntivo per gli NSG in Azure. |
| **Disco del sistema operativo ed eventuali dischi dati separati** | È buona pratica tenere i dati su un disco separato da quello del sistema operativo: se una VM si guasta, basta scollegare il disco dati e collegarlo a una nuova VM. | Ogni VM ha un disco del sistema operativo e un disco locale. Azure non addebita l'archiviazione del disco locale. Il disco del sistema operativo (di solito 127 GiB, più piccolo per alcune immagini) è tariffato alla tariffa standard per i dischi. |
| **In alcuni casi, una licenza per il sistema operativo** | Affinché la VM possa eseguire il sistema operativo | Il costo varia in base al numero di core della VM: dimensiona la VM di conseguenza. Il costo può essere ridotto con l'**Azure Hybrid Benefit**. |

**Capire il modello di pricing** _(stepTitle)_

Per ogni VM la sottoscrizione viene addebitata su due costi distinti: calcolo (compute) e archiviazione (storage). Separare questi due costi ti permette di scalarli in modo indipendente e di pagare solo ciò che ti serve.

**Costi di calcolo (compute)** — Le spese di calcolo sono quotate su base oraria ma fatturate al minuto. Per esempio, se la VM resta distribuita per 55 minuti, paghi solo 55 minuti di utilizzo. Non vieni addebitato per la capacità di calcolo se arresti e dealloca la VM, perché la deallocazione rilascia l'hardware. Il prezzo orario varia in base alla dimensione della VM e al sistema operativo scelto. Le istanze basate su Linux costano meno perché non c'è addebito per la licenza del sistema operativo; per Windows, invece, il costo della VM include l'addebito per il sistema operativo.

> **Suggerimento**: potresti risparmiare riutilizzando licenze esistenti tramite l'**Azure Hybrid Benefit**, disponibile sia per Linux sia per Windows.
_(infoBox)_

Per i costi di calcolo puoi scegliere tra due opzioni di pagamento:

| **Opzione** | **Descrizione** |
| --- | --- |
| **Pay as you go** | Con l'opzione **pay-as-you-go** paghi la capacità di calcolo al secondo, senza impegni a lungo termine né pagamenti anticipati. Puoi aumentare o diminuire la capacità su richiesta e avviare o arrestare in qualsiasi momento. È l'opzione adatta per applicazioni con carichi a breve termine o imprevedibili che non possono essere interrotti, per esempio un test rapido o lo sviluppo di un'app in una VM. |
| **Reserved Virtual Machine Instances** | L'opzione Reserved Virtual Machine Instances (RI) è un acquisto anticipato di una VM per uno o tre anni in una region specifica. L'impegno è preso in anticipo e, in cambio, ottieni un risparmio fino al 72% rispetto al pay-as-you-go. Le **RI** sono flessibili e possono essere scambiate o restituite con una penale di terminazione anticipata. Scegli questa opzione se la VM deve girare di continuo, oppure se hai bisogno di prevedibilità del budget **e** puoi impegnarti a usare la VM per almeno un anno. |

**Costi di archiviazione (storage)** — L'archiviazione utilizzata dalla VM viene addebitata separatamente. Lo stato della VM non ha alcuna relazione con gli addebiti di archiviazione: anche se la VM è arrestata/deallocata e non paghi per la VM in esecuzione, continui comunque a pagare per l'archiviazione usata dai dischi.

**L'archiviazione per la VM** _(stepTitle)_

Tutte le macchine virtuali di Azure hanno almeno due dischi rigidi virtuali (VHD). Il primo disco contiene il sistema operativo, il secondo viene usato come archiviazione temporanea. Per i dati delle applicazioni dovresti aggiungere ulteriori dischi dati. Separare i dati su dischi distinti ti permette di gestirli in modo indipendente. La dimensione della VM determina il numero massimo di dischi dati collegabili, in genere due per ogni vCPU.

Esistono cinque tipi di disco, ciascuno pensato per uno scenario specifico:

- Ultra disk
- Premium SSD v2 (preview)
- Premium SSD (unità a stato solido)
- Standard SSD
- Standard HDD (unità a disco rigido)

La tabella seguente confronta i cinque tipi di disco per aiutarti a scegliere quello giusto:

| **-** | **Ultra disk** | **Premium SSD v2** | **Premium SSD** | **Standard SSD** | **Standard HDD** |
| --- | --- | --- | --- | --- | --- |
| **Tipo di disco** | SSD | SSD | SSD | SSD | HDD |
| **Scenario** | Carichi a uso intensivo di IO come SAP HANA, database di fascia alta (es. SQL, Oracle) e altri carichi a forte componente transazionale | Carichi di produzione e sensibili alle prestazioni che richiedono in modo costante bassa latenza e elevati IOPS e throughput | Carichi di produzione e sensibili alle prestazioni | Web server, applicazioni aziendali a uso leggero e dev/test | Backup, dati non critici, accesso poco frequente |
| **Dimensione max disco** | 65.536 GiB | 65.536 GiB | 32.767 GiB | 32.767 GiB | 32.767 GiB |
| **Throughput max** | 4.000 MB/s | 1.200 MB/s | 900 MB/s | 750 MB/s | 500 MB/s |
| **IOPS max** | 160.000 | 80.000 | 20.000 | 6.000 | 2.000 |
| **Usabile come disco del SO?** | No | No | Sì | Sì | Sì |

**Selezionare un sistema operativo** _(stepTitle)_

Azure mette a disposizione varie immagini di sistema operativo da installare nella VM, incluse molte distribuzioni Linux. La scelta del sistema operativo può influenzare il prezzo orario di calcolo, perché Azure include il costo della licenza del sistema operativo nel prezzo.

Se ti serve più della semplice immagine di base, puoi cercare nell'Azure Marketplace immagini più complete che includono il sistema operativo e gli strumenti software più diffusi per scenari specifici. Per esempio, per un nuovo sito WordPress lo stack tecnologico standard sarebbe composto da un server Linux, dal web server Apache, da un database MySQL e da PHP. Invece di installare e configurare ogni componente, puoi usare un'immagine del Marketplace e installare l'intero stack in un colpo solo.

Infine, se non trovi un'immagine di sistema operativo adatta, puoi crearne una tua con ciò che ti serve e usarla per generare le VM. Puoi creare singole immagini per sviluppo e test, oppure creare un **Azure Compute Gallery** per gestire più immagini e replicarle nelle region in cui sono necessarie.

### 5.1.3 — Creare una macchina virtuale con il portale di Azure

Esistono diversi modi per creare una macchina virtuale in Azure: il portale web, gli strumenti da riga di comando (disponibili per Linux, macOS e Windows) o i template di automazione. La scelta dipende soprattutto dall'ambiente con cui ci si trova più a proprio agio. Tra tutte le opzioni, il **Azure portal** è in genere il punto di partenza più immediato, perché offre un'interfaccia grafica guidata che non richiede di memorizzare alcun comando.

**Perché iniziare dal portale** _(stepTitle)_

Il **Azure portal** è un'interfaccia basata su browser che consente di creare e gestire tutte le risorse di Azure tramite procedure guidate (wizard). È utile non solo per operare, ma anche per imparare: permette di esplorare tutte le opzioni disponibili e di capire quali parametri influenzano il comportamento e il costo di una risorsa. Quando si crea una VM, il portale raccoglie le informazioni in più schede (tab) e, solo alla fine, esegue il deployment effettivo delle risorse.

Immaginiamo, come esempio, di voler creare una macchina virtuale che ospiterà un server web su Ubuntu. La procedura non è complessa, ma è bene tenere presente che, oltre alla VM in sé, occorrerà più avanti installare e configurare il sistema operativo, predisporre il sito, eventualmente installare un database e gestire aspetti come il firewall. Per ora ci concentriamo solo sulla creazione della macchina.

> **Nota**: prima di iniziare serve un gruppo di risorse (Resource group). Si può usare un gruppo già esistente oppure crearne uno nuovo dedicato. Creare un gruppo dedicato rende molto più semplice, in seguito, eliminare in un colpo solo tutte le risorse collegate.
_(infoBox)_

**Passo 1 — Avviare la creazione della risorsa** _(stepTitle)_

Per prima cosa si accede al [portale di Azure](https://portal.azure.com/) con le proprie credenziali. Nella home page, sotto la sezione **Azure services**, si seleziona **Create a resource**. Si apre il pannello «Create a resource», che mostra i prodotti più usati. Poiché vogliamo una macchina virtuale, si seleziona **Virtual machine**: si apre così il pannello «Create virtual machine», organizzato in più schede.

![Pagina Crea una risorsa](img/3-create-new-resource.png) _(dimensioni: 1804×778 px)_
*Figura 88: La pagina «Create a resource» del portale di Azure, da cui si avvia la creazione di una nuova risorsa.* _(caption)_

**Passo 2 — Compilare la scheda Basics** _(stepTitle)_

La scheda **Basics** raccoglie i parametri fondamentali della VM. È la parte più importante della procedura, perché qui si decidono identità, posizione, sistema operativo e dimensione della macchina. Anche se alcuni termini non fossero ancora del tutto chiari, è utile capire fin da subito a cosa serve ciascun campo. La tabella seguente riassume i valori di esempio per creare una VM Ubuntu.

| **Impostazione** | **Valore di esempio** | **A cosa serve** |
|---|---|---|
| **Subscription** | La propria sottoscrizione | Determina chi paga le risorse e dove vengono fatturate. |
| **Resource group** | Il gruppo di risorse (es. *myResourceGroupName*) | Contenitore logico che raggruppa le risorse correlate. |
| **Virtual machine name** | *test-ubuntu-cus-vm* | Nome univoco con cui identificare la VM nel gruppo. |
| **Region** | Una località geografica vicina | Data center in cui viene ospitata la VM; influenza latenza e costi. |
| **Availability options** | No infrastructure redundancy required | Livello di ridondanza per l'alta disponibilità. |
| **Security type** | Standard | Profilo di sicurezza dell'avvio della macchina. |
| **Image** | Ubuntu Server 24.04 LTS - Gen2 | Il sistema operativo preinstallato (qui Linux; in alternativa, ad es. Windows Server). |
| **VM architecture** | x64 | Architettura del processore. |
| **Size** | Standard D2s V3 | Dimensione della VM, ovvero CPU e memoria assegnate; incide direttamente sul costo. |

**Passo 3 — Account amministratore e porte in ingresso** _(stepTitle)_

Sempre nella scheda **Basics**, più in basso, si configura l'**account amministratore**, cioè le credenziali con cui ci si collegherà alla macchina. Su Linux si sceglie tipicamente l'autenticazione tramite chiave SSH, mentre su Windows si imposta una coppia username e password. Subito dopo si decidono le porte in ingresso (inbound port) da aprire, cioè il modo in cui si potrà raggiungere la VM da Internet.

| **Impostazione** | **Valore (esempio Linux)** | **Note** |
|---|---|---|
| **Authentication type** | SSH public key | Su Windows si userebbe invece Password. |
| **Username** | Un nome utente a scelta | È l'utente amministratore della VM. |
| **SSH public key source** | Generate a new key pair | Azure genera una nuova coppia di chiavi. |
| **Key pair name** | *test-ubuntu-cus-vm_key* | Nome con cui salvare la chiave privata. |
| **Public inbound ports** | Allow selected ports | Apre solo le porte selezionate, non tutte. |
| **Select inbound ports** | SSH (22) | Per Windows si selezionerebbe invece RDP (3389). |

> **Importante**: la porta determina il protocollo di accesso. Per una VM Linux si apre la porta SSH (22), per una VM Windows la porta RDP (3389). Aprire solo le porte strettamente necessarie è una buona pratica di sicurezza.
_(infoBox)_

**Passo 4 — Le altre schede (Disks, Networking, Management)** _(stepTitle)_

Oltre a **Basics**, il wizard offre altre schede che è possibile esplorare per affinare la configurazione. Per una prima VM si possono lasciare i valori predefiniti, ma è bene sapere a cosa servono:

- **Disks**: definisce i dischi della VM, in particolare il disco del sistema operativo e gli eventuali dischi dati aggiuntivi, scegliendone il tipo (ad esempio SSD standard o premium).
- **Networking**: gestisce la rete virtuale, la subnet, l'indirizzo IP pubblico e il gruppo di sicurezza di rete (NSG) che filtra il traffico in ingresso e in uscita.
- **Management**: raccoglie funzionalità operative come il monitoraggio, gli aggiornamenti automatici e i backup.

**Passo 5 — Review + create e deployment** _(stepTitle)_

Terminata l'esplorazione delle schede, si seleziona **Review + create** per rivedere e validare le impostazioni. Azure verifica la configurazione prima di creare la risorsa: se manca qualche informazione, viene segnalato un errore sulla scheda interessata, che basterà aprire e completare. Quando tutti i controlli sono superati, si seleziona **Create** per avviare il deployment.

Se in precedenza si è scelta l'autenticazione tramite chiave SSH, si apre la finestra «Generate new key pair»: occorre selezionare **Download private key and create resource** per scaricare la chiave privata (indispensabile per connettersi in seguito) e avviare la creazione.

L'avanzamento del deployment si può seguire dal riquadro **Deployment details** della pagina **Overview**, oppure dal pannello **Notifications**. L'icona delle notifiche, in alto a destra nella barra degli strumenti, mostra o nasconde questo pannello. La creazione richiede in genere alcuni minuti, al termine dei quali una notifica conferma che il deployment è andato a buon fine.

![Icona e pannello delle notifiche](img/3-notifications.png) _(dimensioni: 357×241 px)_
*Figura 89: L'icona delle notifiche nella barra degli strumenti e una parte del pannello delle notifiche durante il deployment.* _(caption)_

**Passo 6 — Aprire la risorsa e trovare l'IP pubblico** _(stepTitle)_

Completato il deployment, si seleziona **Go to resource** per aprire la pagina **Overview** della VM appena creata. Qui sono raccolte tutte le informazioni e le opzioni di configurazione della macchina. Tra i dati riportati c'è l'**indirizzo IP pubblico** (Public IP address): è il punto di contatto da Internet e serve per stabilire la connessione alla VM.

![Indirizzo IP pubblico della VM](img/3-public-ip-address.png) _(dimensioni: 1279×573 px)_
*Figura 90: La sezione Essentials della VM con l'indirizzo IP pubblico evidenziato tra le proprietà.* _(caption)_

Una volta individuato l'indirizzo IP pubblico, ci si può connettere alla macchina. Avendo abilitato l'autenticazione tramite chiave SSH, sarà possibile collegarsi alla VM Linux usando un qualsiasi client SSH e l'IP pubblico, ad esempio così:

```
ssh -i test-ubuntu-cus-vm_key.pem nomeutente@<indirizzo-ip-pubblico>
```

Con pochi passaggi guidati, quindi, si è ottenuta una macchina virtuale Linux operativa, pronta per la configurazione successiva del server web. La stessa procedura, cambiando immagine e porta in ingresso (RDP al posto di SSH), consente di creare allo stesso modo una VM Windows.

### 5.1.4 — Opzioni per creare e gestire una macchina virtuale

Il portale di Azure è il modo più semplice per creare risorse come le macchine virtuali quando si muovono i primi passi. Non è però necessariamente il modo più efficiente o più rapido di lavorare con Azure, soprattutto quando occorre creare più risorse insieme. In uno scenario reale può capitare di dover creare decine di VM dedicate a compiti diversi: crearle a mano una per una nel portale non sarebbe affatto pratico. Per questo è importante conoscere gli strumenti alternativi che Azure mette a disposizione e capire quando convenga usare l'uno o l'altro.

Le principali opzioni per creare e amministrare le risorse in Azure sono:

- Modelli (template) di **Azure Resource Manager**
- **Azure PowerShell**
- **Azure CLI**
- **Terraform**
- **Azure REST API**
- **Azure Client SDK**
- **Azure VM Extensions**
- **Azure Automation**

**Modelli di Resource Manager** _(stepTitle)_

Immagina di voler creare una copia di una VM con le stesse identiche impostazioni. Un approccio possibile sarebbe creare un'immagine della VM, caricarla in Azure e usarla come base per la nuova VM: un procedimento però lento e poco efficiente. Azure offre un'alternativa migliore, ovvero la possibilità di generare un modello a partire dal quale creare una copia esatta della VM.

I **modelli di Resource Manager** (ARM template) sono file in formato JSON che descrivono in modo dichiarativo le risorse da distribuire per la propria soluzione. Il vantaggio chiave è che si descrive *cosa* si vuole ottenere (lo stato desiderato) e Resource Manager si occupa di crearlo, garantendo distribuzioni ripetibili e coerenti.

Puoi creare un modello per la tua VM direttamente dal portale: dal menu della VM, nella sezione **Automation**, seleziona **Export template**.

![Opzione Export template per una VM](img/4-automation-script.png) _(dimensioni: 474×296 px)_
*Figura 91: L'opzione «Export template» (script di automazione) disponibile dal menu di una macchina virtuale.* _(caption)_

> **Nota**: nell'ambiente sandbox di alcuni laboratori Learn le policy impediscono di esportare la VM appena creata. In ogni caso, un modello esportato è un file JSON facile da modificare: puoi scaricarlo o salvarlo per usarlo in seguito, oppure distribuire subito una nuova VM basata su di esso. Se la VM creata da un modello in ambiente di test non ti soddisfa, puoi eliminare il gruppo di risorse (cancellando così tutte le risorse), modificare il modello e riprovare. Se invece vuoi solo aggiornare risorse già distribuite, puoi modificare il modello usato per crearle e ridistribuirle: Resource Manager allineerà le risorse al nuovo modello.
_(infoBox)_

Una volta messo a punto il modello, lo puoi usare per replicare facilmente più versioni della tua infrastruttura, ad esempio gli ambienti di staging e di produzione. È inoltre possibile parametrizzare campi come il nome della VM, il nome della rete, il nome dell'account di archiviazione e così via, caricando ripetutamente lo stesso modello con parametri diversi per personalizzare ciascun ambiente.

**Azure CLI** _(stepTitle)_

Un'opzione per lo scripting e l'interazione da riga di comando con Azure è la **Azure CLI**.

La Azure CLI è lo strumento da riga di comando multipiattaforma di Microsoft per gestire risorse di Azure come macchine virtuali e dischi. È disponibile per Linux, macOS e Windows, oppure direttamente nel browser tramite **Cloud Shell**.

Ad esempio, dalla CLI puoi creare una VM con il comando `az vm create`:

```
az vm create \
    --resource-group TestResourceGroup \
    --name test-wp1-eus-vm \
    --image Ubuntu2204 \
    --admin-username azureuser \
    --generate-ssh-keys
```

La Azure CLI può essere usata anche in combinazione con altri linguaggi di scripting, come Ruby e Python.

**Azure PowerShell** _(stepTitle)_

**Azure PowerShell** è ideale per attività interattive occasionali e per l'automazione di attività ripetitive.

> **Nota**: PowerShell è una shell multipiattaforma che fornisce servizi come la finestra dei comandi e l'analisi (parsing) dei comandi. Azure PowerShell è un pacchetto aggiuntivo opzionale che introduce i comandi specifici di Azure, chiamati **cmdlet**.
_(infoBox)_

Ad esempio, puoi usare il cmdlet `New-AzVM` per creare una nuova VM di Azure basata su Debian:

```
New-AzVm `
    -ResourceGroupName "TestResourceGroup" `
    -Name "test-wp1-eus-vm" `
    -Location "East US" `
    -Image Debian11 `
    -VirtualNetworkName "test-wp1-eus-network" `
    -SubnetName "default" `
    -SecurityGroupName "test-wp1-eus-nsg" `
    -PublicIpAddressName "test-wp1-eus-pubip" `
    -GenerateSshKey `
    -SshKeyName myPSKey
    -OpenPorts 22
```

Come si vede, si forniscono vari parametri per gestire le numerose impostazioni di configurazione di una VM. La maggior parte dei parametri ha valori predefiniti ragionevoli, quindi in pratica è sufficiente specificare solo quelli obbligatori.

**Terraform** _(stepTitle)_

Azure dispone anche di un provider **Terraform**, che permette di creare e gestire le VM in modo semplice. Terraform consente di definire, visualizzare in anteprima e distribuire l'infrastruttura cloud. Con Terraform si scrivono file di configurazione usando la sintassi HCL, che permette di indicare il provider cloud (ad esempio Azure) e gli elementi che compongono l'infrastruttura. Dopo aver creato i file di configurazione, si genera un piano di esecuzione (*execution plan*) che consente di vedere in anteprima le modifiche all'infrastruttura prima che vengano applicate. Una volta verificate le modifiche, si applica il piano per distribuire l'infrastruttura. Questo flusso "anteprima poi applica" riduce il rischio di cambiamenti inattesi.

**Approccio programmatico (API)** _(stepTitle)_

In generale, sia Azure PowerShell sia Azure CLI sono ottime opzioni quando si hanno script semplici da eseguire e si preferisce restare su strumenti da riga di comando. Per scenari più complessi, in cui la creazione e la gestione delle VM fanno parte di un'applicazione più ampia con logica articolata, serve un approccio diverso: in Azure è possibile interagire con ogni tipo di risorsa in modo programmatico.

**Azure REST API** _(stepTitle)_

La **Azure REST API** offre agli sviluppatori operazioni organizzate per tipo di risorsa, con la possibilità di creare e gestire le VM. Le operazioni sono esposte come URI con i corrispondenti metodi HTTP (`GET`, `PUT`, `POST`, `DELETE` e `PATCH`) e una relativa risposta. Le API Compute di Azure forniscono accesso programmatico alle macchine virtuali e alle risorse che le supportano.

**Azure Client SDK** _(stepTitle)_

Anche se la REST API è indipendente da piattaforma e linguaggio, gli sviluppatori preferiscono spesso un livello di astrazione più elevato. L'**Azure Client SDK** incapsula la REST API di Azure, rendendo molto più semplice l'interazione con la piattaforma. Gli SDK sono disponibili per diversi linguaggi e framework, inclusi i linguaggi basati su .NET come C#, oltre a Java, Node.js, PHP, Python, Ruby e Go.

Ecco un esempio di codice C# per creare una VM di Azure tramite il pacchetto NuGet `Microsoft.Azure.Management.Fluent`:

```
var azure = Azure
    .Configure()
    .WithLogLevel(HttpLoggingDelegatingHandler.Level.Basic)
    .Authenticate(credentials)
    .WithDefaultSubscription();
// ...
var vmName = "test-wp1-eus-vm";

azure.VirtualMachines.Define(vmName)
    .WithRegion(Region.USEast)
    .WithExistingResourceGroup("TestResourceGroup")
    .WithExistingPrimaryNetworkInterface(networkInterface)
    .WithLatestWindowsImage("MicrosoftWindowsServer", "WindowsServer", "2012-R2-Datacenter")
    .WithAdminUsername("jonc")
    .WithAdminPassword("aReallyGoodPasswordHere")
    .WithComputerName(vmName)
    .WithSize(VirtualMachineSizeTypes.StandardDS1)
    .Create();
```

E qui lo stesso frammento in Java, usando l'**Azure Java SDK**:

```
String vmName = "test-wp1-eus-vm";
// ...
VirtualMachine virtualMachine = azure.virtualMachines()
    .define(vmName)
    .withRegion(Region.US_EAST)
    .withExistingResourceGroup("TestResourceGroup")
    .withExistingPrimaryNetworkInterface(networkInterface)
    .withLatestWindowsImage("MicrosoftWindowsServer", "WindowsServer", "2012-R2-Datacenter")
    .withAdminUsername("jonc")
    .withAdminPassword("aReallyGoodPasswordHere")
    .withComputerName(vmName)
    .withSize("Standard_DS1")
    .create();
```

**Azure VM Extensions** _(stepTitle)_

Supponiamo di voler configurare e installare software aggiuntivo su una VM dopo la distribuzione iniziale, e di volerlo fare con una configurazione specifica, monitorata ed eseguita automaticamente. Le **Azure VM Extensions** sono piccole applicazioni che consentono di configurare e automatizzare attività sulle VM di Azure dopo la distribuzione iniziale.

**Azure Automation** _(stepTitle)_

Risparmiare tempo, ridurre gli errori e aumentare l'efficienza sono tra le sfide operative più rilevanti nella gestione di infrastrutture remote. Quando si hanno numerosi servizi di infrastruttura, conviene considerare l'uso di servizi di livello superiore in Azure che permettono di operare con un grado di astrazione maggiore.

**Azure Automation** consente di integrare servizi che automatizzano attività di gestione frequenti, dispendiose in termini di tempo e soggette a errori. Questi servizi comprendono **automazione dei processi**, **gestione della configurazione** e **gestione degli aggiornamenti**.

- **Process Automation** (automazione dei processi). Immagina di avere una VM monitorata per un determinato evento di errore, e di voler intervenire per risolvere il problema non appena viene segnalato. L'automazione dei processi consente di impostare attività di tipo *watcher* in grado di rispondere agli eventi che si verificano nel datacenter.
- **Configuration Management** (gestione della configurazione). Magari vuoi tenere traccia degli aggiornamenti software disponibili per il sistema operativo della VM, includendo o escludendo aggiornamenti specifici. La gestione della configurazione permette di monitorare questi aggiornamenti e di intervenire dove necessario. Per gestire PC, server e dispositivi mobili dell'azienda si usa **Microsoft Endpoint Configuration Manager**, il cui supporto può essere esteso anche alle VM di Azure.
- **Update Management** (gestione degli aggiornamenti). Questo servizio gestisce aggiornamenti e patch per le VM. Permette di valutare lo stato degli aggiornamenti disponibili, pianificarne l'installazione ed esaminare i risultati della distribuzione per verificare che siano stati applicati correttamente. La gestione degli aggiornamenti incorpora i servizi di automazione dei processi e di gestione della configurazione. La si abilita per una VM direttamente dall'account **Azure Automation**, oppure per una singola VM dal relativo pannello nel portale.

**Auto-shutdown** _(stepTitle)_

L'**Auto-shutdown** è una funzionalità di Azure che consente di spegnere automaticamente le VM in base a una pianificazione. Serve soprattutto a contenere i costi, assicurando che le VM non restino accese quando non servono (un aspetto particolarmente utile per ambienti di sviluppo e test). Puoi impostare la pianificazione su base giornaliera o settimanale e specificare anche il fuso orario di riferimento.

Per raggiungere la funzionalità Auto-shutdown nel portale di Azure, apri il pannello della VM, seleziona **Auto-shutdown** nella sezione **Operations** e configura le impostazioni in base alle tue esigenze.

![Opzione Auto-shutdown per una VM](img/4-auto-shutdown-option.png) _(dimensioni: 1114×418 px)_
*Figura 92: L'opzione «Auto-shutdown» per la pianificazione dello spegnimento automatico di una macchina virtuale.* _(caption)_

In sintesi, Azure mette a disposizione strumenti diversi per creare e amministrare le risorse, così da poter integrare le operazioni di gestione in un processo adatto alle proprie esigenze: dal portale per i primi passi, agli strumenti da riga di comando per lo scripting, fino ai modelli e agli SDK per scenari complessi e ripetibili.

### 5.1.5 — Gestire la disponibilità delle macchine virtuali

Per molte aziende di servizi il successo dipende direttamente dagli accordi sul livello di servizio (SLA, Service Level Agreement) sottoscritti con i clienti. I clienti si aspettano che i servizi siano sempre raggiungibili e che i loro dati restino al sicuro. Amministrare una macchina virtuale di Azure non significa soltanto gestire il sistema operativo o il software che vi gira sopra: significa anche conoscere gli strumenti che Azure mette a disposizione per garantire la continuità del servizio, automatizzare le attività e proteggere i dati. Questi strumenti sono i mattoni su cui si costruisce la strategia di continuità operativa e disaster recovery dell'organizzazione.

**Che cos'è la disponibilità** _(stepTitle)_

La disponibilità (availability) è la percentuale di tempo in cui un servizio è effettivamente utilizzabile. Se hai un sito web e vuoi che i clienti possano accedere alle informazioni in qualsiasi momento, la tua aspettativa è una disponibilità del 100% rispetto all'accesso al sito.

**Perché preoccuparsi della disponibilità su Azure** _(stepTitle)_

Le **Azure Virtual Machines** girano su server fisici ospitati all'interno dei datacenter di Azure. Come per qualsiasi dispositivo fisico, esiste sempre la possibilità che un guasto si verifichi. Se il server fisico si guasta, anche le macchine virtuali ospitate su di esso si fermano. In quel caso Azure sposta automaticamente la VM su un host integro, ma questa migrazione "auto-riparante" può richiedere diversi minuti, durante i quali le applicazioni ospitate sulla VM non sono raggiungibili.

Anche gli aggiornamenti periodici avviati da Azure stesso possono incidere sulle VM. Questi eventi di manutenzione vanno dagli aggiornamenti software agli upgrade hardware e servono a migliorare l'affidabilità e le prestazioni della piattaforma. Di norma vengono eseguiti senza alcun impatto sulle VM guest, ma a volte richiedono il riavvio della macchina virtuale per completare l'aggiornamento.

> **Concetto chiave**: capire questi due tipi di interruzione (guasti imprevisti e manutenzione pianificata) è il motivo per cui si progetta la ridondanza. Tutte le tecniche che seguono servono proprio a evitare che il fermo di un singolo host o di un'intera zona comprometta l'applicazione.
_(infoBox)_

**Zone di disponibilità (Availability Zones)** _(stepTitle)_

Le **Availability Zones** ampliano il controllo che hai sulla disponibilità delle applicazioni e dei dati delle tue VM. Una zona di disponibilità è una zona fisicamente separata all'interno di una regione di Azure: ogni regione supportata dispone di tre zone di disponibilità.

Ciascuna zona ha una propria alimentazione elettrica, una propria rete e un proprio sistema di raffreddamento, indipendenti dalle altre. Progettando le soluzioni con VM replicate in zone diverse, proteggi applicazioni e dati dalla perdita di un intero datacenter: se una zona viene compromessa, le applicazioni e i dati replicati restano immediatamente disponibili in un'altra zona.

**Set di scalabilità di macchine virtuali (Virtual Machine Scale Sets)** _(stepTitle)_

Gli **Azure Virtual Machine Scale Sets** permettono di creare e gestire un gruppo di VM con bilanciamento del carico. Il numero di istanze VM può aumentare o diminuire automaticamente in risposta alla domanda oppure secondo una pianificazione definita. I set di scalabilità offrono alta disponibilità alle applicazioni e consentono di gestire, configurare e aggiornare molte VM in modo centralizzato. Non c'è alcun costo per il set di scalabilità in sé: paghi solo per ciascuna istanza VM che crei.

Le VM di un set di scalabilità possono essere distribuite in più zone di disponibilità, in una singola zona di disponibilità oppure a livello regionale. Le opzioni di distribuzione nelle zone possono variare in base alla modalità di orchestrazione (orchestration mode) scelta.

**Bilanciamento del carico (Load Balancer)** _(stepTitle)_

Combinando **Azure Load Balancer** con una zona o un set di disponibilità ottieni la massima resilienza applicativa. **Azure Load Balancer** distribuisce il traffico tra più macchine virtuali. Per le VM di tier Standard, **Azure Load Balancer** è incluso; non tutti i tier di macchina virtuale lo includono.

**Ridondanza dello storage (Azure Storage redundancy)** _(stepTitle)_

**Azure Storage** conserva sempre più copie dei tuoi dati, in modo da proteggerli da eventi pianificati e non pianificati: guasti hardware transitori, interruzioni di rete o di alimentazione e perfino gravi disastri naturali. La ridondanza garantisce che l'account di archiviazione raggiunga i propri obiettivi di disponibilità e durabilità anche in presenza di guasti.

Nello scegliere l'opzione di ridondanza più adatta al tuo scenario devi valutare il compromesso tra costi più bassi e maggiore disponibilità. I fattori che aiutano a decidere sono:

- Come vengono replicati i dati all'interno della regione primaria.
- Se i dati vengono replicati anche in una seconda regione geograficamente distante da quella primaria, per proteggersi dai disastri regionali.
- Se l'applicazione richiede accesso in lettura ai dati replicati nella regione secondaria nel caso in cui la regione primaria diventi indisponibile per qualsiasi motivo.

**Failover tra località diverse** _(stepTitle)_

Puoi anche replicare l'infrastruttura tra più sedi per gestire il failover a livello regionale. **Azure Site Recovery** replica i carichi di lavoro da un sito primario a una località secondaria. Se si verifica un'interruzione nel sito primario, puoi eseguire il failover verso la località secondaria: gli utenti continuano così ad accedere alle applicazioni senza interruzioni. Una volta ripristinato il sito primario, puoi riportarvi i carichi (fail back). In sostanza, **Azure Site Recovery** si occupa della replica di macchine virtuali o fisiche e mantiene i carichi di lavoro disponibili durante un'interruzione.

Oltre ai numerosi vantaggi tecnici, **Site Recovery** offre almeno due benefici di natura strettamente economica e operativa:

- Consente di usare Azure come destinazione per il ripristino, eliminando i costi e la complessità di mantenere un secondo datacenter fisico.
- Rende estremamente semplice testare i failover per le esercitazioni di ripristino senza impattare gli ambienti di produzione. Questo è cruciale: non hai un buon piano di disaster recovery se non hai mai provato a eseguire il failover.

I piani di ripristino (recovery plan) che crei con **Site Recovery** possono essere semplici o complessi quanto richiede lo scenario. Possono includere script PowerShell personalizzati, runbook di **Azure Automation** o passaggi di intervento manuale. Puoi usarli per replicare carichi di lavoro verso Azure, abilitando nuove opportunità di migrazione, gestione di picchi temporanei nei periodi di sovraccarico oppure sviluppo e test di nuove applicazioni.

**Azure Site Recovery** funziona con risorse di Azure oppure con Hyper-V, VMware e server fisici della tua infrastruttura on-premises. Può essere un tassello fondamentale della strategia aziendale di continuità operativa e disaster recovery (BCDR), orchestrando la replica, il failover e il ripristino di carichi di lavoro e applicazioni in caso di guasto della località primaria.

### 5.1.6 — Eseguire il backup delle macchine virtuali

Il backup e il ripristino dei dati sono una parte imprescindibile della pianificazione di qualsiasi buona infrastruttura. Pensiamo a uno scenario concreto: un bug cancella alcuni dati aziendali, oppure dobbiamo recuperare informazioni archiviate per finalità di audit. Avere una strategia di backup solida significa non trovarsi impreparati nel momento in cui dati o software devono essere ripristinati. La logica di fondo è semplice ma spesso sottovalutata: il backup non serve quando «tutto va bene», serve precisamente nel momento peggiore, ed è proprio per questo che va progettato prima e non improvvisato dopo l'incidente.

**Azure Backup** è un'offerta di tipo *backup as a service* che protegge macchine fisiche o virtuali indipendentemente da dove risiedono: on-premises o nel cloud. Il vantaggio di un modello «as a service» è che la complessità dell'infrastruttura di backup (storage, repliche, scalabilità) viene gestita dalla piattaforma, lasciando a noi solo le decisioni di policy: cosa proteggere, quando e per quanto tempo.

**Scenari di backup supportati** _(stepTitle)_

**Azure Backup** può essere utilizzato per un'ampia gamma di scenari di backup dei dati, tra cui:

- File e cartelle su macchine con sistema operativo Windows (fisiche o virtuali, locali o nel cloud)
- Snapshot application-aware (tramite **Volume Shadow Copy Service**)
- Carichi di lavoro server Microsoft molto diffusi, come **Microsoft SQL Server**, **Microsoft SharePoint** e **Microsoft Exchange**
- Supporto nativo per **Azure Virtual Machines**, sia Windows sia Linux
- Macchine client Linux e Windows 10

![Vault di Azure Backup che archivia diversi carichi di lavoro di una VM](img/6-backup-server.png) _(dimensioni: 515×346 px)_
*Figura 93: Un vault di Azure Backup utilizzato per archiviare carichi di lavoro differenti provenienti da una macchina virtuale di Azure, come cartelle, file, Exchange, SharePoint e SQL Server.* _(caption)_

**Vantaggi dell'utilizzo di Azure Backup** _(stepTitle)_

Le soluzioni di backup tradizionali non sempre sfruttano appieno la piattaforma Azure sottostante. Il risultato è una soluzione che tende a essere costosa o inefficiente: offre troppo o troppo poco spazio di archiviazione, non propone i tipi di storage corretti, oppure comporta attività amministrative macchinose e dispendiose in termini di tempo. **Azure Backup** è stato invece progettato per lavorare in tandem con gli altri servizi di Azure e offre diversi vantaggi distintivi.

- **Gestione automatica dello storage**. **Azure Backup** alloca e gestisce automaticamente lo spazio di archiviazione del backup, adottando un modello pay-as-you-use. In questo modo si paga solo per ciò che si utilizza, senza dover dimensionare in anticipo lo storage.
- **Scalabilità illimitata**. **Azure Backup** sfrutta la potenza e la scalabilità di Azure per garantire un'elevata disponibilità.
- **Opzioni di archiviazione multiple**. **Azure Backup** offre l'archiviazione con ridondanza locale (locally redundant storage), in cui tutte le copie dei dati risiedono nella stessa area geografica, e l'archiviazione con ridondanza geografica (geo-redundant storage), in cui i dati vengono replicati in un'area secondaria.
- **Trasferimento dati illimitato**. **Azure Backup** non pone limiti alla quantità di dati in ingresso o in uscita trasferiti e non addebita costi per i dati trasferiti.
- **Crittografia dei dati**. La crittografia consente una trasmissione e un'archiviazione sicure dei dati in Azure.
- **Backup application-consistent**. Un backup application-consistent significa che un punto di ripristino contiene tutti i dati necessari per ripristinare la copia di backup. **Azure Backup** fornisce backup coerenti a livello applicativo, riducendo il rischio di ripristinare dati incompleti o corrotti.
- **Conservazione a lungo termine**. Azure non impone limiti alla durata di conservazione dei dati di backup.

> **Nota**: l'archiviazione con ridondanza locale (LRS) protegge dai guasti hardware all'interno di un'area, mentre quella con ridondanza geografica (GRS) protegge anche dalla perdita di un'intera area: la scelta dipende dal livello di resilienza richiesto e dai vincoli normativi sulla residenza dei dati.
_(infoBox)_

**Come utilizzare Azure Backup** _(stepTitle)_

**Azure Backup** utilizza diversi componenti che vengono scaricati e distribuiti su ogni computer di cui si desidera eseguire il backup. Il componente da distribuire dipende da ciò che si intende proteggere: questa modularità permette di adattare lo strumento sia a un singolo file server on-premises sia a una VM Azure nativa.

- Agente di Azure Backup (Azure Backup agent)
- System Center Data Protection Manager
- Azure Backup Server
- Estensione VM di Azure Backup (Azure Backup VM extension)

**Azure Backup** utilizza un **Recovery Services vault** (insieme di credenziali dei servizi di ripristino) per archiviare i dati di backup. Il vault è supportato da blob di Azure Storage, il che lo rende un mezzo di archiviazione a lungo termine efficiente ed economico. Una volta predisposto il vault, è possibile selezionare le macchine di cui eseguire il backup e definire una policy di backup, ovvero stabilire quando vengono acquisiti gli snapshot e per quanto tempo vengono conservati.

## 5.2 — Configurare la disponibilità delle macchine virtuali

### 5.2.1 — Introduzione

Gestire le macchine virtuali su larga scala può essere impegnativo, soprattutto quando i pattern di utilizzo variano e le richieste sulle applicazioni fluttuano nel tempo. Un amministratore Azure deve poter adeguare le risorse delle proprie macchine virtuali per rispondere alle mutevoli esigenze di carico, mantenendo al contempo una configurazione coerente per garantire la stabilità delle applicazioni. L'obiettivo è preservare throughput e reattività, riducendo al minimo i costi legati all'esecuzione continua di un ampio insieme di macchine virtuali.

In questa sezione viene affrontato lo scenario di un sito web aziendale, basato su **Azure Virtual Machines**, che gestisce carichi di lavoro consistenti: il reparto IT vuole assicurarsi che le macchine virtuali si adattino dinamicamente all'aumento e alla diminuzione dei carichi e che esista un piano di continuità operativa per garantirne l'alta disponibilità. Il lettore imparerà a scalare le macchine virtuali, comprendendo i concetti di zone di disponibilità (availability zones), set di disponibilità (availability sets), domini di aggiornamento (update domains) e domini di errore (fault domains); scoprirà inoltre i set di scalabilità (scale sets) e la funzionalità di scalabilità automatica (autoscale), con lo scopo di rispondere efficacemente alle variazioni dei carichi di lavoro.

### 5.2.2 — Pianificare manutenzione e tempi di inattività

Quando ospitiamo i nostri carichi di lavoro su **Azure Virtual Machines**, dobbiamo accettare un principio fondamentale: l'hardware fisico sottostante non è infallibile e la piattaforma stessa va aggiornata periodicamente. Un buon piano di disponibilità non si limita quindi a sperare che nulla vada storto, ma prevede in anticipo cosa accadrà nei tre scenari tipici di interruzione. Capire *come* Azure reagisce in ciascun caso ci permette di dimensionare correttamente le contromisure (ridondanza, set di disponibilità, zone) e di sapere quale impatto attendersi sulle nostre macchine virtuali.

Un piano completo deve coprire tre categorie distinte di eventi: la manutenzione hardware non pianificata, i tempi di inattività imprevisti e la manutenzione pianificata. Sono scenari diversi non solo per causa, ma soprattutto per il *tipo di impatto* che producono sulla VM, ed è proprio questa differenza che ne giustifica una trattazione separata.

**Manutenzione hardware non pianificata** _(stepTitle)_

Questo evento si verifica quando la piattaforma Azure *prevede* che l'hardware, o un qualsiasi componente della piattaforma associato a una macchina fisica, stia per guastarsi. Il punto chiave è che qui non c'è ancora stato un guasto: Azure agisce in modo predittivo, prima che il problema diventi reale.

Quando la piattaforma anticipa un possibile guasto, emette un evento di manutenzione hardware non pianificata e ricorre alla tecnologia di **Live Migration** per spostare le macchine virtuali dall'hardware in via di degrado verso una macchina fisica integra. Il vantaggio di questo approccio è che la Live Migration preserva lo stato della VM: l'operazione mette in pausa la macchina virtuale solo per un breve istante, senza riavviarla. L'effetto collaterale da tenere presente è che le prestazioni potrebbero risultare ridotte prima o dopo l'evento, ma il servizio nel suo complesso non si interrompe in modo significativo.

**Tempi di inattività imprevisti** _(stepTitle)_

A differenza del caso precedente, qui il guasto è già avvenuto: l'hardware o l'infrastruttura fisica della nostra macchina virtuale si guasta in modo inatteso, senza che la piattaforma abbia potuto prevederlo. Rientrano in questa categoria, ad esempio, i guasti alla rete locale, i guasti ai dischi locali o altri problemi a livello di rack.

Quando rileva il guasto, la piattaforma Azure migra automaticamente (operazione di *healing*) la macchina virtuale verso un host fisico integro all'interno dello stesso datacenter. La differenza sostanziale rispetto alla Live Migration è l'impatto: durante la procedura di healing le macchine virtuali subiscono un tempo di inattività, perché vengono riavviate (reboot), e in alcuni casi si può verificare la perdita del disco temporaneo. Questo spiega perché non dobbiamo mai salvare dati persistenti sul disco temporaneo di una VM.

**Manutenzione pianificata** _(stepTitle)_

Gli eventi di manutenzione pianificata sono gli aggiornamenti periodici che Microsoft applica alla piattaforma Azure sottostante. Lo scopo è migliorare l'affidabilità, le prestazioni e la sicurezza complessive dell'infrastruttura della piattaforma su cui girano le nostre macchine virtuali. A differenza dei due scenari precedenti, qui non si tratta di reagire a un guasto, ma di un'attività programmata e proattiva da parte di Microsoft.

**Confronto dei tre scenari** _(stepTitle)_

La tabella seguente riassume le differenze tra i tre eventi, evidenziando causa, tecnologia utilizzata e impatto sulla VM. È questa distinzione che guida le scelte di progettazione della disponibilità.

| **Scenario** | **Causa** | **Tecnologia / Azione** | **Impatto sulla VM** |
|---|---|---|---|
| **Manutenzione hardware non pianificata** | Guasto hardware *previsto* (non ancora avvenuto) | Live Migration (preserva lo stato della VM) | Breve pausa, nessun riavvio; possibile calo di prestazioni prima/dopo |
| **Tempi di inattività imprevisti** | Guasto hardware/infrastruttura *già avvenuto* (rete, disco, rack) | Healing automatico verso un host integro nello stesso datacenter | Tempo di inattività con riavvio (reboot); possibile perdita del disco temporaneo |
| **Manutenzione pianificata** | Aggiornamenti periodici della piattaforma da parte di Microsoft | Patch programmate dell'host software e dell'hardware | Aggiornamenti programmati dell'infrastruttura sottostante |

> **Nota**: Microsoft non aggiorna automaticamente il sistema operativo della macchina virtuale né gli altri software in esecuzione su di essa. Abbiamo il pieno controllo, e quindi la piena responsabilità, di questi aggiornamenti. Microsoft applica invece periodicamente le patch all'host software e all'hardware sottostanti, per garantire affidabilità ed elevate prestazioni della piattaforma.
_(infoBox)_

### 5.2.3 — Creare i set di disponibilità

Un set di disponibilità (availability set) è una funzionalità logica che permette di garantire che un gruppo di macchine virtuali correlate venga distribuito insieme all'interno del datacenter Azure. L'obiettivo di fondo è eliminare il singolo punto di guasto: senza questo raggruppamento, nulla impedirebbe ad Azure di collocare tutte le macchine virtuali di un'applicazione sullo stesso server fisico o sullo stesso rack: in caso di guasto hardware o di manutenzione, l'intera applicazione cadrebbe in un colpo solo. Il set di disponibilità distribuisce invece le macchine su più infrastrutture e si occupa anche di non aggiornare tutte le macchine nello stesso momento durante un aggiornamento del sistema operativo host nel datacenter.

**Caratteristiche dei set di disponibilità** _(stepTitle)_

Prima di progettare un set di disponibilità è importante capire come si comporta e quali vincoli impone. Le caratteristiche principali sono le seguenti:

- Tutte le macchine virtuali in un set di disponibilità dovrebbero svolgere lo stesso identico insieme di funzionalità. Il set ha senso solo se le macchine sono intercambiabili: se una cade, le altre devono poter assorbire il carico al suo posto.
- Tutte le macchine virtuali in un set di disponibilità dovrebbero avere lo stesso software installato, proprio per garantire questa intercambiabilità.
- Azure assicura che le macchine virtuali di un set di disponibilità vengano eseguite su più server fisici, rack di calcolo, unità di storage e switch di rete differenti. In questo modo, se si verifica un guasto hardware o un guasto del software Azure, viene colpito solo un sottoinsieme delle macchine virtuali del set. L'applicazione resta attiva e continua a essere disponibile per i clienti.
- È possibile creare una macchina virtuale e un set di disponibilità nello stesso momento.
- Una macchina virtuale può essere aggiunta a un set di disponibilità soltanto al momento della sua creazione. Per cambiare il set di disponibilità di una macchina virtuale esistente, è necessario eliminarla e poi ricrearla. Questo è un vincolo importante da tenere presente in fase di progettazione, perché un errore non è correggibile "a caldo".
- I set di disponibilità si possono creare tramite il portale di Azure, i modelli **Azure Resource Manager** (ARM), gli script o gli strumenti API.

> **Nota**: aggiungere le macchine virtuali a un set di disponibilità non protegge le applicazioni dai guasti del sistema operativo o specifici dell'applicazione. Per la protezione a livello applicativo occorre adottare altre tecniche di disaster recovery e di backup.
_(infoBox)_

**Aspetti da valutare nell'uso dei set di disponibilità** _(stepTitle)_

I set di disponibilità sono una capacità essenziale quando si vogliono costruire soluzioni cloud affidabili. Nella pianificazione conviene tenere a mente alcuni principi generali, ciascuno dei quali risponde a un'esigenza precisa di affidabilità:

- **Considerare la ridondanza**. Per ottenere ridondanza nella configurazione, è necessario collocare più macchine virtuali in un set di disponibilità. Una sola macchina nel set non offre alcuna protezione: serve almeno una replica che subentri in caso di guasto.
- **Considerare la separazione dei livelli applicativi**. Ogni livello (tier) dell'applicazione dovrebbe trovarsi in un set di disponibilità separato. Questa separazione aiuta a mitigare il singolo punto di guasto su tutte le macchine: così, ad esempio, un problema sul livello web non coinvolge contemporaneamente anche il livello dati.
- **Considerare il bilanciamento del carico**. Per ottenere alta disponibilità e buone prestazioni di rete, conviene creare un set di disponibilità con bilanciamento del carico tramite **Azure Load Balancer**. Il Load Balancer distribuisce il traffico in ingresso tra le istanze funzionanti dei servizi definite nel set di disponibilità bilanciato.
- **Considerare i dischi gestiti**. È possibile usare i dischi gestiti di Azure (**Azure managed disks**) con le macchine virtuali nei set di disponibilità, per lo storage a livello di blocco.

### 5.2.4 — Update domain e fault domain

Per garantire alta disponibilità e tolleranza ai guasti durante il deployment e l'aggiornamento delle applicazioni, i set di disponibilità di **Azure Virtual Machines** si basano su due concetti chiave: gli *update domain* (domini di aggiornamento) e i *fault domain* (domini di errore). L'idea di fondo è semplice ma potente: distribuire le macchine virtuali in modo che un singolo evento — sia esso pianificato (un aggiornamento) o imprevisto (un guasto hardware) — non possa mai mettere fuori uso tutte le istanze contemporaneamente.

Ogni macchina virtuale inserita in un set di disponibilità viene assegnata automaticamente a un update domain e a un fault domain. È proprio questa doppia assegnazione che permette ad Azure di "spalmare" il carico su unità logiche e fisiche diverse, riducendo il rischio di interruzioni del servizio.

**Cosa sapere sugli update domain** _(stepTitle)_

Un update domain è un gruppo di nodi che vengono aggiornati insieme durante un processo di aggiornamento del servizio (chiamato anche *roll out*). Il loro scopo è consentire ad Azure di eseguire aggiornamenti incrementali o "a rotazione" (rolling) su un deployment, evitando di riavviare tutto in una volta sola. In questo modo, mentre un gruppo di VM viene aggiornato e riavviato, le altre continuano a servire le richieste.

Ecco le caratteristiche principali degli update domain:

- Ogni update domain contiene un insieme di macchine virtuali e l'hardware fisico associato che possono essere aggiornati e riavviati nello stesso momento.
- Durante la manutenzione pianificata, viene riavviato un solo update domain alla volta. Questo è il meccanismo che protegge l'applicazione: le altre istanze restano operative.
- Quando crei un set di disponibilità puoi specificare da 1 a 20 update domain. Se non indichi alcun valore, Azure ne imposta cinque come impostazione predefinita.
- Il numero di update domain è immutabile dopo la creazione: per cambiarlo devi eliminare e ricreare il set di disponibilità.

> **Importante**: poiché il conteggio degli update domain non si può modificare a posteriori, vale la pena pianificarlo con attenzione al momento della creazione del set di disponibilità.
_(infoBox)_

**Cosa sapere sui fault domain** _(stepTitle)_

Un fault domain è un gruppo di nodi che rappresenta un'unità fisica di errore. Il modo più intuitivo per visualizzarlo è pensare a un fault domain come a un insieme di nodi che appartengono allo stesso rack fisico. Se quel rack subisce un problema, tutto ciò che vi è ospitato viene coinvolto: ecco perché distribuire le VM su più fault domain è cruciale.

- Un fault domain definisce un gruppo di macchine virtuali che condividono un insieme comune di hardware (o *switch*) e, di conseguenza, un singolo punto di errore. Un esempio tipico è un rack server alimentato dallo stesso set di switch di rete o di alimentazione.
- Due fault domain lavorano insieme per mitigare l'impatto di guasti hardware, interruzioni di rete, cali di alimentazione o aggiornamenti software. Distribuendo le istanze su domini distinti, un problema che colpisce un rack non si propaga all'altro.

**Uno scenario pratico con due fault domain** _(stepTitle)_

Vediamo come questi concetti si combinano in pratica. Immaginiamo uno scenario con due fault domain, ciascuno dei quali ospita due macchine virtuali. Le macchine virtuali di ogni fault domain appartengono a set di disponibilità diversi:

- Il set di disponibilità **web** contiene due macchine virtuali, una prelevata da ciascun fault domain.
- Il set di disponibilità **SQL** contiene due macchine virtuali diverse, anch'esse una per ciascun fault domain.

Il risultato è che, sia il livello web sia il livello SQL, hanno sempre almeno una istanza attiva anche se uno dei due fault domain dovesse guastarsi completamente. Questa è la logica con cui i set di disponibilità garantiscono la continuità del servizio.

![Due fault domain con due macchine virtuali ciascuno in set di disponibilità diversi](img/update-fault-domains-c1ceee00.png) _(dimensioni: 578×312 px)_
*Figura 94: Due fault domain con due macchine virtuali ciascuno. Le macchine virtuali di ogni fault domain sono distribuite in set di disponibilità differenti (web e SQL).* _(caption)_

### 5.2.5 — Zone di disponibilità

Le zone di disponibilità (availability zones) sono un'offerta di alta disponibilità pensata per proteggere applicazioni e dati dai guasti che possono colpire un intero datacenter. Mentre i set di disponibilità lavorano "dentro" un singolo datacenter (proteggendo da guasti hardware ed eventi di manutenzione a livello di rack), le zone di disponibilità alzano il livello di protezione a un'intera area geografica: distribuiscono le risorse su edifici fisicamente separati all'interno della stessa region. L'idea di fondo è semplice: se un datacenter va offline (per un'interruzione elettrica, un incendio, un allagamento), gli altri continuano a funzionare e l'applicazione resta disponibile.

Per ottenere questo risultato si collocano (colocate) le risorse di calcolo, archiviazione, rete e dati all'interno di una zona e si replicano nelle altre zone. In questo modo l'architettura non dipende più da un unico punto fisico.

**Come funziona la distribuzione su più zone** _(stepTitle)_

Immagina di creare tre o più macchine virtuali distribuendole su tre zone diverse all'interno di una region di Azure. Il risultato è che le macchine virtuali sono effettivamente ripartite su tre fault domain e tre update domain distinti. Questo è il punto chiave: usando le zone ottieni "gratuitamente" l'isolamento sia dai guasti fisici (fault domain) sia dagli aggiornamenti pianificati (update domain), perché la piattaforma Azure riconosce questa distribuzione e garantisce che le macchine virtuali in zone diverse non vengano mai aggiornate nello stesso momento. È il motivo per cui le zone offrono uno SLA più alto rispetto ai semplici set di disponibilità.

**Cosa sapere sulle zone di disponibilità** _(stepTitle)_

Ecco le caratteristiche fondamentali da tenere a mente:

- Le zone di disponibilità sono posizioni fisiche uniche all'interno di una region di Azure.
- Ogni zona è composta da uno o più datacenter dotati di alimentazione, raffreddamento e rete indipendenti. L'indipendenza di queste infrastrutture è ciò che garantisce che il guasto di una zona non si propaghi alle altre.
- Per assicurare la resilienza, in tutte le region abilitate esiste un minimo di tre zone separate.
- La separazione fisica delle zone all'interno di una region è ciò che protegge applicazioni e dati dai guasti di un datacenter.
- I servizi zone-redundant replicano le applicazioni e i dati attraverso le zone di disponibilità per proteggere dai single point of failure (punti singoli di guasto).

**Cosa considerare quando si usano le zone** _(stepTitle)_

I servizi di Azure che supportano le zone di disponibilità si dividono in due categorie. La differenza sta in chi gestisce la distribuzione: con i servizi zonal sei tu a "fissare" ogni risorsa a una zona specifica, mentre con i servizi zone-redundant è la piattaforma a replicare automaticamente i dati su tutte le zone.

| **Categoria** | **Descrizione** | **Esempi** |
| --- | --- | --- |
| **Zonal services** | I servizi _zonal_ di Azure ancorano (pin) ogni risorsa a una zona specifica. | - **Azure Virtual Machines** - **Azure Managed Disks** |
| **Zone-redundant services** | Per i servizi di Azure che sono zone-redundant, la piattaforma replica automaticamente su tutte le zone. | - **Azure Storage** in modalità zone-redundant - **Azure SQL Database** |

> **Nota**: gli indirizzi IP standard possono essere configurati come zone-redundant (consigliato per l'alta disponibilità), zonal (ancorati a una zona specifica) oppure non-zonal (a livello di region), a seconda della scelta di deployment.
_(infoBox)_

> **Suggerimento**: per ottenere una continuità operativa (business continuity) completa su Azure, progetta l'architettura della tua applicazione combinando le zone di disponibilità con le coppie di region (regional pairs). Le zone proteggono dai guasti all'interno di una region, mentre le coppie di region estendono la protezione a livello geografico in caso di disastro su scala regionale.
_(infoBox)_

### 5.2.6 — Confronto tra scalabilità verticale e orizzontale

Una configurazione robusta per una macchina virtuale deve prevedere il supporto alla scalabilità. La scalabilità consente di adeguare il throughput di una macchina virtuale in modo proporzionale alla disponibilità delle risorse hardware associate. In pratica, una macchina virtuale scalabile è in grado di assorbire l'aumento delle richieste senza che ne risentano i tempi di risposta o la capacità di elaborazione. Il motivo per cui questo aspetto è cruciale è semplice: i carichi di lavoro reali non sono costanti: variano nel corso della giornata, della settimana o in occasione di picchi imprevisti, e una macchina dimensionata in modo rigido finisce per essere o sovradimensionata (e quindi costosa) o insufficiente (e quindi lenta). Per la maggior parte delle operazioni di scalabilità esistono due approcci possibili: quello *verticale* e quello *orizzontale*.

**Cosa sapere sulla scalabilità verticale** _(stepTitle)_

La scalabilità verticale, nota anche come *scale up e scale down*, consiste nell'aumentare o diminuire la **dimensione** (size) della macchina virtuale in risposta al carico di lavoro. In altre parole, con la scalabilità verticale si rende una singola macchina virtuale più potente (scale up) oppure meno potente (scale down), agendo sulle risorse che le sono assegnate, come CPU e memoria. Il numero di macchine resta sempre uno: ciò che cambia è la loro "taglia".

![Scalabilità verticale di una macchina virtuale](img/vertical-scaling-cdafa792.png) _(dimensioni: 304×167 px)_
*Figura 95: Scalabilità verticale: una singola macchina virtuale aumenta o diminuisce di dimensione tramite scale up o scale down.* _(caption)_

Ecco alcuni scenari in cui la scalabilità verticale può rivelarsi vantaggiosa:

- Se hai un servizio basato su una macchina virtuale che risulta sottoutilizzata in determinati periodi, ad esempio nel fine settimana, puoi sfruttare la scalabilità verticale per ridurne la dimensione e abbattere così i costi mensili.
- Puoi applicare la scalabilità verticale per aumentare la dimensione della macchina virtuale e sostenere una domanda più elevata, senza dover creare macchine virtuali aggiuntive.

**Cosa sapere sulla scalabilità orizzontale** _(stepTitle)_

La scalabilità orizzontale, indicata anche come *scale out e scale in*, viene utilizzata per modificare il **numero** di macchine virtuali presenti nella configurazione, in modo da adattarsi al variare del carico di lavoro. Quando si applica la scalabilità orizzontale, si ha un aumento (scale out) oppure una diminuzione (scale in) del numero di istanze di macchina virtuale. La logica qui è diversa: invece di rendere "più grande" una singola macchina, si aggiungono o si rimuovono macchine che lavorano in parallelo per distribuire il carico.

![Scalabilità orizzontale di un insieme di macchine virtuali](img/horizontal-scaling-3e457e75.png) _(dimensioni: 342×187 px)_
*Figura 96: Scalabilità orizzontale: vengono aggiunte macchine virtuali (scale out) per sostenere il carico di lavoro.* _(caption)_

**Aspetti da valutare nella scelta tra scalabilità verticale e orizzontale** _(stepTitle)_

Quando si decide quale approccio adottare, è utile ragionare sulle implicazioni pratiche di ciascuna soluzione, pensando a quale possa effettivamente supportare meglio lo scenario in questione (ad esempio il sito web aziendale). I principali aspetti da considerare sono i seguenti:

- **Considera le limitazioni**. In generale, la scalabilità orizzontale presenta meno vincoli rispetto a quella verticale. Una soluzione di scalabilità verticale dipende infatti dalla disponibilità di hardware più potente, che raggiunge rapidamente un limite massimo e può variare da regione a regione. Inoltre, la scalabilità verticale di norma richiede l'arresto e il riavvio della macchina virtuale, con il risultato di limitare temporaneamente l'accesso alle applicazioni o ai dati.
- **Considera la flessibilità**. Quando si opera nel cloud, la scalabilità orizzontale è più flessibile. Una soluzione di scalabilità orizzontale consente potenzialmente di eseguire migliaia di macchine virtuali per gestire le variazioni di carico di lavoro e di throughput.
- **Considera il reprovisioning**. Il *reprovisioning* è il processo che consiste nel rimuovere una macchina virtuale esistente e sostituirla con una nuova. Un piano di disponibilità ben strutturato deve individuare in anticipo i punti in cui potrebbe rendersi necessario il reprovisioning e prevedere le possibili interruzioni del servizio. Se il reprovisioning può essere necessario, occorre stabilire se vi siano dati da conservare e da migrare verso la nuova macchina.

Per riepilogare le differenze chiave tra i due approcci, la seguente tabella mette a confronto i parametri principali:

| **Caratteristica** | **Scalabilità verticale (scale up/down)** | **Scalabilità orizzontale (scale out/in)** |
|---|---|---|
| **Cosa cambia** | La dimensione (size) di una singola macchina virtuale | Il numero di istanze di macchine virtuali |
| **Direzione** | Scale up (più potente) / scale down (meno potente) | Scale out (più istanze) / scale in (meno istanze) |
| **Limitazioni** | Dipende dalla disponibilità di hardware più grande; limite superiore rapido; variabile per regione | Meno vincoli; più scalabile nel tempo |
| **Continuità del servizio** | Richiede in genere arresto e riavvio della macchina | Le istanze esistenti restano attive durante la variazione |
| **Flessibilità nel cloud** | Inferiore | Superiore (potenzialmente migliaia di istanze) |

> **Nota**: la scalabilità verticale è spesso la via più rapida e semplice quando serve solo "più potenza" su una macchina singola, ma è la scalabilità orizzontale a offrire la maggiore resilienza ed elasticità nel cloud, perché distribuisce il carico su più istanze ed evita il punto unico di fallimento rappresentato da una sola macchina.
_(infoBox)_

### 5.2.7 — Implementare i Virtual Machine Scale Sets

Un **Azure Virtual Machine Scale Set** è una risorsa di **Azure Compute** che permette di distribuire e gestire un insieme di macchine virtuali *identiche*. L'idea di fondo è semplice ma potente: invece di configurare e mantenere ogni VM una per una, definisci una sola volta la configurazione e lasci che la piattaforma replichi automaticamente quante istanze servono. Configurando tutte le macchine allo stesso modo, ottieni il vero *autoscaling* (scalabilità automatica): il numero di istanze cresce quando la domanda applicativa aumenta e si riduce quando la domanda cala.

Il vantaggio pratico è che non devi più effettuare il *pre-provisioning* delle macchine virtuali, cioè predisporle in anticipo immaginando il picco massimo di carico. Diventa molto più semplice costruire servizi su larga scala pensati per carichi di lavoro a elevata capacità di calcolo (large compute), big data e workload containerizzati. Quando il carico aumenta vengono aggiunte nuove istanze; quando diminuisce le istanze vengono rimosse. Questo processo di aggiunta e rimozione può essere manuale, automatico oppure una combinazione dei due approcci.

> **Perché conviene**: paghi solo per le istanze effettivamente attive in un dato momento. Riducendo le macchine nei periodi di basso carico ottimizzi i costi, mentre nei picchi mantieni le prestazioni aggiungendo capacità senza intervento manuale.
_(infoBox)_

**Caratteristiche degli Azure Virtual Machine Scale Sets** _(stepTitle)_

Vale la pena ricordare le proprietà principali di questa risorsa, perché spiegano sia il "cosa" sia il "perché" la si sceglie:

- Gli scale set supportano l'uso di **Azure Load Balancer** per la distribuzione del traffico di base a livello 4 (layer-4), e di **Azure Application Gateway** per una distribuzione più avanzata a livello 7 (layer-7) e per la terminazione TLS/SSL. In pratica il bilanciatore distribuisce le richieste in ingresso tra le diverse istanze dello scale set.
- Puoi usare gli scale set per eseguire più istanze della tua applicazione contemporaneamente. Se una delle istanze di macchina virtuale ha un problema, i clienti continuano ad accedere all'applicazione tramite un'altra istanza, con un'interruzione minima. È questo il meccanismo che migliora l'*alta disponibilità* del servizio.
- L'*autoscaling* è integrato: poiché la domanda dei clienti può variare nel corso della giornata o della settimana, lo scale set aumenta e diminuisce automaticamente il numero di macchine virtuali per adeguarsi al carico reale.

**Le due modalità di orchestrazione: Uniform e Flexible** _(stepTitle)_

Esistono due tipi di modalità di orchestrazione (orchestration mode) per gli scale set. La modalità va scelta al momento della creazione dello scale set e ne determina il comportamento. La differenza chiave riguarda quanto le istanze devono essere identiche tra loro.

| **Modalità** | **Caratteristiche delle istanze** | **Quando usarla** |
|---|---|---|
| **Uniform** | Tutte le istanze di macchina virtuale vengono create dalla stessa immagine del sistema operativo di base e dalla stessa configurazione. | Workload omogenei e a larga scala in cui serve il massimo dell'automazione su istanze identiche. |
| **Flexible** | Le VM possono usare immagini, dimensioni (size) o configurazioni diverse all'interno dello stesso scale set. | Scenari che richiedono maggiore eterogeneità e controllo sulle singole istanze. |

> **Importante**: la modalità di orchestrazione deve essere scelta quando lo scale set viene creato e condiziona le opzioni disponibili in seguito. Valuta quindi in anticipo se ti serve l'uniformità totale (Uniform) o la flessibilità di mescolare configurazioni diverse (Flexible).
_(infoBox)_

### 5.2.8 — Creare i Virtual Machine Scale Sets

I **Virtual Machine Scale Sets** si creano direttamente nel portale di Azure. In fase di creazione decidi quante macchine virtuali vuoi e di quale dimensione, e indichi le preferenze relative all'uso delle istanze **Azure Spot**, dei **Azure managed disks** (dischi gestiti) e delle politiche di allocazione. Capire queste impostazioni serve a configurare un set che bilanci correttamente costi, prestazioni e resilienza fin dal primo deployment.

Nel portale di Azure ci sono diversi parametri da configurare per portare a termine la creazione di un Virtual Machine Scale Sets.

![Creazione di un Virtual Machine Scale Set nel portale di Azure](img/implement-scale-sets-61516afb.png) _(dimensioni: 831×592 px)_
*Figura 97: La pagina di creazione dei Virtual Machine Scale Sets nel portale di Azure.* _(caption)_

**Impostazioni di base (scheda Basics)** _(stepTitle)_

Le impostazioni principali definiscono la natura del set e delle macchine virtuali che ne faranno parte:

- **Orchestration mode** (modalità di orchestrazione): determina come lo scale set gestisce le macchine virtuali. La modalità **Flexible** è quella predefinita e consigliata per i nuovi deployment, perché offre maggiore flessibilità nella gestione delle singole VM. Per la maggior parte dei nuovi carichi di lavoro conviene accettare il valore predefinito Flexible, a meno che tu non abbia un requisito specifico che imponga istanze identiche tra loro.
- **Image** (immagine): seleziona il sistema operativo di base o l'applicazione da installare sulla VM. È il punto di partenza che definisce cosa eseguirà ciascuna istanza.
- **VM Architecture** (architettura della VM): Azure consente di scegliere tra macchine virtuali basate su **x64** o su **Arm64** per eseguire le applicazioni. Le VM x64 garantiscono la massima compatibilità software, mentre le VM Arm64 offrono fino al 50% di rapporto prezzo/prestazioni migliore rispetto alle VM x64 equivalenti. La scelta dipende quindi dal compromesso tra compatibilità e convenienza che il tuo carico di lavoro richiede.
- **Size** (dimensione): seleziona la dimensione della VM più adatta al carico di lavoro da eseguire. La dimensione scelta determina fattori come potenza di elaborazione, memoria e capacità di archiviazione. Azure mette a disposizione un'ampia gamma di dimensioni per molti tipi di utilizzo e applica una tariffa oraria basata sulla dimensione della VM e sul sistema operativo.

**Impostazioni avanzate (scheda Advanced)** _(stepTitle)_

Sotto la scheda **Advanced** puoi configurare anche il comportamento di distribuzione delle istanze:

- **Spreading algorithm** (algoritmo di distribuzione): determina come le VM dello scale set vengono bilanciate tra i **fault domain**. Questo parametro incide direttamente sulla resilienza del set in caso di guasti hardware.

La scelta dell'algoritmo di distribuzione si riduce a due opzioni che si comportano in modo diverso quando i fault domain disponibili sono pochi:

| **Algoritmo** | **Comportamento** | **Quando i fault domain sono meno di cinque** |
|---|---|---|
| **Max spreading** | Le VM vengono distribuite sul maggior numero possibile di fault domain in ciascuna zona. | Il deployment dello scale set viene comunque completato con successo. |
| **Fixed spreading** | Le VM vengono sempre distribuite su esattamente cinque fault domain. | Il deployment dello scale set fallisce, perché non riesce a soddisfare il vincolo dei cinque fault domain. |

> **Importante**: Microsoft consiglia di usare **Max spreading** per la propria implementazione, perché evita che il deployment fallisca quando in una zona sono disponibili meno di cinque fault domain.
_(infoBox)_

### 5.2.9 — Implementare la scalabilità automatica

Una delle caratteristiche più potenti dei **Virtual Machine Scale Sets** è la capacità di aumentare o diminuire automaticamente il numero di istanze di macchina virtuale che eseguono la tua applicazione. Questo meccanismo si chiama *scalabilità automatica* (autoscaling) e ti permette di adattare dinamicamente la configurazione per rispondere alle variazioni del carico di lavoro.

Il valore di questo approccio sta tutto nell'equilibrio tra prestazioni e costi. Quando la domanda è bassa, la scalabilità automatica riduce al minimo il numero di istanze inutili che restano accese: paghi solo per quello che serve davvero. Quando la domanda cresce, vengono aggiunte automaticamente nuove istanze, in modo che i tuoi clienti continuino a ricevere un livello di prestazioni accettabile senza alcun intervento manuale.

![Scale set che scala tra un numero minimo e massimo di VM](img/autoscale-45b054e0.png) _(dimensioni: 751×219 px)_
*Figura 98: Un'implementazione di Virtual Machine Scale Sets che scala automaticamente tra un minimo (ad esempio due VM) e un massimo (ad esempio cinque VM) in base alla domanda del carico di lavoro.* _(caption)_

**Aspetti da considerare quando si usa la scalabilità automatica** _(stepTitle)_

Prima di applicare l'autoscaling a uno scenario reale, ad esempio il sito web della tua azienda, vale la pena ragionare sui diversi modi in cui questa funzionalità può tornarti utile.

- **Capacità regolata automaticamente**: puoi creare regole di scalabilità che definiscono il livello di prestazioni accettabile per garantire una buona esperienza al cliente. Quando le soglie definite vengono raggiunte, le regole di autoscaling intervengono automaticamente per adeguare la capacità del tuo scale set. Il punto chiave è che sei tu a stabilire cosa significa "prestazione accettabile", e il sistema fa il resto.
- **Scale out (scalabilità orizzontale in aumento)**: se la domanda verso la tua applicazione cresce, aumenta anche il carico sulle istanze esistenti. Se questo aumento è costante nel tempo, e non un picco momentaneo, puoi configurare le regole per incrementare il numero di istanze. La distinzione tra carico persistente e picco temporaneo è importante: non vuoi che il sistema reagisca a ogni breve variazione.
- **Scale in (scalabilità orizzontale in riduzione)**: di sera o nel fine settimana la domanda potrebbe calare. Se la riduzione del carico si mantiene costante per un certo periodo, puoi configurare le regole per diminuire il numero di istanze. L'azione di scale-in abbatte i costi di esecuzione dello scale set, perché mantieni attive solo le istanze necessarie a soddisfare la domanda attuale.
- **Eventi pianificati**: oltre a reagire al carico, puoi pianificare eventi per aumentare o diminuire la capacità in momenti prestabiliti. È utile quando conosci in anticipo i picchi prevedibili, come l'inizio della giornata lavorativa o una campagna promozionale a orario fisso.
- **Riduzione dell'overhead di gestione**: usare i Virtual Machine Scale Sets con la scalabilità automatica diminuisce il carico di lavoro amministrativo necessario per monitorare e ottimizzare le prestazioni dell'applicazione. È il sistema a occuparsi di osservare i parametri e ad adeguarsi, liberandoti da un monitoraggio manuale continuo.

> **Nota**: la scalabilità automatica può combinare regole basate su metriche (che reagiscono al carico effettivo) ed eventi pianificati (che agiscono a orari fissi). Le due strategie non si escludono e spesso vengono usate insieme per coprire sia i picchi prevedibili sia quelli imprevisti.
_(infoBox)_

### 5.2.10 — Configurare la scalabilità automatica

Quando crei un'implementazione di **Azure Virtual Machine Scale Sets** tramite il portale di Azure, devi decidere come il set deve variare il numero di macchine virtuali nel tempo. Hai due strade: regolare manualmente la capacità oppure affidarti alla scalabilità automatica (autoscale). La logica di fondo è semplice: un set di macchine ha senso solo se sa adattarsi al carico, perché aggiungere istanze quando il traffico cresce evita rallentamenti, mentre rimuoverle quando il carico cala riduce i costi. Per ottenere prestazioni ottimali conviene definire sempre un numero minimo, massimo e predefinito di istanze da utilizzare: in questo modo poni dei limiti chiari entro cui il sistema può muoversi in autonomia.

Nel portale di Azure puoi selezionare la modalità di scalabilità (scaling mode).

![Impostazioni per la scelta del metodo di scalabilità](img/scale-methods.png) _(dimensioni: 651×252 px)_
*Figura 99: Le impostazioni per selezionare il metodo di scalabilità nel portale di Azure.* _(caption)_

**Modalità di scalabilità (scaling mode)** _(stepTitle)_

Le due modalità disponibili rispondono a esigenze diverse: la prima ti dà controllo totale ma richiede interventi manuali, la seconda delega ad Azure la reattività al carico.

- **Aggiornamento manuale della capacità (Manually update the capacity)**: mantiene un numero fisso di istanze. Imposti il valore di **Instance count** sul numero di macchine virtuali desiderate nel set di scalabilità (da 0 a 1000). Puoi inoltre configurare la **Scale-in policy**, ovvero l'ordine con cui le macchine virtuali vengono selezionate per l'eliminazione quando il set viene ridotto. Ad esempio, potresti bilanciare le rimozioni tra le zone di disponibilità e poi eliminare la macchina virtuale con l'ID istanza più alto.
- **Scalabilità automatica (Autoscaling)**: scala in base a una metrica della CPU oppure secondo una pianificazione temporale.

**Configurare la scalabilità automatica** _(stepTitle)_

La scalabilità automatica si basa su una condizione di scalabilità (scaling condition): è la regola che descrive quando aggiungere o togliere istanze e di quante alla volta. Definire bene questi parametri è importante, perché soglie troppo aggressive farebbero oscillare continuamente il numero di macchine, mentre soglie troppo prudenti renderebbero il set lento a reagire ai picchi di traffico.

![Impostazioni per la configurazione delle istanze di VM e dell'autoscale](img/implement-autoscale-74d25345.png) _(dimensioni: 551×648 px)_
*Figura 100: Le impostazioni per configurare le istanze di macchina virtuale e la scalabilità automatica nel portale di Azure.* _(caption)_

I parametri principali da impostare sono i seguenti:

- **Default instance count (numero di istanze predefinito).** Il numero iniziale di macchine virtuali distribuite nel set di scalabilità (da 0 a 1000).
- **Instance limit (limite di istanze).** Il numero minimo di istanze fino al quale questa condizione può ridurre il set e il numero massimo fino al quale può espanderlo. Questi limiti definiscono i confini entro cui l'autoscale è autorizzato a operare.
- **Scale out (espansione).** La soglia percentuale di utilizzo della CPU che fa scattare la regola di espansione automatica, insieme al numero di istanze da aggiungere ogni volta che la regola si attiva.
- **Scale in (riduzione).** La soglia percentuale di utilizzo della CPU che fa scattare la regola di riduzione automatica, insieme al numero di istanze da rimuovere ogni volta che la regola si attiva.
- **Query duration (durata della query).** È l'intervallo di tempo su cui il motore di autoscale calcola la media di utilizzo della metrica, guardando indietro nel passato. Questa finestra di osservazione serve a far stabilizzare la metrica, così da evitare che picchi momentanei provochino scalabilità ingiustificate.
- **Schedule (pianificazione).** Permette di specificare date di inizio e di fine. Puoi anche ripetere la pianificazione in giorni specifici, utile ad esempio per prepararti in anticipo a un carico previsto in determinati orari o giorni della settimana.

> **Suggerimento**: combinare i limiti minimo e massimo con una soglia di CPU ben tarata e una query duration adeguata è ciò che rende l'autoscale efficace: i limiti impediscono comportamenti estremi, la soglia governa la reattività e la durata della query filtra i falsi allarmi.
_(infoBox)_
