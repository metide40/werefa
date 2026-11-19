import { useContext } from 'react';
import { useTranslation } from 'react-i18next';
import { Wifi, WifiOff } from 'lucide-react';
import { AppContext } from '../context/AppContext';

function ConnectionStatusBanner() {
  const { t } = useTranslation();
  const { connectionState, setConnectionState } = useContext(AppContext) ?? {};

  if (!connectionState || !setConnectionState) return null;

  const isOnline = connectionState === 'ONLINE';

  return (
    <div
      className="mb-4 flex items-center justify-between gap-3 rounded-xl border px-4 py-2.5 text-sm"
      style={{
        borderColor: 'var(--border)',
        backgroundColor: isOnline
          ? 'color-mix(in srgb, var(--primary) 8%, transparent)'
          : 'color-mix(in srgb, var(--accent) 10%, transparent)',
      }}
    >
      <span className="inline-flex items-center gap-2 font-medium" style={{ color: 'var(--text)' }}>
        {isOnline ? (
          <Wifi className="h-4 w-4 text-brand-green" />
        ) : (
          <WifiOff className="h-4 w-4 text-brand-terracotta" />
        )}
        {isOnline ? t('connection.online') : t('connection.offline')}
      </span>
      <button
        type="button"
        className="btn-ghost text-xs py-1.5 px-3"
        onClick={() => setConnectionState(isOnline ? 'OFFLINE' : 'ONLINE')}
      >
        {isOnline ? t('connection.simulateOffline') : t('connection.simulateOnline')}
      </button>
    </div>
  );
}

export default ConnectionStatusBanner;
