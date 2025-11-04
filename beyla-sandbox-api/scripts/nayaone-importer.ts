import { Pool } from 'pg';

import { fetchNayaOneDataset } from '../src/services/nayaone.js';

interface ImportStats {
  accounts: number;
  balances: number;
  transactions: number;
  alerts: number;
  skipped: boolean;
}

interface NormalizedRecord {
  syntheticId: string;
  accountName: string;
  currency: string;
  balanceAmount: number;
  balanceAsOf: string;
  payInAmount?: number;
  payOutAmount?: number;
  revenueAmount?: number;
  cogsAmount?: number;
  capexAmount?: number;
  sector?: string;
  filingDate?: string;
  raw: Record<string, unknown>;
}

interface NormalizedTransaction {
  externalId: string;
  amount: number;
  currency: string;
  description: string;
  category: string;
  direction: 'in' | 'out';
  timestamp: string;
}

interface NormalizedAlert {
  externalId: string;
  type: string;
  status: string;
  payload: Record<string, unknown>;
}

const TRANSACTION_FIELDS: Array<{
  key: keyof NormalizedRecord;
  description: string;
  category: string;
  direction: 'in' | 'out';
}> = [
  { key: 'payInAmount', description: 'Annual pay-ins', category: 'cashflow', direction: 'in' },
  { key: 'payOutAmount', description: 'Annual pay-outs', category: 'cashflow', direction: 'out' },
  { key: 'revenueAmount', description: 'Reported revenue', category: 'revenue', direction: 'in' },
  { key: 'cogsAmount', description: 'Cost of goods sold', category: 'operations', direction: 'out' },
  { key: 'capexAmount', description: 'Capital expenditure', category: 'operations', direction: 'out' },
];

function toCurrency(value: number): number {
  return Math.round(value * 100) / 100;
}

function parseNumber(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed || trimmed.toLowerCase() === 'nan') {
      return undefined;
    }
    const sanitized = trimmed.replace(/,/g, '');
    const parsed = Number(sanitized);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }
  return undefined;
}

function parseDate(value: unknown): string | undefined {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString().slice(0, 10);
  }
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed || trimmed.toLowerCase() === 'nan') {
      return undefined;
    }
    const date = new Date(trimmed);
    if (!Number.isNaN(date.getTime())) {
      return date.toISOString().slice(0, 10);
    }
  }
  return undefined;
}

function parseCurrencyValue(value: unknown): number | undefined {
  const parsed = parseNumber(value);
  return typeof parsed === 'number' ? toCurrency(parsed) : undefined;
}

function extractBalance(record: Record<string, unknown>): number | undefined {
  const amount = parseNumber(record.amount);
  if (typeof amount === 'number') {
    return amount;
  }

  const currentAccountNumbers = record.current_account_numbers ?? record.current_account_numbers_list;
  if (typeof currentAccountNumbers === 'object' && currentAccountNumbers !== null && !Array.isArray(currentAccountNumbers)) {
    const values = Object.values(currentAccountNumbers)
      .map(parseNumber)
      .filter((val): val is number => typeof val === 'number');
    if (values.length > 0) {
      return values.reduce((sum, val) => sum + val, 0);
    }
  }

  if (typeof currentAccountNumbers === 'string' && currentAccountNumbers.startsWith('{') && currentAccountNumbers.endsWith('}')) {
    const stripped = currentAccountNumbers.slice(1, -1);
    const parts = stripped.split(',');
    const values = parts
      .map((part) => part.split(':')[1])
      .map((value) => (value ? parseNumber(value) : undefined))
      .filter((val): val is number => typeof val === 'number');
    if (values.length > 0) {
      return values.reduce((sum, val) => sum + val, 0);
    }
  }

  return undefined;
}

