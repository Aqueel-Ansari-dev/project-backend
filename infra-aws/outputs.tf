output "vpc_id" {
  value = module.vpc.vpc_id
}

output "private_subnet_ids" {
  value = module.vpc.private_subnet_ids
}

output "public_subnet_ids" {
  value = module.vpc.public_subnet_ids
}

output "db_endpoint" {
  value = module.rds.endpoint
}

output "evidence_bucket" {
  value = module.s3.bucket_name
}

output "alb_dns" {
  value = module.ecs.alb_dns
}

output "sns_topic_arn" {
  value = module.sns_sqs.topic_arn
}

output "sqs_queue_url" {
  value = module.sns_sqs.queue_url
}

output "app_security_group_id" {
  value = module.vpc.app_security_group_id
}

output "alb_security_group_id" {
  value = module.vpc.alb_security_group_id
}

output "db_security_group_id" {
  value = module.rds.security_group_id
}

output "ecr_repository_url" {
  value = module.ecr.repository_url
}
