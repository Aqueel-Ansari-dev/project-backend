import { AlertTriangle, CalendarDays, PiggyBank, TrendingDown, TrendingUp } from 'lucide-react';
import type { ComponentType, SVGProps } from 'react';

import { Alert, Balance, Transaction } from '../../lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';

function toNumber(value: string | number | null | undefined) {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : 0;
  }
  if (typeof value === 'string') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

function formatCurrency(amount: number, currency: string) {
  if (!Number.isFinite(amount)) {
    return '—';
  }
  try {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `${currency} ${amount.toLocaleString(undefined, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    })}`;
  }
}

interface InsightStatProps {
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  label: string;
  value: string;
  tone?: 'default' | 'positive' | 'negative';
  caption?: string;
}

function InsightStat({ icon: Icon, label, value, tone = 'default', caption }: InsightStatProps) {
  const toneClass =
    tone === 'positive' ? 'text-emerald-300' : tone === 'negative' ? 'text-rose-300' : 'text-white';
  return (
    <div className="flex items-start gap-3 rounded-lg border border-slate-800 bg-slate-900/60 p-4">
      <span className="mt-1 rounded-full bg-slate-800/80 p-2 text-slate-300">
        <Icon className="h-4 w-4" />
      </span>
      <div>
        <p className="text-xs uppercase tracking-wide text-slate-400">{label}</p>
        <p className={`text-lg font-semibold ${toneClass}`}>{value}</p>
        {caption && <p className="text-xs text-slate-500">{caption}</p>}
      </div>
    </div>
  );
}

function extractMessage(payload: Record<string, unknown> | undefined) {
  if (!payload) return undefined;
  const candidate = (payload as { message?: unknown }).message;
  return typeof candidate === 'string' ? candidate : undefined;
}

