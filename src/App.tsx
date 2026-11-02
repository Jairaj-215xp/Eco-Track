import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Navbar } from './components/ui/Navbar';
import { Footer } from './components/ui/Footer';
import { Landing } from './pages/Landing';
import { Feed } from './pages/Feed';
import { NewReport } from './pages/NewReport';
import { ReportDetail } from './pages/ReportDetail';
import { MyReports } from './pages/MyReports';
import { OrgDashboard } from './pages/OrgDashboard';
import { AdminDashboard } from './pages/AdminDashboard';
import { SubmitProof } from './pages/SubmitProof';
import { Auth } from './pages/Auth';
import { Impact } from './pages/Impact';
import { HowItWorks } from './pages/HowItWorks';
import { useAuth } from './contexts/AuthContext';
import { AlertProvider } from './contexts/AlertContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { ErrorBoundary } from './components/ui/ErrorBoundary';
import { Navigate, useLocation } from 'react-router-dom';

function ProtectedRoute({ children, allowedRoles }: { children: React.ReactNode, allowedRoles?: string[] }) {
  const { user, role, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center space-y-3">
        <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
        <span className="text-xs font-semibold text-text-muted">Validating session...</span>
      </div>
    );
  }

  if (!user || role === 'guest') {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  
  if (allowedRoles && !allowedRoles.includes(role)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AlertProvider>
          <div className="flex flex-col min-h-screen bg-background text-text transition-colors duration-200">
            <Navbar />
            <div className="flex-grow pt-24 pb-8">
              <ErrorBoundary>
                <Routes>
                  <Route path="/" element={<Landing />} />
                  <Route path="/feed" element={<Feed />} />
                  <Route path="/report/new" element={
                    <ProtectedRoute allowedRoles={['citizen']}>
                      <NewReport />
                    </ProtectedRoute>
                  } />
                  <Route path="/report/:id" element={<ReportDetail />} />
                  <Route path="/my-reports" element={
                    <ProtectedRoute allowedRoles={['citizen', 'admin']}>
                      <MyReports />
                    </ProtectedRoute>
                  } />
                  <Route path="/org" element={
                    <ProtectedRoute allowedRoles={['org', 'admin']}>
                      <OrgDashboard />
                    </ProtectedRoute>
                  } />
                  <Route path="/admin" element={
                    <ProtectedRoute allowedRoles={['admin']}>
                      <AdminDashboard />
                    </ProtectedRoute>
                  } />
                  <Route path="/org/report/:id/proof" element={
                    <ProtectedRoute allowedRoles={['org', 'admin']}>
                      <SubmitProof />
                    </ProtectedRoute>
                  } />
                  <Route path="/login" element={<Auth />} />
                  <Route path="/register" element={<Auth />} />
                  <Route path="/impact" element={<Impact />} />
                  <Route path="/how-it-works" element={<HowItWorks />} />
                  <Route path="*" element={<Landing />} />
                </Routes>
              </ErrorBoundary>
            </div>
            <Footer />
          </div>
        </AlertProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}

export default App;
