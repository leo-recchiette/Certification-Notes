# Manutenzione dell'infrastruttura con Terraform

_Ora che conosci a fondo lo state, è il momento di padroneggiare il ciclo di vita operativo. Questo obiettivo copre tre aree chiave che ogni professionista Terraform deve conoscere in produzione._

---

## Importare infrastruttura esistente nel workspace Terraform

*Fonti: [Import Terraform configuration](https://developer.hashicorp.com/terraform/tutorials/state/state-import), [Import an existing resource](https://developer.hashicorp.com/terraform/cli/v1.12.x/import/usage), [Command: import](https://developer.hashicorp.com/terraform/cli/v1.12.x/commands/import)*

### 7a.1: il problema: deployment brownfield e la necessità dell'import

La maggior parte delle organizzazioni non parte da un deployment Terraform greenfield (da zero). Ha già un'infrastruttura (istanze EC2, bucket S3, database) creata a mano dalla console AWS, con script CLI o altri strumenti. Terraform non sa nulla di queste risorse.

L'import è il processo con cui si porta questa infrastruttura "brownfield" esistente sotto la gestione di Terraform senza distruggerla e ricrearla.

**Cosa fa l'import:** scrive l'ID reale e gli attributi della risorsa nello state file di Terraform, creando un legame tra un blocco `resource` nella configurazione e una risorsa cloud esistente. Da quel momento Terraform gestisce la risorsa come se l'avesse creata lui.

### 7a.2: import guidato dalla configurazione (Terraform 1.5+)

L'approccio moderno e consigliato usa il blocco `import`. È dichiarativo, sotto controllo di versione e integrato nel workflow plan/apply.

**Passo 1: scrivere il blocco resource di destinazione** _(stepTitle)_

Devi definire la risorsa nella configurazione **prima** di importarla. Come minimo il blocco deve contenere gli argomenti obbligatori per quel tipo di risorsa. Non servono tutte le impostazioni avanzate: basta quanto serve a Terraform per pianificare dopo l'import.

```hcl
# Importeremo un bucket S3 esistente creato a mano.
# Questa è la risorsa di "destinazione" che lo rappresenterà in Terraform.

resource "aws_s3_bucket" "legacy_assets" {
  # 'bucket' è un argomento obbligatorio di aws_s3_bucket.
  # Il valore DEVE corrispondere esattamente al nome del bucket esistente.
  bucket = "my-company-legacy-assets"
}
```

**Spiegazione** _(stepTitle)_

- `resource "aws_s3_bucket" "legacy_assets" {` — dichiara il blocco resource. `aws_s3_bucket` è il tipo di risorsa del provider AWS. `legacy_assets` è il local name che le dai in Terraform. Può essere qualsiasi cosa; non deve corrispondere al nome reale del bucket.
- `bucket = "my-company-legacy-assets"` — è un argomento obbligatorio che dice al provider AWS quale bucket gestire. Il valore deve essere esattamente il nome del bucket S3 esistente in AWS.

**Passo 2: scrivere il blocco import** _(stepTitle)_

```hcl
# Il blocco import dice a Terraform: "In AWS esiste già un bucket S3
# con questo ID. Associalo al blocco resource che ho appena definito,
# così Terraform può iniziare a gestirlo."

import {
  # 'id' è l'identificatore univoco della risorsa presso il cloud provider.
  # Per un bucket S3 l'identificatore è semplicemente il nome del bucket.
  id = "my-company-legacy-assets"

  # 'to' è l'indirizzo della risorsa Terraform in cui importare.
  # Segue il formato: RESOURCE_TYPE.LOCAL_NAME
  to = aws_s3_bucket.legacy_assets
}
```

**Spiegazione** _(stepTitle)_

- `import {` — dichiara un blocco import. Puoi avere più blocchi `import` per configurazione, uno per ogni risorsa da importare.
- `id = "my-company-legacy-assets"` — l'identificatore che il cloud provider usa per individuare in modo univoco questa risorsa. Per `aws_s3_bucket` è il nome del bucket. Per `aws_instance` sarebbe l'ID dell'istanza (`i-12345`). Per `aws_vpc` è l'ID della VPC (`vpc-abc123`). È specifico del provider; controlla sempre nella documentazione del provider il formato corretto dell'ID.
- `to = aws_s3_bucket.legacy_assets` — l'indirizzo della risorsa di destinazione. Deve corrispondere esattamente al tipo di risorsa e al local name definiti nel passo 1. Terraform legherà la risorsa esistente a questo indirizzo nello state file.

**Passo 3: eseguire terraform plan** _(stepTitle)_

```bash
terraform plan
```

Terraform leggerà il blocco `import`, interrogherà AWS per gli attributi attuali del bucket e ti mostrerà che importerà la risorsa. Mostrerà anche eventuali attributi della configurazione che aggiornerà dopo l'import (es. se il tuo blocco `resource` ha impostazioni aggiuntive diverse da quelle del bucket reale).

**Passo 4: generare facoltativamente la configurazione** _(stepTitle)_

Se stai importando una risorsa complessa e non ne conosci tutti gli attributi attuali, puoi saltare il passo 1 (il blocco `resource` non deve esistere) e chiedere a Terraform di generare la configurazione completa per te:

```bash
terraform plan -generate-config-out=generated.tf
```

Questo crea un file `generated.tf` con tutti gli argomenti della risorsa compilati in base al suo stato reale. Puoi poi rivedere il file, tenere ciò che ti serve, togliere ciò che non serve e spostare le parti rilevanti nella configurazione principale. Se il blocco `resource` di destinazione esiste già, Terraform non genera nulla per quella risorsa.

**Passo 5: eseguire terraform apply** _(stepTitle)_

```bash
terraform apply
```

Terraform importa la risorsa nello state file. Da questo momento Terraform gestisce il bucket come se l'avesse creato lui.

**Passo 6: (facoltativo) rimuovere il blocco import** _(stepTitle)_

Una volta completato l'import e con la risorsa nello state, il blocco `import` ha esaurito il suo compito. Puoi rimuoverlo oppure tenerlo come traccia storica della provenienza della risorsa. Il blocco è idempotente: se esegui di nuovo `apply` con il blocco ancora presente, Terraform vede che la risorsa è già nello state e non fa nulla.

---

### 7a.3: importare risorse con for_each

Puoi importare più istanze di una risorsa usando `for_each` nel blocco import (Terraform 1.7+; `count` non è supportato nel blocco import).

```hcl
# Importa più istanze EC2 usando for_each.
# Supponiamo di avere tre istanze: i-abc, i-def, i-ghi.

resource "aws_instance" "legacy_servers" {
  for_each = {
    "web"   = "i-abc123"
    "api"   = "i-def456"
    "worker" = "i-ghi789"
  }

  ami           = "ami-12345"
  instance_type = "t3.micro"
}

import {
  for_each = {
    "web"   = "i-abc123"
    "api"   = "i-def456"
    "worker" = "i-ghi789"
  }

  id = each.value       # L'ID dell'istanza preso dalla mappa
  to = aws_instance.legacy_servers[each.key]  # L'indirizzo dell'istanza di risorsa
}
```

**Spiegazione** _(stepTitle)_

- `for_each = { ... }` — definisce una mappa in cui le chiavi sono le chiavi delle istanze Terraform (`web`, `api`, `worker`) e i valori sono gli identificatori cloud (`i-abc123`, ecc.).
- `id = each.value` — per ogni iterazione, imposta l'ID di import sull'identificatore della risorsa cloud.
- `to = aws_instance.legacy_servers[each.key]` — specifica l'indirizzo esatto dell'istanza di risorsa usando `each.key` come indice.

---

### 7a.4: il vecchio comando terraform import (prima della 1.5)

Prima che esistesse il blocco `import`, dovevi usare il comando CLI:

```bash
terraform import aws_s3_bucket.legacy_assets my-company-legacy-assets
```

**Formato:** `terraform import RESOURCE_ADDRESS CLOUD_ID`

Questo comando scrive direttamente la risorsa nello state file. **Non** genera alcuna configurazione: il blocco `resource` corrispondente deve già esistere nella configurazione, scritto a mano, prima di eseguire il comando. Non c'è un passo di plan né una revisione: è immediato e irreversibile sullo state file.

**L'esame potrebbe ancora fare riferimento alla sintassi del comando terraform import, ma la best practice moderna è il blocco import.**

---

### 7a.5: limiti importanti dell'import

La guida di studio ufficiale elenca questi limiti critici:

1. **L'import legge lo stato attuale riportato dal provider.** Non può determinare intenzione, salute o storia della risorsa.
2. **L'import non genera relazioni tra risorse.** Se il tuo bucket S3 ha lifecycle policy, notifiche di eventi o dipende da altre risorse, il blocco `import` non cattura queste dipendenze. Devi aggiungere a mano quelle relazioni nella configurazione.
3. **L'import non rileva quali argomenti puoi omettere.** La configurazione generata include ogni possibile argomento, compresi default e valori vuoti. Devi sfoltire la configurazione generata.
4. **Non tutte le risorse supportano l'import.** Controlla la documentazione del provider per ogni tipo di risorsa.
5. **L'import non garantisce che Terraform possa gestire tutti gli aspetti della risorsa.** Alcune risorse create esternamente possono avere configurazioni che Terraform non può aggiornare senza ricrearle.

---

### 7a.6: laboratorio pratico: import guidato dalla configurazione con il provider local

Simuleremo l'import di un file esistente creato al di fuori di Terraform. Il laboratorio è concettuale: la risorsa `local_file` del provider hashicorp/local non documenta il supporto all'import, quindi il passo 3 può fallire con un errore del tipo "resource does not support import". Per provare davvero il workflow usa una risorsa che supporta l'import, come il bucket S3 di 7a.2.

**Directory:** `obj7a-lab`

**Passo 1: creare un file al di fuori di Terraform** _(stepTitle)_

```bash
# Simula la creazione manuale di una "risorsa cloud"
echo "This file was created manually, outside Terraform." > manual-resource.txt
```

**Passo 2: scrivere la configurazione Terraform** _(stepTitle)_

```hcl
# main.tf
terraform {
  required_providers {
    local = {
      source  = "hashicorp/local"
      version = "~> 2.5"
    }
  }
}

# Definisce la risorsa in cui vogliamo importare il file esistente.
# L'argomento 'filename' deve corrispondere al percorso del file esistente.
resource "local_file" "imported_file" {
  filename = "${path.module}/manual-resource.txt"
  # 'content' verrà sovrascritto per corrispondere al contenuto attuale del file dopo l'import
}

# Il blocco import dice a Terraform di trovare il file esistente e legarlo.
import {
  # Per il provider local, l'ID del file è il suo checksum SHA256.
  # Forniamo il percorso del file come identificatore: il provider sa come risolverlo.
  id = "${path.module}/manual-resource.txt"
  to = local_file.imported_file
}
```

**Riga per riga** _(stepTitle)_

- `import {` — dichiara il blocco import per questa risorsa.
- `id = "${path.module}/manual-resource.txt"` — l'identificatore. Per `local_file`, l'`id` è l'hash SHA256 del contenuto del file. Tuttavia il processo di import accetta il percorso del file come identificatore e calcola l'hash internamente. `${path.module}` è un valore integrato che restituisce il percorso della directory che contiene il modulo in cui compare l'espressione.
- `to = local_file.imported_file` — lega l'import al blocco `resource "local_file" "imported_file"` che abbiamo definito.

**Passo 3: eseguire il workflow di import** _(stepTitle)_

```bash
terraform init
terraform plan
# Osserva che Terraform importerà il file e poi mostrerà che 'content' verrà impostato al contenuto effettivo del file.

terraform apply
# Terraform importa il file nello state. Il contenuto del file nello state corrisponderà al file su disco.
```

**Passo 4: verificare** _(stepTitle)_

```bash
terraform state show local_file.imported_file
# Mostra la risorsa con gli attributi importati.
```

**Passo 5: ripulire** _(stepTitle)_

```bash
# Facoltativamente rimuovi il blocco import da main.tf (è idempotente, ma il codice pulito è meglio)
# Ora Terraform gestisce il file. Qualsiasi modifica che fai al file verrà rilevata.
```

---

### 7a.7: Mini-quiz 7a

1. Vero/Falso: dopo aver eseguito `terraform import aws_instance.web i-12345`, il blocco `resource` corrispondente viene generato automaticamente nella configurazione.
2. Scelta multipla: in un blocco `import`, cosa rappresenta l'argomento `id`?
  - A. L'indirizzo della risorsa Terraform.
  - B. Il local name della risorsa nella configurazione.
  - C. L'identificatore univoco della risorsa esistente presso il cloud provider.
  - D. Il numero serial dello state file.
3. Risposta multipla: quali dei seguenti sono limiti di `terraform import`? (Selezionane DUE)
  - A. Non può importare risorse che usano `for_each`.
  - B. Non genera relazioni di dipendenza tra le risorse.
  - C. Non può importare risorse create da un altro strumento IaC.
  - D. Non tutti i tipi di risorsa supportano l'import.

**Risposte** _(stepTitle)_

1. Falso — Il comando `terraform import` non genera alcuna configurazione. Devi scrivere a mano il blocco `resource` corrispondente. Il blocco `import` di Terraform 1.5+ è il modo moderno di gestire gli import, ma richiede anch'esso di definire prima il blocco resource.
2. C — L'argomento `id` in un blocco `import` è l'identificatore univoco della risorsa esistente presso il cloud provider. È così che Terraform individua la risorsa da importare nello state.
3. B, D — `terraform import` non genera relazioni di dipendenza tra le risorse (B), e non tutti i tipi di risorsa supportano l'import (D). `terraform import` si può usare con risorse che usano `for_each` o `count` se strutturi correttamente l'import.

## Usare la CLI per ispezionare lo state

*Fonti: [Manage resources in Terraform state](https://developer.hashicorp.com/terraform/tutorials/state/state-cli), [terraform state command](https://developer.hashicorp.com/terraform/cli/v1.12.x/commands/state)*

### 7b.1: panoramica dei comandi di ispezione dello state

La CLI di Terraform fornisce una serie di sottocomandi sotto `terraform state` per ispezionare e manipolare lo state file senza modificare direttamente il JSON. Sono i tuoi principali strumenti di debug.

### 7b.2: terraform state list

Elenca tutti gli indirizzi di risorsa nello state file.

```bash
terraform state list
```

**Output d'esempio** _(stepTitle)_

```
random_pet.server
local_file.config
module.vpc.aws_vpc.main
module.vpc.aws_subnet.public[0]
module.vpc.aws_subnet.public[1]
data.aws_ami.ubuntu
```

**Punti chiave** _(stepTitle)_

- Le risorse sono elencate per profondità di modulo, poi in ordine alfabetico.
- Le risorse con `count` o `for_each` mostrano il loro indice di istanza (`[0]`, `[1]`, `["key"]`).
- Compaiono anche i data source messi in cache nello state (con prefisso `data.`).
- I moduli hanno il prefisso `module.MODULE_NAME.`

**Filtrare** _(stepTitle)_

```bash
# Elenca solo le risorse del modulo vpc
terraform state list module.vpc

# Elenca solo le risorse aws_instance (il filtro accetta indirizzi, non caratteri jolly)
terraform state list | grep aws_instance

# Elenca una specifica risorsa con nome
terraform state list aws_instance.web
```

---

### 7b.3: terraform state show

Mostra tutti gli attributi di una singola risorsa dallo state file.

```bash
terraform state show local_file.config
```

**Output d'esempio** _(stepTitle)_

```
# local_file.config:
resource "local_file" "config" {
    content              = "Hello, Terraform!"
    content_base64sha256 = "abc123..."
    content_base64sha512 = "def456..."
    content_md5          = "ghi789..."
    content_sha1         = "jkl012..."
    content_sha256       = "mno345..."
    content_sha512       = "pqr678..."
    directory_permission = "0777"
    file_permission      = "0777"
    filename             = "./config.txt"
    id                   = "abc123def456ghi789"
}
```

**Casi d'uso** _(stepTitle)_

- Controllare rapidamente il valore attuale di un attributo di una risorsa senza aprire il JSON.
- Verificare che lo state rifletta ciò che ti aspetti dopo un import.
- Capire perché una risorsa viene ricreata: controlla se i suoi attributi calcolati differiscono da quelli nello state.

### 7b.4: terraform show

Mostra l'intero state in formato leggibile (oppure JSON con `-json`).

```bash
# Output leggibile dell'intero state
terraform show

# Output JSON per gli script
terraform show -json
```

**L'output JSON è utile per** _(stepTitle)_

- Integrarsi con strumenti esterni.
- Analizzare gli attributi delle risorse da programma.
- Confrontare lo state tra ambienti.

### 7b.4a: script con terraform show -json

`terraform show -json` produce una rappresentazione JSON dello state adatta alle macchine, utile per l'automazione. Esempio: estrarre tutti i nomi degli `aws_s3_bucket` con `jq`:

```bash
terraform show -json | jq -r '.values.root_module.resources[] | select(.type=="aws_s3_bucket") | .values.bucket'
```

Nota: il formato JSON è versionato tramite il campo `format_version`; controllalo negli script e blocca la versione di Terraform in CI quando dipendi da questo output.

### 7b.5: terraform state pull e terraform state push

Questi comandi interagiscono direttamente con il backend configurato per scaricare o caricare lo state.

```bash
# Scarica lo state corrente dal backend remoto e lo stampa come JSON su stdout
terraform state pull > current-state.json
```

```bash
# Carica uno state file sul backend remoto (ESTREMAMENTE PERICOLOSO)
terraform state push current-state.json
```

**Avvertenze della guida di studio** _(stepTitle)_

- `terraform state push` sovrascrive lo state remoto. Terraform protegge dai push accidentali controllando i valori `lineage` e `serial`.
- Se il `serial` dello state caricato è inferiore a quello dello state remoto attuale, Terraform rifiuta il push (perché lo state remoto è cambiato dopo il tuo pull).
- Usa `-force` per aggirare queste protezioni solo se sei assolutamente sicuro.
- Fai sempre un backup dello state remoto prima del push.

---

### 7b.6: pattern pratici della CLI ed esempi di CI

Questa sezione raccoglie pattern di comandi comuni, flag ed esempi adatti alla CI per aiutarti a gestire Terraform in sicurezza in produzione.

Pattern principali:

- Creare e salvare un piano da rivedere o da applicare tramite CI:

```bash
terraform plan -out=tfplan
# Salva il piano in formato leggibile da macchina per l'audit
terraform show -json tfplan > tfplan.json
```

- Applicare un piano salvato in precedenza (CI o approvazione manuale):

```bash
terraform apply "tfplan"
```

- Usare `-detailed-exitcode` in CI per rilevare modifiche senza fallire in caso di "nessuna modifica":

```bash
terraform plan -detailed-exitcode -out=tfplan || PLAN_EXIT=$?
if [ "$PLAN_EXIT" -eq 2 ]; then
  echo "Changes detected"
  # Facoltativamente fai fallire la pipeline o pubblica un messaggio sulla PR
fi
```

- Cancelli di formattazione e validazione (pre-merge):

```bash
terraform fmt -check -recursive
terraform validate
```

- Produrre lo state in JSON per controlli automatici e rilevamento del drift:

```bash
terraform show -json > state.json
jq -r '.values.root_module.resources[] | select(.type=="aws_instance") | .address' state.json
```

**Esempio di workflow di CI (semplificato)** _(stepTitle)_

1. `terraform fmt -check -recursive`
2. `terraform init -input=false`
3. `terraform validate`
4. `terraform plan -detailed-exitcode -out=tfplan`
5. Se ci sono modifiche, eventualmente richiedi un'approvazione manuale e poi `terraform apply tfplan`

**Note e best practice** _(stepTitle)_

- Per un riferimento sintetico ai comandi ed esempi di CI, vedi l'appendice CLI alla fine di questa guida.
- Blocca la versione di Terraform in CI per garantire un output `show -json` coerente.
- Esegui sempre `terraform init` all'inizio della CI per scaricare i provider e configurare il backend.
- Conserva le credenziali in variabili sicure (segreti della CI) e preferisci credenziali a breve durata o basate su ruoli.
- Limita l'uso di `terraform state push`; per modifiche controllate preferisci `terraform import` / `state mv`.

### 7b.7: laboratorio pratico: ispezione dello state

Useremo lo state file di uno qualsiasi dei laboratori precedenti (es. `obj6d-lab`) oppure ne creeremo uno al volo.

**Directory:** `obj7b-lab`

**File: main.tf** _(stepTitle)_

```hcl
terraform {
  required_providers {
    random = { source = "hashicorp/random", version = "~> 3.6" }
    local  = { source = "hashicorp/local", version = "~> 2.5" }
  }
}

resource "random_pet" "demo" {
  length = 2
}

resource "local_file" "log" {
  filename = "${path.module}/${random_pet.demo.id}.log"
  content  = "Log for ${random_pet.demo.id}"
}
```

**Passi** _(stepTitle)_

1. `terraform init && terraform apply -auto-approve`
2. Esegui `terraform state list` per vedere entrambe le risorse.
3. Esegui `terraform state show random_pet.demo` per vederne gli attributi.
4. Esegui `terraform show` per vedere l'intero state in formato leggibile.
5. Esegui `terraform state pull > state-backup.json` per salvare una copia dello state.
6. Esegui `terraform state show local_file.log` per vedere nome del file e contenuto.

### 7b.8: Mini-quiz 7b

1. Vero/Falso: `terraform state list` mostra solo le managed resource; i data source sono esclusi.
2. Scelta multipla: quale comando useresti per vedere gli attributi dettagliati di una risorsa specifica dallo state file?
  - A. `terraform plan`
  - B. `terraform state list`
  - C. `terraform state show`
  - D. `terraform output`
3. Vero/Falso: `terraform state push` sovrascriverà incondizionatamente lo state remoto senza alcun controllo di sicurezza.

**Risposte** _(stepTitle)_

1. Falso — `terraform state list` include i data source in cache se sono presenti nello state; non è limitato alle sole managed resource.
2. C — `terraform state show` mostra gli attributi dettagliati di una singola risorsa dallo state file.
3. Falso — `terraform state push` ha controlli di sicurezza (verifica `lineage` e `serial`) e non sovrascriverà incondizionatamente lo state remoto senza una forzatura esplicita.

## Descrivere quando e come usare il logging dettagliato

*Fonti: [Debugging Terraform](https://developer.hashicorp.com/terraform/internals/v1.12.x/debugging), [Enable Terraform logs](https://developer.hashicorp.com/terraform/tutorials/configuration-language/troubleshooting-workflow#enable-terraform-logging)*

### 7c.1: il problema: quando Terraform fallisce, servono più informazioni

Quando Terraform si comporta in modo inatteso (un plan mostra modifiche che non dovrebbe, un apply fallisce con un errore criptico, un provider restituisce un errore API) ti servono più informazioni di quelle che la CLI fornisce di default. Terraform ha un sistema di logging completo che si abilita tramite variabili d'ambiente.

### 7c.2: logging di Terraform Core (TF_LOG)

La variabile d'ambiente principale è `TF_LOG`. Controlla il livello di dettaglio dei log di Terraform.

```bash
# Abilita il logging di Terraform Core a livello DEBUG
export TF_LOG=DEBUG
```

**Livelli di log (in ordine di dettaglio decrescente)** _(stepTitle)_

| Livello | Descrizione |
|---|---|
| `TRACE` | Il più dettagliato. Mostra ogni operazione interna, attraversamento del grafo, chiamata RPC. |
| `DEBUG` | Informazioni operative dettagliate. Utile per il debug del comportamento della configurazione. |
| `INFO` | Messaggi operativi generali. Buono per capire il flusso ad alto livello. |
| `WARN` | Messaggi di avviso che non interrompono l'operazione. |
| `ERROR` | Solo i messaggi di errore che causano il fallimento dell'operazione. |

**Impostare il percorso del log** _(stepTitle)_

```bash
export TF_LOG_PATH=terraform.log
```

Questo reindirizza tutti i log in un file invece che su `stderr`. Il file verrà creato o aggiornato in coda nella directory di lavoro corrente. `TF_LOG_PATH` ha effetto solo se è impostato anche `TF_LOG` (o una delle varianti `TF_LOG_CORE` / `TF_LOG_PROVIDER`).

**Sessione d'esempio** _(stepTitle)_

```bash
export TF_LOG=TRACE
export TF_LOG_PATH=debug-apply.log
terraform apply
# Al termine, rivedi debug-apply.log per informazioni dettagliate
```

### 7c.3: logging specifico dei provider

Puoi abilitare il logging solo per i plugin dei provider, separatamente da Terraform Core:

```bash
# Registra solo le operazioni dei provider, non gli interni di Terraform Core
export TF_LOG_PROVIDER=TRACE
```

È utile quando sospetti un bug in un provider specifico ma vuoi evitare il rumore del logging del core.

Puoi anche puntare a provider specifici combinando `TF_LOG_PROVIDER` con un livello di log specifico per provider:

```bash
# Debug solo del provider AWS
export TF_LOG=INFO                      # Core a livello INFO
export TF_LOG_PROVIDER_AWS=TRACE        # Provider AWS a livello TRACE
```

---

### 7c.4: quando usare il logging

**Debug in produzione** _(stepTitle)_

- Un `apply` fallisce con un errore API di un cloud provider. Abilita `TF_LOG=DEBUG` e riesegui per vedere esattamente richiesta e risposta API.
- Un plan mostra una ricreazione di risorse inattesa. Abilita `TF_LOG=TRACE` per tracciare il grafo delle dipendenze e la logica di refresh dello state.

**Segnalazione di bug** _(stepTitle)_

- Quando apri una issue su GitHub per Terraform Core o per un provider, includi sempre i log a livello `TRACE`.
- La guida di studio consiglia `TF_LOG=TRACE` per le segnalazioni di bug, perché fornisce agli sviluppatori il massimo livello di dettaglio.

**Pipeline CI/CD** _(stepTitle)_

- Imposta `TF_LOG=WARN` per le run di routine, così da intercettare comportamenti inattesi senza sommergere l'output dei log.
- Imposta `TF_LOG_PATH` per catturare i log per l'analisi post-mortem.

### 7c.5: formato dei log

Di default i log sono formattati come righe di testo leggibili. Per il consumo da parte di macchine, imposta:

```bash
export TF_LOG=JSON
```

Questo produce righe di log codificate in JSON a livello `TRACE` o superiore, adatte all'analisi da parte di strumenti di aggregazione dei log.

**Avvertenza della guida di studio:** il formato di codifica JSON **non è un'interfaccia stabile**. Può cambiare tra versioni di Terraform. Usalo solo per strumenti che mantieni e aggiorni insieme a Terraform.

### 7c.6: altre variabili d'ambiente di debug

- `TF_LOG_CORE`: abilita il logging solo per Terraform Core (il livello di orchestrazione).
- `TF_LOG_PROVIDER`: abilita il logging solo per tutti i provider.
- `TF_LOG_PROVIDER_<PROVIDER_NAME>`: abilita il logging per un provider specifico (es. `TF_LOG_PROVIDER_AWS`).

---

### 7c.7: laboratorio pratico: abilitare il logging

Abiliteremo il logging per un'operazione semplice e ne ispezioneremo l'output.

**Directory:** `obj7c-lab`

**Passo 1: creare una configurazione semplice** _(stepTitle)_

```hcl
# main.tf
resource "local_file" "test" {
  filename = "${path.module}/log-test.txt"
  content  = "Testing logging."
}
```

**Passo 2: abilitare il logging ed eseguire apply** _(stepTitle)_

```bash
terraform init

# Imposta le variabili d'ambiente per il logging dettagliato
export TF_LOG=TRACE
export TF_LOG_PATH=apply-trace.log

terraform apply -auto-approve
```

**Passo 3: ispezionare il file di log** _(stepTitle)_

```bash
cat apply-trace.log | head -50
```

Vedrai voci dettagliate su:

- Inizializzazione dei provider
- Lettura dello state file
- Generazione del plan
- Creazione delle risorse
- Scrittura dello state

**Passo 4: disabilitare il logging** _(stepTitle)_

```bash
unset TF_LOG
unset TF_LOG_PATH
```

### 7c.8: Mini-quiz 7c

1. Vero/Falso: impostare `TF_LOG=INFO` produce un output più dettagliato di `TF_LOG=TRACE`.
2. Scelta multipla: quale variabile d'ambiente imposteresti per salvare i log di Terraform in un file invece che nel terminale?
  - A. `TF_LOG_FILE`
  - B. `TF_LOG_PATH`
  - C. `TF_DEBUG_PATH`
  - D. `TF_LOG_OUTPUT`
3. Risposta multipla: quali dei seguenti sono livelli validi di `TF_LOG`? (Selezionane QUATTRO)
  - A. `TRACE`
  - B. `DEBUG`
  - C. `VERBOSE`
  - D. `WARN`
  - E. `ERROR`

**Risposte** _(stepTitle)_

1. Falso — `TF_LOG=TRACE` è più dettagliato di `TF_LOG=INFO`. L'ordine di dettaglio dal più al meno dettagliato è: `TRACE`, `DEBUG`, `INFO`, `WARN`, `ERROR`.
2. B — `TF_LOG_PATH` è la variabile d'ambiente usata per specificare un percorso di file per i log di Terraform. Impostandola, tutti i log vanno nel file indicato invece che su `stderr`.
3. A, B, D, E — I livelli validi di `TF_LOG` sono `TRACE`, `DEBUG`, `INFO`, `WARN` ed `ERROR`. `VERBOSE` non è valido.

## 7b.9: refactoring dello state: spostare, rinominare e blocchi moved

A volte devi rinominare risorse, spostarle tra moduli o cambiarne l'indirizzamento logico senza ricreare la risorsa reale. Terraform supporta refactoring sicuri tramite comandi CLI e strumenti di configurazione.

- `terraform state mv OLD_ADDR NEW_ADDR` — sposta una risorsa o un'istanza all'interno dello state file. Non cambia la risorsa reale, solo la mappatura nello state.

Esempio: spostare una risorsa in un modulo dopo aver rifattorizzato la configurazione:

```bash
# Sposta aws_instance.web in module.web.aws_instance.web
terraform state mv aws_instance.web module.web.aws_instance.web
```

- `terraform state rm ADDR` — rimuove una risorsa dallo state senza distruggere la risorsa sottostante (utile quando vuoi intenzionalmente che Terraform smetta di gestirla).
- Blocco `moved` nella configurazione (Terraform 1.1+) — dichiara migrazioni stabili così Terraform può riscrivere automaticamente lo state durante `terraform plan`/`apply` senza spostamenti manuali da CLI. Usa `moved` per registrare in sicurezza le rinomine nel VCS.

Esempio di blocco `moved`:

```hcl
# Nel modulo root
moved {
  from = aws_instance.old_name
  to   = module.web.aws_instance.web
}
```

Questo dice a Terraform che l'indirizzo di risorsa `aws_instance.old_name` è stato spostato in `module.web.aws_instance.web`. Quando esegui `terraform plan` o `terraform apply`, Terraform aggiorna lo state di conseguenza.

**Laboratorio pratico: spostare una risorsa in un modulo** _(stepTitle)_

1. Crea una configurazione semplice con `resource "local_file" "orphan" { ... }` ed esegui `terraform apply`.
2. Crea una directory `module` e sposta il blocco `local_file` nel modulo, cambiando l'indirizzo in `module.m.local_file.orphan`.
3. Aggiungi nel modulo root un blocco `moved` che associa il vecchio indirizzo al nuovo indirizzo nel modulo.
4. Esegui `terraform init` e poi `terraform plan` e verifica che non avvenga alcuna ricreazione.

---

## 7c.9: best practice per la gestione dei segreti e laboratorio

Terraform (e i provider) a volte fanno emergere segreti nei log, nello state o nella configurazione. Segui queste regole per ridurre il rischio:

- Contrassegna output e variabili come `sensitive = true` quando contengono segreti, così `terraform output` e l'output del plan non li stampano.
- Evita di scrivere segreti nei file `.tf` o in file sotto controllo di versione. Usa variabili d'ambiente, secret manager (Vault, AWS Secrets Manager, Azure Key Vault) o archivi di segreti della CI/CD.
- Non tenere abilitato `TF_LOG=TRACE/DEBUG` in produzione per lunghi periodi; i log possono contenere materiale delle credenziali. Se devi raccogliere log dettagliati per il troubleshooting, ruota subito dopo le credenziali.
- Usa backend remoti con cifratura a riposo (S3 con SSE, GCS, Azure Blob Storage) e limita l'accesso con ruoli IAM. Per maggiore sicurezza, abilita la cifratura lato server con chiavi gestite dal cliente.

**Laboratorio sui segreti: usare un secret manager** _(stepTitle)_

1. Memorizza un segreto in Vault o nel secret manager del tuo cloud provider.
2. Configura il provider per leggere il segreto a runtime (esempio specifico del provider: `data "vault_generic_secret" ...`).
3. Fai riferimento al segreto in resource/local, ma contrassegna come `sensitive = true` gli output che lo usano.
4. Esegui `terraform plan` e verifica che i segreti non compaiano nell'output del plan o di `terraform show`, a meno di richiederli esplicitamente con `-json` (da usare con cautela).

### Logging e segreti: indicazioni di sicurezza

- Evita di abilitare `TF_LOG=TRACE/DEBUG` in ambienti in cui segreti (chiavi API, client secret) potrebbero finire nei log. Richieste e risposte dei provider possono includere campi sensibili.
- In CI preferisci `TF_LOG=WARN` e salva i log come artefatto solo per le run fallite. Usa le funzionalità di oscuramento dei log del fornitore della CI per mascherare i pattern noti dei segreti.
- Se devi raccogliere log dettagliati per il supporto, ruota tutte le credenziali usate durante la sessione di debug e conserva i log in una posizione ad accesso limitato.

---

## Quiz

> Buona fortuna, divertiti e non dimenticare di fare debug mentre attraversi questa serie di domande!

**Domanda 1 (Vero/Falso)** _(stepTitle)_

Il blocco `import` può generare una configurazione Terraform completa per la risorsa importata usando il flag `-generate-config-out` durante `terraform plan`.

**Domanda 2 (scelta multipla)** _(stepTitle)_

Hai un'istanza EC2 esistente `i-abc123` che vuoi portare sotto la gestione di Terraform. Scrivi un blocco `resource "aws_instance" "managed"` e un blocco `import` con `id = "i-abc123"` e `to = aws_instance.managed`. Quale comando esegui per completare l'import?

- A. `terraform import`
- B. `terraform apply`
- C. `terraform plan -import`
- D. `terraform state push`

**Domanda 3 (Vero/Falso)** _(stepTitle)_

Dopo un import riuscito, puoi rimuovere il blocco `import` dalla configurazione e Terraform continuerà a gestire normalmente la risorsa.

**Domanda 4 (scelta multipla)** _(stepTitle)_

Quale comando CLI elenca tutte le risorse attualmente tracciate nello state file di Terraform?

- A. `terraform state show`
- B. `terraform show`
- C. `terraform state list`
- D. `terraform state pull`

**Domanda 5 (risposta multipla)** _(stepTitle)_

Quali dei seguenti sono sottocomandi validi di `terraform state`? (Selezionane **TRE**)

- A. `terraform state list`
- B. `terraform state read`
- C. `terraform state mv`
- D. `terraform state rm`
- E. `terraform state refresh`

**Domanda 6 (Vero/Falso)** _(stepTitle)_

`terraform state push` può sovrascrivere incondizionatamente lo state file remoto, senza alcun controllo di sicurezza.

**Domanda 7 (scelta multipla)** _(stepTitle)_

Qual è il livello di `TF_LOG` consigliato per catturare le informazioni dettagliate necessarie a una segnalazione di bug?

- A. `INFO`
- B. `DEBUG`
- C. `TRACE`
- D. `WARN`

**Domanda 8 (risposta multipla)** _(stepTitle)_

Quali delle seguenti variabili d'ambiente influenzano il comportamento del logging di Terraform? (Selezionane **DUE**)

- A. `TF_LOG`
- B. `TF_VAR_log_level`
- C. `TF_LOG_PATH`
- D. `TF_LOG_CONSOLE`

**Domanda 9 (Vero/Falso)** _(stepTitle)_

Il comando `terraform state show` può mostrare gli attributi di un data source se è presente nello state file.

**Domanda 10 (scelta multipla)** _(stepTitle)_

Vuoi importare più bucket S3 esistenti in un'unica configurazione Terraform. Qual è l'approccio migliore con Terraform 1.5+?

- A. Eseguire `terraform import` una volta per ogni bucket.
- B. Usare un blocco `import` con `for_each` e una risorsa di destinazione con `for_each`.
- C. Aggiungere a mano l'ID di ogni bucket allo state file con un editor di testo.
- D. Usare il comando `terraform state merge`.

**Domanda 11 (Vero/Falso)** _(stepTitle)_

Impostare `TF_LOG_PROVIDER=DEBUG` abilita il logging di debug per Terraform Core ma non per i provider.

**Domanda 12 (scelta multipla)** _(stepTitle)_

Cosa fa il comando `terraform state rm`?

- A. Distrugge la risorsa nel cloud e la rimuove dallo state.
- B. Rimuove la risorsa dallo state file senza distruggerla.
- C. Rinomina la risorsa nello state file.
- D. Sposta la risorsa in un altro state file.

**Domanda 13 (Vero/Falso)** _(stepTitle)_

Il blocco `import` supporta l'import di risorse nei moduli figli usando il formato di indirizzo `to = module.MODULE_NAME.RESOURCE_TYPE.NAME`.

**Domanda 14 (risposta multipla)** _(stepTitle)_

Quali dei seguenti sono limiti del blocco `import`? (Selezionane **DUE**)

- A. Non può importare risorse create da Terraform.
- B. Non rileva né aggiunge automaticamente le dipendenze tra risorse.
- C. Non tutti i tipi di risorsa dei provider supportano l'import.
- D. Richiede che la risorsa venga distrutta prima dell'import.

**Domanda 15 (Vero/Falso)** _(stepTitle)_

`terraform show -json` fornisce un output leggibile da macchina considerato un'interfaccia stabile e sicura per gli strumenti di produzione.

### Risposte

1. Vero — Il blocco `import` può generare una configurazione Terraform completa per la risorsa importata usando il flag `-generate-config-out` durante `terraform plan`. È una funzionalità moderna che ti aiuta a creare rapidamente una configurazione che corrisponde allo stato attuale della risorsa importata.
2. `terraform apply` (B) — Dopo aver definito il blocco `import`, esegui `terraform apply` per eseguire il processo di import. Il blocco `import` è dichiarativo e integrato nel workflow plan/apply, quindi non usi il vecchio comando `terraform import`.
3. Vero — Dopo un import riuscito, il blocco `import` ha esaurito il suo compito di portare la risorsa nello state. Puoi rimuoverlo dalla configurazione e Terraform continuerà a gestire normalmente la risorsa.
4. `terraform state list` (C) — Questo comando elenca tutti gli indirizzi di risorsa attualmente tracciati nello state file di Terraform. Mostra sia le managed resource sia i data source in cache.
5. `terraform state list`, `terraform state mv`, `terraform state rm` (A, C, D) — Sono sottocomandi validi di `terraform state`. `terraform state read` non è un comando valido; per leggere gli attributi di una risorsa si usa `terraform state show`. Neanche `terraform state refresh` è valido; per aggiornare lo state con i valori reali si usa `terraform refresh`.
6. Falso — `terraform state push` ha controlli di sicurezza che impediscono sovrascritture involontarie. Controlla i valori `lineage` e `serial` per assicurarsi che tu non stia caricando uno state obsoleto. Devi usare `-force` per aggirare questi controlli, cosa sconsigliata a meno che tu non ne sia certo.
7. `TRACE` (C) — Il livello di log `TRACE` fornisce le informazioni più dettagliate ed è consigliato per le segnalazioni di bug, per dare agli sviluppatori la migliore possibilità di diagnosticare il problema.
8. `TF_LOG`, `TF_LOG_PATH` (A, C) — Queste variabili d'ambiente controllano il comportamento del logging di Terraform. `TF_LOG` imposta il livello di log, mentre `TF_LOG_PATH` specifica un file in cui scrivere i log. `TF_VAR_log_level` non è una variabile d'ambiente valida per il logging e `TF_LOG_CONSOLE` non esiste.
9. Vero — Se un data source è presente nello state file (es. perché è stato messo in cache durante un plan), `terraform state show` può mostrarne gli attributi come per qualsiasi altra risorsa.
10. Usare un blocco import con for_each e una risorsa di destinazione con for_each (B) — È il modo più efficiente per importare più risorse in Terraform 1.5+. Puoi definire un unico blocco `import` che itera su una mappa di identificatori e indirizzi di risorsa, invece di eseguire comandi separati per ogni bucket.
11. Falso — Impostare `TF_LOG_PROVIDER=DEBUG` abilita il logging di debug per tutti i provider, ma non influisce sul logging di Terraform Core. Per abilitare il logging di debug di Terraform Core, imposteresti `TF_LOG=DEBUG`.
12. Rimuove la risorsa dallo state file senza distruggerla (B) — Il comando `terraform state rm` rimuove la risorsa specificata dallo state file, ma non distrugge la risorsa reale nel cloud. Può essere utile per "rendere orfana" una risorsa che vuoi gestire al di fuori di Terraform.
13. Vero — Il blocco `import` supporta l'import di risorse nei moduli figli usando il formato di indirizzo appropriato. Puoi specificare la destinazione come `to = module.MODULE_NAME.RESOURCE_TYPE.NAME` per importare direttamente nel blocco resource di un modulo. Il blocco `import` va comunque scritto nel modulo root.
14. Non rileva né aggiunge automaticamente le dipendenze, e non tutti i tipi di risorsa supportano l'import (B, C) — Il blocco `import` non analizza le relazioni o le dipendenze della risorsa, quindi devi aggiungere a mano eventuali `depends_on` o altri riferimenti necessari nella configurazione. Inoltre non tutti i tipi di risorsa di ogni provider supportano l'import, quindi controlla i limiti nella documentazione del provider.
15. Vero — Il formato JSON di `terraform show -json` (anche per i plan salvati) è documentato ufficialmente come "JSON Output Format": è versionato tramite il campo `format_version` e ha garanzie di compatibilità, quindi è adatto agli strumenti di produzione. L'avvertenza "non è un'interfaccia stabile" riguarda invece i log in JSON prodotti da `TF_LOG=JSON` (sezione 7c.5).

---

Hai fatto molta strada, da "che cos'è Terraform" a come mantenere l'infrastruttura con Terraform. Nel prossimo e ultimo obiettivo esploreremo HCP Terraform, il servizio Terraform gestito di HashiCorp che offre funzionalità aggiuntive per collaborazione, governance e automazione.

Passiamo all'**Obiettivo 8: usare HCP Terraform**, l'ultimo obiettivo della certificazione Associate.
