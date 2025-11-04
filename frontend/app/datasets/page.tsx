'use client';

import { useEffect, useMemo, useState } from 'react';
import { useNayaOneDataset, type NayaOneRecord } from '../../lib/api';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Modal } from '../../components/ui/modal';
import { Spinner } from '../../components/ui/spinner';

const PAGE_SIZE = 25;
const SEARCHABLE_FIELDS = ['account_name', 'company_name', 'account_id', 'company_number', 'company_registration'];
const PREFERRED_COLUMNS = [
  'account_name',
  'company_name',
  'sector',
  'account_id',
  'company_number',
  'risk_rating',
  'available_balance',
  'currency',
  'status',
];

function titleCaseKey(key: string) {
  return key
    .split('_')
    .map((part) => (part ? part.charAt(0).toUpperCase() + part.slice(1) : part))
    .join(' ');
}

function formatValue(value: unknown) {
  if (value === null || value === undefined) return '—';
  if (typeof value === 'number') return value.toLocaleString();
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (typeof value === 'object') return JSON.stringify(value, null, 2);
  return String(value);
}

function normaliseForComparison(value: unknown) {
  if (value === null || value === undefined) return '';
  if (typeof value === 'number') return value;
  if (typeof value === 'boolean') return value ? 1 : 0;
  if (typeof value === 'string') {
    const trimmed = value.trim();
    const numeric = Number(trimmed);
    if (!Number.isNaN(numeric) && trimmed !== '') {
      return numeric;
    }
    return trimmed.toLowerCase();
  }
  return JSON.stringify(value);
}

function getPageNumbers(current: number, total: number) {
  if (total <= 5) {
    return Array.from({ length: total }, (_, index) => index + 1);
  }

  const start = Math.max(1, Math.min(current - 2, total - 4));
  return Array.from({ length: 5 }, (_, index) => start + index);
}

