import React, { useState, useRef } from 'react';
import { motion } from 'motion/react';
import { Settings, Lock, Moon, Database, Upload, Download, CheckCircle2 } from 'lucide-react';
import { useStore } from '../../context/StoreContext';

export default function AdminSettings() {
  const store = useStore();
  const { importData } = store;
  const [currentPass, setCurrentPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [passSuccess, setPassSuccess] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePasswordChange = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPass !== confirmPass) {
      alert("New passwords do not match.");
      return;
    }
    setPassSuccess(true);
    setTimeout(() => {
      setPassSuccess(false);
      setCurrentPass('');
      setNewPass('');
      setConfirmPass('');
    }, 2000);
  };

  const handleBackupDatabase = () => {
    const data = JSON.stringify(store, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `smartledgerx_backup_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleRestoreBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        importData(parsed);
        alert("Database restored successfully from backup.");
      } catch (err) {
        alert("Invalid backup file format.");
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto pb-16">
      <div>
        <h1 className="text-3xl font-bold text-white tracking-tight">Admin Settings</h1>
        <p className="text-neutral-400 text-sm mt-1">Manage administrator credentials, security preferences, and database backups.</p>
      </div>

      {/* Change Password */}
      <div className="bg-white/5 border border-white/10 rounded-3xl p-8 backdrop-blur-xl">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
            <Lock size={20} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Change Admin Password</h2>
            <p className="text-neutral-400 text-sm">Update your secure portal authentication credentials</p>
          </div>
        </div>

        {passSuccess && (
          <div className="mb-6 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm flex items-center gap-3">
            <CheckCircle2 size={18} />
            <span>Admin password changed successfully!</span>
          </div>
        )}

        <form onSubmit={handlePasswordChange} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-1">Current Password</label>
            <input 
              type="password" 
              value={currentPass} 
              onChange={e => setCurrentPass(e.target.value)}
              placeholder="••••••••" 
              required
              className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-1">New Password</label>
            <input 
              type="password" 
              value={newPass} 
              onChange={e => setNewPass(e.target.value)}
              placeholder="••••••••" 
              required
              className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-1">Confirm New Password</label>
            <input 
              type="password" 
              value={confirmPass} 
              onChange={e => setConfirmPass(e.target.value)}
              placeholder="••••••••" 
              required
              className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500"
            />
          </div>
          <button type="submit" className="py-3 px-6 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl transition-colors shadow-lg">
            Update Password
          </button>
        </form>
      </div>

      {/* Database Backup & Restore */}
      <div className="bg-white/5 border border-white/10 rounded-3xl p-8 backdrop-blur-xl">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <Database size={20} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Database Backup & Restore</h2>
            <p className="text-neutral-400 text-sm">Download encrypted JSON backups or restore system state</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button 
            onClick={handleBackupDatabase}
            className="p-5 rounded-2xl bg-black/40 border border-white/10 hover:border-emerald-500/40 text-left transition-all flex items-center gap-4 group"
          >
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform">
              <Download size={24} />
            </div>
            <div>
              <div className="font-bold text-white text-base">Backup Database</div>
              <div className="text-xs text-neutral-400 mt-0.5">Download full JSON snapshot</div>
            </div>
          </button>

          <input 
            type="file" 
            accept=".json" 
            ref={fileInputRef} 
            onChange={handleRestoreBackup} 
            className="hidden" 
          />

          <button 
            onClick={() => fileInputRef.current?.click()}
            className="p-5 rounded-2xl bg-black/40 border border-white/10 hover:border-blue-500/40 text-left transition-all flex items-center gap-4 group"
          >
            <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400 group-hover:scale-110 transition-transform">
              <Upload size={24} />
            </div>
            <div>
              <div className="font-bold text-white text-base">Restore Backup</div>
              <div className="text-xs text-neutral-400 mt-0.5">Upload JSON restore file</div>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
