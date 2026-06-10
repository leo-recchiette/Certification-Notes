# Modulo 4 — Implementare e gestire l'archiviazione in Azure

_Questo percorso illustra le soluzioni di archiviazione in Azure: dalla configurazione degli account alla gestione di blob, file e sicurezza dei dati. La scelta corretta è cruciale per prestazioni, costi, durabilità e conformità normativa._

**Immagini usate in questo modulo:**
- `img/storage-types.png` (869×216) — Figura 62
- `img/explore-storage-services.png` (506×291) — Figura 63
- `img/locally-redundant-storage.png` (273×285) — Figura 64
- `img/zone-redundant-storage.png` (503×501) — Figura 65
- `img/geo-redundant-storage.png` (731×299) — Figura 66
- `img/geo-zone-redundant-storage.png` (960×541) — Figura 67
- `img/secure-storage-access-d32868ef.png` (867×338) — Figura 68
- `img/service-endpoints-portal-lrg.png` (820×559) — Figura 69
- `img/blob-storage-94fb52b8.png` (660×302) — Figura 70
- `img/blob-containers-a243a2b9.png` (741×307) — Figura 71
- `img/blob-lifecycle-2854d812.png` (633×549) — Figura 72
- `img/blob-object-replication-21fd3c07.png` (540×338) — Figura 73
- `img/upload-blobs-7ad73d30.png` (410×599) — Figura 74
- `img/blob-storage-explorer.png` (639×341) — Figura 75
- `img/blob-pricing.png` (580×310) — Figura 76
- `img/storage-defense.png` (975×253) — Figura 77
- `img/secure-encryption-e3b68445.png` (703×481) — Figura 78
- `img/customer-keys-b24acc48.png` (1079×547) — Figura 79
- `img/storage-insights.png` (1248×635) — Figura 80
- `img/configure-classic-files.png` (623×511) — Figura 81
- `img/file-share-snapshot-cbda2136.png` (709×406) — Figura 82
- `img/files-enable-soft-delete-new-ui.png` (1200×890) — Figura 83
- `img/storage-explorer.png` (753×322) — Figura 84
- `img/connection-options-1df9c8f7.png` (567×579) — Figura 85
- `img/attach-name-key-13fe3ba3.png` (412×354) — Figura 86
- `img/file-sync-1d3fd2e7.png` (2402×1544) — Figura 87

---

## 4.1 — Configurare gli account di archiviazione

### 4.1.1 — Introduzione

**Azure Storage** è la soluzione di archiviazione su cloud di Microsoft pensata per gli scenari di gestione dati moderni. Immagina di lavorare per una grande azienda di e-commerce che deve archiviare e distribuire un numero enorme di immagini di prodotto ai propri clienti: serve una soluzione scalabile e affidabile, capace di gestire un traffico elevato, di garantire la durabilità dei dati e di ripristinarli rapidamente in caso di interruzione del servizio.

In questa sezione imparerai a configurare gli **Storage Account** e a scegliere il tipo di archiviazione più adatto in Azure. Vedrai come identificare le caratteristiche e i casi d'uso degli account di archiviazione, come selezionare tra i diversi tipi di **Azure Storage** e crearli, come scegliere una strategia di replica per proteggere i dati e come configurare l'accesso di rete sicuro agli endpoint di archiviazione. L'obiettivo è fornire all'amministratore Azure le conoscenze e le competenze necessarie per configurare e gestire in modo efficace gli account di archiviazione.

### 4.1.2 — Implementare Azure Storage

**Azure Storage** è la soluzione di archiviazione cloud di Microsoft pensata per gli scenari di storage moderni. Il suo valore non sta solo nel "mettere i file da qualche parte": è un servizio pronto per l'AI che mette a disposizione un object store enormemente scalabile, un file system per il cloud, un message store per la messaggistica affidabile e un archivio NoSQL. In altre parole, un'unica piattaforma copre esigenze molto diverse, dalla condivisione di file ai dati di lavoro delle applicazioni.

Capire **Azure Storage** è importante perché è il fondamento su cui poggiano molti altri servizi Azure. Lo usano le applicazioni come le condivisioni di file (file shares), gli sviluppatori per i dati di lavoro (siti web, app mobili, applicazioni desktop), ma anche le macchine virtuali IaaS e i servizi cloud PaaS si appoggiano su di esso. Sapere come è organizzato ti aiuta a scegliere il tipo di archiviazione giusto per ogni carico di lavoro.

**Le tre categorie di dati gestite da Azure Storage** _(stepTitle)_

Il modo più efficace per ragionare su **Azure Storage** è pensarlo come supporto a tre categorie di dati: dati strutturati, dati non strutturati e dati delle macchine virtuali. Questa distinzione non è accademica: ti guida nella scelta del servizio corretto, perché ogni categoria ha caratteristiche, formati e servizi dedicati. Mentre leggi, prova a riconoscere quali di questi tipi sono già presenti nella tua organizzazione.

![Tipi di dati gestiti da Azure Storage](img/storage-types.png) _(dimensioni: 869×216 px)_
*Figura 62: Dati strutturati e non strutturati gestiti da una macchina virtuale.* _(caption)_

| **Categoria** | **Descrizione** | **Esempi di archiviazione** |
| --- | --- | --- |
| **Dati delle macchine virtuali** | I dati delle macchine virtuali comprendono dischi e file. I dischi sono storage a blocchi persistente per le VM IaaS di Azure; i file sono condivisioni di file completamente gestite nel cloud. | Lo storage per i dati delle VM è fornito tramite gli **Azure managed disks**. I dischi dati vengono usati dalle VM per archiviare contenuti come file di database, contenuto statico di siti web o codice applicativo personalizzato. Il numero di dischi dati che puoi aggiungere dipende dalla dimensione (size) della VM. |
| **Dati non strutturati** | I dati non strutturati sono i meno organizzati. Il loro formato è definito *non relazionale* (nonrelational). | I dati non strutturati possono essere archiviati con **Azure Blob Storage** e **Azure Data Lake Storage**. **Blob Storage** è un object store cloud altamente scalabile basato su REST. **Azure Data Lake Storage** è l'Hadoop Distributed File System (HDFS) offerto come servizio. |
| **Dati strutturati** | I dati strutturati sono archiviati in formato relazionale con uno schema condiviso. Spesso risiedono in una tabella di database con righe, colonne e chiavi. Le tabelle sono un archivio NoSQL con scalabilità automatica. | I dati strutturati possono essere archiviati con **Azure Table Storage**, **Azure Cosmos DB** e **Azure SQL Database**. **Azure Cosmos DB** è un servizio di database distribuito a livello globale; **Azure SQL Database** è un database-as-a-service completamente gestito basato su SQL. |

**Caratteristiche da valutare quando si usa Azure Storage** _(stepTitle)_

Mentre prepari il tuo piano di configurazione per **Azure Storage**, è utile tenere a mente le caratteristiche principali del servizio. Ognuna di esse risponde a un'esigenza concreta — protezione dei dati, sicurezza, crescita, semplicità di gestione — e capirle ti permette di sfruttare al meglio la piattaforma anziché reinventare soluzioni già fornite da Azure.

- **Durabilità e disponibilità**: **Azure Storage** è durevole e altamente disponibile. La ridondanza (redundancy) mantiene i dati al sicuro durante i guasti hardware transitori. Replicando i dati tra datacenter o aree geografiche, sei protetto anche da catastrofi locali o disastri naturali: i dati replicati restano altamente disponibili anche durante un'interruzione imprevista.
- **Accesso sicuro**: **Azure Storage** cifra tutti i dati e offre un controllo granulare su chi può accedervi.
- **Scalabilità**: il servizio è progettato per essere enormemente scalabile, così da soddisfare le esigenze di archiviazione e di prestazioni delle applicazioni moderne.
- **Gestibilità**: Microsoft Azure si occupa per te della manutenzione hardware, degli aggiornamenti e dei problemi critici, riducendo l'onere operativo.
- **Accessibilità dei dati**: i dati in **Azure Storage** sono accessibili da qualsiasi parte del mondo tramite HTTP o HTTPS. Microsoft fornisce SDK in vari linguaggi — .NET, Java, Node.js, Python, PHP, Ruby, Go — oltre alla REST API. È inoltre supportato lo scripting con **Azure PowerShell** o l'**Azure CLI**, mentre il portale di Azure e **Azure Storage Explorer** offrono soluzioni visive semplici per lavorare con i dati.
- **Supporto SFTP**: **Blob Storage** può usare SFTP (SSH File Transfer Protocol), così puoi continuare a usare i tuoi strumenti SFTP esistenti per spostare file direttamente da e verso i blob. Per usare SFTP devi abilitare lo spazio dei nomi gerarchico (hierarchical namespace, HNS): puoi attivarlo alla creazione dello storage account (scheda Advanced) oppure in seguito da Settings → Configuration.
- **Supporto del protocollo NFSv3**: **Blob Storage** è accessibile anche tramite NFSv3, che consente ai client Linux di montare un container come una condivisione NFS. NFSv3 può semplificare le migrazioni dai carichi di lavoro di file Linux verso Azure.
- **Preferenze di autorizzazione predefinite**: nel portale di Azure puoi abilitare **Default to Microsoft Entra authorization**. Con questa impostazione, il controllo degli accessi in base al ruolo (RBAC) diventa il metodo predefinito al posto delle chiavi di accesso condivise (shared access keys), migliorando la sicurezza.

