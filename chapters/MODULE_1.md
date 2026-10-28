# Modulo 1 — Infrastructure as Code (IaC) con Terraform

_Obiettivo 1 dell'esame: che cos'è l'Infrastructure as Code (1a), quali vantaggi offre (1b) e come Terraform gestisce workflow multi-cloud, hybrid cloud e indipendenti dal servizio (1c)._

---

## 1.1 — Che cos'è Terraform?

HashiCorp Terraform è uno strumento di infrastructure as code che permette di definire risorse sia cloud sia on-premises in file di configurazione leggibili dalle persone, che si possono versionare, riutilizzare e condividere. Con un workflow coerente si possono poi effettuare il provisioning e la gestione di tutta l'infrastruttura lungo il suo intero ciclo di vita. Terraform è in grado di gestire sia componenti di basso livello, come le risorse di calcolo, di storage e di rete, sia componenti di alto livello, come i record DNS e le funzionalità SaaS.

Per fare pratica, la pagina rimanda ai tutorial *Get Started*, che insegnano a gestire infrastruttura sui cloud provider più diffusi (Amazon Web Services, Azure, Google Cloud Platform, Oracle Cloud Infrastructure) e su Docker. Include inoltre un video in cui Armon Dadgar, co-fondatore di HashiCorp, spiega come Terraform risolve i problemi legati alla gestione dell'infrastruttura.

### 1.1.1 — Come funziona Terraform?

Terraform crea e gestisce le risorse sulle piattaforme cloud e su altri servizi attraverso le loro API (application programming interface). Sono i provider a consentire a Terraform di lavorare con praticamente qualsiasi piattaforma o servizio che esponga un'API accessibile.

![Figura 1](img/intro-terraform-apis.png) _(dimensioni: 2048×644 px)_

*Figura 1 — Terraform crea e gestisce piattaforme e servizi cloud attraverso le loro API. Fonte: HashiCorp Developer.* _(caption)_

HashiCorp e la community di Terraform hanno già scritto migliaia di provider per gestire tipi di risorse e servizi molto diversi tra loro. Tutti i provider pubblici si trovano nel Terraform Registry: tra questi ci sono Amazon Web Services (AWS), Azure, Google Cloud Platform (GCP), Kubernetes, Helm, GitHub, Splunk, DataDog e molti altri.

Il workflow principale di Terraform si compone di tre fasi. Nella fase di scrittura (**Write**) si definiscono le risorse, che possono appartenere a più cloud provider e servizi: ad esempio si può creare una configurazione che distribuisce un'applicazione su macchine virtuali in una rete VPC (Virtual Private Cloud), con security group e un load balancer. Nella fase di pianificazione (**Plan**) Terraform crea un piano di esecuzione che descrive l'infrastruttura che creerà, aggiornerà o distruggerà, in base all'infrastruttura esistente e alla configurazione. Nella fase di applicazione (**Apply**), dopo l'approvazione, Terraform esegue le operazioni proposte nell'ordine corretto, rispettando le dipendenze tra le risorse: se ad esempio si modificano le proprietà di una VPC e si cambia il numero di macchine virtuali al suo interno, Terraform ricrea la VPC prima di scalare le macchine virtuali.

![Figura 2](img/intro-terraform-workflow.png) _(dimensioni: 2038×1773 px)_

*Figura 2 — Il workflow di Terraform si articola in tre fasi: Write, Plan e Apply. Fonte: HashiCorp Developer.* _(caption)_

### 1.1.2 — Perché Terraform?

Terraform permette di definire e gestire l'infrastruttura in modo coerente e ripetibile, usando file di configurazione leggibili dalle persone che si possono versionare, riutilizzare e condividere. La documentazione ne riassume i vantaggi in cinque punti.

**Gestire qualsiasi infrastruttura** _(stepTitle)_

Nel Terraform Registry si trovano provider per molte delle piattaforme e dei servizi che si usano già, ed è anche possibile scriverne di propri. Terraform adotta un approccio immutabile all'infrastruttura, che riduce la complessità dell'aggiornamento o della modifica di servizi e infrastruttura.

**Tenere traccia dell'infrastruttura** _(stepTitle)_

