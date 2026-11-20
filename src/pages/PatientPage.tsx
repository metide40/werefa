import { useContext, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import {
  Building2,
  ChevronRight,
  Mic,
  FileText,
  MapPin,
  Phone,
  Clock,
  Users,
  CheckCircle2,
  ArrowLeft,
  QrCode,
} from 'lucide-react';
import { AppContext } from '../context/AppContext';
import type { Clinic, QueueTicket } from '../types';
import { INITIAL_CLINICS } from '../data/demoData';
import { fetchClinics } from '../api/client';
import { getSpeechSupport, startListening } from '../lib/speech';
import type { PendingJoin } from '../lib/offlineStore';

function PatientPage() {
  const { t, i18n } = useTranslation();
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('PatientPage must be rendered within AppProvider');
  }
  const {
    clinics: localClinics,
    tickets,
    connectionState,
    joinQueueOnline,
    joinQueueOffline,
    pendingJoins,
    syncPendingJoins,
    lastApiError,
  } = context;

  const [apiClinics, setApiClinics] = useState<Clinic[] | null>(null);
  const [clinicsLoading, setClinicsLoading] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'clinic' | 'method' | 'form' | 'ticket'>('clinic');
  const [selectedClinicId, setSelectedClinicId] = useState<string>('');
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    departmentId: '',
    reason: '',
  });
  const [showVoiceDemo, setShowVoiceDemo] = useState(false);
  const [lastTicket, setLastTicket] = useState<QueueTicket | null>(null);

  // Prefer API clinics; fall back to local demo data
  const clinics =
    apiClinics && apiClinics.length > 0
      ? apiClinics
      : localClinics && localClinics.length > 0
        ? localClinics
        : INITIAL_CLINICS;
  const selectedClinic = clinics.find((c) => String(c.id) === String(selectedClinicId));

  useEffect(() => {
    let cancelled = false;
    setClinicsLoading(true);
    fetchClinics()
      .then((data) => {
        if (cancelled) return;
        // Normalize API shape to frontend Clinic type
        const mapped: Clinic[] = data.map((c: any) => ({
          id: String(c.id),
          name: c.name,
          nameAm: c.nameAm || c.name_am || '',
          nameOm: c.nameOm || c.name_om || '',
          city: c.city,
          region: c.region,
          location: c.location || '',
          phone: c.phone || '',
          type: c.type || c.clinic_type || 'Primary Hospital',
          departments: (c.departments || []).map((d: any) => ({
            id: String(d.id),
            name: d.name,
            nameAm: d.name_am || d.nameAm || '',
            nameOm: d.name_om || d.nameOm || '',
            code: d.code,
            roomNumber: d.room_number || d.roomNumber || '',
            currentServingNumber: d.current_serving_number || null,
            waitingCount: d.waiting_count ?? 0,
            avgWaitMins: d.avg_wait_mins ?? 12,
            iconName: d.icon_name || 'Stethoscope',
          })),
          activeDoctors: c.activeDoctors ?? c.active_doctors ?? 0,
          subscriptionStatus: c.subscriptionStatus || c.subscription_status || 'active',
          isPartner: c.isPartner ?? c.is_partner ?? true,
        }));
        setApiClinics(mapped);
        setApiError(null);
      })
      .catch((err) => {
        if (!cancelled) setApiError(err.message || 'API unavailable — using local demo data');
      })
      .finally(() => {
        if (!cancelled) setClinicsLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  const getLocalizedName = (item: { name: string; nameAm?: string; nameOm?: string }) => {
    if (i18n.language === 'am' && item.nameAm) return item.nameAm;
    if (i18n.language === 'om' && item.nameOm) return item.nameOm;
    return item.name;
  };

  const [pendingLocal, setPendingLocal] = useState<PendingJoin | null>(null);
  const [listening, setListening] = useState(false);
  const [speechError, setSpeechError] = useState<string | null>(null);
  const [speechSimulated, setSpeechSimulated] = useState(false);

  const handleJoin = async () => {
    if (!selectedClinic || !formData.name || !formData.departmentId) return;
    setLoading(true);
    setApiError(null);
    setPendingLocal(null);
    const dept = selectedClinic.departments.find((d) => String(d.id) === String(formData.departmentId));
    const payload = {
      clinicId: String(selectedClinic.id),
      clinicName: selectedClinic.name,
      departmentId: String(formData.departmentId),
      departmentName: dept?.name || '',
      fullName: formData.name,
      phoneNumber: formData.phone,
      notes: formData.reason,
      preferredLanguage: i18n.language,
    };
    try {
      if (connectionState === 'OFFLINE' || !navigator.onLine) {
        const pending = await joinQueueOffline(payload);
        setPendingLocal(pending);
        setStep('ticket');
      } else {
        const ticket = await joinQueueOnline(payload);
        setLastTicket(ticket);
        setStep('ticket');
      }
    } catch (err: any) {
      setApiError(err?.message || 'Could not join the queue. Please try again.');
      setLastTicket(null);
    } finally {
      setLoading(false);
    }
  };

  const startVoice = () => {
    setSpeechError(null);
    const support = getSpeechSupport();
    if (!support.supported) {
      setSpeechSimulated(true);
      setSpeechError(support.reason || 'Speech recognition unsupported');
      setShowVoiceDemo(true);
      return;
    }
    setSpeechSimulated(false);
    setListening(true);
    startListening(
      (i18n.language as 'en' | 'am' | 'om') || 'en',
      (result) => {
        // Fill name field with recognized text for patient to confirm
        setFormData((f) => ({ ...f, name: result.transcript || f.name }));
      },
      (msg) => setSpeechError(msg),
      () => setListening(false)
    );
  };

  const myTicket = lastTicket
    ? tickets.find((t) => t.id === lastTicket.id) || lastTicket
    : null;

  const renderClinicSelection = () => (
    <div className="animate-slide-up space-y-6">
      <div>
        <p className="text-sm font-medium text-brand-green">{t('patient.step1')}</p>
        <h1 className="mt-1 text-2xl font-bold text-brand-forest sm:text-3xl">
          {t('patient.chooseClinic')}
        </h1>
        <p className="mt-1 text-sm text-brand-muted">{t('patient.welcome')}</p>
      </div>

      {clinicsLoading && clinics.length === 0 && (
        <p className="text-sm text-brand-muted">Loading clinics…</p>
      )}
      {apiError && (
        <p className="mb-3 rounded-xl border border-brand-amber/40 bg-brand-amber/10 px-3 py-2 text-xs text-brand-forest">
          {apiError}
        </p>
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        {clinics.map((clinic) => (
          <button
            key={clinic.id}
            type="button"
            onClick={() => {
              setSelectedClinicId(clinic.id);
              setStep('method');
            }}
            className={`group relative rounded-2xl border p-5 text-left transition-all ${
              selectedClinicId === clinic.id
                ? 'border-brand-green bg-brand-lightTeal/40 shadow-card ring-2 ring-brand-green/30'
                : 'border-brand-border bg-brand-card hover:border-brand-green/40 hover:shadow-card'
            }`}
          >
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-forest/5 text-brand-forest group-hover:bg-brand-green/10">
                <Building2 className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="font-semibold text-brand-forest leading-snug">
                  {getLocalizedName(clinic)}
                </h3>
                <p className="mt-0.5 flex items-center gap-1 text-xs text-brand-muted">
                  <MapPin className="h-3 w-3" />
                  {clinic.city}, {clinic.region}
                </p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  <span className="rounded-md bg-brand-lightTeal px-2 py-0.5 text-[10px] font-medium text-brand-green">
                    {clinic.type}
                  </span>
                  <span className="rounded-md bg-brand-ivory px-2 py-0.5 text-[10px] font-medium text-brand-muted">
                    {clinic.departments.length} depts
                  </span>
                </div>
              </div>
              <ChevronRight className="h-5 w-5 shrink-0 text-brand-muted transition group-hover:text-brand-green group-hover:translate-x-0.5" />
            </div>
          </button>
        ))}
      </div>
    </div>
  );

  const renderMethod = () => (
    <div className="animate-slide-up mx-auto max-w-lg space-y-6">
      <button type="button" onClick={() => setStep('clinic')} className="btn-ghost -ml-2">
        <ArrowLeft className="h-4 w-4" />
        Back
      </button>

      <div>
        <p className="text-sm font-medium text-brand-green">{t('patient.step2')}</p>
        <h1 className="mt-1 text-2xl font-bold text-brand-forest">
          {t('patient.joinMethodTitle')}
        </h1>
        <p className="mt-1 text-sm text-brand-muted">
          {selectedClinic && getLocalizedName(selectedClinic)}
        </p>
      </div>

      <div className="space-y-3">
        <button
          type="button"
          onClick={() => { setShowVoiceDemo(true); startVoice(); }}
          className="group w-full rounded-2xl border-2 border-dashed border-brand-amber/50 bg-gradient-to-br from-brand-amber/5 to-brand-amber/10 p-5 text-left transition hover:border-brand-amber hover:shadow-amber"
        >
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand-amber/20 text-brand-amber">
              <Mic className="h-6 w-6" />
            </div>
            <div>
              <h3 className="font-semibold text-brand-forest">{t('patient.joinVoice')}</h3>
              <p className="mt-1 text-sm text-brand-muted">
                Speak in Amharic, Afaan Oromoo, or English. Demo simulation available.
              </p>
              <span className="mt-2 inline-block rounded-full bg-brand-amber/15 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-brand-amber">
                Coming soon · Demo
              </span>
            </div>
          </div>
        </button>

        <button
          type="button"
          onClick={() => setStep('form')}
          className="group w-full rounded-2xl border border-brand-border bg-brand-card p-5 text-left transition hover:border-brand-green hover:shadow-card"
        >
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand-green/10 text-brand-green">
              <FileText className="h-6 w-6" />
            </div>
            <div>
              <h3 className="font-semibold text-brand-forest">{t('patient.joinForm')}</h3>
              <p className="mt-1 text-sm text-brand-muted">
                Enter your details manually and join the queue.
              </p>
            </div>
            <ChevronRight className="ml-auto h-5 w-5 text-brand-muted group-hover:text-brand-green" />
          </div>
        </button>
      </div>

      {showVoiceDemo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-brand-charcoal/40 p-4 backdrop-blur-sm">
          <div className="card w-full max-w-md animate-scale-in p-6">
            <h3 className="text-lg font-bold text-brand-forest">{t('patient.voice.modalTitle')}</h3>
            {speechSimulated ? (
              <p className="mt-2 text-sm text-brand-amber">
                Simulation mode — speech recognition is not available in this browser.
              </p>
            ) : listening ? (
              <p className="mt-2 text-sm font-medium text-brand-green">Listening… speak now.</p>
            ) : (
              <p className="mt-2 text-sm text-brand-muted">{t('patient.voice.simulatedNotice')}</p>
            )}
            {speechError && (
              <p className="mt-2 text-sm text-red-600">{speechError}</p>
            )}
            <div className="mt-4 rounded-xl bg-brand-ivory p-4 text-sm text-brand-text">
              <p className="mb-1 text-xs font-medium text-brand-muted">
                {formData.name ? 'Recognized / entered name' : 'Sample (Afaan Oromoo)'}
              </p>
              <p className="italic">{formData.name || t('patient.voice.sampleOromo')}</p>
            </div>
            <div className="mt-6 flex gap-3">
              <button
                type="button"
                className="btn-secondary flex-1"
                onClick={() => {
                  setShowVoiceDemo(false);
                  setSpeechError(null);
                }}
              >
                {t('patient.voice.tryAgain')}
              </button>
              <button
                type="button"
                className="btn-primary flex-1"
                onClick={() => {
                  setShowVoiceDemo(false);
                  if (!formData.name) {
                    setFormData({
                      name: 'Tolosa Gemeda',
                      phone: formData.phone || '+251 91 234 5678',
                      departmentId: formData.departmentId || selectedClinic?.departments[0]?.id || '',
                      reason: formData.reason || 'Headache / mataa bowwuu',
                    });
                  } else if (!formData.departmentId && selectedClinic?.departments[0]) {
                    setFormData((f) => ({
                      ...f,
                      departmentId: selectedClinic.departments[0].id,
                    }));
                  }
                  setStep('form');
                }}
              >
                {t('patient.voice.confirmAndJoin')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderForm = () => (
    <div className="animate-slide-up mx-auto max-w-lg space-y-6">
      <button type="button" onClick={() => setStep('method')} className="btn-ghost -ml-2">
        <ArrowLeft className="h-4 w-4" />
        Back
      </button>

      <div>
        <p className="text-sm font-medium text-brand-green">{t('patient.step2')}</p>
        <h1 className="mt-1 text-2xl font-bold text-brand-forest">{t('patient.title')}</h1>
      </div>

      <div className="card space-y-4 p-5 sm:p-6">
        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-brand-muted">
            {t('patient.fullName')}
          </label>
          <input
            className="input-field"
            placeholder={t('patient.fullNamePlaceholder')}
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          />
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-brand-muted">
            {t('patient.phone')}
          </label>
          <div className="relative">
            <Phone className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-muted" />
            <input
              className="input-field pl-10"
              placeholder={t('patient.phonePlaceholder')}
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-brand-muted">
            {t('patient.department')}
          </label>
          <select
            className="input-field"
            value={formData.departmentId}
            onChange={(e) => setFormData({ ...formData, departmentId: e.target.value })}
          >
            <option value="">{t('patient.selectDepartment')}</option>
            {selectedClinic?.departments.map((d) => (
              <option key={d.id} value={d.id}>
                {getLocalizedName(d)} · {d.waitingCount} waiting
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-brand-muted">
            {t('patient.reason')}
          </label>
          <textarea
            className="input-field min-h-[80px] resize-none"
            placeholder={t('patient.reasonPlaceholder')}
            value={formData.reason}
            onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
          />
        </div>

        <p className="text-xs text-brand-muted">{t('patient.priorityNote')}</p>

        {apiError && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
            {apiError}
          </div>
        )}
        <div className="flex flex-col gap-2 pt-1 sm:flex-row">
          <button
            type="button"
            className="btn-primary flex-1"
            onClick={handleJoin}
            disabled={loading || !formData.name || !formData.departmentId}
          >
            {loading ? (t('patient.joining') || 'Joining...') : t('patient.joinQueueBtn')}
          </button>
          <button type="button" className="btn-secondary" onClick={() => setStep('clinic')}>
            {t('patient.cancelTicket')}
          </button>
        </div>
      </div>
    </div>
  );

  const renderTicket = () => {
    // Offline pending request — not a confirmed server ticket
    if (pendingLocal && !myTicket) {
      return (
        <div className="animate-scale-in mx-auto max-w-md space-y-6">
          <div className="text-center">
            <p className="text-sm font-medium text-brand-amber">
              {t('patient.ticket.pendingSync') || 'Pending synchronization'}
            </p>
            <h1 className="mt-1 text-xl font-bold text-brand-forest">
              Request saved offline
            </h1>
            <p className="mt-2 text-sm text-brand-muted">
              No confirmed ticket number yet. When you are back online, Werfa will submit this
              request to the clinic and assign a real queue position.
            </p>
          </div>
          <div className="card space-y-3 p-5">
            <div className="flex justify-between text-sm">
              <span className="text-brand-muted">Name</span>
              <span className="font-medium">{pendingLocal.patientName}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-brand-muted">Clinic</span>
              <span className="font-medium text-right max-w-[60%]">{pendingLocal.clinicName}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-brand-muted">Department</span>
              <span className="font-medium">{pendingLocal.departmentName}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-brand-muted">Local ID</span>
              <span className="font-mono text-xs">{pendingLocal.localId.slice(0, 8)}…</span>
            </div>
          </div>
          <button
            type="button"
            className="btn-primary w-full"
            onClick={() => syncPendingJoins()}
          >
            {t('patient.ticket.trySync') || 'Try synchronize now'}
          </button>
        </div>
      );
    }

    if (!myTicket) return null;

    return (
      <div className="animate-scale-in mx-auto max-w-md space-y-6">
        <div className="text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-brand-green/15">
            <CheckCircle2 className="h-6 w-6 text-brand-green" />
          </div>
          <p className="text-sm font-medium text-brand-green">{t('patient.ticket.badge')}</p>
          <h1 className="mt-1 text-xl font-bold text-brand-forest">You're in the queue</h1>
        </div>

        <div className="relative overflow-hidden rounded-3xl border border-brand-border bg-brand-card shadow-elevated">
          <div className="h-1.5 bg-gradient-to-r from-brand-forest via-brand-green to-brand-amber" />
          <div className="p-6 sm:p-8">
            <div className="text-center">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-brand-muted">
                {t('patient.ticket.ticketNo')}
              </p>
              <p className="mt-1 font-display text-4xl font-extrabold tracking-tight text-brand-forest sm:text-5xl">
                {myTicket.ticketNumber}
              </p>
            </div>
            <div className="mt-4 flex justify-center">
              <span className="status-waiting px-3 py-1 text-xs font-semibold">
                {t(`status.${myTicket.status}`)}
              </span>
            </div>
            <div className="my-6 border-t border-dashed border-brand-border" />
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-xl bg-brand-ivory p-3.5">
                <div className="flex items-center gap-1.5 text-[11px] font-medium text-brand-muted">
                  <Users className="h-3.5 w-3.5" />
                  {t('patient.ticket.yourPosition')}
                </div>
                <p className="mt-1 text-2xl font-bold text-brand-forest">#{myTicket.position}</p>
              </div>
              <div className="rounded-xl bg-brand-ivory p-3.5">
                <div className="flex items-center gap-1.5 text-[11px] font-medium text-brand-muted">
                  <Clock className="h-3.5 w-3.5" />
                  {t('patient.ticket.estimatedWait')}
                </div>
                <p className="mt-1 text-2xl font-bold text-brand-green">
                  ~{Math.round(myTicket.estimatedWaitMins)} min
                  <span className="mt-1 block text-[10px] font-normal text-[var(--text-muted)]">{t('patient.ticket.etaDisclaimer')}</span>
                  {(myTicket as any).queueInterrupted && (
                    <div className="mt-3 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-left text-xs text-amber-900 dark:bg-amber-950/30 dark:text-amber-100">
                      {(myTicket as any).interruptionMessage || t('patient.ticket.emergencyDelayNotice')}
                    </div>
                  )}
                </p>
              </div>
            </div>
            <div className="mt-4 space-y-2.5 text-sm">
              <div className="flex justify-between">
                <span className="text-brand-muted">Clinic</span>
                <span className="max-w-[60%] text-right font-medium text-brand-text">
                  {myTicket.clinicName}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-brand-muted">Department</span>
                <span className="font-medium text-brand-text">{myTicket.departmentName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-brand-muted">{t('patient.ticket.peopleAhead')}</span>
                <span className="font-medium text-brand-text">{myTicket.peopleAhead}</span>
              </div>
            </div>
            <div className="mt-6 flex flex-col items-center rounded-xl border border-dashed border-brand-border bg-brand-ivory/50 py-5">
              <QrCode className="h-16 w-16 text-brand-forest/30" />
              <p className="mt-2 px-4 text-center text-[11px] text-brand-muted">
                {t('patient.ticket.demoQrNotice')}
              </p>
            </div>
          </div>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Link to="/" className="btn-secondary flex-1 text-center">
            {t('nav.home')}
          </Link>
          <button
            type="button"
            className="btn-ghost flex-1"
            onClick={() => {
              setStep('clinic');
              setSelectedClinicId('');
              setLastTicket(null);
              setPendingLocal(null);
              setFormData({ name: '', phone: '', departmentId: '', reason: '' });
            }}
          >
            Join another queue
          </button>
        </div>
      </div>
    );
  };


  return (
    <div className="section-container min-h-[60vh] py-8">
      {(pendingJoins.length > 0 || lastApiError) && (
        <div className="mb-4 space-y-2">
          {pendingJoins.length > 0 && (
            <p className="rounded-xl border border-brand-amber/40 bg-brand-amber/10 px-3 py-2 text-xs text-brand-forest">
              {pendingJoins.length} offline request(s) pending synchronization.
            </p>
          )}
          {lastApiError && (
            <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
              {lastApiError}
            </p>
          )}
        </div>
      )}
      {step === 'clinic' && renderClinicSelection()}
      {step === 'method' && renderMethod()}
      {step === 'form' && renderForm()}
      {step === 'ticket' && renderTicket()}
    </div>
  );
}

export default PatientPage;
