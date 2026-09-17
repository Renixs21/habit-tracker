import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, ReactNode } from 'react';
import { Habit, HabitEntry, HabitSchedule, HabitType, Category, Priority, Achievement, SkipReason, MoodRating } from '../types';
import { calculateStreak, getCompletionRate, getEntryForHabitAndDate, getTodayString, generateId, sortHabitsByPriority, groupHabitsByCategory } from '../utils/dateUtils';
import { firestoreService } from '../services/firebase';
import { saveHabits, loadHabits, saveEntries, loadEntries, saveAchievements, loadAchievements } from '../services/storage';
import { ACHIEVEMENT_DEFINITIONS } from '../constants';
import { useAuth } from './AuthContext';

interface HabitContextType {
  habits: Habit[];
  entries: HabitEntry[];
  achievements: Achievement[];
  loading: boolean;
  error: string | null;
  syncStatus: {
    lastSyncedAt: number | null;
    pendingChanges: number;
    isOnline: boolean;
    isSyncing: boolean;
    error?: string;
  };
  createHabit: (habit: Omit<Habit, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'isArchived'>) => Promise<Habit>;
  updateHabit: (id: string, updates: Partial<Habit>) => Promise<void>;
  deleteHabit: (id: string) => Promise<void>;
  archiveHabit: (id: string) => Promise<void>;
  completeHabit: (habitId: string, date?: string, value?: number, duration?: number, checklistProgress?: { id: string; completed: boolean }[], notes?: string, mood?: MoodRating) => Promise<void>;
  skipHabit: (habitId: string, date: string, reason: SkipReason) => Promise<void>;
  uncompleteHabit: (habitId: string, date: string) => Promise<void>;
  getEntry: (habitId: string, date: string) => HabitEntry | undefined;
  getStreak: (habitId: string) => { current: number; longest: number };
  getCompletionRate: (habitId: string, days?: number) => number;
  getTodaysHabits: () => Habit[];
  getHabitsByCategory: () => Record<string, Habit[]>;
  checkAchievements: (habitId?: string) => Promise<void>;
  syncData: () => Promise<void>;
  clearError: () => void;
}

const HabitContext = createContext<HabitContextType | null>(null);

