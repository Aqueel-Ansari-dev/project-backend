'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:8080';

export interface Balance {
  id: string;
  account_id: string;
  account_name?: string;
  as_of_date: string;
  amount: string;
  currency: string;
}

export interface Transaction {
  id: string;
  account_id: string;
  account_name?: string;
  ts: string;
  amount: string;
  currency: string;
  description: string | null;
  category: string | null;
  direction: 'in' | 'out';
}

export interface Alert {
  id: string;
  account_id: string;
  account_name?: string;
  type: string;
  status: string;
  created_at: string;
  payload: Record<string, unknown>;
}

export type NayaOneRecord = Record<string, unknown>;

interface ApiResponse<T> {
  data: T;
}

async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const url = path.startsWith('http') ? path : `${API_BASE_URL}${path}`;
  const headers = new Headers(init.headers);
  headers.set('Accept', 'application/json');
  if (!(init.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(url, { ...init, headers });
  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `Request failed with status ${response.status}`);
  }
  if (response.status === 204) {
    return undefined as unknown as T;
  }
  const json = (await response.json()) as ApiResponse<T>;
  return json.data;
}

export function useBalances() {
  const [data, setData] = useState<Balance[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | undefined>();

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(undefined);
    try {
      const balances = await apiFetch<Balance[]>('/balances');
      setData(balances);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load balances');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { data, loading, error, refresh };
}

export function useTransactions() {
  const [data, setData] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | undefined>();

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(undefined);
    try {
      const transactions = await apiFetch<Transaction[]>('/transactions');
      setData(transactions);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load transactions');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const create = useCallback(
      async (payload: {
        account_id: string;
        amount: number;
        currency: string;
        description?: string;
        category?: string;
        direction: 'in' | 'out';
      }) => {
        const created = await apiFetch<Transaction>(
          '/transactions',
          {
            method: 'POST',
            body: JSON.stringify(payload),
        }
      );
      await refresh();
      return created;
    },
    [refresh]
  );

  return { data, loading, error, refresh, create };
}

export function useAlerts() {
  const [data, setData] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | undefined>();

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(undefined);
    try {
      const alerts = await apiFetch<Alert[]>('/alerts');
      setData(alerts);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load alerts');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const fetchEvidence = useCallback(
      async (alertId: string) => {
        try {
          const { url } = await apiFetch<{ url: string }>(
          `/alerts/${alertId}/evidence`
        );
        return url;
      } catch (err) {
        throw new Error(
          err instanceof Error
            ? err.message
            : 'Evidence link is not available yet. Please check CloudWatch logs.'
        );
      }
    },
    []
  );

  return { data, loading, error, refresh, fetchEvidence };
}

export function useNayaOneDataset() {
  const [records, setRecords] = useState<NayaOneRecord[]>([]);
  const [offset, setOffset] = useState(0);
  const [nextOffset, setNextOffset] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | undefined>();

  const hasMore = useMemo(() => nextOffset !== null, [nextOffset]);

  const loadPage = useCallback(
    async (requestedOffset: number, append: boolean) => {
        setLoading(true);
        setError(undefined);

        try {
          const page = await apiFetch<{
            records: NayaOneRecord[];
            offset: number;
            pageSize: number;
            nextOffset: number | null;
          }>(`/datasets/nayaone?offset=${requestedOffset}`);

          setOffset(requestedOffset);
          setNextOffset(page.nextOffset);
          setRecords((prev) => (append ? [...prev, ...page.records] : page.records));
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Failed to load dataset');
        } finally {
          setLoading(false);
        }
    },
    []
  );

  useEffect(() => {
    loadPage(0, false).catch(() => undefined);
  }, [loadPage]);

  const loadMore = useCallback(async () => {
    if (nextOffset === null) return;
    return loadPage(nextOffset, true);
  }, [loadPage, nextOffset]);

  const refresh = useCallback(async () => loadPage(0, false), [loadPage]);

  return { records, offset, loading, error, loadMore, hasMore, refresh };
}
