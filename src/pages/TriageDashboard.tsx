import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  ClipboardList,
  AlertTriangle,
  History,
  Settings,
  HeartPulse,
} from 'lucide-react';
import { fetchMe, getToken, setToken, login, submitTriageAssessment, type AuthUser } from '../api/client';
import { registerTriageOnlineSync, listPendingAssessments } from '../lib/offlineTriage';

const menu = [
  { to: '/triage/overview', icon: LayoutDashboard, label: t('triage.overview') },
  { to: '/triage/pending', icon: ClipboardList, label: t('triage.pending') },
  { to: '/triage/assess', icon: HeartPulse, label: t('triage.assess') },
  { to: '/triage/emergencies', icon: AlertTriangle, label: t('triage.emergencies') },
  { to: '/triage/history', icon: History, label: t('triage.history') },
  { to: '/triage/settings', icon: Settings, label: t('triage.settings') },
];

export default function TriageDashboard() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  const ensureAuth = useCallback(async () => {
    const demoAuto =
      (import.meta as any).env?.VITE_DEMO_AUTO_LOGIN === 'true' ||
      (import.meta as any).env?.VITE_DEMO_AUTO_LOGIN === '1';
    if (getToken()) {
      try {
        return await fetchMe();
      } catch {
        localStorage.removeItem('werfa_token');
      }
    }
    if (demoAuto) {
      await login('triage_nurse', 'werfa-triage-demo');
      return fetchMe();
    }
    navigate('/login?portal=triage', { replace: true });
    throw new Error('Redirecting to login');
  }, [navigate]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const me = await ensureAuth();
        if (cancelled) return;
        if (me.role !== 'TRIAGE_NURSE' && me.role !== 'ADMIN') {
          setError('Only triage nurses can access this dashboard.');
          return;
        }
        setUser(me);
        setReady(true);
        if (location.pathname === '/triage' || location.pathname === '/triage/') {
          navigate('/triage/overview', { replace: true });
        }
      } catch (e: any) {
        if (!cancelled && e?.message !== 'Redirecting to login') setError(e?.message);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [ensureAuth, location.pathname, navigate]);

  useEffect(() => {
    listPendingAssessments().catch(() => {});
    return registerTriageOnlineSync(submitTriageAssessment);
  }, []);

  if (error) {

    return (
      <div className="section-container py-16 text-center">
        <p className="text-red-600">{error}</p>
        <button type="button" className="btn-primary mt-4" onClick={() => navigate('/login?portal=triage')}>
          Sign in
        </button>
      </div>
    );
  }
  if (!ready) {
    return <div className="flex min-h-[40vh] items-center justify-center text-sm text-[var(--text-muted)]">{t('triage.loading')}</div>;
  }

  return (
    <div className="flex h-[calc(100vh-4rem)] w-full overflow-hidden">
      <aside
        className="hidden h-full w-56 shrink-0 flex-col border-r md:flex lg:w-60"
        style={{ borderColor: 'var(--border)', backgroundColor: 'var(--surface)' }}
      >
        <div className="border-b px-4 py-4" style={{ borderColor: 'var(--border)' }}>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">{t('triage.nav')}</p>
          <p className="mt-0.5 truncate text-sm font-semibold" style={{ color: 'var(--text)' }}>
            {user?.staff_clinic_name || 'Clinic'}
          </p>
        </div>
        <nav className="flex-1 space-y-0.5 overflow-y-auto p-2.5">
          {menu.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                  isActive ? 'bg-brand-charcoal text-white shadow-soft' : 'text-[var(--text-muted)] hover:bg-black/5'
                }`
              }
            >
              <item.icon className="h-4 w-4 shrink-0" />
              <span className="truncate">{item.label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="border-t p-3" style={{ borderColor: 'var(--border)' }}>
          <p className="truncate text-sm font-medium" style={{ color: 'var(--text)' }}>
            {user?.username}
          </p>
          <p className="text-[11px] text-[var(--text-muted)]">{user?.role}</p>
          <button
            type="button"
            className="mt-1 text-[11px] font-semibold text-brand-green hover:underline"
            onClick={() => {
              setToken(null);
              navigate('/login?portal=triage');
            }}
          >
            Sign out
          </button>
        </div>
      </aside>
      <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-5">
        <Outlet context={{ user }} />
      </div>
    </div>
  );
}
