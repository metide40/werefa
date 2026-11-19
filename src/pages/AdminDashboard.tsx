import { useTranslation } from 'react-i18next';
import { Shield, Building2, Users, Activity } from 'lucide-react';

function AdminDashboard() {
  const { t } = useTranslation();

  return (
    <div className="section-container py-10 page-enter">
      <div className="mb-8">
        <div className="inline-flex items-center gap-2 rounded-full bg-brand-lightTeal px-3 py-1 text-xs font-semibold text-brand-green">
          <Shield className="h-3.5 w-3.5" />
          System Admin
        </div>
        <h1 className="mt-3 text-3xl font-bold text-brand-forest">
          {t('admin.title') || 'System Administration'}
        </h1>
        <p className="mt-1 text-brand-muted">
          Platform-wide overview and partner clinic management (visual foundation).
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'Partner Clinics', value: '12', icon: Building2 },
          { label: 'Active Patients Today', value: '348', icon: Users },
          { label: 'Queues Managed', value: '47', icon: Activity },
          { label: 'System Health', value: '99.2%', icon: Shield },
        ].map((card) => (
          <div key={card.label} className="card flex items-center gap-4 p-5">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-lightTeal">
              <card.icon className="h-5 w-5 text-brand-green" />
            </div>
            <div>
              <p className="text-2xl font-bold text-brand-forest">{card.value}</p>
              <p className="text-xs text-brand-muted">{card.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 card p-8 text-center">
        <p className="text-brand-muted">
          Full admin analytics, clinic onboarding, and role management will be implemented in a
          future iteration. This screen provides the visual foundation for the admin experience.
        </p>
      </div>
    </div>
  );
}

export default AdminDashboard;
