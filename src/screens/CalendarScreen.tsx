import React, { useState, useMemo, useCallback } from 'react';
import { Box, Text, HStack, VStack, Pressable, Modal, useColorModeValue, Icon, ScrollView, Center } from 'native-base';
import { useHabits } from '../../contexts/HabitContext';
import { formatDate, addDays, startOfMonth, endOfMonth, startOfWeek, endOfWeek, getDaysInMonth, getDay, isSameDay, parseISO } from 'date-fns';
import { Habit, HabitEntry } from '../../types';
import { Card, Badge, LoadingOverlay } from '../ui';

interface CalendarScreenProps {
  navigation: any;
}

export function CalendarScreen({ navigation }: CalendarScreenProps) {
  const { habits, entries, loading, syncData } = useHabits();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedHabit, setSelectedHabit] = useState<Habit | null>(null);
  const [showHabitDetail, setShowHabitDetail] = useState(false);

  const today = new Date();
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const weekStart = startOfWeek(monthStart, { weekStartsOn: 0 });
  const weekEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
  const daysInMonth = getDaysInMonth(currentMonth);

  const calendarDays = useMemo(() => {
    const days: Date[] = [];
    let current = weekStart;
    while (current <= weekEnd) {
      days.push(current);
      current = addDays(current, 1);
    }
    return days;
  }, [currentMonth]);

  const getDayEntries = useCallback((date: Date) => {
    const dateStr = formatDate(date, 'YYYY-MM-DD');
    return entries.filter(e => e.date === dateStr);
  }, [entries]);

  const getDayCompletion = useCallback((date: Date) => {
    const dateStr = formatDate(date, 'YYYY-MM-DD');
    const dueHabits = habits.filter(h => !h.isArchived && isHabitDueOnDate(h, dateStr));
    if (dueHabits.length === 0) return { completed: 0, total: 0, rate: 0 };
    
    const completed = dueHabits.filter(h => {
      const entry = entries.find(e => e.habitId === h.id && e.date === dateStr);
      return entry?.completed && !entry?.skipped;
    }).length;
    
    return { completed, total: dueHabits.length, rate: Math.round((completed / dueHabits.length) * 100) };
  }, [habits, entries]);

  const getDayColor = useCallback((date: Date) => {
    const { rate, total } = getDayCompletion(date);
    if (total === 0) return 'transparent';
    if (rate === 100) return '#22C55E';
    if (rate >= 75) return '#84CC16';
    if (rate >= 50) return '#F59E0B';
    if (rate >= 25) return '#F97316';
    return '#EF4444';
  }, [getDayCompletion]);

  const handleDayPress = useCallback((date: Date) => {
    setSelectedDate(date);
    const dayHabits = habits.filter(h => !h.isArchived && isHabitDueOnDate(h, formatDate(date, 'YYYY-MM-DD')));
    if (dayHabits.length > 0) {
      setSelectedHabit(dayHabits[0]);
      setShowHabitDetail(true);
    }
  }, [habits]);

  const handleMonthChange = useCallback((delta: number) => {
    setCurrentMonth(prev => addDays(prev, delta * 30));
  }, []);

  const bg = useColorModeValue('gray.50', 'gray.900');
  const textColor = useColorModeValue('gray.800', 'white');
  const subTextColor = useColorModeValue('gray.500', 'gray.400');
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const todayColor = 'blue.500';

  return (
    <Box flex={1} bg={bg}>
      <LoadingOverlay visible={loading} text="Loading calendar..." />

      <Box p={4}>
        <HStack justifyContent="space-between" alignItems="center" mb={4}>
          <Pressable onPress={() => handleMonthChange(-1)} accessibilityLabel="Previous month">
            <Icon as="chevron-left" size={6} color={textColor} />
          </Pressable>
          <Text fontSize="xl" fontWeight="bold" color={textColor}>
            {formatDate(currentMonth, 'MMMM yyyy')}
          </Text>
          <Pressable onPress={() => handleMonthChange(1)} accessibilityLabel="Next month">
            <Icon as="chevron-right" size={6} color={textColor} />
          </Pressable>
        </HStack>

        <HStack space={1} w="full" mb={2}>
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, index) => (
            <Box key={day} flex={1} alignItems="center" py={2}>
              <Text fontSize="xs" fontWeight="semibold" color={subTextColor}>{day}</Text>
            </Box>
          ))}
        </HStack>

        <Box flexDirection="row" flexWrap="wrap" w="full">
          {calendarDays.map((day, index) => {
            const isCurrentMonth = getMonth(day) === getMonth(currentMonth);
            const isToday = isSameDay(day, today);
            const isSelected = isSameDay(day, selectedDate);
            const { rate, total, completed } = getDayCompletion(day);
            const dayColor = getDayColor(day);

            return (
              <Pressable
                key={index}
                onPress={() => handleDayPress(day)}
                style={({ pressed }) => ({
                  flex: 1,
                  aspectRatio: 1,
                  p: 2,
                  borderRadius: 'md',
                  bg: isSelected ? `${dayColor}30` : isToday ? `${todayColor}15` : pressed ? useColorModeValue('gray.100', 'gray.800') : 'transparent',
                  borderWidth: isSelected ? 2 : isToday ? 1 : 0,
                  borderColor: isSelected ? dayColor : isToday ? todayColor : 'transparent',
                  minHeight: 50,
                })}
                accessibilityLabel={formatDate(day, 'EEEE, MMMM d')}
                accessibilityState={{ selected: isSelected }}
              >
                <VStack alignItems="center" space={1} justifyContent="center">
                  <Text 
                    fontSize="sm" 
                    fontWeight={isToday ? 'bold' : isSelected ? 'semibold' : 'medium'} 
                    color={isCurrentMonth ? (isToday ? todayColor : textColor) : subTextColor}
                  >
                    {getDate(day)}
                  </Text>
                  {total > 0 && (
                    <Box 
                      w={6} 
                      h={6} 
                      borderRadius="full" 
                      bg={dayColor} 
                      opacity={rate === 100 ? 1 : 0.6}
                    />
                  )}
                </VStack>
              </Pressable>
            );
          })}
        </Box>

        <Box mt={6}>
          <Text fontSize="lg" fontWeight="bold" color={textColor} mb={3}>
            {formatDate(selectedDate, 'EEEE, MMMM d')}
          </Text>
          <ScrollView showsVerticalScrollIndicator={false} maxH={300}>
            <VStack space={2} w="full">
              {habits
                .filter(h => !h.isArchived && isHabitDueOnDate(h, formatDate(selectedDate, 'YYYY-MM-DD')))
                .map((habit) => {
                  const entry = entries.find(e => e.habitId === habit.id && e.date === formatDate(selectedDate, 'YYYY-MM-DD'));
                  const isCompleted = entry?.completed && !entry?.skipped;
                  const isSkipped = entry?.skipped;

                  return (
                    <Pressable
                      key={habit.id}
                      onPress={() => { setSelectedHabit(habit); setShowHabitDetail(true); }}
                      style={({ pressed }) => ({
                        bg: pressed ? useColorModeValue('gray.100', 'gray.800') : cardBg,
                        borderRadius: 'lg',
                        p: 3,
                        flexDirection: 'row',
                        alignItems: 'center',
                      })}
                      accessibilityRole="button"
                    >
                      <Box 
                        bg={isCompleted ? habit.color : 'transparent'} 
                        borderWidth={isCompleted ? 0 : 2} 
                        borderColor={habit.color}
                        borderRadius="full" 
                        size={10} 
                        justifyContent="center" 
                        alignItems="center"
                      >
                        {isCompleted && <Icon as="check" size={5} color="white" />}
                        {isSkipped && <Icon as="skip-forward" size={5} color={habit.color} />}
                      </Box>
                      <Box flex={1} ml={3}>
                        <Text fontSize="md" fontWeight="semibold" color={textColor}>{habit.name}</Text>
                        <HStack space={2} mt={1} alignItems="center">
                          <Badge colorScheme={habit.category as any} size="sm">{CATEGORY_CONFIG[habit.category].label}</Badge>
                          <Badge colorScheme={habit.priority as any} size="sm">{PRIORITY_CONFIG[habit.priority].label}</Badge>
                        </HStack>
                      </Box>
                      <Icon as="chevron-right" size={5} color={subTextColor} />
                    </Pressable>
                  );
                })}
              {habits.filter(h => !h.isArchived && isHabitDueOnDate(h, formatDate(selectedDate, 'YYYY-MM-DD'))).length === 0 && (
                <Center py={8}>
                  <Text color={subTextColor}>No habits scheduled for this day</Text>
                </Center>
              )}
            </VStack>
          </ScrollView>
        </Box>
      </Box>

      <Modal visible={showHabitDetail} onClose={() => setShowHabitDetail(false)} size="lg">
        {selectedHabit && (
          <Box p={4}>
            <HStack justifyContent="space-between" alignItems="center" mb={4}>
              <HStack space={3} alignItems="center">
                <Box bg={`${selectedHabit.color}15`} borderRadius="xl" size={12} justifyContent="center" alignItems="center">
                  <Icon as={selectedHabit.icon} size={6} color={selectedHabit.color} />
                </Box>
                <VStack alignItems="flex-start" space={1}>
                  <Text fontSize="lg" fontWeight="bold" color={textColor}>{selectedHabit.name}</Text>
                  <Badge colorScheme={selectedHabit.category as any}>{CATEGORY_CONFIG[selectedHabit.category].label}</Badge>
                </VStack>
              </HStack>
              <Icon onPress={() => setShowHabitDetail(false)} as="close" size={6} color={subTextColor} />
            </HStack>
            <ScrollView maxH={400}>
              <VStack space={4} w="full">
                {selectedHabit.description && <Text fontSize="md" color={subTextColor}>{selectedHabit.description}</Text>}
                
                <Divider label="Schedule" />
                <Text fontSize="sm" color={subTextColor}>
                  {formatSchedule(selectedHabit.schedule)}
                </Text>

                <Divider label="Progress" />
                <HStack space={4} w="full" justifyContent="space-around">
                  <VStack alignItems="center" space={1}>
                    <Text fontSize="2xl" fontWeight="bold" color={selectedHabit.color}>{calculateStreak(entries, selectedHabit.id, selectedHabit.schedule).current}</Text>
                    <Text fontSize="xs" color={subTextColor}>Current Streak</Text>
                  </VStack>
                  <VStack alignItems="center" space={1}>
                    <Text fontSize="2xl" fontWeight="bold" color={selectedHabit.color}>{calculateStreak(entries, selectedHabit.id, selectedHabit.schedule).longest}</Text>
                    <Text fontSize="xs" color={subTextColor}>Longest Streak</Text>
                  </VStack>
                  <VStack alignItems="center" space={1}>
                    <Text fontSize="2xl" fontWeight="bold" color={selectedHabit.color}>{getCompletionRate(entries, selectedHabit.id)}%</Text>
                    <Text fontSize="xs" color={subTextColor}>30-Day Rate</Text>
                  </VStack>
                </HStack>
              </VStack>
            </ScrollView>
            <Box mt={4} borderTopWidth={1} borderColor={borderColor} pt={4}>
              <HStack space={2} w="full">
                <Button flex={1} variant="outline" onPress={() => navigation.navigate('HabitForm', { habit: selectedHabit })}>Edit</Button>
                <Button flex={1} colorScheme="red" onPress={() => { /* Delete */ }}>Delete</Button>
              </HStack>
            </Box>
          </Box>
        )}
      </Modal>
    </Box>
  );
}

