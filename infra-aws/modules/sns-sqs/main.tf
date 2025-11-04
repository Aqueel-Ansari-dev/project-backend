resource "aws_sns_topic" "agent_events" {
  name = "${var.project}-${var.env}-agent-events"
  tags = {
    Project = var.project
    Env     = var.env
  }
}

resource "aws_sqs_queue" "agent_events" {
  name = "${var.project}-${var.env}-agent-events"
  tags = {
    Project = var.project
    Env     = var.env
  }
}

resource "aws_sns_topic_subscription" "queue" {
  topic_arn = aws_sns_topic.agent_events.arn
  protocol  = "sqs"
  endpoint  = aws_sqs_queue.agent_events.arn
}

resource "aws_sqs_queue_policy" "allow_sns" {
  queue_url = aws_sqs_queue.agent_events.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect    = "Allow"
        Principal = "*"
        Action    = "sqs:SendMessage"
        Resource  = aws_sqs_queue.agent_events.arn
        Condition = {
          ArnEquals = {
            "aws:SourceArn" = aws_sns_topic.agent_events.arn
          }
        }
      }
    ]
  })
}

output "topic_arn" {
  value = aws_sns_topic.agent_events.arn
}

output "queue_url" {
  value = aws_sqs_queue.agent_events.id
}
