import { Report, Status, AIAnalysisResult, ProofVerificationResult } from '../types';
import { supabase, isSupabaseConfigured, uploadImageToStorage } from './supabaseClient';

const LOCAL_STORAGE_KEY = 'ecotrack_real_reports_v1';
const MY_REPORTS_STORAGE_KEY = 'my_submitted_report_ids';

/**
 * Checks if a string is a valid UUID
 */
function isUUID(str: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
}

/**
 * Generates an RFC-4122 compliant UUID v4
 */
function generateUUID(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

/**
 * Loads cached real reports from local storage
 */
function getLocalReports(): Report[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to parse local reports:', e);
    return [];
  }
}

/**
 * Saves reports to local storage cache
 */
function saveLocalReports(reports: Report[]) {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(reports));
  } catch (e) {
    console.error('Failed to save local reports:', e);
  }
}

/**
 * Tracks an ID as submitted by this user/browser
 */
export function trackMySubmittedReportId(id: string) {
  try {
    const existing: string[] = JSON.parse(localStorage.getItem(MY_REPORTS_STORAGE_KEY) || '[]');
    if (!existing.includes(id)) {
      existing.unshift(id);
      localStorage.setItem(MY_REPORTS_STORAGE_KEY, JSON.stringify(existing));
    }
  } catch (e) {
    console.error('Failed to track my report ID:', e);
  }
}

export function getMySubmittedReportIds(): string[] {
  try {
    return JSON.parse(localStorage.getItem(MY_REPORTS_STORAGE_KEY) || '[]');
  } catch (e) {
    return [];
  }
}

