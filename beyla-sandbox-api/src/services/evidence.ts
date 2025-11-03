import AWS from 'aws-sdk';

const s3 = new AWS.S3({ region: process.env.AWS_REGION ?? 'eu-west-2' });
const sns = new AWS.SNS({ region: process.env.AWS_REGION ?? 'eu-west-2' });

export interface EvidencePayload {
  correlation_id: string;
  actor?: {
    type: string;
    id: string;
  };
  action: string;
  request: Record<string, unknown>;
  response: Record<string, unknown>;
  explain?: string;
  ts: string;
  service: string;
  ip?: string;
}

export async function writeEvidence(
  keyPrefix: string,
  body: EvidencePayload
): Promise<{ key: string }> {
  const bucket = process.env.EVIDENCE_BUCKET;
  if (!bucket) {
    throw new Error('EVIDENCE_BUCKET environment variable is required');
  }

  const Key = `${keyPrefix}/event-${new Date().toISOString()}.json`;

  await s3
    .putObject({
      Bucket: bucket,
      Key,
      Body: JSON.stringify(body),
      ContentType: 'application/json',
    })
    .promise();

  if (process.env.SNS_TOPIC_ARN) {
    await sns
      .publish({
        TopicArn: process.env.SNS_TOPIC_ARN,
        Message: JSON.stringify(body),
        MessageAttributes: {
          correlation_id: {
            DataType: 'String',
            StringValue: body.correlation_id,
          },
        },
      })
      .promise();
  }

  return { key: Key };
}
