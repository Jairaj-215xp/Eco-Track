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

function App() {
  return (
    <BrowserRouter>
      <div className="flex flex-col min-h-screen bg-background">
        <Navbar />
        <div className="flex-grow pt-24 pb-8">
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/feed" element={<Feed />} />
            <Route path="/report/new" element={<NewReport />} />
            <Route path="/report/:id" element={<ReportDetail />} />
            <Route path="/my-reports" element={<MyReports />} />
            <Route path="/org" element={<OrgDashboard />} />
            <Route path="/org/report/:id/proof" element={<SubmitProof />} />
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
