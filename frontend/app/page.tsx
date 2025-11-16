
'use client';

import { useEffect, useMemo, useState } from 'react';

import { fetchSmeProfile, triggerSmeSimulation, useAlerts, useBalances, useTransactions, type SmeProfileSnapshot } from '../lib/api';
import { useRequireAuth } from '../lib/use-require-auth';
import { BalanceSummary } from '../components/dashboard/balance-summary';
import { BalanceTrendChart } from '../components/dashboard/balance-trend-chart';
import { AccountDashboard } from '../components/dashboard/account-dashboard';
import { CashflowInsights } from '../components/dashboard/cashflow-insights';
import { ExpenseBreakdownChart } from '../components/dashboard/expense-breakdown-chart';
import { FinancialBenchmarks } from '../components/dashboard/financial-benchmarks';
import { MonthlyCashflowChart } from '../components/dashboard/monthly-cashflow-chart';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Spinner } from '../components/ui/spinner';

function toNumber(value: unknown): number {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const parsed = Number(value.replace(/,/g, ''));
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }
  return 0;
}

function formatCurrency(amount: number, currency = 'GBP'): string {
  if (!Number.isFinite(amount)) return '—';
  try {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `${currency} ${amount.toFixed(0)}`;
  }
}

export default function DashboardPage() {
  const { isAuthenticated, loading: authLoading } = useRequireAuth();
  const {
    data: balances,
    loading: balancesLoading,
    refresh: refreshBalances,
  } = useBalances();
  const {
    data: transactions,
    loading: txLoading,
    refresh: refreshTransactions,
  } = useTransactions();
  const {
    data: alerts,
    loading: alertsLoading,
    refresh: refreshAlerts,
  } = useAlerts();
  const [profile, setProfile] = useState<SmeProfileSnapshot | null>(null);
  const [simulating, setSimulating] = useState(false);
  const [simulationError, setSimulationError] = useState<string | null>(null);

  const insightsLoading = balancesLoading || txLoading || alertsLoading;

  const renderLoadingCard = (height = 'h-48') => (
    <div className={`flex ${height} items-center justify-center rounded-xl border border-slate-800 bg-slate-900/40`}>
      <Spinner className="h-6 w-6 animate-spin text-brand" />
    </div>
  );

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      fetchSmeProfile()
        .then((result) => {
          if (result) {
            setProfile(result);
          }
        })
        .catch(() => undefined);
    }
  }, [authLoading, isAuthenticated]);

  const handleSimulation = async () => {
    setSimulationError(null);
    setSimulating(true);
    try {
      const result = await triggerSmeSimulation();
      setProfile(result);
      await Promise.all([refreshBalances(), refreshTransactions(), refreshAlerts()]);
    } catch (err) {
      setSimulationError(err instanceof Error ? err.message : 'Unable to refresh SME data');
    } finally {
      setSimulating(false);
    }
  };

  const primaryCurrency = useMemo(() => {
    if (balances.length > 0) {
      return balances[0].currency;
    }
    if (transactions.length > 0) {
      return transactions[0].currency;
    }
    const datasetCurrency = profile?.dataset?.currency;
    if (typeof datasetCurrency === 'string' && datasetCurrency.trim()) {
      return datasetCurrency;
    }
    const accountCurrency = profile?.account?.currency;
    return typeof accountCurrency === 'string' && accountCurrency.trim() ? accountCurrency : 'GBP';
  }, [balances, profile, transactions]);

  const lastRun = profile?.createdAt ?? null;

  const hasSummary = Boolean(profile);

  if (authLoading && !isAuthenticated) {
    return (
      <div className="flex h-64 items-center justify-center rounded-xl border border-slate-800 bg-slate-900/40">
        <Spinner className="h-6 w-6 animate-spin text-brand" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <section className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6 shadow-lg shadow-slate-950/30">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-2">
            <p className="text-sm font-semibold uppercase tracking-wide text-brand">High priority fetch</p>
            <h2 className="text-2xl font-semibold text-white">Generate a fresh SME ledger</h2>
            <p className="max-w-2xl text-sm text-slate-300">
              Pull a brand-new account, balance, and transaction history tailored to your registration details. The process
              mirrors a regulated refresh, complete with evidence-ready alerts.
            </p>
            {lastRun ? (
              <p className="text-xs text-slate-500">Last generated: {new Date(lastRun).toLocaleString()}</p>
            ) : null}
          </div>
          <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center">
            <Button onClick={handleSimulation} disabled={simulating} className="w-full sm:w-auto">
              {simulating ? 'Refreshing…' : 'Fetch SME snapshot'}
            </Button>
            {simulationError ? <p className="text-sm text-rose-300">{simulationError}</p> : null}
          </div>
        </div>
        {simulating ? (
          <div className="mt-6 rounded-xl border border-slate-800/60 bg-slate-900/70 p-5">
            <div className="flex items-center gap-3 text-sm text-slate-200">
              <Spinner className="h-5 w-5" />
              <span className="animate-pulse">Fetching all your account details…</span>
            </div>
            <p className="mt-2 text-xs text-slate-400">
              Streaming balances, ledger entries, and alert insights from the core orchestration pipeline.
            </p>
          </div>
        ) : null}
        {!simulating && hasSummary ? (
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            <Card>
              <CardContent className="space-y-1 pt-6">
                <p className="text-xs uppercase tracking-wide text-slate-400">Accounts generated</p>
                <p className="text-xl font-semibold text-white">{profile?.summary.accounts ?? 0}</p>
                <p className="text-xs text-slate-500">Primary account refreshed with the latest metadata.</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="space-y-1 pt-6">
                <p className="text-xs uppercase tracking-wide text-slate-400">Transactions ingested</p>
                <p className="text-xl font-semibold text-white">{profile?.summary.transactions ?? 0}</p>
                <p className="text-xs text-slate-500">Ledger entries streamed for cashflow analysis.</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="space-y-1 pt-6">
                <p className="text-xs uppercase tracking-wide text-slate-400">Alerts prepared</p>
                <p className="text-xl font-semibold text-white">{profile?.summary.alerts ?? 0}</p>
                <p className="text-xs text-slate-500">Evidence-ready anomalies for audit conversations.</p>
              </CardContent>
            </Card>
          </div>
        ) : null}
        {profile ? (
          <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-6">
            <div className="rounded-xl border border-slate-800/60 bg-slate-900/60 p-4">
              <p className="text-xs uppercase tracking-wide text-slate-400">Primary sector</p>
              <p className="text-sm font-semibold text-white">{String(profile.dataset.primary_sector ?? '—')}</p>
            </div>
            <div className="rounded-xl border border-slate-800/60 bg-slate-900/60 p-4">
              <p className="text-xs uppercase tracking-wide text-slate-400">Pay-ins</p>
              <p className="text-sm font-semibold text-white">
                {formatCurrency(toNumber(profile.dataset.pay_in_amount), primaryCurrency)}
              </p>
            </div>
            <div className="rounded-xl border border-slate-800/60 bg-slate-900/60 p-4">
              <p className="text-xs uppercase tracking-wide text-slate-400">Pay-outs</p>
              <p className="text-sm font-semibold text-white">
                {formatCurrency(toNumber(profile.dataset.pay_out_amount), primaryCurrency)}
              </p>
            </div>
            <div className="rounded-xl border border-slate-800/60 bg-slate-900/60 p-4">
              <p className="text-xs uppercase tracking-wide text-slate-400">Total available</p>
              <p className="text-sm font-semibold text-white">
                {formatCurrency(toNumber(profile.dataset.total_amount), primaryCurrency)}
              </p>
            </div>
            <div className="rounded-xl border border-slate-800/60 bg-slate-900/60 p-4">
              <p className="text-xs uppercase tracking-wide text-slate-400">Primary account</p>
              <p className="text-sm font-semibold text-white">
                {String(profile.dataset.primary_account_display_name ?? profile.account?.name ?? 'Primary account')}
              </p>
            </div>
            <div className="rounded-xl border border-slate-800/60 bg-slate-900/60 p-4">
              <p className="text-xs uppercase tracking-wide text-slate-400">Headquarters</p>
              <p className="text-sm font-semibold text-white">
                {String(profile.dataset.borough_county ?? profile.dataset.address ?? '—')}
              </p>
            </div>
          </div>
        ) : null}
      </section>
      <section className="grid gap-6 xl:grid-cols-5">
        <div className="space-y-6 xl:col-span-3">
          {balancesLoading ? renderLoadingCard('h-64') : <BalanceSummary balances={balances} />}
          {insightsLoading ? (
            renderLoadingCard('h-80')
          ) : (
            <CashflowInsights balances={balances} transactions={transactions} alerts={alerts} />
          )}
        </div>
        <div className="space-y-6 xl:col-span-2">
          {balancesLoading ? renderLoadingCard('h-64') : <BalanceTrendChart balances={balances} currency={primaryCurrency} />}
          {txLoading ? renderLoadingCard('h-64') : (
            <MonthlyCashflowChart transactions={transactions} currency={primaryCurrency} />
          )}
          {txLoading ? renderLoadingCard('h-64') : (
            <ExpenseBreakdownChart transactions={transactions} currency={primaryCurrency} />
          )}
          {profile ? <FinancialBenchmarks dataset={profile.dataset} currency={primaryCurrency} /> : null}
        </div>
      </section>
      <section>
        {txLoading || balancesLoading ? (
          renderLoadingCard('h-[32rem]')
        ) : (
          <AccountDashboard
            balances={balances}
            transactions={transactions}
            alerts={alerts}
            currency={primaryCurrency}
          />
        )}
      </section>
    </div>
  );
}
