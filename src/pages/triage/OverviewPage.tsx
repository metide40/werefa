import { useTranslation } from 'react-i18next';
import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchTriageOverview } from '../../api/client';

export default function TriageOverviewPage() {
  const { t } = useTranslation();
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
        if (mounted.current) setError(e?.message || t('triage.errors.loadFailed'));
      }
    };
    load();
    const id = setInterval(load, 5000);
    return () => {
      mounted.current = false;
      clearInterval(id);
    };
  }, [t]);

  if (error) return <p className="text-sm text-red-600">{error}</p>;
  if (!data) return <p className="text-sm text-[var(--text-muted)]">{t('triage.loading')}</p>;

  const cards = [
    { label: t('triage.stats.awaiting'), value: data.awaiting_triage, to: '/triage/pending' },
    { label: t('triage.stats.activeEmergencies'), value: data.active_emergencies, to: '/triage/emergencies' },
    { label: t('triage.stats.emergencyWaiting'), value: data.emergency_waiting, to: '/triage/emergencies' },
    { label: t('triage.stats.urgentWaiting'), value: data.urgent_waiting, to: '/triage/pending' },
    { label: t('triage.stats.normalWaiting'), value: data.normal_waiting, to: '/triage/pending' },
    { label: t('triage.stats.assessedToday'), value: data.assessed_today, to: '/triage/history' },
  ];

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-bold" style={{ color: 'var(--text)' }}>{t('triage.overview')}</h2>
        <p className="text-xs text-[var(--text-muted)]">{data.clinic_name}</p>
      </div>
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-3">
        {cards.map((c) => (
          <Link key={c.label} to={c.to} className="card flex flex-col p-4 hover:shadow-card">
            <p className="text-2xl font-bold" style={{ color: 'var(--text)' }}>{c.value ?? '—'}</p>
            <p className="text-xs text-[var(--text-muted)]">{c.label}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
