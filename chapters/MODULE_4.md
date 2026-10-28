# Modulo 4 — Configurazione Terraform

_Resource e data block, riferimenti, variabili e output, tipi complessi, espressioni e funzioni, dipendenze, validazione con custom condition e gestione dei dati sensibili._

---

## 4.1 — Blocchi resource e data

### 4.1.1 — Il blocco resource

Un blocco `resource` dichiara un oggetto di infrastruttura che Terraform **crea e gestisce**. Ha un tipo (definito dal provider), un nome locale e un corpo con gli argomenti.

```
resource "aws_instance" "web" {
  ami           = data.aws_ami.ubuntu.id
  instance_type = "t3.micro"

  tags = {
    Name = "web"
  }
}
```

- L'**indirizzo** della risorsa è `TIPO.NOME` (qui `aws_instance.web`).
- **Argomenti**: valori che si impostano. **Attributi**: valori letti (anche quelli noti solo dopo la creazione, es. `id`).
- Il tipo e il nome devono essere unici nel modulo.

### 4.1.2 — Il blocco data

Un blocco `data` definisce un **data source**: permette di **leggere** informazioni su oggetti esistenti (non gestiti da questa configurazione) o calcolate dal provider.

```
data "aws_ami" "ubuntu" {
  most_recent = true
  owners      = ["099720109477"]

  filter {
    name   = "name"
    values = ["ubuntu/images/hvm-ssd/ubuntu-jammy-22.04-amd64-server-*"]
  }
}
```

| **Aspetto** | **resource** | **data** |
|---|---|---|
| **Scopo** | Crea, aggiorna, distrugge | Solo lettura |
| **Riferimento** | `aws_instance.web.id` | `data.aws_ami.ubuntu.id` |
| **Nel piano** | `+ create` | Letto durante plan/apply (`<=`) |
| **Effetto su destroy** | Risorsa eliminata | Nessun oggetto eliminato |

### 4.1.3 — Meta-argomenti

Valgono per tutte le risorse (e, in parte, per data source e moduli):

| **Meta-argomento** | **Funzione** |
|---|---|
| `count` | Crea N istanze (indice `count.index`) |
| `for_each` | Crea un'istanza per ogni elemento di una mappa o set (`each.key`, `each.value`) |
| `depends_on` | Dipendenza esplicita |
| `provider` | Seleziona un provider con alias |
| `lifecycle` | Personalizza il ciclo di vita |

```
resource "azurerm_resource_group" "rg" {
  for_each = toset(["dev", "test"])
  name     = "rg-${each.key}"
  location = "westeurope"
}
```

> **count vs for_each**: con `count` le istanze sono indicizzate da numeri (`aws_instance.web[0]`); rimuovere un elemento in mezzo sposta gli indici e può causare ricreazioni. Con `for_each` sono indicizzate dalla chiave (`rg["dev"]`), più stabile. Non si possono usare entrambi nella stessa risorsa.
_(infoBox)_

---

## 4.2 — Riferimenti agli attributi e dipendenze tra risorse

### 4.2.1 — Named values

| **Espressione** | **Significato** |
|---|---|
| `TIPO.NOME.ATTRIBUTO` | Attributo di una risorsa |
| `data.TIPO.NOME.ATTRIBUTO` | Attributo di un data source |
| `var.NOME` | Input variable |
| `local.NOME` | Local value |
| `module.NOME.OUTPUT` | Output di un modulo |
| `path.module`, `path.root`, `path.cwd` | Percorsi del filesystem |
| `terraform.workspace` | Nome del workspace corrente |
| `each.key`, `each.value`, `count.index` | Valori di iterazione |
| `self` | Riferimento a sé stessi (provisioner, postcondition) |

### 4.2.2 — Resource addressing

Gli indirizzi di risorsa servono anche a comandi CLI (`-target`, `terraform state`, `import`):

