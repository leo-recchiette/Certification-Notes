# Fondamenti di Terraform

_Questo obiettivo tratta i fondamenti dei provider Terraform, incluso come dichiarare, configurare e usare più provider in un'unica configurazione. I provider sono i plugin che permettono a Terraform di interagire con piattaforme diverse (AWS, Azure, GCP, ecc.) e servizi. Capire come funzionano i provider è essenziale per scrivere configurazioni Terraform efficaci e gestire l'infrastruttura su più cloud._

## Installare e versionare i provider Terraform

*Fonti: [Terraform Providers](https://developer.hashicorp.com/terraform/language/v1.12.x/providers), [Provider Requirement](https://developer.hashicorp.com/terraform/language/v1.12.x/providers/requirements), [Dependency Lock File](https://developer.hashicorp.com/terraform/language/v1.12.x/files/dependency-lock)*

**Panoramica dei provider: i "plugin" di Terraform** _(stepTitle)_

> *"Terraform si affida a plugin chiamati provider per interagire con cloud provider, fornitori SaaS e altre API."*

Terraform da solo non sa come creare un'istanza AWS EC2 o un bucket Google Cloud Storage. Si affida ai provider, eseguibili separati che traducono il tuo codice HCL in chiamate API per piattaforme specifiche.

Terraform è diviso in due parti: **Core** e **Provider**.

**Core vs plugin** _(stepTitle)_

Terraform Core è volutamente minimale. Sa leggere i file di configurazione (HCL), costruire un grafo delle dipendenze e gestire lo state. Ma Terraform Core non ha alcuna conoscenza integrata di AWS, Azure, Kubernetes o anche del tuo file system locale: sono i provider a fornire questa conoscenza di dominio.

**Che cos'è un provider?** _(stepTitle)_

- I provider sono versionati separatamente da Terraform Core.
- I provider sono plugin che implementano le operazioni `CRUD` di resource e data source per una piattaforma (es. hashicorp/aws).
- Formato dell'indirizzo di un provider: `registry.terraform.io/namespace/type` (es. `hashicorp/aws`). Il `source` in `required_providers` è un'abbreviazione di questo indirizzo.

Quando scrivi:

```hcl
resource "aws_instance" "web" {
  ami = "ami-12345"
}
```

Terraform Core vede la stringa `"aws_instance"`. Pensa: "Non so cosa sia. Consulto la mia rubrica per vedere chi è responsabile di `aws`."

Quella **rubrica** è il Provider Registry. E l'entità responsabile è il plugin AWS Provider.

---

### 2a.2: installazione dei provider (terraform init)

È il primo passo di qualsiasi workflow Terraform.

> Ogni configurazione Terraform che usa un `provider` deve dichiararlo. Lo si fa dentro il blocco terraform:

```hcl
terraform {
  required_version = ">= 1.12"   # Facoltativo ma consigliato
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    random = {
      source  = "hashicorp/random"
      version = "3.6.1"
    }
  }
}
```

**Concetti chiave** _(stepTitle)_

- **Local name (nome locale):** la chiave nella mappa (`aws`, `random`). È il nome che usi nei blocchi resource e provider. Ha visibilità limitata al modulo.
- **Source address (indirizzo sorgente):** la posizione completamente qualificata del provider in un registry. Formato: `[hostname/]namespace/type`.
  - `hashicorp/aws` → abbreviazione di `registry.terraform.io/hashicorp/aws`.
  - Per i provider della community: `terraform-providers/github` oppure `my-org/my-provider`.
- **Version constraint (vincolo di versione):** definisce quali versioni del provider sono accettabili. Sintassi:
  - `= 1.2.0` : esatta
  - `>= 1.2.0, < 2.0.0` : intervallo
  - `~> 5.0` : vincolo pessimistico. Permette di incrementare solo il componente di versione più a destra.
  - `~> 5.0` → qualsiasi 5.x (5.0.1, 5.1.0, 5.99.0) ma non 6.0.
  - `~> 5.0.1` → qualsiasi 5.0.x (5.0.2) ma non 5.1.

**Quando esegui terraform init:** _(stepTitle)_

- Terraform legge `required_providers`.
- Controlla il Dependency Lock File (`.terraform.lock.hcl`). Se il lock file contiene una versione selezionata che soddisfa il vincolo, usa esattamente quella versione.
- Se non c'è lock file o se usi il flag `-upgrade`, interroga il registry per l'ultima versione che soddisfa i vincoli.
- Scarica il binario del provider per il tuo sistema operativo/architettura e lo salva in `.terraform/providers/`.

Scrive o aggiorna il lock file con la versione selezionata e i checksum crittografici.

---

### 2a.3: versionamento dei provider e lock file

Il file `.terraform.lock.hcl` è fondamentale per la coerenza del team. Registra:

- La versione esatta selezionata.
- I vincoli di versione considerati.
- Un elenco di hash dei pacchetti del provider per le varie piattaforme.

**Note per l'esame** _(stepTitle)_

- Se cambi il vincolo di versione in `required_providers`, devi eseguire `terraform init -upgrade` per aggiornare il lock file.
- Un semplice `terraform init` fallirà se la versione bloccata non soddisfa più il vincolo.
- Il lock file va committato nel controllo di versione. Garantisce che ogni membro del team e ogni pipeline CI/CD usi esattamente le stesse versioni dei provider.
- **Non modificare mai il lock file a mano.** Usa sempre `terraform init -upgrade` per cambiare versione. Questo garantisce l'integrità del file ed evita errori umani.

---

### 2a.4: configurazione del provider (il blocco provider)

Dopo aver dichiarato e installato un provider, devi configurarlo. Lo si fa con uno o più blocchi `provider`:

```hcl
provider "aws" {
  region = "us-west-2"
  # Facoltativo: assume_role { ... }
}
```

> Se non specifichi un blocco `provider`, Terraform usa le variabili d'ambiente o le catene di credenziali predefinite.

Puoi definire più configurazioni dello stesso provider con il meta-argomento `alias`.

```hcl
provider "aws" {
  region = "us-east-1"
}

provider "aws" {
  alias  = "west"
  region = "us-west-2"
}

resource "aws_instance" "east" {
  # Usa il provider predefinito (senza alias)
}

resource "aws_instance" "west" {
  provider = aws.west   # Usa il provider con alias
}
```

**Vincoli importanti** _(stepTitle)_

- Le configurazioni dei provider non possono fare riferimento a resource, data source o output di altri provider. Possono usare solo variabili, local e valori statici.
- Una configurazione di provider è globale per l'intero albero dei moduli (a meno che non venga passata esplicitamente con il meta-argomento providers nei blocchi module). *Approfondimento nell'Obiettivo 5*.

---

### 2a.5: laboratorio pratico: versionamento dei provider

Obiettivo: sperimentare la selezione della versione del provider e il comportamento del lock file.

**Passo 1:** crea una nuova directory `obj2a-lab` con `main.tf`:

```hcl
terraform {
  required_version = ">= 1.12"
  required_providers {
    random = {
      source  = "hashicorp/random"
      version = "~> 3.5.0"  # Nota: intervallo di patch specifico
    }
  }
}

resource "random_pet" "demo" {}
```

**Passo 2:** esegui `terraform init`. Osserva il lock file creato. Apri `.terraform.lock.hcl` e annota la versione (es. `3.5.1`).

**Passo 3:** cambia il vincolo di versione in `"~> 3.6.0"`. Esegui `terraform init`. Fallirà perché la versione bloccata `3.5.1` non soddisfa il nuovo vincolo. Terraform ti dice di usare `-upgrade`.

**Passo 4:** esegui `terraform init -upgrade`. Ora scarica l'ultima 3.6.x e aggiorna il lock file.

**Passo 5:** elimina la directory `.terraform` e `.terraform.lock.hcl`. Esegui di nuovo `terraform init`. Scaricherà il provider e creerà un nuovo lock file con l'ultima versione che soddisfa il vincolo.

> Questo esercizio consolida il rapporto tra vincoli, lock file e flag `-upgrade`.

---

### 2a.6: Mini-quiz: installazione e versionamento dei provider

Rispondi prima di controllare le risposte qui sotto.

1. Vero/Falso: puoi definire un blocco `provider "aws"` dentro un modulo figlio per garantire che il modulo usi una regione specifica, indipendentemente dalla configurazione del modulo root.
2. Scelta multipla: cosa permette il vincolo di versione `"~> 1.2.3"`?
  - A. Qualsiasi versione maggiore di 1.2.3
  - B. Qualsiasi versione della serie 1.2.x (es. 1.2.4) ma non la 1.3.0
  - C. Qualsiasi versione della serie 1.x (es. 1.3.0) ma non la 2.0
  - D. Solo esattamente la versione 1.2.3
3. Risposta multipla: quali delle seguenti affermazioni sul file `.terraform.lock.hcl` sono vere? (Selezionane DUE)
  - A. Va aggiunto a .gitignore perché contiene percorsi specifici della piattaforma.
  - B. Registra la versione esatta e i checksum dei provider selezionati.
  - C. Può essere modificato a mano per bloccare una versione specifica del provider.
  - D. Eseguire terraform init -upgrade lo aggiorna con versioni più recenti dei provider che soddisfano i vincoli.

**Risposte e brevi spiegazioni** _(stepTitle)_

1. `Falso` — I moduli non dovrebbero dare per scontata la configurazione dei provider. La best practice è configurare i provider nel modulo root e passare le configurazioni ai moduli figli con il meta-argomento `providers`; definire blocchi provider dentro i moduli può portare a comportamenti inattesi.
2. `B` — `~> 1.2.3` permette aggiornamenti a livello di patch all'interno della 1.2 (>= 1.2.3 e < 1.3.0).
3. `B e D` — Il lock file registra le versioni esatte dei provider e i checksum (B). Eseguire `terraform init -upgrade` può aggiornare il lock file a versioni più recenti che soddisfano i vincoli (D). Va committato (non ignorato) e non va modificato a mano (quindi A e C sono false).

## Descrivere come Terraform usa i provider

*Fonti: [How Terraform works with plugins](https://developer.hashicorp.com/terraform/plugin/how-terraform-works), [Providers](https://developer.hashicorp.com/terraform/language/v1.12.x/providers), [Provider Requirements](https://developer.hashicorp.com/terraform/language/v1.12.x/providers/requirements), [Provider Block reference](https://developer.hashicorp.com/terraform/language/v1.12.x/block/provider)*

### Idee sbagliate comuni

- **I provider vengono configurati automaticamente per i moduli.** (Falso): i moduli dovrebbero dichiarare `required_providers` ma non incorporare credenziali; la configurazione del provider appartiene al modulo root e va passata verso il basso.
- **Il lock file è facoltativo per i team.** (Falso): committa `.terraform.lock.hcl` per garantire che tutti usino gli stessi binari dei provider.
- **Lo state memorizza solo gli ID delle risorse.** (Falso): lo state memorizza attributi, dipendenze e metadati; trattalo come dato sensibile.
- **I crash dei provider corrompono Terraform Core.** (Falso): i provider girano come processi separati; un errore del provider fa fallire l'operazione ma non manda in crash Terraform Core.

> Tieni presenti questi punti quando progetti i confini tra provider e moduli.

---

### 2b.1: l'architettura basata su plugin

> La guida ufficiale lo dice chiaramente: "Terraform è logicamente diviso in due parti principali: Terraform Core e Terraform Plugins."

Terraform Core è un binario compilato staticamente (la `terraform CLI`). Le sue responsabilità sono:

- Leggere e interpolare i file di configurazione (HCL).
- Gestire il Resource Graph (grafo delle dipendenze).
- Eseguire il plan (determinare la differenza tra stato desiderato e stato reale).
- Comunicare con i plugin tramite Remote Procedure Call (RPC).

### L'architettura a plugin (RPC sul filo)

Terraform Core comunica con i provider usando *gRPC* (Remote Procedure Call). Girano come processi separati.

**Perché?** _(stepTitle)_

Se un AWS Provider va in crash, non trascina giù Terraform Core. Inoltre permette di scrivere i provider in qualsiasi linguaggio (per lo più Go) e di aggiornarli indipendentemente da Terraform Core.

I plugin di Terraform (provider e provisioner) sono binari eseguibili separati. Terraform Core li individua, li esegue come processi separati e comunica con loro tramite un'interfaccia RPC.

**Nota importante** _(stepTitle)_

- I provider non sono inclusi in Terraform Core. Vengono scaricati durante terraform init.
- Un crash del provider non manda in crash Terraform Core (restituisce un errore, ma il processo sopravvive).
- Questa architettura permette il versionamento indipendente dei provider. Puoi aggiornare il provider AWS senza aggiornare Terraform Core.

---

### 2b.2: responsabilità dei provider

Le responsabilità principali dei plugin provider sono:

- Inizializzare le eventuali librerie incluse usate per effettuare chiamate API
- Autenticarsi con il fornitore dell'infrastruttura
- Definire managed resource e data source che corrispondono a servizi specifici
- Definire funzioni che abilitano o semplificano la logica di calcolo nelle configurazioni degli utenti

**Nel dettaglio:** _(stepTitle)_

- Autenticazione: il provider si occupa di recuperare le credenziali (da variabili d'ambiente, file di configurazione condivisi o dal blocco provider) e di autenticarsi con l'API del cloud.
- Mappatura delle risorse: il provider traduce le definizioni delle resource HCL in chiamate API. Per `aws_instance`, il provider sa come chiamare l'API AWS EC2 `RunInstances`.
- Data source: i provider implementano anche operazioni di sola lettura. `data "aws_ami" "latest"` usa il provider AWS per chiamare l'API `DescribeImages` ma non crea nulla.
- Funzioni: alcuni provider espongono funzioni personalizzate. Per esempio, il provider `terraform` ha `provider::terraform::encode_tfvars()`.

---

### 2b.3: individuazione e selezione dei provider

Quando viene eseguito `terraform init`, Terraform:

1. Legge i file di configurazione per determinare quali provider sono richiesti (blocco required_providers).
2. Cerca i provider installati in diverse posizioni (cache locale dei plugin, .terraform/providers/, ecc.).
3. Confronta i vincoli di versione della configurazione con le versioni installate.
4. Seleziona la versione installata più recente che soddisfa il vincolo.
5. Se non è installata alcuna versione accettabile e il provider è distribuito da HashiCorp (o è nel Terraform Registry), Terraform scarica la versione accettabile più recente.
6. Se non è installata alcuna versione accettabile e il provider non è nel registry, `terraform init` fallisce e l'utente deve installare il plugin manualmente.

**Nota importante** _(stepTitle)_

- Se hai più versioni installate localmente, Terraform usa la versione installata più recente che soddisfa il vincolo, anche se nel registry esiste una versione più nuova.
- Per costringere Terraform a controllare il registry per versioni più recenti, usa `terraform init -upgrade`.

---

### 2b.4: ereditarietà della configurazione dei provider

- Le configurazioni dei provider sono globali all'interno di un albero di configurazione Terraform.
- I moduli figli ereditano automaticamente le configurazioni di provider predefinite (senza alias) dal modulo padre.
- Se un modulo figlio ha bisogno di una configurazione di provider diversa (es. un'altra regione), il padre deve passarla esplicitamente con il meta-argomento providers nel blocco module. Lo vedremo in dettaglio nell'Obiettivo 5.

> **Best practice:** non includere mai un blocco provider con configurazione (come regione o credenziali) dentro un modulo figlio. Il modulo deve solo dichiarare required_providers. Questo rende il modulo riutilizzabile tra ambienti.

**Configurazione del provider** _(stepTitle)_

Installare il provider non basta. Devi configurarlo con le credenziali.

```hcl
provider "aws" {
  region = "us-west-2"
  # access_key = "..." NON METTERLA QUI
}
```

Per le credenziali: non incorporare MAI segreti nei file `.tf`. Usa variabili d'ambiente (`AWS_ACCESS_KEY_ID`), file di credenziali condivisi (`~/.aws/credentials`) o credenziali dinamiche.

---

### 2b.5: laboratorio pratico: osservare il comportamento dei provider

Useremo due alias di provider per vedere come viene selezionata la configurazione.

File: `main.tf`

```hcl
terraform {
  required_providers {
    random = {
      source  = "hashicorp/random"
      version = "3.6.0"
    }
  }
}

# Provider predefinito (senza alias)
provider "random" {}

# Provider con alias
provider "random" {
  alias = "pet_only"
}

resource "random_string" "default_example" {
  length = 4
  # Usa il provider predefinito
}

resource "random_pet" "aliased_example" {
  provider = random.pet_only   # Usa esplicitamente il provider con alias
}
```

Esegui `terraform init` e `terraform apply`.

Ora apri `terraform.tfstate` ed esamina il campo provider di ciascuna risorsa:

- `random_string.default_example` mostra: `"provider": "provider[\"registry.terraform.io/hashicorp/random\"]"`
- `random_pet.aliased_example` mostra: `"provider": "provider[\"registry.terraform.io/hashicorp/random\"].pet_only"`

> Questo dimostra che lo state traccia esattamente quale configurazione di provider ha creato la risorsa, aspetto cruciale per capire come Terraform gestisce dipendenze ed esecuzione.

---

### 2b.6: Mini-quiz: provider Terraform

Rispondi a queste domande rapide per verificare la comprensione dell'architettura dei provider e dell'ereditarietà della configurazione.

1. Vero/Falso: Terraform Core comunica con i plugin dei provider tramite gRPC/RPC.
  - Vero / Falso
2. Scelta multipla: se un modulo figlio richiede una regione del provider diversa da quella del modulo root, l'approccio consigliato è:
  - A. Definire nel modulo figlio un blocco provider con la regione impostata.
  - B. Passare un provider con alias dal modulo root al figlio usando la mappa `providers` nel blocco module.
  - C. Modificare lo state file per cambiare la regione del provider delle risorse del figlio.
3. Scelta multipla: qual è la best practice per le credenziali dei provider?
  - A. Incorporare `access_key` e `secret_key` nel blocco provider.
  - B. Usare variabili d'ambiente o file di credenziali condivisi (es. `~/.aws/credentials`).
  - C. Committare le credenziali nel repo e richiamarle con dei local.

**Risposte** _(stepTitle)_

1. VERO — Terraform Core parla con i provider tramite un protocollo RPC (simile a gRPC), che permette ai provider di girare come processi separati.
2. Passarlo tramite la mappa `providers` — il padre dovrebbe passare un provider con alias al modulo figlio per controllare regione/account; evita di configurare provider dentro i moduli.
3. Usare variabili d'ambiente o file di credenziali condivisi — non incorporare mai segreti nei file Terraform.

---

## Scrivere configurazioni Terraform che usano più provider

*Fonti: [Provider Requirements](https://developer.hashicorp.com/terraform/language/v1.12.x/providers/requirements), [Terraform block reference](https://developer.hashicorp.com/terraform/language/v1.12.x/block/provider), [Define infrastructure with terraform resources](https://developer.hashicorp.com/terraform/tutorials/configuration-language/resource).*

### 2c.1: dichiarare più provider

Il blocco `required_providers` può contenere più voci. Ogni voce riceve un **local name**.

```hcl
terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    google = {
      source  = "hashicorp/google"
      version = "~> 5.0"
    }
    cloudflare = {
      source  = "cloudflare/cloudflare"
      version = "~> 4.0"
    }
  }
}
```

**Nota importante:** il local name (`aws`, `google`, `cloudflare`) si usa in tutta la configurazione per fare riferimento a quel provider. Il `source` si usa solo durante `terraform init` per individuare il plugin.

---

### 2c.2: configurare ogni provider

Ogni provider ha bisogno del proprio blocco di configurazione (oppure si affida alle variabili d'ambiente). Non è obbligatorio configurare tutti i provider se possono autenticarsi con i metodi predefiniti.

```hcl
provider "aws" {
  region = "us-west-2"
}

provider "google" {
  project = "my-gcp-project"
  region  = "us-central1"
}
```

---

### 2c.3: riferimenti tra risorse di provider diversi

**Nota importante:** Terraform può gestire risorse di provider diversi nella stessa configurazione e fare riferimento ai loro attributi a vicenda.

Esempio: creare un bucket AWS S3 e un repository GitHub che fa riferimento al nome del bucket.

```hcl
resource "aws_s3_bucket" "logs" {
  bucket = "my-app-logs-${random_id.suffix.hex}"
}

resource "github_repository" "app" {
  name        = "my-application"
  description = "Logs are stored in ${aws_s3_bucket.logs.bucket}"
}
```

**Come lo gestisce Terraform** _(stepTitle)_

1. La resource `github_repository` contiene un'interpolazione che fa riferimento a `aws_s3_bucket.logs.bucket`.
2. Il grafo delle dipendenze di Terraform rileva questo riferimento e stabilisce una **dipendenza implicita**.
3. Durante `apply`, Terraform aspetterà che il provider AWS crei il bucket e ne restituisca gli attributi prima di chiedere al provider GitHub di creare il repository.
4. La voce `github_repository` nello state file registrerà questa dipendenza.

---

### 2c.4: gestire i conflitti di nome tra provider

La guida ufficiale di Terraform osserva che:

> A volte è però necessario usare due provider con lo stesso local name preferito nello stesso modulo... In questo caso consigliamo di combinare il namespace di ciascun provider con il suo nome di tipo, producendo local name composti separati da un trattino.

Esempio:

```hcl
terraform {
  required_providers {
    hashicorp-aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    community-aws = {
      source  = "mycompany/aws"
      version = "~> 1.0"
    }
  }
}

resource "hashicorp-aws_instance" "example" {
  # ...
}
```

Il motivo per cui è importante: senza local name univoci, Terraform non può distinguere quale provider intendi usare per un tipo di risorsa che esiste in entrambi i provider.

### 2c.5: tipi di risorsa specifici del provider

Ogni provider definisce il proprio insieme di `resource types` e `data sources`. La documentazione di un provider (disponibile nel Terraform Registry) elenca:

- Argomenti: input che puoi impostare (es. `ami`, `instance_type`).
- Attributi: output a cui puoi fare riferimento (es. `id`, `public_ip`).
- Meta-argomenti: argomenti specifici di Terraform come `depends_on`, `count`, `for_each`, `provider`.

**Nota importante** _(stepTitle)_

- Gli argomenti stanno nel blocco di configurazione (`ami = "..."`).
- Gli attributi vengono esportati e usati nelle espressioni (`aws_instance.web.public_ip`).

---

### 2c.6: laboratorio pratico: orchestrazione multi-provider

Useremo i provider `random`, `local` e `time` per simulare un workflow multi-provider.

File: `main.tf`

```hcl
terraform {
  required_providers {
    random = {
      source  = "hashicorp/random"
      version = "3.6.0"
    }
    local = {
      source  = "hashicorp/local"
      version = "2.5.0"
    }
    time = {
      source  = "hashicorp/time"
      version = "0.11.0"
    }
  }
}

resource "random_pet" "name" {}

resource "time_static" "created_at" {}

resource "local_file" "metadata" {
  content  = "Resource '${random_pet.name.id}' was provisioned at ${time_static.created_at.rfc3339}"
  filename = "${path.module}/metadata.txt"
}
```

**Osserva:** _(stepTitle)_

1. `terraform init` scarica tre provider.
2. `terraform apply` crea il nome dell'animale, registra il timestamp e scrive il file.
3. Apri `terraform.tfstate` e trova l'array dependencies di `local_file.metadata`. Elenca sia `random_pet.name` sia `time_static.created_at`.

Un altro esempio di orchestrazione tra provider è quando devi creare una risorsa in un provider che dipende da un attributo di una risorsa di un altro provider.

La vera potenza di Terraform è orchestrare servizi diversi nello stesso workflow.

Scenario d'esempio: avvii un'istanza EC2. Devi aggiungere il suo indirizzo IP a un record DNS Cloudflare.

```hcl
# Servono sia il provider AWS SIA il provider Cloudflare
terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    cloudflare = {
      source  = "cloudflare/cloudflare"
      version = "~> 4.0"
    }
  }
}

# Configurali
provider "aws" {
  region = "us-west-2"
}

provider "cloudflare" {
  api_token = var.cloudflare_token # Usa una variabile!
}

# Usali insieme
resource "aws_instance" "app" {
  ami           = "ami-abc"
  instance_type = "t2.micro"
}

resource "cloudflare_record" "app_dns" {
  zone_id = var.zone_id
  name    = "app"
  value   = aws_instance.app.public_ip   # <-- Riferimento tra provider!
  type    = "A"
  ttl     = 60
}
```

> Terraform gestisce le dipendenze automaticamente. Sa che `cloudflare_record` dipende da `aws_instance`. Creerà prima l'istanza, otterrà l'IP, poi creerà il record DNS.

---

### 2c.7: alias dei provider multi-account (laboratorio pratico)

Quando devi gestire risorse su più account cloud da un'unica configurazione, usa configurazioni di provider con alias e il meta-argomento `provider`. Così credenziali e regioni restano esplicite e si evitano operazioni accidentali sull'account sbagliato.

Crea `main.tf` con due configurazioni del provider AWS e risorse destinate a ciascun account:

```hcl
terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

# Provider per l'account A (alias: account_a)
provider "aws" {
  alias   = "account_a"
  region  = "us-east-1"
  profile = "account-a-profile"     # usa un profilo di credenziali condiviso, non chiavi incorporate
}

# Provider per l'account B (alias: account_b)
provider "aws" {
  alias   = "account_b"
  region  = "us-west-2"
  profile = "account-b-profile"
}

# Risorsa creata nell'account A
resource "aws_s3_bucket" "logs_a" {
  provider = aws.account_a
  bucket   = "myapp-logs-account-a-${random_id.suffix.hex}"
}

# Risorsa creata nell'account B
resource "aws_s3_bucket" "logs_b" {
  provider = aws.account_b
  bucket   = "myapp-logs-account-b-${random_id.suffix.hex}"
}

module "shared_vpc" {
  source = "./modules/vpc"
  # Passa il provider con alias al modulo, così le risorse interne usano account_b
  providers = {
    aws = aws.account_b
  }

  # input del modulo...
}
```

Passi del laboratorio:

1. Configura il tuo `~/.aws/credentials` con i profili `account-a-profile` e `account-b-profile`.
2. Esegui `terraform init` per scaricare i provider.
3. Esegui `terraform plan` e verifica che il piano mostri risorse per entrambi i provider.
4. Esegui `terraform apply` per creare le risorse in ciascun account.

Note:

- Evita di incorporare credenziali nei blocchi `provider`: usa `profile`, variabili d'ambiente o un helper di credenziali esterno.
- Quando scrivi moduli riutilizzabili, non configurare provider dentro i moduli; accetta invece le mappature dei provider tramite la mappa `providers` come mostrato sopra, così il modulo è riutilizzabile tra account e regioni.

---

### 2c.8: Mini-quiz: comportamento multi-provider e riferimenti tra provider

Verifica rapida sul comportamento multi-provider e sui riferimenti tra provider.

1. Vero/Falso: fare riferimento a un attributo di una risorsa gestita da un provider diverso crea una dipendenza implicita nel grafo di Terraform.
  - Vero / Falso
2. Scelta multipla: per evitare collisioni di nomi quando due provider espongono gli stessi tipi di risorsa, dovresti:
  - A. Usare local name univoci in `required_providers` (es. `hashicorp-aws`).
  - B. Rinominare le risorse per evitare collisioni.
  - C. Usare un solo provider per configurazione.
3. Risposta multipla: quali dei seguenti sono modi validi per fornire credenziali a un provider? (Selezionane DUE)
  - A. Incorporare le credenziali nel blocco provider.
  - B. Variabili d'ambiente (es. `AWS_ACCESS_KEY_ID`).
  - C. File di credenziali condiviso (es. `~/.aws/credentials`).
  - D. Fare riferimento all'attributo di una risorsa che restituisce credenziali.

**Risposte** _(stepTitle)_

1. VERO — Terraform deduce una dipendenza implicita quando interpoli un attributo di un'altra risorsa, anche se è gestita da un provider diverso.
2. Usare local name univoci in `required_providers`, così Terraform può distinguere le sorgenti dei provider quando i tipi si sovrappongono.
3. Variabili d'ambiente e file di credenziali condivisi sono metodi validi e sicuri; incorporare le credenziali e fare riferimento ad attributi di risorse per le credenziali non sono pattern consigliati/ammessi.

## Spiegare come Terraform usa e gestisce lo state

**Nota importante:** l'esame verificherà la tua comprensione del perché lo state è necessario, cosa contiene, come viene memorizzato e come funziona il locking.

*Fonti: [Purpose of Terraform State](https://developer.hashicorp.com/terraform/language/v1.12.x/state/purpose), [Manage Resources in State](https://developer.hashicorp.com/terraform/tutorials/state/state-cli)*

---

### 2d.1: perché lo state è necessario (mappatura sul mondo reale)

La sezione `Purpose of Terraform State` della documentazione è esplicita:

> *Terraform richiede una sorta di database per mappare la configurazione Terraform sul mondo reale... I primi prototipi di Terraform in effetti non avevano state file e usavano questo metodo [i tag]. Tuttavia ci siamo scontrati presto con dei problemi. Il primo grande problema era che... non tutte le risorse supportano i tag, e non tutti i cloud provider supportano i tag.*

**Il problema di fondo:** senza uno state file, Terraform non può sapere in modo affidabile quale risorsa del mondo reale corrisponde a resource `"aws_instance" "web"` nella tua configurazione.

- **Mappatura:** lo state memorizza il legame tra l'indirizzo logico della risorsa (`aws_instance.web`) e l'identificatore fisico della risorsa (`i-abc123`).
- **Univocità:** Terraform si aspetta una mappatura uno a uno. Se un oggetto remoto è legato a più istanze di risorsa, il comportamento diventa indefinito.

---

### 2d.2: metadati (dipendenze)

Lo state memorizza più dei soli ID. Memorizza le dipendenze tra risorse.

Dalla documentazione ufficiale:

> *Terraform di solito usa la configurazione per determinare l'ordine delle dipendenze. Tuttavia, quando elimini una risorsa da una configurazione Terraform, Terraform deve sapere come eliminarla dal sistema remoto... la configurazione non esiste più, quindi l'ordine non può essere determinato dalla sola configurazione.*

**Perché è cruciale?** _(stepTitle)_

- Quando rimuovi `resource "aws_security_group" "allow_ssh"` dai tuoi file `.tf`, Terraform guarda lo state per vedere quali risorse dipendevano da esso.
- Usa i metadati di dipendenza dello state per assicurarsi di eliminare le risorse dipendenti (come un'istanza EC2 che usa quel security group) prima di eliminare il security group stesso.
- Senza questi dati di dipendenza memorizzati, Terraform potrebbe provare a eliminare prima il security group, causando un errore API perché è ancora in uso.

### 2d.3: prestazioni (caching)

> *Per infrastrutture piccole, Terraform può interrogare i provider e sincronizzare gli attributi più recenti di tutte le risorse... Per infrastrutture più grandi, interrogare ogni risorsa è troppo lento.*

**Come aiuta lo state** _(stepTitle)_

- Terraform mette in cache nello state file i valori degli attributi di tutte le risorse gestite.
- Durante `plan`, Terraform usa lo state come cache. Deve solo aggiornare (verificare) che i valori in cache siano ancora attuali, invece di scandire completamente ogni risorsa.
- Il flag `-refresh=false` può saltare completamente questa verifica (utile in automazione quando sai che esternamente non è cambiato nulla), affidandosi interamente allo state in cache.

---

### 2d.4: formato e posizione dello state file

- Posizione predefinita: `terraform.tfstate` nella directory di lavoro corrente.
- Formato: JSON. Non modificarlo mai direttamente.
- Backup: `terraform.tfstate.backup` viene creato prima di ogni scrittura dello state.
- State remoto: memorizzare lo state in remoto (S3, HCP Terraform) abilita la collaborazione del team e fornisce il locking.

---

### 2d.5: state locking (cruciale per la collaborazione del team)

> *I backend sono responsabili del supporto allo state locking, se possibile. Non tutti i backend supportano il locking.*

**Che cos'è lo state locking?** _(stepTitle)_

- Quando l'utente A esegue `terraform apply`, Terraform acquisisce un lock sullo state file.
- Se l'utente B prova a eseguire `terraform apply` contemporaneamente, riceve un errore: "Error acquiring the state lock."
- Questo previene le race condition in cui due persone modificano contemporaneamente la stessa infrastruttura, corrompendo lo state.

---

### 2d.6: Mini-quiz: state locking e migrazione del backend

Verifica rapida su state, locking e migrazione del backend.

1. Vero/Falso: gli state file di Terraform cifrano sempre gli attributi sensibili di default.
  - Vero / Falso
2. Scelta multipla: quale pattern fornisce uno state locking affidabile per i backend S3?
  - A. Usare solo S3 con il versioning abilitato.
  - B. Usare S3 con una tabella DynamoDB per i lock.
  - C. Usare il backend locale su un'unità di rete condivisa.
3. Scelta multipla: per passare da un backend locale a un backend S3 e migrare lo state, quale comando è appropriato?
  - A. terraform apply
  - B. terraform init -reconfigure
  - C. terraform init -migrate-state

**Risposte** _(stepTitle)_

1. FALSO — Lo state locale è JSON in chiaro di default; i backend remoti possono offrire cifratura a riposo, ma devi trattare lo state come sensibile e proteggere le credenziali.
2. Usare S3 con una tabella DynamoDB per i lock — DynamoDB fornisce il meccanismo di locking per lo state su S3.
3. `terraform init -migrate-state` (oppure `terraform init -reconfigure` seguito dai passi di migrazione) — cambiare backend richiede init con migrazione; `apply` non migra lo state.

**Quali backend supportano il locking?** _(stepTitle)_

- Local: nessun locking (a parte i lock consultivi del file system su alcuni sistemi operativi, non affidabili per i team).
- S3 con DynamoDB: la tabella DynamoDB fornisce il lock.
- HCP Terraform / Terraform Enterprise: locking integrato.
- Consul, etcd: supportati.
- Azure Storage, GCS: supportati.

**Nota importante:** il backend `local` predefinito non fornisce un locking robusto. Per i workflow di team devi usare un backend remoto che supporti il locking.

### 2d.7: dati sensibili nello state

> *Gli state file e i plan file di Terraform contengono informazioni dettagliate sulla tua infrastruttura, inclusi attributi delle risorse e metadati che possono contenere valori sensibili... Tratta il tuo state file come dato sensibile.*

**Importantissimo:** gli state file memorizzano tutti gli attributi delle risorse in **JSON in chiaro**. Se imposti `password = "SuperSecret123"` su una risorsa database, quella password viene scritta in `terraform.tfstate`.

**Best practice per i dati sensibili nello state** _(stepTitle)_

- Usa backend remoti con cifratura a riposo (S3 SSE, HCP Terraform Vault Transit).
- Usa `sensitive = true` su variabili e output per oscurarli nell'output della CLI (ma non nello state).
- Usa valori ephemeral (Terraform 1.10+) o argomenti write-only (Terraform 1.11+) per escludere completamente i valori dallo state.

---

### 2d.8: configurazione del backend (blocco backend)

Il blocco `backend` configura dove viene memorizzato lo state.

```hcl
terraform {
  backend "s3" {
    bucket         = "my-terraform-state"
    key            = "prod/network/terraform.tfstate"
    region         = "us-east-1"
    dynamodb_table = "terraform-locks"
    encrypt        = true
  }
}
```

**Vincoli critici (dalla documentazione)** _(stepTitle)_

- Una configurazione può avere un solo blocco `backend`.
- Il blocco `backend` non può usare variabili, local o riferimenti a risorse. Deve essere scritto in modo statico oppure usare la configurazione parziale con `-backend-config`.
- Cambiare la configurazione del backend richiede `terraform init -reconfigure` oppure `-migrate-state`.

---

### 2d.9: blocco cloud vs. blocco backend

Il riferimento del blocco terraform chiarisce:

> *Non puoi configurare un blocco backend quando la configurazione contiene anche una configurazione cloud per la memorizzazione dei dati di state.*

- Blocco `backend`: configura la memorizzazione remota dello state per qualsiasi backend supportato (S3, GCS, ecc.).
- Blocco `cloud`: un modo semplificato per collegare una configurazione direttamente a HCP Terraform o Terraform Enterprise. Gestisce sia la memorizzazione dello state sia le operazioni remote. È il metodo preferito per gli utenti di HCP Terraform (Obiettivo 8).

---

### 2d.10: laboratorio pratico: ispezionare lo state file e il comportamento del backend remoto

Useremo due provider locali (local e random) per simulare una configurazione multi-provider e ispezionare manualmente lo state file per vedere come Terraform traccia le dipendenze.

**Passo 1: creare la configurazione main.tf** _(stepTitle)_

```hcl
# Laboratorio Obiettivo 2: provider e state

terraform {
  required_version = ">= 1.12"
  required_providers {
    random = {
      source  = "hashicorp/random"
      version = "3.6.0"
    }
    local = {
      source  = "hashicorp/local"
      version = "2.5.0"
    }
  }
}

# Configurazioni dei provider (per questi provider locali non servono, ma le definiamo comunque)
provider "random" {}
provider "local" {}

# Risorsa 1: genera un nome di animale casuale (simula un ID dinamico di un cloud provider)
resource "random_pet" "server_name" {
  length    = 2
  separator = "-"
}

# Risorsa 2: scrive il nome casuale in un file (simula una risorsa dipendente)
resource "local_file" "inventory" {
  content  = "Server name is: ${random_pet.server_name.id}"
  filename = "${path.module}/inventory.txt"
}

# Restituisce il nome in output così possiamo vederlo
output "pet_name" {
  value = random_pet.server_name.id
}
```

**Passo 2: eseguire terraform init** _(stepTitle)_

- Osserva l'output. Scarica due provider (`random` e `local`).
- Nota che viene creato il lock file (`.terraform.lock.hcl`).

**Passo 3: eseguire terraform apply** _(stepTitle)_

Digita `yes`. Ora hai un file `inventory.txt` con dentro un nome di animale casuale (es. Server name is: `happy-panda`).

**Passo 4: l'autopsia dello state file** _(stepTitle)_

Apri il file `terraform.tfstate` in VS Code. Non modificarlo. Leggilo e basta.

Trova la seguente struttura JSON (potrebbe essere formattata diversamente, ma i campi chiave sono gli stessi):

```hcl
{
  "version": 4,
  "terraform_version": "1.12.x",
  "serial": 1,
  "lineage": "...",
  "outputs": { ... },
  "resources": [
    {
      "mode": "managed",
      "type": "random_pet",
      "name": "server_name",
      "provider": "provider[\"registry.terraform.io/hashicorp/random\"]",
      "instances": [
        {
          "schema_version": 0,
          "attributes": {
            "id": "happy-panda",
            "length": 2,
            "separator": "-"
          },
          "dependencies": [] // Nessuna dipendenza
        }
      ]
    },
    {
      "mode": "managed",
      "type": "local_file",
      "name": "inventory",
      "provider": "provider[\"registry.terraform.io/hashicorp/local\"]",
      "instances": [
        {
          "attributes": {
            "content": "Server name is: happy-panda",
            "filename": "./inventory.txt"
          },
          "dependencies": [
            "random_pet.server_name"
          ]
        }
      ]
    }
  ]
}
```

**Cosa ti insegna per l'esame** _(stepTitle)_

1. **terraform_version:** la versione esatta usata per scrivere questo state. Se provi a usare una versione di Terraform più vecchia, otterrai un errore.
2. **serial:** un numero monotonicamente crescente. Ogni apply lo incrementa. Viene usato dallo state locking per rilevare se qualcun altro ha aggiornato lo state dopo il tuo ultimo pull.
3. **provider:** indirizzo completamente qualificato. Corrisponde al source in required_providers.
4. **dependencies:** Terraform ha dedotto che local_file.inventory dipende da random_pet.server_name a causa dell'interpolazione ${random_pet.server_name.id}.
5. **lineage:** un identificatore univoco per questo state file. Viene usato quando si migra lo state tra backend per garantire la continuità.

**Passo 5: simulare un disallineamento di versione del provider** _(stepTitle)_

Cambia la versione in required_providers in:

```hcl
random = {
  source  = "hashicorp/random"
  version = "3.1.0"  # Downgrade!
}
```

Esegui `terraform init -upgrade`. Terraform scaricherà la versione più vecchia. Esegui `terraform plan`. Potresti ottenere un errore se lo state è stato creato con uno schema più recente.

> Questo dimostra perché vincoli di versione e lock file sono fondamentali per la coerenza del team.

## Quiz

Ora che abbiamo trattato tutto in profondità, ecco 15 domande aggiuntive in stile esame su questi sotto-obiettivi. Rispondi per verificare la tua comprensione.

**Istruzioni:** annota le tue risposte, apri la sezione Risposte e confrontale con le spiegazioni.

**Domanda 1 (Vero/Falso)** _(stepTitle)_

Un plugin provider può essere scritto in qualsiasi linguaggio di programmazione perché Terraform Core comunica con esso tramite un'interfaccia standard gRPC/RPC, a patto che il binario del plugin rispetti il protocollo.

- Vero / Falso

**Domanda 2 (Vero/Falso)** _(stepTitle)_

Se un modulo non definisce un blocco `required_providers`, Terraform presumerà che tutti i provider richiesti siano disponibili globalmente e non tenterà di scaricarli.

- Vero / Falso

**Domanda 3 (scelta multipla)** _(stepTitle)_

Durante `terraform init`, Terraform rileva che la versione 3.5.1 del provider `random` è già installata localmente (in `.terraform/providers`), ma il vincolo di versione della configurazione è `~> 3.6.0`. Il Terraform Registry ha disponibile la versione 3.6.3. Cosa fa Terraform?

- A. Scarica automaticamente la versione 3.6.3 perché è la più recente.
- B. Usa la versione installata 3.5.1 perché è già presente.
- C. Fallisce con un errore che indica che la versione installata non corrisponde al vincolo.
- D. Chiede all'utente di scegliere quale versione usare.

**Domanda 4 (scelta multipla)** _(stepTitle)_

Devi gestire risorse in due account AWS diversi dalla stessa configurazione Terraform. Qual è l'approccio corretto?

- A. Definire due blocchi `terraform` separati, ciascuno con il proprio `required_providers`.
- B. Definire un unico blocco provider "aws" e usare l'argomento account_id in ogni risorsa.
- C. Definire due blocchi provider "aws" con valori alias diversi e usare il meta-argomento provider nelle risorse per selezionare quello appropriato.
- D. Usare il comando terraform workspace per passare da un account all'altro.

**Domanda 5 (scelta multipla)** _(stepTitle)_

Qual è il motivo principale per cui gli state file di Terraform non vanno modificati a mano?

- A. Il formato JSON è cifrato e non può essere letto dagli esseri umani.
- B. Le modifiche manuali possono rompere la mappatura uno a uno tra risorse e oggetti reali, portando a risorse orfane o a una pianificazione errata.
- C. Modificare lo state file richiede una licenza a pagamento.
- D. Lo state file viene rigenerato automaticamente a ogni terraform plan, quindi le modifiche vanno perse.

**Domanda 6 (risposta multipla)** _(stepTitle)_

Quali dei seguenti backend supportano nativamente lo state locking per impedire modifiche concorrenti? **(Selezionane TRE)**

- A. local (predefinito)
- B. s3 (se configurato con una tabella DynamoDB)
- C. gcs
- D. http
- E. azurerm
- F. consul

**Domanda 7 (Vero/Falso)** _(stepTitle)_

Quando si usa un backend remoto (es. S3), il comando `terraform state pull` recupera lo state direttamente dal file di cache locale `.terraform/terraform.tfstate`, non dalla posizione remota.

- Vero / Falso

**Domanda 8 (scelta multipla)** _(stepTitle)_

Considera il seguente frammento di configurazione:

```hcl
data "aws_ami" "ubuntu" {
  most_recent = true
  owners      = ["099720109477"]
}
resource "aws_instance" "web" {
  ami           = data.aws_ami.ubuntu.id
  instance_type = "t2.micro"
}
```

Come garantisce Terraform che la risorsa `aws_instance.web` venga creata dopo che il data source `aws_ami` è stato interrogato?

- A. L'utente deve aggiungere esplicitamente depends_on = [data.aws_ami.ubuntu].
- B. Il provider AWS serializza internamente tutte le chiamate API.
- C. Il grafo delle dipendenze di Terraform rileva il riferimento `data.aws_ami.ubuntu.id` e stabilisce una dipendenza implicita.
- D. I data source vengono sempre valutati durante `terraform apply`, mai durante `terraform plan`.

**Domanda 9 (risposta multipla)** _(stepTitle)_

Quando rimuovi un blocco `resource` dalla configurazione Terraform ed esegui `terraform apply`, come fa Terraform a conoscere l'ordine corretto per distruggere le risorse dipendenti rimanenti? (**Selezionane DUE**)

- A. Rivaluta l'intera configurazione per determinare l'ordine inverso di creazione.
- B. Legge i metadati delle dipendenze memorizzati nello state file per la risorsa da rimuovere.
- C. Usa il meta-argomento depends_on del file di configurazione.
- D. Si affida all'API del cloud provider per imporre automaticamente l'ordine di eliminazione.
- E. Chiede all'utente di specificare interattivamente l'ordine di eliminazione.

**Domanda 10 (Vero/Falso)** _(stepTitle)_

Il file `terraform.tfstate.backup` viene creato automaticamente solo quando si usa un backend remoto; il backend locale non genera backup.

- Vero / Falso

**Domanda 11 (scelta multipla)** _(stepTitle)_

Un ingegnere junior committa per errore il file `terraform.tfstate` in un repository GitHub pubblico. Qual è l'azione di sicurezza più immediata e critica da intraprendere?

- A. Eliminare la cronologia dei commit con git filter-branch.
- B. Eseguire immediatamente `terraform destroy` per smantellare tutta l'infrastruttura.
- C. Ruotare tutti i segreti e le credenziali memorizzati nello state file, perché ora sono esposti.
- D. Aggiungere *.tfstate a .gitignore per i commit futuri.

**Domanda 12 (risposta multipla)** _(stepTitle)_

Quali dei seguenti sono modi validi per fornire credenziali a un provider in Terraform? (**Selezionane TRE**)

- A. Incorporare access_key e secret_key direttamente nel blocco provider.
- B. Impostare variabili d'ambiente (es. AWS_ACCESS_KEY_ID).
- C. Usare un file di credenziali condiviso (es. ~/.aws/credentials).
- D. Fare riferimento all'attributo di una risorsa che restituisce le credenziali.
- E. Usare credenziali dinamiche del provider con OIDC (HCP Terraform).

**Domanda 13 (scelta multipla)** _(stepTitle)_

Qual è lo scopo del campo `lineage` in uno state file di Terraform?

- A. Traccia l'utente che ha applicato per ultimo la configurazione.
- B. È un identificatore univoco assegnato quando lo state viene creato, usato per evitare di applicare per errore uno state di una configurazione diversa.
- C. Indica la versione di Terraform che ha generato lo state.
- D. Memorizza il checksum dei file di configurazione.

**Domanda 14 (Vero/Falso)** _(stepTitle)_

Puoi cambiare il backend di una configurazione Terraform da `local` a `s3` semplicemente modificando il blocco `backend` ed eseguendo `terraform apply`. Terraform migrerà automaticamente lo state.

- Vero / Falso

**Domanda 15 (scelta multipla)** _(stepTitle)_

Una configurazione Terraform dichiara un blocco `cloud`. Cosa succede se provi a definire anche un blocco `backend` nella stessa configurazione?

- A. Il blocco backend ha la precedenza per la memorizzazione dello state e il blocco cloud viene ignorato.
- B. Il blocco cloud ha la precedenza e il blocco backend viene ignorato.
- C. Terraform genera un errore durante `terraform init` perché i due blocchi si escludono a vicenda.
- D. Sono ammessi entrambi; il blocco cloud gestisce le operazioni remote e il blocco backend la memorizzazione dello state.

### Risposte

**Risposte e brevi spiegazioni** _(stepTitle)_

**D1: VERO** — Terraform Core comunica con i plugin provider tramite gRPC, un protocollo RPC indipendente dal linguaggio. Questo permette di scrivere i provider in Go, Python o qualsiasi linguaggio, a patto che implementino il protocollo dei plugin.

**D2: FALSO** — Se un modulo non definisce `required_providers`, non ha automaticamente accesso ai provider. I moduli figli devono dichiarare il proprio `required_providers` oppure ereditare le configurazioni dei provider tramite il meta-argomento `providers` dal modulo padre.

**D3: C** — Terraform fallirà con un errore perché la versione bloccata 3.5.1 non soddisfa il vincolo `~> 3.6.0` (che richiede >= 3.6.0 e < 3.7.0). Per risolvere, l'utente deve eseguire `terraform init -upgrade` per scaricare una versione compatibile dal registry.

**D4: C** — Definisci due blocchi `provider "aws"` con valori `alias` diversi (es. `alias = "account_a"` e `alias = "account_b"`), poi usa il meta-argomento `provider` nelle risorse per specificare quale configurazione usare. È il pattern standard per la gestione multi-account.

**D5: B** — Le modifiche manuali rompono la mappatura uno a uno tra indirizzi delle risorse e ID reali, creando potenzialmente risorse orfane, risorse duplicate o risorse che Terraform non riesce più a gestire. Lo state file non è cifrato di default; le modifiche sono possibili ma pericolose.

**D6: B, C, E** (oppure B, C, F) — **S3 con DynamoDB** (B), **GCS** (C) e **Azure Storage** (E) supportano nativamente lo state locking. Lo supporta anche Consul (F). Il backend locale non offre un locking robusto per i workflow di team, e il backend http lo supporta solo se si configurano esplicitamente gli endpoint di lock (`lock_address`/`unlock_address`).

**D7: FALSO** — Il comando `terraform state pull` recupera lo state direttamente dal backend remoto configurato (S3, HCP Terraform, ecc.), non da una cache locale. Ignora qualsiasi cache locale nella directory `.terraform/` e scarica lo state autorevole.

**D8: C** — Il grafo delle dipendenze di Terraform rileva automaticamente il riferimento di interpolazione `data.aws_ami.ubuntu.id` nel blocco della risorsa. Deduce una dipendenza implicita senza richiedere una dichiarazione esplicita `depends_on`.

**D9: A, B** — Quando una risorsa viene eliminata dalla configurazione, Terraform non può determinare l'ordine di eliminazione dalla sola configurazione (la risorsa non esiste più nel codice). Invece, rivaluta le risorse rimanenti per determinare l'ordine inverso di creazione E legge i metadati delle dipendenze nello state file per capire quali risorse dipendevano dalla risorsa eliminata.

La sezione "Purpose of Terraform State" della documentazione spiega:

> *Quando elimini una risorsa da una configurazione Terraform, Terraform deve sapere come eliminare quella risorsa dal sistema remoto. Terraform può vedere che nello state file esiste una mappatura per una risorsa non presente nella configurazione e pianificarne la distruzione. Tuttavia, poiché la configurazione non esiste più, l'ordine non può essere determinato dalla sola configurazione. Per garantire un funzionamento corretto, Terraform conserva nello state una copia dell'insieme di dipendenze più recente.*

**D10: FALSO** — È il contrario: `terraform.tfstate.backup` è prodotto dal backend local, che lo crea prima di ogni scrittura dello state e permette il ripristino se una scrittura si corrompe a metà operazione. Con i backend remoti la storia delle versioni è gestita dal backend stesso (es. versioning S3, state versions di HCP Terraform).

**D11: C** — L'azione critica più immediata è ruotare tutti i segreti, le credenziali e i dati sensibili memorizzati nello state file, perché ora sono esposti in un repository pubblico. Solo dopo la rotazione dovresti pensare a ripulire la cronologia git o ad aggiungere regole a .gitignore.

**D12: B, C, E** — I metodi validi per le credenziali sono **(B) variabili d'ambiente** (es. `AWS_ACCESS_KEY_ID`), **(C) file di credenziali condivisi** (es. `~/.aws/credentials`) e **(E) credenziali dinamiche del provider con OIDC** (HCP Terraform). Incorporarle (A) è un anti-pattern di sicurezza. Fare riferimento ad attributi di risorse (D) nei blocchi provider non è consentito perché i blocchi provider vengono valutati prima che le risorse siano create.

**D13: B** — Il campo `lineage` è un UUID univoco assegnato quando lo state file viene creato per la prima volta. Impedisce di applicare per errore uno state file di un'infrastruttura o configurazione diversa, proteggendo da corruzione dello state o contaminazioni accidentali negli ambienti di team.

**D14: FALSO** — Modificare il blocco backend ed eseguire `terraform apply` NON migra lo state. Devi eseguire `terraform init -reconfigure` per aggiornare la configurazione del backend, oppure `terraform init -migrate-state` per migrare lo state dal vecchio backend al nuovo. Il comando `apply` non gestisce i cambi di backend.

**D15: C** — Terraform genera un errore durante `terraform init` se nella stessa configurazione sono presenti sia un blocco `cloud` sia un blocco `backend`. Si escludono a vicenda perché `cloud` è un'astrazione semplificata per HCP Terraform che include memorizzazione dello state e operazioni remote, mentre `backend` serve per la memorizzazione generica dello state.

---

**Lo state, eh?** _(stepTitle)_

Sì, lo state è un concetto fondamentale che spesso confonde i principianti (anch'io ero così). Capire come Terraform usa lo state per mappare la tua configurazione sulle risorse reali è essenziale sia per l'esame sia per l'uso pratico.

Com'è andato il quiz? Se hai sbagliato qualche domanda, rivedi le spiegazioni e torna sulle sezioni pertinenti della documentazione per consolidare la comprensione.

Hai completato l'Obiettivo 2. Ora dovresti avere una comprensione profonda di come funzionano i provider, di come Terraform gestisce lo state e di come usare più provider in un'unica configurazione. Queste conoscenze sono fondamentali per l'esame e per l'uso reale di Terraform.

Passiamo all'Obiettivo 3: workflow principali di Terraform, dove tratteremo i workflow fondamentali di Terraform.
