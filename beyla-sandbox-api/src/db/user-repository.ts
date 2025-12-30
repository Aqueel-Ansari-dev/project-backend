import type { PoolClient } from 'pg';

import { pool } from './pool.js';

type Queryable = Pick<PoolClient, 'query'>;

let ensureSchemaPromise: Promise<void> | null = null;

async function ensureUserSchema(client: Queryable = pool): Promise<void> {
  if (!ensureSchemaPromise) {
    ensureSchemaPromise = (async () => {
      await client.query(`
        CREATE TABLE IF NOT EXISTS users (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          email TEXT NOT NULL UNIQUE,
          password_hash TEXT,
          cognito_sub TEXT UNIQUE,
          first_name TEXT NOT NULL,
          last_name TEXT NOT NULL,
          company_name TEXT NOT NULL,
          company_reg_number TEXT NOT NULL,
          sector TEXT,
          created_at TIMESTAMPTZ DEFAULT NOW()
        )
      `);

      await client.query(`
        ALTER TABLE users
        ADD COLUMN IF NOT EXISTS cognito_sub TEXT UNIQUE
      `);

      await client.query(`
        ALTER TABLE users
        ALTER COLUMN password_hash DROP NOT NULL
      `);

      await client.query(`
        CREATE TABLE IF NOT EXISTS sme_profiles (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          dataset JSONB NOT NULL,
          created_at TIMESTAMPTZ DEFAULT NOW()
        )
      `);
    })()
      .catch((err) => {
        ensureSchemaPromise = null;
        throw err;
      });
  }

  await ensureSchemaPromise;
}

export interface UserRecord {
  id: string;
  email: string;
  password_hash: string | null;
  cognito_sub: string | null;
  first_name: string;
  last_name: string;
  company_name: string;
  company_reg_number: string;
  sector: string | null;
  created_at: string;
}

export interface CreateUserInput {
  email: string;
  passwordHash?: string | null;
  cognitoSub?: string | null;
  firstName: string;
  lastName: string;
  companyName: string;
  companyRegNumber: string;
  sector?: string;
}

export interface UpdateUserProfileInput {
  email: string;
  cognitoSub?: string | null;
  firstName?: string;
  lastName?: string;
  companyName?: string;
  companyRegNumber?: string;
  sector?: string | null;
}

export async function findUserByEmail(email: string, client: Queryable = pool): Promise<UserRecord | null> {
  await ensureUserSchema(client);
  const { rows } = await client.query<UserRecord>('SELECT * FROM users WHERE email = $1', [email]);
  return rows[0] ?? null;
}

export async function findUserByCognitoSub(cognitoSub: string, client: Queryable = pool): Promise<UserRecord | null> {
  await ensureUserSchema(client);
  const { rows } = await client.query<UserRecord>('SELECT * FROM users WHERE cognito_sub = $1', [cognitoSub]);
  return rows[0] ?? null;
}

export async function createUser(input: CreateUserInput, client: Queryable = pool): Promise<UserRecord> {
  await ensureUserSchema(client);
  const { rows } = await client.query<UserRecord>(
    `INSERT INTO users (email, password_hash, cognito_sub, first_name, last_name, company_name, company_reg_number, sector)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING *`,
    [
      input.email,
      input.passwordHash ?? null,
      input.cognitoSub ?? null,
      input.firstName,
      input.lastName,
      input.companyName,
      input.companyRegNumber,
      input.sector ?? null,
    ]
  );

  return rows[0];
}

export async function updateUserProfileByEmail(
  input: UpdateUserProfileInput,
  client: Queryable = pool
): Promise<UserRecord | null> {
  await ensureUserSchema(client);
  const { rows } = await client.query<UserRecord>(
    `UPDATE users
     SET cognito_sub = COALESCE($1, cognito_sub),
         first_name = COALESCE($2, first_name),
         last_name = COALESCE($3, last_name),
         company_name = COALESCE($4, company_name),
         company_reg_number = COALESCE($5, company_reg_number),
         sector = COALESCE($6, sector)
     WHERE email = $7
     RETURNING *`,
    [
      input.cognitoSub ?? null,
      input.firstName ?? null,
      input.lastName ?? null,
      input.companyName ?? null,
      input.companyRegNumber ?? null,
      input.sector ?? null,
      input.email,
    ]
  );

  return rows[0] ?? null;
}

export async function recordSmeProfile(
  userId: string,
  dataset: Record<string, unknown>,
  client: Queryable = pool
): Promise<{ dataset: Record<string, unknown>; created_at: string }> {
  await ensureUserSchema(client);
  const { rows } = await client.query<{ dataset: Record<string, unknown>; created_at: string }>(
    'INSERT INTO sme_profiles (user_id, dataset) VALUES ($1, $2) RETURNING dataset, created_at',
    [userId, JSON.stringify(dataset)]
  );

  const row = rows[0];
  if (!row) {
    throw new Error('Failed to record SME profile snapshot');
  }

  return row;
}

export async function getLatestSmeProfile(
  userId: string,
  client: Queryable = pool
): Promise<{ dataset: Record<string, unknown>; created_at: string } | null> {
  await ensureUserSchema(client);
  const { rows } = await client.query<{ dataset: Record<string, unknown>; created_at: string }>(
    `SELECT dataset, created_at FROM sme_profiles
     WHERE user_id = $1
     ORDER BY created_at DESC
     LIMIT 1`,
    [userId]
  );

  return rows[0] ?? null;
}
