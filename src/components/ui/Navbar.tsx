import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Leaf, Menu, Bell, User, Camera, LogOut } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { motion } from 'framer-motion';

export function Navbar() {
  const location = useLocation();
  const { user, role, setRole, signOut } = useAuth();

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
        { name: 'Tasks Dashboard', path: '/org' },
        { name: 'Community Feed', path: '/feed' },
        { name: 'Impact', path: '/impact' }
      ];
      case 'admin': return [
        { name: 'Dashboard', path: '/org' },
        { name: 'Feed', path: '/feed' },
        { name: 'Impact', path: '/impact' }
      ];
    }
  };

  const links = getLinks();

  return (
    <div className="fixed top-0 left-0 right-0 z-50 flex justify-center px-4 pt-3 pointer-events-none">
      <nav className="pointer-events-auto w-full max-w-[1200px] h-[68px] bg-surface-glass backdrop-blur-xl border border-border/50 rounded-full flex items-center justify-between px-6 shadow-soft transition-all duration-300 hover:shadow-hover">
        
        {/* Left: Logo */}
        <Link to="/" className="flex items-center space-x-2 group">
          <div className="w-9 h-9 rounded-full bg-surface flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform overflow-hidden border border-border">
            <img src="/logo.png" alt="Logo" className="w-6 h-6 object-contain" />
          </div>
          <span className="font-display font-bold text-xl text-ink tracking-tight hidden sm:block">Eco-Track</span>
        </Link>

        {/* Center: Links */}
        <div className="hidden md:flex items-center space-x-1">
          {links.map(link => {
            const isActive = location.pathname === link.path || (link.path !== '/' && location.pathname.startsWith(link.path));
            return (
              <Link
                key={link.name}
                to={link.path}
                className={`relative px-4 py-2 text-sm font-medium rounded-full transition-colors ${isActive ? 'text-ink font-bold' : 'text-text-muted hover:text-text'}`}
              >
                {isActive && (
                  <motion.div
                    layoutId="navbar-active"
                    className="absolute inset-0 bg-brand-100 rounded-full -z-10"
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}
                {link.name}
              </Link>
            );
          })}
        </div>

        {/* Right: Actions */}
        <div className="flex items-center space-x-3">
          {role === 'guest' ? (
            <>
              <Link to="/login" className="hidden sm:block text-sm font-medium text-text hover:text-brand-600 transition-colors px-4 py-2">
                Log in
              </Link>
              <Link to="/register" className="px-5 py-2 text-sm font-medium text-white bg-gradient-to-r from-brand-500 to-aqua rounded-full shadow-sm hover:shadow-md hover:scale-105 transition-all">
                Get started
              </Link>
            </>
          ) : (
            <>
              {role === 'citizen' && (
                <Link to="/report/new" className="hidden sm:flex items-center px-4 py-2 text-xs font-bold text-white bg-brand-500 hover:bg-brand-600 rounded-full shadow-sm hover:scale-105 transition-all">
                  <Camera className="w-3.5 h-3.5 mr-1.5" /> Report Waste
                </Link>
              )}

              {/* User Profile Badge */}
              <div className="flex items-center space-x-2 pl-2 border-l border-border">
                <div className="text-right hidden sm:block">
                  <p className="text-xs font-bold text-ink leading-tight truncate max-w-[110px]">
                    {user?.name || (role === 'org' ? 'NGO Crew' : 'Citizen')}
                  </p>
                  <span className="text-[10px] text-brand-600 font-semibold capitalize">
                    {role}
                  </span>
                </div>

                <button 
                  onClick={() => signOut()}
                  title="Sign Out"
                  className="w-8 h-8 rounded-full bg-surface-2 hover:bg-danger-soft text-text-muted hover:text-danger flex items-center justify-center transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </>
          )}

          {/* Quick Role Switcher for Testing */}
          <select 
            value={role} 
            onChange={e => setRole(e.target.value as any)}
            className="text-[10px] bg-surface-2 border border-border rounded-lg px-1.5 py-1 text-ink focus:outline-none"
            title="Switch User Role"
          >
            <option value="guest">Guest</option>
            <option value="citizen">Citizen</option>
            <option value="org">Org</option>
            <option value="admin">Admin</option>
          </select>
        </div>

      </nav>
    </div>
  );
}
