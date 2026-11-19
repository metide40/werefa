import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import PatientPage from './pages/PatientPage';
import ClinicDashboard from './pages/ClinicDashboard';
import AdminDashboard from './pages/AdminDashboard';
import PitchDemo from './pages/PitchDemo';
import Header from './components/Header';
import Footer from './components/Footer';
import { AppProvider } from './context/AppContext';
import { ThemeProvider } from './context/ThemeContext';

function AppShell() {
  const location = useLocation();
  const isClinic = location.pathname.startsWith('/clinic');
  const isLanding = location.pathname === '/';

  return (
    <div className="flex min-h-screen flex-col" style={{ backgroundColor: 'var(--bg)', color: 'var(--text)' }}>
      <Header />
      <main
        className={`flex-grow ${
          isClinic ? 'px-0 py-0' : isLanding ? 'px-0 py-0' : 'section-container py-6'
        }`}
      >
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/patient/*" element={<PatientPage />} />
          <Route path="/clinic/*" element={<ClinicDashboard />} />
          <Route path="/admin/*" element={<AdminDashboard />} />
          <Route path="/pitch" element={<PitchDemo />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      {!isClinic && <Footer />}
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
