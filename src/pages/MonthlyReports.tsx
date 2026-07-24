import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { FileText, Send, Clock, Calendar, Mail, CheckCircle2, AlertCircle, RefreshCcw, Settings, ChevronRight, Shield, TrendingUp, Users, BrainCircuit, Download, Trash2, Search, ArrowUpDown } from 'lucide-react';
import { format, subMonths, parseISO } from 'date-fns';
import { useStore } from '../context/StoreContext';
import { cn } from '../lib/utils';
import ReportGenerationModal from '../components/ReportGenerationModal';
import ReportPreviewModal from '../components/ReportPreviewModal';

export default function MonthlyReports() {
  const { transactions, customers, reportSettings, setReportSettings, generatedReports, addGeneratedReport, deleteGeneratedReport, updateGeneratedReportStatus } = useStore();
  
  const [emailInput, setEmailInput] = useState(reportSettings?.emailAddress || '');
  const [emailStatus, setEmailStatus] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [includePdf, setIncludePdf] = useState(reportSettings?.includePdf ?? true);
  
  const [genModalOpen, setGenModalOpen] = useState(false);
  const [genStatus, setGenStatus] = useState<'idle' | 'generating' | 'success' | 'error'>('idle');
  const [genError, setGenError] = useState<string>('');
  const [isTestReport, setIsTestReport] = useState(false);

  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [reportData, setReportData] = useState<any>(null);
  const [emailSendStatus, setEmailSendStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');

  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');

  const schedule = reportSettings?.schedule || { frequency: 'monthly', time: '08:00', customDay: 1 };

  useEffect(() => {
    if (reportSettings?.emailAddress) {
      setEmailInput(reportSettings.emailAddress);
    }
  }, [reportSettings?.emailAddress]);

  const handleSaveEmail = () => {
    if (!emailInput) {
      setEmailStatus('❌ Please enter an email address');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailInput)) {
      setEmailStatus('❌ Invalid email format');
      return;
    }
    setReportSettings({ 
      ...reportSettings, 
      emailAddress: emailInput,
      verificationStatus: reportSettings?.emailAddress === emailInput ? reportSettings.verificationStatus : 'pending'
    });
    setEmailStatus('✅ Email saved');
    setTimeout(() => setEmailStatus(null), 3000);
  };

  const handleVerifyEmail = async () => {
    if (!reportSettings?.emailAddress) return;
    setIsVerifying(true);
    try {
      const res = await fetch('/api/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: reportSettings.emailAddress })
      });
      if (res.ok) {
        setReportSettings({ ...reportSettings, verificationStatus: 'verified' });
        setEmailStatus('✅ Verification email sent');
      } else {
        const data = await res.json();
        setEmailStatus(`❌ Verification failed: ${data.error}`);
      }
    } catch (e: any) {
      setEmailStatus(`❌ Network error: ${e.message}`);
    }
    setIsVerifying(false);
  };

  const generateReport = async (type: 'test_report' | 'monthly_report') => {
    if (!reportSettings?.emailAddress) {
      setEmailStatus('❌ Please configure and save an email address first.');
      return;
    }

    setIsTestReport(type === 'test_report');
    setGenModalOpen(true);
    setGenStatus('generating');
    setGenError('');

    try {
      const month = format(type === 'monthly_report' ? subMonths(new Date(), 1) : new Date(), 'MMMM yyyy');
      
      const res = await fetch('/api/build-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          month,
          transactions,
          customers
        })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to generate report');
      }

      setReportData({
        month,
        transactions,
        customers,
        aiSummary: data.aiSummary,
        excelBase64: data.excelBase64,
        pdfBase64: data.pdfBase64,
        fileSizeXlsx: data.fileSizeXlsx,
        fileSizePdf: data.fileSizePdf,
      });

      setGenStatus('success');

      const reportId = Date.now().toString();
      addGeneratedReport({
        id: reportId,
        month,
        date: new Date().toISOString(),
        status: 'success',
        recipient: reportSettings.emailAddress,
        type: type,
        fileSizeXlsx: data.fileSizeXlsx,
        fileSizePdf: data.fileSizePdf,
        downloadCount: 0
      });

      // Automatically send email if test report
      if (type === 'test_report') {
         await sendEmailNow(data.excelBase64, data.pdfBase64, data.aiSummary, month, reportId);
      } else {
         // Close gen modal and open preview modal after a short delay
         setTimeout(() => {
           setGenModalOpen(false);
           setPreviewModalOpen(true);
           setEmailSendStatus('idle');
         }, 1500);
      }
    } catch (error: any) {
      console.error(error);
      setGenStatus('error');
      setGenError("We couldn't generate your report right now.\n\nPlease try again.");
      
      addGeneratedReport({
        id: Date.now().toString(),
        month: format(type === 'monthly_report' ? subMonths(new Date(), 1) : new Date(), 'MMMM yyyy'),
        date: new Date().toISOString(),
        status: 'failed',
        recipient: reportSettings.emailAddress,
        type: type,
      });
    }
  };

  const sendEmailNow = async (excelBase64?: string, pdfBase64?: string, aiSummary?: string, monthOverride?: string, reportIdToUpdate?: string) => {
    setEmailSendStatus('sending');
    try {
      const eBase64 = excelBase64 || reportData?.excelBase64;
      const pBase64 = pdfBase64 || reportData?.pdfBase64;
      const ai = aiSummary || reportData?.aiSummary;
      const m = monthOverride || reportData?.month;

      const res = await fetch('/api/send-email-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: reportSettings!.emailAddress,
          month: m,
          excelBase64: eBase64,
          pdfBase64: pBase64,
          aiSummary: ai
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to send email');
      }
      setEmailSendStatus('success');
      if (reportIdToUpdate) {
         updateGeneratedReportStatus(reportIdToUpdate, 'success');
      }
    } catch (e: any) {
      console.error(e);
      setEmailSendStatus('error');
      if (reportIdToUpdate) {
         updateGeneratedReportStatus(reportIdToUpdate, 'failed');
      }
    }
  };

  const handleDownloadFromHistory = (report: any, type: 'excel' | 'pdf') => {
    // In a real app, this would fetch from storage
    // Here we just simulate a download for demonstration since we don't store base64 in history
    alert(`In a production environment, this would download the ${type.toUpperCase()} file from secure cloud storage.`);
  };

  const handleSaveSchedule = () => {
    setReportSettings({ ...reportSettings!, schedule, includePdf });
    setEmailStatus('✅ Schedule saved');
    setTimeout(() => setEmailStatus(null), 3000);
  };

  const filteredReports = generatedReports?.filter(r => r.month.toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a, b) => {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
    }) || [];

  return (
    <div className="min-h-screen bg-[#050505] text-slate-200 pb-20 pt-16 md:pt-0">
      <ReportGenerationModal 
        isOpen={genModalOpen} 
        onClose={() => setGenModalOpen(false)} 
        status={genStatus}
        errorMessage={genError}
        isTestReport={isTestReport}
      />
      <ReportPreviewModal
        isOpen={previewModalOpen}
        onClose={() => setPreviewModalOpen(false)}
        reportData={reportData}
        onEmailNow={() => sendEmailNow()}
        emailStatus={emailSendStatus}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* Premium Hero Section */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-indigo-900/40 via-neutral-900 to-black border border-white/10 shadow-2xl p-8 lg:p-12">
           <div className="absolute top-0 right-0 p-12 opacity-20 pointer-events-none">
              <BrainCircuit size={200} className="text-indigo-400 blur-3xl" />
           </div>
           
           <div className="relative z-10 flex flex-col lg:flex-row gap-8 justify-between">
              <div>
                 <h1 className="text-4xl lg:text-5xl font-bold text-white tracking-tight mb-4">Enterprise Reporting</h1>
                 <p className="text-lg text-indigo-200/80 max-w-xl">
                   Automatically generated business intelligence. Beautifully formatted, AI-summarized, and delivered straight to your inbox.
                 </p>
                 <div className="flex flex-wrap gap-4 mt-8">
                    <div className="flex items-center gap-2 bg-white/5 backdrop-blur-md border border-white/10 rounded-full px-4 py-2">
                       <CheckCircle2 size={16} className="text-emerald-400" />
                       <span className="text-sm font-medium text-white">AI Status: Active</span>
                    </div>
                    <div className="flex items-center gap-2 bg-white/5 backdrop-blur-md border border-white/10 rounded-full px-4 py-2">
                       <Mail size={16} className={reportSettings?.verificationStatus === 'verified' ? "text-emerald-400" : "text-amber-400"} />
                       <span className="text-sm font-medium text-white">Email: {reportSettings?.verificationStatus === 'verified' ? 'Verified' : 'Pending'}</span>
                    </div>
                    <div className="flex items-center gap-2 bg-white/5 backdrop-blur-md border border-white/10 rounded-full px-4 py-2">
                       <Clock size={16} className="text-indigo-400" />
                       <span className="text-sm font-medium text-white">Schedule: {schedule.frequency.charAt(0).toUpperCase() + schedule.frequency.slice(1)}</span>
                    </div>
                 </div>
              </div>

              <div className="grid grid-cols-2 gap-4 lg:w-1/3 shrink-0">
                 <div className="bg-black/40 backdrop-blur-md border border-white/10 rounded-2xl p-5 flex flex-col justify-center">
                    <p className="text-xs text-slate-400 font-medium uppercase tracking-wider mb-1">Next Report</p>
                    <p className="text-xl font-bold text-white">1st {format(new Date(), 'MMM')}</p>
                 </div>
                 <div className="bg-black/40 backdrop-blur-md border border-white/10 rounded-2xl p-5 flex flex-col justify-center">
                    <p className="text-xs text-slate-400 font-medium uppercase tracking-wider mb-1">Last Delivery</p>
                    <p className="text-xl font-bold text-white">{generatedReports?.[0] ? format(parseISO(generatedReports[0].date), 'MMM d, yyyy') : 'Never'}</p>
                 </div>
              </div>
           </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
           {/* Email Delivery Card */}
           <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-[#0f1016] border border-white/10 rounded-[2rem] p-8 shadow-xl relative overflow-hidden group hover:border-indigo-500/30 transition-colors">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 to-purple-500 opacity-50" />
              
              <div className="flex items-center gap-4 mb-8">
                 <div className="w-12 h-12 bg-indigo-500/10 rounded-2xl flex items-center justify-center border border-indigo-500/20 group-hover:scale-110 transition-transform">
                    <Mail size={24} className="text-indigo-400" />
                 </div>
                 <div>
                   <h2 className="text-2xl font-bold text-white">Delivery Settings</h2>
                   <p className="text-sm text-slate-400">Configure where reports are sent</p>
                 </div>
              </div>

              <div className="space-y-6">
                 <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-400 flex justify-between">
                       Target Email Address
                       {reportSettings?.verificationStatus === 'verified' && <span className="text-emerald-400 flex items-center gap-1"><CheckCircle2 size={14}/> Verified</span>}
                       {reportSettings?.verificationStatus === 'pending' && <span className="text-amber-400 flex items-center gap-1"><AlertCircle size={14}/> Pending Verification</span>}
                    </label>
                    <div className="flex flex-col sm:flex-row gap-3">
                       <input
                         type="email"
                         value={emailInput}
                         onChange={(e) => setEmailInput(e.target.value)}
                         placeholder="ceo@company.com"
                         className="flex-1 bg-black/40 border border-white/10 rounded-xl px-4 min-h-[48px] text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                       />
                       <button onClick={handleSaveEmail} className="min-h-[48px] px-6 bg-white/5 hover:bg-white/10 text-white font-medium rounded-xl transition-all border border-white/10 shrink-0">
                         Save Email
                       </button>
                    </div>
                    {emailStatus && (
                      <p className={cn("text-sm mt-2", emailStatus.includes('❌') ? "text-red-400" : "text-emerald-400")}>
                        {emailStatus}
                      </p>
                    )}
                 </div>

                 {reportSettings?.emailAddress && reportSettings.verificationStatus !== 'verified' && (
                    <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 flex items-start gap-3">
                       <AlertCircle size={20} className="text-amber-400 shrink-0 mt-0.5" />
                       <div>
                         <p className="text-sm font-medium text-amber-400">Email Verification Required</p>
                         <p className="text-xs text-amber-200/80 mt-1 mb-3">You must verify ownership of this email address before receiving automated reports.</p>
                         <button onClick={handleVerifyEmail} disabled={isVerifying} className="px-4 py-2 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-sm font-medium rounded-lg transition-colors flex items-center gap-2">
                           {isVerifying ? <Loader2 size={16} className="animate-spin" /> : <Shield size={16} />}
                           {isVerifying ? 'Sending...' : 'Send Verification Email'}
                         </button>
                       </div>
                    </div>
                 )}

                 <div className="pt-6 border-t border-white/5 grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <button
                      onClick={() => generateReport('test_report')}
                      className="min-h-[48px] px-4 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 font-medium rounded-xl transition-all flex items-center justify-center gap-2 border border-indigo-500/20"
                    >
                      <RefreshCcw size={18} /> Test Delivery
                    </button>
                    <button
                      onClick={() => generateReport('monthly_report')}
                      className="min-h-[48px] px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl shadow-lg shadow-indigo-500/20 transition-all flex items-center justify-center gap-2"
                    >
                      <BrainCircuit size={18} /> Generate Report
                    </button>
                 </div>
              </div>
           </motion.div>

           {/* Schedule Settings Card */}
           <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-[#0f1016] border border-white/10 rounded-[2rem] p-8 shadow-xl group hover:border-purple-500/30 transition-colors">
              <div className="flex items-center gap-4 mb-8">
                 <div className="w-12 h-12 bg-purple-500/10 rounded-2xl flex items-center justify-center border border-purple-500/20 group-hover:scale-110 transition-transform">
                    <Settings size={24} className="text-purple-400" />
                 </div>
                 <div>
                   <h2 className="text-2xl font-bold text-white">Automation Rules</h2>
                   <p className="text-sm text-slate-400">Configure report generation schedule</p>
                 </div>
              </div>

              <div className="space-y-6">
                 <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                       <label className="text-sm font-semibold text-slate-400">Frequency</label>
                       <div className="relative">
                         <select
                           value={schedule.frequency}
                           onChange={(e) => setSchedule({ ...schedule, frequency: e.target.value as any })}
                           className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500/50 appearance-none transition-colors"
                         >
                           <option value="monthly">Monthly</option>
                           <option value="weekly">Weekly</option>
                           <option value="custom">Custom Date</option>
                         </select>
                         <ChevronRight size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 rotate-90 pointer-events-none" />
                       </div>
                    </div>
                    
                    <div className="space-y-2">
                       <label className="text-sm font-semibold text-slate-400">Time (24H)</label>
                       <input
                         type="time"
                         value={schedule.time}
                         onChange={(e) => setSchedule({ ...schedule, time: e.target.value })}
                         className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500/50 transition-colors [&::-webkit-calendar-picker-indicator]:filter [&::-webkit-calendar-picker-indicator]:invert"
                       />
                    </div>
                 </div>

                 {schedule.frequency === 'custom' && (
                    <div className="space-y-2">
                       <label className="text-sm font-semibold text-slate-400">Day of the Month (1-31)</label>
                       <input
                         type="number"
                         min="1" max="31"
                         value={schedule.customDay || 1}
                         onChange={(e) => setSchedule({ ...schedule, customDay: parseInt(e.target.value) })}
                         className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500/50 transition-colors"
                       />
                    </div>
                 )}

                 <div className="bg-white/5 border border-white/5 rounded-xl p-4">
                    <label className="flex items-center gap-3 cursor-pointer group/label">
                       <div className="relative flex items-center justify-center">
                         <input type="checkbox" checked={includePdf} onChange={(e) => setIncludePdf(e.target.checked)} className="peer sr-only" />
                         <div className="w-5 h-5 border-2 border-slate-500 rounded bg-transparent peer-checked:bg-purple-500 peer-checked:border-purple-500 transition-colors flex items-center justify-center">
                           <CheckCircle2 size={14} className="text-white opacity-0 peer-checked:opacity-100 transition-opacity" />
                         </div>
                       </div>
                       <div className="flex flex-col">
                         <span className="text-sm font-medium text-white group-hover/label:text-purple-300 transition-colors">Include PDF Executive Summary</span>
                         <span className="text-xs text-slate-400">Attach a beautifully formatted PDF to the email</span>
                       </div>
                    </label>
                 </div>

                 <div className="pt-4">
                    <button onClick={handleSaveSchedule} className="w-full py-3 bg-white/5 hover:bg-white/10 text-white font-medium rounded-xl transition-all border border-white/10">
                      Save Schedule Configuration
                    </button>
                 </div>
              </div>
           </motion.div>
        </div>

        {/* Report History */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-[#0f1016] border border-white/10 rounded-[2rem] overflow-hidden shadow-xl">
           <div className="p-8 border-b border-white/5">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                 <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center border border-emerald-500/20">
                       <FileText size={24} className="text-emerald-400" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-white">Report Archives</h2>
                      <p className="text-sm text-slate-400">View and download past reports</p>
                    </div>
                 </div>
                 
                 <div className="flex items-center gap-3">
                    <div className="relative">
                       <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                       <input 
                         type="text" 
                         placeholder="Search month..." 
                         value={searchQuery}
                         onChange={(e) => setSearchQuery(e.target.value)}
                         className="bg-black/40 border border-white/10 rounded-xl pl-9 pr-4 py-2 text-sm text-white focus:outline-none focus:border-emerald-500/50 w-full md:w-48"
                       />
                    </div>
                    <button 
                      onClick={() => setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc')}
                      className="p-2 bg-white/5 border border-white/10 rounded-xl text-slate-400 hover:text-white transition-colors"
                    >
                       <ArrowUpDown size={18} />
                    </button>
                 </div>
              </div>
           </div>

           <div className="p-4 sm:p-8 overflow-x-auto">
              <table className="w-full min-w-[700px]">
                 <thead>
                    <tr className="border-b border-white/5">
                       <th className="text-left py-4 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Report Details</th>
                       <th className="text-left py-4 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Date Generated</th>
                       <th className="text-left py-4 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                       <th className="text-left py-4 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Size</th>
                       <th className="text-right py-4 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
                    </tr>
                 </thead>
                 <tbody>
                    <AnimatePresence>
                       {filteredReports.map((report) => (
                          <motion.tr 
                            key={report.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="border-b border-white/5 hover:bg-white/[0.02] transition-colors group"
                          >
                             <td className="py-4 px-4">
                               <div className="flex items-center gap-3">
                                 <div className="p-2 bg-white/5 rounded-lg text-slate-300">
                                   <FileSpreadsheet size={18} />
                                 </div>
                                 <div>
                                   <p className="font-semibold text-white">{report.month} Report</p>
                                   <p className="text-xs text-slate-500">{report.type === 'test_report' ? 'Test Generation' : 'Automated Schedule'}</p>
                                 </div>
                               </div>
                             </td>
                             <td className="py-4 px-4 text-sm text-slate-300">
                                <div className="flex items-center gap-2">
                                  <Calendar size={14} className="text-slate-500" />
                                  {format(parseISO(report.date), 'MMM d, yyyy h:mm a')}
                                </div>
                             </td>
                             <td className="py-4 px-4">
                                <span className={cn(
                                  "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border",
                                  report.status === 'success' ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : 
                                  "bg-red-500/10 text-red-400 border-red-500/20"
                                )}>
                                  {report.status === 'success' ? <CheckCircle2 size={12}/> : <AlertCircle size={12}/>}
                                  {report.status.charAt(0).toUpperCase() + report.status.slice(1)}
                                </span>
                             </td>
                             <td className="py-4 px-4 text-sm text-slate-400">
                                <div className="flex flex-col gap-1 text-xs">
                                  <span>XLSX: {report.fileSizeXlsx ? (report.fileSizeXlsx / 1024).toFixed(1) + ' KB' : 'N/A'}</span>
                                  <span>PDF: {report.fileSizePdf ? (report.fileSizePdf / 1024).toFixed(1) + ' KB' : 'N/A'}</span>
                                </div>
                             </td>
                             <td className="py-4 px-4 text-right">
                                <div className="flex items-center justify-end gap-2 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                                  <button onClick={() => handleDownloadFromHistory(report, 'excel')} className="p-2 text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/10 rounded-lg transition-colors" title="Download Excel">
                                    <FileSpreadsheet size={16} />
                                  </button>
                                  <button onClick={() => handleDownloadFromHistory(report, 'pdf')} className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors" title="Download PDF">
                                    <FileText size={16} />
                                  </button>
                                  <div className="w-px h-4 bg-white/10 mx-1" />
                                  <button onClick={() => deleteGeneratedReport(report.id)} className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors" title="Delete">
                                    <Trash2 size={16} />
                                  </button>
                                </div>
                             </td>
                          </motion.tr>
                       ))}
                    </AnimatePresence>
                 </tbody>
              </table>

              {filteredReports.length === 0 && (
                <div className="text-center py-16 px-4">
                  <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <FileText size={32} className="text-slate-600" />
                  </div>
                  <h3 className="text-lg font-medium text-white mb-1">No reports found</h3>
                  <p className="text-sm text-slate-400">Reports will appear here once they are generated.</p>
                </div>
              )}
           </div>
        </motion.div>

      </div>
    </div>
  );
}
