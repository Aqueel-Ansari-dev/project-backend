data "aws_iam_policy_document" "task_assume" {
  statement {
    actions = ["sts:AssumeRole"]
    effect  = "Allow"
    principals {
      type        = "Service"
      identifiers = ["ecs-tasks.amazonaws.com"]
    }
  }
}

resource "aws_iam_role" "task" {
  name               = "${var.project}-${var.env}-task"
  assume_role_policy = data.aws_iam_policy_document.task_assume.json
}

resource "aws_iam_role" "execution" {
  name               = "${var.project}-${var.env}-execution"
  assume_role_policy = data.aws_iam_policy_document.task_assume.json
}

resource "aws_iam_role_policy_attachment" "execution" {
  role       = aws_iam_role.execution.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}

data "aws_iam_policy_document" "task" {
  statement {
    effect = "Allow"
    actions = ["s3:PutObject", "s3:PutObjectAcl"]
    resources = ["${var.evidence_bucket_arn}/*"]
  }

  statement {
    effect = "Allow"
    actions = ["logs:CreateLogStream", "logs:PutLogEvents"]
    resources = ["*"]
  }

  statement {
    effect = "Allow"
    actions = ["sns:Publish"]
    resources = ["*"]
  }

  dynamic "statement" {
    for_each = length(var.secrets_arns) > 0 ? [var.secrets_arns] : []
    content {
      effect    = "Allow"
      actions   = ["secretsmanager:GetSecretValue"]
      resources = statement.value
    }
  }
}

resource "aws_iam_policy" "task" {
  name        = "${var.project}-${var.env}-task"
  description = "Allow task access to S3 evidence bucket, logs, SNS, and secrets"
  policy      = data.aws_iam_policy_document.task.json
}

resource "aws_iam_role_policy_attachment" "task" {
  role       = aws_iam_role.task.name
  policy_arn = aws_iam_policy.task.arn
}

output "task_role_arn" {
  value = aws_iam_role.task.arn
}

output "execution_role_arn" {
  value = aws_iam_role.execution.arn
}
