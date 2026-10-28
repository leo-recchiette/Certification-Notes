# Modulo 2 — Fondamenti di Terraform

_Provider, versioni, uso di più provider e gestione dello state: i mattoni su cui si regge ogni configurazione Terraform._

---

## 2.1 — Installare e gestire le versioni dei provider

### 2.1.1 — Che cosa sono i provider

I **provider** sono plugin che permettono a Terraform di dialogare con le API di una piattaforma (AWS, Azure, Google Cloud, Kubernetes, GitHub, ecc.). Terraform core non conosce alcuna piattaforma: legge la configurazione, costruisce il grafo e delega ai provider la creazione, lettura, modifica ed eliminazione delle risorse.

- Ogni provider espone **resource type** (es. `aws_instance`) e **data source**.
- I provider sono distribuiti da un registry (di default il **Terraform Registry**) con indirizzo del tipo `registry.terraform.io/hashicorp/aws`.
- I provider sono rilasciati separatamente da Terraform e hanno numeri di versione propri.

| **Tier** | **Chi lo mantiene** |
|---|---|
| **Official** | HashiCorp (namespace `hashicorp`, più alcuni come `IBM` e `ansible`) |
| **Partner Premier** | Partner tecnologici che soddisfano requisiti aggiuntivi |
| **Partner** | Aziende terze che lo scrivono, mantengono e validano sulle proprie API (HashiCorp Technology Partner Program) |
| **Community** | Singoli maintainer o gruppi della community |
| **Archived** | Provider Official o Partner non più mantenuti |

### 2.1.2 — Dichiarare i provider richiesti

I provider richiesti si dichiarano nel blocco `terraform` con `required_providers`. Ogni provider ha un nome locale, una `source` e un vincolo di `version`.

```
terraform {
  required_version = ">= 1.9.0"

  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 4.0"
    }
    random = {
      source  = "hashicorp/random"
      version = ">= 3.5, < 4.0"
    }
  }
}
```

**Local name e source address** _(stepTitle)_

- La chiave (`azurerm`, `random`) è il **local name**: è unica nel modulo ed è il nome con cui ci si riferisce al provider in tutto il resto del codice. Conviene usare il nome *preferito* del provider, cioè il prefisso dei suoi tipi di risorsa (`aws_instance` → `aws`).
- La `source` ha la forma `[<HOSTNAME>/]<NAMESPACE>/<TYPE>`. Se l'hostname è omesso vale `registry.terraform.io`: `hashicorp/http` equivale a `registry.terraform.io/hashicorp/http` (il **fully-qualified address**).
- Se si omette `source`, Terraform assume `registry.terraform.io/hashicorp/<LOCAL NAME>`. È un comportamento di retrocompatibilità: è sempre meglio indicare la source.
- **Conflitto di nomi**: se due provider hanno lo stesso nome preferito (es. due provider `http` di namespace diversi), si usano local name composti come `hashicorp-http` e `mycorp-http`. A quel punto ogni risorsa deve indicare il meta-argomento `provider`.

**Operatori dei vincoli di versione** _(stepTitle)_

| **Operatore** | **Significato** | **Esempio** |
|---|---|---|
| `=` (o nessuno) | Versione esatta | `= 1.2.0` |
| `!=` | Esclude una versione | `!= 1.2.0` |
| `>`, `>=`, `<`, `<=` | Confronti | `>= 1.2.0` |
| `~>` | Incremento solo dell'ultima cifra indicata (*pessimistic constraint*) | `~> 1.2.0` ammette 1.2.x; `~> 1.2` ammette 1.x con x ≥ 2 |

Il vincolo `version` è facoltativo: senza, Terraform accetta qualsiasi versione. HashiCorp raccomanda di indicarlo sempre.

> **Best practice sulle versioni**: un modulo **riutilizzabile** dichiara solo la versione **minima** con cui funziona (`>= 4.0`) e non mette limiti massimi, altrimenti costringe chi lo usa ad aggiornare molti moduli insieme. Il modulo **root** (dove si esegue `terraform apply`) fissa anche il **massimo** con `~>`, per evitare aggiornamenti accidentali a versioni incompatibili.
_(infoBox)_