- `aws_instance.web` — risorsa semplice
- `aws_instance.web[0]` — con count
- `azurerm_resource_group.rg["dev"]` — con for_each
- `module.network.aws_vpc.main` — dentro un modulo

### 4.2.3 — Dipendenze implicite ed esplicite

- **Implicite**: nascono quando una risorsa usa un attributo di un'altra (`subnet_id = aws_subnet.a.id`). Terraform ordina da solo.
- **Esplicite**: `depends_on = [aws_iam_role_policy.x]` per dipendenze non visibili nei riferimenti (es. effetti collaterali).

> **Usa `depends_on` il meno possibile**: forza Terraform a essere più conservativo e può rendere i piani meno precisi. Preferisci le dipendenze implicite.
_(infoBox)_

### 4.2.4 — Resource targeting

L'opzione `-target=ADDR` limita plan/apply/destroy a una risorsa e alle sue dipendenze.

```
terraform plan -target=aws_instance.web
terraform apply -target=module.network
```

- Utile in **casi eccezionali**: recupero da errori, dipendenze bloccate, modifiche urgenti.
- Non è pensato per l'uso quotidiano: lo state può risultare incoerente con la configurazione completa; Terraform stampa un warning.
- Dopo un'operazione mirata conviene eseguire un `plan` completo.

---

## 4.3 — Variabili e output

### 4.3.1 — Input variable

```
variable "region" {
  type        = string
  description = "Regione di deploy"
  default     = "westeurope"
}

variable "db_password" {
  type      = string
  sensitive = true
}
```

Argomenti del blocco: `type`, `description`, `default`, `validation`, `sensitive`, `nullable`, `ephemeral`.

**Ordine di precedenza (dal più basso al più alto)** _(stepTitle)_

1. Variabili d'ambiente `TF_VAR_nome`
2. `terraform.tfvars`
3. `terraform.tfvars.json`
4. `*.auto.tfvars` / `*.auto.tfvars.json` (ordine alfabetico)
5. Opzioni `-var` e `-var-file` da riga di comando (in ordine di apparizione)

Se una variabile non ha valore e non ha `default`, Terraform lo chiede in modo interattivo.

### 4.3.2 — Local values

```
locals {
  common_tags = {
    env   = var.env
    owner = "platform"
  }
  name_prefix = "${var.project}-${var.env}"
}
```

Si usano con `local.nome`. Servono a evitare ripetizioni; non sono configurabili dall'esterno.

### 4.3.3 — Output

```
output "vm_ip" {
  value       = azurerm_public_ip.pip.ip_address
  description = "IP pubblico della VM"
  sensitive   = false
}
```

- Gli output sono stampati dopo `apply` e consultabili con `terraform output`.
- Sono l'**interfaccia** di un modulo verso il chiamante.
- `sensitive = true` ne nasconde il valore a video (ma resta nello state).
- Sono accessibili da altre configurazioni tramite `terraform_remote_state`.

---

## 4.4 — Tipi e tipi complessi

### 4.4.1 — Tipi primitivi e complessi

| **Categoria** | **Tipi** |
|---|---|
| **Primitivi** | `string`, `number`, `bool` |
| **Collezioni** (elementi dello stesso tipo) | `list(tipo)`, `set(tipo)`, `map(tipo)` |
| **Strutturati** (elementi di tipo diverso) | `object({...})`, `tuple([...])` |
| **Speciale** | `any` (deduce il tipo) |

```
variable "servers" {
  type = map(object({
    size = string
    disk = number
    tags = optional(map(string), {})
  }))
}
```

- **list**: ordinata, accesso per indice, può avere duplicati.
- **set**: non ordinata, valori unici.
- **map**: chiavi stringa → valori dello stesso tipo.
- **object**: attributi con nomi e tipi propri; `optional()` rende un attributo facoltativo.
- **tuple**: sequenza ordinata di tipi eterogenei.
- Terraform converte automaticamente i tipi quando possibile (es. `"5"` → `5`).

