import React, { useState, useEffect } from 'react';
import { reportService } from '../services/reportService';
import { Report } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { 
  MapPin, 
  Clock, 
  AlertTriangle, 
  CheckCircle, 
  ChevronRight, 
  TrendingUp, 
  Sparkles, 
  Send,
  Trash2,
  Users,
  Layers,
  Search,
  Filter,
  Check,
  RotateCcw,
  ExternalLink,
  Phone,
  Building
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { useNavigate } from 'react-router-dom';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import { useAlert } from '../contexts/AlertContext';

export function OrgDashboard() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'active_tasks' | 'available' | 'verified' | 'analytics'>('active_tasks');
  const [searchQuery, setSearchQuery] = useState('');
  const [wasteFilter, setWasteFilter] = useState('all');
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const { user } = useAuth();
  const { showAlert, showConfirm } = useAlert();
  const navigate = useNavigate();

  const loadData = async () => {
    setLoading(true);
    const data = await reportService.getReports();
    setReports(data);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const showToast = (msg: string, type: 'success' | 'info' | 'warning' | 'error' = 'success') => {
    showAlert(msg, type);
  };

  // NGO identity
  const currentOrgId = user?.orgId || (user?.name?.toLowerCase().includes('green earth') || !user?.name ? 'org_green_earth' : `org_${user?.name.toLowerCase().replace(/[^a-z0-9]/g, '_')}`);
  const currentOrgName = user?.name || 'Green Earth Foundation';

  // Task classifications
  // 1. Active Tasks (Accepted by Me): Assigned to this NGO and in progress / proof submitted
  const myAcceptedTasks = reports.filter(r => {
    const isMine = Boolean(
      (currentOrgId && r.assignedOrgId === currentOrgId) ||
      (user?.name && r.assignedOrgName && r.assignedOrgName.toLowerCase() === user.name.toLowerCase())
    );
    const isActive = (r.status === 'in_progress' || r.status === 'assigned' || r.status === 'proof_submitted');
    return isMine && isActive;
  });

  // 2. Available Dispatch Queue: Unassigned reported spots that any crew can claim
  const availableQueue = reports.filter(r => 
    r.status === 'reported' && !r.assignedOrgId
  );

  // 3. Completed & Verified by this NGO
  const myCompletedTasks = reports.filter(r => {
    const isMine = Boolean(
      (currentOrgId && r.assignedOrgId === currentOrgId) ||
      (user?.name && r.assignedOrgName && r.assignedOrgName.toLowerCase() === user.name.toLowerCase())
    );
    return isMine && r.status === 'verified';
  });

  // Handlers
  const handleClaimTask = async (reportId: string) => {
    await reportService.assignReportToOrg(reportId, currentOrgId, currentOrgName, currentOrgName);
    showToast(`Task claimed! Moved to Active Tasks (Accepted by Me).`, 'success');
    await loadData();
    setActiveTab('active_tasks');
  };

  const handleReleaseTask = (reportId: string) => {
    showConfirm({
      title: 'Release Task to Open Queue?',
      message: 'Are you sure you want to release this task? It will be returned to the open municipal dispatch queue so other sanitation crews and NGOs can claim it.',
      confirmText: 'Yes, Release Task',
      type: 'warning',
      onConfirm: async () => {
        await reportService.unassignReport(reportId, currentOrgName);
        showToast('Task released back to public dispatch queue.', 'info');
        loadData();
      }
    });
  };

  // Filter tasks based on search & category
  const filterList = (list: Report[]) => {
    return list.filter(r => {
      if (wasteFilter !== 'all' && r.wasteType !== wasteFilter) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matchAddr = r.location.address.toLowerCase().includes(q);
        const matchType = r.wasteType.toLowerCase().includes(q);
        const matchItems = (r.aiAnalysis?.detectedItems || []).some(item => item.toLowerCase().includes(q));
        if (!matchAddr && !matchType && !matchItems) return false;
      }
      return true;
    });
  };

  // Chart data
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const chartData = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const dayLabel = days[d.getDay()];
    const dateStr = d.toISOString().split('T')[0];

    const cleanups = reports.filter(r => 
      r.status === 'verified' && 
      (r.assignedOrgId === currentOrgId || r.assignedOrgName === currentOrgName) &&
      r.updatedAt && r.updatedAt.startsWith(dateStr)
    ).length;

    return {
      day: dayLabel,
      cleanups
    };
  });

  return (
    <div className="bg-background min-h-screen font-sans pb-24">

      {/* Header Banner */}
      <div className="bg-surface border-b border-border py-8">
        <div className="max-w-[1250px] mx-auto px-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <div className="flex items-center space-x-2 text-brand-600 font-bold text-xs uppercase tracking-wider mb-1">
                <Users className="w-4 h-4" />
                <span>NGO & Sanitation Field Operations</span>
              </div>
              <h1 className="text-2xl md:text-3xl font-display font-extrabold text-ink">
                {currentOrgName} Workspace
              </h1>
              <p className="text-text-muted text-xs mt-1">
                Claim waste incidents, dispatch field cleanup crews, and submit Open Vision AI proofs.
              </p>
              
              {/* Registered NGO details */}
              <div className="flex flex-wrap items-center gap-2 mt-2.5">
                {user?.orgServiceArea && (
                  <span className="inline-flex items-center text-xs font-semibold text-text-muted bg-surface-2 border border-border px-3 py-1 rounded-full shadow-2xs">
                    <MapPin className="w-3.5 h-3.5 mr-1 text-brand-500" />
                    Base Area: <strong className="text-ink ml-1">{user.orgServiceArea}</strong>
                  </span>
                )}
                {user?.crewSize && (
                  <span className="inline-flex items-center text-xs font-semibold text-text-muted bg-surface-2 border border-border px-3 py-1 rounded-full shadow-2xs">
                    <Users className="w-3.5 h-3.5 mr-1 text-aqua-600" />
                    Crew: <strong className="text-ink ml-1">{user.crewSize}</strong>
                  </span>
                )}
                {user?.phone && (
                  <span className="inline-flex items-center text-xs font-semibold text-text-muted bg-surface-2 border border-border px-3 py-1 rounded-full shadow-2xs">
                    <Phone className="w-3.5 h-3.5 mr-1 text-coral" />
                    Hotline: <strong className="text-ink ml-1">{user.phone}</strong>
                  </span>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-2.5">
              <div className="bg-brand-50 dark:bg-brand-950/40 rounded-2xl px-3 sm:px-4 py-2.5 border border-brand-500/20 shadow-xs">
                <span className="text-[10px] font-bold text-brand-700 dark:text-brand-300 uppercase block">Active (Mine)</span>
                <span className="text-xl sm:text-2xl font-display font-bold text-brand-600">{myAcceptedTasks.length}</span>
              </div>
              <div className="bg-coral/10 rounded-2xl px-3 sm:px-4 py-2.5 border border-coral/20 shadow-xs">
                <span className="text-[10px] font-bold text-coral uppercase block">Open to Claim</span>
                <span className="text-xl sm:text-2xl font-display font-bold text-coral">{availableQueue.length}</span>
              </div>
              <div className="col-span-2 sm:col-span-1 bg-surface-2 rounded-2xl px-3 sm:px-4 py-2.5 border border-border shadow-xs">
                <span className="text-[10px] font-bold text-text-muted uppercase block">Cleaned</span>
                <span className="text-xl sm:text-2xl font-display font-bold text-ink">{myCompletedTasks.length}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="max-w-[1250px] mx-auto px-6 pt-6">
        <div className="flex border-b border-border space-x-2 overflow-x-auto">
          {[
            { id: 'active_tasks', label: 'Active Tasks (Accepted by Me)', count: myAcceptedTasks.length, highlight: myAcceptedTasks.length > 0 },
            { id: 'available', label: 'Available Tasks (Open to Claim)', count: availableQueue.length },
            { id: 'verified', label: 'Completed Cleanups', count: myCompletedTasks.length },
            { id: 'analytics', label: 'Crew Analytics' }
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
                  tab.highlight && activeTab === tab.id
                    ? 'bg-brand-500 text-white'
                    : activeTab === tab.id ? 'bg-brand-100 text-brand-700' : 'bg-surface-2 text-text-muted'
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Filter / Search Bar */}
        {(activeTab === 'active_tasks' || activeTab === 'available' || activeTab === 'verified') && (
          <div className="pt-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div className="relative w-full sm:max-w-xs">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
              <input 
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search address or material..."
                className="w-full bg-surface border border-border pl-8 pr-3 py-1.5 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-brand-500 shadow-xs"
              />
            </div>

            <div className="flex gap-1.5 overflow-x-auto text-[11px]">
              {['all', 'plastic', 'organic', 'construction', 'household'].map(cat => (
                <button
                  key={cat}
                  onClick={() => setWasteFilter(cat)}
                  className={`px-3 py-1 rounded-lg capitalize font-semibold transition-colors ${
                    wasteFilter === cat 
                      ? 'bg-brand-500 text-white' 
                      : 'bg-surface border border-border text-text-muted hover:text-ink'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* TAB 1: ACTIVE TASKS (ACCEPTED BY ME) */}
        {activeTab === 'active_tasks' && (
          <div className="pt-6 space-y-4">
            {filterList(myAcceptedTasks).length === 0 ? (
              <div className="bg-surface rounded-3xl border border-border p-12 text-center max-w-lg mx-auto shadow-xs">
                <div className="w-16 h-16 rounded-full bg-brand-50 flex items-center justify-center mx-auto mb-3 text-brand-600">
                  <CheckCircle className="w-8 h-8" />
                </div>
                <h3 className="text-base font-bold text-ink mb-1">No active claimed tasks right now!</h3>
                <p className="text-xs text-text-muted mb-5">
                  Browse the Available Tasks tab to claim open garbage spots in your area and dispatch your cleanup team.
                </p>
                <Button onClick={() => setActiveTab('available')} className="text-xs">
                  Browse Available Tasks ({availableQueue.length}) →
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filterList(myAcceptedTasks).map(report => (
                  <div 
                    key={report.id}
                    className="bg-surface rounded-3xl border border-border p-5 shadow-xs hover:shadow-soft transition-all flex flex-col justify-between space-y-4"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          report.status === 'proof_submitted' ? 'bg-indigo-100 text-indigo-700' : 'bg-sun/20 text-warn font-extrabold'
                        }`}>
                          {report.status.replace('_', ' ')}
                        </span>
                        <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                          report.severity === 'high' ? 'bg-danger-soft text-danger' : 'bg-brand-50 text-brand-600'
                        }`}>
                          {report.severity} Priority
                        </span>
                      </div>

                      <div className="flex gap-3.5 items-start">
                        <img 
                          src={report.photoUrl} 
                          alt="Incident" 
                          className="w-24 h-24 rounded-2xl object-cover shrink-0 bg-surface-2 cursor-pointer hover:opacity-90"
                          onClick={() => navigate(`/report/${report.id}`)}
                        />
                        <div className="min-w-0 flex-1">
                          <h4 className="font-bold text-ink text-sm truncate capitalize mb-0.5">
                            {report.wasteType.replace('_', ' ')} Incident
                          </h4>
                          <p className="text-xs text-text-muted flex items-center truncate">
                            <MapPin className="w-3.5 h-3.5 mr-1 text-brand-500 shrink-0" />
                            {report.location.address}
                          </p>

                          {/* Detected items tags */}
                          {report.aiAnalysis?.detectedItems && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {report.aiAnalysis.detectedItems.slice(0, 2).map((item, idx) => (
                                <span key={idx} className="text-[10px] bg-surface-2 px-2 py-0.5 rounded text-text-muted truncate max-w-[170px]">
                                  {item}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* AI Action protocol snippet */}
                      {report.aiAnalysis?.recommendations?.[0] && (
                        <div className="mt-3 p-2.5 bg-brand-50/70 rounded-xl border border-brand-500/20 text-[11px] text-brand-950">
                          <span className="font-bold block text-brand-700 mb-0.5">Recommended Equipment & Safety:</span>
                          {report.aiAnalysis.recommendations[0]}
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 pt-2 border-t border-border">
                      <Button
                        size="sm"
                        onClick={() => navigate(`/org/report/${report.id}/proof`)}
                        className="flex-1 text-xs py-1.5 bg-brand-500 text-white hover:bg-brand-600 shadow-xs"
                        leftIcon={<Send className="w-3.5 h-3.5" />}
                      >
                        Submit Cleanup Proof
                      </Button>

                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => navigate(`/report/${report.id}`)}
                        className="text-xs py-1.5"
                      >
                        Details
                      </Button>

                      <button
                        onClick={() => handleReleaseTask(report.id)}
                        className="px-2.5 py-1.5 text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 rounded-xl transition-colors text-xs font-bold flex items-center"
                        title="Release task back to open queue"
                      >
                        <RotateCcw className="w-3 h-3 mr-1" />
                        Release
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: AVAILABLE DISPATCH QUEUE */}
        {activeTab === 'available' && (
          <div className="pt-6 space-y-4">
            <div className="bg-brand-50 rounded-2xl p-4 border border-brand-500/20 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div>
                <p className="text-xs font-bold text-brand-800">Open Public Reports Ready for Cleanup</p>
                <p className="text-[11px] text-brand-700 mt-0.5">
                  Click "Claim Task" to assign the report to your organization. It will immediately appear in your active tasks tab.
                </p>
              </div>
              <span className="text-xs font-bold text-brand-600 bg-surface px-3 py-1 rounded-xl border border-brand-500/30">
                {availableQueue.length} Available
              </span>
            </div>

            {filterList(availableQueue).length === 0 ? (
              <div className="bg-surface rounded-2xl border border-border p-12 text-center">
                <CheckCircle className="w-10 h-10 text-brand-500 mx-auto mb-2" />
                <p className="text-sm font-bold text-ink">No open tasks matching this filter.</p>
                <p className="text-xs text-text-muted mt-1">Check back later or check other waste categories.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filterList(availableQueue).map(report => (
                  <div 
                    key={report.id}
                    className="bg-surface rounded-2xl border border-border p-4 shadow-xs hover:shadow-soft transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="flex items-start sm:items-center space-x-3.5 flex-1 min-w-0">
                      <img 
                        src={report.photoUrl} 
                        alt="Garbage" 
                        className="w-20 h-20 rounded-xl object-cover shrink-0 bg-surface-2 cursor-pointer hover:opacity-90"
                        onClick={() => navigate(`/report/${report.id}`)}
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            report.severity === 'high' ? 'bg-danger-soft text-danger' : 'bg-brand-50 text-brand-600'
                          }`}>
                            {report.severity} Priority
                          </span>
                          <span className="text-[10px] text-text-muted">
                            Cleanliness: {report.aiAnalysis?.cleanlinessScore || 40}/100
                          </span>
                          <span className="text-[10px] text-text-muted">
                            {new Date(report.createdAt).toLocaleDateString()}
                          </span>
                        </div>

                        <h4 className="font-bold text-ink text-sm truncate capitalize">
                          {report.wasteType.replace('_', ' ')} Incident
                        </h4>

                        <p className="text-xs text-text-muted truncate flex items-center mt-0.5">
                          <MapPin className="w-3.5 h-3.5 mr-1 text-brand-500 shrink-0" />
                          {report.location.address}
                        </p>

                        {report.aiAnalysis?.detectedItems && (
                          <p className="text-[10px] text-text-muted truncate mt-1">
                            Materials: <span className="text-ink font-semibold">{report.aiAnalysis.detectedItems.slice(0, 3).join(', ')}</span>
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 shrink-0">
                      <Button
                        size="sm"
                        onClick={() => handleClaimTask(report.id)}
                        className="text-xs py-1.5 px-4 bg-brand-500 hover:bg-brand-600 text-white shadow-xs font-bold"
                        leftIcon={<Check className="w-3.5 h-3.5" />}
                      >
                        Claim Task
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
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: VERIFIED CLEANUPS */}
        {activeTab === 'verified' && (
          <div className="pt-6 space-y-4">
            {filterList(myCompletedTasks).length === 0 ? (
              <div className="bg-surface rounded-2xl border border-border p-12 text-center">
                <CheckCircle className="w-10 h-10 text-brand-500 mx-auto mb-2" />
                <p className="text-sm font-bold text-ink">No verified cleanups yet.</p>
                <p className="text-xs text-text-muted mt-1">Complete your active tasks and submit cleanup proofs to build your organization's certified record.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filterList(myCompletedTasks).map(report => (
                  <div key={report.id} className="bg-surface rounded-3xl border border-border p-5 shadow-xs space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="px-2.5 py-0.5 bg-success text-white text-[10px] font-bold rounded-full uppercase flex items-center">
                        <CheckCircle className="w-3 h-3 mr-1" /> Verified Clean
                      </span>
                      <span className="text-xs text-text-muted">
                        {report.updatedAt ? new Date(report.updatedAt).toLocaleDateString() : ''}
                      </span>
                    </div>

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

                    <div>
                      <p className="text-xs font-bold text-ink truncate">{report.location.address}</p>
                      {report.proof?.verification && (
                        <div className="flex gap-2 mt-2 text-[11px]">
                          <span className="bg-brand-50 text-brand-700 px-2 py-0.5 rounded font-bold">
                            Cleared: {report.proof.verification.wasteReductionPercent}%
                          </span>
                          <span className="bg-surface-2 text-text-muted px-2 py-0.5 rounded font-bold">
                            Visual Match: {report.proof.verification.locationMatchScore}%
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 4: CREW ANALYTICS */}
        {activeTab === 'analytics' && (
          <div className="pt-6 space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-surface rounded-3xl border border-border p-6 shadow-xs">
                <h3 className="font-bold text-ink text-sm flex items-center mb-1">
                  <TrendingUp className="w-4 h-4 mr-2 text-brand-500" /> Weekly Verified Resolutions
                </h3>
                <p className="text-xs text-text-muted mb-4">Cleanups completed and certified for {currentOrgName}.</p>
                <div className="h-[220px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                      <defs>
                        <linearGradient id="orgGreen" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#34B27B" stopOpacity={0.4}/>
                          <stop offset="95%" stopColor="#34B27B" stopOpacity={0.0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                      <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748B' }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748B' }} allowDecimals={false} />
                      <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #E2E8F0', fontSize: '11px' }} />
                      <Area type="monotone" dataKey="cleanups" stroke="#34B27B" strokeWidth={2} fillOpacity={1} fill="url(#orgGreen)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="bg-brand-50 rounded-3xl border border-brand-500/20 p-6 flex flex-col justify-between">
                <div>
                  <div className="flex items-center space-x-2 text-brand-700 font-bold text-xs mb-2">
                    <Sparkles className="w-4 h-4" />
                    <span>Open Vision AI Verification Guidelines</span>
                  </div>
                  <p className="text-xs text-brand-900 leading-relaxed space-y-2">
                    When submitting proof of cleanup, the Open Vision engine calculates structural similarity against the original photo's background landmarks (poles, buildings, curbs) and measures the reduction in debris contours.
                  </p>
                  <ul className="mt-4 space-y-2 text-xs text-brand-800 list-disc list-inside">
                    <li>Stand at the same angle as the initial citizen photo.</li>
                    <li>Ensure identical daylight and background anchors.</li>
                    <li>Ensure all residual bags and loose litter are swept clean.</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
