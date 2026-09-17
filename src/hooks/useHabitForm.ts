import { useState, useEffect, useCallback } from 'react';
import { Habit, HabitEntry, HabitType, HabitSchedule, Category, Priority, QuantitativeConfig, TimedConfig, ChecklistConfig, ChecklistItem } from '../types';
import { CATEGORY_CONFIG, PRIORITY_CONFIG, HABIT_TYPE_CONFIG, FREQUENCY_CONFIG, DEFAULT_HABIT_COLORS } from '../constants';
import { generateId, getTodayString } from '../utils/dateUtils';

export function useHabitForm(initialHabit?: Habit) {
  const [name, setName] = useState(initialHabit?.name || '');
  const [description, setDescription] = useState(initialHabit?.description || '');
  const [type, setType] = useState<HabitType>(initialHabit?.type || 'binary');
  const [category, setCategory] = useState<Category>(initialHabit?.category || 'health');
  const [customCategory, setCustomCategory] = useState(initialHabit?.customCategory || '');
  const [color, setColor] = useState(initialHabit?.color || DEFAULT_HABIT_COLORS[0]);
  const [icon, setIcon] = useState(initialHabit?.icon || HABIT_TYPE_CONFIG[initialHabit?.type || 'binary'].icon);
  const [priority, setPriority] = useState<Priority>(initialHabit?.priority || 'medium');
  const [schedule, setSchedule] = useState<HabitSchedule>(initialHabit?.schedule || { type: 'daily' });
  const [quantitativeConfig, setQuantitativeConfig] = useState<QuantitativeConfig | undefined>(initialHabit?.quantitativeConfig);
  const [timedConfig, setTimedConfig] = useState<TimedConfig | undefined>(initialHabit?.timedConfig);
  const [checklistConfig, setChecklistConfig] = useState<ChecklistConfig | undefined>(initialHabit?.checklistConfig);
  const [reminder, setReminder] = useState(initialHabit?.reminder);
  const [errors, setErrors] = useState<Partial<Record<keyof Habit, string>>>({});

  const validate = useCallback(() => {
    const newErrors: Partial<Record<keyof Habit, string>> = {};
    if (!name.trim()) newErrors.name = 'Habit name is required';
    if (type === 'quantitative' && (!quantitativeConfig || quantitativeConfig.targetValue <= 0)) {
      newErrors.quantitativeConfig = 'Target value must be greater than 0';
    }
    if (type === 'timed' && (!timedConfig || timedConfig.targetDuration <= 0)) {
      newErrors.timedConfig = 'Target duration must be greater than 0';
    }
    if (type === 'checklist' && (!checklistConfig || checklistConfig.items.length === 0)) {
      newErrors.checklistConfig = 'At least one checklist item is required';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [name, type, quantitativeConfig, timedConfig, checklistConfig]);

  const reset = useCallback(() => {
    setName('');
    setDescription('');
    setType('binary');
    setCategory('health');
    setCustomCategory('');
    setColor(DEFAULT_HABIT_COLORS[0]);
    setIcon(HABIT_TYPE_CONFIG.binary.icon);
    setPriority('medium');
    setSchedule({ type: 'daily' });
    setQuantitativeConfig(undefined);
    setTimedConfig(undefined);
    setChecklistConfig(undefined);
    setReminder(undefined);
    setErrors({});
  }, []);

  const loadHabit = useCallback((habit: Habit) => {
    setName(habit.name);
    setDescription(habit.description);
    setType(habit.type);
    setCategory(habit.category);
    setCustomCategory(habit.customCategory || '');
    setColor(habit.color);
    setIcon(habit.icon);
    setPriority(habit.priority);
    setSchedule(habit.schedule);
    setQuantitativeConfig(habit.quantitativeConfig);
    setTimedConfig(habit.timedConfig);
    setChecklistConfig(habit.checklistConfig);
    setReminder(habit.reminder);
    setErrors({});
  }, []);

  const getFormData = useCallback((): Omit<Habit, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'isArchived'> => ({
    name: name.trim(),
    description: description.trim(),
    type,
    category,
    customCategory: customCategory || undefined,
    color,
    icon,
    priority,
    schedule,
    quantitativeConfig: type === 'quantitative' ? quantitativeConfig : undefined,
    timedConfig: type === 'timed' ? timedConfig : undefined,
    checklistConfig: type === 'checklist' ? checklistConfig : undefined,
    reminder,
    isArchived: false,
  }), [name, description, type, category, customCategory, color, icon, priority, schedule, quantitativeConfig, timedConfig, checklistConfig, reminder]);

  return {
    name, setName,
    description, setDescription,
    type, setType,
    category, setCategory,
    customCategory, setCustomCategory,
    color, setColor,
    icon, setIcon,
    priority, setPriority,
    schedule, setSchedule,
    quantitativeConfig, setQuantitativeConfig,
    timedConfig, setTimedConfig,
    checklistConfig, setChecklistConfig,
    reminder, setReminder,
    errors,
    validate,
    reset,
    loadHabit,
    getFormData,
    categories: Object.entries(CATEGORY_CONFIG),
    priorities: Object.entries(PRIORITY_CONFIG),
    habitTypes: Object.entries(HABIT_TYPE_CONFIG),
    frequencies: Object.entries(FREQUENCY_CONFIG),
    colors: DEFAULT_HABIT_COLORS,
  };
}

export function useChecklistItems(initialItems: ChecklistItem[] = []) {
  const [items, setItems] = useState<ChecklistItem[]>(initialItems.length > 0 ? initialItems : [{ id: generateId(), label: '', order: 0, completed: false }]);

  const addItem = useCallback((label: string = '') => {
    setItems(prev => [...prev, { id: generateId(), label, order: prev.length, completed: false }]);
  }, []);

  const removeItem = useCallback((id: string) => {
    setItems(prev => prev.filter(item => item.id !== id).map((item, index) => ({ ...item, order: index })));
  }, []);

  const updateItem = useCallback((id: string, updates: Partial<ChecklistItem>) => {
    setItems(prev => prev.map(item => item.id === id ? { ...item, ...updates } : item));
  }, []);

  const reorderItems = useCallback((fromIndex: number, toIndex: number) => {
    setItems(prev => {
      const newItems = [...prev];
      const [removed] = newItems.splice(fromIndex, 1);
      newItems.splice(toIndex, 0, removed);
      return newItems.map((item, index) => ({ ...item, order: index }));
    });
  }, []);

  const toggleItem = useCallback((id: string) => {
    setItems(prev => prev.map(item => item.id === id ? { ...item, completed: !item.completed } : item));
  }, []);

  const getProgress = useCallback(() => {
    if (items.length === 0) return 0;
    const completed = items.filter(item => item.completed).length;
    return Math.round((completed / items.length) * 100);
  }, [items]);

  return { items, setItems, addItem, removeItem, updateItem, reorderItems, toggleItem, getProgress };
}

export function useHabitTimer(initialDuration: number = 0) {
  const [duration, setDuration] = useState(initialDuration);
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [pausedTime, setPausedTime] = useState(0);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (isRunning && !isPaused) {
      interval = setInterval(() => {
        setDuration(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRunning, isPaused]);

  const start = useCallback(() => {
    if (!isRunning) {
      setStartTime(Date.now());
      setPausedTime(0);
      setIsRunning(true);
      setIsPaused(false);
    } else if (isPaused) {
      setPausedTime(prev => prev + Date.now() - (startTime || Date.now()));
      setIsPaused(false);
    }
  }, [isRunning, isPaused, startTime]);

  const pause = useCallback(() => {
    if (isRunning && !isPaused) {
      setIsPaused(true);
    }
  }, [isRunning, isPaused]);

  const stop = useCallback(() => {
    setIsRunning(false);
    setIsPaused(false);
    setStartTime(null);
    setPausedTime(0);
  }, []);

  const reset = useCallback(() => {
    setDuration(0);
    setIsRunning(false);
    setIsPaused(false);
    setStartTime(null);
    setPausedTime(0);
  }, []);

  const formatTime = useCallback((seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hrs > 0) return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }, []);

  return { duration, isRunning, isPaused, start, pause, stop, reset, formatTime, formattedTime: formatTime(duration) };
}

export function useHabitCompletion(habit: Habit, date: string = getTodayString()) {
  const [value, setValue] = useState<number | undefined>(undefined);
  const [duration, setDuration] = useState<number | undefined>(undefined);
  const [checklistProgress, setChecklistProgress] = useState<{ id: string; completed: boolean }[]>([]);
  const [notes, setNotes] = useState('');
  const [mood, setMood] = useState<1 | 2 | 3 | 4 | 5 | undefined>(undefined);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const reset = useCallback(() => {
    setValue(undefined);
    setDuration(undefined);
    setChecklistProgress([]);
    setNotes('');
    setMood(undefined);
  }, []);

  const loadFromEntry = useCallback((entry: HabitEntry | undefined) => {
    if (!entry) {
      reset();
      return;
    }
    setValue(entry.value);
    setDuration(entry.duration);
    setChecklistProgress(entry.checklistProgress?.map(item => ({ id: item.id, completed: item.completed })) || []);
    setNotes(entry.notes || '');
    setMood(entry.mood);
  }, [reset]);

  const getCompletionData = useCallback(() => ({
    value: habit.type === 'quantitative' ? value : undefined,
    duration: habit.type === 'timed' ? duration : undefined,
    checklistProgress: habit.type === 'checklist' ? checklistProgress : undefined,
    notes: notes || undefined,
    mood,
  }), [habit.type, value, duration, checklistProgress, notes, mood]);

  const validate = useCallback(() => {
    if (habit.type === 'quantitative' && (value === undefined || value < 0)) return false;
    if (habit.type === 'timed' && (duration === undefined || duration < 0)) return false;
    if (habit.type === 'checklist' && checklistProgress.length === 0) return false;
    return true;
  }, [habit.type, value, duration, checklistProgress]);

  return { value, setValue, duration, setDuration, checklistProgress, setChecklistProgress, notes, setNotes, mood, setMood, isSubmitting, setIsSubmitting, reset, loadFromEntry, getCompletionData, validate };
}