Prima di modificare l'infrastruttura, Terraform genera un piano e chiede l'approvazione. Inoltre tiene traccia dell'infrastruttura reale in un file di state, che fa da fonte di verità per l'ambiente: Terraform usa lo state per stabilire quali modifiche apportare affinché l'infrastruttura corrisponda alla configurazione.

**Automatizzare le modifiche** _(stepTitle)_

I file di configurazione di Terraform sono dichiarativi, cioè descrivono lo stato finale dell'infrastruttura. Non servono istruzioni passo passo per creare le risorse, perché la logica sottostante la gestisce Terraform. Terraform costruisce un grafo delle risorse per determinarne le dipendenze e crea o modifica in parallelo le risorse che non dipendono l'una dall'altra: in questo modo il provisioning è efficiente.

**Standardizzare le configurazioni** _(stepTitle)_

Terraform supporta componenti di configurazione riutilizzabili, chiamati moduli, che definiscono insiemi configurabili di infrastruttura: fanno risparmiare tempo e favoriscono le best practice. Si possono usare i moduli pubblici del Terraform Registry oppure scriverne di propri.

**Collaborare** _(stepTitle)_

Poiché la configurazione è scritta in file, la si può salvare in un sistema di controllo versione (VCS) e usare HCP Terraform per gestire in modo efficiente i workflow Terraform tra i team. HCP Terraform esegue Terraform in un ambiente coerente e affidabile e offre accesso sicuro allo state condiviso e ai dati segreti, controlli di accesso basati sui ruoli, un registry privato per condividere moduli e provider, e altro ancora.

La pagina invita infine ad approfondire i casi d'uso di Terraform (sezione 1.4) e il confronto con gli strumenti alternativi.

### 1.1.3 — Community

HashiCorp accoglie domande, suggerimenti e contributi della community: si possono porre domande sul forum HashiCorp Discuss, leggere la guida per contribuire al progetto e segnalare bug o richiedere nuove funzionalità aprendo una issue.

