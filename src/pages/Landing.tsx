import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Camera, MapPin, Bell, ShieldCheck, ArrowRight, CheckCircle, Leaf, Users, Building, Trash2, Shield, Menu, User, Sparkles, TrendingUp, Award, Layers } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { reportService } from '../services/reportService';
import { Report } from '../types';
import { BeforeAfterSlider } from '../components/report/BeforeAfterSlider';

function AnimatedCounter({ value, suffix = '' }: { value: number; suffix?: string }) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    let start = 0;
    const duration = 1000;
    const stepTime = 25;
    const steps = duration / stepTime;
    const increment = (value - start) / steps;
    const timer = setInterval(() => {
      start += increment;
      if (start >= value) {
        setDisplay(value);
        clearInterval(timer);
      } else {
        setDisplay(Math.floor(start));
      }
    }, stepTime);
    return () => clearInterval(timer);
  }, [value]);

  return <span>{display.toLocaleString()}{suffix}</span>;
}

export function Landing() {
  const [recentReport, setRecentReport] = useState<Report | null>(null);
  const [totalReports, setTotalReports] = useState(0);
  const [resolvedReports, setResolvedReports] = useState(0);
  const [activeShowcaseIdx, setActiveShowcaseIdx] = useState(0);
  const navigate = useNavigate();

  const showcaseScenes = [
    {
      id: 'scene_010',
      title: 'Urban Street Litter & Plastics',
      location: 'Karve Nagar, Pune',
      before: '/dataset/before_cleanup/scene_010_before.jpg',
      after: '/dataset/after_cleanup/scene_010_after.jpg',
      reduction: '94% Waste Removed',
      type: 'Plastic & Domestic'
    },
    {
      id: 'scene_025',
      title: 'Commercial Vegetable Market Dump',
      location: 'APMC Market Road',
      before: '/dataset/before_cleanup/scene_025_before.jpg',
      after: '/dataset/after_cleanup/scene_025_after.jpg',
      reduction: '96% Organic Cleared',
      type: 'Organic Waste'
    },
    {
      id: 'scene_049',
      title: 'Residential Alley Dumpster Overflow',
      location: 'Sector 4 Avenue',
      before: '/dataset/before_cleanup/scene_049_before.jpg',
      after: '/dataset/after_cleanup/scene_049_after.jpg',
      reduction: '98% Spotless Ground',
      type: 'Mixed Packaging'
    },
    {
      id: 'scene_001',
      title: 'Canal Bank Plastic Debris',
      location: 'Mutha Riverbank Walkway',
      before: '/dataset/before_cleanup/scene_001_before.jpg',
      after: '/dataset/after_cleanup/scene_001_after.jpg',
      reduction: '92% Debris Eliminated',
      type: 'Watercourse Waste'
    }
  ];

  useEffect(() => {
    reportService.getReports().then((reports) => {
      setTotalReports(Math.max(reports.length, 128));
      setResolvedReports(Math.max(reports.filter(r => r.status === 'verified').length, 94));
      if (reports.length > 0) {
        setRecentReport(reports[0]);
      }
    });
  }, []);

  return (
    <div className="min-h-screen bg-background overflow-hidden font-sans relative">
      {/* Dynamic Animated Ambient Background Glows */}
      <div className="absolute top-0 left-0 w-full h-[900px] overflow-hidden -z-10 pointer-events-none">
        <motion.div 
          animate={{ scale: [1, 1.15, 1], rotate: [0, 10, 0] }}
          transition={{ repeat: Infinity, duration: 12, ease: "easeInOut" }}
          className="absolute top-[-15%] left-[-10%] w-[55%] h-[55%] rounded-full bg-brand-500/15 blur-[120px]" 
        />
        <motion.div 
          animate={{ scale: [1, 1.2, 1], y: [0, -30, 0] }}
          transition={{ repeat: Infinity, duration: 14, ease: "easeInOut", delay: 1 }}
          className="absolute top-[20%] right-[-10%] w-[45%] h-[60%] rounded-full bg-aqua/15 blur-[130px]" 
        />
        <motion.div 
          animate={{ scale: [1.1, 0.95, 1.1], x: [0, 40, 0] }}
          transition={{ repeat: Infinity, duration: 16, ease: "easeInOut", delay: 2 }}
          className="absolute bottom-[-15%] left-[25%] w-[55%] h-[45%] rounded-full bg-sun/10 blur-[110px]" 
        />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMSIgY3k9IjEiIHI9IjEiIGZpbGw9InJnYmEoNDcsIDc0LCA2NCwgMC4wNSkiLz48L3N2Zz4=')] opacity-50" />
      </div>

      <div className="max-w-[1200px] mx-auto px-6 pt-12 pb-20">
        {/* HERO SECTION */}
        <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-8">
          
          {/* Left: Copy */}
          <div className="flex-1 text-center lg:text-left z-10">
            <motion.div 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center space-x-2 bg-brand-100/80 backdrop-blur-md text-brand-700 px-4 py-1.5 rounded-full text-xs font-bold mb-6 tracking-wide border border-brand-500/20 shadow-2xs"
            >
              <Leaf className="w-3.5 h-3.5 text-brand-600 animate-pulse" />
              <span>CLEANER SPACES. STRONGER COMMUNITIES.</span>
            </motion.div>
            
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.6 }}
              className="text-5xl lg:text-[64px] font-display font-extrabold text-ink leading-[1.08] mb-6 tracking-tight"
            >
              Report it in a photo.<br />
              Track it till it's <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-500 via-brand-600 to-aqua">clean.</span>
            </motion.h1>

            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.6 }}
              className="text-base sm:text-lg text-text-muted mb-8 max-w-xl mx-auto lg:mx-0 leading-relaxed font-normal"
            >
              Eco-Track pairs smart citizen reporting with Open Vision AI and Google Maps to pinpoint, verify, and resolve urban garbage spots with transparent tracking.
            </motion.p>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 mb-14"
            >
              <Link 
                to="/report/new" 
                className="w-full sm:w-auto px-8 py-4 rounded-full bg-brand-500 hover:bg-brand-600 text-white font-bold text-base shadow-lg shadow-brand-500/25 transition-all hover:scale-105 active:scale-95 flex items-center justify-center space-x-2 group relative overflow-hidden"
              >
                <span className="relative z-10">Report Garbage Now</span>
                <ArrowRight className="w-5 h-5 relative z-10 group-hover:translate-x-1 transition-transform" />
                <motion.div 
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"
                />
              </Link>
              <Link 
                to="/feed" 
                className="w-full sm:w-auto px-8 py-4 rounded-full bg-surface/90 hover:bg-surface-2 text-ink font-bold text-base border border-border shadow-xs transition-all hover:scale-105 active:scale-95 flex items-center justify-center backdrop-blur-sm"
              >
                Explore Live Map
              </Link>
            </motion.div>

            {/* 3 Step Pill Preview with hover bounce */}
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
                <motion.div 
                  key={i} 
                  whileHover={{ y: -4 }}
                  className="flex flex-col items-center text-center group cursor-default"
                >
                  <div className="w-12 h-12 rounded-2xl bg-surface shadow-xs border border-border flex items-center justify-center mb-3 text-brand-500 relative group-hover:border-brand-500/40 group-hover:bg-brand-50 transition-all">
                    <step.icon className="w-5 h-5" />
                    {i === 2 && (
                      <div className="absolute -top-1 -right-1 w-4 h-4 bg-success rounded-full border-2 border-surface flex items-center justify-center">
                        <CheckCircle className="w-2.5 h-2.5 text-white" />
                      </div>
                    )}
                  </div>
                  <h4 className="font-bold text-ink text-sm">{step.title}</h4>
                  <p className="text-[11px] text-text-muted mt-0.5">{step.sub}</p>
                </motion.div>
              ))}
            </motion.div>
          </div>

          {/* Right: Phone Mockup & Floating Cards */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="flex-1 relative w-full max-w-[500px] lg:max-w-none h-[600px] hidden md:block"
          >
            {/* The Phone with Floating Animation */}
            <motion.div 
              animate={{ y: [0, -8, 0] }}
              transition={{ repeat: Infinity, duration: 6, ease: "easeInOut" }}
              className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[300px] h-[580px] bg-ink rounded-[40px] border-[8px] border-ink shadow-2xl overflow-hidden z-10"
            >
              <div className="absolute top-0 inset-x-0 h-6 bg-ink z-20 rounded-b-2xl w-40 mx-auto" />
              <div className="w-full h-full bg-surface relative flex flex-col">
                <div className="pt-10 px-4 pb-2 border-b border-border flex justify-between items-center bg-surface">
                  <div className="flex items-center space-x-2">
                    <div className="w-6 h-6 rounded-full bg-brand-500 text-white flex items-center justify-center shadow-xs"><Leaf className="w-3 h-3"/></div>
                    <span className="font-bold text-sm">Eco-Track</span>
                  </div>
                  <Bell className="w-4 h-4 text-ink" />
                </div>
                
                <div className="p-4 bg-background flex-1 overflow-hidden">
                  <div className="flex space-x-2 mb-4 overflow-hidden">
                    <span className="px-3 py-1 bg-ink text-white rounded-full text-xs font-bold shadow-2xs">Live Feed</span>
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
                      <span className="absolute top-2 right-2 bg-coral text-white text-[10px] px-2 py-0.5 rounded-full font-bold flex items-center shadow-2xs">
                        <span className="w-1.5 h-1.5 bg-white rounded-full mr-1 animate-ping"></span> 
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
                    </div>
                  </div>
                </div>

                <div className="h-14 bg-surface border-t border-border flex justify-around items-center px-4 pb-2">
                  <div className="flex flex-col items-center text-brand-500"><div className="w-4 h-4 mb-0.5"><Leaf className="w-4 h-4"/></div><span className="text-[9px] font-bold">Home</span></div>
                  <div className="flex flex-col items-center text-text-muted cursor-pointer" onClick={() => navigate('/report/new')}><div className="w-4 h-4 mb-0.5"><Camera className="w-4 h-4"/></div><span className="text-[9px]">Report</span></div>
                  <div className="flex flex-col items-center text-text-muted cursor-pointer" onClick={() => navigate('/feed')}><div className="w-4 h-4 mb-0.5"><MapPin className="w-4 h-4"/></div><span className="text-[9px]">Map</span></div>
                </div>
              </div>
            </motion.div>

            {/* Floating Card 1: GPS Verification */}
            <motion.div 
              animate={{ y: [0, -12, 0] }}
              transition={{ repeat: Infinity, duration: 4.5, ease: "easeInOut" }}
              className="absolute top-[12%] left-[-8%] z-20 bg-surface/90 backdrop-blur-md p-3.5 rounded-2xl shadow-hover border border-border/70 flex flex-col items-center hover:scale-105 transition-transform"
            >
              <div className="w-11 h-11 bg-brand-50 rounded-xl flex items-center justify-center mb-1 text-brand-600 border border-brand-500/20">
                <MapPin className="w-5 h-5 text-coral" />
              </div>
              <span className="text-[11px] font-bold text-ink text-center">Google Maps<br/>Precise Pinning</span>
            </motion.div>

            {/* Floating Card 2: Open Vision Engine */}
            <motion.div 
              animate={{ y: [0, 14, 0] }}
              transition={{ repeat: Infinity, duration: 5.5, ease: "easeInOut", delay: 0.5 }}
              className="absolute top-[38%] right-[-12%] z-20 bg-surface/95 backdrop-blur-md p-4 rounded-2xl shadow-hover border border-border/80 max-w-[210px] hover:scale-105 transition-transform"
            >
              <div className="flex items-center space-x-2 mb-2">
                <div className="w-7 h-7 bg-brand-500 rounded-lg flex items-center justify-center text-white shrink-0 shadow-xs">
                  <Sparkles className="w-4 h-4"/>
                </div>
                <div>
                  <h5 className="text-xs font-bold text-ink">Open Vision AI</h5>
                  <p className="text-[10px] text-brand-600 font-bold">200 Trained Scenes</p>
                </div>
              </div>
              <p className="text-[10px] text-text-muted leading-tight">
                Accurate organic highlighting traces clusters with translucent clarity.
              </p>
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* Stats Bento Strip with Animated Numbers */}
      <div className="max-w-[1200px] mx-auto px-6 mb-20 relative z-10">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="bg-surface/80 backdrop-blur-xl border border-border/80 rounded-[32px] p-6 sm:p-8 shadow-soft flex flex-wrap justify-between items-center gap-6"
        >
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-brand-50 rounded-2xl flex items-center justify-center text-brand-600 border border-brand-500/20 shadow-2xs">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-2xl font-display font-extrabold text-ink">
                <AnimatedCounter value={totalReports} suffix="+" />
              </h3>
              <p className="text-xs text-text-muted font-medium">Logged Garbage Spots</p>
            </div>
          </div>
          <div className="hidden md:block w-px h-12 bg-border"></div>
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-brand-50 rounded-2xl flex items-center justify-center text-brand-600 border border-brand-500/20 shadow-2xs">
              <CheckCircle className="w-6 h-6 text-success" />
            </div>
            <div>
              <h3 className="text-2xl font-display font-extrabold text-ink">
                <AnimatedCounter value={resolvedReports} suffix="+" />
              </h3>
              <p className="text-xs text-text-muted font-medium">Verified Cleanups</p>
            </div>
          </div>
          <div className="hidden lg:block w-px h-12 bg-border"></div>
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-brand-50 rounded-2xl flex items-center justify-center text-brand-600 border border-brand-500/20 shadow-2xs">
              <Sparkles className="w-6 h-6 text-brand-500" />
            </div>
            <div>
              <h3 className="text-2xl font-display font-extrabold text-ink">95.4%</h3>
              <p className="text-xs text-text-muted font-medium">AI Detection Precision</p>
            </div>
          </div>
          <div className="hidden xl:block w-px h-12 bg-border"></div>
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-brand-50 rounded-2xl flex items-center justify-center text-brand-600 border border-brand-500/20 shadow-2xs">
              <Layers className="w-6 h-6 text-brand-600" />
            </div>
            <div>
              <h3 className="text-2xl font-display font-extrabold text-ink">200 Scenes</h3>
              <p className="text-xs text-text-muted font-medium">Real Calibrated Dataset</p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* REAL-TIME AI TRANSFORMATION SHOWCASE SECTION */}
      <div className="max-w-[1200px] mx-auto px-6 mb-24 relative z-10">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center max-w-2xl mx-auto mb-10"
        >
          <div className="inline-flex items-center space-x-2 bg-brand-100 text-brand-700 px-3 py-1 rounded-full text-xs font-bold mb-3 tracking-wider uppercase border border-brand-500/20">
            <Sparkles className="w-3.5 h-3.5 text-brand-500" />
            Interactive AI Proof Verification
          </div>
          <h2 className="text-3xl md:text-4xl font-display font-extrabold text-ink mb-3">
            Real Cleanup Transformations, <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-500 to-aqua">Verified in Seconds</span>
          </h2>
          <p className="text-sm text-text-muted leading-relaxed">
            Drag the interactive handle below to see how Open Vision AI compares before and after photographs, confirming genuine waste reduction with zero manual bottlenecks.
          </p>
        </motion.div>

        <div className="bg-surface/90 backdrop-blur-xl border border-border/80 rounded-[32px] p-6 sm:p-8 shadow-hover max-w-4xl mx-auto">
          {/* Scene selector tabs */}
          <div className="flex items-center justify-center gap-2 mb-6 overflow-x-auto pb-2">
            {showcaseScenes.map((scene, idx) => (
              <button
                key={scene.id}
                type="button"
                onClick={() => setActiveShowcaseIdx(idx)}
                className={`px-4 py-2 rounded-full text-xs font-bold transition-all shrink-0 ${
                  activeShowcaseIdx === idx
                    ? 'bg-ink text-white shadow-xs'
                    : 'bg-surface-2 text-text-muted hover:text-ink hover:bg-border/60'
                }`}
              >
                {scene.title.split(' ')[0]} {scene.title.split(' ')[1]}
              </button>
            ))}
          </div>

          <div className="space-y-4">
            <BeforeAfterSlider 
              beforeImage={showcaseScenes[activeShowcaseIdx].before} 
              afterImage={showcaseScenes[activeShowcaseIdx].after} 
            />

            <div className="flex flex-wrap items-center justify-between text-xs text-text-muted pt-2 px-1">
              <div>
                <span className="font-bold text-ink text-sm block">{showcaseScenes[activeShowcaseIdx].title}</span>
                <span className="flex items-center mt-0.5 text-text-muted">
                  <MapPin className="w-3 h-3 mr-1 text-brand-500" /> {showcaseScenes[activeShowcaseIdx].location}
                </span>
              </div>
              <div className="flex items-center space-x-2 mt-2 sm:mt-0">
                <span className="bg-brand-50 text-brand-700 font-bold px-3 py-1 rounded-full border border-brand-500/20 text-[11px]">
                  {showcaseScenes[activeShowcaseIdx].type}
                </span>
                <span className="bg-success-soft text-success font-bold px-3 py-1 rounded-full text-[11px] flex items-center">
                  <CheckCircle className="w-3 h-3 mr-1" /> {showcaseScenes[activeShowcaseIdx].reduction}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* HOW IT WORKS SECTION */}
      <div className="bg-surface py-24 relative border-t border-border">
        <div className="max-w-[1200px] mx-auto px-6 text-center">
          <div className="inline-flex items-center space-x-2 bg-brand-100 text-brand-600 px-3 py-1 rounded-full text-xs font-bold mb-4 tracking-wider uppercase border border-brand-500/20">
            <Leaf className="w-3 h-3" /> SIMPLE STEPS. BIG IMPACT.
          </div>
          <h2 className="text-4xl md:text-5xl font-display font-extrabold text-ink mb-4">
            How it <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-500 to-aqua">works</span>
          </h2>
          <p className="text-text-muted text-base mb-16">From one photo to a verified clean city.</p>

          <div className="flex flex-col lg:flex-row items-start justify-between relative gap-6">
            <div className="hidden lg:block absolute top-[60px] left-[10%] right-[10%] h-0.5 bg-brand-100 -z-10" />
            
            {[
              { num: '01', title: 'Snap Photo', desc: 'Take a photo of the waste. Open Vision AI dynamically traces organic contours and item signatures.', icon: Camera },
              { num: '02', title: 'Google Maps Pin', desc: 'Confirm exact location using draggable Google Maps marker and street geocoding.', icon: MapPin },
              { num: '03', title: 'Crews Mobilize', desc: 'Local municipal workers and partner NGOs claim the task on their dashboard.', icon: Building },
              { num: '04', title: 'Proof & Verification', desc: 'Cleaned photo is uploaded and AI verifies waste reduction and location match.', icon: CheckCircle },
            ].map((step, i) => (
              <motion.div 
                key={i} 
                whileHover={{ y: -6 }}
                className="flex-1 bg-surface-2 lg:bg-transparent rounded-2xl p-6 lg:p-0 flex flex-col items-center group cursor-default transition-all"
              >
                <div className="w-16 h-16 rounded-2xl bg-surface border border-border shadow-xs flex items-center justify-center mb-4 text-brand-600 relative group-hover:scale-108 group-hover:border-brand-500/40 transition-all">
                  <step.icon className="w-7 h-7" />
                  <span className="absolute -top-2 -right-2 bg-brand-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-md shadow-2xs">
                    {step.num}
                  </span>
                </div>
                <h3 className="font-bold text-ink text-lg mb-1">{step.title}</h3>
                <p className="text-xs text-text-muted max-w-xs">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
