resource "aws_ecr_repository" "api" {
  name                 = "${var.project}-api"
  image_tag_mutability = "MUTABLE"
  image_scanning_configuration {
    scan_on_push = true
  }
  tags = {
    Name    = "${var.project}-api"
    Project = var.project
  }
}

output "repository_url" {
  value = aws_ecr_repository.api.repository_url
}
