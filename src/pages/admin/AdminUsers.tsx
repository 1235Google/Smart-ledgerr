import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Users, Edit3, Trash2, ShieldAlert, CheckCircle2, User, Phone, Mail, X, Wallet, ShieldCheck } from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { cn } from '../../lib/utils';

export default function AdminUsers() {
  const { customers, deleteCustomer, updateCustomer, addCustomer, transactions } = useStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [editingCustomer, setEditingCustomer] = useState<any | null>(null);
  const [viewingLedgerUser, setViewingLedgerUser] = useState<any | null>(null);
  const [isNewUserModal, setIsNewUserModal] = useState(false);

  // New user form state
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newCreditLimit, setNewCreditLimit] = useState(50000);

  const safeCustomers = customers || [
    { id: '1', name: 'Rahul Sharma', phone: '+91 98765 43210', email: 'rahul@sharma.io', creditLimit: 50000, status: 'active' },
    { id: '2', name: 'Priya Verma', phone: '+91 91234 56789', email: 'priya@verma.com', creditLimit: 75000, status: 'active' },
    { id: '3', name: 'Amit Kumar', phone: '+91 99887 76655', email: 'amit@kumar.in', creditLimit: 30000, status: 'suspended' },
  ];

  const filteredCustomers = safeCustomers.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (c.email && c.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (c.phone && c.phone.includes(searchQuery))
  );

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCustomer) return;
    updateCustomer(editingCustomer.id, {
      name: editingCustomer.name,
      phone: editingCustomer.phone,
      email: editingCustomer.email,
      creditLimit: Number(editingCustomer.creditLimit),
    } as any);
    setEditingCustomer(null);
  };

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName) return;
    addCustomer({
      name: newName,
      phone: newPhone || '+91 98765 43210',
      email: newEmail || 'user@smartledger.io',
      creditLimit: Number(newCreditLimit),
    } as any);
    setNewName('');
    setNewPhone('');
    setNewEmail('');
    setIsNewUserModal(false);
  };

  const toggleSuspend = (customer: any) => {
    const newStatus = customer.status === 'suspended' ? 'active' : 'suspended';
    updateCustomer(customer.id, { status: newStatus } as any);
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">User Management</h1>
          <p className="text-neutral-400 text-sm mt-1">Manage registered accounts, credit limits, and statuses.</p>
        </div>
        <button 
          onClick={() => setIsNewUserModal(true)}
          className="px-6 py-3.5 bg-gradient-to-r from-blue-600 to-emerald-500 text-white font-bold rounded-xl shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:opacity-95 transition-all flex items-center justify-center gap-2"
        >
          <Users size={18} /> Add New User
        </button>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-4 backdrop-blur-xl flex items-center gap-4">
        <Search className="text-neutral-500 ml-2" size={20} />
        <input 
          type="text" 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by user name, email, or mobile..." 
          className="w-full bg-transparent border-0 text-white placeholder-neutral-500 focus:outline-none text-base"
        />
      </div>

      {/* Users Table */}
      <div className="bg-white/5 border border-white/10 rounded-3xl overflow-hidden backdrop-blur-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/10 bg-black/40 text-neutral-400 text-xs font-semibold uppercase tracking-wider">
                <th className="py-4 px-6">User</th>
                <th className="py-4 px-6">Contact Info</th>
                <th className="py-4 px-6">Credit Limit</th>
                <th className="py-4 px-6">Status</th>
                <th className="py-4 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredCustomers.length > 0 ? (
                filteredCustomers.map((customer) => {
                  const isSuspended = (customer as any).status === 'suspended';
                  return (
                    <tr key={customer.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-600/20 to-emerald-500/20 border border-white/10 flex items-center justify-center font-bold text-emerald-400">
                            {customer.name ? customer.name.charAt(0).toUpperCase() : 'U'}
                          </div>
                          <div>
                            <div className="font-bold text-white">{customer.name}</div>
                            <div className="text-xs text-neutral-400">ID: USR-{customer.id.substring(0, 6)}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="text-sm text-white flex items-center gap-2"><Phone size={14} className="text-neutral-500" /> {customer.phone || '—'}</div>
                        <div className="text-xs text-neutral-400 flex items-center gap-2 mt-1"><Mail size={14} className="text-neutral-500" /> {customer.email || '—'}</div>
                      </td>
                      <td className="py-4 px-6 font-semibold text-emerald-400">
                        ₹{((customer as any).creditLimit || 50000).toLocaleString()}
                      </td>
                      <td className="py-4 px-6">
                        <span className={cn(
                          "px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider",
                          isSuspended ? "bg-red-500/10 text-red-400 border border-red-500/20" : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                        )}>
                          {isSuspended ? 'Suspended' : 'Active'}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button 
                            onClick={() => setViewingLedgerUser(customer)}
                            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-neutral-300 hover:text-white transition-colors"
                            title="View Ledger"
                          >
                            <Wallet size={18} />
                          </button>
                          <button 
                            onClick={() => setEditingCustomer(customer)}
                            className="p-2 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 transition-colors"
                            title="Edit User"
                          >
                            <Edit3 size={18} />
                          </button>
                          <button 
                            onClick={() => toggleSuspend(customer)}
                            className={cn("p-2 rounded-xl transition-colors", isSuspended ? "bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20" : "bg-amber-500/10 text-amber-400 hover:bg-amber-500/20")}
                            title={isSuspended ? "Unsuspend User" : "Suspend User"}
                          >
                            <ShieldAlert size={18} />
                          </button>
                          <button 
                            onClick={() => { if(confirm(`Delete ${customer.name}?`)) deleteCustomer(customer.id); }}
                            className="p-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-colors"
                            title="Delete User"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={5} className="text-center py-12 text-neutral-500">No users found matching your search.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit User Modal */}
      <AnimatePresence>
        {editingCustomer && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-[#121212] border border-white/10 rounded-3xl p-8 max-w-lg w-full shadow-2xl">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold">Edit User Details</h3>
                <button onClick={() => setEditingCustomer(null)} className="p-2 text-neutral-400 hover:text-white"><X size={20} /></button>
              </div>
              <form onSubmit={handleSaveEdit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-1">Full Name</label>
                  <input 
                    type="text" 
                    value={editingCustomer.name} 
                    onChange={e => setEditingCustomer({ ...editingCustomer, name: e.target.value })}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-1">Mobile Number</label>
                  <input 
                    type="text" 
                    value={editingCustomer.phone} 
                    onChange={e => setEditingCustomer({ ...editingCustomer, phone: e.target.value })}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-1">Email Address</label>
                  <input 
                    type="email" 
                    value={editingCustomer.email} 
                    onChange={e => setEditingCustomer({ ...editingCustomer, email: e.target.value })}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-1">Credit Limit (₹)</label>
                  <input 
                    type="number" 
                    value={editingCustomer.creditLimit || 50000} 
                    onChange={e => setEditingCustomer({ ...editingCustomer, creditLimit: Number(e.target.value) })}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div className="flex gap-3 pt-4">
                  <button type="button" onClick={() => setEditingCustomer(null)} className="flex-1 py-3 bg-white/5 hover:bg-white/10 rounded-xl font-medium">Cancel</button>
                  <button type="submit" className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-500 rounded-xl font-semibold">Save Changes</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* New User Modal */}
      <AnimatePresence>
        {isNewUserModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-[#121212] border border-white/10 rounded-3xl p-8 max-w-lg w-full shadow-2xl">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold">Add New User</h3>
                <button onClick={() => setIsNewUserModal(false)} className="p-2 text-neutral-400 hover:text-white"><X size={20} /></button>
              </div>
              <form onSubmit={handleCreateUser} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-1">Full Name</label>
                  <input 
                    type="text" 
                    value={newName} 
                    onChange={e => setNewName(e.target.value)}
                    placeholder="Enter customer name"
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-1">Mobile Number</label>
                  <input 
                    type="text" 
                    value={newPhone} 
                    onChange={e => setNewPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-1">Email Address</label>
                  <input 
                    type="email" 
                    value={newEmail} 
                    onChange={e => setNewEmail(e.target.value)}
                    placeholder="user@smartledger.io"
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-1">Credit Limit (₹)</label>
                  <input 
                    type="number" 
                    value={newCreditLimit} 
                    onChange={e => setNewCreditLimit(Number(e.target.value))}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div className="flex gap-3 pt-4">
                  <button type="button" onClick={() => setIsNewUserModal(false)} className="flex-1 py-3 bg-white/5 hover:bg-white/10 rounded-xl font-medium">Cancel</button>
                  <button type="submit" className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-500 rounded-xl font-semibold">Create User</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* User Ledger Modal */}
      <AnimatePresence>
        {viewingLedgerUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-[#121212] border border-white/10 rounded-3xl p-8 max-w-2xl w-full shadow-2xl max-h-[80vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-xl font-bold">Ledger Records: {viewingLedgerUser.name}</h3>
                  <p className="text-neutral-400 text-sm">Transaction history for this account</p>
                </div>
                <button onClick={() => setViewingLedgerUser(null)} className="p-2 text-neutral-400 hover:text-white"><X size={20} /></button>
              </div>

              <div className="space-y-3">
                {(transactions && transactions.filter(t => t.personName?.toLowerCase() === viewingLedgerUser.name.toLowerCase()).length > 0) ? (
                  transactions.filter(t => t.personName?.toLowerCase() === viewingLedgerUser.name.toLowerCase()).map((tx, idx) => (
                    <div key={tx.id || idx} className="flex items-center justify-between p-4 bg-black/40 rounded-xl border border-white/5">
                      <div>
                        <div className="font-bold text-white">₹{(tx.amount || 0).toLocaleString()}</div>
                        <div className="text-xs text-neutral-400">{tx.type.toUpperCase()} • {(tx as any).date || 'Today'}</div>
                      </div>
                      <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 font-semibold uppercase">{tx.type}</span>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12 text-neutral-500">No ledger transactions found for {viewingLedgerUser.name}.</div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
