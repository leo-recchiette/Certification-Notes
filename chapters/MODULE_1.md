# Modulo 1 — Infrastructure as Code (IaC) con Terraform

_Questo modulo introduce il paradigma Infrastructure as Code, i vantaggi rispetto alla gestione manuale e il modo in cui Terraform gestisce ambienti multi-cloud, hybrid cloud e servizi eterogenei con un unico workflow._

---

## 1.1 — Che cos'è l'Infrastructure as Code

### 1.1.1 — Definizione di IaC

L'Infrastructure as Code (IaC) consiste nel descrivere e gestire l'infrastruttura (reti, macchine virtuali, database, DNS, permessi) tramite **file di configurazione leggibili da una macchina**, invece di crearla a mano da console web o con comandi isolati. La configurazione diventa il documento che dichiara lo stato desiderato: uno strumento IaC la legge e la porta a realtà.

![Figura 1](img/terraform-iac.png) _(dimensioni: 2400×870 px)_

*Figura 1 — Infrastructure as Code: la configurazione descrive lo stato desiderato dell'infrastruttura. Fonte: HashiCorp Developer.* _(caption)_

**Approccio dichiarativo e imperativo** _(stepTitle)_

- **Dichiarativo**: si descrive il *risultato* voluto ("voglio 3 VM e una rete"). Lo strumento calcola da solo i passi per arrivarci. Terraform è dichiarativo (linguaggio HCL).
- **Imperativo**: si descrivono i *passi* da eseguire in sequenza (script Bash/PowerShell, Azure CLI, AWS CLI). Va gestito a mano cosa accade se la risorsa esiste già.

> **Per l'esame**: Terraform è uno strumento IaC **dichiarativo**, di tipo *provisioning*. Descrivi lo stato finale; Terraform confronta configurazione, state e infrastruttura reale e determina le azioni (create, update, destroy).
_(infoBox)_

### 1.1.2 — Il ciclo di vita dell'infrastruttura

Nel modello tradizionale l'infrastruttura veniva creata a mano, ticket dopo ticket. Con IaC l'infrastruttura segue lo stesso ciclo del software: si scrive il codice, si fa versioning in Git, lo si revisiona, lo si applica in modo ripetibile.

| **Aspetto** | **Gestione manuale** | **IaC** |
|---|---|---|
| **Creazione** | Click su console, lenta e soggetta a errori | Automatica, ripetibile |
| **Documentazione** | Wiki spesso obsoleta | Il codice stesso è la documentazione |
| **Controllo versione** | Assente | Git: storico, review, rollback |
| **Coerenza tra ambienti** | Derive di configurazione (configuration drift) | Stessa configurazione per dev, test e prod |
| **Scalabilità** | Proporzionale al lavoro manuale | Si moltiplica cambiando una variabile |

### 1.1.3 — Terraform e il suo ruolo

Terraform è uno strumento IaC open source (ora sotto licenza BUSL) sviluppato da HashiCorp. Permette di definire risorse e servizi con il linguaggio dichiarativo **HCL** (HashiCorp Configuration Language) e di gestirne l'intero ciclo di vita. Funziona tramite **provider** (plugin) che traducono la configurazione in chiamate alle API di ogni piattaforma.

![Figura 2](img/intro-terraform-workflow.png) _(dimensioni: 2038×1773 px)_

*Figura 2 — Il workflow Terraform: Write, Plan, Apply. Fonte: HashiCorp Developer.* _(caption)_

**Come funziona in breve** _(stepTitle)_

1. Si scrive la configurazione in file `.tf`.
2. `terraform init` scarica i provider necessari.
3. `terraform plan` confronta configurazione, state e mondo reale e propone un piano.
4. `terraform apply` esegue il piano chiamando le API dei provider.
5. Terraform registra l'esito nel file di **state**.

---

## 1.2 — Vantaggi dei pattern IaC

### 1.2.1 — I principali vantaggi

