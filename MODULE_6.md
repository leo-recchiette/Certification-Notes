# Modulo 6 — Monitorare ed eseguire il backup delle risorse di Azure

_Questo percorso affronta il monitoraggio proattivo delle risorse Azure e le strategie di backup e ripristino di emergenza (disaster recovery). Un amministratore deve garantire visibilità sull'infrastruttura, proteggere i dati con backup affidabili e disporre di piani di ripristino efficaci._

**Immagini usate in questo modulo:**
- `img/architecture-on-premises-mars.png` (800×593) — Figura 111
- `img/scenario.png` (1074×488) — Figura 112
- `img/azure-backup-overview.png` (1196×541) — Figura 113
- `img/azure-backup-architecture.png` (1978×1383) — Figura 114
- `img/backup-center-jobs.png` (3225×1470) — Figura 115
- `img/data-plane.png` (1168×422) — Figura 116
- `img/built-in-security.png` (354×166) — Figura 117
- `img/backup-vaults.png` (1164×346) — Figura 118
- `img/backup-center.png` (1908×888) — Figura 119
- `img/azure-backup-sql-overview.png` (998×463) — Figura 120
- `img/3-recovery-vault-in-context.png` (1413×710) — Figura 121
- `img/3-azure-vm-backup-architecture.png` (994×447) — Figura 122
- `img/4-portal-azure-backup.png` (1316×943) — Figura 123
- `img/4-portal-backup-setup.png` (1204×500) — Figura 124
- `img/4-recovery-services-vault.png` (1296×655) — Figura 125
- `img/6-vm-backup-menu.png` (1314×566) — Figura 126
- `img/6-restore-point.png` (845×749) — Figura 127
- `img/6-restore-configuration.png` (764×773) — Figura 128
- `img/6-restore-progress.png` (1720×593) — Figura 129
- `img/monitoring-layers.png` (894×461) — Figura 130
- `img/2-vm-metrics-screenshot.png` (1198×723) — Figura 131
- `img/create-vm-monitoring.png` (1019×643) — Figura 132
- `img/platform-metrics.png` (1162×739) — Figura 133
- `img/3-boot-diagnostics.png` (920×667) — Figura 134
- `img/metrics-explorer.png` (1189×640) — Figura 135
- `img/3-view-host-level-metrics.png` (1221×633) — Figura 136
- `img/3-metric-graph.png` (880×543) — Figura 137
- `img/enable-insights.png` (2201×1187) — Figura 138
- `img/guest-os-metrics.png` (777×357) — Figura 139
- `img/vm-insights-performance.png` (1190×810) — Figura 140
- `img/dependency-map.png` (858×769) — Figura 141
- `img/monitor-overview.png` (986×614) — Figura 142
- `img/dcr-create.png` (1210×528) — Figura 143
- `img/create-dcr-basics.png` (785×654) — Figura 144
- `img/create-dcr-resources.png` (763×652) — Figura 145
- `img/create-dcr-finish.png` (698×460) — Figura 146
- `img/dcr-log.png` (1053×638) — Figura 147

---

## 6.1 — Introduzione ad Azure Backup

### 6.1.1 — Introduzione

Per chi lavora nell'IT, i dati sono uno degli asset più preziosi dell'organizzazione: è proprio l'esigenza di proteggerli che guida molte delle decisioni su archiviazione, backup e sicurezza. Per questo motivo le aziende adottano policy che definiscono ogni dettaglio del backup, ad esempio la frequenza con cui eseguirlo, per quanto tempo conservare le copie e con quali criteri ripristinare i dati. Lo scenario tipico è quello di un'azienda che deve mettere in sicurezza server, workstation e workload garantendo un piano di ripristino affidabile.

Nei contesti on-premises le soluzioni di backup tradizionali si sono spesso basate su storage locale ridondante oppure su copie conservate fuori sede. L'approccio classico del backup su nastro con conservazione off-site, però, introduce un ritardo significativo nel ripristino: i nastri vanno fisicamente riportati nelle sale server prima di poter avviare l'operazione di restore, con conseguenti tempi di inattività anche notevoli. Il problema è che queste soluzioni non sempre affrontano gli aspetti oggi più critici, come la sicurezza delle copie di backup, il rischio di un attacco ransomware o gli errori umani durante le operazioni di backup e ripristino. La soluzione ideale dovrebbe essere economica, semplice da usare e sicura: è esattamente il vuoto che **Azure Backup** va a colmare.

![Scenario di backup on-premises con il Backup (MARS) Agent](img/architecture-on-premises-mars.png) _(dimensioni: 800×593 px)_
*Figura 111: Scenario di backup in cui i server e le workstation aziendali inviano file e cartelle allo storage di Azure tramite il **Backup (MARS) Agent**.* _(caption)_

**Cosa puoi proteggere in Azure** _(stepTitle)_

Oltre allo scenario on-premises, **Azure Backup** copre anche gli ambienti che vivono già nel cloud, con supporto per un'ampia gamma di risorse Azure:

- Azure VMs
- Azure Managed Disks
- Azure Files
- SQL Server in Azure VMs
- Database SAP HANA in Azure VMs
- Azure Database for PostgreSQL
- Azure Blobs
- Azure Database for PostgreSQL - Flexible Server
- Azure Database for MySQL - Flexible Server
- Cluster Azure Kubernetes (AKS)

**Scenario di esempio** _(stepTitle)_

Per rendere concreti questi concetti, immagina di gestire un'applicazione basata su SQL Server, con il database in esecuzione in un gruppo di disponibilità always-on distribuito su tre Azure VMs. Vuoi eseguire il backup dei database con un servizio nativo di Azure, conservare le copie per 10 anni su uno storage più economico per soddisfare esigenze di audit e conformità, e infine monitorare quotidianamente i job di backup di tutti questi database. È proprio il tipo di requisito (lunga conservazione, costo contenuto, monitoraggio centralizzato) per cui **Azure Backup** è progettato.

![Applicazione con database SQL Server protetta da Azure Backup](img/scenario.png) _(dimensioni: 1074×488 px)_
*Figura 112: Applicazione con database back-end SQL Server di cui viene eseguito il backup tramite **Azure Backup**.* _(caption)_

**Che cosa imparerai** _(stepTitle)_

In questo modulo valuteremo le funzionalità e le capacità di **Azure Backup** per capire se rappresenta la risposta giusta alle tue esigenze di protezione dei dati. In particolare, ti aiuterà a stabilire se:

- **Azure Backup** può offrire una soluzione adeguata alle tue necessità di backup.
- Riesci a eseguire backup e ripristino di tutti i dati di cui l'organizzazione ha bisogno.
- Il servizio garantisce un'archiviazione sicura dei tuoi dati.

L'obiettivo finale è metterti nelle condizioni di decidere, al termine della trattazione, se **Azure Backup** è la soluzione da considerare per le tue esigenze di protezione dei dati.

### 6.1.2 — Cos'è Azure Backup

**Azure Backup** è il servizio gestito di Azure che permette di eseguire il backup dei dati e di ripristinarli dal cloud Microsoft Azure. L'idea di fondo è semplice ma potente: invece di costruire e mantenere una propria infrastruttura di backup (server dedicati, librerie a nastro, storage di destinazione), si delega tutto a un servizio cloud che è già pronto, sicuro e scalabile. Questo riduce sia i costi sia la complessità operativa, perché non c'è hardware da acquistare né capacità di storage da dimensionare a mano.

