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

function AppShell() {
  const location = useLocation();
  const isWorkspace =
    location.pathname.startsWith('/clinic') || location.pathname.startsWith('/admin');
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
