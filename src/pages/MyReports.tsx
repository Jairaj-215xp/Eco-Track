import React, { useState, useEffect } from 'react';
import { reportService, getMySubmittedReportIds } from '../services/reportService';
import { Report } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { ReportCard } from '../components/report/ReportCard';
import { Leaf, Camera, Award, CheckCircle, Clock, MapPin } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { useNavigate } from 'react-router-dom';

export function MyReports() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    reportService.getReports().then((all) => {
      const myIds = new Set(getMySubmittedReportIds());
      // Filter for reports submitted by this user or created on this machine
      const userReports = all.filter(r => 
        myIds.has(r.id) ||
        (user?.id && r.reporterId === user.id) || 
        (user?.email && r.reporterEmail === user.email) ||
        r.reporterId === 'anonymous'
      );
      setReports(userReports);
      setLoading(false);
    });
  }, [user]);

  const verifiedCount = reports.filter(r => r.status === 'verified').length;
  const inProgressCount = reports.filter(r => r.status === 'in_progress').length;
  const ecoPoints = (reports.length * 20) + (verifiedCount * 50);

  return (
    <div className="bg-background min-h-[calc(100vh-96px)] font-sans pb-24">
      {/* Top Banner */}
      <div className="bg-surface border-b border-border py-8 mb-8">
        <div className="max-w-[1200px] mx-auto px-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <p className="text-xs font-bold text-brand-600 mb-1 uppercase tracking-wider">Citizen Profile</p>
              <h1 className="text-2xl sm:text-3xl font-display font-extrabold text-ink">
                My Environmental Reports
              </h1>
              <p className="text-xs text-text-muted mt-1">
                Track status updates and AI verification for reports you submitted.
              </p>
            </div>

            <Button 
              onClick={() => navigate('/report/new')} 
              className="text-xs shadow-sm bg-brand-500 hover:bg-brand-600"
              leftIcon={<Camera className="w-4 h-4" />}
            >
              Report New Waste
            </Button>
          </div>

          {/* User Achievement Badges */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
            <div className="bg-surface-2 p-3 rounded-2xl border border-border">
              <span className="text-[10px] font-bold text-text-muted uppercase block">Total Reports</span>
              <span className="text-xl font-bold text-ink">{reports.length}</span>
            </div>
            <div className="bg-surface-2 p-3 rounded-2xl border border-border">
              <span className="text-[10px] font-bold text-text-muted uppercase block">Verified Clean</span>
              <span className="text-xl font-bold text-brand-600">{verifiedCount}</span>
            </div>
            <div className="bg-surface-2 p-3 rounded-2xl border border-border">
              <span className="text-[10px] font-bold text-text-muted uppercase block">In Progress</span>
              <span className="text-xl font-bold text-warn">{inProgressCount}</span>
            </div>
            <div className="bg-brand-50 p-3 rounded-2xl border border-brand-500/20">
              <span className="text-[10px] font-bold text-brand-700 uppercase block">Eco Points</span>
              <span className="text-xl font-bold text-brand-700">+{ecoPoints} pts</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-[1200px] mx-auto px-6">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="animate-pulse bg-surface rounded-3xl border border-border h-[340px]" />
            ))}
          </div>
        ) : reports.length === 0 ? (
          <div className="bg-surface rounded-3xl border border-border p-12 text-center max-w-lg mx-auto shadow-xs">
            <div className="w-16 h-16 rounded-full bg-brand-50 flex items-center justify-center mx-auto mb-4 text-brand-600">
              <Leaf className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-bold text-ink mb-2">No reports submitted yet</h2>
            <p className="text-xs text-text-muted mb-6">
              Spot garbage or overflowing waste in your neighborhood? Snap a photo to get it classified by Open Vision AI and dispatched to local cleanup teams.
            </p>
            <Button onClick={() => navigate('/report/new')} leftIcon={<Camera className="w-4 h-4" />}>
              Create Your First Report
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {reports.map((report) => (
              <ReportCard 
                key={report.id} 
                report={report} 
                onClick={() => navigate(`/report/${report.id}`)} 
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
