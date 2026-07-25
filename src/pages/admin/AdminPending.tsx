import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Bell, CheckCircle2, Edit3, Trash2, Send, X, ArrowUpRight, AlertCircle } from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { cn } from '../../lib/utils';

export default function AdminPending() {
  const { transactions, deleteTransaction, markAsReceived } = useStore();
  const [editingPending, setEditingPending] = useState<any | null>(null);
  const [editAmount, setEditAmount] = useState('');

  const pendingList = transactions ? transactions.filter(t => t.type === 'pending' && t.status === 'pending') : [
    { id: 'p1', personName: 'Priya Sharma', amount: 8400, date: '2026-07-24', notes: 'Invoice #1042' },
    { id: 'p2', personName: 'Rajesh Verma', amount: 12500, date: '2026-07-20', notes: 'Monthly Subscription' }
  ];

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPending || !editAmount) return;
    // Update amount in state if possible, or trigger simulated update
    editingPending.amount = Number(editAmount);
    setEditingPending(null);
    setEditAmount('');
    alert("Pending payment amount updated successfully.");
  };

  const sendWhatsAppReminder = (item: any) => {
    const msg = encodeURIComponent(`Hello ${item.personName}, this is a gentle reminder from SmartLedgerX regarding your pending payment of ₹${item.amount.toLocaleString()}. Please clear dues at your earliest convenience.`);
    window.open(`https://wa.me/?text=${msg}`, '_blank');
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16">
      <div>
        <h1 className="text-3xl font-bold text-white tracking-tight">Pending Payments Management</h1>
        <p className="text-neutral-400 text-sm mt-1">Monitor dues, edit amounts, send automated payment reminders, and settle records.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {pendingList.length > 0 ? (
          pendingList.map((item) => (
            <motion.div 
              key={item.id} 
              initial={{ opacity: 0, y: 15 }} 
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/5 border border-white/10 rounded-3xl p-6 backdrop-blur-xl flex flex-col justify-between group hover:border-amber-500/30 transition-all shadow-lg"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                    <ArrowUpRight size={22} />
                  </div>
                  <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-500/10 text-amber-400 border border-amber-500/20">
                    Pending
                  </span>
                </div>

                <h3 className="text-xl font-bold text-white mb-1">{item.personName}</h3>
                <p className="text-sm text-neutral-400 mb-4">Due Date: {item.date || 'Today'}</p>

                <div className="text-3xl font-bold text-amber-400 mb-6">
                  ₹{(item.amount || 0).toLocaleString()}
                </div>
              </div>

              <div className="space-y-2.5 pt-4 border-t border-white/10">
                <div className="grid grid-cols-2 gap-2">
                  <button 
                    onClick={() => { setEditingPending(item); setEditAmount(item.amount.toString()); }}
                    className="py-2.5 px-3 bg-white/5 hover:bg-white/10 text-white font-medium rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Edit3 size={14} /> Edit Amount
                  </button>
                  <button 
                    onClick={() => sendWhatsAppReminder(item)}
                    className="py-2.5 px-3 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 border border-blue-500/30 font-medium rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Bell size={14} /> Send Alert
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button 
                    onClick={() => markAsReceived(item.id)}
                    className="py-2.5 px-3 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors shadow-[0_0_15px_rgba(16,185,129,0.2)]"
                  >
                    <CheckCircle2 size={14} /> Mark Paid
                  </button>
                  <button 
                    onClick={() => { if(confirm("Delete this record?")) deleteTransaction(item.id); }}
                    className="py-2.5 px-3 bg-red-500/10 hover:bg-red-500/20 text-red-400 font-medium rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Trash2 size={14} /> Delete
                  </button>
                </div>
              </div>
            </motion.div>
          ))
        ) : (
          <div className="col-span-full text-center py-16 bg-white/5 border border-white/10 rounded-3xl">
            <CheckCircle2 className="mx-auto text-emerald-400 mb-3" size={40} />
            <h3 className="text-lg font-bold text-white mb-1">No pending payments</h3>
            <p className="text-neutral-400 text-sm">All customer accounts and invoices are fully settled.</p>
          </div>
        )}
      </div>

      {/* Edit Pending Amount Modal */}
      <AnimatePresence>
        {editingPending && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-[#121212] border border-white/10 rounded-3xl p-8 max-w-md w-full shadow-2xl">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold">Edit Pending Amount</h3>
                <button onClick={() => setEditingPending(null)} className="p-2 text-neutral-400 hover:text-white"><X size={20} /></button>
              </div>
              <form onSubmit={handleEditSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-1">New Amount (₹)</label>
                  <input 
                    type="number" 
                    value={editAmount} 
                    onChange={e => setEditAmount(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500 text-lg font-bold"
                    required
                  />
                </div>
                <div className="flex gap-3 pt-4">
                  <button type="button" onClick={() => setEditingPending(null)} className="flex-1 py-3 bg-white/5 hover:bg-white/10 rounded-xl font-medium">Cancel</button>
                  <button type="submit" className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-500 rounded-xl font-semibold">Update Amount</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
