import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useStore } from '../context/StoreContext';
import { 
  User, Mail, Phone, MapPin, Globe, Building2, BadgeCheck, 
  Calendar, ShieldCheck, Smartphone, Edit3, Share2, Download, 
  Camera, CheckCircle2, ChevronRight, Activity, Clock, Award, Wallet, 
  ArrowUpRight, ArrowDownLeft, Sparkles, TrendingUp, Lock, Eye, QrCode,
  FileText, Shield, Zap, RefreshCw, AlertCircle, Check, Star, Heart, MessageSquare, X
} from 'lucide-react';
import { cn } from '../lib/utils';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

export default function Profile() {
  const { userProfile, customers, transactions, updateUserProfile } = useStore();
  const [activeTab, setActiveTab] = useState<'overview' | 'business' | 'security' | 'documents' | 'customizer' | 'ai'>('overview');
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
    <div className={cn("min-h-screen text-white pb-24 overflow-x-hidden transition-colors duration-300", amoledMode ? "bg-[#000000]" : "bg-[#070709]")}>
      
      {/* Toast Notification Banner */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div 
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed top-6 right-6 z-50 bg-emerald-600 text-white px-6 py-3.5 rounded-2xl shadow-2xl flex items-center gap-3 border border-emerald-400/30 backdrop-blur-xl"
          >
            <CheckCircle2 size={20} className="text-white" />
            <span className="font-semibold text-sm">{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Background Glows */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[45%] h-[45%] bg-indigo-600/15 rounded-full blur-[140px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[45%] h-[45%] bg-purple-600/15 rounded-full blur-[140px]" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 pt-8 space-y-8">
        
        {/* HERO PROFILE SECTION */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ backdropFilter: `blur(${glassIntensity}px)` }}
          className="relative rounded-3xl bg-white/[0.03] border border-white/10 p-8 md:p-10 shadow-2xl overflow-hidden group"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-emerald-500/10 opacity-50" />
          
          <div className="relative flex flex-col lg:flex-row items-center justify-between gap-8">
            <div className="flex flex-col md:flex-row items-center gap-6 text-center md:text-left">
              
              {/* Profile Image with Glowing Particles & Neon Hover */}
              <div className="relative group/avatar cursor-pointer" onClick={() => fileInputRef.current?.click()} title="Click to update profile picture">
                <div className="absolute -inset-2 bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-500 rounded-full blur-xl opacity-70 group-hover/avatar:opacity-100 transition duration-500 animate-pulse" />
                
                <div className="relative w-36 h-36 rounded-full overflow-hidden border-4 border-[#0a0a0a] bg-neutral-900 shadow-2xl">
                  {safeProfile.profilePhoto ? (
                    <img src={safeProfile.profilePhoto} alt={safeProfile.fullName} className="w-full h-full object-cover transition duration-500 group-hover/avatar:scale-110" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-neutral-500"><User size={56} /></div>
                  )}
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover/avatar:opacity-100 transition">
                    <Camera size={32} className="text-white" />
                  </div>
                </div>
                <input type="file" ref={fileInputRef} onChange={handlePhotoUpload} accept="image/*" className="hidden" />

                {/* Online Status Badge */}
                <div className="absolute bottom-2 right-2 w-5 h-5 bg-emerald-500 rounded-full border-4 border-[#0a0a0a] z-20 animate-pulse" title="Online & Active" />
                
                {/* Golden Verified Badge */}
                <div className="absolute top-0 right-2 w-8 h-8 bg-amber-500 rounded-full border-4 border-[#0a0a0a] flex items-center justify-center z-20 shadow-lg" title="Golden Verified">
                  <BadgeCheck size={16} className="text-white" />
                </div>
              </div>

              <div>
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mb-2">
                  <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-white">{safeProfile.fullName}</h1>
                  <span className="px-3 py-1 rounded-full bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/30 text-amber-400 text-xs font-bold uppercase tracking-wider shadow-sm">
                    Diamond Tier
                  </span>
                </div>
                <p className="text-neutral-400 text-sm mb-4 font-medium flex items-center justify-center md:justify-start gap-2">
                  <span>{safeProfile.username}</span> • <span className="text-indigo-400">{safeProfile.businessName}</span>
                </p>

                {/* XP & Level Progress */}
                <div className="w-full max-w-md bg-black/40 border border-white/10 rounded-2xl p-3 backdrop-blur-md">
                  <div className="flex items-center justify-between text-xs font-semibold text-neutral-300 mb-1.5">
                    <span className="flex items-center gap-1.5"><Sparkles size={14} className="text-amber-400" /> Level 8 Enterprise Trader</span>
                    <span className="text-emerald-400">8,450 / 10,000 XP</span>
                  </div>
                  <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-400 rounded-full w-[84%]" />
                  </div>
                </div>
              </div>
            </div>

            {/* Profile Strength & Trust Score Widget */}
            <div className="flex items-center gap-6 bg-white/5 border border-white/10 rounded-3xl p-6 backdrop-blur-xl">
              <div className="relative w-20 h-20 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90">
                  <circle cx="40" cy="40" r="34" stroke="currentColor" strokeWidth="6" className="text-white/10 fill-none" />
                  <circle cx="40" cy="40" r="34" stroke="currentColor" strokeWidth="6" className="text-emerald-400 fill-none stroke-dasharray [stroke-dasharray:213] [stroke-dashoffset:17]" strokeLinecap="round" />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                  <span className="text-lg font-bold text-white">92%</span>
                  <span className="text-[10px] text-neutral-400 uppercase tracking-widest">Strength</span>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <ShieldCheck size={18} className="text-emerald-400" />
                  <span className="text-sm font-bold text-white">Trust Score: 98/100</span>
                </div>
                <div className="flex items-center gap-2">
                  <Star size={18} className="text-amber-400" />
                  <span className="text-sm font-semibold text-neutral-300">Reputation: Elite</span>
                </div>
                <div className="text-xs text-neutral-400">All security audits passed</div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* NAVIGATION TABS */}
        <div className="flex flex-wrap items-center gap-2 p-1.5 bg-white/5 border border-white/10 rounded-2xl w-fit backdrop-blur-xl">
          {[
            { id: 'overview', label: 'Overview & Stats', icon: Activity },
            { id: 'business', label: 'Business Identity', icon: Building2 },
            { id: 'security', label: 'Security & Trust', icon: Shield },
            { id: 'documents', label: 'Verified Documents', icon: FileText },
            { id: 'customizer', label: 'Theme Customizer', icon: Edit3 },
            { id: 'ai', label: 'SmartLedger AI', icon: Sparkles },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={cn(
                  "flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer",
                  activeTab === tab.id ? "bg-emerald-600 text-white shadow-lg shadow-emerald-500/20" : "text-neutral-400 hover:text-white hover:bg-white/5"
                )}
              >
                <Icon size={16} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* TAB 1: OVERVIEW & STATS */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            
            {/* 10 PREMIUM STATISTICS CARDS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              {[
                { title: 'Total Customers', value: totalCustomers, change: '+12%', icon: User, color: 'text-indigo-400' },
                { title: 'Active Customers', value: activeCustomers, change: '84% Active', icon: Activity, color: 'text-emerald-400' },
                { title: 'Total Received', value: `₹${totalReceived.toLocaleString()}`, change: '+18.4%', icon: ArrowDownLeft, color: 'text-emerald-400' },
                { title: 'Total Pending', value: `₹${totalPending.toLocaleString()}`, change: '-4.2%', icon: ArrowUpRight, color: 'text-amber-400' },
                { title: 'Collection Rate', value: `${collectionRate}%`, change: 'Optimal', icon: TrendingUp, color: 'text-blue-400' },
                { title: 'Recovery Rate', value: `${recoveryRate}%`, change: 'High Trust', icon: ShieldCheck, color: 'text-purple-400' },
                { title: 'Avg Monthly Income', value: `₹${avgMonthlyIncome.toLocaleString()}`, change: '+8.1%', icon: Wallet, color: 'text-emerald-400' },
                { title: 'Largest Transaction', value: `₹${largestTransaction.toLocaleString()}`, change: 'Record', icon: Star, color: 'text-amber-400' },
                { title: 'Fastest Payment', value: fastestPayment, change: 'Instant', icon: Zap, color: 'text-blue-400' },
                { title: 'Current Streak', value: `${currentStreak} Days`, change: 'Unbroken', icon: Award, color: 'text-orange-400' },
              ].map((card, idx) => {
                const Icon = card.icon;
                return (
                  <motion.div 
                    key={idx}
                    whileHover={{ scale: 1.02, y: -2 }}
                    className="bg-white/5 border border-white/10 hover:border-emerald-500/40 rounded-2xl p-5 backdrop-blur-xl transition-all shadow-lg flex flex-col justify-between group"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className={cn("w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center", card.color)}>
                        <Icon size={20} />
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/5 text-neutral-300 border border-white/10">
                        {card.change}
                      </span>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-white tracking-tight mb-1">{card.value}</div>
                      <div className="text-xs text-neutral-400 font-medium">{card.title}</div>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* FINANCIAL INSIGHTS & CHARTS */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-white/5 border border-white/10 rounded-3xl p-6 md:p-8 backdrop-blur-xl">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-xl font-bold text-white">Income vs Pending Trend</h2>
                    <p className="text-neutral-400 text-sm">Monthly financial performance analysis</p>
                  </div>
                  <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-semibold">Live Analytics</span>
                </div>
                <div className="h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={financialTrendData}>
                      <defs>
                        <linearGradient id="colorInc" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="month" stroke="#737373" />
                      <YAxis stroke="#737373" tickFormatter={(v) => `₹${v/1000}k`} />
                      <Tooltip contentStyle={{ backgroundColor: '#121212', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '1rem', color: '#fff' }} />
                      <Area type="monotone" dataKey="income" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorInc)" name="Income" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* AI SMART INSIGHTS CARD */}
              <div className="bg-gradient-to-br from-indigo-950/40 via-purple-950/30 to-black/60 border border-indigo-500/30 rounded-3xl p-6 md:p-8 backdrop-blur-xl flex flex-col justify-between shadow-2xl relative overflow-hidden">
                <div className="absolute -right-10 -top-10 w-40 h-40 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
                
                <div>
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shadow-[0_0_20px_rgba(99,102,241,0.4)]">
                      <Sparkles size={24} />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-white">SmartLedger Gemini AI Insights</h2>
                      <p className="text-indigo-300 text-sm">Personalized automated financial observations</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="p-4 rounded-2xl bg-black/40 border border-white/10 flex items-start gap-3">
                      <Zap size={18} className="text-emerald-400 mt-0.5 shrink-0" />
                      <p className="text-sm text-neutral-200">Your pending collection increased by <span className="text-emerald-400 font-bold">12%</span> this month. Recommended sending bulk WhatsApp reminders.</p>
                    </div>
                    <div className="p-4 rounded-2xl bg-black/40 border border-white/10 flex items-start gap-3">
                      <Clock size={18} className="text-indigo-400 mt-0.5 shrink-0" />
                      <p className="text-sm text-neutral-200">You usually receive payments faster on <span className="text-indigo-400 font-bold">Mondays</span> (avg 18 mins settlement).</p>
                    </div>
                    <div className="p-4 rounded-2xl bg-black/40 border border-white/10 flex items-start gap-3">
                      <Star size={18} className="text-amber-400 mt-0.5 shrink-0" />
                      <p className="text-sm text-neutral-200">Your highest paying customer is <span className="text-amber-400 font-bold">Rahul Traders</span> with ₹1.2L annual contribution.</p>
                    </div>
                  </div>
                </div>

                <div className="pt-6 mt-6 border-t border-white/10 flex items-center justify-between">
                  <span className="text-xs text-neutral-400">Model: Gemini 2.5 Flash Autonomous Engine</span>
                  <button 
                    onClick={() => showToast("AI Model re-analyzed weights successfully. All insights up to date.")} 
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold transition shadow-lg cursor-pointer"
                  >
                    Re-Analyze Now
                  </button>
                </div>
              </div>
            </div>

            {/* ACHIEVEMENT SYSTEM */}
            <div className="bg-white/5 border border-white/10 rounded-3xl p-6 md:p-8 backdrop-blur-xl">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-bold text-white">Achievement Trophies</h2>
                  <p className="text-neutral-400 text-sm">Milestones unlocked across your business journey (Click to inspect)</p>
                </div>
                <span className="px-3 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 text-xs font-bold">4 / 5 Unlocked</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                {achievementsList.map((ach) => {
                  const Icon = ach.icon;
                  return (
                    <motion.div 
                      key={ach.id} 
                      whileHover={{ scale: 1.03 }}
                      onClick={() => setSelectedAchievement(ach)}
                      className={cn(
                        "p-5 rounded-2xl border flex flex-col justify-between transition-all cursor-pointer",
                        ach.unlocked ? "bg-black/40 border-amber-500/30 shadow-[0_0_15px_rgba(245,158,11,0.1)] hover:border-amber-400" : "bg-black/20 border-white/5 opacity-60 hover:opacity-90"
                      )}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", ach.unlocked ? "bg-amber-500/20 text-amber-400" : "bg-white/5 text-neutral-500")}>
                            <Icon size={20} />
                          </div>
                          {ach.unlocked && <CheckCircle2 size={16} className="text-emerald-400" />}
                        </div>
                        <h3 className="font-bold text-white text-base mb-1">{ach.title}</h3>
                        <p className="text-xs text-neutral-400 mb-4">{ach.desc}</p>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className={cn("text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md", ach.unlocked ? "bg-amber-500/10 text-amber-400" : "bg-white/5 text-neutral-500")}>
                          {ach.unlocked ? 'Unlocked' : 'Locked'}
                        </span>
                        <span className="text-[10px] text-neutral-400 font-mono">{ach.date}</span>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>

            {/* TIMELINE SECTION */}
            <div className="bg-white/5 border border-white/10 rounded-3xl p-6 md:p-8 backdrop-blur-xl">
              <h2 className="text-xl font-bold text-white mb-6">Account Activity Timeline</h2>
              <div className="space-y-6 relative before:absolute before:inset-0 before:left-5 before:w-0.5 before:bg-white/10">
                {timelineEvents.map((ev, idx) => (
                  <motion.div 
                    key={idx} 
                    whileHover={{ x: 4 }}
                    className="flex items-start gap-4 relative group cursor-pointer"
                    onClick={() => showToast(`Timeline event selected: ${ev.title}`)}
                  >
                    <div className="w-10 h-10 rounded-2xl bg-emerald-600/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 z-10 shrink-0 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                      <Clock size={18} />
                    </div>
                    <div className="bg-black/40 border border-white/5 rounded-2xl p-4 flex-1 group-hover:border-emerald-500/30 transition-colors">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="font-bold text-white text-base">{ev.title}</h3>
                        <span className="text-xs font-mono text-neutral-400">{ev.date}</span>
                      </div>
                      <p className="text-xs text-neutral-400">{ev.desc}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

          </div>
        )}

        {/* TAB 2: BUSINESS IDENTITY & SMART SCORE */}
        {activeTab === 'business' && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* Digital Business Card */}
              <div className="lg:col-span-2 bg-gradient-to-br from-neutral-900 via-neutral-950 to-black border border-white/10 rounded-3xl p-8 backdrop-blur-xl shadow-2xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
                
                <div className="flex items-center justify-between mb-8 border-b border-white/10 pb-6">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-2xl overflow-hidden bg-white/10 border border-white/20">
                      <img src={safeProfile.businessLogo} alt="Logo" className="w-full h-full object-cover" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-white">{safeProfile.businessName}</h2>
                      <p className="text-emerald-400 text-sm font-medium">{safeProfile.businessCategory}</p>
                    </div>
                  </div>
                  <div 
                    onClick={() => {
                      navigator.clipboard.writeText(safeProfile.upiId);
                      showToast(`UPI ID "${safeProfile.upiId}" copied to clipboard!`);
                    }}
                    className="w-16 h-16 bg-white p-2 rounded-2xl flex items-center justify-center shadow-lg cursor-pointer hover:scale-105 transition-transform"
                    title="Click to copy UPI ID"
                  >
                    <QrCode size={48} className="text-black" />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-1">GST Number</div>
                    <div className="font-mono font-bold text-white text-base">{safeProfile.gstNumber}</div>
                  </div>
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-1">UPI ID</div>
                    <div className="font-mono font-bold text-white text-base">{safeProfile.upiId}</div>
                  </div>
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-1">Annual Revenue</div>
                    <div className="font-bold text-emerald-400 text-lg">{(safeProfile as any).annualRevenue}</div>
                  </div>
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-1">Business Rating</div>
                    <div className="flex items-center gap-1 text-amber-400 font-bold">
                      <Star size={16} fill="currentColor" /> <span>{(safeProfile as any).businessRating} / 5.0</span>
                    </div>
                  </div>
                </div>

                <div className="pt-6 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-4">
                  <div className="text-xs text-neutral-400 flex items-center gap-2">
                    <MapPin size={14} /> {safeProfile.businessAddress}
                  </div>
                  <a 
                    href={safeProfile.website} 
                    target="_blank" 
                    rel="noreferrer" 
                    onClick={() => showToast("Opening official website portal...")}
                    className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs font-semibold text-white flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <Globe size={14} /> Visit Website
                  </a>
                </div>
              </div>

              {/* Smart Ledger Score Widget */}
              <div className="bg-white/5 border border-white/10 rounded-3xl p-8 backdrop-blur-xl flex flex-col justify-between text-center">
                <div>
                  <h3 className="text-xl font-bold text-white mb-2">Smart Ledger Score</h3>
                  <p className="text-xs text-neutral-400 mb-6">Calculated via AI financial health algorithm</p>

                  <div className="relative w-36 h-36 mx-auto flex items-center justify-center mb-6">
                    <svg className="w-full h-full transform -rotate-90">
                      <circle cx="72" cy="72" r="62" stroke="currentColor" strokeWidth="8" className="text-white/10 fill-none" />
                      <circle cx="72" cy="72" r="62" stroke="currentColor" strokeWidth="8" className="text-emerald-400 fill-none stroke-dasharray [stroke-dasharray:390] [stroke-dashoffset:50]" strokeLinecap="round" />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-4xl font-extrabold text-white">892</span>
                      <span className="text-xs text-emerald-400 font-bold uppercase tracking-wider">Exceptional</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2 text-left bg-black/40 p-4 rounded-2xl border border-white/5">
                  <div className="flex justify-between text-xs"><span className="text-neutral-400">Collection Speed</span><span className="text-emerald-400 font-bold">96%</span></div>
                  <div className="flex justify-between text-xs"><span className="text-neutral-400">Customer Trust</span><span className="text-emerald-400 font-bold">98%</span></div>
                  <div className="flex justify-between text-xs"><span className="text-neutral-400">Payment Recovery</span><span className="text-emerald-400 font-bold">94%</span></div>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* TAB 3: SECURITY & TRUST CENTER */}
        {activeTab === 'security' && (
          <div className="space-y-8">
            <div className="bg-white/5 border border-white/10 rounded-3xl p-8 backdrop-blur-xl">
              <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-8 border-b border-white/10 pb-8">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                    <ShieldCheck size={32} />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white">Security Health Score: 100 / 100</h2>
                    <p className="text-neutral-400 text-sm">All enterprise grade authentications and protocols are fully active.</p>
                  </div>
                </div>
                <span className="px-4 py-2 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold text-sm">
                  Fully Secure
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[
                  { title: 'Google Authentication', status: safeProfile.googleConnected, desc: 'OAuth 2.0 Connected securely', toggleable: false },
                  { title: 'Email Verification', status: safeProfile.verifiedEmail, desc: safeProfile.email, toggleable: false },
                  { title: 'Phone Verification', status: safeProfile.verifiedPhone, desc: safeProfile.mobile, toggleable: false },
                  { title: 'Biometric Unlock', status: biometricActive, desc: 'TouchID / Windows Hello active', toggleable: true, setter: setBiometricActive },
                  { title: 'Two Factor Auth (2FA)', status: twoFactorActive, desc: 'Authenticator App enforced', toggleable: true, setter: setTwoFactorActive },
                  { title: 'Face Unlock', status: faceUnlockActive, desc: 'Instant spatial sensor match', toggleable: true, setter: setFaceUnlockActive },
                ].map((sec, idx) => (
                  <div key={idx} className="p-5 rounded-2xl bg-black/40 border border-white/5 flex items-start justify-between">
                    <div>
                      <h3 className="font-bold text-white text-base mb-1">{sec.title}</h3>
                      <p className="text-xs text-neutral-400">{sec.desc}</p>
                    </div>
                    {sec.toggleable ? (
                      <button 
                        onClick={() => {
                          sec.setter(!sec.status);
                          showToast(`${sec.title} status updated.`);
                        }}
                        className={cn("px-3 py-1.5 rounded-xl text-xs font-bold uppercase transition-colors cursor-pointer", sec.status ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30" : "bg-neutral-800 text-neutral-400 border border-white/10 hover:bg-neutral-700")}
                      >
                        {sec.status ? 'Active' : 'Disabled'}
                      </button>
                    ) : (
                      <span className="px-3 py-1.5 rounded-full text-xs font-bold uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        Verified
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-3xl p-8 backdrop-blur-xl">
              <h2 className="text-xl font-bold text-white mb-4">Active Session & Login History</h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-2xl bg-black/40 border border-white/5">
                  <div className="flex items-center gap-4">
                    <Smartphone size={24} className="text-emerald-400" />
                    <div>
                      <div className="font-bold text-white text-sm">{safeProfile.activeDevice}</div>
                      <div className="text-xs text-neutral-400">{safeProfile.lastLogin}</div>
                    </div>
                  </div>
                  <button 
                    onClick={() => showToast("Terminated all other active remote sessions successfully.")}
                    className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-xl text-xs font-semibold transition cursor-pointer"
                  >
                    Terminate Other Sessions
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: VERIFIED DOCUMENTS */}
        {activeTab === 'documents' && (
          <div className="space-y-8">
            <div className="bg-white/5 border border-white/10 rounded-3xl p-8 backdrop-blur-xl">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-bold text-white mb-1">Corporate & Regulatory Documents</h2>
                  <p className="text-neutral-400 text-sm">Securely uploaded and verified documents for financial compliance.</p>
                </div>
                <button 
                  onClick={() => showToast("Document upload wizard initiated...")}
                  className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition shadow-lg cursor-pointer"
                >
                  + Upload New Document
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {documentsList.map((doc) => (
                  <div key={doc.id} className="p-6 rounded-2xl bg-black/40 border border-white/10 flex flex-col justify-between space-y-4 hover:border-emerald-500/30 transition-all">
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <FileText size={24} className="text-emerald-400" />
                        <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-bold">{doc.status}</span>
                      </div>
                      <h3 className="font-bold text-white text-base mb-1">{doc.name}</h3>
                      <p className="text-xs text-neutral-400">Uploaded on {doc.date} • {doc.type}</p>
                    </div>
                    <button 
                      onClick={() => setSelectedDoc(doc)} 
                      className="w-full py-2.5 bg-white/5 hover:bg-white/10 rounded-xl text-xs font-semibold text-white flex items-center justify-center gap-2 transition cursor-pointer"
                    >
                      <Download size={14} /> View / Download PDF
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: THEME CUSTOMIZER */}
        {activeTab === 'customizer' && (
          <div className="space-y-8 max-w-3xl mx-auto">
            <div className="bg-white/5 border border-white/10 rounded-3xl p-8 backdrop-blur-xl space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-white">Theme & Appearance Customizer</h2>
                <p className="text-neutral-400 text-sm">Personalize your SmartLedgerX workspace styling and interface dynamics.</p>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-2">Accent Color Theme</label>
                  <div className="flex gap-4">
                    {[
                      { name: 'emerald', class: 'bg-emerald-500' },
                      { name: 'indigo', class: 'bg-indigo-500' },
                      { name: 'purple', class: 'bg-purple-500' },
                      { name: 'blue', class: 'bg-blue-500' },
                      { name: 'amber', class: 'bg-amber-500' }
                    ].map((col) => (
                      <button 
                        key={col.name} 
                        onClick={() => {
                          setAccentColor(col.name);
                          showToast(`Accent theme updated to ${col.name}!`);
                        }} 
                        className={cn("w-10 h-10 rounded-full border-2 transition hover:scale-110 cursor-pointer", col.class, accentColor === col.name ? "border-white ring-4 ring-white/20" : "border-white/20")} 
                      />
                    ))}
                  </div>
                </div>

                <div className="pt-4 border-t border-white/10 flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-white">AMOLED True Black Mode</h3>
                    <p className="text-xs text-neutral-400">Optimize contrast for OLED screens</p>
                  </div>
                  <input 
                    type="checkbox" 
                    checked={amoledMode} 
                    onChange={e => {
                      setAmoledMode(e.target.checked);
                      showToast(e.target.checked ? "AMOLED Black Mode enabled." : "Standard dark mode enabled.");
                    }}
                    className="w-5 h-5 accent-emerald-500 cursor-pointer" 
                  />
                </div>

                <div className="pt-4 border-t border-white/10 space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-bold text-white">Glassmorphism Intensity</h3>
                      <p className="text-xs text-neutral-400">Frosted glass backdrop blur effect</p>
                    </div>
                    <span className="text-xs font-mono text-emerald-400 font-bold">{glassIntensity}px</span>
                  </div>
                  <input 
                    type="range" 
                    min={10} 
                    max={120} 
                    value={glassIntensity} 
                    onChange={e => setGlassIntensity(Number(e.target.value))}
                    className="w-full accent-emerald-500 cursor-pointer" 
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 6: SMARTLEDGER AI ASSISTANT PANEL */}
        {activeTab === 'ai' && (
          <div className="space-y-8 max-w-4xl mx-auto">
            <div className="bg-gradient-to-br from-indigo-950/50 via-purple-950/40 to-black border border-indigo-500/30 rounded-3xl p-8 backdrop-blur-xl shadow-2xl space-y-6">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shadow-[0_0_25px_rgba(99,102,241,0.5)]">
                  <Sparkles size={28} />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">SmartLedger AI Assistant</h2>
                  <p className="text-indigo-300 text-sm">Ask anything about your cash flow, customer habits, or business forecasts.</p>
                </div>
              </div>

              {/* Suggested Prompts */}
              <div className="flex flex-wrap gap-2">
                {[
                  "Show my highest pending customer.",
                  "Predict next month's income.",
                  "Which customer pays fastest?",
                  "Generate comprehensive business report."
                ].map((prompt, idx) => (
                  <button 
                    key={idx} 
                    onClick={() => handleAiAsk(prompt)}
                    className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-indigo-200 transition cursor-pointer"
                  >
                    "{prompt}"
                  </button>
                ))}
              </div>

              {/* Chat Input */}
              <div className="flex gap-3">
                <input 
                  type="text" 
                  value={aiQuery} 
                  onChange={e => setAiQuery(e.target.value)}
                  onKeyDown={e => { if(e.key === 'Enter') handleAiAsk(aiQuery); }}
                  placeholder="Ask SmartLedger AI..." 
                  className="flex-1 bg-black/50 border border-white/10 rounded-2xl px-5 py-3.5 text-white placeholder-neutral-500 focus:outline-none focus:border-indigo-500 text-sm"
                />
                <button 
                  onClick={() => handleAiAsk(aiQuery)}
                  className="px-6 py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-2xl shadow-lg transition flex items-center gap-2 cursor-pointer"
                >
                  <Sparkles size={18} /> Ask AI
                </button>
              </div>

              {/* AI Response Output */}
              {isAiThinking && (
                <div className="p-6 rounded-2xl bg-black/40 border border-indigo-500/20 flex items-center gap-3 text-indigo-300">
                  <RefreshCw className="animate-spin" size={20} />
                  <span>Gemini AI is analyzing your enterprise ledger data...</span>
                </div>
              )}

              {aiResponse && !isAiThinking && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="p-6 rounded-2xl bg-black/60 border border-indigo-500/30 text-white space-y-2">
                  <div className="flex items-center gap-2 text-indigo-400 font-bold text-xs uppercase tracking-wider">
                    <Sparkles size={14} /> SmartLedger AI Response
                  </div>
                  <p className="text-sm leading-relaxed">{aiResponse}</p>
                </motion.div>
              )}
            </div>
          </div>
        )}

      </div>

      {/* ACHIEVEMENT DETAILS MODAL */}
      <AnimatePresence>
        {selectedAchievement && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-[#121212] border border-white/10 rounded-3xl p-8 max-w-md w-full shadow-2xl space-y-6">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
                  <selectedAchievement.icon size={24} />
                </div>
                <button onClick={() => setSelectedAchievement(null)} className="p-2 text-neutral-400 hover:text-white cursor-pointer"><X size={20} /></button>
              </div>
              <div>
                <h3 className="text-2xl font-bold text-white mb-1">{selectedAchievement.title}</h3>
                <p className="text-sm text-neutral-400 mb-4">{selectedAchievement.desc}</p>
                <div className="p-4 rounded-xl bg-black/40 border border-white/5 space-y-2 text-xs">
                  <div className="flex justify-between"><span className="text-neutral-400">Status</span><span className="text-amber-400 font-bold uppercase">{selectedAchievement.unlocked ? 'Unlocked' : 'Locked'}</span></div>
                  <div className="flex justify-between"><span className="text-neutral-400">Milestone Date</span><span className="text-white font-mono">{selectedAchievement.date}</span></div>
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
                <button onClick={() => setSelectedDoc(null)} className="p-2 text-neutral-400 hover:text-white cursor-pointer"><X size={20} /></button>
              </div>
              <div className="p-6 rounded-2xl bg-black/50 border border-white/10 text-center space-y-3">
                <FileText size={48} className="mx-auto text-emerald-400/60" />
                <div className="text-sm text-neutral-300 font-medium">Verified Compliance Document</div>
                <div className="text-xs text-neutral-500 font-mono">ID: {selectedDoc.id} • {selectedDoc.date}</div>
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
