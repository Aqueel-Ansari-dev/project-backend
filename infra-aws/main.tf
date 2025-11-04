terraform {
  required_version = ">= 1.6.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.region
}

module "vpc" {
  source   = "./modules/vpc"
  project  = var.project
  env      = var.env
  cidr_block = var.vpc_cidr
  azs      = var.azs
}

module "s3" {
  source  = "./modules/s3"
  project = var.project
  env     = var.env
}

module "rds" {
  source            = "./modules/rds"
  project           = var.project
  env               = var.env
  vpc_id            = module.vpc.vpc_id
  private_subnet_ids = module.vpc.private_subnet_ids
  db_username       = var.db_username
  db_password       = var.db_password
  app_security_group_id = module.vpc.app_security_group_id
}

module "ecr" {
  source  = "./modules/ecr"
  project = var.project
}

module "iam" {
  source             = "./modules/iam"
  project            = var.project
  env                = var.env
  evidence_bucket_arn = module.s3.bucket_arn
  secrets_arns        = var.secrets_arns
}

module "sns_sqs" {
  source    = "./modules/sns-sqs"
  project   = var.project
  env       = var.env
}

module "ecs" {
  source              = "./modules/ecs"
  project             = var.project
  env                 = var.env
  vpc_id              = module.vpc.vpc_id
  private_subnet_ids  = module.vpc.private_subnet_ids
  public_subnet_ids   = module.vpc.public_subnet_ids
  cluster_desired_count = var.desired_count
  container_port      = 8080
  image_url           = var.image_url
  task_role_arn       = module.iam.task_role_arn
  execution_role_arn  = module.iam.execution_role_arn
  service_security_group_ids  = [module.vpc.app_security_group_id]
  load_balancer_security_group_ids = [module.vpc.alb_security_group_id]
  load_balancer_certificate_arn = var.certificate_arn
  health_check_path   = "/health/ready"
  secrets             = var.task_secrets
  environment         = var.task_environment
}
