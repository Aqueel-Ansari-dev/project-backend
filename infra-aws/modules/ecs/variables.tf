variable "project" { type = string }
variable "env" { type = string }
variable "vpc_id" { type = string }
variable "private_subnet_ids" { type = list(string) }
variable "public_subnet_ids" { type = list(string) }
variable "cluster_desired_count" { type = number }
variable "container_port" { type = number }
variable "image_url" { type = string }
variable "task_role_arn" { type = string }
variable "execution_role_arn" { type = string }
variable "service_security_group_ids" { type = list(string) }
variable "load_balancer_security_group_ids" { type = list(string) }
variable "load_balancer_certificate_arn" { type = string }
variable "health_check_path" { type = string }
variable "secrets" {
  type = list(object({
    name      = string
    valueFrom = string
  }))
}
variable "environment" {
  type = list(object({
    name  = string
    value = string
  }))
}
