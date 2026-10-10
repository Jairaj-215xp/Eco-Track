import React from 'react';
import { motion } from 'framer-motion';
import { Camera, Bell, ShieldCheck, ArrowRight, CheckCircle, Leaf, Users, Building, Trash2 } from 'lucide-react';

export function HowItWorks() {
  return (
    <div className="min-h-screen bg-background font-sans pt-12 pb-24 overflow-hidden relative">
      {/* Background blobs */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-brand-500/10 blur-[100px]" />
        <div className="absolute bottom-[20%] right-[-10%] w-[40%] h-[40%] rounded-full bg-aqua/10 blur-[120px]" />
      </div>

      <div className="max-w-[1200px] mx-auto px-6 text-center pt-8">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center space-x-2 bg-brand-100 text-brand-600 px-3 py-1 rounded-full text-xs font-bold mb-6 tracking-wider uppercase"
        >
          <Leaf className="w-3 h-3" /> SIMPLE STEPS. BIG IMPACT.
        </motion.div>
        
        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-5xl md:text-[64px] font-display font-extrabold text-ink mb-6 tracking-tight"
        >
          How it <span className="text-brand-600">works</span>
        </motion.h1>
        
        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-text-muted text-xl mb-24 max-w-2xl mx-auto"
        >
          From one photo to a cleaner community.
        </motion.p>

        {/* 4 Steps Row */}
        <div className="flex flex-col lg:flex-row items-start justify-between relative gap-6 mb-24">
          {/* Desktop connecting line */}
          <div className="hidden lg:block absolute top-[120px] left-[10%] right-[10%] h-0.5 bg-brand-100 -z-10" />
          
          {[
            { num: '01', title: 'Report', desc: 'Snap a photo of the garbage and capture its location.', icon: Camera },
            { num: '02', title: 'Notify', desc: 'Nearby authorities and NGOs receive the report.', icon: Bell },
            { num: '03', title: 'Clean', desc: 'A registered organisation accepts the task and cleans the area.', icon: Trash2 },
            { num: '04', title: 'Verify', desc: 'Before-and-after evidence is checked with AI and location data.', icon: ShieldCheck }
          ].map((step, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + (i * 0.1) }}
              className="flex-1 bg-surface border border-border rounded-[32px] p-8 shadow-soft flex flex-col items-center relative w-full lg:w-auto"
            >
              <div className="absolute top-6 left-6 text-sm font-bold text-brand-600 bg-brand-100/50 w-8 h-8 rounded-full flex items-center justify-center">{step.num}</div>
              <div className="w-32 h-32 rounded-3xl bg-brand-100/30 flex items-center justify-center text-brand-500 mb-8 mt-6 relative overflow-hidden border border-brand-500/10">
                <step.icon className="w-12 h-12 relative z-10" />
                <div className="absolute -bottom-4 -right-4 w-20 h-20 bg-brand-500/10 rounded-full blur-xl" />
              </div>
              <h3 className="text-2xl font-display font-bold text-ink mb-4">{step.title}</h3>
              <p className="text-text-muted text-sm leading-relaxed max-w-[200px] mx-auto">{step.desc}</p>
              
              {i < 3 && (
                <div className="hidden lg:flex absolute top-[120px] -right-8 w-10 h-10 bg-brand-500 rounded-full text-white items-center justify-center shadow-md transform -translate-y-1/2 z-10 border-4 border-background">
                  <ArrowRight className="w-5 h-5" />
                </div>
              )}
            </motion.div>
          ))}
        </div>

        {/* Stats Strip */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="bg-brand-100/50 backdrop-blur-xl border border-brand-500/20 rounded-[40px] p-8 md:p-12 shadow-sm flex flex-wrap justify-between items-center gap-8 max-w-5xl mx-auto relative overflow-hidden"
        >
          {/* Decorative faint icon */}
          <Leaf className="absolute -left-10 -bottom-10 w-40 h-40 text-brand-500/5" />
          
          <div className="flex items-center space-x-6 relative z-10">
            <div className="w-14 h-14 bg-surface rounded-2xl flex items-center justify-center text-brand-600 shadow-sm"><CheckCircle className="w-7 h-7" /></div>
            <div className="text-left"><h3 className="text-3xl font-display font-bold text-ink">1,204</h3><p className="text-sm font-semibold text-text-muted mt-1 uppercase tracking-wide">Reports Filed</p></div>
          </div>
          <div className="hidden md:block w-px h-16 bg-brand-500/20 relative z-10"></div>
          
          <div className="flex items-center space-x-6 relative z-10">
            <div className="w-14 h-14 bg-surface rounded-2xl flex items-center justify-center text-brand-600 shadow-sm"><CheckCircle className="w-7 h-7" /></div>
            <div className="text-left"><h3 className="text-3xl font-display font-bold text-ink">856</h3><p className="text-sm font-semibold text-text-muted mt-1 uppercase tracking-wide">Resolved</p></div>
          </div>
          <div className="hidden lg:block w-px h-16 bg-brand-500/20 relative z-10"></div>
          
          <div className="flex items-center space-x-6 relative z-10">
            <div className="w-14 h-14 bg-surface rounded-2xl flex items-center justify-center text-brand-600 shadow-sm"><Users className="w-7 h-7" /></div>
            <div className="text-left"><h3 className="text-3xl font-display font-bold text-ink">24</h3><p className="text-sm font-semibold text-text-muted mt-1 uppercase tracking-wide">Active Organisations</p></div>
          </div>
        </motion.div>

      </div>
    </div>
  );
}
