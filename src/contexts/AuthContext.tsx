import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { FirebaseUser } from 'firebase/auth';
import { User, UserPreferences } from '../types';
import { authService, firestoreService } from '../services/firebase';
import { getFirebaseAuth } from '../services/firebase';

interface AuthContextType {
  user: User | null;
  firebaseUser: FirebaseUser | null;
  loading: boolean;
  error: string | null;
  signUp: (email: string, password: string, displayName?: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateProfile: (displayName?: string, photoURL?: string) => Promise<void>;
  updatePreferences: (preferences: Partial<UserPreferences>) => Promise<void>;
  clearError: () => void;
}

const defaultPreferences: UserPreferences = {
  theme: 'system',
  notificationsEnabled: true,
  weekStartsOn: 0,
  dateFormat: 'YYYY-MM-DD',
  timeFormat: 24,
  defaultCategory: 'health',
  autoBackup: true,
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const auth = getFirebaseAuth();
    const unsubscribe = authService.onAuthStateChanged(async (fbUser) => {
      setFirebaseUser(fbUser);
      if (fbUser) {
        try {
          const userProfile = await firestoreService.getUserProfile(fbUser.uid);
          if (userProfile) {
            setUser(userProfile);
          } else {
            const newUser: User = {
              id: fbUser.uid,
              email: fbUser.email || '',
              displayName: fbUser.displayName || undefined,
              photoURL: fbUser.photoURL || undefined,
              preferences: defaultPreferences,
              createdAt: Date.now(),
              lastLoginAt: Date.now(),
            };
            await firestoreService.saveUserProfile(newUser);
            setUser(newUser);
          }
        } catch (err) {
          console.error('Error loading user profile:', err);
          setError('Failed to load user profile');
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const clearError = useCallback(() => setError(null), []);

  const signUp = useCallback(async (email: string, password: string, displayName?: string) => {
    setError(null);
    setLoading(true);
    try {
      await authService.signUp(email, password, displayName);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Sign up failed';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    setError(null);
    setLoading(true);
    try {
      await authService.signIn(email, password);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Sign in failed';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const signOut = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      await authService.signOut();
      setUser(null);
      setFirebaseUser(null);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Sign out failed';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const resetPassword = useCallback(async (email: string) => {
    setError(null);
    try {
      await authService.resetPassword(email);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Password reset failed';
      setError(message);
      throw err;
    }
  }, []);

  const updateProfile = useCallback(async (displayName?: string, photoURL?: string) => {
    setError(null);
    try {
      await authService.updateUserProfile(displayName, photoURL);
      if (user) {
        const updatedUser = { ...user, displayName, photoURL };
        setUser(updatedUser);
        await firestoreService.saveUserProfile(updatedUser);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Profile update failed';
      setError(message);
      throw err;
    }
  }, [user]);

  const updatePreferences = useCallback(async (preferences: Partial<UserPreferences>) => {
    setError(null);
    if (!user || !firebaseUser) return;
    try {
      const updatedPreferences = { ...user.preferences, ...preferences };
      await firestoreService.saveUserPreferences(firebaseUser.uid, updatedPreferences);
      setUser(prev => prev ? { ...prev, preferences: updatedPreferences } : null);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Preferences update failed';
      setError(message);
      throw err;
    }
  }, [user, firebaseUser]);

  return (
    <AuthContext.Provider value={{
      user,
      firebaseUser,
      loading,
      error,
      signUp,
      signIn,
      signOut,
      resetPassword,
      updateProfile,
      updatePreferences,
      clearError,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}