> **Suggerimento**: impostare l'autorizzazione di **Microsoft Entra** come predefinita riduce la dipendenza dalle chiavi di accesso condivise, che sono più difficili da ruotare e da tracciare rispetto alle identità RBAC.
_(infoBox)_

### 4.1.3 — Esplorare i servizi di Azure Storage

Un **Storage Account** in Azure non è un contenitore monolitico: al suo interno convivono quattro servizi di dati distinti, ciascuno progettato per un tipo di carico di lavoro diverso. Capire le differenze tra questi servizi è fondamentale perché la scelta sbagliata si traduce in costi più alti, prestazioni inadeguate o complessità inutile. In questa unità esaminiamo i dettagli di ciascun servizio, così da poter abbinare correttamente la tecnologia al problema da risolvere.

![I quattro tipi principali di Azure Storage](img/explore-storage-services.png) _(dimensioni: 506×291 px)_
*Figura 63: Diagramma dei quattro tipi principali di archiviazione di Azure: Blob, File, Code e Tabelle.* _(caption)_

**Azure Blob Storage** _(stepTitle)_

**Azure Blob Storage** è la soluzione di archiviazione a oggetti di Microsoft per il cloud. È ottimizzato per memorizzare quantità enormi di dati non strutturati o *non relazionali*, come testo o dati binari. Il termine "a oggetti" è la chiave: a differenza di un file system tradizionale, ogni elemento (blob) è un oggetto autonomo identificato da un URL, il che rende il servizio estremamente scalabile e accessibile via web.

Blob Storage è ideale per scenari come:

- Servire immagini o documenti direttamente a un browser.
- Memorizzare file per l'accesso distribuito.
- Trasmettere in streaming video e audio.
- Archiviare dati per backup e ripristino, disaster recovery e archiviazione a lungo termine.
- Conservare dati destinati all'analisi da parte di un servizio locale o ospitato in Azure.

Gli oggetti in Blob Storage sono accessibili da qualsiasi parte del mondo tramite HTTP o HTTPS. Gli utenti o le applicazioni client possono accedere ai blob tramite URL, l'API REST di Azure Storage, Azure PowerShell, l'interfaccia della riga di comando di Azure (Azure CLI) oppure una libreria client di Azure Storage. Le librerie client sono disponibili per molti linguaggi, tra cui .NET, Java, Node.js, Python, PHP e Ruby.

**Azure Files** _(stepTitle)_

**Azure Files** consente di configurare condivisioni file di rete a disponibilità elevata. Le condivisioni sono accessibili tramite il protocollo Server Message Block (**SMB**) e il protocollo Network File System (**NFS**). Il vantaggio rispetto a Blob Storage è che più macchine virtuali possono condividere gli stessi file con accesso in lettura e scrittura, esattamente come avverrebbe con una cartella condivisa di rete tradizionale. È anche possibile leggere i file tramite l'interfaccia REST o le librerie client di archiviazione.

Le condivisioni file sono utili in molti scenari comuni:

- Molte applicazioni locali usano condivisioni file. Questa caratteristica semplifica la migrazione in Azure di tali applicazioni: se si monta la condivisione file sulla stessa lettera di unità usata dall'applicazione locale, la parte dell'applicazione che accede alla condivisione dovrebbe funzionare con modifiche minime, se non nulle.
- I file di configurazione possono essere archiviati su una condivisione e letti da più macchine virtuali. Anche strumenti e utilità usati da più sviluppatori di un gruppo possono risiedere su una condivisione, garantendo che tutti li trovino e usino la stessa versione.
- Log diagnostici, metriche e dump degli arresti anomali sono tre esempi di dati che si possono scrivere su una condivisione file per poi elaborarli o analizzarli in un secondo momento.

L'autenticazione per l'accesso alla condivisione file avviene tramite le credenziali dello **Storage Account**.

> **Importante**: tutti gli utenti che hanno montato la condivisione dispongono di accesso completo in lettura/scrittura alla condivisione stessa.
_(infoBox)_

**Azure Queue Storage** _(stepTitle)_

**Azure Queue Storage** viene usato per archiviare e recuperare messaggi. Ogni messaggio di coda può avere una dimensione massima di 64 KB e una coda può contenere milioni di messaggi. Le code servono a memorizzare elenchi di messaggi da elaborare in modo asincrono: il loro scopo principale è disaccoppiare i componenti di un'applicazione, in modo che chi produce il lavoro e chi lo elabora non debbano operare alla stessa velocità.

Si consideri uno scenario in cui si desidera permettere ai clienti di caricare immagini e generare una miniatura (thumbnail) per ciascuna di esse. Si potrebbe far attendere il cliente durante la creazione delle miniatura, ma è un'esperienza scadente. L'alternativa è usare una coda: quando il cliente completa il caricamento, si scrive un messaggio nella coda. Successivamente, una **Azure Function** recupera il messaggio dalla coda e crea le miniatura. In questo modo le diverse parti dell'elaborazione possono essere scalate separatamente, offrendo maggiore controllo nella messa a punto della configurazione.

**Azure Table Storage** _(stepTitle)_

**Azure Table Storage** è un servizio che archivia dati strutturati non relazionali (noti anche come dati NoSQL strutturati) nel cloud, fornendo un archivio chiave/attributo con un design senza schema (*schemaless*). Proprio perché Table Storage non impone uno schema fisso, è semplice adattare i dati man mano che le esigenze dell'applicazione evolvono, senza dover modificare una struttura rigida di tabelle.

L'accesso ai dati di Table Storage è rapido e conveniente per molti tipi di applicazioni, ed è in genere meno costoso del tradizionale SQL a parità di volumi di dati. Oltre al servizio Azure Table Storage esistente, è disponibile anche la più recente offerta **Azure Cosmos DB Table API**, che fornisce tabelle ottimizzate per la velocità effettiva (throughput), distribuzione globale e indici secondari automatici.

**Aspetti da considerare nella scelta dei servizi di Azure Storage** _(stepTitle)_

Mentre si definisce il piano di configurazione per Azure Storage, conviene ragionare sulle caratteristiche distintive di ciascun tipo di archiviazione e su quali opzioni rispondano meglio alle esigenze dell'applicazione. La tabella seguente riassume il criterio guida per ciascun servizio.

| **Esigenza** | **Servizio consigliato** | **Perché** |
|---|---|---|
| **Grandi volumi di dati non strutturati** | Azure Blob Storage | Ottimizzato per quantità enormi di dati non strutturati; gli oggetti sono accessibili da qualsiasi parte del mondo via HTTP/HTTPS. Ideale per servire dati a un browser, streaming e backup/ripristino. |
| **Archiviazione a disponibilità elevata** | Azure Files | Supporta condivisioni file di rete ad alta disponibilità. Le app locali usano condivisioni file per una migrazione semplice; le credenziali dello Storage Account autenticano l'accesso garantendo i corretti permessi di lettura/scrittura. |
| **Archiviazione di messaggi** | Azure Queue Storage | Consente di archiviare grandi quantità di messaggi; comunemente usato per creare un arretrato (backlog) di lavoro da elaborare in modo asincrono. |
| **Dati strutturati non relazionali** | Azure Table Storage | Ideale per dati strutturati e non relazionali; offre tabelle ottimizzate per il throughput, distribuzione globale e indici secondari automatici. |

### 4.1.4 — Determinare i tipi di account di archiviazione

Quando si crea uno **Storage Account** in Azure, una delle prime scelte da compiere riguarda il *tipo* (o "kind") dell'account, perché questa decisione determina sia le prestazioni che il costo dell'archiviazione. Gli account di archiviazione generici (general purpose) si distinguono in due categorie fondamentali in base alla tecnologia hardware sottostante: **Standard** e **Premium**. Capire la differenza tra le due è essenziale perché influenza direttamente la latenza, il throughput e la spesa che sosterrai.

**Standard e Premium: la differenza nasce dall'hardware** _(stepTitle)_

La distinzione principale tra i due tipi dipende dal supporto fisico su cui i dati vengono salvati.

- **Standard**: questi account sono basati su dischi rigidi magnetici (HDD). Offrono il costo per GB più basso, il che li rende la scelta ideale quando devi archiviare grandi volumi di dati oppure quando i dati vengono consultati raramente. In altre parole, paghi poco ma accetti prestazioni più contenute.
- **Premium**: questi account sono basati su unità a stato solido (SSD) e garantiscono prestazioni con latenza bassa e costante. Sono pensati per scenari ad alta intensità di I/O, come i dischi delle macchine virtuali di Azure usati da applicazioni esigenti tipo i database. Qui il costo è più alto, ma in cambio ottieni velocità e prevedibilità delle prestazioni.

Il criterio di scelta, quindi, è un compromesso tra costo e prestazioni: usa **Standard** quando la priorità è risparmiare su grandi quantità di dati ad accesso poco frequente, e **Premium** quando l'applicazione richiede risposte rapide e costanti.

> **Nota**: non è possibile convertire un account Standard in un account Premium, né viceversa. Per cambiare tipo devi creare un nuovo account di archiviazione con il tipo desiderato e, se necessario, copiarvi i dati. Tutti i tipi di account di archiviazione sono comunque cifrati a riposo tramite Storage Service Encryption (SSE).
_(infoBox)_

**Le quattro varianti di account e i loro casi d'uso** _(stepTitle)_

