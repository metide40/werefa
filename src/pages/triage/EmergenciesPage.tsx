import { useEffect, useRef, useState } from 'react';
import { acknowledgeEmergency, fetchEmergencies, updateEmergencyStatus } from '../../api/client';

export default function TriageEmergenciesPage() {
  const [rows, setRows] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const mounted = useRef(true);

  const load = async () => {
    try {
      const d = await fetchEmergencies({ active: 'true' });
      if (mounted.current) {
        setRows(d || []);
        setError(null);
      }
    } catch (e: any) {
      if (mounted.current) setError(e?.message || 'Failed to load');
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
  }, []);

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-bold text-red-800">Emergency cases</h2>
        <p className="text-xs text-[var(--text-muted)]">Active emergencies for your clinic</p>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      {rows.length === 0 ? (
        <p className="text-sm text-[var(--text-muted)]">No active emergencies</p>
      ) : (
        <ul className="space-y-3">
          {rows.map((e) => (
            <li key={e.id} className="card border-l-4 border-l-red-600 p-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-bold text-red-800">{e.case_id}</p>
                  <p className="text-sm">{e.patient_name} · {e.department_name || '—'}</p>
                  <p className="text-xs text-[var(--text-muted)]">
                    {e.status} · {e.activated_at ? new Date(e.activated_at).toLocaleString() : ''}
                  </p>
                  <p className="mt-1 text-sm text-[var(--text)]">{e.emergency_reason}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {e.status === 'REPORTED' && (
                    <button
                      type="button"
                      className="btn-secondary text-xs"
                      disabled={busy === `a-${e.id}`}
                      onClick={async () => {
                        setBusy(`a-${e.id}`);
                        try {
                          await acknowledgeEmergency(e.id);
                          await load();
                        } catch (err: any) {
                          setError(err?.message);
                        } finally {
                          setBusy(null);
                        }
                      }}
                    >
                      Acknowledge
                    </button>
                  )}
                  <button
                    type="button"
                    className="btn-primary text-xs"
                    disabled={busy === `c-${e.id}`}
                    onClick={async () => {
                      setBusy(`c-${e.id}`);
                      try {
                        await updateEmergencyStatus(e.id, 'COMPLETED');
                        await load();
                      } catch (err: any) {
                        setError(err?.message);
                      } finally {
                        setBusy(null);
                      }
                    }}
                  >
                    Mark completed
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
