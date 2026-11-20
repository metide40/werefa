import { useState } from 'react';
import { CheckCircle2 } from 'lucide-react';

function ClinicSettings() {
  const [saved, setSaved] = useState(false);
  const [notifs, setNotifs] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className="card max-w-xl">
      <div className="border-b px-4 py-3 sm:px-5" style={{ borderColor: 'var(--border)' }}>
        <h2 className="text-sm font-semibold" style={{ color: 'var(--text)' }}>Clinic Settings</h2>
      </div>
      <div className="space-y-5 p-4 sm:p-5">
        {/* Notifications */}
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium" style={{ color: 'var(--text)' }}>Enable Notifications</p>
            <p className="text-xs text-[var(--text-muted)]">Receive alerts for urgent patients and queue updates</p>
          </div>
          <button
            type="button"
            onClick={() => setNotifs((v) => !v)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${notifs ? 'bg-brand-green' : 'bg-gray-300'}`}
          >
            <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${notifs ? 'translate-x-6' : 'translate-x-1'}`} />
          </button>
        </div>

        {/* Auto-refresh */}
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium" style={{ color: 'var(--text)' }}>Auto-refresh Queue</p>
            <p className="text-xs text-[var(--text-muted)]">Refresh live queue every 5 seconds automatically</p>
          </div>
          <button
            type="button"
            onClick={() => setAutoRefresh((v) => !v)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${autoRefresh ? 'bg-brand-green' : 'bg-gray-300'}`}
          >
            <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${autoRefresh ? 'translate-x-6' : 'translate-x-1'}`} />
          </button>
        </div>

        <div className="flex items-center gap-3 pt-2">
          <button type="button" onClick={handleSave} className="btn-primary px-5 py-2 text-sm">
            Save Settings
          </button>
          {saved && (
            <span className="flex items-center gap-1.5 text-xs text-emerald-600">
              <CheckCircle2 className="h-4 w-4" /> Saved!
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export default ClinicSettings;
