'use client';

import { useMemo, useState } from 'react';
import { useBalances, useTransactions } from '../../lib/api';
import { TransactionList } from '../../components/transactions/transaction-list';
import { AddTransactionForm } from '../../components/transactions/add-transaction-form';
import { Button } from '../../components/ui/button';
import { Modal } from '../../components/ui/modal';
import { Spinner } from '../../components/ui/spinner';

export default function TransactionsPage() {
  const { data: balances } = useBalances();
  const { data: transactions, loading, create } = useTransactions();
  const [modalOpen, setModalOpen] = useState(false);

  const accounts = useMemo(() => {
    const seen = new Map<string, { id: string; name: string; currency: string }>();
    for (const balance of balances) {
      if (!seen.has(balance.account_id)) {
        seen.set(balance.account_id, {
          id: balance.account_id,
          name: balance.account_name ?? balance.account_id,
          currency: balance.currency,
        });
      }
    }
    return Array.from(seen.values());
  }, [balances]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-white">Transactions</h1>
          <p className="text-sm text-slate-400">Create synthetic ledger activity and monitor evidence capture.</p>
        </div>
        <Button onClick={() => setModalOpen(true)}>Add transaction</Button>
      </div>
      {loading ? (
        <div className="flex h-64 items-center justify-center rounded-xl border border-slate-800 bg-slate-900/40">
          <Spinner className="h-6 w-6 animate-spin text-brand" />
        </div>
      ) : (
        <TransactionList transactions={transactions} />
      )}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Create transaction"
        description="Persist a synthetic payment into the sandbox ledger and trigger evidence capture."
      >
        <AddTransactionForm
          accounts={accounts}
          onCreate={async (payload) => {
            await create(payload);
            setModalOpen(false);
          }}
        />
      </Modal>
    </div>
  );
}
