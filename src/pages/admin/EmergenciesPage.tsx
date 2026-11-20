import { useEffect, useRef, useState } from 'react';
import { fetchAdminEmergencies } from '../../api/client';

export default function AdminEmergenciesPage() {
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState('');
  const mounted = useRef(true);

  const load = async () => {
    try {
      const d = await fetchAdminEmergencies(status ? { status } as any : undefined);
      // client helper may not pass status — call with query via fetchAdminEmergencies
      if (mounted.current) {
        setData(d);
        setError(null);
      }
    } catch (e: any) {
      if (mounted.current) setError(e?.message || 'Failed');
    }
  };

  useEffect(() => {
    mounted.current = true;
    load();
    const id = setInterval(load, 8000);
    return () => {
      mounted.current = false;
      clearInterval(id);
    };
  }, [status]);

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold" style={{ color: 'var(--text)' }}>Emergency monitoring</h2>
      <p className="text-xs text-[var(--text-muted)]">Platform-wide emergency cases and review indicators (not automatic accusations)</p>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="flex flex-wrap gap-2">
        <select className="input-field w-auto text-sm" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All statuses</option>
          <option value="REPORTED">Reported</option>
          <option value="ACKNOWLEDGED">Acknowledged</option>
          <option value="CARE_IN_PROGRESS">Care in progress</option>
          <option value="COMPLETED">Completed</option>
        </select>
        <button type="button" className="btn-secondary text-sm" onClick={load}>Refresh</button>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div className="card p-4"><p className="text-2xl font-bold">{data?.total ?? '—'}</p><p className="text-xs text-[var(--text-muted)]">Total</p></div>
        <div className="card p-4"><p className="text-2xl font-bold text-red-700">{data?.active ?? '—'}</p><p className="text-xs text-[var(--text-muted)]">Active</p></div>
        <div className="card p-4"><p className="text-2xl font-bold">{data?.completed ?? '—'}</p><p className="text-xs text-[var(--text-muted)]">Completed</p></div>
      </div>
      <div className="grid gap-3 lg:grid-cols-2">
        <div className="card p-4">
          <h3 className="mb-2 text-sm font-semibold">By clinic</h3>
          <ul className="space-y-1 text-sm">
            {(data?.by_clinic || []).map((r: any) => (
              <li key={r.clinic_id} className="flex justify-between">
                <span>{r.clinic__name || r.clinic_id}</span>
                <span className="font-semibold">{r.count}</span>
              </li>
            ))}
            {!(data?.by_clinic || []).length && <li className="text-[var(--text-muted)]">No data</li>}
          </ul>
        </div>
        <div className="card p-4">
          <h3 className="mb-2 text-sm font-semibold">By department</h3>
          <ul className="space-y-1 text-sm">
            {(data?.by_department || []).map((r: any, i: number) => (
              <li key={i} className="flex justify-between">
                <span>{r.department__name || '—'}</span>
                <span className="font-semibold">{r.count}</span>
              </li>
            ))}
            {!(data?.by_department || []).length && <li className="text-[var(--text-muted)]">No data</li>}
          </ul>
        </div>
      </div>
      {(data?.review_indicators || []).length > 0 && (
        <div className="card border-amber-300 p-4">
          <h3 className="mb-2 text-sm font-semibold text-amber-800">Review indicators</h3>
          <p className="mb-2 text-xs text-[var(--text-muted)]">For human review only — not automatic accusations.</p>
          <ul className="space-y-1 text-sm">
            {data.review_indicators.map((r: any, i: number) => (
              <li key={i}>{r.actor}: {r.count_24h} priority changes in 24h</li>
            ))}
          </ul>
        </div>
      )}
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
      <div className="card p-4">
        <h3 className="mb-2 text-sm font-semibold">Priority change audit</h3>
        <ul className="max-h-48 space-y-2 overflow-y-auto text-xs">
          {(data?.audit_priority_changes || []).map((a: any) => (
            <li key={a.id}>
              <span className="font-medium">{a.message}</span>
              <span className="text-[var(--text-muted)]"> · {a.actor || '—'} · {a.created_at ? new Date(a.created_at).toLocaleString() : ''}</span>
            </li>
          ))}
          {!(data?.audit_priority_changes || []).length && <li className="text-[var(--text-muted)]">No priority audit events yet</li>}
        </ul>
      </div>
    </div>
  );
}
