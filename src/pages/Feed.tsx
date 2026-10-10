import React, { useState, useEffect } from 'react';
import { reportService } from '../services/reportService';
import { Report } from '../types';
import { ReportCard } from '../components/report/ReportCard';
import { MapView } from '../components/ui/MapView';
import { Camera, MapPin, ChevronDown, Leaf, Users, Trash2, CheckCircle } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { useNavigate } from 'react-router-dom';

export function Feed() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    reportService.getReports().then(data => {
      setReports(data);
      setLoading(false);
    });
  }, []);

  return (
    <div className="bg-background min-h-screen pb-12">
      {/* Top Banner */}
      <div className="bg-brand-100/50 border-b border-border py-12 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[500px] h-[300px] bg-gradient-to-br from-brand-500/10 to-aqua/10 blur-[80px] -z-10" />
        <div className="max-w-[1400px] mx-auto px-6 relative z-10 flex justify-between items-end">
          <div>
            <h1 className="text-4xl md:text-5xl font-display font-extrabold text-ink mb-2">
              Community <span className="text-brand-600">Feed</span>
            </h1>
            <p className="text-text-muted text-lg">See local reports. Track real cleanup.</p>
          </div>
          <div className="hidden md:block transform rotate-[-5deg] bg-surface/80 backdrop-blur px-4 py-2 rounded-xl shadow-sm text-brand-600 font-medium border border-brand-500/20">
            Cleaner Spaces.<br/>Happier Communities
          </div>
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto px-6 py-8 flex flex-col lg:flex-row gap-8">
        
        {/* LEFT SIDEBAR (Filters) */}
        <div className="w-full lg:w-[280px] flex-shrink-0 space-y-6">
          <Button 
            size="lg" 
            className="w-full bg-gradient-to-r from-brand-500 to-aqua hover:scale-[1.02] transition-transform text-white shadow-md border-none"
            onClick={() => navigate('/report/new')}
            leftIcon={<Camera className="w-5 h-5" />}
          >
            Report garbage
          </Button>

          <div className="bg-surface rounded-2xl border border-border p-5 shadow-sm space-y-6">
            <div>
              <label className="flex items-center text-sm font-semibold text-ink mb-3"><MapPin className="w-4 h-4 mr-2 text-brand-500"/> Your Location</label>
              <div className="relative">
                <input type="text" value="Pune, Maharashtra" readOnly className="w-full bg-surface-2 border border-border rounded-xl px-3 py-2 text-sm text-text focus:outline-none" />
              </div>
            </div>

            <div>
              <label className="text-sm font-semibold text-ink mb-3 block">Distance</label>
              <div className="relative border border-border rounded-xl px-3 py-2 flex items-center justify-between cursor-pointer hover:bg-surface-2 transition-colors">
                <span className="text-sm">5 km</span>
                <ChevronDown className="w-4 h-4 text-text-muted" />
              </div>
            </div>

            <div>
              <label className="text-sm font-semibold text-ink mb-3 block">Sort By</label>
              <div className="relative border border-border rounded-xl px-3 py-2 flex items-center justify-between cursor-pointer hover:bg-surface-2 transition-colors">
                <span className="text-sm">Newest</span>
                <ChevronDown className="w-4 h-4 text-text-muted" />
              </div>
            </div>

            <div className="border-t border-border pt-6">
              <label className="text-sm font-semibold text-ink mb-4 flex items-center">Filter by Status</label>
              <div className="space-y-3">
                {[
                  { label: 'All Status', count: 128, color: 'bg-brand-500', checked: true },
                  { label: 'Reported', count: 42, color: 'bg-coral', checked: false },
                  { label: 'In Progress', count: 36, color: 'bg-sun', checked: false },
                  { label: 'Resolved', count: 50, color: 'bg-success', checked: false },
                ].map(s => (
                  <label key={s.label} className="flex items-center justify-between cursor-pointer group">
                    <div className="flex items-center">
                      <div className={`w-5 h-5 rounded border ${s.checked ? 'bg-brand-500 border-brand-500' : 'bg-surface border-border'} flex items-center justify-center mr-3`}>
                        {s.checked && <CheckCircle className="w-3 h-3 text-white" />}
                      </div>
                      <span className={`w-2 h-2 rounded-full ${s.color} mr-2`} />
                      <span className="text-sm text-text group-hover:text-ink">{s.label}</span>
                    </div>
                    <span className="text-xs text-text-muted">{s.count}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="border-t border-border pt-6">
              <label className="text-sm font-semibold text-ink mb-4 flex items-center">Waste Category</label>
              <div className="space-y-3">
                {[
                  { label: 'All Categories', count: 128, checked: true },
                  { label: 'Plastic', count: 40, checked: false },
                  { label: 'Food Waste', count: 18, checked: false },
                  { label: 'Construction', count: 12, checked: false },
                  { label: 'General Litter', count: 36, checked: false },
                ].map(s => (
                  <label key={s.label} className="flex items-center justify-between cursor-pointer group">
                    <div className="flex items-center">
                      <div className={`w-5 h-5 rounded border ${s.checked ? 'bg-brand-500 border-brand-500' : 'bg-surface border-border'} flex items-center justify-center mr-3`}>
                        {s.checked && <CheckCircle className="w-3 h-3 text-white" />}
                      </div>
                      <span className="text-sm text-text group-hover:text-ink">{s.label}</span>
                    </div>
                    <span className="text-xs text-text-muted">{s.count}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* CENTER COLUMN (Feed) */}
        <div className="flex-1">
          {/* Mobile filter toggles could go here */}
          <div className="flex items-center justify-between mb-6 bg-surface p-2 rounded-2xl border border-border shadow-sm">
            <div className="flex space-x-2">
              <button className="px-4 py-1.5 bg-brand-100 text-brand-600 rounded-xl text-sm font-medium">All Status</button>
              <button className="px-4 py-1.5 bg-surface-2 text-text-muted rounded-xl text-sm font-medium hidden sm:block">Distance: 5km v</button>
              <button className="px-4 py-1.5 bg-surface-2 text-text-muted rounded-xl text-sm font-medium hidden sm:block">Sort: Newest v</button>
            </div>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="animate-pulse bg-surface rounded-3xl border border-border h-[400px]"></div>
              ))}
            </div>
          ) : reports.length === 0 ? (
            <div className="bg-surface rounded-3xl border border-border p-12 text-center shadow-sm">
              <Leaf className="w-16 h-16 text-brand-100 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-ink mb-2">All clear nearby! 🌿</h3>
              <p className="text-text-muted mb-6">There are no reports in your area.</p>
              <Button onClick={() => navigate('/report/new')}>Report something</Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {reports.map((report) => (
                <ReportCard key={report.id} report={report} onClick={() => navigate(`/report/${report.id}`)} />
              ))}
            </div>
          )}
        </div>

        {/* RIGHT SIDEBAR (Widgets) */}
        <div className="w-full lg:w-[320px] flex-shrink-0 space-y-6 hidden xl:block">
          
          {/* Map Widget */}
          <div className="bg-surface rounded-3xl border border-border p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-ink flex items-center"><MapPin className="w-5 h-5 mr-2 text-brand-500" /> Nearby Reports</h3>
              <button className="text-xs font-semibold text-brand-600 bg-brand-100 px-3 py-1.5 rounded-full hover:bg-brand-500 hover:text-white transition-colors">View Map &rarr;</button>
            </div>
            <div className="h-[250px] rounded-2xl overflow-hidden border border-border relative">
              <MapView reports={reports.slice(0, 5)} zoom={13} />
              {/* Fake overlay gradient to match design */}
              <div className="absolute inset-0 border-[6px] border-surface pointer-events-none rounded-2xl" />
            </div>
          </div>

          {/* Impact Widget */}
          <div className="bg-surface rounded-3xl border border-border p-5 shadow-sm">
            <h3 className="font-bold text-ink flex items-center mb-6"><Leaf className="w-5 h-5 mr-2 text-brand-500" /> Live Impact <span className="text-text-muted font-normal text-sm ml-1">(This Month)</span></h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-start space-x-3">
                <div className="w-10 h-10 rounded-full bg-brand-100 text-brand-600 flex items-center justify-center shrink-0"><CheckCircle className="w-5 h-5"/></div>
                <div><h4 className="font-bold text-ink text-lg leading-tight">1,204</h4><p className="text-[10px] text-text-muted">Reports Filed</p></div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-10 h-10 rounded-full bg-brand-100 text-brand-600 flex items-center justify-center shrink-0"><CheckCircle className="w-5 h-5"/></div>
                <div><h4 className="font-bold text-ink text-lg leading-tight">856</h4><p className="text-[10px] text-text-muted">Resolved</p></div>
              </div>
              <div className="flex items-start space-x-3 mt-2">
                <div className="w-10 h-10 rounded-full bg-brand-100 text-brand-600 flex items-center justify-center shrink-0"><Users className="w-5 h-5"/></div>
                <div><h4 className="font-bold text-ink text-lg leading-tight">24</h4><p className="text-[10px] text-text-muted">Active Organizations</p></div>
              </div>
              <div className="flex items-start space-x-3 mt-2">
                <div className="w-10 h-10 rounded-full bg-brand-100 text-brand-600 flex items-center justify-center shrink-0"><Trash2 className="w-5 h-5"/></div>
                <div><h4 className="font-bold text-ink text-lg leading-tight">5.2t</h4><p className="text-[10px] text-text-muted">Waste Cleared</p></div>
              </div>
            </div>
          </div>

          {/* Small Ad/Promo Widget */}
          <div className="bg-gradient-to-br from-brand-100 to-aqua/20 rounded-3xl p-6 relative overflow-hidden border border-brand-500/20">
            <Leaf className="w-12 h-12 text-brand-500 mb-2" />
            <h3 className="font-display font-bold text-ink text-xl leading-tight mb-2 relative z-10">Cleaner spaces<br/>today, a healthier<br/>tomorrow.</h3>
            <div className="absolute -bottom-6 -right-6 w-32 h-32 opacity-20"><Leaf className="w-full h-full text-brand-600" /></div>
          </div>
        </div>

      </div>
    </div>
  );
}
