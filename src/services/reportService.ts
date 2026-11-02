import { Report, Status, AIAnalysisResult, ProofVerificationResult, Organisation } from '../types';
import { supabase, isSupabaseConfigured, uploadImageToStorage } from './supabaseClient';

const LOCAL_STORAGE_KEY = 'ecotrack_real_reports_v1';
const MY_REPORTS_STORAGE_KEY = 'my_submitted_report_ids';
const ORGS_STORAGE_KEY = 'ecotrack_organisations_v1';

const INITIAL_ORGS: Organisation[] = [
  {
    id: 'org_green_earth',
    name: 'Green Earth Foundation',
    type: 'ngo',
    serviceArea: 'Central Pune & Deccan Gymkhana',
    coords: { lat: 18.5167, lng: 73.8417 },
    approved: true,
    contactEmail: 'ops@greenearth.org'
  },
  {
    id: 'org_clean_city',
    name: 'Clean City Youth Initiative',
    type: 'ngo',
    serviceArea: 'Karve Nagar & Kothrud West',
    coords: { lat: 18.5074, lng: 73.8077 },
    approved: true,
    contactEmail: 'contact@cleancity.org'
  },
  {
    id: 'org_pmc_sanitation',
    name: 'Pune Municipal Solid Waste Dept',
    type: 'municipal',
    serviceArea: 'PMC Ward 1-15 Metro Jurisdiction',
    coords: { lat: 18.5204, lng: 73.8567 },
    approved: true,
    contactEmail: 'sanitation@punecorporation.org'
  },
  {
    id: 'org_swachh_brigade',
    name: 'Swachh Bharat Citizen Brigade',
    type: 'ngo',
    serviceArea: 'Aundh, Baner & Shivaji Nagar',
    coords: { lat: 18.5590, lng: 73.7868 },
    approved: true,
    contactEmail: 'brigade@swachh.org'
  }
];

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
export function trackMySubmittedReportId(id: string, userId?: string, userEmail?: string) {
  try {
    if (userId) {
      const userKey = `my_submitted_report_ids_${userId}`;
      const existing: string[] = JSON.parse(localStorage.getItem(userKey) || '[]');
      if (!existing.includes(id)) {
        existing.unshift(id);
        localStorage.setItem(userKey, JSON.stringify(existing));
      }
    }
    if (userEmail) {
      const emailKey = `my_submitted_report_ids_${userEmail.toLowerCase().trim()}`;
      const existing: string[] = JSON.parse(localStorage.getItem(emailKey) || '[]');
      if (!existing.includes(id)) {
        existing.unshift(id);
        localStorage.setItem(emailKey, JSON.stringify(existing));
      }
    }
  } catch (e) {
    console.error('Failed to track my report ID:', e);
  }
}

