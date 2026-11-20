import { useEffect, useState, useCallback, useRef } from 'react';
import {
  fetchClinicQueue,
  callNext as apiCallNext,
  completeTicket as apiComplete,
  noShowTicket as apiNoShow,
} from '../api/client';
import { Phone, CheckCircle2, UserX, AlertCircle, Inbox, ChevronDown } from 'lucide-react';
import { WerfaMark } from '../components/Logo';

function ClinicLiveQueue() {
  const [queue, setQueue] = useState<any[]>([]);
  const [selectedDept, setSelectedDept] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const mounted = useRef(true);

  const load = useCallback(async () => {
    try {
      const params: { status: string; department_id?: string } = {
        status: 'WAITING,SERVING',
      };
      if (selectedDept !== 'all') params.department_id = selectedDept;
      const data = await fetchClinicQueue(params);
      if (mounted.current) {
        setQueue(
          (data || []).map((r: any) => ({
            ...r,
            id: String(r.id),
            status: r.status === 'SERVING' ? 'CALLED' : r.status,
          }))
        );
        setError(null);
      }
    } catch (e: any) {
      if (mounted.current) setError(e?.message || 'Failed to load queue');
    } finally {
      if (mounted.current) setLoading(false);
    }
  }, [selectedDept]);

  useEffect(() => {
    mounted.current = true;
    load();
    const id = setInterval(load, 5000);
    return () => {
      mounted.current = false;
      clearInterval(id);
    };
  }, [selectedDept]); // eslint-disable-line

  const waiting = queue.filter((t) => t.status === 'WAITING');
  const serving = queue.filter((t) => t.status === 'CALLED' || t.status === 'SERVING');

  const onCallNext = async () => {
    setActionLoading('call');
    try { await apiCallNext({}); await load(); } catch (e: any) { setError(e?.message || 'Call next failed'); } finally { setActionLoading(null); }
  };
  const onComplete = async (id: string) => {
    setActionLoading(`complete-${id}`);
    try { await apiComplete(id); await load(); } catch (e: any) { setError(e?.message || 'Complete failed'); } finally { setActionLoading(null); }
  };
  const onNoShow = async (id: string) => {
    setActionLoading(`noshow-${id}`);
    try { await apiNoShow(id); await load(); } catch (e: any) { setError(e?.message || 'No-show failed'); } finally { setActionLoading(null); }
  };

  if (loading) return <p className="text-sm text-[var(--text-muted)]">Loading queue…</p>;

  return (
    <div>
      {error && (
        <div className="mb-4 flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-xs text-red-700">
          <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" /><p>{error}</p>
        </div>
      )}

      {/* Now serving */}
      {serving.length > 0 && (
        <div className="mb-5 grid gap-3 sm:grid-cols-2">
          {serving.map((tk) => (
            <div key={tk.id} className="card rounded-xl border p-3.5"
              style={{ borderColor: 'color-mix(in srgb, var(--highlight) 35%, transparent)', backgroundColor: 'color-mix(in srgb, var(--highlight) 8%, transparent)' }}>
              <p className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">Now Serving</p>
              <p className="mt-1 text-lg font-bold" style={{ color: 'var(--text)' }}>{tk.ticketNumber}</p>
              <p className="text-sm font-medium" style={{ color: 'var(--text)' }}>{tk.patientName}</p>
              <p className="text-xs text-[var(--text-muted)]">{tk.departmentName}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <button type="button" disabled={actionLoading === `complete-${tk.id}`} onClick={() => onComplete(tk.id)} className="btn-primary px-3 py-1.5 text-xs disabled:opacity-60">
                  <CheckCircle2 className="h-3.5 w-3.5" /> Mark Complete
                </button>
                <button type="button" disabled={actionLoading === `noshow-${tk.id}`} onClick={() => onNoShow(tk.id)} className="btn-ghost px-3 py-1.5 text-xs disabled:opacity-60">
                  <UserX className="h-3.5 w-3.5" /> No-show
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Waiting queue */}
      <div className="card">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b px-4 py-3 sm:px-5" style={{ borderColor: 'var(--border)' }}>
          <h2 className="text-sm font-semibold" style={{ color: 'var(--text)' }}>Waiting Queue</h2>
          <div className="flex items-center gap-2">
            <div className="relative">
              <select value={selectedDept} onChange={(e) => setSelectedDept(e.target.value)} className="input-field appearance-none py-1.5 pr-8 text-xs">
                <option value="all">All Departments</option>
              </select>
              <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--text-muted)]" />
            </div>
            {waiting.length > 0 && (
              <button type="button" disabled={actionLoading === 'call'} onClick={onCallNext} className="btn-primary px-3 py-1.5 text-xs disabled:opacity-60">
                <Phone className="h-3.5 w-3.5" /> Call Next
              </button>
            )}
          </div>
        </div>
        {waiting.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-6 py-12 text-center">
            <div className="mb-3 opacity-30"><WerfaMark size={48} /></div>
            <Inbox className="mb-2 h-5 w-5 text-[var(--text-muted)]" />
            <p className="text-sm font-semibold" style={{ color: 'var(--text)' }}>Queue is empty</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[520px] text-left text-sm">
              <thead>
                <tr className="border-b text-[11px] font-semibold uppercase tracking-wide text-[var(--text-muted)]" style={{ borderColor: 'var(--border)' }}>
                  <th className="px-4 py-3 sm:px-5">Ticket</th>
                  <th className="px-3 py-3">Patient</th>
                  <th className="hidden px-3 py-3 sm:table-cell">Department</th>
                  <th className="px-3 py-3">Priority</th>
                  <th className="hidden px-3 py-3 md:table-cell">Joined</th>
                </tr>
              </thead>
              <tbody>
                {waiting.map((tk) => (
                  <tr key={tk.id} className="border-b" style={{ borderColor: 'var(--border)' }}>
                    <td className="px-4 py-3 font-semibold sm:px-5" style={{ color: 'var(--text)' }}>{tk.ticketNumber}</td>
                    <td className="px-3 py-3" style={{ color: 'var(--text)' }}>{tk.patientName}</td>
                    <td className="hidden px-3 py-3 text-[var(--text-muted)] sm:table-cell">{tk.departmentName}</td>
                    <td className="px-3 py-3">
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                        tk.priority === 'EMERGENCY' ? 'bg-red-50 text-red-700' :
                        tk.priority === 'URGENT' ? 'bg-orange-50 text-orange-700' :
                        'bg-brand-lightTeal text-brand-green'
                      }`}>
                        {tk.priority}
                      </span>
                    </td>
                    <td className="hidden px-3 py-3 text-[var(--text-muted)] md:table-cell">
                      {new Date(tk.joinedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default ClinicLiveQueue;
