# Modulo 8 — HCP Terraform

_La piattaforma HashiCorp per collaborare con Terraform: workspace, project, variable set, run trigger, team, policy, dynamic credentials, health assessment e integrazione con la CLI._

---

## 8.1 — Usare HCP Terraform per creare infrastruttura

### 8.1.1 — Che cos'è

**HCP Terraform** (HashiCorp Cloud Platform Terraform, già Terraform Cloud) è un servizio gestito che esegue Terraform in modo centralizzato e collaborativo: conserva in modo sicuro **state, credenziali e variabili**, si collega ai sistemi di **version control** e gestisce **run, accessi, policy e registry privato**.

- **Terraform Enterprise** è la distribuzione **self-hosted** di HCP Terraform, installata e gestita dall'organizzazione.
- Esiste anche **HCP Terraform Europe**, con dati ospitati in Europa; lì project e permessi si gestiscono tramite la piattaforma HCP.

**Cosa offre** _(stepTitle)_

- **State** remoto cifrato, con versioning e locking.
- **Remote operations**: plan e apply eseguiti sui server HCP, non sul portatile.
- **Workspace** per organizzare configurazione, variabili e state.
- **Registry privato** di moduli e provider.
- **Controllo accessi** (team e permessi) e **audit**.
- **Policy as code** (Sentinel, OPA), **cost estimation**, **run tasks**.

**Piani di abbonamento** _(stepTitle)_

| **Piano** | **In sintesi** |
|---|---|
| **Free** | Fino a **500 managed resource**; include remote execution, integrazione VCS, registry privato, SSO, policy enforcement e run tasks |
| **Essentials** | Funzioni di collaborazione aggiuntive, pagamento a consumo sulle managed resource |
| **Standard** | Governance avanzata: tra l'altro health assessment (drift detection e continuous validation) e change requests |
| **Premium** | Funzioni enterprise come audit logging e RBAC personalizzato |

I piani a pagamento si basano sul numero di **managed resource**, conteggiate a ora dal provisioning alla distruzione.

### 8.1.2 — Workflow di lavoro

HCP Terraform supporta tre workflow per i workspace:

| **Workflow** | **Descrizione** |
|---|---|
| **UI/VCS-driven** | Il workspace è collegato a un repository: ogni merge sul branch avvia un run, ogni pull request uno speculative plan. È il modo principale di lavorare |
| **CLI-driven** | Si usa la CLI (`terraform plan/apply`) in locale, ma l'esecuzione avviene in remoto |
| **API-driven** | I run sono avviati tramite API: più flessibile, ma richiede strumenti propri |

Un run può partire anche manualmente dal pulsante **+ New run** del workspace.

### 8.1.3 — Remote operations

Con le **remote operations** plan e apply girano su macchine virtuali temporanee di HCP Terraform, con la configurazione, le variabili e lo state del workspace. Con la CLI l'output del run viene trasmesso al terminale. Così non servono credenziali cloud sui client locali.

**Execution mode** _(stepTitle)_

| **Modalità** | **Dove girano plan e apply** |
|---|---|
| **Remote** (default) | Sull'infrastruttura di HCP Terraform |
| **Local** | Sulle macchine dell'utente o della CI: HCP Terraform conserva e sincronizza **solo lo state** |
| **Agent** | Su **HCP Terraform agents** installati nella propria rete: interrogano HCP Terraform ed eseguono i run in locale, senza aprire traffico in ingresso. Funzione a pagamento, utile per reti private o on-premises |

Con l'esecuzione **locale** non sono disponibili le funzioni che richiedono l'esecuzione remota, come la policy enforcement di Sentinel, la cost estimation e le notifiche. La modalità si imposta a livello di organizzazione, project (default per i nuovi workspace) o singolo workspace.

**Come vengono gestiti i run** _(stepTitle)_

- **Configuration version**: HCP Terraform gestisce la configurazione come una serie di versioni, legate ai commit del VCS o caricate via CLI/API.
- Ogni workspace ha una **coda** e processa **un run alla volta**: i run in attesa restano *pending*. Un run viene bloccato sulla configuration version e sulle variabili del momento in cui parte.
- Un **workspace lock**, impostato a mano o da un run in corso, fa sì che i nuovi run vengano creati ma non partano fino allo sblocco.
- **Speculative plan**: run di solo plan che **non può essere applicato**. Non aspetta la coda, perché non modifica nulla. Parte dalle pull request (workspace VCS), da `terraform plan` con l'integrazione CLI o via API.
- **Saved plan** (CLI 1.6+): `terraform plan -out=FILE`, `terraform show FILE` e `terraform apply FILE` funzionano anche con HCP Terraform.
- Sono supportati anche i destroy run, i refresh-only run e le opzioni di pianificazione (replace, target...).

