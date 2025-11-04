# Beyla Sandbox Platform

This repository contains the Beyla sandbox backend API, AWS infrastructure as code, and a mobile-friendly Next.js frontend for demoing the experience end-to-end.

## Projects

### `beyla-sandbox-api`

TypeScript/Express service that exposes the sandbox API backed by PostgreSQL and S3 evidence logging.

Key features:

- REST endpoints `/health`, `/balances`, `/transactions`, `/alerts` available without authentication for sandbox testing.
- `/datasets/nayaone` proxy that securely fetches the synthetic UK SME dataset from NayaOne using the configured sandpit key.
- PostgreSQL schema and SQL migrations plus simple seeding script for synthetic account data.
- Evidence log writer that publishes structured audit JSON to S3 using the agreed key format and records metadata to PostgreSQL.
- Optional SNS fan-out for agent observability by publishing each evidence payload to the `agent-events` topic.
- Request correlation IDs, structured Pino logging, and Dockerfile ready for multi-stage production images.

Getting started locally:

```bash
cd beyla-sandbox-api
docker compose up -d db   # provision local Postgres via Docker
npm install
cp .env.example .env
# update AWS credentials and overrides if needed
npm run migrate
npm run seed
npm run dev
```

Example requests:

```bash
curl localhost:8080/health/live
curl localhost:8080/balances
curl -X POST localhost:8080/transactions \
  -H "Content-Type: application/json" \
  -d '{"account_id":"<uuid>","amount":250,"currency":"GBP","direction":"out"}'
curl "localhost:8080/datasets/nayaone?offset=0"
```

### `infra-aws`

Terraform configuration that provisions the AWS footprint for the sandbox.

Provisioned resources:

- VPC with public/private subnets, Internet/NAT gateways, and security groups for ALB/app access.
- S3 evidence bucket with block-public-access, versioning, and lifecycle policies.
- RDS PostgreSQL (t4g.small) in private subnets.
- ECR repository for container images.
- IAM roles/policies for ECS tasks with access to Secrets Manager and the evidence bucket.
- SNS topic + SQS queue (`agent-events`) for agent observability.
- ECS Fargate service fronted by an HTTPS Application Load Balancer.

Usage:

```bash
cd infra-aws
terraform init
terraform apply \
  -var="db_username=<dbuser>" \
  -var="db_password=<dbpass>" \
  -var="image_url=<aws_account_id>.dkr.ecr.<region>.amazonaws.com/beyla-sandbox-api:latest" \
  -var="certificate_arn=<acm-cert-arn>" \
  -var='task_secrets=[{"name":"DB_URL","valueFrom":"<secret-arn>"}]'
```

Outputs include VPC/subnet IDs, database endpoint, evidence bucket name, and ALB DNS record for the deployed service.

### `frontend`

Next.js 14 dashboard that consumes the sandbox API with a built-in sandbox session (no authentication required locally).

Highlights:

- Sandbox session that displays a configurable operator name/email without requiring Cognito.
- Dashboard home summarizing balances and recent transactions with responsive cards.
- Transactions workspace with modal form to create synthetic ledger entries via `POST /transactions`.
- Alerts view featuring status badges and audit evidence deep links.
- Dataset explorer that pages through the NayaOne sandpit results via the backend proxy endpoint.
- Settings page for future profile preferences.
- Tailwind CSS and shadcn-inspired UI primitives tuned for mobile and desktop.

Getting started:

```bash
cd frontend
cp .env.example .env.local
npm install
npm run dev
```

Set `NEXT_PUBLIC_API_BASE_URL` to your API endpoint. The optional Cognito variables can remain for future production hardening, but local sandbox flows will work with only the API URL and optional display metadata.

## Deployment workflow

1. Build and push the API container to the provisioned ECR repository.
2. Apply Terraform with the new image tag and Secrets Manager ARNs.
3. Deploy the frontend (Vercel, CloudFront, or ECS Fargate) with the environment variables pointing at the API and Cognito user pool.
4. Verify the ECS service is healthy via the ALB `/health/ready` endpoint, confirm evidence files in S3, and run through the frontend demo (login → dashboard → create transaction → view alert → open audit log → browse NayaOne dataset).

## Repository structure

```
.
├── beyla-sandbox-api/  # Express API source, scripts, Dockerfile
├── frontend/           # Next.js dashboard for Cognito-authenticated operators
└── infra-aws/          # Terraform infrastructure as code
```
