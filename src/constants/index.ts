import { Category, Priority, HabitType, FrequencyType, SkipReason, MoodRating } from '../types';

export const CATEGORY_CONFIG: Record<Category, { label: string; color: string; icon: string }> = {
  health: { label: 'Health', color: '#EC4899', icon: 'heart' },
  productivity: { label: 'Productivity', color: '#3B82F6', icon: 'briefcase' },
  relationships: { label: 'Relationships', color: '#F59E0B', icon: 'users' },
  learning: { label: 'Learning', color: '#8B5CF6', icon: 'book-open' },
  mindfulness: { label: 'Mindfulness', color: '#06B6D4', icon: 'brain' },
  fitness: { label: 'Fitness', color: '#EF4444', icon: 'dumbbell' },
  nutrition: { label: 'Nutrition', color: '#22C55E', icon: 'apple' },
  sleep: { label: 'Sleep', color: '#6366F1', icon: 'moon' },
  custom: { label: 'Custom', color: '#6B7280', icon: 'plus' },
};

export const PRIORITY_CONFIG: Record<Priority, { label: string; color: string; order: number }> = {
  high: { label: 'High', color: '#EF4444', order: 0 },
  medium: { label: 'Medium', color: '#F59E0B', order: 1 },
  low: { label: 'Low', color: '#22C55E', order: 2 },
};

export const HABIT_TYPE_CONFIG: Record<HabitType, { label: string; description: string; icon: string }> = {
  binary: { label: 'Binary', description: 'Simple done/not done', icon: 'check-circle' },
  quantitative: { label: 'Quantitative', description: 'Numerical target with unit', icon: 'bar-chart' },
  timed: { label: 'Timed', description: 'Duration-based tracking', icon: 'timer' },
  checklist: { label: 'Checklist', description: 'Multiple sub-tasks', icon: 'list-check' },
};

export const FREQUENCY_CONFIG: Record<FrequencyType, { label: string; description: string }> = {
  daily: { label: 'Daily', description: 'Every day' },
  weekdays: { label: 'Weekdays', description: 'Monday through Friday' },
  weekends: { label: 'Weekends', description: 'Saturday and Sunday' },
  weekly: { label: 'Weekly', description: 'X times per week' },
  monthly: { label: 'Monthly', description: 'X times per month' },
  custom: { label: 'Custom', description: 'Every N days or custom pattern' },
};

export const SKIP_REASONS: Record<SkipReason, { label: string; icon: string }> = {
  sick: { label: 'Sick day', icon: 'thermometer' },
  travel: { label: 'Travel', icon: 'plane' },
  rest_day: { label: 'Rest day', icon: 'bed' },
  mental_health: { label: 'Mental health break', icon: 'brain' },
  busy: { label: 'Too busy', icon: 'clock' },
  forgot: { label: 'Forgot', icon: 'alert-circle' },
  other: { label: 'Other', icon: 'more-horizontal' },
};

export const MOOD_LABELS: Record<MoodRating, string> = {
  1: 'Terrible',
  2: 'Bad',
  3: 'Okay',
  4: 'Good',
  5: 'Great',
};

export const MOOD_COLORS: Record<MoodRating, string> = {
  1: '#EF4444',
  2: '#F97316',
  3: '#F59E0B',
  4: '#84CC16',
  5: '#22C55E',
};

export const ACHIEVEMENT_DEFINITIONS: Record<string, { title: string; description: string; icon: string; threshold: number }> = {
  first_habit: { title: 'First Steps', description: 'Create your first habit', icon: 'sparkles', threshold: 1 },
  streak_3: { title: 'Getting Started', description: '3-day streak', icon: 'flame', threshold: 3 },
  streak_7: { title: 'Week Warrior', description: '7-day streak', icon: 'flame', threshold: 7 },
  streak_14: { title: 'Fortnight Fighter', description: '14-day streak', icon: 'flame', threshold: 14 },
  streak_30: { title: 'Monthly Master', description: '30-day streak', icon: 'trophy', threshold: 30 },
  streak_60: { title: 'Diamond Dedication', description: '60-day streak', icon: 'diamond', threshold: 60 },
  streak_100: { title: 'Centurion', description: '100-day streak', icon: 'crown', threshold: 100 },
  consistency_week: { title: 'Consistent Week', description: 'Complete all habits for a week', icon: 'check-circle', threshold: 7 },
  consistency_month: { title: 'Consistent Month', description: 'Complete all habits for a month', icon: 'star', threshold: 30 },
  category_master: { title: 'Category Master', description: 'Complete 50 habits in one category', icon: 'medal', threshold: 50 },
  early_bird: { title: 'Early Bird', description: 'Complete habits before 8 AM for 7 days', icon: 'sunrise', threshold: 7 },
  night_owl: { title: 'Night Owl', description: 'Complete habits after 10 PM for 7 days', icon: 'moon', threshold: 7 },
  comeback_king: { title: 'Comeback King', description: 'Restart a streak after 7+ day break', icon: 'refresh', threshold: 1 },
  perfect_week: { title: 'Perfect Week', description: '100% completion for a week', icon: 'award', threshold: 7 },
};

export const DEFAULT_HABIT_COLORS = [
  '#EF4444', '#F97316', '#F59E0B', '#EAB308', '#84CC16',
  '#22C55E', '#10B981', '#14B8A6', '#06B6D4', '#0EA5E9',
  '#3B82F6', '#6366F1', '#8B5CF6', '#A855F7', '#D946EF',
  '#EC4899', '#F43F5E', '#6B7280',
];

export const STORAGE_KEYS = {
  HABITS: '@habit_tracker:habits',
  ENTRIES: '@habit_tracker:entries',
  USER_PREFERENCES: '@habit_tracker:preferences',
  ACHIEVEMENTS: '@habit_tracker:achievements',
  LAST_SYNC: '@habit_tracker:last_sync',
  OFFLINE_QUEUE: '@habit_tracker:offline_queue',
} as const;

export const FIREBASE_COLLECTIONS = {
  USERS: 'users',
  HABITS: 'habits',
  ENTRIES: 'entries',
  ACHIEVEMENTS: 'achievements',
} as const;

export const NOTIFICATION_CHANNELS = {
  HABIT_REMINDER: 'habit_reminder',
  STREAK_MILESTONE: 'streak_milestone',
  WEEKLY_REPORT: 'weekly_report',
} as const;