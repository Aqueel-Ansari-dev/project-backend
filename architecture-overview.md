# Beyla Sandbox Architecture Overview

This document provides an end-to-end description of the Beyla sandbox platform, spanning the mobile-friendly Next.js client, the Express-based API, the PostgreSQL data tier, and the AWS services that provide observability, storage, and deployment. Use it as a high-level reference when onboarding, designing changes, or explaining how the pieces collaborate in production and local environments.

## System context

The diagram below highlights the core actors and the managed services that participate in a typical session. AWS services are shown as external dependencies, while the frontend, API, and database layers live in this repository.

```mermaid
graph LR
  User[Operator on Mobile or Desktop]
  Browser[Next.js Frontend (frontend/)]
  API[Express API (beyla-sandbox-api/)]
  Postgres[(RDS PostgreSQL)]
  S3[S3 Evidence Bucket]
  SNS[SNS Topic + SQS Queue]
  NayaOne[NayaOne Synthetic Dataset API]

  User -->|https| Browser
  Browser -->|Fetch + JSON| API
  API -->|SQL queries| Postgres
  API -->|Evidence JSON| S3
  API -->|Event fan-out| SNS
  API -->|Outbound fetch| NayaOne
```

* Operators interact with the responsive dashboard running in Next.js; the sandbox build keeps a lightweight in-memory session without Cognito or JWT requirements.【F:frontend/lib/auth-context.tsx†L1-L44】
* Requests are sent directly to the Express API, which mounts the health, balance, transaction, alert, and dataset routes behind shared middleware for correlation, rate limiting, and error handling.【F:beyla-sandbox-api/src/index.ts†L1-L66】【F:beyla-sandbox-api/src/middlewares/auth.ts†L1-L20】
* The API persists business data to PostgreSQL and writes audit evidence to S3 and SNS so downstream systems can replay or monitor events.【F:beyla-sandbox-api/src/db/migrations/0001_init.sql†L1-L48】【F:beyla-sandbox-api/src/services/evidence.ts†L1-L57】
* For synthetic reference data, the API proxies secure requests to the external NayaOne dataset using the configured sandpit key.【F:beyla-sandbox-api/src/routes/datasets.ts†L1-L34】【F:beyla-sandbox-api/src/services/nayaone.ts†L1-L58】
* Infrastructure components—VPC, ECS, RDS, S3, SNS/SQS, IAM, and supporting security groups—are provisioned with Terraform under `infra-aws/` for parity across environments.【F:infra-aws/main.tf†L1-L76】

## Component responsibilities

### Frontend (`frontend/`)

* **Sandbox session context** exposes a fixed operator identity sourced from environment variables so UI components can render user metadata without Cognito dependencies.【F:frontend/lib/auth-context.tsx†L1-L44】
* **Data hooks** encapsulate API fetches for balances, transactions, alerts, evidence links, and the external NayaOne dataset with automatic error handling and state tracking.【F:frontend/lib/api.ts†L1-L184】
* **UI composition** uses a responsive shell with Tailwind and shadcn-inspired primitives to present dashboard KPIs, transaction modals, alert badges, and settings forms.

### API (`beyla-sandbox-api/`)

* **HTTP pipeline** adds JSON parsing, permissive CORS, request correlation, sandbox identity stamping, Pino request logging, and rate limiting before delegating to route handlers.【F:beyla-sandbox-api/src/index.ts†L1-L66】【F:beyla-sandbox-api/src/middlewares/auth.ts†L1-L20】
* **Request context middleware** exposes the correlation ID, actor, and client IP to downstream handlers so audit records stay consistent.【F:beyla-sandbox-api/src/middlewares/request-context.ts†L1-L26】
* **Data access layer** wraps SQL queries for listing balances and transactions, creating ledger entries, and recording alert payloads, providing the shapes consumed by both API and frontend.【F:beyla-sandbox-api/src/db/account-repository.ts†L1-L118】
* **External dataset proxy** validates pagination parameters and forwards authenticated calls to NayaOne, shielding client code from sandpit headers while preserving audit context.【F:beyla-sandbox-api/src/routes/datasets.ts†L1-L34】【F:beyla-sandbox-api/src/services/nayaone.ts†L1-L58】
* **Dataset ingestion** runs during migrations and explicit seed operations, paging through the NayaOne dataset to hydrate accounts, balances, transactions, and derived alerts with lineage preserved via `external_id` columns.【F:beyla-sandbox-api/scripts/nayaone-importer.ts†L1-L236】【F:beyla-sandbox-api/src/db/migrations/0002_nayaone_lineage.sql†L1-L33】
* **Evidence pipeline** writes structured JSON documents to S3 under the agreed key prefix and optionally publishes the same payload to SNS for observability. Each write also logs metadata into the `evidence_events` table for traceability.【F:beyla-sandbox-api/src/services/evidence.ts†L1-L57】【F:beyla-sandbox-api/src/services/audit-log.ts†L1-L19】

### Data model

The initial migration defines the relational schema for accounts, balances, transactions, alerts, and evidence events used by the sandbox and its audit tooling.【F:beyla-sandbox-api/src/db/migrations/0001_init.sql†L1-L48】

```mermaid
graph TD
  Accounts[[accounts]] -->|1:M| Balances[[balances]]
  Accounts -->|1:M| Transactions[[transactions]]
  Accounts -->|1:M| Alerts[[alerts]]
  EvidenceEvents[[evidence_events]] -->|Tracks correlation_id| Transactions
  EvidenceEvents -->|Tracks correlation_id| Alerts
```

## Request lifecycle

The following sequence illustrates what happens when an operator submits a new transaction from the dashboard:

