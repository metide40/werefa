import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchTriagePending } from '../../api/client';

export default function TriagePendingPage() {
  const [rows, setRows] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    const load = async () => {
      try {
        const d = await fetchTriagePending();
        if (mounted.current) {
          setRows(d || []);
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

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-lg font-bold" style={{ color: 'var(--text)' }}>Waiting for triage</h2>
          <p className="text-xs text-[var(--text-muted)]">Patients in queue who may need assessment</p>
        </div>
        <Link to="/triage/assess" className="btn-primary text-sm">New walk-in assessment</Link>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="card overflow-x-auto">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead>
            <tr className="border-b text-[11px] uppercase text-[var(--text-muted)]" style={{ borderColor: 'var(--border)' }}>
              <th className="px-4 py-2">Ticket</th>
              <th className="px-3 py-2">Patient</th>
              <th className="px-3 py-2">Department</th>
              <th className="px-3 py-2">Priority</th>
              <th className="px-3 py-2">Assessed</th>
              <th className="px-3 py-2">Arrived</th>
              <th className="px-3 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-[var(--text-muted)]">No waiting patients</td></tr>
            ) : (
              rows.map((r) => (
                <tr key={r.ticket_id} className="border-b" style={{ borderColor: 'var(--border)' }}>
                  <td className="px-4 py-2 font-medium">{r.ticket_number}</td>
                  <td className="px-3 py-2">{r.patient_name}</td>
                  <td className="px-3 py-2 text-[var(--text-muted)]">{r.department_name}</td>
                  <td className="px-3 py-2">
                    <span className={
                      r.priority === 'EMERGENCY' ? 'text-red-700 font-semibold' :
                      r.priority === 'URGENT' ? 'text-orange-700 font-semibold' : ''
                    }>{r.priority}</span>
                  </td>
                  <td className="px-3 py-2">{r.assessed ? 'Yes' : 'No'}</td>
                  <td className="px-3 py-2 text-[var(--text-muted)]">{r.joined_at ? new Date(r.joined_at).toLocaleTimeString() : '—'}</td>
                  <td className="px-3 py-2">
                    <Link
                      to={`/triage/assess?ticket=${r.ticket_id}&patient=${r.patient_id}&dept=${r.department_id}&name=${encodeURIComponent(r.patient_name || '')}`}
                      className="text-xs font-semibold text-brand-green hover:underline"
                    >
                      Assess
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
