import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { reportService } from '../services/reportService';
import { Report, Status } from '../types';
import { ReportCard } from '../components/report/ReportCard';
import { GoogleMapView } from '../components/ui/GoogleMapView';
import { Camera, MapPin, ChevronDown, Leaf, Users, Trash2, CheckCircle, Search, Filter, Building, ShieldCheck, ArrowRight, Sparkles, Navigation, Compass } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { useNavigate } from 'react-router-dom';
import { getCurrentDeviceLocation, reverseGeocodeCoords } from '../services/googleMapsService';
import { useAuth } from '../contexts/AuthContext';
import { useAlert } from '../contexts/AlertContext';

function getDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export function Feed() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [userArea, setUserArea] = useState('Detecting location...');
  const [deviceCoords, setDeviceCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'newest' | 'upvotes' | 'nearest'>('newest');
  const { user, role } = useAuth();
  const { showAlert } = useAlert();

  const navigate = useNavigate();

  const loadReports = async () => {
    const data = await reportService.getReports();
    setReports(data);
    setLoading(false);
  };

  useEffect(() => {
    loadReports();

    // Detect user real location
    getCurrentDeviceLocation()
      .then(async (coords) => {
        setDeviceCoords(coords);
        const addr = await reverseGeocodeCoords(coords.lat, coords.lng);
        setUserArea(addr.split(',').slice(0, 2).join(','));
      })
      .catch(() => {
        setUserArea('Pune Operating Area');
      });
  }, []);

  const showToast = (msg: string, type: 'success' | 'info' | 'warning' | 'error' = 'success') => {
    showAlert(msg, type);
  };

  // NGO identity & isolated counts
  const currentOrgId = user?.orgId || (role === 'org' && user?.name?.toLowerCase().includes('green earth') ? 'org_green_earth' : user?.orgId || '');
  const currentOrgName = user?.name || (role === 'org' ? 'Green Earth Foundation' : '');

  // Base operating coordinates for nearest distance calculation
  const effectiveBaseCoords = user?.orgCoords || deviceCoords || { lat: 18.5204, lng: 73.8567 };
  const baseAreaLabel = user?.orgServiceArea || userArea || 'Operating Jurisdiction';

  const myAcceptedCount = reports.filter(r => {
    const isMine = Boolean(
      (currentOrgId && r.assignedOrgId === currentOrgId) ||
      (user?.name && r.assignedOrgName && r.assignedOrgName.toLowerCase() === user.name.toLowerCase())
    );
    return isMine && (r.status === 'in_progress' || r.status === 'assigned' || r.status === 'proof_submitted');
  }).length;

  const availableToClaimCount = reports.filter(r => r.status === 'reported' && !r.assignedOrgId).length;

  // Compute Real Counts from Database
  const totalCount = reports.length;
  const reportedCount = reports.filter(r => r.status === 'reported' && !r.assignedOrgId).length;
  const inProgressCount = reports.filter(r => r.status === 'in_progress' || r.status === 'assigned').length;
  const resolvedCount = reports.filter(r => r.status === 'verified' || r.status === 'proof_submitted').length;

  // Category counts
  const plasticCount = reports.filter(r => r.wasteType === 'plastic').length;
  const organicCount = reports.filter(r => r.wasteType === 'organic').length;
  const constructionCount = reports.filter(r => r.wasteType === 'construction').length;
  const householdCount = reports.filter(r => r.wasteType === 'household').length;

  // Nearest available task recommendation
  const openReportsToClean = reports.filter(r => r.status === 'reported' && !r.assignedOrgId);
  const candidateReports = openReportsToClean.length > 0 ? openReportsToClean : reports.filter(r => r.status !== 'verified');
  
  const nearestRecommendation = candidateReports.length > 0
    ? candidateReports
        .map(r => ({
          report: r,
          distanceKm: getDistanceKm(effectiveBaseCoords.lat, effectiveBaseCoords.lng, r.location.lat, r.location.lng)
        }))
        .sort((a, b) => a.distanceKm - b.distanceKm)[0]
    : null;

  // Filtered reports
  const filteredReports = reports.filter(r => {
    // Custom NGO filter tabs
    if (selectedStatus === 'my_active_tasks') {
      const isMine = Boolean(
        (currentOrgId && r.assignedOrgId === currentOrgId) ||
        (user?.name && r.assignedOrgName && r.assignedOrgName.toLowerCase() === user.name.toLowerCase())
      );
      return isMine && (r.status === 'in_progress' || r.status === 'assigned' || r.status === 'proof_submitted');
    }
    if (selectedStatus === 'available_to_claim') {
      return r.status === 'reported' && !r.assignedOrgId;
    }

    // Standard Status filters
    if (selectedStatus === 'reported' && (r.status !== 'reported' || r.assignedOrgId)) return false;
    if (selectedStatus === 'in_progress' && (r.status !== 'in_progress' && r.status !== 'assigned')) return false;
    if (selectedStatus === 'resolved' && (r.status !== 'verified' && r.status !== 'proof_submitted')) return false;

    // Category filter
    if (selectedCategory !== 'all' && r.wasteType !== selectedCategory) return false;

    // Search query filter
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchAddress = r.location.address.toLowerCase().includes(q);
      const matchType = r.wasteType.toLowerCase().includes(q);
      const matchNote = (r.note || '').toLowerCase().includes(q);
      if (!matchAddress && !matchType && !matchNote) return false;
    }

    return true;
  }).sort((a, b) => {
    if (sortBy === 'upvotes') {
      return (b.upvotes || 0) - (a.upvotes || 0);
    }
    if (sortBy === 'nearest') {
      const distA = getDistanceKm(effectiveBaseCoords.lat, effectiveBaseCoords.lng, a.location.lat, a.location.lng);
      const distB = getDistanceKm(effectiveBaseCoords.lat, effectiveBaseCoords.lng, b.location.lat, b.location.lng);
      return distA - distB;
    }
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  const handleClaimTask = async (reportId: string) => {
    if (!user || role !== 'org') {
      showAlert('Please sign in or register as an NGO / Municipal team to claim cleanup tasks.', 'warning');
      navigate('/login', { state: { from: { pathname: '/feed' } } });
      return;
    }
    await reportService.assignReportToOrg(reportId, currentOrgId, currentOrgName, currentOrgName);
    showToast(`Task claimed! It is now in your "Active Tasks (Accepted by Me)" tab.`);
    await loadReports();
  };

  return (
    <div className="bg-background min-h-screen pb-12">
      {/* Role Notice Banner */}
      {role === 'org' && (
        <div className="bg-gradient-to-r from-aqua/15 via-brand-50 to-aqua/10 border-b border-aqua/30 px-6 py-3">
          <div className="max-w-[1400px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <div className="flex items-center space-x-2 text-ink">
              <Building className="w-4 h-4 text-aqua-600 shrink-0" />
              <span>
                <strong>NGO Workspace Mode:</strong> Logged in as <span className="font-bold text-aqua-700">{user?.name || 'Green Earth Foundation'}</span>.
              </span>
            </div>

            <div className="flex items-center space-x-2 flex-wrap">
              <button
                onClick={() => setSelectedStatus('my_active_tasks')}
                className={`px-3 py-1 rounded-full font-bold flex items-center shrink-0 text-xs transition-all ${
                  selectedStatus === 'my_active_tasks' 
                    ? 'bg-aqua-600 text-white shadow-xs' 
                    : 'bg-surface border border-aqua/40 text-aqua-700 hover:bg-aqua-50/30'
                }`}
              >
                Active Tasks ({myAcceptedCount})
              </button>

              <button
                onClick={() => setSelectedStatus('available_to_claim')}
                className={`px-3 py-1 rounded-full font-bold flex items-center shrink-0 text-xs transition-all ${
                  selectedStatus === 'available_to_claim' 
                    ? 'bg-coral text-white shadow-xs' 
                    : 'bg-surface border border-coral/40 text-coral hover:bg-coral/10'
                }`}
              >
                Available to Claim ({availableToClaimCount})
              </button>

              <button
                onClick={() => navigate('/org')}
                className="px-3 py-1 bg-aqua-700 hover:bg-aqua-800 text-white rounded-full font-bold flex items-center shrink-0 shadow-2xs"
              >
                Full NGO Workspace <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </button>
            </div>
          </div>
        </div>
      )}

      {role === 'admin' && (
        <div className="bg-gradient-to-r from-purple-500/10 via-brand-50 to-purple-500/10 border-b border-purple-500/20 px-6 py-3">
          <div className="max-w-[1400px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-xs">
            <div className="flex items-center space-x-2 text-ink">
              <ShieldCheck className="w-4 h-4 text-purple-600 shrink-0" />
              <span>
                <strong>City Administrator Oversight Active:</strong> Citywide monitoring, NGO assignment, and proof certification control.
              </span>
            </div>
            <button
              onClick={() => navigate('/admin')}
              className="px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded-full font-bold flex items-center shrink-0 shadow-2xs"
            >
              Open Admin Hub ({reports.filter(r => r.status === 'proof_submitted').length} pending proofs) <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </button>
          </div>
        </div>
      )}

      {/* Top Banner */}
      <div className="bg-brand-100/50 border-b border-border py-10 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[500px] h-[300px] bg-gradient-to-br from-brand-500/10 to-aqua/10 blur-[80px] -z-10" />
        <div className="max-w-[1400px] mx-auto px-6 relative z-10 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
          <div>
            <h1 className="text-3xl md:text-5xl font-display font-extrabold text-ink mb-1">
              Community <span className="text-brand-600">Feed</span>
            </h1>
            <p className="text-text-muted text-base">Live reports backed by Supabase & Open Vision AI.</p>
          </div>
          <div className="bg-surface/80 backdrop-blur px-4 py-2 rounded-xl shadow-xs text-brand-600 font-medium border border-brand-500/20 text-xs">
            Clean Cities. Powered by Community.
          </div>
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto px-6 py-8 flex flex-col lg:flex-row gap-8">
        
        {/* LEFT SIDEBAR (Filters) */}
        <div className="w-full lg:w-[280px] flex-shrink-0 space-y-6">
          {role === 'org' ? (
            <Button 
              size="lg" 
              className="w-full bg-gradient-to-r from-aqua-600 to-brand-600 hover:scale-[1.02] transition-transform text-white shadow-md border-none text-xs font-bold"
              onClick={() => navigate('/org')}
              leftIcon={<Building className="w-4 h-4" />}
            >
              NGO Workspace ({myAcceptedCount} Active)
            </Button>
          ) : role === 'admin' ? (
            <Button 
              size="lg" 
              className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:scale-[1.02] transition-transform text-white shadow-md border-none text-xs font-bold"
              onClick={() => navigate('/admin')}
              leftIcon={<ShieldCheck className="w-4 h-4" />}
            >
              City Admin Hub
            </Button>
          ) : (
            <Button 
              size="lg" 
              className="w-full bg-gradient-to-r from-brand-500 to-aqua hover:scale-[1.02] transition-transform text-white shadow-md border-none text-sm"
              onClick={() => navigate('/report/new')}
              leftIcon={<Camera className="w-4 h-4" />}
            >
              Report garbage
            </Button>
          )}

          <div className="bg-surface rounded-2xl border border-border p-5 shadow-xs space-y-5">
            <div>
              <label className="flex items-center text-xs font-bold text-ink mb-2">
                <MapPin className="w-3.5 h-3.5 mr-1.5 text-brand-500"/> Detected Area
              </label>
              <div className="relative">
                <input 
                  type="text" 
                  value={userArea} 
                  readOnly 
                  className="w-full bg-surface-2 border border-border rounded-xl px-3 py-2 text-xs text-ink focus:outline-none" 
                />
              </div>
            </div>

            {/* Search */}
            <div>
              <label className="text-xs font-bold text-ink mb-2 block">Search Reports</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-muted" />
                <input 
                  type="text" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Address or keyword..."
                  className="w-full bg-surface-2 border border-border rounded-xl pl-8 pr-3 py-2 text-xs text-ink focus:outline-none focus:ring-2 focus:ring-brand-500" 
                />
              </div>
            </div>

            {/* Sort */}
            <div>
              <label className="text-xs font-bold text-ink mb-2 block flex items-center justify-between">
                <span>Sort By</span>
                {(role === 'org' || role === 'admin') && (
                  <span className="text-[10px] text-text-muted font-normal">Base: {baseAreaLabel.split(',')[0]}</span>
                )}
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                <button
                  onClick={() => setSortBy('newest')}
                  className={`py-1.5 px-2 rounded-xl text-xs font-medium border text-center transition-colors ${
                    sortBy === 'newest' ? 'bg-brand-50 border-brand-500 text-brand-600 font-bold' : 'border-border text-text-muted hover:text-ink'
                  }`}
                >
                  Newest
                </button>
                <button
                  onClick={() => setSortBy('nearest')}
                  className={`py-1.5 px-2 rounded-xl text-xs font-medium border text-center transition-colors ${
                    sortBy === 'nearest' ? 'bg-brand-50 border-brand-500 text-brand-600 font-bold' : 'border-border text-text-muted hover:text-ink'
                  }`}
                  title={(role === 'org' || role === 'admin') ? `Sort by proximity to ${baseAreaLabel}` : 'Sort by nearest to current location'}
                >
                  📍 Nearest
                </button>
                <button
                  onClick={() => setSortBy('upvotes')}
                  className={`py-1.5 px-2 rounded-xl text-xs font-medium border text-center transition-colors ${
                    sortBy === 'upvotes' ? 'bg-brand-50 border-brand-500 text-brand-600 font-bold' : 'border-border text-text-muted hover:text-ink'
                  }`}
                >
                  Upvoted
                </button>
              </div>
            </div>

            {/* Filter by Status */}
            <div className="border-t border-border pt-4">
              <label className="text-xs font-bold text-ink mb-3 block">Filter by Status</label>
              <div className="space-y-2">
                {role === 'org' && (
                  <>
                    <button 
                      onClick={() => setSelectedStatus('my_active_tasks')}
                      className={`w-full flex items-center justify-between p-2 rounded-xl transition-colors text-left border ${
                        selectedStatus === 'my_active_tasks' 
                          ? 'bg-aqua-50 border-aqua-400 text-aqua-800 font-extrabold shadow-2xs' 
                          : 'border-aqua/20 bg-aqua/5 hover:bg-aqua/10 text-aqua-700'
                      }`}
                    >
                      <div className="flex items-center">
                        <span className="w-2 h-2 rounded-full bg-aqua-600 mr-2" />
                        <span className="text-xs font-bold">Active Tasks (Accepted by Me)</span>
                      </div>
                      <span className="text-xs font-bold bg-aqua-200 text-aqua-900 px-1.5 py-0.2 rounded-full">{myAcceptedCount}</span>
                    </button>

                    <button 
                      onClick={() => setSelectedStatus('available_to_claim')}
                      className={`w-full flex items-center justify-between p-2 rounded-xl transition-colors text-left border ${
                        selectedStatus === 'available_to_claim' 
                          ? 'bg-coral/15 border-coral/40 text-coral font-extrabold shadow-2xs' 
                          : 'border-coral/20 bg-coral/5 hover:bg-coral/10 text-coral'
                      }`}
                    >
                      <div className="flex items-center">
                        <span className="w-2 h-2 rounded-full bg-coral mr-2" />
                        <span className="text-xs font-bold">Available to Claim</span>
                      </div>
                      <span className="text-xs font-bold bg-coral/20 text-coral px-1.5 py-0.2 rounded-full">{availableToClaimCount}</span>
                    </button>
                    <div className="w-full h-px bg-border my-1" />
                  </>
                )}

                {[
                  { id: 'all', label: 'All Feed Reports', count: totalCount, color: 'bg-brand-500' },
                  { id: 'reported', label: 'Reported (Open)', count: reportedCount, color: 'bg-coral' },
                  { id: 'in_progress', label: 'In Progress / Assigned', count: inProgressCount, color: 'bg-sun' },
                  { id: 'resolved', label: 'Resolved & Verified', count: resolvedCount, color: 'bg-success' },
                ].map(s => {
                  const isChecked = selectedStatus === s.id;
                  return (
                    <button 
                      key={s.id} 
                      onClick={() => setSelectedStatus(s.id)}
                      className={`w-full flex items-center justify-between p-2 rounded-xl transition-colors text-left ${
                        isChecked ? 'bg-brand-50 text-brand-700 font-bold' : 'hover:bg-surface-2 text-text-muted hover:text-ink'
                      }`}
                    >
                      <div className="flex items-center">
                        <span className={`w-2 h-2 rounded-full ${s.color} mr-2`} />
                        <span className="text-xs">{s.label}</span>
                      </div>
                      <span className="text-xs font-semibold">{s.count}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Waste Category */}
            <div className="border-t border-border pt-4">
              <label className="text-xs font-bold text-ink mb-3 block">Waste Category</label>
              <div className="space-y-2">
                {[
                  { id: 'all', label: 'All Categories', count: totalCount },
                  { id: 'plastic', label: 'Plastic', count: plasticCount },
                  { id: 'organic', label: 'Organic', count: organicCount },
                  { id: 'construction', label: 'Construction', count: constructionCount },
                  { id: 'household', label: 'Household', count: householdCount },
                ].map(c => {
                  const isChecked = selectedCategory === c.id;
                  return (
                    <button 
                      key={c.id} 
                      onClick={() => setSelectedCategory(c.id)}
                      className={`w-full flex items-center justify-between p-2 rounded-xl transition-colors text-left ${
                        isChecked ? 'bg-brand-50 text-brand-700 font-bold' : 'hover:bg-surface-2 text-text-muted hover:text-ink'
                      }`}
                    >
                      <span className="text-xs">{c.label}</span>
                      <span className="text-xs font-semibold">{c.count}</span>
                    </button>
                  );
                })}
              </div>
            </div>

          </div>
        </div>

        {/* CENTER COLUMN (Feed) */}
        <div className="flex-1">

          {/* TOP SPOTLIGHT: Suggested Nearest Cleanup Spot (Only for NGOs & Municipal Sanitation Teams) */}
          {(role === 'org' || role === 'admin') && nearestRecommendation && !loading && (
            <motion.div
              initial={{ opacity: 0, y: -12 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 bg-gradient-to-br from-brand-50/80 via-surface to-aqua-50/30 rounded-3xl border border-brand-500/30 p-5 shadow-sm hover:shadow-hover transition-all relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-brand-500/10 to-aqua-500/10 rounded-full blur-3xl pointer-events-none" />

              {/* Header Badges */}
              <div className="flex flex-wrap items-center justify-between gap-2 mb-3.5 relative z-10">
                <div className="flex items-center space-x-2">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-[11px] font-extrabold bg-brand-500 text-white shadow-2xs">
                    <Sparkles className="w-3.5 h-3.5 mr-1 text-sun" />
                    RECOMMENDED NEAREST CLEANUP
                  </span>
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold bg-surface border border-brand-500/20 text-brand-700">
                    <Navigation className="w-3 h-3 mr-1 text-brand-500" />
                    {nearestRecommendation.distanceKm < 1 
                      ? `${Math.round(nearestRecommendation.distanceKm * 1000)}m from your base` 
                      : `${nearestRecommendation.distanceKm.toFixed(1)} km from your base`}
                  </span>
                </div>

                <div className="text-[11px] text-text-muted flex items-center">
                  <span className="hidden sm:inline mr-1 text-text-muted">Target Operating Base:</span>
                  <strong className="text-ink truncate max-w-[220px]">{baseAreaLabel}</strong>
                </div>
              </div>

              {/* Main Recommendation Content */}
              <div className="flex flex-col sm:flex-row gap-4 relative z-10">
                <div 
                  onClick={() => navigate(`/report/${nearestRecommendation.report.id}`)}
                  className="w-full sm:w-48 h-32 rounded-2xl overflow-hidden shrink-0 relative cursor-pointer group shadow-2xs"
                >
                  <img
                    src={nearestRecommendation.report.photoUrl}
                    alt={nearestRecommendation.report.wasteType}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute bottom-2 left-2 bg-slate-900/80 backdrop-blur text-white px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center">
                    <Trash2 className="w-2.5 h-2.5 mr-1 text-aqua" />
                    {nearestRecommendation.report.wasteType}
                  </div>
                </div>

                <div className="flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h4 
                        onClick={() => navigate(`/report/${nearestRecommendation.report.id}`)}
                        className="font-display font-extrabold text-base text-ink hover:text-brand-600 transition-colors cursor-pointer"
                      >
                        {nearestRecommendation.report.location.address}
                      </h4>
                      {nearestRecommendation.report.severity && (
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase shrink-0 ${
                          nearestRecommendation.report.severity === 'high' 
                            ? 'bg-danger-soft text-danger border border-danger/20' 
                            : 'bg-sun-soft text-sun border border-sun/20'
                        }`}>
                          {nearestRecommendation.report.severity} Priority
                        </span>
                      )}
                    </div>

                    <p className="text-text-muted text-xs line-clamp-2 mb-2 leading-relaxed">
                      {nearestRecommendation.report.note || 
                        `Accumulated ${nearestRecommendation.report.wasteType} waste detected closest to your dispatch sector. Immediate clearing recommended.`}
                    </p>

                    {nearestRecommendation.report.aiAnalysis && (
                      <div className="flex flex-wrap items-center gap-1.5 text-[10px]">
                        <span className="bg-brand-100 text-brand-800 font-bold px-2 py-0.5 rounded-md">
                          AI Cleanliness: {nearestRecommendation.report.aiAnalysis.cleanlinessScore}/100
                        </span>
                        {nearestRecommendation.report.aiAnalysis.detectedItems.slice(0, 3).map((item, i) => (
                          <span key={i} className="bg-surface border border-border text-text-muted px-2 py-0.5 rounded-md">
                            {item}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center space-x-3 mt-3 pt-3 border-t border-border/60">
                    {role === 'org' ? (
                      <Button
                        size="sm"
                        className="bg-brand-500 hover:bg-brand-600 text-white font-bold text-xs shadow-xs"
                        onClick={() => handleClaimTask(nearestRecommendation.report.id)}
                        leftIcon={<Building className="w-3.5 h-3.5" />}
                      >
                        Claim Nearest Task
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        className="bg-brand-500 hover:bg-brand-600 text-white font-bold text-xs shadow-xs"
                        onClick={() => navigate(`/report/${nearestRecommendation.report.id}`)}
                        leftIcon={<ShieldCheck className="w-3.5 h-3.5" />}
                      >
                        Inspect & Assign
                      </Button>
                    )}

                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-xs font-semibold text-text-muted hover:text-ink"
                      onClick={() => navigate(`/report/${nearestRecommendation.report.id}`)}
                    >
                      Inspect Details →
                    </Button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="animate-pulse bg-surface rounded-3xl border border-border h-[380px]" />
              ))}
            </div>
          ) : filteredReports.length === 0 ? (
            <div className="bg-surface rounded-3xl border border-border p-12 text-center shadow-xs">
              <div className="w-16 h-16 rounded-full bg-brand-50 flex items-center justify-center mx-auto mb-4 text-brand-600">
                <Leaf className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-ink mb-2">
                {reports.length === 0 ? "No reports in database yet! 🌿" : "No reports match your filters."}
              </h3>
              <p className="text-text-muted text-sm mb-6 max-w-sm mx-auto">
                {reports.length === 0 
                  ? "Be the first active citizen to report garbage and track its cleanup." 
                  : "Try selecting 'All Status' or clear your search term."}
              </p>
              {reports.length === 0 ? (
                role === 'org' ? (
                  <Button onClick={() => navigate('/org')} leftIcon={<Building className="w-4 h-4" />}>
                    Open NGO Workspace
                  </Button>
                ) : role === 'admin' ? (
                  <Button onClick={() => navigate('/admin')} leftIcon={<ShieldCheck className="w-4 h-4" />}>
                    Open Admin Command Hub
                  </Button>
                ) : (
                  <Button onClick={() => navigate('/report/new')} leftIcon={<Camera className="w-4 h-4" />}>
                    Submit First Report
                  </Button>
                )
              ) : (
                <Button variant="ghost" onClick={() => { setSelectedStatus('all'); setSelectedCategory('all'); setSearchQuery(''); }}>
                  Clear Filters
                </Button>
              )}
            </div>
          ) : (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
              className="grid grid-cols-1 md:grid-cols-2 gap-6"
            >
              <AnimatePresence mode="popLayout">
                {filteredReports.map((report, idx) => (
                  <motion.div
                    key={report.id}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.3, delay: Math.min(idx * 0.04, 0.4) }}
                  >
                    <ReportCard 
                      report={report} 
                      onClick={() => navigate(`/report/${report.id}`)} 
                      onClaim={handleClaimTask}
                    />
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
          )}
        </div>

        {/* RIGHT SIDEBAR (Widgets) */}
        <div className="w-full lg:w-[320px] flex-shrink-0 space-y-6 hidden xl:block">
          
          {/* Google Map Widget */}
          <div className="bg-surface rounded-3xl border border-border p-5 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-ink text-sm flex items-center">
                <MapPin className="w-4 h-4 mr-1.5 text-brand-500" /> Google Map View
              </h3>
              <span className="text-[10px] bg-brand-100 text-brand-700 px-2 py-0.5 rounded-full font-bold">
                {filteredReports.length} spots
              </span>
            </div>
            <div className="h-[240px] rounded-2xl overflow-hidden border border-border relative">
              <GoogleMapView 
                reports={filteredReports} 
                zoom={12} 
                onSelectReport={(r) => navigate(`/report/${r.id}`)} 
              />
            </div>
          </div>

          {/* Real Live Impact Widget */}
          <div className="bg-surface rounded-3xl border border-border p-5 shadow-xs">
            <h3 className="font-bold text-ink text-sm flex items-center mb-4">
              <Leaf className="w-4 h-4 mr-1.5 text-brand-500" /> Live Database Metrics
            </h3>
            
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-surface-2 p-3 rounded-xl border border-border/60">
                <div className="w-7 h-7 rounded-lg bg-brand-100 text-brand-600 flex items-center justify-center mb-1">
                  <CheckCircle className="w-4 h-4"/>
                </div>
                <h4 className="font-bold text-ink text-lg leading-tight">{totalCount}</h4>
                <p className="text-[10px] text-text-muted">Total Reports</p>
              </div>
              <div className="bg-surface-2 p-3 rounded-xl border border-border/60">
                <div className="w-7 h-7 rounded-lg bg-success-soft text-success flex items-center justify-center mb-1">
                  <CheckCircle className="w-4 h-4"/>
                </div>
                <h4 className="font-bold text-ink text-lg leading-tight">{resolvedCount}</h4>
                <p className="text-[10px] text-text-muted">Resolved Cleanups</p>
              </div>
              <div className="bg-surface-2 p-3 rounded-xl border border-border/60">
                <div className="w-7 h-7 rounded-lg bg-sun/20 text-warn flex items-center justify-center mb-1">
                  <Users className="w-4 h-4"/>
                </div>
                <h4 className="font-bold text-ink text-lg leading-tight">{inProgressCount}</h4>
                <p className="text-[10px] text-text-muted">In Progress</p>
              </div>
              <div className="bg-surface-2 p-3 rounded-xl border border-border/60">
                <div className="w-7 h-7 rounded-lg bg-coral/20 text-coral flex items-center justify-center mb-1">
                  <Trash2 className="w-4 h-4"/>
                </div>
                <h4 className="font-bold text-ink text-lg leading-tight">{reportedCount}</h4>
                <p className="text-[10px] text-text-muted">Open Reports</p>
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
