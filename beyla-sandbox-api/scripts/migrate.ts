import fs from 'node:fs';
import path from 'node:path';

import { Pool } from 'pg';

import 'dotenv/config';

const client = new Pool({ connectionString: process.env.DB_URL });

async function run() {
  const migrationsDir = path.join(process.cwd(), 'src', 'db', 'migrations');
  const files = fs
    .readdirSync(migrationsDir)
    .filter((file) => file.endsWith('.sql'))
    .sort();

  for (const file of files) {
    const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf-8');
    // eslint-disable-next-line no-console
    console.log(`Applying migration ${file}`);
    await client.query(sql);
  }
}

run()
  .then(() => {
    // eslint-disable-next-line no-console
    console.log('Migrations applied successfully');
    return client.end();
  })
  .catch((err) => {
    console.error(err);
    return client.end().then(() => process.exit(1));
  });