| **Vantaggio** | **Descrizione** |
|---|---|
| **Automazione** | Elimina i passaggi manuali ripetitivi e riduce l'errore umano |
| **Ripetibilità e coerenza** | La stessa configurazione produce lo stesso risultato ogni volta |
| **Versioning** | La configurazione vive in Git: storico, code review, tracciabilità di chi ha cambiato cosa |
| **Riuso** | I moduli permettono di riusare componenti collaudati |
| **Velocità** | Interi ambienti si creano e si distruggono in minuti |
| **Riduzione del rischio** | Il `plan` mostra in anticipo l'impatto delle modifiche |
| **Collaborazione** | Più persone lavorano sulla stessa infrastruttura con processi condivisi |
| **Riduzione dei costi** | Ambienti temporanei distruggibili con un comando; visibilità su cosa esiste |

### 1.2.2 — Perché Terraform

- **Linguaggio dichiarativo** semplice (HCL) e leggibile.
- **Piano di esecuzione** (execution plan) che mostra le modifiche prima di applicarle.
- **Grafo delle dipendenze** (dependency graph): Terraform capisce l'ordine corretto e parallelizza le operazioni indipendenti.
- **Ecosistema**: migliaia di provider e moduli nel Terraform Registry.
- **Multi-piattaforma**: un unico workflow per cloud, SaaS e sistemi on-premises.
- **State**: tiene traccia delle risorse gestite e consente di rilevare differenze (drift).

> **Attenzione**: Terraform non è uno strumento di *configuration management* (come Ansible, Chef, Puppet). Fa provisioning di infrastruttura; la configurazione del software all'interno delle macchine è un altro ambito, anche se i due approcci possono combinarsi.
_(infoBox)_

---

## 1.3 — Multi-cloud, hybrid cloud e workflow service-agnostic

### 1.3.1 — Un solo workflow, molte piattaforme

Ogni cloud ha il proprio strumento IaC nativo (ARM/Bicep per Azure, CloudFormation per AWS, Deployment Manager per Google Cloud). Terraform è **cloud-agnostic**: il linguaggio e il workflow (`init`, `plan`, `apply`) restano uguali, cambiano solo i provider e i tipi di risorsa.

![Figura 3](img/intro-terraform-apis.png) _(dimensioni: 2048×644 px)_

*Figura 3 — Terraform gestisce piattaforme diverse tramite le loro API, usando i provider. Fonte: HashiCorp Developer.* _(caption)_

### 1.3.2 — Multi-cloud e hybrid cloud

- **Multi-cloud**: una singola configurazione può gestire risorse su più cloud, ad esempio un'applicazione in AWS con DNS su Azure o Cloudflare.
- **Hybrid cloud**: lo stesso workflow gestisce risorse cloud e on-premises (per esempio VMware vSphere o Kubernetes).
- **Service-agnostic**: i provider non esistono solo per i cloud. Esistono provider per GitHub, Datadog, PagerDuty, Kubernetes, Vault, ecc. Ciò permette di orchestrare l'intero stack con un unico strumento.

> **Punto chiave**: Terraform non rende le risorse *portabili* tra cloud: una `aws_instance` non diventa magicamente una `azurerm_virtual_machine`. Cambia il codice, ma resta identico il **workflow** e il linguaggio.
_(infoBox)_

### 1.3.3 — Casi d'uso tipici

- Provisioning di infrastruttura multi-tier (rete, compute, database).
- Gestione di **ambienti multipli** (dev, staging, prod) a partire dagli stessi moduli.
- Distribuzione **multi-cloud** per resilienza o per evitare il lock-in.
- Gestione di servizi SaaS e configurazioni (DNS, monitoraggio, repository).
- Integrazione in pipeline **CI/CD**.
- Applicazione di policy e governance (con HCP Terraform / Sentinel / OPA).

**Link di riferimento** _(stepTitle)_

- [Cos'è Terraform](https://developer.hashicorp.com/terraform/intro)
- [Casi d'uso di Terraform](https://developer.hashicorp.com/terraform/intro/v1.12.x/use-cases)
- [Introduzione a IaC con Terraform (tutorial)](https://developer.hashicorp.com/terraform/tutorials/aws-get-started/infrastructure-as-code)
