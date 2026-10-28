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

| **Argomento** | **Significato** |
|---|---|
| `path` | Percorso del file di state (default `terraform.tfstate`, relativo al root module) |
| `workspace_dir` | Percorso degli state dei workspace non di default (default `terraform.tfstate.d/`) |

- Il backend locale supporta il **locking** tramite le API del sistema operativo.
- A ogni scrittura conserva la versione precedente in `terraform.tfstate.backup`.
- Le opzioni da riga di comando `-state`, `-state-out` e `-backup` sovrascrivono i percorsi per una singola operazione. Esistono solo per retrocompatibilità.
- Un `terraform_remote_state` può leggere uno state locale con `backend = "local"` e `config = { path = "..." }`.

**Limiti del backend locale** _(stepTitle)_

- Non è adatto al lavoro in team (niente condivisione, niente locking centralizzato).
- Il file in chiaro può contenere segreti e può andare perso.
- Con workspace CLI multipli salva gli state in `terraform.tfstate.d/NOME/`.

---

## 6.2 — State locking

### 6.2.1 — Perché serve

Il **locking** impedisce che due operazioni scrivano contemporaneamente lo stesso state (rischio di corruzione). Quando un'operazione che può modificare lo state parte, Terraform acquisisce un lock; le altre falliscono con un errore finché non viene rilasciato.

- Il locking avviene **automaticamente** per tutte le operazioni che possono scrivere lo state, se il backend lo supporta, e **senza messaggi**. Terraform stampa un avviso solo se acquisire il lock richiede più tempo del previsto.
- Se il lock non si ottiene, Terraform **non procede**.
- **Non tutti i backend supportano il locking**: lo indica la documentazione di ciascun backend.
- Il backend locale usa le API di sistema; molti backend remoti hanno un meccanismo proprio (es. `use_lockfile` per S3, lease su Azure Blob, DynamoDB nelle versioni precedenti).
- `-lock=false` disattiva il lock (sconsigliato); `-lock-timeout=DURATION` attende il rilascio.

**force-unlock** _(stepTitle)_

- `terraform force-unlock LOCK_ID` sblocca manualmente lo state quando lo sblocco automatico è fallito (es. processo interrotto).
- Richiede l'**ID del lock**, che Terraform mostra quando lo sblocco fallisce e che garantisce di sbloccare il lock giusto.
- Va usato **solo per il proprio lock**: sbloccare il lock di qualcun altro può causare scritture concorrenti e corrompere lo state.

---

## 6.3 — Configurare lo state remoto

### 6.3.1 — Backend remoti

Un backend remoto permette di conservare lo state in un luogo condiviso, con cifratura, versioning e controllo degli accessi.

| **Backend** | **Note** |
|---|---|
| `s3` | AWS S3, con locking (`use_lockfile` o tabella DynamoDB) |
| `azurerm` | Azure Storage (blob), lock tramite lease |
| `gcs` | Google Cloud Storage |
| `remote` | HCP Terraform / Terraform Enterprise (legacy: oggi si usa il blocco `cloud`, che non è un backend) |
| `http`, `consul`, `pg`, `kubernetes` | Altri backend |

- I backend sono **integrati** in Terraform: non si possono aggiungere come plugin.
- Con un backend remoto Terraform tiene lo state **solo in memoria** e non lo scrive su disco. L'eccezione è un errore di scrittura sul backend: per non perdere dati lo salva in locale (`errored.tfstate`) e va poi caricato a mano con `terraform state push`.
- Tutti i comandi (`console`, `terraform state ...`) funzionano come se lo state fosse locale.

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

- Può esserci **un solo** blocco `backend` per configurazione, e non insieme a un blocco `cloud`.
- **Non può usare named value** (variabili, local, attributi di data source): solo valori letterali. Inoltre i valori del blocco `backend` non sono referenziabili nel resto della configurazione.
- Non inserire credenziali nel blocco: usare variabili d'ambiente o i file di credenziali del sistema di destinazione.

> **Dove finisce la configurazione del backend**: Terraform la salva **in chiaro** in `.terraform/terraform.tfstate` e in ogni file di piano. Se si passano credenziali con `-backend-config` o nel codice, finiscono anche lì. Per questo la cartella `.terraform/` non va mai committata e le credenziali vanno passate come variabili d'ambiente. Questo file non va confuso con lo state vero, che sta nel backend remoto.
_(infoBox)_

**Configurazione parziale** _(stepTitle)_

Si possono omettere alcuni argomenti nel blocco `backend` (configurazione *parziale*) e fornirli in `terraform init`:

| **Metodo** | **Esempio** | **Note** |
|---|---|---|
| **File** | `terraform init -backend-config=./prod.s3.tfbackend` | Il file contiene gli argomenti come attributi di primo livello; il nome consigliato è `*.<backend>.tfbackend` |
| **Coppie chiave/valore** | `terraform init -backend-config="bucket=my-state"` | Sconsigliato per i segreti: resta nella history della shell |
| **Interattivo** | `terraform init` | Terraform chiede i valori obbligatori mancanti (non quelli facoltativi) |

