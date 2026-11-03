import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { reportService } from '../services/reportService';
import { openVisionService } from '../services/openVisionService';
import { Report, ProofVerificationResult } from '../types';
import { Camera, MapPin, Upload, CheckCircle, ChevronLeft, Loader2, Sparkles, AlertTriangle, ShieldCheck, SwitchCamera } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { useAuth } from '../contexts/AuthContext';
import { CameraModal } from '../components/ui/CameraModal';

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

  const [showCameraModal, setShowCameraModal] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const mobileCameraInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (id) {
      reportService.getReportById(id).then(data => {
        setReport(data || null);
        setLoading(false);
      });
    }
  }, [id]);

  const handleProcessProofFile = async (file: File) => {
    if (!report) return;
    setProofFile(file);
    const preview = URL.createObjectURL(file);
    setProofPreviewUrl(preview);
    setVerifying(true);

    try {
      const result = await openVisionService.verifyCleanupProof(report.photoUrl, file);
      setVerificationResult(result);
    } catch (err) {
      console.error('Error running Open Vision cleanup verification:', err);
    } finally {
      setVerifying(false);
    }
  };

  const handleProofUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleProcessProofFile(file);
    }
  };

  const handleAutoLoadMatchingProof = async () => {
    if (!report) return;
    const match = report.photoUrl.match(/scene_(\d+)_before/);
    if (match) {
      const sceneNum = match[1];
      const afterUrl = `/dataset/after_cleanup/scene_${sceneNum}_after.jpg`;
      setProofPreviewUrl(afterUrl);
      setVerifying(true);
      try {
        const res = await fetch(afterUrl);
        const blob = await res.blob();
        const file = new File([blob], `scene_${sceneNum}_after.jpg`, { type: 'image/jpeg' });
        setProofFile(file);
        const result = await openVisionService.verifyCleanupProof(report.photoUrl, file);
        setVerificationResult(result);
      } catch (e) {
        console.warn('Error loading matching proof:', e);
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
    <div className="max-w-[1100px] mx-auto px-4 sm:px-6 py-6 sm:py-8 min-h-[80vh]">
      {/* Hidden File Inputs */}
      <input 
        type="file" 
        accept="image/*" 
        className="hidden" 
        ref={fileInputRef} 
        onChange={handleProofUpload} 
      />
      <input 
        type="file" 
        accept="image/*" 
        capture="environment" 
        className="hidden" 
        ref={mobileCameraInputRef} 
        onChange={handleProofUpload} 
      />

      {/* Camera Viewfinder Modal */}
      <CameraModal
        isOpen={showCameraModal}
        onClose={() => setShowCameraModal(false)}
        onCapture={(file) => handleProcessProofFile(file)}
        title="Snap After-Cleanup Evidence"
        subtitle="Aim at the cleaned site and take a clear photo"
      />

      <div className="flex items-center mb-6">
        <button onClick={() => navigate(-1)} className="mr-3 p-2 text-text-muted hover:text-text rounded-full hover:bg-surface-2 transition-colors">
          <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
        </button>
        <div>
          <h1 className="text-xl sm:text-2xl font-bold font-display text-ink">Submit Cleanup Proof</h1>
          <p className="text-text-muted text-xs flex items-center mt-0.5 truncate max-w-sm sm:max-w-md">
            <MapPin className="w-3.5 h-3.5 mr-1 text-brand-500 shrink-0" /> <span className="truncate">{report.location.address}</span>
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
        {/* Original Report (Before) */}
        <div className="flex flex-col">
          <h3 className="text-xs font-bold text-text-muted mb-2 uppercase tracking-wider flex items-center">
            Original Report (Before)
          </h3>
          <div className="bg-surface rounded-3xl border border-border p-3 shadow-soft flex flex-col">
            <div className="relative aspect-[16/10] w-full rounded-2xl overflow-hidden mb-3 bg-surface-2">
              <img src={report.photoUrl} alt="Before" className="w-full h-full object-cover" />
              <div className="absolute top-2.5 left-2.5 bg-slate-900/80 backdrop-blur text-white px-2.5 py-1 rounded-lg text-[11px] font-bold">
                Before Cleanup
              </div>
            </div>
            <div className="p-2">
              <div className="flex items-center justify-between mb-1">
                <h4 className="font-bold text-ink capitalize text-sm">{report.wasteType.replace('_', ' ')} Waste</h4>
                <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-brand-50 dark:bg-brand-950 text-brand-600">
                  {report.severity} Priority
                </span>
              </div>
              <p className="text-xs text-text-muted">{report.note || "No additional notes provided by reporter."}</p>
            </div>
          </div>
        </div>

        {/* Upload Proof (After) */}
        <div className="flex flex-col">
          <h3 className="text-xs font-bold text-text-muted mb-2 uppercase tracking-wider flex items-center">
            Cleaned Site Proof (After)
          </h3>
          <div className={`bg-surface rounded-3xl border-2 ${proofPreviewUrl ? 'border-brand-500' : 'border-dashed border-border hover:border-brand-500/50'} p-3 transition-all flex flex-col shadow-soft`}>
            
            {!proofPreviewUrl ? (
              <div className="flex-grow flex flex-col items-center justify-center py-8 sm:py-12 px-4 rounded-2xl text-center">
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/50 flex items-center justify-center mb-3 text-emerald-600 dark:text-emerald-400">
                  <Camera className="w-7 h-7 sm:w-8 sm:h-8" />
                </div>
                <p className="font-bold text-ink text-sm sm:text-base mb-1">Click Photo or Upload Proof</p>
                <p className="text-xs text-text-muted text-center max-w-xs mb-5">
                  Open Vision AI will compare the cleaned scene with the original report to verify that waste was cleared.
                </p>

                <div className="flex flex-col w-full max-w-xs gap-2.5">
                  {/* DIRECT CAMERA BUTTON */}
                  <Button
                    onClick={() => {
                      if (/Android|iPhone|iPad|iPod/i.test(navigator.userAgent)) {
                        mobileCameraInputRef.current?.click();
                      } else {
                        setShowCameraModal(true);
                      }
                    }}
                    className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs py-2.5 rounded-xl shadow-sm"
                    leftIcon={<Camera className="w-4 h-4" />}
                  >
                    Take Photo with Camera
                  </Button>

                  {/* UPLOAD FROM FILES */}
                  <Button 
                    variant="ghost" 
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full border border-border text-xs py-2.5 rounded-xl" 
                    leftIcon={<Upload className="w-4 h-4" />}
                  >
                    Browse Device Files
                  </Button>

                  {report?.photoUrl?.includes('scene_') && (
                    <button 
                      type="button" 
                      className="text-[11px] font-bold px-3 py-1.5 rounded-xl border border-brand-500/30 text-brand-700 dark:text-brand-300 bg-brand-50 dark:bg-brand-950 hover:bg-brand-100 flex items-center justify-center transition-colors shadow-xs"
                      onClick={() => handleAutoLoadMatchingProof()}
                    >
                      <Sparkles className="w-3.5 h-3.5 mr-1.5 text-brand-500" />
                      Use Matched After Cleanup Photo (Dataset Test)
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="relative aspect-[16/10] w-full rounded-2xl overflow-hidden bg-slate-950/5 border border-border flex items-center justify-center">
                  <img src={proofPreviewUrl} alt="After" className="w-full h-full object-contain" />
                  
                  {verifying ? (
                    <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm flex flex-col items-center justify-center text-white p-4 text-center">
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

                  {!verifying && (
                    <button
                      onClick={() => {
                        setProofFile(null);
                        setProofPreviewUrl(null);
                        setVerificationResult(null);
                      }}
                      className="absolute top-2.5 right-2.5 bg-black/60 hover:bg-black/80 text-white text-[11px] font-bold px-2.5 py-1 rounded-lg shadow-sm"
                    >
                      Retake
                    </button>
                  )}
                </div>

                {/* AI Verification Decision Card */}
                {verificationResult && (
                  <div className="bg-brand-50 dark:bg-brand-950/40 rounded-2xl p-3 border border-brand-500/20 space-y-2">
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="flex items-center text-brand-700 dark:text-brand-300">
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

                    <p className="text-[11px] text-brand-900 dark:text-brand-200 leading-relaxed">
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

                <div className="flex flex-col sm:flex-row gap-2 pt-2">
                  <Button
                    variant="ghost"
                    onClick={() => {
                      setProofFile(null);
                      setProofPreviewUrl(null);
                      setVerificationResult(null);
                    }}
                    className="border border-border text-xs w-full sm:w-auto"
                  >
                    Choose Different Photo
                  </Button>
                  <Button
                    onClick={handleSubmit}
                    isLoading={submitting}
                    disabled={verifying}
                    className="w-full sm:flex-1 bg-brand-500 hover:bg-brand-600 text-white font-bold text-xs"
                    leftIcon={<ShieldCheck className="w-4 h-4" />}
                  >
                    Submit Proof & Verify Cleanup
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
