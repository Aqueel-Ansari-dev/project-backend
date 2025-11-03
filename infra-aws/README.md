# Beyla Sandbox AWS Infrastructure

Terraform configuration provisioning the AWS foundation required to run the Beyla sandbox API in Fargate.

## Modules

- `vpc` – VPC, public/private subnets, Internet/NAT gateways, and security groups for the ALB and ECS tasks.
- `s3` – Evidence S3 bucket with public access blocking, versioning, and lifecycle rules (30/90 day transitions).
- `rds` – PostgreSQL (db.t4g.small) deployed across private subnets.
- `ecr` – Container registry for the API image.
- `iam` – Task/execution roles with policies for S3, Secrets Manager, CloudWatch Logs, and SNS.
- `sns-sqs` – `agent-events` topic with a subscribed SQS queue for observability.
- `ecs` – ECS cluster, task definition, HTTPS Application Load Balancer, and Fargate service wiring.

## Usage

```bash
terraform init
terraform apply \
  -var="db_username=<dbuser>" \
  -var="db_password=<dbpass>" \
  -var="image_url=<aws_account_id>.dkr.ecr.<region>.amazonaws.com/beyla-sandbox-api:<tag>" \
  -var="certificate_arn=<acm-certificate-arn>" \
  -var='task_secrets=[{"name":"DB_URL","valueFrom":"<secret-arn>"}]' \
  -var='task_environment=[{"name":"APP_ENV","value":"dev"},{"name":"EVIDENCE_BUCKET","value":"beyla-evidence-dev"}]'
```

Outputs provide the VPC/subnet IDs, ALB DNS name, evidence bucket name, SNS topic ARN, queue URL, and more.

Ensure AWS credentials are exported (or provided via your preferred method) before running Terraform.
