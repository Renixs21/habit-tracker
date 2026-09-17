import React, { useState, useEffect, useCallback } from 'react';
import { Box, Text, Button, Icon, HStack, VStack, ScrollView, FlatList, Pressable, Modal, useColorModeValue, Spinner, Switch } from 'native-base';
import { useHabits } from '../../contexts/HabitContext';
import { useAuth } from '../../contexts/AuthContext';
import { HabitCard, EmptyState, LoadingOverlay, StatCard, Badge } from '../ui';
import { HabitDetailModal } from '../habits';
import { getTodayString, formatDate, calculateStreak, getCompletionRate } from '../../utils/dateUtils';
import { CATEGORY_CONFIG, PRIORITY_CONFIG } from '../../constants';
import { Habit, HabitEntry } from '../../types';

export function DashboardScreen({ navigation }: any) {
  const { user } = useAuth();
  const { 
    habits, 
    entries, 
    getTodaysHabits, 
    getEntry, 
    getStreak, 
    getCompletionRate, 
    completeHabit, 
    skipHabit, 
    loading,
    syncData,
  } = useHabits();

  const [selectedHabit, setSelectedHabit] = useState<Habit | null>(null);
  const [selectedEntry, setSelectedEntry] = useState<HabitEntry | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [showAddHabit, setShowAddHabit] = useState(false);

  const todaysHabits = getTodaysHabits();
  const today = getTodayString();

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await syncData();
    } finally {
      setRefreshing(false);
    }
  }, [syncData]);

  const totalHabits = habits.filter(h => !h.isArchived).length;
  const completedToday = todaysHabits.filter(h => {
    const entry = getEntry(h.id, today);
    return entry?.completed && !entry?.skipped;
  }).length;
  const skippedToday = todaysHabits.filter(h => getEntry(h.id, today)?.skipped).length;
  const pendingToday = todaysHabits.length - completedToday - skippedToday;

  const totalStreak = habits.filter(h => !h.isArchived).reduce((sum, h) => sum + getStreak(h.id).current, 0);
  const avgCompletionRate = habits.filter(h => !h.isArchived).length > 0
    ? Math.round(habits.filter(h => !h.isArchived).reduce((sum, h) => sum + getCompletionRate(h.id), 0) / habits.filter(h => !h.isArchived).length)
    : 0;

  const handleComplete = useCallback(async (habit: Habit) => {
    setSelectedHabit(habit);
    setSelectedEntry(getEntry(habit.id, today));
    await completeHabit(habit.id);
  }, [completeHabit, getEntry]);

  const handleSkip = useCallback(async (habit: Habit) => {
    setSelectedHabit(habit);
    setSelectedEntry(getEntry(habit.id, today));
    // Skip reason handled in modal
  }, [getEntry]);

  const handleHabitPress = useCallback((habit: Habit) => {
    setSelectedHabit(habit);
    setSelectedEntry(getEntry(habit.id, today));
  }, [getEntry]);

  const handleDetailComplete = useCallback(async () => {
    if (selectedHabit) await completeHabit(selectedHabit.id);
  }, [selectedHabit, completeHabit]);

  const handleDetailSkip = useCallback(async () => {
    if (selectedHabit) await skipHabit(selectedHabit.id, today, 'rest_day');
  }, [selectedHabit, skipHabit]);

  const bg = useColorModeValue('gray.50', 'gray.900');
  const textColor = useColorModeValue('gray.800', 'white');
  const subTextColor = useColorModeValue('gray.500', 'gray.400');
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  return (
    <Box flex={1} bg={bg}>
      <LoadingOverlay visible={loading} text="Loading habits..." />

      <ScrollView 
        refreshControl={
          <Box>
            <Spinner color="blue.500" />
          </Box>
        }
        onRefresh={handleRefresh}
        refreshing={refreshing}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        <Box p={4}>
          <HStack justifyContent="space-between" alignItems="center" mb={4}>
            <VStack alignItems="flex-start" space={1}>
              <Text fontSize="xl" fontWeight="bold" color={textColor}>
                Good {new Date().getHours() < 12 ? 'Morning' : new Date().getHours() < 17 ? 'Afternoon' : 'Evening'}!
              </Text>
              <Text fontSize="sm" color={subTextColor}>
                {formatDate(new Date(), 'EEEE, MMMM d')}
              </Text>
            </VStack>
            <HStack space={2}>
              <Pressable onPress={() => navigation.navigate('Calendar')} accessibilityLabel="Calendar">
                <Box p={2} bg={cardBg} borderRadius="xl" borderWidth={1} borderColor={borderColor}>
                  <Icon as="calendar" size={5} color={textColor} />
                </Box>
              </Pressable>
              <Pressable onPress={() => setShowAddHabit(true)} accessibilityLabel="Add habit">
                <Box p={2} bg="blue.500" borderRadius="xl">
                  <Icon as="plus" size={5} color="white" />
                </Box>
              </Pressable>
            </HStack>
          </HStack>

          <VStack space={3} w="full">
            <HStack space={3} w="full">
              <StatCard 
                label="Today's Habits" 
                value={todaysHabits.length} 
                icon="list-check" 
                color="blue.500"
                trend={{ value: pendingToday, label: 'pending' }}
              />
              <StatCard 
                label="Completed" 
                value={completedToday} 
                icon="check-circle" 
                color="green.500"
              />
            </HStack>
            <HStack space={3} w="full">
              <StatCard 
                label="Total Streak" 
                value={totalStreak} 
                icon="flame" 
                color="orange.500"
              />
              <StatCard 
                label="Avg Completion" 
                value={`${avgCompletionRate}%`} 
                icon="trending-up" 
                color="purple.500"
              />
            </HStack>
          </VStack>

          {todaysHabits.length > 0 ? (
            <VStack space={3} w="full" mt={4}>
              <HStack justifyContent="space-between" alignItems="center" mb={2}>
                <Text fontSize="lg" fontWeight="bold" color={textColor}>Today's Habits</Text>
                <Badge colorScheme="blue">{todaysHabits.length}</Badge>
              </HStack>
              <FlatList
                data={todaysHabits}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => {
                  const entry = getEntry(item.id, today);
                  const streak = getStreak(item.id);
                  const rate = getCompletionRate(item.id);
                  const isCompleted = entry?.completed && !entry?.skipped;
                  const isSkipped = entry?.skipped;

                  return (
                    <HabitCard
                      habit={item}
                      entry={entry}
                      streak={streak}
                      completionRate={rate}
                      onComplete={() => handleComplete(item)}
                      onSkip={() => handleSkip(item)}
                      onPress={() => handleHabitPress(item)}
                      isCompleted={isCompleted}
                      isSkipped={isSkipped}
                    />
                  );
                }}
                ListEmptyComponent={() => null}
              />
            </VStack>
          ) : (
            <EmptyState
              icon="plus-circle"
              title="No habits scheduled for today"
              subtitle="Create your first habit or check your schedule"
              actionLabel="Add Habit"
              onAction={() => setShowAddHabit(true)}
            />
          )}

          {habits.filter(h => !h.isArchived).length > 0 && (
            <VStack space={3} w="full" mt={6}>
              <Text fontSize="lg" fontWeight="bold" color={textColor}>All Habits</Text>
              <FlatList
                data={habits.filter(h => !h.isArchived)}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => {
                  const entry = getEntry(item.id, today);
                  const streak = getStreak(item.id);
                  const rate = getCompletionRate(item.id);
                  const isCompleted = entry?.completed && !entry?.skipped;
                  const isSkipped = entry?.skipped;

                  return (
                    <HabitCard
                      habit={item}
                      entry={entry}
                      streak={streak}
                      completionRate={rate}
                      onComplete={() => handleComplete(item)}
                      onSkip={() => handleSkip(item)}
                      onPress={() => handleHabitPress(item)}
                      isCompleted={isCompleted}
                      isSkipped={isSkipped}
                    />
                  );
                }}
                ListEmptyComponent={() => null}
              />
            </VStack>
          )}
        </Box>
      </ScrollView>

      <Modal visible={!!selectedHabit} onClose={() => { setSelectedHabit(null); setSelectedEntry(null); }} size="lg">
        {selectedHabit && selectedEntry !== undefined && (
          <HabitDetailModal
            habit={selectedHabit}
            entry={selectedEntry || undefined}
            streak={getStreak(selectedHabit.id)}
            completionRate={getCompletionRate(selectedHabit.id)}
            onComplete={handleDetailComplete}
            onSkip={handleDetailSkip}
            onEdit={() => navigation.navigate('HabitForm', { habit: selectedHabit })}
            onDelete={() => { /* TODO: Delete confirmation */ }}
            onClose={() => { setSelectedHabit(null); setSelectedEntry(null); }}
          />
        )}
      </Modal>

      <Modal visible={showAddHabit} onClose={() => setShowAddHabit(false)} size="full">
        <Box flex={1}>
          <Box p={4} borderBottomWidth={1} borderColor={borderColor} flexDirection="row" justifyContent="space-between" alignItems="center">
            <Text fontSize="xl" fontWeight="bold" color={textColor}>Create Habit</Text>
            <Icon onPress={() => setShowAddHabit(false)} as="close" size={6} color={subTextColor} />
          </Box>
          <Box flex={1}>
            {/* HabitForm would go here - simplified for now */}
            <Center flex={1}>
              <Text color={subTextColor}>Habit Form Component</Text>
            </Center>
          </Box>
        </Box>
      </Modal>
    </Box>
  );
}