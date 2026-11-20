import { useEffect, useState } from 'react';
import { fetchClinicQueue, fetchClinicOverview } from '../api/client';
import { AlertCircle, BarChart3 } from 'lucide-react';

function ClinicAnalytics() {
  const [overview, setOverview] = useState<any>(null);
  const [queue, setQueue] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      fetchClinicOverview(),
      fetchClinicQueue({ status: 'WAITING,SERVING,COMPLETED,NO_SHOW' }),
    ])
      .then(([ov, q]) => {
        setOverview(ov);
        setQueue(q || []);
      })
      .catch((e) => setError(e?.message || 'Failed to load analytics'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-sm text-[var(--text-muted)]">Loading analytics…</p>;
  if (error)
    return (
      <div className="mb-4 flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-xs text-red-700">
        <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" /><p>{error}</p>
      </div>
    );

  const completed = queue.filter((t) => t.status === 'COMPLETED').length;
  const noShows = queue.filter((t) => t.status === 'NO_SHOW').length;
  const totalToday = completed + noShows;
  const completionRate = totalToday > 0 ? Math.round((completed / totalToday) * 100) : 0;

  // Department breakdown
  const deptMap: Record<string, number> = {};
  queue.forEach((t) => {
    if (t.departmentName) deptMap[t.departmentName] = (deptMap[t.departmentName] || 0) + 1;
  });
  const deptRows = Object.entries(deptMap).sort((a, b) => b[1] - a[1]);

  const rows = [
    { label: 'Total visits today', value: totalToday },
    { label: 'Completed', value: completed },
    { label: 'No-shows', value: noShows },
    { label: 'Completion rate', value: `${completionRate}%` },
    { label: 'Currently waiting', value: overview?.waiting ?? queue.filter(t => t.status === 'WAITING').length },
  ];

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
        {rows.map((r) => (
          <div key={r.label} className="card p-4">
            <p className="text-xl font-bold sm:text-2xl" style={{ color: 'var(--text)' }}>{r.value}</p>
            <p className="mt-0.5 text-[11px] text-[var(--text-muted)]">{r.label}</p>
          </div>
        ))}
      </div>

      {deptRows.length > 0 && (
        <div className="card">
          <div className="flex items-center gap-2 border-b px-4 py-3 sm:px-5" style={{ borderColor: 'var(--border)' }}>
            <BarChart3 className="h-4 w-4 text-[var(--text-muted)]" />
            <h2 className="text-sm font-semibold" style={{ color: 'var(--text)' }}>Visits by Department</h2>
          </div>
          <ul className="divide-y" style={{ borderColor: 'var(--border)' }}>
            {deptRows.map(([dept, count]) => {
              const max = deptRows[0][1];
              const pct = Math.round((count / max) * 100);
              return (
                <li key={dept} className="px-4 py-3 sm:px-5">
                  <div className="mb-1 flex items-center justify-between text-xs">
                    <span style={{ color: 'var(--text)' }}>{dept}</span>
                    <span className="font-semibold" style={{ color: 'var(--text)' }}>{count}</span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-brand-lightTeal">
                    <div className="h-1.5 rounded-full bg-brand-green" style={{ width: `${pct}%` }} />
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}

export default ClinicAnalytics;
