import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useStore } from '../context/StoreContext';
import { 
  User, Mail, Phone, MapPin, Globe, Building2, BadgeCheck, 
  Calendar, ShieldCheck, Smartphone, Edit3, Share2, Download, 
  Camera, CheckCircle2, ChevronRight, Activity, Clock, Award, Wallet, ArrowUpRight, ArrowDownLeft
} from 'lucide-react';
import { cn } from '../lib/utils';
import { format } from 'date-fns';

export default function Profile() {
  const { userProfile, customers, transactions, updateUserProfile } = useStore();
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState<'personal' | 'business' | 'card'>('personal');
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const safeProfile = userProfile || {
    fullName: 'Rahul Sharma',
    username: 'rahul_smartledger',
    email: 'rahul.sharma@fintech.io',
    mobile: '+91 98765 43210',
    dob: '1992-06-15',
    address: '42, Connaught Place',
    city: 'New Delhi',
    state: 'Delhi',
    country: 'India',
    language: 'English (IN)',
    memberSince: '2024-01-10',
    profilePhoto: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
    businessName: 'Sharma Digital Enterprises',
    businessCategory: 'Fintech & Retail',
    gstNumber: '07AABCS1429B1Z8',
    upiId: 'sharmadigital@okaxis',
    businessAddress: '108, Cyber City, Phase 2',
    website: 'https://sharmadigital.io',
    businessLogo: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=200&auto=format&fit=crop&q=80',
    verifiedEmail: true,
    verifiedPhone: true,
    googleConnected: true,
    lastLogin: 'Today, 10:42 AM',
    activeDevice: 'Chrome on macOS (Secure Session)'
  };

  const safeFormatDate = (dateStr: string | undefined, formatStr: string, fallback = 'Recently') => {
    if (!dateStr) return fallback;
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return format(d, formatStr);
    } catch {
      return dateStr || fallback;
    }
  };

  // Calculate statistics safely
  const totalCustomers = customers ? customers.length : 0;
  const totalTransactions = transactions ? transactions.length : 0;
  const totalReceived = transactions ? transactions.filter(t => t.type === 'received').reduce((sum, t) => sum + (t.amount || 0), 0) : 0;
  const totalPending = transactions ? transactions.filter(t => t.type === 'pending').reduce((sum, t) => sum + (t.amount || 0), 0) : 0;
  const memberSinceDate = safeProfile.memberSince ? new Date(safeProfile.memberSince) : new Date();
  const daysUsing = Math.max(1, Math.floor((new Date().getTime() - (isNaN(memberSinceDate.getTime()) ? new Date().getTime() : memberSinceDate.getTime())) / (1000 * 3600 * 24)));

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        updateUserProfile({ profilePhoto: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.6, staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white pb-24 overflow-x-hidden">
      {/* Dynamic Background Effects */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-600/20 rounded-full blur-[120px] mix-blend-screen animate-pulse" style={{ animationDuration: '8s' }} />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600/20 rounded-full blur-[120px] mix-blend-screen animate-pulse" style={{ animationDuration: '10s' }} />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto px-4 pt-8">
        
        {/* Profile Header */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="relative rounded-3xl bg-white/[0.03] border border-white/10 p-8 mb-8 backdrop-blur-2xl shadow-2xl overflow-hidden group"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 via-transparent to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
          
          <div className="relative flex flex-col md:flex-row items-center gap-8">
            {/* Avatar Profile Photo */}
            <div className="relative">
              <div className="w-32 h-32 rounded-full p-1 bg-gradient-to-tr from-indigo-500 to-purple-500 absolute inset-0 opacity-70 animate-[spin_4s_linear_infinite]" />
              <div className="w-32 h-32 rounded-full p-1 absolute inset-0 bg-gradient-to-bl from-indigo-500 to-purple-500 animate-[spin_3s_linear_infinite_reverse] opacity-50" />
              
              <div className="relative w-32 h-32 rounded-full overflow-hidden bg-neutral-900 border-4 border-[#050505] z-10 group cursor-pointer"
                   onClick={() => fileInputRef.current?.click()}>
                {safeProfile.profilePhoto ? (
                  <img src={safeProfile.profilePhoto} alt="Profile" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-neutral-800 text-neutral-400">
                    <User size={48} />
                  </div>
                )}
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <Camera className="text-white" size={28} />
                </div>
              </div>
              <input type="file" ref={fileInputRef} onChange={handlePhotoUpload} accept="image/*" className="hidden" />
              
              {safeProfile.verifiedEmail && (
                <div className="absolute bottom-0 right-2 w-8 h-8 bg-blue-500 rounded-full border-4 border-[#050505] flex items-center justify-center z-20" title="Verified Account">
                  <BadgeCheck size={16} className="text-white" />
                </div>
              )}
            </div>

            {/* Profile Info */}
            <div className="flex-1 text-center md:text-left">
              <h1 className="text-3xl md:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-white/70 mb-2">
                {safeProfile.fullName}
              </h1>
              <div className="flex flex-col md:flex-row items-center gap-3 text-neutral-400 font-medium mb-4">
                <span className="text-indigo-400">{safeProfile.username}</span>
                <span className="hidden md:block">•</span>
                <span className="flex items-center gap-1"><Building2 size={16} /> {safeProfile.businessName}</span>
              </div>
              
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-4">
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-sm">
                  <Calendar size={14} className="text-neutral-400" />
                  <span>Joined {safeFormatDate(safeProfile.memberSince, 'MMM yyyy', 'Jan 2024')}</span>
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm">
                  <ShieldCheck size={14} />
                  <span>Pro Member</span>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex flex-row md:flex-col gap-3">
              <button 
                onClick={() => setIsEditing(!isEditing)}
                className="flex items-center justify-center gap-2 px-6 py-3 bg-white text-black font-semibold rounded-xl hover:bg-neutral-200 transition-colors shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:scale-105 active:scale-95 duration-200"
              >
                <Edit3 size={18} />
                {isEditing ? 'Save Profile' : 'Edit Profile'}
              </button>
              <button className="flex items-center justify-center gap-2 px-6 py-3 bg-white/5 text-white font-medium rounded-xl hover:bg-white/10 border border-white/10 transition-all hover:scale-105 active:scale-95 duration-200">
                <Share2 size={18} />
                Share
              </button>
            </div>
          </div>
        </motion.div>

        {/* Stats Grid */}
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8"
        >
          <StatCard title="Total Customers" value={totalCustomers} icon={<User className="text-blue-400" />} />
          <StatCard title="Transactions" value={totalTransactions} icon={<Activity className="text-purple-400" />} />
          <StatCard title="Total Received" value={`₹${totalReceived.toLocaleString()}`} icon={<ArrowDownLeft className="text-emerald-400" />} />
          <StatCard title="Total Pending" value={`₹${totalPending.toLocaleString()}`} icon={<ArrowUpRight className="text-rose-400" />} />
        </motion.div>

        {/* Tabs */}
        <div className="flex items-center p-1 bg-white/5 border border-white/10 rounded-2xl mb-8 w-max max-w-full overflow-x-auto mx-auto md:mx-0 backdrop-blur-md">
          {(['personal', 'business', 'card'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                "px-6 py-2.5 rounded-xl font-medium text-sm transition-all duration-300 capitalize relative whitespace-nowrap",
                activeTab === tab ? "text-white" : "text-neutral-400 hover:text-white"
              )}
            >
              {activeTab === tab && (
                <motion.div 
                  layoutId="profile-tab-active"
                  className="absolute inset-0 bg-white/10 rounded-xl border border-white/10"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                />
              )}
              <span className="relative z-10">{tab} Info</span>
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Info Column */}
          <div className="lg:col-span-2 space-y-8">
            <AnimatePresence mode="wait">
              {activeTab === 'personal' && (
                <motion.div 
                  key="personal"
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                  className="bg-white/5 border border-white/10 rounded-3xl p-6 md:p-8 backdrop-blur-xl"
                >
                  <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                    <User className="text-indigo-400" /> Personal Details
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <InfoField label="Full Name" value={safeProfile.fullName} icon={<User size={16} />} isEditing={isEditing} onChange={(val) => updateUserProfile({ fullName: val })} />
                    <InfoField label="Username" value={safeProfile.username} icon={<BadgeCheck size={16} />} isEditing={isEditing} onChange={(val) => updateUserProfile({ username: val })} />
                    <InfoField label="Email Address" value={safeProfile.email} icon={<Mail size={16} />} isEditing={isEditing} onChange={(val) => updateUserProfile({ email: val })} />
                    <InfoField label="Mobile Number" value={safeProfile.mobile} icon={<Phone size={16} />} isEditing={isEditing} onChange={(val) => updateUserProfile({ mobile: val })} />
                    <InfoField label="Date of Birth" value={safeProfile.dob} icon={<Calendar size={16} />} isEditing={isEditing} onChange={(val) => updateUserProfile({ dob: val })} />
                    <InfoField label="Language" value={safeProfile.language} icon={<Globe size={16} />} isEditing={isEditing} onChange={(val) => updateUserProfile({ language: val })} />
                    <div className="md:col-span-2">
                      <InfoField label="Address" value={`${safeProfile.address || ''}, ${safeProfile.city || ''}, ${safeProfile.state || ''}, ${safeProfile.country || ''}`} icon={<MapPin size={16} />} isEditing={isEditing} />
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === 'business' && (
                <motion.div 
                  key="business"
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                  className="bg-white/5 border border-white/10 rounded-3xl p-6 md:p-8 backdrop-blur-xl"
                >
                  <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                    <Building2 className="text-purple-400" /> Business Details
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <InfoField label="Business Name" value={safeProfile.businessName} icon={<Building2 size={16} />} isEditing={isEditing} onChange={(val) => updateUserProfile({ businessName: val })} />
                    <InfoField label="Category" value={safeProfile.businessCategory} icon={<Globe size={16} />} isEditing={isEditing} onChange={(val) => updateUserProfile({ businessCategory: val })} />
                    <InfoField label="GST Number" value={safeProfile.gstNumber || 'Not provided'} icon={<ShieldCheck size={16} />} isEditing={isEditing} onChange={(val) => updateUserProfile({ gstNumber: val })} />
                    <InfoField label="UPI ID" value={safeProfile.upiId} icon={<Wallet size={16} />} isEditing={isEditing} onChange={(val) => updateUserProfile({ upiId: val })} />
                    <div className="md:col-span-2">
                      <InfoField label="Business Address" value={safeProfile.businessAddress} icon={<MapPin size={16} />} isEditing={isEditing} onChange={(val) => updateUserProfile({ businessAddress: val })} />
                    </div>
                    <div className="md:col-span-2">
                      <InfoField label="Website" value={safeProfile.website || 'Not provided'} icon={<Globe size={16} />} isEditing={isEditing} onChange={(val) => updateUserProfile({ website: val })} />
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === 'card' && (
                <motion.div 
                  key="card"
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                  className="flex justify-center"
                >
                  {/* Digital Business Card */}
                  <div className="w-full max-w-sm relative group perspective">
                    <div className="w-full aspect-[9/16] rounded-[2rem] bg-gradient-to-br from-neutral-900 via-[#111] to-black border border-white/10 p-8 shadow-2xl relative overflow-hidden transition-transform duration-500 preserve-3d group-hover:rotate-y-12">
                      <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/20 rounded-full blur-[80px]" />
                      <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500/20 rounded-full blur-[80px]" />
                      
                      <div className="relative z-10 flex flex-col h-full items-center text-center">
                        <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-white/20 mb-6">
                          {safeProfile.profilePhoto ? (
                            <img src={safeProfile.profilePhoto} alt="Profile" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full bg-neutral-800 flex items-center justify-center"><User size={32} /></div>
                          )}
                        </div>
                        <h2 className="text-2xl font-bold text-white mb-1">{safeProfile.fullName}</h2>
                        <p className="text-indigo-400 font-medium mb-6">{safeProfile.businessName}</p>
                        
                        <div className="w-full space-y-4 mb-auto text-sm text-neutral-300">
                          <div className="flex items-center gap-3 bg-white/5 p-3 rounded-xl">
                            <Phone size={18} className="text-neutral-400" />
                            <span>{safeProfile.mobile}</span>
                          </div>
                          <div className="flex items-center gap-3 bg-white/5 p-3 rounded-xl">
                            <Mail size={18} className="text-neutral-400" />
                            <span className="truncate">{safeProfile.email}</span>
                          </div>
                          <div className="flex items-center gap-3 bg-white/5 p-3 rounded-xl">
                            <MapPin size={18} className="text-neutral-400" />
                            <span className="truncate">{safeProfile.city}, {safeProfile.country}</span>
                          </div>
                        </div>

                        {/* QR Code Placeholder */}
                        <div className="mt-8 bg-white p-2 rounded-xl">
                          <div className="w-32 h-32 bg-black/10 rounded-lg flex items-center justify-center border border-dashed border-black/20">
                            <span className="text-black/40 text-xs font-semibold">QR CODE</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <button className="w-full mt-6 py-4 bg-white text-black font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-neutral-200 transition-colors shadow-xl">
                      <Download size={20} /> Download Card
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Right Sidebar */}
          <div className="space-y-8">
            
            {/* Verification Status */}
            <div className="bg-white/5 border border-white/10 rounded-3xl p-6 backdrop-blur-xl">
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                <ShieldCheck className="text-emerald-400" /> Security Status
              </h3>
              <div className="space-y-4">
                <VerificationItem label="Email Verified" status={safeProfile.verifiedEmail} />
                <VerificationItem label="Phone Verified" status={safeProfile.verifiedPhone} />
                <VerificationItem label="Google Account" status={safeProfile.googleConnected} />
                
                <div className="pt-4 border-t border-white/10 mt-4">
                  <div className="flex items-center gap-3 text-sm text-neutral-400 mb-2">
                    <Clock size={16} /> Last Login
                  </div>
                  <p className="text-white font-medium pl-7">{safeFormatDate(safeProfile.lastLogin, 'PPp', 'Today')}</p>
                </div>
                <div>
                  <div className="flex items-center gap-3 text-sm text-neutral-400 mb-2">
                    <Smartphone size={16} /> Active Device
                  </div>
                  <p className="text-white font-medium pl-7">{safeProfile.activeDevice || 'Web Session'}</p>
                </div>
              </div>
            </div>

            {/* Achievements */}
            <div className="bg-white/5 border border-white/10 rounded-3xl p-6 backdrop-blur-xl">
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                <Award className="text-yellow-400" /> Achievements
              </h3>
              <div className="space-y-3">
                <AchievementItem icon="🎯" title="First Collection" date="Jan 2024" />
                <AchievementItem icon="💎" title="₹10K Collected" date="Feb 2024" />
                <AchievementItem icon="🏆" title="Smart Ledger Pro" date="Mar 2024" />
                <button className="w-full mt-2 py-2 text-sm text-indigo-400 hover:text-indigo-300 font-medium flex items-center justify-center gap-1 transition-colors">
                  View All <ChevronRight size={16} />
                </button>
              </div>
            </div>

          </div>

        </div>
      </div>
    </div>
  );
}

// Components

function StatCard({ title, value, icon }: { title: string, value: string | number, icon: React.ReactNode }) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-5 backdrop-blur-md hover:bg-white/10 transition-colors">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center">
          {icon}
        </div>
        <span className="text-neutral-400 text-sm font-medium">{title}</span>
      </div>
      <div className="text-2xl font-bold text-white">{value}</div>
    </div>
  );
}

function InfoField({ label, value, icon, isEditing, onChange }: { label: string, value: string | undefined, icon: React.ReactNode, isEditing: boolean, onChange?: (v: string) => void }) {
  return (
    <div className="bg-black/20 rounded-xl p-4 border border-white/5">
      <div className="flex items-center gap-2 text-neutral-400 text-sm mb-1.5">
        {icon} {label}
      </div>
      {isEditing && onChange ? (
        <input 
          type="text" 
          value={value || ''} 
          onChange={(e) => onChange(e.target.value)}
          className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500 transition-colors"
        />
      ) : (
        <div className="text-white font-medium pl-6">{value || '—'}</div>
      )}
    </div>
  );
}

function VerificationItem({ label, status }: { label: string, status: boolean }) {
  return (
    <div className="flex items-center justify-between p-3 bg-black/20 rounded-xl border border-white/5">
      <span className="text-sm font-medium text-neutral-300">{label}</span>
      {status ? (
        <div className="flex items-center gap-1 text-emerald-400 text-xs font-bold bg-emerald-500/10 px-2 py-1 rounded-full">
          <CheckCircle2 size={14} /> Verified
        </div>
      ) : (
        <div className="flex items-center gap-1 text-neutral-500 text-xs font-bold bg-white/5 px-2 py-1 rounded-full">
          Pending
        </div>
      )}
    </div>
  );
}

function AchievementItem({ icon, title, date }: { icon: string, title: string, date: string }) {
  return (
    <div className="flex items-center gap-4 p-3 bg-black/20 rounded-xl border border-white/5 group hover:bg-white/5 transition-colors">
      <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform shadow-[0_0_15px_rgba(255,255,255,0.05)]">
        {icon}
      </div>
      <div>
        <div className="text-white font-semibold text-sm">{title}</div>
        <div className="text-neutral-500 text-xs">{date}</div>
      </div>
    </div>
  );
}