function normalizeRecord(record: Record<string, unknown>, index: number): NormalizedRecord | undefined {
  const syntheticIdCandidate =
    record.current_account_number ??
    record.company_reg_number ??
    record.a ??
    (typeof record.entity_name === 'string' ? record.entity_name : undefined);

  if (!syntheticIdCandidate) {
    return undefined;
  }

  const syntheticId = String(syntheticIdCandidate);

  const accountName =
    (typeof record.entity_trade_name === 'string' && record.entity_trade_name.trim())
      ? record.entity_trade_name.trim()
      : typeof record.entity_name === 'string' && record.entity_name.trim()
        ? record.entity_name.trim()
        : `NayaOne Account ${index + 1}`;

  const currency = typeof record.currency === 'string' && record.currency.trim() ? record.currency.trim() : 'GBP';

  const balanceAmount = extractBalance(record) ?? 0;

  const balanceAsOf =
    parseDate(record.filing_date) ||
    parseDate(record.ca_start_date) ||
    parseDate(record.as_of_date) ||
    parseDate(record.updated_at) ||
    parseDate(record.created_at) ||
    new Date().toISOString().slice(0, 10);

  const normalized: NormalizedRecord = {
    syntheticId,
    accountName,
    currency,
    balanceAmount: toCurrency(balanceAmount),
    balanceAsOf,
    payInAmount: parseCurrencyValue(record.pay_in_amount),
    payOutAmount: parseCurrencyValue(record.pay_out_amount),
    revenueAmount: parseCurrencyValue(record.revenue_2019 ?? record['2019_revenue']),
    cogsAmount: parseCurrencyValue(record.cogs ?? record.costs),
    capexAmount: parseCurrencyValue(record.capex),
    sector: typeof record.primary_sector === 'string' ? record.primary_sector : undefined,
    filingDate: parseDate(record.filing_date),
    raw: JSON.parse(JSON.stringify(record)) as Record<string, unknown>,
  };

  return normalized;
}

function buildTransactions(record: NormalizedRecord): NormalizedTransaction[] {
  const baseDate = record.filingDate ?? record.balanceAsOf;
  const dateObj = new Date(baseDate);
  const transactions: NormalizedTransaction[] = [];

  TRANSACTION_FIELDS.forEach((field, idx) => {
    const amount = record[field.key];
    if (typeof amount !== 'number' || amount === 0) {
      return;
    }
    const ts = new Date(dateObj);
    ts.setDate(ts.getDate() - idx);
    const externalId = `${record.syntheticId}:${field.key}`;
    transactions.push({
      externalId,
      amount: toCurrency(Math.abs(amount)),
      currency: record.currency,
      description: field.description,
      category: field.category,
      direction: field.direction,
      timestamp: ts.toISOString(),
    });
  });

  if (transactions.length === 0) {
    const ts = new Date(baseDate);
    const amount = toCurrency(Math.abs(record.balanceAmount));
    if (amount > 0) {
      transactions.push({
        externalId: `${record.syntheticId}:balance`,
        amount,
        currency: record.currency,
        description: 'Opening balance adjustment',
        category: 'balance',
        direction: 'in',
        timestamp: ts.toISOString(),
      });
    }
  }

  return transactions;
}

function buildAlerts(record: NormalizedRecord): NormalizedAlert[] {
  const alerts: NormalizedAlert[] = [];
  if (typeof record.payInAmount === 'number' && typeof record.payOutAmount === 'number') {
    if (record.payOutAmount > record.payInAmount) {
      alerts.push({
        externalId: `${record.syntheticId}:cashflow:deficit`,
        type: 'cashflow.deficit',
        status: 'open',
        payload: {
          message: 'Outgoing cash exceeds incoming cash based on synthetic data.',
          payIn: record.payInAmount,
          payOut: record.payOutAmount,
          syntheticId: record.syntheticId,
          sector: record.sector,
        },
      });
    } else if (record.payInAmount > record.payOutAmount * 1.2) {
      alerts.push({
        externalId: `${record.syntheticId}:cashflow:surplus`,
        type: 'cashflow.surplus',
        status: 'resolved',
        payload: {
          message: 'Incoming cash significantly exceeds outgoing cash.',
          payIn: record.payInAmount,
          payOut: record.payOutAmount,
          syntheticId: record.syntheticId,
          sector: record.sector,
        },
      });
    }
  }

  if (record.balanceAmount < 0) {
    alerts.push({
      externalId: `${record.syntheticId}:balance:negative`,
      type: 'balance.overdraft',
      status: 'open',
      payload: {
        message: 'Current account is overdrawn in the synthetic dataset.',
        balance: record.balanceAmount,
        syntheticId: record.syntheticId,
        sector: record.sector,
      },
    });
  }

  return alerts;
}

