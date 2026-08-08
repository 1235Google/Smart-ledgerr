import { doc, getDoc, setDoc, collection, onSnapshot, writeBatch, deleteDoc, getDocs } from 'firebase/firestore';
import { db, auth } from './firebase';
import { AppState, Transaction, UserProfile, PendingMoney, ReceivedMoney } from '../types';
import { User } from 'firebase/auth';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
    },
    operationType,
    path
  };
  console.error('Firestore Operation Notice:', JSON.stringify(errInfo));
  return errInfo;
}

export const defaultProfile = (firebaseUser?: User | null): UserProfile => ({
  fullName: firebaseUser?.displayName || 'SmartLedger User',
  username: firebaseUser?.email ? firebaseUser.email.split('@')[0] : 'user',
  email: firebaseUser?.email || '',
  mobile: firebaseUser?.phoneNumber || '',
  dob: '',
  address: '',
  city: '',
  state: '',
  country: 'India',
  language: 'English (IN)',
  memberSince: firebaseUser?.metadata?.creationTime 
    ? new Date(firebaseUser.metadata.creationTime).toISOString().split('T')[0] 
    : new Date().toISOString().split('T')[0],
  profilePhoto: firebaseUser?.photoURL || '',
  businessName: '',
  businessCategory: '',
  gstNumber: '',
  upiId: '',
  businessAddress: '',
  website: '',
  businessLogo: '',
  verifiedEmail: firebaseUser?.emailVerified || false,
  verifiedPhone: false,
  lastLogin: new Date().toISOString(),
  activeDevice: 'Web Browser'
});

export const initializeUserWorkspace = async (
  userId: string, 
  firebaseUser?: User | null, 
  baseDefaultState?: AppState
): Promise<AppState> => {
  const profile = defaultProfile(firebaseUser);
  const freshState: AppState = {
    ...(baseDefaultState || {
      isSetupComplete: true,
      startingBalance: 0,
      customers: [],
      transactions: [],
      gullakEntries: [],
      savingsGoals: [],
      securityLogs: [],
      automationRules: [],
      investments: [],
      financeHabits: [],
      gullakSettings: { monthlyGoal: 10000 },
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
        emailAddress: firebaseUser?.email || '',
        lastReportSent: null,
        nextScheduledReport: null,
      },
      emailHistory: [],
      generalSettings: { timezone: 'Asia/Kolkata' },
      userProfile: profile
    }),
    startingBalance: 0,
    transactions: [],
    customers: [],
    gullakEntries: [],
    savingsGoals: [],
    securityLogs: [],
    automationRules: [],
    investments: [],
    financeHabits: [],
    emailHistory: [],
    reminderHistory: [],
    generatedReports: [],
    userProfile: profile,
    isSetupComplete: true
  };

  try {
    const userDocRef = doc(db, 'users', userId);
    const stateDocRef = doc(db, 'users', userId, 'app', 'state');
    const profileDocRef = doc(db, 'users', userId, 'profile', 'data');
    const settingsDocRef = doc(db, 'users', userId, 'settings', 'data');

    // 1. Create root user document
    await setDoc(userDocRef, {
      name: firebaseUser?.displayName || 'SmartLedger User',
      email: firebaseUser?.email || '',
      photoURL: firebaseUser?.photoURL || '',
      createdAt: firebaseUser?.metadata?.creationTime || new Date().toISOString(),
      lastLogin: new Date().toISOString()
    }, { merge: true });

    const stateToSave = { ...freshState };
    delete (stateToSave as any).transactions;

    // 2. Initialize state, profile, and settings documents
    await setDoc(stateDocRef, stateToSave, { merge: true });
    await setDoc(profileDocRef, profile, { merge: true });
    await setDoc(settingsDocRef, {
      securitySettings: freshState.securitySettings,
      emailSettings: freshState.emailSettings,
      generalSettings: freshState.generalSettings,
      gullakSettings: freshState.gullakSettings
    }, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `users/${userId}`);
  }

  return freshState;
};

