import { useEffect, useState } from 'react';
import { fetchClinicOverview, fetchClinicQueue } from '../../api/client';

export default function ClinicDepartmentsPage() {
  const [depts, setDepts] = useState<{ id: string; name: string; waiting: number; serving: number }[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const [ov, waiting, serving] = await Promise.all([
          fetchClinicOverview(),
          fetchClinicQueue({ status: 'WAITING' }),
          fetchClinicQueue({ status: 'SERVING' }),
        ]);
        const map = new Map<string, { id: string; name: string; waiting: number; serving: number }>();
        for (const t of [...(waiting || []), ...(serving || [])]) {
          const id = String(t.departmentId);
          if (!map.has(id)) {
            map.set(id, { id, name: t.departmentName, waiting: 0, serving: 0 });
          }
          const row = map.get(id)!;
          if (t.status === 'WAITING') row.waiting += 1;
          else row.serving += 1;
        }
        setDepts(Array.from(map.values()));
        if (!map.size && ov?.clinic_name) {
          // empty is valid
        }
        setError(null);
      } catch (e: any) {
        setError(e?.message || 'Failed to load departments');
      }
    })();
  }, []);

  if (error) return <p className="text-sm text-red-600">{error}</p>;

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-bold" style={{ color: 'var(--text)' }}>Departments</h2>
        <p className="text-xs text-[var(--text-muted)]">Queue counts by department for your clinic</p>
      </div>
      {depts.length === 0 ? (
        <p className="text-sm text-[var(--text-muted)]">No active department queue data</p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {depts.map((d) => (
            <div key={d.id} className="card p-4">
              <p className="font-semibold" style={{ color: 'var(--text)' }}>{d.name}</p>
              <p className="mt-2 text-sm text-[var(--text-muted)]">Waiting: <span className="font-semibold text-[var(--text)]">{d.waiting}</span></p>
              <p className="text-sm text-[var(--text-muted)]">Serving: <span className="font-semibold text-[var(--text)]">{d.serving}</span></p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
