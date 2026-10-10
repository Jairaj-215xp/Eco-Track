import React, { useState, useEffect, useCallback } from 'react';
import { reportService } from '../services/reportService';
import { Report } from '../types';
import { Button } from '../components/ui/Button';
import { StatusChip } from '../components/ui/StatusChip';
import { MapPin, Clock, Search, Filter } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function OrgDashboard() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'nearby' | 'accepted' | 'completed'>('nearby');
  const navigate = useNavigate();

  const fetchReports = useCallback(() => {
    setLoading(true);
    reportService.getReports().then(data => {
      setReports(data);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const handleAccept = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    await reportService.updateReportStatus(id, 'assigned', 'org1');
    fetchReports();
  };

  const filteredReports = reports.filter(r => {
    if (tab === 'nearby') return r.status === 'reported';
    if (tab === 'accepted') return ['assigned', 'in_progress'].includes(r.status);
    if (tab === 'completed') return ['proof_submitted', 'verified'].includes(r.status);
    return true;
  });

  return (
    <div className="max-w-[1080px] mx-auto px-4 sm:px-6 py-8 min-h-[80vh]">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-text">Dashboard</h1>
          <p className="text-text-muted mt-1">Pune Cleanup Crew (NGO)</p>
        </div>
        <div className="flex space-x-3 w-full md:w-auto">
          <Button variant="soft" leftIcon={<Filter className="w-4 h-4" />}>Filter</Button>
          <div className="relative flex-grow md:flex-grow-0">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-text-muted" />
            <input 
              type="text" 
              placeholder="Search reports..." 
              className="w-full bg-surface border border-border rounded-xl pl-9 pr-4 py-2 focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent text-sm"
            />
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'New Nearby', value: reports.filter(r => r.status === 'reported').length, color: 'text-danger' },
          { label: 'In Progress', value: reports.filter(r => ['assigned', 'in_progress'].includes(r.status)).length, color: 'text-warn' },
          { label: 'Completed', value: reports.filter(r => ['proof_submitted', 'verified'].includes(r.status)).length, color: 'text-success' },
          { label: 'Avg. Response', value: '2.4h', color: 'text-info' },
        ].map((stat, idx) => (
          <div key={idx} className="bg-surface rounded-2xl border border-border p-4 shadow-soft">
            <p className="text-xs text-text-muted uppercase tracking-wider mb-2">{stat.label}</p>
            <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex space-x-2 border-b border-border mb-6">
        {['nearby', 'accepted', 'completed'].map((t) => (
          <button
            key={t}
            onClick={() => setTab(t as any)}
            className={`pb-3 px-1 text-sm font-medium capitalize border-b-2 transition-colors ${tab === t ? 'border-accent text-accent' : 'border-transparent text-text-muted hover:text-text'}`}
          >
            {t.replace('_', ' ')}
          </button>
        ))}
      </div>

      {/* Table/List */}
      <div className="bg-surface rounded-2xl border border-border overflow-hidden shadow-soft">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[600px]">
            <thead>
              <tr className="bg-surface-2 text-text-muted text-xs uppercase tracking-wider border-b border-border">
                <th className="p-4 font-medium">Report</th>
                <th className="p-4 font-medium">Location</th>
                <th className="p-4 font-medium">Status</th>
                <th className="p-4 font-medium">Severity</th>
                <th className="p-4 font-medium text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                [1,2,3].map(i => (
                  <tr key={i} className="animate-pulse">
                    <td className="p-4"><div className="w-24 h-16 bg-surface-2 rounded-lg"></div></td>
                    <td className="p-4"><div className="w-32 h-4 bg-surface-2 rounded mb-2"></div></td>
                    <td className="p-4"><div className="w-16 h-6 bg-surface-2 rounded-full"></div></td>
                    <td className="p-4"><div className="w-12 h-4 bg-surface-2 rounded"></div></td>
                    <td className="p-4 text-right"><div className="w-20 h-8 bg-surface-2 rounded-xl ml-auto"></div></td>
                  </tr>
                ))
              ) : filteredReports.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-12 text-center text-text-muted">No reports in this category.</td>
                </tr>
              ) : (
                filteredReports.map(report => (
                  <tr key={report.id} className="hover:bg-surface-2/50 transition-colors cursor-pointer" onClick={() => navigate(`/report/${report.id}`)}>
                    <td className="p-4">
                      <div className="flex items-center space-x-3">
                        <img src={report.photoUrl} className="w-16 h-12 object-cover rounded-lg" alt="Thumbnail" />
                        <span className="font-medium capitalize text-text text-sm whitespace-nowrap">{report.wasteType.replace('_', ' ')}</span>
                      </div>
                    </td>
                    <td className="p-4 text-sm text-text-muted">
                      <div className="flex items-center"><MapPin className="w-3 h-3 mr-1 shrink-0" /> <span className="truncate max-w-[150px]">{report.location.address}</span></div>
                    </td>
                    <td className="p-4"><StatusChip status={report.status} /></td>
                    <td className="p-4 text-sm capitalize text-text">{report.severity}</td>
                    <td className="p-4 text-right whitespace-nowrap">
                      {tab === 'nearby' && <Button size="sm" onClick={(e) => handleAccept(e, report.id)}>Accept</Button>}
                      {tab === 'accepted' && <Button size="sm" variant="soft" onClick={(e) => { e.stopPropagation(); navigate(`/org/report/${report.id}/proof`); }}>Submit Proof</Button>}
                      {tab === 'completed' && <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); navigate(`/report/${report.id}`); }}>View</Button>}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
