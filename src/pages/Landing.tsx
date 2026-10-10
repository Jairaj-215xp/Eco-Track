import React from 'react';
import { motion } from 'framer-motion';
import { Camera, MapPin, Bell, ShieldCheck, ArrowRight, CheckCircle, Leaf, Users, Building, Trash2, Shield, Menu, User } from 'lucide-react';
import { Link } from 'react-router-dom';

export function Landing() {
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
              Eco-Track is an AI-powered community platform for reporting garbage in public spaces. Help build cleaner, healthier cities by connecting citizens, authorities and NGOs.
            </motion.p>
            
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="flex flex-col sm:flex-row items-center justify-center lg:justify-start space-y-4 sm:space-y-0 sm:space-x-4 mb-12"
            >
              <Link to="/report/new" className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-brand-500 to-aqua text-white font-semibold rounded-2xl flex items-center justify-center shadow-lg hover:shadow-xl hover:scale-105 transition-all">
                <Camera className="w-5 h-5 mr-2" />
                Report garbage <ArrowRight className="w-5 h-5 ml-2" />
              </Link>
              <Link to="/feed" className="w-full sm:w-auto px-8 py-4 bg-surface text-ink font-semibold rounded-2xl flex items-center justify-center border border-border shadow-sm hover:bg-surface-2 transition-all">
                <Menu className="w-5 h-5 mr-2" />
                Browse feed
              </Link>
            </motion.div>

            {/* 4 Steps Row */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="flex items-center justify-center lg:justify-start space-x-6 lg:space-x-8"
            >
              {[
                { icon: Camera, title: 'Upload Photo', sub: 'with location' },
                { icon: Bell, title: 'Notify', sub: 'Authorities & NGOs' },
                { icon: ShieldCheck, title: 'Cleanup', sub: 'Action on ground' },
                { icon: CheckCircle, title: 'Verify', sub: 'with AI & GPS' }
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
              <div className="w-full h-full bg-surface relative">
                {/* Fake App Header */}
                <div className="pt-10 px-4 pb-2 border-b border-border flex justify-between items-center bg-surface">
                  <div className="flex items-center space-x-2">
                    <div className="w-6 h-6 rounded-full bg-brand-500 text-white flex items-center justify-center"><Leaf className="w-3 h-3"/></div>
                    <span className="font-bold text-sm">Eco-Track</span>
                  </div>
                  <Bell className="w-4 h-4 text-ink" />
                </div>
                {/* Fake App Content */}
                <div className="p-4 bg-background h-full">
                  <div className="flex space-x-2 mb-4 overflow-hidden">
                    <span className="px-3 py-1 bg-ink text-white rounded-full text-xs font-medium">All</span>
                    <span className="px-3 py-1 bg-surface border border-border rounded-full text-xs font-medium text-text-muted">Nearby</span>
                    <span className="px-3 py-1 bg-surface border border-border rounded-full text-xs font-medium text-text-muted whitespace-nowrap">In Progress</span>
                  </div>
                  
                  <div className="bg-surface rounded-2xl shadow-sm border border-border overflow-hidden mb-4">
                    <div className="h-32 bg-gray-200 relative">
                      <img src="/mock-garbage-1.jpg" className="w-full h-full object-cover" alt="Mock" />
                      <span className="absolute top-2 right-2 bg-coral text-white text-[10px] px-2 py-1 rounded-full font-bold flex items-center">
                        <span className="w-1.5 h-1.5 bg-white rounded-full mr-1"></span> Reported
                      </span>
                    </div>
                    <div className="p-3">
                      <p className="text-[10px] text-text-muted mb-1 flex items-center"><MapPin className="w-3 h-3 mr-1"/> Kothrud, Pune</p>
                      <h4 className="font-bold text-sm text-ink leading-tight mb-1">Garbage near bus stop</h4>
                      <p className="text-[11px] text-text-muted line-clamp-2">Overflowing waste and plastic near the bus stop. Needs urgent cleanup.</p>
                      <div className="mt-3 flex justify-between items-center">
                        <span className="text-[10px] text-text-muted flex items-center">❤️ 12 💬 3</span>
                        <span className="text-[10px] font-medium text-brand-600 bg-brand-100 px-2 py-1 rounded-full">View Details &rarr;</span>
                      </div>
                    </div>
                  </div>
                </div>
                {/* Fake App Bottom Nav */}
                <div className="absolute bottom-0 inset-x-0 h-16 bg-surface border-t border-border flex justify-around items-center px-4 pb-2">
                  <div className="flex flex-col items-center text-brand-500"><div className="w-5 h-5 mb-1"><svg fill="currentColor" viewBox="0 0 24 24"><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/></svg></div><span className="text-[9px] font-medium">Home</span></div>
                  <div className="flex flex-col items-center text-text-muted"><div className="w-5 h-5 mb-1"><svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 4v16m8-8H4"/></svg></div><span className="text-[9px]">Report</span></div>
                  <div className="flex flex-col items-center text-text-muted"><div className="w-5 h-5 mb-1"><MapPin strokeWidth="2"/></div><span className="text-[9px]">Map</span></div>
                  <div className="flex flex-col items-center text-text-muted"><div className="w-5 h-5 mb-1"><User strokeWidth="2"/></div><span className="text-[9px]">Profile</span></div>
                </div>
              </div>
            </div>

            {/* Floating Card 1 */}
            <motion.div 
              animate={{ y: [0, -10, 0] }}
              transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
              className="absolute top-[10%] left-[-10%] z-20 bg-surface/90 backdrop-blur-md p-3 rounded-2xl shadow-hover border border-border flex flex-col items-center"
            >
              <div className="w-12 h-12 bg-brand-100 rounded-xl flex items-center justify-center mb-2">
                <MapPin className="w-6 h-6 text-coral" />
              </div>
              <span className="text-xs font-bold text-ink">Auto-detects<br/>location</span>
            </motion.div>

            {/* Floating Card 2 */}
            <motion.div 
              animate={{ y: [0, 15, 0] }}
              transition={{ repeat: Infinity, duration: 5, ease: "easeInOut", delay: 1 }}
              className="absolute top-[30%] right-[-15%] z-20 bg-surface/90 backdrop-blur-md p-3 rounded-2xl shadow-hover border border-border"
            >
              <div className="flex space-x-2 mb-2">
                <div className="w-16 h-16 rounded-lg overflow-hidden relative"><img src="/mock-garbage-1.jpg" className="w-full h-full object-cover grayscale"/><div className="absolute inset-x-0 bottom-0 bg-black/50 text-[9px] text-white text-center py-0.5">Before</div></div>
                <div className="w-16 h-16 rounded-lg overflow-hidden relative"><img src="/mock-garbage-4.jpg" className="w-full h-full object-cover"/><div className="absolute inset-x-0 bottom-0 bg-black/50 text-[9px] text-white text-center py-0.5">After</div></div>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 bg-brand-500 rounded-md flex items-center justify-center"><Leaf className="w-3 h-3 text-white"/></div>
                <span className="text-xs font-bold text-ink leading-tight">AI verifies<br/>cleanup</span>
                <div className="w-5 h-5 rounded-full bg-brand-500 text-white flex items-center justify-center ml-auto"><CheckCircle className="w-3 h-3"/></div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* Stats Bento Strip */}
      <div className="max-w-[1200px] mx-auto px-6 mb-24 relative z-10">
        <div className="bg-surface/80 backdrop-blur-xl border border-border rounded-[32px] p-8 shadow-soft flex flex-wrap justify-between items-center gap-6">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-brand-100 rounded-full flex items-center justify-center text-brand-600"><Users className="w-6 h-6" /></div>
            <div><h3 className="text-2xl font-display font-bold text-ink">500+</h3><p className="text-sm text-text-muted">Active Citizens</p></div>
          </div>
          <div className="hidden md:block w-px h-12 bg-border"></div>
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-brand-100 rounded-full flex items-center justify-center text-brand-600"><Building className="w-6 h-6" /></div>
            <div><h3 className="text-2xl font-display font-bold text-ink">20+</h3><p className="text-sm text-text-muted">Partner Organizations</p></div>
          </div>
          <div className="hidden lg:block w-px h-12 bg-border"></div>
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-brand-100 rounded-full flex items-center justify-center text-brand-600"><Trash2 className="w-6 h-6" /></div>
            <div><h3 className="text-2xl font-display font-bold text-ink">300+</h3><p className="text-sm text-text-muted">Reports Resolved</p></div>
          </div>
          <div className="hidden xl:block w-px h-12 bg-border"></div>
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-brand-100 rounded-full flex items-center justify-center text-brand-600"><Leaf className="w-6 h-6" /></div>
            <div><h3 className="text-xl font-display font-bold text-ink">Cleaner</h3><p className="text-sm text-text-muted">Greener Communities</p></div>
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
          <p className="text-text-muted text-lg mb-16">From one photo to a cleaner community.</p>

          <div className="flex flex-col lg:flex-row items-start justify-between relative gap-6">
            {/* Desktop connecting line */}
            <div className="hidden lg:block absolute top-[100px] left-[10%] right-[10%] h-0.5 bg-brand-100 -z-10" />
            
            {[
              { num: '01', title: 'Report', desc: 'Snap a photo of the garbage and capture its location.', icon: Camera },
              { num: '02', title: 'Notify', desc: 'Nearby authorities and NGOs receive the report.', icon: Bell },
              { num: '03', title: 'Clean', desc: 'A registered organisation accepts the task and cleans.', icon: Trash2 },
              { num: '04', title: 'Verify', desc: 'Before-and-after evidence is checked with AI.', icon: ShieldCheck }
            ].map((step, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="flex-1 bg-surface border border-border rounded-[32px] p-8 shadow-soft flex flex-col items-center relative w-full lg:w-auto"
              >
                <div className="absolute top-6 left-6 text-sm font-bold text-brand-600">{step.num}</div>
                <div className="w-24 h-24 rounded-full bg-brand-100 flex items-center justify-center text-brand-500 mb-6 mt-4">
                  <step.icon className="w-10 h-10" />
                </div>
                <h3 className="text-2xl font-bold text-ink mb-3">{step.title}</h3>
                <p className="text-text-muted">{step.desc}</p>
                {i < 3 && (
                  <div className="hidden lg:flex absolute top-1/2 -right-6 w-8 h-8 bg-brand-500 rounded-full text-white items-center justify-center shadow-md transform -translate-y-1/2 z-10">
                    <ArrowRight className="w-4 h-4" />
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
