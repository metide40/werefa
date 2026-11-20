import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Building2, Users, Activity, CheckCircle2, Clock, Shield } from 'lucide-react';
import { fetchAdminOverview, fetchAdminActivity } from '../../api/client';

export default function AdminOverviewPage() {
  const [overview, setOverview] = useState<any>(null);
  const [activity, setActivity] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    const load = async () => {
      try {
        const [ov, act] = await Promise.all([fetchAdminOverview(), fetchAdminActivity()]);
        if (!mounted.current) return;
        setOverview(ov);
        setActivity(act || []);
        setError(null);
      } catch (e: any) {
        if (mounted.current) setError(e?.message || 'Failed to load overview');
      } finally {
        if (mounted.current) setLoading(false);
      }
    };
    load();
    const id = setInterval(load, 5000);
    return () => {
      mounted.current = false;
      clearInterval(id);
    };
  }, []);

  const stats = [
    { label: 'Active clinics', value: overview?.partner_clinics, to: '/admin/clinics', icon: Building2 },
    { label: 'Patients', value: overview?.total_patients, to: '/admin/overview', icon: Users },
    { label: 'Waiting', value: overview?.waiting_tickets, to: '/admin/queues', icon: Activity },
    { label: 'Serving', value: overview?.serving_tickets, to: '/admin/queues', icon: Clock },
    { label: 'Completed today', value: overview?.completed_today, to: '/admin/queues', icon: CheckCircle2 },
    { label: 'Active staff', value: overview?.active_staff, to: '/admin/clinics', icon: Shield },
  ];

  if (loading && !overview) return <p className="text-sm text-[var(--text-muted)]">Loading overview…</p>;
  if (error) return <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>;

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-bold" style={{ color: 'var(--text)' }}>Overview</h2>
        <p className="text-xs text-[var(--text-muted)]">Platform-wide statistics from the database</p>
      </div>
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-3">
        {stats.map((s) => (
          <Link key={s.label} to={s.to} className="card flex items-center gap-3 p-4 transition hover:shadow-card">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-lightTeal">
              <s.icon className="h-5 w-5 text-brand-green" />
            </div>
            <div>
              <p className="text-xl font-bold" style={{ color: 'var(--text)' }}>{s.value ?? '—'}</p>
              <p className="text-xs text-[var(--text-muted)]">{s.label}</p>
            </div>
          </Link>
        ))}
      </div>
      <div className="card">
        <div className="border-b px-4 py-3" style={{ borderColor: 'var(--border)' }}>
          <h3 className="text-sm font-semibold" style={{ color: 'var(--text)' }}>Recent activity</h3>
        </div>
        <ul className="divide-y" style={{ borderColor: 'var(--border)' }}>
          {activity.length === 0 ? (
            <li className="px-4 py-8 text-center text-xs text-[var(--text-muted)]">No activity yet</li>
          ) : (
            activity.slice(0, 15).map((a) => (
              <li key={a.id} className="px-4 py-3 text-sm">
                <p style={{ color: 'var(--text)' }}>{a.message}</p>
                <p className="text-[11px] text-[var(--text-muted)]">
                  {a.clinic ? `${a.clinic} · ` : ''}
                  {new Date(a.created_at).toLocaleString()}
                </p>
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  );
}
