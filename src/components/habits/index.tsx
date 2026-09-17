import React, { useState } from 'react';
import { Box, Text, Input, Button, Icon, HStack, VStack, Pressable, Modal, useColorModeValue, Select, Picker, Spinner, Switch, Slider, Textarea } from 'native-base';
import { useHabitForm, useChecklistItems, useHabitTimer, useHabitCompletion } from '../../hooks/useHabitForm';
import { Habit, HabitType, Category, Priority, QuantitativeConfig, TimedConfig, ChecklistConfig, ChecklistItem, HabitSchedule, FrequencyType, ReminderConfig } from '../../types';
import { CATEGORY_CONFIG, PRIORITY_CONFIG, HABIT_TYPE_CONFIG, FREQUENCY_CONFIG, DEFAULT_HABIT_COLORS, SKIP_REASONS } from '../../constants';
import { generateId, getTodayString } from '../../utils/dateUtils';
import { Card, FormField, Badge, Divider, SegmentedControl } from '../ui';

interface HabitFormProps {
  habit?: Habit;
  onSubmit: (habit: Omit<Habit, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'isArchived'>) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
}

export function HabitForm({ habit, onSubmit, onCancel, loading }: HabitFormProps) {
  const isEditing = !!habit;
  const [showReminder, setShowReminder] = useState(false);
  const [activeTab, setActiveTab] = useState<'basic' | 'schedule' | 'advanced'>('basic');

  const {
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
    getFormData,
    categories,
    priorities,
    habitTypes,
    frequencies,
    colors,
  } = useHabitForm(habit);

  const { items: checklistItems, addItem, removeItem, updateItem, toggleItem } = useChecklistItems(
    checklistConfig?.items || []
  );

  const handleSubmit = async () => {
    if (!validate()) return;
    try {
      await onSubmit(getFormData());
    } catch (error) {
      console.error('Submit error:', error);
    }
  };

  const handleScheduleChange = (key: keyof HabitSchedule, value: any) => {
    setSchedule(prev => ({ ...prev, [key]: value }));
  };

  const handleFrequencyChange = (frequency: FrequencyType) => {
    setSchedule(prev => ({ ...prev, type: frequency }));
  };

  const handleQuantitativeChange = (key: keyof QuantitativeConfig, value: any) => {
    setQuantitativeConfig(prev => prev ? { ...prev, [key]: value } : { targetValue: 0, unit: '', allowDecimal: false, [key]: value });
  };

  const handleTimedChange = (key: keyof TimedConfig, value: any) => {
    setTimedConfig(prev => prev ? { ...prev, [key]: value } : { targetDuration: 0, allowPause: true, [key]: value });
  };

  const handleReminderChange = (key: keyof ReminderConfig, value: any) => {
    setReminder(prev => prev ? { ...prev, [key]: value } : { enabled: true, time: '09:00', repeat: 'daily', [key]: value });
  };

  const toggleReminder = (enabled: boolean) => {
    if (enabled) {
      setReminder({ enabled: true, time: '09:00', repeat: 'daily' });
      setShowReminder(true);
    } else {
      setReminder(undefined);
      setShowReminder(false);
    }
  };

  const addChecklistItem = () => addItem('');
  const removeChecklistItem = (id: string) => removeItem(id);
  const updateChecklistItem = (id: string, label: string) => updateItem(id, { label });

  const bg = useColorModeValue('gray.50', 'gray.900');
  const textColor = useColorModeValue('gray.800', 'white');
  const subTextColor = useColorModeValue('gray.500', 'gray.400');
  const inputBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  return (
    <Box flex={1} bg={bg}>
      <Box p={4} borderBottomWidth={1} borderColor={borderColor} flexDirection="row" alignItems="center" justifyContent="space-between">
        <Text fontSize="xl" fontWeight="bold" color={textColor}>
          {isEditing ? 'Edit Habit' : 'Create Habit'}
        </Text>
        <Icon onPress={onCancel} as="close" size={6} color={subTextColor} />
      </Box>

      <Box flex={1} p={4}>
        <SegmentedControl
          options={[
            { label: 'Basic', value: 'basic', icon: 'settings' },
            { label: 'Schedule', value: 'schedule', icon: 'calendar' },
            { label: 'Advanced', value: 'advanced', icon: 'sliders' },
          ]}
          value={activeTab}
          onChange={setActiveTab}
        />

        {activeTab === 'basic' && (
          <VStack space={4} w="full" mt={4}>
            <FormField label="Name" error={errors.name} required>
              <Input
                value={name}
                onChangeText={setName}
                placeholder="Enter habit name"
                bg={inputBg}
                borderColor={errors.name ? 'red.500' : borderColor}
                _focus={{ borderColor: 'blue.500' }}
                autoCapitalize="words"
              />
            </FormField>

            <FormField label="Description" hint="Optional">
              <Textarea
                value={description}
                onChangeText={setDescription}
                placeholder="Add a description..."
                bg={inputBg}
                borderColor={borderColor}
                _focus={{ borderColor: 'blue.500' }}
                minHeight={80}
                autoCapitalize="sentences"
              />
            </FormField>

            <FormField label="Type" required>
              <SegmentedControl
                options={Object.entries(habitTypes).map(([key, config]) => ({
                  label: config.label,
                  value: key,
                  icon: config.icon,
                }))}
                value={type}
                onChange={setType}
              />
            </FormField>

            <FormField label="Category" required>
              <Select
                selectedValue={category}
                onValueChange={setCategory}
                accessibilityLabel="Category"
                _selectedItem={{ bg: 'blue.100', borderColor: 'blue.500' }}
              >
                {categories.map(([key, config]) => (
                  <Picker.Item key={key} label={config.label} value={key} />
                ))}
              </Select>
            </FormField>

            {category === 'custom' && (
              <FormField label="Custom Category" required>
                <Input
                  value={customCategory}
                  onChangeText={setCustomCategory}
                  placeholder="Enter custom category"
                  bg={inputBg}
                  borderColor={borderColor}
                  _focus={{ borderColor: 'blue.500' }}
                  autoCapitalize="words"
                />
              </FormField>
            )}

            <FormField label="Color" required>
              <HStack space={2} wrap>
                {colors.map((c) => (
                  <Pressable
                    key={c}
                    onPress={() => setColor(c)}
                    style={({ pressed }) => ({
                      size: 12,
                      borderRadius: 'full',
                      bg: c,
                      borderWidth: color === c ? 3 : 0,
                      borderColor: 'white',
                      transform: [{ scale: pressed ? 0.9 : 1 }],
                    })}
                    accessibilityRole="radio"
                    accessibilityState={{ checked: color === c }}
                    accessibilityLabel={c}
                  />
                ))}
              </HStack>
            </FormField>

            <FormField label="Priority" required>
              <SegmentedControl
                options={Object.entries(priorities).map(([key, config]) => ({
                  label: config.label,
                  value: key,
                }))}
                value={priority}
                onChange={setPriority}
              />
            </FormField>

            <Divider label="Type-Specific Settings" />

            {type === 'quantitative' && (
              <VStack space={3} w="full">
                <FormField label="Target Value" error={errors.quantitativeConfig} required>
                  <Input
                    type="number"
                    value={quantitativeConfig?.targetValue?.toString() || ''}
                    onChangeText={(v) => handleQuantitativeChange('targetValue', parseFloat(v) || 0)}
                    placeholder="e.g., 8"
                    bg={inputBg}
                    borderColor={errors.quantitativeConfig ? 'red.500' : borderColor}
                    _focus={{ borderColor: 'blue.500' }}
                    keyboardType="decimal-pad"
                  />
                </FormField>
                <FormField label="Unit" required>
                  <Input
                    value={quantitativeConfig?.unit || ''}
                    onChangeText={(v) => handleQuantitativeChange('unit', v)}
                    placeholder="e.g., glasses, steps, pages"
                    bg={inputBg}
                    borderColor={borderColor}
                    _focus={{ borderColor: 'blue.500' }}
                    autoCapitalize="words"
                  />
                </FormField>
                <FormField label="Allow Decimal">
                  <Switch
                    checked={quantitativeConfig?.allowDecimal || false}
                    onValueChange={(v) => handleQuantitativeChange('allowDecimal', v)}
                    colorScheme="blue"
                  />
                </FormField>
              </VStack>
            )}

            {type === 'timed' && (
              <VStack space={3} w="full">
                <FormField label="Target Duration (minutes)" error={errors.timedConfig} required>
                  <Input
                    type="number"
                    value={timedConfig?.targetDuration?.toString() || ''}
                    onChangeText={(v) => handleTimedChange('targetDuration', parseInt(v) || 0)}
                    placeholder="e.g., 20"
                    bg={inputBg}
                    borderColor={errors.timedConfig ? 'red.500' : borderColor}
                    _focus={{ borderColor: 'blue.500' }}
                    keyboardType="numeric"
                  />
                </FormField>
                <FormField label="Allow Pause">
                  <Switch
                    checked={timedConfig?.allowPause ?? true}
                    onValueChange={(v) => handleTimedChange('allowPause', v)}
                    colorScheme="blue"
                  />
                </FormField>
              </VStack>
            )}

            {type === 'checklist' && (
              <VStack space={3} w="full">
                <Text fontSize="sm" fontWeight="medium" color={textColor}>Checklist Items</Text>
                <VStack space={2} w="full">
                  {checklistItems.map((item, index) => (
                    <HStack space={2} key={item.id} alignItems="center">
                      <Pressable onPress={() => toggleItem(item.id)} size={6} borderRadius="md" borderWidth={2} borderColor={item.completed ? color : borderColor} bg={item.completed ? color : 'transparent'} justifyContent="center" alignItems="center">
                        {item.completed && <Icon as="check" size={4} color="white" />}
                      </Pressable>
                      <Input
                        value={item.label}
                        onChangeText={(v) => updateChecklistItem(item.id, v)}
                        placeholder={`Item ${index + 1}`}
                        flex={1}
                        bg={inputBg}
                        borderColor={borderColor}
                        _focus={{ borderColor: 'blue.500' }}
                        autoCapitalize="words"
                      />
                      <Pressable onPress={() => removeChecklistItem(item.id)} p={2} accessibilityLabel="Remove item">
                        <Icon as="trash" size={5} color="red.500" />
                      </Pressable>
                    </HStack>
                  ))}
                </VStack>
                <Button variant="outline" onPress={addChecklistItem} colorScheme="blue" leftIcon={<Icon as="plus" size={4} />}>
                  Add Item
                </Button>
                {checklistItems.length === 0 && <Text fontSize="xs" color="red.500">At least one item required</Text>}
              </VStack>
            )}
          </VStack>
        )}

        {activeTab === 'schedule' && (
          <VStack space={4} w="full" mt={4}>
            <FormField label="Frequency" required>
              <SegmentedControl
                options={Object.entries(frequencies).map(([key, config]) => ({
                  label: config.label,
                  value: key,
                }))}
                value={schedule.type}
                onChange={handleFrequencyChange}
              />
            </FormField>

            {schedule.type === 'weekly' && schedule.daysOfWeek && (
              <VStack space={3} w="full">
                <Text fontSize="sm" fontWeight="medium" color={textColor}>Days of Week</Text>
                <HStack space={2} wrap>
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, index) => (
                    <Pressable
                      key={day}
                      onPress={() => handleScheduleChange('daysOfWeek', schedule.daysOfWeek!.includes(index) 
                        ? schedule.daysOfWeek!.filter(d => d !== index) 
                        : [...schedule.daysOfWeek!, index])}
                      style={({ pressed }) => ({
                        size: 10,
                        borderRadius: 'full',
                        justifyContent: 'center',
                        alignItems: 'center',
                        bg: schedule.daysOfWeek!.includes(index) ? 'blue.500' : pressed ? 'blue.100' : 'transparent',
                        borderWidth: schedule.daysOfWeek!.includes(index) ? 0 : 1,
                        borderColor: 'blue.500',
                      })}
                      accessibilityRole="checkbox"
                      accessibilityState={{ checked: schedule.daysOfWeek!.includes(index) }}
                    >
                      <Text fontSize="sm" fontWeight="medium" color={schedule.daysOfWeek!.includes(index) ? 'white' : 'blue.500'}>
                        {day}
                      </Text>
                    </Pressable>
                  ))}
                </HStack>
              </VStack>
            )}

            {schedule.type === 'weekly' && !schedule.daysOfWeek && (
              <FormField label="Times per Week">
                <Input
                  type="number"
                  value={schedule.timesPerWeek?.toString() || ''}
                  onChangeText={(v) => handleScheduleChange('timesPerWeek', parseInt(v) || 0)}
                  placeholder="e.g., 3"
                  keyboardType="numeric"
                />
              </FormField>
            )}

            {schedule.type === 'monthly' && (
              <VStack space={3} w="full">
                <FormField label="Schedule Type">
                  <SegmentedControl
                    options={[
                      { label: 'Specific Dates', value: 'dates' },
                      { label: 'Nth Weekday', value: 'nth' },
                      { label: 'Times per Month', value: 'times' },
                    ]}
                    value={schedule.specificDates ? 'dates' : schedule.nthWeekday ? 'nth' : 'times'}
                    onChange={(v) => {
                      if (v === 'dates') handleScheduleChange('specificDates', []);
                      else if (v === 'nth') handleScheduleChange('nthWeekday', { week: 1, weekday: 1 });
                      else handleScheduleChange('timesPerMonth', 1);
                    }}
                  />
                </FormField>

                {schedule.specificDates && (
                  <VStack space={2} w="full">
                    <Text fontSize="sm" fontWeight="medium" color={textColor}>Dates (1-31)</Text>
                    <HStack space={1} wrap>
                      {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                        <Pressable
                          key={day}
                          onPress={() => handleScheduleChange('specificDates', schedule.specificDates!.includes(day)
                            ? schedule.specificDates!.filter(d => d !== day)
                            : [...schedule.specificDates!, day])}
                          style={({ pressed }) => ({
                            w: 10, h: 10, borderRadius: 'md', justifyContent: 'center', alignItems: 'center',
                            bg: schedule.specificDates!.includes(day) ? 'blue.500' : pressed ? 'blue.100' : 'transparent',
                            borderWidth: schedule.specificDates!.includes(day) ? 0 : 1,
                            borderColor: 'blue.500',
                          })}
                          accessibilityRole="checkbox"
                          accessibilityState={{ checked: schedule.specificDates!.includes(day) }}
                        >
                          <Text fontSize="xs" fontWeight="medium" color={schedule.specificDates!.includes(day) ? 'white' : 'blue.500'}>
                            {day}
                          </Text>
                        </Pressable>
                      ))}
                    </HStack>
                  </VStack>
                )}

                {schedule.nthWeekday && (
                  <HStack space={4} w="full">
                    <FormField label="Week">
                      <Select selectedValue={schedule.nthWeekday.week} onValueChange={(v) => handleScheduleChange('nthWeekday', { ...schedule.nthWeekday!, week: v })}>
                        {[1, 2, 3, 4, 5].map(w => <Picker.Item key={w} label={`${w}${w===1?'st':w===2?'nd':w===3?'rd':'th'}`} value={w} />)}
                      </Select>
                    </FormField>
                    <FormField label="Weekday">
                      <Select selectedValue={schedule.nthWeekday.weekday} onValueChange={(v) => handleScheduleChange('nthWeekday', { ...schedule.nthWeekday!, weekday: v })}>
                        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d, i) => <Picker.Item key={i} label={d} value={i} />)}
                      </Select>
                    </FormField>
                  </HStack>
                )}

                {schedule.timesPerMonth && (
                  <FormField label="Times per Month">
                    <Input type="number" value={schedule.timesPerMonth.toString()} onChangeText={(v) => handleScheduleChange('timesPerMonth', parseInt(v) || 0)} placeholder="e.g., 4" keyboardType="numeric" />
                  </FormField>
                )}
              </VStack>
            )}

            {schedule.type === 'custom' && (
              <VStack space={3} w="full">
                <FormField label="Interval (days)">
                  <Input
                    type="number"
                    value={schedule.intervalDays?.toString() || ''}
                    onChangeText={(v) => handleScheduleChange('intervalDays', parseInt(v) || 1)}
                    placeholder="e.g., 3 for every 3 days"
                    keyboardType="numeric"
                  />
                </FormField>
                <FormField label="Custom Pattern" hint="Cron-like pattern (advanced)">
                  <Input
                    value={schedule.customPattern || ''}
                    onChangeText={(v) => handleScheduleChange('customPattern', v)}
                    placeholder="e.g., 0 9 * * 1-5"
                  />
                </FormField>
              </VStack>
            )}
          </VStack>
        )}

        {activeTab === 'advanced' && (
          <VStack space={4} w="full" mt={4}>
            <FormField label="Reminder">
              <HStack alignItems="center" justifyContent="space-between">
                <VStack alignItems="flex-start" space={1}>
                  <Text fontSize="sm" fontWeight="medium" color={textColor}>Enable Reminder</Text>
                  <Text fontSize="xs" color={subTextColor}>Get notified when it's time for this habit</Text>
                </VStack>
                <Switch
                  checked={!!reminder?.enabled}
                  onValueChange={toggleReminder}
                  colorScheme="blue"
                />
              </HStack>
            </FormField>

            {reminder?.enabled && showReminder && (
              <VStack space={3} w="full">
                <FormField label="Time">
                  <Input
                    type="time"
                    value={reminder.time}
                    onChangeText={(v) => handleReminderChange('time', v)}
                    placeholder="HH:MM"
                  />
                </FormField>

                <FormField label="Repeat">
                  <Select selectedValue={reminder.repeat} onValueChange={(v) => handleReminderChange('repeat', v as any)}>
                    <Picker.Item label="Daily" value="daily" />
                    <Picker.Item label="Weekly" value="weekly" />
                    <Picker.Item label="Custom" value="custom" />
                  </Select>
                </FormField>

                <FormField label="Snooze Interval (minutes)">
                  <Input
                    type="number"
                    value={reminder.snoozeInterval?.toString() || ''}
                    onChangeText={(v) => handleReminderChange('snoozeInterval', parseInt(v) || 0)}
                    placeholder="e.g., 10"
                    keyboardType="numeric"
                  />
                </FormField>

                <FormField label="Location Based">
                  <Switch
                    checked={reminder.locationBased || false}
                    onValueChange={(v) => handleReminderChange('locationBased', v)}
                    colorScheme="blue"
                  />
                </FormField>
              </VStack>
            )}
          </VStack>
        )}
      </Box>

      <Box p={4} borderTopWidth={1} borderColor={borderColor} bg={bg}>
        <HStack space={3} w="full" justifyContent="flex-end">
          <Button variant="ghost" onPress={onCancel} disabled={loading}>
            Cancel
          </Button>
          <Button onPress={handleSubmit} colorScheme="blue" isLoading={loading} disabled={loading}>
            {isEditing ? 'Save Changes' : 'Create Habit'}
          </Button>
        </HStack>
      </Box>
    </Box>
  );
}

