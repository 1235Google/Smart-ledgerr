import React, { useRef } from 'react';
import { useStore } from '../context/StoreContext';
import { User, Upload, CheckCircle } from 'lucide-react';
import { motion } from 'motion/react';

export default function IdentityCard() {
  const { userProfile, updateUserProfile } = useStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const profile = userProfile || { fullName: 'Smart Ledger User', email: 'user@example.com', profilePhoto: '' };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative w-full max-w-[360px] aspect-[1.58] p-6 rounded-[24px] bg-gradient-to-br from-neutral-900 to-neutral-950 border border-white/10 shadow-2xl overflow-hidden"
    >
      {/* Background Glow */}
      <div className="absolute -top-1/2 -right-1/2 w-full h-full bg-indigo-500/10 blur-[100px] rounded-full" />
      <div className="absolute -bottom-1/2 -left-1/2 w-full h-full bg-emerald-500/5 blur-[100px] rounded-full" />

      {/* Content */}
      <div className="relative z-10 h-full flex flex-col justify-between">
        <div className="flex justify-between items-start">
          <div className="text-xl font-bold tracking-widest text-white/90">SMARTLEDGER</div>
          <div className="text-[10px] uppercase tracking-tighter text-indigo-400 font-bold bg-indigo-500/10 px-2 py-1 rounded-full border border-indigo-500/20">PREMIUM</div>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
            <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-indigo-500/30 flex items-center justify-center bg-neutral-800">
              {profile.profilePhoto ? (
                <img src={profile.profilePhoto} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <User size={32} className="text-neutral-500" />
              )}
            </div>
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center rounded-full transition-opacity">
              <Upload size={20} className="text-white" />
            </div>
            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handlePhotoUpload} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              {profile.fullName || 'User'}
              <CheckCircle size={14} className="text-emerald-400" />
            </h3>
            <p className="text-slate-400 text-xs">{profile.email || 'Email'}</p>
          </div>
        </div>

        <div className="flex justify-between items-end">
          <p className="text-sm font-mono tracking-widest text-white/70">•••• •••• •••• 8921</p>
          <div className="w-8 h-6 bg-amber-500/30 rounded border border-amber-500/50 flex items-center justify-center">
            <div className="w-4 h-3 bg-amber-500/50 rounded-sm"></div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
