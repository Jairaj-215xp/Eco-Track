import React, { useState } from 'react';
import { Button } from '../components/ui/Button';
import { Leaf, Mail, Lock, User, Building, Users, MapPin, CheckCircle } from 'lucide-react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { motion } from 'framer-motion';

export function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [role, setRoleState] = useState<'citizen' | 'org'>('citizen');
  const [email, setEmail] = useState('citizen@demo.com');
  const [password, setPassword] = useState('password123');
  
  const navigate = useNavigate();
  const location = useLocation();
  const { setRole } = useAuth();

  const from = location.state?.from?.pathname || (role === 'org' ? '/org' : '/feed');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.includes('org')) {
      setRole('org');
    } else if (email.includes('admin')) {
      setRole('admin');
    } else {
      setRole('citizen');
    }
    navigate(from, { replace: true });
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
            Welcome back to<br/>
            a <span className="text-brand-600">cleaner community.</span>
          </h1>
          
          <p className="text-lg text-text-muted mb-12">
            Sign in to track reports, support local cleanups, and make an impact.
          </p>

          <div className="flex space-x-4">
            <div className="bg-surface/80 backdrop-blur-md rounded-2xl p-4 shadow-sm border border-border flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full bg-brand-100 text-brand-600 flex items-center justify-center"><Users className="w-5 h-5"/></div>
              <span className="text-sm font-bold text-ink leading-tight">Community<br/>powered</span>
            </div>
            <div className="bg-surface/80 backdrop-blur-md rounded-2xl p-4 shadow-sm border border-border flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full bg-brand-100 text-brand-600 flex items-center justify-center"><MapPin className="w-5 h-5"/></div>
              <span className="text-sm font-bold text-ink leading-tight">Location-aware<br/>reports</span>
            </div>
            <div className="bg-surface/80 backdrop-blur-md rounded-2xl p-4 shadow-sm border border-border flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full bg-brand-100 text-brand-600 flex items-center justify-center"><CheckCircle className="w-5 h-5"/></div>
              <span className="text-sm font-bold text-ink leading-tight">Verified<br/>cleanups</span>
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
          className="w-full max-w-[400px] bg-surface rounded-[24px] shadow-soft border border-border p-6 sm:p-8"
        >
          <div className="text-center mb-6">
            <div className="mx-auto w-12 h-12 bg-brand-100 rounded-xl flex items-center justify-center mb-4 overflow-hidden">
              <img src="/logo.png" alt="Logo" className="w-8 h-8 object-contain" />
            </div>
            <h2 className="text-2xl font-display font-extrabold text-ink mb-1">
              {isLogin ? 'Welcome back' : 'Eco-Track'}
            </h2>
            <p className="text-text-muted text-xs">
              {isLogin ? 'Enter your details to access your account.' : 'Join the community to track and resolve waste.'}
            </p>
          </div>

          {!isLogin && (
            <div className="flex bg-surface-2 p-1 rounded-xl mb-6 relative">
              <motion.div 
                className="absolute inset-y-1 left-1 w-[calc(50%-4px)] bg-surface rounded-lg shadow-sm border border-border/50"
                animate={{ x: role === 'citizen' ? 0 : '100%' }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
              />
              <button 
                className={`flex-1 flex items-center justify-center py-2 text-xs font-bold rounded-lg transition-colors relative z-10 ${role === 'citizen' ? 'text-ink' : 'text-text-muted hover:text-ink'}`}
                onClick={() => setRoleState('citizen')}
                type="button"
              >
                <User className="w-3.5 h-3.5 mr-1.5" /> Citizen
              </button>
              <button 
                className={`flex-1 flex items-center justify-center py-2 text-xs font-bold rounded-lg transition-colors relative z-10 ${role === 'org' ? 'text-ink' : 'text-text-muted hover:text-ink'}`}
                onClick={() => setRoleState('org')}
                type="button"
              >
                <Building className="w-3.5 h-3.5 mr-1.5" /> Organisation
              </button>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div>
                <label className="block text-xs font-bold text-ink mb-1.5">
                  {role === 'citizen' ? 'Full Name' : 'Organisation Name'}
                </label>
                <input 
                  type="text" 
                  required 
                  className="w-full bg-surface border border-border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all shadow-sm" 
                  placeholder={role === 'citizen' ? 'Jane Doe' : 'Pune Cleanup Crew'}
                />
              </div>
            )}
            
            <div>
              <label className="block text-xs font-bold text-ink mb-1.5">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-text-muted" />
                <input 
                  type="email" 
                  required 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-surface border border-border rounded-xl pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all shadow-sm" 
                  placeholder="you@example.com"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-xs font-bold text-ink mb-1.5">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-text-muted" />
                <input 
                  type="password" 
                  required 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-surface border border-border rounded-xl pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all shadow-sm" 
                  placeholder="••••••••"
                />
              </div>
            </div>

            {isLogin && (
              <div className="flex justify-end">
                <a href="#" className="text-xs font-bold text-brand-600 hover:underline">Forgot password?</a>
              </div>
            )}

            <Button type="submit" className="w-full mt-4 shadow-md py-2.5">
              {isLogin ? 'Sign In →' : 'Create Account'}
            </Button>
            
            {isLogin && (
              <div className="relative flex justify-center mt-4">
                <span className="bg-surface px-3 text-[11px] text-text-muted relative z-10 uppercase font-semibold">or continue with</span>
                <div className="absolute top-1/2 w-full h-px bg-border"></div>
              </div>
            )}
            {isLogin && (
              <button type="button" className="w-full mt-4 bg-surface border border-border rounded-xl py-2.5 flex items-center justify-center text-sm font-bold text-ink hover:bg-surface-2 transition-colors shadow-sm">
                <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                Continue with Google
              </button>
            )}
          </form>

          <div className="mt-6 text-center text-xs text-text-muted">
            {isLogin ? "Don't have an account? " : "Already have an account? "}
            <button onClick={() => setIsLogin(!isLogin)} className="text-brand-600 font-bold hover:underline">
              {isLogin ? 'Sign up' : 'Log in'}
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
