import React from 'react';
import { motion } from 'motion/react';
import { 
  Users, Wallet, ArrowDownLeft, ArrowUpRight, Bell, Activity, 
  TrendingUp, ShieldCheck, CheckCircle2, Clock, Calendar 
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { cn } from '../../lib/utils';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

export default function AdminDashboard() {
  const { customers, transactions } = useStore();

  const totalUsers = customers ? customers.length : 1240;
  const totalTransactions = transactions ? transactions.length : 4820;
  
  const pendingTransactions = transactions ? transactions.filter(t => t.type === 'pending' && t.status === 'pending') : [];
  const totalPending = pendingTransactions.reduce((sum, t) => sum + (t.amount || 0), 0);

  const receivedToday = transactions ? transactions.filter(t => t.type === 'received').reduce((sum, t) => sum + (t.amount || 0), 0) : 14500;

  // Monthly revenue mock data for Recharts
  const monthlyData = [
    { month: 'Jan', revenue: 45000, users: 820 },
    { month: 'Feb', revenue: 62000, users: 940 },
    { month: 'Mar', revenue: 88000, users: 1100 },
    { month: 'Apr', revenue: 75000, users: 1180 },
    { month: 'May', revenue: 125000, users: 1350 },
    { month: 'Jun', revenue: 156000, users: 1520 },
    { month: 'Jul', revenue: 198000, users: 1780 },
  ];

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16">
      {/* Top Welcome Banner */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-3xl bg-gradient-to-r from-blue-900/20 via-emerald-900/20 to-black border border-white/10 p-8 backdrop-blur-2xl relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-[100px] pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 text-emerald-400 font-semibold text-xs tracking-wider uppercase mb-2">
              <ShieldCheck size={16} /> Secure Admin Control Center
            </div>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-white mb-2">
              Dashboard Overview
            </h1>
            <p className="text-neutral-400 text-sm max-w-xl">
              Real-time monitoring of SmartLedgerX financial transactions, user accounts, and pending settlements.
            </p>
          </div>
          <div className="flex items-center gap-3 bg-black/40 border border-white/10 px-5 py-3 rounded-2xl backdrop-blur-md">
            <Calendar className="text-emerald-400" size={20} />
            <div>
              <div className="text-xs text-neutral-400">System Status</div>
              <div className="text-sm font-semibold text-emerald-400 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" /> All Systems Normal
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Stats Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Total Users" 
          value={totalUsers.toLocaleString()} 
          change="+12.4% this month" 
          isPositive={true}
          icon={<Users className="text-blue-400" size={24} />} 
        />
        <StatCard 
          title="Total Transactions" 
          value={totalTransactions.toLocaleString()} 
          change="+8.2% this week" 
          isPositive={true}
          icon={<Activity className="text-purple-400" size={24} />} 
        />
        <StatCard 
          title="Total Pending Payments" 
          value={`₹${totalPending.toLocaleString()}`} 
          change="34 active records" 
          isPositive={false}
          icon={<ArrowUpRight className="text-amber-400" size={24} />} 
        />
        <StatCard 
          title="Money Received Today" 
          value={`₹${receivedToday.toLocaleString()}`} 
          change="+18.5% vs yesterday" 
          isPositive={true}
          icon={<ArrowDownLeft className="text-emerald-400" size={24} />} 
        />
      </div>

      {/* Analytics & Graph Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white/5 border border-white/10 rounded-3xl p-6 md:p-8 backdrop-blur-xl">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-white">Monthly Revenue Growth</h2>
              <p className="text-neutral-400 text-sm">Financial throughput across all ledger categories</p>
            </div>
            <div className="px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
              Live Data
            </div>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyData}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="month" stroke="#737373" strokeWidth={1} />
                <YAxis stroke="#737373" strokeWidth={1} tickFormatter={(v) => `₹${v/1000}k`} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#121212', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '1rem', color: '#fff' }}
                  formatter={(value: any) => [`₹${Number(value).toLocaleString()}`, 'Revenue']}
                />
                <Area type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pending Reminders & Quick Status */}
        <div className="bg-white/5 border border-white/10 rounded-3xl p-6 md:p-8 backdrop-blur-xl flex flex-col justify-between">
          <div>
            <h2 className="text-xl font-bold text-white mb-2">Reminder Manager</h2>
            <p className="text-neutral-400 text-sm mb-6">Active automated payment follow-ups</p>

            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-black/40 border border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                    <Bell size={20} />
                  </div>
                  <div>
                    <div className="text-sm font-semibold">Pending Reminders</div>
                    <div className="text-xs text-neutral-400">{pendingTransactions.length} scheduled alerts</div>
                  </div>
                </div>
                <span className="text-amber-400 font-bold text-lg">{pendingTransactions.length}</span>
              </div>

              <div className="p-4 rounded-2xl bg-black/40 border border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                    <CheckCircle2 size={20} />
                  </div>
                  <div>
                    <div className="text-sm font-semibold">Completed Collections</div>
                    <div className="text-xs text-neutral-400">98.4% success rate</div>
                  </div>
                </div>
                <span className="text-emerald-400 font-bold text-lg">142</span>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-white/10">
            <button 
              onClick={() => alert("Bulk reminder notification dispatch initiated.")}
              className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl transition-colors shadow-[0_0_20px_rgba(16,185,129,0.2)] text-sm"
            >
              Trigger All Pending Reminders
            </button>
          </div>
        </div>
      </div>

      {/* Recent Activities Section */}
      <div className="bg-white/5 border border-white/10 rounded-3xl p-6 md:p-8 backdrop-blur-xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-white">Recent System Activities</h2>
            <p className="text-neutral-400 text-sm">Latest ledger updates and user actions</p>
          </div>
          <button onClick={() => alert("Exporting audit logs...")} className="text-sm text-emerald-400 hover:text-emerald-300 font-semibold">
            View All Logs →
          </button>
        </div>

        <div className="space-y-3">
          {(transactions && transactions.length > 0 ? transactions.slice(0, 5) : [
            { id: '1', personName: 'Aarav Patel', amount: 15000, type: 'received', date: '2026-07-24' },
            { id: '2', personName: 'Priya Sharma', amount: 8400, type: 'pending', date: '2026-07-24' },
            { id: '3', personName: 'Vikram Singh', amount: 24000, type: 'received', date: '2026-07-23' },
          ]).map((tx, idx) => (
            <div key={tx.id || idx} className="flex items-center justify-between p-4 rounded-2xl bg-black/40 border border-white/5 hover:border-white/10 transition-colors">
              <div className="flex items-center gap-4">
                <div className={cn(
                  "w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-lg",
                  tx.type === 'received' ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                )}>
                  {tx.type === 'received' ? <ArrowDownLeft size={22} /> : <ArrowUpRight size={22} />}
                </div>
                <div>
                  <div className="font-bold text-white text-base">{tx.personName}</div>
                  <div className="text-xs text-neutral-400">Transaction ID: TXN-{Math.floor(100000 + Math.random() * 900000)} • {tx.date || 'Today'}</div>
                </div>
              </div>
              <div className="text-right">
                <div className={cn("font-bold text-base", tx.type === 'received' ? "text-emerald-400" : "text-amber-400")}>
                  {tx.type === 'received' ? '+' : ''}₹{(tx.amount || 0).toLocaleString()}
                </div>
                <div className="text-xs uppercase tracking-wider text-neutral-500 font-semibold">
                  {tx.type}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, change, isPositive, icon }: { title: string, value: string, change: string, isPositive: boolean, icon: React.ReactNode }) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-3xl p-6 backdrop-blur-xl relative overflow-hidden group hover:border-white/20 transition-all">
      <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl group-hover:bg-emerald-500/10 transition-colors" />
      <div className="flex items-center justify-between mb-4">
        <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
          {icon}
        </div>
        <span className={cn("text-xs font-bold px-2.5 py-1 rounded-full", isPositive ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-amber-500/10 text-amber-400 border border-amber-500/20")}>
          {change}
        </span>
      </div>
      <div className="text-neutral-400 text-sm font-medium mb-1">{title}</div>
      <div className="text-3xl font-bold text-white tracking-tight">{value}</div>
    </div>
  );
}
