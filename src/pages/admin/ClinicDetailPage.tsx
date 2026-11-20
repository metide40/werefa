import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { fetchAdminClinic, updateAdminClinic } from '../../api/client';

export default function AdminClinicDetailPage() {
  const { id } = useParams();
  const [clinic, setClinic] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    try {
      setClinic(await fetchAdminClinic(id!));
      setError(null);
    } catch (e: any) {
      setError(e?.message || 'Failed to load clinic');
    }
  };

  useEffect(() => {
    load();
  }, [id]);

  const toggleActive = async () => {
    if (!clinic) return;
    setSaving(true);
    try {
      const updated = await updateAdminClinic(clinic.id, { is_active: !clinic.is_active });
      setClinic({ ...clinic, ...updated });
    } catch (e: any) {
      setError(e?.message || 'Update failed');
    } finally {
      setSaving(false);
    }
  };

  if (error) return <p className="text-sm text-red-600">{error}</p>;
  if (!clinic) return <p className="text-sm text-[var(--text-muted)]">Loading…</p>;

  return (
    <div className="space-y-4">
      <Link to="/admin/clinics" className="text-sm font-medium text-brand-green hover:underline">← Back to clinics</Link>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold" style={{ color: 'var(--text)' }}>{clinic.name}</h2>
          <p className="text-sm text-[var(--text-muted)]">{clinic.city}, {clinic.region}</p>
        </div>
        <button type="button" className="btn-secondary text-sm" disabled={saving} onClick={toggleActive}>
          {clinic.is_active === false ? 'Activate' : 'Deactivate'}
        </button>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="card p-4">
          <p className="text-xs text-[var(--text-muted)]">Waiting</p>
          <p className="text-2xl font-bold">{clinic.queue_stats?.waiting ?? 0}</p>
        </div>
        <div className="card p-4">
          <p className="text-xs text-[var(--text-muted)]">Serving</p>
          <p className="text-2xl font-bold">{clinic.queue_stats?.serving ?? 0}</p>
        </div>
        <div className="card p-4">
          <p className="text-xs text-[var(--text-muted)]">Departments</p>
          <p className="text-2xl font-bold">{clinic.departments?.length ?? 0}</p>
        </div>
      </div>
      <div className="card p-4">
        <h3 className="mb-2 text-sm font-semibold">Departments</h3>
        <ul className="space-y-1 text-sm">
          {(clinic.departments || []).map((d: any) => (
            <li key={d.id}>{d.name} <span className="text-[var(--text-muted)]">({d.code})</span></li>
          ))}
        </ul>
      </div>
      <div className="card p-4">
        <h3 className="mb-2 text-sm font-semibold">Assigned staff</h3>
        {(clinic.staff || []).length === 0 ? (
          <p className="text-xs text-[var(--text-muted)]">No staff assigned</p>
        ) : (
          <ul className="space-y-1 text-sm">
            {clinic.staff.map((s: any) => (
              <li key={s.id}>{s.name} · {s.username}</li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
