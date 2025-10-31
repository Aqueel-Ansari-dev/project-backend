# Beyla Sandbox Backend

This repository contains two projects that deliver the Beyla sandbox backend from API to AWS infrastructure.

## Projects

### `beyla-sandbox-api`

TypeScript/Express service that exposes the sandbox API backed by PostgreSQL and S3 evidence logging.

Key features:

- REST endpoints `/health`, `/balances`, `/transactions`, `/alerts` with JWT authentication for protected routes.
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
# update AWS credentials, JWT secret, and overrides if needed
npm run migrate
npm run seed
npm run dev
```

Example requests:

```bash
curl localhost:8080/health/live
curl -H "Authorization: Bearer <token>" localhost:8080/balances
curl -H "Authorization: Bearer <token>" -X POST localhost:8080/transactions \
  -H "Content-Type: application/json" \
  -d '{"account_id":"<uuid>","amount":250,"currency":"GBP","direction":"out"}'
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

## Deployment workflow

1. Build and push the API container to the provisioned ECR repository.
2. Apply Terraform with the new image tag and Secrets Manager ARNs.
3. Verify the ECS service is healthy via the ALB `/health/ready` endpoint and confirm evidence files in S3.
4. Share weekly status updates referencing API coverage, infrastructure state, and any risks/blockers.

## Repository structure

```
.
├── beyla-sandbox-api/  # Express API source, scripts, Dockerfile
└── infra-aws/          # Terraform infrastructure as code
```
