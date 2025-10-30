import { Pool } from 'pg';
import { v4 as uuid } from 'uuid';

import 'dotenv/config';

const client = new Pool({ connectionString: process.env.DB_URL });

async function run() {
  const accountId = uuid();
  await client.query('INSERT INTO accounts (id, name, currency) VALUES ($1, $2, $3)', [
    accountId,
    'Sandbox Checking',
    'GBP',
  ]);

  await client.query(
    'INSERT INTO balances (account_id, as_of_date, amount, currency) VALUES ($1, $2, $3, $4)',
    [accountId, new Date().toISOString().slice(0, 10), 10500.23, 'GBP']
  );

  for (let i = 0; i < 10; i += 1) {
    await client.query(
      `INSERT INTO transactions (account_id, amount, currency, description, category, direction, ts)
       VALUES ($1, $2, $3, $4, $5, $6, NOW() - $7::interval)`,
      [
        accountId,
        Math.round(Math.random() * 20000) / 100,
        'GBP',
        `Synthetic transaction #${i + 1}`,
        i % 2 === 0 ? 'payment' : 'income',
        i % 2 === 0 ? 'out' : 'in',
        `${i} days`,
      ]
    );
  }

  await client.query(
    `INSERT INTO alerts (account_id, type, status, payload)
     VALUES ($1, $2, $3, $4)`,
    [accountId, 'balance.threshold', 'open', JSON.stringify({ threshold: 5000, actual: 4800 })]
  );
}

run()
  .then(() => {
    // eslint-disable-next-line no-console
    console.log('Database seeded');
    return client.end();
  })
  .catch((err) => {
    console.error(err);
    return client.end().then(() => process.exit(1));
  });
