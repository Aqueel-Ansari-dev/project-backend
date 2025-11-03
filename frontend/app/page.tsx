'use client';

import { useBalances, useTransactions } from '../lib/api';
import { BalanceSummary } from '../components/dashboard/balance-summary';
import { TransactionList } from '../components/transactions/transaction-list';
import { Spinner } from '../components/ui/spinner';

export default function DashboardPage() {
  const { data: balances, loading: balancesLoading } = useBalances();
  const { data: transactions, loading: txLoading } = useTransactions();

  return (
    <div className="space-y-8">
      <section>
        {balancesLoading ? (
          <div className="flex h-48 items-center justify-center rounded-xl border border-slate-800 bg-slate-900/40">
            <Spinner className="h-6 w-6 animate-spin text-brand" />
          </div>
        ) : (
          <BalanceSummary balances={balances} />
        )}
      </section>
      <section>
        {txLoading ? (
          <div className="flex h-64 items-center justify-center rounded-xl border border-slate-800 bg-slate-900/40">
            <Spinner className="h-6 w-6 animate-spin text-brand" />
          </div>
        ) : (
          <TransactionList transactions={transactions} limit={5} />
        )}
      </section>
    </div>
  );
}
