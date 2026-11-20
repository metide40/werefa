import { useEffect, useRef, useState } from 'react';
import { fetchAdminQueues, fetchAdminClinics } from '../../api/client';

export default function AdminQueuesPage() {
  const [rows, setRows] = useState<any[]>([]);
  const [clinics, setClinics] = useState<any[]>([]);
  const [clinicId, setClinicId] = useState('');
  const [status, setStatus] = useState('WAITING,SERVING');
  const [priority, setPriority] = useState('');
  const [search, setSearch] = useState('');
  const [error, setError] = useState<string | null>(null);
  const mounted = useRef(true);

  const load = async () => {
    try {
      const data = await fetchAdminQueues({
        clinic_id: clinicId || undefined,
        status: status || undefined,
        priority: priority || undefined,
      });
      if (!mounted.current) return;
      let list = data?.results || [];
      if (search) {
        const q = search.toLowerCase();
        list = list.filter((r: any) => String(r.ticketNumber || '').toLowerCase().includes(q));
      }
      setRows(list);
      setError(null);
    } catch (e: any) {
      if (mounted.current) setError(e?.message || 'Failed to load queues');
    }
  };

  useEffect(() => {
    mounted.current = true;
    fetchAdminClinics().then(setClinics).catch(() => {});
    load();
    const id = setInterval(load, 5000);
    return () => {
      mounted.current = false;
      clearInterval(id);
    };
  }, [clinicId, status, priority]);

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-bold" style={{ color: 'var(--text)' }}>Live Queues</h2>
        <p className="text-xs text-[var(--text-muted)]">Platform monitoring · no patient phone numbers shown</p>
      </div>
      <div className="flex flex-wrap gap-2">
        <select className="input-field w-auto text-sm" value={clinicId} onChange={(e) => setClinicId(e.target.value)}>
          <option value="">All clinics</option>
          {clinics.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
        <select className="input-field w-auto text-sm" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="WAITING,SERVING">Active</option>
          <option value="WAITING">Waiting</option>
          <option value="SERVING">Serving</option>
          <option value="COMPLETED">Completed</option>
          <option value="NO_SHOW">No-show</option>
        </select>
        <select className="input-field w-auto text-sm" value={priority} onChange={(e) => setPriority(e.target.value)}>
          <option value="">All priorities</option>
          <option value="EMERGENCY">Emergency</option>
          <option value="URGENT">Urgent</option>
          <option value="NORMAL">Normal</option>
        </select>
        <input className="input-field max-w-xs text-sm" placeholder="Search ticket #" value={search} onChange={(e) => setSearch(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && load()} />
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="card overflow-x-auto">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead>
            <tr className="border-b text-[11px] uppercase text-[var(--text-muted)]" style={{ borderColor: 'var(--border)' }}>
              <th className="px-4 py-2">Ticket</th>
              <th className="px-3 py-2">Clinic</th>
              <th className="px-3 py-2">Department</th>
              <th className="px-3 py-2">Priority</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2">Joined</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-[var(--text-muted)]">No tickets</td></tr>
            ) : (
              rows.map((r) => (
                <tr key={r.id} className="border-b" style={{ borderColor: 'var(--border)' }}>
                  <td className="px-4 py-2 font-medium">{r.ticketNumber}</td>
                  <td className="px-3 py-2 text-[var(--text-muted)]">{r.clinicName}</td>
                  <td className="px-3 py-2 text-[var(--text-muted)]">{r.departmentName}</td>
                  <td className="px-3 py-2">{r.priority}</td>
                  <td className="px-3 py-2">{r.status}</td>
                  <td className="px-3 py-2 text-[var(--text-muted)]">{r.joinedAt ? new Date(r.joinedAt).toLocaleString() : '—'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