In pratica, quando si passa dalla teoria (Standard vs Premium) alla creazione effettiva dell'account, ci si trova davanti a quattro varianti concrete. Una è di tipo Standard ed è quella generica adatta alla maggior parte degli scenari; le altre tre sono Premium e ognuna è ottimizzata per un tipo specifico di carico di lavoro. Il motivo di questa specializzazione è prestazionale: le SSD vengono "messe a disposizione" per il servizio che ne trae più beneficio (blob, file share o page blob). La tabella seguente riassume servizi supportati, opzioni di ridondanza e utilizzo consigliato di ciascuna variante.

| **Account di archiviazione** | **Servizi supportati** | **Opzioni di ridondanza** | **Utilizzo consigliato** |
| --- | --- | --- | --- |
| **Standard general-purpose v2** | **Azure Blob Storage** (incluso Data Lake Storage), Queue Storage, Table Storage e **Azure Files** | LRS, GRS, RA-GRS, ZRS, GZRS, RA-GZRS | Account di archiviazione standard per la maggior parte degli scenari: blob, condivisioni file, code, tabelle e dischi (page blob). |
| **Premium block blobs** | Blob Storage (incluso Data Lake Storage) | LRS, ZRS | Account Premium per blob a blocchi (block blob) e blob ad accodamento (append blob). Consigliato per applicazioni con elevati tassi di transazioni. Da preferire quando lavori con oggetti di piccole dimensioni o richiedi una latenza di archiviazione costantemente bassa. È progettato per scalare insieme alle applicazioni. |
| **Premium file shares** | Azure Files | LRS, ZRS | Account Premium dedicato alle sole condivisioni file. Consigliato per applicazioni aziendali o ad alte prestazioni e scalabilità. Da scegliere se hai bisogno del supporto sia per condivisioni file SMB (Server Message Block) sia NFS. |
| **Premium page blobs** | Solo page blob | Solo LRS | Account Premium ad alte prestazioni dedicato ai soli page blob. I page blob sono ideali per archiviare strutture dati basate su indici e dati sparsi, come sistemi operativi, dischi dati per macchine virtuali e database. |

Osservando la tabella si nota un dettaglio importante: le opzioni di ridondanza si riducono man mano che si sale di specializzazione. L'account **Standard general-purpose v2** supporta la gamma più ampia di repliche (fino alle versioni geo-ridondanti con accesso in lettura), mentre i **Premium page blobs** supportano solo LRS. Questo è un fattore da tenere presente nella progettazione, perché un account Premium molto specializzato offre prestazioni elevate ma minore flessibilità sulla resilienza geografica.

> **Importante**: gli amministratori che gestiscono sottoscrizioni Azure già esistenti potrebbero incontrare tipi di account legacy, come General-purpose v1 (GPv1) e i vecchi account BlobStorage. Microsoft consiglia di aggiornare gli account legacy a General-purpose v2 per accedere a tutte le funzionalità attuali. L'aggiornamento è supportato in-place tramite il portale di Azure, Azure CLI o PowerShell.
_(infoBox)_

### 4.1.5 — Determinare le strategie di replica

I dati contenuti in un **Azure Storage Account** vengono replicati sempre, in modo automatico, per garantire durabilità (durability) e alta disponibilità (high availability). La replica di **Azure Storage** crea copie dei dati per proteggerli da eventi pianificati e non pianificati: si va da guasti hardware temporanei, interruzioni di rete o di alimentazione, fino a disastri naturali su larga scala. Il punto da capire è il PERCHÉ: replicando i dati Azure riesce a rispettare lo SLA dello storage anche quando qualcosa si rompe, perché esiste sempre almeno un'altra copia utilizzabile.

La domanda chiave quando si sceglie una strategia di replica è: "fin dove voglio che i miei dati restino al sicuro?". La risposta determina dove vengono collocate le copie: all'interno dello stesso data center, in data center zonali distinti nella stessa region, oppure addirittura in region geograficamente separate. Più lontano si spingono le copie, maggiore è la protezione, ma cambiano anche costo, latenza e disponibilità delle funzionalità.

**Locally redundant storage (LRS)** _(stepTitle)_

![Storage LRS con tre copie](img/locally-redundant-storage.png) _(dimensioni: 273×285 px)_
*Figura 64: Storage LRS che mantiene tre copie dei dati all'interno di un singolo data center.* _(caption)_

Il **Locally redundant storage** (LRS) è l'opzione di replica con il costo più basso e, di conseguenza, offre la durabilità minore rispetto alle altre strategie. LRS mantiene tre copie dei dati, ma tutte all'interno di un unico data center. Il limite è proprio questo: se si verifica un disastro a livello di data center, ad esempio un incendio o un'alluvione, tutte le repliche potrebbero andare perse o risultare irrecuperabili, perché non esiste nessuna copia all'esterno di quella struttura.

Nonostante questi limiti, LRS resta appropriato in diversi scenari:

- L'applicazione memorizza dati che possono essere facilmente ricostruiti in caso di perdita.
- I dati cambiano continuamente, come in un feed in tempo reale, e conservarli non è essenziale.
- L'applicazione è vincolata a replicare i dati solo all'interno di una singola location per requisiti di governance dei dati.

**Zone redundant storage (ZRS)** _(stepTitle)_

![Storage ZRS con tre data center](img/zone-redundant-storage.png) _(dimensioni: 503×501 px)_
*Figura 65: Storage ZRS che replica i dati su tre data center in zone di disponibilità distinte della stessa region.* _(caption)_

Il **Zone redundant storage** (ZRS) replica i dati in modo sincrono su tre cluster di storage all'interno di una singola region. Ogni cluster è fisicamente separato dagli altri e risiede in una propria zona di disponibilità (availability zone). Ciascuna availability zone, e il cluster ZRS al suo interno, è autonoma e dispone di alimentazione e connettività di rete indipendenti. Il vantaggio concreto è che, archiviando i dati in un account ZRS, si continua ad accedere e a gestire i dati anche se un'intera zona diventa indisponibile, perché le altre due continuano a funzionare. ZRS offre inoltre prestazioni eccellenti e bassa latenza, dato che le copie restano comunque nella stessa region.

Da tenere presenti due aspetti operativi:

- ZRS non è attualmente disponibile in tutte le region.
- Passare a ZRS da un'altra opzione di replica richiede lo spostamento fisico dei dati da un singolo storage stamp a più stamp all'interno della region.

**Geo-redundant storage (GRS)** _(stepTitle)_

![Storage GRS con due data center](img/geo-redundant-storage.png) _(dimensioni: 731×299 px)_
*Figura 66: Storage GRS che replica i dati in una region secondaria distante centinaia di chilometri.* _(caption)_

Il **Geo-redundant storage** (GRS) replica i dati in una region secondaria, distante centinaia di chilometri dalla posizione primaria dei dati di origine. Questo fa un salto di qualità nella protezione: GRS garantisce un livello di durabilità più elevato anche in caso di interruzione che colpisce un'intera region. GRS è progettato per fornire almeno il 99,99999999999999% di durabilità, cioè **16 nove**. Con GRS abilitato, i dati restano durevoli anche in presenza di un'interruzione regionale completa o di un disastro in cui la region primaria non sia recuperabile.

Implementando GRS si scelgono due opzioni correlate:

- **GRS** replica i dati in un altro data center di una region secondaria. I dati nella region secondaria sono disponibili in lettura solo se Microsoft avvia un failover dalla region primaria a quella secondaria.
- **Read-access geo-redundant storage** (RA-GRS) si basa su GRS. RA-GRS replica i dati in un data center di una region secondaria e in più offre la possibilità di leggere dalla region secondaria. Con RA-GRS si può leggere dalla secondaria a prescindere dal fatto che Microsoft abbia avviato o meno un failover dalla primaria alla secondaria.

È utile capire COME avviene la replica per cogliere la differenza con LRS. Per un account con GRS o RA-GRS, tutti i dati vengono prima replicati con locally redundant storage: un aggiornamento viene innanzitutto applicato (commit) nella posizione primaria e replicato tramite LRS. Successivamente l'aggiornamento viene replicato in modo asincrono nella region secondaria tramite GRS, e anche nella secondaria i dati usano LRS. Sia la region primaria sia quella secondaria gestiscono le repliche su fault domain e upgrade domain separati all'interno di una storage scale unit. La storage scale unit è l'unità base di replica all'interno del data center e a quel livello la replica è fornita da LRS.

> **Nota**: la replica verso la region secondaria di GRS è asincrona. Questo significa che, in caso di disastro improvviso sulla primaria, potrebbe esserci una piccola finestra di dati non ancora replicati nella secondaria.
_(infoBox)_

**Geo-zone-redundant storage (GZRS)** _(stepTitle)_

![Storage GZRS su tre zone di disponibilità replicate in una region secondaria](img/geo-zone-redundant-storage.png) _(dimensioni: 960×541 px)_
*Figura 67: Storage GZRS che combina la ridondanza zonale nella region primaria con la replica geografica in una region secondaria.* _(caption)_

Il **Geo-zone-redundant storage** (GZRS) combina l'alta disponibilità dello zone-redundant storage con la protezione dalle interruzioni regionali tipica del geo-redundant storage. In pratica prende il meglio di ZRS e di GRS: i dati di un account GZRS vengono replicati su tre availability zone della region primaria e, contemporaneamente, replicati in una region geografica secondaria per la protezione dai disastri regionali. Ogni region di Azure è abbinata a un'altra region all'interno della stessa area geografica, formando insieme una coppia di region (regional pair).

