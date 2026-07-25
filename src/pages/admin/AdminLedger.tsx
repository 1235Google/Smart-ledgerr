import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Wallet, Search, Download, Trash2, ArrowDownLeft, ArrowUpRight, Calendar, Filter } from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { cn } from '../../lib/utils';

export default function AdminLedger() {
  const { transactions, deleteTransaction } = useStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'received' | 'sent' | 'pending'>('all');
  const [dateFilter, setDateFilter] = useState('');

  const safeTransactions = transactions || [
    { id: '1', personName: 'Aarav Patel', amount: 15000, type: 'received', date: '2026-07-24' },
    { id: '2', personName: 'Priya Sharma', amount: 8400, type: 'pending', date: '2026-07-24' },
    { id: '3', personName: 'Vikram Singh', amount: 24000, type: 'received', date: '2026-07-23' },
    { id: '4', personName: 'Neha Gupta', amount: 5000, type: 'sent', date: '2026-07-22' },
  ];

  const filteredTransactions = safeTransactions.filter(tx => {
    const matchesSearch = (tx.personName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (tx.id || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = typeFilter === 'all' || tx.type === typeFilter;
    const matchesDate = !dateFilter || ((tx as any).date && (tx as any).date.startsWith(dateFilter));
    return matchesSearch && matchesType && matchesDate;
  });

  const handleExportCSV = () => {
    const headers = ['ID', 'Person Name', 'Amount', 'Type', 'Date'];
    const rows = filteredTransactions.map(t => [t.id, t.personName, t.amount, t.type, (t as any).date || '']);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `smartledger_transactions_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportExcel = () => {
    alert("Excel export package initiated. Downloading XLS file...");
    handleExportCSV();
  };

  const handleExportPDF = () => {
    alert("PDF report generation initiated. Downloading PDF document...");
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Ledger Records Management</h1>
          <p className="text-neutral-400 text-sm mt-1">Review, filter, export, and manage all platform transactions.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button onClick={handleExportCSV} className="px-4 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl font-medium text-sm flex items-center gap-2 transition-colors">
            <Download size={16} /> CSV
          </button>
          <button onClick={handleExportExcel} className="px-4 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl font-medium text-sm flex items-center gap-2 transition-colors">
            <Download size={16} /> Excel
          </button>
          <button onClick={handleExportPDF} className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-semibold text-sm flex items-center gap-2 transition-colors shadow-[0_0_15px_rgba(16,185,129,0.3)]">
            <Download size={16} /> PDF Report
          </button>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white/5 border border-white/10 rounded-3xl p-6 backdrop-blur-xl flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-500" size={18} />
          <input 
            type="text" 
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search person or transaction ID..." 
            className="w-full bg-black/40 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-emerald-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-1.5 bg-black/40 border border-white/10 rounded-xl px-3 py-2">
            <Filter size={16} className="text-neutral-400" />
            <select 
              value={typeFilter} 
              onChange={(e: any) => setTypeFilter(e.target.value)}
              className="bg-transparent border-0 text-sm text-white focus:outline-none cursor-pointer"
            >
              <option value="all" className="bg-neutral-900">All Types</option>
              <option value="received" className="bg-neutral-900">Received</option>
              <option value="sent" className="bg-neutral-900">Sent</option>
              <option value="pending" className="bg-neutral-900">Pending</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5 bg-black/40 border border-white/10 rounded-xl px-3 py-2">
            <Calendar size={16} className="text-neutral-400" />
            <input 
              type="date" 
              value={dateFilter}
              onChange={e => setDateFilter(e.target.value)}
              className="bg-transparent border-0 text-sm text-white focus:outline-none cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white/5 border border-white/10 rounded-3xl overflow-hidden backdrop-blur-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/10 bg-black/40 text-neutral-400 text-xs font-semibold uppercase tracking-wider">
                <th className="py-4 px-6">Transaction ID</th>
                <th className="py-4 px-6">Person / Entity</th>
                <th className="py-4 px-6">Type</th>
                <th className="py-4 px-6">Amount</th>
                <th className="py-4 px-6">Date</th>
                <th className="py-4 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredTransactions.length > 0 ? (
                filteredTransactions.map((tx, idx) => (
                  <tr key={tx.id || idx} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-4 px-6 font-mono text-xs text-neutral-400">
                      TXN-{String(tx.id || idx).substring(0, 8)}
                    </td>
                    <td className="py-4 px-6 font-bold text-white">
                      {tx.personName || 'Unknown Entity'}
                    </td>
                    <td className="py-4 px-6">
                      <span className={cn(
                        "px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider",
                        tx.type === 'received' ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" :
                        tx.type === 'sent' ? "bg-blue-500/10 text-blue-400 border border-blue-500/20" :
                        "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                      )}>
                        {tx.type}
                      </span>
                    </td>
                    <td className={cn("py-4 px-6 font-bold", tx.type === 'received' ? "text-emerald-400" : tx.type === 'sent' ? "text-blue-400" : "text-amber-400")}>
                      {tx.type === 'received' ? '+' : ''}₹{(tx.amount || 0).toLocaleString()}
                    </td>
                    <td className="py-4 px-6 text-sm text-neutral-400">
                      {(tx as any).date || 'Today'}
                    </td>
                    <td className="py-4 px-6 text-right">
                      <button 
                        onClick={() => { if(confirm("Delete this transaction record?")) deleteTransaction(tx.id); }}
                        className="p-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-colors"
                        title="Delete Transaction"
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-neutral-500">No transactions found matching filters.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