export function getMySubmittedReportIds(userId?: string, userEmail?: string): string[] {
  try {
    const ids = new Set<string>();
    if (userId) {
      const byUser: string[] = JSON.parse(localStorage.getItem(`my_submitted_report_ids_${userId}`) || '[]');
      byUser.forEach(id => ids.add(id));
    }
    if (userEmail) {
      const byEmail: string[] = JSON.parse(localStorage.getItem(`my_submitted_report_ids_${userEmail.toLowerCase().trim()}`) || '[]');
      byEmail.forEach(id => ids.add(id));
    }
    return Array.from(ids);
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
    // First seed with Supabase reports
    supabaseReports.forEach(r => map.set(r.id, r));

    // Then overlay local reports so locally claimed / updated tasks take precedence
    localReports.forEach(r => {
      const existing = map.get(r.id);
      if (!existing) {
        map.set(r.id, r);
      } else {
        // If local has assignment or status change that Supabase hasn't synced, local state takes precedence
        const localHasAssignment = !!r.assignedOrgId && !existing.assignedOrgId;
        const localStatusChanged = r.status !== existing.status && existing.status === 'reported';
        const localIsNewer = new Date(r.updatedAt || r.createdAt).getTime() >= new Date(existing.updatedAt || existing.createdAt).getTime();

        if (localHasAssignment || localStatusChanged || localIsNewer) {
          map.set(r.id, {
            ...existing,
            ...r,
            assignedOrgId: r.assignedOrgId || existing.assignedOrgId,
            assignedOrgName: r.assignedOrgName || existing.assignedOrgName,
            status: r.status !== 'reported' ? r.status : (existing.status !== 'reported' ? existing.status : r.status),
            timeline: r.timeline && r.timeline.length >= (existing.timeline?.length || 0) ? r.timeline : existing.timeline
          });
        }
      }
    });

    const merged = Array.from(map.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    return merged;
  },

  /**
   * Fetches a single real report by its ID
   */
  getReportById: async (id: string): Promise<Report | undefined> => {
    const localList = getLocalReports();
    const localMatch = localList.find((r) => r.id === id);

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
          const supaReport: Report = {
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

          // If locally claimed or updated, merge so assignment is preserved
          if (localMatch && ((localMatch.assignedOrgId && !supaReport.assignedOrgId) || (localMatch.status !== supaReport.status && supaReport.status === 'reported'))) {
            return {
              ...supaReport,
              ...localMatch,
              assignedOrgId: localMatch.assignedOrgId || supaReport.assignedOrgId,
              assignedOrgName: localMatch.assignedOrgName || supaReport.assignedOrgName,
              status: localMatch.status !== 'reported' ? localMatch.status : supaReport.status,
              timeline: localMatch.timeline && localMatch.timeline.length >= supaReport.timeline.length ? localMatch.timeline : supaReport.timeline
            };
          }

          return supaReport;
        }
      } catch (err) {
        console.warn('Error fetching report by ID from Supabase:', err);
      }
    }

    return localMatch;
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
    trackMySubmittedReportId(newReportId, params.reporterId, params.reporterEmail);
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
  },

  /**
   * Retrieves list of registered organizations with dynamic live task counts
   */
  getOrganisations: async (): Promise<Organisation[]> => {
    let orgs: Organisation[] = [];
    try {
      const stored = localStorage.getItem(ORGS_STORAGE_KEY);
      if (stored) {
        orgs = JSON.parse(stored);
      } else {
        orgs = [...INITIAL_ORGS];
        localStorage.setItem(ORGS_STORAGE_KEY, JSON.stringify(orgs));
      }
    } catch {
      orgs = [...INITIAL_ORGS];
    }

    // Compute live task metrics from current reports
    const reports = await reportService.getReports();
    return orgs.map(org => {
      const active = reports.filter(r => r.assignedOrgId === org.id && (r.status === 'in_progress' || r.status === 'assigned' || r.status === 'proof_submitted')).length;
      const completed = reports.filter(r => r.assignedOrgId === org.id && r.status === 'verified').length;
      return {
        ...org,
        activeTasksCount: active,
        completedTasksCount: completed
      };
    });
  },

  /**
   * Registers a new organization or updates an existing one
   */
  registerOrganisation: async (org: Organisation): Promise<Organisation> => {
    let orgs: Organisation[] = [];
    try {
      const stored = localStorage.getItem(ORGS_STORAGE_KEY);
      orgs = stored ? JSON.parse(stored) : [...INITIAL_ORGS];
    } catch {
      orgs = [...INITIAL_ORGS];
    }

    const idx = orgs.findIndex(o => o.id === org.id);
    if (idx !== -1) {
      orgs[idx] = { ...orgs[idx], ...org };
    } else {
      orgs.push(org);
    }
    localStorage.setItem(ORGS_STORAGE_KEY, JSON.stringify(orgs));

    if (isSupabaseConfigured) {
      try {
        await supabase
          .from('organizations')
          .upsert({
            id: org.id,
            name: org.name,
            type: org.type,
            service_area: org.serviceArea,
            approved: org.approved,
            contact_email: org.contactEmail
          });
      } catch (err) {
        console.warn('Supabase register organisation notice:', err);
      }
    }

    return org;
  },

  /**
   * Assigns or claims a report for an organization
   */
  assignReportToOrg: async (
    reportId: string, 
    orgId: string, 
    orgName: string, 
    assignedBy = 'System'
  ): Promise<Report | undefined> => {
    const now = new Date().toISOString();

    if (isSupabaseConfigured) {
      try {
        await supabase
          .from('reports')
          .update({
            status: 'in_progress',
            assigned_org_id: orgId,
            assigned_org_name: orgName,
            updated_at: now
          })
          .eq('id', reportId);

        await supabase.from('report_timeline').insert({
          report_id: reportId,
          status: 'in_progress',
          at: now,
          by_user: `${orgName} (Assigned by ${assignedBy})`
        });
      } catch (err) {
        console.warn('Supabase assign report notice:', err);
      }
    }

    const local = getLocalReports();
    let idx = local.findIndex(r => r.id === reportId);
    
    // If report is not in local cache yet (e.g. came from Supabase), copy it into local
    if (idx === -1) {
      const all = await reportService.getReports();
      const match = all.find(r => r.id === reportId);
      if (match) {
        local.unshift({ ...match });
        idx = 0;
      }
    }

    if (idx !== -1) {
      local[idx].status = 'in_progress';
      local[idx].assignedOrgId = orgId;
      local[idx].assignedOrgName = orgName;
      local[idx].updatedAt = now;
      local[idx].timeline = local[idx].timeline || [];
      local[idx].timeline.push({
        status: 'in_progress',
        at: now,
        by: `${orgName} (Assigned by ${assignedBy})`
      });
      saveLocalReports(local);
      return local[idx];
    }
    return undefined;
  },

  /**
   * Releases an accepted task back to the unassigned queue
   */
  unassignReport: async (reportId: string, unassignedBy = 'System'): Promise<Report | undefined> => {
    const now = new Date().toISOString();

    if (isSupabaseConfigured) {
      try {
        await supabase
          .from('reports')
          .update({
            status: 'reported',
            assigned_org_id: null,
            assigned_org_name: null,
            updated_at: now
          })
          .eq('id', reportId);

        await supabase.from('report_timeline').insert({
          report_id: reportId,
          status: 'reported',
          at: now,
          by_user: `Task released by ${unassignedBy}`
        });
      } catch (err) {
        console.warn('Supabase unassign notice:', err);
      }
    }

    const local = getLocalReports();
    let idx = local.findIndex(r => r.id === reportId);
    if (idx === -1) {
      const all = await reportService.getReports();
      const match = all.find(r => r.id === reportId);
      if (match) {
        local.unshift({ ...match });
        idx = 0;
      }
    }

    if (idx !== -1) {
      local[idx].status = 'reported';
      local[idx].assignedOrgId = undefined;
      local[idx].assignedOrgName = undefined;
      local[idx].updatedAt = now;
      local[idx].timeline = local[idx].timeline || [];
      local[idx].timeline.push({
        status: 'reported',
        at: now,
        by: `Task released back to queue by ${unassignedBy}`
      });
      saveLocalReports(local);
      return local[idx];
    }
    return undefined;
  },

  /**
   * Admin verification review: approves cleanup or reopens task with comment
   */
  adminReviewProof: async (
    reportId: string,
    decision: 'verified' | 'reopened',
    comment: string,
    reviewerName = 'Administrator'
  ): Promise<Report | undefined> => {
    const now = new Date().toISOString();

    if (isSupabaseConfigured) {
      try {
        const updatePayload: any = {
          status: decision,
          updated_at: now
        };
        if (decision === 'reopened') {
          // Keep previous proof in history but allow re-submission
        }
        await supabase
          .from('reports')
          .update(updatePayload)
          .eq('id', reportId);

        await supabase.from('report_timeline').insert({
          report_id: reportId,
          status: decision,
          at: now,
          by_user: `${reviewerName}: ${comment}`
        });
      } catch (err) {
        console.warn('Supabase review proof notice:', err);
      }
    }

    const local = getLocalReports();
    let idx = local.findIndex(r => r.id === reportId);
    if (idx === -1) {
      const all = await reportService.getReports();
      const match = all.find(r => r.id === reportId);
      if (match) {
        local.unshift({ ...match });
        idx = 0;
      }
    }

    if (idx !== -1) {
      local[idx].status = decision;
      local[idx].updatedAt = now;
      local[idx].timeline = local[idx].timeline || [];
      local[idx].timeline.push({
        status: decision,
        at: now,
        by: `${reviewerName} (${decision === 'verified' ? 'Approved' : 'Reopened'}): ${comment}`
      });
      saveLocalReports(local);
      return local[idx];
    }
    return undefined;
  },

  /**
   * Deletes a report from storage and database
   */
  deleteReport: async (reportId: string): Promise<boolean> => {
    if (isSupabaseConfigured) {
      try {
        await supabase.from('report_timeline').delete().eq('report_id', reportId);
        await supabase.from('reports').delete().eq('id', reportId);
      } catch (e) {
        console.warn('Supabase delete notice:', e);
      }
    }

    const local = getLocalReports();
    const filtered = local.filter(r => r.id !== reportId);
    saveLocalReports(filtered);
    return true;
  },

  /**
   * Toggles an organization's verified/approved status
   */
  toggleOrgApproval: async (orgId: string): Promise<Organisation[]> => {
    const orgs = await reportService.getOrganisations();
    const updated = orgs.map(o => o.id === orgId ? { ...o, approved: !o.approved } : o);
    try {
      localStorage.setItem(ORGS_STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {
      console.warn('Failed to save orgs:', e);
    }
    return updated;
  }
};