Con un account GZRS si continua a leggere e scrivere dati se una availability zone diventa indisponibile o irrecuperabile; inoltre i dati restano durevoli anche durante un'interruzione regionale completa o un disastro in cui la region primaria non è recuperabile. GZRS è progettato per fornire almeno il 99,99999999999999% (16 nove) di durabilità degli oggetti nell'arco di un anno e offre gli stessi obiettivi di scalabilità di LRS, ZRS, GRS o RA-GRS. È possibile, opzionalmente, abilitare l'accesso in lettura ai dati nella region secondaria tramite **read-access geo-zone-redundant storage** (RA-GZRS).

> **Tip**: Microsoft raccomanda di usare GZRS per le applicazioni che richiedono coerenza, durabilità, alta disponibilità, prestazioni eccellenti e resilienza per il disaster recovery. Abilitare RA-GZRS per l'accesso in lettura a una region secondaria in caso di disastro regionale.
_(infoBox)_

**Aspetti da considerare nella scelta della strategia di replica** _(stepTitle)_

Per scegliere consapevolmente conviene confrontare l'ambito di durabilità e disponibilità delle varie strategie. La tabella seguente descrive alcuni fattori chiave del processo di replica: l'indisponibilità di un nodo all'interno di un data center, l'indisponibilità dell'intero data center (zonale o non zonale), un'interruzione che coinvolge tutta la region e, infine, la possibilità di accesso in lettura ai dati geo-replicati in una region remota durante un'indisponibilità regionale. Per ogni colonna sono indicati i tipi di account di storage supportati.

| **Nodo del data center non disponibile** | **Intero data center non disponibile** | **Interruzione dell'intera region** | **Accesso in lettura durante l'interruzione dell'intera region** |
| --- | --- | --- | --- |
| **LRS**, **ZRS**, **GRS**, **RA-GRS**, **GZRS**, **RA-GZRS** | **ZRS**, **GRS**, **RA-GRS**, **GZRS**, **RA-GZRS** | **GRS**, **RA-GRS**, **GZRS**, **RA-GZRS** | **RA-GRS**, **RA-GZRS** |

Leggendo la tabella da sinistra a destra si nota la logica progressiva: tutte le opzioni proteggono dal guasto di un singolo nodo, ma solo quelle con replica zonale o geografica reggono la perdita di un intero data center, solo quelle geografiche (GRS, RA-GRS, GZRS, RA-GZRS) sopravvivono a un'interruzione dell'intera region, e solo le varianti "read-access" (RA-GRS, RA-GZRS) consentono di leggere dalla secondaria mentre la primaria è fuori uso.

### 4.1.6 — Accedere all'archiviazione

Ogni oggetto che salvi in **Azure Storage** è raggiungibile tramite un indirizzo URL univoco. Capire come si compone questo indirizzo è importante perché spiega il modo in cui le applicazioni, gli SDK e gli strumenti localizzano i dati: non esiste un percorso "nascosto", ma un endpoint pubblico e prevedibile costruito a partire dal nome dello **Storage Account**.

La logica è la seguente: il nome del tuo Storage Account costituisce la porzione di _sottodominio_ dell'indirizzo, mentre il nome di dominio (specifico per ciascun servizio) costituisce la parte fissa. L'unione di sottodominio e dominio forma l'_endpoint_ del tuo account di archiviazione. In altre parole, il nome che scegli per l'account diventa parte integrante e permanente dell'URL con cui i dati vengono esposti.

**Endpoint predefiniti dei servizi** _(stepTitle)_

Ogni tipo di servizio di archiviazione (Blob, Table, Queue, File) ha un proprio dominio dedicato. Questo permette di indirizzare in modo distinto i diversi tipi di dato pur usando lo stesso nome di account.

Supponiamo che il nome dello Storage Account sia _mystorageaccount_. Gli endpoint predefiniti generati per i vari servizi Azure sono i seguenti:

| **Servizio** | **Endpoint predefinito** |
| --- | --- |
| **Container service** (Blob) | `//mystorageaccount.blob.core.windows.net` |
| **Table service** | `//mystorageaccount.table.core.windows.net` |
| **Queue service** | `//mystorageaccount.queue.core.windows.net` |
| **File service** | `//mystorageaccount.file.core.windows.net` |

**Costruire l'URL di un oggetto** _(stepTitle)_

L'URL per accedere a un oggetto specifico si ottiene aggiungendo all'endpoint la posizione (path) dell'oggetto all'interno dell'account. La struttura è quindi gerarchica: endpoint del servizio, seguito dal contenitore, seguito dal nome dell'oggetto.

Per esempio, per accedere al dato _myblob_ contenuto nella posizione _mycontainer_ del tuo Storage Account, l'indirizzo URL da usare è:

```
//mystorageaccount.blob.core.windows.net/mycontainer/myblob
```

> **Nota**: il nome dello Storage Account deve essere univoco a livello globale, proprio perché diventa parte di un endpoint pubblico raggiungibile su Internet. Per questo non puoi usare un nome già occupato da un altro account.
_(infoBox)_

**Configurare domini personalizzati** _(stepTitle)_

Gli endpoint predefiniti (del tipo `<storage-account-name>.blob.core.windows.net`) funzionano sempre, ma in molti scenari pubblici è preferibile mostrare agli utenti un dominio aziendale invece di un URL tecnico di Azure. Per questo motivo è possibile configurare un _dominio personalizzato_ (custom domain) per accedere ai dati blob del tuo account.

Mappando un dominio e un sottodominio personalizzati, ad esempio `www.contoso.com`, sull'endpoint blob (o web) dello Storage Account, gli utenti potranno usare quel dominio aziendale per accedere ai dati blob. Il vantaggio è duplice: un indirizzo più leggibile e coerente con il brand, e la possibilità di nascondere i dettagli infrastrutturali sottostanti.

Il meccanismo si chiama **mapping diretto** (direct mapping) e consente di abilitare un dominio personalizzato per un sottodominio verso uno Storage Account. Con questo approccio si crea un record `CNAME` che punta dal sottodominio allo Storage Account.

L'esempio seguente mostra come un sottodominio viene mappato su uno Storage Account creando un record `CNAME` nel sistema DNS (Domain Name System):

- Sottodominio: `blobs.contoso.com`
- Storage Account: `<storage account>.blob.core.windows.net`
- Record `CNAME` diretto: `contosoblobs.blob.core.windows.net`

