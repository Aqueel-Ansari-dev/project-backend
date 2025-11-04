ALTER TABLE accounts ADD COLUMN IF NOT EXISTS external_id TEXT;
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'internal';
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS raw JSONB DEFAULT '{}'::jsonb;

UPDATE accounts SET source = COALESCE(source, 'internal');
UPDATE accounts SET raw = '{}'::jsonb WHERE raw IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS accounts_external_id_idx
  ON accounts(external_id)
  WHERE external_id IS NOT NULL;

ALTER TABLE balances ADD COLUMN IF NOT EXISTS external_id TEXT;
ALTER TABLE balances ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'internal';

UPDATE balances SET source = COALESCE(source, 'internal');

CREATE UNIQUE INDEX IF NOT EXISTS balances_account_as_of_idx
  ON balances(account_id, as_of_date);

ALTER TABLE transactions ADD COLUMN IF NOT EXISTS external_id TEXT;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'internal';

UPDATE transactions SET source = COALESCE(source, 'internal');

CREATE UNIQUE INDEX IF NOT EXISTS transactions_external_id_idx
  ON transactions(external_id)
  WHERE external_id IS NOT NULL;

ALTER TABLE alerts ADD COLUMN IF NOT EXISTS external_id TEXT;
ALTER TABLE alerts ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'internal';

UPDATE alerts SET source = COALESCE(source, 'internal');

CREATE UNIQUE INDEX IF NOT EXISTS alerts_external_id_idx
  ON alerts(external_id)
  WHERE external_id IS NOT NULL;
