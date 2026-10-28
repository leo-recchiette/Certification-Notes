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

**Formati da ricordare** _(stepTitle)_

- Registry pubblico: `<NAMESPACE>/<NAME>/<PROVIDER>`, ad esempio `hashicorp/consul/aws`.
- Registry privato: `<HOSTNAME>/<NAMESPACE>/<NAME>/<PROVIDER>`, cioè lo stesso formato con l'hostname davanti (es. `app.terraform.io/my-org/vpc/aws`).
- **Sottodirectory**: `//` separa il repository dal percorso interno, ad esempio `git::https://example.com/network.git//modules/vpc?ref=v1.2.0`.
- **Revisione Git**: `?ref=` accetta tag, branch o lo SHA di un commit.
- **Shallow clone**: `?depth=1` scarica solo l'ultimo commit, utile con repository grandi.
- Nel Registry il filtro **Partner** mostra i moduli revisionati da HashiCorp. Le versioni dei moduli seguono il **semantic versioning**.

I moduli vengono scaricati da `terraform init` (o `terraform get`) nella cartella `.terraform/modules/`. I moduli locali non vengono copiati: Terraform li legge direttamente dal percorso.

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
output "vnet_name" {
  value = azurerm_virtual_network.main.name
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
- Le variabili del modulo **senza `default`** diventano argomenti **obbligatori** del blocco `module`; quelle con default sono facoltative.
- Il flusso è sempre esplicito: per usare una variabile del root module dentro un modulo figlio bisogna passarla come argomento (`cidr = var.cidr`). Allo stesso modo un modulo legge l'output di un altro solo tramite il root (`subnet_id = module.network.subnet_id`).

| **Costrutto** | **Ambito** | **Analogia** |
|---|---|---|
| `variable` | Input del modulo | Parametri di una funzione |
| `locals` | Interno al modulo | Variabili locali di una funzione |
| `output` | Valore restituito al chiamante | Valore di ritorno di una funzione |

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

- **count / for_each** su un modulo creano più istanze del modulo stesso (`module.app[0]`, `module.app["eu"]`).
- **providers** passa provider (anche con alias) al modulo.
- **depends_on** fa dipendere l'intero modulo da altri oggetti.
- Dopo aver aggiunto un `module`, o cambiato `source` o `version`, occorre `terraform init` (con `-upgrade` per aggiornare un modulo già installato).

**Operazioni comuni sui moduli** _(stepTitle)_

| **Esigenza** | **Come** |
|---|---|
| Ricreare una risorsa di un modulo | `terraform apply -replace='module.example.aws_instance.example'` (si può ripetere per più istanze) |
| Spostare risorse dal root a un modulo senza ricrearle | Blocco `moved` (Modulo 6) |
| Togliere un modulo senza distruggerne le risorse | Blocco `removed` con `from = module.example` e `destroy = false` (1.7+) |

### 5.3.2 — Struttura standard di un modulo

```
modulo/
├── main.tf          # risorse principali
├── variables.tf     # input
├── outputs.tf       # output
├── versions.tf      # required_providers e required_version
├── README.md        # documentazione
├── LICENSE          # licenza (importante per i moduli pubblicati)
├── modules/         # eventuali moduli annidati
└── examples/        # esempi d'uso
```

Solo `main.tf`, `variables.tf` e `outputs.tf` sono la struttura minima consigliata; gli altri file sono raccomandati, soprattutto per i moduli da pubblicare. Il Registry usa il `README.md` e la descrizione di variabili e output per generare la documentazione del modulo.

### 5.3.3 — Provider nei moduli

- I moduli **riutilizzabili** non dovrebbero contenere blocchi `provider`: dichiarano solo `required_providers` (con la versione **minima**, `>=`) e ricevono la configurazione dal chiamante.
- **Ereditarietà implicita**: un modulo figlio eredita le configurazioni **default** (senza alias) dei provider del genitore.
- **Passaggio esplicito**: le configurazioni con alias vanno passate con `providers`. Nel modulo si dichiarano con `configuration_aliases`.
- Un modulo legacy con un proprio blocco `provider` non è compatibile con `count`, `for_each` e `depends_on`.

```
# nel modulo
terraform {
  required_providers {
    aws = {
      source                = "hashicorp/aws"
      version               = ">= 5.0"
      configuration_aliases = [aws.dst]
    }
  }
}

# nel chiamante
module "replica" {
  source = "./modules/replica"
  providers = {
    aws     = aws
    aws.dst = aws.us
  }
}
```

### 5.3.4 — Best practice di composizione

La documentazione raccomanda di tenere l'albero dei moduli **piatto**: un solo livello di moduli figli, collegati tra loro nel root module tramite espressioni. Questo stile si chiama **module composition**.

| **Principio** | **Significato** |
|---|---|
| **Dependency inversion** | Il modulo riceve gli oggetti di cui ha bisogno (es. gli ID di VPC e subnet) come variabili, invece di crearli al proprio interno. Il root decide come collegare i moduli |
| **Conditional creation** | Se un oggetto esiste già in alcuni ambienti e va creato in altri, il modulo lo riceve come input, invece di decidere da solo se crearlo |
| **Assumptions and guarantees** | Le assunzioni sugli input si esprimono con validation e precondition, le garanzie sugli output con postcondition |
| **Multi-cloud abstractions** | Moduli con la stessa interfaccia ma implementazioni per cloud diversi (es. un modulo DNS per ogni provider) |
| **Data-only modules** | Moduli che non creano risorse ma leggono dati esistenti tramite data source e li espongono come output |

- Moduli **piccoli e focalizzati** su un solo scopo; esporre solo le variabili utili con default sensati.
- Documentare input e output e versionare con tag Git e semantic versioning.

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
- Il lock file `.terraform.lock.hcl` **non** registra i moduli, solo i provider: a ogni `init` Terraform sceglie la versione più recente che rispetta il vincolo. Per una build sempre identica serve un vincolo di versione **esatto**.
- Rieseguire `init` senza `-upgrade` non cambia i moduli già installati.

**Link di riferimento** _(stepTitle)_

- [Panoramica moduli](https://developer.hashicorp.com/terraform/language/modules) · [Usare moduli del registry](https://developer.hashicorp.com/terraform/registry/modules/use)
- [Blocco module](https://developer.hashicorp.com/terraform/language/v1.12.x/block/module)
- [Composizione dei moduli](https://developer.hashicorp.com/terraform/language/v1.12.x/modules/develop/composition)
