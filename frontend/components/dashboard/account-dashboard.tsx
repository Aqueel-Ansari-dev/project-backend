import Link from 'next/link';
import { AlertTriangle, ArrowRight } from 'lucide-react';

import type { Alert, Balance, Transaction } from '../../lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { TransactionList } from '../transactions/transaction-list';

interface AccountDashboardProps {
  balances: Balance[];
  transactions: Transaction[];
  alerts: Alert[];
  currency: string;
}

interface CurrencyTotal {
  currency: string;
  total: number;
}

interface SparklinePoint {
  date: Date;
  value: number;
}

function parseAmount(value: string | number | null | undefined): number {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : 0;
  }
  if (typeof value === 'string') {
    const parsed = Number(value.replace(/,/g, ''));
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

function formatCurrency(amount: number, currency: string): string {
  if (!Number.isFinite(amount)) {
    return '—';
  }
  try {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `${currency} ${amount.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
  }
}

function buildCurrencyTotals(balances: Balance[]): CurrencyTotal[] {
  const totals = new Map<string, number>();
  for (const balance of balances) {
    const amount = parseAmount(balance.amount);
    if (!Number.isFinite(amount)) continue;
    totals.set(balance.currency, (totals.get(balance.currency) ?? 0) + amount);
  }
  return Array.from(totals.entries()).map(([currency, total]) => ({ currency, total }));
}

function filterMonthToDate(transactions: Transaction[]): Transaction[] {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  return transactions.filter((tx) => {
    const date = new Date(tx.ts);
    return !Number.isNaN(date.getTime()) && date >= startOfMonth;
  });
}

function buildSparklinePoints(transactions: Transaction[]): SparklinePoint[] {
  const buckets = new Map<string, SparklinePoint>();
  for (const tx of transactions) {
    const date = new Date(tx.ts);
    if (Number.isNaN(date.getTime())) continue;
    const key = date.toISOString().split('T')[0];
    const amount = parseAmount(tx.amount);
    const directionValue = tx.direction === 'in' ? amount : -amount;
    const bucket = buckets.get(key) ?? { date, value: 0 };
    bucket.value += directionValue;
    buckets.set(key, bucket);
  }
  return Array.from(buckets.values())
    .sort((a, b) => a.date.getTime() - b.date.getTime())
    .slice(-10);
}

function AlertBanner({ alert }: { alert?: Alert }) {
  if (!alert) {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-900/50 p-4 text-sm text-slate-300">
        <AlertTriangle className="h-5 w-5 text-amber-400" />
        <div>
          <p className="font-semibold text-white">No outstanding alerts</p>
          <p className="text-xs text-slate-400">Proactive monitoring has not surfaced new anomalies this week.</p>
        </div>
      </div>
    );
  }

  const createdAt = new Date(alert.created_at);
  const createdLabel = Number.isNaN(createdAt.getTime())
    ? 'recently'
    : createdAt.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });

  const statusLabel = alert.status.charAt(0).toUpperCase() + alert.status.slice(1);

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-500/40 bg-amber-500/10 p-4">
      <div className="flex items-start gap-3">
        <AlertTriangle className="mt-0.5 h-5 w-5 text-amber-300" />
        <div>
          <p className="text-sm font-semibold text-white">{alert.type}</p>
          <p className="text-xs text-amber-100/90">
            {statusLabel} • Detected {createdLabel} on {alert.account_name ?? 'primary account'}
          </p>
        </div>
      </div>
      <Link
        href="/alerts"
        className="inline-flex items-center gap-2 rounded-md border border-amber-300/50 px-3 py-1.5 text-xs font-semibold text-amber-100 transition hover:bg-amber-400/20"
      >
        Review alert
        <ArrowRight className="h-4 w-4" />
      </Link>
    </div>
  );
}

function SummaryCard({ label, value, helper }: { label: string; value: string; helper?: string }) {
  return (
    <Card className="bg-slate-900/70">
      <CardHeader className="flex-col items-start gap-1">
        <CardTitle className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-1">
        <p className="text-2xl font-semibold text-white">{value}</p>
        {helper ? <p className="text-xs text-slate-500">{helper}</p> : null}
      </CardContent>
    </Card>
  );
}

function CashflowSparkline({ points, currency }: { points: SparklinePoint[]; currency: string }) {
  if (!points.length) {
    return <p className="text-sm text-slate-400">Connect accounts to populate the cashflow sparkline.</p>;
  }

  const maxValue = Math.max(...points.map((point) => Math.abs(point.value)), 1);
  const latest = points[points.length - 1];

  return (
    <div className="space-y-3">
      <div className="flex h-28 items-end gap-1">
        {points.map((point) => {
          const height = Math.max(6, (Math.abs(point.value) / maxValue) * 100);
          const isPositive = point.value >= 0;
          return (
            <div key={point.date.toISOString()} className="flex-1">
              <div
                className={`w-full rounded-t-full ${isPositive ? 'bg-emerald-400/70' : 'bg-rose-500/70'}`}
                style={{ height: `${height}%` }}
              />
              <p className="mt-1 text-center text-[10px] text-slate-500">
                {point.date.toLocaleDateString(undefined, { day: 'numeric' })}
              </p>
            </div>
          );
        })}
      </div>
      <p className="text-xs text-slate-400">
        Latest pulse:{' '}
        <span className={latest.value >= 0 ? 'text-emerald-300' : 'text-rose-300'}>
          {formatCurrency(latest.value, currency)}
        </span>{' '}
        net movement
      </p>
    </div>
  );
}

export function AccountDashboard({ balances, transactions, alerts, currency }: AccountDashboardProps) {
  const monthTransactions = filterMonthToDate(transactions);
  const monthSpend = monthTransactions.reduce((sum, tx) => sum + (tx.direction === 'out' ? parseAmount(tx.amount) : 0), 0);
  const monthInflow = monthTransactions.reduce((sum, tx) => sum + (tx.direction === 'in' ? parseAmount(tx.amount) : 0), 0);
  const netMonth = monthInflow - monthSpend;
  const totals = buildCurrencyTotals(balances);
  const totalCashDisplay = totals.length
    ? totals.map((entry) => formatCurrency(entry.total, entry.currency)).join(' · ')
    : 'No balances yet';

  const monthLabel = new Date().toLocaleDateString(undefined, { month: 'long' });
  const sparklineSource = monthTransactions.length ? monthTransactions : transactions;
  const sparklinePoints = buildSparklinePoints(sparklineSource);
  const latestAlert = alerts
    .slice()
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];

  return (
    <div className="space-y-6">
      <AlertBanner alert={latestAlert} />
      <div className="grid gap-4 md:grid-cols-3">
        <SummaryCard label="Total cash" value={totalCashDisplay} helper={`${balances.length} ledger balances`} />
        <SummaryCard
          label="Month-to-date spend"
          value={formatCurrency(monthSpend, currency)}
          helper={`${monthTransactions.length} debits captured in ${monthLabel}`}
        />
        <SummaryCard label="Net cashflow" value={formatCurrency(netMonth, currency)} helper={`${monthLabel} inflow vs. outflow`} />
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <TransactionList
            transactions={transactions}
            limit={8}
            title="Recent transactions"
            description="Track the latest entries recorded across your accounts."
            actionSlot={
              <Link
                href="/transactions"
                className="inline-flex items-center gap-2 rounded-md border border-slate-700 px-3 py-1.5 text-xs font-semibold text-slate-100 transition hover:bg-slate-800/60"
              >
                View all
                <ArrowRight className="h-4 w-4" />
              </Link>
            }
          />
        </div>
        <Card>
          <CardHeader className="flex-col items-start gap-1">
            <CardTitle className="text-sm font-semibold uppercase tracking-wide text-slate-400">Cashflow pulse</CardTitle>
            <p className="text-xs text-slate-400">Last ten days of net inflow vs. outflow.</p>
          </CardHeader>
          <CardContent>
            <CashflowSparkline points={sparklinePoints} currency={currency} />
            <Link
              href="/datasets"
              className="mt-4 inline-flex items-center gap-2 text-xs font-semibold text-brand transition hover:text-brand/80"
            >
              Review full dataset
              <ArrowRight className="h-4 w-4" />
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