> **Importante**: il dominio personalizzato è disponibile per i dati blob (e per l'endpoint web statico), non per tutti i servizi indistintamente. La risoluzione avviene tramite DNS, quindi richiede di avere il controllo sul dominio per poter creare il record `CNAME`.
_(infoBox)_

### 4.1.7 — Proteggere gli endpoint di archiviazione

Quando un account di archiviazione viene creato, per impostazione predefinita è raggiungibile tramite il suo endpoint pubblico da qualunque rete. In molti scenari aziendali questo non è accettabile: vogliamo che i dati siano accessibili solo dalle reti di cui ci fidiamo. Per questo Azure mette a disposizione strumenti che permettono di configurare gli endpoint del servizio e di limitare l'accesso di rete all'account. Ogni servizio Azure richiede passaggi specifici per impostare questi controlli.

**Limitare l'accesso con firewall e reti virtuali** _(stepTitle)_

Per accedere a queste impostazioni nel tuo account di archiviazione utilizzi la sezione **Firewalls and virtual networks** (Firewall e reti virtuali). Qui aggiungi le reti virtuali che devono avere accesso al servizio per l'account. L'effetto pratico è importante: questa impostazione limita l'accesso al tuo **Storage Account** a subnet specifiche di reti virtuali oppure a indirizzi IP pubblici ben definiti. In altre parole, sposti l'account da "aperto a tutti" a "aperto solo a chi conosco", riducendo drasticamente la superficie di attacco esposta su internet.

![Impostazioni Firewall e reti virtuali dello Storage Account nel portale Azure](img/secure-storage-access-d32868ef.png) _(dimensioni: 867×338 px)_
*Figura 68: Impostazioni Firewalls and virtual networks dello Storage Account nel portale Azure.* _(caption)_

**Gli endpoint del servizio e gli URL delle risorse** _(stepTitle)_

Gli endpoint del servizio di un account di archiviazione forniscono l'URL di base per qualsiasi oggetto blob, queue, table o file all'interno di **Azure Storage**. Questo URL di base è il punto di partenza che usi per costruire l'indirizzo di una qualunque risorsa: conoscendolo, puoi comporre l'indirizzo completo aggiungendo il nome del contenitore e dell'oggetto. È quindi un elemento fondamentale sia per accedere ai dati sia per ragionare su come metterli in sicurezza.

![URL degli endpoint del servizio nel portale Azure](img/service-endpoints-portal-lrg.png) _(dimensioni: 820×559 px)_
*Figura 69: URL degli endpoint del servizio dello Storage Account visualizzati nel portale Azure.* _(caption)_

**Cosa sapere sulla configurazione degli endpoint del servizio** _(stepTitle)_

Ecco alcuni aspetti da tenere presenti quando configuri le impostazioni di accesso al servizio:

- Puoi configurare il servizio per consentire l'accesso a uno o più intervalli di IP pubblici.
- Le subnet e le reti virtuali devono trovarsi nella stessa area geografica (region) o nella coppia di aree (region pair) del tuo account di archiviazione. Questo vincolo è importante in fase di progettazione: se la rete virtuale è in un'altra area, non potrà essere usata come origine attendibile per l'account.

> **Importante**: assicurati di testare l'endpoint del servizio e di verificare che limiti effettivamente l'accesso come previsto. Una regola configurata ma non collaudata può lasciare aperti accessi indesiderati o, al contrario, bloccare traffico legittimo.
_(infoBox)_

**Cosa sapere sulla configurazione degli endpoint privati** _(stepTitle)_

Oltre agli endpoint del servizio, **Azure Storage** supporta gli endpoint privati (private endpoint) per una sicurezza e un isolamento di rete più elevati. Gli endpoint privati sono l'approccio consigliato per i carichi di lavoro di produzione che richiedono un accesso sicuro.

Il funzionamento è diverso a livello concettuale: un endpoint privato utilizza un indirizzo IP privato preso dalla tua rete virtuale per "portare" il servizio di archiviazione di Azure dentro la tua VNet. Di conseguenza, tutto il traffico tra la VNet e il servizio di archiviazione transita sulla rete backbone di Microsoft, eliminando l'esposizione alla rete internet pubblica. Questo è il motivo per cui rappresenta la scelta più robusta dal punto di vista della conformità e dell'isolamento.

**Differenze chiave rispetto agli endpoint del servizio** _(stepTitle)_

La tabella seguente riassume quando preferire un approccio rispetto all'altro:

| **Caratteristica** | **Endpoint privato (private endpoint)** | **Endpoint del servizio (service endpoint)** |
|---|---|---|
| **Indirizzamento** | Assegna all'account di archiviazione un IP privato preso dalla tua VNet | L'account resta sul proprio endpoint pubblico |
| **Percorso del traffico** | Tutto il traffico rimane all'interno della rete backbone di Microsoft | L'accesso è limitato a VNet e subnet specifiche, con parziale accesso da internet pubblico |
| **Quando usarlo** | Carichi di lavoro di produzione che richiedono isolamento di rete completo e requisiti di conformità | Scenari di sviluppo o quando serve una configurazione più semplice con un certo accesso da internet pubblico |

> **Suggerimento**: per approfondire puoi seguire il modulo di formazione "Secure and isolate access to Azure resources by using network security groups and service endpoints". Il modulo include una sandbox in cui puoi esercitarti a limitare l'accesso ad **Azure Storage** tramite gli endpoint del servizio.
_(infoBox)_

## 4.2 — Configurare Azure Blob Storage

### 4.2.1 — Introduzione

**Azure Blob Storage** è il servizio di Azure pensato per archiviare grandi quantità di dati oggetto non strutturati e pronti per l'AI. Per dati non strutturati si intendono informazioni che non aderiscono a un particolare modello o definizione, come testo o dati binari (immagini, video, documenti, backup). In questa sezione partiamo da uno scenario concreto: la nostra azienda media dispone di un'ampia libreria di clip video a cui si accede migliaia di volte al giorno, e il compito è configurare **Blob Storage** per gestire questi dati in modo efficiente ed economico.

Nel corso della sezione impareremo a comprendere lo scopo e i vantaggi di **Azure Blob Storage**, a creare e configurare gli **Storage Account**, e a gestire container e blob al loro interno. Vedremo inoltre come ottimizzare prestazioni e scalabilità sfruttando i livelli di accesso (access tier) per ridurre i costi, come definire una strategia di gestione del ciclo di vita (lifecycle management) per automatizzare lo spostamento e l'eliminazione dei dati più vecchi, come configurare la replica degli oggetti (object replication) per il failover, e infine come scegliere il piano tariffario più adatto alle nostre esigenze.

### 4.2.2 — Implementare Azure Blob Storage

**Azure Blob Storage** è il servizio di Azure dedicato alla memorizzazione di dati non strutturati nel cloud, gestiti sotto forma di oggetti (o *blob*). Il termine *blob* è l'acronimo di Binary Large Object, ovvero "grande oggetto binario": è il modo in cui Azure rappresenta qualsiasi insieme di byte che non ha uno schema predefinito. Per questo motivo **Azure Blob Storage** viene anche chiamato *object storage* o *container storage*.

Il punto chiave da comprendere è il concetto di dato *non strutturato*: a differenza di una tabella o di un database, un blob non deve rispettare alcun formato rigido. Può essere un documento, un'immagine, un video o un file di installazione. Questa flessibilità rende il servizio adatto a scenari molto diversi tra loro, dall'archiviazione di backup fino allo streaming multimediale.

**Caratteristiche di Azure Blob Storage** _(stepTitle)_

Per capire come configurare il servizio, conviene partire dalla sua architettura e dagli elementi che lo compongono.

![Architettura di Azure Blob Storage](img/blob-storage-94fb52b8.png) _(dimensioni: 660×302 px)_
*Figura 70: Architettura di Azure Blob Storage: lo Storage Account contiene i container, che a loro volta contengono i blob.* _(caption)_

- **Blob Storage** può memorizzare qualsiasi tipo di dato, testuale o binario. Alcuni esempi tipici sono documenti di testo, immagini, file video e programmi di installazione delle applicazioni.
- Per organizzare e gestire i dati, **Blob Storage** utilizza tre risorse disposte in modo gerarchico (è importante capire questa gerarchia perché determina come si indirizzano e si proteggono i dati):
  - Un **Azure Storage Account** (l'account di archiviazione), che rappresenta il contenitore di livello più alto e definisce l'endpoint univoco di accesso.
  - I **container** all'interno dello Storage Account, che funzionano come "cartelle" logiche per raggruppare i blob.
  - I **blob** veri e propri, ovvero gli oggetti che contengono i dati, collocati all'interno di un container.

Per implementare correttamente **Blob Storage** occorre definire diverse impostazioni. Ognuna di queste risponde a un'esigenza specifica (controllo degli accessi, ottimizzazione dei costi, continuità operativa) ed è oggetto delle prossime unità:

- Le opzioni del **container** dei blob (ad esempio il livello di accesso pubblico o privato).
- I **tipi di blob** e le relative opzioni di caricamento (upload).
- I **livelli di accesso** (access tier) di **Blob Storage**, che permettono di bilanciare costi e prestazioni in base alla frequenza con cui i dati vengono letti.
- Le **regole di ciclo di vita** (lifecycle) dei blob, che automatizzano lo spostamento o l'eliminazione dei dati nel tempo.
- Le opzioni di **replica degli oggetti** (object replication), per copiare i blob tra Storage Account diversi.

**Quando conviene usare Azure Blob Storage** _(stepTitle)_

Esistono molti casi d'uso comuni per **Blob Storage**. Esaminando i seguenti scenari è utile riflettere sulle proprie esigenze di archiviazione, perché aiutano a riconoscere quando questo servizio è la scelta giusta:

- **Caricamenti da browser**. Usa **Blob Storage** per servire immagini o documenti direttamente a un browser, ad esempio le risorse statiche di un sito web.
- **Accesso distribuito**. **Blob Storage** può archiviare file destinati a un accesso distribuito, come i file necessari durante un processo di installazione fruito da più utenti.
- **Streaming di dati**. È possibile trasmettere in streaming contenuti video e audio appoggiandosi a **Blob Storage**.
- **Archiviazione e ripristino**. **Blob Storage** è una soluzione ideale per conservare dati a fini di backup e ripristino, disaster recovery e archiviazione a lungo termine.
- **Accesso applicativo**. Puoi archiviare i dati in **Blob Storage** per poi analizzarli tramite un servizio on-premises oppure ospitato in Azure.

> **Nota**: la gerarchia Storage Account → container → blob è il modello mentale fondamentale di **Blob Storage**. Ogni blob è raggiungibile tramite un URL che combina il nome dello Storage Account, il nome del container e quello del blob.
_(infoBox)_

### 4.2.3 — Creare contenitori di blob

In **Azure Blob Storage** i blob non possono esistere "da soli": ogni blob deve obbligatoriamente risiedere all'interno di una risorsa chiamata contenitore (*container*). Il contenitore è quindi l'unità organizzativa fondamentale dello storage a blob e rappresenta il primo elemento che devi predisporre prima di poter caricare qualsiasi dato. Capire come funzionano i contenitori ti aiuta a progettare una struttura di archiviazione ordinata e con i giusti livelli di accesso.

**Contenitori e blob: i concetti chiave** _(stepTitle)_

Prima di creare un contenitore conviene fissare alcune caratteristiche di base, perché definiscono i limiti e la logica di organizzazione dei tuoi dati:

- Tutti i blob devono trovarsi all'interno di un contenitore: non esiste un blob "sciolto".
- I contenitori servono a organizzare lo storage a blob, raggruppando insieme blob correlati (per esempio per progetto, applicazione o tipo di dato).
- Un singolo contenitore può archiviare un numero illimitato di blob.
- Un **Storage Account** di Azure può contenere un numero illimitato di contenitori.
- Devi creare un contenitore prima di poter iniziare a caricare dati: è un passaggio obbligatorio, non opzionale.

Il fatto che sia contenitori sia blob siano illimitati significa che la struttura non ti pone vincoli di scala: il vero criterio progettuale non è "quanti", ma "come" organizzarli in modo logico e gestibile.

**Configurare un contenitore nel portale** _(stepTitle)_

Nel portale di Azure configuri alcune impostazioni per creare un contenitore all'interno di uno Storage Account. Mentre imposti questi valori, è utile ragionare fin da subito su come intendi organizzare i contenitori, perché nome e livello di accesso sono scelte che condizionano l'uso futuro dei dati.

![Pagina di creazione del contenitore e scelte del livello di accesso pubblico nel portale di Azure](img/blob-containers-a243a2b9.png) _(dimensioni: 741×307 px)_
*Figura 71: Pagina di creazione del contenitore e scelte del livello di accesso pubblico nel portale di Azure.* _(caption)_

**Nome del contenitore** _(stepTitle)_

Devi assegnare al contenitore un nome che sia univoco all'interno dello Storage Account. Le regole di denominazione sono rigide perché il nome diventa parte dell'URL con cui il contenitore viene indirizzato, quindi deve rispettare un formato compatibile con gli indirizzi web:

- Il nome può contenere solo lettere minuscole, numeri e trattini.
- Il nome deve iniziare con una lettera o un numero.
- La lunghezza minima del nome è di 3 caratteri.
- La lunghezza massima del nome è di 63 caratteri.

**Livello di accesso pubblico** _(stepTitle)_

Il livello di accesso (*Public access level*) stabilisce se il contenitore e i suoi blob possano essere raggiunti pubblicamente, cioè in forma anonima e senza autenticazione. Per impostazione predefinita i dati di un contenitore sono privati e visibili solo al proprietario dell'account: questa è la scelta più sicura ed è quella di default proprio per evitare esposizioni accidentali di dati. Esistono tre livelli di accesso tra cui scegliere:

| **Livello di accesso** | **Comportamento** |
|---|---|
| **Private** (predefinito) | Vieta qualsiasi accesso anonimo al contenitore e ai blob. |
| **Blob** | Consente l'accesso pubblico anonimo in sola lettura ai soli blob. |
| **Container** | Consente l'accesso pubblico anonimo in lettura e in elencazione (*list*) all'intero contenitore, blob inclusi. |

La differenza pratica tra i livelli **Blob** e **Container** sta nel fatto che con *Container* un utente anonimo può anche elencare il contenuto del contenitore (vedere quali blob esistono), mentre con *Blob* può solo leggere un blob di cui conosca già l'indirizzo. Per questo *Container* è il livello più permissivo e va usato con maggiore cautela.

> **Importante**: i livelli di accesso Blob e Container non hanno alcun effetto se l'impostazione **Allow Blob anonymous access** dello Storage Account non è abilitata. Quando è disabilitata, tutti i contenitori restano privati indipendentemente dal livello di accesso impostato sul singolo contenitore. Microsoft raccomanda di mantenere l'accesso anonimo disabilitato a livello di account, a meno che non si stiano servendo scenari di contenuti pubblici.
_(infoBox)_

Questa logica a due livelli (impostazione di account più impostazione del singolo contenitore) è una protezione voluta: anche se per errore imposti un contenitore come pubblico, finché l'account vieta l'accesso anonimo i dati restano comunque al sicuro. L'accesso pubblico effettivo richiede quindi una scelta esplicita e consapevole su entrambi i piani.

### 4.2.4 — Assegnare i livelli di accesso dei blob

I dati che archiviamo in **Azure Blob Storage** non hanno tutti lo stesso valore nel tempo: alcuni vengono letti e scritti continuamente, altri restano fermi per mesi e servono solo "per sicurezza". Per questo motivo **Azure Storage** offre diversi livelli di accesso (access tier) per i dati dei blob. I livelli disponibili sono Hot (frequente), Cool (sporadico), Cold (raro) e Archive (archiviazione). L'idea di fondo è semplice: ogni livello è ottimizzato per un determinato modello di utilizzo dei dati e, soprattutto, propone un diverso compromesso tra costo di archiviazione e costo di accesso. Scegliendo il livello giusto per ciascun tipo di dato, paghiamo solo per ciò che effettivamente ci serve.

Il principio economico da tenere a mente è questo: più i dati sono "caldi" (cioè usati spesso), più costa conservarli ma meno costa accedervi; più i dati sono "freddi" (cioè usati di rado), meno costa conservarli ma più costa accedervi. La scelta del tier è quindi una decisione di ottimizzazione dei costi basata sulla frequenza di accesso prevista.

**Livello Hot (accesso frequente)** _(stepTitle)_

Il livello Hot è ottimizzato per letture e scritture frequenti degli oggetti nello **Storage Account**. È il livello indicato per i dati in uso attivo, cioè quelli che vengono elaborati o consultati di continuo. Ha i costi di archiviazione più alti, ma i costi di accesso più bassi: conviene quindi quando l'accesso ai dati è la voce di spesa predominante.

**Livello Cool (accesso sporadico)** _(stepTitle)_

Il livello Cool è ottimizzato per archiviare grandi quantità di dati a cui si accede di rado. È pensato per dati che restano in questo livello per almeno 30 giorni. Casi d'uso tipici sono i backup a breve termine, i dataset di disaster recovery e i contenuti multimediali più datati: materiale che non viene consultato spesso ma che deve restare immediatamente disponibile. Rispetto al livello Hot, il Cool ha costi di archiviazione più bassi e costi di accesso più alti.

**Livello Cold (accesso raro)** _(stepTitle)_

Anche il livello Cold è ottimizzato per archiviare grandi quantità di dati a cui si accede di rado, ma con una soglia temporale più lunga: è pensato per dati che possono rimanere nel livello per almeno 90 giorni. Rispetto al livello Cool, il Cold ha costi di archiviazione ancora più bassi e costi di accesso più alti. È quindi un gradino intermedio per dati più "freddi" del Cool ma che non vogliamo ancora portare offline.

**Livello Archive (archiviazione)** _(stepTitle)_

Il livello Archive è un livello offline, ottimizzato per dati che tollerano diverse ore di latenza in fase di recupero. I dati devono rimanere nel livello Archive per almeno 180 giorni, altrimenti si applica un addebito per eliminazione anticipata (early deletion charge). I dati adatti a questo livello includono i backup secondari, i dati grezzi originali e le informazioni di conformità richieste per legge. È l'opzione più economica in assoluto per l'archiviazione dei dati; in compenso, accedere ai dati nel livello Archive è più costoso rispetto a tutti gli altri livelli.

> **Importante**: poiché il livello Archive è offline, prima di poter leggere il contenuto di un blob devi riportarlo (reidratarlo) in un livello online, ossia Hot, Cool o Cold.
_(infoBox)_

**Come reidratare un blob dal livello Archive** _(stepTitle)_

Per accedere al contenuto di un blob in Archive, occorre reidratarlo verso il livello Hot, Cool o Cold. Esistono due metodi:

- **Copy Blob** (consigliato): crea un nuovo blob in un livello online, lasciando intatto l'originale in Archive.
- **Set Blob Tier**: modifica il livello del blob direttamente sul posto (in place).

Entrambi i metodi supportano due priorità di reidratazione:

- **Standard priority**: il recupero può richiedere fino a 15 ore.
- **High priority**: il recupero avviene entro 1 ora per gli oggetti inferiori a 10 GB, ma a un costo più elevato.

> **Suggerimento**: usa la priorità High per il recupero urgente dei dati negli scenari di disaster recovery, quando il tempo di ripristino è critico e giustifica il costo aggiuntivo.
_(infoBox)_

**Confronto tra i livelli di accesso** _(stepTitle)_

Le opzioni di accesso di **Azure Blob Storage** offrono caratteristiche e livelli di servizio diversi, pensati per aiutarti a ottimizzare i costi di archiviazione. Confrontando le caratteristiche conviene ragionare su quale opzione supporti meglio le esigenze della tua applicazione, in particolare in termini di disponibilità, latenza di accesso e durata minima di permanenza dei dati.

| **Confronto** | **Hot** | **Cool** | **Cold** | **Archive** |
| --- | --- | --- | --- | --- |
| **Disponibilità** | 99,9% | 99% | 99% | 99% |
| **Disponibilità (letture RA-GRS)** | 99,99% | 99,9% | 99,9% | 99,9% |
| **Latenza (tempo al primo byte)** | millisecondi | millisecondi | millisecondi | ore |
| **Durata minima di archiviazione** | N/D | 30 giorni | 90 giorni | 180 giorni |

Da questa tabella si nota subito il salto qualitativo dell'Archive rispetto agli altri tre: i livelli online (Hot, Cool, Cold) garantiscono accesso ai dati nell'ordine dei millisecondi, mentre l'Archive richiede ore. Inoltre la durata minima di archiviazione cresce mano a mano che il livello diventa più freddo (30, 90, 180 giorni): spostare un dato in un livello e rimuoverlo prima della soglia comporta costi aggiuntivi, quindi la scelta del tier va sempre allineata al ciclo di vita reale del dato.

### 4.2.5 — Aggiungere regole di gestione del ciclo di vita

Ogni insieme di dati ha un proprio ciclo di vita. Nelle prime fasi, gli utenti tendono ad accedere solo ad alcuni dei dati dell'insieme, non a tutti. Man mano che l'insieme di dati invecchia, l'accesso ai dati si riduce drasticamente: alcuni dati restano inattivi nel cloud e vengono consultati raramente, altri scadono dopo pochi giorni o mesi dalla creazione, altri ancora vengono letti e modificati attivamente per tutta la loro durata. Il punto importante da capire è che pagare il prezzo del livello Hot per dati che nessuno consulta più è uno spreco: serve un meccanismo che adatti automaticamente il livello di archiviazione all'effettivo utilizzo.

**Azure Blob Storage** supporta proprio questo tipo di automazione tramite la *gestione del ciclo di vita* (lifecycle management). Si tratta di un sistema di criteri basati su regole, disponibile per gli account **General Purpose v2 (GPv2)** e per gli account Premium block blob. Anche i vecchi account Blob Storage sono supportati, ma per le nuove distribuzioni è consigliato GPv2. Con le regole di criterio del ciclo di vita puoi spostare i dati verso il livello di accesso più appropriato e impostare tempi di scadenza per la fine del ciclo di vita dell'insieme di dati.

**Cosa sapere sulla gestione del ciclo di vita** _(stepTitle)_

Le regole di criterio del ciclo di vita di **Azure Blob Storage** permettono di realizzare diversi obiettivi:

- Spostare i blob verso un livello di archiviazione più "freddo" (da Hot a Cool, da Hot a Cold, da Hot a Archive, da Cool a Cold, da Cool a Archive, da Cold a Archive) per ottimizzare prestazioni e costi.
- Eliminare le versioni correnti di un blob, le versioni precedenti o gli snapshot al termine del loro ciclo di vita.
- Riportare automaticamente i blob da Cool a Hot quando vengono consultati. Questa impostazione ottimizza i modelli di accesso imprevedibili senza incorrere in addebiti per eliminazione anticipata.
- Applicare le regole a un intero **Storage Account**, ad alcuni container selezionati oppure a un sottoinsieme di blob, usando come filtri i prefissi dei nomi o i tag dell'indice dei blob.

**Scenario di business** _(stepTitle)_

Per capire il valore pratico di queste regole, considera uno scenario in cui i dati vengono consultati di frequente nelle prime fasi del ciclo di vita, ma solo occasionalmente dopo due settimane; trascorso il primo mese, l'insieme di dati viene consultato raramente. In questo caso il livello **Hot** è la scelta migliore nelle fasi iniziali, il livello **Cool** è il più adatto per l'accesso occasionale e il livello **Archive** è l'opzione ottimale quando i dati superano il mese di età. Per ottenere queste transizioni in modo automatico, e senza dover intervenire manualmente, si usano le regole di gestione del ciclo di vita che spostano i dati che invecchiano verso livelli sempre più freddi.

**Configurare le regole di criterio del ciclo di vita** _(stepTitle)_

Nel portale di Azure le regole di criterio del ciclo di vita per lo **Storage Account** si creano specificando alcune impostazioni. Per ogni regola si definiscono blocchi di condizione **If - Then** (Se - Allora) che spostano o fanno scadere i dati in base ai criteri stabiliti. Mentre esamini questi dettagli, prova a immaginare come imposteresti le regole per i tuoi insiemi di dati.

![Aggiungere una regola di criterio del ciclo di vita nel portale di Azure](img/blob-lifecycle-2854d812.png) _(dimensioni: 633×549 px)_
*Figura 72: Aggiunta di una regola di criterio per la gestione del ciclo di vita dei dati blob nel portale di Azure.* _(caption)_

Il funzionamento della regola si basa su due clausole complementari:

- **If** (Se): la clausola **If** definisce la condizione di valutazione della regola. Quando la clausola **If** è vera, viene eseguita la clausola **Then**. La clausola **If** serve a impostare il periodo di tempo da applicare ai dati blob: la funzionalità di gestione del ciclo di vita verifica se i dati sono stati consultati o modificati secondo il tempo specificato.
  - **More than (days ago)** (Più di N giorni fa): il numero di giorni da usare nella condizione di valutazione.
- **Then** (Allora): la clausola **Then** definisce l'azione da eseguire. Quando la clausola **If** è vera, viene eseguita la clausola **Then**, che imposta l'azione di transizione per i dati blob. Le azioni disponibili sono:
  - **Move to cool storage**: i dati blob vengono spostati nel livello **Cool**.
  - **Move to cold storage**: i dati blob vengono spostati nel livello **Cold**.
  - **Move to archive storage**: i dati blob vengono spostati nel livello **Archive**.
  - **Delete the blob**: i dati blob vengono eliminati.

Progettando le regole in modo da adeguare i livelli di archiviazione all'età dei dati, ottieni le opzioni di archiviazione meno costose per le tue esigenze, automatizzando completamente il passaggio dei dati verso livelli più economici man mano che invecchiano.

> **Suggerimento**: per approfondire l'argomento puoi consultare il modulo di formazione "Manage the Azure Blob storage lifecycle" su Microsoft Learn.
_(infoBox)_

### 4.2.6 — Determinare la replica degli oggetti blob

La replica degli oggetti (object replication) copia i blob presenti in un container in modo **asincrono**, seguendo le regole di una policy che configuri tu. A differenza della ridondanza incorporata in **Azure Storage** (come GRS, che replica l'intero account a livello di infrastruttura senza darti controllo granulare), la replica degli oggetti è uno strumento che decidi tu come orchestrare: scegli quali container replicare e dove. È pensata per portare i dati più vicino a chi li consuma o per distribuire copie tra regioni diverse in base alle esigenze applicative.

La replica copia tre cose insieme: il **contenuto** del blob, le sue **proprietà di metadati** e le sue **versioni**. L'illustrazione seguente mostra un esempio di replica asincrona di container di blob tra regioni diverse.

![Replica asincrona di container di blob tra regioni](img/blob-object-replication-21fd3c07.png) _(dimensioni: 540×338 px)_
*Figura 73: Replica asincrona di container di blob tra due regioni Azure.* _(caption)_

**Cose da sapere sulla replica degli oggetti blob** _(stepTitle)_

Quando pianifichi la configurazione della replica degli oggetti blob, ci sono diversi vincoli e prerequisiti da tenere a mente. Capirli in anticipo evita di impostare una policy che poi non funziona o che non copia ciò che ti aspetti.

- La replica degli oggetti richiede che il **versioning dei blob** (blob versioning) sia abilitato sia sull'account di origine sia su quello di destinazione. Il versioning è il meccanismo che consente di accedere alle versioni precedenti di un blob: è proprio questa capacità a permettere di recuperare dati modificati o eliminati, ed è anche ciò che rende possibile replicare la storia delle modifiche e non solo lo stato corrente.
- La replica degli oggetti **non supporta gli snapshot dei blob**. Eventuali snapshot presenti su un blob nell'account di origine non vengono replicati nell'account di destinazione. Se il tuo modello di backup si basa sugli snapshot, devi tenerne conto: per la replica conta il versioning, non gli snapshot.
- La replica degli oggetti è supportata quando gli account di origine e destinazione si trovano nei tier di accesso **Hot**, **Cool** o **Cold**. Origine e destinazione possono trovarsi anche in tier diversi tra loro: questo ti dà flessibilità, ad esempio per replicare da un account "caldo" verso uno più economico.
- Quando configuri la replica degli oggetti, crei una **policy di replica** (replication policy) che specifica lo **Storage Account** di origine e quello di destinazione.
- Una policy di replica include una o più **regole** (rules) che specificano un container di origine e un container di destinazione. Sono le regole a identificare quali blob del container di origine devono essere replicati.

> **Importante**: senza il versioning abilitato su entrambi gli account, la replica degli oggetti non può funzionare. È il prerequisito non negoziabile da configurare per primo.
_(infoBox)_

**Cose da considerare nella configurazione della replica degli oggetti blob** _(stepTitle)_

L'uso della replica degli oggetti blob porta numerosi vantaggi. Vale la pena ragionare sui seguenti scenari per capire come la replica può inserirsi nella tua strategia di **Azure Blob Storage**: in tutti i casi il filo conduttore è "avvicinare i dati al punto in cui servono" o "ottimizzare i costi del loro ciclo di vita".

- **Considera la riduzione della latenza**. La replica degli oggetti permette di minimizzare la latenza delle richieste di lettura, consentendo ai client di consumare i dati da una regione fisicamente più vicina a loro.
- **Considera l'efficienza per i carichi di lavoro di calcolo**. Con la replica, carichi di lavoro di calcolo (compute workloads) collocati in regioni diverse possono elaborare gli stessi insiemi di blob senza dover trasferire i dati a ogni esecuzione.
- **Considera la distribuzione dei dati**. Puoi ottimizzare la configurazione per la distribuzione dei dati: elabori o analizzi i dati in un'unica posizione e poi replichi verso le altre regioni soltanto i risultati, anziché l'intero dataset grezzo.
- **Considera i benefici sui costi**. La replica ti permette di gestire e ottimizzare le policy di storage. Una volta che i dati sono stati replicati, puoi ridurre i costi spostandoli nel tier **Archive** tramite le policy di gestione del ciclo di vita (lifecycle management).

La tabella seguente riassume i quattro scenari principali e il beneficio che ciascuno offre.

| **Scenario** | **Beneficio principale** |
|---|---|
| **Riduzione della latenza** | I client leggono i dati da una regione più vicina, riducendo i tempi di risposta. |
| **Efficienza dei carichi di calcolo** | Più regioni elaborano gli stessi blob senza trasferimenti ripetuti dei dati. |
| **Distribuzione dei dati** | Si elabora in un'unica posizione e si replicano solo i risultati altrove. |
| **Ottimizzazione dei costi** | Dopo la replica, i dati possono passare al tier Archive tramite lifecycle management. |

### 4.2.7 — Gestire i blob

Un blob può contenere qualsiasi tipo di dato e file di qualsiasi dimensione. Questa flessibilità è uno dei punti di forza di **Azure Blob Storage**, ma proprio perché i casi d'uso sono molto diversi tra loro (file multimediali, log applicativi, dischi di macchine virtuali) **Azure Storage** non offre un unico tipo di blob: ne mette a disposizione tre, ciascuno ottimizzato per uno schema di accesso specifico. Scegliere il tipo giusto significa scegliere il profilo di prestazioni più adatto al proprio scenario.

**I tre tipi di blob** _(stepTitle)_

I tre tipi di blob disponibili sono *block blob*, *page blob* e *append blob*. Vediamo le caratteristiche di ciascuno e, soprattutto, perché esistono.

| **Tipo di blob** | **Struttura e ottimizzazione** | **Scenari d'uso tipici** |
|---|---|---|
| **Block blob** | È composto da blocchi di dati che vengono assemblati per formare il blob. È il tipo predefinito: se durante la creazione di un nuovo blob non si specifica un tipo, viene creato come block blob. | È il tipo usato nella maggior parte degli scenari di Blob Storage. Ideale per archiviare testo e dati binari nel cloud, come file, immagini e video. |
| **Append blob** | È simile al block blob perché anch'esso è composto da blocchi di dati, ma questi blocchi sono ottimizzati per le operazioni di *append* (aggiunta in coda). | Utile negli scenari di logging, dove la quantità di dati cresce man mano che l'operazione di registrazione prosegue. |
| **Page blob** | Può raggiungere una dimensione massima di 8 TB. È più efficiente per operazioni di lettura/scrittura frequenti. | Usato da **Azure Virtual Machines** per i dischi del sistema operativo e i dischi dati. |

La logica di fondo è semplice: il block blob privilegia il caricamento e lo streaming di file completi, l'append blob privilegia l'aggiunta continua di nuovi dati senza riscrivere ciò che è già presente, mentre il page blob privilegia l'accesso casuale e ripetuto a porzioni del file (esattamente ciò che serve a un disco virtuale).

> **Nota**: dopo aver creato un blob non è più possibile cambiarne il tipo. La scelta del tipo va quindi fatta correttamente in fase di creazione, in base allo schema di accesso previsto.
_(infoBox)_

**Come caricare e gestire i blob** _(stepTitle)_

Per caricare e gestire i blob è possibile usare il portale di Azure. Questa opzione è adatta quando i file sono pochi. Dopo aver individuato i file da caricare, si scelgono il tipo di blob e la dimensione del blocco (*block size*), oltre alla cartella del container. Si impostano inoltre il livello di accesso (*access tier*) e l'ambito di crittografia (*encryption scope*). In altre parole, il portale espone in un'unica schermata tutte le decisioni rilevanti sul singolo upload, ed è proprio per questo che risulta comodo solo su volumi ridotti: ripetere queste scelte manualmente per migliaia di file non è pratico.

![Pagina di caricamento dei blob con tipo di autenticazione, tipi di blob e dimensione del blocco](img/upload-blobs-7ad73d30.png) _(dimensioni: 410×599 px)_
*Figura 74: Pagina Upload Blob che mostra il tipo di autenticazione, i tipi di blob e la dimensione del blocco.* _(caption)_

**Strumenti per grandi volumi di file** _(stepTitle)_

Quando i file da gestire sono molti, conviene usare uno strumento dedicato anziché il portale. Di seguito le opzioni principali, con i rispettivi punti di forza, da valutare in base alle proprie esigenze di configurazione.

- **Azure Storage Explorer**. Permette di caricare, scaricare e gestire blob, file, code (queue) e tabelle, oltre alle entità di **Azure Data Lake Storage** e ai dischi gestiti (managed disk). Consente inoltre di visualizzare, modificare e gestire le risorse, fare l'anteprima dei dati e configurare autorizzazioni e controlli di accesso allo storage. È un'applicazione con interfaccia grafica, quindi unisce la comodità visiva del portale alla capacità di lavorare su molte risorse.

![Pagina di Storage Explorer](img/blob-storage-explorer.png) _(dimensioni: 639×341 px)_
*Figura 75: Pagina di Storage Explorer.* _(caption)_

- **AzCopy**. Uno strumento da riga di comando semplice da usare, disponibile per Windows e Linux. Consente di copiare dati da e verso Blob Storage, tra container diversi e tra account di storage diversi. È la scelta naturale per automatizzare i trasferimenti tramite script.
- **Azure Data Box Disk**. Un servizio per trasferire dati on-premises verso Blob Storage quando i dataset sono troppo grandi o i vincoli di rete rendono poco realistico l'upload tramite connessione di rete. Con **Azure Data Box Disk** si possono richiedere a Microsoft dischi a stato solido (SSD): si copiano i propri dati su questi dischi e li si rispedisce a Microsoft, che li carica in Blob Storage. È quindi un trasferimento "fisico" pensato per i casi in cui la rete non basta.

### 4.2.8 — Determinare i prezzi di Blob Storage

Tenere sotto controllo i costi di **Azure Blob Storage** non significa semplicemente "scegliere il tier più economico": richiede di comprendere come i dati vengono effettivamente usati. Il segreto è correlare i propri schemi di accesso (quanto spesso si leggono e si scrivono i dati) con i requisiti di durabilità e disponibilità. Solo mettendo insieme questi due aspetti si riesce a capire quale combinazione di tier di prestazioni e opzione di ridondanza offre il miglior rapporto costo/beneficio per un determinato carico di lavoro.

Lo strumento principale per stimare questi costi è l'**Azure Pricing Calculator**. Si tratta di un calcolatore basato sull'input del carico di lavoro: si indicano i parametri di utilizzo previsti (volume di dati, numero di operazioni, ridondanza) e lo strumento restituisce una stima. Il calcolatore può produrre tre tipi di stima:

- Stima dei costi di **migrazione** dei dati.
- Stima dei costi **mensili** ricorrenti.
- Stima dei costi **futuri** in base alla crescita prevista del carico di lavoro.

In linea generale, il costo dello storage di tipo block blob dipende da tre fattori fondamentali:

- Il **volume di dati** archiviato ogni mese.
- La **quantità e il tipo di operazioni** eseguite, insieme agli eventuali costi di trasferimento dati.
- L'**opzione di ridondanza** dei dati selezionata.

![Azure Pricing Calculator con la sezione storage evidenziata](img/blob-pricing.png) _(dimensioni: 580×310 px)_
*Figura 76: Azure Pricing Calculator con la sezione dedicata allo storage evidenziata, dove si inseriscono i parametri del carico di lavoro per ottenere una stima dei costi.* _(caption)_

> **Suggerimento**: utilizza l'Azure Pricing Calculator per simulare scenari diversi (ad esempio lo stesso volume di dati nel tier Hot rispetto al Cool) prima di prendere decisioni architetturali. Confrontare le stime ti permette di capire dove conviene davvero risparmiare.
_(infoBox)_

**Le voci che compongono la fattura** _(stepTitle)_

Per uno **Storage Account** e per **Blob Storage**, la fatturazione non si riduce al solo spazio occupato: concorrono più voci, e capirle è essenziale per evitare sorprese. Di seguito le principali considerazioni di addebito.

- **Tier di prestazioni (Performance tiers)**. Il tier di Blob Storage determina sia la quantità di dati archiviati sia il costo per archiviarli. La regola di fondo è che, man mano che il tier diventa "più freddo" (da Hot verso Cool, Cold e Archive), il costo per gigabyte di archiviazione diminuisce. Questo è il motivo per cui i tier freddi convengono per dati a cui si accede raramente.
- **Costi di accesso ai dati (Data access costs)**. Specularmente al punto precedente, i costi di accesso ai dati aumentano man mano che il tier diventa più freddo. Per i dati nei tier Cool, Cold e Archive viene applicato un addebito di accesso per gigabyte sulle operazioni di lettura. È il rovescio della medaglia del risparmio sull'archiviazione: si paga di più ogni volta che si accede al dato.
- **Costi di transazione (Transaction costs)**. Per tutti i tier è previsto un addebito per transazione. Anche in questo caso, l'importo cresce man mano che il tier diventa più freddo.
- **Costi di trasferimento per la geo-replica (Geo-replication data transfer costs)**. Questo addebito si applica solo agli account che hanno la geo-replica configurata. Il trasferimento dei dati di geo-replica comporta un addebito per gigabyte.
- **Costi di trasferimento dati in uscita (Outbound data transfer costs)**. I trasferimenti di dati in uscita generano un addebito per l'utilizzo di banda su base per-gigabyte. Questa modalità di fatturazione è coerente con quella degli Storage Account Azure general-purpose.

**Perché conviene scegliere bene il tier fin dall'inizio** _(stepTitle)_

Il tier non è una scelta a costo zero da modificare con leggerezza: cambiare il tier di archiviazione dell'account comporta un addebito una tantum legato allo spostamento dei dati. In particolare, per gli account GPv2:

| **Operazione di cambio tier** | **Costo applicato** |
|---|---|
| Da **Cool** a **Hot** | Addebito equivalente alla lettura di tutti i dati esistenti nello Storage Account. |
| Da **Hot** a **Cool** | Addebito equivalente alla scrittura di tutti i dati nel tier Cool. |

> **Importante**: la modifica del tier di archiviazione a livello di account non è gratuita. Spostare un grande volume di dati da Cool a Hot (o viceversa) può generare un costo significativo, perché viene fatturato come se si leggessero o scrivessero tutti i dati presenti. Pianifica con attenzione il tier corretto per evitare cambi frequenti e onerosi.
_(infoBox)_

In sintesi, la logica economica di Blob Storage è un compromesso: i tier freddi abbassano il costo di archiviazione ma alzano quello di accesso e transazione. La scelta ottimale dipende quindi dalla frequenza con cui i dati vengono effettivamente utilizzati. Stimare in anticipo questi parametri con l'Azure Pricing Calculator e scegliere il tier giusto fin dall'inizio è il modo migliore per ottimizzare la spesa.
