-- Ensure unique constraints exist for importer upserts
ALTER TABLE accounts
  ADD CONSTRAINT accounts_external_id_unique UNIQUE (external_id);

ALTER TABLE balances
  ADD CONSTRAINT balances_account_as_of_unique UNIQUE (account_id, as_of_date);

ALTER TABLE transactions
  ADD CONSTRAINT transactions_external_id_unique UNIQUE (external_id);

ALTER TABLE alerts
  ADD CONSTRAINT alerts_external_id_unique UNIQUE (external_id);

DROP INDEX IF EXISTS accounts_external_id_idx;
DROP INDEX IF EXISTS balances_account_as_of_idx;
DROP INDEX IF EXISTS transactions_external_id_idx;
DROP INDEX IF EXISTS alerts_external_id_idx;
