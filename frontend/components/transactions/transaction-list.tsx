import { ArrowDownRight, ArrowUpRight } from 'lucide-react';
import { ReactNode } from 'react';

import { Transaction } from '../../lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { cn } from '../ui/cn';
import { Badge } from '../ui/badge';

interface TransactionListProps {
  transactions: Transaction[];
  limit?: number;
  title?: string;
  description?: string;
  actionSlot?: ReactNode;
}

export function TransactionList({ transactions, limit, title, description, actionSlot }: TransactionListProps) {
  const visible = typeof limit === 'number' ? transactions.slice(0, limit) : transactions;
  const heading = title ?? 'Recent activity';
  const helperText =
    description ??
    'Ledger movements captured across your connected accounts. Use these entries to narrate agentic decisions and evidence working capital changes.';

  return (
    <Card>
      <CardHeader className="flex-col items-start gap-2">
        <div className="flex w-full flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle className="text-lg font-semibold tracking-tight text-white">{heading}</CardTitle>
            {helperText ? <p className="text-sm text-slate-400">{helperText}</p> : null}
          </div>
          {actionSlot ? <div className="shrink-0">{actionSlot}</div> : null}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {visible.length === 0 && <p className="text-sm text-slate-400">No transactions yet.</p>}
          {visible.map((transaction) => {
            const isIn = transaction.direction === 'in';
            const amount = Number(transaction.amount);
            const category = transaction.category ?? 'general';
            const categoryVariant =
              category === 'revenue'
                ? 'success'
                : category === 'cashflow'
                  ? 'warning'
                  : category === 'operations'
                    ? 'critical'
                    : 'default';
            const categoryLabel = category
              .replace(/_/g, ' ')
              .split(' ')
              .map((part) => (part ? part.charAt(0).toUpperCase() + part.slice(1) : part))
              .join(' ');
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
                    <p className="text-sm font-semibold text-white">{transaction.description ?? 'Ledger transaction'}</p>
                    <div className="mt-1 flex flex-wrap items-center gap-2">
                      <Badge variant={categoryVariant}>{categoryLabel}</Badge>
                      <p className="text-xs text-slate-400">
                        {transaction.account_name ?? 'Account'} •{' '}
                        {new Date(transaction.ts).toLocaleDateString(undefined, {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </p>
                    </div>
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
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
