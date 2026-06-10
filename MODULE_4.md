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