![Figura 12](img/hcp-run-phases.png) _(dimensioni: 1323×512 px)_

*Figura 12 — Le fasi di un run in HCP Terraform, con i punti in cui intervengono le run task. Fonte: HashiCorp Developer.* _(caption)_

**Ciclo di un run** _(stepTitle)_

1. **Pending**: il run è in coda.
2. **Plan**: viene generato il piano (con eventuali run task *pre-plan* e *post-plan*).
3. **Cost estimation / Policy check** (se configurati).
4. **Confirmation**: approvazione manuale (o automatica con *auto-apply*).
5. **Apply**: viene eseguito il piano (con eventuali run task *pre-apply* e *post-apply*).
6. **Completion**: il run termina (applied, errored, discarded...).

---

## 8.2 — Collaborazione e governance

### 8.2.1 — Teams e permessi

![Figura 13](img/hcp-project-team-access.png) _(dimensioni: 2059×2087 px)_

*Figura 13 — Assegnazione dell'accesso a un project per un team. Fonte: HashiCorp Developer.* _(caption)_

- Gli utenti sono organizzati in **team**, e i permessi si assegnano ai team, non ai singoli. Un team ha permessi solo nella propria organizzazione, mentre un utente può appartenere a più team e a più organizzazioni.
- I permessi hanno tre livelli: **organizzazione** (es. *Manage all projects*, *Manage all workspaces*, *View all workspaces*, gestione di policy e registry), **project** (accesso a tutti i workspace del project) e **workspace** (run, variabili, state, impostazioni).
- Ruoli predefiniti sui workspace: *Read*, *Plan*, *Write*, *Admin*, più i permessi personalizzati.
- Permessi tipici di workspace: leggere i run, avviare plan, avviare apply, leggere/scrivere variabili, leggere lo state, bloccare il workspace.
- Si applica il principio del **minimo privilegio**: assegnare a ogni team solo il ruolo necessario.
- Si integra con SSO per l'autenticazione.

**Effective permissions** _(stepTitle)_

I permessi sono **additivi**: un team ottiene il livello più alto tra quelli concessi a organizzazione, project e workspace. Ad esempio, *Manage all workspaces* a livello di organizzazione prevale sul ruolo *Read* in un workspace. Un permesso di organizzazione più basso, come *View all workspaces*, non toglie però il ruolo *Write* assegnato su un workspace.

**Owners team, token e notifiche** _(stepTitle)_

- Ogni organizzazione ha un team **owners** con pieno controllo; chi crea l'organizzazione ne è il primo membro. Il team non può restare vuoto, e nelle organizzazioni free ha al massimo **5 membri**.
- Ogni team può avere **API token** propri, non legati a un utente, utili per l'automazione.
- Le **team notifications** avvisano il team su sistemi esterni quando avviene una certa azione.

> **Permessi esterni**: se un workspace è collegato a un repository VCS, chiunque possa fare merge sul branch principale avvia indirettamente dei plan, anche senza permessi in HCP Terraform. Con l'auto-apply avvia anche gli apply.
_(infoBox)_

### 8.2.2 — Policy enforcement

Le **policy** definiscono regole che i run devono rispettare (es. "vietati bucket pubblici", "solo certe regioni", "tag obbligatori").

![Figura 14](img/hcp-validation-mechanisms.png) _(dimensioni: 960×540 px)_

*Figura 14 — I controlli a diversi livelli: precondition e postcondition nei moduli, run task sul workspace, policy Sentinel sull'intera organizzazione. Fonte: HashiCorp Developer.* _(caption)_

![Figura 15](img/hcp-run-task-diagram.png) _(dimensioni: 960×263 px)_

*Figura 15 — Le run task integrano servizi esterni nel ciclo di un run. Fonte: HashiCorp Developer.* _(caption)_

