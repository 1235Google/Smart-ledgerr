import { db } from './firebase';
import { doc, getDoc, setDoc, deleteDoc, collection, getDocs } from 'firebase/firestore';
import { AppState, Transaction, ReceivedMoney, PendingMoney, SentMoney, Customer, GullakEntry, SavingsGoal, SecurityLog, AutomationRule, Investment, FinanceHabit, EmailHistoryLog, GeneratedReport, UnlockedAchievement, AiRecognitionHistory, PosterTemplate, ReminderHistoryLog } from '../types';

export const loadStateFromCloud = async (uid: string, defaultState: AppState): Promise<AppState> => {
  const loadCollection = async (collectionName: string) => {
    try {
      const snapshot = await getDocs(collection(db, `${collectionName}/${uid}/items`));
      return snapshot.docs.map(doc => doc.data());
    } catch (e) {
      console.error(`Error loading collection ${collectionName}:`, e);
      return [];
    }
  };

  const moneyReceived = await loadCollection('moneyReceived') as ReceivedMoney[];
  const pendingPayments = await loadCollection('pendingPayments') as PendingMoney[];
  const sentMoney = await loadCollection('transactions') as SentMoney[];
  const transactions: Transaction[] = [...moneyReceived, ...pendingPayments, ...sentMoney];

  const customers = await loadCollection('categories') as Customer[];
  const gullakEntries = await loadCollection('gullakEntries') as GullakEntry[];
  const savingsGoals = await loadCollection('savingsGoals') as SavingsGoal[];
  const securityLogs = await loadCollection('securityLogs') as SecurityLog[];
  const automationRules = await loadCollection('automationRules') as AutomationRule[];
  const investments = await loadCollection('investments') as Investment[];
  const financeHabits = await loadCollection('financeHabits') as FinanceHabit[];
  const emailHistory = await loadCollection('emailHistory') as EmailHistoryLog[];
  const generatedReports = await loadCollection('generatedReports') as GeneratedReport[];
  const unlockedAchievements = await loadCollection('unlockedAchievements') as UnlockedAchievement[];
  const aiRecognitionHistory = await loadCollection('aiRecognitionHistory') as AiRecognitionHistory[];
  const posterTemplates = await loadCollection('posterTemplates') as PosterTemplate[];
  const reminderHistory = await loadCollection('reminderHistory') as ReminderHistoryLog[];

  let userDocData: any = {};
  try {
    const userDoc = await getDoc(doc(db, 'users', uid));
    if (userDoc.exists()) {
      userDocData = userDoc.data();
    }
  } catch (e) {
    console.error("Error loading user doc:", e);
  }

  return {
    ...defaultState,
    transactions: transactions.length ? transactions : defaultState.transactions,
    customers: customers.length ? customers : defaultState.customers,
    gullakEntries: gullakEntries.length ? gullakEntries : defaultState.gullakEntries,
    savingsGoals: savingsGoals.length ? savingsGoals : defaultState.savingsGoals,
    securityLogs: securityLogs.length ? securityLogs : defaultState.securityLogs,
    automationRules: automationRules.length ? automationRules : defaultState.automationRules,
    investments: investments.length ? investments : defaultState.investments,
    financeHabits: financeHabits.length ? financeHabits : defaultState.financeHabits,
    emailHistory: emailHistory.length ? emailHistory : defaultState.emailHistory,
    generatedReports: generatedReports.length ? generatedReports : defaultState.generatedReports,
    unlockedAchievements: unlockedAchievements.length ? unlockedAchievements : defaultState.unlockedAchievements,
    aiRecognitionHistory: aiRecognitionHistory.length ? aiRecognitionHistory : defaultState.aiRecognitionHistory,
    posterTemplates: posterTemplates.length ? posterTemplates : defaultState.posterTemplates,
    reminderHistory: reminderHistory.length ? reminderHistory : defaultState.reminderHistory,
    
    isSetupComplete: userDocData.isSetupComplete ?? defaultState.isSetupComplete,
    startingBalance: userDocData.startingBalance ?? defaultState.startingBalance,
    gullakSettings: userDocData.gullakSettings ?? defaultState.gullakSettings,
    securitySettings: userDocData.securitySettings ?? defaultState.securitySettings,
    emailSettings: userDocData.emailSettings ?? defaultState.emailSettings,
    reportSettings: userDocData.reportSettings ?? defaultState.reportSettings,
    generalSettings: userDocData.generalSettings ?? defaultState.generalSettings,
    aiRecognitionSettings: userDocData.aiRecognitionSettings ?? defaultState.aiRecognitionSettings,
    userProfile: userDocData.userProfile ?? defaultState.userProfile,
    customReminderTemplate: userDocData.customReminderTemplate ?? defaultState.customReminderTemplate,
  };
};

