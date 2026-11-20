import type { FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { changePassword, type AuthUser } from '../../api/client';

export default function TriageSettingsPage() {
  const ctx = useOutletContext<{ user: AuthUser | null } | null>();
  const user = ctx?.user ?? null;
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setError(null);
    try {
      await changePassword(oldPassword, newPassword);
      setMessage('Password updated.');
      setOldPassword('');
      setNewPassword('');
    } catch (err: any) {
      setError(err?.message || 'Failed');
    }
  };

  return (
    <div className="mx-auto max-w-lg space-y-4">
      <h2 className="text-lg font-bold" style={{ color: 'var(--text)' }}>Triage settings</h2>
      <div className="card space-y-1 p-4 text-sm">
        <p>User: {user?.username}</p>
        <p>Clinic: {user?.staff_clinic_name || '—'}</p>
        <p>Role: {user?.role}</p>
      </div>
      <form onSubmit={onSubmit} className="card space-y-3 p-4">
        <h3 className="text-sm font-semibold">Change password</h3>
        <input type="password" className="input-field" required value={oldPassword} onChange={(e) => setOldPassword(e.target.value)} placeholder="Current password" />
        <input type="password" className="input-field" required minLength={6} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="New password" />
        {message && <p className="text-sm text-emerald-700">{message}</p>}
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button type="submit" className="btn-primary">Update password</button>
      </form>
    </div>
  );
}
