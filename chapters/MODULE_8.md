# Modulo 8 — HCP Terraform

_La piattaforma HashiCorp per collaborare con Terraform: workspace, project, variable set, run trigger, team, policy, dynamic credentials, health assessment e integrazione con la CLI._

---

## 8.1 — Usare HCP Terraform per creare infrastruttura

### 8.1.1 — Che cos'è

**HCP Terraform** (HashiCorp Cloud Platform Terraform, già Terraform Cloud) è un servizio gestito che esegue Terraform in modo centralizzato e collaborativo: gestisce **state, esecuzione (run), accessi, policy e registry privato**. La versione self-hosted equivalente è **Terraform Enterprise**.

**Cosa offre** _(stepTitle)_

- **State** remoto cifrato, con versioning e locking.
- **Remote operations**: plan e apply eseguiti sui server HCP, non sul portatile.
- **Workspace** per organizzare configurazione, variabili e state.
- **Registry privato** di moduli e provider.
- **Controllo accessi** (team e permessi) e **audit**.
- **Policy as code** (Sentinel, OPA), **cost estimation**, **run tasks**.

### 8.1.2 — Workflow di lavoro

HCP Terraform supporta tre workflow per i workspace:

| **Workflow** | **Descrizione** |
|---|---|
| **VCS-driven** | Il workspace è collegato a un repository Git: ogni push/PR avvia un run |
| **CLI-driven** | Si usa la CLI (`terraform plan/apply`) in locale, ma l'esecuzione avviene in remoto |
| **API-driven** | I run sono avviati tramite API (integrazione con pipeline esterne) |

### 8.1.3 — Remote operations

Con le **remote operations** plan e apply girano nell'ambiente HCP Terraform, con le variabili e le credenziali del workspace. I log sono trasmessi alla CLI. Si evita di tenere credenziali di cloud sui client locali.

**Ciclo di un run** _(stepTitle)_

1. **Pending**: il run è in coda.
2. **Plan**: viene generato il piano.
3. **Cost estimation / Policy check / Run tasks** (se configurati).
4. **Confirmation**: approvazione manuale (o automatica con *auto-apply*).
5. **Apply**: viene eseguito il piano.

---

## 8.2 — Collaborazione e governance

### 8.2.1 — Teams e permessi

- Gli utenti sono organizzati in **team**; ai team si assegnano permessi a livello di **organizzazione**, **project** e **workspace**.
- Esistono ruoli predefiniti sui workspace: *Read*, *Plan*, *Write*, *Admin* (e permessi personalizzati).
- Il team **owners** ha pieno controllo dell'organizzazione.
- I permessi sono di tre livelli: **organizzazione** (gestione di team, policy, registry, impostazioni), **project** (accesso a un gruppo di workspace) e **workspace** (run, variabili, state, impostazioni).
- Permessi tipici di workspace: leggere i run, avviare plan, avviare apply, leggere/scrivere variabili, leggere lo state, bloccare il workspace.
- Si applica il principio del **minimo privilegio**: assegnare a ogni team solo il ruolo necessario.
- Si integra con SSO per l'autenticazione.

### 8.2.2 — Policy enforcement

Le **policy** definiscono regole che i run devono rispettare (es. "vietati bucket pubblici", "solo certe regioni", "tag obbligatori").

| **Framework** | **Note** |
|---|---|
| **Sentinel** | Policy as code di HashiCorp |
| **OPA (Open Policy Agent)** | Policy in linguaggio Rego |

**Livelli di enforcement** _(stepTitle)_

- **Advisory**: segnala la violazione ma non blocca.
- **Soft mandatory**: blocca, ma un utente autorizzato può fare override.
- **Hard mandatory**: blocca sempre, nessun override.

Le policy sono raggruppate in **policy set** applicabili a progetti o workspace.

### 8.2.3 — Dynamic provider credentials

Invece di credenziali statiche a lunga durata, HCP Terraform usa **OIDC** per ottenere da AWS, Azure, GCP o Vault **credenziali temporanee** per ogni run.

- Riduce il rischio di fuga di segreti e semplifica la rotazione.
- Si configura la relazione di fiducia tra il provider cloud e l'organizzazione/workspace HCP.
- Si impostano variabili del workspace (es. `TFC_AWS_PROVIDER_AUTH`, `TFC_AWS_RUN_ROLE_ARN`).

### 8.2.4 — Health assessments e drift detection

- **Health assessments**: HCP Terraform verifica periodicamente il workspace.
  - **Drift detection**: rileva le differenze tra infrastruttura reale e configurazione.
  - **Continuous validation**: riesegue i `check` block e le condizioni a intervalli.
