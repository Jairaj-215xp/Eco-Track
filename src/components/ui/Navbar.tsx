import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Leaf, Menu, Bell, User, Camera, LogOut } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { motion } from 'framer-motion';

export function Navbar() {
  const location = useLocation();
  const { role, setRole } = useAuth();

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
        { name: 'Map', path: '/map' },
        { name: 'My Reports', path: '/my-reports' },
        { name: 'Leaderboard', path: '/leaderboard' }
      ];
      case 'org': return [
        { name: 'Dashboard', path: '/org' },
        { name: 'Nearby', path: '/org/nearby' },
        { name: 'Feed', path: '/feed' },
        { name: 'Analytics', path: '/org/analytics' }
      ];
      case 'admin': return [
        { name: 'Overview', path: '/admin' },
        { name: 'Approvals', path: '/admin/approvals' },
        { name: 'Reports', path: '/admin/reports' },
        { name: 'Users', path: '/admin/users' }
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
                className={`relative px-4 py-2 text-sm font-medium rounded-full transition-colors ${isActive ? 'text-ink' : 'text-text-muted hover:text-text'}`}
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
                <Link to="/report/new" className="hidden sm:flex items-center px-5 py-2 text-sm font-medium text-white bg-gradient-to-r from-brand-500 to-aqua rounded-full shadow-sm hover:shadow-md hover:scale-105 transition-all">
                  <Camera className="w-4 h-4 mr-2" /> Report
                </Link>
              )}
              
              <button className="relative p-2 text-text-muted hover:text-ink transition-colors rounded-full hover:bg-surface-2">
                <Bell className="w-5 h-5" />
                <span className="absolute top-2 right-2 w-2 h-2 bg-coral rounded-full border-2 border-surface"></span>
              </button>
              
              {/* Temp Role Switcher for Dev */}
              <select 
                value={role} 
                onChange={e => setRole(e.target.value as any)}
                className="text-xs bg-surface-2 border-none rounded p-1 max-w-[80px]"
              >
                <option value="guest">Guest</option>
                <option value="citizen">Citizen</option>
                <option value="org">Org</option>
                <option value="admin">Admin</option>
              </select>

              <button className="w-9 h-9 rounded-full bg-brand-100 flex items-center justify-center text-brand-600 hover:bg-brand-500 hover:text-white transition-colors cursor-pointer" onClick={() => setRole('guest')}>
                <User className="w-5 h-5" />
              </button>
            </>
          )}

          {/* Mobile Menu */}
          <button className="md:hidden p-2 text-text-muted">
            <Menu className="w-6 h-6" />
          </button>
        </div>

      </nav>
    </div>
  );
}
