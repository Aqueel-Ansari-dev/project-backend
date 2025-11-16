import { useMemo } from 'react';

import type { Transaction } from '../../lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';

interface MonthlyCashflowChartProps {
  transactions: Transaction[];
  currency: string;
}

interface MonthlyBucket {
  month: string;
  label: string;
  inflow: number;
  outflow: number;
}

function parseAmount(value: string | number | null | undefined): number {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : 0;
  }
  if (typeof value === 'string') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

function toCurrency(amount: number, currency: string): string {
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

function buildMonthlyBuckets(transactions: Transaction[]): MonthlyBucket[] {
  const buckets = new Map<string, MonthlyBucket>();

  transactions.forEach((tx) => {
    const date = new Date(tx.ts);
    if (Number.isNaN(date.getTime())) {
      return;
    }
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    const label = date.toLocaleDateString(undefined, { month: 'short', year: 'numeric' });
    const bucket = buckets.get(key) ?? { month: key, label, inflow: 0, outflow: 0 };
    const amount = parseAmount(tx.amount);

    if (tx.direction === 'in') {
      bucket.inflow += amount;
    } else {
      bucket.outflow += amount;
    }

    buckets.set(key, bucket);
  });

  return Array.from(buckets.values())
    .sort((a, b) => a.month.localeCompare(b.month))
    .slice(-6);
}

export function MonthlyCashflowChart({ transactions, currency }: MonthlyCashflowChartProps) {
  const monthly = useMemo(() => buildMonthlyBuckets(transactions), [transactions]);
  const maxValue = useMemo(() => {
    if (!monthly.length) {
      return 0;
    }
    return monthly.reduce((max, bucket) => Math.max(max, bucket.inflow, bucket.outflow), 0);
  }, [monthly]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg text-white">Monthly cashflow</CardTitle>
      </CardHeader>
      <CardContent>
        {!monthly.length || maxValue <= 0 ? (
          <p className="text-sm text-slate-400">No monthly cashflow trend is available yet.</p>
        ) : (
          <div className="flex items-end gap-3">
            {monthly.map((bucket) => {
              const inflowHeight = Math.max(8, (bucket.inflow / maxValue) * 100);
              const outflowHeight = Math.max(8, (bucket.outflow / maxValue) * 100);
              const net = bucket.inflow - bucket.outflow;
              return (
                <div key={bucket.month} className="flex flex-1 flex-col items-center gap-2">
                  <div className="flex w-full items-end gap-1">
                    <div
                      className="flex-1 rounded-t-lg bg-emerald-400/60"
                      style={{ height: `${inflowHeight}%` }}
                      aria-label={`Inflow ${toCurrency(bucket.inflow, currency)}`}
                    />
                    <div
                      className="flex-1 rounded-t-lg bg-rose-500/60"
                      style={{ height: `${outflowHeight}%` }}
                      aria-label={`Outflow ${toCurrency(bucket.outflow, currency)}`}
                    />
                  </div>
                  <div className="text-center text-xs text-slate-300">
                    <p className="font-semibold text-white">{bucket.label}</p>
                    <p className={net >= 0 ? 'text-emerald-300' : 'text-rose-300'}>
                      {toCurrency(net, currency)} net
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
        <div className="mt-4 flex items-center justify-center gap-4 text-xs text-slate-400">
          <span className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-400/80" /> Inflow
          </span>
          <span className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-rose-500/80" /> Outflow
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

