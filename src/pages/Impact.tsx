import React from 'react';
import { motion } from 'framer-motion';
import { Leaf, TrendingUp, Users, Trash2, MapPin, Award } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

const data = [
  { name: 'Jan', reports: 400, resolved: 240 },
  { name: 'Feb', reports: 300, resolved: 139 },
  { name: 'Mar', reports: 200, resolved: 980 },
  { name: 'Apr', reports: 278, resolved: 390 },
  { name: 'May', reports: 189, resolved: 480 },
  { name: 'Jun', reports: 239, resolved: 380 },
  { name: 'Jul', reports: 349, resolved: 430 },
];

const categoryData = [
  { name: 'Plastic', count: 420 },
  { name: 'Organic', count: 180 },
  { name: 'Glass', count: 250 },
  { name: 'Metal', count: 120 },
];

export function Impact() {
  return (
    <div className="min-h-screen bg-background font-sans pt-12 pb-24">
      <div className="max-w-[1200px] mx-auto px-6">
        
        <div className="text-center mb-16">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center space-x-2 bg-brand-100 text-brand-600 px-3 py-1 rounded-full text-xs font-bold mb-6 tracking-wider uppercase"
          >
            <TrendingUp className="w-3 h-3" /> LIVE METRICS
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-5xl font-display font-extrabold text-ink mb-4"
          >
            Our Community <span className="text-brand-600">Impact</span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-text-muted text-xl max-w-2xl mx-auto"
          >
            Transparent, real-time data on how citizens and organizations are working together to clean up our cities.
          </motion.p>
        </div>

        {/* Top KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {[
            { label: 'Total Waste Cleared', value: '12.4 t', icon: Trash2, color: 'text-brand-600', bg: 'bg-brand-100' },
            { label: 'Active Citizens', value: '8,432', icon: Users, color: 'text-sky', bg: 'bg-info-soft' },
            { label: 'Locations Cleaned', value: '1,204', icon: MapPin, color: 'text-warn', bg: 'bg-warn-soft' },
            { label: 'Partner NGOs', value: '42', icon: Award, color: 'text-coral', bg: 'bg-danger-soft' },
          ].map((stat, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + (i * 0.1) }}
              className="bg-surface rounded-[24px] p-6 border border-border shadow-sm flex items-center space-x-4"
            >
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${stat.bg} ${stat.color}`}>
                <stat.icon className="w-7 h-7" />
              </div>
              <div>
                <h4 className="text-2xl font-display font-bold text-ink">{stat.value}</h4>
                <p className="text-sm font-medium text-text-muted">{stat.label}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Chart */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.7 }}
            className="lg:col-span-2 bg-surface rounded-[32px] p-8 border border-border shadow-sm"
          >
            <div className="flex justify-between items-center mb-8">
              <div>
                <h3 className="text-xl font-bold text-ink mb-1">Reports vs Resolutions</h3>
                <p className="text-sm text-text-muted">Trailing 7 months activity</p>
              </div>
              <div className="flex space-x-4">
                <div className="flex items-center text-sm"><span className="w-3 h-3 rounded-full bg-brand-500 mr-2"></span>Resolved</div>
                <div className="flex items-center text-sm"><span className="w-3 h-3 rounded-full bg-aqua opacity-50 mr-2"></span>Reported</div>
              </div>
            </div>
            
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorResolved" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#34B27B" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#34B27B" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorReported" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4CC9C0" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#4CC9C0" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E4EEE9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#7A8F87', fontSize: 12 }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#7A8F87', fontSize: 12 }} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 12px 32px -8px rgba(16,35,28,.10)', fontWeight: 600 }}
                  />
                  <Area type="monotone" dataKey="reports" stroke="#4CC9C0" fillOpacity={1} fill="url(#colorReported)" strokeWidth={3} />
                  <Area type="monotone" dataKey="resolved" stroke="#34B27B" fillOpacity={1} fill="url(#colorResolved)" strokeWidth={3} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          {/* Secondary Chart */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.8 }}
            className="bg-surface rounded-[32px] p-8 border border-border shadow-sm flex flex-col"
          >
            <h3 className="text-xl font-bold text-ink mb-1">Waste by Category</h3>
            <p className="text-sm text-text-muted mb-8">Distribution of resolved waste</p>
            
            <div className="flex-1 min-h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryData} layout="vertical" margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E4EEE9" />
                  <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: '#7A8F87', fontSize: 12 }} />
                  <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fill: '#10231C', fontSize: 13, fontWeight: 600 }} />
                  <Tooltip cursor={{ fill: '#F6FAF8' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }} />
                  <Bar dataKey="count" fill="#34B27B" radius={[0, 8, 8, 0]} barSize={24} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        </div>

      </div>
    </div>
  );
}
