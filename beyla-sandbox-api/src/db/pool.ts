import { Pool, types } from 'pg';

types.setTypeParser(114, (val) => JSON.parse(val));
types.setTypeParser(3802, (val) => JSON.parse(val));

const connectionString = process.env.DB_URL;

if (!connectionString) {
  throw new Error('DB_URL environment variable is required');
}

export const pool = new Pool({
  connectionString,
  ssl:
    process.env.DB_SSL === 'true'
      ? {
          rejectUnauthorized: false,
        }
      : undefined,
});

export type DbClient = typeof pool;
