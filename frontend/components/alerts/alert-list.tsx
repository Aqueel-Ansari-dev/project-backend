'use client';

import { useState } from 'react';
import { AlertTriangle, Bell, ExternalLink } from 'lucide-react';
import { Alert as AlertType } from '../../lib/api';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';

function statusVariant(status: string) {
  const normalized = status.toLowerCase();
  if (['open', 'new', 'pending'].includes(normalized)) return 'warning' as const;
  if (['resolved', 'closed', 'ok'].includes(normalized)) return 'success' as const;
  if (['escalated', 'breach'].includes(normalized)) return 'critical' as const;
  return 'default' as const;
}

interface AlertListProps {
  alerts: AlertType[];
  onAudit: (alert: AlertType) => Promise<string>;
}

export function AlertList({ alerts, onAudit }: AlertListProps) {
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [error, setError] = useState<string | undefined>();

  const handleAudit = async (alert: AlertType) => {
    try {
      setLoadingId(alert.id);
      setError(undefined);
      const url = await onAudit(alert);
      window.open(url, '_blank', 'noopener');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to fetch audit evidence');
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <Card>
      <CardHeader className="flex-col items-start gap-2">
        <CardTitle>Agent alerts</CardTitle>
        <p className="text-sm text-slate-400">Review triggered alerts and drill into the audit evidence trail.</p>
      </CardHeader>
      <CardContent>
        {error && <p className="mb-4 text-sm text-rose-300">{error}</p>}
        <div className="space-y-4">
          {alerts.length === 0 && <p className="text-sm text-slate-400">No alerts in the queue.</p>}
          {alerts.map((alert) => (
            <div
              key={alert.id}
              className="rounded-xl border border-slate-800 bg-slate-900/50 p-4 shadow-sm"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex items-start gap-3">
                  <div className="mt-1 rounded-full bg-brand/10 p-2 text-brand">
                    {alert.type.toLowerCase().includes('risk') ? (
                      <AlertTriangle className="h-5 w-5" />
                    ) : (
                      <Bell className="h-5 w-5" />
                    )}
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-base font-semibold text-white">
                        {alert.type.replace(/_/g, ' ')}
                      </h3>
                      <Badge variant={statusVariant(alert.status)}>{alert.status}</Badge>
                    </div>
                    <p className="text-xs text-slate-400">
                      {alert.account_name ?? 'Account'} • {new Date(alert.created_at).toLocaleString()}
                    </p>
                    {alert.payload && (
                      <pre className="mt-3 max-h-32 overflow-auto rounded-md bg-slate-950/60 p-3 text-[11px] text-slate-300">
                        {JSON.stringify(alert.payload, null, 2)}
                      </pre>
                    )}
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleAudit(alert)}
                  disabled={loadingId === alert.id}
                  className="flex items-center gap-2"
                >
                  <ExternalLink className="h-4 w-4" />
                  {loadingId === alert.id ? 'Loading...' : 'Open audit log'}
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
