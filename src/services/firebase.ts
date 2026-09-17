import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { 
  getAuth, 
  Auth, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  sendPasswordResetEmail,
  updateProfile,
  User as FirebaseUser,
  onAuthStateChanged,
  sendEmailVerification
} from 'firebase/auth';
import { 
  getFirestore, 
  Firestore, 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  limit,
  writeBatch,
  serverTimestamp,
  Timestamp,
  onSnapshot,
  Unsubscribe
} from 'firebase/firestore';
import { FIREBASE_COLLECTIONS } from '../constants';
import { Habit, HabitEntry, UserPreferences, Achievement, User } from '../types';

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

let app: FirebaseApp;
let auth: Auth;
let db: Firestore;

export function initializeFirebase(): { app: FirebaseApp; auth: Auth; db: Firestore } {
  if (getApps().length === 0) {
    app = initializeApp(firebaseConfig);
  } else {
    app = getApps()[0];
  }
  auth = getAuth(app);
  db = getFirestore(app);
  return { app, auth, db };
}

export function getFirebaseAuth(): Auth {
  if (!auth) initializeFirebase();
  return auth;
}

export function getFirebaseDb(): Firestore {
  if (!db) initializeFirebase();
  return db;
}

export const authService = {
  async signUp(email: string, password: string, displayName?: string): Promise<FirebaseUser> {
    const auth = getFirebaseAuth();
    const result = await createUserWithEmailAndPassword(auth, email, password);
    if (displayName && result.user) {
      await updateProfile(result.user, { displayName });
      await sendEmailVerification(result.user);
    }
    return result.user;
  },

  async signIn(email: string, password: string): Promise<FirebaseUser> {
    const auth = getFirebaseAuth();
    const result = await signInWithEmailAndPassword(auth, email, password);
    return result.user;
  },

  async signOut(): Promise<void> {
    const auth = getFirebaseAuth();
    await signOut(auth);
  },

  async resetPassword(email: string): Promise<void> {
    const auth = getFirebaseAuth();
    await sendPasswordResetEmail(auth, email);
  },

  async updateUserProfile(displayName?: string, photoURL?: string): Promise<void> {
    const auth = getFirebaseAuth();
    if (auth.currentUser) {
      await updateProfile(auth.currentUser, { displayName, photoURL });
    }
  },

  onAuthStateChanged(callback: (user: FirebaseUser | null) => void): Unsubscribe {
    const auth = getFirebaseAuth();
    return onAuthStateChanged(auth, callback);
  },

  getCurrentUser(): FirebaseUser | null {
    const auth = getFirebaseAuth();
    return auth.currentUser;
  },
};

function habitToFirestore(habit: Habit): Record<string, unknown> {
  return {
    ...habit,
    createdAt: Timestamp.fromMillis(habit.createdAt),
    updatedAt: Timestamp.fromMillis(habit.updatedAt),
    archivedAt: habit.archivedAt ? Timestamp.fromMillis(habit.archivedAt) : null,
  };
}

function habitFromFirestore(doc: { id: string; data: () => Record<string, unknown> }): Habit {
  const data = doc.data();
  return {
    ...data,
    id: doc.id,
    createdAt: (data.createdAt as Timestamp)?.toMillis() || Date.now(),
    updatedAt: (data.updatedAt as Timestamp)?.toMillis() || Date.now(),
    archivedAt: (data.archivedAt as Timestamp)?.toMillis() || undefined,
  } as Habit;
}

function entryToFirestore(entry: HabitEntry): Record<string, unknown> {
  return {
    ...entry,
    createdAt: Timestamp.fromMillis(entry.createdAt),
    updatedAt: Timestamp.fromMillis(entry.updatedAt),
    syncedAt: entry.syncedAt ? Timestamp.fromMillis(entry.syncedAt) : null,
  };
}

function entryFromFirestore(doc: { id: string; data: () => Record<string, unknown> }): HabitEntry {
  const data = doc.data();
  return {
    ...data,
    id: doc.id,
    createdAt: (data.createdAt as Timestamp)?.toMillis() || Date.now(),
    updatedAt: (data.updatedAt as Timestamp)?.toMillis() || Date.now(),
    syncedAt: (data.syncedAt as Timestamp)?.toMillis() || undefined,
  } as HabitEntry;
}

