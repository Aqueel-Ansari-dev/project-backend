import type { PoolClient } from 'pg';

import { pool } from './pool.js';

export interface UserRecord {
  id: string;
  email: string;
  password_hash: string;
  first_name: string;
  last_name: string;
  company_name: string;
  company_reg_number: string;
  sector: string | null;
  created_at: string;
}

export interface CreateUserInput {
  email: string;
  passwordHash: string;
  firstName: string;
  lastName: string;
  companyName: string;
  companyRegNumber: string;
  sector?: string;
}

export async function findUserByEmail(email: string, client: PoolClient = pool): Promise<UserRecord | null> {
  const { rows } = await client.query<UserRecord>('SELECT * FROM users WHERE email = $1', [email]);
  return rows[0] ?? null;
}

export async function createUser(input: CreateUserInput, client: PoolClient = pool): Promise<UserRecord> {
  const { rows } = await client.query<UserRecord>(
    `INSERT INTO users (email, password_hash, first_name, last_name, company_name, company_reg_number, sector)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING *`,
    [
      input.email,
      input.passwordHash,
      input.firstName,
      input.lastName,
      input.companyName,
      input.companyRegNumber,
      input.sector ?? null,
    ]
  );

  return rows[0];
}

export async function recordSmeProfile(
  userId: string,
  dataset: Record<string, unknown>,
  client: PoolClient = pool
): Promise<void> {
  await client.query('INSERT INTO sme_profiles (user_id, dataset) VALUES ($1, $2)', [userId, JSON.stringify(dataset)]);
}

export async function getLatestSmeProfile(
  userId: string,
  client: PoolClient = pool
): Promise<{ dataset: Record<string, unknown>; created_at: string } | null> {
  const { rows } = await client.query<{ dataset: Record<string, unknown>; created_at: string }>(
    `SELECT dataset, created_at FROM sme_profiles
     WHERE user_id = $1
     ORDER BY created_at DESC
     LIMIT 1`,
    [userId]
  );

  return rows[0] ?? null;
}
