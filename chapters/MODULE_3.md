# Modulo 3 — Core workflow

_Obiettivo 3 dell'esame: descrivere il workflow di Terraform (3a), inizializzare una directory di lavoro (3b), validare una configurazione (3c), generare e rivedere un piano di esecuzione (3d), applicare le modifiche all'infrastruttura (3e), distruggere l'infrastruttura gestita da Terraform (3f) e applicare formattazione e stile a una configurazione (3g)._

---

## 3.1 — Il core workflow di Terraform

Il core workflow di Terraform si compone di tre passi:

- **Write**: scrivere l'infrastruttura come codice.
- **Plan**: vedere in anteprima le modifiche prima di applicarle.
- **Apply**: effettuare il provisioning di un'infrastruttura riproducibile.

La guida mostra come si svolgono questi tre passi quando si lavora da soli, come cambiano quando un team collabora sull'infrastruttura e come HCP Terraform permette a questo workflow di funzionare senza intoppi per intere organizzazioni.

### 3.1.1 — Lavorare come singolo professionista

**Write** _(stepTitle)_

La configurazione Terraform si scrive come si scrive il codice: nel proprio editor preferito. Anche quando si lavora da soli, è prassi comune salvare il lavoro in un repository sotto controllo versione.

```
# Create repository
$ git init my-infra && cd my-infra

# Write initial config
$ vim main.tf

# Initialize Terraform
$ terraform init
```

Mentre si scrive la configurazione, eseguire ripetutamente il plan aiuta a far emergere gli errori di sintassi e a verificare che la configurazione stia prendendo la forma prevista.

```
# Make edits to config
$ vim main.tf

# Review plan
$ terraform plan

# Make additional edits, and repeat
$ vim main.tf
```

È lo stesso schema del lavoro individuale sul codice applicativo, dove è utile un ciclo di feedback stretto tra la modifica del codice e l'esecuzione dei comandi di test.

**Plan** _(stepTitle)_

Quando il ciclo di feedback della fase Write ha prodotto una modifica convincente, è il momento di fare commit del lavoro e di rivedere il piano finale. Poiché `terraform apply` mostra un piano da confermare prima di modificare qualsiasi infrastruttura, è questo il comando da eseguire per la revisione finale.

**Apply** _(stepTitle)_

Dopo un ultimo controllo si può dire a Terraform di effettuare il provisioning dell'infrastruttura reale, rispondendo `yes` alla richiesta di conferma (*Apply complete! Resources: 1 added, 0 changed, 0 destroyed.*). A questo punto è comune fare push del repository verso una posizione remota, per custodirlo al sicuro.

Questo core workflow è un ciclo: la volta successiva che si vogliono apportare modifiche, si ricomincia dall'inizio. Il workflow ricalca da vicino il modo in cui una persona scrive da sola codice applicativo o script, ed è questo che si intende quando si dice che Terraform abilita l'infrastructure as code.

### 3.1.2 — Lavorare in team

Quando più persone collaborano sulla configurazione Terraform, a ogni parte del core workflow bisogna aggiungere nuovi passi, perché tutti lavorino insieme senza intoppi. Molti di questi passi ricalcano i cambiamenti che si fanno al workflow quando si lavora sul codice applicativo in team anziché da soli.

**Write** _(stepTitle)_

Ogni membro del team continua a modificare la configurazione Terraform nel proprio editor, ma salva le modifiche in branch del controllo versione, per non entrare in collisione con il lavoro degli altri. Lavorare in branch permette di risolvere le modifiche all'infrastruttura incompatibili tra loro con il normale workflow di gestione dei conflitti di merge.

```
$ git checkout -b add-load-balancer
```

Eseguire plan iterativi resta utile come ciclo di feedback durante la scrittura della configurazione, ma con il tempo diventa più difficile che ogni membro del team possa eseguirli dal proprio computer: man mano che il team e l'infrastruttura crescono, cresce anche il numero di input variable sensibili (ad esempio chiavi API e coppie di certificati SSL) necessarie per eseguire un plan.

Per evitare a ogni membro del team l'onere, e il rischio di sicurezza, di predisporre in locale tutti gli input sensibili, è comune che i team passino a un modello in cui le operazioni di Terraform vengono eseguite in un ambiente di Continuous Integration (CI) condiviso. Creare un ambiente CI di questo tipo richiede un lavoro non banale, che esula da questa panoramica; la guida *Running Terraform in Automation* approfondisce l'argomento.

Questo ciclo di iterazione più lungo, fatto di commit nel controllo versione e di attesa dell'esecuzione della pipeline CI, è spesso abbastanza lento da impedire di usare gli speculative plan come ciclo di feedback mentre si scrivono le singole modifiche. Gli speculative plan restano comunque utili prima che le nuove modifiche vengano applicate, o anche solo unite al branch di sviluppo principale, come si vede subito.

**Plan** _(stepTitle)_

Per i team che collaborano sull'infrastruttura, l'output del plan di Terraform è un'occasione per rivedere il lavoro reciproco: permette al team di fare domande, valutare i rischi e intercettare gli errori prima che vengano apportate modifiche potenzialmente dannose.

Il luogo naturale per queste revisioni sono le pull request del controllo versione, cioè il punto in cui una persona propone di unire il proprio branch di lavoro al branch condiviso del team. Se i membri del team rivedono le modifiche proposte alla configurazione insieme all'output dello speculative plan, possono valutare se il plan realizza l'intento della modifica.

Il problema diventa produrre l'output dello speculative plan da far rivedere al team. Alcuni team che eseguono ancora Terraform in locale stabiliscono che le pull request includano una copia dell'output dello speculative plan generato dall'autore della modifica; altri fanno in modo che sia il sistema di CI a pubblicare automaticamente l'output nelle pull request.

![Figura 5](img/manually-pasted-plan-output.png) _(dimensioni: 790×733 px)_

*Figura 5 — Una pull request in cui l'autore ha incollato a mano l'output del plan di Terraform. Fonte: HashiCorp Developer.* _(caption)_

Oltre a verificare che il plan esprima correttamente l'intento dell'autore, il team può anche valutare se vuole che la modifica avvenga adesso. Ad esempio, se il team nota che una certa modifica potrebbe causare un'interruzione del servizio, può decidere di rimandare il merge della pull request finché non riesce a programmare una finestra di manutenzione.

**Apply** _(stepTitle)_

Una volta approvata e unita una pull request, è importante che il team riveda il plan concreto finale, eseguito sul branch condiviso del team e sull'ultima versione del file di state. Questo plan può essere diverso da quello rivisto nella pull request per motivi come l'ordine dei merge o modifiche recenti all'infrastruttura: ad esempio, se dopo la revisione del plan qualcuno ha modificato a mano l'infrastruttura, al momento del merge il plan potrebbe essere diverso.

È in questo momento che il team si interroga sulle possibili conseguenze dell'applicazione della modifica. Ci aspettiamo un'interruzione del servizio? C'è qualche parte della modifica ad alto rischio? C'è qualcosa nel sistema da tenere d'occhio durante l'apply? C'è qualcuno da avvisare che la modifica sta avvenendo?

A seconda della modifica, a volte i membri del team vogliono seguire l'output dell'apply mentre avviene: per i team che eseguono Terraform in locale questo può voler dire condividere lo schermo con il team, per quelli che lo eseguono in CI riunirsi attorno al log della build.

Come il workflow individuale, anche il core workflow dei team è un ciclo che si ripete per ogni modifica: per alcuni team avviene qualche volta alla settimana, per altri molte volte al giorno.

### 3.1.3 — Il core workflow migliorato da HCP Terraform

I workflow descritti finora permettono di creare o modificare l'infrastruttura in modo sicuro, prevedibile e riproducibile, ma presentano diversi punti di collaborazione che si possono semplificare, soprattutto man mano che team e organizzazioni crescono. HashiCorp ha progettato HCP Terraform per supportare e migliorare il core workflow di chiunque collabori sull'infrastruttura, dai piccoli team alle grandi organizzazioni. Ecco come HCP Terraform migliora ogni passo.

**Write** _(stepTitle)_

HCP Terraform offre una posizione centralizzata e sicura in cui conservare le input variable e lo state, e allo stesso tempo restituisce a chi scrive la configurazione un ciclo di feedback stretto con gli speculative plan. La configurazione Terraform può interagire con HCP Terraform attraverso l'integrazione con la CLI:

```
terraform {
  cloud {
    organization = "my-org"
    hostname = "app.terraform.io" # Optional; defaults to app.terraform.io

    workspaces {
      tags = {
        layer = "networking"
        source = "cli"
      }

      # For terraform versions below 1.10, you must specify key-only tags
      # using a list of strings. Example:
      # tags = ["networking", "source:cli"]
    }
  }
}
```

Dopo aver configurato l'integrazione, ai membri del team basta una chiave API di HCP Terraform per modificare la configurazione ed eseguire speculative plan sull'ultima versione del file di state, usando tutte le input variable conservate in remoto. Si seleziona il workspace con `terraform workspace select my-app-dev` e `terraform plan` viene eseguito in remoto: l'output arriva nel terminale ed è consultabile anche nel browser. Con l'aiuto di questo output, ogni membro del team può lavorare alla configurazione finché non è pronta per essere proposta come modifica con una pull request.

**Plan** _(stepTitle)_

Quando una pull request è pronta per la revisione, HCP Terraform semplifica la revisione dello speculative plan. Innanzitutto il plan viene eseguito automaticamente alla creazione della pull request, e degli aggiornamenti di stato nella pull request indicano quando il plan è in corso. Al termine, l'aggiornamento di stato indica, direttamente dalla vista della pull request, se lo speculative plan contiene modifiche.

![Figura 6](img/pull-request.png) _(dimensioni: 1586×1254 px)_

*Figura 6 — Una pull request con le modifiche alle risorse riportate nell'aggiornamento di stato del check di HCP Terraform. Fonte: HashiCorp Developer.* _(caption)_

Per certi tipi di modifiche questa informazione è tutto ciò che serve a un collega per approvare la pull request. Quando invece serve una revisione completa del plan, il link a HCP Terraform apre una vista che permette di analizzarne rapidamente tutti i dettagli. Da questa pagina il revisore capisce in fretta se il plan corrisponde all'intento dell'autore e può valutare il rischio della modifica.

![Figura 7](img/pr-plan.png) _(dimensioni: 2086×2362 px)_

*Figura 7 — Il run della pull request in HCP Terraform, con i dettagli del plan. Fonte: HashiCorp Developer.* _(caption)_

**Apply** _(stepTitle)_

Dopo il merge, HCP Terraform presenta al team il plan concreto da rivedere e approvare, e il team può discutere le domande ancora aperte prima che la modifica venga applicata.

![Figura 8](img/concrete-plan.png) _(dimensioni: 2001×2005 px)_

*Figura 8 — Il plan concreto dopo il merge, in attesa di revisione e conferma in HCP Terraform. Fonte: HashiCorp Developer.* _(caption)_

![Figura 9](img/plan-comments.png) _(dimensioni: 2001×2005 px)_

*Figura 9 — Lo scambio di commenti sul run in HCP Terraform prima della conferma. Fonte: HashiCorp Developer.* _(caption)_

Una volta confermato l'apply, HCP Terraform ne mostra l'avanzamento in tempo reale a chiunque voglia seguirlo.

![Figura 10](img/in-progress-apply.png) _(dimensioni: 2003×1969 px)_

*Figura 10 — Un apply in corso in HCP Terraform. Fonte: HashiCorp Developer.* _(caption)_

### 3.1.4 — Conclusioni

Ci sono molti modi diversi di usare Terraform: da singolo utente, come singolo team o come intera organizzazione su larga scala. Scegliere l'approccio più adatto al grado di collaborazione necessario permette di ottenere il massimo ritorno dall'investimento nel core workflow di Terraform. Per le organizzazioni che usano Terraform su larga scala, HCP Terraform aggiunge nuovi livelli costruiti su questo core workflow, che risolvono i problemi tipici di team e organizzazioni.

