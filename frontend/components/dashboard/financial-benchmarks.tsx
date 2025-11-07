import type { NayaOneRecord } from '../../lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';

interface FinancialBenchmarksProps {
  dataset: NayaOneRecord;
  currency: string;
}

function toNumber(value: unknown): number | null {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : null;
  }
  if (typeof value === 'string') {
    const parsed = Number(value.replace(/,/g, ''));
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function formatPercent(value: number | null): string {
  if (value === null || !Number.isFinite(value)) {
    return '—';
  }
  return `${value.toFixed(1)}%`;
}

function formatCurrency(value: number | null, currency: string): string {
  if (value === null || !Number.isFinite(value)) {
    return '—';
  }
  try {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(value);
  } catch {
    return `${currency} ${value.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
  }
}

function clampGaugeFill(value: number | null): number {
  if (value === null || !Number.isFinite(value)) {
    return 0;
  }
  return Math.max(0, Math.min(100, value));
}

function determineTone(value: number | null): string {
  if (value === null || !Number.isFinite(value)) {
    return 'neutral';
  }
  if (value >= 20) {
    return 'positive';
  }
  if (value < 0) {
    return 'negative';
  }
  return 'neutral';
}

function toneColor(tone: string): string {
  switch (tone) {
    case 'positive':
      return '#34d399';
    case 'negative':
      return '#f87171';
    default:
      return '#38bdf8';
  }
}

interface GaugeProps {
  label: string;
  value: number | null;
  caption: string;
  valueFormatter?: (value: number | null) => string;
}

function Gauge({ label, value, caption, valueFormatter }: GaugeProps) {
  const tone = determineTone(value);
  const fill = clampGaugeFill(value);
  const color = toneColor(tone);
  const display = valueFormatter ? valueFormatter(value) : formatPercent(value);

  return (
    <div className="flex flex-col items-center gap-3 rounded-xl border border-slate-800 bg-slate-900/60 p-4 text-center">
      <div className="relative h-32 w-32">
        <div
          className="absolute inset-0 rounded-full opacity-90"
          style={{ background: `conic-gradient(${color} 0deg ${fill * 3.6}deg, rgba(30, 41, 59, 0.85) ${fill * 3.6}deg 360deg)` }}
        />
        <div className="absolute inset-4 flex items-center justify-center rounded-full bg-slate-950/90">
          <span className="text-lg font-semibold text-white">{display}</span>
        </div>
      </div>
      <div className="space-y-1">
        <p className="text-sm font-semibold text-white">{label}</p>
        <p className="text-xs text-slate-400">{caption}</p>
      </div>
    </div>
  );
}

export function FinancialBenchmarks({ dataset, currency }: FinancialBenchmarksProps) {
  const revenue = toNumber(dataset['2019_revenue'] ?? dataset.revenue_2019);
  const costs = toNumber(dataset.costs);
  const capex = toNumber(dataset.capex);
  const payIn = toNumber(dataset.pay_in_amount);
  const payOut = toNumber(dataset.pay_out_amount);

  const grossMargin = revenue !== null && costs !== null && revenue > 0 ? ((revenue - costs) / revenue) * 100 : null;
  const capexRatio = revenue !== null && capex !== null && revenue > 0 ? (capex / revenue) * 100 : null;
  const cashConversion = payIn !== null && payOut !== null && payIn > 0 ? ((payIn - payOut) / payIn) * 100 : null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg text-white">Financial benchmarks</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 sm:grid-cols-3">
          <Gauge
            label="Gross margin"
            value={grossMargin}
            caption="Revenue resilience compared to total costs"
          />
          <Gauge
            label="Capex intensity"
            value={capexRatio}
            caption="Capital expenditure share of revenue"
          />
          <Gauge
            label="Cash conversion"
            value={cashConversion}
            caption="Free cash after pay-outs"
            valueFormatter={formatPercent}
          />
        </div>
        <div className="mt-6 grid gap-3 text-sm text-slate-300 sm:grid-cols-3">
          <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-4">
            <p className="text-xs uppercase tracking-wide text-slate-400">Annual revenue</p>
            <p className="text-base font-semibold text-white">{formatCurrency(revenue, currency)}</p>
          </div>
          <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-4">
            <p className="text-xs uppercase tracking-wide text-slate-400">Total costs</p>
            <p className="text-base font-semibold text-white">{formatCurrency(costs, currency)}</p>
          </div>
          <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-4">
            <p className="text-xs uppercase tracking-wide text-slate-400">Capex allocation</p>
            <p className="text-base font-semibold text-white">{formatCurrency(capex, currency)}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

