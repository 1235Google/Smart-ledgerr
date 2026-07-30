import React, { useRef, useState } from 'react';
import { useStore } from '../context/StoreContext';
import { User, Upload, CheckCircle, Shield, RefreshCw, LogOut, Settings as SettingsIcon, AlertCircle } from 'lucide-react';
import { motion } from 'motion/react';
import { auth, db } from '../lib/firebase';
import { updateProfile } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';

export default function IdentityCard() {
  const { userProfile, updateUserProfile, currentUser, logout } = useStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && currentUser) {
      setUploading(true);
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64Data = reader.result as string;
        try {
          await updateProfile(currentUser, { photoURL: base64Data });
          await setDoc(doc(db, 'users', currentUser.uid), { photoURL: base64Data }, { merge: true });
          updateUserProfile({ profilePhoto: base64Data });
        } catch (err) {
          console.error("Failed to upload photo", err);
        } finally {
          setUploading(false);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="w-full flex flex-col md:flex-row gap-6 items-start">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative w-full max-w-sm aspect-[1.58] p-6 rounded-3xl bg-gradient-to-br from-neutral-900 to-black border border-white/10 shadow-2xl shadow-indigo-500/10 overflow-hidden flex-shrink-0"
      >
        {/* Background Glow */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 blur-[80px] rounded-full pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/10 blur-[80px] rounded-full pointer-events-none" />

        {/* Content */}
        <div className="relative z-10 h-full flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <div className="flex flex-col">
              <span className="text-xl font-bold tracking-widest text-white">SMARTLEDGER</span>
              <span className="text-[10px] text-slate-500 tracking-widest">IDENTITY CARD</span>
            </div>
            {currentUser && (
              <div className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
                <Shield size={12} className="text-emerald-400" />
                <span className="text-[10px] font-bold text-emerald-400 tracking-wider">SECURE</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-5">
            <div className="relative group cursor-pointer" onClick={() => !uploading && fileInputRef.current?.click()}>
              <div className="w-20 h-20 rounded-2xl overflow-hidden border border-white/10 flex items-center justify-center bg-white/5 shadow-inner">
                {userProfile?.profilePhoto ? (
                  <img src={userProfile.profilePhoto} alt="Profile" className={`w-full h-full object-cover transition-opacity ${uploading ? 'opacity-50' : ''}`} />
                ) : (
                  <User size={32} className="text-neutral-500" />
                )}
              </div>
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center rounded-2xl transition-opacity">
                {uploading ? (
                  <RefreshCw size={20} className="text-white animate-spin" />
                ) : (
                  <Upload size={20} className="text-white" />
                )}
              </div>
              <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handlePhotoUpload} />
            </div>
            <div className="flex flex-col">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                {userProfile?.fullName || 'User'}
                {currentUser?.emailVerified && <CheckCircle size={14} className="text-blue-400" />}
              </h3>
              <p className="text-slate-400 text-sm mb-1">{userProfile?.email || 'No email'}</p>
            </div>
          </div>

          <div className="flex justify-between items-end mt-4 pt-4 border-t border-white/10">
            <div className="flex flex-col">
              <span className="text-[10px] text-slate-500 font-medium">UID</span>
              <span className="text-xs font-mono tracking-widest text-white/70">
                {currentUser?.uid?.substring(0, 12) || 'N/A'}...
              </span>
            </div>
            <div className="w-10 h-7 bg-gradient-to-br from-yellow-400/20 to-amber-600/20 rounded border border-amber-500/30 flex items-center justify-center">
              <div className="w-5 h-4 bg-gradient-to-br from-yellow-400/40 to-amber-600/40 rounded-sm"></div>
            </div>
          </div>
        </div>
      </motion.div>

      <div className="flex-1 flex flex-col gap-4 w-full">
        <div className="bg-white/5 border border-white/10 rounded-2xl p-5 w-full">
          <h4 className="text-sm font-semibold text-white mb-4">Account Details</h4>
          <div className="space-y-3">
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-400">Status</span>
              <span className="text-emerald-400 flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" /> Connected</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-400">Provider</span>
              <span className="text-white capitalize">{currentUser?.providerData[0]?.providerId.split('.')[0] || 'Email'}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-400">Created</span>
              <span className="text-white">{currentUser?.metadata.creationTime ? new Date(currentUser.metadata.creationTime).toLocaleDateString() : 'N/A'}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-400">Last Login</span>
              <span className="text-white">{currentUser?.metadata.lastSignInTime ? new Date(currentUser.metadata.lastSignInTime).toLocaleDateString() : 'N/A'}</span>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-3 w-full">
          <button className="flex items-center justify-center gap-2 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-sm font-medium text-white transition-colors">
            <SettingsIcon size={16} /> Manage Account
          </button>
          <button className="flex items-center justify-center gap-2 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-sm font-medium text-white transition-colors" onClick={() => currentUser?.reload()}>
            <RefreshCw size={16} /> Refresh Profile
          </button>
          <button onClick={logout} className="col-span-2 flex items-center justify-center gap-2 py-3 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded-xl text-sm font-medium text-red-400 transition-colors mt-1">
            <LogOut size={16} /> Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}
