import React from 'react';
import { Status } from '../../types';
import { AlertTriangle, Clock, CheckCircle, RefreshCcw, MapPin, Eye } from 'lucide-react';

export function StatusChip({ status, className = '' }: { status: Status; className?: string }) {
  
  const config: Record<Status, { label: string; colors: string; icon: React.ReactNode }> = {
    reported: {
      label: 'Reported',
      colors: 'bg-danger-soft text-danger',
      icon: <AlertTriangle className="w-3.5 h-3.5 mr-1" />
    },
    assigned: {
      label: 'Assigned',
      colors: 'bg-info-soft text-info',
      icon: <MapPin className="w-3.5 h-3.5 mr-1" />
    },
    in_progress: {
      label: 'In Progress',
      colors: 'bg-warn-soft text-warn',
      icon: <Clock className="w-3.5 h-3.5 mr-1" />
    },
    proof_submitted: {
      label: 'Proof Submitted',
      colors: 'bg-surface-2 text-text-muted',
      icon: <Eye className="w-3.5 h-3.5 mr-1" />
    },
    verified: {
      label: 'Verified',
      colors: 'bg-success-soft text-success',
      icon: <CheckCircle className="w-3.5 h-3.5 mr-1" />
    },
    reopened: {
      label: 'Reopened',
      colors: 'bg-danger-soft text-danger border border-danger',
      icon: <RefreshCcw className="w-3.5 h-3.5 mr-1" />
    }
  };

  const { label, colors, icon } = config[status];

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colors} ${className}`}>
      {icon}
      {label}
    </span>
  );
}
