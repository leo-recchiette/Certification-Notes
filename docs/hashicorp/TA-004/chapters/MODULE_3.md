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

![](img/manually-pasted-plan-output.png) _(dimensioni: 790×733 px)_

*Una pull request in cui l'autore ha incollato a mano l'output del plan di Terraform. Fonte: HashiCorp Developer.* _(caption)_

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

![](img/pull-request.png) _(dimensioni: 1586×1254 px)_

*Una pull request con le modifiche alle risorse riportate nell'aggiornamento di stato del check di HCP Terraform. Fonte: HashiCorp Developer.* _(caption)_

Per certi tipi di modifiche questa informazione è tutto ciò che serve a un collega per approvare la pull request. Quando invece serve una revisione completa del plan, il link a HCP Terraform apre una vista che permette di analizzarne rapidamente tutti i dettagli. Da questa pagina il revisore capisce in fretta se il plan corrisponde all'intento dell'autore e può valutare il rischio della modifica.

![](img/pr-plan.png) _(dimensioni: 2086×2362 px)_

*Il run della pull request in HCP Terraform, con i dettagli del plan. Fonte: HashiCorp Developer.* _(caption)_

**Apply** _(stepTitle)_

Dopo il merge, HCP Terraform presenta al team il plan concreto da rivedere e approvare, e il team può discutere le domande ancora aperte prima che la modifica venga applicata.

![](img/concrete-plan.png) _(dimensioni: 2001×2005 px)_

*Il plan concreto dopo il merge, in attesa di revisione e conferma in HCP Terraform. Fonte: HashiCorp Developer.* _(caption)_

![](img/plan-comments.png) _(dimensioni: 2001×2005 px)_

*Lo scambio di commenti sul run in HCP Terraform prima della conferma. Fonte: HashiCorp Developer.* _(caption)_

Una volta confermato l'apply, HCP Terraform ne mostra l'avanzamento in tempo reale a chiunque voglia seguirlo.

![](img/in-progress-apply.png) _(dimensioni: 2003×1969 px)_

*Un apply in corso in HCP Terraform. Fonte: HashiCorp Developer.* _(caption)_

### 3.1.4 — Conclusioni

Ci sono molti modi diversi di usare Terraform: da singolo utente, come singolo team o come intera organizzazione su larga scala. Scegliere l'approccio più adatto al grado di collaborazione necessario permette di ottenere il massimo ritorno dall'investimento nel core workflow di Terraform. Per le organizzazioni che usano Terraform su larga scala, HCP Terraform aggiunge nuovi livelli costruiti su questo core workflow, che risolvono i problemi tipici di team e organizzazioni.

