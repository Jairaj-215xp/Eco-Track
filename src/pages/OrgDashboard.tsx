import React, { useState, useEffect } from 'react';
import { reportService } from '../services/reportService';
import { Report } from '../types';
import { MapPin, Clock, AlertTriangle, CheckCircle, ChevronRight, TrendingUp } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { useNavigate } from 'react-router-dom';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const chartData = [
  { day: 'Mon', cleanups: 4 },
  { day: 'Tue', cleanups: 7 },
  { day: 'Wed', cleanups: 5 },
  { day: 'Thu', cleanups: 10 },
  { day: 'Fri', cleanups: 8 },
  { day: 'Sat', cleanups: 14 },
  { day: 'Sun', cleanups: 12 },
];

export function OrgDashboard() {
  const [reports, setReports] = useState<Report[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    reportService.getReports().then(setReports);
  }, []);

  const urgentReports = reports.filter(r => r.status === 'reported' || r.status === 'in_progress');

  const handleAccept = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    await reportService.updateReportStatus(id, 'in_progress', 'org-1');
    reportService.getReports().then(setReports);
  };

  return (
    <div className="bg-background min-h-[calc(100vh-96px)] font-sans pb-24">
      {/* Header */}
      <div className="bg-surface border-b border-border py-8">
        <div className="max-w-[1200px] mx-auto px-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <p className="text-sm font-bold text-brand-600 mb-1 tracking-wide uppercase">Organisation Dashboard</p>
              <h1 className="text-3xl md:text-4xl font-display font-extrabold text-ink">Welcome back, Pune Cleanup Crew! 👋</h1>
            </div>
            
            <div className="flex space-x-4">
              <div className="bg-brand-50 rounded-2xl px-5 py-3 border border-brand-500/20 shadow-sm">
                <p className="text-xs font-bold text-text-muted mb-1">Active Tasks</p>
                <p className="text-2xl font-display font-bold text-brand-600">12</p>
              </div>
              <div className="bg-surface-2 rounded-2xl px-5 py-3 border border-border shadow-sm">
                <p className="text-xs font-bold text-text-muted mb-1">Total Cleaned</p>
                <p className="text-2xl font-display font-bold text-ink">1,204</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-[1200px] mx-auto px-6 pt-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left: Urgent Reports */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-ink flex items-center">
              <AlertTriangle className="w-5 h-5 mr-2 text-warn" /> Urgent Reports
            </h2>
            <button className="text-sm font-bold text-brand-600 hover:underline">View all</button>
          </div>

          <div className="space-y-4">
            {urgentReports.length === 0 ? (
              <div className="bg-surface rounded-[24px] border border-border p-12 text-center shadow-sm">
                <CheckCircle className="w-12 h-12 text-brand-500 mx-auto mb-4" />
                <h3 className="font-bold text-ink mb-1">No urgent reports</h3>
                <p className="text-sm text-text-muted">Your area is looking clean right now.</p>
              </div>
            ) : (
              urgentReports.map(report => (
                <div 
                  key={report.id}
                  onClick={() => navigate(`/report/${report.id}`)}
                  className="bg-surface rounded-[24px] border border-border p-5 shadow-sm hover:shadow-hover transition-all cursor-pointer flex flex-col sm:flex-row gap-5 items-start sm:items-center group"
                >
                  <img src={report.photoUrl} alt="Waste" className="w-full sm:w-32 h-32 sm:h-24 object-cover rounded-2xl shrink-0" />
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${report.severity === 'high' ? 'bg-danger-soft text-danger' : 'bg-warn-soft text-warn'}`}>
                        {report.severity} Priority
                      </span>
                      <span className="text-[11px] text-text-muted flex items-center"><Clock className="w-3 h-3 mr-1"/> {new Date(report.createdAt).toLocaleDateString()}</span>
                    </div>
                    <h3 className="font-bold text-ink text-lg truncate mb-1 capitalize">{report.wasteType.replace('_', ' ')} Waste</h3>
                    <p className="text-sm text-text-muted truncate flex items-center mb-4 sm:mb-0"><MapPin className="w-3.5 h-3.5 mr-1 shrink-0"/> {report.location.address}</p>
                  </div>
                  
                  <div className="w-full sm:w-auto flex flex-row sm:flex-col gap-2 shrink-0">
                    {report.status === 'reported' ? (
                      <Button size="sm" onClick={(e) => handleAccept(e, report.id)} className="w-full sm:w-auto">
                        Accept Task
                      </Button>
                    ) : (
                      <Button size="sm" variant="soft" onClick={(e) => { e.stopPropagation(); navigate(`/org/report/${report.id}/proof`); }} className="w-full sm:w-auto">
                        Submit Proof
                      </Button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right: Charts & Actions */}
        <div className="space-y-6">
          <div className="bg-surface rounded-[32px] border border-border p-6 shadow-sm">
            <h2 className="text-lg font-bold text-ink flex items-center mb-6">
              <TrendingUp className="w-5 h-5 mr-2 text-brand-500" /> Weekly Activity
            </h2>
            
            <div className="h-[200px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 5, right: 0, left: -25, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorCleanups" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#34B27B" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#34B27B" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E4EEE9" />
                  <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: '#7A8F87', fontSize: 11 }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#7A8F87', fontSize: 11 }} />
                  <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }} />
                  <Area type="monotone" dataKey="cleanups" stroke="#34B27B" fillOpacity={1} fill="url(#colorCleanups)" strokeWidth={3} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-gradient-to-br from-brand-100 to-aqua/20 rounded-[32px] border border-brand-500/20 p-6 shadow-sm">
            <h3 className="font-display font-bold text-ink text-lg mb-2">Ready for a drive?</h3>
            <p className="text-sm text-text-muted mb-4">You have 12 active tasks in your queue. Assign teams and head out!</p>
            <Button className="w-full bg-white text-brand-600 hover:bg-surface-2 border border-brand-100" rightIcon={<ChevronRight className="w-4 h-4"/>}>
              View Route Map
            </Button>
          </div>
        </div>

      </div>
    </div>
  );
}
