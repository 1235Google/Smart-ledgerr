import React, { useState, useMemo } from 'react';
import { useStore } from '../context/StoreContext';
import { BarChart3, Activity, Download, FileText, ArrowUpRight, ArrowDownLeft, Target, Clock } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend, PieChart, Pie, Cell, LineChart, Line, ComposedChart } from 'recharts';
import { formatCurrency, cn } from '../lib/utils';
import { motion } from 'motion/react';
import { startOfDay, startOfWeek, startOfMonth, startOfYear, subMonths, isWithinInterval, parseISO, format, endOfDay, endOfMonth } from 'date-fns';

type DateFilter = 'today' | 'week' | 'month' | 'lastMonth' | 'year' | 'all';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6'];

export default function Analytics() {
  const { transactions, startingBalance, currentBalance } = useStore();
  const [filter, setFilter] = useState<DateFilter>('month');

  // Filter transactions based on selected date range
  const filteredTransactions = useMemo(() => {
    const now = new Date();
    let start: Date;
    let end: Date = endOfDay(now);

    switch (filter) {
      case 'today':
        start = startOfDay(now);
        break;
      case 'week':
        start = startOfWeek(now, { weekStartsOn: 1 });
        break;
      case 'month':
        start = startOfMonth(now);
        break;
      case 'lastMonth':
        start = startOfMonth(subMonths(now, 1));
        end = endOfMonth(subMonths(now, 1));
        break;
      case 'year':
        start = startOfYear(now);
        break;
      case 'all':
      default:
        return transactions;
    }

    return transactions.filter(t => {
      const txDate = parseISO(t.type === 'pending' ? t.dueDate : t.date);
      return isWithinInterval(txDate, { start, end });
    });
  }, [transactions, filter]);

  // Calculate Metrics
  const {
    income,
    expenses,
    netSavings,
    pendingAmount,
    totalTxCount
  } = useMemo(() => {
    let income = 0;
    let expenses = 0;
    let pendingAmount = 0;
    
    filteredTransactions.forEach(t => {
      if (t.type === 'received') income += t.amount;
      if (t.type === 'sent') expenses += t.amount;
      if (t.type === 'pending' && t.status === 'pending') pendingAmount += t.amount;
    });

    return {
      income,
      expenses,
      netSavings: income - expenses,
      pendingAmount,
      totalTxCount: filteredTransactions.length
    };
  }, [filteredTransactions]);

  const savingsRate = income > 0 ? ((netSavings / income) * 100).toFixed(1) : '0.0';

  // Chart Data Processing
  const { timelineData, categoryData, categoryIncomeData } = useMemo(() => {
    const datesMap = new Map<string, { date: string; income: number; expenses: number; balance: number }>();
    const expensesByCategory = new Map<string, number>();
    const incomeByCategory = new Map<string, number>();
    
    // Sort filtered txs
    const sortedTxs = [...filteredTransactions].sort((a, b) => {
      const dateA = a.type === 'pending' ? a.dueDate : a.date;
      const dateB = b.type === 'pending' ? b.dueDate : b.date;
      return dateA.localeCompare(dateB);
    });

    sortedTxs.forEach(t => {
      const dateStr = t.type === 'pending' ? t.dueDate : t.date;
      const displayDate = format(parseISO(dateStr), 'MMM dd');
      
      if (!datesMap.has(displayDate)) {
        datesMap.set(displayDate, { date: displayDate, income: 0, expenses: 0, balance: 0 });
      }
      
      const dayData = datesMap.get(displayDate)!;
      
      if (t.type === 'received') {
        dayData.income += t.amount;
        const cat = (t.purpose || 'Other').trim();
        incomeByCategory.set(cat, (incomeByCategory.get(cat) || 0) + t.amount);
      }
      if (t.type === 'sent') {
        dayData.expenses += t.amount;
        const cat = (t.purpose || 'Other').trim();
        expensesByCategory.set(cat, (expensesByCategory.get(cat) || 0) + t.amount);
      }
    });

    return {
      timelineData: Array.from(datesMap.values()),
      categoryData: Array.from(expensesByCategory.entries()).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value),
      categoryIncomeData: Array.from(incomeByCategory.entries()).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value)
    };
  }, [filteredTransactions]);

  const highestExpenseCat = categoryData.length > 0 ? categoryData[0] : { name: 'None', value: 0 };
  const highestIncomeCat = categoryIncomeData.length > 0 ? categoryIncomeData[0] : { name: 'None', value: 0 };

  const activeDay = timelineData.length > 0 ? [...timelineData].sort((a, b) => (b.income + b.expenses) - (a.income + a.expenses))[0] : null;
  const largestTransaction = filteredTransactions.length > 0 ? [...filteredTransactions].sort((a, b) => b.amount - a.amount)[0] : null;

  const handleExportCSV = () => {
    const headers = ['Date', 'Type', 'Person', 'Amount', 'Purpose/Reason', 'Status'];
    const rows = filteredTransactions.map(t => {
      const date = t.type === 'pending' ? t.dueDate : t.date;
      const purpose = t.type === 'pending' ? t.reason : t.purpose;
      const status = t.type === 'pending' ? t.status : 'completed';
      return `${date},${t.type},"${t.personName}",${t.amount},"${purpose}",${status}`;
    });
    
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `analytics_report_${format(new Date(), 'yyyy-MM-dd')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportPDF = () => {
    window.print();
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-neutral-900 border border-white/10 p-4 rounded-2xl shadow-xl backdrop-blur-xl">
          <p className="text-neutral-400 text-sm mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm font-medium flex items-center gap-2" style={{ color: entry.color || entry.payload.fill }}>
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color || entry.payload.fill }}></span>
              {entry.name}: {formatCurrency(entry.value)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-8 pb-20 md:pb-0 print:text-black">
      <header className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-white flex items-center gap-3 print:text-black">
            <BarChart3 className="text-blue-400 print:text-blue-600" />
            Financial Analytics
          </h1>
          <p className="text-neutral-400 mt-1 print:text-gray-600">Comprehensive insights into your money.</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto print:hidden">
          <select 
            value={filter} 
            onChange={(e) => setFilter(e.target.value as DateFilter)}
            className="flex-1 md:flex-none min-h-[48px] bg-black/40 border border-white/10 rounded-xl px-4 text-white text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/50 appearance-none"
          >
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="lastMonth">Last Month</option>
            <option value="year">This Year</option>
            <option value="all">All Time</option>
          </select>
          
          <div className="flex gap-3 w-full md:w-auto">
            <button 
              onClick={handleExportCSV}
              className="flex-1 md:flex-none justify-center min-h-[48px] px-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl font-medium transition-colors text-sm flex items-center gap-2 text-white"
            >
              <Download size={16} /> CSV
            </button>
            <button 
              onClick={handleExportPDF}
              className="flex-1 md:flex-none justify-center min-h-[48px] px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-all shadow-lg shadow-blue-600/30 text-sm flex items-center gap-2"
            >
              <FileText size={16} /> Report
            </button>
          </div>
        </div>
      </header>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white/5 border border-white/10 rounded-[2rem] p-5 md:p-6 backdrop-blur-xl relative overflow-hidden group print:border-gray-200 print:bg-white">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-green-500/10 rounded-lg"><ArrowDownLeft size={18} className="text-green-400" /></div>
            <h3 className="text-xs md:text-sm font-semibold text-slate-400 uppercase tracking-wider print:text-gray-500">Income</h3>
          </div>
          <div className="text-2xl md:text-3xl font-bold text-white mt-2 print:text-black">{formatCurrency(income)}</div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white/5 border border-white/10 rounded-[2rem] p-5 md:p-6 backdrop-blur-xl relative overflow-hidden group print:border-gray-200 print:bg-white">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-red-500/10 rounded-lg"><ArrowUpRight size={18} className="text-red-400" /></div>
            <h3 className="text-xs md:text-sm font-semibold text-slate-400 uppercase tracking-wider print:text-gray-500">Expenses</h3>
          </div>
          <div className="text-2xl md:text-3xl font-bold text-white mt-2 print:text-black">{formatCurrency(expenses)}</div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-white/5 border border-white/10 rounded-[2rem] p-5 md:p-6 backdrop-blur-xl relative overflow-hidden group col-span-2 lg:col-span-1 print:border-gray-200 print:bg-white">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-500/10 rounded-lg"><Target size={18} className="text-blue-400" /></div>
            <h3 className="text-xs md:text-sm font-semibold text-slate-400 uppercase tracking-wider print:text-gray-500">Net Savings</h3>
          </div>
          <div className="flex items-end gap-3 mt-2">
            <div className={cn("text-2xl md:text-3xl font-bold", netSavings >= 0 ? "text-green-400" : "text-red-400")}>
              {netSavings > 0 ? '+' : ''}{formatCurrency(netSavings)}
            </div>
            <div className="mb-1 text-sm text-slate-400 font-medium">({savingsRate}%)</div>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-white/5 border border-white/10 rounded-[2rem] p-5 md:p-6 backdrop-blur-xl relative overflow-hidden group print:border-gray-200 print:bg-white">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-indigo-500/10 rounded-lg"><Activity size={18} className="text-indigo-400" /></div>
            <h3 className="text-xs md:text-sm font-semibold text-slate-400 uppercase tracking-wider print:text-gray-500">Balance</h3>
          </div>
          <div className="text-2xl md:text-3xl font-bold text-white mt-2 print:text-black">{formatCurrency(currentBalance)}</div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="bg-white/5 border border-white/10 rounded-[2rem] p-5 md:p-6 backdrop-blur-xl relative overflow-hidden group print:border-gray-200 print:bg-white">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-amber-500/10 rounded-lg"><Clock size={18} className="text-amber-400" /></div>
            <h3 className="text-xs md:text-sm font-semibold text-slate-400 uppercase tracking-wider print:text-gray-500">Pending</h3>
          </div>
          <div className="text-2xl md:text-3xl font-bold text-white mt-2 print:text-black">{formatCurrency(pendingAmount)}</div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="bg-white/5 border border-white/10 rounded-[2rem] p-5 md:p-6 backdrop-blur-xl relative overflow-hidden group print:border-gray-200 print:bg-white">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-purple-500/10 rounded-lg"><BarChart3 size={18} className="text-purple-400" /></div>
            <h3 className="text-xs md:text-sm font-semibold text-slate-400 uppercase tracking-wider print:text-gray-500">Transactions</h3>
          </div>
          <div className="text-2xl md:text-3xl font-bold text-white mt-2 print:text-black">{totalTxCount}</div>
        </motion.div>
      </div>

      {/* Summary Highlights */}
      <div className="bg-gradient-to-br from-neutral-900 to-black border border-white/10 rounded-[2.5rem] p-8 shadow-2xl print:border-gray-300 print:bg-none print:bg-white">
        <h3 className="text-lg font-bold text-white mb-6 print:text-black">Financial Summary</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="p-4 rounded-2xl bg-white/5 border border-white/5 print:border-gray-200 print:bg-white">
            <p className="text-xs text-slate-400 uppercase tracking-wider mb-1 font-semibold">Top Expense</p>
            <p className="text-lg font-bold text-white truncate print:text-black">{highestExpenseCat.name}</p>
            <p className="text-sm text-red-400 mt-1">{formatCurrency(highestExpenseCat.value)}</p>
          </div>
          <div className="p-4 rounded-2xl bg-white/5 border border-white/5 print:border-gray-200 print:bg-white">
            <p className="text-xs text-slate-400 uppercase tracking-wider mb-1 font-semibold">Top Income Source</p>
            <p className="text-lg font-bold text-white truncate print:text-black">{highestIncomeCat.name}</p>
            <p className="text-sm text-green-400 mt-1">{formatCurrency(highestIncomeCat.value)}</p>
          </div>
          <div className="p-4 rounded-2xl bg-white/5 border border-white/5 print:border-gray-200 print:bg-white">
            <p className="text-xs text-slate-400 uppercase tracking-wider mb-1 font-semibold">Most Active Day</p>
            <p className="text-lg font-bold text-white truncate print:text-black">{activeDay ? activeDay.date : 'N/A'}</p>
            <p className="text-sm text-blue-400 mt-1">{activeDay ? formatCurrency(activeDay.income + activeDay.expenses) : '₹0'}</p>
          </div>
          <div className="p-4 rounded-2xl bg-white/5 border border-white/5 print:border-gray-200 print:bg-white">
            <p className="text-xs text-slate-400 uppercase tracking-wider mb-1 font-semibold">Largest Transaction</p>
            <p className="text-lg font-bold text-white truncate print:text-black">{largestTransaction ? largestTransaction.personName : 'N/A'}</p>
            <p className="text-sm text-indigo-400 mt-1">{largestTransaction ? formatCurrency(largestTransaction.amount) : '₹0'}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
        {/* Income vs Expense Bar Chart */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-white/5 border border-white/10 rounded-[2.5rem] p-6 md:p-8 backdrop-blur-xl w-full overflow-hidden print:border-gray-200 print:bg-white">
          <h3 className="text-lg font-bold text-white mb-6 print:text-black">Income vs Expenses</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={timelineData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
                <XAxis dataKey="date" stroke="rgba(255,255,255,0.4)" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="rgba(255,255,255,0.4)" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `₹${value/1000}k`} />
                <Tooltip content={<CustomTooltip />} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
                <Bar dataKey="income" name="Income" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="expenses" name="Expenses" fill="#ef4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Cash Flow Line Chart */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="bg-white/5 border border-white/10 rounded-[2.5rem] p-6 md:p-8 backdrop-blur-xl w-full overflow-hidden print:border-gray-200 print:bg-white">
          <h3 className="text-lg font-bold text-white mb-6 print:text-black">Cash Flow Trend</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={timelineData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
                <XAxis dataKey="date" stroke="rgba(255,255,255,0.4)" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="rgba(255,255,255,0.4)" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `₹${value/1000}k`} />
                <Tooltip content={<CustomTooltip />} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
                <Line type="monotone" dataKey="income" name="Income" stroke="#10b981" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
                <Line type="monotone" dataKey="expenses" name="Expenses" stroke="#ef4444" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Expense Categories Pie Chart */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="bg-white/5 border border-white/10 rounded-[2.5rem] p-6 md:p-8 backdrop-blur-xl w-full overflow-hidden print:border-gray-200 print:bg-white">
          <h3 className="text-lg font-bold text-white mb-6 print:text-black">Expense Categories</h3>
          <div className="h-[300px] w-full flex items-center justify-center">
            {categoryData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                  <Legend iconType="circle" layout="vertical" verticalAlign="middle" align="right" wrapperStyle={{ fontSize: '12px' }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-slate-500 text-sm">No expenses found for this period.</div>
            )}
          </div>
        </motion.div>

        {/* Net Flow Area Chart */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} className="bg-white/5 border border-white/10 rounded-[2.5rem] p-6 md:p-8 backdrop-blur-xl w-full overflow-hidden print:border-gray-200 print:bg-white">
          <h3 className="text-lg font-bold text-white mb-6 print:text-black">Net Cash Flow</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={timelineData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorNet" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
                <XAxis dataKey="date" stroke="rgba(255,255,255,0.4)" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="rgba(255,255,255,0.4)" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `₹${value/1000}k`} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey={(d) => d.income - d.expenses} name="Net Flow" stroke="#3b82f6" strokeWidth={3} fill="url(#colorNet)" />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>
      
      {/* Print Styles for Hiding specific elements when exporting PDF */}
      <style>{`
        @media print {
          body {
            background: white !important;
            color: black !important;
          }
          .backdrop-blur-xl {
            backdrop-filter: none !important;
            -webkit-backdrop-filter: none !important;
          }
          * {
            text-shadow: none !important;
            box-shadow: none !important;
          }
        }
      `}</style>
    </div>
  );
}
