import { mockReports as initialMockReports } from '../data/mock';
import { Report, Status } from '../types';

let mockReports = [...initialMockReports];

export const reportService = {
  getReports: async (): Promise<Report[]> => {
    // Simulate network delay
    return new Promise(resolve => setTimeout(() => resolve([...mockReports]), 800));
  },
  
  getReportById: async (id: string): Promise<Report | undefined> => {
    return new Promise(resolve => setTimeout(() => resolve(mockReports.find(r => r.id === id)), 500));
  },

  createReport: async (report: Omit<Report, 'id' | 'createdAt' | 'timeline' | 'status' | 'upvotes'>): Promise<Report> => {
    const newReport: Report = {
      ...report,
      id: `r${Math.floor(Math.random() * 10000)}`,
      createdAt: new Date().toISOString(),
      status: 'reported',
      timeline: [{ status: 'reported', at: new Date().toISOString() }],
      upvotes: 0
    };
    
    mockReports.unshift(newReport); // Add to beginning
    return new Promise(resolve => setTimeout(() => resolve(newReport), 1000));
  },

  updateReportStatus: async (id: string, status: Status, orgId?: string, proof?: Report['proof']): Promise<Report | undefined> => {
    return new Promise(resolve => setTimeout(() => {
      const index = mockReports.findIndex(r => r.id === id);
      if (index === -1) return resolve(undefined);
      
      const report = { ...mockReports[index] };
      report.status = status;
      if (orgId) report.assignedOrgId = orgId;
      if (proof) report.proof = proof;
      
      report.timeline = [
        ...report.timeline, 
        { status, at: new Date().toISOString(), by: orgId }
      ];
      
      mockReports[index] = report;
      resolve(report);
    }, 800));
  },

  upvoteReport: async (id: string): Promise<number> => {
    return new Promise(resolve => setTimeout(() => {
      const index = mockReports.findIndex(r => r.id === id);
      if (index > -1) {
        mockReports[index].upvotes += 1;
        resolve(mockReports[index].upvotes);
      }
      resolve(0);
    }, 300));
  }
};