- Fonte: [Core Terraform workflow overview](https://developer.hashicorp.com/terraform/intro/v1.12.x/core-workflow)

---

## 3.2 — Creare l'infrastruttura

In questo tutorial della raccolta Get Started su AWS si crea un'istanza EC2: si scrive la configurazione, si impostano le credenziali AWS, si inizializza il workspace e si applica la configurazione.

I file di configurazione sono file di testo in HCL con estensione `.tf`. Terraform carica tutti quelli della directory corrente e ne risolve le dipendenze, quindi la configurazione si può dividere in più file in qualsiasi ordine. È organizzata in blocchi che configurano Terraform stesso, i provider, le risorse e i data source.

### 3.2.1 — Il blocco terraform

Il blocco `terraform {}` indica i provider da installare e la versione di Terraform; HashiCorp consiglia di metterlo in un file dedicato, `terraform.tf`:

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

I provider sono distribuiti e versionati separatamente da Terraform (vedi §2.3). In `required_providers` (vedi §2.7) `hashicorp/aws` è la forma breve di `registry.terraform.io/hashicorp/aws`; `~> 5.92` ammette qualsiasi versione 5.x con minor ≥ 92, e senza vincolo Terraform userebbe la più recente. `required_version = ">= 1.2"` richiede Terraform 1.2 o successivo; la versione in uso si vede con `terraform -version`.

### 3.2.2 — I blocchi di configurazione

In `main.tf`, dove la best practice è mettere provider e infrastruttura principale:

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

**Provider** _(stepTitle)_

Il blocco `provider` configura le opzioni comuni a tutte le risorse del provider, come la region; la sua etichetta corrisponde al nome in `required_providers` (vedi §2.9). Il provider AWS usa gli stessi metodi di autenticazione della AWS CLI: nel tutorial si impostano le variabili d'ambiente `AWS_ACCESS_KEY_ID` e `AWS_SECRET_ACCESS_KEY` e le si verifica con `aws configure list`.

**Data source** _(stepTitle)_

Il blocco `data` interroga il provider: qui recupera l'AMI Ubuntu più recente che corrisponde al filtro, evitando un ID scritto a mano che diventerebbe obsoleto. Il suo ID è `data.aws_ami.ubuntu`, cioè il prefisso `data` seguito da tipo e nome (vedi §4.5).

**Risorse** _(stepTitle)_

Il blocco `resource` definisce un componente dell'infrastruttura, con tipi e argomenti stabiliti dal provider. Il prefisso del tipo `aws_instance` è il nome del provider, e tipo e nome formano l'indirizzo `aws_instance.app_server`, usato per fare riferimento alla risorsa (vedi §4.3). `ami` fa riferimento all'attributo `id` del data source, `instance_type` imposta `t2.micro` (free tier) e `tags` il nome dell'istanza.

### 3.2.3 — Formattare la configurazione

`terraform fmt` (vedi §3.5) riformatta i file: nel tutorial aggiorna `main.tf`.

### 3.2.4 — Inizializzare il workspace

`terraform init` (vedi §3.4) scarica il provider aws nella directory nascosta `.terraform` e crea il lock file `.terraform.lock.hcl`, da includere nel controllo versione (vedi §2.8).

**Validare la configurazione** _(stepTitle)_

`terraform validate` (vedi §3.6) conferma che la configurazione è valida (*Success! The configuration is valid.*); un nome di risorsa scritto male o un argomento non supportato darebbero errore.

### 3.2.5 — Creare l'infrastruttura

`terraform apply` stampa il piano e chiede conferma (vedi §3.1). L'output è simile a un diff: il `+` accanto a `resource "aws_instance" "app_server"` indica una creazione, e alcuni valori sono *known after apply*. Fino alla conferma non è stato creato nulla; si risponde `yes` e dopo qualche minuto l'istanza compare nella console EC2.

### 3.2.6 — Ispezionare lo state

L'apply scrive lo state in `terraform.tfstate`, che Terraform usa per gestire le risorse lungo il loro ciclo di vita (vedi §2.2). `terraform state list` elenca `data.aws_ami.ubuntu` e `aws_instance.app_server` (anche i data source sono registrati nello state), mentre `terraform show` stampa l'intero state. Per ogni piano Terraform confronta lo state, la configurazione e i dati dei provider.

Lo state può contenere dati sensibili, come password o chiavi, e va protetto. Per default è locale; conservarlo in HCP Terraform facilita la collaborazione e lo tiene al sicuro.

- Fonte: [Create infrastructure](https://developer.hashicorp.com/terraform/tutorials/aws-get-started/aws-create)

---

## 3.3 — Inizializzare la configurazione Terraform

`terraform init` configura il backend, installa provider e moduli e crea il lock file se manca; permette anche di cambiare backend e aggiornare provider e moduli (vedi §3.4). Nel tutorial si inizializza un workspace con un modulo locale e uno remoto, si esplora la directory `.terraform` e si aggiornano le versioni.

### 3.3.1 — La configurazione di esempio

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

Oltre a `LICENSE` e `README.md`, il repository contiene `main.tf` (risorse e data source), il modulo locale `modules/aws-ec2-instance` (un'istanza EC2), `terraform.tf` (blocco `terraform` con provider, backend e versioni) e `variables.tf`.

### 3.3.2 — Inizializzare il workspace

**Il backend** _(stepTitle)_

Senza blocchi `cloud` o `backend` Terraform usa il backend `local`. Nella variante HCP Terraform si decommenta il blocco `cloud` in `terraform.tf`, e Terraform usa HCP Terraform creando il workspace indicato:

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

**I moduli** _(stepTitle)_

Terraform riconosce il modulo locale `modules/aws-ec2-instance` e scarica dal Registry il modulo remoto `module "hello"` (`joatmon08/hello/random` 4.0.0).

> **Nota**: quando si cambia la `source` o la `version` di un modulo, bisogna reinizializzare la configurazione oppure eseguire `terraform get` per scaricare il nuovo modulo.
_(infoBox)_

**I provider e il lock file** _(stepTitle)_

Non c'è ancora un lock file, quindi Terraform scarica i provider aws e random secondo `required_providers` (vedi §2.8.2) e crea `.terraform.lock.hcl`, da includere nel commit. L'output finale ricorda di rieseguire `terraform init` se cambiano moduli o backend.

### 3.3.3 — Validare la configurazione

Con il workspace inizializzato, requisito per la validazione, `terraform validate` (vedi §3.6) risponde *Success! The configuration is valid.*

### 3.3.4 — Gli artefatti dell'inizializzazione

**Il lock file** _(stepTitle)_

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

Se le versioni del lock file non corrispondono a `required_providers`, Terraform chiede di reinizializzare con `-upgrade`.

**La directory .terraform** _(stepTitle)_

Contiene i provider e i moduli usati da validate, plan e apply.

> **Nota**: Terraform gestisce automaticamente la directory `.terraform`. Non va inclusa nel controllo versione e il suo contenuto non va modificato direttamente. Il tutorial la esplora solo per mostrare come funziona Terraform: contenuto e struttura della directory possono cambiare tra una versione di Terraform e l'altra.
_(infoBox)_

```
$ tree .terraform -L 1
.terraform
├── modules
└── providers
```

Con HCP Terraform contiene anche il file `environment`, con il nome del workspace, e `terraform.tfstate`, con un riferimento allo state remoto.

`.terraform/modules` contiene la copia locale del modulo remoto `hello` e `modules.json`, che elenca i tre moduli: root, il locale `aws-ec2-instance` e il remoto `hello`:

```
$ tree .terraform/modules
├── hello
│   ├── README.md
│   └── random.tf
└── modules.json
```

```
{
  "Modules": [
    { "Key": "", "Source": "", "Dir": "." },
    { "Key": "ec2-instance", "Source": "./modules/aws-ec2-instance", "Dir": "modules/aws-ec2-instance" },
    { "Key": "hello", "Source": "registry.terraform.io/joatmon08/hello/random", "Version": "4.0.0", "Dir": ".terraform/modules/hello" }
  ]
}
```

Il modulo locale è letto direttamente dalla sua directory, quindi le modifiche si vedono subito; quello remoto è una copia di sola lettura, aggiornata solo da `terraform init -upgrade` o `terraform get`. `.terraform/providers` conserva i provider in cache, in directory `[hostname]/[namespace]/[name]/[version]/[os_arch]`:

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

Si porta il provider random a `3.6.1` in `terraform.tf` e il modulo `hello` a `6.0.0` in `main.tf`:

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

Prima di reinizializzare, validate, plan e apply falliscono con *Module version requirements have changed*. `terraform init` scarica il nuovo modulo, ma non aggiorna il provider perché è in conflitto con il lock file: serve `-upgrade`:

```
$ terraform init -upgrade
```

`.terraform/providers` contiene ora sia la 3.6.0 sia la 3.6.1, ma Terraform usa quella registrata nel lock file:

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

`terraform validate` segnala argomenti mancanti (`some_key`, `hellos`) e non supportati, perché la nuova versione del modulo ha un'interfaccia diversa. Si sostituisce il blocco `module "hello"`, e la configurazione torna valida:

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

Il tutorial ricorda di eseguire `terraform init` quando si crea una nuova configurazione o si clona un repository, quando si aggiungono, rimuovono o cambiano di versione moduli o provider, e quando si modifica il blocco `backend` o `cloud`.

- Fonte: [Initialize Terraform configuration](https://developer.hashicorp.com/terraform/tutorials/cli/init)

---

## 3.4 — Il comando terraform init

Il comando `terraform init` inizializza una directory di lavoro che contiene file di configurazione Terraform. È il primo comando da eseguire dopo aver scritto una nuova configurazione Terraform o dopo aver clonato una configurazione esistente dal controllo versione, e si può eseguire più volte senza rischi.

### 3.4.1 — Uso

La sintassi è `terraform init [options]`. Il comando esegue diversi passi di inizializzazione per preparare la directory di lavoro corrente all'uso con Terraform. Le sezioni seguenti descrivono i singoli passi, ma nella maggior parte dei casi non serve preoccuparsene.

Le esecuzioni ripetute allineano la directory alle modifiche della configurazione: possono dare errori, ma non cancellano mai la configurazione o lo state esistenti.

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

Dopo un'installazione riuscita, Terraform scrive i provider selezionati nel dependency lock file, da includere nel controllo versione (vedi §2.8).

Il comportamento di init rispetto ai plugin si può modificare con queste opzioni:

- `-upgrade`: aggiorna tutti i plugin alla versione più recente che rispetta i vincoli, ignorando le selezioni del lock file (vedi §2.8.2).
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

Il piano di esecuzione confronta configurazione e state e propone le modifiche (vedi §3.8). Nel tutorial si crea un piano salvato, se ne esamina il contenuto JSON, lo si applica e si osserva come il piano riflette le modifiche alla configurazione.

### 3.7.1 — La configurazione di esempio

La configurazione crea un'istanza EC2 con il modulo locale `modules/aws-ec2-instance`, un nome generato da `random_pet` e il modulo `hello` (il blocco della versione 6.0.0 di §3.3.5). Le versioni dei provider sono in `terraform.tf`:

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

Si inizializza con `terraform init` (nella variante HCP Terraform dopo aver decommentato il blocco `cloud`).

### 3.7.2 — Creare un piano

Un piano si genera con `terraform plan` (con `-out` per salvarlo), `terraform apply` o `terraform destroy` (vedi §3.8, §3.10 e §3.11). Il tutorial salva il piano:

```
$ terraform plan -out "tfplan"
```

Con HCP Terraform il piano è creato in remoto e `tfplan` ne contiene solo un riferimento. Lo state è vuoto, quindi il piano crea tutte le risorse. Il file non è leggibile: `terraform show "tfplan"` lo stampa, e `-json` lo converte per l'ispezione automatica:

```
$ terraform show -json "tfplan" | jq > tfplan.json
```

> **Attenzione**: i file di piano di Terraform possono contenere dati sensibili. Un file di piano non va mai incluso nel controllo versione, né in formato binario né in formato JSON.
_(infoBox)_

### 3.7.3 — Rivedere il piano

Il piano registra la versione di Terraform (`terraform_version`) e del formato (`format_version`), così lo si applica con la stessa versione:

```
$ jq '.terraform_version, .format_version' tfplan.json
```

**La configurazione nel piano** _(stepTitle)_

`.configuration` è un'istantanea della configurazione, con le versioni dei provider del lock file per il root e per i moduli figli:

```
$ jq '.configuration.provider_config' tfplan.json
```

Contiene le risorse del modulo root e, in `module_calls`, input, output e risorse dei moduli:

```
$ jq '.configuration.root_module.resources' tfplan.json
$ jq '.configuration.root_module.module_calls' tfplan.json
```

Registra anche i riferimenti tra risorse, che servono a ordinare le operazioni: ad esempio `hellos` del modulo `hello` fa riferimento a `random_pet.instance.id`:

```
$ jq '.configuration.root_module.module_calls.hello.expressions.hellos.references' tfplan.json
```

**Le modifiche pianificate alle risorse** _(stepTitle)_

In `.resource_changes[]` ogni risorsa ha `action` (qui `create`), `before` (qui `null`), `after`, `after_unknown` (valori calcolati durante l'operazione) e `before_sensitive`/`after_sensitive` (valori da oscurare):

```
$ jq '.resource_changes[] | select( .address == "module.ec2-instance.aws_instance.main")' tfplan.json
```

**I valori pianificati** _(stepTitle)_

`planned_values` unisce state precedente e atteso in un oggetto per risorsa, con indirizzo, provider e valori degli attributi. Lo usano ad esempio la CLI di Sentinel per testare le policy e la stima dei costi di HCP Terraform:

```
$ jq '.planned_values' tfplan.json
```

### 3.7.4 — Applicare un piano salvato

Si applica con `terraform apply "tfplan"`.

> **Nota**: quando si applica un file di piano salvato, Terraform non chiede l'approvazione ma esegue subito le modifiche. Questo workflow si usa soprattutto in automazione.
_(infoBox)_

### 3.7.5 — Modificare la configurazione e creare un nuovo piano

Si aggiunge in `variables.tf` una variabile sensitive per il modulo `hello`, la si valorizza in `terraform.tfvars` (`secret_key = "TOPSECRET"`) e la si usa nel modulo:

```
variable "secret_key" {
  type        = string
  sensitive   = true
  description = "Secret key for hello module"
}
```

> **Attenzione**: i file `.tfvars` non vanno mai inclusi nel controllo versione.
_(infoBox)_

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

```
$ terraform plan -out "tfplan-input-var"
$ terraform show -json tfplan-input-var | jq > tfplan-input-var.json
```

### 3.7.6 — Rivedere il nuovo piano

Ora c'è uno state, quindi il piano contiene campi nuovi.

**Le input variable nel piano** _(stepTitle)_

Le variabili (`project_name`, `region`, `secret_key`) sono registrate nel piano con i loro valori:

```
$ jq '.variables' tfplan-input-var.json
```

> **Attenzione**: anche se la variabile è marcata come sensitive, Terraform ne conserva il valore in chiaro nel file di piano.
_(infoBox)_

Le variabili d'ambiente, invece, non finiscono nel piano: per questo sono un modo consigliato di passare credenziali.

**Lo state precedente nel piano** _(stepTitle)_

L'oggetto `prior_state` registra lo state com'era prima del plan:

```
$ jq '.prior_state' tfplan-input-var.json
```

**Le modifiche alle risorse** _(stepTitle)_

`module.hello.random_pet.server` ha ora sia `before` sia `after`; `actions` vale `["delete","create"]` e `action_reason` `"replace_because_cannot_update"`, perché la modifica a `secret_key` non si può applicare sul posto:

```
$ jq '.resource_changes[] | select( .address == "module.hello.random_pet.server")' tfplan-input-var.json
```

### 3.7.7 — Il piano di distruzione

```
$ terraform plan -destroy -out "tfplan-destroy"
$ terraform apply "tfplan-destroy"
```

Salvare un piano di distruzione permette di rivederlo prima di applicarlo; `terraform destroy` ne è la scorciatoia interattiva (vedi §3.8.3 e §3.11).

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

L'apply esegue i passi del piano con i provider e i moduli installati da init (vedi §3.10). Nel tutorial si osservano i passi dell'apply, come Terraform si riprende dagli errori e alcuni usi comuni del comando.

### 3.9.1 — La configurazione di esempio

La configurazione crea un'istanza EC2 e un bucket S3, con queste versioni dei provider in `terraform.tf`:

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

`aws_instance.main` dipende da `random_pet.instance` e dal data source `aws_ami.ubuntu`, che vengono quindi creati o letti prima; `aws_s3_bucket.example` non ha dipendenze e viene creato in parallelo. Si inizializza con `terraform init`.

### 3.9.2 — Applicare la configurazione

Senza piano salvato, `terraform apply` crea un piano e chiede l'approvazione. Poi Terraform:

1. mette un lock sullo state; se trova un lock esistente (`.terraform.tfstate.lock.info`) segnala un errore ed esce;
2. crea il piano e attende l'approvazione, salvo piano salvato (vedi §3.10.1);
3. esegue i passi del piano, in parallelo quando possibile e in sequenza dove ci sono dipendenze (vedi §3.13);
4. aggiorna lo state con il nuovo stato delle risorse;
5. rimuove il lock;
6. riporta le modifiche e gli output.

Nel tutorial crea prima `random_pet` e poi, in parallelo, le istanze che ne dipendono.

### 3.9.3 — Errori durante l'apply

In caso di errore Terraform lo riporta, aggiorna lo state con le modifiche già fatte, rimuove il lock ed esce. Non c'è rollback automatico: dopo aver risolto l'errore si riapplica la configurazione.

Per provocare un errore si aggiunge un oggetto S3, si salva il piano con `terraform plan -out "add-object"` e si elimina il bucket fuori da Terraform:

```
resource "aws_s3_object" "example" {
  bucket = aws_s3_bucket.example.bucket

  key    = "README.md"
  source = "./README.md"

  etag = filemd5("./README.md")
}
```

`terraform apply "add-object"` fallisce, perché il bucket del piano non esiste più. Le cause comuni degli errori di apply sono:

- una modifica a una risorsa fuori dal controllo di Terraform;
- errori di rete o temporanei;
- errori attesi dell'API, come un nome duplicato o un limite di risorse raggiunto;
- errori inattesi dell'API, come un errore interno del server;
- un bug del provider o di Terraform.

`terraform show` riporta ancora il bucket, perché stampa lo state senza aggiornarlo, e un piano salvato non si può applicare se le risorse sono cambiate dopo la sua creazione. Al plan successivo il refresh rileva il bucket mancante (*Objects have changed outside of Terraform*), e Terraform propone di ricreare sia il bucket sia l'oggetto. In altri casi l'errore va risolto fuori da Terraform, ad esempio chiedendo al cloud provider di alzare un limite.

### 3.9.4 — Sostituire le risorse

Per agire su singole risorse ci sono `-replace` e `-target` (vedi §3.8.4). `-replace` ricrea una risorsa non sana a configurazione invariata, con l'indirizzo ricavato da `terraform state list`:

```
$ terraform apply -replace "aws_instance.main[1]"
```

`-target` serve quando un errore lascia le risorse in uno stato non valido e bisogna applicare solo una parte della configurazione (vedi il tutorial in §4.11).

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

Se si passa un file di piano salvato, Terraform lo esegue senza chiedere conferma (vedi §3.8.1); per ispezionarlo prima si usa `terraform show`.

Con un piano salvato non si possono aggiungere planning mode o planning option. Queste opzioni influiscono solo sulla scelta delle azioni da compiere, e il file di piano contiene già il risultato finale di quella scelta.

**Opzioni di pianificazione** _(stepTitle)_

Senza un file di piano salvato, `terraform apply` supporta tutte le planning mode e le planning option di `terraform plan` (sezione 3.8):

- le planning mode, cioè `-destroy`, che crea un piano per distruggere tutti gli oggetti remoti, e `-refresh-only`, che crea un piano per aggiornare lo state di Terraform e i valori di output del modulo root;
- le planning option, come la scelta delle istanze di risorsa da sostituire (`-replace`) o l'impostazione delle input variable (`-var` e `-var-file`).

**Opzioni di apply** _(stepTitle)_

Le opzioni seguenti modificano il modo in cui il comando apply esegue l'operazione e ne riporta l'esito:

- `-auto-approve`: salta l'approvazione interattiva del piano prima dell'apply. Terraform ignora questa opzione quando si passa un file di piano salvato, perché considera il passaggio del file di piano come l'approvazione stessa.
- `-input=false`: disattiva tutte le richieste interattive di Terraform, compresa l'approvazione del piano. Terraform presume quindi per prudenza che non si voglia applicare il piano, e l'operazione fallisce. Per eseguire Terraform in un contesto non interattivo si veda *Running Terraform in Automation*.
- `-json`: abilita l'output dell'interfaccia in formato JSON leggibile da una macchina. Implica `-input=false`, quindi tutte le variabili devono avere un valore assegnato. Per usarla bisogna anche attivare `-auto-approve` o passare un piano salvato.
- `-compact-warnings`, `-lock=false`, `-lock-timeout=DURATION`, `-no-color` e `-parallelism=n` (default 10): come per `terraform plan` (vedi §3.8.5);
- `-replace=resource`: Terraform pianifica di sostituire questa istanza di risorsa invece di aggiornarla o di non fare nulla.
- tutte le planning mode e le planning option di `terraform plan`, per personalizzare il modo in cui Terraform crea il piano. Sono disponibili solo quando si esegue `terraform apply` senza un file di piano salvato.

Per le configurazioni che usano solo il backend `local`, `terraform apply` accetta anche le opzioni legacy `-state`, `-state-out` e `-backup`.

Come per init e plan, la possibilità di passare una directory al posto del file di piano è stata deprecata in v0.14 e rimossa in v0.15: al suo posto si usano `-chdir` e `TF_DATA_DIR` (vedi §3.4.8).

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

Per vedere l'effetto della distruzione senza eseguirla si crea uno speculative plan in destroy mode (vedi §3.7.7):

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

Quando nessuna risorsa del workspace serve più, ad esempio per un ambiente ritirato o di breve durata (vedi §3.11), si distrugge tutto con `terraform destroy`, approvando con `yes` il piano.

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
