import type { FormEvent } from 'react';
import { useMemo, useState } from 'react';
import { useNavigate, useSearchParams, useOutletContext } from 'react-router-dom';
import type { AuthUser } from '../../api/client';
import { submitTriageAssessment } from '../../api/client';

export default function TriageAssessPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const ctx = useOutletContext<{ user: AuthUser | null } | null>();
  const nurse = ctx?.user ?? null;
  const initial = useMemo(
    () => ({
      patient_id: params.get('patient') || '',
      patient_name: params.get('name') || '',
      queue_ticket_id: params.get('ticket') || '',
      department_id: params.get('dept') || '',
    }),
    [params]
  );

  const [patientName, setPatientName] = useState(initial.patient_name);
  const [complaint, setComplaint] = useState('');
  const [notes, setNotes] = useState('');
  const [priority, setPriority] = useState<'NORMAL' | 'URGENT' | 'EMERGENCY'>('NORMAL');
  const [confirm, setConfirm] = useState(false);
  const [bp, setBp] = useState('');
  const [hr, setHr] = useState('');
  const [temp, setTemp] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);
  const [saving, setSaving] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setResult(null);
    if (!confirm) {
      setError('Confirm the selected priority before submitting.');
      return;
    }
    setSaving(true);
    try {
      const body: Record<string, unknown> = {
        presenting_complaint: complaint,
        assessment_notes: notes,
        priority,
        confirm_priority: true,
        vital_signs: { blood_pressure: bp, heart_rate: hr, temperature: temp },
        client_request_id: crypto.randomUUID(),
      };
      if (initial.patient_id) body.patient_id = Number(initial.patient_id);
      else body.patient_name = patientName;
      if (initial.queue_ticket_id) body.queue_ticket_id = Number(initial.queue_ticket_id);
      if (initial.department_id) body.department_id = Number(initial.department_id);
      const res = await submitTriageAssessment(body);
      setResult(res);
      if (res?.emergency) {
        // stay to show emergency confirmation
      }
    } catch (err: any) {
      setError(err?.message || 'Assessment failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-xl space-y-4">
      <div>
        <h2 className="text-lg font-bold" style={{ color: 'var(--text)' }}>Patient assessment</h2>
        <p className="text-xs text-[var(--text-muted)]">
          Clinical priority is set by authorized triage staff only — not by patients.
        </p>
        <p className="mt-1 text-xs font-medium text-brand-green">
          Clinic: {nurse?.staff_clinic_name || 'Not assigned — re-seed demo data or ask admin'}
        </p>
      </div>
      <form onSubmit={onSubmit} className="card space-y-3 p-4">
        <div>
          <label className="mb-1 block text-xs font-semibold uppercase text-[var(--text-muted)]">Patient name</label>
          <input className="input-field" required value={patientName} onChange={(e) => setPatientName(e.target.value)} disabled={!!initial.patient_id} />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold uppercase text-[var(--text-muted)]">Presenting complaint</label>
          <textarea className="input-field min-h-[80px]" required value={complaint} onChange={(e) => setComplaint(e.target.value)} />
        </div>
        <div className="grid grid-cols-3 gap-2">
          <input className="input-field" placeholder="BP" value={bp} onChange={(e) => setBp(e.target.value)} />
          <input className="input-field" placeholder="HR" value={hr} onChange={(e) => setHr(e.target.value)} />
          <input className="input-field" placeholder="Temp" value={temp} onChange={(e) => setTemp(e.target.value)} />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold uppercase text-[var(--text-muted)]">Notes</label>
          <textarea className="input-field min-h-[60px]" value={notes} onChange={(e) => setNotes(e.target.value)} />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold uppercase text-[var(--text-muted)]">Priority</label>
          <div className="grid grid-cols-3 gap-2">
            {([
              ['EMERGENCY', 'Emergency', 'bg-red-600 text-white'],
              ['URGENT', 'Urgent', 'bg-orange-500 text-white'],
              ['NORMAL', 'Normal', 'bg-emerald-600 text-white'],
            ] as const).map(([val, label, cls]) => (
              <button
                key={val}
                type="button"
                onClick={() => { setPriority(val); setConfirm(false); }}
                className={`rounded-xl px-3 py-2 text-sm font-semibold ${priority === val ? cls : 'bg-brand-ivory text-[var(--text)]'}`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
        <label className="flex items-start gap-2 text-sm">
          <input type="checkbox" checked={confirm} onChange={(e) => setConfirm(e.target.checked)} className="mt-1" />
          <span>I confirm priority <strong>{priority}</strong> based on clinical assessment (not patient self-selection).</span>
        </label>
        {error && <p className="text-sm text-red-600">{error}</p>}
        {result && (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
            Assessment saved.
            {result.emergency && (
              <p className="mt-1 font-semibold text-red-700">
                Emergency activated: {result.emergency.case_id}
              </p>
            )}
          </div>
        )}
        <div className="flex gap-2">
          <button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Submitting…' : 'Submit assessment'}</button>
          <button type="button" className="btn-ghost" onClick={() => navigate('/triage/pending')}>Back</button>
        </div>
      </form>
    </div>
  );
}
