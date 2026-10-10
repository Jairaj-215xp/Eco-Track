import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { reportService } from '../services/reportService';
import { Report } from '../types';
import { Camera, MapPin, Upload, CheckCircle, ChevronLeft, Loader2 } from 'lucide-react';
import { Button } from '../components/ui/Button';

export function SubmitProof() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [proofUploaded, setProofUploaded] = useState(false);

  useEffect(() => {
    if (id) {
      reportService.getReportById(id).then(data => {
        setReport(data || null);
        setLoading(false);
      });
    }
  }, [id]);

  const handleSubmit = async () => {
    setSubmitting(true);
    await reportService.updateReportStatus(id as string, 'verified', report?.assignedOrgId, {
      mediaUrl: '/mock-garbage-4.jpg',
      mediaType: 'image',
      location: { lat: report?.location.lat || 18.5, lng: report?.location.lng || 73.8 },
      distanceFromReportM: 12,
      submittedAt: new Date().toISOString(),
      verification: {
        locationMatch: true,
        wasteReduction: 'high',
        result: 'verified'
      }
    });
    setSubmitting(false);
    navigate(`/report/${id}`);
  };

  if (loading || !report) return <div className="p-8 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto text-accent" /></div>;

  return (
    <div className="max-w-[1080px] mx-auto px-4 sm:px-6 py-8 min-h-[80vh]">
      <div className="flex items-center mb-6">
        <button onClick={() => navigate(-1)} className="mr-4 p-2 text-text-muted hover:text-text rounded-full hover:bg-surface-2 transition-colors">
          <ChevronLeft className="w-6 h-6" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-text">Submit Cleanup Proof</h1>
          <p className="text-text-muted text-sm flex items-center mt-1">
            <MapPin className="w-3.5 h-3.5 mr-1" /> {report.location.address}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Original Report */}
        <div className="flex flex-col">
          <h3 className="text-sm font-semibold text-text mb-3 uppercase tracking-wider">Original Report</h3>
          <div className="bg-surface rounded-2xl border border-border p-2 shadow-soft h-full flex flex-col">
            <div className="relative aspect-[16/10] w-full rounded-xl overflow-hidden mb-3">
              <img src={report.photoUrl} alt="Before" className="w-full h-full object-cover" />
              <div className="absolute top-2 left-2 bg-background/80 backdrop-blur text-text px-2 py-1 rounded text-xs font-semibold">Before</div>
            </div>
            <div className="px-2 pb-2">
              <h4 className="font-semibold text-text capitalize">{report.wasteType.replace('_', ' ')} Waste</h4>
              <p className="text-sm text-text-muted mt-1">{report.note || "No additional notes provided."}</p>
            </div>
          </div>
        </div>

        {/* Upload Proof */}
        <div className="flex flex-col">
          <h3 className="text-sm font-semibold text-text mb-3 uppercase tracking-wider">Your Proof</h3>
          <div className={`bg-surface rounded-2xl border-2 border-dashed ${proofUploaded ? 'border-success' : 'border-border hover:bg-surface-2 hover:border-accent'} p-2 h-full transition-colors flex flex-col`}>
            
            {!proofUploaded ? (
              <div className="flex-grow flex flex-col items-center justify-center py-12 cursor-pointer" onClick={() => setProofUploaded(true)}>
                <div className="w-16 h-16 rounded-full bg-surface-2 flex items-center justify-center mb-4">
                  <Camera className="w-8 h-8 text-text-muted" />
                </div>
                <p className="font-medium text-text mb-1">Take Photo or Video</p>
                <p className="text-sm text-text-muted text-center max-w-xs mb-6">
                  Ensure the angle matches the original photo for better AI verification.
                </p>
                <Button variant="soft" leftIcon={<Upload className="w-4 h-4" />}>Upload from device</Button>
              </div>
            ) : (
              <div className="relative aspect-[16/10] w-full rounded-xl overflow-hidden mb-3">
                <img src="/mock-garbage-4.jpg" alt="After" className="w-full h-full object-cover" />
                <div className="absolute top-2 left-2 bg-success/90 backdrop-blur text-white px-2 py-1 rounded text-xs font-semibold flex items-center">
                  <CheckCircle className="w-3.5 h-3.5 mr-1" /> GPS Match: 12m away
                </div>
              </div>
            )}

            {proofUploaded && (
              <div className="px-2 pb-2 mt-auto">
                <Button size="lg" className="w-full" isLoading={submitting} onClick={handleSubmit}>
                  Submit for Verification
                </Button>
                <button className="w-full mt-3 text-sm text-text-muted hover:text-text font-medium" onClick={() => setProofUploaded(false)}>
                  Retake Photo
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
