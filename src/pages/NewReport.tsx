import React, { useState, useRef, useEffect } from 'react';
import { Camera, MapPin, ChevronLeft, ArrowRight, X, Info, CheckCircle, Leaf, Loader2, Target, Zap, AlertCircle, FileText, Sparkles, ShieldAlert } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { useNavigate } from 'react-router-dom';
import { reportService } from '../services/reportService';
import { openVisionService } from '../services/openVisionService';
import { GoogleLocationPicker } from '../components/report/GoogleLocationPicker';
import { getCurrentDeviceLocation, reverseGeocodeCoords } from '../services/googleMapsService';
import { Report, AIAnalysisResult } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
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

  const handleNext = () => setStep(s => s + 1);
  const handlePrev = () => {
    if (step === 1) navigate(-1);
    else setStep(s => s - 1);
  };

  // Real Image Upload & Open Vision AI Scan
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
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

  // Fetch live GPS location on mount and when entering step 2
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
      <div className="bg-background min-h-[calc(100vh-96px)] font-sans pb-24 flex items-center justify-center">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center p-6 max-w-md">
          <div className="w-24 h-24 bg-brand-100 rounded-full flex items-center justify-center mx-auto mb-6 relative">
            <CheckCircle className="w-12 h-12 text-brand-500" />
            <div className="absolute -bottom-2 -right-2 bg-sun text-white text-xs font-bold px-2 py-1 rounded-full">+20 pts</div>
          </div>
          <h2 className="text-3xl font-display font-extrabold text-ink mb-2">Report Submitted!</h2>
          <p className="text-text-muted text-sm mb-8">
            Your report has been analyzed by Open Vision AI and broadcast to local cleanup crews and authorities.
          </p>
          <div className="flex space-x-3 justify-center">
            <Button size="lg" onClick={() => navigate('/feed')}>View in Feed</Button>
            <Button size="lg" variant="ghost" onClick={() => navigate('/my-reports')}>Track My Reports</Button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 top-[72px] bg-background z-40 font-sans flex flex-col overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-[10%] left-[-10%] w-[40%] h-[60%] rounded-full bg-brand-500/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-5%] w-[30%] h-[50%] rounded-full bg-aqua/5 blur-[100px] pointer-events-none" />

      <div className="max-w-[1200px] mx-auto w-full px-6 py-4 flex flex-col flex-1 min-h-0">
        
        {/* Header Area */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-4 relative z-10 shrink-0">
          <div>
            <button onClick={handlePrev} className="text-brand-600 font-bold text-sm mb-1 flex items-center hover:underline">
              <ChevronLeft className="w-4 h-4 mr-1" /> Back
            </button>
            <h1 className="text-2xl md:text-3xl font-display font-extrabold text-ink tracking-tight mb-0.5">
              {step === 1 && <>Snap a <span className="text-brand-600">photo</span></>}
              {step === 2 && <>Confirm with <span className="text-brand-600">Google Maps</span></>}
              {step === 3 && <>Review & <span className="text-brand-600">Submit</span></>}
            </h1>
            <p className="text-text-muted text-xs max-w-md">
              {step === 1 && "Take or upload a picture. Open Vision AI will automatically detect waste characteristics."}
              {step === 2 && "Interactive Google Maps location pinpointing with real-time street address reverse geocoding."}
              {step === 3 && "Review AI recommendations and submit directly to Supabase."}
            </p>
          </div>

          {/* Stepper */}
          <div className="flex items-center space-x-3">
            {steps.map((s, idx) => {
              const isActive = s.id === step;
              const isPast = s.id < step;
              return (
                <div key={s.id} className="flex items-center">
                  <div className="flex flex-col items-center">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center transition-colors shadow-sm mb-1 ${isActive ? 'bg-brand-500 text-white' : isPast ? 'bg-brand-100 text-brand-500' : 'bg-surface border border-border text-text-muted'}`}>
                      {isPast ? <CheckCircle className="w-3.5 h-3.5" /> : <s.icon className="w-3.5 h-3.5" />}
                    </div>
                    <span className={`text-[9px] font-bold ${isActive ? 'text-brand-600' : 'text-text-muted'}`}>{s.label}</span>
                  </div>
                  {idx < steps.length - 1 && (
                    <div className={`w-8 h-px mx-2 -mt-4 ${isPast ? 'bg-brand-500' : 'bg-border'}`} />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* 2-Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 relative z-10 flex-1 min-h-0">
          
          {/* Left: Info & AI Insights Card */}
          <div className="lg:col-span-4 h-full min-h-0">
            <div className="bg-brand-50 rounded-[32px] p-5 h-full flex flex-col border border-brand-500/10 overflow-y-auto">
              
              {/* If AI has analyzed the image, show live model insights! */}
              {aiAnalysis ? (
                <div className="space-y-4">
                  <div className="inline-flex items-center space-x-1.5 bg-brand-100 text-brand-700 px-3 py-1 rounded-full text-xs font-bold">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>OPEN VISION AI MODEL</span>
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-ink mb-1 capitalize">
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
                      <span className="text-text-muted">Cleanliness Score</span>
                      <span className="text-ink">{aiAnalysis.cleanlinessScore}/100</span>
                    </div>
                    <div className="w-full bg-surface-2 rounded-full h-2 overflow-hidden">
                      <div 
                        className={`h-full rounded-full ${aiAnalysis.cleanlinessScore < 40 ? 'bg-coral' : 'bg-sun'}`} 
                        style={{ width: `${aiAnalysis.cleanlinessScore}%` }}
                      />
                    </div>
                  </div>

                  {/* Detected Items */}
                  {aiAnalysis.detectedItems.length > 0 && (
                    <div>
                      <p className="text-[11px] font-bold text-text-muted uppercase tracking-wider mb-1.5">Detected Items</p>
                      <div className="flex flex-wrap gap-1.5">
                        {aiAnalysis.detectedItems.map((item, i) => (
                          <span key={i} className="text-[11px] bg-surface border border-border px-2.5 py-1 rounded-lg text-ink font-medium">
                            {item}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Cleanup Recommendations */}
                  {aiAnalysis.recommendations.length > 0 && (
                    <div className="bg-brand-100/50 rounded-2xl p-3 border border-brand-500/20">
                      <p className="text-[11px] font-bold text-brand-700 flex items-center mb-1">
                        <Target className="w-3.5 h-3.5 mr-1" /> Cleanup Recommendation
                      </p>
                      <p className="text-xs text-brand-900 leading-relaxed">
                        {aiAnalysis.recommendations[0]}
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <>
                  <div className="w-20 h-20 mx-auto bg-surface rounded-2xl shadow-sm mb-4 flex items-center justify-center relative transform rotate-[-5deg] shrink-0">
                    {step === 1 && <Camera className="w-8 h-8 text-brand-500" />}
                    {step === 2 && <MapPin className="w-8 h-8 text-brand-500" />}
                    {step === 3 && <FileText className="w-8 h-8 text-brand-500" />}
                    <div className="absolute -top-2 -right-2 w-7 h-7 bg-sun rounded-full flex items-center justify-center text-white"><Zap className="w-3.5 h-3.5"/></div>
                  </div>
                  
                  <h2 className="text-lg font-bold text-ink mb-2 leading-tight">
                    {step === 1 && "Open Vision scanning"}
                    {step === 2 && "Real-time Google Maps"}
                    {step === 3 && "Supabase synchronization"}
                  </h2>
                  <p className="text-text-muted text-xs mb-6">
                    {step === 1 && "Upload any waste photo. The embedded Open Vision model computes material classification and severity."}
                    {step === 2 && "Exact pin coordinates and reverse geocoded street address ensure crews arrive directly at the scene."}
                    {step === 3 && "Your report is broadcast to certified municipal teams and partner NGOs."}
                  </p>

                  <div className="space-y-3 mt-auto">
                    <div className="flex items-start">
                      <div className="w-7 h-7 rounded-full bg-brand-100 flex items-center justify-center shrink-0 mr-2.5 text-brand-600"><Target className="w-3.5 h-3.5"/></div>
                      <div>
                        <h4 className="font-bold text-ink text-xs">AI Edge Detection</h4>
                        <p className="text-[10px] text-text-muted">Calculates area debris coverage</p>
                      </div>
                    </div>
                    <div className="flex items-start">
                      <div className="w-7 h-7 rounded-full bg-brand-100 flex items-center justify-center shrink-0 mr-2.5 text-brand-600"><MapPin className="w-3.5 h-3.5"/></div>
                      <div>
                        <h4 className="font-bold text-ink text-xs">Google Maps Geocoding</h4>
                        <p className="text-[10px] text-text-muted">High accuracy GPS mapping</p>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Right: Main Action Area */}
          <div className="lg:col-span-8 h-full min-h-0">
            <AnimatePresence mode="wait">
              {/* STEP 1: PHOTO */}
              {step === 1 && (
                <motion.div key="s1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="bg-surface rounded-[32px] p-5 shadow-sm border border-border h-full flex flex-col min-h-0">
                  <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleImageUpload} />
                  
                  {!photoUrl ? (
                    <div onClick={() => fileInputRef.current?.click()} className="flex-1 min-h-[180px] border-2 border-dashed border-brand-500/30 rounded-3xl bg-brand-100/20 hover:bg-brand-100/40 transition-colors cursor-pointer flex flex-col items-center justify-center group relative overflow-hidden">
                      <div className="w-16 h-16 bg-surface rounded-full shadow-sm flex items-center justify-center mb-3 group-hover:scale-110 transition-transform"><Camera className="w-7 h-7 text-brand-500" /></div>
                      <span className="text-ink font-bold text-base">Tap to take photo or upload from device</span>
                      <p className="text-text-muted text-xs mt-1.5 flex items-center"><Info className="w-3.5 h-3.5 mr-1"/> Open Vision AI will automatically analyze the waste</p>
                    </div>
                  ) : (
                    <div className="flex-1 min-h-0 relative rounded-3xl overflow-hidden mb-3 border border-border bg-surface-2 shadow-sm">
                      <img src={photoUrl} alt="Preview" className="absolute inset-0 w-full h-full object-cover" />
                      {analyzing && (
                        <div className="absolute inset-0 bg-ink/70 backdrop-blur-sm flex flex-col items-center justify-center text-white">
                          <Loader2 className="w-8 h-8 animate-spin text-brand-400 mb-3" />
                          <p className="font-bold text-sm">Open Vision AI Scanning...</p>
                          <p className="text-xs text-white/70 mt-1">Classifying waste type and debris density</p>
                        </div>
                      )}
                      {!analyzing && (
                        <button onClick={() => { setPhotoUrl(null); setPhotoFile(null); setAiAnalysis(null); }} className="absolute top-3 right-3 bg-background/80 backdrop-blur text-ink px-3 py-1.5 rounded-full text-xs font-bold hover:bg-surface transition-colors shadow-sm">
                          Retake
                        </button>
                      )}
                    </div>
                  )}

                  <div className="flex justify-end mt-3 shrink-0">
                    <Button size="lg" onClick={handleNext} disabled={!photoUrl || analyzing} rightIcon={<ArrowRight className="w-4 h-4"/>}>
                      Continue to Location
                    </Button>
                  </div>
                </motion.div>
              )}

              {/* STEP 2: GOOGLE MAPS LOCATION PICKER */}
              {step === 2 && (
                <motion.div key="s2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="h-full min-h-0">
                  <GoogleLocationPicker
                    location={location}
                    onChange={(newLoc) => setLocation(newLoc)}
                    onConfirm={handleNext}
                  />
                </motion.div>
              )}

              {/* STEP 3: DETAILS & SUBMIT */}
              {step === 3 && (
                <motion.div key="s3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="bg-surface rounded-[32px] p-5 shadow-sm border border-border h-full flex flex-col min-h-0">
                  <div className="space-y-4 flex-1 overflow-y-auto pr-1">
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <label className="block text-xs font-bold text-ink">Waste Type</label>
                        {aiAnalysis && (
                          <span className="text-[10px] bg-brand-100 text-brand-700 px-2 py-0.5 rounded-full font-bold flex items-center">
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
                            className={`px-3.5 py-1.5 rounded-full border text-xs transition-all ${
                              wasteType === type 
                                ? 'border-brand-500 bg-brand-50 text-brand-600 font-bold shadow-sm' 
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
                            low: 'border-brand-500 text-brand-600 bg-brand-50',
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
                      <div className="flex items-center space-x-2">
                        <MapPin className="w-4 h-4 text-brand-500" />
                        <span className="text-text-muted truncate max-w-[280px]">{location.address}</span>
                      </div>
                      <button onClick={() => setStep(2)} className="text-brand-600 font-bold hover:underline shrink-0">Change</button>
                    </div>
                  </div>
                  
                  <div className="flex justify-end mt-3 border-t border-border pt-3 shrink-0">
                    <Button 
                      size="lg" 
                      className="shadow-sm px-8 text-xs bg-brand-500 hover:bg-brand-600" 
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
        </div>
      </div>
    </div>
  );
}
