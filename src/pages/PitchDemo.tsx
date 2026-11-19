import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Presentation, ArrowRight, Users, Building2, Mic } from 'lucide-react';

function PitchDemo() {
  const { t } = useTranslation();

  const steps = [
    {
      title: 'Patient Experience',
      desc: 'Join a queue from your phone, track position, and receive clear status updates.',
      to: '/patient',
      icon: Users,
    },
    {
      title: 'Clinic Dashboard',
      desc: 'Live queue management, call next patient, and department overview for staff.',
      to: '/clinic',
      icon: Building2,
    },
    {
      title: 'Landing & Story',
      desc: 'Product narrative, benefits, and multilingual positioning for stakeholders.',
      to: '/',
      icon: Presentation,
    },
  ];

  return (
    <div className="section-container py-12 page-enter">
      <div className="mx-auto max-w-2xl text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-forest text-white">
          <Presentation className="h-7 w-7" />
        </div>
        <h1 className="text-3xl font-bold text-brand-forest">Pitch Presentation Mode</h1>
        <p className="mt-2 text-brand-muted">
          {t('brand.pitchVenue') || 'Guided walkthrough of the Werfa experience'}
        </p>
        <p className="mt-1 text-xs text-brand-muted">{t('brand.simulatedNotice')}</p>
      </div>

      <div className="mt-10 grid gap-4 sm:grid-cols-3">
        {steps.map((s) => (
          <Link
            key={s.to}
            to={s.to}
            className="card group flex flex-col p-6 transition hover:-translate-y-0.5 hover:shadow-elevated"
          >
            <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-brand-lightTeal text-brand-green">
              <s.icon className="h-5 w-5" />
            </div>
            <h3 className="font-semibold text-brand-forest">{s.title}</h3>
            <p className="mt-1.5 flex-1 text-sm text-brand-muted">{s.desc}</p>
            <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-brand-green group-hover:gap-2 transition-all">
              Open <ArrowRight className="h-4 w-4" />
            </span>
          </Link>
        ))}
      </div>

      <div className="mt-10 rounded-2xl border border-brand-amber/30 bg-brand-amber/5 p-6 text-center">
        <Mic className="mx-auto h-6 w-6 text-brand-amber" />
        <p className="mt-2 text-sm font-medium text-brand-forest">
          Voice registration, offline sync, and live multi-device updates are simulated for this demo.
        </p>
      </div>
    </div>
  );
}

export default PitchDemo;
