# Modulo 2 — Fondamenti di Terraform

_Provider, versioni, uso di più provider e gestione dello state: i mattoni su cui si regge ogni configurazione Terraform._

---

## 2.1 — Installare e gestire le versioni dei provider

### 2.1.1 — Che cosa sono i provider

I **provider** sono plugin che permettono a Terraform di dialogare con le API di una piattaforma (AWS, Azure, Google Cloud, Kubernetes, GitHub, ecc.). Terraform core non conosce alcuna piattaforma: legge la configurazione, costruisce il grafo e delega ai provider la creazione, lettura, modifica ed eliminazione delle risorse.

- Ogni provider espone **resource type** (es. `aws_instance`) e **data source**.
- I provider sono distribuiti da un registry (di default il **Terraform Registry**) con indirizzo del tipo `registry.terraform.io/hashicorp/aws`.
- Sono tre i livelli di tier: **Official** (HashiCorp), **Partner** (verificati) e **Community**.

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

**Operatori dei vincoli di versione** _(stepTitle)_

| **Operatore** | **Significato** | **Esempio** |
|---|---|---|
| `=` (o nessuno) | Versione esatta | `= 1.2.0` |
| `!=` | Esclude una versione | `!= 1.2.0` |
| `>`, `>=`, `<`, `<=` | Confronti | `>= 1.2.0` |
| `~>` | Incremento solo dell'ultima cifra indicata (*pessimistic constraint*) | `~> 1.2.0` ammette 1.2.x; `~> 1.2` ammette 1.x con x ≥ 2 |

### 2.1.3 — Il blocco provider e la configurazione

Il blocco `provider` configura il provider (regione, credenziali, subscription...). Va nel modulo root, non nei moduli figli riutilizzabili.

```
provider "azurerm" {
  features {}
  subscription_id = var.subscription_id
}
```

> **Sicurezza**: non inserire credenziali in chiaro nel codice. Usare variabili d'ambiente (`ARM_CLIENT_ID`, `AWS_ACCESS_KEY_ID`...), identità gestite, OIDC/dynamic credentials o un secret manager.
_(infoBox)_

### 2.1.4 — Il dependency lock file

`terraform init` scarica i provider e scrive il file **`.terraform.lock.hcl`**, che registra la versione esatta selezionata e gli **hash** dei pacchetti. Ciò garantisce che tutti (colleghi, CI/CD) usino gli stessi provider.

- Il lock file **va committato** in Git.
- Per aggiornare i provider entro i vincoli: `terraform init -upgrade`.
- Per aggiungere gli hash per altre piattaforme: `terraform providers lock -platform=linux_amd64 -platform=windows_amd64`.
- Il lock file riguarda i **provider**, non i moduli.

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

### 2.2.2 — Ciclo di vita del provider

- **Download**: durante `terraform init`, dal registry o da una sorgente alternativa (mirror, filesystem).
- **Configurazione**: all'avvio di plan/apply il provider riceve la propria configurazione.
- **Esecuzione**: il core invia le operazioni sulle risorse (CRUD).
- I provider vengono salvati in `.terraform/providers/` (cartella locale, da non committare).

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

- **Mappare** il codice alle risorse reali (ID remoti).
- **Tracciare i metadati**, come le dipendenze, per eliminare risorse nell'ordine giusto.
- **Migliorare le prestazioni**: evitare di interrogare ogni risorsa a ogni operazione (cache degli attributi).
- **Collaborare**: con un backend remoto lo state è condiviso dal team.

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
