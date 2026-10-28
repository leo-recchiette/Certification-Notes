# Modulo 7 — Manutenere l'infrastruttura con Terraform

_Importare infrastruttura esistente, ispezionare lo state da CLI e usare il logging dettagliato per la risoluzione dei problemi._

---

## 7.1 — Importare infrastruttura esistente

### 7.1.1 — Perché importare

Spesso esistono risorse create a mano o con altri strumenti. L'**import** le porta sotto la gestione di Terraform associandole a un indirizzo di risorsa nello state, senza ricrearle.

### 7.1.2 — Import dichiarativo con il blocco import

Metodo moderno e consigliato: il blocco `import` è parte della configurazione, è revisionabile e viene eseguito durante `plan`/`apply`.

```
import {
  to = aws_s3_bucket.logs
  id = "my-logs-bucket"
}

resource "aws_s3_bucket" "logs" {
  bucket = "my-logs-bucket"
}
```

| **Argomento** | **Significato** |
|---|---|
| `to` (obbligatorio) | Indirizzo dell'istanza in Terraform; deve corrispondere a un blocco `resource` esistente (anche dentro un modulo, es. `module.app.aws_instance.web`) |
| `id` | Identificativo reale della risorsa (il formato dipende dal provider). Può essere un'espressione, ma deve essere **nota in fase di plan** |
| `identity` | (Terraform 1.12) Insieme di attributi che identificano univocamente la risorsa, definiti dal provider. È **alternativo** a `id`: non si usano insieme |
| `for_each` | Importa più istanze con un solo blocco |
| `provider` | Usa una configurazione di provider alternativa (con alias) |

- Il blocco `import` è disponibile da Terraform 1.5; `for_each` nel blocco `import` dalla 1.7.
- Si può mettere in qualsiasi file `.tf`; la documentazione suggerisce un file `imports.tf` dedicato o di metterlo accanto al blocco `resource` di destinazione.
- `terraform plan` mostra l'import (`will be imported`); `apply` lo esegue.
- **Generazione automatica del codice**: `terraform plan -generate-config-out=generated.tf` crea una bozza del blocco `resource` per gli import che non hanno ancora una risorsa in configurazione. La bozza va rivista e ripulita.
- Dopo l'import il blocco `import` può essere rimosso (o lasciato, non ha più effetto).

### 7.1.3 — Import da CLI

```
terraform import aws_s3_bucket.logs my-logs-bucket
```

- Scrive **solo nello state**: la risorsa deve **già esistere nella configurazione**, altrimenti il successivo plan proporrebbe di distruggerla.
- Non genera il codice della risorsa.
- Operazione imperativa e non revisionabile: preferire il blocco `import`, che si può anche automatizzare nelle pipeline CI/CD.
- Usa la configurazione del provider associata alla risorsa di destinazione; accetta `-var` e `-var-file` come `plan`.
- Ogni oggetto remoto va importato in **un solo** indirizzo: importarlo due volte causa comportamenti imprevisti.

```
terraform import module.network.aws_vpc.main vpc-0abc123
terraform import 'aws_instance.web[0]' i-0abc123
terraform import 'aws_instance.web["app"]' i-0def456
```

Con `count` e `for_each` l'indirizzo va tra apici, per evitare che la shell interpreti parentesi e virgolette.

> **Punto chiave**: l'import aggiorna lo **state**, non scrive la configurazione (salvo `-generate-config-out`). Ogni risorsa importata richiede un blocco `resource` corrispondente, e un `plan` successivo dovrebbe risultare **senza modifiche**.
_(infoBox)_

**Flusso consigliato** _(stepTitle)_

1. Scrivere il blocco `resource` (o generarlo).
2. Aggiungere il blocco `import` con `id` corretto.
3. `terraform plan` e correggere la configurazione finché non ci sono differenze indesiderate.
4. `terraform apply` per scrivere l'import nello state.

### 7.1.4 — Limiti dell'import

Il tutorial *Import Terraform configuration* elenca questi limiti:

- L'import legge lo stato attuale riportato dal provider, ma **non può sapere** se l'infrastruttura è sana, quale fosse l'intento originale, né le modifiche fuori dal controllo di Terraform (es. il filesystem di un container).
- È un processo con passaggi manuali e soggetto a errori: rivedere con attenzione il piano prima dell'apply.
- Modifica lo state durante l'apply: conviene fare prima un **backup**.
- **Non rileva le relazioni** tra risorse: i riferimenti vanno aggiunti a mano nella configurazione.
- Non distingue gli attributi con valore di default, che si potrebbero omettere.
- **Non tutti i provider e le risorse supportano l'import.**

---

## 7.2 — Ispezionare lo state con la CLI

### 7.2.1 — Comandi di ispezione

| **Comando** | **Funzione** |
|---|---|
| `terraform state list` | Elenca gli indirizzi delle risorse nello state (accetta filtri) |
| `terraform state show ADDR` | Mostra tutti gli attributi di una risorsa |
| `terraform show` | Mostra lo state corrente (o un file di piano) in forma leggibile |
| `terraform show -json` | Output JSON per l'elaborazione automatica |
| `terraform output [NOME]` | Mostra gli output del root module |
| `terraform console` | Console interattiva per valutare espressioni e funzioni |
| `terraform graph` | Emette il grafo delle dipendenze (DOT) |
| `terraform providers` | Elenca i provider richiesti dalla configurazione |
| `terraform version` | Versione di Terraform e dei provider |

