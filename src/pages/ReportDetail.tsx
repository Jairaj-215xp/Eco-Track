import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { reportService } from '../services/reportService';
import { Report } from '../types';
import { ChevronLeft, MapPin, Clock, User, AlertTriangle, ThumbsUp, MessageSquare, CheckCircle } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { StatusChip } from '../components/ui/StatusChip';
import { BeforeAfterSlider } from '../components/report/BeforeAfterSlider';

export function ReportDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      reportService.getReportById(id).then(data => {
        if (data) setReport(data);
        setLoading(false);
      });
    }
  }, [id]);

  if (loading) {
    return <div className="max-w-[640px] mx-auto p-4 animate-pulse">
      <div className="h-64 bg-surface rounded-2xl mb-4"></div>
      <div className="h-8 w-1/3 bg-surface rounded mb-4"></div>
      <div className="h-4 w-1/2 bg-surface rounded mb-2"></div>
    </div>;
  }

  if (!report) {
    return <div className="p-8 text-center text-text-muted">Report not found</div>;
  }

  const handleUpvote = async () => {
    if (!report) return;
    const newUpvotes = await reportService.upvoteReport(report.id);
    setReport({ ...report, upvotes: newUpvotes });
  };

  return (
    <div className="max-w-[640px] mx-auto bg-background min-h-screen">
      {/* Header Image */}
      <div className="relative h-72 md:h-96 w-full">
        <button 
          onClick={() => navigate(-1)}
          className="absolute top-4 left-4 z-10 p-2 bg-background/80 backdrop-blur-md rounded-full text-text hover:bg-surface-2 transition-colors"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
        <img src={report.photoUrl} alt="Garbage" className="w-full h-full object-cover" />
      </div>

      {/* Content */}
      <div className="px-4 py-6 sm:px-6 relative -mt-8 bg-background rounded-t-[2rem]">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-2xl font-bold text-text capitalize mb-2">
              {report.wasteType.replace('_', ' ')} Waste
            </h1>
            <div className="flex items-center text-text-muted text-sm space-x-4">
              <span className="flex items-center"><MapPin className="w-4 h-4 mr-1" /> {report.location.address}</span>
            </div>
          </div>
          <StatusChip status={report.status} className="text-sm px-3 py-1" />
        </div>

        <div className="flex space-x-4 mb-8 pb-6 border-b border-border">
          <div className="flex-1 bg-surface-2 rounded-xl p-3 text-center">
            <span className="block text-xs text-text-muted mb-1 uppercase tracking-wider">Severity</span>
            <span className="font-semibold text-text capitalize">{report.severity}</span>
          </div>
          <div className="flex-1 bg-surface-2 rounded-xl p-3 text-center">
            <span className="block text-xs text-text-muted mb-1 uppercase tracking-wider">Reporter</span>
            <span className="font-semibold text-text">Aarav</span>
          </div>
        </div>

        {report.note && (
          <div className="mb-8">
            <h3 className="text-sm font-semibold text-text mb-2 uppercase tracking-wider">Note</h3>
            <p className="text-text-muted">{report.note}</p>
          </div>
        )}

        {/* Timeline */}
        <div className="mb-8">
          <h3 className="text-sm font-semibold text-text mb-4 uppercase tracking-wider">Timeline</h3>
          <div className="space-y-6 ml-2 border-l-2 border-border pl-6 relative">
            {report.timeline.map((event, idx) => (
              <div key={idx} className="relative">
                <div className={`absolute -left-[33px] top-1 w-4 h-4 rounded-full border-4 border-background ${idx === report.timeline.length - 1 ? 'bg-accent' : 'bg-border'}`}></div>
                <div className="flex flex-col">
                  <span className="font-medium text-text capitalize">{event.status.replace('_', ' ')}</span>
                  <span className="text-xs text-text-muted mt-1">{new Date(event.at).toLocaleString()}</span>
                  {event.by && <span className="text-sm text-text-muted mt-1">by {event.by === 'org1' ? 'Pune Cleanup Crew' : 'PMC Ward 5'}</span>}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Verification & Proof */}
        {report.proof && report.status === 'verified' && (
          <div className="mb-8">
            <h3 className="text-sm font-semibold text-text mb-4 uppercase tracking-wider">Cleanup Proof</h3>
            <BeforeAfterSlider beforeImage={report.photoUrl} afterImage={report.proof.mediaUrl} />
            <div className="mt-4 bg-success-soft border border-success/20 rounded-xl p-4 flex flex-col space-y-2">
              <div className="flex items-center text-success font-medium">
                <CheckCircle className="w-5 h-5 mr-2" /> AI Verification Passed
              </div>
              <ul className="text-sm text-success/80 list-disc list-inside ml-1">
                <li>Location match verified (<span className="font-mono">{report.proof.distanceFromReportM}m</span> away)</li>
                <li>Waste reduction: <span className="capitalize font-semibold">{report.proof.verification?.wasteReduction}</span></li>
              </ul>
            </div>
          </div>
        )}

        {/* Action Bar (Fixed Bottom) */}
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/95 backdrop-blur-md border-t border-border flex items-center justify-between md:relative md:bg-transparent md:border-none md:p-0">
          <div className="flex space-x-3">
            <Button variant="soft" leftIcon={<ThumbsUp className="w-4 h-4" />} onClick={handleUpvote}>
              {report.upvotes}
            </Button>
            <Button variant="soft" leftIcon={<MessageSquare className="w-4 h-4" />}>
              Comment
            </Button>
          </div>
          <Button variant="danger">
            Flag
          </Button>
        </div>
        <div className="h-20 md:hidden"></div> {/* Spacer for fixed bottom bar */}
      </div>
    </div>
  );
}
