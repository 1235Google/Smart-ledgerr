import React, { createContext, useContext, useEffect, useState } from 'react';
import { AppState, PendingMoney, ReceivedMoney, SentMoney, Transaction, SecuritySettings, EmailSettings, EmailHistoryLog, GeneralSettings, GullakEntry, GullakSettings, UnlockedAchievement, AiRecognitionSettings, AiRecognitionHistory, PosterTemplate, Customer, ReportSettings, GeneratedReport, UserProfile } from '../types';
import { auth, db, ensureAuth } from '../lib/firebase';
import { doc, getDoc, setDoc, collection, onSnapshot, addDoc, updateDoc, deleteDoc, query, where, getDocs } from 'firebase/firestore';
import { calculateProgress, ACHIEVEMENTS } from '../lib/achievements';

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
  adminLogin: (email: string, pass: string, rememberMe?: boolean) => boolean;
  adminLogout: () => void;
}

const defaultState: AppState = {
  isSetupComplete: true,
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
    return sessionStorage.getItem('smartledger-admin-auth') === 'true' || localStorage.getItem('smartledger-admin-auth') === 'true';
  });

  const adminLogin = (email: string, pass: string, rememberMe?: boolean) => {
    if (email && pass) {
      setIsAdminAuthenticated(true);
      if (rememberMe) {
        localStorage.setItem('smartledger-admin-auth', 'true');
      } else {
        sessionStorage.setItem('smartledger-admin-auth', 'true');
      }
      return true;
    }
    return false;
  };

  const adminLogout = () => {
    setIsAdminAuthenticated(false);
    sessionStorage.removeItem('smartledger-admin-auth');
    localStorage.removeItem('smartledger-admin-auth');
  };

  // 30-min inactivity auto logout
  useEffect(() => {
    if (!isAdminAuthenticated) return;
    let timeoutId: any;
    const resetTimer = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        adminLogout();
      }, 30 * 60 * 1000);
    };

    window.addEventListener('mousemove', resetTimer);
    window.addEventListener('keydown', resetTimer);
    window.addEventListener('click', resetTimer);
    resetTimer();

    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('mousemove', resetTimer);
      window.removeEventListener('keydown', resetTimer);
      window.removeEventListener('click', resetTimer);
    };
  }, [isAdminAuthenticated]);

  const clearNewlyUnlocked = () => setNewlyUnlocked(null);

  // Firestore sync and listeners
  useEffect(() => {
    let unsubscribeTransactions: () => void = () => {};
    let unsubscribeCustomers: () => void = () => {};
    let unsubscribeGullak: () => void = () => {};
    let unsubscribeSettings: () => void = () => {};

    const initFirebaseData = async () => {
      try {
        await ensureAuth();
        const uid = auth.currentUser?.uid || 'default_user';

        // References
        const settingsRef = doc(db, 'settings', uid);
        const settingsSnap = await getDoc(settingsRef);

        if (!settingsSnap.exists()) {
          // Initialize default state in Firestore
          await setDoc(settingsRef, {
            startingBalance: defaultState.startingBalance,
            isSetupComplete: defaultState.isSetupComplete,
            userProfile: defaultState.userProfile,
            securitySettings: defaultState.securitySettings,
            emailSettings: defaultState.emailSettings,
            generalSettings: defaultState.generalSettings,
            aiRecognitionSettings: defaultState.aiRecognitionSettings,
            gullakSettings: defaultState.gullakSettings,
          });
        }

        // Real-time listener for Settings & Profile
        unsubscribeSettings = onSnapshot(settingsRef, (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data();
            setState(prev => ({
              ...prev,
              startingBalance: data.startingBalance ?? prev.startingBalance,
              isSetupComplete: data.isSetupComplete ?? prev.isSetupComplete,
              userProfile: { ...defaultState.userProfile, ...(data.userProfile || {}) },
              securitySettings: { ...defaultState.securitySettings, ...(data.securitySettings || {}) },
              emailSettings: { ...defaultState.emailSettings, ...(data.emailSettings || {}) },
              generalSettings: { ...defaultState.generalSettings, ...(data.generalSettings || {}) },
              aiRecognitionSettings: { ...defaultState.aiRecognitionSettings, ...(data.aiRecognitionSettings || {}) },
              gullakSettings: { ...defaultState.gullakSettings, ...(data.gullakSettings || {}) },
            }));
          }
        });

        // Real-time listener for Transactions
        const txQuery = query(collection(db, 'transactions'), where('userId', '==', uid));
        
        // Check initial tx count for test transaction seeding
        const initialTxSnap = await getDocs(txQuery);
        if (initialTxSnap.empty) {
          await addDoc(collection(db, 'transactions'), {
            userId: uid,
            type: 'received',
            personName: 'Test Firestore Client',
            amount: 2500,
            date: new Date().toISOString().split('T')[0],
            purpose: 'Initial Test Verification Transaction',
            createdAt: new Date().toISOString()
          });
          console.log("Test transaction successfully seeded to Firestore.");
        }

        unsubscribeTransactions = onSnapshot(txQuery, (snapshot) => {
          const txs: Transaction[] = [];
          snapshot.forEach((d) => {
            txs.push({ id: d.id, ...d.data() } as Transaction);
          });
          // Sort by date/timestamp descending if possible
          setState(prev => ({ ...prev, transactions: txs }));
        }, (error) => {
          console.error("Transactions listener error:", error);
        });

        // Real-time listener for Customers
        const custQuery = query(collection(db, 'customers'), where('userId', '==', uid));
        unsubscribeCustomers = onSnapshot(custQuery, (snapshot) => {
          const custs: Customer[] = [];
          snapshot.forEach((d) => {
            custs.push({ id: d.id, ...d.data() } as Customer);
          });
          setState(prev => ({ ...prev, customers: custs }));
        });

        // Real-time listener for Gullak Entries
        const gullakQuery = query(collection(db, 'gullakEntries'), where('userId', '==', uid));
        unsubscribeGullak = onSnapshot(gullakQuery, (snapshot) => {
          const entries: GullakEntry[] = [];
          snapshot.forEach((d) => {
            entries.push({ id: d.id, ...d.data() } as GullakEntry);
          });
          setState(prev => ({ ...prev, gullakEntries: entries }));
        });

        setIsLoading(false);
        setIsInitialized(true);
      } catch (err) {
        console.error("Error initializing Firebase data:", err);
        setIsLoading(false);
        setIsInitialized(true);
      }
    };

    initFirebaseData();

    return () => {
      unsubscribeTransactions();
      unsubscribeCustomers();
      unsubscribeGullak();
      unsubscribeSettings();
    };
  }, []);

  // Helper to log notifications to Firestore
  const logNotification = async (title: string, message: string, type: string) => {
    try {
      const uid = auth.currentUser?.uid || 'default_user';
      await addDoc(collection(db, 'notifications'), {
        userId: uid,
        title,
        message,
        type,
        createdAt: new Date().toISOString()
      });
    } catch (e) {
      console.error("Error logging notification:", e);
    }
  };

  const updateSecuritySettings = async (settings: Partial<SecuritySettings>) => {
    const updated = { ...state.securitySettings, ...settings };
    setState(prev => ({ ...prev, securitySettings: updated }));
    try {
      const uid = auth.currentUser?.uid || 'default_user';
      await updateDoc(doc(db, 'settings', uid), { securitySettings: updated });
    } catch (e) {
      console.error(e);
    }
  };

  const updateEmailSettings = async (settings: Partial<EmailSettings>) => {
    const updated = { ...state.emailSettings, ...settings };
    setState(prev => ({ ...prev, emailSettings: updated }));
    try {
      const uid = auth.currentUser?.uid || 'default_user';
      await updateDoc(doc(db, 'settings', uid), { emailSettings: updated });
    } catch (e) {
      console.error(e);
    }
  };

  const updateReportSettings = async (settings: Partial<ReportSettings>) => {
    const updated = { ...state.reportSettings, ...settings } as ReportSettings;
    setState(prev => ({ ...prev, reportSettings: updated }));
    try {
      const uid = auth.currentUser?.uid || 'default_user';
      await updateDoc(doc(db, 'settings', uid), { reportSettings: updated });
    } catch (e) {
      console.error(e);
    }
  };

  const updateGeneralSettings = async (settings: Partial<GeneralSettings>) => {
    const updated = { ...state.generalSettings, ...settings };
    setState(prev => ({ ...prev, generalSettings: updated }));
    try {
      const uid = auth.currentUser?.uid || 'default_user';
      await updateDoc(doc(db, 'settings', uid), { generalSettings: updated });
    } catch (e) {
      console.error(e);
    }
  };

  const updateAiRecognitionSettings = async (settings: Partial<AiRecognitionSettings>) => {
    const updated = state.aiRecognitionSettings 
      ? { ...state.aiRecognitionSettings, ...settings }
      : { ...defaultState.aiRecognitionSettings!, ...settings };
    setState(prev => ({ ...prev, aiRecognitionSettings: updated }));
    try {
      const uid = auth.currentUser?.uid || 'default_user';
      await updateDoc(doc(db, 'settings', uid), { aiRecognitionSettings: updated });
    } catch (e) {
      console.error(e);
    }
  };

  const addAiRecognitionHistory = (history: Omit<AiRecognitionHistory, 'id'>) => {
    const newHistory: AiRecognitionHistory = { ...history, id: crypto.randomUUID() };
    setState(prev => ({ ...prev, aiRecognitionHistory: [newHistory, ...(prev.aiRecognitionHistory || [])] }));
  };

  const addPosterTemplate = (template: Omit<PosterTemplate, 'id'>) => {
    const newTemplate: PosterTemplate = { ...template, id: crypto.randomUUID() };
    setState(prev => ({ ...prev, posterTemplates: [...(prev.posterTemplates || []), newTemplate] }));
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
      posterTemplates: (prev.posterTemplates || []).map(t => ({ ...t, isDefault: t.id === id }))
    }));
  };

  const addEmailHistoryLog = (log: Omit<EmailHistoryLog, 'id'>) => {
    const newLog: EmailHistoryLog = { ...log, id: crypto.randomUUID() };
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
    setState(prev => ({ ...prev, generatedReports: [newReport, ...(prev.generatedReports || [])] }));
  };

  const deleteGeneratedReport = (id: string) => {
    setState(prev => ({
      ...prev,
      generatedReports: (prev.generatedReports || []).filter(report => report.id !== id)
    }));
  };

  const setStartingBalance = async (amount: number) => {
    setState(prev => ({ ...prev, startingBalance: amount, isSetupComplete: true }));
    try {
      const uid = auth.currentUser?.uid || 'default_user';
      await updateDoc(doc(db, 'settings', uid), { startingBalance: amount, isSetupComplete: true });
    } catch (e) {
      console.error(e);
    }
  };

  const addCustomer = async (customer: Omit<Customer, 'id' | 'createdAt'>) => {
    try {
      const uid = auth.currentUser?.uid || 'default_user';
      const custData = {
        ...customer,
        userId: uid,
        createdAt: new Date().toISOString()
      };
      await addDoc(collection(db, 'customers'), custData);
      logNotification('New Customer Added', `Customer ${customer.name} was successfully added.`, 'customer');
    } catch (e) {
      console.error("Error adding customer:", e);
    }
  };

  const updateCustomer = async (id: string, customer: Partial<Omit<Customer, 'id' | 'createdAt'>>) => {
    try {
      await updateDoc(doc(db, 'customers', id), customer);
    } catch (e) {
      console.error("Error updating customer:", e);
    }
  };

  const deleteCustomer = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'customers', id));
      logNotification('Customer Deleted', 'A customer record was deleted.', 'delete');
    } catch (e) {
      console.error("Error deleting customer:", e);
    }
  };

  const addReceivedMoney = async (entry: Omit<ReceivedMoney, 'id' | 'type'>) => {
    try {
      const uid = auth.currentUser?.uid || 'default_user';
      const txData = {
        ...entry,
        userId: uid,
        type: 'received',
        createdAt: new Date().toISOString()
      };
      await addDoc(collection(db, 'transactions'), txData);
      logNotification('New Received Payment', `Received ₹${entry.amount} from ${entry.personName}`, 'transaction');
    } catch (e) {
      console.error("Error adding received money:", e);
    }
  };

  const addSentMoney = async (entry: Omit<SentMoney, 'id' | 'type'>) => {
    try {
      const uid = auth.currentUser?.uid || 'default_user';
      const txData = {
        ...entry,
        userId: uid,
        type: 'sent',
        createdAt: new Date().toISOString()
      };
      await addDoc(collection(db, 'transactions'), txData);
      logNotification('New Expense / Sent Payment', `Sent ₹${entry.amount} to ${entry.personName}`, 'transaction');
    } catch (e) {
      console.error("Error adding sent money:", e);
    }
  };

  const addPendingMoney = async (entry: Omit<PendingMoney, 'id' | 'type' | 'status' | 'nextReminderDate' | 'reminderStatus'>) => {
    try {
      const uid = auth.currentUser?.uid || 'default_user';
      const txData = {
        ...entry,
        userId: uid,
        type: 'pending',
        status: 'pending',
        reminderStatus: 'active',
        nextReminderDate: entry.dueDate || new Date().toISOString().split('T')[0],
        createdAt: new Date().toISOString()
      };
      await addDoc(collection(db, 'transactions'), txData);
      logNotification('New Pending Payment', `Pending payment of ₹${entry.amount} added for ${entry.personName}`, 'pending');
    } catch (e) {
      console.error("Error adding pending money:", e);
    }
  };

  const toggleReminderStatus = async (id: string) => {
    const tx = state.transactions.find(t => t.id === id);
    if (!tx || tx.type !== 'pending') return;
    const newStatus = tx.reminderStatus === 'active' ? 'paused' : 'active';
    try {
      await updateDoc(doc(db, 'transactions', id), { reminderStatus: newStatus });
    } catch (e) {
      console.error(e);
    }
  };

  const updateReminderFrequency = async (id: string, frequency: PendingMoney['reminderFrequency']) => {
    try {
      await updateDoc(doc(db, 'transactions', id), { reminderFrequency: frequency });
    } catch (e) {
      console.error(e);
    }
  };

  const advanceReminderDate = async (id: string) => {
    const tx = state.transactions.find(t => t.id === id);
    if (!tx || tx.type !== 'pending') return;
    const nextDate = calculateNextDate(tx.nextReminderDate, tx.reminderFrequency);
    try {
      await updateDoc(doc(db, 'transactions', id), { nextReminderDate: nextDate });
    } catch (e) {
      console.error(e);
    }
  };

  const markAsReceived = async (id: string) => {
    const tx = state.transactions.find(t => t.id === id);
    if (!tx || tx.type !== 'pending') return;

    try {
      // Update pending transaction status to completed
      await updateDoc(doc(db, 'transactions', id), { status: 'completed' });

      // Add corresponding received transaction
      const uid = auth.currentUser?.uid || 'default_user';
      await addDoc(collection(db, 'transactions'), {
        userId: uid,
        type: 'received',
        personName: tx.personName,
        amount: tx.amount,
        date: new Date().toISOString().split('T')[0],
        purpose: `Settled: ${tx.reason || 'Pending Payment'}`,
        createdAt: new Date().toISOString()
      });
      logNotification('Payment Settled', `Pending payment from ${tx.personName} marked as received.`, 'transaction');
    } catch (e) {
      console.error("Error marking as received:", e);
    }
  };

  const deleteTransaction = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'transactions', id));
      logNotification('Transaction Deleted', 'A transaction record was deleted.', 'delete');
    } catch (e) {
      console.error("Error deleting transaction:", e);
    }
  };

  const addGullakEntry = async (entry: Omit<GullakEntry, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const uid = auth.currentUser?.uid || 'default_user';
      await addDoc(collection(db, 'gullakEntries'), {
        ...entry,
        userId: uid,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    } catch (e) {
      console.error("Error adding gullak entry:", e);
    }
  };

  const updateGullakEntry = async (id: string, entry: Partial<Omit<GullakEntry, 'id' | 'createdAt' | 'updatedAt'>>) => {
    try {
      await updateDoc(doc(db, 'gullakEntries', id), {
        ...entry,
        updatedAt: new Date().toISOString()
      });
    } catch (e) {
      console.error("Error updating gullak entry:", e);
    }
  };

  const deleteGullakEntry = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'gullakEntries', id));
    } catch (e) {
      console.error("Error deleting gullak entry:", e);
    }
  };

  const updateGullakSettings = async (settings: Partial<GullakSettings>) => {
    const updated = { ...(state.gullakSettings || defaultState.gullakSettings), ...settings };
    setState(prev => ({ ...prev, gullakSettings: updated }));
    try {
      const uid = auth.currentUser?.uid || 'default_user';
      await updateDoc(doc(db, 'settings', uid), { gullakSettings: updated });
    } catch (e) {
      console.error(e);
    }
  };

  const updateUserProfile = async (profile: Partial<UserProfile>) => {
    const updated = { ...(state.userProfile || defaultState.userProfile!), ...profile };
    setState(prev => ({ ...prev, userProfile: updated }));
    try {
      const uid = auth.currentUser?.uid || 'default_user';
      await updateDoc(doc(db, 'settings', uid), { userProfile: updated });
      logNotification('Profile Updated', 'User profile information was updated.', 'profile');
    } catch (e) {
      console.error(e);
    }
  };

  const resetData = async () => {
    setState(defaultState);
    try {
      const uid = auth.currentUser?.uid || 'default_user';
      const txQuery = query(collection(db, 'transactions'), where('userId', '==', uid));
      const txSnap = await getDocs(txQuery);
      const deletePromises = txSnap.docs.map(d => deleteDoc(d.ref));

      const custQuery = query(collection(db, 'customers'), where('userId', '==', uid));
      const custSnap = await getDocs(custQuery);
      custSnap.docs.forEach(d => deletePromises.push(deleteDoc(d.ref)));

      const gullakQuery = query(collection(db, 'gullakEntries'), where('userId', '==', uid));
      const gullakSnap = await getDocs(gullakQuery);
      gullakSnap.docs.forEach(d => deletePromises.push(deleteDoc(d.ref)));

      const notifQuery = query(collection(db, 'notifications'), where('userId', '==', uid));
      const notifSnap = await getDocs(notifQuery);
      notifSnap.docs.forEach(d => deletePromises.push(deleteDoc(d.ref)));

      await Promise.all(deletePromises);

      const settingsRef = doc(db, 'settings', uid);
      await setDoc(settingsRef, {
        startingBalance: defaultState.startingBalance,
        isSetupComplete: defaultState.isSetupComplete,
        userProfile: defaultState.userProfile,
        securitySettings: defaultState.securitySettings,
        emailSettings: defaultState.emailSettings,
        generalSettings: defaultState.generalSettings,
        aiRecognitionSettings: defaultState.aiRecognitionSettings,
        gullakSettings: defaultState.gullakSettings,
      });
    } catch (e) {
      console.error("Error resetting data:", e);
    }
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
