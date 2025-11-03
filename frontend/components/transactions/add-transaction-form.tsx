'use client';

import { useEffect, useState } from 'react';
import { Button } from '../ui/button';
import { Input, Label, Select } from '../ui/input';

export interface AccountOption {
  id: string;
  name: string;
  currency: string;
}

interface AddTransactionFormProps {
  accounts: AccountOption[];
  onCreate: (input: {
    account_id: string;
    amount: number;
    currency: string;
    description?: string;
    category?: string;
    direction: 'in' | 'out';
  }) => Promise<void>;
}

export function AddTransactionForm({ accounts, onCreate }: AddTransactionFormProps) {
  const [accountId, setAccountId] = useState('');
  const [direction, setDirection] = useState<'in' | 'out'>('out');
  const [amount, setAmount] = useState('100.00');
  const [currency, setCurrency] = useState('GBP');
  const [description, setDescription] = useState('Sandbox purchase');
  const [category, setCategory] = useState('sandbox');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const [success, setSuccess] = useState<string | undefined>();

  const hasAccounts = accounts.length > 0;

  useEffect(() => {
    if (hasAccounts) {
      setAccountId(accounts[0].id);
      setCurrency(accounts[0].currency);
    }
  }, [hasAccounts, accounts]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!hasAccounts) {
      setError('No accounts available. Seed balances first.');
      return;
    }
    if (!accountId) {
      setError('Please select an account');
      return;
    }
    const numericAmount = Number(amount);
    if (!Number.isFinite(numericAmount)) {
      setError('Amount must be a number');
      return;
    }

    try {
      setSubmitting(true);
      setError(undefined);
      await onCreate({
        account_id: accountId,
        amount: Math.abs(numericAmount),
        currency,
        description,
        category,
        direction,
      });
      setSuccess('Transaction created successfully');
      setTimeout(() => setSuccess(undefined), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create transaction');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Account</Label>
          <Select
            value={accountId}
            onChange={(e) => {
              const value = e.target.value;
              setAccountId(value);
              const match = accounts.find((account) => account.id === value);
              if (match) setCurrency(match.currency);
            }}
            disabled={!hasAccounts}
          >
            {accounts.map((account) => (
              <option key={account.id} value={account.id}>
                {account.name} ({account.currency})
              </option>
            ))}
          </Select>
          {!hasAccounts && <p className="text-xs text-slate-500">Balances are required to create transactions.</p>}
        </div>
        <div className="space-y-2">
          <Label>Direction</Label>
          <Select value={direction} onChange={(e) => setDirection(e.target.value as 'in' | 'out')}>
            <option value="in">Incoming</option>
            <option value="out">Outgoing</option>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Amount</Label>
          <Input value={amount} onChange={(e) => setAmount(e.target.value)} required type="number" step="0.01" min="0" />
        </div>
        <div className="space-y-2">
          <Label>Currency</Label>
          <Input value={currency} onChange={(e) => setCurrency(e.target.value.toUpperCase())} maxLength={3} />
        </div>
      </div>
      <div className="space-y-2">
        <Label>Description</Label>
        <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Sandbox transaction" />
      </div>
      <div className="space-y-2">
        <Label>Category</Label>
        <Input value={category} onChange={(e) => setCategory(e.target.value)} placeholder="sandbox" />
      </div>
      {error && <p className="text-sm text-rose-300">{error}</p>}
      {success && <p className="text-sm text-emerald-300">{success}</p>}
      <Button type="submit" className="w-full sm:w-auto" disabled={submitting || !hasAccounts}>
        {submitting ? 'Creating...' : 'Create transaction'}
      </Button>
    </form>
  );
}