```mermaid
sequenceDiagram
  participant U as User
  participant FE as Next.js Frontend
  participant API as Express API
  participant DB as PostgreSQL
  participant S3 as S3 Evidence Bucket
  participant SNS as SNS Topic

  U->>FE: Submit "Add Transaction"
  FE->>API: POST /transactions (JSON body)
  API->>API: Validate payload & build audit context
  API->>DB: INSERT transaction row
  DB-->>API: Created transaction
  API->>S3: PutObject evidence JSON
  API->>SNS: Publish evidence payload (optional)
  API-->>FE: 201 Created + transaction data
  FE-->>U: Refresh list & confirmation toast
```

* The frontend uses the `useTransactions` hook to post the request and refresh its local state once the API responds.【F:frontend/lib/api.ts†L75-L131】
* The route handler validates input, writes the transaction, emits evidence, and returns the normalized payload for the UI.【F:beyla-sandbox-api/src/routes/transactions.ts†L1-L95】
* `recordEvidenceEvent` captures the S3 key and correlation ID in Postgres so operators can audit what was written to object storage.【F:beyla-sandbox-api/src/services/audit-log.ts†L1-L19】

## Alert and audit flow

Alerts follow the same evidence pipeline and expose a presigned evidence URL through `/alerts/:id/evidence`, which the frontend resolves when an operator taps "View evidence". Evidence payloads mirror the S3 content path `env=<env>/date=<YYYY-MM-DD>/corr=<UUID>/event-<ISO>.json`, helping downstream analysis tools segment by environment and request correlation.【F:beyla-sandbox-api/src/routes/alerts.ts†L1-L72】【F:beyla-sandbox-api/src/services/evidence.ts†L21-L57】

## External dataset access

Operators can enrich sandbox sessions with sample UK SME data sourced from the NayaOne sandpit. The frontend invokes `GET /datasets/nayaone`, which the API validates and then fans out to the hosted dataset with the stored sandpit key. Offsets must be multiples of 10 as per the provider contract, and the response returns the upstream payload alongside the computed `nextOffset` for easy pagination.【F:frontend/app/datasets/page.tsx†L1-L121】【F:beyla-sandbox-api/src/routes/datasets.ts†L1-L34】

For a narrative walkthrough of how these datasets surface inside the product experience—from login to alerts and audit trails—see [Synthetic data user journey](docs/synthetic-data-user-journey.md).

## Deployment topology

Terraform composes reusable modules for the AWS environment:

* **Networking** – VPC with public and private subnets, plus discrete security groups for the ALB and ECS service.【F:infra-aws/main.tf†L15-L38】
* **Compute** – ECS Fargate service running the API container with an HTTPS Application Load Balancer and health checks against `/health/ready`.【F:infra-aws/main.tf†L59-L76】
* **Stateful services** – RDS PostgreSQL instance and S3 evidence bucket bound to the task role via IAM policies.【F:infra-aws/main.tf†L23-L51】
* **Observability fan-out** – SNS topic and SQS subscription for agent event monitoring, plus optional consumers (e.g., analytics, alerting bots).【F:infra-aws/main.tf†L53-L58】

When deploying, publish a new API image to ECR, update the Terraform variables (`image_url`, `task_environment`, `task_secrets`), and apply. The frontend can be hosted on Vercel, CloudFront, or an additional ECS service configured with the same Cognito environment.

## Local development workflow

1. **Database** – `docker compose up -d db` boots the Postgres container, `npm run migrate` applies schema changes and ingests the NayaOne dataset, and `npm run seed` forces a full re-import if you need a clean reset.【F:readme.md†L16-L35】【F:beyla-sandbox-api/scripts/migrate.ts†L1-L43】【F:beyla-sandbox-api/scripts/seed.ts†L1-L27】
2. **API** – `npm run dev` launches the Express server with hot reload, writing evidence to the configured bucket or logging warnings if AWS credentials are absent.【F:beyla-sandbox-api/src/index.ts†L1-L61】
3. **Frontend** – Run `npm run dev` in `frontend/` with `NEXT_PUBLIC_API_BASE_URL` pointing at `http://localhost:8080`. The sandbox session automatically renders the operator identity without additional setup.【F:frontend/README.md†L13-L52】【F:frontend/lib/auth-context.tsx†L1-L44】

## Security and compliance considerations

* The sandbox middleware stamps each request with a fixed operator identity so audit records remain consistent even without Cognito or JWT enforcement in development environments.【F:beyla-sandbox-api/src/middlewares/auth.ts†L1-L20】【F:beyla-sandbox-api/src/middlewares/request-context.ts†L18-L25】
* Every mutating request writes an immutable JSON trail to S3 and, optionally, SNS for monitoring tools to consume. Evidence keys include the environment, event date, and correlation ID to simplify retention policies and investigations.【F:beyla-sandbox-api/src/routes/transactions.ts†L59-L89】【F:beyla-sandbox-api/src/services/evidence.ts†L21-L57】
* IAM roles from Terraform grant the ECS task least-privilege access to read secrets and write evidence objects, keeping database credentials in AWS Secrets Manager rather than baked into images.【F:infra-aws/main.tf†L40-L76】

## Extensibility roadmap

* **Analytics consumers** can subscribe to the `agent-events` queue for near-real-time monitoring without modifying the API layer.【F:infra-aws/main.tf†L53-L58】
* **Cognito integration** for production hardening can be layered on by replacing the sandbox auth provider with a Hosted UI flow using the existing environment variables scaffold.【F:frontend/README.md†L28-L45】
* **Additional domains** (e.g., payments, KYC) can extend the API by adding new route modules and repositories while reusing the existing middleware, audit pipeline, and Terraform scaffolding.
