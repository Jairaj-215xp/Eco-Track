import React, { useState, useEffect } from 'react';
import { reportService } from '../services/reportService';
import { Report, Status } from '../types';
import { ReportCard } from '../components/report/ReportCard';
import { GoogleMapView } from '../components/ui/GoogleMapView';
import { Camera, MapPin, ChevronDown, Leaf, Users, Trash2, CheckCircle, Search, Filter } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { useNavigate } from 'react-router-dom';
import { getCurrentDeviceLocation, reverseGeocodeCoords } from '../services/googleMapsService';

export function Feed() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [userArea, setUserArea] = useState('Detecting location...');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'newest' | 'upvotes'>('newest');

  const navigate = useNavigate();

  useEffect(() => {
    reportService.getReports().then(data => {
      setReports(data);
      setLoading(false);
    });

    // Detect user real location
    getCurrentDeviceLocation()
      .then(async (coords) => {
        const addr = await reverseGeocodeCoords(coords.lat, coords.lng);
        setUserArea(addr.split(',').slice(0, 2).join(','));
      })
      .catch(() => {
        setUserArea('Current Location');
      });
  }, []);

  // Compute Real Counts from Database
  const totalCount = reports.length;
  const reportedCount = reports.filter(r => r.status === 'reported').length;
  const inProgressCount = reports.filter(r => r.status === 'in_progress').length;
  const resolvedCount = reports.filter(r => r.status === 'verified' || r.status === 'proof_submitted').length;

  // Category counts
  const plasticCount = reports.filter(r => r.wasteType === 'plastic').length;
  const organicCount = reports.filter(r => r.wasteType === 'organic').length;
  const constructionCount = reports.filter(r => r.wasteType === 'construction').length;
  const householdCount = reports.filter(r => r.wasteType === 'household').length;

  // Filtered reports
  const filteredReports = reports.filter(r => {
    // Status filter
    if (selectedStatus === 'reported' && r.status !== 'reported') return false;
    if (selectedStatus === 'in_progress' && r.status !== 'in_progress') return false;
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
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  return (
    <div className="bg-background min-h-screen pb-12">
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
          <Button 
            size="lg" 
            className="w-full bg-gradient-to-r from-brand-500 to-aqua hover:scale-[1.02] transition-transform text-white shadow-md border-none text-sm"
            onClick={() => navigate('/report/new')}
            leftIcon={<Camera className="w-4 h-4" />}
          >
            Report garbage
          </Button>

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
              <label className="text-xs font-bold text-ink mb-2 block">Sort By</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setSortBy('newest')}
                  className={`py-1.5 px-3 rounded-xl text-xs font-medium border transition-colors ${
                    sortBy === 'newest' ? 'bg-brand-50 border-brand-500 text-brand-600 font-bold' : 'border-border text-text-muted hover:text-ink'
                  }`}
                >
                  Newest
                </button>
                <button
                  onClick={() => setSortBy('upvotes')}
                  className={`py-1.5 px-3 rounded-xl text-xs font-medium border transition-colors ${
                    sortBy === 'upvotes' ? 'bg-brand-50 border-brand-500 text-brand-600 font-bold' : 'border-border text-text-muted hover:text-ink'
                  }`}
                >
                  Most Upvoted
                </button>
              </div>
            </div>

            {/* Filter by Status */}
            <div className="border-t border-border pt-4">
              <label className="text-xs font-bold text-ink mb-3 block">Filter by Status</label>
              <div className="space-y-2">
                {[
                  { id: 'all', label: 'All Status', count: totalCount, color: 'bg-brand-500' },
                  { id: 'reported', label: 'Reported', count: reportedCount, color: 'bg-coral' },
                  { id: 'in_progress', label: 'In Progress', count: inProgressCount, color: 'bg-sun' },
                  { id: 'resolved', label: 'Resolved', count: resolvedCount, color: 'bg-success' },
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
                <Button onClick={() => navigate('/report/new')} leftIcon={<Camera className="w-4 h-4" />}>
                  Submit First Report
                </Button>
              ) : (
                <Button variant="ghost" onClick={() => { setSelectedStatus('all'); setSelectedCategory('all'); setSearchQuery(''); }}>
                  Clear Filters
                </Button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredReports.map((report) => (
                <ReportCard key={report.id} report={report} onClick={() => navigate(`/report/${report.id}`)} />
              ))}
            </div>
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