export const firestoreService = {
  async saveUserProfile(user: User): Promise<void> {
    const db = getFirebaseDb();
    await setDoc(doc(db, FIREBASE_COLLECTIONS.USERS, user.id), {
      ...user,
      createdAt: Timestamp.fromMillis(user.createdAt),
      lastLoginAt: Timestamp.fromMillis(user.lastLoginAt),
    }, { merge: true });
  },

  async getUserProfile(userId: string): Promise<User | null> {
    const db = getFirebaseDb();
    const docRef = doc(db, FIREBASE_COLLECTIONS.USERS, userId);
    const snapshot = await getDoc(docRef);
    if (!snapshot.exists()) return null;
    const data = snapshot.data();
    return {
      ...data,
      createdAt: (data.createdAt as Timestamp)?.toMillis() || Date.now(),
      lastLoginAt: (data.lastLoginAt as Timestamp)?.toMillis() || Date.now(),
    } as User;
  },

  async saveUserPreferences(userId: string, preferences: UserPreferences): Promise<void> {
    const db = getFirebaseDb();
    await updateDoc(doc(db, FIREBASE_COLLECTIONS.USERS, userId), {
      preferences,
      updatedAt: serverTimestamp(),
    });
  },

  async saveHabit(habit: Habit): Promise<void> {
    const db = getFirebaseDb();
    await setDoc(doc(db, FIREBASE_COLLECTIONS.HABITS, habit.id), habitToFirestore(habit), { merge: true });
  },

  async saveHabits(habits: Habit[]): Promise<void> {
    const db = getFirebaseDb();
    const batch = writeBatch(db);
    habits.forEach(habit => {
      batch.set(doc(db, FIREBASE_COLLECTIONS.HABITS, habit.id), habitToFirestore(habit), { merge: true });
    });
    await batch.commit();
  },

  async getHabits(userId: string): Promise<Habit[]> {
    const db = getFirebaseDb();
    const q = query(
      collection(db, FIREBASE_COLLECTIONS.HABITS),
      where('userId', '==', userId),
      where('isArchived', '==', false),
      orderBy('updatedAt', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(habitFromFirestore);
  },

  async getAllHabits(userId: string): Promise<Habit[]> {
    const db = getFirebaseDb();
    const q = query(
      collection(db, FIREBASE_COLLECTIONS.HABITS),
      where('userId', '==', userId),
      orderBy('updatedAt', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(habitFromFirestore);
  },

  async deleteHabit(habitId: string): Promise<void> {
    const db = getFirebaseDb();
    await deleteDoc(doc(db, FIREBASE_COLLECTIONS.HABITS, habitId));
  },

  async saveEntry(entry: HabitEntry): Promise<void> {
    const db = getFirebaseDb();
    await setDoc(doc(db, FIREBASE_COLLECTIONS.ENTRIES, entry.id), entryToFirestore(entry), { merge: true });
  },

  async saveEntries(entries: HabitEntry[]): Promise<void> {
    const db = getFirebaseDb();
    const batch = writeBatch(db);
    entries.forEach(entry => {
      batch.set(doc(db, FIREBASE_COLLECTIONS.ENTRIES, entry.id), entryToFirestore(entry), { merge: true });
    });
    await batch.commit();
  },

  async getEntries(userId: string, startDate?: string, endDate?: string): Promise<HabitEntry[]> {
    const db = getFirebaseDb();
    let q = query(
      collection(db, FIREBASE_COLLECTIONS.ENTRIES),
      where('userId', '==', userId),
      orderBy('date', 'desc')
    );
    const snapshot = await getDocs(q);
    let entries = snapshot.docs.map(entryFromFirestore);
    
    if (startDate) {
      entries = entries.filter(e => e.date >= startDate);
    }
    if (endDate) {
      entries = entries.filter(e => e.date <= endDate);
    }
    return entries;
  },

  async deleteEntry(entryId: string): Promise<void> {
    const db = getFirebaseDb();
    await deleteDoc(doc(db, FIREBASE_COLLECTIONS.ENTRIES, entryId));
  },

  async saveAchievement(achievement: Achievement): Promise<void> {
    const db = getFirebaseDb();
    await setDoc(doc(db, FIREBASE_COLLECTIONS.ACHIEVEMENTS, achievement.id), {
      ...achievement,
      earnedAt: Timestamp.fromMillis(achievement.earnedAt),
    }, { merge: true });
  },

  async getAchievements(userId: string): Promise<Achievement[]> {
    const db = getFirebaseDb();
    const q = query(
      collection(db, FIREBASE_COLLECTIONS.ACHIEVEMENTS),
      where('userId', '==', userId),
      orderBy('earnedAt', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      ...doc.data(),
      id: doc.id,
      earnedAt: (doc.data().earnedAt as Timestamp)?.toMillis() || Date.now(),
    })) as Achievement[];
  },

  subscribeToHabits(userId: string, callback: (habits: Habit[]) => void): Unsubscribe {
    const db = getFirebaseDb();
    const q = query(
      collection(db, FIREBASE_COLLECTIONS.HABITS),
      where('userId', '==', userId),
      where('isArchived', '==', false),
      orderBy('updatedAt', 'desc')
    );
    return onSnapshot(q, (snapshot) => {
      const habits = snapshot.docs.map(habitFromFirestore);
      callback(habits);
    });
  },

  subscribeToEntries(userId: string, callback: (entries: HabitEntry[]) => void): Unsubscribe {
    const db = getFirebaseDb();
    const q = query(
      collection(db, FIREBASE_COLLECTIONS.ENTRIES),
      where('userId', '==', userId),
      orderBy('date', 'desc'),
      limit(1000)
    );
    return onSnapshot(q, (snapshot) => {
      const entries = snapshot.docs.map(entryFromFirestore);
      callback(entries);
    });
  },
};

export { firebaseConfig };