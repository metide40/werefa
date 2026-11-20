import { useEffect, useState } from 'react';
import { fetchClinicOverview, fetchClinicQueue } from '../../api/client';

export default function ClinicAnalyticsPage() {
  const [overview, setOverview] = useState<any>(null);
  const [avgWait, setAvgWait] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const [ov, waiting] = await Promise.all([
          fetchClinicOverview(),
          fetchClinicQueue({ status: 'WAITING' }),
        ]);
        setOverview(ov);
        const list = waiting || [];
        const avg =
          list.length > 0
            ? Math.round(list.reduce((s: number, t: any) => s + (t.estimatedWaitMins || 0), 0) / list.length)
            : 0;
        setAvgWait(avg);
        setError(null);
      } catch (e: any) {
        setError(e?.message || 'Failed to load analytics');
      }
    })();
  }, []);

  if (error) return <p className="text-sm text-red-600">{error}</p>;

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-bold" style={{ color: 'var(--text)' }}>Reports & Analytics</h2>
        <p className="text-xs text-[var(--text-muted)]">Based on current database records for your clinic</p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'Waiting now', value: overview?.waiting ?? '—' },
          { label: 'Serving now', value: overview?.serving ?? '—' },
          { label: 'Completed today', value: overview?.completed_today ?? '—' },
          { label: 'Avg est. wait (min)', value: avgWait },
        ].map((c) => (
          <div key={c.label} className="card p-4">
            <p className="text-2xl font-bold" style={{ color: 'var(--text)' }}>{c.value}</p>
            <p className="text-xs text-[var(--text-muted)]">{c.label}</p>
          </div>
        ))}
      </div>
      <p className="text-xs text-[var(--text-muted)]">
        Historical multi-day charts require longer-term stored metrics. Current values reflect live queue data.
      </p>
    </div>
  );
}
