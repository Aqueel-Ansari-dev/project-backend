'use client';

import { useMemo } from 'react';
import { useNayaOneDataset } from '../../lib/api';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Spinner } from '../../components/ui/spinner';

function titleCaseKey(key: string) {
  return key
    .split('_')
    .map((part) => (part ? part.charAt(0).toUpperCase() + part.slice(1) : part))
    .join(' ');
}

export default function NayaOneDatasetPage() {
  const { records, loading, error, loadMore, hasMore, refresh } = useNayaOneDataset();

  const columnCount = useMemo(() => {
    if (!records.length) return 1;
    const longest = records.reduce((max, record) => Math.max(max, Object.keys(record).length), 0);
    return longest > 8 ? 3 : longest > 4 ? 2 : 1;
  }, [records]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-white">Synthetic ledger explorer</h1>
          <p className="text-sm text-slate-400">
            This feed is the mock core banking system for the Digital CFO experience. Every account, balance, and alert in the
            platform is derived from these NayaOne sandpit records.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => refresh()} disabled={loading}>
            Refresh
          </Button>
        </div>
      </div>
      <Card className="bg-slate-900/70">
        <CardContent className="space-y-2 p-5 text-sm text-slate-300">
          <p>
            • Import this dataset via <code className="rounded bg-slate-800 px-1 py-0.5 text-xs">npm run migrate</code> or{' '}
            <code className="rounded bg-slate-800 px-1 py-0.5 text-xs">npm run seed</code> to hydrate the sandbox ledger.
          </p>
          <p>
            • Financial agents query the same records through the backend API when generating recommendations and evidence logs.
          </p>
          <p>• Use the pagination controls below to inspect raw company metadata and link it back to ledger activity.</p>
        </CardContent>
      </Card>
      {error && <p className="rounded-lg border border-red-500/60 bg-red-500/10 p-4 text-sm text-red-200">{error}</p>}
      {loading && !records.length ? (
        <div className="flex h-64 items-center justify-center rounded-xl border border-slate-800 bg-slate-900/40">
          <Spinner className="h-6 w-6 animate-spin text-brand" />
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {records.map((record, index) => {
            const stableKey =
              (typeof record.id === 'string' && record.id) ||
              (typeof record.account_id === 'string' && record.account_id) ||
              (typeof record.company_number === 'string' && record.company_number) ||
              (typeof record.company_registration === 'string' && record.company_registration) ||
              `record-${index}`;

            return (
              <Card key={stableKey} className="bg-slate-900/70">
              <CardHeader className="mb-3 items-start">
                <div>
                  <CardTitle className="text-base text-white">
                    {typeof record.account_name === 'string'
                      ? record.account_name
                      : typeof record.company_name === 'string'
                        ? record.company_name
                        : `Record ${index + 1}`}
                  </CardTitle>
                  {typeof record.account_id === 'string' && (
                    <p className="text-xs text-slate-400">Account ID: {record.account_id}</p>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <dl
                  className={`grid gap-3 text-xs text-slate-300 ${
                    columnCount === 3
                      ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
                      : columnCount === 2
                        ? 'grid-cols-1 sm:grid-cols-2'
                        : 'grid-cols-1'
                  }`}
                >
                  {Object.entries(record).map(([key, value]) => (
                    <div key={key} className="space-y-1 break-words">
                      <dt className="font-medium text-slate-200">{titleCaseKey(key)}</dt>
                      <dd className="text-slate-400">
                        {value === null || value === undefined
                          ? '—'
                          : typeof value === 'object'
                            ? JSON.stringify(value, null, 2)
                            : String(value)}
                      </dd>
                    </div>
                  ))}
                </dl>
              </CardContent>
              </Card>
            );
          })}
        </div>
      )}
      <div className="flex justify-center">
        <Button onClick={() => loadMore()} disabled={loading || !hasMore} variant="secondary">
          {hasMore ? (loading ? 'Loading…' : 'Load more records') : 'No more results'}
        </Button>
      </div>
    </div>
  );
}
