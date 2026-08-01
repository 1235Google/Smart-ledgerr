import React, { useRef, useState } from 'react';
import { useStore } from '../context/StoreContext';
import { User, CheckCircle, Shield, RefreshCw, LogOut, Settings as SettingsIcon } from 'lucide-react';
import { motion } from 'motion/react';
import { auth, db } from '../lib/firebase';
import { updateProfile } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';

export default function IdentityCard() {
  const { userProfile, updateUserProfile, currentUser, logout } = useStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [isFlipped, setIsFlipped] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const cardRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    setMousePosition({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

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

  React.useEffect(() => {
    const interval = setInterval(() => setIsFlipped(prev => !prev), 4800);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full flex flex-col md:flex-row gap-8 items-start">
      <motion.div 
        className="w-full max-w-sm mx-auto animate-float"
        ref={cardRef} 
        onMouseMove={handleMouseMove} 
        onMouseLeave={() => setMousePosition({ x: -1000, y: -1000 })}
        whileHover={{ scale: 1.02 }}
      >
        <div className="relative w-full aspect-[1.58] perspective-1000 group cursor-pointer">
          <div className="absolute -inset-[2px] rounded-[30px] bg-gradient-to-r from-amber-500 via-purple-500 to-cyan-500 opacity-50 blur-[4px] group-hover:opacity-100 transition duration-1000 animate-spin-slow" />
          <motion.div 
            className="w-full h-full relative preserve-3d"
            animate={{ rotateY: isFlipped ? 180 : 0 }}
            transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
          >
            {/* Front Side */}
            <div className="absolute inset-0 backface-hidden rounded-[28px] bg-neutral-950/80 backdrop-blur-3xl border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden">
              <div className="absolute inset-0 bg-[conic-gradient(from_0deg_at_50%_50%,rgba(120,50,250,0.1),transparent_30%,rgba(50,150,250,0.1),transparent_60%,rgba(120,50,250,0.1))]" />
              <div className="relative h-full p-7 flex flex-col justify-between">
                <div className="flex justify-between items-start">
                  <div className="flex flex-col">
                    <span className="text-xl font-bold tracking-[0.2em] text-transparent bg-clip-text bg-gradient-to-r from-white to-neutral-400">SMARTLEDGER</span>
                    <span className="text-[10px] text-slate-500 tracking-[0.3em] uppercase">Premium Diamond Member</span>
                  </div>
                  <div className="flex items-center gap-1.5 px-3 py-1 bg-amber-500/10 border border-amber-500/20 rounded-full backdrop-blur-sm">
                    <Shield size={10} className="text-amber-400" />
                    <span className="text-[9px] font-bold text-amber-400 tracking-wider">DIAMOND</span>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-20 h-20 rounded-2xl overflow-hidden border border-white/10 bg-neutral-900 flex items-center justify-center cursor-pointer hover:scale-105 transition-transform" onClick={() => !uploading && fileInputRef.current?.click()}>
                      {uploading ? <RefreshCw className="animate-spin text-white" /> : userProfile?.profilePhoto ? <img src={userProfile.profilePhoto} alt="Profile" className="w-full h-full object-cover" /> : <User size={30} className="text-neutral-500" />}
                      <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handlePhotoUpload} />
                  </div>
                  <div className="flex flex-col">
                    <h3 className="text-lg font-bold text-white">{userProfile?.fullName || 'Member'}</h3>
                    <p className="text-slate-400 text-xs tracking-wide">{userProfile?.email || 'No email'}</p>
                  </div>
                </div>
              </div>
            </div>
            {/* Back Side */}
            <div className="absolute inset-0 backface-hidden rounded-[28px] bg-neutral-950/80 backdrop-blur-3xl border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col items-center justify-center p-8" style={{ transform: 'rotateY(180deg)' }}>
              <div className="text-xl font-bold tracking-[0.3em] text-neutral-300">SMARTLEDGER</div>
              <div className="w-24 h-24 bg-gradient-to-br from-amber-500/10 to-purple-500/10 rounded-xl flex items-center justify-center my-6 rotate-45 border border-amber-500/10">
                  <div className="text-xs text-amber-500/50 -rotate-45 tracking-widest uppercase">Secured</div>
              </div>
              <div className="text-[10px] text-neutral-500 tracking-[0.3em] uppercase">Diamond Verified Member</div>
            </div>
          </motion.div>
        </div>
      </motion.div>

      <div className="flex-1 flex flex-col gap-5 w-full">
        <div className="grid grid-cols-2 gap-4 w-full">
            <StatCard label="Status" value="Connected" icon="pulse" />
            <StatCard label="Provider" value={currentUser?.providerData[0]?.providerId.split('.')[0] || 'Email'} />
            <StatCard label="Created" value={currentUser?.metadata.creationTime ? new Date(currentUser.metadata.creationTime).toLocaleDateString() : 'N/A'} />
            <StatCard label="Last Login" value={currentUser?.metadata.lastSignInTime ? new Date(currentUser.metadata.lastSignInTime).toLocaleDateString() : 'N/A'} />
        </div>
        <div className="grid grid-cols-2 gap-4 w-full mt-2">
          <Button variant="secondary" onClick={() => {}} icon={SettingsIcon}>Manage</Button>
          <Button variant="secondary" onClick={() => currentUser?.reload()} icon={RefreshCw}>Refresh</Button>
          <Button variant="danger" onClick={logout} className="col-span-2" icon={LogOut}>Sign Out</Button>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon }: { label: string, value: string, icon?: string }) {
    return (
        <div className="bg-neutral-900/50 backdrop-blur-xl border border-white/5 rounded-2xl p-5 shadow-sm flex flex-col gap-1 hover:border-white/10 transition-colors">
            <span className="text-[10px] text-slate-500 uppercase tracking-widest">{label}</span>
            <span className="text-sm text-white font-semibold flex items-center gap-2">
                {icon === 'pulse' && <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />}
                {value}
            </span>
        </div>
    )
}

function Button({ variant = 'secondary', onClick, icon: Icon, children, className = '' }: any) {
    const base = "flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium transition-all duration-300 hover:scale-[1.02] hover:shadow-lg";
    const variants = {
        secondary: "bg-neutral-900/50 hover:bg-neutral-800 border border-white/5 text-white hover:shadow-white/5",
        danger: "bg-red-950/20 hover:bg-red-950/40 border border-red-900/20 text-red-400 hover:shadow-red-900/10"
    };
    return <button onClick={onClick} className={`${base} ${variants[variant]} ${className}`}>{Icon && <Icon size={16} />} {children}</button>
}