| **Framework** | **Note** |
|---|---|
| **Sentinel** | Policy as code di HashiCorp; può accedere ai dati di cost estimation |
| **OPA (Open Policy Agent)** | Policy in linguaggio Rego |

**Livelli di enforcement** _(stepTitle)_

| **Framework** | **Livello** | **Effetto in caso di violazione** |
|---|---|---|
| Sentinel | **Advisory** | Segnala la violazione nell'interfaccia, il run prosegue |
| Sentinel | **Soft mandatory** | Blocca il run, ma un utente autorizzato può fare **override** |
| Sentinel | **Hard mandatory** | Blocca il run finché il problema non viene risolto (salvo policy set configurato per consentire override) |
| OPA | **advisory** | Segnala, non blocca |
| OPA | **mandatory** | Blocca, ma chi ha il permesso *Manage Policy Overrides* può fare override |

- Le policy sono raggruppate in **policy set**, applicabili a tutta l'organizzazione, a specifici project o workspace, o ai workspace con certi tag. Un policy set contiene un solo framework, ma a uno stesso workspace se ne possono applicare più di uno.
- HCP Terraform valuta le policy sul **piano** a ogni run, dopo il plan e prima dell'apply. È consigliato tenere le policy in un repository VCS (*policy as code*).
- La documentazione più recente introduce anche un framework nativo in HCL (*Terraform policy*, che richiede Terraform 1.17). È oltre la versione 1.12 dell'esame.

**Run tasks** _(stepTitle)_

Le **run task** integrano servizi esterni (sicurezza, compliance, costi, validazione di immagini) in quattro punti del run: **pre-plan**, **post-plan**, **pre-apply** e **post-apply** (Figura 12). Il tutorial *Enforce OPA policies* ne usa una con Styra. Il token che HCP Terraform passa al servizio esterno dura 10 minuti.

### 8.2.3 — Dynamic provider credentials

Invece di credenziali statiche a lunga durata, HCP Terraform usa **OIDC** per ottenere da AWS, Azure, GCP o Vault **credenziali temporanee** per ogni run.

![Figura 16](img/hcp-dynamic-credentials-apply.png) _(dimensioni: 1768×984 px)_

*Figura 16 — Un run che ottiene credenziali AWS temporanee tramite dynamic provider credentials. Fonte: HashiCorp Developer.* _(caption)_

**Come funziona** _(stepTitle)_

1. Si configura nel cloud una **relazione di fiducia** verso HCP Terraform, limitata a organizzazione, project o workspace.
2. A ogni run HCP Terraform genera un **workload identity token** firmato (OIDC) che identifica il run.
3. Il cloud verifica il token e lo scambia con **credenziali temporanee**, valide solo per quel run.

- Riduce il rischio di fuga di segreti ed elimina la rotazione manuale.
- Si attiva con variabili d'ambiente del workspace o di un variable set, ad esempio `TFC_AWS_PROVIDER_AUTH = true` e `TFC_AWS_RUN_ROLE_ARN` per AWS.
- Funziona anche con gli HCP Terraform agents.
- Nel tutorial *Authenticate providers with dynamic credentials* la relazione di fiducia viene creata con Terraform stesso; poi si crea il workspace dell'infrastruttura e gli si assegnano le variabili di fiducia.

### 8.2.4 — Health assessments e drift detection

![Figura 17](img/hcp-drift-detection-overview.png) _(dimensioni: 2048×1208 px)_

*Figura 17 — Panoramica di un workspace con health assessment e rilevamento del drift. Fonte: HashiCorp Developer.* _(caption)_

Gli **health assessment** verificano periodicamente che l'infrastruttura reale rispetti la configurazione. Sono disponibili nei piani **Standard e Premium** e comprendono due valutazioni:

| **Valutazione** | **Cosa verifica** | **Requisito** |
|---|---|---|
| **Drift detection** | Se l'infrastruttura reale corrisponde ancora alla configurazione | Terraform 0.15.4+ |
| **Continuous validation** | Se precondition, postcondition e `check` block continuano a essere soddisfatti dopo il provisioning (per il monitoraggio si consigliano i `check`) | Terraform 1.3+ |

