import { Report, Organisation, User } from '../types';

export const mockUsers: User[] = [
  { id: 'u1', name: 'Aarav', role: 'citizen' },
  { id: 'u2', name: 'Diya', role: 'citizen' },
  { id: 'o1', name: 'Pune Cleanup Crew', role: 'org', orgId: 'org1' },
];

export const mockOrgs: Organisation[] = [
  { id: 'org1', name: 'Pune Cleanup Crew', type: 'ngo', serviceArea: 'Pune Central', approved: true },
  { id: 'org2', name: 'PMC Ward 5', type: 'municipal', serviceArea: 'Kothrud', approved: true },
];

const generateDate = (daysAgo: number) => {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString();
};

export const mockReports: Report[] = [
  {
    id: 'r1',
    photoUrl: '/mock-garbage-1.jpg',
    location: { lat: 18.5204, lng: 73.8567, address: 'FC Road, Deccan Gymkhana', accuracyM: 10 },
    wasteType: 'plastic',
    severity: 'medium',
    note: 'Plastic bags overflowing from the bin.',
    status: 'reported',
    reporterId: 'u1',
    upvotes: 12,
    createdAt: generateDate(2),
    timeline: [
      { status: 'reported', at: generateDate(2) }
    ]
  },
  {
    id: 'r2',
    photoUrl: '/mock-garbage-2.jpg',
    location: { lat: 18.5314, lng: 73.8446, address: 'Shivaji Nagar, near station', accuracyM: 5 },
    wasteType: 'organic',
    severity: 'high',
    status: 'in_progress',
    reporterId: 'u2',
    assignedOrgId: 'org1',
    upvotes: 45,
    createdAt: generateDate(5),
    timeline: [
      { status: 'reported', at: generateDate(5) },
      { status: 'assigned', at: generateDate(4), by: 'org1' },
      { status: 'in_progress', at: generateDate(1), by: 'org1' }
    ]
  },
  {
    id: 'r3',
    photoUrl: '/mock-garbage-3.jpg',
    location: { lat: 18.5074, lng: 73.8077, address: 'Kothrud Depot', accuracyM: 15 },
    wasteType: 'construction',
    severity: 'low',
    note: 'Rubble blocking the pavement.',
    status: 'verified',
    reporterId: 'u1',
    assignedOrgId: 'org2',
    upvotes: 3,
    createdAt: generateDate(10),
    timeline: [
      { status: 'reported', at: generateDate(10) },
      { status: 'assigned', at: generateDate(9), by: 'org2' },
      { status: 'in_progress', at: generateDate(8), by: 'org2' },
      { status: 'proof_submitted', at: generateDate(3), by: 'org2' },
      { status: 'verified', at: generateDate(2) }
    ],
    proof: {
      mediaUrl: '/mock-garbage-4.jpg',
      mediaType: 'image',
      location: { lat: 18.5075, lng: 73.8078 },
      distanceFromReportM: 12,
      submittedAt: generateDate(3),
      verification: {
        locationMatch: true,
        wasteReduction: 'high',
        result: 'verified'
      }
    }
  },
  {
    id: 'r4',
    photoUrl: '/mock-garbage-4.jpg',
    location: { lat: 18.5590, lng: 73.7868, address: 'Baner Road, near IT Park', accuracyM: 8 },
    wasteType: 'near_water',
    severity: 'high',
    status: 'assigned',
    reporterId: 'u2',
    assignedOrgId: 'org1',
    upvotes: 21,
    createdAt: generateDate(1),
    timeline: [
      { status: 'reported', at: generateDate(1) },
      { status: 'assigned', at: generateDate(0.5), by: 'org1' }
    ]
  },
  {
    id: 'r5',
    photoUrl: '/mock-garbage-1.jpg',
    location: { lat: 18.5100, lng: 73.9100, address: 'Magarpatta City North Gate', accuracyM: 20 },
    wasteType: 'household',
    severity: 'medium',
    status: 'reopened',
    reporterId: 'u1',
    assignedOrgId: 'org2',
    upvotes: 5,
    createdAt: generateDate(15),
    timeline: [
      { status: 'reported', at: generateDate(15) },
      { status: 'assigned', at: generateDate(14), by: 'org2' },
      { status: 'proof_submitted', at: generateDate(5), by: 'org2' },
      { status: 'reopened', at: generateDate(4) }
    ],
    proof: {
      mediaUrl: '/mock-garbage-1.jpg', // Same image to mimic bad proof
      mediaType: 'image',
      location: { lat: 18.5110, lng: 73.9120 },
      distanceFromReportM: 250,
      submittedAt: generateDate(5),
      verification: {
        locationMatch: false,
        wasteReduction: 'none',
        result: 'reopened'
      }
    }
  },
  // Add more as needed, this gives us enough diversity for testing
];
