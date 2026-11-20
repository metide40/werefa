import { useEffect, useState } from 'react';
import { fetchTriageAssessments } from '../../api/client';

export default function TriageHistoryPage() {
  const [rows, setRows] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchTriageAssessments()
      .then(setRows)
      .catch((e) => setError(e?.message || 'Failed'));
  }, []);

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold" style={{ color: 'var(--text)' }}>Triage history</h2>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="card overflow-x-auto">
        <table className="w-full min-w-[560px] text-left text-sm">
          <thead>
            <tr className="border-b text-[11px] uppercase text-[var(--text-muted)]" style={{ borderColor: 'var(--border)' }}>
              <th className="px-4 py-2">Patient</th>
              <th className="px-3 py-2">Priority</th>
              <th className="px-3 py-2">Department</th>
              <th className="px-3 py-2">Nurse</th>
              <th className="px-3 py-2">When</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-b" style={{ borderColor: 'var(--border)' }}>
                <td className="px-4 py-2">{r.patient_name}</td>
                <td className="px-3 py-2 font-medium">{r.priority}</td>
                <td className="px-3 py-2 text-[var(--text-muted)]">{r.department_name || '—'}</td>
                <td className="px-3 py-2">{r.nurse_name || '—'}</td>
                <td className="px-3 py-2 text-[var(--text-muted)]">{r.created_at ? new Date(r.created_at).toLocaleString() : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
