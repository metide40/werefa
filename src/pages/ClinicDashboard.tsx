import { useContext, useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  LayoutDashboard,
  Users,
  Activity,
  BarChart3,
  Settings,
  Bell,
  Search,
  ChevronDown,
  Phone,
  CheckCircle2,
  UserX,
  Clock,
  Stethoscope,
  AlertTriangle,
} from 'lucide-react';
import { AppContext } from '../context/AppContext';

const menuItems = [
  { id: 'overview', icon: LayoutDashboard, labelKey: 'clinic.menu.overview' },
  { id: 'queue', icon: Users, labelKey: 'clinic.menu.liveQueue' },
  { id: 'patients', icon: Stethoscope, labelKey: 'clinic.menu.patients' },
  { id: 'analytics', icon: BarChart3, labelKey: 'clinic.menu.analytics' },
  { id: 'settings', icon: Settings, labelKey: 'clinic.menu.settings' },
];

function ClinicDashboard() {
  const { t } = useTranslation();
  const context = useContext(AppContext);
  const [activeMenu, setActiveMenu] = useState('overview');
  const [selectedDept, setSelectedDept] = useState<string>('all');

  if (!context) {
    throw new Error('ClinicDashboard must be rendered within AppProvider');
  }

  const { clinics, tickets, callNextPatient, markCompleted, markNoShow } = context;
  const clinic = clinics[0];

  const clinicTickets = useMemo(
    () => (clinic ? tickets.filter((tk) => tk.clinicId === clinic.id) : []),
    [tickets, clinic]
  );

  const waitingTickets = clinicTickets.filter((tk) => tk.status === 'WAITING');
  const calledTickets = clinicTickets.filter((tk) => tk.status === 'CALLED');
  const completedToday = clinicTickets.filter((tk) => tk.status === 'COMPLETED').length;

  const filteredWaiting =
    selectedDept === 'all'
      ? waitingTickets
      : waitingTickets.filter((tk) => tk.departmentId === selectedDept);

  const avgWait =
    waitingTickets.length > 0
      ? Math.round(
          waitingTickets.reduce((s, tk) => s + tk.estimatedWaitMins, 0) / waitingTickets.length
        )
      : 0;

  const urgentCount = waitingTickets.filter(
    (tk) => tk.priority === 'URGENT' || tk.priority === 'EMERGENCY'
  ).length;

  const metrics = [
    {
      label: t('clinic.metrics.waiting'),
      value: waitingTickets.length,
      icon: Users,
      color: 'text-brand-green',
      bg: 'bg-brand-lightTeal',
    },
    {
      label: t('clinic.metrics.servedToday'),
      value: completedToday,
      icon: CheckCircle2,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
    },
    {
      label: t('clinic.metrics.avgWait'),
      value: `${avgWait} min`,
      icon: Clock,
      color: 'text-brand-amber',
      bg: 'bg-amber-50',
    },
    {
      label: t('clinic.metrics.urgentCount'),
      value: urgentCount,
      icon: AlertTriangle,
      color: 'text-orange-600',
      bg: 'bg-orange-50',
    },
  ];

  return (
    <div className="flex min-h-[calc(100vh-8rem)] -mx-4 sm:-mx-6 lg:-mx-8">
      {/* Sidebar */}
      <aside className="hidden w-60 shrink-0 flex-col border-r border-brand-border bg-brand-card md:flex">
        <div className="border-b border-brand-border px-5 py-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-brand-muted">
            Clinic Console
          </p>
          <p className="mt-0.5 truncate text-sm font-semibold text-brand-forest">
            {clinic?.name || 'Demo Clinic'}
          </p>
        </div>
        <nav className="flex-1 space-y-0.5 p-3">
          {menuItems.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setActiveMenu(item.id)}
              className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                activeMenu === item.id
                  ? 'bg-brand-forest text-white shadow-soft'
                  : 'text-brand-muted hover:bg-brand-ivory hover:text-brand-forest'
              }`}
            >
              <item.icon className="h-4 w-4 shrink-0" />
              {t(item.labelKey)}
            </button>
          ))}
        </nav>
        <div className="border-t border-brand-border p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-green/15 text-sm font-bold text-brand-green">
              DR
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-brand-forest">Dr. Demo User</p>
              <p className="text-xs text-brand-muted">Triage Lead</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex items-center justify-between border-b border-brand-border bg-brand-card px-4 py-3 sm:px-6">
          <div>
            <h1 className="text-lg font-bold text-brand-forest">{t('clinic.title')}</h1>
            <p className="text-xs text-brand-muted">{t('clinic.subtitle')}</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative hidden sm:block">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-muted" />
              <input
                className="input-field w-56 py-2 pl-9 text-xs"
                placeholder={t('clinic.actions.searchPatient')}
              />
            </div>
            <button
              type="button"
              className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-brand-border bg-brand-card text-brand-muted hover:bg-brand-ivory"
            >
              <Bell className="h-4 w-4" />
              <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-brand-amber text-[9px] font-bold text-brand-forest">
                2
              </span>
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {metrics.map((m) => (
              <div key={m.label} className="card flex items-center gap-3 p-4">
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${m.bg}`}>
                  <m.icon className={`h-5 w-5 ${m.color}`} />
                </div>
                <div>
                  <p className="text-2xl font-bold text-brand-forest">{m.value}</p>
                  <p className="text-xs text-brand-muted">{m.label}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 grid gap-4 lg:grid-cols-3">
            <div className="card p-5 lg:col-span-1">
              <p className="text-xs font-semibold uppercase tracking-wider text-brand-muted">
                {t('clinic.metrics.nowServing')}
              </p>
              {calledTickets.length > 0 ? (
                <div className="mt-3 space-y-3">
                  {calledTickets.slice(0, 2).map((tk) => (
                    <div
                      key={tk.id}
                      className="rounded-xl border border-brand-amber/30 bg-amber-50/50 p-3"
                    >
                      <p className="text-lg font-bold text-brand-forest">{tk.ticketNumber}</p>
                      <p className="text-sm text-brand-muted">{tk.patientName}</p>
                      <p className="text-xs text-brand-muted">{tk.departmentName}</p>
                      <div className="mt-2 flex gap-2">
                        <button
                          type="button"
                          onClick={() => markCompleted(tk.id)}
                          className="btn-primary px-3 py-1.5 text-xs"
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          {t('clinic.actions.markComplete')}
                        </button>
                        <button
                          type="button"
                          onClick={() => markNoShow(tk.id)}
                          className="btn-ghost px-3 py-1.5 text-xs"
                        >
                          <UserX className="h-3.5 w-3.5" />
                          No-show
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="mt-6 text-center">
                  <Activity className="mx-auto h-8 w-8 text-brand-muted/40" />
                  <p className="mt-2 text-sm text-brand-muted">No patient currently being served</p>
                  {waitingTickets.length > 0 && clinic && (
                    <button
                      type="button"
                      onClick={() => callNextPatient(clinic.id)}
                      className="btn-primary mt-4 px-4 py-2 text-sm"
                    >
                      <Phone className="h-4 w-4" />
                      {t('clinic.actions.callNext')}
                    </button>
                  )}
                </div>
              )}
            </div>

            <div className="card lg:col-span-2">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-brand-border px-5 py-3.5">
                <h2 className="font-semibold text-brand-forest">{t('clinic.menu.liveQueue')}</h2>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <select
                      value={selectedDept}
                      onChange={(e) => setSelectedDept(e.target.value)}
                      className="input-field appearance-none py-1.5 pr-8 text-xs"
                    >
                      <option value="all">{t('clinic.actions.allDepartments')}</option>
                      {clinic?.departments.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.name}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-brand-muted" />
                  </div>
                  {waitingTickets.length > 0 && clinic && (
                    <button
                      type="button"
                      onClick={() => callNextPatient(clinic.id)}
                      className="btn-primary px-3 py-1.5 text-xs"
                    >
                      <Phone className="h-3.5 w-3.5" />
                      {t('clinic.actions.callNext')}
                    </button>
                  )}
                </div>
              </div>

              {filteredWaiting.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <Users className="h-10 w-10 text-brand-muted/30" />
                  <p className="mt-3 text-sm text-brand-muted">{t('clinic.emptyQueue')}</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b border-brand-border text-xs font-semibold uppercase tracking-wide text-brand-muted">
                        <th className="px-5 py-3">{t('clinic.table.ticket')}</th>
                        <th className="px-3 py-3">{t('clinic.table.patient')}</th>
                        <th className="hidden px-3 py-3 sm:table-cell">{t('clinic.table.department')}</th>
                        <th className="px-3 py-3">{t('clinic.table.priority')}</th>
                        <th className="hidden px-3 py-3 md:table-cell">{t('clinic.table.waitDuration')}</th>
                        <th className="px-3 py-3 text-right">{t('clinic.table.action')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredWaiting.map((tk) => (
                        <tr
                          key={tk.id}
                          className="border-b border-brand-border/60 transition hover:bg-brand-ivory/50"
                        >
                          <td className="px-5 py-3 font-semibold text-brand-forest">
                            {tk.ticketNumber}
                          </td>
                          <td className="px-3 py-3 text-brand-text">{tk.patientName}</td>
                          <td className="hidden px-3 py-3 text-brand-muted sm:table-cell">
                            {tk.departmentName}
                          </td>
                          <td className="px-3 py-3">
                            <span
                              className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                                tk.priority === 'EMERGENCY'
                                  ? 'bg-red-50 text-red-700'
                                  : tk.priority === 'URGENT'
                                    ? 'bg-orange-50 text-orange-700'
                                    : 'bg-brand-lightTeal text-brand-green'
                              }`}
                            >
                              {t(`priority.${tk.priority}`)}
                            </span>
                          </td>
                          <td className="hidden px-3 py-3 text-brand-muted md:table-cell">
                            {new Date(tk.joinedAt).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </td>
                          <td className="px-3 py-3 text-right">
                            <button
                              type="button"
                              onClick={() => {
                                context.updateTicket(tk.id, {
                                  status: 'CALLED',
                                  calledAt: new Date().toISOString(),
                                });
                              }}
                              className="rounded-lg bg-brand-forest px-2.5 py-1 text-[11px] font-semibold text-white transition hover:bg-[#0F3229]"
                            >
                              Call
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {clinic && (
            <div className="mt-6">
              <h3 className="mb-3 text-sm font-semibold text-brand-forest">
                {t('clinic.menu.departments')}
              </h3>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {clinic.departments.map((dept) => (
                  <div key={dept.id} className="card p-4">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-brand-forest">{dept.name}</p>
                      <span className="rounded-md bg-brand-lightTeal px-1.5 py-0.5 text-[10px] font-bold text-brand-green">
                        {dept.code}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-brand-muted">{dept.roomNumber}</p>
                    <div className="mt-3 flex items-end justify-between">
                      <div>
                        <p className="text-2xl font-bold text-brand-forest">{dept.waitingCount}</p>
                        <p className="text-[10px] text-brand-muted">waiting</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-brand-green">~{dept.avgWaitMins}m</p>
                        <p className="text-[10px] text-brand-muted">avg wait</p>
                      </div>
                    </div>
                    {dept.currentServingNumber && (
                      <p className="mt-2 truncate text-[11px] text-brand-muted">
                        Now:{' '}
                        <span className="font-medium text-brand-text">
                          {dept.currentServingNumber}
                        </span>
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ClinicDashboard;
