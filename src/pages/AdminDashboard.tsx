import React, { useState, useEffect } from 'react';
import { reportService } from '../services/reportService';
import { Report, Organisation, Status } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { 
  ShieldCheck, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  MapPin, 
  Trash2, 
  Users, 
  Building, 
  Send, 
  Search, 
  Filter, 
  XCircle, 
  ChevronRight, 
  TrendingUp, 
  Sparkles,
  ArrowRight,
  RefreshCw,
  ExternalLink
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { useNavigate } from 'react-router-dom';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import { useAlert } from '../contexts/AlertContext';

export function AdminDashboard() {
  const [reports, setReports] = useState<Report[]>([]);
  const [orgs, setOrgs] = useState<Organisation[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'dispatch' | 'proofs' | 'orgs' | 'analytics'>('dispatch');
  
  // Filters for dispatch tab
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Review modal state
  const [selectedProofReport, setSelectedProofReport] = useState<Report | null>(null);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewing, setReviewing] = useState(false);

  const { user } = useAuth();
  const { showAlert, showConfirm } = useAlert();
  const navigate = useNavigate();

  const loadData = async () => {
    setLoading(true);
    const [allReports, allOrgs] = await Promise.all([
      reportService.getReports(),
      reportService.getOrganisations()
    ]);
    setReports(allReports);
    setOrgs(allOrgs);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const showNotification = (msg: string, type: 'success' | 'info' | 'warning' | 'error' = 'success') => {
    showAlert(msg, type);
  };

  // Metrics
  const totalIncidents = reports.length;
  const unassignedCount = reports.filter(r => r.status === 'reported').length;
  const inProgressCount = reports.filter(r => r.status === 'in_progress' || r.status === 'assigned').length;
  const proofSubmittedCount = reports.filter(r => r.status === 'proof_submitted').length;
  const verifiedCount = reports.filter(r => r.status === 'verified').length;

  const avgCleanliness = reports.length > 0 
    ? Math.round(reports.reduce((acc, r) => acc + (r.aiAnalysis?.cleanlinessScore || 45), 0) / reports.length)
    : 72;

  // Handlers
  const handleAssignOrg = async (reportId: string, orgId: string) => {
    const targetOrg = orgs.find(o => o.id === orgId);
    if (!targetOrg) return;
    await reportService.assignReportToOrg(reportId, targetOrg.id, targetOrg.name, user?.name || 'City Administrator');
    showNotification(`Assigned task to ${targetOrg.name}`);
    loadData();
  };

  const handleUnassign = async (reportId: string) => {
    await reportService.unassignReport(reportId, user?.name || 'City Administrator');
    showNotification('Task unassigned and returned to open dispatch queue', 'info');
    loadData();
  };

  const handleReviewProof = async (decision: 'verified' | 'reopened') => {
    if (!selectedProofReport) return;
    setReviewing(true);
    const comment = reviewComment.trim() || (decision === 'verified' ? 'Cleanup verified and approved by Municipal Authority.' : 'Cleanup rejected. Residual debris observed; re-cleaning required.');
    await reportService.adminReviewProof(selectedProofReport.id, decision, comment, user?.name || 'City Administrator');
    setReviewing(false);
    setSelectedProofReport(null);
    setReviewComment('');
    showNotification(`Report #${selectedProofReport.id.slice(0, 8)} marked as ${decision.toUpperCase()}`);
    loadData();
  };

  const handleDeleteReport = (reportId: string) => {
    showConfirm({
      title: 'Delete Incident Report?',
      message: 'Are you sure you want to delete this incident report? This action is permanent and will remove all logged photos, AI telemetry, and timeline records.',
      confirmText: 'Delete Report',
      type: 'danger',
      onConfirm: async () => {
        await reportService.deleteReport(reportId);
        showNotification('Report permanently removed from database', 'info');
        loadData();
      }
    });
  };

  const handleToggleOrg = async (orgId: string) => {
    const updated = await reportService.toggleOrgApproval(orgId);
    setOrgs(updated);
    showNotification('Organisation approval status updated');
  };

  // Filtered reports for dispatch
  const filteredReports = reports.filter(r => {
    if (statusFilter !== 'all' && r.status !== statusFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchAddr = r.location.address.toLowerCase().includes(q);
      const matchType = r.wasteType.toLowerCase().includes(q);
      const matchOrg = (r.assignedOrgName || '').toLowerCase().includes(q);
      if (!matchAddr && !matchType && !matchOrg) return false;
    }
    return true;
  });

  // Proof review queue (proof_submitted or recently verified)
  const proofReviewQueue = reports.filter(r => r.status === 'proof_submitted' || (r.status === 'verified' && r.proof));

  // Analytics Chart Data
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const chartData = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const dayLabel = days[d.getDay()];
    const dateStr = d.toISOString().split('T')[0];

    const cleanups = reports.filter(r => 
      r.status === 'verified' && r.updatedAt && r.updatedAt.startsWith(dateStr)
    ).length;

    const logged = reports.filter(r => 
      r.createdAt && r.createdAt.startsWith(dateStr)
    ).length;

    return {
      day: dayLabel,
      verified: cleanups,
      reported: logged
    };
  });

  const categoryCounts = [
    { name: 'Plastic', count: reports.filter(r => r.wasteType === 'plastic').length, fill: '#34B27B' },
    { name: 'Organic', count: reports.filter(r => r.wasteType === 'organic').length, fill: '#F59E0B' },
    { name: 'Construction', count: reports.filter(r => r.wasteType === 'construction').length, fill: '#EF4444' },
    { name: 'Household', count: reports.filter(r => r.wasteType === 'household').length, fill: '#6366F1' },
    { name: 'Near Water', count: reports.filter(r => r.wasteType === 'near_water').length, fill: '#06B6D4' }
  ];

  return (
    <div className="bg-background min-h-screen font-sans pb-24">
      {/* Toast Notification */}
      <AnimatePresence>
        {actionSuccess && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-20 right-6 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-xl shadow-lg border border-white/10 text-xs font-bold flex items-center space-x-2"
          >
            <CheckCircle className="w-4 h-4 text-brand-400" />
            <span>{actionSuccess}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header Banner */}
      <div className="bg-surface border-b border-border py-8">
        <div className="max-w-[1300px] mx-auto px-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <div className="flex items-center space-x-2 text-indigo-600 font-bold text-xs uppercase tracking-wider mb-1">
                <ShieldCheck className="w-4 h-4" />
                <span>City Municipal Control Center</span>
              </div>
              <h1 className="text-2xl md:text-3xl font-display font-extrabold text-ink">
                Admin Command Hub
              </h1>
              <p className="text-text-muted text-xs mt-1">
                Citywide waste dispatch, NGO contractor oversight, and AI verification approval.
              </p>
            </div>

            <div className="flex flex-wrap gap-2.5">
              <div className="bg-surface-2 rounded-2xl px-4 py-2.5 border border-border">
                <span className="text-[10px] font-bold text-text-muted uppercase block">Total Incidents</span>
                <span className="text-xl font-bold text-ink">{totalIncidents}</span>
              </div>
              <div className="bg-coral/10 rounded-2xl px-4 py-2.5 border border-coral/20">
                <span className="text-[10px] font-bold text-coral uppercase block">Unassigned</span>
                <span className="text-xl font-bold text-coral">{unassignedCount}</span>
              </div>
              <div className="bg-sun/10 rounded-2xl px-4 py-2.5 border border-sun/20">
                <span className="text-[10px] font-bold text-warn uppercase block">In Progress</span>
                <span className="text-xl font-bold text-warn">{inProgressCount}</span>
              </div>
              <div className="bg-brand-50 rounded-2xl px-4 py-2.5 border border-brand-500/20">
                <span className="text-[10px] font-bold text-brand-700 uppercase block">Proof Review</span>
                <span className="text-xl font-bold text-brand-600">{proofSubmittedCount}</span>
              </div>
              <div className="bg-indigo-50 rounded-2xl px-4 py-2.5 border border-indigo-200">
                <span className="text-[10px] font-bold text-indigo-700 uppercase block">City Cleanliness</span>
                <span className="text-xl font-bold text-indigo-700">{avgCleanliness}/100</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Navigation Tabs */}
      <div className="max-w-[1300px] mx-auto px-6 pt-6">
        <div className="flex border-b border-border space-x-2 overflow-x-auto">
          {[
            { id: 'dispatch', label: 'Task Dispatch & Queue', count: unassignedCount + inProgressCount },
            { id: 'proofs', label: 'Proof Verification Review', count: proofSubmittedCount, alert: proofSubmittedCount > 0 },
            { id: 'orgs', label: 'Registered NGOs & Crews', count: orgs.length },
            { id: 'analytics', label: 'Citywide Analytics & Wards' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`pb-3 px-4 text-xs font-bold border-b-2 transition-all flex items-center space-x-2 shrink-0 ${
                activeTab === tab.id 
                  ? 'border-brand-500 text-brand-600 font-extrabold' 
                  : 'border-transparent text-text-muted hover:text-ink'
              }`}
            >
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  tab.alert 
                    ? 'bg-danger text-white animate-pulse' 
                    : activeTab === tab.id ? 'bg-brand-100 text-brand-700' : 'bg-surface-2 text-text-muted'
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* TAB 1: TASK DISPATCH & QUEUE */}
        {activeTab === 'dispatch' && (
          <div className="pt-6 space-y-4">
            {/* Control Bar */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-surface p-3 rounded-2xl border border-border shadow-xs">
              <div className="flex items-center space-x-2 flex-1 w-full sm:w-auto">
                <div className="relative flex-1 sm:max-w-xs">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                  <input 
                    type="text" 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search address, type, or org..."
                    className="w-full bg-surface-2 border border-border pl-8 pr-3 py-1.5 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-brand-500"
                  />
                </div>
                <button 
                  onClick={loadData}
                  className="p-2 hover:bg-surface-2 rounded-xl text-text-muted hover:text-ink transition-colors"
                  title="Refresh"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>

              {/* Status Filter Chips */}
              <div className="flex flex-wrap gap-1 text-[11px]">
                {[
                  { id: 'all', label: 'All Incidents' },
                  { id: 'reported', label: 'Unassigned' },
                  { id: 'in_progress', label: 'In Progress' },
                  { id: 'proof_submitted', label: 'Proof Submitted' },
                  { id: 'verified', label: 'Verified' }
                ].map(s => (
                  <button
                    key={s.id}
                    onClick={() => setStatusFilter(s.id)}
                    className={`px-3 py-1 rounded-lg font-semibold transition-colors ${
                      statusFilter === s.id 
                        ? 'bg-brand-500 text-white' 
                        : 'bg-surface-2 text-text-muted hover:text-ink'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Tasks Table / Cards */}
            <div className="space-y-3">
              {filteredReports.length === 0 ? (
                <div className="bg-surface rounded-2xl border border-border p-12 text-center">
                  <CheckCircle className="w-10 h-10 text-brand-500 mx-auto mb-2" />
                  <p className="text-sm font-bold text-ink">No reports match your current filter.</p>
                  <p className="text-xs text-text-muted mt-1">Adjust search query or view all incidents.</p>
                </div>
              ) : (
                filteredReports.map(report => (
                  <div 
                    key={report.id}
                    className="bg-surface rounded-2xl border border-border p-4 shadow-xs hover:shadow-soft transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    <div className="flex items-start sm:items-center space-x-3.5 flex-1 min-w-0">
                      <img 
                        src={report.photoUrl} 
                        alt="Thumbnail" 
                        className="w-16 h-16 rounded-xl object-cover shrink-0 bg-surface-2 cursor-pointer hover:opacity-90"
                        onClick={() => navigate(`/report/${report.id}`)}
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            report.status === 'verified' ? 'bg-success-soft text-success' :
                            report.status === 'in_progress' ? 'bg-sun/15 text-warn' :
                            report.status === 'proof_submitted' ? 'bg-brand-50 text-brand-700' :
                            'bg-coral/10 text-coral'
                          }`}>
                            {report.status.replace('_', ' ')}
                          </span>

                          <span className="text-[10px] text-text-muted capitalize font-medium">
                            {report.wasteType.replace('_', ' ')}
                          </span>

                          <span className="text-[10px] text-text-muted">
                            Cleanliness: {report.aiAnalysis?.cleanlinessScore || 45}/100
                          </span>

                          <span className="text-[10px] text-text-muted">
                            {new Date(report.createdAt).toLocaleDateString()}
                          </span>
                        </div>

                        <p className="text-xs font-bold text-ink truncate flex items-center">
                          <MapPin className="w-3.5 h-3.5 mr-1 text-brand-500 shrink-0" />
                          {report.location.address}
                        </p>

                        <p className="text-[11px] text-text-muted truncate mt-0.5">
                          {report.assignedOrgName ? (
                            <span className="text-brand-700 font-bold">Assigned to: {report.assignedOrgName}</span>
                          ) : (
                            <span className="text-coral font-bold">Needs Assignment • Unassigned</span>
                          )}
                        </p>
                      </div>
                    </div>

                    {/* Admin Actions */}
                    <div className="flex items-center space-x-2 shrink-0 border-t md:border-t-0 pt-2 md:pt-0">
                      {/* Assign Org Dropdown */}
                      <div className="relative">
                        <select
                          value={report.assignedOrgId || ''}
                          onChange={(e) => handleAssignOrg(report.id, e.target.value)}
                          className="bg-surface-2 border border-border text-xs rounded-xl px-2.5 py-1.5 font-bold text-ink focus:outline-none focus:ring-1 focus:ring-brand-500 cursor-pointer"
                        >
                          <option value="" disabled>Assign Cleanup Crew...</option>
                          {orgs.map(o => (
                            <option key={o.id} value={o.id}>
                              {o.name} ({o.type === 'municipal' ? 'PMC' : 'NGO'})
                            </option>
                          ))}
                        </select>
                      </div>

                      {report.assignedOrgId && report.status !== 'verified' && (
                        <button
                          onClick={() => handleUnassign(report.id)}
                          className="p-1.5 text-text-muted hover:text-coral rounded-lg hover:bg-coral/10 transition-colors text-xs font-medium"
                          title="Release back to unassigned queue"
                        >
                          Unassign
                        </button>
                      )}

                      {report.status === 'proof_submitted' && (
                        <Button 
                          size="sm" 
                          onClick={() => setSelectedProofReport(report)}
                          className="text-xs py-1 px-3 bg-brand-500 text-white"
                        >
                          Review Proof
                        </Button>
                      )}

                      <button
                        onClick={() => navigate(`/report/${report.id}`)}
                        className="p-1.5 text-text-muted hover:text-ink rounded-lg hover:bg-surface-2 transition-colors"
                        title="View Full Report"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => handleDeleteReport(report.id)}
                        className="p-1.5 text-text-muted hover:text-danger rounded-lg hover:bg-danger-soft transition-colors"
                        title="Delete Incident"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* TAB 2: PROOF VERIFICATION REVIEW */}
        {activeTab === 'proofs' && (
          <div className="pt-6 space-y-6">
            <div className="bg-brand-50 rounded-2xl p-4 border border-brand-500/20 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-brand-800">Cleanup Proof Verification Queue</p>
                <p className="text-[11px] text-brand-700 mt-0.5">
                  Inspect before-and-after imagery submitted by cleanup crews. Approve to mark officially verified or reopen if residual debris was left.
                </p>
              </div>
              <span className="px-3 py-1 bg-brand-500 text-white text-xs font-bold rounded-xl shrink-0">
                {proofReviewQueue.length} In Queue
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {proofReviewQueue.length === 0 ? (
                <div className="md:col-span-2 bg-surface rounded-2xl border border-border p-12 text-center">
                  <CheckCircle className="w-12 h-12 text-success mx-auto mb-2" />
                  <p className="text-base font-bold text-ink">All Cleanup Proofs Reviewed!</p>
                  <p className="text-xs text-text-muted mt-1">No pending cleanup proofs requiring municipal inspection right now.</p>
                </div>
              ) : (
                proofReviewQueue.map(report => (
                  <div key={report.id} className="bg-surface rounded-3xl border border-border p-5 shadow-xs flex flex-col justify-between space-y-4">
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          report.status === 'verified' ? 'bg-success text-white' : 'bg-sun text-ink animate-pulse'
                        }`}>
                          {report.status.replace('_', ' ')}
                        </span>
                        <span className="text-xs text-text-muted">
                          By: <strong className="text-ink">{report.assignedOrgName || 'Cleanup Partner'}</strong>
                        </span>
                      </div>

                      {/* Before / After Preview Side-by-Side */}
                      <div className="grid grid-cols-2 gap-2 rounded-2xl overflow-hidden bg-surface-2 p-1.5 border border-border">
                        <div className="relative aspect-[4/3] rounded-xl overflow-hidden">
                          <img src={report.photoUrl} alt="Before" className="w-full h-full object-cover" />
                          <span className="absolute bottom-1 left-1 bg-coral text-white text-[9px] font-bold px-1.5 py-0.5 rounded">Before</span>
                        </div>
                        <div className="relative aspect-[4/3] rounded-xl overflow-hidden">
                          <img src={report.proof?.mediaUrl || report.photoUrl} alt="After" className="w-full h-full object-cover" />
                          <span className="absolute bottom-1 left-1 bg-success text-white text-[9px] font-bold px-1.5 py-0.5 rounded">After Proof</span>
                        </div>
                      </div>

                      <div className="mt-3">
                        <p className="text-xs font-bold text-ink truncate">{report.location.address}</p>
                        {report.proof?.verification && (
                          <div className="mt-2 p-2.5 bg-brand-50 rounded-xl border border-brand-500/15 text-[11px] text-brand-900 space-y-1">
                            <p className="font-bold flex items-center">
                              <Sparkles className="w-3.5 h-3.5 mr-1 text-brand-600" /> Open Vision AI Verification Score:
                            </p>
                            <div className="flex gap-2">
                              <span>Waste Cleared: <strong>{report.proof.verification.wasteReductionPercent}%</strong></span>
                              <span>Visual Match: <strong>{report.proof.verification.locationMatchScore}%</strong></span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-2 pt-2 border-t border-border">
                      <Button
                        size="sm"
                        onClick={() => setSelectedProofReport(report)}
                        className="flex-1 text-xs py-1.5 bg-brand-500 text-white"
                        leftIcon={<CheckCircle className="w-3.5 h-3.5" />}
                      >
                        Inspect & Verify
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => navigate(`/report/${report.id}`)}
                        className="text-xs py-1.5"
                      >
                        Details
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* TAB 3: REGISTERED NGOS & CREWS */}
        {activeTab === 'orgs' && (
          <div className="pt-6 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-ink">Authorized Cleanup Organizations</h3>
                <p className="text-xs text-text-muted">Certified NGOs and municipal contractor divisions dispatching sanitation teams.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {orgs.map(org => (
                <div key={org.id} className="bg-surface rounded-2xl border border-border p-5 shadow-xs flex items-start justify-between">
                  <div className="space-y-1.5">
                    <div className="flex items-center space-x-2">
                      <span className={`w-2.5 h-2.5 rounded-full ${org.approved ? 'bg-success' : 'bg-coral'}`} />
                      <h4 className="font-bold text-ink text-sm">{org.name}</h4>
                      <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-md ${
                        org.type === 'municipal' ? 'bg-indigo-100 text-indigo-700' : 'bg-brand-100 text-brand-700'
                      }`}>
                        {org.type}
                      </span>
                    </div>

                    <p className="text-xs text-text-muted flex items-center">
                      <MapPin className="w-3.5 h-3.5 mr-1 text-brand-500" /> {org.serviceArea}
                    </p>

                    <p className="text-xs text-text-muted">
                      Contact: <span className="text-ink font-semibold">{org.contactEmail}</span>
                    </p>

                    <div className="flex gap-4 pt-2 text-xs">
                      <div>
                        <span className="text-text-muted text-[10px] uppercase font-bold block">Active Tasks</span>
                        <span className="font-bold text-warn text-sm">{org.activeTasksCount || 0}</span>
                      </div>
                      <div>
                        <span className="text-text-muted text-[10px] uppercase font-bold block">Verified Cleanups</span>
                        <span className="font-bold text-success text-sm">{org.completedTasksCount || 0}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col items-end space-y-2">
                    <button
                      onClick={() => handleToggleOrg(org.id)}
                      className={`text-xs font-bold px-3 py-1 rounded-xl transition-colors ${
                        org.approved ? 'bg-coral/10 text-coral hover:bg-coral/20' : 'bg-success-soft text-success hover:bg-success/20'
                      }`}
                    >
                      {org.approved ? 'Suspend Partner' : 'Approve Partner'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 4: CITYWIDE ANALYTICS */}
        {activeTab === 'analytics' && (
          <div className="pt-6 space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Resolution velocity chart */}
              <div className="bg-surface rounded-3xl border border-border p-6 shadow-xs">
                <h4 className="font-bold text-ink text-sm flex items-center mb-1">
                  <TrendingUp className="w-4 h-4 mr-2 text-brand-500" /> Weekly Incident vs Cleanup Velocity
                </h4>
                <p className="text-xs text-text-muted mb-4">Comparing new citizen reports vs verified NGO resolutions.</p>
                <div className="h-[240px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                      <defs>
                        <linearGradient id="colorVerified" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#34B27B" stopOpacity={0.4}/>
                          <stop offset="95%" stopColor="#34B27B" stopOpacity={0.0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                      <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748B' }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748B' }} allowDecimals={false} />
                      <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #E2E8F0', fontSize: '11px' }} />
                      <Area type="monotone" dataKey="reported" stroke="#EF4444" strokeWidth={2} fillOpacity={0.1} fill="#EF4444" name="Logged" />
                      <Area type="monotone" dataKey="verified" stroke="#34B27B" strokeWidth={2} fillOpacity={1} fill="url(#colorVerified)" name="Cleaned" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Category distribution */}
              <div className="bg-surface rounded-3xl border border-border p-6 shadow-xs">
                <h4 className="font-bold text-ink text-sm flex items-center mb-1">
                  <Trash2 className="w-4 h-4 mr-2 text-brand-500" /> Waste Material Saliency Breakdown
                </h4>
                <p className="text-xs text-text-muted mb-4">Classified materials by Open Vision AI across all city reports.</p>
                <div className="h-[240px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={categoryCounts}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748B' }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748B' }} allowDecimals={false} />
                      <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #E2E8F0', fontSize: '11px' }} />
                      <Bar dataKey="count" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Proof Review Modal */}
      {selectedProofReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/75 backdrop-blur-sm">
          <div className="bg-surface rounded-[28px] max-w-2xl w-full border border-border shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div>
                <h3 className="font-display font-bold text-lg text-ink">Review Cleanup Verification</h3>
                <p className="text-xs text-text-muted">{selectedProofReport.location.address}</p>
              </div>
              <button 
                onClick={() => setSelectedProofReport(null)}
                className="text-text-muted hover:text-ink p-1 rounded-full hover:bg-surface-2"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-coral uppercase block">Reported Before</span>
                <img src={selectedProofReport.photoUrl} alt="Before" className="w-full h-44 object-cover rounded-2xl bg-surface-2" />
              </div>
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-success uppercase block">Submitted Cleanup Proof</span>
                <img src={selectedProofReport.proof?.mediaUrl || selectedProofReport.photoUrl} alt="After" className="w-full h-44 object-cover rounded-2xl bg-surface-2" />
              </div>
            </div>

            {selectedProofReport.proof?.verification && (
              <div className="p-3 bg-brand-50 rounded-2xl border border-brand-500/20 text-xs text-brand-900">
                <p className="font-bold flex items-center mb-1">
                  <Sparkles className="w-3.5 h-3.5 mr-1 text-brand-600" /> Open Vision Verification:
                </p>
                <p>{selectedProofReport.proof.verification.analysisSummary}</p>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-ink mb-1">Administrator Review Remarks (Optional)</label>
              <textarea
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
                placeholder="e.g. Verified thoroughly cleaned. Debris fully cleared from sidewalk."
                className="w-full bg-surface-2 border border-border rounded-xl p-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-brand-500"
                rows={2}
              />
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                variant="danger"
                onClick={() => handleReviewProof('reopened')}
                disabled={reviewing}
                className="flex-1 text-xs py-2 bg-coral hover:bg-coral/90 text-white"
                leftIcon={<XCircle className="w-4 h-4" />}
              >
                Reject & Reopen Task
              </Button>
              <Button
                onClick={() => handleReviewProof('verified')}
                disabled={reviewing}
                className="flex-1 text-xs py-2 bg-brand-500 hover:bg-brand-600 text-white"
                leftIcon={<CheckCircle className="w-4 h-4" />}
              >
                Approve & Certify Cleanup
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