---

## 4.5 — Espressioni e funzioni

### 4.5.1 — Espressioni dinamiche

**Condizionale (ternario)** _(stepTitle)_

```
instance_type = var.env == "prod" ? "m5.large" : "t3.micro"
```

**Espressioni for** _(stepTitle)_

```
upper_names = [for n in var.names : upper(n)]
by_name     = { for s in var.servers : s.name => s.ip }
```

**Splat** _(stepTitle)_

```
ids = aws_instance.web[*].id
```

**Blocchi dynamic** _(stepTitle)_

```
resource "aws_security_group" "sg" {
  name = "web"

  dynamic "ingress" {
    for_each = var.ports
    content {
      from_port   = ingress.value
      to_port     = ingress.value
      protocol    = "tcp"
      cidr_blocks = ["0.0.0.0/0"]
    }
  }
}
```

**Interpolazione e heredoc** _(stepTitle)_

```
name = "${var.project}-${var.env}"
```

### 4.5.2 — Funzioni built-in

Terraform non supporta funzioni definite dall'utente: si usano quelle integrate. Si testano in `terraform console`.

| **Categoria** | **Esempi** |
|---|---|
| **Stringhe** | `upper`, `lower`, `format`, `join`, `split`, `replace`, `trim`, `substr` |
| **Numeriche** | `min`, `max`, `ceil`, `floor`, `abs` |
| **Collezioni** | `length`, `concat`, `merge`, `lookup`, `keys`, `values`, `element`, `flatten`, `distinct`, `zipmap`, `toset`, `tolist` |
| **Encoding** | `jsonencode`, `jsondecode`, `base64encode`, `yamlencode` |
| **Filesystem** | `file`, `templatefile`, `fileexists`, `abspath` |
| **Rete** | `cidrsubnet`, `cidrhost`, `cidrnetmask` |
| **Conversione tipi** | `tostring`, `tonumber`, `tobool`, `try`, `can` |
| **Data/ora** | `timestamp`, `formatdate`, `timeadd` |
| **Hash e crypto** | `md5`, `sha256`, `uuid`, `bcrypt` |

---

## 4.6 — Lifecycle delle risorse

### 4.6.1 — Il blocco lifecycle

| **Argomento** | **Effetto** |
|---|---|
| `create_before_destroy = true` | Crea la nuova risorsa prima di distruggere la vecchia (zero downtime) |
| `prevent_destroy = true` | Fa fallire qualsiasi piano che distruggerebbe la risorsa |
| `ignore_changes = [attr, ...]` | Ignora le modifiche esterne agli attributi indicati |
| `replace_triggered_by = [...]` | Sostituisce la risorsa quando cambia un'altra |
| `precondition` / `postcondition` | Controlli prima/dopo la creazione (vedi 4.8) |

```
resource "aws_instance" "web" {
  # ...
  lifecycle {
    create_before_destroy = true
    ignore_changes        = [tags["LastScanned"]]
  }
}
```

---

## 4.7 — Definire le dipendenze nella configurazione

### 4.7.1 — Riepilogo

- Preferire dipendenze **implicite** tramite riferimenti agli attributi.
- Ricorrere a `depends_on` solo quando la dipendenza non è espressa dai dati.
- Le dipendenze formano il **grafo**; Terraform non ammette cicli (errore *Cycle*).
- I moduli possono avere `depends_on`, con la stessa cautela.

---

## 4.8 — Validazione con custom condition e check

### 4.8.1 — Validation delle variabili

```
variable "env" {
  type = string

  validation {
    condition     = contains(["dev", "test", "prod"], var.env)
    error_message = "env deve essere dev, test o prod."
  }
}
```

### 4.8.2 — Precondition e postcondition

Dentro `lifecycle` di resource e data block, o in un output (`precondition`).

