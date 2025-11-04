'use client';

import { useAlerts, useBalances, useTransactions } from '../lib/api';
import { BalanceSummary } from '../components/dashboard/balance-summary';
import { CashflowInsights } from '../components/dashboard/cashflow-insights';
import { TransactionList } from '../components/transactions/transaction-list';
import { Spinner } from '../components/ui/spinner';

export default function DashboardPage() {
  const { data: balances, loading: balancesLoading } = useBalances();
  const { data: transactions, loading: txLoading } = useTransactions();
  const { data: alerts, loading: alertsLoading } = useAlerts();

  const insightsLoading = balancesLoading || txLoading || alertsLoading;

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
        {insightsLoading ? (
          <div className="flex h-64 items-center justify-center rounded-xl border border-slate-800 bg-slate-900/40">
            <Spinner className="h-6 w-6 animate-spin text-brand" />
          </div>
        ) : (
          <CashflowInsights balances={balances} transactions={transactions} alerts={alerts} />
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
