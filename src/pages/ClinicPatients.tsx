import { useEffect, useState } from 'react';
import { fetchClinicQueue } from '../api/client';
import { AlertCircle, Stethoscope } from 'lucide-react';

function ClinicPatients() {
  const [patients, setPatients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchClinicQueue({ status: 'WAITING,SERVING,COMPLETED,NO_SHOW' })
      .then((data) => setPatients(data || []))
      .catch((e) => setError(e?.message || 'Failed to load patients'))
      .finally(() => setLoading(false));
  }, []);

  const filtered = patients.filter(
    (p) =>
      !search ||
      p.patientName?.toLowerCase().includes(search.toLowerCase()) ||
      p.ticketNumber?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <p className="text-sm text-[var(--text-muted)]">Loading patient records…</p>;
  if (error)
    return (
      <div className="mb-4 flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-xs text-red-700">
        <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" /><p>{error}</p>
      </div>
    );

  return (
    <div className="card">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b px-4 py-3 sm:px-5" style={{ borderColor: 'var(--border)' }}>
        <h2 className="text-sm font-semibold" style={{ color: 'var(--text)' }}>Patient Records</h2>
        <input
          className="input-field w-48 py-1.5 text-xs"
          placeholder="Search name or ticket…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>
      {filtered.length === 0 ? (
        <div className="py-10 text-center text-sm text-[var(--text-muted)]">No records found</div>
      ) : (
        <ul className="divide-y" style={{ borderColor: 'var(--border)' }}>
          {filtered.map((p: any) => (
            <li key={p.id} className="flex items-center gap-3 px-4 py-3.5 sm:px-5">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-lightTeal">
                <Stethoscope className="h-4 w-4 text-brand-green" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold" style={{ color: 'var(--text)' }}>{p.patientName}</p>
                <p className="truncate text-xs text-[var(--text-muted)]">
                  {p.ticketNumber} · {p.departmentName} · {p.status}
                </p>
              </div>
              <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                p.priority === 'EMERGENCY' ? 'bg-red-50 text-red-700' :
                p.priority === 'URGENT' ? 'bg-orange-50 text-orange-700' :
                'bg-brand-lightTeal text-brand-green'
              }`}>
                {p.priority}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default ClinicPatients;
