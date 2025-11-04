import { Banknote, Building2, CalendarDays } from 'lucide-react';
import type { ComponentType, SVGProps } from 'react';

import { Balance } from '../../lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';

function formatCurrency(amount: number, currency: string) {
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

interface SummaryTileProps {
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  label: string;
  value: string;
  caption?: string;
}

function SummaryTile({ icon: Icon, label, value, caption }: SummaryTileProps) {
  return (
    <div className="flex items-start gap-3 rounded-lg border border-slate-800 bg-slate-900/60 p-4">
      <span className="mt-1 rounded-full bg-slate-800/80 p-2 text-slate-300">
        <Icon className="h-4 w-4" />
      </span>
      <div>
        <p className="text-xs uppercase tracking-wide text-slate-400">{label}</p>
        <p className="text-lg font-semibold text-white">{value}</p>
        {caption && <p className="text-xs text-slate-500">{caption}</p>}
      </div>
    </div>
  );
}

export function BalanceSummary({ balances }: { balances: Balance[] }) {
  const byCurrency = balances.reduce<Record<string, number>>((acc, balance) => {
    const amount = Number(balance.amount);
    if (!Number.isFinite(amount)) return acc;
    acc[balance.currency] = (acc[balance.currency] ?? 0) + amount;
    return acc;
  }, {});

  const accountCount = new Set(balances.map((balance) => balance.account_id)).size;
  const latestSnapshot = balances.reduce<Date | null>((current, balance) => {
    const asOf = new Date(balance.as_of_date);
    if (Number.isNaN(asOf.getTime())) {
      return current;
    }
    if (!current || asOf > current) {
      return asOf;
    }
    return current;
  }, null);

  const currencySummaries = Object.entries(byCurrency).map(([currency, total]) => ({
    currency,
    total,
    display: formatCurrency(total, currency),
  }));

  const totalDisplay =
    currencySummaries.length === 0
      ? 'No balances captured yet'
      : currencySummaries.map((item) => item.display).join(' · ');

  const latestSnapshotDisplay = latestSnapshot
    ? latestSnapshot.toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    : '—';

  return (
    <Card>
      <CardHeader className="items-start space-y-2">
        <div>
          <CardTitle className="text-xl text-white">Cash position overview</CardTitle>
          <p className="text-sm text-slate-400">
            Working capital snapshot derived from the NayaOne synthetic current-account feed. These balances underpin the
            Digital CFO experience for the sandbox.
          </p>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <SummaryTile icon={Banknote} label="Cash on hand" value={totalDisplay} caption="Aggregated across synthetic accounts" />
          <SummaryTile
            icon={Building2}
            label="Active accounts"
            value={accountCount.toString()}
            caption="Unique ledgers seeded from the dataset"
          />
          <SummaryTile
            icon={CalendarDays}
            label="Latest snapshot"
            value={latestSnapshotDisplay}
            caption="Most recent balance date available"
          />
        </div>

        <div className="space-y-3">
          <p className="text-xs uppercase tracking-wide text-slate-400">Account snapshots</p>
          <div className="grid gap-3 sm:grid-cols-2">
            {balances.slice(0, 6).map((balance) => {
              const amount = Number(balance.amount);
              const formatted = Number.isFinite(amount)
                ? formatCurrency(amount, balance.currency)
                : `${balance.currency} ${balance.amount}`;
              return (
                <div
                  key={balance.id}
                  className="flex flex-col gap-1 rounded-lg border border-slate-800 bg-slate-900/50 px-4 py-3"
                >
                  <p className="text-sm font-semibold text-white">{balance.account_name ?? 'Sandbox account'}</p>
                  <p className="text-sm text-brand">{formatted}</p>
                  <p className="text-xs text-slate-500">
                    As of {new Date(balance.as_of_date).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                  </p>
                </div>
              );
            })}
          </div>
          {balances.length > 6 && (
            <p className="text-xs text-slate-500">
              Showing the six most recent ledgers. Use the dataset explorer to inspect the full synthetic company catalogue.
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
