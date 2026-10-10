import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { reportService } from '../services/reportService';
import { Report } from '../types';
import { ArrowLeft, MapPin, Clock, ThumbsUp, CheckCircle, Leaf, Trash2, Camera, ShieldCheck } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { MapView } from '../components/ui/MapView';
import { motion } from 'framer-motion';

function timeAgo(dateString: string) {
  const date = new Date(dateString);
  const now = new Date();
  const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
  if (diffInHours < 24) return `${diffInHours}h ago`;
  return `${Math.floor(diffInHours / 24)}d ago`;
}

export function ReportDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [report, setReport] = useState<Report | null>(null);
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const [upvotes, setUpvotes] = useState(0);

  useEffect(() => {
    if (id) {
      reportService.getReportById(id).then((data: Report | undefined) => {
        if (data) {
          setReport(data);
          setUpvotes(data.upvotes);
        }
      });
    }
  }, [id]);

  if (!report) return <div className="p-12 text-center text-text-muted">Loading...</div>;

  const isResolved = report.status === 'verified' || report.status === 'proof_submitted';

  return (
    <div className="bg-background min-h-[calc(100vh-96px)] font-sans pb-24">
      {/* Top Banner */}
      <div className="bg-surface border-b border-border py-4 sticky top-[80px] z-20">
        <div className="max-w-[1200px] mx-auto px-6 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button onClick={() => navigate(-1)} className="p-2 hover:bg-surface-2 rounded-full transition-colors text-text-muted hover:text-ink">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-xl font-display font-bold text-ink leading-tight capitalize">{report.wasteType.replace('_', ' ')} Waste</h1>
              <p className="text-xs text-text-muted flex items-center">
                <MapPin className="w-3 h-3 mr-1" /> {report.location.address}
              </p>
            </div>
          </div>
          
          <div className={`px-4 py-2 rounded-full text-sm font-bold flex items-center shadow-sm border ${
            isResolved ? 'bg-success-soft text-success border-success/20' : 
            'bg-warn-soft text-warn border-warn/20'
          }`}>
            {isResolved ? <CheckCircle className="w-4 h-4 mr-1.5" /> : <Clock className="w-4 h-4 mr-1.5" />}
            {report.status.replace('_', ' ')}
          </div>
        </div>
      </div>

      <div className="max-w-[1200px] mx-auto px-6 pt-8 flex flex-col lg:flex-row gap-8">
        
        {/* Main Content */}
        <div className="flex-1 space-y-8">
          
          {/* Before/After Slider */}
          <div className="bg-surface rounded-3xl border border-border p-2 shadow-sm overflow-hidden">
            <div 
              className="relative aspect-[16/9] lg:aspect-[21/9] rounded-[24px] overflow-hidden bg-gray-200 cursor-ew-resize select-none"
              onMouseMove={(e) => {
                if (!isDragging) return;
                const rect = e.currentTarget.getBoundingClientRect();
                const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
                setSliderPosition((x / rect.width) * 100);
              }}
              onMouseUp={() => setIsDragging(false)}
              onMouseLeave={() => setIsDragging(false)}
              onTouchMove={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const x = Math.max(0, Math.min(e.touches[0].clientX - rect.left, rect.width));
                setSliderPosition((x / rect.width) * 100);
              }}
            >
              {/* After Image (Background) */}
              {isResolved ? (
                <img src="/mock-garbage-4.jpg" alt="After" className="absolute inset-0 w-full h-full object-cover" />
              ) : (
                <div className="absolute inset-0 w-full h-full bg-surface-2 flex items-center justify-center text-text-muted flex-col">
                  <ShieldCheck className="w-12 h-12 mb-2 opacity-20" />
                  <p className="font-medium">Cleanup in progress. Check back soon!</p>
                </div>
              )}

              {/* Before Image (Foreground, Clipped) */}
              <div 
                className="absolute inset-0 w-full h-full overflow-hidden"
                style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}
              >
                <img src={report.photoUrl} alt="Before" className="absolute inset-0 w-full h-full object-cover grayscale-[0.3]" />
              </div>

              {/* Slider Handle */}
              {isResolved && (
                <div 
                  className="absolute top-0 bottom-0 w-1 bg-white cursor-ew-resize shadow-[0_0_10px_rgba(0,0,0,0.5)] z-10"
                  style={{ left: `${sliderPosition}%` }}
                  onMouseDown={(e) => { e.preventDefault(); setIsDragging(true); }}
                  onTouchStart={() => setIsDragging(true)}
                >
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-white rounded-full shadow-lg flex items-center justify-center border-2 border-brand-500">
                    <div className="flex space-x-0.5">
                      <div className="w-0.5 h-3 bg-brand-500 rounded-full" />
                      <div className="w-0.5 h-3 bg-brand-500 rounded-full" />
                    </div>
                  </div>
                </div>
              )}

              {isResolved && (
                <>
                  <div className="absolute bottom-4 left-4 bg-ink/70 backdrop-blur text-white px-3 py-1 rounded-full text-xs font-bold shadow-sm">Before</div>
                  <div className="absolute bottom-4 right-4 bg-brand-500/90 backdrop-blur text-white px-3 py-1 rounded-full text-xs font-bold shadow-sm">After</div>
                </>
              )}
            </div>
          </div>

          <div className="bg-surface rounded-3xl border border-border p-8 shadow-sm">
            <h2 className="text-2xl font-bold text-ink mb-4">Report Details</h2>
            <p className="text-text-muted text-lg leading-relaxed mb-6">
              {report.note || `Overflowing ${report.wasteType.replace('_', ' ')} waste reported by community member. Needs immediate attention to prevent further pollution.`}
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-6 border-t border-border">
              <div>
                <p className="text-xs text-text-muted font-bold uppercase mb-1">Severity</p>
                <span className={`px-2 py-1 rounded-md text-xs font-bold capitalize ${
                  report.severity === 'high' ? 'bg-danger-soft text-danger' : 
                  report.severity === 'medium' ? 'bg-warn-soft text-warn' : 'bg-success-soft text-success'
                }`}>{report.severity}</span>
              </div>
              <div>
                <p className="text-xs text-text-muted font-bold uppercase mb-1">Waste Type</p>
                <p className="font-semibold text-ink capitalize flex items-center"><Trash2 className="w-4 h-4 mr-1 text-brand-500" /> {report.wasteType.replace('_', ' ')}</p>
              </div>
              <div>
                <p className="text-xs text-text-muted font-bold uppercase mb-1">Reported On</p>
                <p className="font-semibold text-ink flex items-center"><Clock className="w-4 h-4 mr-1 text-brand-500" /> {new Date(report.createdAt).toLocaleDateString()}</p>
              </div>
              <div>
                <p className="text-xs text-text-muted font-bold uppercase mb-1">Verified By</p>
                <p className="font-semibold text-ink flex items-center"><Leaf className="w-4 h-4 mr-1 text-brand-500" /> Eco-Track AI</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="w-full lg:w-[380px] space-y-6">
          
          <div className="bg-surface rounded-3xl border border-border p-6 shadow-sm">
            <Button 
              size="lg" 
              variant={upvotes > report.upvotes ? "primary" : "soft"}
              className={`w-full mb-6 ${upvotes > report.upvotes ? 'bg-coral border-coral' : ''}`}
              leftIcon={<ThumbsUp className="w-5 h-5" />}
              onClick={() => setUpvotes(u => u + 1)}
            >
              Upvote this Report ({upvotes})
            </Button>

            <h3 className="font-bold text-ink mb-6">Timeline</h3>
            <div className="relative pl-6 space-y-8">
              <div className="absolute top-2 bottom-2 left-2 w-0.5 bg-border z-0" />
              
              <div className="relative z-10">
                <div className="absolute -left-6 top-1 w-4 h-4 bg-brand-500 rounded-full border-2 border-surface" />
                <p className="font-bold text-ink text-sm">Report Submitted</p>
                <p className="text-xs text-text-muted">{new Date(report.createdAt).toLocaleString()}</p>
              </div>

              <div className="relative z-10">
                <div className={`absolute -left-6 top-1 w-4 h-4 rounded-full border-2 border-surface ${report.status !== 'reported' ? 'bg-brand-500' : 'bg-surface-2 border-border'}`} />
                <p className={`font-bold text-sm ${report.status !== 'reported' ? 'text-ink' : 'text-text-muted'}`}>Assigned to Org</p>
                <p className="text-xs text-text-muted">Pune Cleanup Crew</p>
              </div>

              <div className="relative z-10">
                <div className={`absolute -left-6 top-1 w-4 h-4 rounded-full border-2 border-surface ${isResolved ? 'bg-success' : 'bg-surface-2 border-border'}`} />
                <p className={`font-bold text-sm ${isResolved ? 'text-ink' : 'text-text-muted'}`}>Verified Clean</p>
                <p className="text-xs text-text-muted">{isResolved ? 'Confirmed by AI' : 'Pending resolution'}</p>
              </div>
            </div>
          </div>

          <div className="bg-surface rounded-3xl border border-border p-2 shadow-sm">
            <div className="h-[200px] rounded-[20px] overflow-hidden relative">
              <MapView reports={[report]} zoom={15} />
              <div className="absolute inset-0 border-[4px] border-surface pointer-events-none rounded-[20px]" />
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
