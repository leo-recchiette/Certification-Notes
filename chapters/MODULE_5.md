# Modulo 5 — Moduli Terraform

_Come Terraform ottiene i moduli, lo scope delle variabili, l'uso dei moduli in configurazione e la gestione delle versioni._

---

## 5.1 — Che cos'è un modulo e da dove proviene

### 5.1.1 — Definizione

Un **modulo** è un contenitore di risorse Terraform usate insieme: una directory con uno o più file `.tf`. Ogni configurazione ha almeno il **root module** (la directory in cui si esegue Terraform); i moduli richiamati da altri moduli sono detti **child module**.

**Perché usarli** _(stepTitle)_

- **Riuso**: scrivere una volta, usare più volte.
- **Astrazione**: nasconde la complessità dietro un'interfaccia (variabili e output).
- **Coerenza** e best practice condivise.
- **Organizzazione** del codice.

### 5.1.2 — Sorgenti (source) dei moduli

![Figura 9](img/registry-module-vpc.png) _(dimensioni: 2360×1170 px)_

*Figura 9 — Pagina di un modulo nel Terraform Registry, con le istruzioni di utilizzo e la versione. Fonte: HashiCorp Developer.* _(caption)_

| **Sorgente** | **Esempio** |
|---|---|
| **Percorso locale** | `source = "./modules/network"` |
| **Terraform Registry (pubblico)** | `source = "terraform-aws-modules/vpc/aws"` |
| **Registry privato** (HCP Terraform) | `source = "app.terraform.io/ORG/vpc/aws"` |
| **GitHub** | `source = "github.com/org/repo"` |
| **Git generico** | `source = "git::https://example.com/repo.git?ref=v1.2.0"` |
| **Bucket S3 / GCS** | `source = "s3::https://s3.amazonaws.com/bucket/vpc.zip"` |
| **HTTP/HTTPS** | URL di un archivio |
| **Mercurial** | `hg::...` |

> **Solo per il Registry**: l'argomento `version` è supportato **soltanto** per moduli del registry (pubblico o privato). Per i moduli locali o Git la versione si seleziona con il percorso o con `?ref=`.
_(infoBox)_

I moduli vengono scaricati da `terraform init` (o `terraform get`) nella cartella `.terraform/modules/`.

---

## 5.2 — Scope delle variabili nei moduli

### 5.2.1 — Isolamento

Un modulo ha uno **scope isolato**: non vede le variabili, le risorse o i local del chiamante. L'unico canale di comunicazione è:

- **Verso il modulo**: le **input variable** (argomenti del blocco `module`).
- **Dal modulo**: gli **output** (`module.NOME.OUTPUT`).

```
# modules/network/variables.tf
variable "cidr" {
  type = string
}

# modules/network/outputs.tf
output "vnet_id" {
  value = azurerm_virtual_network.main.id
}
```

```
# root main.tf
module "network" {
  source = "./modules/network"
  cidr   = "10.0.0.0/16"
}

resource "azurerm_subnet" "app" {
  virtual_network_name = module.network.vnet_name
  # ...
}
```

- Le risorse interne a un modulo **non sono accessibili** dal chiamante, a meno di un output esplicito.
- I local value e i data source di un modulo sono privati.

---

## 5.3 — Usare i moduli nella configurazione

### 5.3.1 — Il blocco module

```
module "vpc" {
  source  = "terraform-aws-modules/vpc/aws"
  version = "~> 5.0"

  name = "demo"
  cidr = "10.0.0.0/16"
}
```

Argomenti riservati del blocco `module`: `source`, `version`, `count`, `for_each`, `providers`, `depends_on`.

- **count / for_each** su un modulo creano più istanze del modulo stesso.
- **providers** passa provider (anche con alias) al modulo.
- Dopo aver aggiunto o modificato un `module`, occorre `terraform init` per scaricarlo.

### 5.3.2 — Struttura standard di un modulo

```
modulo/
├── main.tf          # risorse principali
├── variables.tf     # input
├── outputs.tf       # output
├── versions.tf      # required_providers e required_version
├── README.md        # documentazione
└── examples/        # esempi d'uso
```

### 5.3.3 — Provider nei moduli

- I moduli **riutilizzabili** non dovrebbero contenere blocchi `provider`: dichiarano solo `required_providers` e ereditano la configurazione dal chiamante.
- Con provider con alias si usa `configuration_aliases` nel modulo e `providers = {...}` nel chiamante.
- Un modulo con un proprio blocco `provider` non è compatibile con `count`/`for_each`/`depends_on`.

### 5.3.4 — Best practice di composizione

- Moduli **piccoli e focalizzati** su un solo scopo.
- Preferire una **struttura piatta** di moduli a gerarchie profonde.
- Esporre solo le variabili utili e dare buoni valori di default.
- Passare le dipendenze come variabili (inversione di controllo) anziché hardcodarle.
- Documentare input e output e versionare con tag Git/semver.

---

## 5.4 — Gestire le versioni dei moduli

### 5.4.1 — Vincoli di versione

Per i moduli del registry si usa l'argomento `version` con gli stessi operatori dei provider (`=`, `>=`, `~>`...).

```
module "vpc" {
  source  = "terraform-aws-modules/vpc/aws"
  version = "5.1.2"
}
```

- Senza `version`, Terraform scarica **l'ultima disponibile**: sconsigliato in produzione.
- Fissare la versione (o un range `~>`) rende la build riproducibile.
- Per aggiornare i moduli entro i vincoli: `terraform init -upgrade`.
- Per Git, la versione si fissa con `?ref=v1.2.0` (tag, branch o commit).
- Il lock file `.terraform.lock.hcl` **non** registra i moduli, solo i provider.

**Link di riferimento** _(stepTitle)_

- [Panoramica moduli](https://developer.hashicorp.com/terraform/language/modules) · [Usare moduli del registry](https://developer.hashicorp.com/terraform/registry/modules/use)
- [Blocco module](https://developer.hashicorp.com/terraform/language/v1.12.x/block/module)
- [Composizione dei moduli](https://developer.hashicorp.com/terraform/language/v1.12.x/modules/develop/composition)