### 2.1.3 — Il blocco provider e la configurazione

Il blocco `provider` configura il provider (regione, credenziali, subscription...). Va nel modulo root, non nei moduli figli riutilizzabili.

```
provider "azurerm" {
  features {}
  subscription_id = var.subscription_id
}
```

- Se non si scrive un blocco `provider`, Terraform crea una configurazione **vuota di default**; se il provider ha argomenti obbligatori, dà errore.
- Gli argomenti possono usare espressioni, ma solo con valori **noti prima dell'apply** (variabili, valori letterali, data source). Non si può usare un attributo calcolato di una risorsa, come un IP assegnato in fase di creazione.
- L'argomento `version` dentro il blocco `provider` è **deprecato**: le versioni si dichiarano in `required_providers`.
- Un blocco può avere `alias` (vedi 2.3.2), ma non insieme a `version`.

> **Sicurezza**: non inserire credenziali in chiaro nel codice. Usare variabili d'ambiente (`ARM_CLIENT_ID`, `AWS_ACCESS_KEY_ID`...), identità gestite, OIDC/dynamic credentials o un secret manager.
_(infoBox)_

### 2.1.4 — Il dependency lock file

`terraform init` scarica i provider e scrive il file **`.terraform.lock.hcl`**, che registra la versione esatta selezionata e gli **hash** dei pacchetti. Ciò garantisce che tutti (colleghi, CI/CD) usino gli stessi provider.

- Il lock file appartiene alla **configurazione intera**: sta nella directory del modulo root, dove si esegue Terraform.
- Il lock file **va committato** in Git, così le modifiche alle dipendenze passano dalla code review.
- Se una versione è già registrata nel lock file, `init` la riseleziona **anche se ne esiste una più recente**. Per aggiornare entro i vincoli: `terraform init -upgrade`.
- **Checksum**: a ogni installazione Terraform verifica che il pacchetto corrisponda a uno degli hash registrati, altrimenti dà errore (approccio *trust on first use*). Gli hash `h1:` e `zh:` coprono le varie piattaforme.
- Per aggiungere gli hash per altre piattaforme (utile con i mirror): `terraform providers lock -platform=linux_amd64 -platform=windows_amd64`.
- `terraform init -lockfile=readonly` verifica gli hash senza modificare il file.
- Quando un provider non serve più, `init` lo toglie dal lock file.
- Il lock file riguarda **solo i provider**, non i moduli: per i moduli Terraform sceglie sempre la versione più recente che rispetta il vincolo.

### 2.1.5 — Versione di Terraform e blocco terraform

Il blocco `terraform` raccoglie le impostazioni dell'intera configurazione: `required_version` (versione della CLI), `required_providers`, `backend` o `cloud`, ed `experiments`. Non accetta riferimenti a variabili.

```
terraform {
  required_version = "~> 1.9"
}
```

- `required_version` vincola la **versione di Terraform** (CLI); se quella installata non rispetta il vincolo, `init`/`plan`/`apply` falliscono.
- `required_providers` vincola i **provider**; sono due vincoli indipendenti.
- Per gestire più versioni della CLI sulla stessa macchina si usano strumenti come `tfenv`; in HCP Terraform la versione si sceglie per workspace.
- Buona pratica: fissare un range (`~>`) per riprodurre i risultati e aggiornare in modo controllato (prima in un ambiente di test).
- Le versioni seguono il formato `major.minor.patch`. Le nuove minor e patch sono retrocompatibili con la configurazione scritta per le versioni precedenti.

**Versione registrata nello state** _(stepTitle)_

