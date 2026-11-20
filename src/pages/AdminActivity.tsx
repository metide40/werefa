// Admin Activity page
import { useEffect, useState } from 'react';
import { fetchAdminActivity } from '../api/client';
import { AlertCircle, Activity } from 'lucide-react';

function AdminActivity() {
  const [activity, setActivity] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAdminActivity()
      .then((data) => setActivity(data || []))
      .catch((e) => setError(e?.message || 'Failed to load activity'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-sm text-[var(--text-muted)]">Loading activity…</p>;
  if (error)
    return (
      <div className="mb-4 flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-xs text-red-700">
        <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
        <p>{error}</p>
      </div>
    );

  return (
    <div className="card">
      <div className="flex items-center justify-between border-b px-4 py-3 sm:px-5" style={{ borderColor: 'var(--border)' }}>
        <h2 className="text-sm font-semibold" style={{ color: 'var(--text)' }}>System Activity</h2>
      </div>
      {activity.length === 0 ? (
        <div className="py-10 text-center text-xs text-[var(--text-muted)]">No activity recorded yet</div>
      ) : (
        <ul className="divide-y px-1" style={{ borderColor: 'var(--border)' }}>
          {activity.map((a) => (
            <li key={a.id} className="flex items-start gap-3 px-3 py-3">
              <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-brand-lightTeal">
                <Activity className="h-3.5 w-3.5 text-brand-green" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium" style={{ color: 'var(--text)' }}>{a.message}</p>
                <p className="text-[10px] text-[var(--text-muted)]">
                  {a.clinic ? `${a.clinic} · ` : ''}{new Date(a.created_at).toLocaleString()}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default AdminActivity;
