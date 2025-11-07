import { useMemo } from 'react';

import type { Transaction } from '../../lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';

interface ExpenseBreakdownChartProps {
  transactions: Transaction[];
  currency: string;
}

interface BreakdownSlice {
  key: string;
  label: string;
  value: number;
  percentage: number;
  color: string;
}

interface BreakdownResult {
  slices: BreakdownSlice[];
  total: number;
}

const CATEGORY_LABELS: Record<string, { label: string; color: string }> = {
  operations: { label: 'Operations', color: '#f97316' },
  cashflow: { label: 'Cashflow support', color: '#6366f1' },
  general: { label: 'General & admin', color: '#14b8a6' },
};

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

function buildBreakdown(transactions: Transaction[]): BreakdownResult {
  const totals = new Map<string, number>();

  transactions
    .filter((tx) => tx.direction === 'out')
    .forEach((tx) => {
      const amount = parseAmount(tx.amount);
      if (amount <= 0) {
        return;
      }
      const categoryKey = tx.category && CATEGORY_LABELS[tx.category]
        ? tx.category
        : 'general';
      const current = totals.get(categoryKey) ?? 0;
      totals.set(categoryKey, current + amount);
    });

  const totalAmount = Array.from(totals.values()).reduce((sum, value) => sum + value, 0);
  if (totalAmount <= 0) {
    return { slices: [], total: 0 };
  }

  const slices = Array.from(totals.entries()).map(([key, value]) => {
    const meta = CATEGORY_LABELS[key] ?? CATEGORY_LABELS.general;
    return {
      key,
      label: meta.label,
      value,
      percentage: (value / totalAmount) * 100,
      color: meta.color,
    } satisfies BreakdownSlice;
  });

  return { slices, total: totalAmount };
}

function formatCurrency(total: number, currency: string): string {
  if (!Number.isFinite(total) || total <= 0) {
    return '—';
  }
  try {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(total);
  } catch {
    return `${currency} ${total.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
  }
}

export function ExpenseBreakdownChart({ transactions, currency }: ExpenseBreakdownChartProps) {
  const breakdown = useMemo(() => buildBreakdown(transactions), [transactions]);
  const gradient = useMemo(() => {
    if (!breakdown.slices.length) {
      return 'conic-gradient(#1e293b 0deg 360deg)';
    }
    let start = 0;
    const segments = breakdown.slices.map((slice) => {
      const end = start + (slice.percentage / 100) * 360;
      const segment = `${slice.color} ${start}deg ${end}deg`;
      start = end;
      return segment;
    });
    return `conic-gradient(${segments.join(', ')})`;
  }, [breakdown]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg text-white">Outgoing spend mix</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-6">
        {!breakdown.slices.length ? (
          <p className="text-sm text-slate-400">No outgoing transactions recorded yet. Generate ledger activity to unlock spend analytics.</p>
        ) : (
          <>
            <div
              className="relative h-44 w-44 overflow-hidden rounded-full border border-slate-800 bg-slate-900/60 shadow-inner shadow-black/50"
              style={{ background: gradient }}
            >
              <div className="absolute inset-6 rounded-full bg-slate-950/80" />
              <div className="absolute inset-0 flex items-center justify-center">
                <p className="text-sm font-semibold text-white text-center">
                  {formatCurrency(breakdown.total, currency)}
                  <br /> total
                </p>
              </div>
            </div>
            <ul className="w-full space-y-3 text-sm">
              {breakdown.slices.map((slice) => (
                <li key={slice.key} className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-900/60 px-3 py-2">
                  <span className="flex items-center gap-2 text-slate-200">
                    <span className="h-2 w-2 rounded-full" style={{ backgroundColor: slice.color }} />
                    {slice.label}
                  </span>
                  <span className="font-semibold text-white">{slice.percentage.toFixed(1)}%</span>
                </li>
              ))}
            </ul>
          </>
        )}
      </CardContent>
    </Card>
  );
}

