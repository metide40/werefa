import type { FormEvent } from 'react';
import { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { changePassword, type AuthUser } from '../../api/client';

export default function AdminSettingsPage() {
  const ctx = useOutletContext<{ user: AuthUser | null } | null>();
  const user = ctx?.user ?? null;
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const onChangePassword = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    setError(null);
    try {
      await changePassword(oldPassword, newPassword);
      setMessage('Password updated successfully.');
      setOldPassword('');
      setNewPassword('');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Could not update password';
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-lg space-y-5">
      <div>
        <h2 className="text-lg font-bold" style={{ color: 'var(--text)' }}>Settings</h2>
        <p className="text-xs text-[var(--text-muted)]">Account and security</p>
      </div>
      <div className="card space-y-2 p-4 text-sm">
        <p><span className="text-[var(--text-muted)]">Username:</span> {user?.username}</p>
        <p><span className="text-[var(--text-muted)]">Name:</span> {[user?.first_name, user?.last_name].filter(Boolean).join(' ') || '—'}</p>
        <p><span className="text-[var(--text-muted)]">Email:</span> {user?.email || '—'}</p>
        <p><span className="text-[var(--text-muted)]">Role:</span> {user?.role}</p>
      </div>
      <form onSubmit={onChangePassword} className="card space-y-3 p-4">
        <h3 className="text-sm font-semibold">Change password</h3>
        <input type="password" className="input-field" placeholder="Current password" value={oldPassword} onChange={(e) => setOldPassword(e.target.value)} required />
        <input type="password" className="input-field" placeholder="New password (min 6)" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required minLength={6} />
        {message && <p className="text-sm text-emerald-700">{message}</p>}
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Saving…' : 'Update password'}</button>
      </form>
    </div>
  );
}
