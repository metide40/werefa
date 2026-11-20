import { useEffect, useState } from 'react';
import { fetchClinicOverview } from '../api/client';
import { Users, CheckCircle2, Clock, AlertTriangle, AlertCircle } from 'lucide-react';

function ClinicOverview() {
  const [overview, setOverview] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchClinicOverview()
      .then(setOverview)
      .catch((e) => setError(e?.message || 'Failed to load overview'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-sm text-[var(--text-muted)]">Loading overview…</p>;
  if (error)
    return (
      <div className="mb-4 flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-xs text-red-700">
        <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
        <p>{error}</p>
      </div>
    );

  const stats = [
    { label: 'Waiting', value: overview?.waiting ?? '—', icon: Users, accent: 'var(--primary)' },
    { label: 'Completed today', value: overview?.completed_today ?? '—', icon: CheckCircle2, accent: '#059669' },
    { label: 'Avg wait (min)', value: overview?.avg_wait_mins ?? '—', icon: Clock, accent: 'var(--highlight)' },
    { label: 'Urgent', value: overview?.urgent_count ?? '—', icon: AlertTriangle, accent: '#C2410C' },
  ];

  return (
    <div>
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="card flex min-w-0 items-center gap-3 p-3.5 sm:p-4">
            <div
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
              style={{ backgroundColor: `color-mix(in srgb, ${s.accent} 14%, transparent)` }}
            >
              <s.icon className="h-5 w-5" style={{ color: s.accent }} />
            </div>
            <div className="min-w-0">
              <p className="truncate text-xl font-bold sm:text-2xl" style={{ color: 'var(--text)' }}>{s.value}</p>
              <p className="truncate text-[11px] text-[var(--text-muted)] sm:text-xs">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {overview?.clinic_name && (
        <div className="card mt-5 p-4 sm:p-5">
          <h2 className="mb-2 text-sm font-semibold" style={{ color: 'var(--text)' }}>Clinic Info</h2>
          <p className="text-sm text-[var(--text-muted)]">{overview.clinic_name}</p>
          {overview.departments && (
            <p className="mt-1 text-xs text-[var(--text-muted)]">
              {overview.departments} department{overview.departments !== 1 ? 's' : ''}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export default ClinicOverview;
