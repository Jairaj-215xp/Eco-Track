import React from 'react';
import { Report } from '../../types';
import { MapPin, Clock, Trash2, Share, CheckCircle } from 'lucide-react';

interface ReportCardProps {
  report: Report;
  onClick?: () => void;
}

function timeAgo(dateString: string) {
  const date = new Date(dateString);
  const now = new Date();
  const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
  if (diffInHours < 24) return `${diffInHours}h ago`;
  return `${Math.floor(diffInHours / 24)}d ago`;
}

export function ReportCard({ report, onClick }: ReportCardProps) {
  const [upvotes, setUpvotes] = React.useState(report.upvotes);

  const handleUpvote = (e: React.MouseEvent) => {
    e.stopPropagation();
    setUpvotes(v => v + 1);
  };

  const isResolved = report.status === 'verified' || report.status === 'proof_submitted';
  const isProgress = report.status === 'in_progress' || report.status === 'assigned';
  const isReported = report.status === 'reported';

  return (
    <div 
      onClick={onClick} 
      className="bg-surface rounded-3xl border border-border overflow-hidden shadow-sm hover:shadow-hover transition-all cursor-pointer group flex flex-col h-[400px]"
    >
      <div className="relative h-48 overflow-hidden shrink-0">
        <img 
          src={report.photoUrl} 
          alt={report.wasteType} 
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-ink/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        
        {/* Status Pill Top Left */}
        <div className="absolute top-4 left-4">
          <div className={`px-3 py-1.5 rounded-full text-xs font-bold flex items-center shadow-sm backdrop-blur-md bg-surface/95 border ${
            isResolved ? 'text-success border-success/20' : 
            isProgress ? 'text-sun border-sun/20' : 
            'text-coral border-coral/20'
          }`}>
            {isResolved ? <CheckCircle className="w-3.5 h-3.5 mr-1" /> :
             isProgress ? <Clock className="w-3.5 h-3.5 mr-1" /> :
             <span className="w-3 h-3 flex items-center justify-center font-sans border-2 border-current rounded-sm text-[8px] mr-1.5">!</span>}
            {report.status.replace('_', ' ')}
          </div>
        </div>

        {/* Time Top Right */}
        <div className="absolute top-4 right-4 bg-ink/70 backdrop-blur-md text-white px-3 py-1.5 rounded-full text-xs font-medium flex items-center">
          <Clock className="w-3 h-3 mr-1 opacity-80" /> {timeAgo(report.createdAt)}
        </div>
      </div>

      <div className="p-5 flex flex-col flex-grow">
        <div className="flex items-center text-text-muted text-[11px] font-semibold mb-2 uppercase tracking-wide">
          <Trash2 className="w-3.5 h-3.5 mr-1.5 text-brand-500" />
          {report.wasteType.replace('_', ' ')} Waste
        </div>
        
        <h3 className="font-bold text-ink text-[17px] leading-tight mb-1">
          {report.wasteType.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
        </h3>
        
        <div className="flex items-center text-text-muted text-[13px] mb-3">
          <MapPin className="w-3.5 h-3.5 mr-1 shrink-0" />
          <span className="truncate">{report.location.address}</span>
        </div>

        <p className="text-text-muted text-[13px] line-clamp-2 mb-4 leading-relaxed">
          {report.note || `Overflowing ${report.wasteType.replace('_', ' ')} waste near the road side. Needs urgent cleanup.`}
        </p>
        
        <div className="mt-auto flex items-center justify-between pt-4 border-t border-border/50">
          <div className="flex items-center space-x-4 text-text-muted font-medium text-sm">
            <button onClick={handleUpvote} className="flex items-center hover:text-coral transition-colors">
              <span className="mr-1 text-base leading-none">❤️</span> {upvotes}
            </button>
            <span className="flex items-center">
              <span className="mr-1 text-base leading-none opacity-80">💬</span> 3
            </span>
            <span className="flex items-center">
              <Share className="w-4 h-4 mr-1 opacity-80" /> 1
            </span>
          </div>
          <span className="text-[11px] font-bold text-brand-600 bg-brand-100 px-3 py-1.5 rounded-full group-hover:bg-brand-500 group-hover:text-white transition-colors flex items-center">
            View Details <span className="ml-1 text-[14px] leading-none">&rarr;</span>
          </span>
        </div>
      </div>
    </div>
  );
}
