# Usare HCP Terraform

_Arriviamo all'ultimo obiettivo: Obiettivo 8, usare HCP Terraform. È qui che le tue competenze Terraform vengono amplificate da una piattaforma che risolve problemi di collaborazione, governance e operatività. HCP Terraform (in precedenza Terraform Cloud) è il SaaS di HashiCorp per Terraform. Le sue funzionalità sono verificate direttamente nell'esame Associate._

## Usare HCP Terraform per creare infrastruttura

*Fonti: [Workspaces](https://developer.hashicorp.com/terraform/cloud-docs/workspaces), [HCP Terraform Workflow](https://developer.hashicorp.com/terraform/cloud-docs/overview#terraform-workflow), [HCP Terraform Overview](https://developer.hashicorp.com/terraform/cloud-docs), [Remote Operations](https://developer.hashicorp.com/terraform/cloud-docs/run/remote-operations), [HCP Terraform Get Started Collection](https://developer.hashicorp.com/terraform/tutorials/cloud-get-started)*

### 8a.1: che cos'è HCP Terraform?

HCP Terraform è un'applicazione gestita che aiuta i team a usare Terraform insieme. Invece di eseguire Terraform sul tuo portatile e conservare lo state in un bucket S3 condiviso (che devi configurare e gestire da solo), HCP Terraform fornisce:

- **Archiviazione remota dello state** – cifrata a riposo, versionata automaticamente.
- **Esecuzione remota** – `plan` e `apply` di Terraform girano sui server di HCP Terraform, non sulla tua macchina locale.
- **Collaborazione di team** – controllo degli accessi basato sui ruoli, applicazione delle policy, notifiche.
- **Registry privato dei moduli** – condividi e versiona i moduli all'interno della tua organizzazione.
- **Stima dei costi** – vedi l'impatto sui costi di un piano prima di applicarlo.
- **Policy as Code** – imponi la conformità con Sentinel o OPA.
- **Rilevamento del drift e validazione continua** – rileva automaticamente il drift dell'infrastruttura.

### 8a.2: il core workflow in HCP Terraform

La sezione `Remote operations` della guida descrive come funzionano le run:

Una **run** è una singola operazione di `plan` con eventuale `apply` in un workspace. Le run possono essere avviate da:

- **Webhook del VCS** – un push su un branch attiva una run.
- **UI** – clic su "Start new run".
- **API** – integrazione programmatica.
- **Integrazione CLI** – `terraform plan` e `terraform apply` dal tuo terminale locale, eseguiti in remoto.

**Fasi di una run** _(stepTitle)_

1. **Pending** – in coda, in attesa che finiscano altre run.
2. **Planning** – Terraform genera un piano.
3. **Policy Check** – le policy Sentinel/OPA vengono valutate sul piano.
4. **Awaiting Approval** – l'utente rivede e approva il piano.
5. **Applying** – Terraform esegue le modifiche.
6. **Completed** – risorse create, state aggiornato.

### 8a.3: operazioni remote vs. esecuzione locale

Un workspace può essere configurato con una delle due modalità di esecuzione:

- **Remote** – `plan` e `apply` girano sull'infrastruttura di HCP Terraform. Abilita tutte le funzionalità della piattaforma: applicazione delle policy, stima dei costi, notifiche, archiviazione sicura delle variabili.
- **Local** – HCP Terraform funge solo da backend per lo state, in modo simile a S3. Tutti i comandi Terraform girano sulla tua macchina locale. Alcune funzionalità non sono disponibili (applicazione delle policy, stima dei costi, cronologia delle run).

Scegli la modalità di esecuzione quando crei un workspace.

### 8a.4: collegare una configurazione a HCP Terraform

Per usare HCP Terraform dalla CLI, aggiungi un blocco `cloud` alla configurazione `terraform`:

```hcl
# Il blocco terraform configura Terraform stesso.
terraform {
  # Il blocco cloud sostituisce il blocco backend. Collega la configurazione
  # direttamente a un'organizzazione e a un workspace di HCP Terraform.
  cloud {
    # 'organization' identifica l'organizzazione HCP Terraform da usare.
    # L'organizzazione deve già esistere in HCP Terraform.
    organization = "my-company"

    # 'workspaces' specifica a quale/i workspace appartiene questa configurazione.
    # Puoi usare un singolo nome oppure un insieme di tag.
    workspaces {
      # 'name' è il nome esatto del workspace. Il workspace verrà creato
      # automaticamente durante terraform init se non esiste già.
      name = "my-app-prod"
    }
  }
}
```

**Spiegazione** _(stepTitle)_

- `terraform {` – apre il blocco di configurazione di primo livello per Terraform stesso.
- `cloud {` – inizia la configurazione della connessione a HCP Terraform. Si esclude a vicenda con un blocco `backend`; non puoi averli entrambi.
- `organization = "my-company"` – il nome della tua organizzazione HCP Terraform. È il raggruppamento di livello più alto per workspace, team e impostazioni.
- `workspaces {` – definisce a quale/i workspace corrisponde questa configurazione.
- `name = "my-app-prod"` – usa un singolo workspace con questo nome esatto. Quando esegui `terraform init`, Terraform creerà il workspace se non esiste.

**Alternativa: usare i tag invece di un singolo nome** _(stepTitle)_

```hcl
terraform {
  cloud {
    organization = "my-company"
    workspaces {
      # 'tags' è una lista di stringhe. La configurazione verrà associata
      # a TUTTI i workspace che hanno TUTTI questi tag.
      tags = ["app:web", "env:production"]
    }
  }
}
```

**Spiegazione** _(stepTitle)_

- `tags = ["app:web", "env:production"]` – quando usi i tag, la stessa configurazione può applicarsi a più workspace. HCP Terraform trova i workspace che hanno tutti i tag elencati. È utile quando vuoi riusare la stessa configurazione tra ambienti (dev, staging, prod) ma con valori di variabili diversi per ogni workspace.

---

### 8a.5: autenticarsi con HCP Terraform

Prima di poter usare il blocco `cloud`, devi autenticare la CLI presso HCP Terraform.

```bash
# Questo comando apre un browser per effettuare il login e genera un token API.
terraform login
```

**Cosa fa terraform login** _(stepTitle)_

1. Apre il browser su `app.terraform.io`.
2. Effettui il login (o confermi di essere già autenticato).
3. HCP Terraform genera un token API.
4. La CLI di Terraform salva il token in `~/.terraform.d/credentials.tfrc.json`.

**Alternativa per l'automazione** _(stepTitle)_

Imposta la variabile d'ambiente `TF_TOKEN_app_terraform_io` (formato `TF_TOKEN_<hostname>`, con i punti del nome host sostituiti da trattini bassi). `TFE_TOKEN` è invece la variabile usata dal provider `tfe` e da altri strumenti, come le chiamate API dirette.

```bash
export TF_TOKEN_app_terraform_io="your-api-token-here"
```

### 8a.6: workflow di run guidato dalla CLI

Con il blocco `cloud` configurato e l'autenticazione impostata, puoi usare il workflow standard della CLI di Terraform. Comandi come `terraform plan` e `terraform apply` vengono **eseguiti in remoto**.

```bash
terraform init        # Crea il workspace se serve, configura lo state remoto
terraform plan        # Genera un piano speculativo in remoto, ma NON mette in coda una run
terraform apply       # Mette in coda una run nel workspace; il piano viene generato e applicato in remoto
```

**Differenze di comportamento principali rispetto a Terraform locale** _(stepTitle)_

- `terraform plan` produce un **piano speculativo**: mostra cosa succederebbe ma non blocca il workspace né mette in coda una run. Non serve alcuna approvazione.
- `terraform apply` mette in coda una run in HCP Terraform, trasmette l'output del piano al tuo terminale e attende la tua conferma. L'`apply` vero e proprio viene eseguito sui server di HCP Terraform.
- Puoi usare anche i piani salvati: `terraform plan -out=tfplan` salva il piano, poi `terraform apply tfplan` applica in remoto esattamente quel piano.

---

### 8a.7: laboratorio pratico: workflow guidato dalla CLI (concettuale)

Dato che HCP Terraform richiede un account, ripercorreremo i passi a livello concettuale. (Se hai un account HCP Terraform gratuito, puoi seguirli davvero.)

**Passo 1: creare o usare un'organizzazione HCP Terraform esistente** _(stepTitle)_

- Registrati su `app.terraform.io`.
- Crea un'organizzazione (es. `my-associate-lab`).

**Passo 2: configurare il progetto Terraform** _(stepTitle)_

```hcl
# main.tf
terraform {
  cloud {
    organization = "my-associate-lab"
    workspaces {
      name = "obj8a-workspace"
    }
  }
}

# Una risorsa semplice che crea una stringa casuale: nessuna credenziale cloud necessaria.
resource "random_pet" "demo" {
  length = 2
}
```

**Passo 3: eseguire il workflow** _(stepTitle)_

```bash
terraform login                                      # Autenticazione su HCP Terraform
terraform init                                       # Crea obj8a-workspace nella tua org
terraform plan                                       # Piano speculativo remoto
terraform apply                                      # Mette in coda e applica una run in remoto
```

**Passo 4: osservare nella UI di HCP Terraform** _(stepTitle)_

- Vai al tuo workspace `obj8a-workspace`.
- Guarda la scheda Runs: vedrai la run completata.
- Guarda la scheda States: lo state file è conservato lì, cifrato.

---

### 8a.8: Mini-quiz: usare HCP Terraform per creare infrastruttura

1. Vero/Falso: usando HCP Terraform con il workflow guidato dalla CLI, `terraform apply` viene eseguito di default in locale sulla tua macchina.
2. Scelta multipla: quale blocco in `terraform {}` si usa per collegare una configurazione Terraform a HCP Terraform?
  - A. `backend "remote"`
  - B. `cloud`
  - C. `cloud_backend`
  - D. `tfe`
3. Risposta multipla: quali dei seguenti possono avviare una run in un workspace HCP Terraform? (Selezionane QUATTRO)
  - A. Fare push di codice su un repository VCS collegato.
  - B. Eseguire `terraform plan` in locale.
  - C. Cliccare "Start new run" nella UI.
  - D. Eseguire `terraform apply` in locale con il blocco cloud configurato.
  - E. Usare l'API di HCP Terraform.

**Risposte** _(stepTitle)_

1. Falso. Con il blocco `cloud` configurato, `terraform apply` mette in coda una run che viene eseguita in remoto sull'infrastruttura di HCP Terraform.
2. B. Per collegarsi a HCP Terraform si usa il blocco `cloud`. Il blocco `backend "remote"` è la sintassi più vecchia solo per lo state remoto, non l'integrazione completa con HCP Terraform.
3. A, C, D, E. Tutte queste possono avviare una run. `terraform plan` non avvia una run: genera un piano speculativo (eseguito anch'esso in remoto) senza mettere nulla in coda.

## Descrivere le funzionalità di collaborazione e governance di HCP Terraform

*Fonti: [Explorer](https://developer.hashicorp.com/terraform/cloud-docs/workspaces/explorer), [HCP Private Registry Overview](https://developer.hashicorp.com/terraform/cloud-docs/registry), [Change Requests Overview](https://developer.hashicorp.com/terraform/cloud-docs/workspaces/change-requests), [HCP Terraform Policy Enforcement](https://developer.hashicorp.com/terraform/cloud-docs/policy-enforcement), [Projects Overview](https://developer.hashicorp.com/terraform/cloud-docs/projects), [Health](https://developer.hashicorp.com/terraform/cloud-docs/workspaces/health), [HCP Terraform Teams](https://developer.hashicorp.com/terraform/cloud-docs/users-teams-organizations/teams), [Authenticate Providers with Dynamic Credentials](https://developer.hashicorp.com/terraform/tutorials/cloud/dynamic-credentials), [Drift Detection](https://developer.hashicorp.com/terraform/tutorials/cloud/drift-detection), [Variable Sets](https://developer.hashicorp.com/terraform/tutorials/cloud/cloud-multiple-variable-sets), [Detect Drift and Enforce Policies](https://developer.hashicorp.com/terraform/tutorials/cloud/drift-and-policy), [Enforce OPA Policies](https://developer.hashicorp.com/terraform/tutorials/cloud/validation-enforcement)*

### 8b.1: team e controllo degli accessi basato sui ruoli (RBAC)

HCP Terraform ti permette di creare team di utenti e assegnare loro permessi a livello di organizzazione, progetto e workspace.

**I permessi dei team sono cumulativi**: un utente ottiene il livello di accesso più alto tra tutti i team a cui appartiene.

**Permessi a livello di organizzazione** _(stepTitle)_

- `Manage all workspaces` – controllo completo su tutti i workspace.
- `Manage all projects` – controllo completo sui progetti.
- `View all workspaces` – accesso in sola lettura ai dati dei workspace.

**Permessi a livello di progetto** _(stepTitle)_

- `Admin` – gestisce il progetto e tutti i workspace al suo interno.
- `Maintain` – crea e gestisce workspace all'interno del progetto, ma non il progetto stesso.
- `Write` – effettua il provisioning dell'infrastruttura (mette in coda plan, applica) ma non gestisce le impostazioni dei workspace.
- `Read` – visualizza solo i dati dei workspace.

**Permessi specifici del workspace** _(stepTitle)_

- `Admin` – controllo completo su quel workspace.
- `Read and write` – gestisce le variabili, mette in coda plan, applica.
- `Read` – sola visualizzazione.

### 8b.2: Policy as Code: Sentinel e OPA

HCP Terraform può imporre regole prima che un piano Terraform venga applicato. Definisci policy che controllano barriere di sicurezza, conformità o costo.

**Sentinel** è il linguaggio di policy di HashiCorp. **OPA** (Open Policy Agent) è uno standard CNCF. Ne scegli uno per ogni policy set.

**Livelli di applicazione delle policy** _(stepTitle)_

| Livello | Comportamento |
|---|---|
| `hard-mandatory` | Il piano non può essere applicato se la policy fallisce. La run si ferma. |
| `soft-mandatory` | Il piano non può essere applicato a meno che un utente autorizzato non scavalchi il fallimento (override). |
| `advisory` | Il fallimento viene mostrato come avviso ma la run può proseguire. |

I **policy set** sono raccolte di policy. Possono provenire da un repository VCS o essere caricati tramite API. Si possono applicare a workspace specifici, a progetti o all'intera organizzazione.

I tre livelli della tabella valgono per Sentinel. Per le policy OPA i livelli sono `mandatory` (equivalente a soft-mandatory, con override possibile) e `advisory`; `hard-mandatory` esiste solo per Sentinel.

### 8b.3: change request

Le change request permettono di registrare azioni da svolgere direttamente su un workspace, come "aggiornare la versione deprecata del modulo" o "rivedere le regole del security group". Questo crea un backlog di attività legate all'infrastruttura.

### 8b.4: notifiche

I workspace possono inviare notifiche (via Slack, email, webhook) per gli eventi delle run: run avviata, run completata, run in errore, fallimenti delle policy, drift rilevato.

### 8b.5: Explorer per la visibilità sui workspace

L'Explorer offre un'interfaccia interrogabile su workspace, moduli, provider e versioni di Terraform della tua organizzazione. Puoi rispondere a domande come "Quali workspace usano ancora Terraform 1.0?" o "Quali workspace hanno drift?"

### 8b.6: registry privato dei moduli (pubblicare moduli)

Il registry privato di HCP Terraform permette alla tua organizzazione di pubblicare moduli da riutilizzare. Passi ad alto livello:

1. Crea un repository VCS che contiene il tuo modulo, con un nome nel formato `terraform-<PROVIDER>-<NAME>` (es. `terraform-aws-my-module`) richiesto per la pubblicazione tramite tag, e includi un `README.md`.
2. Tagga le release con versioni semantiche (es. `v1.0.0`).
3. Nella UI di HCP Terraform, vai su Registry → Publish Module e collega il repo VCS.
4. Aggiungi un vincolo di versione nella configurazione che consuma il modulo, oppure usa la sorgente del registry `app.terraform.io/my-org/my-module/aws`.

**Best practice** _(stepTitle)_

- Usa il versionamento semantico e i changelog.
- Mantieni i moduli piccoli e focalizzati (una sola responsabilità).
- Includi esempi e documentazione di input/output.
- Usa un job di CI per eseguire `terraform validate` e `tflint` sui branch dei moduli prima della pubblicazione.

---

### 8b.7: Mini-quiz: collaborazione e governance in HCP Terraform

1. Vero/Falso: in HCP Terraform un utente può essere membro di più team, e i suoi permessi effettivi sono l'unione dei permessi di tutti i team.
2. Scelta multipla: quale livello di applicazione delle policy impedisce l'applicazione di una run a meno che un utente autorizzato non fornisca un override?
  - A. `advisory`
  - B. `hard-mandatory`
  - C. `soft-mandatory`
  - D. `warning`
3. Risposta multipla: quali delle seguenti sono funzionalità di collaborazione fornite da HCP Terraform? (Selezionane QUATTRO)
  - A. Team e controllo degli accessi basato sui ruoli
  - B. Applicazione delle policy con Sentinel/OPA
  - C. Generazione automatica del codice sorgente applicativo
  - D. Change request sui workspace
  - E. Registry privato dei moduli

**Risposte** _(stepTitle)_

1. Vero — Gli utenti possono appartenere a più team e ricevono l'unione dei permessi di quei team.
2. C (`soft-mandatory`) — `soft-mandatory` richiede un override autorizzato per consentire un apply quando la policy fallisce.
3. A, B, D, E — Team/RBAC, applicazione delle policy, change request e registry privato dei moduli sono funzionalità di collaborazione. (C è errata.)

## Descrivere come organizzare e usare workspace e progetti di HCP Terraform

*Fonti: [Run Triggers](https://developer.hashicorp.com/terraform/cloud-docs/workspaces/settings/run-triggers), [Variable Sets](https://developer.hashicorp.com/terraform/cloud-docs/workspaces/variables/managing-variables#variable-sets), [Projects Overview](https://developer.hashicorp.com/terraform/cloud-docs/projects), [Connect Workspaces with Run Triggers](https://developer.hashicorp.com/terraform/tutorials/cloud/cloud-run-triggers), [Organize Workspaces with Projects](https://developer.hashicorp.com/terraform/tutorials/cloud/projects)*

### 8c.1: workspace

Un workspace è l'unità di organizzazione principale. Contiene tutto ciò che serve per gestire un insieme di infrastruttura:

- Versione della configurazione (i file `.tf`).
- State file (cifrato, versionato).
- Variabili (Terraform e d'ambiente).
- Cronologia delle run.
- Impostazioni (modalità di esecuzione, auto-apply, notifiche).

**Workspace di HCP Terraform vs. workspace della CLI di Terraform** _(stepTitle)_

- I **workspace della CLI** sono state file alternativi all'interno della stessa directory, gestiti con `terraform workspace select`. Servono ad applicare la stessa configurazione a più ambienti (dev/staging/prod).
- I **workspace di HCP Terraform** sono completamente indipendenti. Possono avere configurazioni, variabili e modalità di esecuzione del tutto diverse. Sono analoghi a directory di lavoro separate nel mondo della CLI.

**Convenzioni di nome dei workspace:** usa nomi strutturati come `networking-prod-us-east` o `app-feature-a` per identificare componente, ambiente e regione.

### 8c.2: progetti

I progetti sono contenitori di workspace. Ti permettono di raggruppare workspace correlati e assegnare permessi a livello di progetto.

**Progetto predefinito:** ogni organizzazione ne ha uno. Tutti i workspace appartengono a un progetto.

**Organizzare con i progetti:** potresti creare progetti per diverse unità di business (`platform`, `application`) o per ambienti (`production`, `development`). Ai team si possono concedere permessi su un intero progetto, che si propagano a tutti i workspace al suo interno.

**Variable set con ambito di progetto:** puoi applicare variable set a un progetto, così tutti i workspace attuali e futuri li ereditano automaticamente.

### 8c.3: variable set

I variable set sono raccolte riutilizzabili di variabili che puoi applicare a più workspace. Possono avere ambito globale (tutti i workspace dell'organizzazione), su progetti specifici o su workspace specifici.

**Precedenza (dalla più alta alla più bassa)** _(stepTitle)_

1. Variable set prioritario
2. Variabile specifica del workspace
3. Variable set applicato al workspace: un set con ambito di progetto prevale su un set globale; a parità di ambito vince il set con il nome lessicalmente "più basso"
4. Variabile d'ambiente `TF_VAR_*`
5. Valore di default nel blocco `variable`

**Nota:** i variable set prioritari (introdotti in aggiornamenti recenti di Terraform Cloud) prevalgono sulle variabili specifiche del workspace e sui variable set non prioritari. Usali con parsimonia per gli override a livello di organizzazione.

### 8c.4: run trigger

I run trigger mettono automaticamente in coda una run in un workspace "a valle" quando un workspace "sorgente" completa con successo un apply. Questo abilita pipeline di infrastruttura.

```hcl
# Il workspace A (network) crea VPC e subnet.
# Il workspace B (application) ha bisogno dell'ID della VPC da A.

# Nel workspace B configuri un run trigger che punta al workspace A.
# Ogni volta che il workspace A completa con successo un apply, viene messa in coda una nuova run nel workspace B.
```

I run trigger si configurano nella UI di HCP Terraform o tramite API, non nei file di configurazione Terraform.

### 8c.5: health assessment

Gli health assessment comprendono:

- **Rilevamento del drift:** confronta l'infrastruttura reale con lo state file.
- **Validazione continua:** rivaluta i blocchi `check` e le condizioni.

Vengono eseguiti automaticamente secondo una pianificazione (di default ogni 24 ore) e si possono avviare su richiesta.

---

### 8c.6: laboratorio pratico: organizzare con progetti e workspace (concettuale)

Dato che richiede permessi di amministratore su HCP Terraform, ripercorreremo i passi logici:

1. **Creare i progetti:** nella UI vai su Projects → New Project. Crea i progetti `platform` e `application`.
2. **Creare i workspace:** nel progetto `platform` crea un workspace `networking-prod`. In `application` crea `app-prod`. Collegali ai rispettivi repository VCS.
3. **Configurare i variable set:** crea un variable set `AWS Credentials` con ambito sull'organizzazione (globale). Creane un altro, `App Config`, con ambito sul progetto `application` e variabili come `instance_type = "t3.medium"`.
4. **Impostare il run trigger:** in `app-prod`, aggiungi un run trigger da `networking-prod`. Ora, quando le modifiche al networking vengono applicate, `app-prod` mette automaticamente in coda una run.
5. **Osservare gli health assessment:** abilita gli assessment su `app-prod`. Avvia un assessment su richiesta.

### 8c.7: Mini-quiz 8c

1. Vero/Falso: i workspace di HCP Terraform funzionano in modo identico ai workspace della CLI creati con `terraform workspace new`.
2. Scelta multipla: qual è l'ambito massimo di un variable set?
  - A. Un singolo workspace.
  - B. Un singolo progetto.
  - C. L'intera organizzazione (globale).
  - D. Una singola run di Terraform.
3. Risposta multipla: quali delle seguenti funzionalità fornisce HCP Terraform per organizzare i workspace? (Selezionane DUE)
  - A. Progetti
  - B. Moduli
  - C. Variable set
  - D. Data source

**Risposte** _(stepTitle)_

1. Falso. I workspace di HCP Terraform sono completamente indipendenti e possono avere configurazioni, variabili e modalità di esecuzione diverse. I workspace della CLI sono state file alternativi all'interno della stessa directory di configurazione.
2. C. Un variable set può avere ambito su un singolo workspace, su un progetto o sull'intera organizzazione (globale). Non esiste un ambito di variable set limitato a una singola run di Terraform.
3. A, C. HCP Terraform fornisce i progetti per raggruppare i workspace e i variable set per gestire le variabili su più workspace. Moduli e data source sono concetti della configurazione Terraform, non funzionalità organizzative di HCP Terraform.

## Configurare e usare l'integrazione con HCP Terraform

*Fonti: Connect to HCP Terraform, Migrate state to HCP Terraform, terraform login command, Dynamic provider credentials*

### 8d.1: integrazione con la CLI (blocco cloud e terraform login)

Abbiamo visto il blocco `cloud` in 8a. Consolidiamo il percorso di migrazione.

**Scenario: migrare da uno state locale a HCP Terraform** _(stepTitle)_

1. Hai un progetto Terraform esistente con uno state file locale.
2. Aggiungi il blocco `cloud` (come mostrato in 8a) con il nome dell'organizzazione e del workspace.
3. Esegui `terraform init`. Terraform rileva la migrazione dello state e chiede: "Do you want to copy existing state to the new cloud backend?" Digita `yes`.
4. Il tuo state locale viene caricato su HCP Terraform. Il file locale `terraform.tfstate` non viene più usato.
5. Esegui `terraform plan` e `terraform apply`: ora vengono eseguiti in remoto.

### 8d.2: il blocco cloud nel dettaglio

```hcl
terraform {
  cloud {
    # 'hostname' è facoltativo. Il default è 'app.terraform.io'.
    # Impostalo su un valore personalizzato se usi Terraform Enterprise.
    hostname = "app.terraform.io"

    # 'organization' è obbligatorio (a meno di impostarlo con TF_CLOUD_ORGANIZATION).
    organization = "my-org"

    # 'workspaces' è obbligatorio (a meno di selezionare il workspace con TF_WORKSPACE).
    workspaces {
      # Si può specificare solo uno tra 'name' e 'tags'.
      name = "my-workspace"
    }
  }
}
```

**Spiegazione** _(stepTitle)_

- `hostname = "app.terraform.io"` — l'indirizzo della tua istanza HCP Terraform. Per il SaaS è sempre `app.terraform.io`. Per Terraform Enterprise (self-hosted) indicheresti il nome host personalizzato della tua azienda.
- `organization = "my-org"` — il nome univoco della tua organizzazione HCP Terraform.
- `workspaces { name = "my-workspace" }` — specifica un singolo workspace. Terraform lo creerà durante `init` se non esiste.

**Override tramite variabili d'ambiente** _(stepTitle)_

Invece di scrivere i valori nel codice, puoi usare variabili d'ambiente. Questo permette di usare la stessa configurazione con organizzazioni o istanze di Terraform Enterprise diverse senza modificare il codice.

| Variabile d'ambiente | Sovrascrive |
|---|---|
| `TF_CLOUD_ORGANIZATION` | `organization` |
| `TF_CLOUD_HOSTNAME` | `hostname` |
| `TF_WORKSPACE` | Nome del workspace quando si usano i tag |

**Esempio di configurazione guidata dall'ambiente** _(stepTitle)_

```hcl
# Nessuna organizzazione o workspace scritti nel codice: arrivano dall'ambiente.
terraform {
  cloud {
    # 'organization' è omesso: va impostato con la variabile d'ambiente TF_CLOUD_ORGANIZATION.
    # 'workspaces' è omesso: il singolo workspace viene selezionato con TF_WORKSPACE.
    # Un blocco cloud vuoto con solo questi override offre la massima flessibilità.
  }
}
```

### 8d.3: credenziali dinamiche dei provider

È una funzionalità di sicurezza importante. Invece di memorizzare credenziali cloud a lunga durata come variabili del workspace, puoi configurare una relazione di fiducia tra HCP Terraform e il tuo cloud provider (AWS, Azure, GCP, Vault).

**Come funziona** _(stepTitle)_

1. Configuri una relazione di fiducia OIDC nel tuo cloud provider.
2. HCP Terraform genera un token di identità del workload per ogni run.
3. Il cloud provider verifica il token ed emette credenziali a breve durata.
4. Terraform usa queste credenziali per la run.
5. Le credenziali scadono dopo la run; nessun segreto a lunga durata viene memorizzato.

**Esempio di configurazione (variabili del workspace)** _(stepTitle)_

```hcl
# Nessuna credenziale nella configurazione! Impostale come variabili d'ambiente del workspace:
TFC_AWS_PROVIDER_AUTH = 1
TFC_AWS_RUN_ROLE_ARN   = "arn:aws:iam::123456789:role/tfc-role"
```

**Spiegazione** _(stepTitle)_

- `TFC_AWS_PROVIDER_AUTH = 1` — dice a HCP Terraform di usare le credenziali dinamiche per il provider AWS.
- `TFC_AWS_RUN_ROLE_ARN` — l'ARN del ruolo IAM che HCP Terraform deve assumere.

**Nota importante:** le credenziali dinamiche eliminano la necessità di memorizzare chiavi di accesso AWS come variabili del workspace. Forniscono credenziali a breve durata, per singola run.

### 8d.4: escludere file dal caricamento

Con l'esecuzione remota, HCP Terraform carica la directory della configurazione. Puoi creare un file `.terraformignore` per escludere dei file (come `.git/`, `.terraform/`, state file locali, segreti).

```txt
# .terraformignore
.git/
*.tfstate
*.tfvars
```

### 8d.5: laboratorio pratico: configurare le credenziali dinamiche (concettuale)

Ripercorreremo a livello concettuale la configurazione su AWS.

1. **Crea un provider OIDC in AWS** che consideri attendibile l'endpoint OIDC di HCP Terraform (`app.terraform.io`).
2. **Crea un ruolo IAM** con una trust policy che permetta ad `app.terraform.io` di assumerlo, limitata alla tua organizzazione e al tuo workspace.
3. **Associa una policy IAM** al ruolo che conceda i permessi (es. accesso completo a EC2).
4. **Nelle variabili del workspace HCP Terraform**, imposta:
  - `TFC_AWS_PROVIDER_AUTH` = `1`
  - `TFC_AWS_RUN_ROLE_ARN` = l'ARN del ruolo IAM.
5. **Nessuna credenziale AWS** viene memorizzata come variabile del workspace. Terraform ottiene credenziali temporanee per ogni run.

### 8d.6: esempio API: mettere in coda una run (curl)

Puoi mettere in coda run da programma tramite la Runs API di HCP Terraform. Esempio (sostituisci i segnaposto):

```bash
curl --header "Authorization: Bearer ${TFE_TOKEN}" \
  --header "Content-Type: application/vnd.api+json" \
  --data '{"data":{"attributes":{"is-destroy":false,"message":"API triggered run"},"type":"runs","relationships":{"workspace":{"data":{"type":"workspaces","id":"<WORKSPACE_ID>"}}}}}' \
  https://app.terraform.io/api/v2/runs
```

L'API restituisce un oggetto run; segui lo stato dell'`apply` oppure usa l'endpoint Runs per interrogarne l'avanzamento.

Riferimento: documentazione API di HCP Terraform per le run.

### 8d.7: comandi di migrazione e best practice

Quando migri lo state su HCP Terraform o cambi backend, preferisci questi passi sicuri:

1. Fai un backup dello state locale: `cp terraform.tfstate terraform.tfstate.backup` (o scaricalo dal backend remoto).
2. Aggiungi il blocco `cloud` alla configurazione.
3. Esegui `terraform init`: Terraform chiederà di copiare lo state nel cloud backend.
4. In alternativa, usa `terraform init -migrate-state` per migrare esplicitamente lo state quando cambi la configurazione del backend (`-reconfigure` invece ignora lo state esistente e non lo migra).
5. Dopo la migrazione, esegui `terraform plan` per verificare.

Note:

- Prova la migrazione prima su una copia del workspace.
- Assicurati che token della CI e ACL siano configurati correttamente per l'accesso al workspace prima di migrare.

### 8d.8: esempio minimo di policy (OPA / Rego)

Ecco un piccolo esempio in Rego che nega la creazione di un bucket S3 con `acl = "public-read"`:

```rego
package hcp.policies

deny[msg] {
  change := input.plan.resource_changes[_]
  change.type == "aws_s3_bucket"
  change.change.after.acl == "public-read"
  msg = sprintf("S3 bucket %v would be public", [change.address])
}
```

Per Sentinel, la policy equivalente ispezionerebbe i valori pianificati della run e restituirebbe `false` quando rileva una ACL pubblica. Vedi la documentazione HashiCorp per esempi completi.

---

### 8d.9: Mini-quiz 8d

1. Vero/Falso: il blocco `cloud` può coesistere con un blocco `backend` nella stessa configurazione `terraform {}`.
2. Scelta multipla: quale variabile d'ambiente sovrascrive il valore `organization` in un blocco `cloud`?
  - A. `TF_CLOUD_ORGANIZATION`
  - B. `TF_ORGANIZATION`
  - C. `TF_WORKSPACE`
  - D. `TF_CLOUD_HOSTNAME`
3. Risposta multipla: quali dei seguenti elementi sono necessari per usare credenziali AWS dinamiche in HCP Terraform? (Selezionane DUE)
  - A. Un ruolo IAM con una relazione di fiducia verso l'endpoint OIDC di HCP Terraform.
  - B. Un blocco `provider "aws"` con credenziali scritte nel codice.
  - C. La variabile del workspace `TFC_AWS_PROVIDER_AUTH` impostata a `1`.
  - D. Un backend S3 configurato per l'archiviazione dello state.

**Risposte** _(stepTitle)_

1. Falso. Il blocco `cloud` si esclude a vicenda con un blocco `backend`. Non puoi averli entrambi nella stessa configurazione.
2. A. La variabile d'ambiente `TF_CLOUD_ORGANIZATION` sovrascrive il valore `organization` nel blocco `cloud`. Le altre opzioni non sono corrette per questo scopo.
3. A, C. Per usare credenziali AWS dinamiche servono un ruolo IAM con una relazione di fiducia verso l'endpoint OIDC di HCP Terraform e la variabile del workspace `TFC_AWS_PROVIDER_AUTH` impostata a `1`. Non servono credenziali scritte nel codice né un backend S3 per questa funzionalità.

## Quiz

**Domanda 1 (Vero/Falso)** _(stepTitle)_

Quando esegui `terraform apply` con un blocco `cloud` configurato, la CLI di Terraform esegue il piano in locale e carica su HCP Terraform solo lo state.

**Domanda 2 (scelta multipla)** _(stepTitle)_

Quale funzionalità di HCP Terraform permette di definire raccolte riutilizzabili di variabili e applicarle a più workspace?

- A. Variable set
- B. Progetti
- C. Policy set
- D. Run trigger

**Domanda 3 (risposta multipla)** _(stepTitle)_

Quali dei seguenti sono modi validi per avviare una run in un workspace HCP Terraform? (Selezionane **QUATTRO**)

- A. Fare il merge di una pull request sul branch main in un workspace collegato al VCS.
- B. Cliccare "Start new run" nella UI del workspace.
- C. Eseguire `terraform apply` sulla macchina locale con un blocco `cloud` configurato.
- D. Usare la Runs API di HCP Terraform.
- E. Eseguire `terraform plan` sulla macchina locale.

**Domanda 4 (Vero/Falso)** _(stepTitle)_

I workspace di HCP Terraform sono identici ai workspace della CLI di Terraform e servono allo stesso scopo: gestire più state file per un'unica configurazione.

**Domanda 5 (scelta multipla)** _(stepTitle)_

Vuoi una policy che blocchi qualsiasi run di Terraform che crei un bucket S3 con accesso in lettura pubblico. La policy deve impedire l'apply a meno che un amministratore della sicurezza non la scavalchi esplicitamente. Quale livello di applicazione dovresti usare?

- A. `advisory`
- B. `hard-mandatory`
- C. `soft-mandatory`
- D. `warning`

**Domanda 6 (scelta multipla)** _(stepTitle)_

Quale elemento si usa per escludere determinati file dal caricamento su HCP Terraform durante l'esecuzione remota?

- A. `.gitignore`
- B. `.terraformignore`
- C. `terraform.ignore`
- D. Blocco `exclude` in `terraform {}`

**Domanda 7 (Vero/Falso)** _(stepTitle)_

Un progetto in HCP Terraform può contenere più workspace, e i permessi di un utente su un progetto si applicano automaticamente a tutti i workspace al suo interno.

**Domanda 8 (risposta multipla)** _(stepTitle)_

Quali delle seguenti informazioni fornisce l'Explorer di HCP Terraform? (Selezionane **DUE**)

- A. Un elenco dei workspace che hanno drift di configurazione.
- B. Il costo di mercato attuale di tutte le risorse cloud.
- C. Le versioni dei provider più usate nei workspace.
- D. Il codice sorgente esatto di ogni modulo.

**Domanda 9 (scelta multipla)** _(stepTitle)_

Qual è il vantaggio principale delle credenziali dinamiche dei provider rispetto alle credenziali statiche memorizzate come variabili del workspace?

- A. Sono più facili da ruotare a mano.
- B. Eliminano la necessità di memorizzare segreti a lunga durata in HCP Terraform.
- C. Funzionano con tutti i provider Terraform senza configurazione aggiuntiva.
- D. Vengono cifrate automaticamente negli state file.

**Domanda 10 (Vero/Falso)** _(stepTitle)_

Quando migri uno state file locale esistente su HCP Terraform, devi prima caricare a mano lo state file tramite la UI di HCP Terraform e solo dopo eseguire `terraform init`.

**Domanda 11 (scelta multipla)** _(stepTitle)_

Un workspace `app-prod` ha un run trigger configurato per attivarsi da `networking-prod`. Cosa fa mettere in coda una run in `app-prod`?

- A. Un `terraform plan` riuscito in `networking-prod`.
- B. Un `terraform apply` riuscito in `networking-prod`.
- C. Qualsiasi run in `networking-prod`, indipendentemente dall'esito.
- D. Un'attivazione manuale dalla UI del workspace `networking-prod`.

**Domanda 12 (risposta multipla)** _(stepTitle)_

Quali delle seguenti sono funzionalità degli health assessment di HCP Terraform? (Selezionane **DUE**)

- A. Rilevamento del drift
- B. Rollback automatico delle risorse
- C. Validazione continua
- D. Stima dei costi

**Domanda 13 (Vero/Falso)** _(stepTitle)_

Il blocco `cloud` supporta l'uso di `tags` per associare una configurazione a più workspace invece che a un singolo nome di workspace.

**Domanda 14 (scelta multipla)** _(stepTitle)_

Quale variabile d'ambiente deve essere impostata perché HCP Terraform autentichi automaticamente il provider AWS con credenziali dinamiche?

- A. `AWS_ACCESS_KEY_ID`
- B. `TFC_AWS_PROVIDER_AUTH`
- C. `TFC_AWS_RUN_ROLE_ARN`
- D. `AWS_DYNAMIC_CREDENTIALS`

**Domanda 15 (Vero/Falso)** _(stepTitle)_

Un workspace configurato con modalità di esecuzione "Local" usa comunque HCP Terraform per l'archiviazione remota dello state e per il locking.

**Domanda 16 (scelta multipla)** _(stepTitle)_

Hai un team di 5 sviluppatori che devono poter vedere i dati dei workspace ma non modificarli. Hai anche un team di 2 amministratori che devono avere il controllo completo. Come dovresti configurare i permessi?

- A. Concedere a entrambi i team "Admin" su ogni workspace.
- B. Concedere al team degli sviluppatori "Read" e al team degli amministratori "Admin" su ogni workspace.
- C. Concedere a entrambi i team "Write" su ogni workspace.
- D. Concedere permessi solo a livello di organizzazione; i permessi a livello di workspace non sono supportati.

**Domanda 17 (risposta multipla)** _(stepTitle)_

Quali dei seguenti elementi si possono configurare in un file `.terraformignore`? (Selezionane **DUE**)

- A. Pattern dei file da escludere dal caricamento.
- B. Configurazione del backend.
- C. Regole basate sulla sintassi di `.gitignore`.
- D. Definizioni di variabili.

**Domanda 18 (Vero/Falso)** _(stepTitle)_

Usando il workflow guidato dalla CLI di HCP Terraform, `terraform plan` crea un piano speculativo che non blocca il workspace né mette in coda una run.

**Domanda 19 (scelta multipla)** _(stepTitle)_

Qual è la funzione della variabile d'ambiente `TF_WORKSPACE` quando si usa il blocco `cloud` con i tag?

- A. Sovrascrive l'impostazione `hostname`.
- B. Seleziona quale workspace taggato usare per l'operazione corrente.
- C. Definisce un nuovo tag da applicare al workspace.
- D. Imposta la modalità di esecuzione del workspace.

**Domanda 20 (Vero/Falso)** _(stepTitle)_

In HCP Terraform un variable set prioritario ha la precedenza su una variabile specifica del workspace con lo stesso nome.

---

### Risposte

**Domanda 1:** Falso — Con il blocco `cloud` configurato, `terraform apply` mette in coda una run che viene eseguita in remoto sull'infrastruttura di HCP Terraform. Il piano viene generato e applicato sui server di HCP Terraform, non in locale.

**Domanda 2:** A — La risposta corretta è "Variable set". I progetti servono a raggruppare i workspace, i policy set a raggruppare le policy e i run trigger ad automatizzare le run tra workspace.

**Domanda 3:** A, B, C, D — Tutte queste possono avviare una run. Fare merge (quindi push) di codice su un repository VCS collegato, cliccare "Start new run" nella UI, eseguire `terraform apply` in locale con un blocco `cloud` configurato e usare l'API di HCP Terraform possono tutti attivare run. Eseguire `terraform plan` non attiva una run; genera un piano speculativo, eseguito in remoto, senza mettere nulla in coda.

**Domanda 4:** Falso — I workspace di HCP Terraform sono completamente indipendenti e possono avere configurazioni, variabili e modalità di esecuzione diverse. I workspace della CLI sono state file alternativi all'interno della stessa directory di configurazione.

**Domanda 5:** C — Il livello `soft-mandatory` impedisce l'applicazione di una run a meno che un utente autorizzato non scavalchi il fallimento. `hard-mandatory` bloccherebbe la run del tutto senza possibilità di override, e `advisory` mostrerebbe solo un avviso.

**Domanda 6:** B — La risposta corretta è `.terraformignore`. Questo file serve a specificare i pattern dei file da escludere dal caricamento su HCP Terraform durante l'esecuzione remota. `.gitignore` è per Git, e le altre opzioni non sono valide per questo scopo.

**Domanda 7:** Vero — Un progetto in HCP Terraform può contenere più workspace, e i permessi di un utente su un progetto si applicano automaticamente a tutti i workspace al suo interno. Questo semplifica la gestione dei permessi su workspace correlati.

**Domanda 8:** A, C — L'Explorer fornisce informazioni come l'elenco dei workspace con drift di configurazione e le versioni dei provider più usate nei workspace. Non fornisce informazioni sui costi di mercato né il codice sorgente esatto di ogni modulo.

**Domanda 9:** B — Il vantaggio principale delle credenziali dinamiche dei provider è che eliminano la necessità di memorizzare segreti a lunga durata in HCP Terraform. Le credenziali dinamiche hanno breve durata e vengono ruotate automaticamente, migliorando la sicurezza. Richiedono configurazione aggiuntiva e non sono automaticamente compatibili con tutti i provider. Sono anche cifrate negli state file, ma il vantaggio chiave è l'eliminazione dei segreti a lunga durata.

**Domanda 10:** Falso — Quando migri uno state file locale esistente su HCP Terraform, non devi caricarlo a mano. Durante `terraform init`, Terraform rileva la migrazione dello state e ti chiede di copiare lo state esistente nel nuovo cloud backend. Basta confermare e Terraform si occuperà del caricamento.

**Domanda 11:** B — Una run viene messa in coda in `app-prod` quando c'è un `terraform apply` riuscito in `networking-prod`. Un `terraform plan` riuscito non attiva una run, e le run non vengono attivate da qualsiasi run in `networking-prod` indipendentemente dall'esito né da attivazioni manuali dalla UI.

**Domanda 12:** A, C — Gli health assessment di HCP Terraform includono il rilevamento del drift e la validazione continua. Non includono il rollback automatico delle risorse né la stima dei costi.

**Domanda 13:** Vero — Il blocco `cloud` supporta l'uso di `tags` per associare una configurazione a più workspace. Questo permette alla stessa configurazione di applicarsi a qualsiasi workspace che abbia i tag specificati, offrendo flessibilità nell'organizzazione e gestione dei workspace.

**Domanda 14:** B — La variabile d'ambiente `TFC_AWS_PROVIDER_AUTH` (impostata a `true` o `1`) è quella che abilita l'autenticazione del provider AWS con credenziali dinamiche. Serve anche `TFC_AWS_RUN_ROLE_ARN` (C), che indica l'ARN del ruolo IAM da assumere, ma da sola non attiva il meccanismo. Le altre opzioni non sono corrette per questo scopo.

**Domanda 15:** Vero — Un workspace configurato con modalità di esecuzione "Local" usa comunque HCP Terraform per l'archiviazione remota dello state e per il locking. La differenza è che le operazioni di plan e apply vengono eseguite in locale sulla macchina dell'utente invece che in remoto sull'infrastruttura di HCP Terraform. La gestione dello state e il locking avvengono comunque tramite HCP Terraform, per garantire coerenza ed evitare conflitti.

**Domanda 16:** B — La configurazione corretta è concedere al team degli sviluppatori "Read" e al team degli amministratori "Admin" su ogni workspace. Così gli sviluppatori possono vedere i dati dei workspace senza modificarli, mentre gli amministratori hanno il controllo completo. Concedere "Admin" a entrambi darebbe agli sviluppatori più permessi del necessario, e concedere "Write" a entrambi permetterebbe agli sviluppatori di modificare i dati dei workspace, cosa non desiderata. I permessi si possono concedere sia a livello di organizzazione sia di workspace, ma in questo scenario servono i permessi a livello di workspace.

**Domanda 17:** A, C — Un file `.terraformignore` può contenere pattern dei file da escludere dal caricamento e può usare regole basate sulla sintassi di `.gitignore`. Non contiene configurazione del backend né definizioni di variabili, che si specificano nei file di configurazione Terraform.

**Domanda 18:** Vero — Usando il workflow guidato dalla CLI di HCP Terraform, `terraform plan` crea un piano speculativo che non blocca il workspace né mette in coda una run. Questo ti permette di vedere cosa succederebbe senza influire sullo state né attivare azioni in HCP Terraform. Solo `terraform apply` mette in coda una run e blocca il workspace per l'esecuzione.

**Domanda 19:** B — La variabile d'ambiente `TF_WORKSPACE` serve a selezionare quale workspace taggato usare per l'operazione corrente quando si usa il blocco `cloud` con i tag. Permette di specificare il contesto del workspace senza scriverlo nella configurazione, offrendo flessibilità nelle configurazioni multi-workspace. Non sovrascrive `hostname`, non definisce nuovi tag e non imposta la modalità di esecuzione.

**Domanda 20:** Vero — In HCP Terraform un variable set prioritario ha la precedenza su una variabile specifica del workspace con lo stesso nome. Se c'è un conflitto tra un variable set prioritario e una variabile specifica del workspace, nella run di Terraform verrà usato il valore del variable set prioritario. Questo consente override delle variabili a livello di organizzazione quando necessario.
---

Ce l'hai fatta! Prenditi questo momento per festeggiare davvero. Hai completato l'Obiettivo 8, il che significa che hai una comprensione solida di come usare HCP Terraform per collaborazione, governance ed esecuzione remota. È una tappa importante nel tuo percorso con Terraform.

Grazie per avermi lasciato essere la tua guida di studio per tutto questo corso. Spero che tu l'abbia trovata utile, coinvolgente e magari anche un po' divertente. Ricorda: il modo migliore per imparare è fare, quindi continua a esercitarti con HCP Terraform e ad applicare ciò che hai imparato in scenari reali.

Se qualche obiettivo non ti è ancora chiaro, torna pure a ripassare le sezioni, guarda i video e rifai i laboratori pratici. Più interagisci con il materiale, più ti resterà impresso. E quando ti senti pronto, puoi sostenere l'esame ufficiale di certificazione HashiCorp Terraform per convalidare le tue conoscenze e competenze.

> Complimenti ancora per aver completato l'Obiettivo 8, e in bocca al lupo per il tuo percorso di certificazione!
