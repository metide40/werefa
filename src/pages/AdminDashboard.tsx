import { useCallback, useEffect, useState } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Shield,
  Users,
  Activity,
  LayoutDashboard,
  Hospital,
  HeartPulse,
  Settings,
  Bell,
} from 'lucide-react';
import { WerfaMark } from '../components/Logo';
import { fetchMe, getToken, setToken, login, type AuthUser } from '../api/client';

const adminMenu = [
  { to: '/admin/overview', icon: LayoutDashboard, label: 'Overview' },
  { to: '/admin/clinics', icon: Hospital, label: 'Partner Clinics' },
  { to: '/admin/queues', icon: Users, label: 'Live Queues' },
  { to: '/admin/activity', icon: Activity, label: 'System Activity' },
  { to: '/admin/health', icon: HeartPulse, label: 'Platform Health' },
  { to: '/admin/settings', icon: Settings, label: 'Settings' },
];

function AdminDashboard() {
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
        localStorage.removeItem('werfa_user');
      }
    }
    if (demoAuto) {
      await login('admin', 'werfa-admin-demo');
      return fetchMe();
    }
    navigate('/login?portal=admin', { replace: true });
    throw new Error('Redirecting to login');
  }, [navigate]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const me = await ensureAuth();
        if (cancelled) return;
        if (me.role !== 'ADMIN') {
          setError('Only platform administrators can access this dashboard.');
          setReady(false);
          return;
        }
        setUser(me);
        setReady(true);
        // default redirect
        if (location.pathname === '/admin' || location.pathname === '/admin/') {
          navigate('/admin/overview', { replace: true });
        }
      } catch (e: any) {
        if (!cancelled && e?.message !== 'Redirecting to login') {
          setError(e?.message || 'Authentication failed');
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [ensureAuth, location.pathname, navigate]);

  const signOut = () => {
    setToken(null);
    localStorage.removeItem('werfa_user');
    navigate('/login?portal=admin');
  };

  if (error) {
    return (
      <div className="section-container py-16 text-center">
        <p className="text-red-600">{error}</p>
        <button type="button" className="btn-primary mt-4" onClick={() => navigate('/login?portal=admin')}>
          Sign in
        </button>
      </div>
    );
  }

  if (!ready) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-sm text-[var(--text-muted)]">
        Loading admin console…
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-4rem)] w-full max-w-full overflow-hidden">
      <aside
        className="hidden h-full w-56 shrink-0 flex-col overflow-hidden border-r md:flex lg:w-60"
        style={{ borderColor: 'var(--border)', backgroundColor: 'var(--surface)' }}
      >
        <div className="shrink-0 border-b px-4 py-4" style={{ borderColor: 'var(--border)' }}>
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-brand-green" />
            <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
              System Admin
            </p>
          </div>
          <p className="mt-0.5 text-sm font-semibold" style={{ color: 'var(--text)' }}>
            Werfa Platform
          </p>
        </div>
        <nav className="min-h-0 flex-1 space-y-0.5 overflow-y-auto p-2.5">
          {adminMenu.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                  isActive
                    ? 'bg-brand-charcoal text-white shadow-soft'
                    : 'text-[var(--text-muted)] hover:bg-black/5 dark:hover:bg-white/5'
                }`
              }
            >
              <item.icon className="h-4 w-4 shrink-0" />
              <span className="truncate">{item.label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="mt-auto shrink-0 border-t p-3" style={{ borderColor: 'var(--border)' }}>
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-green/15">
              <WerfaMark size={20} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium" style={{ color: 'var(--text)' }}>
                {user?.username || '…'}
              </p>
              <p className="text-[11px] text-[var(--text-muted)]">{user?.role || 'ADMIN'}</p>
              <button type="button" className="mt-1 text-[11px] font-semibold text-brand-green hover:underline" onClick={signOut}>
                Sign out
              </button>
            </div>
          </div>
        </div>
      </aside>

      <div className="flex h-full min-w-0 flex-1 flex-col overflow-hidden">
        <header
          className="flex shrink-0 items-center justify-between gap-3 border-b px-4 py-3 sm:px-5"
          style={{ borderColor: 'var(--border)', backgroundColor: 'var(--surface)' }}
        >
          <div className="min-w-0">
            <h1 className="truncate text-base font-bold sm:text-lg" style={{ color: 'var(--text)' }}>
              {t('admin.title') || 'System Administration'}
            </h1>
            <p className="truncate text-xs text-[var(--text-muted)]">Platform management</p>
          </div>
          <button
            type="button"
            className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border text-[var(--text-muted)]"
            style={{ borderColor: 'var(--border)', backgroundColor: 'var(--surface)' }}
          >
            <Bell className="h-4 w-4" />
          </button>
        </header>
        <div className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto p-4 sm:p-5">
          <Outlet context={{ user }} />
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;