```
resource "aws_instance" "web" {
  # ...
  lifecycle {
    precondition {
      condition     = data.aws_ami.ubuntu.architecture == "x86_64"
      error_message = "L'AMI deve essere x86_64."
    }
    postcondition {
      condition     = self.public_dns != ""
      error_message = "L'istanza deve avere un DNS pubblico."
    }
  }
}
```

- **precondition**: verificata **prima** della creazione/lettura.
- **postcondition**: verificata **dopo**; può riferirsi a `self`.
- Se fallisce, il plan/apply si ferma con errore.

### 4.8.3 — Check block

Il blocco `check` valida lo stato dell'infrastruttura **senza bloccare** il workflow: un fallimento genera solo un **warning**. Può contenere un data source con ambito locale (`scoped data source`).

```
check "sito_raggiungibile" {
  data "http" "home" {
    url = "https://${aws_lb.main.dns_name}"
  }

  assert {
    condition     = data.http.home.status_code == 200
    error_message = "Il sito non risponde con 200."
  }
}
```

| **Costrutto** | **Dove** | **Se fallisce** |
|---|---|---|
| `validation` | variable | Errore |
| `precondition` / `postcondition` | lifecycle, output | Errore |
| `check` | Top-level | Solo warning |

---

## 4.9 — Gestione dei dati sensibili e Vault

### 4.9.1 — Variabili e output sensibili

- `sensitive = true` su variabile/output: Terraform maschera il valore in `plan`/`apply`/`output` (mostra `(sensitive value)`).
- **Ma i valori sensibili sono salvati in chiaro nello state** (e nei piani salvati). Lo state va quindi protetto.
- Una funzione come `sensitive()` o `nonsensitive()` marca/smarca un valore.

### 4.9.2 — Ephemeral values

Le variabili/output/risorse **ephemeral** esistono solo durante l'esecuzione e **non sono scritte né nello state né nel piano**. Servono per segreti temporanei (token, password). Le risorse effimere (`ephemeral` block) e gli attributi *write-only* dei provider evitano la persistenza dei segreti.

### 4.9.3 — Best practice

- Non committare mai segreti in Git (`*.tfvars` sensibili in `.gitignore`).
- Passare i segreti tramite variabili d'ambiente (`TF_VAR_...`) o da un **secret manager**.
- Usare un backend con cifratura a riposo e accessi limitati.
- Usare credenziali **di breve durata** (dynamic credentials, OIDC).

### 4.9.4 — Integrazione con HashiCorp Vault

Il **provider Vault** permette a Terraform di leggere segreti da Vault tramite data source (es. `vault_kv_secret_v2`) o di generare **credenziali dinamiche** con scadenza (es. per database o cloud).

```
data "vault_kv_secret_v2" "db" {
  mount = "secret"
  name  = "db"
}

resource "aws_db_instance" "main" {
  # ...
  password = data.vault_kv_secret_v2.db.data["password"]
}
```

> **Attenzione**: anche i segreti letti da Vault finiscono nello state se usati in una risorsa non effimera. Vault riduce la superficie, ma non elimina la necessità di proteggere lo state.
_(infoBox)_

**Link di riferimento** _(stepTitle)_

- [Resources](https://developer.hashicorp.com/terraform/language/v1.12.x/resources) · [Data sources](https://developer.hashicorp.com/terraform/language/v1.12.x/data-sources)
- [Variabili e output](https://developer.hashicorp.com/terraform/language/v1.12.x/values) · [Type constraints](https://developer.hashicorp.com/terraform/language/v1.12.x/expressions/type-constraints)
- [Funzioni](https://developer.hashicorp.com/terraform/language/v1.12.x/functions) · [Validazione](https://developer.hashicorp.com/terraform/language/v1.12.x/validate)
- [Dati sensibili](https://developer.hashicorp.com/terraform/language/v1.12.x/manage-sensitive-data) · [Vault provider](https://registry.terraform.io/providers/hashicorp/vault/latest/docs)
