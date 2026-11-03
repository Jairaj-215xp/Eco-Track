import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { reportService } from '../services/reportService';
import { Report, Organisation } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { 
  ArrowLeft, 
  MapPin, 
  Clock, 
  ThumbsUp, 
  CheckCircle, 
  Leaf, 
  Trash2, 
  ShieldCheck, 
  Sparkles, 
  AlertTriangle,
  Send,
  Building,
  RotateCcw,
  Check,
  XCircle
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { GoogleMapView } from '../components/ui/GoogleMapView';
import { useAlert } from '../contexts/AlertContext';

export function ReportDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, role } = useAuth();
  const { showAlert, showConfirm } = useAlert();
  
  const [report, setReport] = useState<Report | null>(null);
  const [orgs, setOrgs] = useState<Organisation[]>([]);
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const [upvotes, setUpvotes] = useState(0);
  const [hasUpvoted, setHasUpvoted] = useState(false);

  const notify = (msg: string, type: 'success' | 'info' | 'warning' | 'error' = 'success') => {
    showAlert(msg, type);
  };

  useEffect(() => {
    if (id) {
      reportService.getReportById(id).then((data: Report | undefined) => {
        if (data) {
          setReport(data);
          setUpvotes(data.upvotes || 0);
        }
      });
      reportService.getOrganisations().then(setOrgs);
    }
  }, [id]);

  if (!report) {
    return (
      <div className="p-16 text-center text-text-muted">
        <p className="text-base font-semibold">Loading report...</p>
      </div>
    );
  }

  const isResolved = (report.status === 'verified' || report.status === 'proof_submitted') && Boolean(report.proof?.mediaUrl);
  const proofUrl = report.proof?.mediaUrl;

  const handleUpvote = async () => {
    if (hasUpvoted) return;
    setHasUpvoted(true);
    setUpvotes(u => u + 1);
    await reportService.upvoteReport(report.id, user?.id);
  };

  const currentOrgId = user?.orgId || (role === 'org' && user?.name?.toLowerCase().includes('green earth') ? 'org_green_earth' : user?.orgId || '');
  const currentOrgName = user?.name || (role === 'org' ? 'Green Earth Foundation' : '');
  const isAssignedToMe = role === 'org' && Boolean(
    (currentOrgId && report.assignedOrgId === currentOrgId) || 
    (user?.name && report.assignedOrgName && report.assignedOrgName.toLowerCase() === user.name.toLowerCase())
  );
  const isUnassigned = report.status === 'reported' && !report.assignedOrgId;

  const handleClaimReport = async () => {
    if (role !== 'org' && role !== 'admin') {
      notify('Please sign in or register as an NGO / Municipal crew to claim cleanup tasks.', 'warning');
      navigate('/login', { state: { from: { pathname: `/report/${report.id}` } } });
      return;
    }
    await reportService.assignReportToOrg(report.id, currentOrgId, currentOrgName, currentOrgName);
    notify('Task successfully claimed by your organization!');
    const updated = await reportService.getReportById(report.id);
    if (updated) setReport(updated);
  };

  const handleReleaseReport = () => {
    showConfirm({
      title: 'Release Task to Open Queue?',
      message: 'Are you sure you want to release this task? It will be returned to the open municipal dispatch queue so other partner NGOs and sanitation crews can claim it.',
      confirmText: 'Yes, Release Task',
      type: 'warning',
      onConfirm: async () => {
        await reportService.unassignReport(report.id, currentOrgName);
        notify('Task released back to public dispatch queue.', 'info');
        const updated = await reportService.getReportById(report.id);
        if (updated) setReport(updated);
      }
    });
  };

  const handleAdminAssign = async (orgId: string) => {
    const targetOrg = orgs.find(o => o.id === orgId);
    if (!targetOrg) return;
    await reportService.assignReportToOrg(report.id, targetOrg.id, targetOrg.name, user?.name || 'City Administrator');
    notify(`Assigned task to ${targetOrg.name}`);
    const updated = await reportService.getReportById(report.id);
    if (updated) setReport(updated);
  };

  const handleAdminReview = async (decision: 'verified' | 'reopened') => {
    const comment = decision === 'verified'
      ? 'Cleanup verified and approved by Municipal Authority.'
      : 'Residual debris detected. Further cleaning requested.';
    await reportService.adminReviewProof(report.id, decision, comment, user?.name || 'City Administrator');
    notify(decision === 'verified' ? 'Report verified & certified!' : 'Report reopened for re-cleaning.');
    const updated = await reportService.getReportById(report.id);
    if (updated) setReport(updated);
  };

  return (
    <div className="bg-background min-h-[calc(100vh-96px)] font-sans pb-24">
      {/* Top Banner */}
      <div className="bg-surface border-b border-border py-3 sm:py-4 sticky top-[64px] sm:top-[72px] z-20 shadow-xs">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 flex items-center justify-between gap-2">
          <div className="flex items-center space-x-2 sm:space-x-3 min-w-0">
            <button onClick={() => navigate(-1)} className="p-1.5 sm:p-2 hover:bg-surface-2 rounded-full transition-colors text-text-muted hover:text-ink shrink-0">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="min-w-0">
              <h1 className="text-base sm:text-xl font-display font-bold text-ink leading-tight capitalize truncate">
                {report.wasteType.replace('_', ' ')} Waste
              </h1>
              <p className="text-[11px] sm:text-xs text-text-muted flex items-center mt-0.5 truncate">
                <MapPin className="w-3 h-3 mr-1 text-brand-500 shrink-0" /> <span className="truncate">{report.location.address}</span>
              </p>
            </div>
          </div>
          
          <div className={`px-2.5 sm:px-3.5 py-1 sm:py-1.5 rounded-full text-[10px] sm:text-xs font-bold flex items-center shadow-xs border shrink-0 ${
            report.status === 'verified' ? 'bg-success-soft text-success border-success/20' : 
            report.status === 'in_progress' ? 'bg-sun/15 text-warn border-sun/30' :
            'bg-coral/10 text-coral border-coral/20'
          }`}>
            {report.status === 'verified' ? <CheckCircle className="w-3 h-3 sm:w-3.5 sm:h-3.5 mr-1" /> : <Clock className="w-3 h-3 sm:w-3.5 sm:h-3.5 mr-1" />}
            <span>{report.status.replace('_', ' ').toUpperCase()}</span>
          </div>
        </div>
      </div>

      <div className="max-w-[1200px] mx-auto px-6 pt-6 flex flex-col lg:flex-row gap-6">
        
        {/* Main Content */}
        <div className="flex-1 space-y-6">
          
          {/* Before/After Slider */}
          <div className="bg-surface rounded-3xl border border-border p-2 shadow-sm overflow-hidden">
            <div 
              className="relative aspect-[16/9] lg:aspect-[21/9] rounded-[24px] overflow-hidden bg-surface-2 cursor-ew-resize select-none"
              onMouseMove={(e) => {
                if (!isDragging) return;
                const rect = e.currentTarget.getBoundingClientRect();
                const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
                setSliderPosition((x / rect.width) * 100);
              }}
              onMouseUp={() => setIsDragging(false)}
              onMouseLeave={() => setIsDragging(false)}
              onTouchMove={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const x = Math.max(0, Math.min(e.touches[0].clientX - rect.left, rect.width));
                setSliderPosition((x / rect.width) * 100);
              }}
            >
              {/* After Image (Background) */}
              {isResolved && proofUrl ? (
                <img src={proofUrl} alt="After" className="absolute inset-0 w-full h-full object-cover" />
              ) : (
                <div className="absolute inset-0 w-full h-full bg-surface-2 flex items-center justify-center text-text-muted flex-col p-6 text-center">
                  <ShieldCheck className="w-12 h-12 mb-2 opacity-30 text-brand-600" />
                  <p className="font-bold text-ink text-sm">Cleanup in Progress</p>
                  <p className="text-xs text-text-muted mt-1">Once verified cleanup proof is submitted, the interactive before/after slider will activate.</p>
                </div>
              )}

              {/* Before Image (Foreground, Clipped) */}
              <div 
                className="absolute inset-0 w-full h-full overflow-hidden"
                style={{ clipPath: isResolved ? `inset(0 ${100 - sliderPosition}% 0 0)` : 'none' }}
              >
                <img src={report.photoUrl} alt="Before" className="absolute inset-0 w-full h-full object-cover" />
              </div>

              {/* Slider Handle */}
              {isResolved && (
                <div 
                  className="absolute top-0 bottom-0 w-1 bg-white cursor-ew-resize shadow-[0_0_10px_rgba(0,0,0,0.5)] z-10"
                  style={{ left: `${sliderPosition}%` }}
                  onMouseDown={(e) => { e.preventDefault(); setIsDragging(true); }}
                  onTouchStart={() => setIsDragging(true)}
                >
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-white rounded-full shadow-lg flex items-center justify-center border-2 border-brand-500">
                    <div className="flex space-x-0.5">
                      <div className="w-0.5 h-3 bg-brand-500 rounded-full" />
                      <div className="w-0.5 h-3 bg-brand-500 rounded-full" />
                    </div>
                  </div>
                </div>
              )}

              {isResolved && (
                <>
                  <div className="absolute bottom-3 left-3 bg-slate-900/80 backdrop-blur text-white px-2.5 py-1 rounded-lg text-[10px] font-bold shadow-sm">Before</div>
                  <div className="absolute bottom-3 right-3 bg-brand-500/90 backdrop-blur text-white px-2.5 py-1 rounded-lg text-[10px] font-bold shadow-sm">After</div>
                </>
              )}
            </div>
          </div>

          {/* Open Vision AI Insights Box */}
          {report.aiAnalysis && (
            <div className="bg-brand-50 rounded-3xl border border-brand-500/20 p-5 shadow-xs">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <div className="w-7 h-7 rounded-lg bg-brand-500 text-white flex items-center justify-center">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-ink">Open Vision AI Analysis</h3>
                    <p className="text-[10px] text-text-muted">Automated computer vision scan results</p>
                  </div>
                </div>
                <span className="text-xs font-bold text-brand-700 bg-brand-100 px-2.5 py-1 rounded-full">
                  {Math.round(report.aiAnalysis.confidence * 100)}% Confidence
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
                <div className="bg-surface rounded-xl p-3 border border-border">
                  <span className="text-[10px] text-text-muted uppercase font-bold block mb-0.5">Cleanliness Index</span>
                  <span className="text-lg font-bold text-ink">{report.aiAnalysis.cleanlinessScore}/100</span>
                </div>
                <div className="bg-surface rounded-xl p-3 border border-border">
                  <span className="text-[10px] text-text-muted uppercase font-bold block mb-0.5">Debris Coverage</span>
                  <span className="text-lg font-bold text-coral">{report.aiAnalysis.coveragePercentage}%</span>
                </div>
                <div className="bg-surface rounded-xl p-3 border border-border">
                  <span className="text-[10px] text-text-muted uppercase font-bold block mb-0.5">Priority Level</span>
                  <span className="text-lg font-bold text-ink capitalize">{report.aiAnalysis.severity}</span>
                </div>
              </div>

              {report.aiAnalysis.detectedItems?.length > 0 && (
                <div className="mb-2">
                  <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider block mb-1">Detected Objects</span>
                  <div className="flex flex-wrap gap-1.5">
                    {report.aiAnalysis.detectedItems.map((item, i) => (
                      <span key={i} className="text-[10px] bg-surface border border-border px-2 py-0.5 rounded-md font-medium text-ink">
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Cleanup Verification Box (If Proof Uploaded) */}
          {report.proof?.verification && (
            <div className="bg-success-soft/50 rounded-3xl border border-success/30 p-5 shadow-xs">
              <div className="flex items-center space-x-2 mb-2">
                <CheckCircle className="w-5 h-5 text-success" />
                <h3 className="text-sm font-bold text-success-900">Open Vision Cleanup Verification</h3>
              </div>
              <p className="text-xs text-text-muted mb-3 leading-relaxed">
                {report.proof.verification.analysisSummary}
              </p>
              <div className="flex gap-3 text-xs">
                <span className="bg-surface px-2.5 py-1 rounded-lg border border-border font-bold text-ink">
                  Waste Cleared: {report.proof.verification.wasteReductionPercent}%
                </span>
                <span className="bg-surface px-2.5 py-1 rounded-lg border border-border font-bold text-ink">
                  Location Visual Match: {report.proof.verification.locationMatchScore}%
                </span>
              </div>
            </div>
          )}

          {/* Description Card */}
          <div className="bg-surface rounded-3xl border border-border p-6 shadow-xs">
            <h2 className="text-lg font-bold text-ink mb-2">Report Description</h2>
            <p className="text-text-muted text-sm leading-relaxed mb-5">
              {report.note || `Overflowing ${report.wasteType.replace('_', ' ')} waste reported in the area. Verified via GPS tracking.`}
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-4 border-t border-border">
              <div>
                <p className="text-[10px] text-text-muted font-bold uppercase mb-0.5">Severity</p>
                <span className={`px-2 py-0.5 rounded text-[11px] font-bold capitalize ${
                  report.severity === 'high' ? 'bg-danger-soft text-danger' : 
                  report.severity === 'medium' ? 'bg-warn-soft text-warn' : 'bg-success-soft text-success'
                }`}>{report.severity}</span>
              </div>
              <div>
                <p className="text-[10px] text-text-muted font-bold uppercase mb-0.5">Waste Type</p>
                <p className="font-semibold text-ink text-xs capitalize flex items-center">
                  <Trash2 className="w-3.5 h-3.5 mr-1 text-brand-500" /> {report.wasteType.replace('_', ' ')}
                </p>
              </div>
              <div>
                <p className="text-[10px] text-text-muted font-bold uppercase mb-0.5">Reported On</p>
                <p className="font-semibold text-ink text-xs flex items-center">
                  <Clock className="w-3.5 h-3.5 mr-1 text-brand-500" /> {new Date(report.createdAt).toLocaleDateString()}
                </p>
              </div>
              <div>
                <p className="text-[10px] text-text-muted font-bold uppercase mb-0.5">Reported By</p>
                <p className="font-semibold text-ink text-xs truncate">
                  {report.reporterName || 'Citizen Contributor'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="w-full lg:w-[360px] space-y-5">
          {/* NGO Workflow Actions Box */}
          {role === 'org' && (
            <div className="bg-surface rounded-3xl border border-aqua/30 p-5 shadow-xs bg-gradient-to-br from-surface to-aqua/5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] font-bold text-aqua-700 uppercase tracking-wider flex items-center">
                  <Building className="w-3.5 h-3.5 mr-1" /> NGO Field Action
                </span>
                {report.assignedOrgName && (
                  <span className="text-[10px] bg-aqua-100 text-aqua-800 px-2 py-0.5 rounded-full font-bold">
                    {report.assignedOrgName}
                  </span>
                )}
              </div>

              {isUnassigned ? (
                <div className="space-y-2">
                  <p className="text-xs text-text-muted">
                    This garbage report is unassigned. Claim this task to mobilize your cleanup team.
                  </p>
                  <Button
                    size="md"
                    className="w-full bg-aqua-600 hover:bg-aqua-700 text-white font-bold text-xs"
                    onClick={handleClaimReport}
                    leftIcon={<Building className="w-4 h-4" />}
                  >
                    Claim Task for {currentOrgName}
                  </Button>
                </div>
              ) : isAssignedToMe ? (
                <div className="space-y-2.5">
                  <div className="bg-aqua-50 border border-aqua-200 rounded-xl p-2.5 text-[11px] text-aqua-900 font-medium">
                    This task is currently active with your crew. Take an after-cleanup photo once the site is cleared to earn verification.
                  </div>
                  {report.status !== 'verified' && (
                    <Button
                      size="md"
                      className="w-full bg-brand-500 hover:bg-brand-600 text-white font-bold text-xs"
                      onClick={() => navigate(`/org/report/${report.id}/proof`)}
                      leftIcon={<Send className="w-4 h-4" />}
                    >
                      Submit Cleanup Proof
                    </Button>
                  )}
                  <button
                    onClick={handleReleaseReport}
                    className="w-full text-center text-xs text-red-600 hover:text-red-700 font-bold py-2 px-3 rounded-xl bg-red-50 hover:bg-red-100/90 border border-red-200/90 transition-all flex items-center justify-center shadow-2xs group"
                  >
                    <RotateCcw className="w-3.5 h-3.5 mr-1.5 text-red-500 group-hover:-rotate-45 transition-transform" />
                    Release task back to open queue
                  </button>
                </div>
              ) : (
                <p className="text-xs text-text-muted">
                  Assigned to <strong className="text-ink">{report.assignedOrgName}</strong>.
                </p>
              )}
            </div>
          )}

          {/* Unauthenticated NGO Claim prompt */}
          {!user && isUnassigned && (
            <div className="bg-surface rounded-3xl border border-aqua/30 p-4 shadow-xs bg-aqua-50/30 text-xs">
              <div className="flex items-center space-x-1.5 text-aqua-700 font-bold mb-1">
                <Building className="w-3.5 h-3.5" />
                <span>NGO / Sanitation Dispatch</span>
              </div>
              <p className="text-text-muted text-[11px] mb-2.5">
                Represent an NGO or municipal sanitation team? Sign in or register your organization to claim this open cleanup site.
              </p>
              <Button
                size="sm"
                variant="ghost"
                className="w-full text-xs font-bold border border-aqua/40 text-aqua-800 hover:bg-aqua-50"
                onClick={() => navigate('/login', { state: { from: { pathname: `/report/${report.id}` } } })}
              >
                Sign In to Claim Task
              </Button>
            </div>
          )}

          {/* City Administrator Controls */}
          {role === 'admin' && (
            <div className="bg-surface rounded-3xl border border-purple-500/30 p-5 shadow-xs bg-gradient-to-br from-surface to-purple-500/5">
              <span className="text-[11px] font-bold text-purple-700 uppercase tracking-wider flex items-center mb-3">
                <ShieldCheck className="w-3.5 h-3.5 mr-1" /> Municipal Command Action
              </span>

              {/* Assign to Org Dropdown */}
              <div className="mb-4">
                <label className="text-[10px] text-text-muted font-bold block uppercase mb-1">
                  Assign / Reassign Organization
                </label>
                <select
                  value={report.assignedOrgId || ''}
                  onChange={(e) => handleAdminAssign(e.target.value)}
                  className="w-full text-xs font-semibold bg-surface-2 border border-border rounded-xl px-3 py-2 text-ink focus:outline-none focus:ring-1 focus:ring-brand-500"
                >
                  <option value="">-- Open Public Queue (Unassigned) --</option>
                  {orgs.map(org => (
                    <option key={org.id} value={org.id}>
                      {org.name} ({org.type.toUpperCase()})
                    </option>
                  ))}
                </select>
              </div>

              {/* Proof verification actions */}
              {report.status === 'proof_submitted' && (
                <div className="space-y-2 pt-2 border-t border-purple-500/20">
                  <p className="text-xs font-bold text-ink">Proof Submitted: Pending Your Review</p>
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      size="sm"
                      className="bg-brand-500 hover:bg-brand-600 text-white font-bold text-xs"
                      onClick={() => handleAdminReview('verified')}
                      leftIcon={<Check className="w-3.5 h-3.5" />}
                    >
                      Approve & Certify
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="border border-danger/30 text-danger hover:bg-danger-soft text-xs font-bold"
                      onClick={() => handleAdminReview('reopened')}
                      leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
                    >
                      Reject & Reopen
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Upvote & Actions */}
          <div className="bg-surface rounded-3xl border border-border p-5 shadow-xs">
            <Button 
              size="lg" 
              variant={hasUpvoted ? "primary" : "soft"}
              className={`w-full mb-5 text-xs py-2.5 ${hasUpvoted ? 'bg-brand-600 text-white' : ''}`}
              leftIcon={<ThumbsUp className="w-4 h-4" />}
              onClick={handleUpvote}
            >
              {hasUpvoted ? 'Upvoted!' : 'Upvote this Report'} ({upvotes})
            </Button>

            <h3 className="font-bold text-ink text-sm mb-4">Activity Timeline</h3>
            <div className="relative pl-5 space-y-6">
              <div className="absolute top-2 bottom-2 left-2 w-0.5 bg-border z-0" />
              
              {report.timeline.map((entry, idx) => (
                <div key={idx} className="relative z-10">
                  <div className="absolute -left-5 top-1 w-3.5 h-3.5 bg-brand-500 rounded-full border-2 border-surface" />
                  <p className="font-bold text-ink text-xs capitalize">{entry.status.replace('_', ' ')}</p>
                  <p className="text-[10px] text-text-muted">{new Date(entry.at).toLocaleString()} • {entry.by || 'System'}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Google Map Mini Widget */}
          <div className="bg-surface rounded-3xl border border-border p-2 shadow-xs">
            <div className="h-[200px] rounded-[20px] overflow-hidden relative">
              <GoogleMapView reports={[report]} center={{ lat: report.location.lat, lng: report.location.lng }} zoom={15} />
            </div>
            <p className="text-[10px] text-text-muted p-2 truncate">
              {report.location.address}
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}