- Fonte: [What is Terraform?](https://developer.hashicorp.com/terraform/intro/v1.12.x)

---

## 1.2 — Che cos'è l'Infrastructure as Code con Terraform?

Gli strumenti di Infrastructure as Code (IaC) permettono di gestire l'infrastruttura tramite file di configurazione, invece che tramite un'interfaccia grafica. L'IaC consente di creare, modificare e gestire l'infrastruttura in modo sicuro, coerente e ripetibile, definendo configurazioni di risorse che si possono versionare, riutilizzare e condividere.

Terraform è lo strumento di infrastructure as code di HashiCorp. Permette di definire risorse e infrastruttura in file di configurazione dichiarativi e leggibili dalle persone, e ne gestisce il ciclo di vita. Rispetto alla gestione manuale dell'infrastruttura offre diversi vantaggi: può gestire l'infrastruttura su più piattaforme cloud; il suo linguaggio di configurazione, facile da leggere, aiuta a scrivere rapidamente il codice dell'infrastruttura; lo state permette di tenere traccia delle modifiche alle risorse nel corso dei deployment; infine le configurazioni si possono salvare nel controllo versione per collaborare sull'infrastruttura in modo sicuro.

### 1.2.1 — Gestire qualsiasi infrastruttura

I plugin di Terraform chiamati provider permettono a Terraform di interagire con piattaforme cloud e altri servizi attraverso le loro API. HashiCorp e la community di Terraform hanno scritto oltre 1.000 provider per gestire risorse su Amazon Web Services (AWS), Azure, Google Cloud Platform (GCP), Kubernetes, Helm, GitHub, Splunk e DataDog, solo per citarne alcuni. Nel Terraform Registry si trovano provider per molte delle piattaforme e dei servizi che si usano già; se manca il provider che serve, si può scriverne uno.

### 1.2.2 — Standardizzare il workflow di deployment

I provider definiscono come risorse (*resource*) le singole unità di infrastruttura, ad esempio le istanze di calcolo o le reti private. Risorse di provider diversi si possono comporre in configurazioni Terraform riutilizzabili, chiamate moduli, e gestire con un linguaggio e un workflow coerenti.

Il linguaggio di configurazione di Terraform è dichiarativo: descrive lo stato finale desiderato dell'infrastruttura, a differenza dei linguaggi di programmazione procedurali, che richiedono istruzioni passo passo per svolgere un compito. I provider di Terraform calcolano automaticamente le dipendenze tra le risorse, in modo da crearle o distruggerle nell'ordine corretto.

Per distribuire infrastruttura con Terraform si seguono cinque passi. Prima si definisce l'ambito (*Scope*), cioè si individua l'infrastruttura necessaria al progetto; poi si scrive la configurazione dell'infrastruttura (*Author*); quindi si inizializza la directory (*Initialize*), installando i plugin di cui Terraform ha bisogno per gestire l'infrastruttura; si pianifica (*Plan*), visualizzando in anteprima le modifiche che Terraform farà per allineare l'infrastruttura alla configurazione; infine si applicano le modifiche pianificate (*Apply*).

![Figura 3](img/terraform-iac.png) _(dimensioni: 2400×870 px)_

*Figura 3 — Il workflow di deployment di Terraform. Fonte: HashiCorp Developer.* _(caption)_

### 1.2.3 — Tenere traccia dell'infrastruttura

Terraform tiene traccia dell'infrastruttura reale in un file di state, che fa da fonte di verità per l'ambiente. Terraform usa lo state per stabilire quali modifiche apportare all'infrastruttura affinché corrisponda alla configurazione.

### 1.2.4 — Collaborare

Terraform permette di collaborare sull'infrastruttura grazie ai backend di state remoti. Con HCP Terraform si può condividere lo state con i colleghi in modo sicuro, offrire a Terraform un ambiente di esecuzione stabile ed evitare le race condition quando più persone modificano la configurazione nello stesso momento. Il tutorial descrive HCP Terraform come gratuito fino a cinque utenti; la pagina dei piani di HCP Terraform indica oggi per il piano Free un limite di 500 managed resource (vedi Modulo 8).

È anche possibile collegare HCP Terraform a sistemi di controllo versione come GitHub, GitLab e altri, in modo che proponga automaticamente le modifiche all'infrastruttura quando si salvano modifiche alla configurazione nel VCS. Così le modifiche all'infrastruttura si gestiscono attraverso il controllo versione, come si fa con il codice applicativo.

### 1.2.5 — Quick start

Il tutorial include un laboratorio interattivo gratuito da riga di comando: in un terminale ospitato si usa Terraform per creare e distruggere un container Docker, seguendo i passaggi su infrastruttura reale. Il tutorial successivo della serie spiega come installare Terraform sulla propria macchina e distribuire un container Docker.

- Fonte: [What is Infrastructure as Code with Terraform?](https://developer.hashicorp.com/terraform/tutorials/aws-get-started/infrastructure-as-code)

---

## 1.3 — Infrastructure as Code in un cloud privato o pubblico

Articolo del blog HashiCorp di Larry Eichenbaum e Ahmed Belgana, pubblicato il 23 gennaio 2020. Il sito non consente di scaricarne il testo in modo automatico, quindi qui ne è riportata una sintesi fedele, sezione per sezione.

Gestire l'infrastruttura lungo tutto il suo ciclo di vita è difficile, e le decisioni sbagliate possono causare perdite economiche e danni di reputazione; in ambito governativo o militare possono perfino costare vite umane. Adottare uno strumento di IaC come Terraform, insieme a strumenti, processi e workflow consolidati, aiuta a ridurre questi rischi. Molte organizzazioni che passano al cloud, però, continuano a gestirlo come gestivano l'hardware on-premises: accedono alle console web o direttamente ai sistemi e apportano le modifiche tramite interfaccia grafica o riga di comando, invece di usare l'IaC.

Fare infrastructure as code significa definire in file di definizione i componenti dell'infrastruttura, come CPU, memoria, dischi e firewall. Un tempo i comandi negli script erano difficili da leggere per le persone; il codice IaC moderno, invece, è leggibile sia dalle persone sia dalle macchine, si può testare, permette di tracciare le modifiche tra un'iterazione e l'altra e di riutilizzare componenti, i moduli, in progetti diversi. Questo spiega la grande diffusione che l'IaC ha avuto.

### 1.3.1 — L'IaC e il ciclo di vita dell'infrastruttura

L'IaC riguarda sia la costruzione iniziale dell'infrastruttura sia la sua vita successiva. Il codice del **Day 0** effettua il provisioning e la configurazione dell'infrastruttura iniziale, mentre il **Day 1** comprende la configurazione del sistema operativo e delle applicazioni, applicata dopo la costruzione iniziale. Se l'infrastruttura non cambia più dopo essere stata costruita, gli strumenti per gli aggiornamenti successivi potrebbero non servire.

L'IaC offre workflow coerenti, perché usa una sola sintassi per provider diversi come VMware, AWS, Azure e GCP, e rende chiaro l'intento: il codice può essere suddiviso in più file e organizzato per scopo, ad esempio separando le definizioni dei componenti da quelle delle variabili, senza cambiare il modo in cui viene eseguito. Come esempio di codice leggibile sia dalle persone sia dalle macchine, l'articolo mostra una breve risorsa `aws_vpc` con il blocco CIDR `10.0.0.0/16`, simile a questa:

```
resource "aws_vpc" "main" {
  cidr_block = "10.0.0.0/16"
}
```

L'articolo ricorda poi che Terraform mette a disposizione librerie di provider e di moduli che semplificano la scrittura del codice di provisioning e di configurazione. Per il Day 0 mostra un provisioner `remote-exec` che, subito dopo la creazione della macchina, esegue i comandi per aggiornare `apt`, installare nginx e avviare il servizio: un approccio comune quando serve solo il lavoro del Day 0. Per la configurazione continua, dal Day 1 al Day N, suggerisce strumenti come Chef, Ansible o Docker, e mostra una configurazione Chef con l'URL del server e una run list che include una ricetta. Per un esempio più complesso rimanda a un tutorial che distribuisce un'applicazione a due livelli su cluster Kubernetes multi-cloud federati.

> **Nota**: i provisioner dedicati a strumenti come Chef, Puppet e Salt, disponibili quando è stato scritto l'articolo, sono stati rimossi da Terraform nella versione 0.15.
_(infoBox)_

### 1.3.2 — L'IaC rende l'infrastruttura più affidabile

Con l'IaC le modifiche diventano idempotenti, coerenti, ripetibili e prevedibili. Scalare l'infrastruttura a mano è soggetto a errori: bisogna collegarsi a ogni macchina ed eseguire i comandi uno per uno, in più sessioni, e così si saltano passaggi, si creano differenze tra un server e l'altro e si è costretti a tornare indietro; un comando eseguito male su un'istanza potrebbe dover essere annullato e rieseguito. Queste incoerenze si accumulano e possono influire su prestazioni, usabilità o sicurezza, e il rischio cresce quante più persone applicano modifiche manuali.

Con l'IaC, invece, i team possono testare il codice e verificarne i risultati prima di applicarlo, iterando finché il risultato non è quello atteso: così si può prevedere l'esito prima di arrivare in produzione, e poi l'automazione applica il codice su larga scala. I sistemi di controllo versione come GitHub, GitLab e Bitbucket registrano come l'infrastruttura evolve nel tempo. Idempotenza significa che applicare più volte lo stesso codice produce sempre lo stesso risultato.

### 1.3.3 — L'IaC rende l'infrastruttura più gestibile

Terraform permette di modificare l'infrastruttura attraverso il codice, quando serve. L'articolo propone uno scenario: un ambiente con alcuni server e un load balancer deve gestire più carico. Il team modifica il codice IaC con interventi minimi, riusando la configurazione esistente per aggiungere server. Terraform confronta lo stato dell'infrastruttura in esecuzione con il nuovo stato desiderato e mostra le modifiche necessarie; dopo l'approvazione applica solo quelle e lascia intatta l'infrastruttura già valida.

### 1.3.4 — L'IaC ha senso

La conclusione riprende l'introduzione: gestire l'infrastruttura è difficile, e per ridurre i rischi è necessario adottare uno strumento di IaC come Terraform, insieme agli strumenti, ai processi e ai workflow collegati. L'articolo rimanda alla documentazione di Terraform e ai tutorial di HashiCorp Learn per approfondire.

- Fonte: [Infrastructure as Code in a Private or Public Cloud](https://www.hashicorp.com/blog/infrastructure-as-code-in-a-private-or-public-cloud)

---

## 1.4 — Casi d'uso di Terraform

HashiCorp Terraform è uno strumento di infrastructure as code che permette di definire le risorse dell'infrastruttura in file di configurazione leggibili dalle persone, che si possono versionare, riutilizzare e condividere. Con un workflow coerente si può poi effettuare il provisioning e la gestione dell'infrastruttura in modo sicuro ed efficiente lungo tutto il suo ciclo di vita. La pagina descrive i casi d'uso più diffusi di Terraform e indica, per ciascuno, risorse utili per creare configurazioni e workflow.

### 1.4.1 — Deployment multi-cloud

Distribuire l'infrastruttura su più cloud aumenta la tolleranza ai guasti e permette di riprendersi meglio dalle interruzioni di un cloud provider. I deployment multi-cloud, però, aggiungono complessità, perché ogni provider ha interfacce, strumenti e workflow propri. Terraform consente di usare lo stesso workflow per gestire più provider e di gestire le dipendenze tra cloud diversi: questo semplifica la gestione e l'orchestrazione di infrastrutture multi-cloud su larga scala.

Per approfondire, la pagina suggerisce il tutorial *Deploy Federated Multi-Cloud Kubernetes Clusters*, che crea cluster Kubernetes su Azure e su AWS, configura la federazione Consul con mesh gateway tra i due cluster e vi distribuisce dei microservizi per verificarla; invita inoltre a esplorare il Terraform Registry, che contiene migliaia di provider pubblici.

### 1.4.2 — Deployment, scaling e monitoraggio dell'infrastruttura applicativa

Terraform permette di distribuire, rilasciare, scalare e monitorare in modo efficiente l'infrastruttura delle applicazioni multi-tier. L'architettura N-tier consente di scalare i componenti dell'applicazione in modo indipendente e separa le responsabilità: un'applicazione può essere composta da un pool di web server che usano un livello di database, con ulteriori livelli per i server API, i server di cache e i routing mesh. Terraform gestisce insieme le risorse di ogni livello e si occupa automaticamente delle dipendenze tra livelli: ad esempio distribuisce il livello di database prima di creare i web server che ne dipendono.

Tra le risorse indicate c'è il tutorial *Automate Monitoring with the Terraform Datadog Provider*, che distribuisce un'applicazione Nginx di esempio su un cluster Kubernetes con Helm e installa nel cluster l'agente Datadog, che riporta lo stato del cluster nella dashboard di Datadog. C'è poi il tutorial *Use Application Load Balancers for Blue-Green and Canary Deployments*, in cui si creano gli ambienti blue e green, si aggiungono alla configurazione Terraform dei feature toggle per definire le possibili strategie di deployment, si esegue un canary test e si promuove gradualmente l'ambiente green.

### 1.4.3 — Cluster self-service

In una grande organizzazione il team operativo centrale può ricevere molte richieste di infrastruttura ripetitive. Con Terraform si può costruire un modello di infrastruttura *self-service*, in cui i team di prodotto gestiscono la propria infrastruttura in autonomia. Si creano e si usano moduli Terraform che codificano gli standard dell'organizzazione per il deployment e la gestione dei servizi, così i team possono distribuire servizi in modo efficiente e conforme alle pratiche aziendali. HCP Terraform può anche integrarsi con sistemi di ticketing come ServiceNow, per generare automaticamente nuove richieste di infrastruttura.

Le risorse indicate sono i tutorial *Use Modules from the Registry*, per iniziare a usare i moduli pubblici nella propria configurazione, e *Build and Use a Local Module*, per creare un modulo che gestisce bucket AWS S3, oltre alle istruzioni per collegare il Service Catalog di ServiceNow a HCP Terraform.

### 1.4.4 — Conformità e gestione delle policy

Terraform aiuta a far rispettare delle policy sui tipi di risorse che i team possono creare e usare. I processi di revisione basati su ticket sono un collo di bottiglia che rallenta lo sviluppo; in alternativa si può usare Sentinel, un framework di policy as code, per applicare automaticamente le policy di conformità e di governance prima che Terraform modifichi l'infrastruttura. Le policy Sentinel sono disponibili in Terraform Enterprise e in HCP Terraform.

La pagina rimanda alla documentazione sulla *cost estimation*, che spiega come usare la stima dei costi e come definire policy che limitano i costi legati alle modifiche dell'infrastruttura, e alla documentazione di Sentinel, che offre approfondimenti e un elenco di policy di esempio da adattare ai propri casi.

### 1.4.5 — Configurazione di applicazioni PaaS

I fornitori di Platform as a Service (PaaS) come Heroku permettono di creare applicazioni web e di collegarvi degli add-on, come database o servizi di posta elettronica. Heroku può scalare in modo elastico il numero di dyno o di worker, ma la maggior parte delle applicazioni non banali richiede molti add-on e servizi esterni. Con Terraform si può codificare la configurazione necessaria per un'applicazione Heroku, configurare DNSimple per impostare un record CNAME e Cloudflare come CDN (Content Delivery Network) per l'applicazione. Terraform fa tutto questo in modo rapido e coerente, senza passare da un'interfaccia web. Il tutorial *Deploy, Manage, and Scale an Application on Heroku* mostra come gestire con Terraform il ciclo di vita di un'applicazione.

### 1.4.6 — Software Defined Networking

Terraform può interagire con le reti definite dal software (SDN) per configurare automaticamente la rete in base alle esigenze delle applicazioni che vi girano. Così si passa da un workflow basato su ticket a uno automatizzato, riducendo i tempi di deployment.

Ad esempio, quando un servizio si registra in HashiCorp Consul, Consul-Terraform-Sync può generare automaticamente la configurazione Terraform per esporre le porte appropriate e adeguare le impostazioni di rete di qualsiasi SDN che abbia un provider Terraform. La Network Infrastructure Automation (NIA) permette di approvare in sicurezza le modifiche di cui le applicazioni hanno bisogno, senza dover tradurre a mano i ticket degli sviluppatori nelle modifiche che si ritiene servano.

Per approfondire, la pagina indica il tutorial introduttivo *Network Infrastructure Automation with Consul-Terraform-Sync*, che installa Consul-Terraform-Sync su un nodo, lo collega a un datacenter Consul, lo fa reagire alle modifiche dei servizi ed esegue un task di esempio, e il tutorial sull'integrazione di Consul-Terraform-Sync con Terraform Enterprise e HCP Terraform.

### 1.4.7 — Kubernetes

Kubernetes è uno scheduler open source di workload per applicazioni containerizzate. Terraform permette sia di distribuire un cluster Kubernetes sia di gestirne le risorse, ad esempio pod, deployment e service. Con l'HCP Terraform Operator si può anche gestire infrastruttura cloud e on-premises attraverso una Custom Resource Definition (CRD) di Kubernetes e HCP Terraform.

Le risorse indicate sono il tutorial *Manage Kubernetes Resources via Terraform*, in cui si usa Terraform per pianificare ed esporre un deployment NGINX su un cluster Kubernetes, e il tutorial *Deploy Infrastructure with the HCP Terraform Operator for Kubernetes*, in cui si configura e si distribuisce l'Operator in un cluster Kubernetes e lo si usa per creare un workspace HCP Terraform e una coda di messaggi per un'applicazione di esempio.

### 1.4.8 — Ambienti paralleli

Spesso si hanno ambienti di staging o di QA per testare le nuove applicazioni prima di rilasciarle in produzione. Man mano che l'ambiente di produzione cresce e diventa più complesso, mantenere aggiornato un ambiente per ogni fase dello sviluppo diventa sempre più difficile. Terraform permette di creare e dismettere rapidamente l'infrastruttura per sviluppo, test, QA e produzione: creare ambienti usa e getta quando servono costa meno che mantenerli attivi a tempo indeterminato.

### 1.4.9 — Demo software

Con Terraform si può creare, configurare e avviare una demo su vari cloud provider. In questo modo gli utenti finali possono provare facilmente il software sulla propria infrastruttura e perfino regolare parametri come la dimensione del cluster, per mettere alla prova gli strumenti in modo più rigoroso e a qualsiasi scala.

- Fonte: [Terraform use cases](https://developer.hashicorp.com/terraform/intro/v1.12.x/use-cases)
- Il percorso di studio include anche un [video introduttivo sull'Infrastructure as Code](https://www.hashicorp.com/resources/what-is-infrastructure-as-code)
