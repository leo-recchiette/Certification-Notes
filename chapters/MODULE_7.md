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

- `to`: indirizzo della risorsa in Terraform.
- `id`: identificativo reale della risorsa (il formato dipende dal provider; vedi la documentazione della risorsa).
- Supporta `for_each` per importare più risorse.
- `terraform plan` mostra l'import (`will be imported`); `apply` lo esegue.
- **Generazione automatica del codice**: `terraform plan -generate-config-out=generated.tf` crea una bozza del blocco `resource` a partire dalla risorsa reale (da rivedere e ripulire).
- Dopo l'import il blocco `import` può essere rimosso (o lasciato, non ha più effetto).

### 7.1.3 — Import da CLI

```
terraform import aws_s3_bucket.logs my-logs-bucket
```

- Scrive **solo nello state**: la risorsa deve **già esistere nella configurazione**, altrimenti il successivo plan proporrebbe di distruggerla.
- Non genera il codice della risorsa.
- Operazione imperativa e non revisionabile: preferire il blocco `import`.

> **Punto chiave**: l'import aggiorna lo **state**, non scrive la configurazione (salvo `-generate-config-out`). Ogni risorsa importata richiede un blocco `resource` corrispondente, e un `plan` successivo dovrebbe risultare **senza modifiche**.
_(infoBox)_

**Flusso consigliato** _(stepTitle)_

1. Scrivere il blocco `resource` (o generarlo).
2. Aggiungere il blocco `import` con `id` corretto.
3. `terraform plan` e correggere la configurazione finché non ci sono differenze indesiderate.
4. `terraform apply` per scrivere l'import nello state.

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

> **Sola lettura**: `list`, `show`, `output` non modificano lo state. I comandi che lo modificano (`mv`, `rm`, `push`) creano un backup locale automatico.
_(infoBox)_

---

## 7.3 — Logging dettagliato e troubleshooting

### 7.3.1 — Abilitare i log

Terraform produce log dettagliati tramite variabili d'ambiente:

| **Variabile** | **Funzione** |
|---|---|
| `TF_LOG` | Livello di log: `TRACE`, `DEBUG`, `INFO`, `WARN`, `ERROR` (`TRACE` è il più verboso) |
| `TF_LOG_PATH` | File su cui scrivere i log (altrimenti stderr) |
| `TF_LOG_CORE` | Livello solo per Terraform Core |
| `TF_LOG_PROVIDER` | Livello solo per i provider |

```
export TF_LOG=DEBUG
export TF_LOG_PATH=terraform.log
terraform apply
```

- Per disattivare: `unset TF_LOG` (o `TF_LOG=`).
- I log possono contenere dati sensibili: **non condividerli senza averli ripuliti**.
- Utili per diagnosticare errori dei provider, problemi di autenticazione, chiamate API.

### 7.3.2 — Categorie di errori e approccio

| **Tipo di errore** | **Quando compare** | **Rimedio tipico** |
|---|---|---|
| **Sintassi / formattazione** | `validate`, `plan` | `terraform fmt` e `terraform validate` |
| **Riferimento / tipo** | `validate`, `plan` | Correggere nome o tipo del valore |
| **Provider / API** | `apply` | Verificare credenziali, permessi, quote; abilitare `TF_LOG` |
| **Lock dello state** | `plan`, `apply` | Attendere o `terraform force-unlock` |
| **State non allineato** | `plan` | `apply -refresh-only`, `import`, `state` commands |

**Link di riferimento** _(stepTitle)_

- [Importare risorse](https://developer.hashicorp.com/terraform/language/v1.12.x/import) · [Tutorial import](https://developer.hashicorp.com/terraform/tutorials/state/state-import)
- [terraform state list](https://developer.hashicorp.com/terraform/cli/v1.12.x/commands/state/list) · [terraform show](https://developer.hashicorp.com/terraform/cli/v1.12.x/commands/show)
- [Debugging e logging](https://developer.hashicorp.com/terraform/internals/v1.12.x/debugging) · [Tutorial troubleshooting](https://developer.hashicorp.com/terraform/tutorials/configuration-language/troubleshooting-workflow)
