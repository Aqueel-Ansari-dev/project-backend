import { Pool } from 'pg';
import type { PoolClient } from 'pg';

import 'dotenv/config';

interface SampleRecord {
  current_account_number: string;
  entity_trade_name: string;
  entity_name: string;
  currency?: string;
  filing_date?: string;
  ca_start_date?: string;
  amount?: number | string;
  total_amount?: number | string;
  pay_in_amount?: number | string;
  pay_out_amount?: number | string;
  revenue_2019?: number | string;
  ['2019_revenue']?: number | string;
  cogs?: number | string;
  costs?: number | string;
  capex?: number | string;
  primary_sector?: string;
  [key: string]: unknown;
}

interface InsertCounts {
  accounts: number;
  balances: number;
  transactions: number;
}

const SAMPLE_RECORDS: SampleRecord[] = [
  {
    a: 0,
    borough_county: 'Hillingdon',
    address: '434 Robin pines Belltown HA4 6UQ',
    contact_phone_no: '+441727 227532',
    primary_sector: '69-75 : Professional, scientific & technical',
    entity_trade_name: 'Green, Clark, Turner, Carter, Taylor, Summers, Green',
    company_type: '1.1 - Public Company (incl. Building Society)',
    entity_name:
      'Green, Clark, Turner, Carter, Reynolds, Dickinson, Chan, James, Evans and Cunningham Co',
    company_reg_number: '20000000',
    annual_turnover: '0-632k',
    number_of_employees: '0-4 People',
    number_of_officers: 2,
    incorporation_date: '2018-04-23',
    entity_status: true,
    dissolved_on: '2021-08-10',
    officers_and_percent_owned: [
      [205620, 100],
      [31062, 0],
    ],
    ubo_and_percent_owned: [[205620, 100]],
    date_of_name_change: 'nan',
    previous_name: 'nan',
    country_of_incorporation: 'United Kingdom',
    country_of_primary_operation: 'United Kingdom',
    women_owned: false,
    ['2019_revenue']: 180196,
    capex: 0.02,
    cogs: 323303.16,
    cogs_plus_capex: 323303.18,
    costs: 601494.248,
    turnover_bands: '0-632k',
    accounts_receivable: 8394,
    capital_and_reserves: 9465,
    current_assets: 59622,
    current_liabilities: 58733,
    filing_date: '2021-07-09',
    fixed_assets: 18043,
    long_term_liabilities: 9467,
    provisions_for_liabilities: 8809,
    number_of_accounts: 1,
    current_acc_fraction: 0.592,
    total_amount: 781690.248,
    current_account_numbers: { 8279093531457: 462760.626816 },
    current_account_numbers_list: { 8279093531457: 462760.626816 },
    ca_start_date: '2019-02-23',
    current_account_number: '8279093531457',
    amount: 462760.626816,
    rev_ratio: 0.2305209774089442,
    cost_ratio: 0.7694790225910558,
    pay_in_amount: 106676.03199999999,
    pay_out_amount: 356084.594816,
    currency: 'GBP',
  },
  {
    a: 1,
    borough_county: 'Manchester',
    address: '91 Albert Dock, Manchester M2 4WU',
    contact_phone_no: '+441613 554210',
    primary_sector: '56 : Accommodation & food service activities',
    entity_trade_name: 'Dockside Bistro Group',
    company_type: '1.2 - Private Limited Company',
    entity_name: 'Dockside Bistro Holdings Ltd',
    company_reg_number: '20000001',
    annual_turnover: '632k-2m',
    number_of_employees: '25-49 People',
    number_of_officers: 3,
    incorporation_date: '2016-11-14',
    entity_status: true,
    country_of_incorporation: 'United Kingdom',
    country_of_primary_operation: 'United Kingdom',
    women_owned: true,
    revenue_2019: 1248570,
    capex: 48500.75,
    cogs: 756980.42,
    costs: 998320.11,
    turnover_bands: '632k-2m',
    accounts_receivable: 56210,
    capital_and_reserves: 186320,
    current_assets: 328994.44,
    current_liabilities: 215340.11,
    filing_date: '2022-03-31',
    fixed_assets: 402115.88,
    long_term_liabilities: 165000,
    provisions_for_liabilities: 22000,
    number_of_accounts: 2,
    current_acc_fraction: 0.64,
    total_amount: 1586470.21,
    current_account_numbers: { 8279093531458: 612340.88, 8279093531459: 284555.32 },
    current_account_number: '8279093531458',
    amount: 896896.2,
    pay_in_amount: 1324500.33,
    pay_out_amount: 984220.45,
    currency: 'GBP',
  },
  {
    a: 2,
    borough_county: 'Edinburgh',
    address: '12 Calton Terrace, Edinburgh EH7 5DL',
    contact_phone_no: '+441316 608220',
    primary_sector: '62 : Computer programming, consultancy and related activities',
    entity_trade_name: 'Calton Analytics',
    company_type: '1.3 - Limited Liability Partnership',
    entity_name: 'Calton Analytics LLP',
    company_reg_number: '20000002',
    annual_turnover: '2m-5m',
    number_of_employees: '10-24 People',
    number_of_officers: 4,
    incorporation_date: '2020-01-20',
    entity_status: true,
    country_of_incorporation: 'United Kingdom',
    country_of_primary_operation: 'United Kingdom',
    women_owned: false,
    revenue_2019: 2345090.5,
    capex: 120450.22,
    cogs: 865340.77,
    costs: 1459980.44,
    turnover_bands: '2m-5m',
    accounts_receivable: 210445.22,
    capital_and_reserves: 540122.8,
    current_assets: 754210.33,
    current_liabilities: 298775.11,
    filing_date: '2023-01-15',
    fixed_assets: 120345.66,
    long_term_liabilities: 410000.55,
    provisions_for_liabilities: 18500.33,
    number_of_accounts: 1,
    current_acc_fraction: 0.71,
    total_amount: 2750321.76,
    current_account_numbers: { 8279093531460: 1254320.45 },
    current_account_number: '8279093531460',
    amount: 1254320.45,
    pay_in_amount: 2056720.75,
    pay_out_amount: 1687320.22,
    currency: 'GBP',
  },
];

