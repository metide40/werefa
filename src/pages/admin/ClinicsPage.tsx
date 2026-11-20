import type { FormEvent } from 'react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Building2, Plus } from 'lucide-react';
import { fetchAdminClinics, createAdminClinic } from '../../api/client';

export default function AdminClinicsPage() {
  const [clinics, setClinics] = useState<any[]>([]);
  const [q, setQ] = useState('');
  const [active, setActive] = useState<'all' | 'true' | 'false'>('all');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', city: '', region: '', phone: '' });
  const [saving, setSaving] = useState(false);

  const load = async () => {
    try {
      setLoading(true);
      const data = await fetchAdminClinics();
      let list = data || [];
      if (q) {
        const qq = q.toLowerCase();
        list = list.filter(
          (c: any) =>
            c.name?.toLowerCase().includes(qq) ||
            c.city?.toLowerCase().includes(qq) ||
            c.region?.toLowerCase().includes(qq)
        );
      }
      if (active === 'true') list = list.filter((c: any) => c.is_active !== false);
      if (active === 'false') list = list.filter((c: any) => c.is_active === false);
      setClinics(list);
      setError(null);
    } catch (e: any) {
      setError(e?.message || 'Failed to load clinics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const onCreate = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await createAdminClinic({
        name: form.name,
        city: form.city,
        region: form.region,
        phone: form.phone,
        clinic_type: 'Primary Hospital',
      });
      setShowForm(false);
      setForm({ name: '', city: '', region: '', phone: '' });
      await load();
    } catch (err: any) {
      setError(err?.message || 'Could not create clinic');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold" style={{ color: 'var(--text)' }}>Partner Clinics</h2>
          <p className="text-xs text-[var(--text-muted)]">Registered facilities in the platform database</p>
        </div>
        <button type="button" className="btn-primary text-sm" onClick={() => setShowForm((v) => !v)}>
          <Plus className="h-4 w-4" /> Register clinic
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        <input
          className="input-field max-w-xs text-sm"
          placeholder="Search name or location"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && load()}
        />
        <select className="input-field w-auto text-sm" value={active} onChange={(e) => setActive(e.target.value as any)}>
          <option value="all">All statuses</option>
          <option value="true">Active</option>
          <option value="false">Inactive</option>
        </select>
        <button type="button" className="btn-secondary text-sm" onClick={load}>Apply</button>
      </div>

      {error && <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      {showForm && (
        <form onSubmit={onCreate} className="card grid gap-3 p-4 sm:grid-cols-2">
          <input className="input-field" required placeholder="Clinic name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <input className="input-field" required placeholder="City" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
          <input className="input-field" required placeholder="Region" value={form.region} onChange={(e) => setForm({ ...form, region: e.target.value })} />
          <input className="input-field" placeholder="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          <div className="sm:col-span-2">
            <button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Saving…' : 'Create clinic'}</button>
          </div>
        </form>
      )}

      {loading ? (
        <p className="text-sm text-[var(--text-muted)]">Loading clinics…</p>
      ) : clinics.length === 0 ? (
        <p className="text-sm text-[var(--text-muted)]">No clinics found</p>
      ) : (
        <ul className="card divide-y" style={{ borderColor: 'var(--border)' }}>
          {clinics.map((c) => (
            <li key={c.id}>
              <Link to={`/admin/clinics/${c.id}`} className="flex items-center gap-3 px-4 py-3.5 hover:bg-black/[0.02]">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-lightTeal">
                  <Building2 className="h-4 w-4 text-brand-green" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold" style={{ color: 'var(--text)' }}>{c.name}</p>
                  <p className="text-xs text-[var(--text-muted)]">{c.city}, {c.region}</p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
