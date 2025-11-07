import { randomUUID } from 'crypto';

import { pool } from '../db/pool.js';
import type { AuthenticatedUser } from '../middlewares/auth.js';

const COUNTIES = [
  'Greater London',
  'West Midlands',
  'Greater Manchester',
  'West Yorkshire',
  'Hampshire',
  'Essex',
  'Surrey',
  'Kent',
  'Lancashire',
  'Hertfordshire',
  'Tyne and Wear',
  'South Yorkshire',
];

const COMPANY_TYPES = [
  '1.1 - Public Company (incl. Building Society)',
  '1.2 - Private Limited Company',
  '1.3 - Limited Liability Partnership',
  '1.4 - Sole Trader',
];

const TURNOVER_BANDS = ['0-632k', '632k-2m', '2m-5m', '5m-10m'];
const EMPLOYEE_BANDS = ['0-4 People', '5-9 People', '10-24 People', '25-49 People'];
const PRIMARY_SECTORS = [
  '41-43 : Construction',
  '56 : Accommodation & food service activities',
  '62 : Computer programming, consultancy and related activities',
  '69-75 : Professional, scientific & technical',
  '45 : Wholesale and retail trade and repair of motor vehicles and motorcycles',
  '64-66 : Financial and insurance activities',
];

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomFloat(min: number, max: number, precision = 2): number {
  const factor = 10 ** precision;
  return Math.round((Math.random() * (max - min) + min) * factor) / factor;
}

function randomBoolean(): boolean {
  return Math.random() < 0.5;
}

function randomChoice<T>(items: readonly T[]): T {
  return items[randomInt(0, items.length - 1)];
}

function generateAccountNumber(): string {
  const base = Array.from({ length: 13 }, () => randomInt(0, 9)).join('');
  return base.padStart(13, '0');
}

function generatePhoneNumber(): string {
  const segments = [
    `0${randomInt(10, 79)}`,
    randomInt(1000, 9999).toString(),
    randomInt(1000, 9999).toString(),
  ];
  return `${segments[0]}-${segments[1]}-${segments[2]}`;
}

function generateAddress(): string {
  const streetNames = ['High Street', 'Station Road', 'Church Lane', 'Market Street', 'Victoria Road', 'Park Avenue'];
  const suffixes = ['Suites', 'Studios', 'Works', 'Hub', 'House'];
  const city = randomChoice(['London', 'Manchester', 'Leeds', 'Birmingham', 'Glasgow', 'Cardiff', 'Bristol']);
  const postcode = `${String.fromCharCode(randomInt(65, 90))}${randomInt(1, 9)} ${randomInt(1, 9)}${String.fromCharCode(
    randomInt(65, 90)
  )}${String.fromCharCode(randomInt(65, 90))}`;
  return `${randomInt(1, 250)} ${randomChoice(streetNames)} ${randomChoice(suffixes)}, ${city} ${postcode}`;
}

function isoDateMonthsAgo(monthsAgo: number): string {
  const date = new Date();
  date.setMonth(date.getMonth() - monthsAgo);
  return date.toISOString().split('T')[0];
}

function isoDateYearsAgo(years: number): string {
  const date = new Date();
  date.setFullYear(date.getFullYear() - years);
  return date.toISOString().split('T')[0];
}