export const syncStateToCloud = async (uid: string, prev: AppState, next: AppState) => {
  const syncCollection = async (collectionName: string, prevItems: any[], nextItems: any[]) => {
    try {
      const added = nextItems.filter(n => !prevItems.find(p => p.id === n.id));
      const updated = nextItems.filter(n => {
        const p = prevItems.find(x => x.id === n.id);
        return p && JSON.stringify(p) !== JSON.stringify(n);
      });
      const deleted = prevItems.filter(p => !nextItems.find(n => n.id === p.id));

      for (const item of added) await setDoc(doc(db, `${collectionName}/${uid}/items`, item.id), item);
      for (const item of updated) await setDoc(doc(db, `${collectionName}/${uid}/items`, item.id), item);
      for (const item of deleted) await deleteDoc(doc(db, `${collectionName}/${uid}/items`, item.id));
    } catch (e) {
      console.error(`Error syncing collection ${collectionName}:`, e);
    }
  };

  const prevReceived = prev.transactions.filter(t => t.type === 'received');
  const nextReceived = next.transactions.filter(t => t.type === 'received');
  if (prevReceived !== nextReceived) await syncCollection('moneyReceived', prevReceived, nextReceived);

  const prevPending = prev.transactions.filter(t => t.type === 'pending');
  const nextPending = next.transactions.filter(t => t.type === 'pending');
  if (prevPending !== nextPending) await syncCollection('pendingPayments', prevPending, nextPending);

  const prevSent = prev.transactions.filter(t => t.type === 'sent');
  const nextSent = next.transactions.filter(t => t.type === 'sent');
  if (prevSent !== nextSent) await syncCollection('transactions', prevSent, nextSent);

  if (prev.customers !== next.customers) await syncCollection('categories', prev.customers || [], next.customers || []);
  if (prev.gullakEntries !== next.gullakEntries) await syncCollection('gullakEntries', prev.gullakEntries || [], next.gullakEntries || []);
  if (prev.savingsGoals !== next.savingsGoals) await syncCollection('savingsGoals', prev.savingsGoals || [], next.savingsGoals || []);
  if (prev.securityLogs !== next.securityLogs) await syncCollection('securityLogs', prev.securityLogs || [], next.securityLogs || []);
  if (prev.automationRules !== next.automationRules) await syncCollection('automationRules', prev.automationRules || [], next.automationRules || []);
  if (prev.investments !== next.investments) await syncCollection('investments', prev.investments || [], next.investments || []);
  if (prev.financeHabits !== next.financeHabits) await syncCollection('financeHabits', prev.financeHabits || [], next.financeHabits || []);
  if (prev.emailHistory !== next.emailHistory) await syncCollection('emailHistory', prev.emailHistory || [], next.emailHistory || []);
  if (prev.generatedReports !== next.generatedReports) await syncCollection('generatedReports', prev.generatedReports || [], next.generatedReports || []);
  if (prev.unlockedAchievements !== next.unlockedAchievements) await syncCollection('unlockedAchievements', prev.unlockedAchievements || [], next.unlockedAchievements || []);
  if (prev.aiRecognitionHistory !== next.aiRecognitionHistory) await syncCollection('aiRecognitionHistory', prev.aiRecognitionHistory || [], next.aiRecognitionHistory || []);
  if (prev.posterTemplates !== next.posterTemplates) await syncCollection('posterTemplates', prev.posterTemplates || [], next.posterTemplates || []);
  if (prev.reminderHistory !== next.reminderHistory) await syncCollection('reminderHistory', prev.reminderHistory || [], next.reminderHistory || []);

  const prevDocData = {
    isSetupComplete: prev.isSetupComplete,
    startingBalance: prev.startingBalance,
    gullakSettings: prev.gullakSettings,
    securitySettings: prev.securitySettings,
    emailSettings: prev.emailSettings,
    reportSettings: prev.reportSettings,
    generalSettings: prev.generalSettings,
    aiRecognitionSettings: prev.aiRecognitionSettings,
    userProfile: prev.userProfile,
    customReminderTemplate: prev.customReminderTemplate,
  };

  const nextDocData = {
    isSetupComplete: next.isSetupComplete,
    startingBalance: next.startingBalance,
    gullakSettings: next.gullakSettings,
    securitySettings: next.securitySettings,
    emailSettings: next.emailSettings,
    reportSettings: next.reportSettings,
    generalSettings: next.generalSettings,
    aiRecognitionSettings: next.aiRecognitionSettings,
    userProfile: next.userProfile,
    customReminderTemplate: next.customReminderTemplate,
  };

  if (JSON.stringify(prevDocData) !== JSON.stringify(nextDocData)) {
    try {
      await setDoc(doc(db, 'users', uid), nextDocData, { merge: true });
    } catch (e) {
      console.error("Error syncing user doc:", e);
    }
  }
};