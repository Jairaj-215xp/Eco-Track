import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Camera, MapPin, Bell, ShieldCheck, ArrowRight, CheckCircle, Leaf, Users, Building, Trash2, Shield, Menu, User, Sparkles } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { reportService } from '../services/reportService';
import { Report } from '../types';

export function Landing() {
  const [recentReport, setRecentReport] = useState<Report | null>(null);
  const [totalReports, setTotalReports] = useState(0);
  const [resolvedReports, setResolvedReports] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    reportService.getReports().then((reports) => {
      setTotalReports(reports.length);
      setResolvedReports(reports.filter(r => r.status === 'verified').length);
      if (reports.length > 0) {
        setRecentReport(reports[0]);
      }
    });
  }, []);

  return (
    <div className="min-h-screen bg-background overflow-hidden font-sans">
      {/* Background blobs */}
      <div className="absolute top-0 left-0 w-full h-[800px] overflow-hidden -z-10 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-brand-500/10 blur-[100px]" />
        <div className="absolute top-[20%] right-[-10%] w-[40%] h-[60%] rounded-full bg-aqua/10 blur-[120px]" />
        <div className="absolute bottom-[-20%] left-[20%] w-[60%] h-[40%] rounded-full bg-sun/5 blur-[100px]" />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMSIgY3k9IjEiIHI9IjEiIGZpbGw9InJnYmEoNDcsIDc0LCA2NCwgMC4wNSkiLz48L3N2Zz4=')] opacity-50" />
      </div>

      <div className="max-w-[1200px] mx-auto px-6 pt-12 pb-24">
        {/* HERO SECTION */}
        <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-8">
          
          {/* Left: Copy */}
          <div className="flex-1 text-center lg:text-left z-10">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center space-x-2 bg-brand-100 text-brand-600 px-4 py-1.5 rounded-full text-sm font-semibold mb-6 tracking-wide"
            >
              <Leaf className="w-4 h-4" />
              <span>CLEANER SPACES. STRONGER COMMUNITIES.</span>
            </motion.div>
            
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-5xl lg:text-[64px] font-display font-extrabold text-ink leading-[1.1] mb-6 tracking-tight"
            >
              Report it in a photo.<br />
              Track it till it's <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-500 to-aqua">clean.</span>
            </motion.h1>

            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-lg text-text-muted mb-8 max-w-xl mx-auto lg:mx-0 leading-relaxed"
            >
              Eco-Track pairs smart citizen reporting with Open Vision AI and Google Maps to pinpoint, verify, and resolve urban garbage spots with transparent tracking.
            </motion.p>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 mb-16"
            >
              <Link 
                to="/report/new" 
                className="w-full sm:w-auto px-8 py-4 rounded-full bg-brand-500 hover:bg-brand-600 text-white font-bold text-base shadow-lg shadow-brand-500/25 transition-all hover:scale-105 active:scale-95 flex items-center justify-center space-x-2"
              >
                <span>Report garbage</span>
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link 
                to="/feed" 
                className="w-full sm:w-auto px-8 py-4 rounded-full bg-surface hover:bg-surface-2 text-ink font-bold text-base border border-border shadow-sm transition-all hover:scale-105 active:scale-95 flex items-center justify-center"
              >
                Explore Live Map
              </Link>
            </motion.div>

            {/* 3 Step Pill Preview */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="grid grid-cols-3 gap-4 border-t border-border pt-8 max-w-lg mx-auto lg:mx-0"
            >
              {[
                { title: 'Take a photo', sub: 'Open Vision scans waste', icon: Camera },
                { title: 'Google Maps Pin', sub: 'High accuracy GPS', icon: MapPin },
                { title: 'AI Verification', sub: 'Verified cleanup proof', icon: ShieldCheck },
              ].map((step, i) => (
                <div key={i} className="flex flex-col items-center text-center">
                  <div className="w-12 h-12 rounded-full bg-surface shadow-sm border border-border flex items-center justify-center mb-3 text-brand-500 relative">
                    <step.icon className="w-5 h-5" />
                    {i === 2 && <div className="absolute -top-1 -right-1 w-4 h-4 bg-success rounded-full border-2 border-surface flex items-center justify-center"><CheckCircle className="w-2 h-2 text-white" /></div>}
                  </div>
                  <h4 className="font-semibold text-ink text-sm">{step.title}</h4>
                  <p className="text-xs text-text-muted mt-0.5">{step.sub}</p>
                </div>
              ))}
            </motion.div>
          </div>

          {/* Right: Phone Mockup & Floating Cards */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="flex-1 relative w-full max-w-[500px] lg:max-w-none h-[600px] hidden md:block"
          >
            {/* The Phone */}
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[300px] h-[600px] bg-ink rounded-[40px] border-[8px] border-ink shadow-2xl overflow-hidden z-10">
              <div className="absolute top-0 inset-x-0 h-6 bg-ink z-20 rounded-b-2xl w-40 mx-auto" /> {/* Notch */}
              <div className="w-full h-full bg-surface relative flex flex-col">
                {/* Fake App Header */}
                <div className="pt-10 px-4 pb-2 border-b border-border flex justify-between items-center bg-surface">
                  <div className="flex items-center space-x-2">
                    <div className="w-6 h-6 rounded-full bg-brand-500 text-white flex items-center justify-center"><Leaf className="w-3 h-3"/></div>
                    <span className="font-bold text-sm">Eco-Track</span>
                  </div>
                  <Bell className="w-4 h-4 text-ink" />
                </div>
                {/* App Content */}
                <div className="p-4 bg-background flex-1 overflow-hidden">
                  <div className="flex space-x-2 mb-4 overflow-hidden">
                    <span className="px-3 py-1 bg-ink text-white rounded-full text-xs font-medium">Live Feed</span>
                    <span className="px-3 py-1 bg-surface border border-border rounded-full text-xs font-medium text-text-muted">Nearby</span>
                  </div>
                  
                  <div className="bg-surface rounded-2xl shadow-sm border border-border overflow-hidden mb-4">
                    <div className="h-32 bg-brand-50 relative flex items-center justify-center overflow-hidden">
                      {recentReport?.photoUrl ? (
                        <img src={recentReport.photoUrl} className="w-full h-full object-cover" alt="Recent Report" />
                      ) : (
                        <div className="text-center p-3">
                          <Leaf className="w-8 h-8 text-brand-500 mx-auto mb-1 opacity-70" />
                          <p className="text-[11px] font-bold text-ink">Ready for Reports</p>
                        </div>
                      )}
                      <span className="absolute top-2 right-2 bg-coral text-white text-[10px] px-2 py-0.5 rounded-full font-bold flex items-center">
                        <span className="w-1.5 h-1.5 bg-white rounded-full mr-1"></span> 
                        {recentReport ? recentReport.status : 'Active'}
                      </span>
                    </div>
                    <div className="p-3">
                      <p className="text-[10px] text-text-muted mb-1 flex items-center truncate">
                        <MapPin className="w-3 h-3 mr-1 text-brand-500 shrink-0"/> 
                        {recentReport ? recentReport.location.address : 'Live GPS Pinning'}
                      </p>
                      <h4 className="font-bold text-sm text-ink leading-tight mb-1 capitalize">
                        {recentReport ? `${recentReport.wasteType.replace('_', ' ')} Waste` : 'Open Vision AI Scanner'}
                      </h4>
                      <p className="text-[11px] text-text-muted line-clamp-2">
                        {recentReport?.note || 'Take photo, let AI detect waste type & severity, and track cleanup verification.'}
                      </p>
                      <div className="mt-3 flex justify-between items-center">
                        <span className="text-[10px] text-brand-600 bg-brand-100 px-2 py-1 rounded-full font-bold">
                          Supabase Synced
                        </span>
                        <span className="text-[10px] font-bold text-ink cursor-pointer hover:underline" onClick={() => navigate('/feed')}>
                          Explore &rarr;
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bottom App Bar */}
                <div className="h-16 bg-surface border-t border-border flex justify-around items-center px-4 pb-2">
                  <div className="flex flex-col items-center text-brand-500"><div className="w-5 h-5 mb-0.5"><svg fill="currentColor" viewBox="0 0 24 24"><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/></svg></div><span className="text-[9px] font-medium">Home</span></div>
                  <div className="flex flex-col items-center text-text-muted" onClick={() => navigate('/report/new')}><div className="w-5 h-5 mb-0.5"><svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 4v16m8-8H4"/></svg></div><span className="text-[9px]">Report</span></div>
                  <div className="flex flex-col items-center text-text-muted" onClick={() => navigate('/feed')}><div className="w-5 h-5 mb-0.5"><MapPin strokeWidth="2"/></div><span className="text-[9px]">Map</span></div>
                </div>
              </div>
            </div>

            {/* Floating Card 1 */}
            <motion.div 
              animate={{ y: [0, -10, 0] }}
              transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
              className="absolute top-[10%] left-[-10%] z-20 bg-surface/90 backdrop-blur-md p-3.5 rounded-2xl shadow-hover border border-border flex flex-col items-center"
            >
              <div className="w-12 h-12 bg-brand-100 rounded-xl flex items-center justify-center mb-1 text-coral">
                <MapPin className="w-6 h-6" />
              </div>
              <span className="text-xs font-bold text-ink text-center">Google Maps<br/>Location Track</span>
            </motion.div>

            {/* Floating Card 2 */}
            <motion.div 
              animate={{ y: [0, 15, 0] }}
              transition={{ repeat: Infinity, duration: 5, ease: "easeInOut", delay: 1 }}
              className="absolute top-[35%] right-[-15%] z-20 bg-surface/90 backdrop-blur-md p-4 rounded-2xl shadow-hover border border-border max-w-[200px]"
            >
              <div className="flex items-center space-x-2 mb-2">
                <div className="w-7 h-7 bg-brand-500 rounded-lg flex items-center justify-center text-white shrink-0">
                  <Sparkles className="w-4 h-4"/>
                </div>
                <div>
                  <h5 className="text-xs font-bold text-ink">Open Vision AI</h5>
                  <p className="text-[10px] text-brand-600 font-semibold">95% Cleanup Match</p>
                </div>
              </div>
              <p className="text-[10px] text-text-muted leading-tight">
                Computer vision verifies waste elimination before & after cleanup.
              </p>
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* Stats Bento Strip */}
      <div className="max-w-[1200px] mx-auto px-6 mb-24 relative z-10">
        <div className="bg-surface/80 backdrop-blur-xl border border-border rounded-[32px] p-8 shadow-soft flex flex-wrap justify-between items-center gap-6">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-brand-100 rounded-full flex items-center justify-center text-brand-600"><Trash2 className="w-6 h-6" /></div>
            <div>
              <h3 className="text-2xl font-display font-bold text-ink">{totalReports}</h3>
              <p className="text-xs text-text-muted">Live Reports in Database</p>
            </div>
          </div>
          <div className="hidden md:block w-px h-12 bg-border"></div>
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-brand-100 rounded-full flex items-center justify-center text-brand-600"><CheckCircle className="w-6 h-6" /></div>
            <div>
              <h3 className="text-2xl font-display font-bold text-ink">{resolvedReports}</h3>
              <p className="text-xs text-text-muted">Verified Cleanups</p>
            </div>
          </div>
          <div className="hidden lg:block w-px h-12 bg-border"></div>
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-brand-100 rounded-full flex items-center justify-center text-brand-600"><Sparkles className="w-6 h-6" /></div>
            <div>
              <h3 className="text-xl font-display font-bold text-ink">Open Vision</h3>
              <p className="text-xs text-text-muted">Real-time AI Scanning</p>
            </div>
          </div>
          <div className="hidden xl:block w-px h-12 bg-border"></div>
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-brand-100 rounded-full flex items-center justify-center text-brand-600"><MapPin className="w-6 h-6" /></div>
            <div>
              <h3 className="text-xl font-display font-bold text-ink">Google Maps</h3>
              <p className="text-xs text-text-muted">Precision Geolocation</p>
            </div>
          </div>
        </div>
      </div>

      {/* HOW IT WORKS SECTION */}
      <div className="bg-surface py-24 relative border-t border-border">
        <div className="max-w-[1200px] mx-auto px-6 text-center">
          <div className="inline-flex items-center space-x-2 bg-brand-100 text-brand-600 px-3 py-1 rounded-full text-xs font-bold mb-4 tracking-wider uppercase">
            <Leaf className="w-3 h-3" /> SIMPLE STEPS. BIG IMPACT.
          </div>
          <h2 className="text-4xl md:text-5xl font-display font-extrabold text-ink mb-4">
            How it <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-500 to-aqua">works</span>
          </h2>
          <p className="text-text-muted text-base mb-16">From one photo to a verified clean city.</p>

          <div className="flex flex-col lg:flex-row items-start justify-between relative gap-6">
            <div className="hidden lg:block absolute top-[60px] left-[10%] right-[10%] h-0.5 bg-brand-100 -z-10" />
            
            {[
              { num: '01', title: 'Snap Photo', desc: 'Take a photo of the waste. Open Vision AI automatically detects category & density.', icon: Camera },
              { num: '02', title: 'Google Maps Pin', desc: 'Confirm exact location using draggable Google Maps marker and street geocoding.', icon: MapPin },
              { num: '03', title: 'Crews Mobilize', desc: 'Local municipal workers and partner NGOs claim the task on their dashboard.', icon: Building },
              { num: '04', title: 'Proof & Verification', desc: 'Cleaned photo is uploaded and AI verifies waste reduction and location match.', icon: CheckCircle },
            ].map((step, i) => (
              <div key={i} className="flex-1 bg-surface-2 lg:bg-transparent rounded-2xl p-6 lg:p-0 flex flex-col items-center">
                <div className="w-16 h-16 rounded-2xl bg-surface border border-border shadow-xs flex items-center justify-center mb-4 text-brand-600 relative">
                  <step.icon className="w-7 h-7" />
                  <span className="absolute -top-2 -right-2 bg-brand-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-md">
                    {step.num}
                  </span>
                </div>
                <h3 className="font-bold text-ink text-lg mb-1">{step.title}</h3>
                <p className="text-xs text-text-muted max-w-xs">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
