import React, { useEffect } from 'react';
import { Box, Text, Button, Icon, HStack, VStack, ScrollView, useColorModeValue, Center } from 'native-base';
import { useHabits } from '../../contexts/HabitContext';
import { useAuth } from '../../contexts/AuthContext';
import { HabitForm } from '../habits';
import { Habit } from '../../types';
import { LoadingOverlay } from '../ui';

interface HabitFormScreenProps {
  navigation: any;
  route: { params?: { habit?: Habit } };
}

export function HabitFormScreen({ navigation, route }: HabitFormScreenProps) {
  const { user } = useAuth();
  const { createHabit, updateHabit, loading } = useHabits();
  const { habit } = route.params || {};
  const isEditing = !!habit;

  const bg = useColorModeValue('gray.50', 'gray.900');
  const textColor = useColorModeValue('gray.800', 'white');
  const subTextColor = useColorModeValue('gray.500', 'gray.400');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  const handleSubmit = async (habitData: any) => {
    try {
      if (isEditing && habit) {
        await updateHabit(habit.id, habitData);
      } else {
        await createHabit(habitData);
      }
      navigation.goBack();
    } catch (error) {
      console.error('Failed to save habit:', error);
    }
  };

  return (
    <Box flex={1} bg={bg}>
      <LoadingOverlay visible={loading} text={isEditing ? 'Saving...' : 'Creating...'} />
      
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
        <Box p={4} borderBottomWidth={1} borderColor={borderColor} flexDirection="row" justifyContent="space-between" alignItems="center">
          <Text fontSize="xl" fontWeight="bold" color={textColor}>
            {isEditing ? 'Edit Habit' : 'Create Habit'}
          </Text>
          <Button variant="ghost" onPress={() => navigation.goBack()}>
            <Icon as="close" size={6} color={subTextColor} />
          </Button>
        </Box>

        <Box flex={1} p={4}>
          <HabitForm
            habit={habit}
            onSubmit={handleSubmit}
            onCancel={() => navigation.goBack()}
            loading={loading}
          />
        </Box>
      </ScrollView>
    </Box>
  );
}