function isHabitDueOnDate(habit: Habit, dateStr: string): boolean {
  const schedule = habit.schedule;
  const targetDate = parseISO(dateStr);
  const dayOfWeek = getDay(targetDate);
  const dateOfMonth = getDate(targetDate);

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

function formatSchedule(schedule: any): string {
  switch (schedule.type) {
    case 'daily': return 'Every day';
    case 'weekdays': return 'Monday through Friday';
    case 'weekends': return 'Saturday and Sunday';
    case 'weekly':
      if (schedule.daysOfWeek?.length) {
        return `Weekly on ${schedule.daysOfWeek.map((d: number) => ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][d]).join(', ')}`;
      }
      return `${schedule.timesPerWeek || 'X'} times per week`;
    case 'monthly':
      if (schedule.specificDates?.length) {
        return `Monthly on the ${schedule.specificDates.join(', ')}`;
      }
      if (schedule.nthWeekday) {
        return `Monthly on the ${schedule.nthWeekday.week}${schedule.nthWeekday.week===1?'st':schedule.nthWeekday.week===2?'nd':'rd'} ${['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][schedule.nthWeekday.weekday]}`;
      }
      return `${schedule.timesPerMonth || 'X'} times per month`;
    case 'custom':
      return schedule.intervalDays ? `Every ${schedule.intervalDays} days` : 'Custom pattern';
    default: return 'Custom';
  }
}

function getMonth(date: Date): number { return date.getMonth(); }
function getDate(date: Date): number { return date.getDate(); }
function getDay(date: Date): number { return date.getDay(); }
function calculateStreak(entries: HabitEntry[], habitId: string, schedule: any): { current: number; longest: number } {
  const habitEntries = entries.filter(e => e.habitId === habitId && !e.skipped).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  if (habitEntries.length === 0) return { current: 0, longest: 0 };
  const completionDates = new Set(habitEntries.map(e => e.date));
  let currentStreak = 0;
  let longestStreak = 0;
  let tempStreak = 0;
  const today = formatDate(new Date(), 'YYYY-MM-DD');
  const yesterday = formatDate(addDays(new Date(), -1), 'YYYY-MM-DD');
  let checkDate = completionDates.has(today) ? today : yesterday;
  while (true) {
    if (completionDates.has(checkDate)) {
      tempStreak++;
      if (checkDate === today || checkDate === yesterday) currentStreak = tempStreak;
    } else if (isHabitDueOnDate({ schedule } as Habit, checkDate)) break;
    checkDate = formatDate(addDays(parseISO(checkDate), -1), 'YYYY-MM-DD');
  }
  let prevDate: string | null = null;
  for (const entry of habitEntries) {
    if (prevDate) {
      const diff = Math.floor((new Date(entry.date).getTime() - new Date(prevDate).getTime()) / (1000 * 60 * 60 * 24));
      if (diff === 1) tempStreak++;
      else { longestStreak = Math.max(longestStreak, tempStreak); tempStreak = 1; }
    } else tempStreak = 1;
    prevDate = entry.date;
  }
  longestStreak = Math.max(longestStreak, tempStreak);
  return { current: currentStreak, longest: longestStreak };
}

function getCompletionRate(entries: HabitEntry[], habitId: string): number {
  const habitEntries = entries.filter(e => e.habitId === habitId);
  if (habitEntries.length === 0) return 0;
  const endDate = new Date();
  const startDate = addDays(endDate, -30);
  const dueDates = habitEntries.filter(e => !isBefore(parseISO(e.date), startDate) && !isAfter(parseISO(e.date), endDate));
  if (dueDates.length === 0) return 0;
  const completed = dueDates.filter(e => e.completed && !e.skipped).length;
  return Math.round((completed / dueDates.length) * 100);
}

function isBefore(date1: Date, date2: Date): boolean { return date1 < date2; }
function isAfter(date1: Date, date2: Date): boolean { return date1 > date2; }