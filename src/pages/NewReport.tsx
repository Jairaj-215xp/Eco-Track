import React, { useState, useRef, useEffect } from 'react';
import { Camera, MapPin, ChevronLeft, ArrowRight, X, Info, CheckCircle, Leaf, Loader2, Target, Zap, AlertCircle, FileText, Sparkles, ShieldAlert, FolderOpen, Layers, Upload, SwitchCamera } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { useNavigate } from 'react-router-dom';
import { reportService } from '../services/reportService';
import { openVisionService } from '../services/openVisionService';
import { GoogleLocationPicker } from '../components/report/GoogleLocationPicker';
import { getCurrentDeviceLocation, reverseGeocodeCoords } from '../services/googleMapsService';
import { Report, AIAnalysisResult } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { CameraModal } from '../components/ui/CameraModal';
import confetti from 'canvas-confetti';

export function NewReport() {
  const [step, setStep] = useState(1); // 1=Photo, 2=Location, 3=Details, 4=Success
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();

  // Form State
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [aiAnalysis, setAiAnalysis] = useState<AIAnalysisResult | null>(null);
  const [showOpenCVContours, setShowOpenCVContours] = useState(true);

  // Camera Modal State
  const [showCameraModal, setShowCameraModal] = useState(false);

  const [location, setLocation] = useState<{ lat: number; lng: number; address: string; accuracyM: number }>({
    lat: 18.4912, 
    lng: 73.8217, 
    address: 'Karve Nagar, Pune', 
    accuracyM: 20
  });

  const [wasteType, setWasteType] = useState<Report['wasteType'] | null>(null);
  const [severity, setSeverity] = useState<Report['severity'] | null>(null);
  const [note, setNote] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const mobileCameraInputRef = useRef<HTMLInputElement>(null);

  const handleNext = () => setStep(s => s + 1);
  const handlePrev = () => {
    if (step === 1) navigate(-1);
    else setStep(s => s - 1);
  };

  // Dataset Modal State for testing 440 before/after scenes
  const [showDatasetModal, setShowDatasetModal] = useState(false);
  const [datasetScenes, setDatasetScenes] = useState<any[]>([]);
  const [selectedEnvFilter, setSelectedEnvFilter] = useState<string>('all');
  const [loadingDataset, setLoadingDataset] = useState(false);
  const [sampleMode, setSampleMode] = useState<'before' | 'after'>('before');

  const openDatasetPicker = async () => {
    setShowDatasetModal(true);
    if (datasetScenes.length === 0) {
      setLoadingDataset(true);
      try {
        const res = await fetch('/dataset/dataset_metadata.json');
        if (res.ok) {
          const data = await res.json();
          setDatasetScenes(data);
        }
      } catch (err) {
        console.warn('Failed to load dataset metadata:', err);
      } finally {
        setLoadingDataset(false);
      }
    }
  };

  const handleSelectSample = async (imagePath: string, defaultWasteType?: string) => {
    setShowDatasetModal(false);
    setPhotoUrl(imagePath);
    setPhotoFile(null);
    setAnalyzing(true);
    try {
      const result = await openVisionService.scanGarbageImage(imagePath);
      setAiAnalysis(result);
      setWasteType(result.wasteType);
      setSeverity(result.severity);
    } catch (err) {
      console.error('Error analyzing sample image:', err);
      if (defaultWasteType) setWasteType(defaultWasteType as any);
    } finally {
      setAnalyzing(false);
    }
  };

  // Common handler for both Camera capture and File upload
  const handleProcessFile = async (file: File) => {
    setPhotoFile(file);
    const localUrl = URL.createObjectURL(file);
    setPhotoUrl(localUrl);
    setAnalyzing(true);

    try {
      // Run Open Vision AI Analysis on the actual image
      const result = await openVisionService.scanGarbageImage(file);
      setAiAnalysis(result);
      setWasteType(result.wasteType);
      setSeverity(result.severity);
    } catch (err) {
      console.error('Open Vision analysis error:', err);
      setWasteType('plastic');
      setSeverity('medium');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleProcessFile(file);
    }
  };

  const fetchLiveGPS = () => {
    getCurrentDeviceLocation()
      .then(async (coords) => {
        const address = await reverseGeocodeCoords(coords.lat, coords.lng);
        setLocation({
          lat: coords.lat,
          lng: coords.lng,
          address,
          accuracyM: coords.accuracyM
        });
      })
      .catch((e) => {
        console.warn('Geolocation lookup notice:', e);
      });
  };

  useEffect(() => {
    fetchLiveGPS();
  }, []);

  useEffect(() => {
    if (step === 2) {
      fetchLiveGPS();
    }
  }, [step]);

  useEffect(() => {
    if (step === 4) {
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 }, colors: ['#34B27B', '#4CC9C0', '#FFC857'] });
    }
  }, [step]);

  const handleSubmit = async () => {
    if (!wasteType || !severity || (!photoUrl && !photoFile)) return;
    setLoading(true);

    try {
      await reportService.createReport({
        photoUrl: photoUrl || '',
        photoFile: photoFile || undefined,
        location,
        wasteType,
        severity,
        note,
        reporterId: user?.id || 'anonymous',
        reporterName: user?.name || 'Citizen',
        reporterEmail: user?.email,
        aiAnalysis: aiAnalysis || undefined
      });

      handleNext();
    } catch (err) {
      console.error('Failed to submit report:', err);
    } finally {
      setLoading(false);
    }
  };

  const steps = [
    { id: 1, label: 'Add Photo', icon: Camera },
    { id: 2, label: 'Confirm Location', icon: MapPin },
    { id: 3, label: 'Submit', icon: FileText }
  ];

  if (step === 4) {
    return (
      <div className="bg-background min-h-[calc(100vh-96px)] font-sans pb-24 flex items-center justify-center px-4">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center p-6 max-w-md bg-surface rounded-3xl border border-border shadow-sm">
          <div className="w-20 h-20 sm:w-24 sm:h-24 bg-brand-100 dark:bg-brand-950 rounded-full flex items-center justify-center mx-auto mb-6 relative">
            <CheckCircle className="w-10 h-10 sm:w-12 sm:h-12 text-brand-500" />
            <div className="absolute -bottom-1 -right-1 bg-sun text-white text-xs font-bold px-2 py-0.5 rounded-full">+20 pts</div>
          </div>
          <h2 className="text-2xl sm:text-3xl font-display font-extrabold text-ink mb-2">Report Submitted!</h2>
          <p className="text-text-muted text-xs sm:text-sm mb-6">
            Your report has been analyzed by Open Vision AI and broadcast to local cleanup crews and authorities.
          </p>
          <div className="flex flex-col sm:flex-row gap-2.5 justify-center">
            <Button size="lg" onClick={() => navigate('/feed')} className="w-full sm:w-auto">View in Feed</Button>
            <Button size="lg" variant="ghost" onClick={() => navigate('/my-reports')} className="w-full sm:w-auto">Track My Reports</Button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="w-full bg-background font-sans min-h-[calc(100vh-80px)] flex flex-col py-3 sm:py-6 px-3 sm:px-6">
      {/* Hidden File Inputs */}
      <input 
        type="file" 
        accept="image/*" 
        className="hidden" 
        ref={fileInputRef} 
        onChange={handleImageUpload} 
      />
      <input 
        type="file" 
        accept="image/*" 
        capture="environment" 
        className="hidden" 
        ref={mobileCameraInputRef} 
        onChange={handleImageUpload} 
      />

      {/* Live Web Camera Viewfinder Modal */}
      <CameraModal
        isOpen={showCameraModal}
        onClose={() => setShowCameraModal(false)}
        onCapture={(file) => handleProcessFile(file)}
        title="Snap Garbage Evidence"
        subtitle="Aim camera at the waste and tap the shutter button"
      />

      <div className="max-w-[1200px] mx-auto w-full flex flex-col flex-1">
        
        {/* Header Area */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <button onClick={handlePrev} className="text-brand-600 font-bold text-xs sm:text-sm mb-1 flex items-center hover:underline">
              <ChevronLeft className="w-4 h-4 mr-0.5" /> Back
            </button>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-display font-extrabold text-ink tracking-tight mb-0.5">
              {step === 1 && <>Snap or upload <span className="text-brand-600">photo</span></>}
              {step === 2 && <>Confirm <span className="text-brand-600">Exact Location</span></>}
              {step === 3 && <>Review & <span className="text-brand-600">Submit</span></>}
            </h1>
            <p className="text-text-muted text-xs max-w-md">
              {step === 1 && "Use live camera or upload a picture. Open Vision AI will detect waste characteristics."}
              {step === 2 && "Interactive live map pinpointing with high-accuracy GPS tracking and street address reverse geocoding."}
              {step === 3 && "Review AI recommendations and submit directly to Supabase."}
            </p>
          </div>

          {/* Responsive Stepper */}
          <div className="flex items-center space-x-2 sm:space-x-3 bg-surface p-2 rounded-2xl border border-border shadow-2xs self-start sm:self-auto">
            {steps.map((s, idx) => {
              const isActive = s.id === step;
              const isPast = s.id < step;
              return (
                <div key={s.id} className="flex items-center">
                  <div className="flex items-center space-x-1.5">
                    <div className={`w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center transition-colors shadow-2xs ${
                      isActive ? 'bg-brand-500 text-white' : isPast ? 'bg-brand-100 text-brand-600' : 'bg-surface-2 text-text-muted'
                    }`}>
                      {isPast ? <CheckCircle className="w-3.5 h-3.5" /> : <s.icon className="w-3.5 h-3.5" />}
                    </div>
                    <span className={`text-[10px] sm:text-xs font-bold ${isActive ? 'text-brand-600' : 'text-text-muted'} ${
                      isActive ? 'inline' : 'hidden sm:inline'
                    }`}>
                      {s.label}
                    </span>
                  </div>
                  {idx < steps.length - 1 && (
                    <div className={`w-3 sm:w-6 h-px mx-1 sm:mx-1.5 ${isPast ? 'bg-brand-500' : 'bg-border'}`} />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Responsive Grid Layout (Main Form + Insights Card) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 flex-1">
          
          {/* Main Action Area */}
          <div className="lg:col-span-8 order-1 flex flex-col">
            <AnimatePresence mode="wait">
              {/* STEP 1: PHOTO CAPTURE & UPLOAD */}
              {step === 1 && (
                <motion.div key="s1" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="bg-surface rounded-3xl p-4 sm:p-5 shadow-sm border border-border flex flex-col flex-1">
                  
                  {!photoUrl ? (
                    <div className="flex-1 flex flex-col space-y-3">
                      {/* Dual Action Container: Live Camera + Device Upload */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 min-h-[190px] sm:min-h-[220px]">
                        
                        {/* 1. DIRECT CAMERA CAPTURE BUTTON */}
                        <div 
                          onClick={() => {
                            // On mobile touch devices, check if camera is directly preferred or launch modal
                            if (/Android|iPhone|iPad|iPod/i.test(navigator.userAgent)) {
                              mobileCameraInputRef.current?.click();
                            } else {
                              setShowCameraModal(true);
                            }
                          }}
                          className="border-2 border-dashed border-emerald-500/40 rounded-3xl bg-emerald-50/40 dark:bg-emerald-950/20 hover:bg-emerald-50/80 dark:hover:bg-emerald-950/40 transition-all cursor-pointer flex flex-col items-center justify-center p-6 group text-center shadow-xs hover:border-emerald-500"
                        >
                          <div className="w-14 h-14 rounded-full bg-emerald-500 text-white shadow-md flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                            <Camera className="w-7 h-7" />
                          </div>
                          <span className="text-ink font-bold text-sm sm:text-base">Use Phone Camera</span>
                          <span className="text-emerald-700 dark:text-emerald-400 text-xs font-semibold mt-0.5">Click a photo right now</span>
                          <p className="text-text-muted text-[11px] mt-2">Opens your camera to snap real-time evidence</p>
                        </div>

                        {/* 2. UPLOAD FROM FILES / GALLERY BUTTON */}
                        <div 
                          onClick={() => fileInputRef.current?.click()}
                          className="border-2 border-dashed border-border rounded-3xl bg-surface-2 hover:bg-surface-3 transition-all cursor-pointer flex flex-col items-center justify-center p-6 group text-center shadow-xs hover:border-brand-500/50"
                        >
                          <div className="w-14 h-14 rounded-full bg-surface border border-border text-text shadow-sm flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                            <Upload className="w-6 h-6 text-brand-600" />
                          </div>
                          <span className="text-ink font-bold text-sm sm:text-base">Upload from Device</span>
                          <span className="text-text-muted text-xs font-semibold mt-0.5">Choose from gallery or files</span>
                          <p className="text-text-muted text-[11px] mt-2">Supports JPG, PNG, WEBP photos</p>
                        </div>
                      </div>

                      {/* Web Viewfinder fallback shortcut */}
                      <div className="flex items-center justify-center">
                        <button
                          type="button"
                          onClick={() => setShowCameraModal(true)}
                          className="inline-flex items-center text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline py-1"
                        >
                          <SwitchCamera className="w-3.5 h-3.5 mr-1.5" />
                          <span>Open Live Web Cam Viewfinder Modal</span>
                        </button>
                      </div>

                      {/* 440 Dataset Scenes Quick Test Bar */}
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3.5 bg-brand-50/70 dark:bg-brand-950/30 rounded-2xl border border-brand-500/20 gap-3">
                        <div className="flex items-center space-x-3">
                          <div className="w-9 h-9 rounded-xl bg-brand-500 text-white flex items-center justify-center shadow-xs shrink-0">
                            <Layers className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="text-xs font-bold text-ink">Test 440 Pre-trained Scenes</p>
                            <p className="text-[10px] text-text-muted">Test model on 140 community places + 300 municipal sites</p>
                          </div>
                        </div>
                        <Button 
                          type="button" 
                          size="sm" 
                          variant="ghost" 
                          className="border border-brand-500/30 text-brand-700 dark:text-brand-300 bg-surface hover:bg-brand-100 text-xs font-bold shadow-xs w-full sm:w-auto"
                          onClick={openDatasetPicker}
                          leftIcon={<FolderOpen className="w-3.5 h-3.5" />}
                        >
                          Browse 440 Scenes
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex-1 flex flex-col">
                      <div className="relative rounded-3xl overflow-hidden mb-3 border border-border bg-slate-950/5 shadow-sm flex items-center justify-center min-h-[240px] sm:min-h-[320px] max-h-[50vh]">
                        <img 
                          src={photoUrl} 
                          alt="Preview" 
                          className="w-full h-full object-contain max-h-[48vh]" 
                        />

                        {/* Dynamic Translucent SVG Highlighter Overlay */}
                        {showOpenCVContours && aiAnalysis?.detectedPolygons && aiAnalysis.detectedPolygons.length > 0 && !analyzing && (
                          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <svg 
                              viewBox={`0 0 ${aiAnalysis.canvasDimensions?.width || 640} ${aiAnalysis.canvasDimensions?.height || 480}`} 
                              className="w-full h-full object-contain"
                              preserveAspectRatio="xMidYMid meet"
                            >
                              <defs>
                                <filter id="emeraldGlow" x="-20%" y="-20%" width="140%" height="140%">
                                  <feGaussianBlur stdDeviation="3" result="blur" />
                                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                                </filter>
                              </defs>

                              {aiAnalysis.detectedPolygons.map((polygon, pIdx) => {
                                if (polygon.length < 3) return null;
                                const pointsStr = polygon.map(pt => `${pt.x},${pt.y}`).join(' ');
                                const xs = polygon.map(p => p.x);
                                const ys = polygon.map(p => p.y);
                                const minX = Math.min(...xs);
                                const minY = Math.min(...ys);

                                return (
                                  <g key={pIdx}>
                                    <motion.polygon
                                      points={pointsStr}
                                      fill="rgba(34, 197, 94, 0.22)"
                                      stroke="rgba(16, 185, 129, 0.95)"
                                      strokeWidth="2.5"
                                      strokeLinejoin="round"
                                      strokeDasharray="8 4"
                                      filter="url(#emeraldGlow)"
                                      animate={{
                                        strokeDashoffset: [0, -36],
                                        fillOpacity: [0.18, 0.28, 0.18]
                                      }}
                                      transition={{
                                        strokeDashoffset: { repeat: Infinity, duration: 4, ease: "linear" },
                                        fillOpacity: { repeat: Infinity, duration: 3, ease: "easeInOut" }
                                      }}
                                    />
                                    <g transform={`translate(${Math.max(10, minX + 5)}, ${Math.max(22, minY - 8)})`}>
                                      <rect 
                                        x="0" 
                                        y="-16" 
                                        width={aiAnalysis.detectedPolygons && aiAnalysis.detectedPolygons.length === 1 ? "154" : "132"} 
                                        height="22" 
                                        rx="11" 
                                        fill="rgba(15, 23, 42, 0.88)" 
                                        stroke="rgba(34, 197, 94, 0.85)" 
                                        strokeWidth="1.2" 
                                      />
                                      <circle cx="11" cy="-5" r="3.5" fill="#22c55e" />
                                      <text 
                                        x="22" 
                                        y="-2" 
                                        fill="#ffffff" 
                                        fontSize="10" 
                                        fontWeight="bold" 
                                        fontFamily="system-ui, sans-serif"
                                      >
                                        {aiAnalysis.detectedPolygons && aiAnalysis.detectedPolygons.length === 1 
                                          ? `Detected Waste Zone • ${Math.round(aiAnalysis.confidence * 100)}%` 
                                          : `Waste Cluster #${pIdx + 1} • ${Math.round(aiAnalysis.confidence * 100)}%`}
                                      </text>
                                    </g>
                                  </g>
                                );
                              })}
                            </svg>
                          </div>
                        )}

                        {/* Active Radar Sweep Line Effect */}
                        {showOpenCVContours && aiAnalysis && !analyzing && (
                          <motion.div 
                            className="absolute left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-brand-400 to-transparent shadow-[0_0_12px_#22c55e] pointer-events-none z-10"
                            initial={{ top: '15%' }}
                            animate={{ top: ['15%', '85%', '15%'] }}
                            transition={{ repeat: Infinity, duration: 4.5, ease: 'easeInOut' }}
                          />
                        )}
                        
                        {/* Organic Highlighting Toggle Pill */}
                        {aiAnalysis && !analyzing && (
                          <button 
                            type="button"
                            onClick={() => setShowOpenCVContours(!showOpenCVContours)}
                            className="absolute top-3 left-3 bg-slate-900/85 backdrop-blur-md text-white px-3 py-1.5 rounded-full text-[11px] font-bold flex items-center hover:bg-slate-900 transition-colors shadow-sm z-10"
                          >
                            <Sparkles className="w-3.5 h-3.5 mr-1.5 text-brand-400" />
                            {showOpenCVContours ? 'AI Highlights (On)' : 'Raw Photo'}
                          </button>
                        )}

                        {analyzing && (
                          <div className="absolute inset-0 bg-slate-950/75 backdrop-blur-sm flex flex-col items-center justify-center text-white p-4 text-center">
                            <Loader2 className="w-8 h-8 animate-spin text-brand-400 mb-3" />
                            <p className="font-bold text-sm">Open Vision AI Engine Running...</p>
                            <p className="text-xs text-white/70 mt-1">Extracting exact organic silhouettes & measuring cleanliness</p>
                          </div>
                        )}

                        {!analyzing && (
                          <div className="absolute top-3 right-3 flex items-center space-x-1.5 z-10">
                            <button 
                              onClick={() => {
                                if (/Android|iPhone|iPad|iPod/i.test(navigator.userAgent)) {
                                  mobileCameraInputRef.current?.click();
                                } else {
                                  setShowCameraModal(true);
                                }
                              }} 
                              className="bg-emerald-500 hover:bg-emerald-600 text-white px-3 py-1.5 rounded-full text-xs font-bold flex items-center shadow-sm"
                            >
                              <Camera className="w-3.5 h-3.5 mr-1" /> Retake
                            </button>
                            <button 
                              onClick={() => { setPhotoUrl(null); setPhotoFile(null); setAiAnalysis(null); }} 
                              className="bg-background/80 backdrop-blur text-ink px-2.5 py-1.5 rounded-full text-xs font-bold hover:bg-surface transition-colors shadow-sm"
                            >
                              Clear
                            </button>
                          </div>
                        )}
                      </div>

                      <div className="flex justify-end mt-2">
                        <Button 
                          size="lg" 
                          onClick={handleNext} 
                          disabled={!photoUrl || analyzing} 
                          rightIcon={<ArrowRight className="w-4 h-4"/>}
                          className="w-full sm:w-auto"
                        >
                          Continue to Location
                        </Button>
                      </div>
                    </div>
                  )}
                </motion.div>
              )}

              {/* STEP 2: GOOGLE MAPS LOCATION PICKER */}
              {step === 2 && (
                <motion.div key="s2" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="flex flex-col flex-1">
                  <GoogleLocationPicker
                    location={location}
                    onChange={(newLoc) => setLocation(newLoc)}
                    onConfirm={handleNext}
                  />
                </motion.div>
              )}

              {/* STEP 3: DETAILS & SUBMIT */}
              {step === 3 && (
                <motion.div key="s3" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="bg-surface rounded-3xl p-4 sm:p-5 shadow-sm border border-border flex flex-col flex-1">
                  <div className="space-y-4 flex-1">
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <label className="block text-xs font-bold text-ink">Waste Type</label>
                        {aiAnalysis && (
                          <span className="text-[10px] bg-brand-100 dark:bg-brand-950 text-brand-700 dark:text-brand-300 px-2 py-0.5 rounded-full font-bold flex items-center">
                            <Sparkles className="w-3 h-3 mr-1"/> AI Predicted
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {(['household', 'plastic', 'construction', 'organic', 'near_water', 'other'] as Report['wasteType'][]).map(type => (
                          <button 
                            key={type} 
                            type="button"
                            onClick={() => setWasteType(type)}
                            className={`px-3 py-1.5 rounded-full border text-xs transition-all ${
                              wasteType === type 
                                ? 'border-brand-500 bg-brand-50 dark:bg-brand-950 text-brand-600 font-bold shadow-sm' 
                                : 'border-border bg-surface text-text hover:border-brand-500/50 hover:bg-brand-50'
                            }`}
                          >
                            {type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-ink mb-2">Severity Level</label>
                      <div className="flex gap-2">
                        {(['low', 'medium', 'high'] as Report['severity'][]).map(sev => {
                          const colors = {
                            low: 'border-brand-500 text-brand-600 bg-brand-50 dark:bg-brand-950',
                            medium: 'border-sun text-warn bg-warn-soft',
                            high: 'border-coral text-danger bg-danger-soft'
                          };
                          const isActive = severity === sev;
                          
                          return (
                            <button 
                              key={sev}
                              type="button"
                              onClick={() => setSeverity(sev)}
                              className={`flex-1 py-2 rounded-xl border text-xs font-bold transition-all ${
                                isActive ? `${colors[sev]} shadow-sm` : 'border-border bg-surface text-text hover:bg-surface-2'
                              }`}
                            >
                              {sev.charAt(0).toUpperCase() + sev.slice(1)}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-ink mb-1.5">Additional Notes (Optional)</label>
                      <textarea 
                        className="w-full bg-surface border border-border rounded-xl p-3 text-xs text-ink focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none h-20 shadow-sm"
                        placeholder="E.g. Near storm drain, sharp materials present..."
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                      />
                    </div>

                    <div className="bg-surface-2 rounded-xl p-3 border border-border flex items-center justify-between text-xs">
                      <div className="flex items-center space-x-2 overflow-hidden mr-2">
                        <MapPin className="w-4 h-4 text-brand-500 shrink-0" />
                        <span className="text-text-muted truncate">{location.address}</span>
                      </div>
                      <button onClick={() => setStep(2)} className="text-brand-600 font-bold hover:underline shrink-0">Change</button>
                    </div>
                  </div>
                  
                  <div className="flex justify-end mt-4 border-t border-border pt-3">
                    <Button 
                      size="lg" 
                      className="w-full sm:w-auto shadow-sm px-8 text-xs bg-brand-500 hover:bg-brand-600" 
                      onClick={handleSubmit} 
                      isLoading={loading} 
                      disabled={!wasteType || !severity} 
                      rightIcon={<CheckCircle className="w-4 h-4"/>}
                    >
                      Publish to Supabase
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Left / Bottom Info & AI Insights Card */}
          <div className="lg:col-span-4 order-2 flex flex-col">
            <div className="bg-brand-50 dark:bg-brand-950/40 rounded-3xl p-4 sm:p-5 border border-brand-500/10 flex flex-col">
              
              {/* If AI has analyzed the image, show live model insights! */}
              {aiAnalysis ? (
                <div className="space-y-3.5">
                  <div className="inline-flex items-center space-x-1.5 bg-brand-100 dark:bg-brand-900 text-brand-700 dark:text-brand-300 px-3 py-1 rounded-full text-xs font-bold">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>OPEN VISION AI ENGINE</span>
                  </div>

                  <div>
                    <h3 className="text-base sm:text-lg font-bold text-ink mb-1 capitalize">
                      {aiAnalysis.wasteType.replace('_', ' ')} Waste
                    </h3>
                    <div className="flex items-center space-x-2 text-xs">
                      <span className="font-semibold text-brand-600">{Math.round(aiAnalysis.confidence * 100)}% Confidence</span>
                      <span className="text-text-muted">•</span>
                      <span className="text-text-muted capitalize">{aiAnalysis.severity} Severity</span>
                    </div>
                  </div>

                  {/* Cleanliness Meter */}
                  <div className="bg-surface rounded-2xl p-3 border border-border">
                    <div className="flex justify-between items-center text-xs mb-1.5 font-bold">
                      <span className="text-text-muted">Cleanliness Index</span>
                      <span className="text-ink">{aiAnalysis.cleanlinessScore}/100</span>
                    </div>
                    <div className="w-full bg-surface-2 rounded-full h-2 overflow-hidden">
                      <div 
                        className={`h-full rounded-full ${aiAnalysis.cleanlinessScore < 40 ? 'bg-coral' : 'bg-sun'}`} 
                        style={{ width: `${aiAnalysis.cleanlinessScore}%` }}
                      />
                    </div>
                  </div>

                  {/* Metrics */}
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-surface rounded-2xl p-2.5 border border-border">
                      <span className="text-[10px] text-text-muted uppercase font-bold block">Debris Area</span>
                      <span className="text-sm sm:text-base font-bold text-coral">{aiAnalysis.coveragePercentage}%</span>
                    </div>
                    <div className="bg-surface rounded-2xl p-2.5 border border-border">
                      <span className="text-[10px] text-text-muted uppercase font-bold block">Clusters</span>
                      <span className="text-sm sm:text-base font-bold text-ink">{aiAnalysis.detectedClustersCount ?? aiAnalysis.detectedBoxesCount ?? 0}</span>
                    </div>
                  </div>

                  {/* Detected Items */}
                  {aiAnalysis.detectedItems.length > 0 && (
                    <div>
                      <p className="text-[10px] font-bold text-text-muted uppercase tracking-wider mb-1">Detected Items</p>
                      <div className="flex flex-wrap gap-1">
                        {aiAnalysis.detectedItems.map((item, i) => (
                          <span key={i} className="text-[10px] bg-surface border border-border px-2 py-0.5 rounded-lg text-ink font-medium">
                            {item}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="py-2">
                  <div className="w-14 h-14 bg-surface rounded-2xl shadow-sm mb-3 flex items-center justify-center relative transform rotate-[-4deg]">
                    {step === 1 && <Camera className="w-6 h-6 text-brand-500" />}
                    {step === 2 && <MapPin className="w-6 h-6 text-brand-500" />}
                    {step === 3 && <FileText className="w-6 h-6 text-brand-500" />}
                    <div className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-sun rounded-full flex items-center justify-center text-white"><Zap className="w-3 h-3"/></div>
                  </div>
                  
                  <h2 className="text-base font-bold text-ink mb-1">
                    {step === 1 && "Live Camera & Vision Scanning"}
                    {step === 2 && "Real-time Google Maps Location"}
                    {step === 3 && "Supabase Instant Notification"}
                  </h2>
                  <p className="text-text-muted text-xs leading-relaxed">
                    {step === 1 && "Snap or upload any waste photo. The embedded Open Vision model computes material classification and severity."}
                    {step === 2 && "Exact pin coordinates and reverse geocoded street address ensure crews arrive directly at the scene."}
                    {step === 3 && "Your report is broadcast to certified municipal teams and partner NGOs."}
                  </p>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>

      {/* 440 Trained Scenes Dataset Testing Modal */}
      {showDatasetModal && (
        <div className="fixed inset-0 z-50 bg-ink/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-surface border border-border rounded-[28px] max-w-4xl w-full max-h-[88vh] flex flex-col shadow-2xl overflow-hidden"
          >
            <div className="p-4 border-b border-border flex items-center justify-between shrink-0 bg-surface">
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 rounded-2xl bg-brand-500 text-white flex items-center justify-center shadow-xs">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-ink">
                    Trained Vision Dataset Browser (440 Scenes)
                  </h3>
                  <p className="text-[11px] text-text-muted">Select any Before or After image to test model scanning</p>
                </div>
              </div>
              <button 
                onClick={() => setShowDatasetModal(false)}
                className="w-8 h-8 rounded-full bg-surface-2 hover:bg-border/60 flex items-center justify-center text-text-muted hover:text-ink transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 bg-surface-2 border-b border-border flex flex-wrap items-center justify-between gap-2 shrink-0">
              <div className="flex flex-wrap gap-1 text-[11px]">
                {[
                  { id: 'all', label: `All (${datasetScenes.length || 440})` },
                  { id: 'urban_street', label: 'Street' },
                  { id: 'residential_alley', label: 'Residential' },
                  { id: 'waterfront_canal', label: 'Waterfront' },
                  { id: 'public_park', label: 'Parks' },
                  { id: 'commercial_market', label: 'Market' },
                  { id: 'construction_site', label: 'Construction' },
                  { id: 'vacant_plot', label: 'Dumping Site' }
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setSelectedEnvFilter(tab.id)}
                    className={`px-2.5 py-1 rounded-full font-semibold transition-all ${
                      selectedEnvFilter === tab.id
                        ? 'bg-brand-500 text-white shadow-xs'
                        : 'bg-surface border border-border text-text-muted hover:text-ink'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <div className="flex items-center bg-surface p-1 rounded-xl border border-border shadow-xs text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setSampleMode('before')}
                  className={`px-2.5 py-1 rounded-lg transition-colors ${
                    sampleMode === 'before' ? 'bg-coral text-white shadow-xs' : 'text-text-muted hover:text-ink'
                  }`}
                >
                  Before
                </button>
                <button
                  type="button"
                  onClick={() => setSampleMode('after')}
                  className={`px-2.5 py-1 rounded-lg transition-colors ${
                    sampleMode === 'after' ? 'bg-success text-white shadow-xs' : 'text-text-muted hover:text-ink'
                  }`}
                >
                  After
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-3 sm:p-4">
              {loadingDataset ? (
                <div className="py-16 text-center">
                  <Loader2 className="w-8 h-8 animate-spin mx-auto text-brand-500 mb-2" />
                  <p className="text-xs text-text-muted">Loading 440 trained multi-spectral scenes...</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {datasetScenes
                    .filter(s => selectedEnvFilter === 'all' || s.environment === selectedEnvFilter)
                    .map(scene => {
                      const imagePath = sampleMode === 'before' ? scene.beforeImagePath : scene.afterImagePath;
                      return (
                        <div
                          key={scene.sceneId}
                          onClick={() => handleSelectSample(imagePath, scene.wasteType)}
                          className="group bg-surface rounded-2xl border border-border hover:border-brand-500 hover:shadow-md transition-all cursor-pointer overflow-hidden flex flex-col"
                        >
                          <div className="aspect-[4/3] bg-slate-900 relative overflow-hidden">
                            <img src={imagePath} alt={scene.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                            <div className="absolute top-2 left-2 bg-black/70 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-md">
                              {scene.sceneId}
                            </div>
                          </div>
                          <div className="p-2">
                            <p className="text-[11px] font-bold text-ink truncate">{scene.title}</p>
                            <p className="text-[10px] text-text-muted capitalize">{scene.wasteType}</p>
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
