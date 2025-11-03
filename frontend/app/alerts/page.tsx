'use client';

import { useAlerts } from '../../lib/api';
import { AlertList } from '../../components/alerts/alert-list';
import { Spinner } from '../../components/ui/spinner';

export default function AlertsPage() {
  const { data: alerts, loading, fetchEvidence } = useAlerts();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-white">Alerts</h1>
        <p className="text-sm text-slate-400">Track agent notifications and review the audit evidence trail.</p>
      </div>
      {loading ? (
        <div className="flex h-64 items-center justify-center rounded-xl border border-slate-800 bg-slate-900/40">
          <Spinner className="h-6 w-6 animate-spin text-brand" />
        </div>
      ) : (
        <AlertList alerts={alerts} onAudit={(alert) => fetchEvidence(alert.id)} />
      )}
    </div>
  );
}
