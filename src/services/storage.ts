import AsyncStorage from '@react-native-async-storage/async-storage';
import { Habit, HabitEntry, User, UserPreferences, Achievement, SyncStatus, AppState } from '../types';
import { STORAGE_KEYS } from '../constants';

const STORAGE_VERSION = 1;

export async function saveHabits(habits: Habit[]): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.HABITS, JSON.stringify(habits));
  } catch (error) {
    console.error('Error saving habits:', error);
    throw error;
  }
}

export async function loadHabits(): Promise<Habit[]> {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.HABITS);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error loading habits:', error);
    return [];
  }
}

export async function saveEntries(entries: HabitEntry[]): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.ENTRIES, JSON.stringify(entries));
  } catch (error) {
    console.error('Error saving entries:', error);
    throw error;
  }
}

export async function loadEntries(): Promise<HabitEntry[]> {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.ENTRIES);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error loading entries:', error);
    return [];
  }
}

export async function saveUserPreferences(preferences: UserPreferences): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.USER_PREFERENCES, JSON.stringify(preferences));
  } catch (error) {
    console.error('Error saving preferences:', error);
    throw error;
  }
}

export async function loadUserPreferences(): Promise<UserPreferences | null> {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.USER_PREFERENCES);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('Error loading preferences:', error);
    return null;
  }
}

export async function saveAchievements(achievements: Achievement[]): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.ACHIEVEMENTS, JSON.stringify(achievements));
  } catch (error) {
    console.error('Error saving achievements:', error);
    throw error;
  }
}

export async function loadAchievements(): Promise<Achievement[]> {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.ACHIEVEMENTS);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error loading achievements:', error);
    return [];
  }
}

export async function saveSyncStatus(status: SyncStatus): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.LAST_SYNC, JSON.stringify(status));
  } catch (error) {
    console.error('Error saving sync status:', error);
    throw error;
  }
}

export async function loadSyncStatus(): Promise<SyncStatus | null> {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.LAST_SYNC);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('Error loading sync status:', error);
    return null;
  }
}

export async function saveOfflineQueue(queue: unknown[]): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.OFFLINE_QUEUE, JSON.stringify(queue));
  } catch (error) {
    console.error('Error saving offline queue:', error);
    throw error;
  }
}

export async function loadOfflineQueue(): Promise<unknown[]> {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.OFFLINE_QUEUE);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error loading offline queue:', error);
    return [];
  }
}

export async function clearAllData(): Promise<void> {
  try {
    await AsyncStorage.multiRemove([
      STORAGE_KEYS.HABITS,
      STORAGE_KEYS.ENTRIES,
      STORAGE_KEYS.USER_PREFERENCES,
      STORAGE_KEYS.ACHIEVEMENTS,
      STORAGE_KEYS.LAST_SYNC,
      STORAGE_KEYS.OFFLINE_QUEUE,
    ]);
  } catch (error) {
    console.error('Error clearing data:', error);
    throw error;
  }
}

export async function exportAllData(): Promise<string> {
  try {
    const [habits, entries, preferences, achievements, syncStatus] = await Promise.all([
      loadHabits(),
      loadEntries(),
      loadUserPreferences(),
      loadAchievements(),
      loadSyncStatus(),
    ]);

    const exportData = {
      version: STORAGE_VERSION,
      exportedAt: Date.now(),
      habits,
      entries,
      preferences,
      achievements,
      syncStatus,
    };

    return JSON.stringify(exportData, null, 2);
  } catch (error) {
    console.error('Error exporting data:', error);
    throw error;
  }
}

export async function importAllData(jsonData: string): Promise<void> {
  try {
    const data = JSON.parse(jsonData);
    
    if (data.habits) await saveHabits(data.habits);
    if (data.entries) await saveEntries(data.entries);
    if (data.preferences) await saveUserPreferences(data.preferences);
    if (data.achievements) await saveAchievements(data.achievements);
    if (data.syncStatus) await saveSyncStatus(data.syncStatus);
  } catch (error) {
    console.error('Error importing data:', error);
    throw error;
  }
}

export async function getStorageInfo(): Promise<{ habits: number; entries: number; size: number }> {
  try {
    const [habits, entries] = await Promise.all([loadHabits(), loadEntries()]);
    const habitsSize = JSON.stringify(habits).length;
    const entriesSize = JSON.stringify(entries).length;
    return {
      habits: habits.length,
      entries: entries.length,
      size: habitsSize + entriesSize,
    };
  } catch (error) {
    console.error('Error getting storage info:', error);
    return { habits: 0, entries: 0, size: 0 };
  }
}