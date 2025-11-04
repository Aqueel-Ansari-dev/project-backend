import { Balance } from '../../lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';

export function BalanceSummary({ balances }: { balances: Balance[] }) {
  const byCurrency = balances.reduce<Record<string, number>>((acc, balance) => {
    const amount = Number(balance.amount);
    if (!Number.isFinite(amount)) return acc;
    acc[balance.currency] = (acc[balance.currency] ?? 0) + amount;
    return acc;
  }, {});

  const items = Object.entries(byCurrency).map(([currency, total]) => ({
    currency,
    total,
  }));

  return (
    <Card>
      <CardHeader className="flex-col items-start gap-2">
        <CardTitle>Balances</CardTitle>
        <p className="text-2xl font-semibold text-white">
          {items.length === 0 ? 'No balances found' : items.map((item) => `${item.currency} ${item.total.toLocaleString()}`).join(' · ')}
        </p>
        <p className="text-xs text-slate-400">Aggregated by currency from the sandbox accounts.</p>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 sm:grid-cols-2">
          {balances.slice(0, 6).map((balance) => (
            <div key={balance.id} className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-900/50 px-4 py-3">
              <div>
                <p className="text-sm font-medium text-white">{balance.account_name ?? 'Account'}</p>
                <p className="text-xs text-slate-400">As of {new Date(balance.as_of_date).toLocaleDateString()}</p>
              </div>
              <p className="text-sm font-semibold text-brand">
                {balance.currency} {Number(balance.amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
