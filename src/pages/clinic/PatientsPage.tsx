import { useEffect, useState } from 'react';
import { fetchClinicQueue } from '../../api/client';

export default function ClinicPatientsPage() {
  const [rows, setRows] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    try {
      const q = await fetchClinicQueue({ status: 'WAITING,SERVING,COMPLETED,NO_SHOW' });
      let list = q || [];
      if (search) {
        const s = search.toLowerCase();
        list = list.filter(
          (t: any) =>
            String(t.ticketNumber || '').toLowerCase().includes(s) ||
            String(t.patientName || '').toLowerCase().includes(s)
        );
      }
      setRows(list);
      setError(null);
    } catch (e: any) {
      setError(e?.message || 'Failed to load records');
    }
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-bold" style={{ color: 'var(--text)' }}>Patient queue history</h2>
        <p className="text-xs text-[var(--text-muted)]">Tickets for your assigned clinic only</p>
      </div>
      <input className="input-field max-w-sm text-sm" placeholder="Search name or ticket" value={search} onChange={(e) => setSearch(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && load()} />
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="card overflow-x-auto">
        <table className="w-full min-w-[560px] text-left text-sm">
          <thead>
            <tr className="border-b text-[11px] uppercase text-[var(--text-muted)]" style={{ borderColor: 'var(--border)' }}>
              <th className="px-4 py-2">Ticket</th>
              <th className="px-3 py-2">Patient</th>
              <th className="px-3 py-2">Department</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2">Joined</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((t) => (
              <tr key={t.id} className="border-b" style={{ borderColor: 'var(--border)' }}>
                <td className="px-4 py-2 font-medium">{t.ticketNumber}</td>
                <td className="px-3 py-2">{t.patientName}</td>
                <td className="px-3 py-2 text-[var(--text-muted)]">{t.departmentName}</td>
                <td className="px-3 py-2">{t.status}</td>
                <td className="px-3 py-2 text-[var(--text-muted)]">{t.joinedAt ? new Date(t.joinedAt).toLocaleString() : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