export const subscribeToState = (
  userId: string, 
  firebaseUser: User | null,
  baseDefaultState: AppState,
  onUpdate: (state: AppState) => void
) => {
  const userDocRef = doc(db, 'users', userId);
  const stateDocRef = doc(db, 'users', userId, 'app', 'state');
  const profileDocRef = doc(db, 'users', userId, 'profile', 'data');
  const settingsDocRef = doc(db, 'users', userId, 'settings', 'data');
  const txCollectionRef = collection(db, 'users', userId, 'transactions');
  const remCollectionRef = collection(db, 'users', userId, 'reminders');
  const repCollectionRef = collection(db, 'users', userId, 'reports');

  let state: AppState | null = null;
  let userProfile: UserProfile | null = null;
  let settingsData: any = null;
  let transactions: Transaction[] = [];
  let reminderHistory: any[] = [];
  let generatedReports: any[] = [];

  let stateInitialized = false;

  // Touch lastLogin on root user document for existing users
  setDoc(userDocRef, {
    name: firebaseUser?.displayName || 'SmartLedger User',
    email: firebaseUser?.email || '',
    photoURL: firebaseUser?.photoURL || '',
    lastLogin: new Date().toISOString()
  }, { merge: true }).catch(err => handleFirestoreError(err, OperationType.WRITE, `users/${userId}`));

  const checkAndEmitState = async () => {
    if (!state) {
      if (!stateInitialized) {
        stateInitialized = true;
        const fresh = await initializeUserWorkspace(userId, firebaseUser, baseDefaultState);
        onUpdate(fresh);
      }
      return;
    }

    const mergedProfile = userProfile || state.userProfile || defaultProfile(firebaseUser);
    const updatedState: AppState = {
      ...baseDefaultState,
      ...state,
      userProfile: {
        ...mergedProfile,
        profilePhoto: mergedProfile.profilePhoto || firebaseUser?.photoURL || '',
        fullName: mergedProfile.fullName || firebaseUser?.displayName || 'SmartLedger User',
        email: mergedProfile.email || firebaseUser?.email || ''
      },
      securitySettings: settingsData?.securitySettings || state.securitySettings || baseDefaultState.securitySettings,
      emailSettings: settingsData?.emailSettings || state.emailSettings || baseDefaultState.emailSettings,
      generalSettings: settingsData?.generalSettings || state.generalSettings || baseDefaultState.generalSettings,
      gullakSettings: settingsData?.gullakSettings || state.gullakSettings || baseDefaultState.gullakSettings,
      transactions: transactions,
      reminderHistory: reminderHistory.length > 0 ? reminderHistory : (state.reminderHistory || []),
      generatedReports: generatedReports.length > 0 ? generatedReports : (state.generatedReports || [])
    };

    onUpdate(updatedState);
  };

  const unsubState = onSnapshot(stateDocRef, (snapshot) => {
    if (snapshot.exists()) {
      state = snapshot.data() as AppState;
    }
    checkAndEmitState();
  }, (err) => handleFirestoreError(err, OperationType.GET, `users/${userId}/app/state`));

  const unsubProfile = onSnapshot(profileDocRef, (snapshot) => {
    if (snapshot.exists()) {
      userProfile = snapshot.data() as UserProfile;
    }
    checkAndEmitState();
  }, (err) => handleFirestoreError(err, OperationType.GET, `users/${userId}/profile/data`));

  const unsubSettings = onSnapshot(settingsDocRef, (snapshot) => {
    if (snapshot.exists()) {
      settingsData = snapshot.data();
    }
    checkAndEmitState();
  }, (err) => handleFirestoreError(err, OperationType.GET, `users/${userId}/settings/data`));

  const unsubTx = onSnapshot(txCollectionRef, (snapshot) => {
    transactions = snapshot.docs.map(d => d.data() as Transaction);
    checkAndEmitState();
  }, (err) => handleFirestoreError(err, OperationType.GET, `users/${userId}/transactions`));

  const unsubRem = onSnapshot(remCollectionRef, (snapshot) => {
    reminderHistory = snapshot.docs.map(d => d.data());
    checkAndEmitState();
  }, (err) => handleFirestoreError(err, OperationType.GET, `users/${userId}/reminders`));

  const unsubRep = onSnapshot(repCollectionRef, (snapshot) => {
    generatedReports = snapshot.docs.map(d => d.data());
    checkAndEmitState();
  }, (err) => handleFirestoreError(err, OperationType.GET, `users/${userId}/reports`));

  return () => {
    unsubState();
    unsubProfile();
    unsubSettings();
    unsubTx();
    unsubRem();
    unsubRep();
  };
};

