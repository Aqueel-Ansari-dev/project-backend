import { useMemo } from 'react';

import type { Balance } from '../../lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';

interface BalanceTrendChartProps {
  balances: Balance[];
  currency?: string;
}

interface MonthlyPoint {
  month: string;
  label: string;
  amount: number;
}

function parseAmount(value: string | number | null | undefined): number {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }
  return 0;
}

function buildMonthlySeries(balances: Balance[]): MonthlyPoint[] {
  const map = new Map<string, { amount: number; count: number }>();
  for (const balance of balances) {
    const date = new Date(balance.as_of_date);
    if (Number.isNaN(date.getTime())) continue;
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    const current = map.get(key) ?? { amount: 0, count: 0 };
    current.amount += parseAmount(balance.amount);
    current.count += 1;
    map.set(key, current);
  }

  return Array.from(map.entries())
    .map(([key, value]) => {
      const [year, month] = key.split('-');
      const date = new Date(Number(year), Number(month) - 1, 1);
      return {
        month: key,
        label: date.toLocaleDateString(undefined, { month: 'short', year: 'numeric' }),
        amount: value.amount / Math.max(1, value.count),
      };
    })
    .sort((a, b) => a.month.localeCompare(b.month))
    .slice(-6);
}

function formatCurrency(amount: number, currency: string) {
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

export function BalanceTrendChart({ balances, currency = 'GBP' }: BalanceTrendChartProps) {
  const series = useMemo(() => buildMonthlySeries(balances), [balances]);
  const maxAmount = useMemo(() => Math.max(...series.map((point) => point.amount), 0), [series]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg text-white">Balance trend</CardTitle>
      </CardHeader>
      <CardContent>
        {series.length === 0 || maxAmount <= 0 ? (
          <p className="text-sm text-slate-400">No balance history is available yet.</p>
        ) : (
          <div className="flex items-end gap-3">
            {series.map((point) => {
              const height = Math.max(8, (point.amount / maxAmount) * 100);
              return (
                <div key={point.month} className="flex-1">
                  <div
                    className="relative flex h-40 items-end justify-center overflow-hidden rounded-lg border border-slate-800 bg-slate-900"
                  >
                    <div
                      className="w-full rounded-t-lg bg-gradient-to-t from-brand/20 via-brand/40 to-brand/70"
                      style={{ height: `${height}%` }}
                    />
                    <div className="absolute bottom-2 text-xs font-semibold text-white">
                      {formatCurrency(point.amount, currency)}
                    </div>
                  </div>
                  <p className="mt-2 text-center text-xs text-slate-400">{point.label}</p>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
