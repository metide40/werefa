import { useContext, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Play,
  Users,
  Building2,
  WifiOff,
  BarChart3,
  RotateCcw,
  ChevronRight,
  CheckCircle2,
} from 'lucide-react';
import { AppContext } from '../context/AppContext';

const STEPS = [
  {
    id: 1,
    title: 'Start demonstration',
    description: 'Werfa is a multilingual clinic queue platform for Ethiopia.',
    route: '/',
    tip: 'Open the landing page and switch language to Afaan Oromoo.',
  },
  {
    id: 2,
    title: 'Patient joins in Afaan Oromoo',
    description: 'Patient selects a clinic and department, then joins the queue.',
    route: '/patient',
    tip: 'Use the form path for a reliable live demo. Note the ticket number.',
  },
  {
    id: 3,
    title: 'Clinic sees the same ticket',
    description: 'Staff open the clinic console and find the patient in the waiting list.',
    route: '/clinic',
    tip: 'Enable VITE_DEMO_AUTO_LOGIN=true for automatic staff session, or log in as clinic_staff.',
  },
  {
    id: 4,
    title: 'Call next patient',
    description: 'Staff call the next patient. Priority: Emergency → Urgent → Normal, then FIFO.',
    route: '/clinic',
    tip: 'Use Call Next. The patient ticket status becomes Called.',
  },
  {
    id: 5,
    title: 'Complete consultation',
    description: 'Staff mark the visit complete. Statistics update from real ticket records.',
    route: '/clinic',
    tip: 'Mark Complete on the serving patient card.',
  },
  {
    id: 6,
    title: 'Offline registration',
    description: 'Simulate offline, submit a join request, then restore connection to sync.',
    route: '/patient',
    tip: 'Toggle connection to Offline in the patient or connection banner, join, then go Online.',
  },
  {
    id: 7,
    title: 'Analytics overview',
    description: 'Review waiting, serving, and completed counts from demo data.',
    route: '/admin',
    tip: 'Figures are labeled as demonstration data from the local database.',
  },
];

function PitchDemo() {
  const { i18n } = useTranslation();
  const ctx = useContext(AppContext);
  const [step, setStep] = useState(0);
  const current = STEPS[step];

  const resetDemo = () => {
    localStorage.removeItem('werfa_tickets');
    localStorage.removeItem('werfa_notifications');
    localStorage.removeItem('werfa_pending_joins');
    setStep(0);
    window.location.href = '/pitch';
  };

  return (
    <div className="section-container py-8 page-enter">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-brand-green">
            Guided pitch mode
          </p>
          <h1 className="text-2xl font-bold text-brand-forest">Werfa live demonstration</h1>
          <p className="mt-1 text-sm text-brand-muted">
            Walk through patient join → clinic call → complete → offline sync.
          </p>
        </div>
        <button type="button" className="btn-ghost text-sm" onClick={resetDemo}>
          <RotateCcw className="h-4 w-4" />
          Reset demo
        </button>
      </div>

      <div className="grid gap-6 lg:grid-cols-12">
        <aside className="card p-4 lg:col-span-4">
          <ol className="space-y-1">
            {STEPS.map((s, i) => (
              <li key={s.id}>
                <button
                  type="button"
                  onClick={() => setStep(i)}
                  className={`flex w-full items-start gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition ${
                    i === step
                      ? 'bg-brand-charcoal text-white'
                      : 'text-brand-muted hover:bg-brand-ivory'
                  }`}
                >
                  <span
                    className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                      i === step ? 'bg-brand-gold text-brand-charcoal' : 'bg-brand-lightTeal text-brand-green'
                    }`}
                  >
                    {i < step ? <CheckCircle2 className="h-4 w-4" /> : s.id}
                  </span>
                  <span className="font-medium leading-snug">{s.title}</span>
                </button>
              </li>
            ))}
          </ol>
        </aside>

        <div className="card p-6 lg:col-span-8">
          <div className="mb-4 flex items-center gap-2 text-brand-green">
            {step === 0 && <Play className="h-5 w-5" />}
            {step === 1 && <Users className="h-5 w-5" />}
            {step >= 2 && step <= 4 && <Building2 className="h-5 w-5" />}
            {step === 5 && <WifiOff className="h-5 w-5" />}
            {step === 6 && <BarChart3 className="h-5 w-5" />}
            <h2 className="text-lg font-bold text-brand-forest">{current.title}</h2>
          </div>
          <p className="text-sm leading-relaxed text-brand-text">{current.description}</p>
          <div className="mt-4 rounded-xl border border-brand-border bg-brand-ivory/60 p-4 text-sm text-brand-muted">
            <p className="font-semibold text-brand-forest">Presenter tip</p>
            <p className="mt-1">{current.tip}</p>
          </div>

          <div className="mt-6 flex flex-wrap gap-2">
            <Link to={current.route} className="btn-primary">
              Open this step
              <ChevronRight className="h-4 w-4" />
            </Link>
            {step > 0 && (
              <button type="button" className="btn-ghost" onClick={() => setStep(step - 1)}>
                Previous
              </button>
            )}
            {step < STEPS.length - 1 && (
              <button type="button" className="btn-secondary" onClick={() => setStep(step + 1)}>
                Next step
              </button>
            )}
            <button
              type="button"
              className="btn-ghost"
              onClick={() => i18n.changeLanguage('om')}
            >
              Set language: Afaan Oromoo
            </button>
          </div>

          {ctx?.pendingJoins && ctx.pendingJoins.length > 0 && (
            <p className="mt-4 text-xs text-brand-amber">
              {ctx.pendingJoins.length} offline request(s) waiting to synchronize.
            </p>
          )}
          {ctx?.lastApiError && (
            <p className="mt-2 text-xs text-red-600">API: {ctx.lastApiError}</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default PitchDemo;
