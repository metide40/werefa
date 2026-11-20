import type { FormEvent } from 'react';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams, useOutletContext } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { AuthUser } from '../../api/client';
import { submitTriageAssessment } from '../../api/client';
import {
  savePendingAssessment,
  listPendingAssessments,
  syncPendingAssessments,
  type PendingAssessment,
} from '../../lib/offlineTriage';

export default function TriageAssessPage() {
  const { t } = useTranslation();
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
  const [pending, setPending] = useState<PendingAssessment[]>([]);
  const [syncMsg, setSyncMsg] = useState<string | null>(null);

  const refreshPending = async () => {
    try {
      setPending(await listPendingAssessments());
    } catch {
      /* ignore */
    }
  };

  useEffect(() => {
    refreshPending();
  }, []);

  const buildBody = (): Record<string, unknown> => {
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
    return body;
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setResult(null);
    setSyncMsg(null);
    if (!confirm) {
      setError(t('triage.errors.confirmRequired'));
      return;
    }
    if (!complaint.trim()) {
      setError(t('triage.errors.complaintRequired'));
      return;
    }
    setSaving(true);
    const body = buildBody();
    try {
      if (!navigator.onLine) {
        await savePendingAssessment(body);
        await refreshPending();
        setResult({ offline: true });
        setSyncMsg(t('triage.offlinePending'));
        return;
      }
      const res = await submitTriageAssessment(body);
      setResult(res);
      await syncPendingAssessments(submitTriageAssessment);
      await refreshPending();
    } catch (err: any) {
      if (!navigator.onLine || String(err?.message || '').toLowerCase().includes('network')) {
        try {
          await savePendingAssessment(body);
          await refreshPending();
          setResult({ offline: true });
          setSyncMsg(t('triage.offlineNetworkFallback'));
          return;
        } catch {
          /* fall through */
        }
      }
      setError(err?.message || t('triage.errors.submitFailed'));
    } finally {
      setSaving(false);
    }
  };

  const manualSync = async () => {
    setSyncMsg(null);
    if (!navigator.onLine) {
      setSyncMsg(t('triage.stillOffline'));
      return;
    }
    const r = await syncPendingAssessments(submitTriageAssessment);
    await refreshPending();
    if (r.synced > 0 && r.failed === 0) setSyncMsg(t('triage.syncSuccess', { count: r.synced }));
    else if (r.failed > 0) setSyncMsg(t('triage.syncPartial', { synced: r.synced, failed: r.failed }));
    else setSyncMsg(t('triage.syncNone'));
  };

  return (
    <div className="mx-auto max-w-xl space-y-4">
      <div>
        <h2 className="text-lg font-bold" style={{ color: 'var(--text)' }}>{t('triage.assess')}</h2>
        <p className="text-xs text-[var(--text-muted)]">{t('triage.assessHelp')}</p>
        <p className="mt-1 text-xs font-medium text-brand-green">
          {t('triage.clinicLabel')}: {nurse?.staff_clinic_name || t('triage.clinicUnassigned')}
        </p>
      </div>

      {pending.length > 0 && (
        <div className="rounded-xl border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-900">
          <p className="font-semibold">{t('triage.pendingLocalTitle')}</p>
          <ul className="mt-1 space-y-1 text-xs">
            {pending.map((p) => (
              <li key={p.client_request_id}>
                {p.status} · {new Date(p.created_at).toLocaleString()}
                {p.last_error ? ` — ${p.last_error}` : ''}
              </li>
            ))}
          </ul>
          <button type="button" className="btn-secondary mt-2 text-xs" onClick={manualSync}>
            {t('triage.syncNow')}
          </button>
          <p className="mt-1 text-[11px]">{t('triage.offlineNoRemoteNotify')}</p>
        </div>
      )}

      <form onSubmit={onSubmit} className="card space-y-3 p-4">
        <div>
          <label className="mb-1 block text-xs font-semibold uppercase text-[var(--text-muted)]">{t('triage.patientName')}</label>
          <input className="input-field" required value={patientName} onChange={(e) => setPatientName(e.target.value)} disabled={!!initial.patient_id} />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold uppercase text-[var(--text-muted)]">{t('triage.presentingComplaint')}</label>
          <textarea className="input-field min-h-[80px]" required value={complaint} onChange={(e) => setComplaint(e.target.value)} />
        </div>
        <div className="grid grid-cols-3 gap-2">
          <input className="input-field" placeholder={t('triage.vitals.bp')} value={bp} onChange={(e) => setBp(e.target.value)} />
          <input className="input-field" placeholder={t('triage.vitals.hr')} value={hr} onChange={(e) => setHr(e.target.value)} />
          <input className="input-field" placeholder={t('triage.vitals.temp')} value={temp} onChange={(e) => setTemp(e.target.value)} />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold uppercase text-[var(--text-muted)]">{t('triage.notes')}</label>
          <textarea className="input-field min-h-[60px]" value={notes} onChange={(e) => setNotes(e.target.value)} />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold uppercase text-[var(--text-muted)]">{t('triage.priority')}</label>
          <div className="grid grid-cols-3 gap-2">
            {([
              ['EMERGENCY', 'triage.emergency', 'bg-red-600 text-white'],
              ['URGENT', 'triage.urgent', 'bg-orange-500 text-white'],
              ['NORMAL', 'triage.normal', 'bg-emerald-600 text-white'],
            ] as const).map(([val, key, cls]) => (
              <button
                key={val}
                type="button"
                onClick={() => { setPriority(val); setConfirm(false); }}
                className={`rounded-xl px-3 py-2 text-sm font-semibold ${priority === val ? cls : 'bg-brand-ivory text-[var(--text)]'}`}
              >
                {t(key)}
              </button>
            ))}
          </div>
        </div>
        <label className="flex items-start gap-2 text-sm">
          <input type="checkbox" checked={confirm} onChange={(e) => setConfirm(e.target.checked)} className="mt-1" />
          <span>{t('triage.confirmPriority')} <strong>{priority}</strong></span>
        </label>
        {error && <p className="text-sm text-red-600">{error}</p>}
        {syncMsg && <p className="text-sm text-amber-800">{syncMsg}</p>}
        {result && !result.offline && (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
            {t('triage.serverSaved')}
            {result.emergency && (
              <p className="mt-1 font-semibold text-red-700">
                {t('triage.emergencyActivated')}: {result.emergency.case_id}
              </p>
            )}
          </div>
        )}
        {result?.offline && (
          <div className="rounded-xl border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-900">
            {t('triage.localRecorded')}
          </div>
        )}
        <div className="flex gap-2">
          <button type="submit" className="btn-primary" disabled={saving}>
            {saving ? t('triage.submitting') : t('triage.submitAssessment')}
          </button>
          <button type="button" className="btn-ghost" onClick={() => navigate('/triage/pending')}>{t('triage.back')}</button>
        </div>
      </form>
    </div>
  );
}
