import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Logo } from './Logo';

function Footer() {
  const { t, i18n } = useTranslation();

  const changeLang = (lng: string) => {
    i18n.changeLanguage(lng);
    localStorage.setItem('werfa_lang', lng);
  };

  return (
    <footer className="mt-auto border-t" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--surface)' }}>
      <div className="section-container py-12">
        <div className="grid gap-10 md:grid-cols-3">
          <div>
            <Logo size={32} />
            <p className="mt-3 max-w-xs text-sm leading-relaxed text-[var(--text-muted)]">
              {t('brand.tagline')}
            </p>
            <p className="mt-2 text-xs text-[var(--text-muted)]">
              African Roots. Global Product Quality.
            </p>
          </div>

          <div>
            <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
              Navigate
            </h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/" className="text-[var(--text-muted)] transition hover:text-brand-green">
                  {t('nav.home')}
                </Link>
              </li>
              <li>
                <Link to="/patient" className="text-[var(--text-muted)] transition hover:text-brand-green">
                  {t('nav.patient')}
                </Link>
              </li>
              <li>
                <Link to="/clinic" className="text-[var(--text-muted)] transition hover:text-brand-green">
                  {t('nav.clinic')}
                </Link>
              </li>
              <li>
                <Link to="/pitch" className="text-[var(--text-muted)] transition hover:text-brand-green">
                  {t('nav.pitchMode')}
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
              {t('nav.language')}
            </h4>
            <div className="flex flex-wrap gap-2">
              {[
                { code: 'en', label: 'English' },
                { code: 'am', label: 'አማርኛ' },
                { code: 'om', label: 'Afaan Oromoo' },
              ].map((lang) => (
                <button
                  key={lang.code}
                  type="button"
                  onClick={() => changeLang(lang.code)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                    i18n.language === lang.code
                      ? 'bg-brand-gold text-brand-charcoal'
                      : 'text-[var(--text-muted)]'
                  }`}
                  style={
                    i18n.language !== lang.code
                      ? { backgroundColor: 'color-mix(in srgb, var(--primary) 10%, transparent)' }
                      : undefined
                  }
                >
                  {lang.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div
          className="mt-10 flex flex-col items-center justify-between gap-3 border-t pt-6 text-xs text-[var(--text-muted)] sm:flex-row"
          style={{ borderColor: 'var(--border)' }}
        >
          <p>© {new Date().getFullYear()} Werfa. All rights reserved.</p>
          <p className="text-center sm:text-right">{t('brand.simulatedNotice')}</p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
