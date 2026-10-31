import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { reportService } from '../services/reportService';
import { openVisionService } from '../services/openVisionService';
import { Report, ProofVerificationResult } from '../types';
import { Camera, MapPin, Upload, CheckCircle, ChevronLeft, Loader2, Sparkles, AlertTriangle, ShieldCheck } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { useAuth } from '../contexts/AuthContext';

export function SubmitProof() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  // Real Proof file state
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [proofPreviewUrl, setProofPreviewUrl] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState<ProofVerificationResult | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (id) {
      reportService.getReportById(id).then(data => {
        setReport(data || null);
        setLoading(false);
      });
    }
  }, [id]);

  const handleProofUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && report) {
      setProofFile(file);
      const preview = URL.createObjectURL(file);
      setProofPreviewUrl(preview);
      setVerifying(true);

      try {
        // Run Open Vision AI Cleanup Verification on the new image vs before photo!
        const result = await openVisionService.verifyCleanupProof(report.photoUrl, file);
        setVerificationResult(result);
      } catch (err) {
        console.error('Error running Open Vision cleanup verification:', err);
      } finally {
        setVerifying(false);
      }
    }
  };

  const handleSubmit = async () => {
    if (!report || !proofFile) return;
    setSubmitting(true);

    try {
      const finalStatus = verificationResult?.result === 'verified' ? 'verified' : 'proof_submitted';

      await reportService.updateReportStatus(
        report.id,
        finalStatus,
        user?.orgId || user?.id || 'org_crew',
        user?.name || 'Cleanup Crew',
        {
          mediaUrl: proofPreviewUrl || '',
          mediaType: 'image',
          location: { lat: report.location.lat, lng: report.location.lng },
          distanceFromReportM: 8,
          submittedAt: new Date().toISOString(),
          verification: verificationResult || undefined
        },
        proofFile
      );

      navigate(`/report/${id}`);
    } catch (err) {
      console.error('Failed to submit proof to Supabase:', err);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || !report) {
    return (
      <div className="p-16 text-center">
        <Loader2 className="w-8 h-8 animate-spin mx-auto text-brand-500 mb-2" />
        <p className="text-text-muted text-sm">Loading report details...</p>
      </div>
    );
  }

  return (
    <div className="max-w-[1100px] mx-auto px-4 sm:px-6 py-8 min-h-[80vh]">
      <div className="flex items-center mb-6">
        <button onClick={() => navigate(-1)} className="mr-4 p-2 text-text-muted hover:text-text rounded-full hover:bg-surface-2 transition-colors">
          <ChevronLeft className="w-6 h-6" />
        </button>
        <div>
          <h1 className="text-2xl font-bold font-display text-ink">Submit Cleanup Proof</h1>
          <p className="text-text-muted text-xs flex items-center mt-1">
            <MapPin className="w-3.5 h-3.5 mr-1 text-brand-500" /> {report.location.address}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Original Report (Before) */}
        <div className="flex flex-col">
          <h3 className="text-xs font-bold text-text-muted mb-3 uppercase tracking-wider flex items-center">
            Original Report (Before)
          </h3>
          <div className="bg-surface rounded-3xl border border-border p-3 shadow-soft h-full flex flex-col">
            <div className="relative aspect-[16/10] w-full rounded-2xl overflow-hidden mb-3 bg-surface-2">
              <img src={report.photoUrl} alt="Before" className="w-full h-full object-cover" />
              <div className="absolute top-2.5 left-2.5 bg-ink/75 backdrop-blur text-white px-2.5 py-1 rounded-lg text-[11px] font-bold">
                Before Cleanup
              </div>
            </div>
            <div className="p-2">
              <div className="flex items-center justify-between mb-1">
                <h4 className="font-bold text-ink capitalize text-sm">{report.wasteType.replace('_', ' ')} Waste</h4>
                <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-brand-50 text-brand-600">
                  {report.severity} Priority
                </span>
              </div>
              <p className="text-xs text-text-muted">{report.note || "No additional notes provided by reporter."}</p>
            </div>
          </div>
        </div>

        {/* Upload Proof (After) */}
        <div className="flex flex-col">
          <h3 className="text-xs font-bold text-text-muted mb-3 uppercase tracking-wider flex items-center">
            Cleaned Site Proof (After)
          </h3>
          <div className={`bg-surface rounded-3xl border-2 ${proofPreviewUrl ? 'border-brand-500' : 'border-dashed border-border hover:border-brand-500/50'} p-3 h-full transition-all flex flex-col shadow-soft`}>
            <input 
              type="file" 
              accept="image/*" 
              className="hidden" 
              ref={fileInputRef} 
              onChange={handleProofUpload} 
            />

            {!proofPreviewUrl ? (
              <div 
                className="flex-grow flex flex-col items-center justify-center py-12 cursor-pointer rounded-2xl hover:bg-brand-50/40 transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                <div className="w-16 h-16 rounded-full bg-brand-100 flex items-center justify-center mb-4 text-brand-600">
                  <Camera className="w-8 h-8" />
                </div>
                <p className="font-bold text-ink text-sm mb-1">Take Photo or Upload Proof</p>
                <p className="text-xs text-text-muted text-center max-w-xs mb-6">
                  Open Vision AI will compare the cleaned scene with the original report to verify that waste was cleared.
                </p>
                <Button variant="ghost" className="border border-border text-xs" leftIcon={<Upload className="w-4 h-4" />}>
                  Browse device photos
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="relative aspect-[16/10] w-full rounded-2xl overflow-hidden bg-surface-2 border border-border">
                  <img src={proofPreviewUrl} alt="After" className="w-full h-full object-cover" />
                  
                  {verifying ? (
                    <div className="absolute inset-0 bg-ink/70 backdrop-blur-sm flex flex-col items-center justify-center text-white">
                      <Loader2 className="w-8 h-8 animate-spin text-brand-400 mb-2" />
                      <p className="font-bold text-xs">Open Vision Comparing Images...</p>
                      <p className="text-[10px] text-white/70">Analyzing location match & debris reduction</p>
                    </div>
                  ) : verificationResult ? (
                    <div className="absolute top-2.5 left-2.5 bg-success/90 backdrop-blur text-white px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center shadow-sm">
                      <CheckCircle className="w-3.5 h-3.5 mr-1" />
                      AI Verified: {verificationResult.wasteReductionPercent}% Cleared
                    </div>
                  ) : null}
                </div>

                {/* AI Verification Decision Card */}
                {verificationResult && (
                  <div className="bg-brand-50 rounded-2xl p-3 border border-brand-500/20 space-y-2">
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="flex items-center text-brand-700">
                        <Sparkles className="w-3.5 h-3.5 mr-1" /> Open Vision Verification
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] ${
                        verificationResult.result === 'verified' 
                          ? 'bg-success-soft text-success' 
                          : 'bg-warn-soft text-warn'
                      }`}>
                        {verificationResult.result.toUpperCase()}
                      </span>
                    </div>

                    <p className="text-[11px] text-brand-900 leading-relaxed">
                      {verificationResult.analysisSummary}
                    </p>

                    <div className="grid grid-cols-2 gap-2 pt-1 text-[11px]">
                      <div className="bg-surface rounded-xl p-2 border border-border">
                        <span className="text-text-muted text-[10px] block">Location Match</span>
                        <span className="font-bold text-ink">{verificationResult.locationMatchScore}% Match</span>
                      </div>
                      <div className="bg-surface rounded-xl p-2 border border-border">
                        <span className="text-text-muted text-[10px] block">Waste Cleared</span>
                        <span className="font-bold text-brand-600">{verificationResult.wasteReductionPercent}% Reduction</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {proofPreviewUrl && (
              <div className="pt-4 mt-auto">
                <Button 
                  size="lg" 
                  className="w-full text-xs shadow-sm bg-brand-500 hover:bg-brand-600" 
                  isLoading={submitting || verifying} 
                  onClick={handleSubmit}
                  leftIcon={<ShieldCheck className="w-4 h-4" />}
                >
                  Confirm & Submit to Supabase
                </Button>
                <button 
                  className="w-full mt-2 text-xs text-text-muted hover:text-ink font-medium py-1" 
                  onClick={() => {
                    setProofFile(null);
                    setProofPreviewUrl(null);
                    setVerificationResult(null);
                  }}
                >
                  Choose Different Photo
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