function buildDataset(user: AuthenticatedUser): Record<string, unknown> {
  const revenue = randomInt(250_000, 2_750_000);
  const capex = randomFloat(10, 150, 2);
  const cogs = randomFloat(revenue * 0.2, revenue * 0.75, 2);
  const costs = randomFloat(revenue * 0.4, revenue * 0.85, 2);
  const payInAmount = randomFloat(revenue * 0.4, revenue * 1.2, 2);
  const payOutAmount = randomFloat(costs * 0.7, costs * 1.15, 2);
  const totalAmount = payInAmount + payOutAmount + randomFloat(50_000, 250_000, 2);
  const accountNumber = generateAccountNumber();
  const primarySector = user.sector?.trim() || randomChoice(PRIMARY_SECTORS);
  const turnoverBand = randomChoice(TURNOVER_BANDS);

  return {
    a: randomInt(1, 50),
    borough_county: randomChoice(COUNTIES),
    address: generateAddress(),
    contact_phone_no: generatePhoneNumber(),
    primary_sector: primarySector,
    entity_trade_name: `${user.entityName ?? user.companyRegNumber ?? 'Sandbox'} Trading`,
    company_type: randomChoice(COMPANY_TYPES),
    entity_name: user.entityName ?? user.companyRegNumber ?? 'Sandbox SME Ltd',
    company_reg_number: user.companyRegNumber ?? randomUUID(),
    annual_turnover: turnoverBand,
    number_of_employees: randomChoice(EMPLOYEE_BANDS),
    number_of_officers: randomInt(1, 5),
    incorporation_date: isoDateYearsAgo(randomInt(3, 12)),
    entity_status: true,
    dissolved_on: 'N/A',
    officers_and_percent_owned: [
      [randomInt(100000, 999999), randomInt(10, 60)],
      [randomInt(100000, 999999), randomInt(5, 35)],
    ],
    ubo_and_percent_owned: [
      [randomInt(100000, 999999), randomInt(40, 70)],
      [randomInt(100000, 999999), randomInt(10, 40)],
    ],
    date_of_name_change: 'N/A',
    previous_name: 'N/A',
    country_of_incorporation: 'United Kingdom',
    country_of_primary_operation: 'United Kingdom',
    women_owned: randomBoolean(),
    ['2019_revenue']: revenue,
    revenue_2019: revenue,
    capex,
    cogs,
    cogs_plus_capex: Number((cogs + capex).toFixed(2)),
    costs,
    turnover_bands: turnoverBand,
    accounts_receivable: randomInt(5_000, 95_000),
    capital_and_reserves: randomInt(20_000, 250_000),
    current_assets: randomInt(50_000, 500_000),
    current_liabilities: randomInt(25_000, 250_000),
    filing_date: isoDateMonthsAgo(randomInt(1, 12)),
    fixed_assets: randomInt(5_000, 120_000),
    long_term_liabilities: randomInt(10_000, 400_000),
    provisions_for_liabilities: randomInt(5_000, 60_000),
    number_of_accounts: 1,
    current_acc_fraction: randomFloat(0.4, 0.85, 3),
    total_amount: Number(totalAmount.toFixed(2)),
    current_account_numbers: { [accountNumber]: Number(totalAmount.toFixed(2)) },
    current_account_numbers_list: { [accountNumber]: Number(totalAmount.toFixed(2)) },
    ca_start_date: isoDateYearsAgo(randomInt(1, 5)),
    current_account_number: accountNumber,
    amount: Number(payInAmount.toFixed(2)),
    rev_ratio: Number((revenue / totalAmount).toFixed(6)),
    cost_ratio: Number((costs / totalAmount).toFixed(6)),
    pay_in_amount: Number(payInAmount.toFixed(2)),
    pay_out_amount: Number(payOutAmount.toFixed(2)),
  };
}

interface BalanceRecord {
  date: string;
  amount: number;
}

function generateBalanceSeries(startingAmount: number): BalanceRecord[] {
  const series: BalanceRecord[] = [];
  let current = startingAmount;
  for (let i = 8; i >= 0; i -= 1) {
    const drift = randomFloat(-0.12, 0.18, 4);
    current = Math.max(25_000, current * (1 + drift));
    series.push({ date: isoDateMonthsAgo(i), amount: Number(current.toFixed(2)) });
  }
  return series;
}

interface TransactionRecord {
  ts: Date;
  amount: number;
  currency: string;
  description: string;
  category: string;
  direction: 'in' | 'out';
}

function generateTransactions(currency: string): TransactionRecord[] {
  const templates: TransactionRecord[] = [];
  const today = new Date();

  const descriptions = [
    'Invoice settlement',
    'Card processing fees',
    'Supplier payment',
    'Payroll run',
    'Client retainer',
    'Office lease',
    'Insurance premium',
    'Marketing campaign',
    'Cloud services',
    'R&D credit',
  ];

  for (let i = 0; i < 30; i += 1) {
    const ts = new Date(today.getTime() - randomInt(2, 120) * 24 * 60 * 60 * 1000);
    const direction = randomBoolean() ? 'in' : 'out';
    const category = direction === 'in' ? randomChoice(['revenue', 'cashflow']) : randomChoice(['operations', 'cashflow']);
    const magnitude = direction === 'in' ? randomFloat(3_000, 95_000, 2) : randomFloat(2_000, 120_000, 2);
    templates.push({
      ts,
      amount: Number(magnitude.toFixed(2)),
      currency,
      description: randomChoice(descriptions),
      category,
      direction,
    });
  }

  return templates.sort((a, b) => b.ts.getTime() - a.ts.getTime());
}