export default function NayaOneDatasetPage() {
  const { records, loading, error, loadMore, hasMore, refresh } = useNayaOneDataset();

  const [searchTerm, setSearchTerm] = useState('');
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedRecord, setSelectedRecord] = useState<NayaOneRecord | null>(null);

  const availableColumns = useMemo(() => {
    if (!records.length) return [];

    const keys = new Set<string>();
    for (const record of records) {
      for (const key of Object.keys(record)) {
        keys.add(key);
      }
    }

    const prioritized = PREFERRED_COLUMNS.filter((column) => keys.has(column));
    const additional = Array.from(keys)
      .filter((column) => !prioritized.includes(column))
      .sort((a, b) => a.localeCompare(b));

    return [...prioritized, ...additional].slice(0, 8);
  }, [records]);

  useEffect(() => {
    if (!sortKey && availableColumns.length) {
      setSortKey(availableColumns[0]);
    }
  }, [availableColumns, sortKey]);

  const filteredRecords = useMemo(() => {
    if (!searchTerm.trim()) return records;

    const needle = searchTerm.trim().toLowerCase();

    return records.filter((record) =>
      SEARCHABLE_FIELDS.some((field) => {
        const value = record[field];
        return typeof value === 'string' && value.toLowerCase().includes(needle);
      })
    );
  }, [records, searchTerm]);

  const sortedRecords = useMemo(() => {
    if (!sortKey) return filteredRecords;

    return [...filteredRecords].sort((a, b) => {
      const aValue = normaliseForComparison(a[sortKey]);
      const bValue = normaliseForComparison(b[sortKey]);

      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
      }

      const aText = String(aValue);
      const bText = String(bValue);

      return sortDirection === 'asc'
        ? aText.localeCompare(bText, undefined, { numeric: true })
        : bText.localeCompare(aText, undefined, { numeric: true });
    });
  }, [filteredRecords, sortDirection, sortKey]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, sortKey]);

  const totalPages = Math.max(1, Math.ceil(sortedRecords.length / PAGE_SIZE));

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const safePage = Math.min(currentPage, totalPages);
  const startIndex = (safePage - 1) * PAGE_SIZE;
  const endIndex = startIndex + PAGE_SIZE;

  const visibleRecords = useMemo(() => sortedRecords.slice(startIndex, endIndex), [sortedRecords, startIndex, endIndex]);

  useEffect(() => {
    if (!loading && hasMore) {
      const required = safePage * PAGE_SIZE;
      if (required > records.length) {
        loadMore().catch(() => undefined);
      }
    }
  }, [hasMore, loadMore, loading, records.length, safePage]);

  const showingFrom = sortedRecords.length ? startIndex + 1 : 0;
  const showingTo = showingFrom ? showingFrom + visibleRecords.length - 1 : 0;
  const pageNumbers = useMemo(() => getPageNumbers(safePage, totalPages), [safePage, totalPages]);

  const handleSort = (column: string) => {
    if (sortKey === column) {
      setSortDirection((direction) => (direction === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(column);
      setSortDirection('asc');
    }
  };

  const ariaSortFor = (column: string): 'ascending' | 'descending' | 'none' => {
    if (sortKey !== column) return 'none';
    return sortDirection === 'asc' ? 'ascending' : 'descending';
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold text-white">Synthetic ledger explorer</h1>
          <p className="max-w-3xl text-sm text-slate-200">
            This feed is the mock core banking system for the Digital CFO experience. Every account, balance, and alert in the
            platform is derived from these NayaOne sandpit records.
          </p>
        </div>
        <div className="flex w-full flex-col gap-3 text-sm text-slate-200 md:w-auto md:text-right">
          <div className="flex items-center justify-end gap-2">
            {loading && records.length > 0 ? (
              <div className="flex items-center gap-2 rounded-full border border-slate-700/60 bg-slate-900/60 px-3 py-1 text-xs text-slate-200">
                <Spinner className="h-3.5 w-3.5 text-brand" label="Loading dataset records" />
                Fetching records…
              </div>
            ) : null}
            <Button
              variant="outline"
              onClick={() => refresh()}
              disabled={loading}
              aria-label="Refresh dataset records"
            >
              Refresh
            </Button>
          </div>
        </div>
      </div>
      <Card className="bg-slate-900/80">
        <CardContent className="space-y-2 p-5 text-sm text-slate-200">
          <p>
            • Import this dataset via <code className="rounded bg-slate-800 px-1 py-0.5 text-xs text-slate-100">npm run migrate</code> or{' '}
            <code className="rounded bg-slate-800 px-1 py-0.5 text-xs text-slate-100">npm run seed</code> to hydrate the sandbox ledger.
          </p>
          <p>• Financial agents query the same records through the backend API when generating recommendations and evidence logs.</p>
          <p>• Use the search, sorting, and pagination controls below to inspect raw company metadata and link it back to ledger activity.</p>
        </CardContent>
      </Card>
      {error && <p className="rounded-lg border border-red-500/60 bg-red-500/10 p-4 text-sm text-red-100">{error}</p>}
      <div className="flex flex-col gap-4 rounded-xl border border-slate-800 bg-slate-950/30 p-4 shadow-inner">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-2">
            <CardHeader className="p-0">
              <CardTitle className="text-lg font-semibold text-white">Dataset records</CardTitle>
            </CardHeader>
            <p className="text-sm text-slate-300" aria-live="polite">
              Showing {showingFrom ? `${showingFrom.toLocaleString()}–${showingTo.toLocaleString()}` : 0} of{' '}
              {sortedRecords.length.toLocaleString()} {searchTerm ? 'matching ' : ''}records.
            </p>
          </div>
          <div className="w-full max-w-xs space-y-2">
            <label htmlFor="dataset-search" className="text-xs font-semibold uppercase tracking-wide text-slate-200">
              Search records
            </label>
            <Input
              id="dataset-search"
              placeholder="Filter by account or company name"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              aria-describedby="dataset-search-hint"
            />
            <p id="dataset-search-hint" className="text-xs text-slate-400">
              Matching is performed on account name, company name, or identifier fields across loaded pages.
            </p>
          </div>
        </div>
        {loading && !records.length ? (
          <div className="overflow-hidden rounded-lg border border-slate-800 bg-slate-900/60">
            <table className="min-w-full divide-y divide-slate-800">
              <thead className="bg-slate-900/80">
                <tr>
                  {Array.from({ length: 5 }).map((_, index) => (
                    <th key={index} className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-400">
                      <div className="h-4 w-24 rounded bg-slate-800/60" />
                    </th>
                  ))}
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-400">
                    <div className="h-4 w-16 rounded bg-slate-800/60" />
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 bg-slate-950/50">
                {Array.from({ length: 6 }).map((_, rowIndex) => (
                  <tr key={rowIndex}>
                    {Array.from({ length: 6 }).map((__, cellIndex) => (
                      <td key={cellIndex} className="px-4 py-4">
                        <div className="h-4 w-full rounded bg-slate-800/60" />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : availableColumns.length === 0 ? (
          <div className="flex h-48 items-center justify-center rounded-lg border border-dashed border-slate-800 bg-slate-900/40 text-sm text-slate-300">
            No dataset records available yet.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-slate-800">
            <table className="min-w-full divide-y divide-slate-800 text-sm text-slate-100">
              <thead className="bg-slate-900/80 text-xs uppercase tracking-wide text-slate-300">
                <tr>
                  {availableColumns.map((column) => (
                    <th
                      key={column}
                      scope="col"
                      className="px-4 py-3"
                      aria-sort={ariaSortFor(column)}
                    >
                      <button
                        type="button"
                        onClick={() => handleSort(column)}
                        className="flex items-center gap-2 text-left font-semibold text-slate-200 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/70"
                        aria-label={`Sort by ${titleCaseKey(column)}`}
                      >
                        <span>{titleCaseKey(column)}</span>
                        {sortKey === column ? (
                          <span aria-hidden="true" className="text-xs font-normal text-slate-400">
                            {sortDirection === 'asc' ? '↑' : '↓'}
                          </span>
                        ) : null}
                      </button>
                    </th>
                  ))}
                  <th scope="col" className="px-4 py-3 text-left font-semibold text-slate-200">
                    Details
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 bg-slate-950/40">
                {visibleRecords.length === 0 ? (
                  <tr>
                    <td colSpan={availableColumns.length + 1} className="px-4 py-10 text-center text-sm text-slate-300">
                      No records match your current filters.
                    </td>
                  </tr>
                ) : (
                  visibleRecords.map((record, index) => {
                    const stableKey =
                      (typeof record.id === 'string' && record.id) ||
                      (typeof record.account_id === 'string' && record.account_id) ||
                      (typeof record.company_number === 'string' && record.company_number) ||
                      (typeof record.company_registration === 'string' && record.company_registration) ||
                      `record-${startIndex + index}`;

                    return (
                      <tr key={stableKey} className="hover:bg-slate-900/60 focus-within:bg-slate-900/60">
                        {availableColumns.map((column) => (
                          <td key={column} className="max-w-xs px-4 py-3 align-top text-sm text-slate-200">
                            <span className="block break-words text-slate-100">{formatValue(record[column])}</span>
                          </td>
                        ))}
                        <td className="px-4 py-3 text-sm">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedRecord(record)}
                            aria-label="View full record details"
                          >
                            View details
                          </Button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
        <div className="flex flex-col items-center justify-between gap-3 text-sm text-slate-200 md:flex-row">
          <div className="text-sm text-slate-300" aria-live="polite">
            Page {safePage.toLocaleString()} of {totalPages.toLocaleString()}.
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
              disabled={safePage === 1}
              aria-label="Go to previous page"
            >
              Previous
            </Button>
            {pageNumbers[0] > 1 ? <span className="px-1 text-slate-400">…</span> : null}
            {pageNumbers.map((pageNumber) => (
              <Button
                key={pageNumber}
                variant={pageNumber === safePage ? 'secondary' : 'outline'}
                size="sm"
                onClick={() => setCurrentPage(pageNumber)}
                aria-label={`Go to page ${pageNumber}`}
                aria-current={pageNumber === safePage ? 'page' : undefined}
              >
                {pageNumber}
              </Button>
            ))}
            {pageNumbers[pageNumbers.length - 1] < totalPages ? <span className="px-1 text-slate-400">…</span> : null}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((page) => page + 1)}
              disabled={safePage >= totalPages && !hasMore}
              aria-label="Go to next page"
            >
              Next
            </Button>
          </div>
        </div>
      </div>
      <Modal
        open={selectedRecord !== null}
        onClose={() => setSelectedRecord(null)}
        title={
          selectedRecord && typeof selectedRecord.account_name === 'string'
            ? selectedRecord.account_name
            : selectedRecord && typeof selectedRecord.company_name === 'string'
              ? selectedRecord.company_name
              : 'Record details'
        }
        description="Expanded metadata for the selected dataset row."
      >
        {selectedRecord ? (
          <dl className="grid gap-4 text-sm text-slate-100 sm:grid-cols-2">
            {Object.entries(selectedRecord).map(([key, value]) => (
              <div key={key} className="space-y-1 break-words">
                <dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">{titleCaseKey(key)}</dt>
                <dd className="whitespace-pre-wrap rounded bg-slate-900/60 p-3 text-sm text-slate-100">
                  {formatValue(value)}
                </dd>
              </div>
            ))}
          </dl>
        ) : null}
      </Modal>
    </div>
  );
}
