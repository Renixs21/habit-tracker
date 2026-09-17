export type HabitType = 'binary' | 'quantitative' | 'timed' | 'checklist';

export type FrequencyType = 'daily' | 'weekly' | 'monthly' | 'custom' | 'weekdays' | 'weekends';

export type Priority = 'high' | 'medium' | 'low';

export type Category = 
  | 'health' 
  | 'productivity' 
  | 'relationships' 
  | 'learning' 
  | 'mindfulness' 
  | 'fitness' 
  | 'nutrition' 
  | 'sleep' 
  | 'custom';

export interface HabitSchedule {
  type: FrequencyType;
  daysOfWeek?: number[]; // 0-6, Sunday-Saturday
  timesPerWeek?: number;
  timesPerMonth?: number;
  specificDates?: number[]; // 1-31
  nthWeekday?: { week: number; weekday: number }; // e.g., 2nd Monday
  intervalDays?: number; // for custom intervals
  customPattern?: string; // cron-like or custom pattern
}

export interface QuantitativeConfig {
  targetValue: number;
  unit: string;
  allowDecimal: boolean;
}

export interface TimedConfig {
  targetDuration: number; // in minutes
  allowPause: boolean;
}

export interface ChecklistConfig {
  items: ChecklistItem[];
}

export interface ChecklistItem {
  id: string;
  label: string;
  order: number;
  completed: boolean;
}

export interface Habit {
  id: string;
  userId: string;
  name: string;
  description: string;
  type: HabitType;
  category: Category;
  customCategory?: string;
  color: string;
  icon: string;
  priority: Priority;
  schedule: HabitSchedule;
  quantitativeConfig?: QuantitativeConfig;
  timedConfig?: TimedConfig;
  checklistConfig?: ChecklistConfig;
  reminder?: ReminderConfig;
  isArchived: boolean;
  createdAt: number;
  updatedAt: number;
  archivedAt?: number;
}

export interface ReminderConfig {
  enabled: boolean;
  time: string; // HH:mm format
  offsetMinutes?: number; // minutes before/after habit time
  repeat: 'daily' | 'weekly' | 'custom';
  snoozeInterval?: number; // minutes
  locationBased?: boolean;
}

export interface HabitEntry {
  id: string;
  habitId: string;
  userId: string;
  date: string; // YYYY-MM-DD
  completed: boolean;
  value?: number; // for quantitative habits
  duration?: number; // for timed habits (seconds)
  checklistProgress?: ChecklistItem[]; // for checklist habits
  skipped: boolean;
  skipReason?: SkipReason;
  notes?: string;
  mood?: MoodRating;
  createdAt: number;
  updatedAt: number;
  syncedAt?: number;
}

export type SkipReason = 
  | 'sick' 
  | 'travel' 
  | 'rest_day' 
  | 'mental_health' 
  | 'busy' 
  | 'forgot' 
  | 'other';

export type MoodRating = 1 | 2 | 3 | 4 | 5;

export interface StreakData {
  currentStreak: number;
  longestStreak: number;
  lastCompletedDate?: string;
  totalCompletions: number;
  completionRate: number;
}

export interface User {
  id: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  preferences: UserPreferences;
  createdAt: number;
  lastLoginAt: number;
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  notificationsEnabled: boolean;
  dailyReminderTime?: string;
  weekStartsOn: 0 | 1; // 0 = Sunday, 1 = Monday
  dateFormat: 'MM/DD/YYYY' | 'DD/MM/YYYY' | 'YYYY-MM-DD';
  timeFormat: 12 | 24;
  defaultCategory: Category;
  autoBackup: boolean;
}

export interface Achievement {
  id: string;
  userId: string;
  type: AchievementType;
  title: string;
  description: string;
  icon: string;
  earnedAt: number;
  habitId?: string;
}

export type AchievementType = 
  | 'first_habit' 
  | 'streak_3' 
  | 'streak_7' 
  | 'streak_14' 
  | 'streak_30' 
  | 'streak_60' 
  | 'streak_100' 
  | 'consistency_week' 
  | 'consistency_month' 
  | 'category_master' 
  | 'early_bird' 
  | 'night_owl' 
  | 'comeback_king' 
  | 'perfect_week';

export interface WeeklyReport {
  weekStart: string;
  weekEnd: string;
  totalHabits: number;
  completedHabits: number;
  completionRate: number;
  categoryBreakdown: Record<Category, { total: number; completed: number }>;
  streakChanges: Record<string, { previous: number; current: number }>;
  insights: string[];
}

export interface MonthlyReport {
  month: string; // YYYY-MM
  totalHabits: number;
  completedHabits: number;
  completionRate: number;
  weeklyTrends: number[];
  categoryBreakdown: Record<Category, { total: number; completed: number }>;
  longestStreaks: Record<string, number>;
  insights: string[];
}

export interface SyncStatus {
  lastSyncedAt: number | null;
  pendingChanges: number;
  isOnline: boolean;
  isSyncing: boolean;
  error?: string;
}

export interface AppState {
  user: User | null;
  habits: Habit[];
  entries: HabitEntry[];
  achievements: Achievement[];
  syncStatus: SyncStatus;
  isLoading: boolean;
  error: string | null;
}