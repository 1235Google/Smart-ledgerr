import React, { useRef, useState } from 'react';
import { useStore } from '../context/StoreContext';
import { Settings as SettingsIcon, Download, Upload, RefreshCw, Wallet, Trash2, Moon, Lock, Shield, Smartphone, Mail, Send, CalendarClock, Globe, Bell } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn, formatCurrency, formatDate, formatDateTime, DEFAULT_REMINDER_TEMPLATE } from '../lib/utils';
import { ReceivedMoney } from '../types';

import BiometricSettings from '../components/BiometricSettings';
import ResetDataModal from "../components/ResetDataModal";

export default function Settings() {
  const { startingBalance, setStartingBalance, resetData, importData, transactions, securitySettings, updateSecuritySettings, emailSettings, updateEmailSettings, emailHistory, addEmailHistoryLog, currentBalance, generalSettings, updateGeneralSettings, customReminderTemplate, updateCustomReminderTemplate } = useStore();
  const [newBalance, setNewBalance] = useState(startingBalance.toString());
  const [showPinSetup, setShowPinSetup] = useState(false);
  const [pinSetupStep, setPinSetupStep] = useState<'create' | 'confirm'>('create');
  const [tempPin, setTempPin] = useState('');
  const [pinInput, setPinInput] = useState('');
  const [templateInput, setTemplateInput] = useState(() => customReminderTemplate || DEFAULT_REMINDER_TEMPLATE);
  const [templateSavedMessage, setTemplateSavedMessage] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [emailInput, setEmailInput] = useState(emailSettings.emailAddress || '');
  const [isTestingEmail, setIsTestingEmail] = useState(false);
  const [emailStatusMessage, setEmailStatusMessage] = useState('');
  const [showResetModal, setShowResetModal] = useState(false);
  const [emailConfig, setEmailConfig] = useState<{ configured?: boolean, ownerEmail?: string }>({});

  const [setupPinLength, setSetupPinLength] = useState<4|6>(4);

  React.useEffect(() => {
    fetch('/api/email-config')
      .then(res => res.json())
      .then(data => {
        setEmailConfig(data);
        if (data.ownerEmail && !emailSettings.emailAddress) {
          setEmailInput(data.ownerEmail);
        }
      })
      .catch(err => console.error("Failed to fetch email config:", err));
  }, [emailSettings.emailAddress]);

  const handleUpdateBalance = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = Number(newBalance);
    if (!isNaN(amount)) {
      setStartingBalance(amount);
      alert('Starting balance updated successfully.');
    }
  };

  const handleSaveEmailSettings = () => {
    if (!emailInput) {
      setEmailStatusMessage("❌ Email address is required.");
      setTimeout(() => setEmailStatusMessage(''), 3000);
      return;
    }
    if (!/^\S+@\S+\.\S+$/.test(emailInput)) {
      setEmailStatusMessage("❌ Invalid email format.");
      setTimeout(() => setEmailStatusMessage(''), 3000);
      return;
    }
    updateEmailSettings({ emailAddress: emailInput, verificationStatus: 'none' });
    setEmailStatusMessage('✅ Email saved successfully');
    setTimeout(() => setEmailStatusMessage(''), 3000);
  };

  const handleVerifyEmail = async () => {
    const targetEmail = emailSettings.emailAddress;
    if (!targetEmail) {
      setEmailStatusMessage("❌ Please save your email address first.");
      setTimeout(() => setEmailStatusMessage(''), 3000);
      return;
    }
    updateEmailSettings({ verificationStatus: 'pending' });
    setEmailStatusMessage('Sending verification...');
    
    try {
      const res = await fetch('/api/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: targetEmail })
      });
      if (res.ok) {
        updateEmailSettings({ verificationStatus: 'verified' });
        setEmailStatusMessage('✅ Verified');
      } else {
        updateEmailSettings({ verificationStatus: 'invalid' });
        setEmailStatusMessage('❌ Unable to send the verification at the moment. Please try again later or contact the administrator.');
      }
    } catch (err) {
      updateEmailSettings({ verificationStatus: 'invalid' });
      setEmailStatusMessage('❌ Unable to send the verification at the moment. Please try again later or contact the administrator.');
    } finally {
      setTimeout(() => setEmailStatusMessage(''), 4000);
    }
  };

  const handleTestEmail = async () => {
    const targetEmail = emailSettings.emailAddress;
    if (!targetEmail) {
      setEmailStatusMessage("❌ Please save your email address first.");
      setTimeout(() => setEmailStatusMessage(''), 3000);
      return;
    }
    setIsTestingEmail(true);
    setEmailStatusMessage('Sending...');

    try {
      const now = new Date();
      const currentMonth = new Intl.DateTimeFormat('en-IN', { month: 'long', year: 'numeric', timeZone: generalSettings?.timezone }).format(now);
      
      const incomeTransactions = transactions
        .filter((t): t is ReceivedMoney => t.type === 'received')
        .filter(t => {
          const txDate = new Date(t.date);
          return txDate.getMonth() === now.getMonth() && txDate.getFullYear() === now.getFullYear();
        });

      const incomeThisMonth = incomeTransactions.reduce((sum, t) => sum + t.amount, 0);
      const numberOfIncomeTransactions = incomeTransactions.length;

      let highestPaymentReceived = null;
      if (incomeTransactions.length > 0) {
        const highestTx = [...incomeTransactions].sort((a, b) => b.amount - a.amount)[0];
        highestPaymentReceived = {
          personName: highestTx.personName,
          amount: highestTx.amount,
          dateReceived: formatDate(highestTx.date, generalSettings?.timezone)
        };
      }

      const formattedBalance = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(currentBalance);
      const formattedIncome = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(incomeThisMonth);
      
      let aiSummary = `During ${currentMonth}, your SmartLedger account maintained a current balance of ${formattedBalance}. You received a total income of ${formattedIncome} across ${numberOfIncomeTransactions} transaction${numberOfIncomeTransactions !== 1 ? 's' : ''}.`;
      if (highestPaymentReceived) {
        aiSummary += ` The highest payment of ${new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(highestPaymentReceived.amount)} was received from ${highestPaymentReceived.personName} on ${highestPaymentReceived.dateReceived}.`;
      }

      const res = await fetch('/api/send-monthly-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: targetEmail,
          month: currentMonth,
          currentBalance: currentBalance,
          incomeThisMonth: incomeThisMonth,
          highestPaymentReceived: highestPaymentReceived,
          numberOfIncomeTransactions: numberOfIncomeTransactions,
          aiSummary: aiSummary
        })
      });

      if (res.ok) {
        setEmailStatusMessage('✅ Delivered');
        addEmailHistoryLog({
          date: new Date().toISOString(),
          month: currentMonth,
          recipient: targetEmail,
          status: 'success'
        });
      } else {
        setEmailStatusMessage('❌ Unable to send the report at the moment. Please try again later or contact the administrator.');
        addEmailHistoryLog({
          date: new Date().toISOString(),
          month: currentMonth,
          recipient: targetEmail,
          status: 'failed'
        });
      }
    } catch (err) {
      console.error(err);
      setEmailStatusMessage('❌ Unable to send the report at the moment. Please try again later or contact the administrator.');
      addEmailHistoryLog({
        date: new Date().toISOString(),
        month: new Intl.DateTimeFormat('en-IN', { month: 'long', year: 'numeric', timeZone: generalSettings?.timezone }).format(new Date()),
        recipient: targetEmail,
        status: 'failed'
      });
    } finally {
      setIsTestingEmail(false);
      setTimeout(() => setEmailStatusMessage(''), 5000);
    }
  };

  const handlePinInput = (digit: string) => {
    if (pinInput.length < setupPinLength) {
      const newVal = pinInput + digit;
      setPinInput(newVal);
      
      if (newVal.length === setupPinLength) {
        if (pinSetupStep === 'create') {
          setTempPin(newVal);
          setPinSetupStep('confirm');
          setPinInput('');
        } else {
          if (newVal === tempPin) {
            updateSecuritySettings({ pinEnabled: true, pin: newVal });
            setShowPinSetup(false);
            setPinInput('');
            setTempPin('');
            setPinSetupStep('create');
          } else {
            alert('PINs do not match. Try again.');
            setPinSetupStep('create');
            setPinInput('');
            setTempPin('');
          }
        }
      }
    }
  };

  const handleDeletePin = () => {
    setPinInput(prev => prev.slice(0, -1));
  };

  const handleExport = () => {
    const data = {
      isSetupComplete: true,
      startingBalance,
      transactions
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `smart-ledger-export-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        if (json && typeof json.startingBalance === 'number' && Array.isArray(json.transactions)) {
          if (confirm('Are you sure you want to import this data? It will overwrite your current data.')) {
            importData(json);
            alert('Data imported successfully.');
          }
        } else {
          alert('Invalid file format.');
        }
      } catch (err) {
        alert('Failed to parse file.');
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleReset = () => {
    setShowResetModal(true);
  };


  return (
    <div className="space-y-8 pb-20 md:pb-0 max-w-3xl">
      <header className="mb-8">
        <h1 className="text-3xl font-semibold tracking-tight text-white flex items-center gap-3">
          <SettingsIcon className="text-neutral-400" />
          Settings
        </h1>
        <p className="text-neutral-400 mt-1">Manage your account preferences and data.</p>
      </header>

      <div className="space-y-6">
        {/* Starting Balance Setting */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white/5 border border-white/10 rounded-[2.5rem] p-6 backdrop-blur-xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-blue-500/10 rounded-xl text-blue-400"><Wallet size={20} /></div>
            <div>
              <h2 className="text-lg font-bold text-white">Starting Balance</h2>
              <p className="text-sm text-slate-400">Update your initial bank balance.</p>
            </div>
          </div>
          
          <form onSubmit={handleUpdateBalance} className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-bold">₹</span>
              <input
                type="number"
                value={newBalance}
                onChange={(e) => setNewBalance(e.target.value)}
                className="w-full bg-black/20 border border-white/10 rounded-xl min-h-[48px] pl-10 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-colors font-mono"
                required
              />
            </div>
            <button type="submit" className="min-h-[48px] px-6 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-all shadow-lg shadow-blue-600/30 whitespace-nowrap">
              Update
            </button>
          </form>
        </motion.div>

        {/* Timezone Settings */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }} className="bg-white/5 border border-white/10 rounded-[2.5rem] p-6 backdrop-blur-xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-blue-500/10 rounded-xl text-blue-400"><Globe size={20} /></div>
            <div>
              <h2 className="text-lg font-bold text-white">Timezone Preferences</h2>
              <p className="text-sm text-slate-400">Display dates and times in your local timezone.</p>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-4">
            <select
              value={generalSettings?.timezone || 'Asia/Kolkata'}
              onChange={(e) => updateGeneralSettings({ timezone: e.target.value })}
              className="flex-1 bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500/50 appearance-none"
            >
              <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
              <option value="America/New_York">America/New_York (EST/EDT)</option>
              <option value="America/Los_Angeles">America/Los_Angeles (PST/PDT)</option>
              <option value="Europe/London">Europe/London (GMT/BST)</option>
              <option value="Europe/Paris">Europe/Paris (CET/CEST)</option>
              <option value="Asia/Tokyo">Asia/Tokyo (JST)</option>
              <option value="Asia/Singapore">Asia/Singapore (SGT)</option>
              <option value="Australia/Sydney">Australia/Sydney (AEST/AEDT)</option>
              <option value="UTC">UTC</option>
            </select>
          </div>
        </motion.div>

        {/* Reminder Template Setting */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.09 }} className="bg-white/5 border border-white/10 rounded-[2.5rem] p-6 backdrop-blur-xl">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-500/10 rounded-xl text-amber-400"><Bell size={20} /></div>
              <div>
                <h2 className="text-lg font-bold text-white">WhatsApp Reminder Template</h2>
                <p className="text-sm text-slate-400">Customize default text sent when tapping Remind.</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                updateCustomReminderTemplate(DEFAULT_REMINDER_TEMPLATE);
                setTemplateInput(DEFAULT_REMINDER_TEMPLATE);
                setTemplateSavedMessage('Reset to Default');
                setTimeout(() => setTemplateSavedMessage(''), 3000);
              }}
              className="text-xs text-amber-400 hover:text-amber-300 font-semibold underline"
            >
              Reset Default
            </button>
          </div>

          <div className="space-y-3">
            <textarea
              value={templateInput}
              onChange={(e) => setTemplateInput(e.target.value)}
              rows={8}
              className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500/50 font-mono resize-y"
            />
            <div className="flex items-center justify-between flex-wrap gap-2">
              <span className="text-[10px] text-slate-400">
                Placeholders: &#123;CustomerName&#125;, &#123;AmountDue&#125;, &#123;DueDate&#125;, &#123;OverdueDays&#125;
              </span>
              <button
                type="button"
                onClick={() => {
                  updateCustomReminderTemplate(templateInput);
                  setTemplateSavedMessage('✅ Saved Template');
                  setTimeout(() => setTemplateSavedMessage(''), 3000);
                }}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl text-xs transition-all shadow-lg shadow-amber-500/20"
              >
                Save Template
              </button>
            </div>
            {templateSavedMessage && (
              <p className="text-xs text-amber-400 font-semibold">{templateSavedMessage}</p>
            )}
          </div>
        </motion.div>

        {/* Theme Setting */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white/5 border border-white/10 rounded-[2.5rem] p-6 backdrop-blur-xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-500/10 rounded-xl text-indigo-400"><Moon size={20} /></div>
            <div>
              <h2 className="text-lg font-bold text-white">App Theme</h2>
              <p className="text-sm text-slate-400">Smart Ledger is optimized for Dark Mode.</p>
            </div>
          </div>
          <div className="px-4 py-2 bg-indigo-500/10 text-indigo-400 rounded-lg text-sm font-semibold border border-indigo-500/20">
            Dark Mode Active
          </div>
        </motion.div>

        {/* Email Settings */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }} className="bg-white/5 border border-white/10 rounded-[2.5rem] p-6 backdrop-blur-xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-purple-500/10 rounded-xl text-purple-400"><Mail size={20} /></div>
            <div>
              <h2 className="text-lg font-bold text-white">Monthly Email Reports</h2>
              <p className="text-sm text-slate-400">Get automatic income summaries sent to your inbox.</p>
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-xl border border-white/5 bg-black/20">
              <div className="flex items-center gap-3">
                <CalendarClock size={18} className="text-purple-400" />
                <div>
                  <p className="font-semibold text-white text-sm">Enable Monthly Reports</p>
                  <p className="text-xs text-slate-400">Receive an email on the 1st of every month</p>
                </div>
              </div>
              <button
                onClick={() => updateEmailSettings({ enabled: !emailSettings.enabled })}
                className={cn(
                  "px-4 min-h-[48px] md:min-h-0 md:py-1.5 rounded-lg text-sm font-semibold transition-colors border",
                  emailSettings.enabled 
                    ? "bg-purple-500/10 text-purple-400 border-purple-500/20 hover:bg-purple-500/20" 
                    : "bg-white/5 text-slate-400 border-white/10 hover:bg-white/10"
                )}
              >
                {emailSettings.enabled ? 'Enabled' : 'Disabled'}
              </button>
            </div>

            {emailSettings.enabled && (
              <div className="flex items-center justify-between p-4 rounded-xl border border-white/5 bg-white/5">
                <div>
                  <p className="text-xs text-slate-400 mb-1">Last Report Sent</p>
                  <p className="text-sm font-medium text-white">
                    {emailHistory.length > 0 ? formatDate(emailHistory[0].date, generalSettings?.timezone) : 'Never'}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-slate-400 mb-1">Next Scheduled Report</p>
                  <p className="text-sm font-medium text-purple-400">
                    {formatDate(new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1).toISOString(), generalSettings?.timezone)}
                  </p>
                </div>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-4 items-end">
              <div className="flex-1 w-full space-y-1.5">
                <label className="text-sm font-semibold text-slate-400 pl-1 flex items-center gap-2">
                  Email Address
                  {emailSettings.verificationStatus === 'verified' && <span className="text-emerald-400 text-xs flex items-center gap-1">✓ Verified</span>}
                  {emailSettings.verificationStatus === 'pending' && <span className="text-amber-400 text-xs flex items-center gap-1">⏳ Pending Verification</span>}
                  {emailSettings.verificationStatus === 'invalid' && <span className="text-red-400 text-xs flex items-center gap-1">✗ Invalid Email</span>}
                </label>
                <input
                  type="email"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 min-h-[48px] text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-colors"
                />
              </div>
              <button
                onClick={handleSaveEmailSettings}
                className="min-h-[48px] px-6 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-xl transition-all border border-white/5 w-full sm:w-auto shrink-0"
              >
                Save
              </button>
            </div>

            <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-white/5 mt-4">
              <div className="flex flex-col w-full sm:w-auto">
                {emailStatusMessage && (
                  <span className={`text-sm font-medium ${emailStatusMessage.includes('❌') ? 'text-red-400' : 'text-emerald-400'}`}>
                    {emailStatusMessage}
                  </span>
                )}
              </div>
              <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                <button
                  onClick={handleVerifyEmail}
                  disabled={!emailSettings.emailAddress}
                  className="min-h-[48px] px-6 bg-white/10 hover:bg-white/20 disabled:opacity-50 text-white font-semibold rounded-xl transition-all flex items-center justify-center gap-2 border border-white/5 w-full sm:w-auto shrink-0"
                >
                  <Shield size={18} />
                  Verify Email
                </button>
                <button
                  onClick={handleTestEmail}
                  disabled={isTestingEmail || !emailSettings.emailAddress}
                  className="min-h-[48px] px-6 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:hover:bg-purple-600 text-white font-semibold rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-purple-600/20 w-full sm:w-auto shrink-0"
                >
                  <Send size={18} />
                  {isTestingEmail ? 'Sending...' : 'Send Test Report'}
                </button>
              </div>
            </div>
            
            {emailHistory.length > 0 && (
              <div className="mt-6">
                <h3 className="text-sm font-bold text-white mb-3">Recent Reports</h3>
                <div className="space-y-2">
                  {emailHistory.slice(0, 3).map((log) => (
                    <div key={log.id} className="flex items-center justify-between p-3 rounded-lg bg-black/20 border border-white/5">
                      <div>
                        <p className="text-sm text-white font-medium">{log.month}</p>
                        <p className="text-xs text-slate-400">{formatDateTime(log.date, generalSettings?.timezone)}</p>
                      </div>
                      <div className={cn("px-2 py-1 rounded text-xs font-bold", log.status === 'success' ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400")}>
                        {log.status.toUpperCase()}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </motion.div>

        {/* Security Settings */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="bg-white/5 border border-white/10 rounded-[2.5rem] p-6 backdrop-blur-xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-emerald-500/10 rounded-xl text-emerald-400"><Shield size={20} /></div>
            <div>
              <h2 className="text-lg font-bold text-white">Security</h2>
              <p className="text-sm text-slate-400">Manage app lock and authentication.</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-xl border border-white/5 bg-black/20">
              <div className="flex items-center gap-3">
                <Lock size={18} className="text-emerald-400" />
                <div>
                  <p className="font-semibold text-white text-sm">PIN Lock</p>
                  <p className="text-xs text-slate-400">Require PIN to open app</p>
                </div>
              </div>
              <button
                onClick={() => {
                  if (securitySettings.pinEnabled) {
                    updateSecuritySettings({ pinEnabled: false, pin: null });
                  } else {
                    setShowPinSetup(true);
                  }
                }}
                className={cn(
                  "px-4 min-h-[48px] md:min-h-0 md:py-1.5 rounded-lg text-sm font-semibold transition-colors border",
                  securitySettings.pinEnabled 
                    ? "bg-red-500/10 text-red-400 border-red-500/20 hover:bg-red-500/20" 
                    : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20"
                )}
              >
                {securitySettings.pinEnabled ? 'Disable' : 'Enable'}
              </button>
            </div>

            {securitySettings.pinEnabled && (
              <>
                <BiometricSettings />
              </>
            )}

            <div className="flex items-center justify-between p-4 rounded-xl border border-white/5 bg-black/20">
              <div className="flex items-center gap-3">
                <Lock size={18} className="text-amber-400" />
                <div>
                  <p className="font-semibold text-white text-sm">Auto Lock Timer</p>
                  <p className="text-xs text-slate-400">Lock app after inactivity</p>
                </div>
              </div>
              <select
                value={securitySettings.autoLockTime || 0}
                onChange={(e) => updateSecuritySettings({ autoLockTime: Number(e.target.value) })}
                className="bg-black/40 border border-white/10 rounded-lg px-3 min-h-[48px] md:min-h-[auto] md:py-1.5 text-white text-sm focus:outline-none appearance-none"
              >
                <option value={0}>Disabled</option>
                <option value={1}>1 minute</option>
                <option value={2}>2 minutes</option>
                <option value={5}>5 minutes</option>
              </select>
            </div>

            <div className="flex items-center justify-between p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5">
              <div className="flex items-center gap-3">
                <Shield size={18} className="text-emerald-400" />
                <div>
                  <p className="font-semibold text-white text-sm">Encrypted Storage</p>
                  <p className="text-xs text-slate-400">Data is securely encrypted locally</p>
                </div>
              </div>
              <div className="px-3 py-1 bg-emerald-500/20 text-emerald-400 rounded-md text-xs font-bold">
                ACTIVE ✅
              </div>
            </div>
          </div>
        </motion.div>

        {/* Data Management */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-white/5 border border-white/10 rounded-[2.5rem] p-6 backdrop-blur-xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-amber-500/10 rounded-xl text-amber-400"><RefreshCw size={20} /></div>
            <div>
              <h2 className="text-lg font-bold text-white">Data Management</h2>
              <p className="text-sm text-slate-400">Export, import, or reset your financial data.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <button onClick={handleExport} className="flex items-center justify-center gap-2 p-4 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-white transition-colors font-semibold">
              <Download size={18} /> Export Data
            </button>
            <button onClick={() => fileInputRef.current?.click()} className="flex items-center justify-center gap-2 p-4 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-white transition-colors font-semibold">
              <Upload size={18} /> Import Data
            </button>
            <input type="file" accept=".json" ref={fileInputRef} onChange={handleImport} className="hidden" />
          </div>

          <div className="mt-8 pt-6 border-t border-red-500/20">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-white font-bold">Danger Zone</h3>
                <p className="text-sm text-red-400/80 mt-1">Permanently delete all your data and start fresh.</p>
              </div>
              <button onClick={handleReset} className="flex items-center justify-center gap-2 px-6 min-h-[48px] bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white border border-red-500/30 rounded-xl text-sm font-semibold transition-all shrink-0">
                <Trash2 size={16} /> Reset All Data
              </button>
            </div>
          </div>
        </motion.div>
      </div>

      <ResetDataModal isOpen={showResetModal} onClose={() => setShowResetModal(false)} />
      <AnimatePresence>
        {showPinSetup && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-neutral-950/90 backdrop-blur-sm flex flex-col items-center justify-center p-6"
          >
            <div className="flex flex-col items-center max-w-sm w-full bg-neutral-900 border border-white/10 rounded-[2.5rem] p-8 shadow-2xl">
              <div className="w-16 h-16 bg-emerald-500/10 text-emerald-400 rounded-full flex items-center justify-center mb-6">
                <Lock size={32} />
              </div>
              <h2 className="text-xl font-bold text-white mb-2">
                {pinSetupStep === 'create' ? 'Create PIN' : 'Confirm PIN'}
              </h2>
              <p className="text-slate-400 mb-6 text-sm text-center">
                {pinSetupStep === 'create' ? `Enter a ${setupPinLength}-digit PIN to secure your app.` : 'Re-enter your PIN to confirm.'}
              </p>
              
              {pinSetupStep === 'create' && (
                <div className="flex gap-2 mb-6">
                  <button
                    onClick={() => {
                      setSetupPinLength(4);
                      setPinInput('');
                    }}
                    className={cn(
                      "px-3 py-1 rounded-lg text-xs font-semibold transition-colors",
                      setupPinLength === 4 ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" : "bg-white/5 text-slate-400 hover:text-white"
                    )}
                  >
                    4 Digits
                  </button>
                  <button
                    onClick={() => {
                      setSetupPinLength(6);
                      setPinInput('');
                    }}
                    className={cn(
                      "px-3 py-1 rounded-lg text-xs font-semibold transition-colors",
                      setupPinLength === 6 ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" : "bg-white/5 text-slate-400 hover:text-white"
                    )}
                  >
                    6 Digits
                  </button>
                </div>
              )}

              <div className="flex gap-4 mb-8">
                {Array.from({ length: setupPinLength }).map((_, i) => (
                  <div 
                    key={i}
                    className={cn(
                      "w-4 h-4 rounded-full transition-all duration-300",
                      i < pinInput.length ? "bg-emerald-400 scale-110" : "bg-white/20"
                    )}
                  />
                ))}
              </div>
              
              <div className="grid grid-cols-3 gap-4 w-full max-w-[240px] mb-6">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                  <button
                    key={num}
                    onClick={() => handlePinInput(num.toString())}
                    className="w-16 h-16 flex items-center justify-center text-xl font-semibold text-white bg-white/5 hover:bg-white/10 rounded-full transition-colors mx-auto"
                  >
                    {num}
                  </button>
                ))}
                <div />
                <button
                  onClick={() => handlePinInput('0')}
                  className="w-16 h-16 flex items-center justify-center text-xl font-semibold text-white bg-white/5 hover:bg-white/10 rounded-full transition-colors mx-auto"
                >
                  0
                </button>
                <button
                  onClick={handleDeletePin}
                  className="w-16 h-16 flex items-center justify-center text-sm font-semibold text-neutral-400 bg-white/5 hover:bg-white/10 rounded-full transition-colors mx-auto"
                >
                  DEL
                </button>
              </div>

              <button
                onClick={() => {
                  setShowPinSetup(false);
                  setPinInput('');
                  setTempPin('');
                  setPinSetupStep('create');
                }}
                className="text-slate-500 hover:text-white transition-colors text-sm font-semibold"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
