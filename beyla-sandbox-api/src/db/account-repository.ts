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

export interface AccountScope {
  companyRegNumber?: string;
  entityName?: string;
  accountExternalId?: string;
}

function applyAccountScopeFilter(alias: string, scope: AccountScope | undefined, values: unknown[]): string | undefined {
  if (!scope) {
    return undefined;
  }

  const filters: string[] = [];

  if (scope.companyRegNumber) {
    const idx = values.length + 1;
    values.push(scope.companyRegNumber);
    filters.push(`${alias}.raw ->> 'company_reg_number' = $${idx}`);
  }

  if (scope.entityName) {
    const idx = values.length + 1;
    values.push(scope.entityName.toLowerCase());
    filters.push(`LOWER(${alias}.raw ->> 'entity_name') = $${idx}`);
  }

  if (scope.accountExternalId) {
    const idx = values.length + 1;
    values.push(scope.accountExternalId);
    filters.push(`${alias}.external_id = $${idx}`);
  }

  if (!filters.length) {
    return undefined;
  }

  return filters.length === 1 ? filters[0] : `(${filters.join(' OR ')})`;
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

export async function listBalances(scope?: AccountScope): Promise<Balance[]> {
  const values: unknown[] = [];
  const scopeClause = applyAccountScopeFilter('a', scope, values);
  const whereClause = scopeClause ? `WHERE ${scopeClause}` : '';

  const { rows } = await pool.query<Balance>(
    `SELECT b.*, a.name AS account_name
     FROM balances b
     JOIN accounts a ON a.id = b.account_id
     ${whereClause}
     ORDER BY b.as_of_date DESC, b.account_id`,
    values
  );
  return rows;
}

export interface ListTransactionsParams {
  accountId?: string;
  limit?: number;
  scope?: AccountScope;
}

export async function listTransactions({
  accountId,
  limit = 50,
  scope,
}: ListTransactionsParams): Promise<Transaction[]> {
  const conditions: string[] = [];
  const values: unknown[] = [];

  if (accountId) {
    conditions.push(`t.account_id = $${conditions.length + 1}`);
    values.push(accountId);
  }

  const scopeClause = applyAccountScopeFilter('a', scope, values);
  if (scopeClause) {
    conditions.push(scopeClause);
  }

  const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const limitParam = `$${values.length + 1}`;
  const query = `
    SELECT t.*, a.name AS account_name
    FROM transactions t
    JOIN accounts a ON a.id = t.account_id
    ${whereClause}
    ORDER BY t.ts DESC
    LIMIT ${limitParam}
  `;

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

  const created = rows[0];

  const { rows: enriched } = await pool.query<Transaction>(
    `SELECT t.*, a.name AS account_name
     FROM transactions t
     JOIN accounts a ON a.id = t.account_id
     WHERE t.id = $1`,
    [created.id]
  );

  return enriched[0] ?? created;
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

export interface ListAlertsParams {
  accountId?: string;
  scope?: AccountScope;
}

export async function listAlerts({ accountId, scope }: ListAlertsParams = {}): Promise<Alert[]> {
  const values: unknown[] = [];
  const conditions: string[] = [];

  if (accountId) {
    const idx = values.length + 1;
    values.push(accountId);
    conditions.push(`al.account_id = $${idx}`);
  }

  const scopeClause = applyAccountScopeFilter('ac', scope, values);
  if (scopeClause) {
    conditions.push(scopeClause);
  }

  const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  const { rows } = await pool.query<Alert>(
    `SELECT al.*, ac.name AS account_name
     FROM alerts al
     JOIN accounts ac ON ac.id = al.account_id
     ${whereClause}
     ORDER BY al.created_at DESC`,
    values
  );
  return rows;
}
