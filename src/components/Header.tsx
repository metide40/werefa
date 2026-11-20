import { useTranslation } from 'react-i18next';
import { Link, NavLink } from 'react-router-dom';
import { Menu, X, Globe, Sun, Moon } from 'lucide-react';
import { useState } from 'react';
import { Logo } from './Logo';
import { useTheme } from '../context/ThemeContext';

function Header() {
  const { i18n, t } = useTranslation();
  const { theme, toggleTheme } = useTheme();
  const [mobileOpen, setMobileOpen] = useState(false);

  const changeLang = (lng: string) => {
    i18n.changeLanguage(lng);
    localStorage.setItem('werfa_lang', lng);
  };

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `text-sm font-medium transition-colors ${
      isActive ? 'text-brand-gold' : 'text-[var(--text-muted)] hover:text-[var(--text)]'
    }`;

  const publicLinks = [
    { to: '/patient', label: t('nav.patient') },
    { to: '/login', label: t('nav.signIn') || 'Sign in' },
    { to: '/pitch', label: t('nav.pitchMode') },
  ];

  return (
    <header
      className="sticky top-0 z-50 border-b backdrop-blur-md"
      style={{
        backgroundColor: 'color-mix(in srgb, var(--bg) 92%, transparent)',
        borderColor: 'var(--border)',
      }}
    >
      <div className="section-container flex h-16 items-center justify-between">
        <Link to="/" className="group">
          <Logo size={34} />
        </Link>

        <nav className="hidden items-center gap-7 md:flex">
          {publicLinks.map((item) => (
            <NavLink key={item.to} to={item.to} className={navLinkClass}>
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={toggleTheme}
            className="flex h-9 w-9 items-center justify-center rounded-lg transition hover:bg-black/5 dark:hover:bg-white/5"
            aria-label={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
          >
            {theme === 'light' ? (
              <Moon className="h-4 w-4 text-[var(--text-muted)]" />
            ) : (
              <Sun className="h-4 w-4 text-[var(--text-muted)]" />
            )}
          </button>

          <div className="relative">
            <Globe className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--text-muted)]" />
            <select
              value={i18n.language}
              onChange={(e) => changeLang(e.target.value)}
              className="appearance-none rounded-lg border py-1.5 pl-8 pr-7 text-xs font-medium transition focus:outline-none focus:ring-1"
              style={{
                borderColor: 'var(--border)',
                backgroundColor: 'var(--surface)',
                color: 'var(--text)',
              }}
              aria-label={t('nav.language')}
            >
              <option value="en">English</option>
              <option value="am">አማርኛ</option>
              <option value="om">Afaan Oromoo</option>
            </select>
          </div>

          <button
            type="button"
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border md:hidden"
            style={{ borderColor: 'var(--border)', backgroundColor: 'var(--surface)' }}
            onClick={() => setMobileOpen((v) => !v)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div
          className="border-t md:hidden animate-fade-in"
          style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg)' }}
        >
          <nav className="section-container flex flex-col gap-1 py-3">
            {publicLinks.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => setMobileOpen(false)}
                className={({ isActive }) =>
                  `rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                    isActive
                      ? 'bg-brand-green/10 text-brand-green'
                      : 'text-[var(--text-muted)] hover:bg-black/5 dark:hover:bg-white/5'
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
}

export default Header;
