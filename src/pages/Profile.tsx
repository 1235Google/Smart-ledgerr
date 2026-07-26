import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useStore } from '../context/StoreContext';
import { 
  User, Mail, Phone, MapPin, Globe, Building2, BadgeCheck, 
  Calendar, ShieldCheck, Smartphone, Edit3, Share2, Download, 
  Camera, CheckCircle2, ChevronRight, Activity, Clock, Award, Wallet, 
  ArrowUpRight, ArrowDownLeft, Sparkles, TrendingUp, Lock, Eye, QrCode,
  FileText, Shield, Zap, RefreshCw, AlertCircle, Check, Star, Heart, MessageSquare, X, Target
} from 'lucide-react';
import { cn } from '../lib/utils';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

export default function Profile() {
  const { userProfile, customers, transactions, updateUserProfile } = useStore();
  const [activeTab, setActiveTab] = useState<'overview' | 'ai'>('overview');
  const [aiQuery, setAiQuery] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [isAiThinking, setIsAiThinking] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [selectedAchievement, setSelectedAchievement] = useState<any | null>(null);
  const [selectedDoc, setSelectedDoc] = useState<any | null>(null);
  
  // Customizer state
  const [accentColor, setAccentColor] = useState('emerald');
  const [amoledMode, setAmoledMode] = useState(true);
  const [glassIntensity, setGlassIntensity] = useState(80);

  // Security toggles state
  const [biometricActive, setBiometricActive] = useState(true);
  const [twoFactorActive, setTwoFactorActive] = useState(true);
  const [faceUnlockActive, setFaceUnlockActive] = useState(true);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const safeProfile = userProfile || {
    fullName: 'Rahul Sharma',
    username: '@rahul_smartledger',
    email: 'rahul.sharma@fintech.io',
    mobile: '+91 98765 43210',
    dob: '1992-06-15',
    gender: 'Male',
    occupation: 'Fintech Entrepreneur & Trader',
    address: '42, Connaught Place, New Delhi',
    language: 'English (IN)',
    currency: 'INR (₹)',
    timezone: 'IST (UTC+5:30)',
    memberSince: '2024-01-10',
    profilePhoto: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
    businessName: 'Sharma Digital Enterprises',
    businessCategory: 'Fintech & Retail',
    gstNumber: '07AABCS1429B1Z8',
    upiId: 'sharmadigital@okaxis',
    businessAddress: '108, Cyber City, Phase 2, Gurugram',
    website: 'https://sharmadigital.io',
    businessLogo: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=200&auto=format&fit=crop&q=80',
    annualRevenue: '₹1,45,00,000',
    businessRating: 4.9,
    verifiedEmail: true,
    verifiedPhone: true,
    googleConnected: true,
    lastLogin: 'Today, 10:42 AM from New Delhi',
    activeDevice: 'Chrome on macOS (Secure Session)'
  };

  // Money Goal State
  const [goalAmount, setGoalAmount] = useState<number>(() => {
    const saved = localStorage.getItem('smartledger_money_goal');
    return saved ? Math.max(1000, Number(saved)) : 1000000;
  });
  const [isEditingGoal, setIsEditingGoal] = useState(false);
  const [tempGoalInput, setTempGoalInput] = useState(goalAmount.toString());

  // Financial calculations
  const totalCustomers = customers ? customers.length : 24;
  const activeCustomers = customers ? customers.filter(c => (c as any).status === 'active').length : 19;
  const totalReceived = transactions ? transactions.filter(t => t.type === 'received').reduce((sum, t) => sum + (t.amount || 0), 0) : 482500;
  const totalPending = transactions ? transactions.filter(t => t.type === 'pending').reduce((sum, t) => sum + (t.amount || 0), 0) : 48400;
  const collectionRate = 91.2;
  const recoveryRate = 96.5;
  const avgMonthlyIncome = 125000;
  const largestTransaction = 75000;
  const fastestPayment = '12 Minutes';
  const currentStreak = 30;

  // Auto-calculated current savings from SmartLedger balance (Net = Received - Pending)
  const currentSavings = Math.max(0, totalReceived - totalPending);
  const remainingAmount = Math.max(0, goalAmount - currentSavings);
  const progressPercentage = goalAmount > 0 
    ? Math.min(100, Math.round((currentSavings / goalAmount) * 100)) 
    : 0;

  const handleSaveGoal = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const parsed = parseFloat(tempGoalInput.replace(/[^0-9.]/g, ''));
    if (isNaN(parsed) || parsed <= 0) {
      showToast("Please enter a valid goal amount!");
      return;
    }
    setGoalAmount(parsed);
    localStorage.setItem('smartledger_money_goal', String(parsed));
    setIsEditingGoal(false);
    showToast(`Money goal updated to ₹${parsed.toLocaleString('en-IN')}!`);
  };

  const financialTrendData = [
    { month: 'Jan', income: 95000, pending: 20000 },
    { month: 'Feb', income: 110000, pending: 15000 },
    { month: 'Mar', income: 105000, pending: 18000 },
    { month: 'Apr', income: 130000, pending: 12000 },
    { month: 'May', income: 142000, pending: 14000 },
    { month: 'Jun', income: 155000, pending: 9000 },
  ];

  const achievementsList = [
    { id: '1', title: 'First Customer', desc: 'Added your very first client to SmartLedger', unlocked: true, icon: Award, date: 'Jan 15, 2024' },
    { id: '2', title: '₹1 Lakh Received', desc: 'Successfully collected over ₹1 Lakh in revenue', unlocked: true, icon: Wallet, date: 'Feb 20, 2024' },
    { id: '3', title: '30 Day Streak', desc: 'Maintained active ledger entries for 30 consecutive days', unlocked: true, icon: Zap, date: 'Mar 10, 2024' },
    { id: '4', title: 'Zero Pending Month', desc: 'Closed a month with 0% pending collection dues', unlocked: false, icon: ShieldCheck, date: 'In Progress' },
    { id: '5', title: 'Diamond Member', desc: 'Reached Platinum+ tier with verified business status', unlocked: true, icon: Star, date: 'Jun 01, 2024' },
  ];

  const timelineEvents = [
    { date: 'Jan 10, 2024', title: 'Account Created', desc: 'Sharma Digital Enterprises registered on SmartLedgerX' },
    { date: 'Jan 15, 2024', title: 'First Transaction', desc: 'Received ₹15,000 opening invoice from Aarav Patel' },
    { date: 'Aug 12, 2024', title: 'Highest Collection', desc: 'Successfully settled single record of ₹75,000' },
    { date: 'Dec 01, 2024', title: 'Premium Purchased', desc: 'Upgraded to Enterprise Security & AI Insights suite' },
    { date: 'Today', title: 'Latest Login', desc: 'Secure session authenticated via Biometric & 2FA' },
  ];

  const documentsList = [
    { id: 'doc1', name: 'PAN Card (Business)', status: 'Verified', date: 'Jan 10, 2024', type: 'PDF Document' },
    { id: 'doc2', name: 'Aadhaar Card (Director)', status: 'Verified', date: 'Jan 10, 2024', type: 'PDF Document' },
    { id: 'doc3', name: 'GST Registration Certificate', status: 'Verified', date: 'Jan 12, 2024', type: 'Official Certificate' },
    { id: 'doc4', name: 'Business Trade License', status: 'Verified', date: 'Feb 01, 2024', type: 'License Document' },
    { id: 'doc5', name: 'Cancelled Cheque (Current A/c)', status: 'Verified', date: 'Jan 15, 2024', type: 'Bank Verification' },
    { id: 'doc6', name: 'Company Logo & Branding Kit', status: 'Uploaded', date: 'Mar 20, 2024', type: 'PNG/Vector Kit' },
  ];

  const handleAiAsk = (query: string) => {
    setAiQuery(query);
    setIsAiThinking(true);
    setTimeout(() => {
      setIsAiThinking(false);
      if (query.includes('highest pending')) {
        setAiResponse("Your highest pending balance is with Priya Sharma (₹18,400 due since 4 days). WhatsApp reminder recommended.");
      } else if (query.includes('predict')) {
        setAiResponse("AI Forecast: Projected next month's income is ₹1,68,500 (+14.2% growth trend based on recurring Monday collections).");
      } else if (query.includes('pays fastest')) {
        setAiResponse("Vikram Singh consistently clears invoices within an average of 18 minutes of issuance.");
      } else {
        setAiResponse(`Comprehensive AI Financial Report generated for ${safeProfile.businessName}. Liquidity health score is 92/100. All metrics optimized.`);
      }
    }, 900);
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        updateUserProfile({ profilePhoto: reader.result as string });
        showToast("Profile photo updated successfully!");
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className={cn("min-h-screen text-white pb-24 overflow-x-hidden transition-colors duration-300", amoledMode ? "bg-[#000000]" : "bg-[#05060a]")}>
      
      {/* Toast Notification Banner */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div 
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed top-6 right-6 z-50 bg-emerald-600/90 text-white px-6 py-3.5 rounded-2xl shadow-2xl flex items-center gap-3 border border-emerald-400/30 backdrop-blur-xl font-medium text-sm"
          >
            <CheckCircle2 size={20} className="text-white" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Ambient Background Lights */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-5%] left-1/2 -translate-x-1/2 w-[600px] h-[350px] bg-indigo-600/10 rounded-full blur-[150px]" />
        <div className="absolute top-[20%] right-[-10%] w-[450px] h-[450px] bg-purple-600/10 rounded-full blur-[160px]" />
        <div className="absolute bottom-[10%] left-[-10%] w-[400px] h-[400px] bg-emerald-600/10 rounded-full blur-[140px]" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 pt-6 md:pt-10 space-y-8">
        
        {/* CENTERPIECE: DIGITAL IDENTITY CARD (ULTRA-LUXURY ATM/CREDIT CARD AESTHETIC) */}
        <div className="flex justify-center w-full">
          <motion.div 
            initial={{ opacity: 0, y: 20, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="relative w-full max-w-xl group"
          >
            {/* Ambient Backlight Glow */}
            <div className="absolute -inset-1.5 bg-gradient-to-r from-indigo-600 via-purple-600 to-emerald-500 rounded-[30px] blur-2xl opacity-40 group-hover:opacity-70 transition duration-700 animate-pulse" />

            {/* The Ultra-Luxury Credit/ATM Card */}
            <div 
              style={{ backdropFilter: `blur(${glassIntensity}px)` }}
              className="relative overflow-hidden rounded-[28px] bg-gradient-to-br from-slate-900/95 via-indigo-950/85 to-black/95 border border-white/20 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.7)] p-6 sm:p-8 transition-all duration-500 group-hover:border-indigo-400/50 group-hover:shadow-[0_25px_70px_-10px_rgba(99,102,241,0.3)]"
            >
              
              {/* Metallic Gloss/Sheen Overlay */}
              <div className="absolute -top-32 -left-32 w-96 h-96 bg-gradient-to-br from-white/10 via-white/5 to-transparent rotate-45 pointer-events-none group-hover:translate-x-16 transition-transform duration-1000" />
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-indigo-500/15 via-purple-500/10 to-transparent pointer-events-none" />

              {/* Card Header: Brand Logo, Contactless Wave & Diamond Tier Badge */}
              <div className="flex items-center justify-between mb-6 relative z-10">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-400 via-indigo-500 to-purple-600 p-[1px] shadow-lg">
                    <div className="w-full h-full bg-slate-950 rounded-[11px] flex items-center justify-center">
                      <Sparkles size={16} className="text-amber-400 fill-amber-400" />
                    </div>
                  </div>
                  <span className="font-extrabold tracking-widest text-xs text-white uppercase font-mono">
                    SMARTLEDGER<span className="text-indigo-400">CARD</span>
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  {/* Contactless Signal Symbol */}
                  <div className="text-white/40 group-hover:text-white/80 transition-colors" title="Contactless Enabled">
                    <svg className="w-6 h-6 rotate-90" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 18.5a6.5 6.5 0 0 0 0-13M15.5 16a3.5 3.5 0 0 0 0-7M8.5 21a10 10 0 0 0 0-18" />
                    </svg>
                  </div>

                  <span className="px-3 py-1 rounded-full bg-gradient-to-r from-amber-500/20 via-orange-500/20 to-amber-500/20 border border-amber-500/40 text-amber-300 text-[11px] font-extrabold uppercase tracking-wider shadow-[0_0_12px_rgba(245,158,11,0.25)]">
                    Diamond Tier
                  </span>
                </div>
              </div>

              {/* Center Body: Profile Avatar, Details, Level & XP */}
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 relative z-10 mb-6">
                
                {/* Profile Picture with Golden Metallic Ring & Upload Click */}
                <div 
                  className="relative group/avatar cursor-pointer shrink-0" 
                  onClick={() => fileInputRef.current?.click()} 
                  title="Click to update profile photo"
                >
                  <div className="absolute -inset-1.5 bg-gradient-to-r from-amber-400 via-indigo-500 to-purple-500 rounded-full blur-sm opacity-80 group-hover/avatar:opacity-100 transition duration-300" />
                  
                  <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-full overflow-hidden border-2 border-amber-400/80 bg-slate-900 shadow-2xl">
                    {safeProfile.profilePhoto ? (
                      <img src={safeProfile.profilePhoto} alt={safeProfile.fullName} className="w-full h-full object-cover transition duration-500 group-hover/avatar:scale-105" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-500"><User size={40} /></div>
                    )}
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover/avatar:opacity-100 transition duration-200">
                      <Camera size={24} className="text-white" />
                    </div>
                  </div>
                  <input type="file" ref={fileInputRef} onChange={handlePhotoUpload} accept="image/*" className="hidden" />

                  {/* Golden Verification Badge */}
                  <div className="absolute top-0 right-0 w-7 h-7 bg-gradient-to-br from-amber-400 to-amber-600 rounded-full border-2 border-slate-950 flex items-center justify-center z-20 shadow-lg" title="Golden Verified Member">
                    <BadgeCheck size={14} className="text-slate-950 stroke-[3]" />
                  </div>

                  {/* Active Online Indicator */}
                  <div className="absolute bottom-1 right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-slate-950 z-20 animate-pulse" title="Online" />
                </div>

                {/* Info Column */}
                <div className="flex-1 text-center sm:text-left min-w-0 w-full">
                  <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white drop-shadow-md truncate mb-1">
                    {safeProfile.fullName}
                  </h1>
                  
                  <p className="text-slate-300 text-xs sm:text-sm font-medium mb-3 flex items-center justify-center sm:justify-start gap-2 truncate">
                    <span className="text-indigo-300 font-mono font-semibold">{safeProfile.username}</span>
                    <span className="text-slate-500">•</span>
                    <span className="text-emerald-400 truncate">{safeProfile.businessName}</span>
                  </p>

                  {/* Level & XP Progress */}
                  <div className="bg-slate-950/70 border border-white/10 rounded-xl p-2.5 backdrop-blur-md">
                    <div className="flex items-center justify-between text-[11px] font-bold text-slate-300 mb-1.5">
                      <span className="flex items-center gap-1 text-amber-300">
                        <Sparkles size={12} className="text-amber-400 fill-amber-400" />
                        Level 8 Enterprise Trader
                      </span>
                      <span className="text-emerald-400 font-mono">8,450 / 10,000 XP</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-amber-400 via-indigo-500 to-emerald-400 rounded-full w-[84.5%]" />
                    </div>
                  </div>
                </div>

              </div>

              {/* Card Footer: EMV Chip + Member ID + Member Since + Trust Score */}
              <div className="pt-4 border-t border-white/10 grid grid-cols-2 sm:grid-cols-4 gap-3 text-center sm:text-left relative z-10 items-center">
                
                {/* EMV Gold Chip */}
                <div className="flex items-center justify-center sm:justify-start gap-2">
                  <div className="w-10 h-7 rounded-md bg-gradient-to-br from-amber-200 via-amber-400 to-yellow-600 p-[1px] shadow-inner relative overflow-hidden flex items-center justify-center">
                    <div className="w-full h-full border border-amber-600/40 rounded-[5px] grid grid-cols-2 gap-0.5 p-0.5">
                      <div className="bg-amber-300/40 rounded-[2px]" />
                      <div className="bg-amber-300/40 rounded-[2px]" />
                      <div className="bg-amber-300/40 rounded-[2px]" />
                      <div className="bg-amber-300/40 rounded-[2px]" />
                    </div>
                  </div>
                </div>

                {/* SmartLedger Member ID */}
                <div>
                  <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400">Member ID</div>
                  <div className="font-mono font-bold text-white text-xs sm:text-sm tracking-wider">
                    SLX-8942-8819
                  </div>
                </div>

                {/* Member Since Date */}
                <div>
                  <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400">Member Since</div>
                  <div className="font-mono font-bold text-slate-200 text-xs sm:text-sm">
                    {safeProfile.memberSince}
                  </div>
                </div>

                {/* Trust Score */}
                <div className="text-center sm:text-right">
                  <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400">Trust Score</div>
                  <div className="inline-flex items-center gap-1 font-bold text-emerald-400 text-xs sm:text-sm">
                    <ShieldCheck size={14} className="text-emerald-400" />
                    <span>98/100</span>
                  </div>
                </div>

              </div>

            </div>
          </motion.div>
        </div>

        {/* SIX PREMIUM GLASS CARDS IN RESPONSIVE 3x2 GRID (3 Cols Desktop, 2 Cols Tablet, 1 Col Mobile) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
          {[
            { title: 'Total Received', value: `₹${totalReceived.toLocaleString()}`, change: '+18.4%', icon: ArrowDownLeft, color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
            { title: 'Total Pending', value: `₹${totalPending.toLocaleString()}`, change: '-4.2%', icon: ArrowUpRight, color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20' },
            { title: 'Active Customers', value: `${activeCustomers} / ${totalCustomers}`, change: '84% Active', icon: User, color: 'text-indigo-400', bg: 'bg-indigo-500/10 border-indigo-500/20' },
            { title: 'Collection Rate', value: `${collectionRate}%`, change: 'Optimal', icon: TrendingUp, color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20' },
            { title: 'Recovery Rate', value: `${recoveryRate}%`, change: 'High Trust', icon: ShieldCheck, color: 'text-purple-400', bg: 'bg-purple-500/10 border-purple-500/20' },
            { title: 'Avg Monthly Income', value: `₹${avgMonthlyIncome.toLocaleString()}`, change: '+8.1%', icon: Wallet, color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
          ].map((card, idx) => {
            const Icon = card.icon;
            return (
              <motion.div 
                key={idx} 
                whileHover={{ scale: 1.02, y: -2 }}
                transition={{ duration: 0.2 }}
                className="relative overflow-hidden bg-white/[0.03] border border-white/10 hover:border-indigo-500/40 rounded-2xl p-5 backdrop-blur-xl transition-all shadow-xl flex flex-col justify-between group"
              >
                <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-white/5 to-transparent rounded-full blur-xl pointer-events-none group-hover:bg-indigo-500/10 transition-colors" />
                
                <div className="flex items-center justify-between mb-3 relative z-10">
                  <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center border backdrop-blur-md", card.bg, card.color)}>
                    <Icon size={20} />
                  </div>
                  <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-white/5 text-slate-300 border border-white/10 font-mono">
                    {card.change}
                  </span>
                </div>
                
                <div className="relative z-10">
                  <div className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mb-1 font-mono">
                    {card.value}
                  </div>
                  <div className="text-xs font-semibold text-slate-400 tracking-wide">
                    {card.title}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* MONEY GOAL CARD (PREMIUM GLASSMORPHISM SAVINGS TRACKER) */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="relative overflow-hidden bg-white/[0.03] border border-white/10 hover:border-emerald-500/30 rounded-3xl p-6 md:p-8 backdrop-blur-xl shadow-2xl transition-all duration-300 group"
        >
          {/* Subtle Background Glows */}
          <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none group-hover:bg-emerald-500/15 transition-colors" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

          {/* Card Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 relative z-10 border-b border-white/10 pb-5">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500/20 via-teal-500/20 to-indigo-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.25)]">
                <Target size={24} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">Money Goal</h2>
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[11px] font-bold uppercase tracking-wider font-mono">
                    Auto-Tracked
                  </span>
                </div>
                <p className="text-slate-400 text-xs sm:text-sm">Current savings synced live from SmartLedger balance</p>
              </div>
            </div>

            <button
              onClick={() => {
                setTempGoalInput(goalAmount.toString());
                setIsEditingGoal(true);
              }}
              className="px-4 py-2.5 bg-white/5 hover:bg-white/10 border border-white/15 hover:border-emerald-500/40 text-white rounded-xl text-xs font-semibold transition-all shadow-md flex items-center gap-2 cursor-pointer w-max shrink-0"
            >
              <Edit3 size={15} className="text-emerald-400" />
              <span>Edit Goal</span>
            </button>
          </div>

          {/* Main Content Layout: Progress Gauge + Metric Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center relative z-10 mb-6">
            
            {/* Left Circular Gauge */}
            <div className="lg:col-span-4 flex flex-col items-center justify-center bg-black/40 border border-white/5 rounded-2xl p-6 text-center">
              <div className="relative w-36 h-36 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  <circle 
                    cx="50" 
                    cy="50" 
                    r="40" 
                    stroke="currentColor" 
                    strokeWidth="8" 
                    className="text-white/10 fill-none" 
                  />
                  <circle 
                    cx="50" 
                    cy="50" 
                    r="40" 
                    stroke="currentColor" 
                    strokeWidth="8" 
                    strokeLinecap="round"
                    className="text-emerald-400 fill-none transition-all duration-1000 ease-out" 
                    style={{
                      strokeDasharray: 251.32,
                      strokeDashoffset: 251.32 - (251.32 * progressPercentage) / 100
                    }}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-3xl font-extrabold text-white font-mono tracking-tight">{progressPercentage}%</span>
                  <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-widest mt-0.5">
                    {progressPercentage >= 100 ? 'Achieved!' : 'Reached'}
                  </span>
                </div>
              </div>
            </div>

            {/* Right Metrics Grid */}
            <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Metric 1: Goal Amount */}
              <div className="bg-black/40 border border-white/10 rounded-2xl p-4 flex flex-col justify-between">
                <div className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-1">Goal Amount</div>
                <div className="text-xl sm:text-2xl font-extrabold text-white font-mono truncate">
                  ₹{goalAmount.toLocaleString('en-IN')}
                </div>
                <div className="text-[11px] text-indigo-400 font-medium mt-2 flex items-center gap-1">
                  <Sparkles size={12} /> Target Limit
                </div>
              </div>

              {/* Metric 2: Current Savings */}
              <div className="bg-black/40 border border-white/10 rounded-2xl p-4 flex flex-col justify-between">
                <div className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-1">Current Savings</div>
                <div className="text-xl sm:text-2xl font-extrabold text-emerald-400 font-mono truncate">
                  ₹{currentSavings.toLocaleString('en-IN')}
                </div>
                <div className="text-[11px] text-emerald-400/80 font-medium mt-2 flex items-center gap-1">
                  <CheckCircle2 size={12} /> SmartLedger Sync
                </div>
              </div>

              {/* Metric 3: Remaining Amount */}
              <div className="bg-black/40 border border-white/10 rounded-2xl p-4 flex flex-col justify-between">
                <div className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-1">Remaining</div>
                <div className={cn("text-xl sm:text-2xl font-extrabold font-mono truncate", remainingAmount === 0 ? "text-emerald-400" : "text-amber-400")}>
                  ₹{remainingAmount.toLocaleString('en-IN')}
                </div>
                <div className="text-[11px] text-amber-400/80 font-medium mt-2 flex items-center gap-1">
                  <Clock size={12} /> To Collect
                </div>
              </div>
            </div>

          </div>

          {/* Animated Progress Bar Footer */}
          <div className="space-y-2 relative z-10">
            <div className="flex justify-between items-center text-xs font-semibold">
              <span className="text-slate-400">Goal Progress</span>
              <span className="text-emerald-400 font-mono font-bold">₹{currentSavings.toLocaleString('en-IN')} / ₹{goalAmount.toLocaleString('en-IN')} ({progressPercentage}%)</span>
            </div>
            <div className="w-full h-3 bg-black/50 rounded-full overflow-hidden p-0.5 border border-white/10">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${progressPercentage}%` }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="h-full bg-gradient-to-r from-emerald-500 via-teal-400 to-indigo-500 rounded-full shadow-[0_0_12px_rgba(16,185,129,0.5)]"
              />
            </div>
          </div>
        </motion.div>

      </div>

      {/* EDIT MONEY GOAL MODAL */}
      <AnimatePresence>
        {isEditingGoal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }} 
              animate={{ scale: 1, opacity: 1 }} 
              exit={{ scale: 0.9, opacity: 0 }} 
              className="bg-[#121212] border border-white/15 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-6 relative overflow-hidden"
            >
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
                    <Target size={20} />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">Edit Money Goal</h3>
                    <p className="text-xs text-slate-400">Set your financial target amount</p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsEditingGoal(false)} 
                  className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-white/5 cursor-pointer transition"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSaveGoal} className="space-y-5">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
                    Goal Amount (₹)
                  </label>
                  <div className="relative flex items-center">
                    <span className="absolute left-4 text-xl font-extrabold text-emerald-400 font-mono">₹</span>
                    <input 
                      type="number"
                      min="1"
                      step="1"
                      value={tempGoalInput}
                      onChange={(e) => setTempGoalInput(e.target.value)}
                      placeholder="e.g. 1000000"
                      className="w-full bg-black/60 border border-white/15 rounded-2xl pl-10 pr-4 py-3.5 text-white font-mono text-xl font-bold focus:outline-none focus:border-emerald-500 transition shadow-inner"
                      autoFocus
                    />
                  </div>
                  {tempGoalInput && !isNaN(Number(tempGoalInput.replace(/[^0-9.]/g, ''))) && Number(tempGoalInput.replace(/[^0-9.]/g, '')) > 0 && (
                    <div className="mt-2 text-xs font-mono text-emerald-400 flex items-center justify-between px-1">
                      <span className="text-slate-400 font-sans">Formatted Target:</span>
                      <span className="font-bold">₹{Number(tempGoalInput.replace(/[^0-9.]/g, '')).toLocaleString('en-IN')}</span>
                    </div>
                  )}
                </div>

                {/* Quick Presets */}
                <div>
                  <label className="block text-[11px] font-medium text-slate-400 mb-2">
                    Quick Presets:
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { label: '₹5 Lakhs', val: 500000 },
                      { label: '₹10 Lakhs', val: 1000000 },
                      { label: '₹25 Lakhs', val: 2500000 },
                      { label: '₹50 Lakhs', val: 5000000 },
                      { label: '₹1 Crore', val: 10000000 },
                    ].map((preset, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setTempGoalInput(preset.val.toString())}
                        className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-emerald-500/40 text-xs font-mono font-medium text-slate-300 hover:text-white transition cursor-pointer"
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button 
                    type="button"
                    onClick={() => setIsEditingGoal(false)} 
                    className="flex-1 py-3 bg-white/5 hover:bg-white/10 rounded-xl font-medium text-sm text-slate-300 transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-semibold text-sm transition shadow-lg cursor-pointer"
                  >
                    Save Goal
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ACHIEVEMENT DETAILS MODAL */}
      <AnimatePresence>
        {selectedAchievement && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-[#121212] border border-white/10 rounded-3xl p-8 max-w-md w-full shadow-2xl space-y-6">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
                  <selectedAchievement.icon size={24} />
                </div>
                <button onClick={() => setSelectedAchievement(null)} className="p-2 text-slate-400 hover:text-white cursor-pointer"><X size={20} /></button>
              </div>
              <div>
                <h3 className="text-2xl font-bold text-white mb-1">{selectedAchievement.title}</h3>
                <p className="text-sm text-slate-400 mb-4">{selectedAchievement.desc}</p>
                <div className="p-4 rounded-xl bg-black/40 border border-white/5 space-y-2 text-xs">
                  <div className="flex justify-between"><span className="text-slate-400">Status</span><span className="text-amber-400 font-bold uppercase">{selectedAchievement.unlocked ? 'Unlocked' : 'Locked'}</span></div>
                  <div className="flex justify-between"><span className="text-slate-400">Milestone Date</span><span className="text-white font-mono">{selectedAchievement.date}</span></div>
                </div>
              </div>
              <button onClick={() => setSelectedAchievement(null)} className="w-full py-3 bg-white/10 hover:bg-white/20 rounded-xl font-semibold text-sm transition cursor-pointer">Close</button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* DOCUMENT PREVIEW MODAL */}
      <AnimatePresence>
        {selectedDoc && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-[#121212] border border-white/10 rounded-3xl p-8 max-w-md w-full shadow-2xl space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <FileText className="text-emerald-400" size={24} />
                  <h3 className="text-xl font-bold text-white">{selectedDoc.name}</h3>
                </div>
                <button onClick={() => setSelectedDoc(null)} className="p-2 text-slate-400 hover:text-white cursor-pointer"><X size={20} /></button>
              </div>
              <div className="p-6 rounded-2xl bg-black/50 border border-white/10 text-center space-y-3">
                <FileText size={48} className="mx-auto text-emerald-400/60" />
                <div className="text-sm text-slate-300 font-medium">Verified Compliance Document</div>
                <div className="text-xs text-slate-500 font-mono">ID: {selectedDoc.id} • {selectedDoc.date}</div>
              </div>
              <div className="flex gap-3">
                <button onClick={() => setSelectedDoc(null)} className="flex-1 py-3 bg-white/5 hover:bg-white/10 rounded-xl font-medium text-sm cursor-pointer">Cancel</button>
                <button onClick={() => { showToast(`Downloading ${selectedDoc.name}...`); setSelectedDoc(null); }} className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-500 rounded-xl font-semibold text-sm transition shadow-lg cursor-pointer">Download PDF</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
