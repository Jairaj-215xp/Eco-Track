import React, { useState, useRef, useEffect } from 'react';
import { Camera, MapPin, ChevronLeft, ArrowRight, X, Info, CheckCircle, Leaf, Loader2 } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { useNavigate } from 'react-router-dom';
import { reportService } from '../services/reportService';
import { Report } from '../types';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';

export function NewReport() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const navigate = useNavigate();

  // Form State
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [location, setLocation] = useState<{ lat: number; lng: number; address: string; accuracyM: number }>({
    lat: 18.5204, lng: 73.8567, address: 'Detecting location...', accuracyM: 10
  });
  const [wasteType, setWasteType] = useState<Report['wasteType'] | null>(null);
  const [severity, setSeverity] = useState<Report['severity'] | null>(null);
  const [note, setNote] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleNext = () => setStep(s => s + 1);
  const handlePrev = () => setStep(s => Math.max(1, s - 1));

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setPhotoUrl(url);
      
      // Simulate AI analysis
      setAnalyzing(true);
      setTimeout(() => {
        setAnalyzing(false);
        setWasteType('plastic');
      }, 2000);
    }
  };

  const requestLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLocation({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            address: 'FC Road, Deccan Gymkhana, Pune', // Mocked reverse geocoding
            accuracyM: Math.round(pos.coords.accuracy)
          });
        },
        () => {
          setLocation(prev => ({ ...prev, address: 'Location permission denied, using default.' }));
        }
      );
    }
  };

  useEffect(() => {
    if (step === 2) requestLocation();
    if (step === 4) {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#34B27B', '#4CC9C0', '#FFC857']
      });
    }
  }, [step]);

  const handleSubmit = async () => {
    if (!wasteType || !severity || !photoUrl) return;
    setLoading(true);
    await reportService.createReport({
      photoUrl,
      location,
      wasteType,
      severity,
      note,
      reporterId: 'u1'
    });
    setLoading(false);
    handleNext(); // Go to success screen
  };

  return (
    <div className="fixed inset-0 z-50 bg-background overflow-y-auto font-sans flex flex-col">
      {/* Header */}
      <div className="sticky top-0 bg-background/80 backdrop-blur-md z-10 px-6 py-4 flex items-center justify-between border-b border-border/50">
        <button 
          onClick={() => step === 1 ? navigate('/feed') : handlePrev()}
          className="p-2 -ml-2 text-text-muted hover:text-ink rounded-full hover:bg-surface-2 transition-colors"
        >
          {step === 1 ? <X className="w-6 h-6" /> : <ChevronLeft className="w-6 h-6" />}
        </button>
        
        {/* Progress Bar */}
        <div className="flex-1 max-w-xs mx-4">
          <div className="h-1.5 w-full bg-border rounded-full overflow-hidden">
            <motion.div 
              className="h-full bg-gradient-to-r from-brand-500 to-aqua"
              initial={{ width: '25%' }}
              animate={{ width: `${(Math.min(step, 3) / 3) * 100}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>
        
        <div className="w-10" />
      </div>

      <div className="flex-1 max-w-[640px] w-full mx-auto px-6 py-8 flex flex-col">
        <AnimatePresence mode="wait">
          
          {step === 1 && (
            <motion.div 
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex flex-col flex-1"
            >
              <h2 className="text-3xl font-display font-extrabold text-ink mb-2">Snap a photo</h2>
              <p className="text-text-muted text-lg mb-8">Take a clear picture of the garbage.</p>
              
              <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleImageUpload} />

              {!photoUrl ? (
                <div 
                  className="flex-1 min-h-[300px] flex flex-col items-center justify-center border-2 border-dashed border-brand-500/30 rounded-3xl bg-brand-100/30 hover:bg-brand-100/50 transition-colors cursor-pointer mb-8 relative group overflow-hidden"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <div className="absolute inset-0 bg-gradient-to-b from-transparent to-brand-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="w-20 h-20 bg-surface rounded-full shadow-sm flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <Camera className="w-8 h-8 text-brand-500" />
                  </div>
                  <span className="text-ink font-bold text-lg">Tap to upload photo</span>
                  <p className="text-text-muted text-sm mt-2 flex items-center"><Info className="w-4 h-4 mr-1"/> Include landmarks for better accuracy</p>
                </div>
              ) : (
                <div className="flex-1 min-h-[300px] relative rounded-3xl overflow-hidden mb-8 border border-border bg-surface-2 shadow-sm">
                  <img src={photoUrl} alt="Preview" className="w-full h-full object-cover" />
                  
                  {analyzing && (
                    <div className="absolute inset-0 bg-ink/60 backdrop-blur-sm flex flex-col items-center justify-center text-white">
                      <Loader2 className="w-10 h-10 animate-spin text-brand-500 mb-4" />
                      <p className="font-bold">AI Analyzing Image...</p>
                    </div>
                  )}

                  {!analyzing && (
                    <button 
                      onClick={() => setPhotoUrl(null)}
                      className="absolute top-4 right-4 bg-background/80 backdrop-blur text-ink px-4 py-2 rounded-full text-sm font-bold hover:bg-surface transition-colors shadow-sm"
                    >
                      Retake
                    </button>
                  )}
                </div>
              )}
              
              <Button size="lg" className="w-full mt-auto" onClick={handleNext} disabled={!photoUrl || analyzing} rightIcon={<ArrowRight className="w-5 h-5"/>}>
                Continue
              </Button>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div 
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex flex-col flex-1"
            >
              <h2 className="text-3xl font-display font-extrabold text-ink mb-2">Confirm location</h2>
              <p className="text-text-muted text-lg mb-8">We automatically pinned your location.</p>
              
              <div className="bg-brand-100/30 rounded-3xl border border-brand-500/20 h-[300px] mb-6 flex items-center justify-center relative overflow-hidden shadow-inner">
                {/* Simulated Leaflet map background */}
                <div className="absolute inset-0 opacity-30 bg-[url('https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png')] bg-repeat" />
                
                {/* Pulsing Dot */}
                <div className="relative flex items-center justify-center">
                  <div className="absolute w-24 h-24 bg-brand-500/20 rounded-full animate-ping" />
                  <div className="absolute w-12 h-12 bg-brand-500/30 rounded-full" />
                  <MapPin className="w-10 h-10 text-brand-500 relative z-10" />
                </div>
              </div>

              <div className="bg-surface rounded-2xl border border-border p-5 flex items-start mb-8 shadow-sm">
                <div className="w-10 h-10 rounded-full bg-brand-100 flex items-center justify-center shrink-0 mt-0.5 mr-4">
                  <MapPin className="w-5 h-5 text-brand-600" />
                </div>
                <div className="flex-1">
                  <p className="font-bold text-ink">{location.address}</p>
                  <p className="text-sm text-text-muted mt-1">Accuracy: ±{location.accuracyM}m</p>
                  <button onClick={requestLocation} className="text-sm text-brand-600 mt-3 font-bold hover:underline">Refresh Location</button>
                </div>
              </div>
              
              <Button size="lg" className="w-full mt-auto" onClick={handleNext} rightIcon={<ArrowRight className="w-5 h-5"/>}>
                Continue
              </Button>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div 
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex flex-col flex-1"
            >
              <h2 className="text-3xl font-display font-extrabold text-ink mb-2">Add details</h2>
              <p className="text-text-muted text-lg mb-8">Help the cleanup crew prepare.</p>
              
              <div className="space-y-8 flex-1">
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <label className="block text-sm font-bold text-ink">Waste Type</label>
                    {wasteType === 'plastic' && <span className="text-xs bg-brand-100 text-brand-600 px-2 py-1 rounded-full font-bold flex items-center"><CheckCircle className="w-3 h-3 mr-1"/> AI Detected</span>}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {(['household', 'plastic', 'construction', 'organic', 'near_water', 'other'] as Report['wasteType'][]).map(type => (
                      <button 
                        key={type} 
                        onClick={() => setWasteType(type)}
                        className={`px-5 py-2.5 rounded-full border text-sm transition-all ${
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
                  <label className="block text-sm font-bold text-ink mb-3">Severity</label>
                  <div className="flex gap-3">
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
                          onClick={() => setSeverity(sev)}
                          className={`flex-1 py-3 rounded-2xl border text-sm font-bold transition-all ${
                            isActive ? `${colors[sev]} shadow-sm scale-[1.02]` : 'border-border bg-surface text-text hover:bg-surface-2'
                          }`}
                        >
                          {sev.charAt(0).toUpperCase() + sev.slice(1)}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-ink mb-2">Note (Optional)</label>
                  <textarea 
                    className="w-full bg-surface border border-border rounded-2xl p-4 text-ink focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent resize-none h-28 shadow-sm transition-shadow"
                    placeholder="E.g. Broken glass, needs heavy machinery..."
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                  />
                </div>
              </div>
              
              <Button size="lg" className="w-full mt-8 shadow-md" onClick={handleSubmit} isLoading={loading} disabled={!wasteType || !severity}>
                Submit Report
              </Button>
            </motion.div>
          )}

          {step === 4 && (
            <motion.div 
              key="step4"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center justify-center flex-1 text-center py-12"
            >
              <div className="w-24 h-24 bg-brand-100 rounded-full flex items-center justify-center mb-8 relative">
                <motion.div 
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", damping: 10, delay: 0.2 }}
                >
                  <CheckCircle className="w-12 h-12 text-brand-500" />
                </motion.div>
                <div className="absolute -bottom-2 -right-2 bg-sun text-white text-xs font-bold px-2 py-1 rounded-full shadow-sm">
                  +20 pts
                </div>
              </div>
              
              <h2 className="text-4xl font-display font-extrabold text-ink mb-4">Awesome!</h2>
              <p className="text-text-muted text-lg mb-12 max-w-sm">
                Your report has been submitted successfully. We've notified nearby organizations.
              </p>
              
              <div className="space-y-4 w-full max-w-xs">
                <Button size="lg" className="w-full shadow-md" onClick={() => navigate('/feed')}>
                  View in Feed
                </Button>
                <Button size="lg" variant="ghost" className="w-full" onClick={() => navigate('/my-reports')}>
                  Track Status
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