const pool = new Pool({ connectionString: process.env.DB_URL });

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

function resolveAmount(record: SampleRecord): number {
  const candidates = [
    record.amount,
    record.total_amount,
    record.pay_in_amount,
    record.revenue_2019,
    record['2019_revenue'],
  ];

  for (const candidate of candidates) {
    const parsed = parseNumber(candidate);
    if (typeof parsed === 'number') {
      return toCurrency(parsed);
    }
  }

  return 0;
}

function resolveDate(record: SampleRecord): string {
  const candidates = [record.filing_date, record.ca_start_date];

  for (const candidate of candidates) {
    if (typeof candidate === 'string' && candidate.trim()) {
      const date = new Date(candidate);
      if (!Number.isNaN(date.getTime())) {
        return date.toISOString().slice(0, 10);
      }
    }
  }

  return new Date().toISOString().slice(0, 10);
}

async function insertRecord(client: PoolClient, record: SampleRecord): Promise<InsertCounts> {
  const accountExternalId = String(record.current_account_number);
  const accountName = (
    record.entity_trade_name ||
    record.entity_name ||
    'Sample Account'
  ).toString();
  const currency = (record.currency || 'GBP').toString();
  const balanceAmount = resolveAmount(record);
  const balanceDate = resolveDate(record);

  const accountResult = await client.query(
    `INSERT INTO accounts (external_id, name, currency, source, raw)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id`,
    [accountExternalId, accountName, currency, 'sample-data', JSON.stringify(record)]
  );

  const accountId = accountResult.rows[0].id as string;

  await client.query(
    `INSERT INTO balances (account_id, external_id, as_of_date, amount, currency, source)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [accountId, `${accountExternalId}:balance`, balanceDate, balanceAmount, currency, 'sample-data']
  );

  const transactions = buildTransactions(accountExternalId, record, balanceDate, currency);

  for (const tx of transactions) {
    await client.query(
      `INSERT INTO transactions (account_id, external_id, ts, amount, currency, description, category, direction, source)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [
        accountId,
        tx.externalId,
        tx.timestamp,
        tx.amount,
        tx.currency,
        tx.description,
        tx.category,
        tx.direction,
        'sample-data',
      ]
    );
  }

  return {
    accounts: 1,
    balances: 1,
    transactions: transactions.length,
  };
}

type TransactionInsert = {
  externalId: string;
  amount: number;
  currency: string;
  description: string;
  category: string;
  direction: 'in' | 'out';
  timestamp: string;
};

function buildTransactions(
  accountExternalId: string,
  record: SampleRecord,
  baseDate: string,
  currency: string
): TransactionInsert[] {
  const metrics: Array<{
    key: keyof SampleRecord;
    description: string;
    category: string;
    direction: 'in' | 'out';
  }> = [
    { key: 'pay_in_amount', description: 'Total pay-ins', category: 'cashflow', direction: 'in' },
    {
      key: 'pay_out_amount',
      description: 'Total pay-outs',
      category: 'cashflow',
      direction: 'out',
    },
    { key: 'revenue_2019', description: 'Reported revenue', category: 'revenue', direction: 'in' },
    {
      key: '2019_revenue',
      description: 'Reported revenue (2019)',
      category: 'revenue',
      direction: 'in',
    },
    { key: 'cogs', description: 'Cost of goods sold', category: 'operations', direction: 'out' },
    { key: 'costs', description: 'Operating costs', category: 'operations', direction: 'out' },
    { key: 'capex', description: 'Capital expenditure', category: 'operations', direction: 'out' },
  ];

  const base = new Date(baseDate);

  return metrics
    .map((metric, index) => {
      const value = parseNumber(record[metric.key]);
      if (typeof value !== 'number' || value === 0) {
        return undefined;
      }

      const ts = new Date(base);
      ts.setDate(ts.getDate() - index);

      return {
        externalId: `${accountExternalId}:${String(metric.key)}`,
        amount: toCurrency(Math.abs(value)),
        currency,
        description: metric.description,
        category: metric.category,
        direction: metric.direction,
        timestamp: ts.toISOString(),
      };
    })
    .filter((tx): tx is NonNullable<typeof tx> => Boolean(tx));
}

async function main() {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');
    await client.query(
      'TRUNCATE TABLE evidence_events, alerts, transactions, balances, accounts RESTART IDENTITY CASCADE'
    );

    const totals: InsertCounts = { accounts: 0, balances: 0, transactions: 0 };

    for (const record of SAMPLE_RECORDS) {
      const counts = await insertRecord(client, record);
      totals.accounts += counts.accounts;
      totals.balances += counts.balances;
      totals.transactions += counts.transactions;
    }

    await client.query('COMMIT');

    // eslint-disable-next-line no-console
    console.log(
      `Reset database and inserted ${totals.accounts} accounts, ${totals.balances} balances, ${totals.transactions} transactions of sample data`
    );
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((error) => {
  // eslint-disable-next-line no-console
  console.error('Failed to reset and seed sample data:', error);
  process.exit(1);
});