export const syncStateToCloud = async (
  userId: string, 
  previousState: AppState, 
  currentState: AppState
): Promise<void> => {
  if (!userId) return;

  try {
    // 1. Transactions sync
    if (JSON.stringify(previousState.transactions) !== JSON.stringify(currentState.transactions)) {
      const txRef = collection(db, 'users', userId, 'transactions');
      const receivedRef = collection(db, 'users', userId, 'received');
      const pendingRef = collection(db, 'users', userId, 'pending');

      const prevMap = new Map((previousState.transactions || []).map(t => [t.id, t]));
      const currMap = new Map((currentState.transactions || []).map(t => [t.id, t]));

      let batch = writeBatch(db);
      let count = 0;

      // Handle additions and updates
      for (const tx of currentState.transactions || []) {
        const prevTx = prevMap.get(tx.id);
        if (!prevTx || JSON.stringify(prevTx) !== JSON.stringify(tx)) {
          batch.set(doc(txRef, tx.id), tx, { merge: true });
          count++;

          if (tx.type === 'received') {
            batch.set(doc(receivedRef, tx.id), tx, { merge: true });
            count++;
          } else if (tx.type === 'pending') {
            batch.set(doc(pendingRef, tx.id), tx, { merge: true });
            count++;
          }

          if (count >= 400) {
            await batch.commit();
            batch = writeBatch(db);
            count = 0;
          }
        }
      }

      // Handle deletions
      for (const [id, prevTx] of prevMap.entries()) {
        if (!currMap.has(id)) {
          batch.delete(doc(txRef, id));
          count++;
          if (prevTx.type === 'received') {
            batch.delete(doc(receivedRef, id));
            count++;
          } else if (prevTx.type === 'pending') {
            batch.delete(doc(pendingRef, id));
            count++;
          }

          if (count >= 400) {
            await batch.commit();
            batch = writeBatch(db);
            count = 0;
          }
        }
      }

      if (count > 0) {
        await batch.commit();
      }
    }

    // 2. Profile sync
    if (JSON.stringify(previousState.userProfile) !== JSON.stringify(currentState.userProfile)) {
      if (currentState.userProfile) {
        const profileDocRef = doc(db, 'users', userId, 'profile', 'data');
        await setDoc(profileDocRef, currentState.userProfile, { merge: true });
        
        // Also update root user document
        const userDocRef = doc(db, 'users', userId);
        await setDoc(userDocRef, {
          name: currentState.userProfile.fullName,
          email: currentState.userProfile.email,
          photoURL: currentState.userProfile.profilePhoto || currentState.userProfile.businessLogo
        }, { merge: true });
      }
    }

    // 3. Settings sync
    const prevSettings = {
      securitySettings: previousState.securitySettings,
      emailSettings: previousState.emailSettings,
      generalSettings: previousState.generalSettings,
      gullakSettings: previousState.gullakSettings
    };
    const currSettings = {
      securitySettings: currentState.securitySettings,
      emailSettings: currentState.emailSettings,
      generalSettings: currentState.generalSettings,
      gullakSettings: currentState.gullakSettings
    };

    if (JSON.stringify(prevSettings) !== JSON.stringify(currSettings)) {
      const settingsDocRef = doc(db, 'users', userId, 'settings', 'data');
      await setDoc(settingsDocRef, currSettings, { merge: true });
    }

    // 4. Reminders sync
    if (JSON.stringify(previousState.reminderHistory) !== JSON.stringify(currentState.reminderHistory)) {
      const remRef = collection(db, 'users', userId, 'reminders');
      let batch = writeBatch(db);
      let count = 0;
      for (const r of currentState.reminderHistory || []) {
        batch.set(doc(remRef, r.id), r, { merge: true });
        count++;
        if (count >= 400) {
          await batch.commit();
          batch = writeBatch(db);
          count = 0;
        }
      }
      if (count > 0) await batch.commit();
    }

    // 5. Reports sync
    if (JSON.stringify(previousState.generatedReports) !== JSON.stringify(currentState.generatedReports)) {
      const repRef = collection(db, 'users', userId, 'reports');
      let batch = writeBatch(db);
      let count = 0;
      for (const rep of currentState.generatedReports || []) {
        batch.set(doc(repRef, rep.id), rep, { merge: true });
        count++;
        if (count >= 400) {
          await batch.commit();
          batch = writeBatch(db);
          count = 0;
        }
      }
      if (count > 0) await batch.commit();
    }

    // 6. Overall state sync
    const stateToSave = { ...currentState };
    delete (stateToSave as any).transactions;

    if (JSON.stringify(previousState) !== JSON.stringify(currentState)) {
      const docRef = doc(db, 'users', userId, 'app', 'state');
      await setDoc(docRef, stateToSave, { merge: true });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `users/${userId}`);
  }
};
