import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { ShieldCheck, Mail, Lock, ArrowRight, AlertCircle, CheckCircle2, Eye, EyeOff } from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { cn } from '../../lib/utils';

export default function AdminLogin() {
  const { adminLogin, isAdminAuthenticated } = useStore();
  const navigate = useNavigate();

  const [email, setEmail] = useState('admin@smartledgerx.io');
  const [password, setPassword] = useState('admin123');
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [shakePassword, setShakePassword] = useState(false);
  const [passwordErrorBorder, setPasswordErrorBorder] = useState(false);

  // Brute force protection state
  const [failedAttempts, setFailedAttempts] = useState<number>(() => {
    return parseInt(localStorage.getItem('admin_failed_attempts') || '0', 10);
  });
  const [lockoutUntil, setLockoutUntil] = useState<number>(() => {
    return parseInt(localStorage.getItem('admin_lockout_until') || '0', 10);
  });
  const [countdown, setCountdown] = useState<number>(0);

  // Forgot password modal state
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSent, setForgotSent] = useState(false);
  const [forgotError, setForgotError] = useState('');

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  // If already authenticated, redirect to dashboard
  useEffect(() => {
    if (isAdminAuthenticated) {
      navigate('/admin/dashboard', { replace: true });
    }
  }, [isAdminAuthenticated, navigate]);

  // Handle lockout countdown timer
  useEffect(() => {
    const updateCountdown = () => {
      const now = Date.now();
      if (lockoutUntil > now) {
        const remaining = Math.ceil((lockoutUntil - now) / 1000);
        setCountdown(remaining);
      } else {
        setCountdown(0);
        if (lockoutUntil > 0) {
          localStorage.removeItem('admin_lockout_until');
          localStorage.removeItem('admin_failed_attempts');
          setFailedAttempts(0);
          setLockoutUntil(0);
        }
      }
    };

    updateCountdown();
    const timer = setInterval(updateCountdown, 1000);
    return () => clearInterval(timer);
  }, [lockoutUntil]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading || countdown > 0) return;

    setError('');
    setPasswordErrorBorder(false);

    // 1. Empty email check
    if (!email || !email.trim()) {
      setError('Please enter your admin email.');
      showToast('Please enter your admin email.', 'error');
      return;
    }

    // 2. Empty password check
    if (!password || !password.trim()) {
      setError('Please enter your password.');
      setPasswordErrorBorder(true);
      triggerShake();
      showToast('Please enter your password.', 'error');
      return;
    }

    // 3. Email format check
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setError('Please enter a valid admin email address.');
      showToast('Please enter a valid admin email address.', 'error');
      return;
    }

    // 4. SQL Injection / XSS detection
    const maliciousPattern = /['";]|--|<script>|javascript:/i;
    if (maliciousPattern.test(email) || maliciousPattern.test(password)) {
      setError('Invalid characters detected in input.');
      showToast('Invalid characters detected in input.', 'error');
      return;
    }

    // 5. Email existence check
    const validEmails = ['admin@smartledgerx.io', 'rahul.sharma@fintech.io', 'souvikdashbbsr@gmail.com'];
    if (!validEmails.includes(email.trim().toLowerCase())) {
      setError('Admin account not found.');
      showToast('Admin account not found.', 'error');
      return;
    }

    setIsLoading(true);

    setTimeout(() => {
      const validPassword = password === 'admin123' || password === 'SecureAdmin#2026';

      if (validPassword) {
        localStorage.removeItem('admin_failed_attempts');
        localStorage.removeItem('admin_lockout_until');
        setFailedAttempts(0);

        showToast('Authentication successful. Redirecting...', 'success');
        adminLogin(email, password, rememberMe);
        setTimeout(() => {
          navigate('/admin/dashboard', { replace: true });
        }, 500);
      } else {
        const newAttempts = failedAttempts + 1;
        setFailedAttempts(newAttempts);
        localStorage.setItem('admin_failed_attempts', newAttempts.toString());

        if (newAttempts >= 5) {
          const lockoutTime = Date.now() + 5 * 60 * 1000;
          setLockoutUntil(lockoutTime);
          localStorage.setItem('admin_lockout_until', lockoutTime.toString());
          setError('Too many failed attempts. Try again in 5 minutes.');
          showToast('Too many failed attempts. Try again in 5 minutes.', 'error');
        } else {
          setError('Incorrect email or password.');
          setPasswordErrorBorder(true);
          triggerShake();
          showToast('Incorrect email or password.', 'error');
        }
        setIsLoading(false);
      }
    }, 800);
  };

  const triggerShake = () => {
    setShakePassword(true);
    setTimeout(() => setShakePassword(false), 500);
  };

  const handleForgotSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError('');
    if (!forgotEmail || !forgotEmail.trim()) {
      setForgotError('Please enter your admin email.');
      return;
    }
    const validEmails = ['admin@smartledgerx.io', 'rahul.sharma@fintech.io', 'souvikdashbbsr@gmail.com'];
    if (!validEmails.includes(forgotEmail.trim().toLowerCase())) {
      setForgotError('Admin account not found.');
      return;
    }

    setForgotSent(true);
    setTimeout(() => {
      setShowForgotModal(false);
      setForgotSent(false);
      setForgotEmail('');
      showToast('Password reset instructions sent to your admin email.');
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white flex items-center justify-center p-4 relative overflow-hidden">
      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className={cn(
              "fixed top-6 right-6 z-50 px-6 py-3.5 rounded-2xl shadow-2xl flex items-center gap-3 border backdrop-blur-xl",
              toast.type === 'success' 
                ? "bg-emerald-600 text-white border-emerald-400/30" 
                : "bg-red-600 text-white border-red-400/30"
            )}
          >
            {toast.type === 'success' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
            <span className="font-semibold text-sm">{toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Dynamic Background Glows */}
      <div className="absolute top-[-20%] left-[-20%] w-[50%] h-[50%] bg-blue-600/15 rounded-full blur-[140px] pointer-events-none animate-pulse" style={{ animationDuration: '8s' }} />
      <div className="absolute bottom-[-20%] right-[-20%] w-[50%] h-[50%] bg-emerald-600/15 rounded-full blur-[140px] pointer-events-none animate-pulse" style={{ animationDuration: '10s' }} />

      <motion.div 
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md bg-white/[0.03] border border-white/10 rounded-[2.5rem] p-8 md:p-10 backdrop-blur-2xl shadow-[0_0_50px_rgba(0,0,0,0.8)] relative z-10"
      >
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-emerald-500 p-0.5 mx-auto mb-4 shadow-[0_0_30px_rgba(16,185,129,0.3)]">
            <div className="w-full h-full bg-[#0a0a0a] rounded-[14px] flex items-center justify-center">
              <ShieldCheck size={32} className="text-emerald-400" />
            </div>
          </div>
          <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white via-neutral-200 to-emerald-400">
            SmartLedgerX Admin
          </h1>
          <p className="text-neutral-400 text-sm mt-1">Secure Management Portal</p>
        </div>

        {error && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center gap-3">
            <AlertCircle size={18} className="shrink-0" />
            <span>{error}</span>
          </motion.div>
        )}

        {countdown > 0 && (
          <div className="mb-6 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 text-sm text-center font-medium">
            Too many failed attempts. Try again in {Math.floor(countdown / 60)}m {countdown % 60}s.
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-2">Admin Email</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-neutral-500">
                <Mail size={18} />
              </div>
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="admin@smartledgerx.io"
                className="w-full bg-black/40 border border-white/10 rounded-xl pl-11 pr-4 py-3.5 text-white placeholder-neutral-600 focus:outline-none focus:border-emerald-500 transition-colors"
              />
            </div>
          </div>

          <motion.div
            animate={shakePassword ? { x: [-10, 10, -10, 10, 0] } : { x: 0 }}
            transition={{ duration: 0.4 }}
          >
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-neutral-400">Password</label>
              <button 
                type="button" 
                onClick={() => setShowForgotModal(true)}
                className="text-xs text-emerald-400 hover:text-emerald-300 font-medium transition-colors"
              >
                Forgot password?
              </button>
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-neutral-500">
                <Lock size={18} />
              </div>
              <input 
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                className={`w-full bg-black/40 border rounded-xl pl-11 pr-12 py-3.5 text-white placeholder-neutral-600 focus:outline-none transition-colors ${
                  passwordErrorBorder ? 'border-red-500 focus:border-red-500' : 'border-white/10 focus:border-emerald-500'
                }`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-4 flex items-center text-neutral-500 hover:text-neutral-300 transition-colors"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </motion.div>

          <div className="flex items-center">
            <label className="flex items-center gap-2 cursor-pointer text-sm text-neutral-400 select-none">
              <input 
                type="checkbox" 
                checked={rememberMe} 
                onChange={(e) => setRememberMe(e.target.checked)}
                className="rounded bg-black/40 border-white/20 text-emerald-500 focus:ring-emerald-500 w-4 h-4" 
              />
              <span>Remember this device</span>
            </label>
          </div>

          <button 
            type="submit" 
            disabled={isLoading || countdown > 0}
            className="w-full py-4 bg-gradient-to-r from-blue-600 to-emerald-500 text-white font-bold rounded-xl shadow-[0_0_25px_rgba(16,185,129,0.3)] hover:opacity-95 transition-all flex items-center justify-center gap-2 group disabled:opacity-50 cursor-pointer"
          >
            {isLoading ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Logging in...</span>
              </>
            ) : (
              <>
                <span>Access Admin Panel</span>
                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-white/10 text-center">
          <button 
            onClick={() => navigate('/')} 
            className="text-xs text-neutral-500 hover:text-neutral-300 transition-colors cursor-pointer"
          >
            ← Back to SmartLedgerX App
          </button>
        </div>
      </motion.div>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-[#121212] border border-white/10 rounded-3xl p-8 max-w-md w-full shadow-2xl">
            <h3 className="text-xl font-bold mb-2">Reset Admin Password</h3>
            <p className="text-neutral-400 text-sm mb-6">Enter your registered admin email to receive secure recovery instructions.</p>
            
            {forgotError && (
              <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2">
                <AlertCircle size={16} />
                <span>{forgotError}</span>
              </div>
            )}

            {forgotSent ? (
              <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm flex items-center gap-3">
                <CheckCircle2 size={20} />
                <span>Recovery email dispatched successfully!</span>
              </div>
            ) : (
              <form onSubmit={handleForgotSubmit} className="space-y-4">
                <input 
                  type="email" 
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  placeholder="admin@smartledgerx.io"
                  required
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500"
                />
                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setShowForgotModal(false)} className="flex-1 py-3 bg-white/5 hover:bg-white/10 rounded-xl font-medium text-sm cursor-pointer">Cancel</button>
                  <button type="submit" className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-500 rounded-xl font-semibold text-sm cursor-pointer">Send Link</button>
                </div>
              </form>
            )}
          </motion.div>
        </div>
      )}
    </div>
  );
}
