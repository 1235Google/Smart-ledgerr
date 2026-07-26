import React, { useState, useEffect, useRef } from 'react';
import { NavLink, Outlet, Link } from 'react-router-dom';
import { LayoutDashboard, Wallet, Download, Clock, BarChart3, Settings, Search, Menu, X, Bell, User, Target, PiggyBank, Calculator as CalculatorIcon, Crown, Users, FileText } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import Chatbot from './Chatbot';

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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMobileMenuOpen(false);
      }
    };

    if (mobileMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.body.style.overflow = 'unset';
    };
  }, [mobileMenuOpen]);

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
            <Link to="/profile" className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center border border-white/20 ml-1 hover:bg-white/20 transition-colors">
              <User size={16} className="text-slate-300" />
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
      <main className="flex-1 overflow-y-auto h-screen z-10 relative pt-[calc(4rem+env(safe-area-inset-top))] md:pt-0 scroll-smooth w-full">
        <div className="w-full max-w-7xl mx-auto p-4 sm:p-6 md:p-8 min-h-full pb-[calc(6rem+env(safe-area-inset-bottom))] md:pb-8">
          <Outlet />
        </div>
      </main>

      <Chatbot />
    </div>
  );
}