```
$ terraform state list
aws_instance.web
aws_s3_bucket.logs
module.network.aws_vpc.main

$ terraform state show aws_instance.web
```

**Filtrare terraform state list** _(stepTitle)_

| **Comando** | **Risultato** |
|---|---|
| `terraform state list` | Tutte le risorse |
| `terraform state list aws_instance.web` | Solo le istanze di quella risorsa |
| `terraform state list module.network` | Solo le risorse dentro il modulo |
| `terraform state list -id=i-0abc123` | La risorsa con quell'ID remoto |

- `terraform show` senza argomenti mostra lo state; con un file di piano (`terraform show tfplan`) mostra il piano salvato. Con `-json` l'output è leggibile da macchina.
- L'output dei comandi `state` è pensato per essere usato con strumenti come `grep` e `awk`.

> **Sola lettura**: `list`, `show`, `output` non modificano lo state. I comandi che lo modificano (`mv`, `rm`, `push`) scrivono **sempre** un backup, e non si può disattivare.
_(infoBox)_

---

## 7.3 — Logging dettagliato e troubleshooting

### 7.3.1 — Abilitare i log

Terraform produce log dettagliati tramite variabili d'ambiente:

| **Variabile** | **Funzione** |
|---|---|
| `TF_LOG` | Attiva i log. Livelli in ordine di verbosità decrescente: `TRACE`, `DEBUG`, `INFO`, `WARN`, `ERROR`. Con `JSON` produce log a livello TRACE in formato JSON (formato non stabile) |
| `TF_LOG_PATH` | File su cui **aggiungere** i log (altrimenti stderr). Funziona solo se è impostato anche `TF_LOG` |
| `TF_LOG_CORE` | Livello solo per Terraform Core |
| `TF_LOG_PROVIDER` | Livello solo per i provider |

```
export TF_LOG=DEBUG
export TF_LOG_PATH=terraform.log
terraform apply
```

- In PowerShell: `$env:TF_LOG = "DEBUG"`; per disattivare `Remove-Item Env:TF_LOG`. In Bash: `unset TF_LOG`.
- I log possono contenere dati sensibili: **non condividerli senza averli ripuliti**.

**Quando usare il logging dettagliato** _(stepTitle)_

- Quando un errore non è chiaro dal messaggio standard: errori dei provider, problemi di autenticazione, chiamate API fallite.
- Per capire se il problema è nel core o nel provider, attivando separatamente `TF_LOG_CORE` e `TF_LOG_PROVIDER`.
- Quando si apre una segnalazione di bug: HashiCorp chiede di allegare il log dettagliato (ad esempio tramite un gist).

### 7.3.2 — Il modello di troubleshooting

![Figura 11](img/tf-layers.png) _(dimensioni: 2400×810 px)_

*Figura 11 — I quattro livelli in cui può nascere un problema: linguaggio (HCL), state, core application e provider. Fonte: HashiCorp Developer.* _(caption)_

Il tutorial *Troubleshoot Terraform* distingue quattro tipi di errore, partendo da quello più vicino all'utente:

| **Tipo di errore** | **Livello** | **Come si affronta** |
|---|---|---|
| **Language errors** | HCL, l'interfaccia principale | Terraform indica il numero di riga e il tipo di errore; si usano `terraform fmt` e `terraform validate` |
| **State errors** | Lo state, che mappa risorse e metadati | Se lo state non è allineato Terraform può modificare o distruggere risorse: si sincronizza con refresh, import o replace |
| **Core errors** | Terraform Core (configurazione, state, grafo, comunicazione con i plugin) | Possono essere bug: si apre una issue su GitHub per il team di Terraform |
| **Provider errors** | Il plugin del provider (autenticazione, chiamate API, mapping delle risorse) | Si verificano credenziali, permessi e quote; se è un bug si apre una issue nel repository del provider |

**Errori comuni dal tutorial** _(stepTitle)_

- **Errori di interpolazione**: un riferimento scritto male. `terraform fmt` trova gli errori di sintassi, ma solo `validate` controlla la configurazione rispetto ai provider.
- **Cycle error**: due risorse che dipendono l'una dall'altra, ad esempio due security group che si citano nelle regole. Si risolve spostando le regole in risorse separate.
- **Errore di for_each**: `for_each` non accetta una lista prodotta da uno splat (`[*]`) o valori non noti in fase di plan. Serve una mappa o un set con chiavi note (es. `toset(...)` o un'espressione `for`).
- **Output che restituiscono un solo valore**: con più istanze si usa uno splat o un'espressione `for` per restituirli tutti.

**Segnalare un bug** _(stepTitle)_

1. Verificare le versioni con `terraform version` (Terraform e provider) e aggiornare, se possibile.
2. Abilitare il logging (`TF_LOG`) e raccogliere il log.
3. Aprire una issue nel repository GitHub corretto (Terraform core o provider), includendo versioni, configurazione minima e log ripuliti.

**Link di riferimento** _(stepTitle)_

- [Importare risorse](https://developer.hashicorp.com/terraform/language/v1.12.x/import) · [Tutorial import](https://developer.hashicorp.com/terraform/tutorials/state/state-import)
- [terraform state list](https://developer.hashicorp.com/terraform/cli/v1.12.x/commands/state/list) · [terraform show](https://developer.hashicorp.com/terraform/cli/v1.12.x/commands/show)
- [Debugging e logging](https://developer.hashicorp.com/terraform/internals/v1.12.x/debugging) · [Tutorial troubleshooting](https://developer.hashicorp.com/terraform/tutorials/configuration-language/troubleshooting-workflow)
