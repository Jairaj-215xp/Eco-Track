export type Status = 'reported' | 'assigned' | 'in_progress' | 'proof_submitted' | 'verified' | 'reopened';

export interface AIAnalysisResult {
  wasteType: 'household' | 'plastic' | 'construction' | 'organic' | 'near_water' | 'other';
  confidence: number;
  severity: 'low' | 'medium' | 'high';
  detectedItems: string[];
  cleanlinessScore: number; // 0-100 (lower means more garbage)
  coveragePercentage: number;
  recommendations: string[];
  analyzedAt: string;
}

export interface ProofVerificationResult {
  locationMatch: boolean;
  locationMatchScore: number; // 0-100%
  wasteReduction: 'none' | 'partial' | 'high';
  wasteReductionPercent: number; // 0-100%
  beforeCleanlinessScore: number;
  afterCleanlinessScore: number;
  result: 'verified' | 'reopened';
  analysisSummary: string;
  verifiedAt: string;
}

export interface Report {
  id: string;
  photoUrl: string;
  location: { 
    lat: number; 
    lng: number; 
    address: string; 
    accuracyM: number 
  };
  wasteType: 'household' | 'plastic' | 'construction' | 'organic' | 'near_water' | 'other';
  severity: 'low' | 'medium' | 'high';
  note?: string;
  status: Status;
  reporterId: string;
  reporterName?: string;
  reporterEmail?: string;
  assignedOrgId?: string;
  assignedOrgName?: string;
  upvotes: number;
  createdAt: string;
  updatedAt?: string;
  timeline: { status: Status; at: string; by?: string; comment?: string }[];
  aiAnalysis?: AIAnalysisResult;
  proof?: {
    mediaUrl: string;
    mediaType: 'image' | 'video';
    location: { lat: number; lng: number };
    distanceFromReportM: number;
    submittedAt: string;
    verification?: ProofVerificationResult;
  };
}

export interface Organisation { 
  id: string; 
  name: string; 
  type: 'municipal' | 'ngo'; 
  serviceArea: string; 
  approved: boolean; 
  contactEmail?: string;
}

export interface User { 
  id: string; 
  email?: string;
  name: string; 
  role: 'citizen' | 'org' | 'admin'; 
  orgId?: string; 
  avatarUrl?: string;
}
