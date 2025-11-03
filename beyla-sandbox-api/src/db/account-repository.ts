import { pool } from './pool.js';

export interface Account {
  id: string;
  name: string;
  currency: string;
  created_at: string;
}

export interface Balance {
  id: string;
  account_id: string;
  as_of_date: string;
  amount: string;
  currency: string;
  account_name?: string;
}

export interface Transaction {
  id: string;
  account_id: string;
  ts: string;
  amount: string;
  currency: string;
  description: string | null;
  category: string | null;
  direction: 'in' | 'out';
  account_name?: string;
}

export interface Alert {
  id: string;
  account_id: string;
  type: string;
  status: string;
  created_at: string;
  payload: Record<string, unknown>;
  account_name?: string;
}

export async function listAccounts(): Promise<Account[]> {
  const { rows } = await pool.query<Account>('SELECT * FROM accounts ORDER BY created_at DESC');
  return rows;
}

export async function listBalances(): Promise<Balance[]> {
  const { rows } = await pool.query<Balance>(
    `SELECT b.*, a.name AS account_name
     FROM balances b
     JOIN accounts a ON a.id = b.account_id
     ORDER BY b.as_of_date DESC, b.account_id`
  );
  return rows;
}

export interface ListTransactionsParams {
  accountId?: string;
  limit?: number;
}

export async function listTransactions({
  accountId,
  limit = 50,
}: ListTransactionsParams): Promise<Transaction[]> {
  const values: unknown[] = [];
  let query = `SELECT t.*, a.name AS account_name FROM transactions t JOIN accounts a ON a.id = t.account_id`;
  if (accountId) {
    query += ' WHERE t.account_id = $1';
  } else {
    query += ' WHERE 1=1';
    values.push(accountId);
  }
  query += ' ORDER BY t.ts DESC LIMIT $' + (values.length + 1);
  values.push(limit);
  const { rows } = await pool.query<Transaction>(query, values);
  return rows;
}

export interface CreateTransactionInput {
  accountId: string;
  amount: number;
  currency: string;
  description?: string;
  category?: string;
  direction: 'in' | 'out';
}

export async function createTransaction(input: CreateTransactionInput): Promise<Transaction> {
  const { rows } = await pool.query<Transaction>(
    `INSERT INTO transactions (account_id, amount, currency, description, category, direction)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [
      input.accountId,
      input.amount,
      input.currency,
      input.description ?? null,
      input.category ?? null,
      input.direction,
    ]
  );
  return rows[0];
}

export interface CreateAlertInput {
  accountId: string;
  type: string;
  status: string;
  payload: Record<string, unknown>;
}

export async function createAlert(input: CreateAlertInput): Promise<Alert> {
  const { rows } = await pool.query<Alert>(
    `INSERT INTO alerts (account_id, type, status, payload)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [input.accountId, input.type, input.status, JSON.stringify(input.payload)]
  );
  return rows[0];
}

export async function listAlerts(accountId?: string): Promise<Alert[]> {
  const { rows } = accountId
    ? await pool.query<Alert>(`SELECT al.*, ac.name AS account_name FROM alerts al JOIN accounts ac ON ac.id = al.account_id WHERE al.account_id = $1 ORDER BY al.created_at DESC`, [
        accountId,
      ])
    : await pool.query<Alert>(`SELECT al.*, ac.name AS account_name FROM alerts al JOIN accounts ac ON ac.id = al.account_id ORDER BY al.created_at DESC`);
  return rows;
}
