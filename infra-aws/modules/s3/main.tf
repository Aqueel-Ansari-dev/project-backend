resource "aws_s3_bucket" "evidence" {
  bucket = "${var.project}-evidence-${var.env}"

  tags = {
    Name    = "${var.project}-${var.env}-evidence"
    Project = var.project
    Env     = var.env
  }
}

resource "aws_s3_bucket_public_access_block" "this" {
  bucket = aws_s3_bucket.evidence.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_versioning" "this" {
  bucket = aws_s3_bucket.evidence.id

  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_lifecycle_configuration" "this" {
  bucket = aws_s3_bucket.evidence.id

  rule {
    id     = "evidence-glacier"
    status = "Enabled"

    transition {
      days          = 30
      storage_class = "STANDARD_IA"
    }

    transition {
      days          = 90
      storage_class = "GLACIER"
    }

    noncurrent_version_transition {
      noncurrent_days = 30
      storage_class   = "STANDARD_IA"
    }
  }
}

output "bucket_name" {
  value = aws_s3_bucket.evidence.bucket
}

output "bucket_arn" {
  value = aws_s3_bucket.evidence.arn
}
