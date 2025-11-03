output "cluster_name" {
  value = aws_ecs_cluster.this.name
}

output "service_name" {
  value = aws_ecs_service.api.name
}

output "alb_dns" {
  value = aws_lb.app.dns_name
}