export async function importNayaOneData(
  client: Pool,
  { skipIfPopulated = true }: { skipIfPopulated?: boolean } = {}
): Promise<ImportStats> {
  const stats: ImportStats = { accounts: 0, balances: 0, transactions: 0, alerts: 0, skipped: false };

  const { rows: accountCountRows } = await client.query<{ count: string }>(
    "SELECT COUNT(*)::int AS count FROM accounts WHERE source = 'nayaone'"
  );
  const existingAccounts = Number(accountCountRows[0]?.count ?? 0);

  if (skipIfPopulated && existingAccounts > 0) {
    stats.skipped = true;
    return stats;
  }

  await client.query('BEGIN');
  try {
    if (!skipIfPopulated) {
      await client.query('TRUNCATE TABLE transactions, balances, alerts, accounts RESTART IDENTITY CASCADE');
    }

    let offset = 0;
    const seen = new Set<string>();

    // eslint-disable-next-line no-constant-condition
    while (true) {
      const { records } = await fetchNayaOneDataset(offset);
      if (!records.length) {
        break;
      }

      for (let index = 0; index < records.length; index += 1) {
        const normalized = normalizeRecord(records[index], offset + index);
        if (!normalized) {
          // eslint-disable-next-line no-console
          console.warn('Skipping record without identifiable synthetic id', records[index]);
          continue;
        }

        if (seen.has(normalized.syntheticId)) {
          continue;
        }
        seen.add(normalized.syntheticId);

        const accountResult = await client.query<{ id: string }>(
          `INSERT INTO accounts (name, currency, external_id, source, raw)
           VALUES ($1, $2, $3, 'nayaone', $4)
           ON CONFLICT ON CONSTRAINT accounts_external_id_unique DO UPDATE SET
             name = EXCLUDED.name,
             currency = EXCLUDED.currency,
             raw = EXCLUDED.raw,
             source = 'nayaone'
           RETURNING id`,
          [normalized.accountName, normalized.currency, normalized.syntheticId, JSON.stringify(normalized.raw)]
        );

        const accountId = accountResult.rows[0]?.id;
        if (!accountId) {
          throw new Error('Failed to persist account');
        }
        stats.accounts += 1;

        await client.query(
          `INSERT INTO balances (account_id, as_of_date, amount, currency, external_id, source)
           VALUES ($1, $2, $3, $4, $5, 'nayaone')
           ON CONFLICT ON CONSTRAINT balances_account_as_of_unique
           DO UPDATE SET amount = EXCLUDED.amount, currency = EXCLUDED.currency, source = 'nayaone', external_id = EXCLUDED.external_id`,
          [accountId, normalized.balanceAsOf, normalized.balanceAmount, normalized.currency, `${normalized.syntheticId}:${normalized.balanceAsOf}`]
        );
        stats.balances += 1;

        const transactions = buildTransactions(normalized);
        for (const transaction of transactions) {
          await client.query(
            `INSERT INTO transactions (account_id, ts, amount, currency, description, category, direction, external_id, source)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'nayaone')
             ON CONFLICT ON CONSTRAINT transactions_external_id_unique DO NOTHING`,
            [
              accountId,
              transaction.timestamp,
              transaction.amount,
              transaction.currency,
              transaction.description,
              transaction.category,
              transaction.direction,
              transaction.externalId,
            ]
          );
        }
        stats.transactions += transactions.length;

        const alerts = buildAlerts(normalized);
        for (const alert of alerts) {
          await client.query(
            `INSERT INTO alerts (account_id, type, status, payload, external_id, source)
             VALUES ($1, $2, $3, $4, $5, 'nayaone')
             ON CONFLICT ON CONSTRAINT alerts_external_id_unique DO UPDATE SET status = EXCLUDED.status, payload = EXCLUDED.payload, source = 'nayaone'`,
            [accountId, alert.type, alert.status, JSON.stringify(alert.payload), alert.externalId]
          );
        }
        stats.alerts += alerts.length;
      }

      offset += records.length;
    }

    await client.query('COMMIT');
    return stats;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  }
}

export async function importNayaOneDataAndReset(client: Pool): Promise<ImportStats> {
  return importNayaOneData(client, { skipIfPopulated: false });
}

export async function runStandaloneImport(): Promise<void> {
  const client = new Pool({ connectionString: process.env.DB_URL });
  try {
    const stats = await importNayaOneData(client, { skipIfPopulated: false });
    // eslint-disable-next-line no-console
    console.log(`Imported ${stats.accounts} accounts from NayaOne dataset`);
  } finally {
    await client.end();
  }
}

if (process.argv[1] && process.argv[1].endsWith('nayaone-importer.ts')) {
  runStandaloneImport().catch((err) => {
    // eslint-disable-next-line no-console
    console.error(err);
    process.exit(1);
  });
}
