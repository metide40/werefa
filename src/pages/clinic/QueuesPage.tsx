import { useEffect, useRef, useState } from 'react';
import { Phone, CheckCircle2, UserX, Volume2, VolumeX } from 'lucide-react';
import {
  fetchClinicQueue,
  callNext as apiCallNext,
  completeTicket as apiComplete,
  noShowTicket as apiNoShow,
  fetchEmergencies,
  acknowledgeEmergency,
} from '../../api/client';

export default function ClinicQueuesPage() {
  const [queue, setQueue] = useState<any[]>([]);
  const [status, setStatus] = useState('WAITING,SERVING');
  const [search, setSearch] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [emergencies, setEmergencies] = useState<any[]>([]);
  const [mutedAlerts, setMutedAlerts] = useState(() => localStorage.getItem('werfa_mute_emergency') === '1');
  const seenEmergencyIds = useRef<Set<number>>(new Set());
  const mounted = useRef(true);

  const playGentleAlert = () => {
    if (mutedAlerts) return;
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = 520;
      gain.gain.value = 0.04;
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      setTimeout(() => { osc.stop(); ctx.close(); }, 350);
    } catch { /* browser may block autoplay */ }
  };

  const load = async () => {
    try {
      const [q, em] = await Promise.all([
        fetchClinicQueue({ status }),
        fetchEmergencies({ active: 'true' }).catch(() => []),
      ]);
      if (!mounted.current) return;
      let list = q || [];
      if (search) {
        const s = search.toLowerCase();
        list = list.filter((t: any) => String(t.ticketNumber || '').toLowerCase().includes(s));
      }
      setQueue(list);
      const list = em || [];
      // Play once per new emergency id
      for (const item of list) {
        if (item?.id && !seenEmergencyIds.current.has(item.id)) {
          seenEmergencyIds.current.add(item.id);
          if (item.status === 'REPORTED') playGentleAlert();
        }
      }
      setEmergencies(list);
      setError(null);
    } catch (e: any) {
      if (mounted.current) setError(e?.message || 'Failed to load queue');
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
  }, [status]);

  const waiting = queue.filter((t) => t.status === 'WAITING');
  const serving = queue.filter((t) => t.status === 'CALLED' || t.status === 'SERVING');

  const onCallNext = async () => {
    setBusy('call');
    try {
      await apiCallNext({});
      await load();
    } catch (e: any) {
      setError(e?.message || 'Call next failed');
    } finally {
      setBusy(null);
    }
  };

  const onComplete = async (id: string) => {
    setBusy(`c-${id}`);
    try {
      await apiComplete(id);
      await load();
    } catch (e: any) {
      setError(e?.message || 'Complete failed');
    } finally {
      setBusy(null);
    }
  };

  const onNoShow = async (id: string) => {
    setBusy(`n-${id}`);
    try {
      await apiNoShow(id);
      await load();
    } catch (e: any) {
      setError(e?.message || 'No-show failed');
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold" style={{ color: 'var(--text)' }}>Live Queue</h2>
          <p className="text-xs text-[var(--text-muted)]">Assigned clinic only</p>
        </div>
        <button
          type="button"
          className="btn-ghost text-xs"
          onClick={() => {
            const next = !mutedAlerts;
            setMutedAlerts(next);
            localStorage.setItem('werfa_mute_emergency', next ? '1' : '0');
          }}
          title={mutedAlerts ? 'Unmute emergency alerts' : 'Mute emergency alerts'}
        >
          {mutedAlerts ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
          {mutedAlerts ? 'Alerts muted' : 'Alerts on'}
        </button>
        <button type="button" className="btn-primary text-sm" disabled={busy === 'call' || waiting.length === 0} onClick={onCallNext}>
          <Phone className="h-4 w-4" /> Call next
        </button>
      </div>
      <div className="flex flex-wrap gap-2">
        <select className="input-field w-auto text-sm" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="WAITING,SERVING">Active</option>
          <option value="WAITING">Waiting</option>
          <option value="SERVING">Serving</option>
          <option value="COMPLETED">Completed</option>
          <option value="NO_SHOW">No-show</option>
        </select>
        <input className="input-field max-w-xs text-sm" placeholder="Search ticket #" value={search} onChange={(e) => setSearch(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && load()} />
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}

      {emergencies.length > 0 && (
        <div className="space-y-2">
          {emergencies.map((em) => (
            <div key={em.id} className="rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-900">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="font-bold">Emergency {em.case_id}</p>
                  <p className="text-xs">{em.department_name || 'Department TBD'} · {em.status}</p>
                </div>
                {em.status === 'REPORTED' && (
                  <button
                    type="button"
                    className="btn-secondary text-xs"
                    onClick={async () => {
                      try {
                        await acknowledgeEmergency(em.id);
                        await load();
                      } catch (err: any) {
                        setError(err?.message);
                      }
                    }}
                  >
                    Acknowledge
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {serving.length > 0 && (
        <div className="card p-4">
          <h3 className="mb-2 text-sm font-semibold">Currently serving</h3>
          {serving.map((tk) => (
            <div key={tk.id} className="mb-2 flex flex-wrap items-center justify-between gap-2 rounded-xl border p-3" style={{ borderColor: 'var(--border)' }}>
              <div>
                <p className="font-bold">{tk.ticketNumber}</p>
                <p className="text-sm">{tk.patientName} · {tk.departmentName}</p>
              </div>
              <div className="flex gap-2">
                <button type="button" className="btn-primary text-xs" disabled={busy === `c-${tk.id}`} onClick={() => onComplete(tk.id)}>
                  <CheckCircle2 className="h-3.5 w-3.5" /> Complete
                </button>
                <button type="button" className="btn-ghost text-xs" disabled={busy === `n-${tk.id}`} onClick={() => onNoShow(tk.id)}>
                  <UserX className="h-3.5 w-3.5" /> No-show
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="card overflow-x-auto">
        <table className="w-full min-w-[560px] text-left text-sm">
          <thead>
            <tr className="border-b text-[11px] uppercase text-[var(--text-muted)]" style={{ borderColor: 'var(--border)' }}>
              <th className="px-4 py-2">Ticket</th>
              <th className="px-3 py-2">Patient</th>
              <th className="px-3 py-2">Department</th>
              <th className="px-3 py-2">Priority</th>
              <th className="px-3 py-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {queue.length === 0 ? (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-[var(--text-muted)]">No patients in this view</td></tr>
            ) : (
              queue.map((tk) => (
                <tr
                  key={tk.id}
                  className={`border-b ${tk.priority === 'EMERGENCY' ? 'bg-red-50 dark:bg-red-950/20' : tk.priority === 'URGENT' ? 'bg-orange-50/80 dark:bg-orange-950/10' : ''}`}
                  style={{ borderColor: 'var(--border)' }}
                >
                  <td className="px-4 py-2 font-medium">{tk.ticketNumber}</td>
                  <td className="px-3 py-2">{tk.patientName}</td>
                  <td className="px-3 py-2 text-[var(--text-muted)]">{tk.departmentName}</td>
                  <td className={`px-3 py-2 font-semibold ${tk.priority === 'EMERGENCY' ? 'text-red-700' : tk.priority === 'URGENT' ? 'text-orange-700' : ''}`}>{tk.priority}</td>
                  <td className="px-3 py-2">{tk.status}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
