export type Status = 'reported' | 'assigned' | 'in_progress' | 'proof_submitted' | 'verified' | 'reopened';

export interface Report {
  id: string;
  photoUrl: string;
  location: { lat: number; lng: number; address: string; accuracyM: number };
  wasteType: 'household' | 'plastic' | 'construction' | 'organic' | 'near_water' | 'other';
  severity: 'low' | 'medium' | 'high';
  note?: string;
  status: Status;
  reporterId: string;
  assignedOrgId?: string;
  upvotes: number;
  createdAt: string;
  timeline: { status: Status; at: string; by?: string }[];
  proof?: {
    mediaUrl: string;
    mediaType: 'image' | 'video';
    location: { lat: number; lng: number };
    distanceFromReportM: number;
    submittedAt: string;
    verification?: {
      locationMatch: boolean;
      wasteReduction: 'none' | 'partial' | 'high';
      result: 'verified' | 'reopened';
    };
  };
}

export interface Organisation { 
  id: string; 
  name: string; 
  type: 'municipal' | 'ngo'; 
  serviceArea: string; 
  approved: boolean; 
}

export interface User { 
  id: string; 
  name: string; 
  role: 'citizen' | 'org' | 'admin'; 
  orgId?: string; 
}
