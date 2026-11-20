import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchTriageOverview } from '../../api/client';

export default function TriageOverviewPage() {
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    const load = async () => {
      try {
        const d = await fetchTriageOverview();
        if (mounted.current) {
          setData(d);
          setError(null);
        }
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
  if (!data) return <p className="text-sm text-[var(--text-muted)]">Loading…</p>;

  const cards = [
    { label: 'Awaiting triage', value: data.awaiting_triage, to: '/triage/pending', color: 'var(--primary)' },
    { label: 'Active emergencies', value: data.active_emergencies, to: '/triage/emergencies', color: '#b91c1c' },
    { label: 'Emergency waiting', value: data.emergency_waiting, to: '/triage/emergencies', color: '#b91c1c' },
    { label: 'Urgent waiting', value: data.urgent_waiting, to: '/triage/pending', color: '#c2410c' },
    { label: 'Normal waiting', value: data.normal_waiting, to: '/triage/pending', color: '#059669' },
    { label: 'Assessed today', value: data.assessed_today, to: '/triage/history', color: 'var(--highlight)' },
  ];

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-bold" style={{ color: 'var(--text)' }}>Triage overview</h2>
        <p className="text-xs text-[var(--text-muted)]">{data.clinic_name}</p>
      </div>
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-3">
        {cards.map((c) => (
          <Link key={c.label} to={c.to} className="card flex flex-col p-4 hover:shadow-card">
            <p className="text-2xl font-bold" style={{ color: c.color }}>{c.value ?? '—'}</p>
            <p className="text-xs text-[var(--text-muted)]">{c.label}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