- Il workspace deve avere almeno **un apply riuscito**: senza infrastruttura reale non ci sono valutazioni.
- Le valutazioni si abilitano per l'organizzazione o per il singolo workspace, e girano a intervalli regolari dall'ultimo apply o dall'ultima valutazione.
- Un amministratore del workspace può lanciare una valutazione **on-demand** dall'interfaccia.
- Le valutazioni si **sospendono** se l'ultimo run è finito in errore e riprendono dopo un run riuscito.
- In caso di drift o check falliti il workspace mostra un avviso *Health*, e si possono configurare **notifiche** (email, Slack, webhook).

**Risolvere il drift** _(stepTitle)_

- **Overwrite drift**: se la modifica esterna non è voluta, si esegue un nuovo plan e apply per riportare l'infrastruttura alla configurazione.
- **Update configuration**: se la modifica è voluta, la si riporta nella configurazione, così il prossimo apply non la annulla.

> **Falsi positivi**: l'assessment crea uno speculative plan, che può leggere valori più recenti dei data source (es. "l'AMI più recente"). Per evitare allarmi inutili, nei check conviene interrogare la configurazione effettiva delle risorse e non un valore calcolato come "ultimo disponibile".
_(infoBox)_

Il tutorial *Detect drift and enforce policies* combina una precondition, un policy set e la drift detection: prima provoca una violazione di policy, poi un drift, e mostra come HCP Terraform li segnala.

### 8.2.5 — Explorer e change requests

![Figura 18](img/hcp-explorer-health.png) _(dimensioni: 2692×1070 px)_

*Figura 18 — L'Explorer mostra lo stato di salute dei workspace dell'organizzazione. Fonte: HashiCorp Developer.* _(caption)_

**Explorer for workspace visibility** _(stepTitle)_

- Vista centralizzata e interrogabile sull'intera organizzazione, che riunisce dati sparsi in molti workspace.
- Quattro tipi di risorse esplorabili: **Workspaces**, **Modules**, **Providers** e **Terraform versions**.
- Offre query predefinite, tra cui *Top module versions*, *Top provider versions*, *Latest Terraform versions*, *Workspaces without VCS*, *Workspaces with failed checks*, *Drifted workspaces*, *Runs by status* e *Oldest applied workspaces*. Si aggiungono filtri personalizzati e **viste salvate**.
- Richiede il ruolo di owner dell'organizzazione oppure il permesso *View all workspaces* o superiore.

**Change requests** _(stepTitle)_

- Sono un **backlog di attività** registrato direttamente sui workspace: aggiornare un modulo deprecato, applicare una correzione di sicurezza o di compliance, risolvere un bug.
- Gli amministratori le creano partendo da una query dell'Explorer: selezionano i workspace e scrivono la richiesta.
- Con le **team notifications** il team proprietario del workspace viene avvisato della nuova richiesta.
- Chi completa l'attività **archivia** la change request.
- Disponibili nei piani **Standard e Premium**.

### 8.2.6 — Registry privato

Il **private registry** ospita moduli e provider interni all'organizzazione, con versioning e condivisione controllata. Si usano con `source = "app.terraform.io/ORG/NOME/PROVIDER"`. Accanto ai moduli privati si possono usare anche provider e moduli del Registry pubblico, e gli amministratori possono gestire quali vengono usati nell'organizzazione.

---

## 8.3 — Workspace, project e variabili

### 8.3.1 — Workspace di HCP Terraform

In HCP Terraform un **workspace** contiene tutto ciò che serve a gestire un insieme di risorse e svolge lo stesso ruolo di una directory di lavoro locale.

| **Componente** | **Terraform in locale** | **HCP Terraform** |
|---|---|---|
| Configurazione | Su disco | Nel repository VCS collegato, o caricata via CLI/API |
| Valori delle variabili | File `.tfvars`, argomenti CLI, ambiente della shell | Nel workspace |
| State | Su disco o in un backend remoto | Nel workspace |
| Credenziali e segreti | Ambiente della shell o prompt | Nel workspace, come variabili sensitive |

Inoltre il workspace conserva le **state version** (storico degli state, utile per audit e ripristino) e la **cronologia dei run** (log, autore, modifiche che li hanno causati). Il contatore di risorse nel workspace include managed resource e data source.

> **Non confondere**: i *workspace CLI* (`terraform workspace`) isolano più state nella stessa directory di lavoro e sono facoltativi. I *workspace HCP Terraform* sono **obbligatori**: sono unità di gestione complete, con state, variabili e permessi propri, e sono alla base del controllo degli accessi.
_(infoBox)_

