import { Pool } from 'pg';

import 'dotenv/config';

import { importNayaOneDataAndReset } from './nayaone-importer.js';

const client = new Pool({ connectionString: process.env.DB_URL });

async function run() {
  const stats = await importNayaOneDataAndReset(client);
  // eslint-disable-next-line no-console
  console.log(
    `Reset database and imported ${stats.accounts} accounts, ${stats.balances} balances, ${stats.transactions} transactions, ${stats.alerts} alerts from NayaOne dataset`
  );
}

run()
  .then(() => client.end())
  .catch((err) => {
    // eslint-disable-next-line no-console
    console.error(err);
    return client.end().then(() => process.exit(1));
  });
