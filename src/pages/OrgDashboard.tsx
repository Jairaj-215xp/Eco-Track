import React, { useState, useEffect } from 'react';
import { reportService } from '../services/reportService';
import { Report } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { MapPin, Clock, AlertTriangle, CheckCircle, ChevronRight, TrendingUp, Sparkles, Send } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { useNavigate } from 'react-router-dom';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export function OrgDashboard() {
  const [reports, setReports] = useState<Report[]>([]);
  const { user } = useAuth();
  const navigate = useNavigate();

  const loadData = () => {
    reportService.getReports().then(setReports);
  };

  useEffect(() => {
    loadData();
  }, []);

  const urgentReports = reports.filter(r => r.status === 'reported' || r.status === 'in_progress');
  const activeTasksCount = urgentReports.length;
  const totalCleanedCount = reports.filter(r => r.status === 'verified').length;

  // Build dynamic 7-day cleanup chart from real report timestamps
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const todayIdx = new Date().getDay();
  const chartData = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const dayLabel = days[d.getDay()];
    const dateStr = d.toISOString().split('T')[0];

    const cleanupsOnDay = reports.filter(r => 
      r.status === 'verified' && r.updatedAt && r.updatedAt.startsWith(dateStr)
    ).length;

    return {
      day: dayLabel,
      cleanups: cleanupsOnDay
    };
  });

  const handleAccept = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    await reportService.updateReportStatus(id, 'in_progress', user?.orgId || user?.id, user?.name);
    loadData();
  };

  return (
    <div className="bg-background min-h-[calc(100vh-96px)] font-sans pb-24">
      {/* Header */}
      <div className="bg-surface border-b border-border py-8">
        <div className="max-w-[1200px] mx-auto px-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <p className="text-xs font-bold text-brand-600 mb-1 tracking-wider uppercase">Organisation Workspace</p>
              <h1 className="text-2xl md:text-3xl font-display font-extrabold text-ink">
                Welcome back, {user?.name || 'Cleanup Organization'}! 👋
              </h1>
              <p className="text-text-muted text-xs mt-1">Real-time task dispatch and Open Vision verification queue.</p>
            </div>
            
            <div className="flex space-x-3">
              <div className="bg-brand-50 rounded-2xl px-5 py-3 border border-brand-500/20 shadow-xs">
                <p className="text-[10px] font-bold text-text-muted mb-0.5 uppercase tracking-wider">Active Tasks</p>
                <p className="text-2xl font-display font-bold text-brand-600">{activeTasksCount}</p>
              </div>
              <div className="bg-surface-2 rounded-2xl px-5 py-3 border border-border shadow-xs">
                <p className="text-[10px] font-bold text-text-muted mb-0.5 uppercase tracking-wider">Total Verified</p>
                <p className="text-2xl font-display font-bold text-ink">{totalCleanedCount}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-[1200px] mx-auto px-6 pt-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left: Urgent Reports */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-ink flex items-center">
              <AlertTriangle className="w-4 h-4 mr-2 text-warn" /> Task Dispatch Queue ({urgentReports.length})
            </h2>
          </div>

          <div className="space-y-4">
            {urgentReports.length === 0 ? (
              <div className="bg-surface rounded-[24px] border border-border p-12 text-center shadow-xs">
                <CheckCircle className="w-10 h-10 text-brand-500 mx-auto mb-3" />
                <h3 className="font-bold text-ink mb-1 text-base">All caught up! 🎉</h3>
                <p className="text-xs text-text-muted">No open or pending garbage reports requiring cleanup right now.</p>
              </div>
            ) : (
              urgentReports.map(report => (
                <div 
                  key={report.id}
                  onClick={() => navigate(`/report/${report.id}`)}
                  className="bg-surface rounded-[24px] border border-border p-4 shadow-xs hover:shadow-soft transition-all cursor-pointer flex flex-col sm:flex-row gap-4 items-start sm:items-center group"
                >
                  <img src={report.photoUrl} alt="Waste" className="w-full sm:w-28 h-28 sm:h-20 object-cover rounded-xl shrink-0 bg-surface-2" />
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${
                        report.severity === 'high' ? 'bg-danger-soft text-danger' : 
                        report.severity === 'medium' ? 'bg-warn-soft text-warn' : 'bg-brand-50 text-brand-600'
                      }`}>
                        {report.severity} Priority
                      </span>
                      <span className="text-[10px] text-text-muted flex items-center">
                        <Clock className="w-3 h-3 mr-1"/> {new Date(report.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <h3 className="font-bold text-ink text-base truncate capitalize mb-0.5">
                      {report.wasteType.replace('_', ' ')} Waste
                    </h3>
                    <p className="text-xs text-text-muted truncate flex items-center">
                      <MapPin className="w-3 h-3 mr-1 shrink-0 text-brand-500"/> {report.location.address}
                    </p>
                  </div>
                  
                  <div className="w-full sm:w-auto flex flex-row sm:flex-col gap-2 shrink-0">
                    {report.status === 'reported' ? (
                      <Button size="sm" onClick={(e) => handleAccept(e, report.id)} className="w-full sm:w-auto text-xs py-1.5">
                        Claim Task
                      </Button>
                    ) : (
                      <Button 
                        size="sm" 
                        variant="soft" 
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/org/report/${report.id}/proof`);
                        }} 
                        className="w-full sm:w-auto text-xs py-1.5 bg-brand-50 text-brand-700 hover:bg-brand-100"
                        leftIcon={<Send className="w-3.5 h-3.5" />}
                      >
                        Submit Proof
                      </Button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right: Real Analytics */}
        <div className="space-y-6">
          <div className="bg-surface rounded-[24px] border border-border p-6 shadow-xs">
            <h3 className="font-bold text-ink text-sm flex items-center mb-4">
              <TrendingUp className="w-4 h-4 mr-2 text-brand-500" /> Weekly Verified Cleanups
            </h3>
            
            <div className="h-[200px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorCleanups" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#34B27B" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#34B27B" stopOpacity={0.0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748B' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748B' }} allowDecimals={false} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: '1px solid #E2E8F0', fontSize: '11px' }}
                  />
                  <Area type="monotone" dataKey="cleanups" stroke="#34B27B" strokeWidth={2} fillOpacity={1} fill="url(#colorCleanups)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            
            <p className="text-[11px] text-text-muted mt-3 text-center">
              Generated from real Supabase resolution events.
            </p>
          </div>

          <div className="bg-brand-50 rounded-[24px] border border-brand-500/20 p-5">
            <div className="flex items-center space-x-2 text-brand-700 font-bold text-xs mb-2">
              <Sparkles className="w-4 h-4" />
              <span>AI Verification Protocol</span>
            </div>
            <p className="text-xs text-brand-900 leading-relaxed">
              When submitting cleanup proof, the Open Vision model analyzes structural similarity and calculates waste clearance percentage. Ensure your photo captures the same background anchors as the initial report.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}
