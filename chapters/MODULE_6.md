# Modulo 6 — Gestione dello state

_Backend locale e remoti, state locking, configurazione di remote state, gestione del drift e refactoring dello state._

---

## 6.1 — Il backend locale

### 6.1.1 — Che cos'è un backend

Il **backend** definisce *dove* Terraform memorizza lo state e *come* vengono eseguite le operazioni. Si configura nel blocco `terraform` con un blocco `backend`.

- **Backend locale** (default): lo state è nel file `terraform.tfstate` della directory di lavoro.
- Si può personalizzare il percorso:

```
terraform {
  backend "local" {
    path = "relative/path/to/terraform.tfstate"
  }
}
```

**Limiti del backend locale** _(stepTitle)_

- Non è adatto al lavoro in team (niente condivisione, niente locking centralizzato).
- Il file in chiaro può contenere segreti e può andare perso.
- Con workspace multipli salva in `terraform.tfstate.d/NOME/`.

---

## 6.2 — State locking

### 6.2.1 — Perché serve

Il **locking** impedisce che due operazioni scrivano contemporaneamente lo stesso state (rischio di corruzione). Quando un'operazione che può modificare lo state parte, Terraform acquisisce un lock; le altre falliscono con un errore finché non viene rilasciato.

- Il locking avviene **automaticamente** per tutte le operazioni che scrivono lo state, se il backend lo supporta.
- Il backend locale usa un lock sul file; molti backend remoti hanno un meccanismo proprio (es. `use_lockfile` per S3, lease su Azure Blob, DynamoDB nelle versioni precedenti).
- `-lock=false` disattiva il lock (sconsigliato); `-lock-timeout=DURATION` attende il rilascio.
- Se un lock rimane bloccato (processo interrotto): `terraform force-unlock LOCK_ID`, con estrema cautela.

---

## 6.3 — Configurare lo state remoto

### 6.3.1 — Backend remoti

Un backend remoto permette di conservare lo state in un luogo condiviso, con cifratura, versioning e controllo degli accessi.

| **Backend** | **Note** |
|---|---|
| `s3` | AWS S3, con locking (`use_lockfile` o tabella DynamoDB) |
| `azurerm` | Azure Storage (blob), lock tramite lease |
| `gcs` | Google Cloud Storage |
| `cloud` / `remote` | HCP Terraform / Terraform Enterprise |
| `http`, `consul`, `pg`, `kubernetes` | Altri backend |

```
terraform {
  backend "azurerm" {
    resource_group_name  = "rg-tfstate"
    storage_account_name = "sttfstate001"
    container_name       = "tfstate"
    key                  = "prod.terraform.tfstate"
  }
}
```

### 6.3.2 — Regole del blocco backend

- Può esserci **un solo** blocco `backend` per configurazione.
- **Non può usare variabili o riferimenti**: solo valori letterali. I parametri variabili si passano con `-backend-config` (file o coppie chiave=valore) in `terraform init`.
- Non inserire credenziali nel blocco: usare variabili d'ambiente o identità.
- Dopo aver aggiunto o cambiato backend si esegue `terraform init` (con `-migrate-state` per trasferire lo state esistente).

### 6.3.3 — Condividere lo state: terraform_remote_state

Il data source `terraform_remote_state` legge gli **output** del root module di un'altra configurazione.

```
data "terraform_remote_state" "network" {
  backend = "azurerm"
  config = {
    resource_group_name  = "rg-tfstate"
    storage_account_name = "sttfstate001"
    container_name       = "tfstate"
    key                  = "network.tfstate"
  }
}

# uso
subnet_id = data.terraform_remote_state.network.outputs.subnet_id
```

> **Attenzione**: si possono leggere solo gli **output** del root module e serve accesso all'intero state. In HCP Terraform si può usare l'opzione di condivisione mirata tra workspace.
_(infoBox)_

---

## 6.4 — Drift e gestione dello state

### 6.4.1 — Resource drift

Il **drift** è la divergenza tra l'infrastruttura reale e lo state/configurazione, tipicamente causata da modifiche manuali fuori da Terraform. Terraform lo rileva nel `plan` tramite il **refresh**.

**Modalità refresh-only** _(stepTitle)_

- `terraform plan -refresh-only` / `terraform apply -refresh-only` aggiornano **solo lo state** con la realtà, senza toccare l'infrastruttura.
- Sostituisce il vecchio comando `terraform refresh` (deprecato perché scriveva lo state senza conferma).

**Come risolvere il drift** _(stepTitle)_

1. **Accettare** la modifica esterna: si aggiorna la configurazione e/o si esegue un apply refresh-only.
2. **Annullare** la modifica esterna: si esegue `terraform apply` per riportare l'infrastruttura alla configurazione.

### 6.4.2 — Comandi terraform state

| **Comando** | **Funzione** |
|---|---|
| `terraform state list` | Elenca le risorse nello state |
| `terraform state show ADDR` | Mostra gli attributi di una risorsa |
| `terraform state mv SRC DEST` | Sposta/rinomina una risorsa nello state |
| `terraform state rm ADDR` | Rimuove una risorsa dallo state senza distruggerla |
| `terraform state pull` / `push` | Scarica / carica lo state |
| `terraform state replace-provider` | Cambia il provider associato alle risorse |

### 6.4.3 — Refactoring: moved e removed

Con la configurazione dichiarativa si può evitare l'uso manuale di `state mv` / `state rm` e rendere il refactoring **ripetibile e revisionabile**.

**Blocco moved** _(stepTitle)_

```
moved {
  from = aws_instance.web
  to   = aws_instance.app
}
```

Indica a Terraform che una risorsa è stata rinominata (o spostata in un modulo): aggiorna l'indirizzo nello state **senza distruggere e ricreare** la risorsa.

**Blocco removed** _(stepTitle)_

```
removed {
  from = aws_instance.old

  lifecycle {
    destroy = false
  }
}
```

Toglie una risorsa dalla gestione Terraform. Con `destroy = false` la risorsa **resta nell'infrastruttura reale** ma esce dallo state; con `destroy = true` (default) viene distrutta.

| **Esigenza** | **Strumento** |
|---|---|
| Rinominare o spostare una risorsa | `moved` (oppure `terraform state mv`) |
| Smettere di gestire senza distruggere | `removed` con `destroy = false` (oppure `terraform state rm`) |
| Forzare la ricreazione | `terraform apply -replace=ADDR` |
| Allineare lo state alla realtà | `apply -refresh-only` |

**Link di riferimento** _(stepTitle)_

- [State](https://developer.hashicorp.com/terraform/language/v1.12.x/state) · [Backend](https://developer.hashicorp.com/terraform/language/v1.12.x/backend) · [Locking](https://developer.hashicorp.com/terraform/language/v1.12.x/state/locking)
- [Refactoring](https://developer.hashicorp.com/terraform/language/v1.12.x/state/refactor) · [moved](https://developer.hashicorp.com/terraform/language/v1.12.x/block/moved) · [removed](https://developer.hashicorp.com/terraform/language/v1.12.x/block/removed)
- [Gestire il drift (tutorial)](https://developer.hashicorp.com/terraform/tutorials/state/resource-drift) · [Refresh-only (tutorial)](https://developer.hashicorp.com/terraform/tutorials/state/refresh)
