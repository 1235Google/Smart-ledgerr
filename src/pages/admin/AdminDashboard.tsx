import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Users, Wallet, ArrowDownLeft, ArrowUpRight, Bell, Activity, 
  TrendingUp, ShieldCheck, CheckCircle2, Clock, Calendar, Search, 
  Sparkles, Download, ArrowRight, RefreshCw, Zap, Server, Database, 
  MessageSquare, Cpu, CreditCard, Mail, Globe, CloudSun, Lock, 
  ChevronRight, Plus, Filter, Eye, FileText, Check, AlertCircle, UserCheck, 
  Sliders, HardDrive, BarChart3, PieChart, Flame
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { cn } from '../../lib/utils';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts';
import * as XLSX from 'xlsx';

export default function AdminDashboard() {
  const { customers, transactions } = useStore();
  const [timeRange, setTimeRange] = useState<'7D' | '30D' | '90D' | '1Y'>('30D');
  const [searchOpen, setSearchOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Keyboard shortcut for search (Ctrl + K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const showNotification = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  };

  const totalUsers = customers && customers.length > 0 ? customers.length : 8420;
  const totalTransactions = transactions && transactions.length > 0 ? transactions.length : 4820;
  const pendingTransactions = transactions ? transactions.filter(t => t.type === 'pending' && t.status === 'pending') : [];
  const totalPending = pendingTransactions.reduce((sum, t) => sum + (t.amount || 0), 0) || 15200;
  const receivedToday = transactions ? transactions.filter(t => t.type === 'received').reduce((sum, t) => sum + (t.amount || 0), 0) : 24500;

  // Chart data based on timeRange
  const chartDataMap = {
    '7D': [
      { day: 'Mon', revenue: 18000, collection: 15000, profit: 6200, expenses: 8000 },
      { day: 'Tue', revenue: 22000, collection: 19000, profit: 8400, expenses: 7500 },
      { day: 'Wed', revenue: 19500, collection: 17000, profit: 7100, expenses: 9000 },
      { day: 'Thu', revenue: 24500, collection: 21000, profit: 9200, expenses: 8200 },
      { day: 'Fri', revenue: 28000, collection: 24500, profit: 11500, expenses: 8500 },
      { day: 'Sat', revenue: 31000, collection: 29000, profit: 13200, expenses: 9200 },
      { day: 'Sun', revenue: 26000, collection: 23000, profit: 10100, expenses: 7800 },
    ],
    '30D': [
      { day: 'W1', revenue: 145000, collection: 130000, profit: 54000, expenses: 42000 },
      { day: 'W2', revenue: 168000, collection: 152000, profit: 65000, expenses: 45000 },
      { day: 'W3', revenue: 192000, collection: 178000, profit: 78000, expenses: 48000 },
      { day: 'W4', revenue: 215000, collection: 198000, profit: 89000, expenses: 51000 },
    ],
    '90D': [
      { day: 'Month 1', revenue: 580000, collection: 520000, profit: 210000, expenses: 150000 },
      { day: 'Month 2', revenue: 640000, collection: 590000, profit: 245000, expenses: 162000 },
      { day: 'Month 3', revenue: 720000, collection: 680000, profit: 290000, expenses: 175000 },
    ],
    '1Y': [
      { day: 'Q1', revenue: 1800000, collection: 1650000, profit: 720000, expenses: 480000 },
      { day: 'Q2', revenue: 2100000, collection: 1950000, profit: 880000, expenses: 520000 },
      { day: 'Q3', revenue: 2450000, collection: 2300000, profit: 1050000, expenses: 590000 },
      { day: 'Q4', revenue: 2900000, collection: 2750000, profit: 1280000, expenses: 640000 },
    ]
  };

  const activeChartData = chartDataMap[timeRange];

  const reportsList = [
    { title: 'Pending Payments.xlsx', desc: 'Active overdue collections & risk scores', records: 34, size: '48 KB', lastGen: 'Today, 04:30 AM' },
    { title: 'Monthly Report.xlsx', desc: 'Comprehensive financial summary & revenue', records: 184, size: '124 KB', lastGen: 'Yesterday, 11:59 PM' },
    { title: 'Payment History.xlsx', desc: 'Complete sorted transaction ledger', records: 820, size: '290 KB', lastGen: 'Today, 02:15 AM' },
    { title: 'Customer Ledger.xlsx', desc: 'Detailed balances by client account', records: 210, size: '95 KB', lastGen: '2 days ago' },
    { title: 'GST Report.xlsx', desc: 'Tax calculations & taxable turnover', records: 450, size: '180 KB', lastGen: '3 days ago' },
    { title: 'Annual Report.xlsx', desc: 'Year-over-year financial performance', records: 2400, size: '650 KB', lastGen: '1 week ago' },
    { title: 'Collection Report.xlsx', desc: 'Recovery metrics & staff efficiency', records: 112, size: '62 KB', lastGen: 'Today, 01:00 AM' },
    { title: 'Profit & Loss.xlsx', desc: 'P&L statement with net margin breakdown', records: 520, size: '210 KB', lastGen: 'Yesterday' },
  ];

  const handleDownloadReport = (reportName: string) => {
    const ws = XLSX.utils.aoa_to_sheet([
      ['SMARTLEDGERX ENTERPRISE REPORT'],
      [`Report Name: ${reportName}`],
      [`Generated: ${new Date().toLocaleString()}`],
      [],
      ['Metric', 'Value', 'Status'],
      ['Total Records', '142', 'Verified'],
      ['Net Volume', '₹1,24,500', 'Cleared'],
      ['Compliance', '100%', 'Optimal']
    ]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Report');
    XLSX.writeFile(wb, reportName);
    showNotification(`Successfully downloaded ${reportName}`);
  };

  return (
    <div className="space-y-8 max-w-[1600px] mx-auto pb-20 selection:bg-emerald-500/30">
      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed top-6 right-6 z-50 px-5 py-3 rounded-2xl bg-[#0D1117] border border-emerald-500/30 text-white shadow-[0_10px_30px_rgba(0,0,0,0.8)] flex items-center gap-3 backdrop-blur-2xl"
          >
            <CheckCircle2 size={18} className="text-emerald-400" />
            <span className="text-sm font-medium">{toast}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Global Search Modal (Ctrl + K) */}
      <AnimatePresence>
        {searchOpen && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-start justify-center pt-24 px-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: -20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -20 }}
              className="w-full max-w-2xl bg-[#0D1117] border border-white/10 rounded-[22px] shadow-2xl overflow-hidden p-4"
            >
              <div className="flex items-center gap-3 px-4 py-3 border-b border-white/10">
                <Search size={20} className="text-neutral-400" />
                <input 
                  autoFocus
                  type="text" 
                  placeholder="Search customers, invoices, transactions, phone numbers (Press ESC to close)..."
                  className="w-full bg-transparent text-white placeholder-neutral-500 focus:outline-none text-base"
                />
                <button 
                  onClick={() => setSearchOpen(false)}
                  className="px-2 py-1 rounded-lg bg-white/5 text-xs text-neutral-400 hover:text-white"
                >
                  ESC
                </button>
              </div>
              <div className="p-4 space-y-2 max-h-80 overflow-y-auto">
                <div className="text-xs uppercase tracking-wider text-neutral-500 px-3 py-1 font-semibold">Quick Shortcuts</div>
                <div 
                  onClick={() => { setSearchOpen(false); showNotification('Navigating to Customers...'); }}
                  className="flex items-center justify-between p-3 rounded-xl hover:bg-white/5 cursor-pointer text-sm text-neutral-300 hover:text-white transition"
                >
                  <span className="flex items-center gap-2"><Users size={16} className="text-emerald-400" /> View All Customers</span>
                  <span className="text-xs text-neutral-500 font-mono">⌘U</span>
                </div>
                <div 
                  onClick={() => { setSearchOpen(false); showNotification('Exporting Report...'); }}
                  className="flex items-center justify-between p-3 rounded-xl hover:bg-white/5 cursor-pointer text-sm text-neutral-300 hover:text-white transition"
                >
                  <span className="flex items-center gap-2"><FileText size={16} className="text-blue-400" /> Export Pending Payments.xlsx</span>
                  <span className="text-xs text-neutral-500 font-mono">⌘E</span>
                </div>
                <div 
                  onClick={() => { setSearchOpen(false); showNotification('Opening AI Assistant...'); }}
                  className="flex items-center justify-between p-3 rounded-xl hover:bg-white/5 cursor-pointer text-sm text-neutral-300 hover:text-white transition"
                >
                  <span className="flex items-center gap-2"><Sparkles size={16} className="text-purple-400" /> Generate AI Financial Forecast</span>
                  <span className="text-xs text-neutral-500 font-mono">⌘A</span>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* TOP HEADER */}
      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-[22px] bg-[#0D1117] border border-[rgba(255,255,255,0.06)] p-8 shadow-[0_10px_30px_rgba(0,0,0,0.5)] relative overflow-hidden flex flex-col lg:flex-row lg:items-center justify-between gap-8"
      >
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-br from-emerald-500/5 via-blue-500/5 to-transparent rounded-full blur-[120px] pointer-events-none" />

        <div className="space-y-3 z-10">
          <div className="flex items-center gap-3">
            <span className="text-neutral-400 text-sm font-medium">Good Evening,</span>
            <span className="text-white font-semibold text-sm px-3 py-1 rounded-full bg-white/5 border border-white/10">Administrator</span>
          </div>
          <div>
            <h1 className="text-3xl lg:text-4xl font-bold tracking-tight text-white mb-1">
              SmartLedgerX Enterprise Dashboard
            </h1>
            <p className="text-neutral-400 text-sm">
              Real-time financial intelligence for your business
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-6 pt-2 text-xs text-neutral-400 font-mono">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Last synced: 2 seconds ago</span>
            </div>
            <div>•</div>
            <div>Today: <span className="text-white font-semibold">Friday</span></div>
            <div>•</div>
            <div>Time: <span className="text-white font-semibold">{currentTime}</span></div>
          </div>
        </div>

        {/* Live Server Status Grid */}
        <div className="z-10 bg-[#050505] border border-[rgba(255,255,255,0.06)] rounded-2xl p-4 grid grid-cols-2 sm:grid-cols-3 gap-3">
          {[
            { label: 'API Status', icon: Server },
            { label: 'Database', icon: Database },
            { label: 'WhatsApp', icon: MessageSquare },
            { label: 'AI Engine', icon: Cpu },
            { label: 'Payment', icon: CreditCard },
            { label: 'Email', icon: Mail },
          ].map((item, idx) => {
            const Icon = item.icon;
            return (
              <div key={idx} className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-white/5 border border-white/5">
                <Icon size={14} className="text-neutral-400" />
                <div className="flex-1 min-w-0">
                  <div className="text-[10px] text-neutral-400 truncate">{item.label}</div>
                  <div className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Healthy
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </motion.div>

      {/* TOP ACTION BAR */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { label: 'New Customer', icon: Plus, color: 'from-blue-600 to-indigo-600', action: () => showNotification('Opening New Customer Drawer...') },
          { label: 'Add Payment', icon: CreditCard, color: 'from-emerald-600 to-teal-600', action: () => showNotification('Opening Payment Gateway...') },
          { label: 'Send Reminder', icon: Bell, color: 'from-amber-600 to-orange-600', action: () => showNotification('Bulk WhatsApp reminders triggered!') },
          { label: 'Export Reports', icon: Download, color: 'from-purple-600 to-pink-600', action: () => showNotification('Reports bundle prepared for download.') },
          { label: 'AI Report', icon: Sparkles, color: 'from-cyan-600 to-blue-600', action: () => showNotification('AI Generating Business Intelligence...') },
          { label: 'Settings', icon: Sliders, color: 'from-neutral-700 to-neutral-800', action: () => showNotification('Opening Admin Settings...') },
        ].map((btn, idx) => {
          const Icon = btn.icon;
          return (
            <motion.button
              key={idx}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={btn.action}
              className="flex items-center gap-3 p-4 rounded-[22px] bg-[#0D1117] border border-[rgba(255,255,255,0.06)] hover:border-emerald-500/30 transition shadow-lg group cursor-pointer text-left"
            >
              <div className={cn("w-10 h-10 rounded-xl bg-gradient-to-tr flex items-center justify-center text-white shadow-md group-hover:scale-110 transition-transform", btn.color)}>
                <Icon size={18} />
              </div>
              <div>
                <div className="text-xs font-semibold text-white">{btn.label}</div>
                <div className="text-[10px] text-neutral-400">Quick Action</div>
              </div>
            </motion.button>
          );
        })}
      </div>

      {/* KPI SECTION */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {[
          { title: 'Total Customers', value: '8,420', change: '+18%', trend: 'positive', icon: Users, badge: 'Active' },
          { title: 'Revenue Today', value: '₹24,500', change: 'Target 82%', trend: 'positive', icon: Wallet, badge: 'Live' },
          { title: 'Pending Collection', value: `₹${totalPending.toLocaleString()}`, change: 'High Priority', trend: 'warning', icon: ArrowUpRight, badge: 'Action Req' },
          { title: 'Recovery Rate', value: '94%', change: 'AI Prediction', trend: 'positive', icon: TrendingUp, badge: 'Optimal' },
          { title: 'WhatsApp Success', value: '98.6%', change: 'Delivered', trend: 'positive', icon: MessageSquare, badge: '99% uptime' },
          { title: 'Monthly Profit', value: '₹8.2L', change: 'Highest Month', trend: 'positive', icon: BarChart3, badge: 'Record' },
        ].map((kpi, idx) => {
          const Icon = kpi.icon;
          return (
            <motion.div
              key={idx}
              whileHover={{ scale: 1.02 }}
              transition={{ duration: 0.2 }}
              className="bg-[#0D1117] border border-[rgba(255,255,255,0.06)] rounded-[22px] p-6 shadow-xl flex flex-col justify-between space-y-4"
            >
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-emerald-400">
                  <Icon size={20} />
                </div>
                <span className="text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full bg-white/5 text-neutral-300 border border-white/10">
                  {kpi.badge}
                </span>
              </div>
              <div>
                <div className="text-xs text-neutral-400 font-medium mb-1">{kpi.title}</div>
                <div className="text-2xl font-bold text-white tracking-tight">{kpi.value}</div>
              </div>
              <div className="flex items-center justify-between pt-3 border-t border-white/5 text-xs">
                <span className={cn("font-semibold", kpi.trend === 'positive' ? 'text-emerald-400' : 'text-amber-400')}>
                  {kpi.change}
                </span>
                <span className="text-neutral-500 font-mono">Updated now</span>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* SECOND ROW: 70% Analytics + 30% AI Business Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-10 gap-6">
        {/* 70% Analytics Area Chart */}
        <div className="lg:col-span-7 bg-[#0D1117] border border-[rgba(255,255,255,0.06)] rounded-[22px] p-8 shadow-2xl flex flex-col justify-between">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <h2 className="text-xl font-bold text-white">Financial Throughput & Analytics</h2>
                <p className="text-neutral-400 text-sm">Real-time revenue, collections, profit, and expenses overview</p>
              </div>
              <div className="flex items-center gap-1.5 p-1 rounded-xl bg-black/50 border border-white/10">
                {(['7D', '30D', '90D', '1Y'] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setTimeRange(t)}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer",
                      timeRange === t ? "bg-emerald-500 text-black shadow-lg" : "text-neutral-400 hover:text-white"
                    )}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={activeChartData}>
                  <defs>
                    <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorCol" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="day" stroke="#525252" strokeWidth={1} />
                  <YAxis stroke="#525252" strokeWidth={1} tickFormatter={(v) => `₹${v/1000}k`} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0D1117', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '1rem', color: '#fff' }}
                    formatter={(value: any, name: any) => [`₹${Number(value).toLocaleString()}`, name.toUpperCase()]}
                  />
                  <Area type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorRev)" name="Revenue" />
                  <Area type="monotone" dataKey="collection" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorCol)" name="Collection" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-4 pt-6 mt-6 border-t border-white/5 text-center">
            <div>
              <div className="text-xs text-neutral-400">Total Revenue</div>
              <div className="text-lg font-bold text-white">₹7,42,500</div>
            </div>
            <div>
              <div className="text-xs text-neutral-400">Collections</div>
              <div className="text-lg font-bold text-emerald-400">₹6,84,000</div>
            </div>
            <div>
              <div className="text-xs text-neutral-400">Net Profit</div>
              <div className="text-lg font-bold text-blue-400">₹2,95,000</div>
            </div>
            <div>
              <div className="text-xs text-neutral-400">Operating Exp</div>
              <div className="text-lg font-bold text-purple-400">₹1,82,000</div>
            </div>
          </div>
        </div>

        {/* 30% AI Business Insights */}
        <div className="lg:col-span-3 bg-[#0D1117] border border-[rgba(255,255,255,0.06)] rounded-[22px] p-8 shadow-2xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                  <Sparkles size={16} />
                </div>
                <h2 className="text-lg font-bold text-white">AI Business Insights</h2>
              </div>
              <span className="text-xs font-mono text-purple-400 px-2.5 py-1 rounded-full bg-purple-500/10 border border-purple-500/20">
                97% Conf.
              </span>
            </div>

            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-white/5 border border-white/5 text-xs text-neutral-300 leading-relaxed">
                🚀 <strong className="text-white">Revenue Surge:</strong> Today's collection is projected to increase by <span className="text-emerald-400 font-bold">14%</span> based on incoming wire transfers.
              </div>
              <div className="p-4 rounded-2xl bg-white/5 border border-white/5 text-xs text-neutral-300 leading-relaxed">
                ⚠️ <strong className="text-white">Risk Alert:</strong> 3 enterprise clients are statistically likely to delay payment past the 15-day window. Automated WhatsApp reminders recommended.
              </div>
              <div className="p-4 rounded-2xl bg-white/5 border border-white/5 text-xs text-neutral-300 leading-relaxed">
                📈 <strong className="text-white">Peak Hours:</strong> Highest revenue transactions consistently occur between <span className="text-blue-400 font-bold">3:00 PM – 6:00 PM</span>.
              </div>
              <div className="p-4 rounded-2xl bg-white/5 border border-white/5 text-xs text-neutral-300 leading-relaxed">
                📉 <strong className="text-white">Trend Warning:</strong> Minor collection dip detected compared to last Friday; recovery team notified.
              </div>
            </div>
          </div>

          <button
            onClick={() => showNotification('AI Deep Financial Audit generated!')}
            className="w-full mt-6 py-3.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold rounded-xl text-sm flex items-center justify-center gap-2 shadow-lg transition cursor-pointer"
          >
            <Sparkles size={16} /> Run Full AI Audit
          </button>
        </div>
      </div>

      {/* THIRD ROW: Split into 3 cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Upcoming Payments */}
        <div className="bg-[#0D1117] border border-[rgba(255,255,255,0.06)] rounded-[22px] p-6 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-white text-base">Upcoming Payments</h3>
            <span className="text-xs text-amber-400 font-medium">3 Pending</span>
          </div>
          <div className="space-y-3">
            {[
              { name: 'Acme Corp', amount: '₹45,000', due: 'Today', priority: 'High', status: 'Pending' },
              { name: 'Globex Inc', amount: '₹85,000', due: 'Tomorrow', priority: 'Medium', status: 'Pending' },
              { name: 'Stark Industries', amount: '₹1,20,000', due: 'In 3 days', priority: 'Urgent', status: 'Overdue' },
            ].map((p, idx) => (
              <div key={idx} className="p-3.5 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-between">
                <div>
                  <div className="text-sm font-semibold text-white">{p.name}</div>
                  <div className="text-xs text-neutral-400">Due: {p.due}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold text-emerald-400">{p.amount}</div>
                  <span className={cn("text-[10px] px-2 py-0.5 rounded-full font-bold", p.status === 'Overdue' ? 'bg-red-500/20 text-red-400' : 'bg-amber-500/20 text-amber-400')}>
                    {p.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="bg-[#0D1117] border border-[rgba(255,255,255,0.06)] rounded-[22px] p-6 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-white text-base">Recent Transactions</h3>
            <span className="text-xs text-emerald-400 font-medium">Live Feed</span>
          </div>
          <div className="space-y-3">
            {[
              { title: 'Payment Received', amount: '+₹35,000', customer: 'Priya Sharma', time: '10 mins ago', type: 'green' },
              { title: 'Invoice Generated', amount: '₹18,400', customer: 'Amit Patel', time: '25 mins ago', type: 'blue' },
              { title: 'Reminder Sent', amount: 'WhatsApp #402', customer: 'Neha Gupta', time: '1 hour ago', type: 'amber' },
            ].map((t, idx) => (
              <div key={idx} className="p-3.5 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={cn("w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs", t.type === 'green' ? 'bg-emerald-500/20 text-emerald-400' : t.type === 'blue' ? 'bg-blue-500/20 text-blue-400' : 'bg-amber-500/20 text-amber-400')}>
                    {t.type === 'green' ? '↓' : t.type === 'blue' ? '📄' : '🔔'}
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-white">{t.title}</div>
                    <div className="text-xs text-neutral-400">{t.customer} • {t.time}</div>
                  </div>
                </div>
                <span className="text-sm font-bold text-white">{t.amount}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Reminder Activity */}
        <div className="bg-[#0D1117] border border-[rgba(255,255,255,0.06)] rounded-[22px] p-6 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-white text-base">Reminder Activity</h3>
            <span className="text-xs text-purple-400 font-medium">98.6% Success</span>
          </div>
          <div className="space-y-3">
            <div className="p-3.5 rounded-2xl bg-white/5 border border-white/5 space-y-2">
              <div className="flex justify-between text-xs text-neutral-300">
                <span>WhatsApp Sent</span>
                <span className="font-bold text-white">1,420</span>
              </div>
              <div className="w-full h-2 rounded-full bg-black/50 overflow-hidden">
                <div className="w-[98%] h-full bg-emerald-400 rounded-full" />
              </div>
            </div>
            <div className="p-3.5 rounded-2xl bg-white/5 border border-white/5 space-y-2">
              <div className="flex justify-between text-xs text-neutral-300">
                <span>Delivered & Read</span>
                <span className="font-bold text-white">1,402</span>
              </div>
              <div className="w-full h-2 rounded-full bg-black/50 overflow-hidden">
                <div className="w-[95%] h-full bg-blue-400 rounded-full" />
              </div>
            </div>
            <div className="p-3.5 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-between text-xs">
              <span className="text-neutral-400">Response Rate</span>
              <span className="font-bold text-emerald-400">84.2% (High Conversion)</span>
            </div>
          </div>
        </div>
      </div>

      {/* FOURTH ROW: Customer Intelligence */}
      <div className="bg-[#0D1117] border border-[rgba(255,255,255,0.06)] rounded-[22px] p-8 shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-xl font-bold text-white">Customer Intelligence & Risk Matrix</h3>
            <p className="text-neutral-400 text-sm">Most valuable clients, highest pending balances, and AI recovery scores</p>
          </div>
          <button onClick={() => showNotification('Exporting customer intelligence matrix...')} className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-white hover:bg-white/10 transition">
            Export Matrix
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-neutral-300">
            <thead className="bg-white/5 text-xs uppercase tracking-wider text-neutral-400 border-b border-white/10">
              <tr>
                <th className="p-4 rounded-l-xl">Customer Name</th>
                <th className="p-4">Phone Number</th>
                <th className="p-4">Total Revenue</th>
                <th className="p-4">Pending Balance</th>
                <th className="p-4">Recovery Score</th>
                <th className="p-4 rounded-r-xl">AI Risk Score</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {[
                { name: 'Priya Sharma', phone: '+91 98765 11111', rev: '₹2,40,000', pending: '₹0', recovery: '98%', risk: 'Low (12%)' },
                { name: 'Amit Patel', phone: '+91 98765 22222', rev: '₹1,85,000', pending: '₹12,500', recovery: '85%', risk: 'Medium (35%)' },
                { name: 'Neha Gupta', phone: '+91 98765 33333', rev: '₹3,10,000', pending: '₹17,500', recovery: '92%', risk: 'Low (15%)' },
                { name: 'Rajesh Kumar', phone: '+91 98765 44444', rev: '₹95,000', pending: '₹45,000', recovery: '45%', risk: 'High (78%)' },
              ].map((c, idx) => (
                <tr key={idx} className="hover:bg-white/5 transition">
                  <td className="p-4 font-semibold text-white flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center font-bold text-emerald-400 text-xs">
                      {c.name.charAt(0)}
                    </div>
                    {c.name}
                  </td>
                  <td className="p-4 text-neutral-400 font-mono text-xs">{c.phone}</td>
                  <td className="p-4 font-semibold text-white">{c.rev}</td>
                  <td className="p-4 font-semibold text-amber-400">{c.pending}</td>
                  <td className="p-4">
                    <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-bold">
                      {c.recovery}
                    </span>
                  </td>
                  <td className="p-4">
                    <span className={cn("px-2.5 py-1 rounded-full text-xs font-bold", c.risk.includes('High') ? 'bg-red-500/20 text-red-400' : 'bg-blue-500/20 text-blue-400')}>
                      {c.risk}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* FIFTH ROW: Financial Health Gauges */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
        {[
          { label: 'Cash Flow', val: '94%', color: 'text-emerald-400', desc: 'Optimal liquidity' },
          { label: 'Profit Margin', val: '38.5%', color: 'text-blue-400', desc: '+4.2% vs last mo' },
          { label: 'Collection Efficiency', val: '91.2%', color: 'text-purple-400', desc: 'Target >90%' },
          { label: 'Monthly Growth', val: '+24%', color: 'text-amber-400', desc: 'Aggressive expansion' },
          { label: 'Recovery Health', val: 'A+', color: 'text-cyan-400', desc: 'Enterprise Grade' },
        ].map((h, idx) => (
          <div key={idx} className="bg-[#0D1117] border border-[rgba(255,255,255,0.06)] rounded-[22px] p-6 shadow-xl text-center space-y-3">
            <div className="text-xs text-neutral-400 font-medium">{h.label}</div>
            <div className={cn("text-3xl font-extrabold", h.color)}>{h.val}</div>
            <div className="text-[11px] text-neutral-500">{h.desc}</div>
          </div>
        ))}
      </div>

      {/* REPORT SECTION: Professional Report Cards */}
      <div className="bg-[#0D1117] border border-[rgba(255,255,255,0.06)] rounded-[22px] p-8 shadow-2xl space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="text-xl font-bold text-white">Enterprise Reporting & Excel Exports</h3>
            <p className="text-neutral-400 text-sm">Download audit-ready Microsoft Excel sheets (.xlsx) formatted for QuickBooks & Zoho Books</p>
          </div>
          <div className="px-4 py-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-bold uppercase tracking-wider">
            SheetJS Engine Active
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {reportsList.map((rep, idx) => (
            <div key={idx} className="bg-white/5 border border-white/10 rounded-2xl p-6 flex flex-col justify-between space-y-4 hover:border-emerald-500/30 transition group">
              <div>
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-4 group-hover:scale-110 transition">
                  <FileText size={20} />
                </div>
                <h4 className="font-bold text-white text-base mb-1">{rep.title}</h4>
                <p className="text-xs text-neutral-400 mb-4 line-clamp-2">{rep.desc}</p>
                <div className="space-y-1.5 text-xs text-neutral-300 pt-3 border-t border-white/5 font-mono">
                  <div className="flex justify-between"><span className="text-neutral-500">Records:</span> <span className="text-white">{rep.records}</span></div>
                  <div className="flex justify-between"><span className="text-neutral-500">Size:</span> <span className="text-white">{rep.size}</span></div>
                  <div className="flex justify-between"><span className="text-neutral-500">Generated:</span> <span className="text-emerald-400">{rep.lastGen}</span></div>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  onClick={() => handleDownloadReport(rep.title)}
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-500/20 transition cursor-pointer"
                >
                  <Download size={14} /> Download
                </button>
                <button
                  onClick={() => showNotification(`Previewing ${rep.title}`)}
                  className="px-3 py-2.5 bg-white/5 hover:bg-white/10 text-neutral-300 hover:text-white rounded-xl text-xs transition cursor-pointer"
                  title="Preview"
                >
                  <Eye size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ADMIN MANAGEMENT: Latest Users */}
      <div className="bg-[#0D1117] border border-[rgba(255,255,255,0.06)] rounded-[22px] p-8 shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-xl font-bold text-white">Admin Management & Access Control</h3>
            <p className="text-neutral-400 text-sm">Latest active admin users, roles, and permission levels</p>
          </div>
          <button onClick={() => showNotification('Opening Add Admin modal...')} className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition">
            + Add Admin User
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-neutral-300">
            <thead className="bg-white/5 text-xs uppercase tracking-wider text-neutral-400 border-b border-white/10">
              <tr>
                <th className="p-4 rounded-l-xl">User</th>
                <th className="p-4">Role</th>
                <th className="p-4">Email</th>
                <th className="p-4">Permissions</th>
                <th className="p-4">Status</th>
                <th className="p-4 rounded-r-xl">Last Login</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {[
                { name: 'Souvik Dash', role: 'Super Administrator', email: 'souvikdashbbsr@gmail.com', perms: 'Full Control', status: 'Active', login: 'Just now' },
                { name: 'Rahul Sharma', role: 'Finance Manager', email: 'rahul@smartledgerx.io', perms: 'Ledger, Reports', status: 'Active', login: '2 hours ago' },
                { name: 'Priya Mukherjee', role: 'Recovery Head', email: 'priya@smartledgerx.io', perms: 'Reminders, WhatsApp', status: 'Active', login: 'Yesterday' },
              ].map((u, idx) => (
                <tr key={idx} className="hover:bg-white/5 transition">
                  <td className="p-4 font-semibold text-white flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-500/20 border border-blue-500/30 flex items-center justify-center font-bold text-blue-400 text-xs">
                      {u.name.charAt(0)}
                    </div>
                    {u.name}
                  </td>
                  <td className="p-4 text-emerald-400 font-semibold">{u.role}</td>
                  <td className="p-4 text-neutral-400 text-xs font-mono">{u.email}</td>
                  <td className="p-4 text-neutral-300">{u.perms}</td>
                  <td className="p-4">
                    <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-bold">
                      {u.status}
                    </span>
                  </td>
                  <td className="p-4 text-neutral-400 text-xs font-mono">{u.login}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