export function HabitProvider({ children }: { children: ReactNode }) {
  const { user, firebaseUser, loading: authLoading } = useAuth();
  const [habits, setHabits] = useState<Habit[]>([]);
  const [entries, setEntries] = useState<HabitEntry[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [syncStatus, setSyncStatus] = useState({
    lastSyncedAt: null as number | null,
    pendingChanges: 0,
    isOnline: true,
    isSyncing: false,
    error: undefined as string | undefined,
  });

  const clearError = useCallback(() => setError(null), []);

  useEffect(() => {
    if (!authLoading && user && firebaseUser) {
      loadLocalData();
      setupRealtimeListeners();
    } else if (!authLoading && !user) {
      setHabits([]);
      setEntries([]);
      setAchievements([]);
      setLoading(false);
    }
  }, [user, firebaseUser, authLoading]);

  const loadLocalData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [localHabits, localEntries, localAchievements] = await Promise.all([
        loadHabits(),
        loadEntries(),
        loadAchievements(),
      ]);
      setHabits(localHabits.filter(h => h.userId === user.id));
      setEntries(localEntries.filter(e => e.userId === user.id));
      setAchievements(localAchievements.filter(a => a.userId === user.id));
    } catch (err) {
      console.error('Error loading local data:', err);
      setError('Failed to load local data');
    } finally {
      setLoading(false);
    }
  };

  const setupRealtimeListeners = () => {
    if (!firebaseUser) return;

    const unsubscribeHabits = firestoreService.subscribeToHabits(firebaseUser.uid, (remoteHabits) => {
      setHabits(remoteHabits);
      saveHabits(remoteHabits).catch(console.error);
    });

    const unsubscribeEntries = firestoreService.subscribeToEntries(firebaseUser.uid, (remoteEntries) => {
      setEntries(remoteEntries);
      saveEntries(remoteEntries).catch(console.error);
    });

    return () => {
      unsubscribeHabits();
      unsubscribeEntries();
    };
  };

  const createHabit = useCallback(async (habitData: Omit<Habit, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'isArchived'>) => {
    if (!user) throw new Error('No user logged in');
    setError(null);
    
    const now = Date.now();
    const newHabit: Habit = {
      ...habitData,
      id: generateId(),
      userId: user.id,
      createdAt: now,
      updatedAt: now,
      isArchived: false,
    };

    try {
      setHabits(prev => [newHabit, ...prev]);
      await saveHabits([newHabit, ...habits]);
      if (firebaseUser) await firestoreService.saveHabit(newHabit);
      return newHabit;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create habit';
      setError(message);
      throw err;
    }
  }, [user, firebaseUser, habits]);

  const updateHabit = useCallback(async (id: string, updates: Partial<Habit>) => {
    if (!user) throw new Error('No user logged in');
    setError(null);
    
    const updatedHabit = { ...updates, id, updatedAt: Date.now() } as Habit;
    
    try {
      setHabits(prev => prev.map(h => h.id === id ? { ...h, ...updatedHabit } : h));
      await saveHabits(habits.map(h => h.id === id ? { ...h, ...updatedHabit } : h));
      if (firebaseUser) await firestoreService.saveHabit({ ...habits.find(h => h.id === id)!, ...updates, updatedAt: Date.now() } as Habit);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update habit';
      setError(message);
      throw err;
    }
  }, [user, firebaseUser, habits]);

  const deleteHabit = useCallback(async (id: string) => {
    if (!user) throw new Error('No user logged in');
    setError(null);
    
    try {
      setHabits(prev => prev.filter(h => h.id !== id));
      setEntries(prev => prev.filter(e => e.habitId !== id));
      await saveHabits(habits.filter(h => h.id !== id));
      await saveEntries(entries.filter(e => e.habitId !== id));
      if (firebaseUser) {
        await firestoreService.deleteHabit(id);
        const habitEntries = entries.filter(e => e.habitId === id);
        await Promise.all(habitEntries.map(e => firestoreService.deleteEntry(e.id)));
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete habit';
      setError(message);
      throw err;
    }
  }, [user, firebaseUser, habits, entries]);

  const archiveHabit = useCallback(async (id: string) => {
    await updateHabit(id, { isArchived: true, archivedAt: Date.now() });
  }, [updateHabit]);

  const completeHabit = useCallback(async (
    habitId: string,
    date: string = getTodayString(),
    value?: number,
    duration?: number,
    checklistProgress?: { id: string; completed: boolean }[],
    notes?: string,
    mood?: MoodRating
  ) => {
    if (!user) throw new Error('No user logged in');
    setError(null);
    
    const existingEntry = getEntryForHabitAndDate(entries, habitId, date);
    const habit = habits.find(h => h.id === habitId);
    if (!habit) throw new Error('Habit not found');

    const now = Date.now();
    const entry: HabitEntry = {
      id: existingEntry?.id || generateId(),
      habitId,
      userId: user.id,
      date,
      completed: true,
      value,
      duration,
      checklistProgress: habit.type === 'checklist' && habit.checklistConfig 
        ? habit.checklistConfig.items.map((item, index) => ({
            ...item,
            completed: checklistProgress?.[index]?.completed ?? false,
          }))
        : undefined,
      skipped: false,
      notes,
      mood,
      createdAt: existingEntry?.createdAt || now,
      updatedAt: now,
      syncedAt: now,
    };

    try {
      setEntries(prev => {
        const filtered = prev.filter(e => !(e.habitId === habitId && e.date === date));
        return [entry, ...filtered];
      });
      await saveEntries([entry, ...entries.filter(e => !(e.habitId === habitId && e.date === date))]);
      if (firebaseUser) await firestoreService.saveEntry(entry);
      
      await checkAchievements(habitId);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to complete habit';
      setError(message);
      throw err;
    }
  }, [user, firebaseUser, habits, entries]);

  const skipHabit = useCallback(async (habitId: string, date: string, reason: SkipReason) => {
    if (!user) throw new Error('No user logged in');
    setError(null);
    
    const existingEntry = getEntryForHabitAndDate(entries, habitId, date);
    const now = Date.now();
    
    const entry: HabitEntry = {
      id: existingEntry?.id || generateId(),
      habitId,
      userId: user.id,
      date,
      completed: false,
      skipped: true,
      skipReason: reason,
      createdAt: existingEntry?.createdAt || now,
      updatedAt: now,
      syncedAt: now,
    };

    try {
      setEntries(prev => {
        const filtered = prev.filter(e => !(e.habitId === habitId && e.date === date));
        return [entry, ...filtered];
      });
      await saveEntries([entry, ...entries.filter(e => !(e.habitId === habitId && e.date === date))]);
      if (firebaseUser) await firestoreService.saveEntry(entry);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to skip habit';
      setError(message);
      throw err;
    }
  }, [user, firebaseUser, entries]);

  const uncompleteHabit = useCallback(async (habitId: string, date: string) => {
    if (!user) throw new Error('No user logged in');
    setError(null);
    
    try {
      setEntries(prev => prev.filter(e => !(e.habitId === habitId && e.date === date)));
      const filteredEntries = entries.filter(e => !(e.habitId === habitId && e.date === date));
      await saveEntries(filteredEntries);
      if (firebaseUser) {
        const entryToDelete = entries.find(e => e.habitId === habitId && e.date === date);
        if (entryToDelete) await firestoreService.deleteEntry(entryToDelete.id);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to uncomplete habit';
      setError(message);
      throw err;
    }
  }, [user, firebaseUser, entries]);

  const getEntry = useCallback((habitId: string, date: string) => {
    return getEntryForHabitAndDate(entries, habitId, date);
  }, [entries]);

  const getStreak = useCallback((habitId: string) => {
    const habit = habits.find(h => h.id === habitId);
    if (!habit) return { current: 0, longest: 0 };
    return calculateStreak(entries, habitId, habit.schedule);
  }, [habits, entries]);

  const getCompletionRate = useCallback((habitId: string, days: number = 30) => {
    return getCompletionRate(entries, habitId, days);
  }, [entries]);

  const getTodaysHabits = useCallback(() => {
    const today = getTodayString();
    return sortHabitsByPriority(habits.filter(h => !h.isArchived && isHabitDueToday(h, today)));
  }, [habits]);

  const getHabitsByCategory = useCallback(() => {
    return groupHabitsByCategory(habits.filter(h => !h.isArchived));
  }, [habits]);

  const checkAchievements = useCallback(async (habitId?: string) => {
    if (!user || !firebaseUser) return;
    
    const habitsToCheck = habitId ? habits.filter(h => h.id === habitId) : habits;
    const newAchievements: Achievement[] = [];

    for (const habit of habitsToCheck) {
      const streak = calculateStreak(entries, habit.id, habit.schedule);
      const rate = getCompletionRate(entries, habit.id, 30);
      
      const checks = [
        { type: 'streak_3' as const, condition: streak.current >= 3 },
        { type: 'streak_7' as const, condition: streak.current >= 7 },
        { type: 'streak_14' as const, condition: streak.current >= 14 },
        { type: 'streak_30' as const, condition: streak.current >= 30 },
        { type: 'streak_60' as const, condition: streak.current >= 60 },
        { type: 'streak_100' as const, condition: streak.current >= 100 },
        { type: 'consistency_week' as const, condition: rate >= 100 && streak.current >= 7 },
        { type: 'category_master' as const, condition: streak.totalCompletions >= 50 },
      ];

      for (const check of checks) {
        const exists = achievements.some(a => a.type === check.type && a.habitId === habit.id);
        if (check.condition && !exists) {
          const def = ACHIEVEMENT_DEFINITIONS[check.type];
          const achievement: Achievement = {
            id: generateId(),
            userId: user.id,
            type: check.type,
            title: def.title,
            description: def.description,
            icon: def.icon,
            earnedAt: Date.now(),
            habitId: habit.id,
          };
          newAchievements.push(achievement);
        }
      }
    }

    if (newAchievements.length > 0) {
      setAchievements(prev => [...newAchievements, ...prev]);
      await saveAchievements([...newAchievements, ...achievements]);
      if (firebaseUser) {
        await Promise.all(newAchievements.map(a => firestoreService.saveAchievement(a)));
      }
    }
  }, [user, firebaseUser, habits, entries, achievements]);

  const syncData = useCallback(async () => {
    if (!firebaseUser) return;
    setSyncStatus(prev => ({ ...prev, isSyncing: true, error: undefined }));
    
    try {
      setSyncStatus(prev => ({ ...prev, lastSyncedAt: Date.now(), isSyncing: false, pendingChanges: 0 }));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Sync failed';
      setSyncStatus(prev => ({ ...prev, isSyncing: false, error: message }));
      throw err;
    }
  }, [firebaseUser]);

  const value = useMemo(() => ({
    habits,
    entries,
    achievements,
    loading,
    error,
    syncStatus,
    createHabit,
    updateHabit,
    deleteHabit,
    archiveHabit,
    completeHabit,
    skipHabit,
    uncompleteHabit,
    getEntry,
    getStreak,
    getCompletionRate,
    getTodaysHabits,
    getHabitsByCategory,
    checkAchievements,
    syncData,
    clearError,
  }), [
    habits, entries, achievements, loading, error, syncStatus,
    createHabit, updateHabit, deleteHabit, archiveHabit,
    completeHabit, skipHabit, uncompleteHabit, getEntry,
    getStreak, getCompletionRate, getTodaysHabits, getHabitsByCategory,
    checkAchievements, syncData, clearError
  ]);

  return (
    <HabitContext.Provider value={value}>
      {children}
    </HabitContext.Provider>
  );
}

export function useHabits(): HabitContextType {
  const context = useContext(HabitContext);
  if (!context) {
    throw new Error('useHabits must be used within a HabitProvider');
  }
  return context;
}

function isHabitDueToday(habit: Habit, date: string): boolean {
  const schedule = habit.schedule;
  const targetDate = new Date(date);
  const dayOfWeek = targetDate.getDay();
  const dateOfMonth = targetDate.getDate();

  switch (schedule.type) {
    case 'daily': return true;
    case 'weekdays': return dayOfWeek >= 1 && dayOfWeek <= 5;
    case 'weekends': return dayOfWeek === 0 || dayOfWeek === 6;
    case 'weekly': return schedule.daysOfWeek?.includes(dayOfWeek) ?? true;
    case 'monthly': 
      if (schedule.specificDates?.includes(dateOfMonth)) return true;
      if (schedule.nthWeekday) {
        const { week, weekday } = schedule.nthWeekday;
        const firstDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), 1);
        const firstTarget = new Date(firstDay);
        firstTarget.setDate(firstTarget.getDate() + ((weekday - firstDay.getDay() + 7) % 7) + (week - 1) * 7);
        return targetDate.getTime() === firstTarget.getTime();
      }
      return true;
    case 'custom': 
      if (schedule.intervalDays) {
        const created = new Date(habit.createdAt);
        const diff = Math.floor((targetDate.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
        return diff >= 0 && diff % schedule.intervalDays === 0;
      }
      return true;
    default: return true;
  }
}