export const reportService = {
  /**
   * Fetches all reports: queries Supabase and seamlessly merges with local reports
   */
  getReports: async (): Promise<Report[]> => {
    const localReports = getLocalReports();
    let supabaseReports: Report[] = [];

    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('reports')
          .select(`
            *,
            report_timeline (*)
          `)
          .order('created_at', { ascending: false });

        if (error) {
          console.warn('Supabase getReports notice (check if schema.sql was run):', error.message);
        } else if (data) {
          supabaseReports = data.map((r: any): Report => ({
            id: r.id,
            photoUrl: r.photo_url,
            location: {
              lat: r.location_lat,
              lng: r.location_lng,
              address: r.address,
              accuracyM: r.accuracy_m || 10
            },
            wasteType: r.waste_type,
            severity: r.severity,
            note: r.note || '',
            status: r.status,
            reporterId: r.reporter_id || 'anonymous',
            reporterName: r.reporter_name,
            reporterEmail: r.reporter_email,
            assignedOrgId: r.assigned_org_id,
            assignedOrgName: r.assigned_org_name,
            upvotes: r.upvotes || 0,
            aiAnalysis: r.ai_analysis,
            proof: r.proof,
            createdAt: r.created_at,
            updatedAt: r.updated_at,
            timeline: (r.report_timeline || []).map((t: any) => ({
              status: t.status,
              at: t.at,
              by: t.by_user,
              comment: t.comment
            }))
          }));
        }
      } catch (err) {
        console.warn('Error querying Supabase:', err);
      }
    }

    // Merge Supabase reports and local reports without duplicates
    const map = new Map<string, Report>();
    localReports.forEach(r => map.set(r.id, r));
    supabaseReports.forEach(r => map.set(r.id, r));

    const merged = Array.from(map.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    return merged;
  },

  /**
   * Fetches a single real report by its ID
   */
  getReportById: async (id: string): Promise<Report | undefined> => {
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('reports')
          .select(`
            *,
            report_timeline (*)
          `)
          .eq('id', id)
          .single();

        if (error) {
          console.warn('Supabase getReportById notice:', error.message);
        } else if (data) {
          return {
            id: data.id,
            photoUrl: data.photo_url,
            location: {
              lat: data.location_lat,
              lng: data.location_lng,
              address: data.address,
              accuracyM: data.accuracy_m || 10
            },
            wasteType: data.waste_type,
            severity: data.severity,
            note: data.note || '',
            status: data.status,
            reporterId: data.reporter_id || 'anonymous',
            reporterName: data.reporter_name,
            reporterEmail: data.reporter_email,
            assignedOrgId: data.assigned_org_id,
            assignedOrgName: data.assigned_org_name,
            upvotes: data.upvotes || 0,
            aiAnalysis: data.ai_analysis,
            proof: data.proof,
            createdAt: data.created_at,
            updatedAt: data.updated_at,
            timeline: (data.report_timeline || []).map((t: any) => ({
              status: t.status,
              at: t.at,
              by: t.by_user,
              comment: t.comment
            }))
          };
        }
      } catch (err) {
        console.warn('Error fetching report by ID from Supabase:', err);
      }
    }

    const localList = getLocalReports();
    return localList.find((r) => r.id === id);
  },

  /**
   * Creates a new real report with valid UUID, uploads image to storage, and persists to DB
   */
  createReport: async (params: {
    photoUrl?: string;
    photoFile?: File | Blob;
    location: { lat: number; lng: number; address: string; accuracyM: number };
    wasteType: Report['wasteType'];
    severity: Report['severity'];
    note?: string;
    reporterId: string;
    reporterName?: string;
    reporterEmail?: string;
    aiAnalysis?: AIAnalysisResult;
  }): Promise<Report> => {
    let finalPhotoUrl = params.photoUrl || '';

    // If an image file was provided, upload to Supabase Storage bucket 'reports'
    if (params.photoFile) {
      try {
        finalPhotoUrl = await uploadImageToStorage(params.photoFile, 'reports', 'garbage');
      } catch (e) {
        console.warn('Upload fallback to data url:', e);
      }
    }

    const now = new Date().toISOString();
    // Use compliant UUID v4 so Postgres accepts it
    const newReportId = generateUUID();

    const newReport: Report = {
      id: newReportId,
      photoUrl: finalPhotoUrl,
      location: params.location,
      wasteType: params.wasteType,
      severity: params.severity,
      note: params.note || '',
      status: 'reported',
      reporterId: params.reporterId,
      reporterName: params.reporterName,
      reporterEmail: params.reporterEmail,
      upvotes: 0,
      createdAt: now,
      updatedAt: now,
      aiAnalysis: params.aiAnalysis,
      timeline: [{ status: 'reported', at: now, by: params.reporterName || 'Citizen' }]
    };

    // Track locally first so it is immediately visible
    trackMySubmittedReportId(newReportId);
    const local = getLocalReports();
    local.unshift(newReport);
    saveLocalReports(local);

    // Save to Supabase
    if (isSupabaseConfigured) {
      try {
        const validReporterUuid = (params.reporterId && isUUID(params.reporterId)) ? params.reporterId : null;

        const { error } = await supabase
          .from('reports')
          .insert({
            id: newReportId,
            photo_url: finalPhotoUrl,
            location_lat: params.location.lat,
            location_lng: params.location.lng,
            address: params.location.address,
            accuracy_m: params.location.accuracyM || 10,
            waste_type: params.wasteType,
            severity: params.severity,
            note: params.note || null,
            status: 'reported',
            reporter_id: validReporterUuid,
            reporter_name: params.reporterName || 'Citizen',
            reporter_email: params.reporterEmail || null,
            upvotes: 0,
            ai_analysis: params.aiAnalysis || null,
            created_at: now,
            updated_at: now
          });

        if (error) {
          console.warn('Supabase insert notice (run schema.sql in Supabase SQL editor):', error.message);
        } else {
          // Insert initial timeline entry
          await supabase.from('report_timeline').insert({
            report_id: newReportId,
            status: 'reported',
            at: now,
            by_user: params.reporterName || 'Citizen'
          });
        }
      } catch (err) {
        console.warn('Error creating report in Supabase:', err);
      }
    }

    return newReport;
  },

  /**
   * Updates report status and attaches cleanup proof
   */
  updateReportStatus: async (
    id: string,
    status: Status,
    orgId?: string,
    orgName?: string,
    proofData?: Report['proof'],
    proofFile?: File | Blob
  ): Promise<Report | undefined> => {
    let finalProof = proofData;

    if (proofFile && finalProof) {
      try {
        const proofUrl = await uploadImageToStorage(proofFile, 'proofs', 'proof');
        finalProof = {
          ...finalProof,
          mediaUrl: proofUrl
        };
      } catch (e) {
        console.warn('Storage proof upload fallback:', e);
      }
    }

    const now = new Date().toISOString();

    if (isSupabaseConfigured) {
      try {
        const updatePayload: any = {
          status,
          updated_at: now
        };

        if (orgId) updatePayload.assigned_org_id = orgId;
        if (orgName) updatePayload.assigned_org_name = orgName;
        if (finalProof) updatePayload.proof = finalProof;

        await supabase
          .from('reports')
          .update(updatePayload)
          .eq('id', id);

        // Add timeline record
        await supabase.from('report_timeline').insert({
          report_id: id,
          status,
          at: now,
          by_user: orgName || orgId || 'Organisation'
        });
      } catch (err) {
        console.warn('Error updating report status in Supabase:', err);
      }
    }

    // Update local reports
    const local = getLocalReports();
    const index = local.findIndex((r) => r.id === id);
    if (index !== -1) {
      local[index].status = status;
      if (orgId) local[index].assignedOrgId = orgId;
      if (orgName) local[index].assignedOrgName = orgName;
      if (finalProof) local[index].proof = finalProof;
      local[index].timeline.push({
        status,
        at: now,
        by: orgName || orgId || 'Organisation'
      });
      saveLocalReports(local);
      return local[index];
    }

    return undefined;
  },

  /**
   * Upvotes a report in Supabase and local cache
   */
  upvoteReport: async (id: string, userId?: string): Promise<number> => {
    if (isSupabaseConfigured && userId && isUUID(userId) && isUUID(id)) {
      try {
        await supabase
          .from('report_upvotes')
          .insert({ user_id: userId, report_id: id });
      } catch (err) {
        console.warn('Supabase upvote error:', err);
      }
    }

    const local = getLocalReports();
    const index = local.findIndex((r) => r.id === id);
    if (index > -1) {
      local[index].upvotes = (local[index].upvotes || 0) + 1;
      saveLocalReports(local);
      return local[index].upvotes;
    }
    return 0;
  }
};