**Come organizzare i workspace** _(stepTitle)_

- HashiCorp consiglia di dividere le configurazioni monolitiche in componenti più piccoli, ognuno nel proprio workspace, con permessi delegati ai team responsabili.
- Esempio: `networking-prod`, `app1-prod` e `monitoring-prod`, poi `app1-dev` riutilizzando la stessa configurazione.
- I workspace si creano dall'interfaccia, via API o con l'integrazione CLI.

### 8.3.2 — Project

I **project** raggruppano i workspace (e gli Stack) e consentono di assegnare permessi e variable set a livello di gruppo. Si possono definire per business unit, reparto, sussidiaria o team tecnico.

- Ogni workspace appartiene a **esattamente un project**. Di default finisce nel **Default Project**, che si può rinominare ma non eliminare.
- Il project si sceglie alla creazione del workspace e si può cambiare in seguito, spostando il workspace.
- I project sono disponibili a tutti, ma i **permessi a livello di project** richiedono i piani Essentials, Standard o Premium.
- Ogni project ha i propri permessi per i team, più granulari di quelli di organizzazione e più ampi di quelli del singolo workspace. Il permesso di organizzazione *Manage all Projects* consente di gestirli tutti.
- Un project può impostare una **execution mode di default** (Remote, Local o Agent), ereditata dai workspace creati dopo.
- Il tutorial *Organize workspaces with projects* crea project e workspace, filtra e sposta i workspace, crea team e verifica le conseguenze dei permessi assegnati al project.

![Figura 19](img/hcp-new-project.png) _(dimensioni: 2910×418 px)_

*Figura 19 — Creazione di un nuovo project in HCP Terraform. Fonte: HashiCorp Developer.* _(caption)_

### 8.3.3 — Variabili e variable set

![Figura 20](img/hcp-create-variable-set.png) _(dimensioni: 2380×940 px)_

*Figura 20 — Creazione di un variable set. Fonte: HashiCorp Developer.* _(caption)_

![Figura 21](img/hcp-workspace-variables.png) _(dimensioni: 2936×1568 px)_

*Figura 21 — Variabili di ambiente e variabili Terraform in un workspace. Fonte: HashiCorp Developer.* _(caption)_

- Due categorie: **Terraform variables** (valori per le input variable) ed **Environment variables** (credenziali dei provider e impostazioni della CLI, come `TF_LOG` o `TFE_PARALLELISM`).
- Ogni variabile può essere marcata **sensitive**: scrivibile ma non più leggibile dall'interfaccia o dall'API.
- Le Terraform variable possono essere in formato **HCL** (casella *HCL*) per liste e mappe; le environment variable no.
- Le credenziali conviene passarle come **environment variable**: i valori delle Terraform variable arrivano in chiaro al run e possono finire in log e state.
- I file `*.auto.tfvars` e `terraform.tfvars` caricati con la configurazione vengono letti a ogni run, ma non compaiono tra le variabili del workspace. Una variabile del workspace con la stessa chiave li sovrascrive.
- I **variable set** sono insiemi di variabili riusabili. Possono appartenere all'**organizzazione** o a un **project**, e si applicano globalmente, a specifici project o a specifici workspace. Sono ideali per credenziali condivise.

**Scope delle variabili** _(stepTitle)_

| **Scope** | **Si applica a** |
|---|---|
| Workspace run-specific | Un singolo run (es. `-var` dalla CLI, Terraform 1.1+) |
| Workspace-specific | Un solo workspace |
| Workspace-scoped variable set | Più workspace scelti |
| Project-scoped variable set | Tutti i workspace, attuali e futuri, di un project |
| Global variable set | Tutti i workspace, attuali e futuri, dell'organizzazione |

**Precedenza (dalla più alta alla più bassa)** _(stepTitle)_