export function CashflowInsights({
  balances,
  transactions,
  alerts,
}: {
  balances: Balance[];
  transactions: Transaction[];
  alerts: Alert[];
}) {
  const primaryCurrency =
    transactions.find((tx) => tx.currency)?.currency || balances.find((balance) => balance.currency)?.currency || 'GBP';

  const totalBalance = balances.reduce((sum, balance) => sum + toNumber(balance.amount), 0);
  const annualPayIn = transactions
    .filter((tx) => tx.category === 'cashflow' && tx.direction === 'in')
    .reduce((sum, tx) => sum + toNumber(tx.amount), 0);
  const annualPayOut = transactions
    .filter((tx) => tx.category === 'cashflow' && tx.direction === 'out')
    .reduce((sum, tx) => sum + toNumber(tx.amount), 0);
  const revenueTotal = transactions
    .filter((tx) => tx.category === 'revenue')
    .reduce((sum, tx) => sum + toNumber(tx.amount), 0);
  const operatingCosts = transactions
    .filter((tx) => tx.category === 'operations' && tx.direction === 'out')
    .reduce((sum, tx) => sum + toNumber(tx.amount), 0);

  const netCashflow = annualPayIn - annualPayOut;
  const monthlyBurn = annualPayOut / 12;
  const runwayMonths = monthlyBurn > 0 ? totalBalance / monthlyBurn : null;
  const grossMargin = revenueTotal > 0 ? ((revenueTotal - operatingCosts) / revenueTotal) * 100 : null;

  const largestOutgoing = transactions
    .filter((tx) => tx.direction === 'out')
    .map((tx) => ({ tx, amount: toNumber(tx.amount) }))
    .reduce<{ tx: Transaction | null; amount: number }>(
      (current, candidate) => {
        if (!candidate.tx || !Number.isFinite(candidate.amount)) {
          return current;
        }
        if (!current.tx || candidate.amount > current.amount) {
          return candidate;
        }
        return current;
      },
      { tx: null, amount: 0 }
    ).tx;

  const openAlerts = alerts.filter((alert) => alert.status.toLowerCase() === 'open');

  return (
    <Card>
      <CardHeader className="items-start space-y-2">
        <div>
          <CardTitle className="text-xl text-white">Digital CFO insights</CardTitle>
          <p className="text-sm text-slate-400">
            High-level signals generated from the live ledger. Use these metrics to explain agent recommendations and to
            evidence cashflow posture to regulators.
          </p>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <InsightStat
            icon={TrendingUp}
            label="Annual pay-ins"
            value={formatCurrency(annualPayIn, primaryCurrency)}
            caption="Inflow captured across all connected accounts"
          />
          <InsightStat
            icon={TrendingDown}
            label="Annual pay-outs"
            value={formatCurrency(annualPayOut, primaryCurrency)}
            tone="negative"
            caption="Outflow powering burn-rate calculations"
          />
          <InsightStat
            icon={PiggyBank}
            label="Net cashflow"
            value={formatCurrency(netCashflow, primaryCurrency)}
            tone={netCashflow >= 0 ? 'positive' : 'negative'}
            caption="Difference between pay-ins and pay-outs"
          />
          <InsightStat
            icon={CalendarDays}
            label="Cash runway"
            value={
              runwayMonths && Number.isFinite(runwayMonths)
                ? `${Math.max(0, Math.round(runwayMonths))} months`
                : 'Stable (no burn recorded)'
            }
            caption={
              monthlyBurn > 0
                ? `Based on a monthly burn of ${formatCurrency(monthlyBurn, primaryCurrency)}`
                : 'No recurring burn detected in the ledger'
            }
          />
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <div className="space-y-3 rounded-xl border border-slate-800 bg-slate-900/60 p-5">
            <div>
              <p className="text-sm font-semibold text-white">Largest outgoing</p>
              <p className="text-xs text-slate-400">
                Highlights the biggest payment for anomaly detection and working capital reviews.
              </p>
            </div>
            {largestOutgoing ? (
              <div className="space-y-1 text-sm text-slate-300">
                <p className="text-base font-semibold text-rose-300">
                  {formatCurrency(toNumber(largestOutgoing.amount), largestOutgoing.currency)}
                </p>
                <p>{largestOutgoing.description ?? 'Ledger outflow'}</p>
                <p className="text-xs text-slate-500">
                  {largestOutgoing.account_name ?? 'Primary account'} ·{' '}
                  {new Date(largestOutgoing.ts).toLocaleDateString(undefined, {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  })}
                </p>
              </div>
            ) : (
              <p className="text-sm text-slate-400">No outgoing transactions recorded yet.</p>
            )}
            {grossMargin !== null && Number.isFinite(grossMargin) && (
              <p className="text-xs text-slate-500">
                Gross margin from reported revenue: {grossMargin.toFixed(1)}%.
              </p>
            )}
          </div>

          <div className="space-y-3 rounded-xl border border-slate-800 bg-slate-900/60 p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-semibold text-white">Open agent alerts</p>
                <p className="text-xs text-slate-400">
                  Alerts generated during ingestion (cashflow deficits, margin warnings) remain available for evidence reviews.
                </p>
              </div>
              <span className="rounded-full bg-rose-500/20 px-3 py-1 text-sm font-semibold text-rose-200">
                {openAlerts.length}
              </span>
            </div>
            {openAlerts.length === 0 ? (
              <p className="text-sm text-slate-400">All alerts are currently resolved.</p>
            ) : (
              <ul className="space-y-2 text-sm text-slate-300">
                {openAlerts.slice(0, 3).map((alert) => {
                  const message = extractMessage(alert.payload);
                  return (
                    <li
                      key={alert.id}
                      className="rounded-lg border border-slate-800/80 bg-slate-900/50 p-3"
                    >
                      <div className="flex items-start gap-2">
                        <AlertTriangle className="mt-0.5 h-4 w-4 text-rose-300" />
                        <div className="space-y-1">
                          <p className="text-xs font-semibold uppercase tracking-wide text-rose-200">
                            {alert.type.replace('.', ' ')}
                          </p>
                          <p>{message ?? 'Anomaly detected in the ledger.'}</p>
                          <p className="text-xs text-slate-500">
                            {alert.account_name ?? 'Primary account'} ·{' '}
                            {new Date(alert.created_at).toLocaleDateString(undefined, {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                            })}
                          </p>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
            <p className="text-xs text-slate-500">
              Every alert automatically writes an evidence JSON object to the S3 vault for regulator-ready traceability.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