Il valore distintivo del servizio sta in tre aggettivi che ricorrono nella sua definizione: **semplice** (un'unica interfaccia di gestione centralizzata), **sicuro** (protezione integrata dei dati in transito e a riposo) ed **economico** (paghi solo ciò che usi, senza investimenti iniziali in infrastruttura).

![Panoramica di Azure Backup](img/azure-backup-overview.png) _(dimensioni: 1196×541 px)_
*Figura 113: Panoramica del servizio Azure Backup: gli agenti di backup inviano i dati dall'ambiente on-premises al cloud, con gestione centralizzata.* _(caption)_

**Definizione di Azure Backup** _(stepTitle)_

In modo più preciso, **Azure Backup** è un servizio Azure che fornisce soluzioni di backup convenienti, sicure e a infrastruttura zero (*zero-infrastructure*) per tutti gli asset di dati gestiti da Azure.

L'espressione "infrastruttura zero" è il concetto chiave: non devi predisporre alcun server di backup né alcuno storage di destinazione, perché Azure se ne occupa automaticamente. La sua interfaccia di gestione centralizzata rende immediato definire le *backup policy* (i criteri di backup) e proteggere un'ampia gamma di carichi di lavoro aziendali, tra cui macchine virtuali Azure (**Azure Virtual Machines**), dischi gestiti (**Azure Disks**), database SQL e SAP, condivisioni file di Azure (**Azure Files**) e blob.

Dal punto di vista architetturale, il servizio si organizza su due livelli. Il *data plane* è il piano che si occupa concretamente dei dati: legge i carichi di lavoro da proteggere ed esegue le operazioni di backup e ripristino. Il *management plane* è il piano di gestione e governance, dove risiedono le **backup policy**, l'integrazione con **Azure Policy** (per applicare regole di conformità a tappeto), con **Azure Monitor** (per il monitoraggio e gli avvisi) e con **Azure Lighthouse** (per la gestione delegata su più tenant). Questa separazione spiega perché si può governare l'intero parco di backup in modo centralizzato senza dover toccare i singoli carichi di lavoro.

![Architettura di Azure Backup](img/azure-backup-architecture.png) _(dimensioni: 1978×1383 px)_
*Figura 114: Architettura di Azure Backup: i carichi di lavoro alimentano il data plane, che si collega al management plane (backup policy, Azure Policy, Azure Monitor, Azure Lighthouse).* _(caption)_

**Quando usare Azure Backup** _(stepTitle)_

Per capire a chi serve, conviene mettersi nei panni di chi gestisce l'IT. Come amministratore IT dell'organizzazione sei responsabile del rispetto dei requisiti di conformità per tutti gli asset di dati dell'azienda, e il backup ne è un aspetto critico. Allo stesso tempo, i vari amministratori applicativi hanno bisogno di eseguire backup e ripristini in modalità self-service, per gestire autonomamente situazioni come la corruzione dei dati o scenari di *rogue-admin* (un amministratore malevolo che cancella o danneggia i dati). In questo contesto serve una soluzione di backup di classe enterprise capace di proteggere tutti i carichi di lavoro e di gestirli da un punto centrale: è esattamente ciò che offre Azure Backup.

Azure Backup può fornire servizi di backup per i seguenti asset di dati:

- File, cartelle e stato di sistema (*system state*) on-premises
- Macchine virtuali di Azure (**Azure Virtual Machines**, VM)
- Dischi gestiti di Azure (**Azure Managed Disks**)
- Condivisioni file di Azure (**Azure Files Shares**)
- SQL Server in esecuzione su VM Azure
- Database **SAP HANA** (High-performance Analytic Appliance) su VM Azure
- Server **Azure Database for PostgreSQL**
- Blob di Azure (**Azure Blobs**)
- Server flessibili **Azure Database for PostgreSQL - Flexible servers**
- Server flessibili **Azure Database for MySQL - Flexible servers**
- Cluster **Azure Kubernetes**

Tutte queste operazioni si monitorano da un'unica console, il **Backup Center**, che mostra l'elenco dei processi di backup con la relativa istanza, origine dati, tipo di operazione e stato.

![Processi di backup nel Backup Center](img/backup-center-jobs.png) _(dimensioni: 3225×1470 px)_
*Figura 115: Il Backup Center mostra l'elenco dei processi di backup con istanza, origine dati, tipo di operazione e stato.* _(caption)_

**Caratteristiche principali** _(stepTitle)_

La tabella seguente riassume le caratteristiche chiave di Azure Backup, mettendo in relazione ogni funzionalità con la descrizione tecnica e il beneficio concreto che porta.

| **Caratteristica** | **Descrizione** | **Utilità** |
| --- | --- | --- |
| **Soluzione di backup a infrastruttura zero** | A differenza delle soluzioni di backup tradizionali, non serve alcun server o infrastruttura di backup. Allo stesso modo non occorre distribuire alcuno storage di backup, perché Azure Backup lo gestisce e lo scala automaticamente. | La soluzione a infrastruttura zero elimina le spese in conto capitale (*capital expenses*) e riduce le spese operative (*operational expenses*). Aumenta la facilità d'uso automatizzando la gestione dello storage. |
| **Gestione su larga scala** (*at-scale management*) | Gestisci nativamente l'intero parco di backup da una console centrale chiamata **Backup Center**. Usa API, PowerShell e Azure CLI per automatizzare le configurazioni delle backup policy e di sicurezza. | Il Backup Center semplifica la gestione della protezione dati su larga scala permettendo di individuare, governare, monitorare, operare e ottimizzare la gestione dei backup da una console unificata, migliorando l'efficienza operativa con Azure. |
| **Sicurezza** | Azure Backup fornisce sicurezza integrata all'ambiente di backup, sia quando i dati sono in transito sia quando sono a riposo, tramite funzionalità come crittografia, endpoint privati e avvisi. | I backup sono automaticamente protetti contro ransomware, amministratori malevoli ed eliminazioni accidentali. |

**Come funzionano RTO e RPO** _(stepTitle)_

Quando si progetta una strategia di backup, due metriche guidano ogni decisione: l'RTO e l'RPO. Comprenderle è essenziale perché determinano la frequenza dei backup e il dimensionamento delle procedure di ripristino.

Il **Recovery Time Objective (RTO)** è il tempo obiettivo entro cui un processo aziendale deve essere ripristinato dopo un disastro, per evitare conseguenze inaccettabili. Risponde alla domanda "quanto a lungo posso restare fermo?". Per esempio, se un'applicazione critica si interrompe a causa del guasto di un server e l'azienda può tollerare al massimo quattro ore di inattività, allora l'RTO è di quattro ore.

Il **Recovery Point Objective (RPO)** è la quantità massima di perdita di dati, misurata in tempo, che l'organizzazione può sostenere durante un evento. Risponde alla domanda "quanti dati posso permettermi di perdere?". Poiché l'RPO si misura in tempo, definisce di fatto la frequenza con cui devono essere eseguiti i backup.

> **Esempio**: la tua organizzazione ha un RPO di un'ora per il database clienti, quindi esegui i backup ogni ora. Se si verifica un incidente con perdita di dati, perdi al massimo un'ora di dati. Se imposti un RTO di tre ore, in caso di guasto di sistema punti a ripristinare l'accesso al database entro tre ore per minimizzare l'impatto sulle operazioni.
_(infoBox)_

### 6.1.3 — Come funziona Azure Backup

Per usare bene **Azure Backup** conviene capire come è organizzato internamente: non è un unico componente monolitico, ma una serie di livelli che cooperano. Questa architettura a strati è ciò che permette al servizio di proteggere fonti di dati molto diverse (macchine on-premises, VM, database, file) con un'unica logica di gestione e con la sicurezza integrata. I livelli principali sono quattro:

- **Livello di integrazione con il workload (Backup Extension)**: è il punto in cui Azure Backup si "aggancia" al carico di lavoro reale, ad esempio una Azure VM o un Azure Blob.
- **Data plane - Access tier**: il piano dati dove i backup vengono effettivamente conservati, suddiviso in tre livelli di accesso (snapshot, standard e archive).
- **Data plane - Disponibilità e sicurezza**: i dati di backup vengono replicati tra zone o aree geografiche secondo la ridondanza scelta dall'utente.
- **Management plane - Recovery Services vault / Backup vault e Backup center**: il vault è l'interfaccia con cui l'utente interagisce con il servizio di backup.

Capire questa separazione tra *piano dati* (dove stanno i backup) e *piano di gestione* (come li si configura e monitora) è la chiave per orientarsi nel resto del modulo.

**Quali dati vengono protetti e in che modo** _(stepTitle)_

In sintesi, **Azure Backup** copia dati, stato della macchina e workload in esecuzione su macchine on-premises e su istanze di VM, salvandoli nel cloud di Azure. I dati protetti vengono conservati in due tipi di contenitori: i **Recovery Services vault** e i **Backup vault**.

Il modo in cui i dati arrivano nel cloud dipende dalla fonte:

- Per le **macchine Windows on-premises** puoi eseguire il backup direttamente verso Azure tramite l'agente **MARS** (Microsoft Azure Recovery Services). In alternativa, puoi inviare il backup di queste macchine a un server di backup, come **System Center Data Protection Manager (DPM)** o **Microsoft Azure Backup Server (MABS)**, e poi proteggere quel server verso un Recovery Services vault in Azure.
- Per le **Azure VM** puoi eseguire il backup direttamente. Azure Backup installa una *backup extension* nell'agente della VM, il che consente di proteggere l'intera macchina virtuale. Se invece ti interessa solo il backup di file e cartelle interni alla VM, puoi farlo eseguendo l'agente MARS.

Un **vault** è un'entità di archiviazione online in Azure usata per conservare copie di backup, punti di ripristino e criteri di backup. È quindi sia il deposito dei dati sia il luogo dove vivono le policy che governano i backup.

**Tipi di backup supportati** _(stepTitle)_

Azure Backup supporta sia i backup completi sia quelli incrementali. Il primo backup è sempre **completo (full)**; DPM/MABS usano i backup incrementali per i backup su disco, e anche tutti i backup verso Azure sono incrementali. Il vantaggio dell'incrementale è la sua efficienza: come suggerisce il nome, considera solo i blocchi di dati che sono cambiati rispetto al backup precedente, riducendo così spazio occupato e tempi.

Per **SQL Server**, Azure Backup gestisce diversi tipi di backup. La tabella seguente riassume le tipologie supportate e quando usarle:

| **Tipo** | **Descrizione** | **Utilizzo** |
| --- | --- | --- |
| **Full** | Un backup completo del database copia l'intero database: contiene tutti i dati di uno specifico database (o di un insieme di filegroup o file) e include log a sufficienza per ripristinare quei dati. | Al massimo un backup completo al giorno. Puoi pianificarlo con cadenza giornaliera o settimanale. |
| **Differential** | Un backup differenziale si basa sul backup completo più recente e cattura solo i dati cambiati dal backup completo. | Al massimo un backup differenziale al giorno. Non puoi configurare un backup full e uno differenziale nello stesso giorno. |
| **Più backup al giorno** | Backup delle Azure VM con cadenza oraria, con RPO (Recovery Point Objective) minimo di 4 ore e massimo di 24 ore. | Tramite la Enhanced backup policy puoi impostare la pianificazione a 4, 6, 8, 12 o 24 ore per le offerte Azure più recenti, come le Trusted Launch VM. |
| **Selective disk backup** | Esegui il backup selettivo di un sottoinsieme dei dischi dati collegati alla VM e ripristini solo i dischi disponibili in un punto di ripristino (sia da instant restore sia dal vault tier). Utile per gestire i dati critici concentrati su alcuni dischi e ridurre i costi quando, ad esempio, vuoi proteggere solo il disco del sistema operativo. | Disponibile tramite la Enhanced backup policy. |
| **Transaction Log** | Un backup del log abilita il ripristino point-in-time fino a uno specifico secondo. | Puoi configurare backup del log transazionale ogni 15 minuti. |

**Livello di integrazione con il workload - Backup Extension** _(stepTitle)_

Una *backup extension* specifica per ciascun workload viene installata sulla VM di origine o su una worker VM. Al momento del backup (secondo quanto definito dall'utente nel Backup Policy), l'estensione genera il backup, che può assumere due forme:

- **Storage**: snapshot, quando si usano Azure VM o Azure Files.
- **Stream backup**: per database come SQL o **SAP HANA** (High-performance Analytic Appliance) in esecuzione nelle VM.

I dati di backup vengono poi trasferiti allo storage gestito da Azure Backup nel data plane, usando reti Azure sicure: Network Security Group (NSG), firewall o, in scenari più sofisticati, private endpoint. Questo passaggio "blindato" è ciò che garantisce che i dati non transitino mai su percorsi non controllati.

**Data plane - Access tier** _(stepTitle)_

I backup possono essere conservati in tre livelli di accesso (*access tier*), pensati per bilanciare velocità di ripristino e costo:

- **Snapshot tier** (termine specifico del workload): nella prima fase del backup di una macchina virtuale viene scattato uno snapshot, conservato insieme al disco. Ripristinare dallo snapshot tier è più rapido che dal vault, perché si elimina l'attesa necessaria a copiare gli snapshot dal vault prima di avviare il ripristino. Gli snapshot (di VM, Azure Files, Azure Blob, ecc.) restano nella sottoscrizione del cliente, in uno specifico resource group: tenendoli "in locale" si garantiscono ripristini veloci.
- **Vault-standard tier**: i dati di backup di tutti i workload supportati vengono archiviati nei vault, che ospitano il backup storage, un insieme di account di archiviazione con scalabilità automatica gestiti da Azure Backup. È un livello di archiviazione online che conserva una copia *isolata* dei dati in un tenant gestito da Microsoft, aggiungendo così un ulteriore strato di protezione. Per i workload che supportano lo snapshot tier esiste una copia dei dati sia nello snapshot tier sia nel Vault-standard tier. Questo livello garantisce che i dati di backup restino disponibili anche se la fonte originale viene eliminata o compromessa.
- **Archive tier**: molti clienti usano Azure Backup anche per la conservazione a lungo termine (Long-Term Retention, LTR), con esigenze di retention dettate dalle regole di compliance aziendali. Questi dati più datati vengono raramente consultati e sono mantenuti soprattutto per fini normativi. Azure Backup supporta il backup dei punti di retention a lungo termine nell'archive tier.

Ogni tier offre RTO (Recovery Time Objective) diversi ed è soggetto a prezzi differenti: la scelta del livello è quindi un compromesso tra rapidità di ripristino e costo di mantenimento.

![Data plane e access tier di Azure Backup](img/data-plane.png) _(dimensioni: 1168×422 px)_
*Figura 116: i diversi workload (server on-premises, Azure VM, Azure Files) confluiscono nel data plane, dove risiedono gli access tier.* _(caption)_

**Data plane - Disponibilità e sicurezza** _(stepTitle)_

I dati di backup vengono replicati tra zone o aree geografiche in base alla ridondanza scelta. Puoi optare per **locally redundant storage (LRS)**, **geo-redundant storage (GRS)** o **zone-redundant storage (ZRS)**: opzioni che offrono diversi gradi di alta disponibilità dei dati.

La sicurezza è integrata su tre fronti complementari, in modo da proteggere i backup sia da accessi indebiti sia da cancellazioni accidentali o malevole:

- **Crittografia**: i dati vengono cifrati per proteggerne la riservatezza.
- **Azure RBAC** (role-based access control): decidi tu chi può eseguire operazioni di backup e ripristino.
- **Soft delete**: protezione contro l'eliminazione malevola dei backup. Un backup eliminato viene conservato per 14 giorni, gratuitamente, così da poterlo recuperare in caso di necessità.

Azure Backup supporta inoltre la gestione del ciclo di vita dei dati di backup, utile per rispettare i criteri di retention previsti dalla compliance.

![Le tre opzioni di sicurezza integrate in Azure Backup](img/built-in-security.png) _(dimensioni: 354×166 px)_
*Figura 117: le tre opzioni di sicurezza integrate, ovvero Azure RBAC, crittografia e soft delete.* _(caption)_

**Management plane - Recovery Services vault / Backup vault e Backup center** _(stepTitle)_

Azure Backup usa i **Recovery Services vault** e i **Backup vault** per orchestrare e gestire i backup, oltre che per conservare i dati protetti. Il vault è l'interfaccia attraverso cui l'utente interagisce con il servizio, e le Azure Backup Policy definite all'interno di ciascun vault stabiliscono quando i backup devono essere avviati e per quanto tempo devono essere conservati.

Puoi usare un singolo vault oppure più vault per organizzare la tua attività di backup. La scelta dipende dalla struttura del tuo ambiente:

- Se gestisci i workload con un'unica sottoscrizione e una sola risorsa, un singolo vault è sufficiente per monitorare e gestire l'intero parco backup.
- Se i workload sono distribuiti su più sottoscrizioni, puoi creare più vault, con uno o più vault per ciascuna sottoscrizione.

![Management plane con Recovery Services vault](img/backup-vaults.png) _(dimensioni: 1164×346 px)_
*Figura 118: il management plane; il Recovery Services vault mostra i criteri di backup e la gestione tramite portale, SDK o interfaccia a riga di comando (CLI).* _(caption)_

Il **Backup center** offre un'unica vista centralizzata (*single pane of glass*) per gestire tutte le attività legate ai backup. È progettato per funzionare bene anche in ambienti Azure ampi e distribuiti: con il Backup center puoi gestire in modo efficiente backup che attraversano più tipi di workload, più vault, più sottoscrizioni, più aree geografiche e persino più tenant Azure Lighthouse.

> **Nota**: il Backup center diventa particolarmente utile man mano che l'estate cresce; per un singolo vault può bastare la gestione diretta dal vault, ma su larga scala è lo strumento che evita di "saltare" da una risorsa all'altra.
_(infoBox)_

![Interfaccia del Backup center](img/backup-center.png) _(dimensioni: 1908×888 px)_
*Figura 119: l'interfaccia del Backup center nel portale di Azure mostra le informazioni di backup delle Azure VM relative a processi (job) e istanze di backup.* _(caption)_

### 6.1.4 — Quando usare Azure Backup

Non sempre è ovvio quale soluzione di protezione dati adottare: la scelta dipende dal tipo di carico di lavoro, dai requisiti di conformità e dalla necessità di gestire i ripristini in autonomia. In questa unità capiamo in quali scenari **Azure Backup** offre i vantaggi maggiori, cioè quando garantisce la disponibilità dei dati, protegge i carichi di lavoro su Azure e mette al sicuro le informazioni.

**Criteri decisionali** _(stepTitle)_

**Azure Backup** è un servizio di Azure che fornisce soluzioni di backup sicure e senza infrastruttura per tutti gli asset di dati gestiti da Azure. Il termine "senza infrastruttura" (zero-infrastructure) è importante: non devi provisionare né mantenere server di backup, storage o agenti complessi: pensa Azure a tutto. Il servizio protegge un'ampia gamma di carichi di lavoro enterprise, tra cui le macchine virtuali di Azure (VM), i dischi di Azure, i database SQL e SAP, le condivisioni file e i blob.

Per decidere se Azure Backup è la scelta giusta conviene valutarlo rispetto ad alcuni criteri chiave. La tabella seguente riassume le aree principali in cui il servizio può aiutarti nella protezione dei dati.

| **Criterio** | **Considerazione** |
| --- | --- |
| **Carichi di lavoro Azure** | VM di Azure, dischi di Azure, SQL Server in VM di Azure, database SAP HANA in VM di Azure, blob di Azure, condivisioni Azure Files, Azure Database for PostgreSQL. |
| **Conformità** | Criterio di backup definito dal cliente, con conservazione a lungo termine (long-term retention) su più zone o aree geografiche. |
| **Ripristini operativi** | Grazie al backup e al ripristino self-service, l'amministratore dell'applicazione può gestire da solo problemi come l'eliminazione accidentale o il danneggiamento dei dati. |

**Applicare i criteri allo scenario** _(stepTitle)_

Riprendiamo lo scenario introdotto in precedenza: la tua organizzazione ha un'applicazione che dipende dai dati di un'installazione **SQL Server** di back-end. SQL Server è in esecuzione su tre VM di Azure. I dati di backup devono essere conservati fino a 10 anni per soddisfare i requisiti di conformità, e vuoi inoltre poter monitorare i backup.

Prima di vedere come Azure Backup risponde a queste esigenze, è importante sapere cosa NON è supportato, per evitare aspettative errate. Se le tue tre VM di Azure sono distribuite su più sottoscrizioni o aree geografiche, tieni presente che per la maggior parte dei carichi di lavoro Azure Backup non supporta il backup tra aree (cross-region backup). Supporta però il ripristino tra aree (cross-region restore) in un'area secondaria abbinata (paired secondary region).

> **Nota**: la distinzione tra backup cross-region (non supportato) e restore cross-region (supportato nella regione abbinata) è cruciale nella progettazione di una strategia di disaster recovery.
_(infoBox)_

**Azure Backup può proteggere le VM che ospitano le istanze SQL Server?** _(stepTitle)_

Sì. Azure Backup è in grado di eseguire il backup di intere VM Windows e Linux tramite apposite estensioni di backup (backup extensions). In questo modo puoi proteggere l'intera VM che ospita SQL Server. Se invece vuoi eseguire il backup solo di file, cartelle e stato del sistema (system state) sulle VM, puoi usare l'agente **Microsoft Azure Recovery Services (MARS)**.

Se la tua esigenza principale è proteggere solo i dati di SQL Server, anche questo è supportato. Azure Backup offre una soluzione specializzata e basata su stream (stream-based) per il backup di SQL Server in esecuzione su VM di Azure. Questa soluzione mantiene i vantaggi tipici di Azure Backup: backup senza infrastruttura, conservazione a lungo termine e gestione centralizzata.

In più, per SQL Server, Azure Backup offre vantaggi specifici:

- Backup "workload aware" (consapevoli del carico di lavoro) che supportano tutti i tipi di backup: completo (full), differenziale e dei log.
- Obiettivo del punto di ripristino (RPO, Recovery Point Objective) di 15 minuti grazie ai frequenti backup dei log.
- Ripristino point-in-time fino al secondo.
- Backup e ripristino a livello di singolo database.

![SQL Server su VM di Azure con backup nel Recovery Services vault](img/azure-backup-sql-overview.png) _(dimensioni: 998×463 px)_
*Figura 120: SQL Server ospitato su una VM di Azure ed eseguito il backup verso un Recovery Services vault. Le frecce indicano il flusso bidirezionale del percorso dati (data path) e del percorso di controllo (control path) tra Azure Backup e l'estensione di backup sulla VM.* _(caption)_

**Azure Backup aiuta con la conformità?** _(stepTitle)_

Sì, su più fronti. Puoi implementare i meccanismi di controllo degli accessi necessari per i tuoi backup. I vault (**Recovery Services vault** e **Backup vault**) forniscono le funzionalità di gestione e sono accessibili dal portale di Azure, da Backup Center, dalle dashboard del vault, dall'SDK, dalla CLI e persino dalle API REST. Il vault rappresenta inoltre un confine per il controllo degli accessi in base al ruolo di Azure (**Azure RBAC**), così puoi limitare l'accesso ai backup ai soli amministratori di backup autorizzati.

La conservazione a breve termine (short-term retention) può essere espressa in *minuti* o su base *giornaliera*. La conservazione di punti di backup *settimanali*, *mensili* o *annuali* è invece chiamata conservazione a lungo termine (*long-term retention*).

La conservazione a lungo termine può essere:

- **Pianificata (requisiti di conformità)**: se sai in anticipo che i dati serviranno tra anni, usa la long-term retention.
- **Non pianificata (esigenza on-demand)**: se non lo sai in anticipo, puoi usare un backup on-demand con impostazioni di conservazione personalizzate. Le impostazioni del criterio non influiscono su queste impostazioni personalizzate.
- **Backup on-demand con conservazione personalizzata**: se devi eseguire un backup non previsto dal criterio, puoi usare un backup on-demand. È utile per backup che non rientrano nella pianificazione o per backup granulari (ad esempio più backup giornalieri di una VM IaaS, dato che il backup pianificato ne consente solo uno al giorno). Importante: il criterio di conservazione definito nella pianificazione non si applica ai backup on-demand.

Puoi inoltre sfruttare la gestione dei criteri (policy management) come supporto alla conformità. I criteri di Azure Backup, all'interno di ciascun vault, definiscono quando attivare i backup e per quanto conservarli. Questi criteri possono essere gestiti e applicati a più elementi contemporaneamente.

**Azure Backup semplifica monitoraggio e amministrazione?** _(stepTitle)_

Sì. Azure Backup si integra con **Log Analytics** per il monitoraggio e la reportistica e fornisce report tramite **Workbooks**.

Il servizio offre un monitoraggio integrato dei processi (job monitoring) per operazioni come la configurazione del backup, l'esecuzione del backup, il ripristino, l'eliminazione dei backup e così via. Questo monitoraggio è circoscritto al singolo vault, quindi è ideale quando devi tenere d'occhio un solo vault.

Se invece devi monitorare le attività operative su larga scala, **Backup Explorer** offre una vista aggregata dell'intero patrimonio di backup, con la possibilità di analisi dettagliate (drill-down) e troubleshooting. È un workbook integrato di **Azure Monitor** che fornisce un punto centrale e unico per monitorare le attività operative su tutto il parco backup in Azure, attraversando tenant, posizioni, sottoscrizioni, gruppi di risorse e vault.

## 6.2 — Proteggere le macchine virtuali con Azure Backup

### 6.2.1 — Introduzione

La tua azienda gestisce su Azure diversi carichi di lavoro critici basati su macchine virtuali (VM). Come solution architect di riferimento, ti viene chiesto di garantire che l'azienda sia in grado di ripristinare queste VM in caso di perdita o corruzione dei dati, sfruttando le funzionalità integrate di **Azure Backup** per proteggerle. **Azure Backup** è un servizio che consente di eseguire il backup di macchine virtuali Azure, server locali, condivisioni file di Azure, nonché di istanze SQL Server o SAP HANA in esecuzione su VM di Azure e di altri carichi di lavoro applicativi.

In questa sezione imparerai a riconoscere gli scenari in cui **Azure Backup** offre funzionalità di backup e ripristino, e vedrai come utilizzare il portale di Azure per eseguire il backup e il ripristino di una macchina virtuale.

> **Nota**: per completare gli esercizi facoltativi di questo modulo è necessaria una sottoscrizione propria; va bene una sottoscrizione di prova o una a cui hai già accesso.
_(infoBox)_

### 6.2.2 — Funzionalità e scenari di Azure Backup

Immagina che il piano di continuità operativa e ripristino di emergenza (BCDR, Business Continuity and Disaster Recovery) della tua azienda richieda una capacità completa di backup e ripristino per tutti i server ad alto rischio. Il compito tipico dell'amministratore è abilitare e collaudare le funzionalità di backup e ripristino per gli asset Windows e Linux più critici. Per farlo in modo efficace, occorre prima capire come funziona **Azure Backup** e quali scenari d'uso supporta.

**Che cos'è Azure Backup** _(stepTitle)_

**Azure Backup** è un servizio integrato di Azure che fornisce un backup sicuro per tutti gli asset di dati gestiti da Azure. Il suo punto di forza è l'approccio *zero-infrastructure*: consente backup e ripristini in modalità self-service, con una gestione su larga scala a un costo più basso e prevedibile. Questo significa che non devi acquistare, installare o mantenere server di backup o storage dedicato.

Oggi Azure Backup offre soluzioni di backup specializzate sia per le macchine virtuali (VM) di Azure sia per quelle on-premises. Inoltre fornisce opzioni di backup e ripristino di livello enterprise per carichi di lavoro come SQL Server o SAP HANA (High-performance Analytic Appliance) in esecuzione all'interno di VM di Azure.

Il vantaggio pratico è la semplicità: a differenza delle soluzioni di backup tradizionali, che possono richiedere uno sforzo considerevole per essere configurate, Azure Backup si gestisce facilmente tramite il portale di Azure.

**Azure Backup rispetto ad Azure Site Recovery** _(stepTitle)_

È importante non confondere **Azure Backup** con **Azure Site Recovery**: entrambi mirano a rendere il sistema più resiliente a guasti e malfunzionamenti, ma adottano due approcci diversi e rispondono a esigenze diverse.

L'obiettivo primario di Backup è mantenere copie dei dati con stato (*stateful*) per poter "tornare indietro nel tempo" a una versione precedente. Site Recovery, invece, replica i dati quasi in tempo reale e permette di eseguire un *failover* verso un'altra posizione.

Per scegliere correttamente è utile ragionare per casi d'uso:

- Per problemi come interruzioni di rete o di alimentazione, puoi affidarti alle zone di disponibilità (*availability zones*).
- Per un disastro che coinvolge un'intera area geografica (ad esempio una calamità naturale), si usa Site Recovery.
- I backup, invece, servono nei casi di perdita accidentale dei dati, corruzione dei dati o attacchi ransomware.

La scelta dell'approccio di ripristino dipende inoltre dalla criticità dell'applicazione, dai requisiti di RPO (Recovery Point Objective, l'obiettivo del punto di ripristino) e RTO (Recovery Time Objective, l'obiettivo del tempo di ripristino), e dalle implicazioni di costo.

> **Nota**: RPO indica quanti dati puoi permetterti di perdere (la distanza temporale tra l'ultimo backup utile e il momento del guasto), mentre RTO indica quanto tempo puoi tollerare prima che il servizio torni operativo. Sono i due parametri chiave che guidano la progettazione di qualsiasi strategia BCDR.
_(infoBox)_

**Perché usare Azure Backup** _(stepTitle)_

Le soluzioni di backup tradizionali, come disco e nastro, non offrono il massimo livello di integrazione con le soluzioni basate sul cloud. Azure Backup presenta invece diversi vantaggi rispetto a questi approcci più datati:

**Backup senza infrastruttura (zero-infrastructure)**: Azure Backup elimina la necessità di distribuire e gestire qualsiasi infrastruttura o storage di backup. Non c'è alcun onere di manutenzione dei server di backup né di ridimensionamento dello storage al variare delle necessità.

**Conservazione a lungo termine (long-term retention)**: puoi soddisfare requisiti rigorosi di conformità e di audit conservando i backup per molti anni. Al termine del periodo previsto, la funzionalità integrata di gestione del ciclo di vita elimina automaticamente i punti di ripristino non più necessari.

**Sicurezza**: Azure Backup protegge l'ambiente di backup sia quando i dati sono in transito sia quando sono inattivi (*at rest*). I principali meccanismi sono:

- **Controllo degli accessi in base al ruolo di Azure (Azure RBAC)**: consente di separare le responsabilità all'interno del team e di concedere a ciascun utente solo il livello di accesso strettamente necessario per svolgere il proprio lavoro.
- **Crittografia dei backup**: i dati di backup vengono crittografati automaticamente usando chiavi gestite da Microsoft. In alternativa, puoi crittografarli con chiavi gestite dal cliente (*customer-managed keys*) archiviate in **Azure Key Vault**.
- **Nessuna connettività Internet richiesta**: quando usi VM di Azure, tutto il trasferimento dei dati avviene esclusivamente sulla rete backbone di Azure, senza dover accedere alla tua rete virtuale. Non è quindi richiesto l'accesso ad alcun indirizzo IP o nome di dominio completo (FQDN).
- **Eliminazione temporanea (soft delete)**: con la soft delete, i dati di backup vengono conservati per altri 14 giorni anche dopo l'eliminazione dell'elemento di backup. Questa conservazione protegge dagli scenari di eliminazione accidentale o malevola, consentendo il recupero di quei backup senza perdita di dati. Azure Backup offre anche la **Enhanced soft delete**, che permette di mantenere un elemento eliminato nello stato di *soft delete* per una durata ancora più lunga.

Azure Backup offre inoltre la possibilità di eseguire il backup di VM crittografate con **Azure Disk Encryption**.

**Disponibilità elevata (high availability)**: Azure Backup offre tre tipi di replica dei dati, da scegliere in base alla criticità del carico di lavoro:

| **Tipo di replica** | **Caratteristiche** | **Scenario consigliato** |
|---|---|---|
| **Locally redundant storage (LRS)** | Opzione a costo più basso, con protezione di base contro i guasti dei rack dei server e delle unità disco | Scenari non critici |
| **Geo-redundant storage (GRS)** | Opzione intermedia, con capacità di failover in una regione secondaria | Scenari di backup |
| **Zone-redundant storage (ZRS)** | Protegge dai guasti a livello di datacenter, replicando lo storage in modo sincrono su tre zone di disponibilità di Azure | Scenari ad alta disponibilità |

**Monitoraggio e gestione centralizzati**: Azure Backup mette a disposizione funzionalità integrate di monitoraggio e di avviso (*alerting*) all'interno di un **Recovery Services vault**. Queste capacità sono disponibili senza dover predisporre alcuna infrastruttura di gestione aggiuntiva.

**Scenari supportati da Azure Backup** _(stepTitle)_

Azure Backup supporta i seguenti scenari:

- **VM di Azure**: backup di VM di Azure Windows o Linux. Azure Backup fornisce backup indipendenti e isolati per proteggere dalla distruzione involontaria dei dati sulle VM. I backup vengono archiviati in un **Recovery Services vault** con gestione integrata dei punti di ripristino. La configurazione e il ridimensionamento sono semplici, i backup sono ottimizzati e il ripristino può essere eseguito facilmente all'occorrenza.
- **On-premises**: backup di file, cartelle e stato del sistema (*system state*) tramite l'agente **Microsoft Azure Recovery Services (MARS)**. In alternativa, è possibile usare **Microsoft Azure Backup Server (MABS)** o un server **Data Protection Manager (DPM)** per proteggere le VM on-premises (Hyper-V e VMware) e altri carichi di lavoro locali.
- **Condivisioni di Azure Files**: Azure Files fornisce la gestione degli snapshot tramite Azure Backup.
- **SQL Server in VM di Azure** e **database SAP HANA in VM di Azure**: Azure Backup offre soluzioni specializzate basate su flusso (*stream-based*) per eseguire il backup di SQL Server o SAP HANA in esecuzione in VM di Azure. Queste soluzioni eseguono backup consapevoli del carico di lavoro (*workload-aware*) che supportano diversi tipi di backup, come completo (full), differenziale (differential) e log, un RPO di 15 minuti e il ripristino a un momento specifico nel tempo (point-in-time recovery).

### 6.2.3 — Eseguire il backup di una VM di Azure

Una volta definita la strategia di backup e ripristino, l'obiettivo è metterla in pratica sulle macchine virtuali (VM) aziendali. Le VM ospitate in Azure traggono vantaggio da **Azure Backup** in modo nativo: è possibile eseguire backup e ripristino senza installare software aggiuntivo, perché tutta la logica è integrata nella piattaforma. In questa unità esaminiamo i metodi che **Azure Backup** mette a disposizione per proteggere le VM di Azure, così da poter scegliere quello più adatto.

Il principio di fondo è semplice: una **VM di Azure** viene protetta acquisendo degli *snapshot* (istantanee) dei dischi sottostanti a intervalli definiti dall'utente; questi snapshot vengono poi trasferiti nel **Recovery Services vault** secondo i criteri stabiliti dal cliente. Capire come funziona ciascun passaggio aiuta a decidere frequenza, livello di coerenza dei dati e durata di conservazione.

**Recovery Services vault** _(stepTitle)_

**Azure Backup** utilizza un **Recovery Services vault** per gestire e archiviare i dati di backup. Il vault è un'entità di gestione dello storage che offre un'esperienza semplificata per eseguire e monitorare le operazioni di backup e ripristino. Il vantaggio pratico è che non occorre distribuire né gestire account di archiviazione: basta indicare il vault in cui salvare la VM, e i dati vengono trasferiti in background negli account di archiviazione di **Azure Backup**, collocati in un dominio di errore separato per garantire l'isolamento. Il vault funge inoltre da confine per il controllo degli accessi in base al ruolo (RBAC), permettendo un accesso sicuro ai dati.

![Recovery Services vault mostrati in relazione alle risorse che proteggono](img/3-recovery-vault-in-context.png) _(dimensioni: 1413×710 px)_
*Figura 121: I Recovery Services vault mostrati nel contesto delle risorse che proteggono.* _(caption)_

**Snapshot (istantanee)** _(stepTitle)_

Uno *snapshot* è un backup a un istante preciso (point-in-time) di tutti i dischi della VM. Per le VM di Azure, **Azure Backup** impiega estensioni diverse a seconda del sistema operativo supportato.

| **Estensione** | **Sistema operativo** | **Descrizione** |
| --- | --- | --- |
| VM Snapshot | Windows | L'estensione collabora con il servizio Volume Shadow Copy Service (VSS) per acquisire una copia dei dati su disco e in memoria. |
| VM SnapshotLinux | Linux | Lo snapshot è una copia del disco. |

A seconda di come viene acquisito lo snapshot e di che cosa include, si ottengono diversi livelli di coerenza dei dati. Comprendere questa differenza è cruciale, perché determina quanto sarà "pulito" lo stato della VM al momento del ripristino.

- **Coerenza a livello di applicazione (application consistent)**
  - Lo snapshot cattura la VM nel suo insieme: su Windows usa i writer VSS per acquisire il contenuto della memoria della macchina e le eventuali operazioni di I/O in sospeso.
  - Per le macchine Linux è necessario scrivere script pre e post personalizzati per ciascuna applicazione, in modo da catturarne lo stato.
  - È il livello migliore: garantisce coerenza completa per la VM e per tutte le applicazioni in esecuzione.
- **Coerenza a livello di file system (file system consistent)**
  - Se VSS ha esito negativo su Windows, oppure se gli script pre e post falliscono su Linux, **Azure Backup** crea comunque uno snapshot coerente a livello di file system.
  - Durante un ripristino non si verifica alcun danneggiamento della macchina, ma le applicazioni installate devono eseguire una propria operazione di pulizia all'avvio per tornare coerenti.
- **Coerenza con arresto anomalo (crash consistent)**
  - Questo livello si verifica in genere quando la VM è spenta al momento del backup.
  - Non vengono acquisite operazioni di I/O né i contenuti della memoria: questo metodo non garantisce la coerenza dei dati per il sistema operativo o per le applicazioni.

**Criterio di backup (backup policy)** _(stepTitle)_

Il criterio di backup permette di definire la frequenza dei backup e la durata di conservazione. Attualmente il backup di una VM può essere attivato con cadenza giornaliera o settimanale, e i dati possono essere conservati per più anni. Il criterio supporta due livelli di accesso (tier): il *livello snapshot* (snapshot tier) e il *livello vault* (vault tier). Adottando il criterio avanzato (**Enhanced policy**) è inoltre possibile attivare backup orari.

- **Backup selettivo dei dischi (Selective Disk backup)**: tramite l'**Enhanced policy**, **Azure Backup** offre la funzionalità di backup e ripristino selettivo dei dischi. Permette di sottoporre a backup solo un sottoinsieme dei dischi dati collegati alla VM e di ripristinarne un sottoinsieme da un punto di ripristino, sia dall'instant restore sia dal vault tier. È utile per gestire i dati critici presenti solo su alcuni dischi e per ridurre i costi quando, ad esempio, si usano soluzioni di backup di database e si vuole sottoporre a backup solo il disco del sistema operativo.
- **Livello snapshot (snapshot tier)**: tutti gli snapshot vengono archiviati localmente per un periodo massimo di cinque giorni. Per la maggior parte dei ripristini operativi è consigliato partire dagli snapshot, perché è il metodo più veloce: questa capacità si chiama **instant restore**.
- **Livello vault (vault tier)**: tutti gli snapshot vengono inoltre trasferiti nel vault, per ottenere maggiore sicurezza e una conservazione più lunga. A questo punto il tipo di punto di ripristino diventa "snapshot e vault".

**Processo di backup di una VM di Azure** _(stepTitle)_

Ecco come **Azure Backup** completa il backup di una VM di Azure, passo dopo passo:

- Per le VM di Azure selezionate per il backup, **Azure Backup** avvia un processo di backup in base alla frequenza definita nel criterio.
- Durante il primo backup, se la VM è in esecuzione, viene installata un'estensione di backup:
  - Per le VM Windows viene installata l'estensione VM Snapshot.
  - Per le VM Linux viene installata l'estensione VM SnapshotLinux.
- Dopo l'acquisizione dello snapshot, i dati vengono archiviati localmente e trasferiti nel vault.
  - Il backup è ottimizzato perché ogni disco della VM viene sottoposto a backup in parallelo.
  - Per ciascun disco, **Azure Backup** legge i blocchi presenti, individua e trasferisce solo i blocchi di dati modificati (il delta) rispetto al backup precedente: ciò riduce drasticamente i tempi e i volumi trasferiti.
  - I dati dello snapshot potrebbero non essere copiati immediatamente nel vault e, nei momenti di picco, il trasferimento può richiedere diverse ore. Il tempo totale di backup di una VM rimane comunque inferiore a 24 ore con i criteri di backup giornalieri.

![Architettura del backup di una VM di Azure](img/3-azure-vm-backup-architecture.png) _(dimensioni: 994×447 px)_
*Figura 122: Architettura del backup di una VM di Azure con Azure Backup.* _(caption)_

È inoltre possibile abilitare la crittografia del vault con chiavi gestite dal cliente (CMK, customer-managed keys), per avere il pieno controllo del materiale crittografico.

> **Importante**: con l'**Enhanced soft delete** di un **Recovery Services vault** è possibile proteggere i backup dall'eliminazione. Mantenendolo *sempre attivo* (always on) si impedisce di disattivarlo, proteggendo così i backup da eliminazioni accidentali o da attacchi malware.
_(infoBox)_

### 6.2.4 — Procedura guidata: eseguire il backup di una VM

Una volta compresi i concetti di **Azure Backup** e del **Recovery Services vault**, il passo successivo è metterli in pratica. Il portale di Azure offre il percorso più immediato per proteggere una macchina virtuale: in pochi clic è possibile associare la VM a un vault, scegliere un criterio di backup e avviare la protezione, senza installare nulla manualmente all'interno del sistema operativo guest. Questa guida illustra l'intero flusso, dall'abilitazione del backup fino alla verifica del primo job nel vault.

Il vantaggio dell'approccio dal portale è la sua semplicità: Azure si occupa di installare l'estensione di backup nella VM, di creare le risorse necessarie e di pianificare le esecuzioni secondo il criterio scelto. È il metodo ideale per proteggere singole macchine o per prendere confidenza con il servizio, mentre per operazioni ripetitive o su larga scala si ricorre tipicamente a CLI o PowerShell.

**Passo 1 — Aprire la VM e raggiungere il menu Backup** _(stepTitle)_

Per prima cosa occorre individuare la macchina virtuale da proteggere e accedere alla sua sezione di backup.

- Nel portale di Azure, cerca e seleziona **Virtual machines**, oppure raggiungi la lista delle risorse e filtrala per tipo.
- Dall'elenco, seleziona la macchina virtuale che vuoi proteggere: si apre il pannello di gestione della VM.
- Nel menu centrale, seleziona la scheda **Capabilities**, quindi scorri fino alla voce **Backup**. Si apre il pannello **Backup** dedicato a quella VM.

> **Perché qui**: il backup è un'operazione che agisce sull'intera VM (dischi inclusi), quindi il punto di accesso naturale è la VM stessa, sotto le sue capacità operative. Da qui Azure collega la macchina al vault e installa l'estensione necessaria.
_(infoBox)_

**Passo 2 — Selezionare il vault e il criterio di backup** _(stepTitle)_

Nel pannello **Backup** della VM si configurano i due elementi fondamentali della protezione: il vault che custodirà i punti di ripristino e il criterio (policy) che ne stabilisce frequenza e durata di conservazione.

- Seleziona il tipo di policy desiderato (ad esempio **Standard**).
- **Backup vault**: scegli un **Recovery Services vault** esistente oppure lascia che il portale ne crei uno nuovo con un nome predefinito. Il vault è il contenitore in cui vengono archiviati in modo sicuro i punti di ripristino.
- **Backup policy**: accetta il criterio proposto o selezionane uno diverso. Un criterio tipico esegue, ad esempio, un backup giornaliero a un orario fisso (in UTC) con un intervallo di conservazione di 180 giorni.

![Opzioni di backup della VM nel portale](img/4-portal-azure-backup.png) _(dimensioni: 1316×943 px)_
*Figura 123: Pannello con le opzioni di backup per la VM nel portale di Azure: selezione del vault e del criterio di backup.* _(caption)_

> **Importante**: il **Recovery Services vault** e la VM devono trovarsi nella stessa area geografica (region). Il criterio di backup determina sia quando vengono creati i punti di ripristino, sia per quanto tempo vengono mantenuti: scegliere bene la retention è essenziale per bilanciare costi di archiviazione e requisiti di conformità.
_(infoBox)_

**Passo 3 — Abilitare il backup** _(stepTitle)_

Dopo aver scelto vault e criterio, seleziona il pulsante **Enable backup**. Azure avvia la distribuzione: collega la VM al vault, installa l'estensione di backup e registra la macchina come elemento protetto secondo il criterio selezionato.

Al termine della distribuzione, tornando al pannello **Backup** della VM (scheda **Capabilities** → **Backup**), si nota che la pagina è cambiata: ora mostra lo stato della protezione, il criterio associato e le azioni disponibili, tra cui l'avvio di un backup immediato.

![Pagina Backup dopo la configurazione](img/4-portal-backup-setup.png) _(dimensioni: 1204×500 px)_
*Figura 124: Pannello Backup della VM dopo che la protezione è stata abilitata, con la sezione di stato del backup.* _(caption)_

> **Nota**: abilitare il backup non crea immediatamente un punto di ripristino. Il primo backup automatico avverrà all'orario previsto dal criterio. Se serve una copia subito, occorre avviare un backup on-demand, come descritto nel passo successivo.
_(infoBox)_

**Passo 4 — Eseguire un backup on-demand (Backup now)** _(stepTitle)_

Per non attendere l'esecuzione pianificata e ottenere subito un primo punto di ripristino, è possibile avviare manualmente il backup.

- Nel pannello **Backup** della VM, nella barra dei comandi in alto, seleziona **Backup now**.
- Si apre il pannello **Backup Now**: conferma con **OK** per avviare l'operazione.

Questo primo backup è utile per verificare che la protezione funzioni correttamente e per disporre immediatamente di una copia recuperabile, senza dover aspettare la finestra di backup pianificata.

> **Suggerimento**: un backup on-demand è particolarmente consigliato prima di interventi rischiosi sulla VM (aggiornamenti, modifiche di configurazione, patch): garantisce un punto di ripristino aggiornato a cui tornare in caso di problemi.
_(infoBox)_

**Passo 5 — Verificare lo stato del backup sulla VM** _(stepTitle)_

Una volta avviato il backup, si può controllarne l'esito direttamente dalla VM.

- Apri di nuovo il pannello **Backup** della macchina virtuale (scheda **Capabilities** → **Backup**).
- Nella sezione **Backup status**, il campo **Last backup status** mostra lo stato corrente dell'ultima operazione: ad esempio se è in corso, completata con successo oppure terminata con errori.

Questa vista, mostrata in Figura 124, è la più rapida per controllare la salute della protezione di una singola macchina, senza dover passare dal vault.

**Passo 6 — Verificare il job nel Recovery Services vault** _(stepTitle)_

Per avere una visione complessiva di tutti gli elementi protetti e dei relativi job, si utilizza il **Recovery Services vault**.

- Dal menu del portale o dalla pagina **Home**, seleziona **All resources**.
- Ordina l'elenco per **Type** e seleziona il **Recovery Services vault** associato al backup: si apre il pannello del vault.
- Nel pannello **Overview**, seleziona la scheda interna **Backup** per visualizzare un riepilogo di tutti gli elementi protetti, dello spazio di archiviazione utilizzato e dello stato corrente dei job di backup in corso o completati.

![Dashboard di backup nel Recovery Services vault](img/4-recovery-services-vault.png) _(dimensioni: 1296×655 px)_
*Figura 125: Dashboard di backup all'interno del Recovery Services vault, con il riepilogo degli elementi protetti e dei job.* _(caption)_

Il vault è il punto di osservazione centrale quando si gestiscono più macchine: da qui è possibile monitorare tutti i job, controllare il consumo di storage e individuare rapidamente eventuali backup falliti, indipendentemente dalla singola VM da cui sono partiti.

**Riepilogo dei due punti di verifica** _(stepTitle)_

A seconda di ciò che si vuole controllare, esistono due viste complementari per monitorare i backup.

| **Vista** | **Dove si trova** | **Cosa mostra** |
|---|---|---|
| **Backup status** della VM | Pannello **Backup** della singola VM | Stato dell'ultimo backup di quella macchina (Last backup status) |
| Dashboard del vault | Scheda **Backup** del **Recovery Services vault** | Riepilogo di tutti gli elementi protetti, storage usato e stato di tutti i job |

In sintesi: la vista a livello di VM risponde alla domanda "questa macchina è protetta e l'ultimo backup è andato a buon fine?", mentre la dashboard del vault offre la prospettiva d'insieme su tutta la strategia di backup.

### 6.2.5 — Ripristinare i dati di una VM

Avere un backup non basta: un piano di continuità operativa e disaster recovery (BCDR) ben fatto prevede prove periodiche di ripristino, proprio per verificare che, in caso di disastro reale, i dati possano davvero essere recuperati. Dopo aver eseguito il backup delle macchine virtuali, il passo successivo è quindi capire QUALI opzioni di ripristino esistono e QUANDO conviene usarle. In questa sezione vediamo le modalità con cui **Azure Backup** consente di ripristinare una VM di Azure a partire da un backup precedente.

**Tipi di ripristino** _(stepTitle)_

**Azure Backup** offre diversi modi per ripristinare una VM. Come visto in precedenza, il ripristino può avvenire in modalità istantanea dal livello snapshot (ideale per i recuperi operativi, perché più veloce) oppure dal livello vault (ideale per i recuperi a lungo termine). La scelta del tipo di ripristino dipende dall'obiettivo: ottenere subito una VM funzionante, personalizzarla, sostituire un disco esistente o spostare il carico in un'altra regione, sottoscrizione o zona.

| **Opzione di ripristino** | **Dettagli** |
| --- | --- |
| **Crea una nuova VM** | Crea e avvia rapidamente una VM di base a partire da un punto di ripristino. La nuova VM deve essere creata nella stessa regione della VM di origine. |
| **Ripristina disco** | Ripristina un disco della VM, che può poi essere usato per creare una nuova VM. I dischi vengono copiati nel gruppo di risorse indicato. **Azure Backup** fornisce un template per personalizzare e creare la VM; in alternativa, è possibile collegare il disco a una VM esistente oppure crearne una nuova. Utile quando si vuole personalizzare la VM o aggiungere impostazioni di configurazione che non erano presenti al momento del backup, oppure impostazioni configurabili solo tramite template o PowerShell. |
| **Sostituisci esistente** | Si ripristina un disco e lo si usa per sostituire un disco della VM esistente. Prima della sostituzione, **Azure Backup** crea uno snapshot della VM esistente e lo memorizza nel percorso di staging indicato. I dischi già collegati alla VM vengono sostituiti con quelli del punto di ripristino selezionato. La VM corrente deve esistere: questa opzione non è utilizzabile se la VM è stata eliminata. |
| **Ripristino tra regioni (regione secondaria)** | Permette di ripristinare le VM di Azure nella regione secondaria, ossia la regione abbinata (paired region) di Azure. È disponibile per le opzioni: Crea una VM e Ripristina dischi. Non è attualmente supportata l'opzione Sostituisci dischi esistenti. |
| **Ripristino tra sottoscrizioni (Cross Subscription Restore)** | I Backup Admin e gli App Admin possono eseguire il ripristino anche nelle regioni secondarie. Questa modalità: consente di ripristinare VM o dischi in una sottoscrizione diversa, ma all'interno dello stesso tenant della sottoscrizione di origine (secondo le capacità di controllo degli accessi in base al ruolo, RBAC, dai punti di ripristino); è consentita solo se la proprietà Cross Subscription Restore è abilitata sul **Recovery Services vault**; funziona insieme a Cross Region Restore e Cross Zonal Restore; è attivabile solo per VM gestite (managed); è supportata per il ripristino con identità del servizio gestite (MSI); non è supportata per i punti di ripristino del livello snapshot; non è supportata per VM non gestite e per VM cifrate con ADE (Advanced Digital Encryption). |
| **Ripristino tra zone (Cross Zonal Restore)** | Consente di ripristinare VM o dischi associati a una zona qualsiasi verso zone di disponibilità diverse (secondo le capacità RBAC) a partire dai punti di ripristino. Quando si seleziona una zona, viene scelta la zona logica (non quella fisica) in base alla sottoscrizione di Azure usata per il ripristino. È attivabile solo per VM gestite; è supportata con identità del servizio gestite (MSI); supporta il ripristino di una VM associata o non associata a zona da un vault con Zone-Redundant Storage (ZRS) abilitato; può ripristinare una VM associata a una zona da un vault con Cross Region Restore (CRR) solo se la regione secondaria supporta le zone oppure se è abilitato lo ZRS; è supportata dalle regioni secondarie; non è supportata dai punti di ripristino snapshot; non è supportata per le VM di Azure cifrate. |
| **Backup selettivo dei dischi (Selective disk backup)** | Consente di eseguire il backup e il ripristino di dischi selezionati della VM tramite la policy avanzata (Enhanced policy). Permette di sottoporre a backup solo un sottoinsieme dei dischi dati collegati alla VM e poi di ripristinarne un sottoinsieme dal punto di ripristino, sia dal livello istantaneo (instant restore) sia dal vault. È utile quando: i dati critici risiedono solo in alcuni dischi della VM; si usano soluzioni di backup del database e si vuole sottoporre a backup solo il disco del sistema operativo per ridurre i costi. |

**Recuperare singoli file da un backup** _(stepTitle)_

Non è sempre necessario ripristinare l'intera VM: è possibile recuperare anche singoli file da un punto di ripristino. Il meccanismo consiste nel montare lo snapshot sulla macchina di destinazione usando l'iSCSI initiator presente sulla macchina stessa. In questo modo si accede al contenuto del punto di ripristino come se fosse un disco collegato e si copiano solo i file desiderati.

> **Nota**: per approfondire la procedura, vedere "Recover files from Azure virtual machine backup" nella documentazione di Azure Backup.
_(infoBox)_

**Ripristinare una VM cifrata** _(stepTitle)_

**Azure Backup** supporta il backup e il ripristino di macchine cifrate tramite **Azure Disk Encryption**. La cifratura del disco si appoggia ad **Azure Key Vault** per gestire i segreti associati al disco cifrato. Per un ulteriore livello di sicurezza, è possibile usare le chiavi di cifratura delle chiavi (KEK, key vault encryption keys) per cifrare i segreti prima che vengano scritti nel key vault.

Quando si ripristinano VM cifrate, valgono però alcune limitazioni importanti:

- **Azure Backup** supporta solo la cifratura con chiave standalone. Non è attualmente supportata alcuna chiave che faccia parte di un certificato.
- Il ripristino a livello di singolo file o cartella non è supportato per le VM cifrate. Per recuperare a quel livello di granularità occorre ripristinare l'intera VM e poi copiare manualmente i file o le cartelle.
- L'opzione **Sostituisci VM esistente** non è disponibile per le VM cifrate.

### 6.2.6 — Procedura guidata: ripristinare i dati di una VM

Eseguire i backup è solo metà del lavoro: il vero valore di una strategia di protezione si misura nel momento del ripristino. Quando una VM viene compromessa, corrotta o cancellata per errore, **Azure Backup** consente di riportare in linea i dati a partire da un punto nel tempo precedente al problema. Questa guida descrive l'intero percorso di ripristino di una VM: dall'apertura del menu **Backup**, alla scelta del **restore point**, fino alla configurazione del ripristino e al monitoraggio del job. Comprendere bene questo flusso è essenziale perché, in uno scenario reale di disaster recovery, ogni minuto conta e le opzioni scelte determinano se si ottiene una nuova VM pulita oppure si sovrascrive quella esistente.

**Preparare uno storage account di staging** _(stepTitle)_

Prima di avviare il ripristino conviene predisporre uno **storage account** che fungerà da posizione di staging (gittone temporaneo). Durante alcune tipologie di ripristino — in particolare quando si ripristinano i dischi o si sostituisce la VM esistente — Azure usa questo storage account come area di lavoro intermedia in cui i file dei dischi vengono materializzati prima di essere ricollegati alla VM. Per questo motivo lo storage account deve trovarsi nello stesso scenario logico del ripristino (tipicamente stesso resource group e stessa regione della VM, ad esempio la regione della VM di origine).

> **Importante**: lo storage account di staging serve solo come area temporanea per il processo di ripristino. Conviene crearlo in anticipo, perché la procedura guidata di ripristino lo richiede e non si vuole interromperne il flusso per crearlo al volo.
_(infoBox)_

**Arrestare la VM prima del ripristino in sostituzione** _(stepTitle)_

Se l'obiettivo è sostituire una VM esistente, è necessario che quella VM sia arrestata (stato *Stopped/Deallocated*). Un backup non può essere ripristinato sopra una VM che è allocata e in esecuzione: se si dimentica di arrestarla, Azure restituisce un errore e il job non parte. La logica è semplice: non si possono sovrascrivere in sicurezza i dischi di una macchina che li sta usando attivamente. Dalla pagina **Overview** della VM si seleziona quindi **Stop** e si conferma l'operazione. Questo passo non è necessario quando si sceglie di creare una nuova VM, perché in quel caso la VM di origine non viene toccata.

**Aprire il menu Backup della VM** _(stepTitle)_

I **Recovery Services vault** sono accessibili a livello di sottoscrizione, ma quando si sta visualizzando una VM Azure fornisce un collegamento diretto al vault specifico tramite la sezione **Operations**. Per avviare il ripristino, dalla pagina della VM si scorre fino a **Operations** e si seleziona **Backup**: questa è la scorciatoia che mette in relazione la VM con il vault che ne custodisce i punti di ripristino.

![Menu dell'operazione Backup di una VM](img/6-vm-backup-menu.png) _(dimensioni: 1314×566 px)_
*Figura 126: Menu dell'operazione Backup nella sezione Operations di una VM.* _(caption)_

Dal pannello di Backup, nella barra dei comandi si seleziona **Restore VM**: si apre il pannello **Restore Virtual Machine** dedicato alla VM scelta, da cui si guida l'intera operazione.

**Selezionare un punto di ripristino (restore point)** _(stepTitle)_

Il cuore del ripristino è la scelta del **restore point**: il punto nel tempo a cui si vuole riportare la VM. Sotto la casella **Restore point** si seleziona **Select** e compare il pannello **Select restore point**, che elenca i punti disponibili. Per impostazione predefinita l'intervallo proposto copre due settimane; impostando una **Start date** appropriata si filtra l'elenco fino a trovare lo snapshot desiderato. La scelta è cruciale: occorre selezionare un punto di ripristino anteriore al momento in cui si è verificato il problema, così da recuperare dati integri e non già compromessi.

![Selezione di un punto di ripristino](img/6-restore-point.png) _(dimensioni: 845×749 px)_
*Figura 127: Selezione di un punto di ripristino entro l'intervallo di date impostato.* _(caption)_

Confermata la scelta con **OK**, si torna al pannello **Restore Virtual Machine** per definire come applicare il ripristino.

**Scegliere la configurazione di ripristino** _(stepTitle)_

La configurazione di ripristino determina cosa Azure farà con i dati recuperati. È la decisione più importante della procedura, perché distingue tra un'operazione non distruttiva e una che sovrascrive risorse esistenti. Le opzioni principali sono riassunte di seguito.

| **Opzione** | **Cosa fa** | **Quando usarla** |
| --- | --- | --- |
| **Create new** (nuova VM) | Crea una VM completamente nuova a partire dal restore point, senza toccare la VM di origine. | Quando si vuole un ripristino sicuro e non distruttivo, oppure verificare i dati prima di metterli in produzione. |
| **Restore disks** (ripristina dischi) | Ripristina i dischi nello storage account di staging, lasciando all'utente il compito di ricollegarli o creare la VM. | Quando serve massimo controllo, ad esempio per agganciare il disco ripristinato a un server esistente. |
| **Replace existing** (sostituisci esistente) | Sostituisce i dischi della VM esistente con quelli del restore point. Richiede la VM arrestata e uno storage account di staging. | Quando si vuole riportare la VM problematica esattamente com'era, mantenendone identità e configurazione. |

Nello scenario di una VM corrotta da rimettere in produzione con la stessa identità, si imposta **Replace existing** e, alla voce **Staging Location**, si seleziona dal menu a discesa lo storage account creato in precedenza. Lo staging è obbligatorio in questa modalità perché Azure ricostruisce i dischi nell'area temporanea prima di sostituirli su quella esistente.

![Opzioni di configurazione del ripristino](img/6-restore-configuration.png) _(dimensioni: 764×773 px)_
*Figura 128: Opzioni di configurazione del ripristino, con la modalità Replace existing e lo storage account di staging.* _(caption)_

> **Nota**: la modalità **Replace existing** sovrascrive i dischi della VM esistente: è un'operazione distruttiva e irreversibile sui dati attuali. Se non si è certi del punto di ripristino o si vuole conservare lo stato corrente, preferire **Create new** o **Restore disks**.
_(infoBox)_

Completata la configurazione, si seleziona **Restore** per avviare l'operazione. Nell'area delle notifiche, in alto a destra, compare il messaggio che segnala l'avvio del ripristino per la VM (ad esempio *Triggering restore*), a conferma che il job è stato accodato.

**Avviare e monitorare il job di ripristino** _(stepTitle)_

Il ripristino non è istantaneo: è un job asincrono gestito dal **Recovery Services vault**, e va seguito fino al completamento per avere la certezza che sia andato a buon fine. Nella sezione **Alerts and Jobs** del pannello di Backup si seleziona **View all Jobs** per aprire l'elenco **Backup Jobs**. Individuato il job di tipo **Restore**, nella colonna **Details** si seleziona **View details** per aprirne la scheda dedicata.

![Avanzamento del job di ripristino](img/6-restore-progress.png) _(dimensioni: 1720×593 px)_
*Figura 129: Scheda di avanzamento del job di ripristino con stato in tempo reale.* _(caption)_

Nella scheda del job si possono monitorare tre informazioni chiave:

- **Job details**: i dettagli del job di ripristino avviato per quella VM (VM di destinazione, vault, restore point usato).
- **Job status**: l'avanzamento in tempo reale del ripristino, che permette di seguire lo stato fino al completamento.
- **Sub tasks**: nome e stato delle singole attività che compongono il job, utili per capire a che punto è il processo e per diagnosticare eventuali blocchi.

Quando lo stato del job passa a completato con successo, il ripristino è concluso: a seconda della configurazione scelta, si avrà una nuova VM, i dischi nello storage di staging pronti per essere ricollegati, oppure la VM esistente riportata al contenuto del restore point selezionato. Monitorare il job fino in fondo è la garanzia finale che la strategia di protezione dei dati ha funzionato come previsto.

## 6.3 — Monitorare le VM di Azure con Azure Monitor

### 6.3.1 — Introduzione

Immagina di essere l'amministratore IT del sito web di un gruppo musicale ospitato su macchine virtuali (VM) di Azure. Il sito eroga servizi mission-critical, come la prenotazione dei biglietti, le informazioni sulle venue e gli aggiornamenti sul tour, e deve rispondere rapidamente restando sempre disponibile, anche durante aggiornamenti frequenti e picchi di traffico. Il tuo obiettivo è mantenere dimensioni e memoria delle VM adeguate a ospitare il sito senza sostenere costi inutili e, allo stesso tempo, prevenire in modo proattivo e risolvere velocemente eventuali problemi di accesso, sicurezza e prestazioni. Per riuscirci, hai bisogno di monitorare in modo semplice e immediato traffico, integrità, prestazioni ed eventi delle tue VM.

**Azure Monitor** offre funzionalità di monitoraggio integrate e personalizzabili che permettono di tenere sotto controllo l'integrità, le prestazioni e il comportamento sia dell'host della VM sia del sistema operativo, dei carichi di lavoro e delle applicazioni in esecuzione al suo interno. In questa sezione imparerai a visualizzare i dati di monitoraggio dell'host della VM, a configurare le regole di avviso consigliate e a sfruttare **VM insights** e le regole di raccolta dati (**Data Collection Rule**, DCR) personalizzate per raccogliere e analizzare i dati di monitoraggio provenienti dall'interno delle tue VM.

### 6.3.2 — Monitoraggio delle VM di Azure

Tenere sotto controllo le macchine virtuali non significa solo sapere se sono accese: vuol dire raccogliere dati nel tempo per capire come si comportano, individuare colli di bottiglia prima che diventino disservizi e dimensionare correttamente le risorse per non sprecare budget. Lo strumento centrale per farlo è **Azure Monitor**, una soluzione completa per raccogliere, analizzare e reagire ai dati di monitoraggio provenienti da risorse Azure e non Azure, incluse le VM. **Azure Monitor** si basa su due funzionalità principali: le metriche (**Azure Monitor Metrics**) e i log (**Azure Monitor Logs**).

Capire la differenza tra queste due famiglie di dati è fondamentale, perché determina cosa puoi misurare e per quanto tempo conservi le informazioni.

- Le **metriche** sono valori numerici raccolti a intervalli predefiniti per descrivere un aspetto del sistema. Possono misurare le prestazioni della VM, l'utilizzo delle risorse, il numero di errori, i tempi di risposta agli utenti o qualunque altro aspetto quantificabile. **Azure Monitor Metrics** monitora automaticamente un insieme predefinito di metriche per ogni VM di Azure e ne conserva i dati per 93 giorni (con alcune eccezioni).
- I **log** sono eventi di sistema registrati che contengono un timestamp e diversi tipi di dati strutturati o in formato libero. Azure registra automaticamente i log attività (**activity log**) per tutte le risorse e li rende disponibili a livello di risorsa. A differenza delle metriche, **Azure Monitor** non raccoglie gli altri log per impostazione predefinita: devi configurare **Azure Monitor Logs** per raccoglierli da una qualsiasi risorsa Azure. I dati di log vengono archiviati in un **Log Analytics workspace** per essere interrogati e analizzati.

> **Nota**: in sintesi, le metriche sono ideali per valori numerici campionati frequentemente e a breve ritenzione, mentre i log servono per analisi più ricche, eventi testuali e conservazione a lungo termine.
_(infoBox)_

**Gli strati di monitoraggio di una VM** _(stepTitle)_

Una VM di Azure non è un'entità monolitica: è composta da più strati sovrapposti, ognuno con esigenze di telemetria e monitoraggio diverse. Riconoscere questi strati aiuta a capire dove cercare i dati quando qualcosa non funziona e quali strumenti servono per ciascun livello. Gli strati da monitorare sono:

- L'**host della VM** (host VM)
- Il **sistema operativo guest** (guest OS)
- I **carichi di lavoro client** (client workload)
- Le **applicazioni** che vengono eseguite sulla VM

![Architettura fondamentale di una VM e strati di monitoraggio](img/monitoring-layers.png) _(dimensioni: 894×461 px)_
*Figura 130: Architettura fondamentale di una VM con i diversi strati da monitorare (host e guest).* _(caption)_

La distinzione chiave è tra ciò che Azure vede dall'esterno (l'host) e ciò che accade dentro il sistema operativo (il guest). L'host viene monitorato automaticamente dalla piattaforma; per il guest, invece, serve installare un agente, come vedremo più avanti.

**Monitoraggio dell'host della VM** _(stepTitle)_

L'host della VM rappresenta le risorse di calcolo, archiviazione e rete che Azure alloca alla macchina virtuale. Poiché questo strato è gestito dalla piattaforma, Azure è in grado di osservarlo direttamente senza alcun agente installato.

Le **metriche dell'host** misurano gli aspetti tecnici della VM, come l'utilizzo del processore e se la macchina è in esecuzione. Sono utili per:

- Generare un avviso quando la VM si avvicina ai limiti di disco o di CPU.
- Identificare tendenze o pattern di utilizzo.
- Controllare i costi operativi, dimensionando le VM in base all'uso e alla domanda reali.

Azure raccoglie automaticamente le metriche di base dell'host. Nella pagina **Panoramica** (Overview) della VM nel portale di Azure trovi grafici predefiniti per le metriche più importanti dell'host:

- Disponibilità della VM (VM availability)
- Percentuale di utilizzo della CPU (media)
- Utilizzo del disco del sistema operativo (totale)
- Operazioni di rete (totale)
- Operazioni su disco al secondo (media)

Per andare oltre i grafici predefiniti puoi usare **Azure Monitor Metrics Explorer**, che ti permette di tracciare grafici aggiuntivi, indagare i cambiamenti e correlare visivamente le tendenze delle metriche. Con Metrics Explorer puoi:

- Tracciare più metriche su uno stesso grafico, per vedere quanto traffico arriva alla VM e come si comporta.
- Seguire la stessa metrica su più VM all'interno di un resource group o di un altro ambito, usando lo *splitting* per mostrare ogni VM separatamente sul grafico.
- Selezionare intervalli temporali e granularità flessibili.
- Specificare molte altre impostazioni, come il tipo di grafico e gli intervalli dei valori.
- Inviare i grafici alle workbook o aggiungerli (pin) alle dashboard, per controllare rapidamente salute e prestazioni.
- Raggruppare le metriche per intervalli di tempo, aree geografiche, cluster di server o componenti dell'applicazione.

![Grafico di utilizzo CPU e flusso in ingresso di una VM](img/2-vm-metrics-screenshot.png) _(dimensioni: 1198×723 px)_
*Figura 131: Grafico della percentuale di utilizzo della CPU e del flusso in ingresso per una VM.* _(caption)_

**Regole di avviso consigliate** _(stepTitle)_

Gli avvisi (alert) ti notificano in modo proattivo quando si verificano determinati eventi o pattern nelle metriche dell'host: anziché controllare manualmente i grafici, sei tu a essere avvisato quando qualcosa va storto. Le *regole di avviso consigliate* (recommended alert rules) sono un insieme predefinito di regole basate sulle metriche dell'host monitorate più di frequente. Queste regole definiscono livelli consigliati di utilizzo di CPU, memoria, disco e rete su cui generare un avviso, e includono anche la disponibilità della VM, avvisandoti quando la macchina smette di funzionare.

Puoi abilitare e configurare rapidamente le regole consigliate al momento della creazione della VM, oppure in seguito dalla pagina della VM nel portale. Puoi inoltre visualizzare, configurare e creare avvisi personalizzati tramite **Azure Monitor Alerts**.

**Activity log** _(stepTitle)_

**Azure Monitor** registra e mostra automaticamente i log attività (activity log) per le VM di Azure. Questi log includono informazioni come l'avvio della VM o le sue modifiche. Tramite le impostazioni di diagnostica (diagnostic settings) puoi inviare gli activity log verso destinazioni diverse, a seconda dell'obiettivo:

| **Destinazione** | **Quando usarla** |
|---|---|
| **Azure Monitor Logs** | Per query e avvisi più complessi e per una ritenzione più lunga, fino a due anni. |
| **Azure Storage** | Per l'archiviazione a lungo termine a costo ridotto. |
| **Azure Event Hubs** | Per inoltrare i dati al di fuori di Azure. |

**Diagnostica di avvio (boot diagnostics)** _(stepTitle)_

La diagnostica di avvio (boot diagnostics) raccoglie log dell'host utili per risolvere i problemi di avvio delle VM. Puoi abilitarla per impostazione predefinita alla creazione della VM, oppure in seguito per le VM già esistenti.

Una volta abilitata, puoi vedere gli screenshot generati dall'hypervisor della VM, sia per macchine Windows sia Linux, e visualizzare l'output del log della console seriale della sequenza di avvio per le macchine Linux. I dati vengono archiviati in un account di archiviazione gestito.

**Monitoraggio di guest OS, carichi di lavoro e applicazioni** _(stepTitle)_

Tutto ciò che abbiamo visto finora riguarda l'host, che Azure osserva dall'esterno. Per vedere cosa accade *dentro* la VM (il sistema operativo guest, i carichi di lavoro e le applicazioni in esecuzione) Azure non ha visibilità diretta: serve installare **Azure Monitor Agent** e configurare una **Data Collection Rule** (DCR).

Le **Data Collection Rule** definiscono quali dati raccogliere e dove inviarli. Con una DCR puoi inviare dati di tipo metrica, ovvero i *performance counter*, sia a **Azure Monitor Logs** sia a **Azure Monitor Metrics**. Puoi inoltre inviare i dati degli event log a **Azure Monitor Logs**. La distinzione è importante: **Azure Monitor Metrics** può archiviare solo dati di tipo metrica, mentre **Azure Monitor Logs** può archiviare sia metriche sia event log.

> **Importante**: senza **Azure Monitor Agent** e una DCR non è possibile raccogliere metriche e log dall'interno del sistema operativo guest. Il monitoraggio dell'host, invece, è automatico e non richiede alcun agente.
_(infoBox)_

**VM insights** _(stepTitle)_

**VM insights** è una funzionalità di **Azure Monitor** pensata per farti iniziare rapidamente a monitorare i client delle tue VM. È particolarmente utile quando vuoi esplorare l'utilizzo e le prestazioni complessive di una VM ma non sai ancora quale sia la metrica di interesse principale. **VM insights** offre:

- L'onboarding semplificato di **Azure Monitor Agent** per abilitare il monitoraggio del guest OS e dei carichi di lavoro.
- Una **Data Collection Rule** preconfigurata che monitora e raccoglie i performance counter più comuni per Windows e Linux.
- Grafici di metriche di tendenza e workbook predefiniti relativi al guest OS della VM.
- Un insieme di workbook predefiniti che mostrano nel tempo le metriche client raccolte dalla VM.
- Facoltativamente, la raccolta dei processi in esecuzione sulla VM, delle dipendenze con altri servizi e una mappa delle dipendenze (dependency map) che visualizza i componenti interconnessi con altre VM e fonti esterne.

I workbook predefiniti di **VM insights** mostrano prestazioni, connessioni, porte attive, traffico e altri dati raccolti da una o più VM. Puoi consultare i dati direttamente dalla singola VM, oppure ottenere una vista combinata di più VM per valutare tendenze e pattern trasversali. Puoi modificare le configurazioni dei workbook predefiniti o crearne di personalizzati.

**Dati degli event log del client** _(stepTitle)_

La DCR creata da **VM insights** raccoglie un insieme specifico di performance counter. Per raccogliere altri dati, come gli event log, devi creare una DCR separata che specifichi quali dati raccogliere dalla VM e dove inviarli. **Azure Monitor** archivia i dati di log raccolti in un **Log Analytics workspace**: da lì puoi accedervi e analizzarli tramite query scritte in **Kusto Query Language** (KQL).

### 6.3.3 — Procedura guidata: monitorare i dati host della VM

Quando si crea una macchina virtuale dal portale Azure è possibile attivare fin da subito alcune funzionalità di monitoraggio integrate, senza dover installare agenti o configurare risorse aggiuntive. Il vantaggio è immediato: appena la VM si avvia, **Azure Monitor** inizia a raccogliere automaticamente le metriche di base dell'host e i log delle attività. In questa guida vediamo come abilitare i **boot diagnostics** e le regole di avviso consigliate durante la creazione, e come consultare poi le metriche della piattaforma (host), i boot diagnostics e l'activity log.

> **Perché farlo in fase di creazione**: abilitare il monitoraggio già nella scheda Monitoring evita configurazioni manuali successive e garantisce che la raccolta dati parta dal primo avvio della VM, così da avere subito una baseline di salute e prestazioni.
_(infoBox)_

**Abilitare le regole di avviso consigliate** _(stepTitle)_

Durante la creazione della VM, dopo aver compilato la scheda **Basics** (sottoscrizione, gruppo di risorse, nome della VM e immagine, ad esempio Ubuntu Server LTS), spostarsi sulla scheda **Monitoring**.

- Selezionare la casella **Enable recommended alert rules**.
- Nella schermata **Set up recommended alert rules**, lasciare selezionate tutte le regole di avviso proposte (è possibile regolarne i valori soglia se necessario).
- In **Notify me by**, selezionare **Email** e inserire un indirizzo a cui ricevere le notifiche di avviso.
- Selezionare **Save** per confermare.

Le regole consigliate coprono condizioni tipiche di salute e prestazioni della VM (ad esempio CPU elevata o disponibilità della macchina), così da essere avvisati tempestivamente quando un valore supera la soglia.

**Abilitare i boot diagnostics** _(stepTitle)_

Sempre nella scheda **Monitoring**, sotto la sezione **Diagnostics**, in corrispondenza di **Boot diagnostics** verificare che sia selezionata l'opzione **Enable with managed storage account (recommended)**. I boot diagnostics catturano una schermata e il log seriale generati durante l'avvio della VM, strumenti preziosi per diagnosticare problemi di startup.

> **Importante**: non selezionare **Enable OS guest diagnostics**. Il Linux Diagnostics Agent (LAD) è deprecato; la raccolta delle metriche guest OS si potrà abilitare in seguito tramite **VM insights** e le **Data Collection Rule**.
_(infoBox)_

![Scheda Monitoring nella creazione della VM](img/create-vm-monitoring.png) _(dimensioni: 1019×643 px)_
*Figura 132: Scheda Monitoring e configurazione delle regole di avviso nella pagina di creazione della macchina virtuale.* _(caption)_

Per completare, selezionare **Review + create** in fondo alla pagina e, superata la validazione, selezionare **Create**. Nella finestra **Generate new key pair** scegliere **Download private key and create resource** per scaricare la chiave privata e avviare il deployment. La creazione richiede qualche minuto; al termine, selezionare **Go to resource** per aprire la VM.

**Visualizzare le platform metrics (host)** _(stepTitle)_

Una volta creata la VM, **Azure Monitor** raccoglie automaticamente le metriche di base dell'host (le cosiddette platform metrics), senza alcun agente. Questi grafici, insieme agli avvisi consigliati appena attivati, permettono di capire se e quando la VM incontra problemi di salute o di prestazioni.

- Dalla pagina **Overview** della VM, selezionare la scheda **Monitoring**.
- In **Performance and utilization** > **Platform metrics**, consultare i grafici delle metriche. Se non compaiono tutti subito, selezionare **Show more metrics**.

I grafici disponibili per impostazione predefinita sono:

| **Metrica** | **Cosa mostra** |
|---|---|
| **VM Availability** | Disponibilità della macchina virtuale |
| **CPU (average)** | Utilizzo medio della CPU |
| **Disk bytes (total)** | Byte totali letti/scritti su disco |
| **Network (total)** | Traffico di rete totale |
| **Disk operations/sec (average)** | Operazioni disco al secondo (media) |

![Grafici delle platform metrics nella pagina Overview](img/platform-metrics.png) _(dimensioni: 1162×739 px)_
*Figura 133: Grafici delle platform metrics nella pagina Overview della VM.* _(caption)_

> **Nota**: nella sezione **Guest OS metrics** si noterà che le metriche del sistema operativo guest non vengono ancora raccolte. Per ottenerle occorre configurare **VM insights** e le **Data Collection Rule**, trattate più avanti.
_(infoBox)_

**Consultare l'activity log** _(stepTitle)_

L'activity log registra le operazioni eseguite sulla risorsa (creazione, modifiche, eventi di gestione). Per consultarlo, selezionare **Activity log** dal menu di navigazione sinistro della VM. Le stesse voci possono essere recuperate anche tramite PowerShell o la Azure CLI.

**Consultare i boot diagnostics** _(stepTitle)_

Avendo abilitato i boot diagnostics in fase di creazione, è ora possibile esaminare i dati di avvio per risolvere eventuali problemi di startup.

- Nel menu di navigazione sinistro della VM, sotto **Help**, selezionare **Boot diagnostics**.
- Nella pagina **Boot diagnostics**, selezionare **Screenshot** per visualizzare una schermata di avvio catturata dall'hypervisor, oppure **Serial log** per leggere i messaggi di log generati all'avvio della VM.

![Schermata dei boot diagnostics della VM](img/3-boot-diagnostics.png) _(dimensioni: 920×667 px)_
*Figura 134: Schermata di avvio catturata dai boot diagnostics della VM.* _(caption)_

### 6.3.4 — Usare Esplora metriche per le metriche host

I grafici delle metriche già pronti per una VM sono comodi, ma mostrano solo un insieme predefinito di dati. Quando devi correlare due grandezze diverse — per esempio capire come il traffico in ingresso verso la tua VM incide sulla sua capacità di CPU — quei grafici da soli non bastano. È qui che entra in gioco **Esplora metriche** (Metrics Explorer): ti permette di costruire grafici personalizzati combinando le metriche che vuoi. In questo scenario l'obiettivo è tracciare un unico grafico che mostri insieme la percentuale massima di CPU della VM e il flusso medio dei dati in ingresso, così da osservare a colpo d'occhio l'eventuale relazione tra i due valori.

**Azure Monitor Metrics Explorer** offre un'interfaccia grafica per esplorare e analizzare le metriche delle VM. Il punto di forza è che non sei limitato alle metriche dei grafici predefiniti: puoi visualizzare e creare grafici personalizzati per molte metriche host della VM, andando ben oltre quello che vedi nelle viste built-in.

**Capire Esplora metriche** _(stepTitle)_

Per aprire **Esplora metriche** hai a disposizione tre strade diverse, a seconda di dove ti trovi nel portale:

- Seleziona **Metrics** dal menu di navigazione a sinistra della VM, sotto **Monitoring**.
- Seleziona il collegamento **See all Metrics** accanto a **Platform metrics**, nella scheda **Monitoring** della pagina **Overview** della VM.
- Seleziona **Metrics** dal menu di navigazione a sinistra nella pagina **Overview** di **Azure Monitor**.

![Interfaccia di Esplora metriche](img/metrics-explorer.png) _(dimensioni: 1189×640 px)_
*Figura 135: Schermata di Esplora metriche (Metrics Explorer).* _(caption)_

Una volta dentro Esplora metriche, costruisci il grafico scegliendo i valori da alcuni menu a discesa. Capire cosa rappresenta ciascun campo è importante perché ti dà il controllo preciso su quali dati visualizzare e come aggregarli:

- **Scope** (ambito): se apri Esplora metriche da una VM, questo campo è già precompilato con il nome della VM. Puoi aggiungere altri elementi purché siano dello stesso tipo di risorsa (VM) e della stessa posizione.
- **Metric Namespace** (spazio dei nomi della metrica): la maggior parte dei tipi di risorsa ha un solo namespace, ma per alcuni tipi devi sceglierlo. Per esempio, gli account di archiviazione hanno namespace separati per file, tabelle, BLOB e code.
- **Metric** (metrica): ogni namespace di metriche mette a disposizione molte metriche tra cui scegliere.
- **Aggregation** (aggregazione): per ogni metrica Esplora metriche applica un'aggregazione predefinita. Puoi cambiarla per ottenere informazioni diverse sulla stessa metrica.

Il concetto chiave da afferrare è quello di **aggregazione**: una metrica produce molti punti dati nel tempo, e l'aggregazione decide come riassumerli in ciascun intervallo. Scegliere l'aggregazione giusta cambia completamente il significato del grafico (la media nasconde i picchi, il massimo li evidenzia). Le funzioni di aggregazione applicabili sono:

| **Funzione** | **Significato** |
|---|---|
| **Count** | Conta il numero di punti dati. |
| **Average (Avg)** | Calcola la media aritmetica dei valori. |
| **Maximum (Max)** | Individua il valore più alto. |
| **Minimum (Min)** | Individua il valore più basso. |
| **Sum** | Somma tutti i valori. |

Infine puoi scegliere intervalli di tempo flessibili per i grafici, dagli ultimi 30 minuti fino agli ultimi 30 giorni, oppure intervalli personalizzati. Puoi anche specificare la granularità dell'intervallo temporale, da un minuto fino a un mese: più è fine la granularità, più dettagliato (ma rumoroso) sarà il grafico.

**Creare un grafico di metriche** _(stepTitle)_

Vediamo ora in pratica come costruire un grafico in Esplora metriche che mostri insieme la percentuale massima di CPU dell'host della VM e i flussi in ingresso, relativi agli ultimi 30 minuti. La procedura è la seguente:

1. Apri **Esplora metriche** selezionando **See all Metrics** nella scheda **Monitoring** della VM, oppure selezionando **Metrics** dal menu di navigazione a sinistra della VM.
2. I campi **Scope** e **Metric Namespace** sono già popolati per l'host della VM. Seleziona **Percentage CPU** dall'elenco a discesa **Metrics**.
3. Il campo **Aggregation** viene popolato automaticamente con **Avg**, ma in questo caso impostalo su **Max**: vuoi infatti vedere i picchi di CPU, non la media che li smusserebbe.

![Grafico delle metriche di CPU a livello host per una VM](img/3-view-host-level-metrics.png) _(dimensioni: 1221×633 px)_
*Figura 136: Grafico della metrica Percentage CPU a livello host per una VM.* _(caption)_

4. Seleziona **Add metric** in alto a sinistra per aggiungere una seconda metrica allo stesso grafico.
5. In **Metric**, seleziona **Inbound Flows**. Lascia **Aggregation** su **Avg**.
6. In alto a destra, seleziona **Local Time: Last 24 hours (Automatic - 15 minutes)**, cambialo in **Last 30 minutes** e seleziona **Apply**.

A questo punto il grafico mostra le due metriche sovrapposte e dovrebbe avere un aspetto simile alla schermata seguente, in cui puoi confrontare visivamente l'andamento dell'uso della CPU con quello del traffico in ingresso:

![Grafico che mostra uso della CPU e traffico in ingresso](img/3-metric-graph.png) _(dimensioni: 880×543 px)_
*Figura 137: Grafico che combina l'uso della CPU e il traffico in ingresso.* _(caption)_

> **Suggerimento**: per aggiungere un'altra metrica a un grafico già esistente usa sempre il pulsante **Add metric**; non serve creare un nuovo grafico. Combinare più metriche nello stesso grafico è proprio ciò che rende Esplora metriche utile per individuare correlazioni.
_(infoBox)_

### 6.3.5 — Raccogliere contatori di prestazioni con VM insights

Monitorare lo stato, l'utilizzo e le prestazioni dell'host della macchina virtuale è solo metà del lavoro. L'altra metà consiste nel monitorare il software e i processi che girano _dentro_ la VM, cioè il cosiddetto guest (o client): il sistema operativo e tutti i carichi di lavoro e le applicazioni che esegui. Il problema è che le metriche dell'host (raccolte automaticamente dalla piattaforma) non vedono cosa accade all'interno del sistema operativo. Per andare oltre serve un agente che osservi la VM dall'interno, e configurare manualmente questa raccolta richiede diversi passaggi. Qui entra in gioco **VM insights**, una funzionalità di **Azure Monitor** pensata per attivare rapidamente il monitoraggio del client della VM.

**Cosa fa VM insights** _(stepTitle)_

Per raccogliere i dati dall'interno della VM occorre installare l'**Azure Monitor Agent**, l'agente che legge i contatori di prestazioni del sistema operativo guest. VM insights automatizza l'intero allestimento e in particolare:

- Installa l'**Azure Monitor Agent** sulla VM.
- Crea una **Data Collection Rule** (DCR) che raccoglie e invia un set predefinito di dati di prestazione del client a un **Log Analytics workspace**.
- Presenta i dati in cartelle di lavoro (workbook) curate e già pronte.

In teoria potresti fare tutto a mano: installare l'agente, creare le DCR e costruire i workbook uno per uno. Il valore di VM insights è proprio quello di semplificare questa configurazione, offrendoti da subito una base per monitorare le prestazioni del client della VM e per mappare i processi in esecuzione sulla macchina.

**Abilitare VM insights** _(stepTitle)_

La procedura di attivazione si svolge interamente dal portale di Azure:

1. Nella pagina **Overview** della VM, seleziona **Insights** dal menu di navigazione a sinistra, sotto **Monitoring**.
2. Nella pagina **Insights**, seleziona **Enable**.
3. Sotto **Data collection rule**, prendi nota delle proprietà della **Data Collection Rule** che VM insights sta per creare. Nella descrizione della DCR, l'opzione **Processes and dependencies (Map)** è impostata su **Disabled**: puoi cambiarla in **Enabled** per abilitare la mappa delle dipendenze. Viene inoltre creato o assegnato un **Log Analytics workspace** predefinito, dove confluiranno i dati.
4. Seleziona **Configure**.

![Abilitazione e configurazione di VM insights](img/enable-insights.png) _(dimensioni: 2201×1187 px)_
*Figura 138: Abilitazione e configurazione di VM insights dalla pagina Insights della VM.* _(caption)_

> **Nota**: la configurazione del workspace e l'installazione dell'agente richiedono in genere dai 5 ai 10 minuti. Possono servire altri 5-10 minuti prima che i dati diventino disponibili per la visualizzazione nel portale.
_(infoBox)_

5. Al termine della distribuzione, conferma che l'**Azure Monitor Agent** sia installato controllando la scheda **Properties** della pagina **Overview** della VM, sotto **Extensions + applications**.

A questo punto, nella scheda **Monitoring** della pagina **Overview**, sotto **Performance and utilization**, noterai che ora vengono raccolte le **Guest OS metrics**, cioè le metriche del sistema operativo interno alla VM: è la prova concreta che l'agente sta osservando la macchina dall'interno.

![Metriche del sistema operativo guest nella scheda Monitoring](img/guest-os-metrics.png) _(dimensioni: 777×357 px)_
*Figura 139: Metriche del sistema operativo guest (Guest OS metrics) nella scheda Monitoring della VM.* _(caption)_

**Visualizzare i dati di VM insights** _(stepTitle)_

C'è un dettaglio importante da capire sul percorso dei dati. La **Data Collection Rule** creata da VM insights invia i contatori di prestazioni del client ad **Azure Monitor Logs** (cioè al **Log Analytics workspace**), non al datastore delle metriche. Di conseguenza, per consultare i dati raccolti da VM insights _non_ si usa Metrics Explorer: i grafici e le mappe vivono dentro la pagina Insights, alimentati dalle query sui log.

Per visualizzare i grafici delle prestazioni e le mappe di VM insights:

1. Seleziona **Insights** dal menu di navigazione a sinistra della VM, sotto **Monitoring**.
2. Vicino alla parte alta della pagina **Insights**, seleziona la scheda **Performance**. Il workbook predefinito **VM insights Performance** mostra grafici e diagrammi con i dati di prestazione relativi alla VM corrente.

![Workbook Performance predefinito di VM insights](img/vm-insights-performance.png) _(dimensioni: 1190×810 px)_
*Figura 140: Il workbook Performance predefinito di VM insights con i grafici delle prestazioni.* _(caption)_

   - Puoi personalizzare la vista specificando un diverso **Time range** in cima alla pagina e aggregazioni differenti in cima a ciascun grafico.
   - Seleziona **View Workbooks** per scegliere tra gli altri workbook predefiniti di VM insights. Seleziona **Go To Gallery** per accedere a una galleria di workbook e modelli di VM insights, oppure per modificare e creare i tuoi workbook personalizzati.

3. Se l'hai abilitata in precedenza (impostando **Processes and dependencies (Map)** su **Enabled**), seleziona la scheda **Map** nella pagina **Insights** per vedere il workbook della funzionalità Map. La mappa visualizza le dipendenze della VM individuando i gruppi di processi e i singoli processi in esecuzione che hanno connessioni di rete attive in un intervallo di tempo specificato. È particolarmente utile per capire come la VM comunica con gli altri sistemi e per diagnosticare problemi di connettività.

![Mappa delle dipendenze nella scheda Map di VM insights](img/dependency-map.png) _(dimensioni: 858×769 px)_
*Figura 141: Mappa delle dipendenze nella scheda Map di VM insights.* _(caption)_

### 6.3.6 — Raccogliere i log eventi del client VM

Le metriche di **Azure Monitor** e i contatori di prestazioni di **VM insights** sono ottimi per individuare le anomalie e per generare avvisi quando vengono superate determinate soglie. Da soli, però, non bastano: per capire la causa profonda (la _root cause_) di un problema rilevato, occorre andare oltre i numeri e analizzare i dati di log, cioè gli eventi di sistema che hanno causato o contribuito al problema. In questa unità vediamo come configurare una **Data Collection Rule** (DCR) per raccogliere il Syslog di una VM Linux e come consultare i log raccolti in **Azure Monitor** Log Analytics tramite una semplice query in **Kusto Query Language** (KQL).

**Perché creare una DCR personalizzata** _(stepTitle)_

Quando si attiva **VM insights**, Azure installa l'**Azure Monitor Agent** e crea automaticamente una DCR che raccoglie un set predefinito di contatori di prestazioni, mappa le dipendenze tra processi e presenta i dati in workbook precostruiti. Questa DCR automatica, però, copre solo le prestazioni: non raccoglie i log eventi. Per andare oltre puoi creare DCR personalizzate per due scopi:

- Raccogliere contatori di prestazioni aggiuntivi che la DCR di **VM insights** non include.
- Raccogliere dati di log (come il Syslog di Linux o l'Event Log di Windows), che è proprio l'obiettivo di questa unità.

Quando crei una DCR dal portale Azure puoi scegliere tra un'ampia gamma di contatori di prestazioni e frequenze di campionamento, oppure aggiungerne di personalizzati; in alternativa puoi selezionare un set predefinito di tipi di log e livelli di severità, o definire schemi di log personalizzati. Una singola DCR può essere associata a una qualsiasi o a tutte le VM della sottoscrizione, ma in pratica servono spesso più DCR per raccogliere tipi di dati diversi da VM diverse.

> **Nota**: una DCR disaccoppia la sorgente dei dati (la VM) dalla destinazione (il workspace Log Analytics) dalle regole di raccolta. È questo che ti permette di riusare la stessa configurazione su più macchine e di modificare cosa raccogliere senza toccare l'agente.
_(infoBox)_

**Aprire Azure Monitor** _(stepTitle)_

Nel portale Azure cerca e seleziona _monitor_ per aprire la pagina **Overview** di **Azure Monitor**. È il punto di partenza per gestire endpoint e regole di raccolta.

![Pagina Overview di Azure Monitor](img/monitor-overview.png) _(dimensioni: 986×614 px)_
*Figura 142: Pagina Overview di Azure Monitor, da cui si gestiscono endpoint e regole di raccolta dati.* _(caption)_

**Creare un Data Collection Endpoint** _(stepTitle)_

Prima della regola serve un punto a cui inviare i log: il **Data Collection Endpoint** (DCE). È l'indirizzo che l'agente usa per consegnare i dati. Per crearlo:

1. Nel menu di navigazione a sinistra di **Azure Monitor**, sotto **Settings**, seleziona **Data Collection Endpoints**.
2. Nella pagina **Data Collection Endpoints** seleziona **Create**.
3. Nella pagina **Create data collection endpoint**, nel campo **Name** inserisci _linux-logs-endpoint_.
4. Seleziona la stessa **Subscription**, lo stesso **Resource group** e la stessa **Region** della tua VM.
5. Seleziona **Review + create** e, quando la convalida ha esito positivo, seleziona **Create**.

> **Importante**: l'endpoint deve trovarsi nella stessa **Region** della VM. La raccolta dei log è infatti legata alla località dell'endpoint, quindi un endpoint in una region diversa non funzionerebbe per quella macchina.
_(infoBox)_

**Creare la Data Collection Rule** _(stepTitle)_

Con l'endpoint pronto, si crea la **Data Collection Rule** vera e propria:

1. Nel menu di navigazione a sinistra di **Monitor**, sotto **Settings**, seleziona **Data Collection Rules**.
2. Nella pagina **Data Collection Rules** vedrai già la DCR creata da **VM insights**. Seleziona **Create** per crearne una nuova.

![Schermata Data Collection Rules con il pulsante Create evidenziato](img/dcr-create.png) _(dimensioni: 1210×528 px)_
*Figura 143: Pagina Data Collection Rules con il pulsante Create evidenziato; è già presente la DCR generata da VM insights.* _(caption)_

3. Nella scheda **Basics** della schermata **Create Data Collection Rule** fornisci queste informazioni:
  - **Rule name**: inserisci _collect-events-linux_.
  - **Subscription**, **Resource Group** e **Region**: gli stessi della tua VM.
  - **Platform Type**: seleziona **Linux**.
4. Seleziona **Next: Resources** oppure la scheda **Resources**.

![Scheda Basics della creazione della Data Collection Rule](img/create-dcr-basics.png) _(dimensioni: 785×654 px)_
*Figura 144: Scheda Basics della schermata Create Data Collection Rule, con nome regola, sottoscrizione e tipo di piattaforma Linux.* _(caption)_

Nella scheda **Resources** colleghi la VM da monitorare e l'endpoint che hai creato:

5. Nella schermata **Resources** seleziona **Add resources**.
6. Nella schermata **Select a scope** seleziona la VM **monitored-linux-vm**, quindi seleziona **Apply**.
7. Tornato nella schermata **Resources**, seleziona **Enable Data Collection Endpoints**.
8. Sotto **Data collection endpoint** per la VM **monitored-linux-vm**, seleziona il **linux-logs-endpoint** che avevi creato.
9. Seleziona **Next: Collect and deliver** oppure la scheda **Collect and deliver**.

![Scheda Resources della creazione della Data Collection Rule](img/create-dcr-resources.png) _(dimensioni: 763×652 px)_
*Figura 145: Scheda Resources della schermata Create Data Collection Rule, con la VM e il Data Collection Endpoint associati.* _(caption)_

Nella scheda **Collect and deliver** definisci cosa raccogliere (la sorgente) e dove inviarlo (la destinazione):

10. Nella scheda **Collect and deliver** seleziona **Add data source**.
11. Nella schermata **Add data source**, sotto **Data source type**, seleziona **Linux Syslog**.
12. Sempre nella schermata **Add data source**, seleziona **Next: Destination** o la scheda **Destination** e verifica che **Account or namespace** corrisponda al workspace Log Analytics che vuoi usare. Puoi usare il workspace Log Analytics predefinito impostato da **VM insights**, oppure crearne o sceglierne un altro.
13. Nella schermata **Add data source** seleziona **Add data source**.
14. Nella schermata **Create Data Collection Rule** seleziona **Review + create** e, quando la convalida ha esito positivo, seleziona **Create**.

![Review + create nella schermata di creazione della Data Collection Rule](img/create-dcr-finish.png) _(dimensioni: 698×460 px)_
*Figura 146: Passaggio Review + create della schermata Create Data Collection Rule, pronto per la creazione della regola.* _(caption)_

**Visualizzare i dati di log** _(stepTitle)_

Una volta attiva la DCR, puoi consultare e analizzare i log raccolti con query KQL. Per le VM è disponibile un set di query KQL di esempio, ma puoi anche scriverne una tua per esaminare gli eventi che la DCR sta raccogliendo:

1. Nella pagina **Overview** della tua VM, seleziona **Logs** dal menu di navigazione a sinistra sotto **Monitoring**. Log Analytics apre una finestra di query vuota con lo scope già impostato sulla tua VM. In alternativa puoi aprire i log selezionando **Logs** dal menu di navigazione della pagina **Overview** di **Azure Monitor**; in questo caso, se necessario, usa **Select scope** in alto nella finestra di query per impostare il workspace Log Analytics e la VM desiderati.

  > **Nota**: all'apertura di Log Analytics potrebbe comparire la finestra **Queries** con le query di esempio. Per ora chiudila, perché creerai manualmente una query semplice.
  _(infoBox)_

2. Nella finestra di query vuota digita _Syslog_ e seleziona **Run**. Vengono mostrati tutti gli eventi di log di sistema che la DCR ha raccolto nell'intervallo definito da **Time range**.

```kusto
Syslog
```

3. Puoi affinare la query per isolare gli eventi che ti interessano. Ad esempio, per mostrare solo gli eventi con **SeverityLevel** pari a **warning** puoi aggiungere un filtro:

```kusto
Syslog
| where SeverityLevel == "warning"
```

![Eventi restituiti dal Syslog grazie alla DCR](img/dcr-log.png) _(dimensioni: 1053×638 px)_
*Figura 147: Eventi restituiti dal Syslog grazie alla DCR, filtrati per livello di severità in Log Analytics.* _(caption)_
