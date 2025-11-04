import { ArrowDownRight, ArrowUpRight } from 'lucide-react';
import { Transaction } from '../../lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { cn } from '../ui/cn';

export function TransactionList({
  transactions,
  limit,
}: {
  transactions: Transaction[];
  limit?: number;
}) {
  const visible = typeof limit === 'number' ? transactions.slice(0, limit) : transactions;
  return (
    <Card>
      <CardHeader className="flex-col items-start gap-2">
        <CardTitle>Recent activity</CardTitle>
        <p className="text-sm text-slate-400">Synthetic ledger data seeded in the sandbox database.</p>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {visible.length === 0 && <p className="text-sm text-slate-400">No transactions yet.</p>}
          {visible.map((transaction) => {
            const isIn = transaction.direction === 'in';
            const amount = Number(transaction.amount);
            return (
              <div
                key={transaction.id}
                className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-900/50 px-4 py-3"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      'flex h-10 w-10 items-center justify-center rounded-full',
                      isIn ? 'bg-emerald-500/15 text-emerald-300' : 'bg-rose-500/15 text-rose-300'
                    )}
                  >
                    {isIn ? <ArrowDownRight className="h-5 w-5" /> : <ArrowUpRight className="h-5 w-5" />}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">{transaction.description ?? 'Sandbox transaction'}</p>
                    <p className="text-xs text-slate-400">
                      {transaction.account_name ?? 'Account'} • {new Date(transaction.ts).toLocaleString()}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={cn('text-sm font-semibold', isIn ? 'text-emerald-300' : 'text-rose-300')}>
                    {isIn ? '+' : '-'} {transaction.currency}{' '}
                    {Number.isFinite(amount)
                      ? amount.toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })
                      : transaction.amount}
                  </p>
                  {transaction.category && <p className="text-xs text-slate-500">{transaction.category}</p>}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
