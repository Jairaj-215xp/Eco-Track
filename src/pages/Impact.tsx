import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Leaf, TrendingUp, Users, Trash2, MapPin, Award, CheckCircle } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { reportService } from '../services/reportService';
import { Report } from '../types';

export function Impact() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    reportService.getReports().then((data) => {
      setReports(data);
      setLoading(false);
    });
  }, []);

  // Compute Real Metrics
  const totalReports = reports.length;
  const verifiedCleanups = reports.filter(r => r.status === 'verified').length;
  
  // Unique reporters
  const uniqueReporters = new Set(reports.map(r => r.reporterId).filter(id => id && id !== 'anonymous')).size;
  const activeCitizensCount = Math.max(uniqueReporters, reports.length > 0 ? 1 : 0);

  // Waste categories breakdown from real reports
  const wasteCategories: Record<string, number> = {
    Plastic: 0,
    Organic: 0,
    Construction: 0,
    Household: 0,
    'Near Water': 0,
    Other: 0
  };

  reports.forEach(r => {
    if (r.wasteType === 'plastic') wasteCategories.Plastic++;
    else if (r.wasteType === 'organic') wasteCategories.Organic++;
    else if (r.wasteType === 'construction') wasteCategories.Construction++;
    else if (r.wasteType === 'household') wasteCategories.Household++;
    else if (r.wasteType === 'near_water') wasteCategories['Near Water']++;
    else wasteCategories.Other++;
  });

  const categoryChartData = Object.entries(wasteCategories)
    .filter(([_, count]) => count > 0 || totalReports === 0)
    .map(([name, count]) => ({ name, count }));

  // Trailing months reports vs resolutions
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const currentMonthIdx = new Date().getMonth();
  
  const monthlyData = Array.from({ length: 6 }, (_, i) => {
    const d = new Date();
    d.setMonth(currentMonthIdx - (5 - i));
    const mName = monthNames[d.getMonth()];
    const yearMonth = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;

    const monthReports = reports.filter(r => r.createdAt && r.createdAt.startsWith(yearMonth)).length;
    const monthResolved = reports.filter(r => r.status === 'verified' && r.updatedAt && r.updatedAt.startsWith(yearMonth)).length;

    return {
      name: mName,
      reports: monthReports,
      resolved: monthResolved
    };
  });

  // Estimated cleared tonnage (~15kg per verified domestic cleanup, ~200kg per construction/heavy)
  const estimatedTonnage = (
    reports
      .filter(r => r.status === 'verified')
      .reduce((acc, r) => acc + (r.wasteType === 'construction' ? 0.25 : 0.02), 0)
  ).toFixed(2);

  return (
    <div className="min-h-screen bg-background font-sans pt-12 pb-24">
      <div className="max-w-[1200px] mx-auto px-6">
        
        <div className="text-center mb-14">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center space-x-1.5 bg-brand-100 text-brand-700 px-3 py-1 rounded-full text-xs font-bold mb-4 tracking-wider uppercase"
          >
            <TrendingUp className="w-3.5 h-3.5" /> LIVE DATABASE METRICS
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-5xl font-display font-extrabold text-ink mb-3"
          >
            Our Community <span className="text-brand-600">Impact</span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-text-muted text-base max-w-xl mx-auto"
          >
            Real-time environmental transparency powered by active citizen reporting, municipal crews, and Open Vision AI verification.
          </motion.p>
        </div>

        {/* Top KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-10">
          {[
            { label: 'Estimated Waste Cleared', value: `${estimatedTonnage} tons`, icon: Trash2, color: 'text-brand-600', bg: 'bg-brand-100' },
            { label: 'Active Citizens', value: activeCitizensCount.toString(), icon: Users, color: 'text-sky', bg: 'bg-info-soft' },
            { label: 'Verified Cleanups', value: verifiedCleanups.toString(), icon: CheckCircle, color: 'text-warn', bg: 'bg-warn-soft' },
            { label: 'Total Reports Filed', value: totalReports.toString(), icon: Award, color: 'text-coral', bg: 'bg-danger-soft' },
          ].map((stat, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + (i * 0.05) }}
              className="bg-surface rounded-[24px] p-5 border border-border shadow-xs flex items-center space-x-4"
            >
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${stat.bg} ${stat.color} shrink-0`}>
                <stat.icon className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-2xl font-display font-bold text-ink">{stat.value}</h4>
                <p className="text-xs font-medium text-text-muted">{stat.label}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Chart */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4 }}
            className="lg:col-span-2 bg-surface rounded-[28px] p-6 border border-border shadow-xs"
          >
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 mb-6">
              <div>
                <h3 className="text-lg font-bold text-ink mb-0.5">Reports vs Resolutions</h3>
                <p className="text-xs text-text-muted">Real monthly trajectory from database</p>
              </div>
              <div className="flex space-x-4">
                <div className="flex items-center text-xs font-semibold"><span className="w-2.5 h-2.5 rounded-full bg-brand-500 mr-1.5"></span>Resolved</div>
                <div className="flex items-center text-xs font-semibold"><span className="w-2.5 h-2.5 rounded-full bg-aqua opacity-50 mr-1.5"></span>Reported</div>
              </div>
            </div>
            
            <div className="h-[280px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monthlyData}>
                  <defs>
                    <linearGradient id="colorReports" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4CC9C0" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#4CC9C0" stopOpacity={0.0}/>
                    </linearGradient>
                    <linearGradient id="colorResolved" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#34B27B" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#34B27B" stopOpacity={0.0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748B' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748B' }} allowDecimals={false} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: '1px solid #E2E8F0', fontSize: '11px' }}
                  />
                  <Area type="monotone" dataKey="reports" stroke="#4CC9C0" strokeWidth={2} fillOpacity={1} fill="url(#colorReports)" />
                  <Area type="monotone" dataKey="resolved" stroke="#34B27B" strokeWidth={2} fillOpacity={1} fill="url(#colorResolved)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          {/* Waste Categories Breakdown Bar Chart */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5 }}
            className="bg-surface rounded-[28px] p-6 border border-border shadow-xs flex flex-col"
          >
            <h3 className="text-lg font-bold text-ink mb-1">Waste Classification</h3>
            <p className="text-xs text-text-muted mb-6">Distribution by material category</p>
            
            <div className="h-[240px] w-full flex-1">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryChartData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E2E8F0" />
                  <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748B' }} allowDecimals={false} />
                  <YAxis type="category" dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748B' }} width={80} />
                  <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #E2E8F0', fontSize: '11px' }} />
                  <Bar dataKey="count" fill="#34B27B" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        </div>

      </div>
    </div>
  );
}
