import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import {
  Mic,
  WifiOff,
  Languages,
  Clock,
  Users,
  ShieldCheck,
  ArrowRight,
  Smartphone,
  CheckCircle2,
  Building2,
} from 'lucide-react';
import { WerfaMark } from '../components/Logo';

function LandingPage() {
  const { t } = useTranslation();

  const steps = [
    {
      num: '01',
      title: t('landing.howItWorks.step1Title'),
      desc: t('landing.howItWorks.step1Desc'),
      icon: Building2,
    },
    {
      num: '02',
      title: t('landing.howItWorks.step2Title'),
      desc: t('landing.howItWorks.step2Desc'),
      icon: Smartphone,
    },
    {
      num: '03',
      title: t('landing.howItWorks.step3Title'),
      desc: t('landing.howItWorks.step3Desc'),
      icon: CheckCircle2,
    },
  ];

  const features = [
    { icon: Mic, title: t('landing.features.voiceTitle'), desc: t('landing.features.voiceDesc') },
    { icon: WifiOff, title: t('landing.features.offlineTitle'), desc: t('landing.features.offlineDesc') },
    { icon: Languages, title: t('landing.features.ethicalTitle'), desc: t('landing.features.ethicalDesc') },
    { icon: ShieldCheck, title: t('landing.features.analyticsTitle'), desc: t('landing.features.analyticsDesc') },
  ];

  const patientBenefits = t('landing.benefits.forPatientsList', { returnObjects: true }) as string[];
  const clinicBenefits = t('landing.benefits.forClinicsList', { returnObjects: true }) as string[];

  return (
    <div className="page-enter">
      <section className="relative overflow-hidden weave-pattern">
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute -top-32 right-0 h-[28rem] w-[28rem] rounded-full opacity-30 blur-3xl" style={{ background: 'radial-gradient(circle, rgba(57,122,104,0.2), transparent 70%)' }} />
          <div className="absolute bottom-0 left-1/3 h-72 w-72 rounded-full opacity-20 blur-3xl" style={{ background: 'radial-gradient(circle, rgba(214,166,90,0.25), transparent 70%)' }} />
        </div>

        <div className="section-container py-16 md:py-24">
          <div className="grid items-center gap-14 lg:grid-cols-2">
            <div className="animate-slide-up">
              <div
                className="mb-6 inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-xs font-medium shadow-soft"
                style={{ borderColor: 'var(--border)', backgroundColor: 'var(--surface)', color: 'var(--primary)' }}
              >
                <span className="h-1.5 w-1.5 rounded-full bg-brand-green animate-soft-pulse" />
                {t('landing.badge')}
              </div>

              <h1 className="font-display text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-[3.4rem] leading-[1.12]" style={{ color: 'var(--text)' }}>
                {t('landing.heroTitle')}
                <br />
                <span style={{ color: 'var(--primary)' }}>{t('landing.heroHighlight')}</span>
              </h1>

              <p className="mt-5 max-w-xl text-lg leading-relaxed text-[var(--text-muted)]">
                {t('landing.heroDescription')}
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
                <Link to="/patient" className="btn-primary text-base px-7 py-3.5">
                  {t('landing.ctaPatient')}
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link to="/login?portal=clinic" className="btn-secondary text-base px-7 py-3.5">
                  {t('landing.ctaClinic')}
                </Link>
              </div>

              <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-[var(--text-muted)]">
                <span className="inline-flex items-center gap-1.5">
                  <Mic className="h-4 w-4 text-brand-green" /> {t('landing.featureVoice')}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <WifiOff className="h-4 w-4 text-brand-green" /> {t('landing.featureOffline')}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Languages className="h-4 w-4 text-brand-green" /> {t('landing.featureLanguages')}
                </span>
              </div>
            </div>

            <div className="relative flex justify-center lg:justify-end animate-scale-in">
              <div className="relative w-full max-w-[320px]">
                <svg className="absolute -left-8 -top-6 h-20 w-20 opacity-40" viewBox="0 0 80 80" fill="none">
                  <path d="M10 50c12-20 36-20 48 0" stroke="#DCA84E" strokeWidth="2" strokeLinecap="round" />
                  <path d="M10 40c16-24 32-24 48 0" stroke="#397C69" strokeWidth="2" strokeLinecap="round" />
                  <path d="M10 30c20-16 28-16 48 0" stroke="#DCA84E" strokeWidth="2" strokeLinecap="round" opacity="0.7" />
                </svg>

                <div
                  className="relative overflow-hidden rounded-3xl border shadow-elevated"
                  style={{ borderColor: 'var(--border)', backgroundColor: 'var(--surface)' }}
                >
                  <div className="h-1.5 bg-gradient-to-r from-brand-charcoal via-brand-green to-brand-gold" />
                  <div className="p-6 sm:p-7">
                    <div className="flex items-center justify-between">
                      <WerfaMark size={28} />
                      <span className="status-waiting text-[10px] font-semibold uppercase tracking-wider">In Queue</span>
                    </div>

                    <div className="mt-6 text-center">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--text-muted)]">
                        Ticket Number
                      </p>
                      <p className="mt-1 font-display text-4xl font-extrabold tracking-tight" style={{ color: 'var(--text)' }}>
                        JUSH-OPD-047
                      </p>
                    </div>

                    <div className="mt-6 grid grid-cols-2 gap-3">
                      <div className="rounded-xl p-3" style={{ backgroundColor: 'color-mix(in srgb, var(--primary) 8%, transparent)' }}>
                        <p className="text-[10px] font-medium text-[var(--text-muted)]">Position</p>
                        <p className="text-2xl font-bold" style={{ color: 'var(--text)' }}>#4</p>
                      </div>
                      <div className="rounded-xl p-3" style={{ backgroundColor: 'color-mix(in srgb, var(--highlight) 12%, transparent)' }}>
                        <p className="text-[10px] font-medium text-[var(--text-muted)]">Est. wait</p>
                        <p className="text-2xl font-bold text-brand-green">~18m</p>
                      </div>
                    </div>

                    <div className="mt-5">
                      <div className="mb-1.5 flex justify-between text-[10px] text-[var(--text-muted)]">
                        <span>Progress</span>
                        <span>Almost your turn</span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full" style={{ backgroundColor: 'color-mix(in srgb, var(--primary) 12%, transparent)' }}>
                        <div className="h-full w-2/3 rounded-full bg-gradient-to-r from-brand-green to-brand-gold" />
                      </div>
                    </div>

                    <p className="mt-4 text-center text-[11px] text-[var(--text-muted)]">
                      Currently serving · JUSH-OPD-043
                    </p>
                  </div>
                </div>

                <div
                  className="absolute -right-2 top-10 rounded-xl border px-3 py-2 shadow-card animate-slide-up"
                  style={{ borderColor: 'var(--border)', backgroundColor: 'var(--surface)' }}
                >
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ backgroundColor: 'color-mix(in srgb, var(--highlight) 18%, transparent)' }}>
                      <Clock className="h-4 w-4 text-brand-gold" />
                    </div>
                    <div>
                      <p className="text-[10px] text-[var(--text-muted)]">Avg. wait reduced</p>
                      <p className="text-sm font-bold" style={{ color: 'var(--text)' }}>−62%</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-y py-16" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--surface)' }}>
        <div className="section-container">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-semibold uppercase tracking-wider text-brand-green">
              {t('landing.howItWorks.tag')}
            </p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight" style={{ color: 'var(--text)' }}>
              {t('landing.howItWorks.title')}
            </h2>
          </div>

          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {steps.map((step) => (
              <div
                key={step.num}
                className="relative rounded-2xl border p-6 transition hover:shadow-card"
                style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg)' }}
              >
                <div className="mb-4 flex items-center justify-between">
                  <span className="text-3xl font-extrabold opacity-15" style={{ color: 'var(--primary)' }}>
                    {step.num}
                  </span>
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ backgroundColor: 'color-mix(in srgb, var(--primary) 12%, transparent)' }}>
                    <step.icon className="h-5 w-5 text-brand-green" />
                  </div>
                </div>
                <h3 className="text-lg font-semibold" style={{ color: 'var(--text)' }}>{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-[var(--text-muted)]">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="section-container">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-semibold uppercase tracking-wider text-brand-green">
              {t('landing.features.tag')}
            </p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight" style={{ color: 'var(--text)' }}>
              {t('landing.features.title')}
            </h2>
          </div>

          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((f) => (
              <div key={f.title} className="card p-5 transition hover:-translate-y-0.5 hover:shadow-elevated">
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl" style={{ backgroundColor: 'color-mix(in srgb, var(--primary) 12%, transparent)' }}>
                  <f.icon className="h-5 w-5 text-brand-green" />
                </div>
                <h3 className="font-semibold" style={{ color: 'var(--text)' }}>{f.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-[var(--text-muted)]">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16" style={{ backgroundColor: '#172B2B', color: '#F5F0E5' }}>
        <div className="section-container">
          <div className="grid gap-12 md:grid-cols-2">
            <div>
              <div className="mb-4 flex items-center gap-2">
                <Users className="h-5 w-5 text-brand-gold" />
                <h3 className="text-xl font-bold">{t('landing.benefits.forPatients')}</h3>
              </div>
              <ul className="space-y-3">
                {Array.isArray(patientBenefits) &&
                  patientBenefits.map((item) => (
                    <li key={item} className="flex gap-3 text-sm text-white/85">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-brand-gold" />
                      <span>{item}</span>
                    </li>
                  ))}
              </ul>
            </div>
            <div>
              <div className="mb-4 flex items-center gap-2">
                <Building2 className="h-5 w-5 text-brand-gold" />
                <h3 className="text-xl font-bold">{t('landing.benefits.forClinics')}</h3>
              </div>
              <ul className="space-y-3">
                {Array.isArray(clinicBenefits) &&
                  clinicBenefits.map((item) => (
                    <li key={item} className="flex gap-3 text-sm text-white/85">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-brand-gold" />
                      <span>{item}</span>
                    </li>
                  ))}
              </ul>
            </div>
          </div>

          <div className="mt-12 flex flex-col items-center gap-4 text-center">
            <Link to="/patient" className="btn-primary px-8 py-3.5 text-base">
              {t('landing.ctaPatient')}
              <ArrowRight className="h-4 w-4" />
            </Link>
            <p className="text-xs text-white/50">{t('landing.venueBadge')}</p>
          </div>
        </div>
      </section>
    </div>
  );
}

export default LandingPage;
