resource "aws_db_subnet_group" "this" {
  name       = "${var.project}-${var.env}-db"
  subnet_ids = var.private_subnet_ids
  tags = {
    Name    = "${var.project}-${var.env}-db"
    Project = var.project
    Env     = var.env
  }
}

resource "aws_security_group" "db" {
  name        = "${var.project}-${var.env}-db"
  description = "Postgres access from app security group"
  vpc_id      = var.vpc_id

  dynamic "ingress" {
    for_each = var.app_security_group_id != null ? [var.app_security_group_id] : []
    content {
      from_port       = 5432
      to_port         = 5432
      protocol        = "tcp"
      security_groups = [ingress.value]
    }
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name    = "${var.project}-${var.env}-db"
    Project = var.project
    Env     = var.env
  }
}

resource "aws_db_instance" "this" {
  identifier              = "${var.project}-${var.env}"
  instance_class          = "db.t4g.small"
  allocated_storage       = 20
  engine                  = "postgres"
  engine_version          = "15"
  username                = var.db_username
  password                = var.db_password
  db_subnet_group_name    = aws_db_subnet_group.this.name
  vpc_security_group_ids  = [aws_security_group.db.id]
  skip_final_snapshot     = true
  publicly_accessible     = false
  storage_encrypted       = true
  backup_retention_period = 7
  deletion_protection     = false
  apply_immediately       = true
  tags = {
    Name    = "${var.project}-${var.env}-db"
    Project = var.project
    Env     = var.env
  }
}

output "endpoint" {
  value = aws_db_instance.this.address
}

output "security_group_id" {
  value = aws_security_group.db.id
}