interface AlertRecord {
  type: string;
  status: string;
  payload: Record<string, unknown>;
}

function generateAlerts(balanceSeries: BalanceRecord[], transactions: TransactionRecord[]): AlertRecord[] {
  const recentBalance = balanceSeries[balanceSeries.length - 1]?.amount ?? 0;
  const averageOutflow =
    transactions
      .filter((tx) => tx.direction === 'out')
      .reduce((sum, tx) => sum + tx.amount, 0) / Math.max(1, transactions.filter((tx) => tx.direction === 'out').length);

  const runwayMonths = averageOutflow > 0 ? recentBalance / (averageOutflow * 4) : null;

  const alerts: AlertRecord[] = [];

  if (runwayMonths !== null && runwayMonths < 3) {
    alerts.push({
      type: 'cashflow.runway',
      status: 'open',
      payload: {
        message: `Projected cash runway is ${runwayMonths.toFixed(1)} months.`,
        runway_months: runwayMonths,
        evaluated_at: new Date().toISOString(),
      },
    });
  }

  const largeOutgoing = transactions.find((tx) => tx.direction === 'out' && tx.amount > 80_000);
  if (largeOutgoing) {
    alerts.push({
      type: 'cashflow.large_outflow',
      status: 'open',
      payload: {
        message: `Detected large outgoing payment of ${largeOutgoing.amount.toFixed(2)} ${largeOutgoing.currency}.`,
        amount: largeOutgoing.amount,
        occurred_at: largeOutgoing.ts.toISOString(),
      },
    });
  }

  if (!alerts.length) {
    alerts.push({
      type: 'cashflow.health_check',
      status: 'resolved',
      payload: {
        message: 'No anomalies detected in the latest SME simulation run.',
        evaluated_at: new Date().toISOString(),
      },
    });
  }

  return alerts;
}

export interface SimulationResult {
  dataset: Record<string, unknown>;
  account: {
    id: string;
    name: string;
    currency: string;
  };
  balancesCreated: number;
  transactionsCreated: number;
  alertsCreated: number;
}

export async function simulateSmeData(user: AuthenticatedUser): Promise<SimulationResult> {
  if (!user.companyRegNumber) {
    throw new Error('Company registration number missing');
  }

  const dataset = buildDataset(user);
  const currency = 'GBP';
  const baseAmount = Number(dataset.total_amount ?? dataset.amount ?? 150_000);
  const balanceSeries = generateBalanceSeries(baseAmount);
  const transactions = generateTransactions(currency);
  const alerts = generateAlerts(balanceSeries, transactions);

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(`DELETE FROM accounts WHERE raw ->> 'company_reg_number' = $1`, [user.companyRegNumber]);

    const accountResult = await client.query<{ id: string; name: string; currency: string }>(
      `INSERT INTO accounts (name, currency, external_id, source, raw)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, name, currency`,
      [
        dataset.entity_trade_name,
        currency,
        (dataset.current_account_number as string) ?? null,
        'simulation',
        JSON.stringify(dataset),
      ]
    );

    const account = accountResult.rows[0];

    for (const balance of balanceSeries) {
      await client.query(
        `INSERT INTO balances (account_id, as_of_date, amount, currency, source)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (account_id, as_of_date) DO UPDATE SET amount = EXCLUDED.amount, currency = EXCLUDED.currency, source = EXCLUDED.source`,
        [account.id, balance.date, balance.amount, currency, 'simulation']
      );
    }

    for (const tx of transactions) {
      await client.query(
        `INSERT INTO transactions (account_id, ts, amount, currency, description, category, direction, source)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [account.id, tx.ts.toISOString(), tx.amount, currency, tx.description, tx.category, tx.direction, 'simulation']
      );
    }

    for (const alert of alerts) {
      await client.query(
        `INSERT INTO alerts (account_id, type, status, payload, source)
         VALUES ($1, $2, $3, $4, $5)`,
        [account.id, alert.type, alert.status, JSON.stringify(alert.payload), 'simulation']
      );
    }

    await client.query('COMMIT');

    return {
      dataset,
      account,
      balancesCreated: balanceSeries.length,
      transactionsCreated: transactions.length,
      alertsCreated: alerts.length,
    };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release?.();
  }
}
