// Admin Live Queues page
import { useEffect, useState } from 'react';
import { fetchAdminQueues } from '../api/client';
import { AlertCircle } from 'lucide-react';

function AdminLiveQueues() {
  const [queues, setQueues] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAdminQueues({ status: 'WAITING,SERVING' })
      .then((data) => setQueues(data?.results || []))
      .catch((e) => setError(e?.message || 'Failed to load queues'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-sm text-[var(--text-muted)]">Loading queues…</p>;
  if (error)
    return (
      <div className="mb-4 flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-xs text-red-700">
        <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
        <p>{error}</p>
      </div>
    );

  return (
    <div className="card">
      <div className="flex items-center justify-between border-b px-4 py-3 sm:px-5" style={{ borderColor: 'var(--border)' }}>
        <h2 className="text-sm font-semibold" style={{ color: 'var(--text)' }}>Live Queues</h2>
        <span className="text-[10px] text-[var(--text-muted)]">{queues.length} total</span>
      </div>
      {queues.length === 0 ? (
        <div className="py-10 text-center text-sm text-[var(--text-muted)]">No queues found</div>
      ) : (
        <table className="w-full min-w-[560px] text-left text-sm">
          <thead>
            <tr className="border-b text-[11px] uppercase text-[var(--text-muted)]" style={{ borderColor: 'var(--border)' }}>
              <th className="px-4 py-2">Ticket</th>
              <th className="px-3 py-2">Clinic</th>
              <th className="px-3 py-2">Department</th>
              <th className="px-3 py-2">Priority</th>
              <th className="px-3 py-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {queues.map((q) => (
              <tr key={q.id} className="border-b" style={{ borderColor: 'var(--border)' }}>
                <td className="px-4 py-2 font-medium" style={{ color: 'var(--text)' }}>{q.ticketNumber}</td>
                <td className="px-3 py-2 text-[var(--text-muted)]">{q.clinicName}</td>
                <td className="px-3 py-2 text-[var(--text-muted)]">{q.departmentName}</td>
                <td className="px-3 py-2">{q.priority}</td>
                <td className="px-3 py-2">{q.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default AdminLiveQueues;
