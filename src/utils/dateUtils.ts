import { format, parseISO, startOfDay, endOfDay, differenceInDays, addDays, isSameDay, isBefore, isAfter, startOfWeek, endOfWeek, startOfMonth, endOfMonth, getDay, getDate, getMonth, getYear, setDay, setDate } from 'date-fns';
import { Habit, HabitEntry, HabitSchedule, FrequencyType } from '../types';

export function formatDate(date: Date | string | number, formatStr: string = 'YYYY-MM-DD'): string {
  const d = date instanceof Date ? date : new Date(date);
  return format(d, formatStr);
}

export function parseDate(dateStr: string): Date {
  return parseISO(dateStr);
}

export function getTodayString(): string {
  return formatDate(new Date(), 'YYYY-MM-DD');
}

export function getDaysAgo(days: number): string {
  return formatDate(addDays(new Date(), -days), 'YYYY-MM-DD');
}

export function isHabitDueToday(habit: Habit, date: string = getTodayString()): boolean {
  const schedule = habit.schedule;
  const targetDate = parseDate(date);
  const dayOfWeek = getDay(targetDate);
  const dateOfMonth = getDate(targetDate);

  switch (schedule.type) {
    case 'daily':
      return true;
    
    case 'weekdays':
      return dayOfWeek >= 1 && dayOfWeek <= 5;
    
    case 'weekends':
      return dayOfWeek === 0 || dayOfWeek === 6;
    
    case 'weekly':
      if (schedule.daysOfWeek && schedule.daysOfWeek.length > 0) {
        return schedule.daysOfWeek.includes(dayOfWeek);
      }
      return true; // If no specific days, due every day (user tracks X times/week manually)
    
    case 'monthly':
      if (schedule.specificDates && schedule.specificDates.length > 0) {
        return schedule.specificDates.includes(dateOfMonth);
      }
      if (schedule.nthWeekday) {
        const { week, weekday } = schedule.nthWeekday;
        const firstDayOfMonth = startOfMonth(targetDate);
        const firstTargetDay = setDay(firstDayOfMonth, weekday, { weekStartsOn: 0 });
        const targetDateCandidate = addDays(firstTargetDay, (week - 1) * 7);
        return isSameDay(targetDate, targetDateCandidate);
      }
      return true;
    
    case 'custom':
      if (schedule.intervalDays) {
        const createdDate = parseDate(formatDate(habit.createdAt, 'YYYY-MM-DD'));
        const diffDays = differenceInDays(targetDate, createdDate);
        return diffDays >= 0 && diffDays % schedule.intervalDays === 0;
      }
      return true;
    
    default:
      return true;
  }
}

export function getHabitDueDates(habit: Habit, startDate: string, endDate: string): string[] {
  const dates: string[] = [];
  const start = parseDate(startDate);
  const end = parseDate(endDate);
  let current = start;

  while (isBefore(current, end) || isSameDay(current, end)) {
    const dateStr = formatDate(current, 'YYYY-MM-DD');
    if (isHabitDueToday(habit, dateStr)) {
      dates.push(dateStr);
    }
    current = addDays(current, 1);
  }

  return dates;
}

export function calculateStreak(entries: HabitEntry[], habitId: string, schedule: HabitSchedule): { current: number; longest: number } {
  const habitEntries = entries
    .filter(e => e.habitId === habitId && !e.skipped)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  if (habitEntries.length === 0) {
    return { current: 0, longest: 0 };
  }

  const completionDates = new Set(habitEntries.map(e => e.date));
  let currentStreak = 0;
  let longestStreak = 0;
  let tempStreak = 0;

  const today = getTodayString();
  const yesterday = formatDate(addDays(new Date(), -1), 'YYYY-MM-DD');
  
  let checkDate = completionDates.has(today) ? today : yesterday;

  while (true) {
    if (completionDates.has(checkDate)) {
      tempStreak++;
      if (checkDate === today || checkDate === yesterday) {
        currentStreak = tempStreak;
      }
    } else if (isHabitDueToday({ id: '', schedule } as Habit, checkDate)) {
      break;
    }
    checkDate = formatDate(addDays(parseDate(checkDate), -1), 'YYYY-MM-DD');
    
    const habitStartDate = formatDate(new Date(0), 'YYYY-MM-DD');
    if (isBefore(parseDate(checkDate), parseDate(habitStartDate))) break;
  }

  let prevDate: string | null = null;
  for (const entry of habitEntries) {
    if (prevDate) {
      const diff = differenceInDays(parseDate(entry.date), parseDate(prevDate));
      const dueDatesBetween = getHabitDueDates(
        { id: '', schedule } as Habit,
        formatDate(addDays(parseDate(prevDate), 1), 'YYYY-MM-DD'),
        formatDate(addDays(parseDate(entry.date), -1), 'YYYY-MM-DD')
      );
      
      if (diff === 1 || dueDatesBetween.length === 0) {
        tempStreak++;
      } else {
        longestStreak = Math.max(longestStreak, tempStreak);
        tempStreak = 1;
      }
    } else {
      tempStreak = 1;
    }
    prevDate = entry.date;
  }
  longestStreak = Math.max(longestStreak, tempStreak);

  return { current: currentStreak, longest: longestStreak };
}

export function getCompletionRate(entries: HabitEntry[], habitId: string, days: number = 30): number {
  const habitEntries = entries.filter(e => e.habitId === habitId);
  if (habitEntries.length === 0) return 0;

  const endDate = new Date();
  const startDate = addDays(endDate, -days);
  
  const dueDates = habitEntries.filter(e => {
    const entryDate = parseDate(e.date);
    return !isBefore(entryDate, startDate) && !isAfter(entryDate, endDate);
  });

  if (dueDates.length === 0) return 0;

  const completed = dueDates.filter(e => e.completed && !e.skipped).length;
  return Math.round((completed / dueDates.length) * 100);
}

export function getEntriesForDate(entries: HabitEntry[], date: string): HabitEntry[] {
  return entries.filter(e => e.date === date);
}

export function getEntryForHabitAndDate(entries: HabitEntry[], habitId: string, date: string): HabitEntry | undefined {
  return entries.find(e => e.habitId === habitId && e.date === date);
}

export function sortHabitsByPriority(habits: Habit[]): Habit[] {
  const priorityOrder = { high: 0, medium: 1, low: 2 };
  return [...habits].sort((a, b) => {
    if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    }
    return a.name.localeCompare(b.name);
  });
}

export function groupHabitsByCategory(habits: Habit[]): Record<string, Habit[]> {
  return habits.reduce((acc, habit) => {
    const category = habit.customCategory || habit.category;
    if (!acc[category]) acc[category] = [];
    acc[category].push(habit);
    return acc;
  }, {} as Record<string, Habit[]>);
}

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export function debounce<T extends (...args: unknown[]) => unknown>(fn: T, delay: number): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
}

export function throttle<T extends (...args: unknown[]) => unknown>(fn: T, limit: number): (...args: Parameters<T>) => void {
  let inThrottle = false;
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      fn(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}