1. Variable set marcati **priority**, nell'ordine: globali, project-scoped di organizzazione, workspace-scoped di organizzazione, project-scoped di project, workspace-scoped di project. Prevalgono su tutto, anche su `-var` e sui file `.tfvars`.
2. Variabili passate da riga di comando con `-var` / `-var-file` (workflow CLI).
3. Variabili d'ambiente locali `TF_VAR_...` (workflow CLI).
4. **Workspace-specific variables**: sovrascrivono sempre quelle dei variable set con la stessa chiave (l'interfaccia le segna come *OVERWRITTEN*).
5. Variable set workspace-scoped **di un project**.
6. Variable set project-scoped **di un project**.
7. Variable set workspace-scoped **dell'organizzazione**.
8. Variable set project-scoped **dell'organizzazione**.
9. Variable set **globali**.
10. File `*.auto.tfvars`.
11. File `terraform.tfvars`.

- In sintesi: tra i variable set non priority, quelli **posseduti da un project** prevalgono su quelli dell'organizzazione, e a parità di proprietario lo scope workspace prevale sullo scope project. I globali sono sempre gli ultimi.
- Se due variable set dello stesso livello hanno la stessa chiave, vince quello con il **nome lessicograficamente minore** (es. `A_Variable_Set` prevale su `B_Variable_Set`), indipendentemente da quale è stato modificato per ultimo.
- Non si possono definire chiavi uguali in più variable set globali, quindi tra loro non ci sono conflitti.
- Il tutorial *Multiple variable sets* crea un set per le credenziali e uno per le impostazioni, poi sovrascrive un valore nel workspace per mostrare la precedenza.

### 8.3.4 — Run trigger

I **run trigger** collegano workspace tra loro: quando un workspace *sorgente* completa un apply con successo, accoda automaticamente un run nel workspace *destinatario*. Servono a orchestrare dipendenze, ad esempio rete → applicazione.

- Ogni workspace si può collegare a **fino a 20 workspace sorgente**, della stessa organizzazione.
- Per crearli servono il ruolo admin sul workspace destinatario e il permesso di leggere i run del sorgente.
- I run avviati da un trigger **non fanno auto-apply**, a meno di abilitare l'impostazione *Auto-apply run triggers*, che è separata dall'auto-apply del workspace.
- Per leggere gli output del sorgente si usa `terraform_remote_state` (abilitando la *remote state sharing*) o, meglio, il data source `tfe_outputs`, che non richiede accesso all'intero state.
- Nel tutorial *Connect workspaces with run triggers* il workspace di rete condivide il proprio state con quello applicativo, e un run trigger aggiorna l'applicazione dopo ogni apply della rete.

![Figura 22](img/hcp-run-trigger-workspaces.png) _(dimensioni: 1940×439 px)_

*Figura 22 — Due workspace collegati: il run del workspace sorgente avvia quello destinatario. Fonte: HashiCorp Developer.* _(caption)_

![Figura 23](img/hcp-run-triggers.png) _(dimensioni: 1629×809 px)_

*Figura 23 — Configurazione dei run trigger. Fonte: HashiCorp Developer.* _(caption)_

---

## 8.4 — Integrazione con la CLI

### 8.4.1 — Il blocco cloud

Per collegare una configurazione a HCP Terraform si usa il blocco `cloud` dentro `terraform`:

```
terraform {
  cloud {
    organization = "my-org"

    workspaces {
      name = "prod-network"
    }
  }
}
```

| **Argomento** | **Significato** |
|---|---|
| `organization` | Nome dell'organizzazione |
| `workspaces.name` | Collega la directory a un singolo workspace esistente |
| `workspaces.tags` | Mappa di tag (o lista di tag, stile legacy): collega a tutti i workspace con quei tag, selezionabili con `terraform workspace select`. Se non ne esistono, `init` propone di crearne uno. Alternativo a `name` |
| `workspaces.project` | Project dei workspace da usare |
| `hostname` | Default `app.terraform.io`; per Terraform Enterprise si indica il proprio host |
| `token` | Token API (sconsigliato nel codice: meglio `terraform login`) |

- Il blocco `cloud` richiede **Terraform 1.1** o successivo e sostituisce il vecchio backend `remote`.
- Non si può usare insieme a un blocco `backend`.
- Le variabili d'ambiente `TF_CLOUD_ORGANIZATION`, `TF_CLOUD_HOSTNAME`, `TF_CLOUD_PROJECT` e `TF_WORKSPACE` possono sostituire i valori nel blocco.
- Con il workflow CLI, a ogni `plan`/`apply` la directory viene **caricata** su HCP Terraform. Con un file **`.terraformignore`** nella radice si escludono file e cartelle dal caricamento; se manca, vengono comunque escluse alcune cartelle, come `.terraform/`.

### 8.4.2 — Autenticazione: terraform login

`terraform login [hostname]` apre il browser per generare un **API token**; senza hostname usa `app.terraform.io`.

- Il token viene salvato **in chiaro** in `credentials.tfrc.json`, nella cartella di configurazione della CLI: `~/.terraform.d/` su Linux e macOS, `%APPDATA%\terraform.d\` su Windows. Prima di salvarlo Terraform indica il percorso e permette di annullare.
- In alternativa si può configurare un **credentials helper** che salva il token in un altro sistema, ad esempio un secret manager.
- `terraform logout` rimuove le credenziali salvate.
- Per la CI si usa un token nella variabile `TF_TOKEN_app_terraform_io` o un blocco `credentials` nel file di configurazione della CLI (`.terraformrc` / `terraform.rc`).

### 8.4.3 — Migrare lo state verso HCP Terraform

![Figura 24](img/hcp-remote-run.png) _(dimensioni: 2048×2065 px)_

*Figura 24 — Un run remoto avviato dalla CLI dopo la migrazione dello state. Fonte: HashiCorp Developer.* _(caption)_

1. **Fermare tutte le operazioni** Terraform sullo state: bloccare le pipeline CI, limitare l'accesso al backend, avvisare gli altri team.
2. Creare l'organizzazione (e i workspace, se necessario). Lo state va migrato solo in workspace che **non hanno mai eseguito un run**.
3. Eseguire `terraform login`.
4. Aggiungere il blocco `cloud` e rimuovere il backend precedente.
5. `terraform init` → Terraform propone di **migrare lo state** esistente al nuovo workspace.
6. Configurare variabili e credenziali nel workspace (es. le credenziali AWS come environment variable o tramite variable set).
7. Avviare un run nel nuovo workspace per verificare che non ci siano modifiche inattese. Il file di state locale non serve più.

- Se si usava il backend `remote`, basta sostituirlo con `cloud`: Terraform continua a usare gli stessi workspace. Il blocco `cloud` non supporta però `prefix`, quindi i workspace si selezionano con il nome completo (es. `terraform workspace select my-app-prod`).
- Oltre che con la CLI, lo state si può migrare **via API** o con lo strumento **tf-migrate**, che automatizza la migrazione.

### 8.4.4 — Versione di Terraform

Ogni workspace specifica la **versione di Terraform** usata per i run, e il valore deve rispettare il `required_version` della configurazione.

**Come aggiornare (tutorial "Upgrade Terraform version in HCP Terraform")** _(stepTitle)_

1. Aggiornare il vincolo `required_version` nella configurazione, se esclude la nuova versione.
2. Verificare la nuova versione con uno **speculative plan**, ad esempio da una pull request, prima di toccare il workspace.
3. Aggiornare la versione nelle impostazioni del workspace.
4. Eseguire un **apply** per completare l'aggiornamento: lo state viene riscritto con la nuova versione.

Se la versione del workspace non rispetta `required_version`, il run fallisce con un errore di versione.

![Figura 25](img/hcp-configure-version.png) _(dimensioni: 2360×269 px)_

*Figura 25 — Impostazione della versione di Terraform di un workspace. Fonte: HashiCorp Developer.* _(caption)_

**Link di riferimento** _(stepTitle)_

- [Cos'è HCP Terraform](https://developer.hashicorp.com/terraform/cloud-docs) · [Remote operations](https://developer.hashicorp.com/terraform/cloud-docs/workspaces/run/remote-operations)
- [Workspace](https://developer.hashicorp.com/terraform/cloud-docs/workspaces) · [Project](https://developer.hashicorp.com/terraform/cloud-docs/projects) · [Variable set](https://developer.hashicorp.com/terraform/cloud-docs/variables/managing-variables#variable-sets)
- [Team](https://developer.hashicorp.com/terraform/cloud-docs/users-teams-organizations/teams) · [Policy](https://developer.hashicorp.com/terraform/cloud-docs/workspaces/policy-enforcement) · [Dynamic credentials](https://developer.hashicorp.com/terraform/cloud-docs/workspaces/dynamic-provider-credentials)
- [Blocco cloud](https://developer.hashicorp.com/terraform/cli/v1.12.x/cloud/settings) · [terraform login](https://developer.hashicorp.com/terraform/cli/v1.12.x/commands/login) · [Migrare lo state](https://developer.hashicorp.com/terraform/cloud-docs/migrate)
