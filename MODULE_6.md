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
