import { useEffect, useRef, useState } from 'react';
import { fetchAdminActivity } from '../../api/client';

export default function AdminActivityPage() {
  const [rows, setRows] = useState<any[]>([]);
  const [type, setType] = useState('');
  const [search, setSearch] = useState('');
  const [error, setError] = useState<string | null>(null);
  const mounted = useRef(true);

  const load = async () => {
    try {
      const data = await fetchAdminActivity();
      if (!mounted.current) return;
      let list = data || [];
      if (type) list = list.filter((a: any) => a.event_type === type);
      if (search) {
        const q = search.toLowerCase();
        list = list.filter((a: any) => String(a.message || '').toLowerCase().includes(q));
      }
      setRows(list);
      setError(null);
    } catch (e: any) {
      if (mounted.current) setError(e?.message || 'Failed to load activity');
    }
  };

  useEffect(() => {
    mounted.current = true;
    load();
    const id = setInterval(load, 5000);
    return () => {
      mounted.current = false;
      clearInterval(id);
    };
  }, [type]);

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-bold" style={{ color: 'var(--text)' }}>System Activity</h2>
        <p className="text-xs text-[var(--text-muted)]">Audit events recorded in the database</p>
      </div>
      <div className="flex flex-wrap gap-2">
        <select className="input-field w-auto text-sm" value={type} onChange={(e) => setType(e.target.value)}>
          <option value="">All events</option>
          <option value="JOIN">Join</option>
          <option value="CALL">Call</option>
          <option value="COMPLETE">Complete</option>
          <option value="NO_SHOW">No-show</option>
          <option value="CLINIC_CREATE">Clinic create</option>
          <option value="CLINIC_UPDATE">Clinic update</option>
        </select>
        <input className="input-field max-w-xs text-sm" placeholder="Search description" value={search} onChange={(e) => setSearch(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && load()} />
        <button type="button" className="btn-secondary text-sm" onClick={load}>Refresh</button>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <ul className="card divide-y" style={{ borderColor: 'var(--border)' }}>
        {rows.length === 0 ? (
          <li className="px-4 py-8 text-center text-xs text-[var(--text-muted)]">No activity records</li>
        ) : (
          rows.map((a) => (
            <li key={a.id} className="px-4 py-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-brand-lightTeal px-2 py-0.5 text-[10px] font-semibold text-brand-green">{a.event_type}</span>
                <span className="text-sm" style={{ color: 'var(--text)' }}>{a.message}</span>
              </div>
              <p className="mt-1 text-[11px] text-[var(--text-muted)]">
                {a.actor ? `${a.actor} · ` : ''}
                {a.clinic ? `${a.clinic} · ` : ''}
                {new Date(a.created_at).toLocaleString()}
              </p>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}
