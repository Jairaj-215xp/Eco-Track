import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Leaf, Menu, X, Bell, User, Camera, LogOut, ShieldCheck, Building, Sparkles } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { ThemeToggle } from './ThemeToggle';

export function Navbar() {
  const location = useLocation();
  const { user, role, signOut } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const getLinks = () => {
    switch(role) {
      case 'guest': return [
        { name: 'Home', path: '/' },
        { name: 'Feed', path: '/feed' },
        { name: 'How it works', path: '/how-it-works' },
        { name: 'Impact', path: '/impact' }
      ];
      case 'citizen': return [
        { name: 'Feed', path: '/feed' },
        { name: 'My Reports', path: '/my-reports' },
        { name: 'Impact', path: '/impact' },
        { name: 'How it works', path: '/how-it-works' }
      ];
      case 'org': return [
        { name: 'NGO Workspace', path: '/org' },
        { name: 'Tasks Feed', path: '/feed' },
        { name: 'Impact', path: '/impact' }
      ];
      case 'admin': return [
        { name: 'Admin Hub', path: '/admin' },
        { name: 'NGO Workspace', path: '/org' },
        { name: 'City Feed', path: '/feed' },
        { name: 'Impact', path: '/impact' }
      ];
    }
  };

  const links = getLinks();

  const closeMobile = () => setMobileMenuOpen(false);

  return (
    <div className="fixed top-0 left-0 right-0 z-50 flex justify-center px-3 sm:px-4 pt-2.5 sm:pt-3 pointer-events-none">
      <nav className="pointer-events-auto w-full max-w-[1200px] h-[64px] sm:h-[68px] bg-surface/90 backdrop-blur-xl border border-border/80 rounded-full flex items-center justify-between px-3.5 sm:px-6 shadow-soft transition-all duration-300 hover:shadow-hover">
        
        {/* Left: Logo */}
        <Link to="/" onClick={closeMobile} className="flex items-center space-x-2 group shrink-0">
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-surface flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform overflow-hidden border border-border">
            <img src="/logo.png" alt="Logo" className="w-5 h-5 sm:w-6 sm:h-6 object-contain" />
          </div>
          <span className="font-display font-bold text-lg sm:text-xl text-ink tracking-tight">Eco-Track</span>
        </Link>

        {/* Center: Desktop Navigation Links */}
        <div className="hidden md:flex items-center space-x-1">
          {links.map(link => {
            const isActive = location.pathname === link.path || (link.path !== '/' && location.pathname.startsWith(link.path));
            return (
              <Link
                key={link.name}
                to={link.path}
                className={`relative px-3.5 py-1.5 text-xs sm:text-sm font-medium rounded-full transition-colors ${
                  isActive ? 'text-ink font-bold' : 'text-text-muted hover:text-text'
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="navbar-active"
                    className="absolute inset-0 bg-brand-100 dark:bg-brand-950 rounded-full -z-10"
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}
                {link.name}
              </Link>
            );
          })}
        </div>

        {/* Right: Actions */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          {!user ? (
            <>
              <Link to="/login" className="hidden sm:block text-xs sm:text-sm font-medium text-text hover:text-brand-600 transition-colors px-3 py-1.5">
                Log in
              </Link>
              <Link to="/register" className="px-3.5 sm:px-5 py-1.5 sm:py-2 text-xs sm:text-sm font-bold text-white bg-gradient-to-r from-brand-500 to-aqua rounded-full shadow-sm hover:shadow-md hover:scale-105 transition-all">
                Get started
              </Link>
            </>
          ) : (
            <>
              {user.role === 'citizen' && (
                <Link to="/report/new" className="flex items-center px-3 sm:px-4 py-1.5 text-xs font-bold text-white bg-brand-500 hover:bg-brand-600 rounded-full shadow-xs hover:scale-105 transition-all">
                  <Camera className="w-3.5 h-3.5 sm:mr-1.5" />
                  <span className="hidden sm:inline">Report Waste</span>
                </Link>
              )}
              {user.role === 'org' && (
                <Link to="/org" className="hidden sm:flex items-center px-3.5 py-1.5 text-xs font-bold text-white bg-brand-600 hover:bg-brand-700 rounded-full shadow-xs hover:scale-105 transition-all">
                  <Building className="w-3.5 h-3.5 mr-1" /> NGO Hub
                </Link>
              )}
              {user.role === 'admin' && (
                <Link to="/admin" className="hidden sm:flex items-center px-3.5 py-1.5 text-xs font-bold text-white bg-purple-700 hover:bg-purple-800 rounded-full shadow-xs hover:scale-105 transition-all">
                  <ShieldCheck className="w-3.5 h-3.5 mr-1" /> Admin Hub
                </Link>
              )}

              {/* User Profile Badge (Desktop) */}
              <div className="hidden sm:flex items-center space-x-2 pl-2 border-l border-border">
                <div className="text-right">
                  <p className="text-xs font-bold text-ink leading-tight truncate max-w-[120px]">
                    {user.name}
                  </p>
                  <span className={`text-[10px] font-bold uppercase tracking-wider ${
                    user.role === 'admin' ? 'text-purple-600' : user.role === 'org' ? 'text-aqua-600' : 'text-brand-600'
                  }`}>
                    {user.role === 'org' ? 'NGO Crew' : user.role === 'admin' ? 'City Admin' : 'Citizen'}
                  </span>
                </div>

                <button 
                  onClick={() => signOut()}
                  title="Sign Out"
                  className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-surface-2 hover:bg-danger-soft text-text-muted hover:text-danger flex items-center justify-center transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </button>
              </div>
            </>
          )}

          {/* Theme Mode Switcher */}
          <ThemeToggle />

          {/* Mobile Hamburger Menu Toggle Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden w-8 h-8 rounded-full bg-surface-2 flex items-center justify-center text-text hover:text-brand-600 transition-colors"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>

      </nav>

      {/* Mobile Slide-down Navigation Drawer */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="pointer-events-auto absolute top-20 left-4 right-4 bg-surface/95 backdrop-blur-2xl border border-border/80 rounded-3xl p-5 shadow-2xl flex flex-col space-y-3 md:hidden z-50 max-h-[80vh] overflow-y-auto"
          >
            {user && (
              <div className="flex items-center justify-between pb-3 border-b border-border">
                <div>
                  <p className="text-sm font-bold text-ink">{user.name}</p>
                  <span className={`text-[10px] font-bold uppercase tracking-wider ${
                    user.role === 'admin' ? 'text-purple-600' : user.role === 'org' ? 'text-aqua-600' : 'text-brand-600'
                  }`}>
                    {user.role === 'org' ? '🏢 NGO / Municipal Organization' : user.role === 'admin' ? '🛡️ City Municipal Admin' : '👤 Citizen Explorer'}
                  </span>
                </div>
                <button
                  onClick={() => {
                    signOut();
                    closeMobile();
                  }}
                  className="px-2.5 py-1 rounded-xl bg-danger-soft text-danger text-xs font-bold flex items-center space-x-1"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Logout</span>
                </button>
              </div>
            )}

            <div className="flex flex-col space-y-1 pt-1">
              {links.map(link => {
                const isActive = location.pathname === link.path || (link.path !== '/' && location.pathname.startsWith(link.path));
                return (
                  <Link
                    key={link.name}
                    to={link.path}
                    onClick={closeMobile}
                    className={`px-4 py-2.5 rounded-2xl text-sm font-bold transition-colors flex items-center justify-between ${
                      isActive 
                        ? 'bg-brand-50 dark:bg-brand-950/50 text-brand-600 border border-brand-500/30' 
                        : 'text-text-muted hover:text-ink hover:bg-surface-2'
                    }`}
                  >
                    <span>{link.name}</span>
                    {isActive && <div className="w-1.5 h-1.5 rounded-full bg-brand-500" />}
                  </Link>
                );
              })}
            </div>

            {/* Role shortcuts on mobile */}
            {user?.role === 'citizen' && (
              <Link
                to="/report/new"
                onClick={closeMobile}
                className="mt-2 w-full py-3 bg-brand-500 hover:bg-brand-600 text-white rounded-2xl font-bold text-xs flex items-center justify-center space-x-2 shadow-sm"
              >
                <Camera className="w-4 h-4" />
                <span>Report New Waste Incident</span>
              </Link>
            )}

            {!user && (
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border">
                <Link
                  to="/login"
                  onClick={closeMobile}
                  className="w-full py-2.5 text-center text-xs font-bold text-ink bg-surface-2 rounded-2xl border border-border"
                >
                  Log In
                </Link>
                <Link
                  to="/register"
                  onClick={closeMobile}
                  className="w-full py-2.5 text-center text-xs font-bold text-white bg-brand-500 rounded-2xl shadow-sm"
                >
                  Get Started
                </Link>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
