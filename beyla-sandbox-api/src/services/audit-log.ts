import { pool } from '../db/pool.js';

export async function recordEvidenceEvent(params: {
  correlationId: string;
  s3Key: string;
  actor?: { id: string; type: string };
  action: string;
}) {
  await pool.query(
    `INSERT INTO evidence_events (correlation_id, s3_key, actor, action)
     VALUES ($1, $2, $3, $4)`,
    [
      params.correlationId,
      params.s3Key,
      params.actor ? JSON.stringify(params.actor) : null,
      params.action,
    ]
  );
}