- Le opzioni da riga di comando sovrascrivono la configurazione nel file `.tf` e vengono applicate in ordine (l'ultima vince).
- Nella configurazione deve esserci almeno un blocco vuoto che indica il tipo, ad esempio `backend "s3" {}`.

**Cambiare o rimuovere il backend** _(stepTitle)_

- Cambiando la configurazione o il tipo di backend, Terraform rileva la modifica e chiede di rieseguire `terraform init`, proponendo di **migrare** lo state (`-migrate-state`). Con `-reconfigure` si riparte senza migrare. Con più workspace può copiarli tutti.
- Per **rimuovere** il backend si cancella il blocco e si esegue `terraform init`: Terraform propone di migrare lo state nel backend `local`.
- Prima di ogni migrazione conviene fare un **backup** manuale dello state.

### 6.3.3 — Condividere lo state: terraform_remote_state

Il data source `terraform_remote_state` legge gli **output** del root module di un'altra configurazione.

![Figura 10](img/hcp-remote-state-sharing.png) _(dimensioni: 2878×1398 px)_

*Figura 10 — Condivisione dello state remoto tra workspace in HCP Terraform. Fonte: HashiCorp Developer.* _(caption)_

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

> **Attenzione**: si possono leggere solo gli **output** del root module (non quelli dei moduli annidati, a meno che il root non li riesponga) e serve accesso all'intero state. In HCP Terraform bisogna abilitare esplicitamente la *remote state sharing* verso gli altri workspace.
_(infoBox)_

**Alternative consigliate** _(stepTitle)_

- In HCP Terraform conviene il data source **`tfe_outputs`** del provider `tfe`: legge gli output senza richiedere accesso all'intero state, quindi è più sicuro.
- Se il provider lo consente, un data source specifico (es. `aws_vpc`) interroga direttamente il cloud senza dipendere dallo state di un'altra configurazione.
- Hardcodare gli ID è sconsigliato: va aggiornato a mano a ogni modifica.

### 6.3.4 — state pull e state push

- `terraform state pull` scarica lo state remoto e lo stampa su stdout: utile per un backup (`terraform state pull > backup.tfstate`).
- `terraform state push` sovrascrive lo state remoto. È **molto pericoloso** e va usato solo per correzioni manuali.
- Terraform si protegge con due controlli: la **lineage** (ID univoco assegnato allo state alla creazione; se è diversa, si tratta di un altro state e la push viene rifiutata) e il **serial** (numero che cresce a ogni scrittura; se la destinazione ha un serial più alto, contiene modifiche più recenti e la push viene rifiutata).
- Entrambi i controlli si possono aggirare con `-force`, facendo prima un backup.

---

## 6.4 — Drift e gestione dello state

### 6.4.1 — Resource drift

Il **drift** è la divergenza tra l'infrastruttura reale e lo state/configurazione, tipicamente causata da modifiche manuali fuori da Terraform. Terraform lo rileva nel `plan` tramite il **refresh**.

**Modalità refresh-only** _(stepTitle)_

- `terraform plan -refresh-only` / `terraform apply -refresh-only` aggiornano **solo lo state** con la realtà, senza toccare l'infrastruttura.
- Sostituisce il vecchio comando `terraform refresh` (deprecato perché scriveva lo state senza conferma).

- Un plan refresh-only mostra cosa è cambiato fuori da Terraform; l'apply refresh-only (con conferma) scrive quelle modifiche nello state e aggiorna gli output.
- Il refresh avviene comunque in ogni `plan` e `apply` normale. `terraform refresh` esiste ancora come alias di `terraform apply -refresh-only -auto-approve`.

**Come risolvere il drift** _(stepTitle)_

1. **Accettare** la modifica esterna: si aggiorna la configurazione e/o si esegue un apply refresh-only.
2. **Annullare** la modifica esterna: si esegue `terraform apply` per riportare l'infrastruttura alla configurazione.
3. **Gestire un oggetto creato fuori da Terraform**: lo si aggiunge alla configurazione e lo si **importa** (Modulo 7).

Il tutorial *Manage resource drift* segue proprio questi passi: introduce un drift creando a mano un security group, lo rileva con un plan refresh-only, aggiunge il security group alla configurazione, lo importa e infine aggiorna le risorse.

> **Configuration drift e state drift**: in HCP Terraform si distingue tra *configuration drift*, quando le modifiche esterne rendono la configurazione non più valida rispetto alla realtà (lo rileva la drift detection), e *state drift*, quando le modifiche esterne non contraddicono la configurazione. Lo state drift si risolve con la modalità refresh-only.
_(infoBox)_

### 6.4.2 — Comandi terraform state

| **Comando** | **Funzione** |
|---|---|
| `terraform state list` | Elenca le risorse nello state |
| `terraform state show ADDR` | Mostra gli attributi di una risorsa |
| `terraform state mv SRC DEST` | Sposta/rinomina una risorsa nello state |
| `terraform state rm ADDR` | Rimuove una risorsa dallo state senza distruggerla |
| `terraform state pull` / `push` | Scarica / carica lo state |
| `terraform state replace-provider` | Cambia il provider associato alle risorse |

- Lo state è in **formato JSON** ma interno: non va modificato a mano. Per leggerlo in modo stabile si usa `terraform show -json`.
- Tutti i sottocomandi che **modificano** lo state scrivono **sempre** un file di backup (non si può disattivare); quelli in sola lettura, come `list`, no.
- I comandi funzionano anche con state remoto.

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

- Prima di pianificare, Terraform cerca nello state un oggetto all'indirizzo `from` e lo rinomina in `to`.
- `from` e `to` possono indicare risorse, interi moduli o risorse dentro moduli figli. Ad esempio `from = aws_instance.web` e `to = module.app.aws_instance.web` sposta una risorsa in un modulo; anche passare da `count` a `for_each` (`aws_instance.web[0]` → `aws_instance.web["a"]`) si gestisce così.
- Il piano mostra la risorsa come *moved*, senza azioni di create o destroy.
- Chi pubblica un modulo dovrebbe **mantenere i blocchi `moved`** come storico, così chi aggiorna il modulo non perde le risorse. Il tutorial *Use configuration to move resources* mostra come spostare risorse dal root a moduli.

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

- Richiede Terraform **1.7** o successivo; prima si usava `terraform state rm`.
- Il blocco `resource` corrispondente va rimosso dalla configurazione.
- `from` può indicare una risorsa o un intero modulo (`from = module.example`).
- L'unico argomento ammesso in `lifecycle` è `destroy`. Si può aggiungere un `provisioner` con `when = destroy`.
- È utile per passare la gestione di una risorsa a un altro strumento o team.

| **Esigenza** | **Strumento** |
|---|---|
| Rinominare o spostare una risorsa | `moved` (oppure `terraform state mv`) |
| Smettere di gestire senza distruggere | `removed` con `destroy = false` (oppure `terraform state rm`) |
| Forzare la ricreazione | `terraform apply -replace=ADDR` |
| Allineare lo state alla realtà | `apply -refresh-only` |
| Spostare risorse in un'altra configurazione | `removed` nella sorgente + `import` nella destinazione |

### 6.4.4 — Dividere lo state tra più configurazioni

Una configurazione monolitica rende plan e apply lenti e aumenta l'impatto degli errori. La pagina *Refactor Terraform state* suggerisce di dividerla quando gli apply diventano lunghi, quando le risorse hanno cicli di vita diversi, quando cambiano le responsabilità tra team o quando una parte si presta a diventare un modulo.

**Come raggruppare le risorse** _(stepTitle)_

- **Frequenza di modifica**: separare la rete, che cambia raramente, dal compute, che magari scala più volte al giorno.
- **Stateful e stateless**: separare database e storage dalle istanze, per proteggere i dati.
- **Responsabilità del team**: ogni team gestisce il proprio workspace.

Per i riferimenti tra configurazioni diverse si usano data source specifici, `tfe_outputs` o `terraform_remote_state` (vedi 6.3.3). `terraform graph` aiuta a individuare le dipendenze.

**Come migrare le risorse** _(stepTitle)_

- Le risorse **stateless** si possono semplicemente ricreare nella nuova configurazione, se non causa downtime o costi.
- Per quelle **stateful** si spostano tra state file con uno di due approcci:

| **Approccio** | **Versione** | **Come** |
|---|---|---|
| **Remove and import** (consigliato) | 1.7+ | Nella sorgente si sostituisce il blocco `resource` con un `removed` (`destroy = false`) e si applica. Nella destinazione si aggiunge il blocco `resource` con un `import` e si applica. Resta traccia nella configurazione |
| **Move diretto** (legacy) | 1.0+ | `terraform state mv` con l'opzione `-state-out` verso l'altro state file |

Prima di iniziare conviene fare un backup (`terraform state pull > terraform.tfstate.backup`) e annotare l'ID di import di ogni risorsa (`terraform state show ADDR`).

**Link di riferimento** _(stepTitle)_

- [State](https://developer.hashicorp.com/terraform/language/v1.12.x/state) · [Backend](https://developer.hashicorp.com/terraform/language/v1.12.x/backend) · [Locking](https://developer.hashicorp.com/terraform/language/v1.12.x/state/locking)
- [Refactoring](https://developer.hashicorp.com/terraform/language/v1.12.x/state/refactor) · [moved](https://developer.hashicorp.com/terraform/language/v1.12.x/block/moved) · [removed](https://developer.hashicorp.com/terraform/language/v1.12.x/block/removed)
- [Gestire il drift (tutorial)](https://developer.hashicorp.com/terraform/tutorials/state/resource-drift) · [Refresh-only (tutorial)](https://developer.hashicorp.com/terraform/tutorials/state/refresh)
