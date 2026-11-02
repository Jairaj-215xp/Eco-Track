import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Report } from '../../types';
import { MapPin, Clock, Trash2, Share, CheckCircle, Heart, Sparkles, Building, Send } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

interface ReportCardProps {
  report: Report;
  onClick?: () => void;
  onClaim?: (reportId: string) => void;
}

function timeAgo(dateString: string) {
  const date = new Date(dateString);
  const now = new Date();
  const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
  if (diffInHours < 24) return `${diffInHours}h ago`;
  return `${Math.floor(diffInHours / 24)}d ago`;
}

export function ReportCard({ report, onClick, onClaim }: ReportCardProps) {
  const [upvotes, setUpvotes] = useState(report.upvotes);
  const [isLiked, setIsLiked] = useState(false);
  const { user, role } = useAuth();
  const navigate = useNavigate();

  const handleUpvote = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsLiked(!isLiked);
    setUpvotes(v => isLiked ? v - 1 : v + 1);
  };

  const isResolved = report.status === 'verified' || report.status === 'proof_submitted';
  const isProgress = report.status === 'in_progress' || report.status === 'assigned';
  const isReported = report.status === 'reported';

  const currentOrgId = user?.orgId || (role === 'org' && user?.name?.toLowerCase().includes('green earth') ? 'org_green_earth' : user?.orgId || '');
  const currentOrgName = user?.name || (role === 'org' ? 'Green Earth Foundation' : '');
  const isAssignedToMe = role === 'org' && Boolean(
    (currentOrgId && report.assignedOrgId === currentOrgId) || 
    (user?.name && report.assignedOrgName && report.assignedOrgName.toLowerCase() === user.name.toLowerCase())
  );
  const isUnassigned = isReported && !report.assignedOrgId;

  return (
    <motion.div 
      onClick={onClick} 
      whileHover={{ y: -6, transition: { duration: 0.25, ease: "easeOut" } }}
      className="bg-surface rounded-3xl border border-border overflow-hidden shadow-sm hover:shadow-hover hover:border-brand-500/30 transition-all cursor-pointer group flex flex-col h-[430px]"
    >
      <div className="relative h-48 overflow-hidden shrink-0">
        <img 
          src={report.photoUrl} 
          alt={report.wasteType} 
          className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-700 ease-out" 
        />
        <div className="absolute inset-0 bg-gradient-to-t from-ink/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        
        {/* Status Pill Top Left */}
        <div className="absolute top-4 left-4 flex flex-col space-y-1">
          <div className={`px-3 py-1.5 rounded-full text-xs font-bold flex items-center shadow-sm backdrop-blur-md bg-surface/95 border ${
            isResolved ? 'text-success border-success/30 bg-success-soft/90' : 
            isProgress ? 'text-sun border-sun/30 bg-sun-soft/90' : 
            'text-coral border-coral/30 bg-coral-soft/90'
          }`}>
            {isResolved ? <CheckCircle className="w-3.5 h-3.5 mr-1" /> :
             isProgress ? <Clock className="w-3.5 h-3.5 mr-1" /> :
             <span className="w-3 h-3 flex items-center justify-center font-sans border-2 border-current rounded-sm text-[8px] mr-1.5 font-bold">!</span>}
            {report.status.replace('_', ' ')}
          </div>

          {report.assignedOrgName && (
            <div className="px-2.5 py-1 rounded-full text-[10px] font-bold text-white bg-slate-900/80 backdrop-blur-md flex items-center shadow-2xs border border-white/20">
              <Building className="w-3 h-3 mr-1 text-aqua" />
              <span className="truncate max-w-[130px]">{report.assignedOrgName}</span>
            </div>
          )}
        </div>

        {/* Time Top Right */}
        <div className="absolute top-4 right-4 bg-ink/75 backdrop-blur-md text-white px-3 py-1.5 rounded-full text-[11px] font-medium flex items-center shadow-xs">
          <Clock className="w-3 h-3 mr-1 opacity-80" /> {timeAgo(report.createdAt)}
        </div>
      </div>

      <div className="p-5 flex flex-col flex-grow">
        <div className="flex items-center justify-between mb-1.5">
          <div className="flex items-center text-brand-600 text-[11px] font-bold uppercase tracking-wide">
            <Trash2 className="w-3.5 h-3.5 mr-1.5 text-brand-500" />
            {report.wasteType.replace('_', ' ')} Waste
          </div>
          {report.aiAnalysis && (
            <span className="text-[10px] bg-brand-100 text-brand-700 px-2 py-0.5 rounded-full font-bold">
              AI {Math.round(report.aiAnalysis.confidence * 100)}%
            </span>
          )}
        </div>
        
        <h3 className="font-bold text-ink text-[17px] leading-tight mb-1 group-hover:text-brand-600 transition-colors">
          {report.wasteType.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
        </h3>
        
        <div className="flex items-center text-text-muted text-[13px] mb-2.5">
          <MapPin className="w-3.5 h-3.5 mr-1 text-brand-500 shrink-0" />
          <span className="truncate">{report.location.address}</span>
        </div>

        <p className="text-text-muted text-[13px] line-clamp-2 mb-3 leading-relaxed">
          {report.note || `Overflowing ${report.wasteType.replace('_', ' ')} waste reported near the area. Needs prompt resolution.`}
        </p>
        
        <div className="mt-auto flex items-center justify-between pt-3 border-t border-border/50">
          <div className="flex items-center space-x-3 text-text-muted font-medium text-xs">
            <motion.button 
              whileTap={{ scale: 1.35 }}
              onClick={handleUpvote} 
              className={`flex items-center transition-colors ${isLiked ? 'text-coral font-bold' : 'hover:text-coral'}`}
            >
              <Heart className={`w-3.5 h-3.5 mr-1 ${isLiked ? 'fill-coral text-coral' : ''}`} />
              <span>{upvotes}</span>
            </motion.button>
            <span className="flex items-center hover:text-ink transition-colors">
              <span className="mr-1 text-sm leading-none opacity-80">💬</span> 3
            </span>
            <span className="flex items-center hover:text-ink transition-colors">
              <Share className="w-3.5 h-3.5 mr-1 opacity-80" />
            </span>
          </div>

          {/* Role-Specific Actions */}
          <div className="flex items-center space-x-2">
            {role === 'org' && isUnassigned && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  if (onClaim) onClaim(report.id);
                }}
                className="text-[11px] font-bold text-white bg-aqua-600 hover:bg-aqua-700 px-3 py-1.5 rounded-full shadow-xs transition-all flex items-center"
              >
                Claim Task
              </button>
            )}

            {role === 'org' && isAssignedToMe && report.status !== 'verified' && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/org/report/${report.id}/proof`);
                }}
                className="text-[11px] font-bold text-white bg-brand-500 hover:bg-brand-600 px-3 py-1.5 rounded-full shadow-xs transition-all flex items-center"
              >
                <Send className="w-3 h-3 mr-1" /> Submit Proof
              </button>
            )}

            {(!role || role === 'citizen' || role === 'guest' || (!isUnassigned && !isAssignedToMe)) && (
              <span className="text-[11px] font-bold text-brand-600 bg-brand-50 border border-brand-500/20 px-3 py-1.5 rounded-full group-hover:bg-brand-500 group-hover:text-white group-hover:border-transparent transition-all flex items-center shadow-2xs">
                Details <span className="ml-1 text-[13px] leading-none group-hover:translate-x-0.5 transition-transform">&rarr;</span>
              </span>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
