import React, { useState, useRef, useEffect } from 'react';
import { Camera, MapPin, ChevronLeft, ArrowRight, X, Info, CheckCircle, Leaf, Loader2, Target, Zap, Search, AlertCircle, FileText } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { useNavigate } from 'react-router-dom';
import { reportService } from '../services/reportService';
import { Report } from '../types';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { MapView } from '../components/ui/MapView';

export function NewReport() {
  const [step, setStep] = useState(1); // 1=Photo, 2=Location, 3=Details, 4=Success
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
  const handlePrev = () => {
    if (step === 1) navigate(-1);
    else setStep(s => s - 1);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setPhotoUrl(url);
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
            address: 'FC Road, Deccan Gymkhana, Pune',
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
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 }, colors: ['#34B27B', '#4CC9C0', '#FFC857'] });
    }
  }, [step]);

  const handleSubmit = async () => {
    if (!wasteType || !severity || !photoUrl) return;
    setLoading(true);
    await reportService.createReport({ photoUrl, location, wasteType, severity, note, reporterId: 'u1' });
    setLoading(false);
    handleNext();
  };

  const steps = [
    { id: 1, label: 'Add Photo', icon: Camera },
    { id: 2, label: 'Confirm Location', icon: MapPin },
    { id: 3, label: 'Submit', icon: FileText }
  ];

  if (step === 4) {
    return (
      <div className="bg-background min-h-[calc(100vh-96px)] font-sans pb-24 flex items-center justify-center">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center">
          <div className="w-24 h-24 bg-brand-100 rounded-full flex items-center justify-center mx-auto mb-8 relative">
            <CheckCircle className="w-12 h-12 text-brand-500" />
            <div className="absolute -bottom-2 -right-2 bg-sun text-white text-xs font-bold px-2 py-1 rounded-full">+20 pts</div>
          </div>
          <h2 className="text-4xl font-display font-extrabold text-ink mb-4">Awesome!</h2>
          <p className="text-text-muted text-lg mb-12 max-w-sm mx-auto">Your report has been submitted successfully. We've notified nearby organizations.</p>
          <div className="flex space-x-4 justify-center">
            <Button size="lg" onClick={() => navigate('/feed')}>View in Feed</Button>
            <Button size="lg" variant="ghost" onClick={() => navigate('/my-reports')}>Track Status</Button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="bg-background h-screen font-sans relative overflow-hidden flex flex-col -mt-24 -mb-8 pt-24 pb-6">
      {/* Background Decor */}
      <div className="absolute top-[20%] left-[-10%] w-[40%] h-[60%] rounded-full bg-brand-500/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-5%] w-[30%] h-[50%] rounded-full bg-aqua/5 blur-[100px] pointer-events-none" />

      <div className="max-w-[1200px] mx-auto w-full px-6 flex flex-col flex-1 min-h-0 pt-4">
        
        {/* Header Area */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6 relative z-10 shrink-0">
          <div>
            <button onClick={handlePrev} className="text-brand-600 font-bold text-sm mb-2 flex items-center hover:underline">
              <ChevronLeft className="w-4 h-4 mr-1" /> Back
            </button>
            <h1 className="text-3xl md:text-4xl font-display font-extrabold text-ink tracking-tight mb-1">
              {step === 1 && <>Snap a <span className="text-brand-600">photo</span></>}
              {step === 2 && <>Confirm your <span className="text-brand-600">location</span></>}
              {step === 3 && <>Add <span className="text-brand-600">details</span></>}
            </h1>
            <p className="text-text-muted text-sm max-w-md">
              {step === 1 && "Take a clear picture of the garbage."}
              {step === 2 && "We've pinned the location for your report. Make sure it's correct before continuing."}
              {step === 3 && "Help the cleanup crew prepare by classifying the waste."}
            </p>
          </div>

          {/* Stepper */}
          <div className="flex items-center space-x-4">
            {steps.map((s, idx) => {
              const isActive = s.id === step;
              const isPast = s.id < step;
              return (
                <div key={s.id} className="flex items-center">
                  <div className="flex flex-col items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors shadow-sm mb-1 ${isActive ? 'bg-brand-500 text-white' : isPast ? 'bg-brand-100 text-brand-500' : 'bg-surface border border-border text-text-muted'}`}>
                      {isPast ? <CheckCircle className="w-4 h-4" /> : <s.icon className="w-4 h-4" />}
                    </div>
                    <span className={`text-[10px] font-bold ${isActive ? 'text-brand-600' : 'text-text-muted'}`}>{s.label}</span>
                  </div>
                  {idx < steps.length - 1 && (
                    <div className={`w-10 h-0.5 mx-3 -mt-4 ${isPast ? 'bg-brand-500' : 'bg-border'}`} />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* 2-Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 relative z-10 flex-1 min-h-0">
          
          {/* Left: Info Card */}
          <div className="lg:col-span-4 h-full min-h-0">
            <div className="bg-brand-50 rounded-[32px] p-6 h-full flex flex-col border border-brand-500/10 overflow-y-auto">
              <div className="w-24 h-24 mx-auto bg-surface rounded-2xl shadow-sm mb-6 flex items-center justify-center relative transform rotate-[-5deg] shrink-0">
                {step === 1 && <Camera className="w-10 h-10 text-brand-500" />}
                {step === 2 && <MapPin className="w-10 h-10 text-brand-500" />}
                {step === 3 && <FileText className="w-10 h-10 text-brand-500" />}
                <div className="absolute -top-3 -right-3 w-8 h-8 bg-sun rounded-full flex items-center justify-center text-white"><Zap className="w-4 h-4"/></div>
              </div>
              
              <h2 className="text-xl font-bold text-ink mb-2 leading-tight">
                {step === 1 && "A picture is worth a thousand words"}
                {step === 2 && "Accurate location helps faster cleanup"}
                {step === 3 && "Details speed up resolution"}
              </h2>
              <p className="text-text-muted text-xs mb-6">
                {step === 1 && "Clear photos help nearby authorities understand the scale of the issue quickly."}
                {step === 2 && "Your location helps nearby authorities and organizations find and resolve the issue quickly."}
                {step === 3 && "By accurately describing the waste, teams can bring the right equipment."}
              </p>

              <div className="space-y-4 mt-auto">
                <div className="flex items-start">
                  <div className="w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center shrink-0 mr-3 text-brand-600"><Target className="w-4 h-4"/></div>
                  <div>
                    <h4 className="font-bold text-ink text-xs">Precise reporting</h4>
                    <p className="text-[10px] text-text-muted">Helps the right team reach the spot</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center shrink-0 mr-3 text-brand-600"><Zap className="w-4 h-4"/></div>
                  <div>
                    <h4 className="font-bold text-ink text-xs">Faster response</h4>
                    <p className="text-[10px] text-text-muted">Notifies nearby authorities and NGOs</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center shrink-0 mr-3 text-brand-600"><Leaf className="w-4 h-4"/></div>
                  <div>
                    <h4 className="font-bold text-ink text-xs">Cleaner communities</h4>
                    <p className="text-[10px] text-text-muted">Small reports create big impact</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Main Action Area */}
          <div className="lg:col-span-8 h-full min-h-0">
            <AnimatePresence mode="wait">
              {step === 1 && (
                <motion.div key="s1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="bg-surface rounded-[32px] p-6 shadow-sm border border-border h-full flex flex-col min-h-0">
                  <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleImageUpload} />
                  
                  {!photoUrl ? (
                    <div onClick={() => fileInputRef.current?.click()} className="flex-1 min-h-[200px] border-2 border-dashed border-brand-500/30 rounded-3xl bg-brand-100/30 hover:bg-brand-100/50 transition-colors cursor-pointer flex flex-col items-center justify-center group relative overflow-hidden">
                      <div className="w-20 h-20 bg-surface rounded-full shadow-sm flex items-center justify-center mb-4 group-hover:scale-110 transition-transform"><Camera className="w-8 h-8 text-brand-500" /></div>
                      <span className="text-ink font-bold text-lg">Tap to open camera or upload</span>
                      <p className="text-text-muted text-sm mt-2 flex items-center"><Info className="w-4 h-4 mr-1"/> Include landmarks for better accuracy</p>
                    </div>
                  ) : (
                    <div className="flex-1 min-h-[400px] relative rounded-3xl overflow-hidden mb-6 border border-border bg-surface-2 shadow-sm">
                      <img src={photoUrl} alt="Preview" className="w-full h-full object-cover" />
                      {analyzing && (
                        <div className="absolute inset-0 bg-ink/60 backdrop-blur-sm flex flex-col items-center justify-center text-white">
                          <Loader2 className="w-10 h-10 animate-spin text-brand-500 mb-4" />
                          <p className="font-bold">AI Analyzing Image...</p>
                        </div>
                      )}
                      {!analyzing && (
                        <button onClick={() => setPhotoUrl(null)} className="absolute top-4 right-4 bg-background/80 backdrop-blur text-ink px-4 py-2 rounded-full text-sm font-bold hover:bg-surface transition-colors shadow-sm">Retake</button>
                      )}
                    </div>
                  )}
                  <div className="flex justify-end mt-4 shrink-0">
                    <Button size="lg" onClick={handleNext} disabled={!photoUrl || analyzing} rightIcon={<ArrowRight className="w-5 h-5"/>}>Continue to Location</Button>
                  </div>
                </motion.div>
              )}

              {step === 2 && (
                <motion.div key="s2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="bg-surface rounded-[32px] p-2 shadow-sm border border-border flex flex-col h-full min-h-0">
                  
                  {/* Big Map Header */}
                  <div className="flex-1 rounded-[24px] relative overflow-hidden bg-brand-50 min-h-[150px]">
                    {/* Simulated Leaflet map background */}
                    <div className="absolute inset-0 opacity-40 bg-[url('https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png')] bg-repeat bg-center" />
                    
                    {/* Pulsing Dot */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="absolute w-40 h-40 bg-brand-500/20 rounded-full animate-ping" />
                      <div className="absolute w-40 h-40 border border-brand-500/30 rounded-full" />
                      <div className="absolute w-12 h-12 bg-brand-500/30 rounded-full" />
                      <MapPin className="w-10 h-10 text-brand-500 relative z-10 drop-shadow-md" />
                    </div>

                    <div className="absolute top-4 right-4 bg-surface rounded-lg shadow-sm border border-border flex overflow-hidden">
                      <button className="px-3 py-1.5 bg-brand-500 text-white text-xs font-bold">Map</button>
                      <button className="px-3 py-1.5 bg-surface text-text-muted hover:text-ink text-xs font-bold">Satellite</button>
                    </div>
                  </div>

                  {/* Location Form Area */}
                  <div className="p-4 flex flex-col xl:flex-row gap-4 xl:gap-6 items-start mt-1 shrink-0">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-1">
                        <div className="w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center text-brand-600"><MapPin className="w-4 h-4"/></div>
                        <h3 className="font-bold text-ink">Detected location</h3>
                      </div>
                      <p className="text-text-muted text-sm pl-11">Near your current location</p>
                      <p className="text-text-muted text-xs pl-11 mt-0.5">GPS accuracy: ±{location.accuracyM}m</p>
                      <button onClick={requestLocation} className="text-brand-600 text-sm font-bold pl-11 mt-2 flex items-center hover:underline">
                        <svg className="w-3.5 h-3.5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
                        Refresh location
                      </button>
                    </div>

                    <div className="flex-1 w-full xl:w-auto border-t xl:border-t-0 xl:border-l border-border pt-6 xl:pt-0 xl:pl-6 space-y-4">
                      <div className="bg-warn-soft border border-warn/20 rounded-xl p-3 flex items-start text-warn">
                        <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 mr-2" />
                        <p className="text-xs font-medium">Location access is off. Enable location permission or adjust the pin manually.</p>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-ink mb-1.5">Address</label>
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-text-muted" />
                          <input 
                            type="text" 
                            value={location.address}
                            onChange={(e) => setLocation({...location, address: e.target.value})}
                            className="w-full bg-surface border border-border rounded-xl pl-9 pr-9 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 shadow-sm"
                          />
                          <button className="absolute right-3 top-1/2 transform -translate-y-1/2 text-text-muted hover:text-ink"><X className="w-4 h-4"/></button>
                        </div>
                        <p className="text-[11px] text-text-muted mt-1.5">You can drag the pin on the map or search for a more accurate location.</p>
                      </div>

                      <div className="flex flex-col sm:flex-row gap-3 pt-2">
                        <Button variant="ghost" className="flex-1 bg-surface py-2.5 border border-border" leftIcon={<MapPin className="w-4 h-4"/>}>Adjust on map</Button>
                        <Button className="flex-1 py-2.5 shadow-md" leftIcon={<CheckCircle className="w-4 h-4"/>} onClick={handleNext}>Confirm location</Button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {step === 3 && (
                <motion.div key="s3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="bg-surface rounded-[32px] p-6 shadow-sm border border-border h-full flex flex-col min-h-0">
                  
                  <div className="space-y-6 flex-1 overflow-y-auto pr-2">
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
                        className="w-full bg-surface border border-border rounded-2xl p-4 text-ink focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent resize-none h-32 shadow-sm transition-shadow"
                        placeholder="E.g. Broken glass, needs heavy machinery..."
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                      />
                    </div>
                  </div>
                  
                  <div className="flex justify-end mt-4 border-t border-border pt-4 shrink-0">
                    <Button size="lg" className="shadow-md px-12" onClick={handleSubmit} isLoading={loading} disabled={!wasteType || !severity} rightIcon={<CheckCircle className="w-5 h-5"/>}>
                      Submit Report
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
