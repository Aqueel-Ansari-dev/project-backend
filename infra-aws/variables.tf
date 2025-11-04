variable "project" {
  description = "Project name prefix"
  type        = string
  default     = "beyla-sandbox"
}

variable "env" {
  description = "Deployment environment"
  type        = string
  default     = "dev"
}

variable "region" {
  description = "AWS region"
  type        = string
  default     = "eu-west-2"
}

variable "vpc_cidr" {
  type    = string
  default = "10.30.0.0/16"
}

variable "azs" {
  type    = list(string)
  default = ["eu-west-2a", "eu-west-2b"]
}

variable "db_username" {
  type = string
}

variable "db_password" {
  type      = string
  sensitive = true
}

variable "image_url" {
  type        = string
  description = "ECR image URL for the application"
}

variable "certificate_arn" {
  type        = string
  description = "ACM certificate ARN for the load balancer"
}

variable "secrets_arns" {
  type        = list(string)
  description = "List of Secrets Manager ARNs to grant the task role"
  default     = []
}

variable "desired_count" {
  type    = number
  default = 1
}

variable "task_secrets" {
  type = list(object({
    name      = string
    valueFrom = string
  }))
  default = []
}

variable "task_environment" {
  type = list(object({
    name  = string
    value = string
  }))
  default = []
}