interface HabitDetailModalProps {
  habit: Habit;
  entry?: HabitEntry;
  streak: { current: number; longest: number };
  completionRate: number;
  onComplete: () => void;
  onSkip: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onClose: () => void;
  loading?: boolean;
}

export function HabitDetailModal({ habit, entry, streak, completionRate, onComplete, onSkip, onEdit, onDelete, onClose, loading }: HabitDetailModalProps) {
  const [showSkipModal, setShowSkipModal] = useState(false);
  const [skipReason, setSkipReason] = useState<keyof typeof SKIP_REASONS>('rest_day');
  const bg = useColorModeValue('white', 'gray.800');
  const textColor = useColorModeValue('gray.800', 'white');
  const subTextColor = useColorModeValue('gray.500', 'gray.400');
  const habitColor = habit.color || '#3B82F6';
  const isCompleted = entry?.completed && !entry?.skipped;
  const isSkipped = entry?.skipped;

  const handleSkip = () => {
    setShowSkipModal(true);
  };

  const confirmSkip = () => {
    onSkip();
    setShowSkipModal(false);
  };

  return (
    <>
      <Modal visible={true} onClose={onClose} size="lg">
        <Box>
          <Box p={4} borderBottomWidth={1} borderColor={useColorModeValue('gray.200', 'gray.700')} flexDirection="row" alignItems="center" justifyContent="space-between">
            <HStack space={3} alignItems="center">
              <Box bg={`${habitColor}15`} borderRadius="xl" size={12} justifyContent="center" alignItems="center">
                <Icon as={habit.icon} size={6} color={habitColor} />
              </Box>
              <VStack alignItems="flex-start" space={1}>
                <Text fontSize="lg" fontWeight="bold" color={textColor}>{habit.name}</Text>
                <Badge colorScheme={habit.category as any}>{CATEGORY_CONFIG[habit.category].label}</Badge>
              </VStack>
            </HStack>
            <Icon onPress={onClose} as="close" size={6} color={subTextColor} />
          </Box>

          <Box flex={1} p={4}>
            {habit.description && (
              <Text fontSize="md" color={subTextColor} mb={4}>{habit.description}</Text>
            )}

            <VStack space={3} w="full">
              <HStack space={4} w="full" justifyContent="space-around">
                <VStack alignItems="center" space={1}>
                  <Text fontSize="3xl" fontWeight="bold" color={habitColor}>{streak.current}</Text>
                  <Text fontSize="xs" color={subTextColor}>Current Streak</Text>
                </VStack>
                <VStack alignItems="center" space={1}>
                  <Text fontSize="3xl" fontWeight="bold" color={habitColor}>{streak.longest}</Text>
                  <Text fontSize="xs" color={subTextColor}>Longest Streak</Text>
                </VStack>
                <VStack alignItems="center" space={1}>
                  <Text fontSize="3xl" fontWeight="bold" color={habitColor}>{completionRate}%</Text>
                  <Text fontSize="xs" color={subTextColor}>30-Day Rate</Text>
                </VStack>
              </HStack>

              <Divider label="Progress" />

              {habit.type === 'quantitative' && habit.quantitativeConfig && (
                <VStack space={2} w="full">
                  <HStack justifyContent="space-between">
                    <Text fontSize="sm" color={subTextColor}>Target</Text>
                    <Text fontSize="sm" fontWeight="medium" color={textColor}>
                      {habit.quantitativeConfig.targetValue} {habit.quantitativeConfig.unit}
                    </Text>
                  </HStack>
                  {entry?.value !== undefined && (
                    <HStack justifyContent="space-between">
                      <Text fontSize="sm" color={subTextColor}>Today</Text>
                      <Text fontSize="sm" fontWeight="medium" color={textColor}>
                        {entry.value} {habit.quantitativeConfig.unit}
                      </Text>
                    </HStack>
                  )}
                  <Box h={6} bg={useColorModeValue('gray.100', 'gray.700')} borderRadius="full" overflow="hidden">
                    <Box h="100%" w={`${Math.min(100, (entry?.value || 0) / habit.quantitativeConfig.targetValue * 100)}%`} bg={habitColor} borderRadius="full" />
                  </Box>
                </VStack>
              )}

              {habit.type === 'timed' && habit.timedConfig && (
                <VStack space={2} w="full">
                  <HStack justifyContent="space-between">
                    <Text fontSize="sm" color={subTextColor}>Target</Text>
                    <Text fontSize="sm" fontWeight="medium" color={textColor}>
                      {habit.timedConfig.targetDuration} min
                    </Text>
                  </HStack>
                  {entry?.duration !== undefined && (
                    <HStack justifyContent="space-between">
                      <Text fontSize="sm" color={subTextColor}>Today</Text>
                      <Text fontSize="sm" fontWeight="medium" color={textColor}>
                        {Math.floor(entry.duration / 60)}m {entry.duration % 60}s
                      </Text>
                    </HStack>
                  )}
                  <Box h={6} bg={useColorModeValue('gray.100', 'gray.700')} borderRadius="full" overflow="hidden">
                    <Box h="100%" w={`${Math.min(100, (entry?.duration || 0) / (habit.timedConfig.targetDuration * 60) * 100)}%`} bg={habitColor} borderRadius="full" />
                  </Box>
                </VStack>
              )}

              {habit.type === 'checklist' && habit.checklistConfig && entry?.checklistProgress && (
                <VStack space={2} w="full">
                  <Text fontSize="sm" fontWeight="medium" color={textColor}>Checklist Progress</Text>
                  <VStack space={1} w="full">
                    {entry.checklistProgress.map((item, index) => (
                      <HStack space={2} key={item.id} alignItems="center">
                        <Box size={5} borderRadius="md" borderWidth={2} borderColor={item.completed ? habitColor : borderColor} bg={item.completed ? habitColor : 'transparent'} justifyContent="center" alignItems="center">
                          {item.completed && <Icon as="check" size={3} color="white" />}
                        </Box>
                        <Text fontSize="sm" color={item.completed ? subTextColor : textColor} textDecorationLine={item.completed ? 'line-through' : 'none'}>
                          {item.label}
                        </Text>
                      </HStack>
                    ))}
                  </VStack>
                </VStack>
              )}

              {entry?.notes && (
                <VStack space={1} w="full">
                  <Text fontSize="sm" fontWeight="medium" color={textColor}>Notes</Text>
                  <Text fontSize="sm" color={subTextColor} fontStyle="italic">{entry.notes}</Text>
                </VStack>
              )}

              {entry?.mood && (
                <HStack space={2} alignItems="center">
                  <Text fontSize="sm" fontWeight="medium" color={textColor}>Mood</Text>
                  <Text fontSize="lg">{'😞😕😐😊😍'.split('')[entry.mood - 1]}</Text>
                </HStack>
              )}
            </VStack>
          </Box>

          <Box p={4} borderTopWidth={1} borderColor={useColorModeValue('gray.200', 'gray.700')} bg={bg}>
            <HStack space={2} w="full">
              {!isCompleted && !isSkipped ? (
                <>
                  <Button flex={1} variant="outline" onPress={handleSkip} colorScheme="orange" disabled={loading}>
                    <Icon as="skip-forward" size={4} mr={2} />
                    Skip
                  </Button>
                  <Button flex={1} onPress={onComplete} colorScheme="green" isLoading={loading} disabled={loading}>
                    <Icon as="check" size={4} mr={2} />
                    Complete
                  </Button>
                </>
              ) : isCompleted ? (
                <Button flex={1} variant="outline" onPress={onComplete} colorScheme="green">
                  <Icon as="refresh" size={4} mr={2} />
                  Mark Incomplete
                </Button>
              ) : (
                <Button flex={1} onPress={onSkip} colorScheme="orange">
                  <Icon as="refresh" size={4} mr={2} />
                  Mark Active
                </Button>
              )}
            </HStack>
          </Box>
        </Box>
      </Modal>

      <Modal visible={showSkipModal} onClose={() => setShowSkipModal(false)} size="md">
        <Box p={4}>
          <Text fontSize="lg" fontWeight="bold" color={textColor} mb={4}>Skip Reason</Text>
          <Text fontSize="sm" color={subTextColor} mb={4}>Why are you skipping this habit today?</Text>
          <VStack space={2} w="full">
            {Object.entries(SKIP_REASONS).map(([key, config]) => (
              <Pressable
                key={key}
                onPress={() => setSkipReason(key as keyof typeof SKIP_REASONS)}
                style={({ pressed }) => ({
                  p: 3,
                  borderRadius: 'lg',
                  bg: skipReason === key ? `${habitColor}15` : pressed ? useColorModeValue('gray.100', 'gray.800') : 'transparent',
                  borderWidth: skipReason === key ? 2 : 1,
                  borderColor: skipReason === key ? habitColor : borderColor,
                  flexDirection: 'row',
                  alignItems: 'center',
                })}
                accessibilityRole="radio"
                accessibilityState={{ checked: skipReason === key }}
              >
                <Icon as={config.icon} size={5} color={skipReason === key ? habitColor : subTextColor} mr={3} />
                <Text fontSize="md" fontWeight={skipReason === key ? 'semibold' : 'medium'} color={skipReason === key ? habitColor : textColor}>
                  {config.label}
                </Text>
              </Pressable>
            ))}
          </VStack>
          <HStack space={3} w="full" justifyContent="flex-end" mt={4}>
            <Button variant="ghost" onPress={() => setShowSkipModal(false)}>Cancel</Button>
            <Button onPress={confirmSkip} colorScheme="orange">Confirm Skip</Button>
          </HStack>
        </Box>
      </Modal>
    </>
  );
}