- Notifica gli utenti (es. via email, Slack, webhook) quando qualcosa diverge.

### 8.2.5 — Explorer e change requests

- **Explorer**: vista centralizzata e interrogabile su workspace, moduli, provider e versioni dell'organizzazione (utile per audit e per trovare workspace obsoleti).
- **Change requests**: consentono di richiedere modifiche a un workspace e tracciarne lo stato direttamente nell'interfaccia.

### 8.2.6 — Registry privato

Il **private registry** ospita moduli e provider interni all'organizzazione, con versioning e condivisione controllata. Si usano con `source = "app.terraform.io/ORG/NOME/PROVIDER"`.

---

## 8.3 — Workspace, project e variabili

### 8.3.1 — Workspace di HCP Terraform

In HCP Terraform un **workspace** contiene tutto ciò che serve a gestire un insieme di risorse: configurazione, variabili, state, cronologia dei run, impostazioni.

> **Non confondere**: i *workspace CLI* (`terraform workspace`) sono più state nello stesso backend. I *workspace HCP Terraform* sono unità di gestione complete, con state, variabili e permessi propri.
_(infoBox)_

### 8.3.2 — Project

I **project** raggruppano i workspace (es. per team o applicazione) e consentono di assegnare permessi e variable set a livello di gruppo.

### 8.3.3 — Variabili e variable set

- Due categorie: **Terraform variables** (input) e **Environment variables** (per provider o CLI).
- Ogni variabile può essere marcata **sensitive**: scrivibile ma non più leggibile.
- I **variable set** sono insiemi di variabili riusabili, applicabili a **più workspace o project** (o all'intera organizzazione). Perfetti per credenziali condivise.
- Precedenza: variabili del workspace sovrascrivono quelle dei variable set; i variable set con scope di workspace prevalgono su quelli di project/organizzazione.

### 8.3.4 — Run trigger

I **run trigger** collegano workspace tra loro: quando un workspace *sorgente* completa un apply, avvia automaticamente un run nel workspace *destinatario*. Servono a orchestrare dipendenze, ad esempio rete → applicazione.

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

- Con `tags` al posto di `name` si può puntare a più workspace (selezionati con `terraform workspace select`).
- Il blocco `cloud` sostituisce il vecchio backend `remote`.
- Non si può usare insieme a un blocco `backend`.
- Le variabili `TF_CLOUD_ORGANIZATION` e `TF_WORKSPACE` possono sostituire i valori nel blocco.

### 8.4.2 — Autenticazione: terraform login

`terraform login` apre il browser per generare un **API token** e lo salva in `credentials.tfrc.json` (nella cartella di configurazione utente). Per la CI si usa un token in `TF_TOKEN_app_terraform_io` o nel file `.terraformrc`.

### 8.4.3 — Migrare lo state verso HCP Terraform

1. Creare l'organizzazione (e i workspace, se necessario).
2. Eseguire `terraform login`.
3. Aggiungere il blocco `cloud` e rimuovere il backend precedente.
4. `terraform init` → Terraform propone di **migrare lo state** esistente al nuovo workspace.
5. Configurare variabili e credenziali nel workspace.

### 8.4.4 — Versione di Terraform

Ogni workspace specifica la **versione di Terraform** usata per i run. Per aggiornare si modifica l'impostazione del workspace, dopo aver verificato la compatibilità.

**Link di riferimento** _(stepTitle)_

- [Cos'è HCP Terraform](https://developer.hashicorp.com/terraform/cloud-docs) · [Remote operations](https://developer.hashicorp.com/terraform/cloud-docs/workspaces/run/remote-operations)
- [Workspace](https://developer.hashicorp.com/terraform/cloud-docs/workspaces) · [Project](https://developer.hashicorp.com/terraform/cloud-docs/projects) · [Variable set](https://developer.hashicorp.com/terraform/cloud-docs/variables/managing-variables#variable-sets)
- [Team](https://developer.hashicorp.com/terraform/cloud-docs/users-teams-organizations/teams) · [Policy](https://developer.hashicorp.com/terraform/cloud-docs/workspaces/policy-enforcement) · [Dynamic credentials](https://developer.hashicorp.com/terraform/cloud-docs/workspaces/dynamic-provider-credentials)
- [Blocco cloud](https://developer.hashicorp.com/terraform/cli/v1.12.x/cloud/settings) · [terraform login](https://developer.hashicorp.com/terraform/cli/v1.12.x/commands/login) · [Migrare lo state](https://developer.hashicorp.com/terraform/cloud-docs/migrate)