- Fonte: [Core Terraform workflow overview](https://developer.hashicorp.com/terraform/intro/v1.12.x/core-workflow)

---

## 3.2 — Creare l'infrastruttura

Con Terraform si può creare e gestire l'infrastruttura come codice. In questo tutorial della raccolta Get Started su AWS si usa Terraform per effettuare il provisioning di un'istanza EC2 su Amazon Web Services (AWS). Le istanze EC2 sono macchine virtuali in esecuzione su AWS e sono un componente comune di molti progetti infrastrutturali. Per effettuare il provisioning si scrive la configurazione che definisce il provider e l'istanza, si impostano le variabili d'ambiente con le credenziali AWS, si inizializza un nuovo workspace locale e infine si applica la configurazione per creare l'istanza.

I file di configurazione di Terraform sono file di testo semplice scritti nel linguaggio di configurazione di HashiCorp, HCL, con nomi che terminano in `.tf`. Quando si eseguono operazioni con la CLI di Terraform, Terraform carica tutti i file di configurazione della directory di lavoro corrente e risolve automaticamente le dipendenze al loro interno: questo permette di organizzare la configurazione in più file, nell'ordine che si preferisce. La configurazione Terraform è organizzata in alcuni tipi di blocchi, con cui si configurano Terraform stesso, i provider di Terraform, e le risorse e i data source che compongono l'infrastruttura.

### 3.2.1 — Il blocco terraform

Il blocco `terraform {}` configura Terraform stesso, compresi i provider da installare e la versione di Terraform da usare per effettuare il provisioning dell'infrastruttura. Una struttura dei file coerente semplifica la manutenzione dei progetti Terraform, per questo HashiCorp consiglia di configurare il blocco `terraform` in un file dedicato, `terraform.tf`:

```
terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.92"
    }
  }

  required_version = ">= 1.2"
}
```

Terraform usa plugin binari chiamati provider per gestire le risorse chiamando le API del cloud provider. I provider di Terraform sono distribuiti e versionati separatamente da Terraform: proprio perché i provider sono separati dal binario di Terraform, Terraform può supportare qualsiasi fornitore di infrastruttura dotato di un'API. Il blocco `required_providers` permette di impostare vincoli di versione sui provider usati dalla configurazione. HashiCorp gestisce il Terraform Registry, da cui si possono ottenere provider e moduli Terraform pubblici.

Per ogni provider del blocco `required_providers` si impostano gli argomenti `source` e `version`. L'argomento `source` specifica un hostname (facoltativo), un namespace e il nome del provider: nella configurazione di esempio la sorgente del provider aws è `hashicorp/aws`, forma abbreviata di `registry.terraform.io/hashicorp/aws`, l'indirizzo del provider nel Terraform Registry.

L'argomento `version` imposta un vincolo di versione per il provider AWS. Se non si specifica un vincolo, Terraform usa per default la versione più recente del provider; HashiCorp consiglia di usare vincoli di versione per evitare che Terraform installi una versione del provider non testata con la propria configurazione. La stringa `~> 5.92` indica che la configurazione supporta qualsiasi versione del provider con versione major 5 e versione minor maggiore o uguale a 92.

La configurazione di esempio definisce anche la versione richiesta di Terraform stesso: la stringa `>= 1.2` indica che la configurazione supporta qualsiasi versione di Terraform maggiore o uguale alla 1.2. La versione di Terraform in uso si controlla con il comando `terraform -version`.

### 3.2.2 — I blocchi di configurazione

Nel file `main.tf` si incolla la configurazione seguente:

```
provider "aws" {
  region = "us-west-2"
}

data "aws_ami" "ubuntu" {
  most_recent = true

  filter {
    name = "name"
    values = ["ubuntu/images/hvm-ssd-gp3/ubuntu-noble-24.04-amd64-server-*"]
  }

  owners = ["099720109477"] # Canonical
}

resource "aws_instance" "app_server" {
  ami           = data.aws_ami.ubuntu.id
  instance_type = "t2.micro"

  tags = {
    Name = "learn-terraform"
  }
}
```

Quando si scrive una nuova configurazione Terraform, la best practice consigliata è definire i blocchi provider e l'infrastruttura principale in `main.tf`; man mano che la configurazione cresce, si può scegliere di organizzare l'infrastruttura correlata in file diversi.

**Provider** _(stepTitle)_

Il blocco `provider` configura le opzioni che valgono per tutte le risorse gestite da quel provider, come la region in cui crearle. Il blocco dell'esempio configura il provider `aws`. L'etichetta del blocco provider corrisponde al nome del provider nell'elenco `required_providers` del blocco `terraform`. Per creare le risorse in un'altra region AWS basta cambiare il valore dell'argomento `region`.

Nella configurazione si possono usare più blocchi provider, per configurare più provider oppure più istanze dello stesso provider con configurazioni diverse, ad esempio una region diversa. I provider di Terraform devono autenticarsi presso l'API del cloud provider per gestire le risorse, e spesso supportano più metodi di autenticazione. Il provider AWS di Terraform usa gli stessi metodi di autenticazione della AWS CLI: nel tutorial si impostano le credenziali IAM nel terminale come variabili d'ambiente `AWS_ACCESS_KEY_ID` e `AWS_SECRET_ACCESS_KEY`, e le si verifica con `aws configure list`. Chi non dispone di credenziali di un utente IAM può usare uno degli altri metodi descritti nella documentazione del provider AWS.

**Data source** _(stepTitle)_

I blocchi `data` permettono di interrogare il cloud provider per ottenere informazioni su altre risorse. Il data source dell'esempio recupera i dati dell'AMI AWS più recente che corrisponde al filtro, così non bisogna scrivere a mano l'ID dell'AMI nella configurazione. I data source aiutano a mantenere la configurazione dinamica e a evitare valori scritti a mano che possono diventare obsoleti.

I data source hanno un ID, che si usa per fare riferimento ai loro attributi nella configurazione. Gli ID dei data source hanno il prefisso `data`, seguito dal tipo e dal nome del blocco: nell'esempio, il data source `data.aws_ami.ubuntu` carica l'AMI dell'ultima release di Ubuntu Noble Numbat nella region configurata per il provider.

**Risorse** _(stepTitle)_

Un blocco `resource` definisce un componente dell'infrastruttura; la configurazione di esempio definisce un blocco resource che crea un'istanza EC2 di AWS. Sono gli sviluppatori del provider a stabilire quali tipi di risorsa sono supportati e con quali argomenti.

La prima riga di un blocco resource dichiara il tipo e il nome della risorsa: nell'esempio il tipo è `aws_instance`. Il prefisso del tipo corrisponde al nome del provider, mentre il resto della stringa è il tipo di risorsa definito dal provider. Insieme, tipo e nome formano un indirizzo univoco della risorsa nella configurazione: l'indirizzo dell'istanza EC2 è `aws_instance.app_server`, e con questo indirizzo si fa riferimento alla risorsa in altre parti della configurazione.

Gli argomenti del blocco resource configurano la risorsa e il suo comportamento. L'argomento `ami` specifica l'immagine macchina da usare, facendo riferimento all'attributo `id` del data source `data.aws_ami.ubuntu`. L'argomento `instance_type` imposta a mano il tipo `t2.micro`, che rientra nel free tier di AWS. L'argomento `tags` imposta il nome dell'istanza EC2, e nello stesso argomento si possono impostare anche altri tag.

### 3.2.3 — Formattare la configurazione

HashiCorp consiglia una formattazione coerente, che garantisce la leggibilità. Il comando `terraform fmt` riformatta automaticamente tutti i file di configurazione della directory corrente secondo lo stile raccomandato da HashiCorp, e stampa i nomi dei file che ha modificato, se ce ne sono. Nel tutorial la configurazione di esempio non rispetta esattamente lo stile raccomandato, quindi Terraform aggiorna il file `main.tf`.

### 3.2.4 — Inizializzare il workspace

Prima di poter applicare la configurazione bisogna inizializzare il workspace Terraform con il comando `terraform init`. Durante l'inizializzazione Terraform scarica e installa nella directory di lavoro corrente i provider definiti nella configurazione: nel tutorial scarica il provider aws e lo installa in una sottodirectory nascosta `.terraform` della directory di lavoro corrente.

Terraform crea inoltre un file chiamato `.terraform.lock.hcl`, che specifica le versioni esatte dei provider usate con il workspace e garantisce coerenza tra un'esecuzione e l'altra. L'output di init invita a includere questo file nel repository del controllo versione, così che Terraform possa fare per default le stesse scelte quando si eseguirà `terraform init` in futuro.

**Validare la configurazione** _(stepTitle)_

Con il comando `terraform validate` ci si assicura che la configurazione sia sintatticamente valida e internamente coerente. La configurazione di esempio è valida, quindi Terraform restituisce un messaggio di successo (*Success! The configuration is valid.*). Il comando validate aiuta a individuare gli errori nella configurazione: ad esempio, se si scrive male il nome di una risorsa o si fa riferimento a un argomento che la risorsa non supporta, Terraform segnala un errore durante la validazione.

### 3.2.5 — Creare l'infrastruttura

Terraform apporta le modifiche all'infrastruttura in due passi. Prima crea un piano di esecuzione con le modifiche che intende fare, che si rivede per assicurarsi che Terraform faccia ciò che ci si aspetta. Poi, una volta approvato il piano, applica le modifiche usando i provider del workspace. Questo workflow permette di individuare e risolvere eventuali problemi imprevisti della configurazione prima che Terraform modifichi l'infrastruttura.

Con il comando `terraform apply` si pianifica e si applica la configurazione: Terraform stampa il piano di esecuzione e chiede di confermare le modifiche prima di applicarle. La configurazione contiene una sola risorsa, `aws_instance.app_server`, quindi il piano indica che Terraform creerà l'istanza EC2.

Il formato dell'output è simile al formato diff generato da strumenti come Git: il `+` accanto a `resource "aws_instance" "app_server"` significa che, applicando il piano, Terraform creerà la risorsa con ID `aws_instance.app_server`. Terraform mostra gli attributi che verranno impostati sull'istanza e indica che alcuni valori saranno noti solo dopo l'apply (*known after apply*).

A questo punto Terraform non ha ancora creato nessuna infrastruttura: se il piano mostrasse modifiche inattese, si potrebbe annullare l'operazione prima del passo di apply. Nel tutorial il piano è accettabile, quindi si digita `yes` alla richiesta di conferma. L'apply richiede qualche minuto, poi l'istanza EC2 compare nella console EC2.

### 3.2.6 — Ispezionare lo state

Quando si applica la configurazione, Terraform scrive i dati sull'infrastruttura in un file chiamato `terraform.tfstate`. È il file di state di Terraform, che Terraform usa per gestire le risorse durante tutto il loro ciclo di vita.

Il comando `terraform state list` elenca le risorse e i data source presenti nello state del workspace, qui `data.aws_ami.ubuntu` e `aws_instance.app_server`. Il data source non è una vera risorsa, ma Terraform lo registra comunque nel file di state. Il comando `terraform show` stampa invece l'intero state del workspace.

Per creare il piano di esecuzione Terraform confronta tre cose: l'ultimo stato noto registrato nel file di state, la configurazione attuale e i dati restituiti dai provider. Lo fa ogni volta che si pianificano e si applicano modifiche all'infrastruttura del workspace.

Il file di state può contenere informazioni sensibili sull'infrastruttura, come password o chiavi di sicurezza. Va quindi conservato in modo sicuro, con accesso limitato a chi deve gestire l'infrastruttura con Terraform. Per default Terraform crea il file di state in locale. Man mano che le operazioni sull'infrastruttura maturano, conservare lo state in remoto con HCP Terraform permette di collaborare più facilmente con il team e di tenere al sicuro il file di state.

- Fonte: [Create infrastructure](https://developer.hashicorp.com/terraform/tutorials/aws-get-started/aws-create)

---

## 3.3 — Inizializzare la configurazione Terraform

Dopo aver scritto la configurazione Terraform, il core workflow si compone di tre passi principali:

- **Initialize** prepara il workspace perché Terraform possa applicare la configurazione.
- **Plan** permette di vedere in anteprima le modifiche che Terraform farà, prima di applicarle.
- **Apply** apporta le modifiche definite dal piano per creare, aggiornare o distruggere le risorse.

Quando si inizializza un workspace, Terraform configura il backend, installa tutti i provider e i moduli a cui fa riferimento la configurazione e crea un lock file delle versioni, se non esiste già. Il comando `terraform init` permette inoltre di cambiare il backend del workspace e di aggiornare i provider e i moduli.

Nel tutorial si inizializza un workspace che usa sia moduli locali sia moduli remoti, si esplora la directory `.terraform` in cui Terraform conserva provider e moduli, e si aggiornano le versioni di provider e moduli. Così si vede il ruolo fondamentale di `terraform init` nel workflow. Il tutorial si può svolgere con lo stesso workflow sia con Terraform Community Edition sia con HCP Terraform.

### 3.3.1 — La configurazione di esempio

La directory di esempio contiene una configurazione Terraform che usa più provider, un modulo locale e un modulo remoto, con cui si osserva come Terraform inizializza la directory di lavoro:

```
.
├── LICENSE
├── main.tf
├── modules
│   └── aws-ec2-instance
│       ├── main.tf
│       └── variables.tf
├── README.md
├── terraform.tf
└── variables.tf
```

Il repository contiene questi file:

- `LICENSE`, con il testo della Mozilla Public License con cui HashiCorp distribuisce la configurazione di esempio;
- `main.tf`, con le risorse e i data source usati dalla configurazione;
- la directory `modules/aws-ec2-instance`, con un modulo Terraform che crea un'istanza EC2 su AWS;
- `README.md`, che descrive la configurazione;
- `terraform.tf`, che definisce il blocco `terraform` con i provider, il backend remoto e le versioni di Terraform da usare con questa configurazione;
- `variables.tf`, con le variabili usate nella configurazione.

### 3.3.2 — Inizializzare il workspace

L'output di `terraform init` descrive i passi che Terraform esegue durante l'inizializzazione del workspace.

**Il backend** _(stepTitle)_

Per prima cosa Terraform inizializza il backend (*Initializing the backend...*). Poiché il blocco `terraform` non include un blocco `cloud` né un blocco `backend`, Terraform usa per default il backend `local`.

Nella variante del tutorial con HCP Terraform si decommenta invece il blocco `cloud` nel file `terraform.tf`, sostituendo il nome dell'organizzazione con la propria:

```
terraform {
  required_version = "~> 1.6"
  required_providers {
    ## ...
  }
  cloud {
    organization = "organization-name"
    workspaces {
      name = "learn-terraform-init"
    }
  }
}
```

In questo caso il blocco `terraform` include un blocco `cloud`, quindi Terraform usa il backend di HCP Terraform (*Initializing HCP Terraform...*). Crea inoltre nell'organizzazione un workspace HCP Terraform con il nome indicato nel blocco.

**I moduli** _(stepTitle)_

Poi Terraform scarica i moduli richiesti dalla configurazione. Riconosce che il blocco `module "ec2-instance"` usa il modulo locale `modules/aws-ec2-instance`. Determina poi che il blocco `module "hello"` fa riferimento a un modulo remoto, e lo scarica dal Terraform Registry pubblico (*Downloading registry.terraform.io/joatmon08/hello/random 4.0.0 for hello...*).

> **Nota**: quando si cambia la `source` o la `version` di un modulo, bisogna reinizializzare la configurazione oppure eseguire `terraform get` per scaricare il nuovo modulo.
_(infoBox)_

**I provider** _(stepTitle)_

Successivamente Terraform scarica i provider richiesti dalla configurazione. La configurazione non ha ancora un lock file, quindi Terraform scarica i provider aws e random indicati nel blocco `required_providers` del file `terraform.tf`.

Quando si inizializza un workspace, Terraform cerca di scaricare le versioni dei provider indicate nel lock file del workspace. Se il lock file non esiste, usa il blocco `required_providers` per determinare la versione del provider e crea un nuovo lock file. Se non esiste nessuno dei due, cerca un provider corrispondente e ne scarica l'ultima versione.

**Il lock file** _(stepTitle)_

Poi Terraform crea il lock file, se non esiste già, oppure lo aggiorna se necessario. Il lock file di Terraform, `.terraform.lock.hcl`, registra le versioni e gli hash dei provider usati in questa esecuzione. Questo garantisce esecuzioni coerenti in ambienti diversi, perché nelle esecuzioni successive Terraform scaricherà per default le versioni registrate nel lock file. Quando si gestisce la configurazione Terraform in un repository di controllo sorgente, il file `.terraform.lock.hcl` va incluso nel commit insieme ai file di configurazione.

Infine Terraform stampa un messaggio di successo (*Terraform has been successfully initialized!*). Il messaggio ricorda come pianificare la configurazione, e che `terraform init` va rieseguito se si cambiano i moduli o la configurazione del backend.

### 3.3.3 — Validare la configurazione

Ora il workspace è inizializzato e i moduli e i provider richiesti sono stati scaricati. Terraform può quindi verificare che la sintassi della configurazione sia valida e internamente coerente, controllando anche gli argomenti non validi o mancanti nei blocchi resource. Il workspace va inizializzato prima di poter validare la configurazione. Nel tutorial `terraform validate` risponde *Success! The configuration is valid.*

### 3.3.4 — Gli artefatti dell'inizializzazione

Quando si inizializza un nuovo workspace Terraform, vengono creati un lock file chiamato `.terraform.lock.hcl` e la directory `.terraform`.

**Il lock file** _(stepTitle)_

Il lock file garantisce che Terraform usi le stesse versioni dei provider in tutto il team e negli ambienti di esecuzione remoti: durante l'inizializzazione Terraform scarica le versioni dei provider indicate in questo file, invece delle versioni più recenti.

```
# This file is maintained automatically by "terraform init".
# Manual edits may be lost in future updates.

provider "registry.terraform.io/hashicorp/aws" {
  version     = "6.2.0"
  constraints = "6.2.0"
  hashes = [
    "h1:ziUjk3KGwBa7bAwZaPuQklfcQ3Qlx2d0rlYFvdZn4g8=",
    "zh:224b20371f7c7ce14d69a84e16ae94baa0a06c132474d4bc4d192d86936bc750",
    ## ...
  ]
}
```

Se le versioni indicate nei blocchi `provider` del lock file non corrispondono a quelle del blocco `required_providers` della configurazione, Terraform chiede di reinizializzare la configurazione con l'opzione `-upgrade`.

**La directory .terraform** _(stepTitle)_

Terraform usa la directory `.terraform` per conservare i provider e i moduli del progetto, e vi fa riferimento quando si eseguono validate, plan e apply.

> **Nota**: Terraform gestisce automaticamente la directory `.terraform`. Non va inclusa nel controllo versione e il suo contenuto non va modificato direttamente. Il tutorial la esplora solo per mostrare come funziona Terraform: contenuto e struttura della directory possono cambiare tra una versione di Terraform e l'altra.
_(infoBox)_

La struttura della directory si vede con `tree`:

```
$ tree .terraform -L 1
.terraform
├── modules
└── providers
```

La directory `.terraform` contiene due sottodirectory, `modules` e `providers`, con i moduli e i provider usati dal workspace. Con HCP Terraform contiene anche due file:

```
$ tree .terraform -L 1
.terraform
├── environment
├── modules
├── providers
└── terraform.tfstate
```

Il file `environment` contiene il nome del workspace HCP Terraform. Il file `terraform.tfstate` contiene un riferimento allo state del workspace in HCP Terraform.

La directory `.terraform/modules` contiene un file `modules.json` e una copia locale del modulo remoto `hello`:

```
$ tree .terraform/modules
├── hello
│   ├── README.md
│   └── random.tf
└── modules.json
```

Il file `modules.json` mostra che la configurazione usa tre moduli:

- il modulo root, cioè la configurazione nella directory principale del workspace;
- il modulo locale `aws-ec2-instance`;
- il modulo remoto `hello`.

```
{
  "Modules": [
    { "Key": "", "Source": "", "Dir": "." },
    { "Key": "ec2-instance", "Source": "./modules/aws-ec2-instance", "Dir": "modules/aws-ec2-instance" },
    { "Key": "hello", "Source": "registry.terraform.io/joatmon08/hello/random", "Version": "4.0.0", "Dir": ".terraform/modules/hello" }
  ]
}
```

Il modulo `aws-ec2-instance` è un modulo locale, quindi Terraform fa riferimento direttamente alla sua configurazione nella directory `modules/aws-ec2-instance` del repository: se si modifica un modulo locale, Terraform vede subito le modifiche. Il modulo `hello` invece è remoto. Durante l'inizializzazione Terraform lo ha scaricato dalla sua sorgente e ne ha salvato una copia locale nella directory `.terraform/modules/hello`.

Questi file vanno considerati di sola lettura, come il resto del contenuto di `.terraform`, e non vanno modificati. Terraform aggiorna un modulo remoto solo quando si esegue `terraform init -upgrade` o `terraform get`.

La directory `.terraform/providers` conserva le versioni in cache di tutti i provider della configurazione. Durante `terraform init`, Terraform scarica i provider definiti nella configurazione dalla loro sorgente, indicata nel blocco `required_providers`. Li salva in directory organizzate come `[hostname]/[namespace]/[name]/[version]/[os_arch]`:

```
$ tree .terraform/providers
.terraform/providers
└── registry.terraform.io
    └── hashicorp
        ├── aws
        │   └── 6.2.0
        │       └── darwin_arm64
        │           ├── LICENSE.txt
        │           └── terraform-provider-aws_v6.2.0_x5
        └── random
            └── 3.6.0
                └── darwin_arm64
                    └── terraform-provider-random_v3.6.0_x5
```

### 3.3.5 — Aggiornare le versioni di provider e moduli

Nel tutorial si aggiorna a `3.6.1` la versione del provider random in `terraform.tf`, e a `6.0.0` la versione del modulo `hello` in `main.tf`:

```
module "hello" {
  source  = "joatmon08/hello/random"
  version = "6.0.0"

  hello        = "World"
  second_hello = random_pet.instance.id

  secret_key = "secret"
}
```

**Reinizializzare la configurazione** _(stepTitle)_

Le versioni del provider e del modulo sono cambiate, quindi bisogna reinizializzare la configurazione perché Terraform installi le versioni aggiornate. Se si prova a validare, pianificare o applicare la configurazione prima di farlo, Terraform chiede di reinizializzare:

```
│ Error: Module version requirements have changed
│
│   on main.tf line 38, in module "hello":
│   38:   source  = "joatmon08/hello/random"
│
│ The version requirements have changed since this module was installed and the installed version (4.0.0) is no longer acceptable. Run "terraform init" to
│ install all modules required by this configuration.
```

Rieseguendo `terraform init`, Terraform scarica la nuova versione del modulo e la salva in `.terraform/modules/hello`. Non riesce però ad aggiornare il provider, perché la nuova versione è in conflitto con quella registrata nel lock file. Bisogna quindi reinizializzare con l'opzione `-upgrade`, che aggiorna il provider alla versione più recente compatibile con il suo vincolo di versione:

```
$ terraform init -upgrade
```

Dopo l'aggiornamento, la directory `.terraform/providers` contiene sia la versione 3.6.0 sia la 3.6.1 del provider random:

```
$ tree .terraform/providers -L 4
.terraform/providers
└── registry.terraform.io
    └── hashicorp
        ├── aws
        │   └── 6.2.0
        └── random
            ├── 3.6.0
            └── 3.6.1
```

Il lock file registra la 3.6.1. Anche con due versioni del provider random in `.terraform/providers`, Terraform usa sempre quella registrata nel lock file:

```
provider "registry.terraform.io/hashicorp/random" {
  version     = "3.6.1"
  constraints = ">= 3.0.1, 3.6.1"
  hashes = [
    "h1:a+Goawwh6Qtg4/bRWzfDtIdrEFfPlnVy0y4LdUQY3nI=",
    ## ...
  ]
}
```

**Aggiornare gli argomenti del modulo** _(stepTitle)_

Dopo l'aggiornamento di provider e modulo bisogna verificare che la configurazione sia ancora valida. Ora `terraform validate` segnala argomenti obbligatori mancanti (`some_key` e `hellos`) e argomenti non supportati, perché la nuova versione del modulo `hello` si aspetta argomenti diversi dalla vecchia. Si sostituisce quindi l'intero blocco `module "hello"`:

```
module "hello" {
  source  = "joatmon08/hello/random"
  version = "6.0.0"

  hellos = {
    hello        = random_pet.instance.id
    second_hello = "World"
  }

  some_key = "secret"
}
```

Dopo questa modifica la configurazione torna valida, e il workspace è inizializzato e pronto per l'apply.

Il tutorial riassume così i casi in cui inizializzare un workspace Terraform con `terraform init`:

- quando si crea una nuova configurazione Terraform e si è pronti a usarla per creare un workspace ed effettuare il provisioning dell'infrastruttura;
- quando si clona un repository di controllo versione che contiene una configurazione Terraform e si è pronti a usarla per creare un workspace ed effettuare il provisioning dell'infrastruttura;
- quando in un workspace esistente si aggiunge o si rimuove un modulo o un provider, o se ne cambia la versione;
- quando nel blocco `terraform` di un workspace esistente si aggiunge, si rimuove o si modifica il blocco `backend` o `cloud`.

- Fonte: [Initialize Terraform configuration](https://developer.hashicorp.com/terraform/tutorials/cli/init)

---

## 3.4 — Il comando terraform init

Il comando `terraform init` inizializza una directory di lavoro che contiene file di configurazione Terraform. È il primo comando da eseguire dopo aver scritto una nuova configurazione Terraform o dopo aver clonato una configurazione esistente dal controllo versione, e si può eseguire più volte senza rischi.

### 3.4.1 — Uso

La sintassi è `terraform init [options]`. Il comando esegue diversi passi di inizializzazione per preparare la directory di lavoro corrente all'uso con Terraform. Le sezioni seguenti descrivono i singoli passi, ma nella maggior parte dei casi non serve preoccuparsene.

Il comando si può sempre eseguire più volte senza rischi, per allineare la directory di lavoro alle modifiche della configurazione. Le esecuzioni successive possono dare errori, ma il comando non cancella mai la configurazione o lo state esistenti.

### 3.4.2 — Opzioni generali

Le opzioni seguenti valgono per tutti i passi di inizializzazione, o per diversi di essi:

- `-input=true`: chiede un input se necessario. Con `false`, il comando dà errore quando servirebbe un input.
- `-lock=false`: disabilita il lock dei file di state durante le operazioni che riguardano lo state.
- `-lock-timeout=<duration>`: modifica il tempo che Terraform attende per acquisire un lock dello state. Il default è `0s` (zero secondi): il comando fallisce subito se il lock è già detenuto da un altro processo.
- `-no-color`: disabilita i codici colore nell'output del comando.
- `-upgrade`: aggiorna moduli e plugin durante i rispettivi passi di installazione (dettagli nelle sezioni seguenti).
- `-json`: abilita l'output dell'interfaccia in formato JSON leggibile da una macchina.

### 3.4.3 — Copiare un modulo sorgente

Per default `terraform init` presume che la directory di lavoro contenga già una configurazione e cerca di inizializzarla. In alternativa, si può eseguire init in una directory vuota con l'opzione `-from-module=MODULE-SOURCE`: in questo caso il modulo indicato viene copiato nella directory di destinazione prima di qualsiasi altro passo di inizializzazione.

Questa modalità speciale ha due casi d'uso:

- con una sorgente di controllo versione, fa da scorciatoia per fare il checkout di una configurazione e poi inizializzare la directory di lavoro;
- se la sorgente è una configurazione di esempio, la si può copiare in una directory locale come base per una nuova configurazione.

Per l'uso ordinario è consigliato fare il checkout della configurazione separatamente, con i comandi del sistema di controllo versione. Così si possono passare opzioni aggiuntive al sistema di controllo versione quando serve. Si possono anche eseguire altri passi di preparazione prima di `terraform init`, come generare la configurazione o attivare le credenziali.

### 3.4.4 — Inizializzazione del backend

Durante init, Terraform cerca la configurazione del backend nella directory di configurazione root, e inizializza il backend scelto con le impostazioni indicate.

Rieseguire init con un backend già inizializzato aggiorna la directory di lavoro per usare le nuove impostazioni del backend. Per aggiornare la configurazione del backend bisogna specificare `-reconfigure` oppure `-migrate-state`:

- `-migrate-state` cerca di copiare lo state esistente nel nuovo backend. A seconda di cosa è cambiato, può chiedere in modo interattivo di confermare la migrazione degli state dei workspace.
- `-force-copy` sopprime queste richieste e risponde "yes" alle domande sulla migrazione. Attivarla attiva automaticamente anche `-migrate-state`.
- `-reconfigure` ignora qualsiasi configurazione esistente e impedisce di migrare lo state esistente.

Per saltare la configurazione del backend si usa `-backend=false`. Alcuni altri passi di init richiedono un backend inizializzato, quindi è consigliato usare questa opzione solo se la directory di lavoro era già stata inizializzata per un determinato backend.

L'opzione `-backend-config=...` serve per la configurazione parziale del backend. La si usa quando le impostazioni del backend sono dinamiche o sensibili, e quindi non si possono scrivere staticamente nel file di configurazione.

### 3.4.5 — Installazione dei moduli figli

Durante init, Terraform cerca i blocchi `module` nella configurazione e recupera il codice sorgente dei moduli referenziati dalle posizioni indicate nei loro argomenti `source`.

Rieseguire init con i moduli già installati installa i sorgenti dei moduli aggiunti alla configurazione dopo l'ultimo init, ma non modifica i moduli già installati. L'opzione `-upgrade` cambia questo comportamento e aggiorna tutti i moduli al codice sorgente più recente disponibile.

Per saltare l'installazione dei moduli figli si usa `-get=false`. Alcuni altri passi di init si possono completare solo quando l'albero dei moduli è completo, quindi è consigliato usare questa opzione solo se la directory di lavoro era già stata inizializzata con i suoi moduli figli.

### 3.4.6 — Installazione dei plugin

La maggior parte dei provider di Terraform è pubblicata separatamente da Terraform, sotto forma di plugin. Durante init, Terraform cerca nella configurazione i riferimenti ai provider, diretti e indiretti, e cerca di installarne i plugin.

Per i provider pubblicati nel Terraform Registry pubblico o in un registry di provider di terze parti, `terraform init` trova, scarica e installa automaticamente i plugin necessari. Se non si può o non si vuole installare i provider dai loro registry di origine, si può personalizzare il modo in cui Terraform li installa: lo si fa con le impostazioni di installazione dei provider della configurazione della CLI. Come specificare quali provider richiede ciascun modulo è spiegato nella pagina *Provider Requirements* (sezione 2.7).

Dopo un'installazione riuscita, Terraform scrive le informazioni sui provider selezionati nel dependency lock file. Questo file va incluso nel sistema di controllo versione: così, quando si eseguirà di nuovo `terraform init`, Terraform selezionerà esattamente le stesse versioni dei provider. Con l'opzione `-upgrade` Terraform ignora invece il dependency lock file e considera l'installazione di versioni più recenti.

Il comportamento di init rispetto ai plugin si può modificare con queste opzioni:

- `-upgrade`: aggiorna tutti i plugin selezionati in precedenza alla versione più recente che rispetta i vincoli di versione della configurazione. Terraform ignora le selezioni registrate nel dependency lock file e prende la versione più recente disponibile che soddisfa i vincoli configurati.
- `-get-plugins=false`: salta l'installazione dei plugin. Da Terraform 0.13 questa opzione è stata sostituita dalle impostazioni `provider_installation` e `plugin_cache_dir`. Non va usata dalla 0.13 in poi, ed è stata rimossa in Terraform 0.15.
- `-plugin-dir=PATH`: forza l'installazione a leggere i plugin solo dalla directory indicata, come se fosse configurata come `filesystem_mirror` nella configurazione della CLI. Se si usa abitualmente un determinato mirror su filesystem, è consigliato configurare i metodi di installazione di Terraform a livello globale. `-plugin-dir` serve come override una tantum per situazioni eccezionali, ad esempio per testare la build locale di un plugin di provider che si sta sviluppando.
- `-lockfile=MODE`: imposta una modalità per il dependency lock file. L'unico valore valido è `readonly`, che non modifica il lock file ma verifica i checksum rispetto alle informazioni già registrate, ed è in conflitto con l'opzione `-upgrade`. È utile per decidere esplicitamente quando cambia il lock file, se lo si aggiorna con strumenti di gestione delle dipendenze di terze parti.

### 3.4.7 — Eseguire terraform init in automazione

Per i team che usano Terraform come parte fondamentale di una pipeline di gestione delle modifiche e di deployment, può essere utile orchestrare le esecuzioni di Terraform in un sistema di automazione. L'automazione garantisce la coerenza tra le esecuzioni e offre altre funzionalità utili, come l'integrazione con gli hook del controllo versione.

In un ambiente del genere l'esecuzione di init ha alcuni aspetti particolari. Uno è la possibilità di rendere disponibili i plugin in locale, per non doverli reinstallare a ogni esecuzione. Il tutorial *Running Terraform in Automation* approfondisce questi aspetti.

### 3.4.8 — Passare una directory di configurazione diversa

Fino a Terraform v0.13, `terraform apply` accettava un percorso di directory al posto dell'argomento del file di piano. In quel caso Terraform usava quella directory come modulo root, al posto della directory di lavoro corrente. Questo uso è ancora supportato in Terraform v0.14 ma è deprecato, ed è stato rimosso in Terraform v0.15.

Se il proprio workflow si basa sul cambiare la directory del modulo root, si usa invece l'opzione globale `-chdir`. Funziona con tutti i comandi, e fa cercare a Terraform nella directory indicata tutti i file che normalmente leggerebbe o scriverebbe nella directory di lavoro corrente.

Il vecchio schema scriveva la sottodirectory `.terraform` nella directory di lavoro corrente, anche se la directory del modulo root era cambiata. Se il proprio workflow si basava anche su questo, si usa la variabile d'ambiente `TF_DATA_DIR`, che fa scrivere a Terraform la directory `.terraform` in un'altra posizione.

- Fonte: [terraform init command](https://developer.hashicorp.com/terraform/cli/v1.12.x/commands/init)

---

## 3.5 — Il comando terraform fmt

Il comando `terraform fmt` formatta il contenuto dei file di configurazione Terraform secondo il formato e lo stile canonici. Applica un sottoinsieme delle convenzioni di stile del linguaggio Terraform, insieme ad altre piccole modifiche per migliorare la leggibilità.

### 3.5.1 — Introduzione

I comandi di Terraform che generano configurazione producono file conformi allo stile imposto da `terraform fmt`, ed è bene seguire questo stile anche nei propri file per garantire coerenza.

Il formato canonico può cambiare leggermente tra una versione di Terraform e l'altra. Dopo aver aggiornato Terraform è quindi consigliato eseguire subito `terraform fmt` sui propri moduli, insieme alle altre modifiche necessarie per adottare la nuova versione.

HashiCorp non considera le nuove regole di formattazione di `terraform fmt` una breaking change, ma cerca di cambiare il meno possibile le configurazioni che seguono già gli esempi di stile della documentazione. Le nuove regole aggiunte al comando di solito estendono regole già presenti nella documentazione. È consigliato seguire lo stile documentato anche per le scelte che `terraform fmt` non applica ancora automaticamente.

Le scelte di formattazione sono sempre soggettive, quindi si potrebbe non essere d'accordo con quelle di `terraform fmt`. Il comando è volutamente "opinionated" e non ha opzioni di personalizzazione. Il suo scopo principale è incoraggiare la coerenza di stile tra codebase Terraform diverse, anche se lo stile scelto non potrà mai essere il preferito di tutti.

È consigliato seguire le convenzioni di stile di `terraform fmt` quando si scrivono moduli Terraform. Se però i risultati sembrano particolarmente sgradevoli, si può scegliere di non usare il comando ed eventualmente di usare uno strumento di formattazione di terze parti. In quel caso, lo strumento va eseguito anche sui file generati automaticamente da Terraform, perché i file scritti a mano e quelli generati restino coerenti.

### 3.5.2 — Uso

La sintassi è `terraform fmt [options] [target...]`. Per default il comando cerca i file di configurazione nella directory corrente. Con l'argomento target si può indicare cosa analizzare:

- una directory;
- un file specifico;
- lo standard input, passando un singolo trattino (`-`).

Il comando accetta queste opzioni, tutte facoltative:

| **Opzione** | **Descrizione** |
|---|---|
| `-list=false` | Non elenca i file che contengono incongruenze di formattazione |
| `-diff` | Mostra le differenze (diff) delle modifiche di formattazione |
| `-write=false` | Non sovrascrive i file; è implicita con `-check` o quando l'input arriva da STDIN |
| `-check` | Controlla se l'input è formattato: l'exit status è 0 se l'input è formattato correttamente, altrimenti è diverso da zero e il comando stampa l'elenco dei file non formattati correttamente |
| `-no-color` | L'output non contiene colori |
| `-recursive` | Elabora anche i file nelle sottodirectory; per default il comando elabora solo la directory indicata o quella corrente |

- Fonte: [terraform fmt command](https://developer.hashicorp.com/terraform/cli/v1.12.x/commands/fmt)

---

## 3.6 — Il comando terraform validate

Il comando `terraform validate` valida i file di configurazione di una directory. Non valida i servizi remoti, come lo state remoto o le API dei provider.

### 3.6.1 — Introduzione

Validate verifica che una configurazione sia sintatticamente valida e internamente coerente, indipendentemente dalle variabili fornite o dallo state esistente. È quindi utile soprattutto per verificare i moduli riutilizzabili, compresa la correttezza dei nomi degli attributi e dei tipi dei valori.

Il comando si può eseguire automaticamente senza rischi. Ad esempio, lo si può usare come controllo dopo il salvataggio in un editor di testo, o come passo di test di un modulo riutilizzabile in un sistema di CI.

La validazione richiede una directory di lavoro inizializzata, con i plugin e i moduli referenziati già installati. Per inizializzare una directory di lavoro per la validazione senza accedere a nessun backend configurato si usa:

```
$ terraform init -backend=false
```

Per verificare la configurazione nel contesto di un'esecuzione specifica si usa invece il comando `terraform plan`, che include un controllo di validazione implicito. Il contesto comprende ad esempio un determinato workspace di destinazione e determinati valori delle input variable.

### 3.6.2 — Uso

La sintassi è `terraform validate [options]`. Il comando accetta due opzioni:

- `-json` produce l'output in un formato JSON leggibile da una macchina, adatto alle integrazioni con gli editor di testo e ad altri sistemi automatici. Disabilita sempre i colori.
- `-no-color` produce un output senza colori.

### 3.6.3 — Il formato dell'output JSON

Con l'opzione `-json`, Terraform produce i risultati della validazione in formato JSON. Così li si può usare nelle integrazioni con altri strumenti, ad esempio per evidenziare gli errori in un editor di testo.

Come per tutte le opzioni di output JSON, Terraform può incontrare un errore prima di iniziare la validazione, e quell'errore non rispetta l'impostazione dell'output JSON. Per questo il software esterno che legge l'output di Terraform deve aspettarsi di trovare su stdout dati che non sono JSON valido, e trattarli come un errore generico.

L'output include una chiave `format_version`, che da Terraform 1.1.0 vale `"1.0"`. La versione funziona così:

- la versione minor (ad esempio `"1.1"`) aumenta per modifiche o aggiunte retrocompatibili. Per restare compatibili con le future versioni minor, bisogna ignorare le proprietà con nomi non riconosciuti.
- la versione major (ad esempio `"2.0"`) aumenta per modifiche non retrocompatibili. Bisogna rifiutare qualsiasi input che riporti una versione major non supportata.

HashiCorp introdurrà nuove versioni major solo entro i limiti delle *Terraform 1.0 Compatibility Promises*.

Nel caso normale Terraform stampa sullo standard output un oggetto JSON con queste proprietà di primo livello:

- `valid` (booleano): riassume il risultato complessivo della validazione. Vale `true` se Terraform considera valida la configurazione corrente, `false` se ha rilevato errori.
- `error_count` (numero): un intero, zero o positivo, con il numero di errori rilevati da Terraform. Se `valid` è `true`, `error_count` è sempre zero, perché è proprio la presenza di errori a rendere non valida una configurazione.
- `warning_count` (numero): un intero, zero o positivo, con il numero di warning rilevati da Terraform. I warning non rendono non valida la configurazione, ma segnalano possibili problemi che l'utente dovrebbe considerare ed eventualmente risolvere.
- `diagnostics` (array di oggetti): un array JSON di oggetti annidati, ognuno dei quali descrive un errore o un warning.

Gli oggetti annidati in `diagnostics` hanno queste proprietà:

- `severity` (stringa): la gravità della diagnostica, `"error"` o `"warning"`. Gli errori rendono non valida la configurazione. I warning sono solo consigli o avvertenze e non impediscono di lavorare con la configurazione. Le versioni future di Terraform potrebbero aggiungere nuove parole chiave di gravità, quindi chi legge l'output deve accettare e ignorare i valori che non conosce.
- `summary` (stringa): una breve descrizione della natura del problema. Nei normali messaggi di diagnostica di Terraform, pensati per le persone, il summary fa da titolo e viene stampato dopo l'indicatore `Error:` o `Warning:`. Di solito è una frase breve. Può essere più lungo quando l'errore arriva da un sottosistema che non restituisce diagnostiche complete, e allora l'intero messaggio d'errore diventa il summary. In quel caso può contenere caratteri di a capo, che chi visualizza il messaggio deve rispettare.
- `detail` (stringa): un messaggio facoltativo con maggiori dettagli sul problema. Nei normali messaggi di Terraform contiene i paragrafi che seguono il titolo e il riferimento alla posizione nel sorgente. Spesso ha più paragrafi, a volte intervallati da righe che non sono paragrafi. Le righe senza spazi iniziali vanno trattate come paragrafi e mandate a capo in base alla larghezza del contenitore. Le righe con spazi iniziali vanno trattate come testo preformattato e lasciate così. Alcuni messaggi simulano elenchi puntati con caratteri ASCII, ma non è una convenzione di formattazione garantita, quindi non bisogna farci affidamento.
- `range` (oggetto): un oggetto facoltativo che indica la porzione di codice della configurazione a cui si riferisce il messaggio. Per gli errori indica in genere i limiti dell'intestazione del blocco, dell'attributo o dell'espressione non validi. Ha una proprietà `filename`, con il percorso del file relativo alla directory di lavoro corrente, e due proprietà `start` ed `end`, che descrivono posizioni nel sorgente. Non tutti i messaggi riguardano una porzione specifica della configurazione: quando non serve, `range` è omesso o `null`.
- `snippet` (oggetto): un oggetto facoltativo con un estratto del codice sorgente a cui si riferisce il messaggio. Le sue proprietà sono elencate subito sotto.

Le proprietà di `snippet` sono:

- `context` (stringa facoltativa): un riepilogo del contesto principale della diagnostica, ad esempio il blocco resource che contiene l'espressione che l'ha causata. Per alcune diagnostiche questa informazione non è disponibile e la proprietà vale `null`.
- `code` (stringa): uno snippet di configurazione che include il sorgente della diagnostica. Può essere su più righe e includere altro codice attorno all'espressione.
- `start_line` (numero): il numero di riga, a partire da uno, in cui inizia l'estratto. Non coincide necessariamente con `range.start.line`, perché `code` può includere righe di contesto precedenti.
- `highlight_start_offset` e `highlight_end_offset` (numeri): gli offset in caratteri, a partire da zero, dell'inizio e della fine dell'espressione all'interno di `code`.
- `values` (array di oggetti): zero o più valori di espressioni, utili a capire l'origine di una diagnostica in un'espressione complessa.

**Posizione nel sorgente** _(stepTitle)_

Un oggetto posizione, usato nella proprietà `range` di una diagnostica, ha queste proprietà:

- `byte` (numero): l'offset in byte, a partire da zero, nel file indicato.
- `line` (numero): il numero, a partire da uno, della riga che contiene la posizione.
- `column` (numero): il numero di caratteri Unicode, a partire da uno, dall'inizio della riga indicata in `line`.

La posizione iniziale è inclusiva, quella finale esclusiva. Le posizioni esatte usate nei singoli messaggi d'errore sono pensate solo per essere lette da una persona.

**Valore di un'espressione** _(stepTitle)_

Un oggetto valore di espressione dà informazioni aggiuntive su un valore che fa parte dell'espressione che ha causato la diagnostica. È utile soprattutto con `for_each` o costrutti simili, per capire esattamente quali valori causano un errore. L'oggetto ha due proprietà:

- `traversal` (stringa): un percorso in stile HCL, come `var.instance_count`. I valori complessi delle chiavi di indice possono essere omessi, quindi non sempre è HCL valido; il contenuto è pensato per essere letto da una persona.
- `statement` (stringa): un breve frammento in inglese che descrive il valore dell'espressione nel momento della diagnostica. Anche questo è pensato per le persone e può cambiare nelle versioni future.

- Fonte: [terraform validate command](https://developer.hashicorp.com/terraform/cli/v1.12.x/commands/validate)

---

## 3.7 — Creare un piano Terraform

Quando si effettua il provisioning dell'infrastruttura, Terraform crea un piano di esecuzione prima di applicare qualsiasi modifica. Il piano nasce dal confronto tra la configurazione e lo state dell'infrastruttura, ed è un insieme di modifiche che creano, aggiornano o distruggono risorse.

Il comando `terraform plan` serve a tre cose: confrontare la configurazione con lo state delle risorse, rivedere le modifiche prima di applicarle, e aggiornare (refresh) lo state del workspace. Il plan supporta i workflow di automazione nelle pipeline CI/CD. Garantisce infatti che le modifiche applicate da Terraform siano quelle approvate, anche se il deployment si svolge su macchine diverse o in momenti diversi.

Il tutorial mostra come Terraform genera un piano di esecuzione, cosa contiene e che ruolo ha `terraform plan` nel workflow. Si crea e si applica un piano salvato, se ne rivede il contenuto e si osserva come il piano riflette le modifiche alla configurazione. Il tutorial si può svolgere con Terraform Community Edition o con HCP Terraform.

### 3.7.1 — La configurazione di esempio

La configurazione di esempio crea un'istanza EC2 tramite risorse e moduli locali e pubblici; la sottodirectory `modules/aws-ec2-instance` contiene il modulo locale usato per creare l'istanza. Terraform usa le versioni dei provider indicate nel file `terraform.tf`:

```
terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "6.2.0"
    }
    random = {
      source  = "hashicorp/random"
      version = "3.5.1"
    }
  }

  required_version = "~> 1.6"
}
```

Il file `main.tf` di primo livello usa il provider aws per creare un'istanza EC2 con un'AMI Ubuntu. La risorsa `random_pet` genera un nome per l'istanza, e il blocco `module.ec2-instance` usa il modulo locale `aws-ec2-instance` per definire l'istanza. La configurazione passa il nome casuale anche al modulo `hello`, che genera output con quel nome:

```
module "hello" {
  source  = "joatmon08/hello/random"
  version = "6.0.0"

  hellos = {
    hello        = random_pet.instance.id
    second_hello = "World"
  }

  some_key = "secret"
}
```

Per generare il piano di esecuzione, Terraform deve installare i provider e i moduli referenziati dalla configurazione. Il tutorial inizializza quindi la configurazione con `terraform init`; nella variante HCP Terraform lo fa dopo aver decommentato il blocco `cloud` in `terraform.tf`.

### 3.7.2 — Creare un piano

Tre comandi dicono a Terraform di generare un piano di esecuzione:

- `terraform plan` crea un piano con l'insieme di modifiche che renderanno le risorse conformi alla configurazione. Permette di vedere in anteprima le azioni che Terraform compirebbe sull'infrastruttura. Non apporta nessuna modifica alle risorse: perché Terraform le modifichi bisogna applicare un piano. Con l'opzione `-out` si può salvare il piano e applicarlo in seguito, e Terraform eseguirà solo le modifiche elencate nel piano. In una pipeline automatizzata, applicare un file di piano salvato garantisce che Terraform faccia solo le modifiche previste, anche se la pipeline gira su più macchine in momenti diversi.
- `terraform apply` applica un piano Terraform. Se non gli si passa un piano salvato, Terraform crea un piano e chiede l'approvazione prima di applicarlo.
- `terraform destroy` crea un piano di esecuzione che elimina tutte le risorse gestite dal workspace.

Il tutorial genera un piano salvato con l'opzione `-out`:

```
$ terraform plan -out "tfplan"
```

Terraform crea il piano e lo salva nel file `tfplan`. Con HCP Terraform il piano viene creato in HCP Terraform, e il file locale `tfplan` contiene solo un riferimento al piano.

Quando crea un piano, Terraform controlla se il workspace ha già un file di state. La configurazione non è ancora stata applicata, quindi lo state del workspace è vuoto e Terraform pianifica di creare tutte le risorse definite nella configurazione.

Il file di piano salvato si può applicare per eseguire le modifiche, ma il suo contenuto non è leggibile. Per stamparlo si usa il comando `terraform show "tfplan"`, che mostra lo stesso output stampato alla creazione del piano. Questo output si può rivedere con il team prima di applicare il piano salvato, per verificare che le modifiche siano quelle previste.

Terraform può anche riportare il contenuto del piano salvato in formato JSON. È utile soprattutto nelle pipeline automatizzate, perché il piano si può ispezionare con del codice. Il tutorial converte il piano in JSON, lo formatta con `jq` e lo salva in un nuovo file:

```
$ terraform show -json "tfplan" | jq > tfplan.json
```

> **Attenzione**: i file di piano di Terraform possono contenere dati sensibili. Un file di piano non va mai incluso nel controllo versione, né in formato binario né in formato JSON.
_(infoBox)_

### 3.7.3 — Rivedere il piano

Questa parte del tutorial usa `jq` per esaminare i dati che Terraform registra sulle risorse nel file di piano in formato JSON.

Terraform registra nel piano la versione di Terraform che lo ha generato (`terraform_version`, ad esempio `"1.12.0"`) e la versione del formato del file di piano (`format_version`, ad esempio `"1.2"`). Così, quando si usa il piano salvato, si ha la garanzia di applicare le modifiche con la stessa versione:

```
$ jq '.terraform_version, .format_version' tfplan.json
```

**La configurazione nel piano** _(stepTitle)_

L'oggetto JSON `.configuration` è un'istantanea della configurazione al momento di `terraform plan`. L'istantanea registra le versioni dei provider presenti nel file `.terraform.lock.hcl`, così per applicare il piano si usano le stesse versioni dei provider che lo hanno generato. Comprende sia i provider usati dal modulo root sia quelli usati dai moduli figli:

```
$ jq '.configuration.provider_config' tfplan.json
```

La sezione `configuration` organizza poi le risorse definite nel modulo root di primo livello. La sezione `module_calls` contiene i dettagli dei moduli usati: le loro input variable, i loro output e le risorse da creare:

```
$ jq '.configuration.root_module.resources' tfplan.json
$ jq '.configuration.root_module.module_calls' tfplan.json
```

L'oggetto configuration registra anche i riferimenti ad altre risorse presenti nella configurazione di una risorsa. Questo aiuta Terraform a stabilire l'ordine corretto delle operazioni quando applica il piano. Ad esempio, l'argomento `hellos` del modulo `hello` fa riferimento a `random_pet.instance.id` e `random_pet.instance`:

```
$ jq '.configuration.root_module.module_calls.hello.expressions.hellos.references' tfplan.json
```

**Le modifiche pianificate alle risorse** _(stepTitle)_

Il tutorial esamina le modifiche pianificate alla risorsa `aws_instance` del modulo locale `ec2-instance`, nell'elenco `.resource_changes[]`. La rappresentazione include:

- il campo `action`, con l'azione eseguita per la risorsa, in questo caso `create`;
- il campo `before`, con lo state della risorsa prima del run; qui il valore è `null` perché la risorsa non esiste ancora;
- il campo `after`, con lo state da definire per la risorsa;
- il campo `after_unknown`, con l'elenco dei valori che verranno calcolati durante l'operazione, impostati a `true`;
- i campi `before_sensitive` e `after_sensitive`, con l'elenco dei valori marcati come sensitive; Terraform usa questi elenchi per decidere quali valori di output oscurare quando si applica la configurazione.

```
$ jq '.resource_changes[] | select( .address == "module.ec2-instance.aws_instance.main")' tfplan.json
```

**I valori pianificati** _(stepTitle)_

L'oggetto `planned_values` riassume le differenze tra i valori "before" e "after" delle risorse, e mostra il risultato previsto di un run che usasse questo file di piano:

```
$ jq '.planned_values' tfplan.json
```

Nell'esempio, la risorsa `module.ec2-instance.aws_instance` include in un unico oggetto:

- l'indirizzo da usare per fare riferimento alla risorsa nella configurazione;
- il nome del provider;
- i valori di tutti gli attributi.

Questo formato unisce in un solo oggetto lo state precedente e quello atteso, per mostrare i risultati pianificati della configurazione. Così è più facile da usare per chi elabora a valle i dati del piano. Ad esempio, la CLI di Terraform Sentinel testa le policy sui risultati pianificati registrati qui. Anche la stima dei costi di HCP Terraform usa i dati di `planned_values` per calcolare come cambia la spesa per l'infrastruttura.

### 3.7.4 — Applicare un piano salvato

Il tutorial applica poi il piano salvato con `terraform apply "tfplan"`. Terraform, o HCP Terraform, applica le modifiche come descritte nel piano salvato.

> **Nota**: quando si applica un file di piano salvato, Terraform non chiede l'approvazione ma esegue subito le modifiche. Questo workflow si usa soprattutto in automazione.
_(infoBox)_

### 3.7.5 — Modificare la configurazione e creare un nuovo piano

Le input variable permettono di aggiornare facilmente i valori della configurazione senza modificare i file di configurazione. Il tutorial definisce in `variables.tf` una nuova input variable da usare per il modulo `hello`:

```
variable "secret_key" {
  type        = string
  sensitive   = true
  description = "Secret key for hello module"
}
```

Poi si crea un file `terraform.tfvars` che imposta il valore della nuova variabile (`secret_key = "TOPSECRET"`).

> **Attenzione**: i file `.tfvars` non vanno mai inclusi nel controllo versione.
_(infoBox)_

Infine si aggiorna la configurazione del modulo `hello` in `main.tf` perché usi la nuova variabile:

```
module "hello" {
  source  = "joatmon08/hello/random"
  version = "6.0.0"

  hellos = {
    hello        = random_pet.instance.id
    second_hello = "World"
  }

  some_key = var.secret_key
}
```

Si crea quindi un nuovo piano salvato, `tfplan-input-var`, e lo si converte in JSON:

```
$ terraform plan -out "tfplan-input-var"
$ terraform show -json tfplan-input-var | jq > tfplan-input-var.json
```

### 3.7.6 — Rivedere il nuovo piano

Questa volta Terraform ha trovato un file di state nella directory di lavoro e lo ha usato per pianificare le modifiche alle risorse. Il piano è stato creato con risorse esistenti e con input variable, quindi il file di piano contiene alcuni campi nuovi.

**Le input variable nel piano** _(stepTitle)_

Ora che sono definite delle input variable, Terraform le registra nel file di piano, ad esempio `project_name`, `region` e `secret_key` con i rispettivi valori:

```
$ jq '.variables' tfplan-input-var.json
```

> **Attenzione**: anche se la variabile è marcata come sensitive, Terraform ne conserva il valore in chiaro nel file di piano. I file di piano possono quindi contenere informazioni sensibili: vanno custoditi in modo sicuro e mai inclusi nel controllo versione.
_(infoBox)_

A differenza delle input variable, i valori delle variabili d'ambiente usate dalla configurazione non finiscono nei file di piano. Le variabili d'ambiente sono infatti uno dei modi consigliati per passare a Terraform valori sensibili, come le credenziali dei provider.

**Lo state precedente nel piano** _(stepTitle)_

A differenza del primo file di piano, questo contiene un oggetto `prior_state`, che registra il file di state esattamente com'era prima del plan:

```
$ jq '.prior_state' tfplan-input-var.json
```

**Le modifiche alle risorse** _(stepTitle)_

Ora che il file di state contiene delle risorse, Terraform tiene conto dello state esistente quando crea un piano di esecuzione. Ad esempio, l'oggetto `module.hello.random_pet.server` contiene ora dati sia nel campo `before` sia nel campo `after`: rappresentano rispettivamente la configurazione precedente e quella desiderata.

```
$ jq '.resource_changes[] | select( .address == "module.hello.random_pet.server")' tfplan-input-var.json
```

L'elenco `actions` è ora `["delete","create"]` e `action_reason` vale `"replace_because_cannot_update"`. La modifica a `secret_key` è distruttiva per questa risorsa, quindi Terraform deve eliminarla e ricrearla. Terraform decide se aggiornare una risorsa sul posto o ricrearla in base a quali attributi del provider sono cambiati.

Una volta create le risorse nella directory di lavoro, Terraform decide le modifiche da fare in base a tre elementi: lo state precedente, i dati restituiti dal refresh e la configurazione scritta. Terraform offre anche opzioni per cambiare il modo in cui costruisce il piano. Ad esempio, si può creare un piano che aggiorna solo il file di state senza toccare la configurazione delle risorse. Oppure si può limitare il piano ad alcune risorse specifiche (target), da aggiornare o sostituire.

### 3.7.7 — Il piano di distruzione

Per eliminare le risorse create, il tutorial crea e applica un piano di distruzione:

```
$ terraform plan -destroy -out "tfplan-destroy"
$ terraform apply "tfplan-destroy"
```

Con l'opzione `-destroy`, Terraform crea un piano che distrugge tutte le risorse della configurazione. Il comando `terraform destroy` è una scorciatoia che crea un piano di distruzione e poi attende l'approvazione. Salvare un piano di distruzione permette di rivederlo prima di applicarlo, proprio come un normale piano salvato.

- Fonte: [Create a Terraform plan](https://developer.hashicorp.com/terraform/tutorials/cli/plan)

---

## 3.8 — Il comando terraform plan

Il comando `terraform plan` crea un piano di esecuzione, che permette di vedere in anteprima le modifiche che Terraform intende apportare all'infrastruttura.

### 3.8.1 — Introduzione

Per default, quando crea un piano Terraform esegue queste operazioni:

- legge lo stato attuale degli oggetti remoti già esistenti, per assicurarsi che lo state di Terraform sia aggiornato;
- confronta la configurazione attuale con lo state precedente e annota le differenze;
- propone un insieme di azioni che, se applicate, rendono gli oggetti remoti conformi alla configurazione.

Il comando plan da solo non esegue le modifiche proposte. Serve a verificare che le modifiche proposte siano quelle attese prima di applicarle, o a condividerle con il team per una revisione più ampia. Se le istanze delle risorse e i valori di output del modulo root non richiedono modifiche, `terraform plan` segnala che non è necessaria nessuna azione.

Se si usa Terraform direttamente in un terminale interattivo e si prevede di applicare le modifiche proposte, si può anche eseguire direttamente `terraform apply`. Per default il comando apply genera automaticamente un nuovo piano e chiede di approvarlo.

Con l'opzione facoltativa `-out=FILE` si salva il piano generato in un file su disco. In seguito lo si esegue passandolo come argomento aggiuntivo a `terraform apply`. Questo workflow in due passi è pensato soprattutto per l'esecuzione di Terraform in automazione.

Se si esegue `terraform plan` senza l'opzione `-out=FILE`, Terraform crea uno **speculative plan**. È una descrizione dell'effetto del piano, senza nessuna intenzione di applicarlo davvero.

Nei team che modificano l'infrastruttura reale con un workflow di controllo versione e code review, gli sviluppatori usano gli speculative plan per verificare l'effetto delle proprie modifiche prima della code review. Nel frattempo però altre modifiche al sistema di destinazione possono rendere l'effetto finale diverso da quello indicato dallo speculative plan. Prima di applicare bisogna quindi sempre ricontrollare il piano finale, non speculativo, per verificare che corrisponda ancora alle proprie intenzioni.

### 3.8.2 — Uso

La sintassi è `terraform plan [options]`. Il sottocomando plan cerca la configurazione del modulo root nella directory di lavoro corrente.

Plan è uno dei comandi principali di Terraform e ha molte opzioni, descritte nelle sezioni seguenti. Nella maggior parte dei casi però non serve impostarne nessuna: una configurazione Terraform dovrebbe essere progettata per funzionare senza opzioni speciali nel lavoro di routine. Le opzioni si dividono in tre gruppi:

- le **planning mode**, modalità alternative per situazioni particolari, in cui l'obiettivo non è solo rendere il sistema remoto conforme alla configurazione;
- le **planning option**, che si affiancano alle planning mode e personalizzano il processo di pianificazione per esigenze insolite; il resource targeting è una planning option con alcune avvertenze importanti;
- le **altre opzioni**, che modificano il comportamento del comando stesso invece del contenuto del piano generato.

### 3.8.3 — Planning mode

Il comportamento predefinito descritto finora modifica il sistema remoto per farlo corrispondere alle modifiche della configurazione. Terraform ha due planning mode alternative, ognuna delle quali crea un piano con un obiettivo diverso. Queste opzioni sono disponibili sia per `terraform plan` sia per `terraform apply`.

- **Destroy mode**: crea un piano che distrugge tutti gli oggetti remoti esistenti e lascia vuoto lo state di Terraform. Equivale a eseguire `terraform destroy`. È utile ad esempio negli ambienti di sviluppo temporanei, dove gli oggetti gestiti non servono più a lavoro finito. Si attiva con l'opzione `-destroy`.
- **Refresh-only mode**: crea un piano che aggiorna solo lo state di Terraform e i valori di output del modulo root, per riflettere le modifiche fatte agli oggetti remoti al di fuori di Terraform. È utile se si sono modificati di proposito degli oggetti remoti fuori dal normale workflow, ad esempio durante la risposta a un incidente, e bisogna riallineare i registri di Terraform. Si attiva con l'opzione `-refresh-only`.

La modalità predefinita, usata quando non si sceglie nessuna delle alternative, si chiama "Normal mode". Le modalità alternative servono solo in situazioni particolari, per questo altre parti della documentazione di Terraform trattano solo la modalità normale.

Le planning mode sono mutuamente esclusive. Attivare una modalità non predefinita disattiva la modalità normale, e non si possono usare due modalità alternative insieme.

> **Nota**: in Terraform v0.15 e precedenti l'opzione `-destroy` è supportata solo da `terraform plan` e non da `terraform apply`. In quelle versioni, per creare e applicare un piano in destroy mode bisogna eseguire `terraform destroy`. L'opzione `-refresh-only` è disponibile solo da Terraform v0.15.4.
_(infoBox)_

### 3.8.4 — Planning option

Oltre alle planning mode alternative, diverse opzioni modificano il comportamento della pianificazione. Sono disponibili sia per `terraform plan` sia per `terraform apply`.

- `-refresh=false`: disattiva la sincronizzazione predefinita dello state di Terraform con gli oggetti remoti prima di cercare le modifiche alla configurazione. Può rendere più veloce la pianificazione, perché riduce le richieste alle API remote. Però Terraform ignora così le modifiche esterne, e il piano può risultare incompleto o errato. Non si può usare in refresh-only mode, perché annullerebbe l'intera pianificazione.
- `-replace=ADDRESS`: fa pianificare a Terraform la sostituzione dell'istanza di risorsa con l'indirizzo indicato. È utile quando uno o più oggetti remoti si sono degradati e si possono sostituire con oggetti nuovi con la stessa configurazione, in linea con i pattern di infrastruttura immutabile. Terraform usa un'azione "replace" se la risorsa indicata causerebbe normalmente un "update" o nessuna azione. L'opzione si può ripetere per sostituire più oggetti in una volta. Non si può usare insieme a `-destroy`, ed è disponibile solo da Terraform v0.15.2; nelle versioni precedenti si ottiene un risultato simile con `terraform taint`.
- `-target=ADDRESS`: limita la pianificazione alle istanze di risorsa che corrispondono all'indirizzo indicato e agli oggetti da cui dipendono. Va usata solo in circostanze eccezionali, come recuperare da un errore o aggirare una limitazione di Terraform (vedi il resource targeting più avanti).
- `-var 'NAME=VALUE'`: imposta il valore di una singola input variable dichiarata nel modulo root della configurazione. L'opzione si può ripetere per impostare più variabili.
- `-var-file=FILENAME`: imposta i valori di molte input variable del modulo root, prendendo le definizioni da un file `.tfvars`. L'opzione si può ripetere per includere i valori di più file. Ci sono anche altri modi per impostare i valori delle input variable del modulo root, descritti nella pagina *Assign values to input variables*.

**Input variable da riga di comando** _(stepTitle)_

L'opzione `-var` specifica i valori delle input variable dichiarate nel modulo root. La riga di comando deve però essere interpretabile sia dalla shell sia da Terraform, e questo può essere complicato con espressioni piene di virgolette e sequenze di escape. Nella maggior parte dei casi è meglio usare l'opzione `-var-file` e scrivere i valori in un file separato. Così Terraform li legge direttamente, invece di leggere il risultato già elaborato dalla shell.

> **Attenzione**: Terraform dà errore se si mette uno spazio prima o dopo il segno di uguale (ad esempio `-var "length = 2"`).
_(infoBox)_

In una shell di tipo Unix, su sistemi come Linux o macOS, conviene racchiudere l'argomento di `-var` tra virgolette singole `'`, perché la shell interpreti il valore alla lettera. Se il valore contiene a sua volta una virgoletta singola, bisogna comunque farne l'escape per la shell. Per farlo si chiude temporaneamente la sequenza tra virgolette, così il backslash viene interpretato:

```
terraform plan -var 'name=value'
terraform plan -var 'name=va'\''lue'
```

Su Windows è consigliato usare il prompt dei comandi (`cmd.exe`). Dal prompt dei comandi, l'argomento va racchiuso tra virgolette doppie `"`. Le virgolette doppie presenti nel valore vanno precedute da un backslash:

```
terraform plan -var "name=value"
terraform plan -var "name=va\"lue"
```

PowerShell su Windows non riesce a passare correttamente le virgolette letterali ai programmi esterni. Per questo HashiCorp sconsiglia di usare Terraform con PowerShell su Windows e consiglia il prompt dei comandi.

La sintassi del valore dipende dal vincolo di tipo della variabile. I tipi primitivi `string`, `number` e `bool` si aspettano un valore stringa diretto, senza altra punteggiatura oltre a quella richiesta dalla shell, come negli esempi precedenti.

Per tutti gli altri vincoli di tipo bisogna scrivere un'espressione valida del linguaggio Terraform che rappresenti il valore. Vale per i tipi `list`, `map` e `set` e per la parola chiave speciale `any`. L'espressione deve contenere tutte le virgolette e gli escape necessari perché arrivi a Terraform intatta attraverso la shell. Ad esempio, per un vincolo di tipo `list(string)`:

```
# Unix-style shell
terraform plan -var 'name=["a", "b", "c"]'

# Windows Command Prompt (do not use PowerShell on Windows)
terraform plan -var "name=[\"a\", \"b\", \"c\"]"
```

Vincoli simili valgono quando si impostano le input variable con le variabili d'ambiente.

**Resource targeting** _(stepTitle)_

L'opzione `-target` concentra l'attenzione di Terraform su un sottoinsieme di risorse. Il vincolo si specifica con la sintassi degli indirizzi delle risorse (resource address), che Terraform interpreta così:

- se l'indirizzo identifica una specifica istanza di risorsa, Terraform seleziona solo quell'istanza. Per le risorse con `count` o `for_each`, l'indirizzo dell'istanza deve includere l'indice, come `aws_instance.example[0]`.
- se l'indirizzo identifica una risorsa nel suo complesso, Terraform ne seleziona tutte le istanze. Per le risorse con `count` o `for_each` vuol dire tutti gli indici attualmente associati alla risorsa. Per le risorse a istanza singola, senza `count` né `for_each`, indirizzo della risorsa e indirizzo dell'istanza coincidono, quindi questo caso non si presenta.
- se l'indirizzo identifica un'intera istanza di modulo, Terraform seleziona tutte le istanze di tutte le risorse di quell'istanza di modulo e di tutte le sue istanze di modulo figlie.

Dopo aver selezionato le istanze indicate direttamente, Terraform estende la selezione a tutti gli altri oggetti da cui queste dipendono, direttamente o indirettamente.

Il targeting è pensato per circostanze eccezionali, come recuperare da un errore o aggirare una limitazione di Terraform. Non è consigliato usare `-target` nelle operazioni di routine. Può infatti causare un drift della configurazione che passa inosservato, e rendere poco chiaro come lo stato reale delle risorse corrisponda alla configurazione.

Per lavorare su porzioni isolate di configurazioni molto grandi, invece di `-target` è meglio dividere la configurazione in più configurazioni piccole, ognuna applicabile da sola. I data source permettono di leggere le informazioni sulle risorse create in altre configurazioni. Così un'architettura complessa si può scomporre in parti più gestibili, da aggiornare in modo indipendente.

### 3.8.5 — Altre opzioni

Il comando `terraform plan` ha anche altre opzioni, che riguardano l'input e l'output del comando invece del tipo di piano che Terraform crea. Queste opzioni non valgono necessariamente anche per `terraform apply`, salvo dove indicato nella documentazione di quel comando:

- `-compact-warnings`: mostra i warning in forma compatta, con i soli messaggi di riepilogo. Fa eccezione il caso in cui ci sia almeno un errore, perché allora il testo completo dei warning può aiutare a capire gli errori.
- `-detailed-exitcode`: restituisce un exit code dettagliato, con codici di uscita che descrivono meglio il contenuto del piano: `0` = completato con diff vuoto (nessuna modifica), `1` = errore, `2` = completato con diff non vuoto (modifiche presenti).
- `-generate-config-out=PATH`: (sperimentale) se la configurazione contiene blocchi `import`, genera l'HCL delle risorse importate non ancora presenti nella configurazione. La scrive in un nuovo file nel percorso `PATH`; se il file esiste già, Terraform dà errore. Se il plan fallisce per un altro motivo, Terraform potrebbe comunque provare a scrivere la configurazione.
- `-input=false`: disattiva le richieste di input per le variabili del modulo root a cui non è stato assegnato un valore in altro modo. È utile soprattutto quando si esegue Terraform in sistemi di automazione non interattivi.
- `-json`: abilita l'output dell'interfaccia in formato JSON leggibile da una macchina. Implica `-input=false`, quindi per proseguire tutte le variabili devono avere un valore assegnato.
- `-lock=false`: non tiene il lock dello state durante l'operazione. È pericoloso se altri possono eseguire comandi sullo stesso workspace contemporaneamente.
- `-lock-timeout=DURATION`: fa riprovare a Terraform ad acquisire il lock per un certo periodo prima di restituire un errore, a meno che il lock non sia disattivato con `-lock=false`. La durata è un numero seguito dalla lettera dell'unità di tempo, ad esempio `"3s"` per tre secondi.
- `-no-color`: disattiva le sequenze di formattazione del terminale nell'output. Serve quando l'output viene mostrato da un sistema che non sa interpretarle.
- `-out=FILENAME`: scrive il piano generato in un file, in un formato opaco. Il file si può poi passare a `terraform apply` per eseguire le modifiche pianificate, e ad alcuni altri comandi che lavorano con i piani salvati. I dettagli sul nome e sul contenuto del file seguono subito sotto.
- `-parallelism=n`: limita il numero di operazioni simultanee mentre Terraform percorre il grafo. Il default è 10.

Terraform accetta qualsiasi nome per il file di `-out`, ma per convenzione lo si chiama `tfplan`. Non si deve usare un suffisso che Terraform riconosce come un altro formato. Con il suffisso `.tf`, ad esempio, Terraform leggerebbe il file come sorgente della configurazione, e i comandi successivi darebbero errori di sintassi.

Il file di piano non è in un formato standard pensato per altri software, ma contiene l'intera configurazione, tutti i valori associati alle modifiche pianificate e tutte le opzioni del piano, comprese le input variable. Gli eventuali dati sensibili vengono salvati in chiaro nel file, anche se nell'output del terminale sono oscurati. I file di piano salvati vanno quindi trattati come artefatti potenzialmente sensibili.

Per le configurazioni che usano solo il backend `local`, `terraform plan` accetta anche l'opzione legacy `-state`.

Fino a Terraform v0.13 il comando accettava anche un argomento posizionale con una directory da usare come modulo root, al posto della directory di lavoro corrente. Questo uso è stato deprecato in v0.14 e rimosso in v0.15. Al suo posto si usano l'opzione globale `-chdir` e, se serve, la variabile d'ambiente `TF_DATA_DIR`, come descritto nella sezione 3.4.8.

- Fonte: [terraform plan command](https://developer.hashicorp.com/terraform/cli/v1.12.x/commands/plan)

---

## 3.9 — Applicare la configurazione Terraform

Dopo aver scritto la configurazione, il core workflow di Terraform si compone di tre passi principali: initialize, plan e apply (sezione 3.3). Quando si applicano modifiche all'infrastruttura, Terraform esegue i passi registrati in un piano di esecuzione, usando i provider e i moduli installati durante l'inizializzazione. Questi passi creano, aggiornano ed eliminano l'infrastruttura per renderla conforme alla configurazione delle risorse.

Nel tutorial si applica una configurazione di esempio e si osservano i passi che Terraform compie per applicare le modifiche. Si vede inoltre come Terraform si riprende dagli errori durante l'apply, e alcuni modi comuni di usare il comando apply. Il tutorial si può svolgere con Terraform Community Edition o con HCP Terraform.

### 3.9.1 — La configurazione di esempio

La configurazione di esempio crea un'istanza EC2 e un bucket S3. Terraform usa le versioni dei provider indicate nel file `terraform.tf`:

```
terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "6.2.0"
    }

    random = {
      source  = "hashicorp/random"
      version = "3.5.1"
    }

    time = {
      source  = "hashicorp/time"
      version = "0.9.1"
    }
  }

  required_version = "~> 1.6"
}
```

Il file `main.tf` definisce la configurazione di un'istanza EC2 e di un bucket S3. La risorsa `aws_instance.main` dipende dalla risorsa `random_pet.instance` e dal data source `aws_ami.ubuntu`. Quando si applica la configurazione, Terraform crea quindi la risorsa `random_pet` e popola il data source `aws_ami` prima di creare l'istanza. La risorsa `aws_s3_bucket.example` non dipende da nessun'altra, quindi Terraform la crea in parallelo con le altre risorse.

Per generare il piano di esecuzione, Terraform deve installare i provider e i moduli referenziati dalla configurazione. Il tutorial inizializza quindi la configurazione con `terraform init`; nella variante HCP Terraform lo fa dopo aver decommentato il blocco `cloud`.

### 3.9.2 — Applicare la configurazione

Si applica la configurazione con `terraform apply`. Non è stato fornito un piano salvato, quindi Terraform crea un piano e chiede di approvarlo prima di modificare qualsiasi risorsa. Una volta approvato il piano, Terraform applica la configurazione in questi passi:

1. mette un lock sullo state del workspace, così nessun'altra istanza di Terraform può modificare lo state o applicare modifiche alle risorse. Se trova un lock file esistente (`.terraform.tfstate.lock.info`), segnala un errore ed esce;
2. crea un piano e attende l'approvazione. In alternativa si può fornire un piano salvato creato con `terraform plan`, e allora Terraform non chiede l'approvazione;
3. esegue i passi definiti nel piano con i provider installati durante l'inizializzazione. Li esegue in parallelo quando possibile, e in sequenza quando una risorsa dipende da un'altra;
4. aggiorna lo state del workspace con un'istantanea del nuovo stato delle risorse;
5. rimuove il lock dallo state del workspace;
6. riporta le modifiche apportate e i valori di output definiti nella configurazione.

Si risponde `yes` alla richiesta di conferma per applicare il piano proposto. Quando crea un piano, Terraform analizza le dipendenze tra le risorse, così apporta le modifiche nell'ordine corretto e, quando possibile, in parallelo. Nel tutorial crea per prima la risorsa `random_pet`, e poi in parallelo le istanze che dipendono da essa. Durante l'apply, Terraform riporta l'avanzamento mentre crea, aggiorna ed elimina le risorse.

### 3.9.3 — Errori durante l'apply

Quando incontra un errore durante un passo di apply, Terraform:

- registra l'errore e lo riporta nella console;
- aggiorna il file di state con le eventuali modifiche alle risorse;
- rimuove il lock dal file di state;
- esce.

Dopo un errore durante l'apply, l'infrastruttura può trovarsi in uno stato non valido. Terraform non supporta il rollback automatico di un apply rimasto a metà. Dopo aver risolto l'errore, bisogna applicare di nuovo la configurazione per portare l'infrastruttura allo stato desiderato.

Per vedere come Terraform gestisce gli errori, il tutorial introduce di proposito un errore durante un apply. Si aggiunge a `main.tf` la configurazione di un nuovo oggetto S3:

```
resource "aws_s3_object" "example" {
  bucket = aws_s3_bucket.example.bucket

  key    = "README.md"
  source = "./README.md"

  etag = filemd5("./README.md")
}
```

Si crea un piano salvato per la nuova configurazione con `terraform plan -out "add-object"`. Poi si elimina il bucket al di fuori di Terraform, dalla console AWS o con la AWS CLI. Il piano presuppone che il bucket esista, quindi il suo apply darà errore.

Applicando il piano con `terraform apply "add-object"`, Terraform va in errore quando cerca di creare l'oggetto `aws_s3_object.example`. Il bucket S3 è stato rimosso dopo la creazione del piano, quindi AWS non riesce a creare l'oggetto, e il provider AWS riporta l'errore a Terraform.

Le cause comuni degli errori di apply sono:

- una modifica a una risorsa al di fuori del controllo di Terraform;
- errori di rete o altri errori temporanei;
- un errore atteso dall'API a monte, come un nome di risorsa duplicato o il raggiungimento di un limite di risorse;
- un errore inatteso dall'API a monte, come un errore interno del server;
- un bug nel codice del provider Terraform o in Terraform stesso.

A seconda della causa, per risolvere il problema bisogna modificare la configurazione oppure diagnosticare e correggere l'errore dal lato delle API del cloud provider. Il progetto Terraform continua a tenere traccia del bucket, perché non ha ancora aggiornato (refresh) lo state della risorsa. Se si stampa lo state del bucket S3 con `terraform show`, lo state riporta ancora il bucket eliminato a mano.

Terraform conserva ciò che sa dello stato delle risorse in locale, nel file `terraform.tfstate`, oppure in un backend remoto come HCP Terraform. Il comando `terraform show` stampa lo state ma non lo aggiorna, quindi le informazioni possono essere obsolete.

Quando si applica un piano, Terraform apporta solo le modifiche definite nel piano. Se le risorse cambiano tra la creazione del piano e il suo apply, Terraform può andare in errore, perché il piano non si può più applicare così com'è scritto. Per risolvere l'errore bisogna creare e applicare un nuovo piano che tenga conto del bucket mancante.

Al plan successivo, Terraform aggiorna lo stato delle risorse leggendolo dalle API con i provider installati. Si accorge che il bucket della risorsa `aws_s3_bucket.example` non esiste più, e genera un piano che lo ricrea prima di creare il nuovo oggetto `aws_s3_object.example`.

Applicando la configurazione, Terraform aggiorna lo state del workspace per registrare che il bucket S3 non esiste più (*Note: Objects have changed outside of Terraform*). Poi crea un piano che crea sia il bucket sia l'oggetto, per riallineare lo state alla configurazione, e attende la conferma. Le risorse possono cambiare fuori dal controllo di Terraform per molti motivi. Nella maggior parte dei casi Terraform gestisce da solo queste differenze, e crea, distrugge o aggiorna le risorse per renderle conformi alla configurazione.

In questo caso è bastato riapplicare la configurazione per riprendersi dall'errore. A seconda della causa, può essere necessario risolvere l'errore al di fuori di Terraform o modificare la configurazione. Ad esempio, se Terraform riporta un errore di limite di risorse dall'API del cloud provider, bisogna chiedere al cloud provider di alzare quel limite prima di applicare la configurazione.

### 3.9.4 — Sostituire le risorse

Con Terraform di solito si applica l'intera modifica alla configurazione in una volta, e sono Terraform e i suoi provider a decidere quali modifiche fare e in che ordine. In alcuni casi però può servire sostituire o modificare singole risorse. Per questo Terraform offre due argomenti dei comandi plan e apply che agiscono su risorse specifiche: `-replace` e `-target`.

L'argomento `-replace` si usa quando una risorsa è diventata non sana (unhealthy) o smette di funzionare per motivi fuori dal controllo di Terraform. Ad esempio, un errore nella configurazione del sistema operativo di un'istanza EC2 può richiedere di sostituire l'istanza. La configurazione Terraform non cambia, quindi bisogna dire esplicitamente a Terraform di ricreare la risorsa con la stessa configurazione.

L'argomento `-replace` richiede l'indirizzo di una risorsa, che si ricava elencando le risorse con `terraform state list`. Nel tutorial si sostituisce la seconda istanza EC2:

```
$ terraform apply -replace "aws_instance.main[1]"
```

L'altro caso in cui può servire applicare solo una parte della configurazione è un errore che impedisce a Terraform di applicarla tutta in una volta. Succede quando un errore dell'API di destinazione o del provider lascia le risorse in uno stato non valido, che Terraform non riesce a risolvere da solo. In questo caso si usa l'argomento `-target` durante l'apply, per applicare solo alcune risorse invece dell'intera configurazione (tutorial *Target resources*, sezione 4.11).

- Fonte: [Apply Terraform configuration](https://developer.hashicorp.com/terraform/tutorials/cli/apply)

---

## 3.10 — Il comando terraform apply

Il comando `terraform apply` esegue le azioni proposte in un piano Terraform.

### 3.10.1 — Uso

La sintassi è `terraform apply [options] [plan file]`.

**Automatic plan mode** _(stepTitle)_

Se si esegue `terraform apply` senza un file di piano salvato, Terraform crea automaticamente un nuovo piano di esecuzione, come se si fosse eseguito `terraform plan`. Poi chiede di approvarlo ed esegue le azioni indicate. Si possono usare tutte le planning mode e le planning option per personalizzare il modo in cui Terraform crea il piano. Con l'opzione `-auto-approve` Terraform applica il piano senza chiedere conferma.

> **Attenzione**: se si usa `-auto-approve`, HashiCorp consiglia di assicurarsi che nessuno possa modificare l'infrastruttura al di fuori del workflow Terraform. Così si riduce al minimo il rischio di modifiche imprevedibili e di drift della configurazione.
_(infoBox)_

**Saved plan mode** _(stepTitle)_

Se si passa a `terraform apply` un file di piano salvato, Terraform esegue le azioni del piano senza chiedere conferma. Questo workflow in due passi è utile quando si esegue Terraform in automazione. Per ispezionare un file di piano salvato prima di applicarlo si usa `terraform show`.

Con un piano salvato non si possono aggiungere planning mode o planning option. Queste opzioni influiscono solo sulla scelta delle azioni da compiere, e il file di piano contiene già il risultato finale di quella scelta.

**Opzioni di pianificazione** _(stepTitle)_

Senza un file di piano salvato, `terraform apply` supporta tutte le planning mode e le planning option di `terraform plan` (sezione 3.8):

- le planning mode, cioè `-destroy`, che crea un piano per distruggere tutti gli oggetti remoti, e `-refresh-only`, che crea un piano per aggiornare lo state di Terraform e i valori di output del modulo root;
- le planning option, come la scelta delle istanze di risorsa da sostituire (`-replace`) o l'impostazione delle input variable (`-var` e `-var-file`).

**Opzioni di apply** _(stepTitle)_

Le opzioni seguenti modificano il modo in cui il comando apply esegue l'operazione e ne riporta l'esito:

- `-auto-approve`: salta l'approvazione interattiva del piano prima dell'apply. Terraform ignora questa opzione quando si passa un file di piano salvato, perché considera il passaggio del file di piano come l'approvazione stessa.
- `-compact-warnings`: mostra i warning in forma compatta, con i soli messaggi di riepilogo, a meno che non ci sia almeno un errore.
- `-input=false`: disattiva tutte le richieste interattive di Terraform, compresa l'approvazione del piano. Terraform presume quindi per prudenza che non si voglia applicare il piano, e l'operazione fallisce. Per eseguire Terraform in un contesto non interattivo si veda *Running Terraform in Automation*.
- `-json`: abilita l'output dell'interfaccia in formato JSON leggibile da una macchina. Implica `-input=false`, quindi tutte le variabili devono avere un valore assegnato. Per usarla bisogna anche attivare `-auto-approve` o passare un piano salvato.
- `-lock=false`: non tiene il lock dello state durante l'operazione. È pericoloso se altri possono eseguire comandi sullo stesso workspace contemporaneamente.
- `-lock-timeout=DURATION`: fa riprovare a Terraform ad acquisire il lock per un certo periodo prima di restituire un errore (ad esempio `"3s"`), a meno che il lock non sia disattivato con `-lock=false`.
- `-no-color`: disattiva le sequenze di formattazione del terminale nell'output.
- `-parallelism=n`: limita il numero di operazioni simultanee mentre Terraform percorre il grafo. Il default è 10.
- `-replace=resource`: Terraform pianifica di sostituire questa istanza di risorsa invece di aggiornarla o di non fare nulla.
- tutte le planning mode e le planning option di `terraform plan`, per personalizzare il modo in cui Terraform crea il piano. Sono disponibili solo quando si esegue `terraform apply` senza un file di piano salvato.

Per le configurazioni che usano solo il backend `local`, `terraform apply` accetta anche le opzioni legacy `-state`, `-state-out` e `-backup`.

Come per init e plan, la possibilità di passare una directory al posto del file di piano è stata deprecata in Terraform v0.14 e rimossa in v0.15. Al suo posto si usa l'opzione globale `-chdir` (sezione 3.4.8), che funziona con tutti i comandi e fa cercare a Terraform nella directory indicata tutti i file che normalmente leggerebbe o scriverebbe nella directory di lavoro corrente. Se il vecchio schema serviva anche a far scrivere a Terraform la sottodirectory `.terraform` nella directory di lavoro corrente, pur avendo cambiato la directory del modulo root, si usa la variabile d'ambiente `TF_DATA_DIR`, che indica a Terraform di scrivere la directory `.terraform` in un'altra posizione.

- Fonte: [terraform apply command](https://developer.hashicorp.com/terraform/cli/v1.12.x/commands/apply)

---

## 3.11 — Il comando terraform destroy

Il comando `terraform destroy` rimuove (deprovisioning) tutti gli oggetti gestiti da una configurazione Terraform.

In produzione di solito non si vogliono distruggere oggetti di lunga durata. A volte però Terraform si usa per gestire infrastruttura temporanea di sviluppo. In quel caso `terraform destroy` ripulisce comodamente tutti quegli oggetti temporanei a lavoro finito.

### 3.11.1 — Uso

La sintassi è `terraform destroy [options]`. Il comando è solo un alias di comodo per questo comando:

```
terraform apply -destroy
```

Per questo accetta la maggior parte delle opzioni di `terraform apply`. Non accetta però l'argomento del file di piano, e forza sempre la planning mode "destroy".

Si può anche creare uno speculative plan di distruzione, per vedere l'effetto della distruzione senza eseguirla. Il comando seguente esegue `terraform plan` in destroy mode e mostra le modifiche di distruzione proposte:

```
terraform plan -destroy
```

> **Nota**: l'opzione `-destroy` di `terraform apply` esiste solo da Terraform v0.15.2. Nelle versioni precedenti bisogna usare `terraform destroy` per ottenere l'effetto di `terraform apply -destroy`.
_(infoBox)_

### 3.11.2 — Distruggere una risorsa specifica

L'opzione `-target` permette di distruggere una determinata risorsa e le sue dipendenze. Ad esempio, se la configurazione contiene una risorsa `aws_instance` con etichetta `example`, la si distrugge con questo comando:

```
terraform destroy -target aws_instance.example
```

- Fonte: [terraform destroy command](https://developer.hashicorp.com/terraform/cli/v1.12.x/commands/destroy)

---

## 3.12 — Distruggere l'infrastruttura

Quando l'infrastruttura gestita dal workspace non serve più, la si distrugge con Terraform. Terraform distrugge le risorse quando le si rimuove dalla configurazione e si applica la modifica. Con il comando `terraform destroy` si possono anche distruggere in una volta tutte le risorse gestite dalla configurazione. Questo tutorial della raccolta Get Started su AWS parte dalla configurazione e dall'infrastruttura create nei tutorial precedenti della raccolta.

### 3.12.1 — Rimuovere una risorsa

Per rimuovere l'istanza EC2 dalla configurazione si commenta il blocco della risorsa `aws_instance.app_server` in `main.tf`:

```
/*
resource "aws_instance" "app_server" {
  ami           = data.aws_ami.ubuntu.id
  instance_type = var.instance_type

  vpc_security_group_ids = [module.vpc.default_security_group_id]
  subnet_id              = module.vpc.private_subnets[0]

  tags = {
    Name = var.instance_name
  }
}
*/
```

Il valore di output `instance_hostname` in `outputs.tf` fa riferimento all'istanza EC2 rimossa da `main.tf`. Bisogna quindi commentare anche quell'output, altrimenti la configurazione non è valida:

```
/*
output "instance_hostname" {
  description = "Private DNS name of the EC2 instance."
  value = aws_instance.app_server.private_dns
}
*/
```

Si applica la modifica con `terraform apply`. Il piano di Terraform distrugge l'istanza e rimuove il valore di output, e lo si approva rispondendo `yes`.

### 3.12.2 — Distruggere il workspace

Rimuovere singole risorse da un workspace è una parte normale del workflow di gestione dell'infrastruttura. Quando nessuna risorsa del workspace serve più, la si distrugge tutta con Terraform. Succede ad esempio quando si ritira dal servizio un ambiente applicativo, o quando si usa Terraform per ambienti di breve durata, come i sistemi di build o di test. Si distrugge il workspace con `terraform destroy`, approvando con `yes` il piano che rimuove le risorse.

A questo punto si è usato Terraform per creare, gestire e distruggere l'infrastruttura. Il tutorial successivo della raccolta usa HCP Terraform per conservare lo state ed eseguire le operazioni di Terraform in remoto, ed è tradotto nel Modulo 8.

- Fonte: [Destroy infrastructure](https://developer.hashicorp.com/terraform/tutorials/aws-get-started/aws-destroy)

---

## 3.13 — Il grafo delle dipendenze

Questa pagina spiega il grafo delle dipendenze che Terraform costruisce a partire dalle configurazioni. È un argomento avanzato, non necessario per capire come usare Terraform.

### 3.13.1 — Introduzione

Terraform costruisce un grafo delle dipendenze e lo usa per eseguire operazioni come generare i piani e aggiornare (refresh) lo state. Per un'introduzione alla teoria dei grafi e a come Terraform la applica, la documentazione rimanda alla presentazione HashiCorp del 2016 *Applying Graph Theory to Infrastructure as Code*.

### 3.13.2 — I nodi del grafo

Nel grafo possono esistere questi tipi di nodi:

- **Resource node**: rappresenta una singola risorsa. Se è impostato il meta-parametro `count`, c'è un resource node per ogni elemento del count. Al nodo sono associati la configurazione, il diff, lo state e gli altri dati della risorsa in fase di modifica.
- **Provider configuration node**: rappresenta il momento in cui un provider viene configurato del tutto, cioè quando il provider riceve il suo blocco di configurazione, ad esempio con le credenziali di sicurezza AWS.
- **Resource meta-node**: rappresenta un gruppo di risorse, ma da solo non corrisponde a nessuna azione. Esiste per comodità nella gestione delle dipendenze e per rendere il grafo più leggibile. È presente solo per le risorse con un parametro `count` maggiore di 1.

Visualizzando una configurazione con `terraform graph`, si vedono tutti questi tipi di nodi.

### 3.13.3 — Costruire il grafo

Il grafo si costruisce in una serie di passi sequenziali:

1. Si aggiungono i resource node in base alla configurazione. Se sono presenti un diff (piano) o uno state, i relativi metadati vengono associati a ogni resource node.
2. Si associano le risorse ai provisioner, se ne hanno. Questo passo viene dopo la creazione di tutti i resource node, così le risorse con lo stesso tipo di provisioner possono condividerne l'implementazione.
3. Si usano le dipendenze esplicite del meta-parametro `depends_on` per creare archi tra le risorse.
4. Se è presente uno state, si aggiungono al grafo le risorse "orfane", cioè le risorse non più presenti nella configurazione ma ancora presenti nel file di state. Le risorse orfane non hanno mai una configurazione associata, perché il file di state non conserva la configurazione.
5. Si associano le risorse ai provider. Per questi provider si creano i provider configuration node, con archi che rendono ogni risorsa dipendente dalla configurazione del proprio provider.
6. Si analizzano le interpolazioni nelle configurazioni delle risorse e dei provider per trovare le dipendenze. Ogni riferimento all'attributo di un'altra risorsa diventa una dipendenza dalla risorsa referenziata.
7. Si crea un nodo radice, che punta a tutte le risorse e garantisce che il grafo abbia un'unica radice. Durante l'attraversamento del grafo il nodo radice viene ignorato.
8. Se è presente un diff, si cercano tra tutti i resource node le risorse da distruggere. Ognuno di questi nodi viene diviso in due: un nodo che distrugge la risorsa e un altro che la crea, se viene ricreata. La divisione serve perché l'ordine di distruzione è spesso diverso dall'ordine di creazione, e un unico nodo non può rappresentarli entrambi.
9. Si verifica che il grafo non contenga cicli e abbia un'unica radice.

### 3.13.4 — Percorrere il grafo

Il grafo si percorre con un normale attraversamento in profondità (depth-first). L'attraversamento avviene in parallelo: un nodo viene elaborato non appena sono state elaborate tutte le sue dipendenze.

Un semaforo limita il parallelismo, perché troppe operazioni simultanee non sovraccarichino la macchina su cui gira Terraform. Per default vengono elaborati contemporaneamente fino a 10 nodi del grafo. Il numero si imposta con l'opzione `-parallelism` dei comandi plan, apply e destroy.

Impostare `-parallelism` è un'operazione avanzata, che nell'uso normale di Terraform non dovrebbe servire. Può essere utile in alcuni casi particolari o per fare il debug di problemi di Terraform.

Alcuni provider, come AWS, gestiscono i limiti di frequenza delle API (rate limiting) a un livello più basso. I loro client API riprovano le richieste con attese crescenti (backoff/retry). Per questo Terraform non usa il parallelismo per gestire direttamente i limiti di frequenza delle API.

- Fonte: [Dependency graph](https://developer.hashicorp.com/terraform/internals/v1.12.x/graph)
