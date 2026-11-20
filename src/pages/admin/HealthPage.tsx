import { useEffect, useState } from 'react';
import { CheckCircle2, AlertCircle } from 'lucide-react';
import { fetchAdminHealth } from '../../api/client';

export default function AdminHealthPage() {
  const [health, setHealth] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastOk, setLastOk] = useState<string | null>(null);

  const load = async () => {
    try {
      const h = await fetchAdminHealth();
      setHealth(h);
      setLastOk(new Date().toISOString());
      setError(null);
    } catch (e: any) {
      setError(e?.message || 'Health check failed');
      setHealth(null);
    }
  };

  useEffect(() => {
    load();
    const id = setInterval(load, 10000);
    return () => clearInterval(id);
  }, []);

  const rows = [
    { label: 'API', value: error ? 'Unavailable' : 'Reachable', ok: !error },
    { label: 'Database', value: health?.database || 'Unknown', ok: health?.database === 'connected' },
    { label: 'Overall', value: health?.status || (error ? 'unavailable' : '—'), ok: health?.status === 'healthy' },
    { label: 'Environment', value: health?.environment || '—', ok: true },
    { label: 'Last successful response', value: lastOk ? new Date(lastOk).toLocaleString() : '—', ok: !!lastOk },
  ];

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-bold" style={{ color: 'var(--text)' }}>Platform Health</h2>
        <p className="text-xs text-[var(--text-muted)]">Measured connectivity only — no invented uptime metrics</p>
      </div>
      {error && <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      <div className="card space-y-2 p-4">
        {rows.map((r) => (
          <div key={r.label} className="flex items-center justify-between rounded-lg bg-brand-ivory/50 px-3 py-2 dark:bg-white/5">
            <span className="text-sm" style={{ color: 'var(--text)' }}>{r.label}</span>
            <span className="inline-flex items-center gap-1 text-xs font-medium">
              {r.ok ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> : <AlertCircle className="h-3.5 w-3.5 text-red-600" />}
              {r.value}
            </span>
          </div>
        ))}
      </div>
      <button type="button" className="btn-secondary text-sm" onClick={load}>Run check now</button>
    </div>
  );
}
