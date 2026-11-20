import { useEffect, useRef, useState } from 'react';
import { fetchAdminEmergencies } from '../../api/client';

export default function AdminEmergenciesPage() {
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    const load = async () => {
      try {
        const d = await fetchAdminEmergencies();
        if (mounted.current) {
          setData(d);
          setError(null);
        }
      } catch (e: any) {
        if (mounted.current) setError(e?.message || 'Failed');
      }
    };
    load();
    const id = setInterval(load, 8000);
    return () => {
      mounted.current = false;
      clearInterval(id);
    };
  }, []);

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold" style={{ color: 'var(--text)' }}>Emergency monitoring</h2>
      <p className="text-xs text-[var(--text-muted)]">Platform-wide emergency cases from the database</p>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="grid grid-cols-3 gap-3">
        <div className="card p-4"><p className="text-2xl font-bold">{data?.total ?? '—'}</p><p className="text-xs text-[var(--text-muted)]">Total</p></div>
        <div className="card p-4"><p className="text-2xl font-bold text-red-700">{data?.active ?? '—'}</p><p className="text-xs text-[var(--text-muted)]">Active</p></div>
        <div className="card p-4"><p className="text-2xl font-bold">{data?.completed ?? '—'}</p><p className="text-xs text-[var(--text-muted)]">Completed</p></div>
      </div>
      <div className="card overflow-x-auto">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead>
            <tr className="border-b text-[11px] uppercase text-[var(--text-muted)]" style={{ borderColor: 'var(--border)' }}>
              <th className="px-4 py-2">Case</th>
              <th className="px-3 py-2">Clinic</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2">Activated</th>
            </tr>
          </thead>
          <tbody>
            {(data?.results || []).map((r: any) => (
              <tr key={r.id} className="border-b" style={{ borderColor: 'var(--border)' }}>
                <td className="px-4 py-2 font-medium">{r.case_id}</td>
                <td className="px-3 py-2">{r.clinic_name}</td>
                <td className="px-3 py-2">{r.status}</td>
                <td className="px-3 py-2 text-[var(--text-muted)]">{r.activated_at ? new Date(r.activated_at).toLocaleString() : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
