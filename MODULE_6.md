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
