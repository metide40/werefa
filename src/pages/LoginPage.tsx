import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Building2, Shield, LogIn, AlertCircle } from 'lucide-react';
import { login, setToken, type AuthUser } from '../api/client';
import { Logo } from '../components/Logo';

type Portal = 'clinic' | 'admin';

function LoginPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const initialPortal = (params.get('portal') === 'admin' ? 'admin' : 'clinic') as Portal;

  const [portal, setPortal] = useState<Portal>(initialPortal);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fillDemo = (role: Portal) => {
    if (role === 'admin') {
      setUsername('admin');
      setPassword('werfa-admin-demo');
      setPortal('admin');
    } else {
      setUsername('clinic_staff');
      setPassword('werfa-staff-demo');
      setPortal('clinic');
    }
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const data = await login(username.trim(), password);
      const user = data.user as AuthUser;
      localStorage.setItem('werfa_user', JSON.stringify(user));

      if (portal === 'admin') {
        if (user.role !== 'ADMIN') {
          setToken(null);
          localStorage.removeItem('werfa_user');
          setError('This account is not a platform administrator.');
          return;
        }
        navigate('/admin/overview', { replace: true });
        return;
      }

      // Clinic portal
      if (user.role !== 'CLINIC_STAFF' && user.role !== 'ADMIN') {
        setToken(null);
        localStorage.removeItem('werfa_user');
        setError('This account is not authorized for the clinic dashboard.');
        return;
      }
      if (user.role === 'CLINIC_STAFF' && !user.staff_clinic) {
        setError('No clinic is assigned to this staff account.');
        return;
      }
      navigate('/clinic/overview', { replace: true });
    } catch (err: any) {
      setError(err?.message || 'Login failed. Check username, password, and that the API is running.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="section-container flex min-h-[70vh] items-center justify-center py-10 page-enter">
      <div className="w-full max-w-md">
        <div className="mb-6 flex flex-col items-center text-center">
          <Logo size={40} />
          <h1 className="mt-4 text-2xl font-bold" style={{ color: 'var(--text)' }}>
            {t('login.title') || 'Staff sign in'}
          </h1>
          <p className="mt-1 text-sm text-[var(--text-muted)]">
            {t('login.subtitle') || 'Clinic staff and platform administrators'}
          </p>
        </div>

        <div className="card p-6 sm:p-7">
          {/* Portal toggle */}
          <div className="mb-5 grid grid-cols-2 gap-2 rounded-xl bg-brand-ivory p-1 dark:bg-black/20">
            <button
              type="button"
              onClick={() => setPortal('clinic')}
              className={`flex items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm font-semibold transition ${
                portal === 'clinic'
                  ? 'bg-brand-charcoal text-white shadow-soft'
                  : 'text-[var(--text-muted)] hover:text-[var(--text)]'
              }`}
            >
              <Building2 className="h-4 w-4" />
              Clinic
            </button>
            <button
              type="button"
              onClick={() => setPortal('admin')}
              className={`flex items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm font-semibold transition ${
                portal === 'admin'
                  ? 'bg-brand-charcoal text-white shadow-soft'
                  : 'text-[var(--text-muted)] hover:text-[var(--text)]'
              }`}
            >
              <Shield className="h-4 w-4" />
              Admin
            </button>
          </div>

          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
                {t('login.username') || 'Username'}
              </label>
              <input
                className="input-field"
                autoComplete="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder={portal === 'admin' ? 'admin' : 'clinic_staff'}
                required
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
                {t('login.password') || 'Password'}
              </label>
              <input
                type="password"
                className="input-field"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            {error && (
              <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <p>{error}</p>
              </div>
            )}

            <button type="submit" className="btn-primary w-full" disabled={loading}>
              <LogIn className="h-4 w-4" />
              {loading ? t('login.signingIn') || 'Signing in…' : t('login.signIn') || 'Sign in'}
            </button>
          </form>

          <div className="mt-5 border-t pt-4" style={{ borderColor: 'var(--border)' }}>
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-[var(--text-muted)]">
              Demo accounts (sample only)
            </p>
            <div className="flex flex-wrap gap-2">
              <button type="button" className="btn-ghost text-xs py-1.5 px-3" onClick={() => fillDemo('clinic')}>
                Use clinic staff
              </button>
              <button type="button" className="btn-ghost text-xs py-1.5 px-3" onClick={() => fillDemo('admin')}>
                Use admin
              </button>
            </div>
          </div>
        </div>

        <p className="mt-4 text-center text-xs text-[var(--text-muted)]">
          <Link to="/" className="font-medium text-brand-green hover:underline">
            Back to home
          </Link>
        </p>
      </div>
    </div>
  );
}

export default LoginPage;
