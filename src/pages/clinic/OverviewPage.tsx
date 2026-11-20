import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Users, CheckCircle2, Clock, AlertTriangle } from 'lucide-react';
import { fetchClinicOverview, fetchClinicQueue } from '../../api/client';

export default function ClinicOverviewPage() {
  const [overview, setOverview] = useState<any>(null);
  const [serving, setServing] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    const load = async () => {
      try {
        const [ov, q] = await Promise.all([
          fetchClinicOverview(),
          fetchClinicQueue({ status: 'SERVING' }),
        ]);
        if (!mounted.current) return;
        setOverview(ov);
        setServing(q || []);
        setError(null);
      } catch (e: any) {
        if (mounted.current) setError(e?.message || 'Failed to load');
      }
    };
    load();
    const id = setInterval(load, 5000);
    return () => {
      mounted.current = false;
      clearInterval(id);
    };
  }, []);

  if (error) return <p className="text-sm text-red-600">{error}</p>;

  const cards = [
    { label: 'Waiting', value: overview?.waiting ?? '—', icon: Users, to: '/clinic/queues' },
    { label: 'Serving', value: overview?.serving ?? '—', icon: Clock, to: '/clinic/queues' },
    { label: 'Completed today', value: overview?.completed_today ?? '—', icon: CheckCircle2, to: '/clinic/analytics' },
    { label: 'Urgent / Emergency', value: overview?.urgent_count ?? '—', icon: AlertTriangle, to: '/clinic/queues' },
  ];

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-bold" style={{ color: 'var(--text)' }}>Overview</h2>
        <p className="text-xs text-[var(--text-muted)]">{overview?.clinic_name || 'Your clinic'}</p>
      </div>
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {cards.map((c) => (
          <Link key={c.label} to={c.to} className="card flex items-center gap-3 p-4 hover:shadow-card">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-lightTeal">
              <c.icon className="h-5 w-5 text-brand-green" />
            </div>
            <div>
              <p className="text-xl font-bold" style={{ color: 'var(--text)' }}>{c.value}</p>
              <p className="text-xs text-[var(--text-muted)]">{c.label}</p>
            </div>
          </Link>
        ))}
      </div>
      <div className="card p-4">
        <h3 className="mb-2 text-sm font-semibold">Currently serving</h3>
        {serving.length === 0 ? (
          <p className="text-sm text-[var(--text-muted)]">No patient being served</p>
        ) : (
          <ul className="space-y-2">
            {serving.map((t: any) => (
              <li key={t.id} className="text-sm">
                <span className="font-semibold">{t.ticketNumber}</span> — {t.patientName} · {t.departmentName}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