- Lo state registra `terraform_version` (la versione che l'ha scritto per ultima) e `version` (il formato del file).
- `terraform_version` si aggiorna quando si applica con una versione più recente; il formato cambia solo se una nuova versione lo richiede.
- Una versione di Terraform **più vecchia** che non supporta il formato dello state dà errore: prima di aggiornare Terraform conviene fare un backup dello state.

### 2.1.6 — Installazione dei provider

`terraform init` trova e installa i provider richiesti. Le sorgenti possibili sono:

| **Sorgente** | **Note** |
|---|---|
| **Terraform Registry** pubblico | Default (`registry.terraform.io`) |
| **Registry privato** | Ad esempio quello di HCP Terraform; la source include l'hostname (`app.terraform.io/ORG/nome`) |
| **Mirror** su filesystem o rete | Si configura nel blocco `provider_installation` del file di configurazione della CLI (`.terraformrc` / `terraform.rc`); `terraform providers mirror` popola un mirror locale |
| **Plugin cache** | `plugin_cache_dir` nel file di configurazione della CLI (o `TF_PLUGIN_CACHE_DIR`): evita di riscaricare gli stessi provider in ogni directory |
| `-plugin-dir=PATH` | Override occasionale: legge i plugin solo da quella cartella (utile per testare un provider in sviluppo) |

- **Built-in provider**: il provider `terraform` è integrato nel binario e non va dichiarato in `required_providers`. Il suo indirizzo è `terraform.io/builtin/terraform` e fornisce il data source `terraform_remote_state` e la risorsa `terraform_data`.
- **In-house provider**: un'organizzazione può distribuire provider propri tramite un registry privato che implementa il *provider registry protocol*, oppure tramite mirror locali.
- Se si cambiano i provider della configurazione, bisogna rieseguire `terraform init`.

---

## 2.2 — Come Terraform usa i provider

### 2.2.1 — Architettura: core e plugin

Terraform è composto da **Terraform Core** (binario CLI) e dai **provider plugin**, processi separati che comunicano con il core via RPC (gRPC).

![Figura 4](img/terraform-plugin-overview.png) _(dimensioni: 4096×728 px)_

*Figura 4 — Terraform Core comunica con i provider plugin, che a loro volta chiamano le API delle piattaforme. Fonte: HashiCorp Developer.* _(caption)_

1. Core legge la configurazione e lo state.
2. Costruisce il **grafo delle risorse** e calcola il piano.
3. Per ogni operazione chiama il provider appropriato.
4. Il provider traduce la richiesta in chiamate API verso la piattaforma e restituisce il risultato.

| **Componente** | **Responsabilità** |
|---|---|
| **Terraform Core** (binario in Go, la CLI `terraform`) | Leggere e interpolare configurazione e moduli; gestire lo state; costruire il grafo delle risorse; eseguire il piano; comunicare con i plugin via RPC |
| **Provider plugin** | Inizializzare le librerie per le chiamate API; autenticarsi verso la piattaforma; definire managed resource e data source; definire **funzioni** (provider-defined functions) |
| **Provisioner plugin** | Eseguire comandi o script su una risorsa dopo la creazione o alla distruzione |

Provider e provisioner sono tutti **plugin**: eseguibili separati invocati dal core via RPC. Alcuni provisioner sono integrati in Terraform, mentre i provider vengono scoperti e installati quando servono.

### 2.2.2 — Ciclo di vita del provider

- **Download**: durante `terraform init`, dal registry o da una sorgente alternativa (mirror, filesystem).
- **Configurazione**: all'avvio di plan/apply il provider riceve la propria configurazione.
- **Esecuzione**: il core invia le operazioni sulle risorse (CRUD).
- I provider vengono salvati in `.terraform/providers/` (cartella locale, da non committare).

**Come init sceglie la versione** _(stepTitle)_

- Se è già installata una versione accettabile, usa **la più recente installata** che rispetta il vincolo, anche se nel registry ce n'è una più nuova.
- Se non c'è nulla di installato, scarica dal registry la versione accettabile più recente e la salva in `.terraform/providers/`.
- Se il provider non è nel registry e non è installato, l'inizializzazione fallisce.
- `terraform init -upgrade` ricontrolla il registry e scarica versioni più recenti ammesse dai vincoli.

### 2.2.3 — Namespace dei tipi di risorsa

Il prefisso del tipo di risorsa identifica il provider: `aws_s3_bucket` → provider `aws`, `azurerm_resource_group` → provider `azurerm`. Per usare un provider con nome locale diverso dal prefisso occorre indicarlo esplicitamente con `provider = ...` nella risorsa.

---

## 2.3 — Configurazioni con più provider

### 2.3.1 — Più provider differenti

Una configurazione può usare liberamente provider diversi, anche di piattaforme diverse. Basta dichiararli tutti in `required_providers`.

```
resource "azurerm_resource_group" "rg" {
  name     = "rg-demo"
  location = "westeurope"
}

resource "random_string" "suffix" {
  length  = 6
  special = false
  upper   = false
}

resource "azurerm_storage_account" "sa" {
  name                     = "stdemo${random_string.suffix.result}"
  resource_group_name      = azurerm_resource_group.rg.name
  location                 = azurerm_resource_group.rg.location
  account_tier             = "Standard"
  account_replication_type = "LRS"
}
```

### 2.3.2 — Più istanze dello stesso provider: alias

Con `alias` si definiscono più configurazioni dello stesso provider (ad esempio due regioni o due account). Il provider senza alias è quello **default**.

```
provider "aws" {
  region = "eu-west-1"
}

provider "aws" {
  alias  = "us"
  region = "us-east-1"
}

resource "aws_s3_bucket" "eu" {
  bucket = "demo-eu"
}

resource "aws_s3_bucket" "us" {
  provider = aws.us
  bucket   = "demo-us"
}
```

> **Moduli e provider**: un modulo eredita il provider default del chiamante. Per passare un provider con alias al modulo si usa il meta-argomento `providers = { aws = aws.us }` nel blocco `module`.
_(infoBox)_

---

## 2.4 — Come Terraform usa e gestisce lo state

### 2.4.1 — Scopo dello state

Lo **state** è un file (di default `terraform.tfstate`, formato JSON) in cui Terraform memorizza la **mappatura** tra le risorse della configurazione e gli oggetti reali dell'infrastruttura, più i loro attributi e metadati.

**A cosa serve** _(stepTitle)_

- **Mapping to the real world**: collegare il codice alle risorse reali (ID remoti). Ogni oggetto remoto va associato a **un solo** indirizzo di risorsa.
- **Metadata**: tracciare i metadati, come le dipendenze, per eliminare le risorse nell'ordine giusto anche quando sono già sparite dalla configurazione.
- **Performance**: lo state fa da cache degli attributi. Su infrastrutture grandi si può saltare il refresh con `-refresh=false` e usare lo state come fonte.
- **Syncing**: con un backend remoto lo state è condiviso dal team, e il locking evita scritture concorrenti.

### 2.4.2 — Cose da sapere sullo state

- Non va modificato a mano: si usano i comandi `terraform state ...`.
- **Può contenere dati sensibili** in chiaro (password, chiavi): va protetto con backend cifrati e controllo degli accessi.
- Non va committato in Git.
- Dopo `terraform destroy` il file resta ma con elenco di risorse vuoto; `terraform.tfstate.backup` conserva la versione precedente.
- Il **workflow** Terraform è: *config* + *state* + *infrastruttura reale* → piano.

> **Confronto a tre vie**: in fase di plan Terraform esegue di default un **refresh** (legge l'infrastruttura reale e aggiorna lo state in memoria), poi confronta lo state con la configurazione per calcolare le differenze.
_(infoBox)_

**Link di riferimento** _(stepTitle)_

- [Come Terraform lavora con i plugin](https://developer.hashicorp.com/terraform/plugin/how-terraform-works)
- [Scopo dello state](https://developer.hashicorp.com/terraform/language/v1.12.x/state/purpose)
- [Provider](https://developer.hashicorp.com/terraform/language/v1.12.x/providers) · [Requisiti dei provider](https://developer.hashicorp.com/terraform/language/v1.12.x/providers/requirements) · [Dependency lock file](https://developer.hashicorp.com/terraform/language/v1.12.x/files/dependency-lock)
- [Blocco terraform](https://developer.hashicorp.com/terraform/language/v1.12.x/block/terraform)
