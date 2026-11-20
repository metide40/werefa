import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import PatientPage from './pages/PatientPage';
import ClinicDashboard from './pages/ClinicDashboard';
import AdminDashboard from './pages/AdminDashboard';
import PitchDemo from './pages/PitchDemo';
import LoginPage from './pages/LoginPage';
import Header from './components/Header';
import Footer from './components/Footer';
import { AppProvider } from './context/AppContext';
import { ThemeProvider } from './context/ThemeContext';

import AdminOverviewPage from './pages/admin/OverviewPage';
import AdminClinicsPage from './pages/admin/ClinicsPage';
import AdminClinicDetailPage from './pages/admin/ClinicDetailPage';
import AdminQueuesPage from './pages/admin/QueuesPage';
import AdminActivityPage from './pages/admin/ActivityPage';
import AdminHealthPage from './pages/admin/HealthPage';
import AdminSettingsPage from './pages/admin/SettingsPage';

import ClinicOverviewPage from './pages/clinic/OverviewPage';
import ClinicQueuesPage from './pages/clinic/QueuesPage';
import ClinicDepartmentsPage from './pages/clinic/DepartmentsPage';
import ClinicPatientsPage from './pages/clinic/PatientsPage';
import ClinicAnalyticsPage from './pages/clinic/AnalyticsPage';
import ClinicSettingsPage from './pages/clinic/SettingsPage';

import TriageDashboard from './pages/TriageDashboard';
import TriageOverviewPage from './pages/triage/OverviewPage';
import TriagePendingPage from './pages/triage/PendingPage';
import TriageAssessPage from './pages/triage/AssessPage';
import TriageEmergenciesPage from './pages/triage/EmergenciesPage';
import TriageHistoryPage from './pages/triage/HistoryPage';
import TriageSettingsPage from './pages/triage/SettingsPage';
import AdminEmergenciesPage from './pages/admin/EmergenciesPage';

function AppShell() {
  const location = useLocation();
  const isWorkspace =
    location.pathname.startsWith('/clinic') || location.pathname.startsWith('/admin') || location.pathname.startsWith('/triage');
  const isLanding = location.pathname === '/';

  return (
    <div className="flex min-h-screen flex-col" style={{ backgroundColor: 'var(--bg)', color: 'var(--text)' }}>
      <Header />
      <main
        className={`flex-grow ${
          isWorkspace ? 'px-0 py-0' : isLanding ? 'px-0 py-0' : 'section-container py-6'
        }`}
      >
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/patient/*" element={<PatientPage />} />
          <Route path="/pitch" element={<PitchDemo />} />

          <Route path="/admin" element={<AdminDashboard />}>
            <Route index element={<Navigate to="overview" replace />} />
            <Route path="overview" element={<AdminOverviewPage />} />
            <Route path="clinics" element={<AdminClinicsPage />} />
            <Route path="clinics/:id" element={<AdminClinicDetailPage />} />
            <Route path="queues" element={<AdminQueuesPage />} />
            <Route path="activity" element={<AdminActivityPage />} />
            <Route path="health" element={<AdminHealthPage />} />
            <Route path="emergencies" element={<AdminEmergenciesPage />} />
            <Route path="settings" element={<AdminSettingsPage />} />
          </Route>

          <Route path="/clinic" element={<ClinicDashboard />}>
            <Route index element={<Navigate to="overview" replace />} />
            <Route path="overview" element={<ClinicOverviewPage />} />
            <Route path="queues" element={<ClinicQueuesPage />} />
            <Route path="departments" element={<ClinicDepartmentsPage />} />
            <Route path="patients" element={<ClinicPatientsPage />} />
            <Route path="analytics" element={<ClinicAnalyticsPage />} />
            <Route path="settings" element={<ClinicSettingsPage />} />
          </Route>

          <Route path="/triage" element={<TriageDashboard />}>
            <Route index element={<Navigate to="overview" replace />} />
            <Route path="overview" element={<TriageOverviewPage />} />
            <Route path="pending" element={<TriagePendingPage />} />
            <Route path="assess" element={<TriageAssessPage />} />
            <Route path="emergencies" element={<TriageEmergenciesPage />} />
            <Route path="history" element={<TriageHistoryPage />} />
            <Route path="settings" element={<TriageSettingsPage />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      {!isWorkspace && <Footer />}
    </div>
  );
}

function App() {
  return (
    <ThemeProvider>
      <AppProvider>
        <Router>
          <AppShell />
        </Router>
      </AppProvider>
    </ThemeProvider>
  );
}

export default App;
