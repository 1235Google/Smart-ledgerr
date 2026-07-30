import React, { useState, useEffect, useRef } from 'react';
import { NavLink, Outlet, Link } from 'react-router-dom';
import { LayoutDashboard, Wallet, Download, Clock, BarChart3, Settings, Search, Menu, X, Bell, User, Target, PiggyBank, Calculator as CalculatorIcon, Crown, Users, FileText } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import Chatbot from './Chatbot';
import { useStore } from '../context/StoreContext';

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
  { icon: Wallet, label: 'Current Balance', path: '/balance' },
  { icon: Download, label: 'Money Received', path: '/received' },
  { icon: Clock, label: 'Pending Payments', path: '/pending' },
  { icon: BarChart3, label: 'Analytics', path: '/analytics' },
  { icon: Search, label: 'Search', path: '/search' },
  { icon: PiggyBank, label: 'Gullak Savings', path: '/gullak' },
  { icon: CalculatorIcon, label: 'Calculator', path: '/calculator' },
  { icon: User, label: 'Profile', path: '/profile' },
  { icon: Settings, label: 'Settings', path: '/settings' },
];

export default function Layout() {
  const { userProfile, currentUser, logout } = useStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMobileMenuOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setProfileDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [mobileMenuOpen]);

  const getInitials = (name: string) => {
    return name?.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || 'U';
  };

  const ProfileMenu = () => (
    <div className="absolute right-0 top-full mt-2 w-72 bg-neutral-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-50">
      <div className="p-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full overflow-hidden bg-indigo-500/20 flex items-center justify-center border border-indigo-500/30">
            {userProfile?.profilePhoto ? (
              <img src={userProfile.profilePhoto} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <span className="text-lg font-bold text-indigo-400">{getInitials(userProfile?.fullName || '')}</span>
            )}
          </div>
          <div>
            <p className="font-semibold text-white truncate max-w-[180px]">{userProfile?.fullName || 'User'}</p>
            <p className="text-xs text-slate-400 truncate max-w-[180px]">{userProfile?.email || 'email@example.com'}</p>
            <div className="flex items-center gap-1 mt-1">
              {currentUser?.providerData.some(p => p.providerId === 'google.com') && (
                <span className="text-[10px] bg-white/10 text-slate-300 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <svg className="w-3 h-3" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                  </svg>
                  Google
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
      <div className="p-2">
        <Link to="/profile" onClick={() => setProfileDropdownOpen(false)} className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/5 text-slate-300 hover:text-white transition-colors">
          <User size={18} />
          <span className="text-sm font-medium">Profile</span>
        </Link>
        <Link to="/settings" onClick={() => setProfileDropdownOpen(false)} className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/5 text-slate-300 hover:text-white transition-colors">
          <Settings size={18} />
          <span className="text-sm font-medium">Settings</span>
        </Link>
        <button onClick={() => { setProfileDropdownOpen(false); logout(); }} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-red-500/10 text-red-400 hover:text-red-300 transition-colors mt-1 border-t border-white/5">
          <X size={18} />
          <span className="text-sm font-medium">Sign Out</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#05060a] text-slate-200 font-sans flex overflow-hidden relative">
      {/* Premium Animated Background */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/20 rounded-full blur-[120px] animate-pulse" style={{ animationDuration: '8s' }} />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-600/20 rounded-full blur-[120px] animate-pulse" style={{ animationDuration: '10s', animationDelay: '1s' }} />
      </div>

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 h-full bg-black/40 backdrop-blur-3xl border-r border-white/10 flex-shrink-0 z-20 relative">
        <div className="p-8">
          <div className="flex items-center gap-3 mb-10">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
              <Wallet className="text-white" size={24} />
            </div>
            <span className="text-xl font-bold tracking-tight text-white">SmartLedger</span>
          </div>
        </div>

        <nav className="flex-1 px-4 space-y-2 overflow-y-auto pb-8">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl transition-colors relative group",
                  isActive 
                    ? "text-white bg-white/10 border border-white/10" 
                    : "text-slate-400 hover:text-white"
                )
              }
            >
              {({ isActive }) => (
                <>
                  <item.icon size={20} className={cn("transition-colors")} />
                  <span className="font-medium text-sm">{item.label}</span>
                </>
              )}
            </NavLink>
          ))}
        </nav>
      </aside>

      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 bg-[#05060a]/80 backdrop-blur-xl border-b border-white/10 z-30 pt-[env(safe-area-inset-top)]">
        <div className="h-16 flex items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <button onClick={() => setMobileMenuOpen(true)} className="min-w-[48px] min-h-[48px] flex items-center justify-center -ml-3 text-slate-300 hover:text-white rounded-lg">
              <Menu size={24} />
            </button>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-500/20">
                <Wallet className="text-white" size={16} />
              </div>
              <span className="font-bold tracking-tight text-white">SmartLedger</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button className="min-w-[48px] min-h-[48px] flex items-center justify-center text-slate-300 hover:text-white relative rounded-lg">
              <Bell size={22} />
              <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-[#05060a]"></span>
            </button>
            <Link to="/profile" className="w-8 h-8 rounded-full overflow-hidden bg-indigo-500/20 flex items-center justify-center border border-indigo-500/30 ml-1">
              {userProfile?.profilePhoto ? (
                <img src={userProfile.profilePhoto} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <span className="text-xs font-bold text-indigo-400">{getInitials(userProfile?.fullName || '')}</span>
              )}
            </Link>
          </div>
        </div>
      </div>

      {/* Mobile Slide-out Drawer */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="md:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
              onClick={() => setMobileMenuOpen(false)}
            />
            <motion.div
              ref={menuRef}
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="md:hidden fixed inset-y-0 left-0 w-[80%] max-w-sm bg-[#0a0b10] border-r border-white/10 z-50 flex flex-col shadow-2xl pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]"
            >
              <div className="p-6 flex items-center justify-between border-b border-white/5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
                    <Wallet className="text-white" size={24} />
                  </div>
                  <span className="text-xl font-bold tracking-tight text-white">SmartLedger</span>
                </div>
                <button onClick={() => setMobileMenuOpen(false)} className="min-w-[48px] min-h-[48px] flex items-center justify-center -mr-3 text-slate-400 hover:text-white rounded-lg">
                  <X size={24} />
                </button>
              </div>
              <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
                {navItems.map((item) => (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className={({ isActive }) =>
                      cn(
                        "flex items-center gap-4 px-4 py-4 rounded-2xl transition-all",
                        isActive ? "bg-white/10 text-white border border-white/10" : "text-neutral-400 hover:text-white hover:bg-white/5"
                      )
                    }
                  >
                    <item.icon size={22} className={cn("transition-colors")} />
                    <span className="font-semibold">{item.label}</span>
                  </NavLink>
                ))}
              </nav>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen z-10 relative scroll-smooth w-full overflow-hidden">
        {/* Desktop Header */}
        <header className="hidden md:flex h-20 items-center justify-end px-8 border-b border-white/5 bg-[#05060a]/80 backdrop-blur-md flex-shrink-0">
          <div className="flex items-center gap-4">
            <button className="min-w-[48px] min-h-[48px] flex items-center justify-center text-slate-300 hover:text-white relative rounded-lg transition-colors">
              <Bell size={20} />
              <span className="absolute top-3 right-3 w-2 h-2 bg-red-500 rounded-full border-2 border-[#05060a]"></span>
            </button>
            <div className="relative" ref={profileRef}>
              <button 
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                className="flex items-center gap-3 pl-2 pr-4 py-1.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 transition-colors"
              >
                <div className="w-8 h-8 rounded-full overflow-hidden bg-indigo-500/20 flex items-center justify-center">
                  {userProfile?.profilePhoto ? (
                    <img src={userProfile.profilePhoto} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-xs font-bold text-indigo-400">{getInitials(userProfile?.fullName || '')}</span>
                  )}
                </div>
                <div className="flex flex-col items-start max-w-[120px]">
                  <span className="text-sm font-medium text-white truncate w-full">{userProfile?.fullName || 'User'}</span>
                </div>
              </button>
              
              <AnimatePresence>
                {profileDropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                  >
                    {ProfileMenu()}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto w-full pt-[calc(4rem+env(safe-area-inset-top))] md:pt-0">
          <div className="w-full max-w-7xl mx-auto p-4 sm:p-6 md:p-8 min-h-full pb-[calc(6rem+env(safe-area-inset-bottom))] md:pb-8">
            <Outlet />
          </div>
        </div>
      </main>

      <Chatbot />
    </div>
  );
}

