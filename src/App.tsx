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
import { SubmitProof } from './pages/SubmitProof';
import { Auth } from './pages/Auth';
import { Impact } from './pages/Impact';
import { HowItWorks } from './pages/HowItWorks';
import { useAuth } from './contexts/AuthContext';
import { Navigate, useLocation } from 'react-router-dom';

function ProtectedRoute({ children, allowedRoles }: { children: React.ReactNode, allowedRoles?: string[] }) {
  const { role } = useAuth();
  const location = useLocation();

  if (role === 'guest') {
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
      <div className="flex flex-col min-h-screen bg-background">
        <Navbar />
        <div className="flex-grow pt-24 pb-8">
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/feed" element={<Feed />} />
            <Route path="/report/new" element={
              <ProtectedRoute>
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
        </div>
        <Footer />
      </div>
    </BrowserRouter>
  );
}

export default App;
