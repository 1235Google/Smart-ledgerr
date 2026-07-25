import React, { createContext, useContext, useEffect, useState } from 'react';
import { AppState, PendingMoney, ReceivedMoney, SentMoney, Transaction, SecuritySettings, EmailSettings, EmailHistoryLog, GeneralSettings, GullakEntry, GullakSettings, UnlockedAchievement, AiRecognitionSettings, AiRecognitionHistory, PosterTemplate, Customer, ReportSettings, GeneratedReport, UserProfile } from '../types';
import CryptoJS from 'crypto-js';
import { calculateProgress, ACHIEVEMENTS } from '../lib/achievements';

const SECRET_KEY = 'smart-ledger-secure-key-2026';

export function calculateNextDate(dateStr: string, frequency: string): string {
  if (frequency === 'once') return dateStr;
  const d = new Date(dateStr || new Date().toISOString().split('T')[0]);
  if (frequency === '3days') d.setDate(d.getDate() + 3);
  else if (frequency === '7days') d.setDate(d.getDate() + 7);
  else if (frequency === '15days') d.setDate(d.getDate() + 15);
  else if (frequency === 'monthly') d.setMonth(d.getMonth() + 1);
  return d.toISOString().split('T')[0];
}

interface StoreContextType extends AppState {
  setStartingBalance: (amount: number) => void;
  addCustomer: (customer: Omit<Customer, 'id' | 'createdAt'>) => void;
  updateCustomer: (id: string, customer: Partial<Omit<Customer, 'id' | 'createdAt'>>) => void;
  deleteCustomer: (id: string) => void;
  addReceivedMoney: (entry: Omit<ReceivedMoney, 'id' | 'type'>) => void;
  addSentMoney: (entry: Omit<SentMoney, 'id' | 'type'>) => void;
  addPendingMoney: (entry: Omit<PendingMoney, 'id' | 'type' | 'status' | 'nextReminderDate' | 'reminderStatus'>) => void;
  markAsReceived: (id: string) => void;
  deleteTransaction: (id: string) => void;
  toggleReminderStatus: (id: string) => void;
  updateReminderFrequency: (id: string, frequency: PendingMoney['reminderFrequency']) => void;
  advanceReminderDate: (id: string) => void;
  updateSecuritySettings: (settings: Partial<SecuritySettings>) => void;
  updateEmailSettings: (settings: Partial<EmailSettings>) => void;
  updateReportSettings: (settings: Partial<ReportSettings>) => void;
  updateGeneralSettings: (settings: Partial<GeneralSettings>) => void;
  updateAiRecognitionSettings: (settings: Partial<AiRecognitionSettings>) => void;
  addAiRecognitionHistory: (history: Omit<AiRecognitionHistory, 'id'>) => void;
  addPosterTemplate: (template: Omit<PosterTemplate, 'id'>) => void;
  updatePosterTemplate: (id: string, template: Partial<Omit<PosterTemplate, 'id'>>) => void;
  deletePosterTemplate: (id: string) => void;
  setDefaultPosterTemplate: (id: string) => void;
  addEmailHistoryLog: (log: Omit<EmailHistoryLog, 'id'>) => void;
  deleteEmailHistoryLog: (id: string) => void;
  addGeneratedReport: (report: Omit<GeneratedReport, 'id'>) => void;
  deleteGeneratedReport: (id: string) => void;
  addGullakEntry: (entry: Omit<GullakEntry, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateGullakEntry: (id: string, entry: Partial<Omit<GullakEntry, 'id' | 'createdAt' | 'updatedAt'>>) => void;
  deleteGullakEntry: (id: string) => void;
  updateGullakSettings: (settings: Partial<GullakSettings>) => void;
  resetData: () => void;
  importData: (data: AppState) => void;
  currentBalance: number;
  totalReceived: number;
  totalSent: number;
  totalPending: number;
  isLoading: boolean;
  newlyUnlocked: UnlockedAchievement | null;
  clearNewlyUnlocked: () => void;
  updateUserProfile: (profile: Partial<UserProfile>) => void;
  isAdminAuthenticated: boolean;
  adminLogin: (email: string, pass: string) => boolean;
  adminLogout: () => void;
}

const defaultState: AppState = {
  isSetupComplete: true, // Auto complete setup for demo user
  startingBalance: 14000,
  customers: [],
  transactions: [],
  gullakEntries: [],
  gullakSettings: {
    monthlyGoal: 5000,
  },
  securitySettings: {
    pinEnabled: false,
    pin: null,
    biometricEnabled: false,
    faceUnlockEnabled: false,
    autoLockTime: 2,
    registeredDevices: [],
  },
  emailSettings: {
    enabled: false,
    emailAddress: '',
    lastReportSent: null,
    nextScheduledReport: null,
  },
  emailHistory: [],
  generalSettings: {
    timezone: 'Asia/Kolkata',
  },
  aiRecognitionSettings: {
    enabled: false,
    frequency: 'manual',
    enablePhoto: true,
    enableAiMessage: true,
    whatsappDelivery: 'download_only',
    theme: 'luxury_gold',
    orientation: 'portrait'
  },
  aiRecognitionHistory: [],
  posterTemplates: [],
  unlockedAchievements: [],
  userProfile: {
    fullName: 'Rahul Sharma',
    username: 'rahul_smartledger',
    email: 'rahul.sharma@fintech.io',
    mobile: '+91 98765 43210',
    dob: '1992-06-15',
    address: '42, Connaught Place',
    city: 'New Delhi',
    state: 'Delhi',
    country: 'India',
    language: 'English (IN)',
    memberSince: '2024-01-10',
    profilePhoto: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
    businessName: 'Sharma Digital Enterprises',
    businessCategory: 'Fintech & Retail',
    gstNumber: '07AABCS1429B1Z8',
    upiId: 'sharmadigital@okaxis',
    businessAddress: '108, Cyber City, Phase 2',
    website: 'https://sharmadigital.io',
    businessLogo: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=200&auto=format&fit=crop&q=80',
    verifiedEmail: true,
    verifiedPhone: true,
    googleConnected: true,
    lastLogin: 'Today, 10:42 AM',
    activeDevice: 'Chrome on macOS (Secure Session)'
  }
};

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AppState>(defaultState);
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);
  const [newlyUnlocked, setNewlyUnlocked] = useState<UnlockedAchievement | null>(null);

  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState<boolean>(() => {
    return sessionStorage.getItem('smartledger-admin-auth') === 'true';
  });

  const adminLogin = (email: string, pass: string) => {
    if (email && pass) {
      setIsAdminAuthenticated(true);
      sessionStorage.setItem('smartledger-admin-auth', 'true');
      return true;
    }
    return false;
  };

  const adminLogout = () => {
    setIsAdminAuthenticated(false);
    sessionStorage.removeItem('smartledger-admin-auth');
  };

  const clearNewlyUnlocked = () => setNewlyUnlocked(null);


  useEffect(() => {
    const loadData = async () => {
      let saved = localStorage.getItem('smart-ledger-data');

      if (saved) {
        try {
          const bytes = CryptoJS.AES.decrypt(saved, SECRET_KEY);
          const decryptedData = JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
          setState({ 
            ...defaultState, 
            ...decryptedData, 
            userProfile: { ...defaultState.userProfile, ...(decryptedData.userProfile || {}) },
            securitySettings: { ...defaultState.securitySettings, ...decryptedData.securitySettings }, 
            emailSettings: { ...defaultState.emailSettings, ...decryptedData.emailSettings },
            generalSettings: { ...defaultState.generalSettings, ...decryptedData.generalSettings },
            aiRecognitionSettings: { ...defaultState.aiRecognitionSettings, ...decryptedData.aiRecognitionSettings }
          });
        } catch (e) {
          try {
            const parsed = JSON.parse(saved);
            setState({ 
              ...defaultState, 
              ...parsed, 
              userProfile: { ...defaultState.userProfile, ...(parsed.userProfile || {}) },
              securitySettings: { ...defaultState.securitySettings, ...parsed.securitySettings }, 
              emailSettings: { ...defaultState.emailSettings, ...parsed.emailSettings },
              generalSettings: { ...defaultState.generalSettings, ...parsed.generalSettings },
              aiRecognitionSettings: { ...defaultState.aiRecognitionSettings, ...parsed.aiRecognitionSettings }
            });
          } catch (e2) {
            setState(defaultState);
          }
        }
      } else {
        setState(defaultState);
      }
      setIsLoading(false);
      setIsInitialized(true);
    };

    loadData();
  }, []);

  useEffect(() => {
    if (!isInitialized) return;
    
    const saveData = async () => {
      const encrypted = CryptoJS.AES.encrypt(JSON.stringify(state), SECRET_KEY).toString();
      localStorage.setItem('smart-ledger-data', encrypted);
    };
    saveData();
  }, [state, isInitialized]);

  useEffect(() => {
    if (!isInitialized) return;
    
    const progress = calculateProgress(state.gullakEntries || [], state.gullakSettings);
    let newlyUnlockedLocal: UnlockedAchievement | null = null;
    const currentUnlocked = state.unlockedAchievements || [];
    let hasNew = false;
    const newUnlocked = [...currentUnlocked];

    for (const achievement of ACHIEVEMENTS) {
      if (progress[achievement.id] >= achievement.target && !currentUnlocked.some(u => u.id === achievement.id)) {
        const un: UnlockedAchievement = {
          id: achievement.id,
          unlockedAt: new Date().toISOString(),
          xpEarned: achievement.xpReward
        };
        newUnlocked.push(un);
        newlyUnlockedLocal = un; // Capture the last unlocked if multiple
        hasNew = true;
      }
    }

    if (hasNew) {
      setState(prev => ({ ...prev, unlockedAchievements: newUnlocked }));
      setNewlyUnlocked(newlyUnlockedLocal);
    }
  }, [state.gullakEntries, state.gullakSettings, isInitialized]);

  const updateSecuritySettings = (settings: Partial<SecuritySettings>) => {
    setState(prev => ({
      ...prev,
      securitySettings: { ...prev.securitySettings, ...settings }
    }));
  };

  const updateEmailSettings = (settings: Partial<EmailSettings>) => {
    setState(prev => ({
      ...prev,
      emailSettings: { ...prev.emailSettings, ...settings }
    }));
  };

  const updateReportSettings = (settings: Partial<ReportSettings>) => {
    setState(prev => ({
      ...prev,
      reportSettings: { ...prev.reportSettings, ...settings } as ReportSettings
    }));
  };

  const updateGeneralSettings = (settings: Partial<GeneralSettings>) => {
    setState(prev => ({
      ...prev,
      generalSettings: { ...prev.generalSettings, ...settings }
    }));
  };

  const updateAiRecognitionSettings = (settings: Partial<AiRecognitionSettings>) => {
    setState(prev => ({
      ...prev,
      aiRecognitionSettings: prev.aiRecognitionSettings 
        ? { ...prev.aiRecognitionSettings, ...settings }
        : { ...defaultState.aiRecognitionSettings!, ...settings }
    }));
  };

  const addAiRecognitionHistory = (history: Omit<AiRecognitionHistory, 'id'>) => {
    const newHistory: AiRecognitionHistory = {
      ...history,
      id: crypto.randomUUID(),
    };
    setState(prev => ({ 
      ...prev, 
      aiRecognitionHistory: [newHistory, ...(prev.aiRecognitionHistory || [])] 
    }));
  };

  const addPosterTemplate = (template: Omit<PosterTemplate, 'id'>) => {
    const newTemplate: PosterTemplate = {
      ...template,
      id: crypto.randomUUID(),
    };
    setState(prev => ({
      ...prev,
      posterTemplates: [...(prev.posterTemplates || []), newTemplate]
    }));
  };

  const updatePosterTemplate = (id: string, template: Partial<Omit<PosterTemplate, 'id'>>) => {
    setState(prev => ({
      ...prev,
      posterTemplates: (prev.posterTemplates || []).map(t => t.id === id ? { ...t, ...template } : t)
    }));
  };

  const deletePosterTemplate = (id: string) => {
    setState(prev => ({
      ...prev,
      posterTemplates: (prev.posterTemplates || []).filter(t => t.id !== id)
    }));
  };

  const setDefaultPosterTemplate = (id: string) => {
    setState(prev => ({
      ...prev,
      posterTemplates: (prev.posterTemplates || []).map(t => ({
        ...t,
        isDefault: t.id === id
      }))
    }));
  };

  const addEmailHistoryLog = (log: Omit<EmailHistoryLog, 'id'>) => {
    const newLog: EmailHistoryLog = {
      ...log,
      id: crypto.randomUUID(),
    };
    setState(prev => ({ ...prev, emailHistory: [newLog, ...(prev.emailHistory || [])] }));
  };

  const deleteEmailHistoryLog = (id: string) => {
    setState(prev => ({
      ...prev,
      emailHistory: (prev.emailHistory || []).filter(log => log.id !== id)
    }));
  };

  const addGeneratedReport = (report: Omit<GeneratedReport, 'id'>) => {
    const newReport = { ...report, id: Date.now().toString() } as GeneratedReport;
    setState(prev => ({
      ...prev,
      generatedReports: [newReport, ...(prev.generatedReports || [])]
    }));
  };

  const deleteGeneratedReport = (id: string) => {
    setState(prev => ({
      ...prev,
      generatedReports: (prev.generatedReports || []).filter(report => report.id !== id)
    }));
  };

  const setStartingBalance = (amount: number) => {
    setState(prev => ({ ...prev, startingBalance: amount, isSetupComplete: true }));
  };

  const addCustomer = (customer: Omit<Customer, 'id' | 'createdAt'>) => {
    const newCustomer: Customer = {
      ...customer,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString()
    };
    setState(prev => ({ ...prev, customers: [...(prev.customers || []), newCustomer] }));
  };

  const updateCustomer = (id: string, customer: Partial<Omit<Customer, 'id' | 'createdAt'>>) => {
    setState(prev => ({
      ...prev,
      customers: (prev.customers || []).map(c => c.id === id ? { ...c, ...customer } : c)
    }));
  };

  const deleteCustomer = (id: string) => {
    setState(prev => ({
      ...prev,
      customers: (prev.customers || []).filter(c => c.id !== id)
    }));
  };

  const addReceivedMoney = (entry: Omit<ReceivedMoney, 'id' | 'type'>) => {
    const newTx: ReceivedMoney = {
      ...entry,
      id: crypto.randomUUID(),
      type: 'received',
    };
    setState(prev => ({ ...prev, transactions: [newTx, ...prev.transactions] }));
  };

  const addSentMoney = (entry: Omit<SentMoney, 'id' | 'type'>) => {
    const newTx: SentMoney = {
      ...entry,
      id: crypto.randomUUID(),
      type: 'sent',
    };
    setState(prev => ({ ...prev, transactions: [newTx, ...prev.transactions] }));
  };

  const addPendingMoney = (entry: Omit<PendingMoney, 'id' | 'type' | 'status' | 'nextReminderDate' | 'reminderStatus'>) => {
    const newTx: PendingMoney = {
      ...entry,
      id: crypto.randomUUID(),
      type: 'pending',
      status: 'pending',
      reminderStatus: 'active',
      nextReminderDate: entry.dueDate || new Date().toISOString().split('T')[0],
    };
    setState(prev => ({ ...prev, transactions: [newTx, ...prev.transactions] }));
  };

  const toggleReminderStatus = (id: string) => {
    setState(prev => ({
      ...prev,
      transactions: prev.transactions.map(t => {
        if (t.id === id && t.type === 'pending') {
          return { ...t, reminderStatus: t.reminderStatus === 'active' ? 'paused' : 'active' };
        }
        return t;
      })
    }));
  };

  const updateReminderFrequency = (id: string, frequency: PendingMoney['reminderFrequency']) => {
    setState(prev => ({
      ...prev,
      transactions: prev.transactions.map(t => {
        if (t.id === id && t.type === 'pending') {
          return { ...t, reminderFrequency: frequency };
        }
        return t;
      })
    }));
  };

  const advanceReminderDate = (id: string) => {
    setState(prev => ({
      ...prev,
      transactions: prev.transactions.map(t => {
        if (t.id === id && t.type === 'pending') {
          return { ...t, nextReminderDate: calculateNextDate(t.nextReminderDate, t.reminderFrequency) };
        }
        return t;
      })
    }));
  };

  const markAsReceived = (id: string) => {
    setState(prev => {
      const tx = prev.transactions.find(t => t.id === id);
      if (!tx || tx.type !== 'pending') return prev;

      const updatedTx: PendingMoney = { ...tx, status: 'completed' };
      
      const newReceived: ReceivedMoney = {
        id: crypto.randomUUID(),
        type: 'received',
        personName: tx.personName,
        amount: tx.amount,
        date: new Date().toISOString().split('T')[0],
        purpose: `Settled: ${tx.reason}`,
      };

      return {
        ...prev,
        transactions: [
          newReceived,
          ...prev.transactions.map(t => t.id === id ? updatedTx : t)
        ]
      };
    });
  };

  const deleteTransaction = (id: string) => {
    setState(prev => ({
      ...prev,
      transactions: prev.transactions.filter(t => t.id !== id)
    }));
  };

  const addGullakEntry = (entry: Omit<GullakEntry, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newEntry: GullakEntry = {
      ...entry,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setState(prev => ({ ...prev, gullakEntries: [newEntry, ...(prev.gullakEntries || [])] }));
  };

  const updateGullakEntry = (id: string, entry: Partial<Omit<GullakEntry, 'id' | 'createdAt' | 'updatedAt'>>) => {
    setState(prev => ({
      ...prev,
      gullakEntries: (prev.gullakEntries || []).map(e => e.id === id ? { ...e, ...entry, updatedAt: new Date().toISOString() } : e)
    }));
  };

  const deleteGullakEntry = (id: string) => {
    setState(prev => ({
      ...prev,
      gullakEntries: (prev.gullakEntries || []).filter(e => e.id !== id)
    }));
  };

  const updateGullakSettings = (settings: Partial<GullakSettings>) => {
    setState(prev => ({
      ...prev,
      gullakSettings: { ...(prev.gullakSettings || defaultState.gullakSettings), ...settings }
    }));
  };

  const updateUserProfile = (profile: Partial<UserProfile>) => {
    setState(prev => ({
      ...prev,
      userProfile: { ...(prev.userProfile || defaultState.userProfile!), ...profile }
    }));
  };

  const resetData = () => {
    setState(defaultState);
  };

  const importData = (data: AppState) => {
    setState(data);
  };

  const receivedTransactions = state.transactions.filter((t): t is ReceivedMoney => t.type === 'received');
  const sentTransactions = state.transactions.filter((t): t is SentMoney => t.type === 'sent');
  const activePendingTransactions = state.transactions.filter((t): t is PendingMoney => t.type === 'pending' && t.status === 'pending');

  const totalReceived = receivedTransactions.reduce((sum, tx) => sum + Number(tx.amount), 0);
  const totalSent = sentTransactions.reduce((sum, tx) => sum + Number(tx.amount), 0);
  const totalPending = activePendingTransactions.reduce((sum, tx) => sum + Number(tx.amount), 0);
  const currentBalance = Number(state.startingBalance) + totalReceived - totalSent;

  return (
    <StoreContext.Provider value={{
      ...state,
      setStartingBalance,
      addCustomer,
      updateCustomer,
      deleteCustomer,
      addReceivedMoney,
      addSentMoney,
      addPendingMoney,
      markAsReceived,
      deleteTransaction,
      toggleReminderStatus,
      updateReminderFrequency,
      advanceReminderDate,
      updateSecuritySettings,
      updateEmailSettings,
      updateReportSettings,
      updateGeneralSettings,
      updateAiRecognitionSettings,
      addAiRecognitionHistory,
      addPosterTemplate,
      updatePosterTemplate,
      deletePosterTemplate,
      setDefaultPosterTemplate,
      addEmailHistoryLog,
      deleteEmailHistoryLog,
      addGeneratedReport,
      deleteGeneratedReport,
      addGullakEntry,
      updateGullakEntry,
      deleteGullakEntry,
      updateGullakSettings,
      updateUserProfile,
      resetData,
      importData,
      currentBalance,
      totalReceived,
      totalSent,
      totalPending,
      isLoading,
      newlyUnlocked,
      clearNewlyUnlocked,
      isAdminAuthenticated,
      adminLogin,
      adminLogout
    }}>
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  const context = useContext(StoreContext);
  if (context === undefined) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return context;
}
