import React, { useState } from 'react';
import { Button } from '../components/ui/Button';
import { Leaf, Mail, Lock, User, Building, Users, MapPin, CheckCircle, AlertCircle, Loader2, ShieldCheck, Phone, Compass, Navigation } from 'lucide-react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { motion } from 'framer-motion';
import { getCurrentDeviceLocation, reverseGeocodeCoords } from '../services/googleMapsService';

export function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [role, setRoleState] = useState<'citizen' | 'org' | 'admin'>('citizen');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Specific NGO registration fields
  const [orgServiceArea, setOrgServiceArea] = useState('Kothrud & Karve Nagar, Pune');
  const [orgCoords, setOrgCoords] = useState<{ lat: number; lng: number }>({ lat: 18.5074, lng: 73.8077 });
  const [orgType, setOrgType] = useState<'ngo' | 'municipal'>('ngo');
  const [crewSize, setCrewSize] = useState('10-30 active members');
  const [phone, setPhone] = useState('');
  const [isDetectingLoc, setIsDetectingLoc] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();
  const { signIn, signUp } = useAuth();

  const from = location.state?.from?.pathname || (role === 'admin' ? '/admin' : role === 'org' ? '/org' : '/feed');

  const handleDetectLocation = async () => {
    setIsDetectingLoc(true);
    try {
      const coords = await getCurrentDeviceLocation();
      const addr = await reverseGeocodeCoords(coords.lat, coords.lng);
      setOrgCoords(coords);
      setOrgServiceArea(addr.split(',').slice(0, 3).join(', '));
    } catch (e) {
      console.warn('Location detection notice:', e);
    } finally {
      setIsDetectingLoc(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setIsSubmitting(true);

    try {
      if (isLogin) {
        const res = await signIn(email, password);
        if (res.error) {
          setErrorMsg(res.error);
          setIsSubmitting(false);
          return;
        }
      } else {
        const res = await signUp(
          email, 
          password, 
          name || email.split('@')[0], 
          role,
          role === 'org' ? {
            orgServiceArea,
            orgCoords,
            orgType,
            crewSize,
            phone
          } : undefined
        );
        if (res.error) {
          setErrorMsg(res.error);
          setIsSubmitting(false);
          return;
        }
      }

      navigate(from, { replace: true });
    } catch (err: any) {
      setErrorMsg(err.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-background font-sans relative overflow-hidden -mt-24 -mb-8">
      {/* LEFT SIDE (Marketing/Visual) */}
      <div className="hidden lg:flex flex-1 relative bg-brand-50 flex-col justify-center px-12 xl:px-20 pt-24">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[70%] h-[70%] rounded-full bg-brand-500/20 blur-[100px]" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] rounded-full bg-sun/10 blur-[100px]" />
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMSIgY3k9IjEiIHI9IjEiIGZpbGw9InJnYmEoNDcsIDc0LCA2NCwgMC4wNSkiLz48L3N2Zz4=')] opacity-50" />
        </div>

        <div className="relative z-10 max-w-xl">
          <div className="inline-flex items-center space-x-2 bg-brand-100 text-brand-600 px-3 py-1 rounded-full text-xs font-bold mb-6 tracking-wide">
            <Leaf className="w-4 h-4" />
            <span>CLEANER SPACES. STRONGER COMMUNITIES.</span>
          </div>
          
          <h1 className="text-5xl font-display font-extrabold text-ink leading-tight mb-6">
            Welcome to<br/>
            a <span className="text-brand-600">cleaner community.</span>
          </h1>
          
          <p className="text-lg text-text-muted mb-12">
            Sign in to track reports, support local cleanups, and make an impact with live Open Vision AI and Google Maps verification.
          </p>

          <div className="flex space-x-4">
            <div className="bg-surface/80 backdrop-blur-md rounded-2xl p-4 shadow-sm border border-border flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full bg-brand-100 text-brand-600 flex items-center justify-center"><Users className="w-5 h-5"/></div>
              <span className="text-sm font-bold text-ink leading-tight">Community<br/>powered</span>
            </div>
            <div className="bg-surface/80 backdrop-blur-md rounded-2xl p-4 shadow-sm border border-border flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full bg-brand-100 text-brand-600 flex items-center justify-center"><MapPin className="w-5 h-5"/></div>
              <span className="text-sm font-bold text-ink leading-tight">Google Maps<br/>tracking</span>
            </div>
            <div className="bg-surface/80 backdrop-blur-md rounded-2xl p-4 shadow-sm border border-border flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full bg-brand-100 text-brand-600 flex items-center justify-center"><CheckCircle className="w-5 h-5"/></div>
              <span className="text-sm font-bold text-ink leading-tight">Open Vision<br/>verified</span>
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT SIDE (Form) */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 sm:px-12 bg-background relative z-10 shadow-[-20px_0_40px_rgba(0,0,0,0.02)] pt-16">
        
        {/* Minimal Nav / Logo */}
        <Link to="/" className="absolute top-6 left-6 sm:left-12 flex items-center space-x-2 lg:hidden">
          <div className="w-8 h-8 rounded-full bg-surface flex items-center justify-center overflow-hidden border border-border">
            <img src="/logo.png" alt="Logo" className="w-6 h-6 object-contain" />
          </div>
          <span className="font-display font-bold text-ink">Eco-Track</span>
        </Link>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`w-full ${!isLogin && role === 'org' ? 'max-w-[480px]' : 'max-w-[420px]'} bg-surface rounded-[24px] shadow-soft border border-border p-6 sm:p-8 max-h-[92vh] overflow-y-auto transition-all duration-300`}
        >
          <div className="text-center mb-5">
            <div className="mx-auto w-12 h-12 bg-brand-100 rounded-xl flex items-center justify-center mb-3 overflow-hidden">
              <img src="/logo.png" alt="Logo" className="w-8 h-8 object-contain" />
            </div>
            <h2 className="text-2xl font-display font-extrabold text-ink mb-1">
              {isLogin ? 'Welcome back' : role === 'org' ? 'Register Organisation / NGO' : 'Create an Account'}
            </h2>
            <p className="text-text-muted text-xs">
              {isLogin 
                ? 'Sign in to access your Eco-Track dashboard and real-time operations.' 
                : role === 'org' 
                ? 'Register your NGO or municipal sanitation team with operating area.' 
                : 'Join the community to report and resolve urban waste.'}
            </p>
          </div>

          {errorMsg && (
            <div className="mb-4 p-3 bg-danger-soft border border-danger/30 rounded-xl text-danger text-xs flex items-start">
              <AlertCircle className="w-4 h-4 mr-2 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {!isLogin && (
            <div className="flex bg-surface-2 p-1 rounded-xl mb-4 relative">
              <button 
                className={`flex-1 flex items-center justify-center py-2 text-xs font-bold rounded-lg transition-colors ${role === 'citizen' ? 'bg-surface text-ink shadow-sm' : 'text-text-muted hover:text-ink'}`}
                onClick={() => setRoleState('citizen')}
                type="button"
              >
                <User className="w-3.5 h-3.5 mr-1" /> Citizen
              </button>
              <button 
                className={`flex-1 flex items-center justify-center py-2 text-xs font-bold rounded-lg transition-colors ${role === 'org' ? 'bg-surface text-ink shadow-sm' : 'text-text-muted hover:text-ink'}`}
                onClick={() => setRoleState('org')}
                type="button"
              >
                <Building className="w-3.5 h-3.5 mr-1" /> NGO / Org
              </button>
              <button 
                className={`flex-1 flex items-center justify-center py-2 text-xs font-bold rounded-lg transition-colors ${role === 'admin' ? 'bg-surface text-ink shadow-sm' : 'text-text-muted hover:text-ink'}`}
                onClick={() => setRoleState('admin')}
                type="button"
              >
                <ShieldCheck className="w-3.5 h-3.5 mr-1" /> City Admin
              </button>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3.5">
            {!isLogin && (
              <div>
                <label className="block text-xs font-bold text-ink mb-1">
                  {role === 'citizen' ? 'Full Name' : role === 'org' ? 'Organisation / NGO Official Name' : 'Authority / Admin Name'}
                </label>
                <input 
                  type="text" 
                  required 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-surface border border-border rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500 shadow-sm" 
                  placeholder={role === 'citizen' ? 'e.g. Jane Doe' : role === 'org' ? 'e.g. Clean Pune Youth Brigade' : 'e.g. Ward Sanitation Commissioner'}
                />
              </div>
            )}

            {!isLogin && role === 'org' && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="space-y-3 pt-2 pb-2 border-t border-b border-border/70 my-2"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-aqua-700 uppercase tracking-wider flex items-center">
                    <Building className="w-3.5 h-3.5 mr-1" /> NGO & Sanitation Profile
                  </span>
                  <span className="text-[10px] text-text-muted bg-surface-2 px-2 py-0.5 rounded-full font-medium">
                    Required for task dispatch
                  </span>
                </div>

                {/* Org Type */}
                <div>
                  <label className="block text-[11px] font-bold text-ink mb-1">Organization Category</label>
                  <select
                    value={orgType}
                    onChange={(e) => setOrgType(e.target.value as 'ngo' | 'municipal')}
                    className="w-full bg-surface border border-border rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500 shadow-sm text-ink font-medium"
                  >
                    <option value="ngo">Registered NGO / Environmental Non-Profit</option>
                    <option value="municipal">Municipal Sanitation Department / Ward Office</option>
                  </select>
                </div>

                {/* Operating Service Area */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] font-bold text-ink flex items-center">
                      <MapPin className="w-3 h-3 mr-1 text-brand-500" /> Operating Base Area / Sector
                    </label>
                    <button
                      type="button"
                      onClick={handleDetectLocation}
                      disabled={isDetectingLoc}
                      className="text-[10px] font-bold text-brand-600 hover:text-brand-700 flex items-center hover:underline"
                    >
                      {isDetectingLoc ? (
                        <Loader2 className="w-3 h-3 animate-spin mr-1" />
                      ) : (
                        <Navigation className="w-3 h-3 mr-1" />
                      )}
                      Detect GPS Base
                    </button>
                  </div>
                  <input
                    type="text"
                    required
                    value={orgServiceArea}
                    onChange={(e) => setOrgServiceArea(e.target.value)}
                    className="w-full bg-surface border border-border rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500 shadow-sm"
                    placeholder="e.g. Kothrud & Karve Nagar, Pune"
                  />
                  <div className="flex items-center justify-between mt-1 text-[10px] text-text-muted">
                    <span>GPS locked: {orgCoords.lat.toFixed(4)}, {orgCoords.lng.toFixed(4)}</span>
                    <span className="text-brand-600 font-medium">Auto-suggests closest cleanups</span>
                  </div>
                </div>

                {/* Crew Size & Phone */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-bold text-ink mb-1 flex items-center">
                      <Users className="w-3 h-3 mr-1 text-brand-500" /> Crew Size
                    </label>
                    <select
                      value={crewSize}
                      onChange={(e) => setCrewSize(e.target.value)}
                      className="w-full bg-surface border border-border rounded-xl px-2.5 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500 shadow-sm text-ink font-medium"
                    >
                      <option value="1-10 volunteers">1 - 10 volunteers</option>
                      <option value="10-30 active members">10 - 30 field crew</option>
                      <option value="30-100 personnel">30 - 100 personnel</option>
                      <option value="100+ municipal force">100+ field force</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-ink mb-1 flex items-center">
                      <Phone className="w-3 h-3 mr-1 text-brand-500" /> Dispatch Phone
                    </label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full bg-surface border border-border rounded-xl px-2.5 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500 shadow-sm"
                      placeholder="+91 98220 12345"
                    />
                  </div>
                </div>
              </motion.div>
            )}
            
            <div>
              <label className="block text-xs font-bold text-ink mb-1">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-3.5 h-3.5 text-text-muted" />
                <input 
                  type="email" 
                  required 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-surface border border-border rounded-xl pl-8 pr-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500 shadow-sm" 
                  placeholder="you@domain.com"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-xs font-bold text-ink mb-1">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-3.5 h-3.5 text-text-muted" />
                <input 
                  type="password" 
                  required 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-surface border border-border rounded-xl pl-8 pr-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500 shadow-sm" 
                  placeholder="••••••••"
                />
              </div>
            </div>

            <Button type="submit" disabled={isSubmitting} className="w-full mt-3 shadow-sm py-2 text-xs">
              {isSubmitting ? (
                <span className="flex items-center justify-center">
                  <Loader2 className="w-4 h-4 animate-spin mr-2" /> Please wait...
                </span>
              ) : isLogin ? (
                'Sign In →'
              ) : (
                'Create Account'
              )}
            </Button>
          </form>

          <div className="mt-6 pt-4 border-t border-border text-center text-xs text-text-muted">
            {isLogin ? "Don't have an account? " : "Already have an account? "}
            <button onClick={() => { setIsLogin(!isLogin); setErrorMsg(''); }} className="text-brand-600 font-bold hover:underline">
              {isLogin ? 'Sign up' : 'Log in'}
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
