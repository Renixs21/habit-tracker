import React from 'react';
import { Box, Text, Button, Icon, Pressable, useColorModeValue, HStack, VStack, Center, Spinner, Input, Textarea } from 'native-base';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

export function Card({ children, style, onPress, variant = 'elevated', ...props }: {
  children: React.ReactNode;
  style?: object;
  onPress?: () => void;
  variant?: 'elevated' | 'outlined' | 'filled';
  [key: string]: unknown;
}) {
  const bg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const shadow = useColorModeValue('sm', 'none');

  const baseStyle = {
    bg,
    borderRadius: 'xl',
    p: 4,
    ...(variant === 'elevated' && { shadow, elevation: 3 }),
    ...(variant === 'outlined' && { borderWidth: 1, borderColor }),
    ...(variant === 'filled' && { bg: useColorModeValue('gray.50', 'gray.900') }),
  };

  const Content = onPress ? Pressable : Box;

  return (
    <Content onPress={onPress} style={[baseStyle, style]} {...props} accessibilityRole={onPress ? 'button' : undefined} accessibilityState={{ disabled: !onPress }}>
      {children}
    </Content>
  );
}

export function HabitCard({ 
  habit, 
  entry, 
  streak, 
  completionRate, 
  onComplete, 
  onSkip, 
  onPress,
  isCompleted,
  isSkipped,
  loading,
}: {
  habit: any;
  entry?: any;
  streak: { current: number; longest: number };
  completionRate: number;
  onComplete: () => void;
  onSkip: () => void;
  onPress?: () => void;
  isCompleted: boolean;
  isSkipped: boolean;
  loading?: boolean;
}) {
  const bg = useColorModeValue('white', 'gray.800');
  const textColor = useColorModeValue('gray.800', 'white');
  const subTextColor = useColorModeValue('gray.500', 'gray.400');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const habitColor = habit.color || '#3B82F6';

  const getProgressColor = () => {
    if (isCompleted) return '#22C55E';
    if (isSkipped) return '#F59E0B';
    return habitColor;
  };

  return (
    <Card style={{ borderLeftWidth: 4, borderLeftColor: habitColor, ...(onPress && { cursor: 'pointer' }) }} onPress={onPress}>
      <HStack space={3} alignItems="flex-start">
        <Box 
          bg={isCompleted ? habitColor : 'transparent'} 
          borderWidth={isCompleted ? 0 : 2} 
          borderColor={isCompleted ? habitColor : habitColor}
          borderRadius="full" 
          size={12} 
          _pressed={{ opacity: 0.7 }}
          onPress={isCompleted || isSkipped ? undefined : onComplete}
          disabled={isCompleted || isSkipped || loading}
          accessibilityRole="button"
          accessibilityLabel={isCompleted ? 'Mark incomplete' : isSkipped ? 'Mark as not skipped' : 'Mark complete'}
        >
          {isCompleted && <Icon as="check" size={6} color="white" />}
          {isSkipped && <Icon as="skip-forward" size={6} color={habitColor} />}
        </Box>

        <Box flex={1} minW={0}>
          <HStack space={2} alignItems="center" justifyContent="space-between">
            <Text fontSize="md" fontWeight="semibold" color={textColor} numberOfLines={1}>
              {habit.name}
            </Text>
            {streak.current > 0 && (
              <HStack space={1} alignItems="center">
                <Icon as="flame" size={4} color="#EF4444" />
                <Text fontSize="xs" fontWeight="medium" color="#EF4444">{streak.current}</Text>
              </HStack>
            )}
          </HStack>

          {habit.description && (
            <Text fontSize="sm" color={subTextColor} numberOfLines={1} mt={1}>
              {habit.description}
            </Text>
          )}

          <HStack space={3} mt={2} alignItems="center">
            <Box flex={1}>
              <HStack space={1} alignItems="center" mb={1}>
                <Icon as="bar-chart-2" size={3} color={subTextColor} />
                <Text fontSize="xs" color={subTextColor}>{completionRate}% (30d)</Text>
              </HStack>
              <Box 
                h={4} 
                bg={useColorModeValue('gray.100', 'gray.700')} 
                borderRadius="full" 
                overflow="hidden"
              >
                <Box 
                  h="100%" 
                  w={`${completionRate}%`} 
                  bg={getProgressColor()} 
                  borderRadius="full"
                  transition="width 300ms ease-out"
                />
              </Box>
            </Box>

            {habit.type === 'quantitative' && habit.quantitativeConfig && entry?.value !== undefined && (
              <VStack alignItems="flex-end" space={1}>
                <Text fontSize="xs" color={subTextColor}>Progress</Text>
                <Text fontSize="lg" fontWeight="bold" color={textColor}>
                  {entry.value}/{habit.quantitativeConfig.targetValue} {habit.quantitativeConfig.unit}
                </Text>
              </VStack>
            )}

            {habit.type === 'timed' && habit.timedConfig && entry?.duration !== undefined && (
              <VStack alignItems="flex-end" space={1}>
                <Text fontSize="xs" color={subTextColor}>Duration</Text>
                <Text fontSize="lg" fontWeight="bold" color={textColor}>
                  {Math.floor(entry.duration / 60)}m {entry.duration % 60}s
                </Text>
              </VStack>
            )}

            {habit.type === 'checklist' && entry?.checklistProgress && (
              <VStack alignItems="flex-end" space={1}>
                <Text fontSize="xs" color={subTextColor}>Checklist</Text>
                <Text fontSize="lg" fontWeight="bold" color={textColor}>
                  {entry.checklistProgress.filter((i: any) => i.completed).length}/{entry.checklistProgress.length}
                </Text>
              </VStack>
            )}
          </HStack>

          {isSkipped && (
            <HStack space={1} mt={2} alignItems="center">
              <Icon as="alert-circle" size={4} color="#F59E0B" />
              <Text fontSize="xs" color="#F59E0B">Skipped</Text>
            </HStack>
          )}
        </Box>

        {loading && <Spinner size="sm" color={habitColor} />}
      </HStack>
    </Card>
  );
}

export function StatCard({ label, value, icon, color, trend }: {
  label: string;
  value: string | number;
  icon: string;
  color: string;
  trend?: { value: number; label: string };
}) {
  const bg = useColorModeValue('white', 'gray.800');
  const textColor = useColorModeValue('gray.800', 'white');
  const subTextColor = useColorModeValue('gray.500', 'gray.400');

  return (
    <Card>
      <HStack space={3} alignItems="center">
        <Box 
          bg={`${color}15`} 
          borderRadius="xl" 
          size={12} 
          justifyContent="center" 
          alignItems="center"
        >
          <Icon as={icon} size={6} color={color} />
        </Box>
        <Box flex={1} minW={0}>
          <Text fontSize="sm" color={subTextColor}>{label}</Text>
          <Text fontSize="2xl" fontWeight="bold" color={textColor}>{value}</Text>
          {trend && (
            <HStack space={1} mt={1} alignItems="center">
              <Icon as={trend.value >= 0 ? 'trending-up' : 'trending-down'} size={3} color={trend.value >= 0 ? '#22C55E' : '#EF4444'} />
              <Text fontSize="xs" color={trend.value >= 0 ? '#22C55E' : '#EF4444'}>
                {trend.value >= 0 ? '+' : ''}{trend.value}% {trend.label}
              </Text>
            </HStack>
          )}
        </Box>
      </HStack>
    </Card>
  );
}

export function EmptyState({ icon, title, subtitle, actionLabel, onAction }: {
  icon: string;
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  const textColor = useColorModeValue('gray.600', 'gray.400');
  const bg = useColorModeValue('gray.50', 'gray.900');

  return (
    <Center py={12} px={4} style={{ minHeight: 200 }}>
      <VStack space={4} alignItems="center">
        <Box bg={bg} borderRadius="full" size={16} justifyContent="center" alignItems="center">
          <Icon as={icon} size={8} color={textColor} />
        </Box>
        <VStack space={2} alignItems="center">
          <Text fontSize="lg" fontWeight="semibold" color={useColorModeValue('gray.800', 'white')}>
            {title}
          </Text>
          {subtitle && <Text fontSize="md" color={textColor} textAlign="center">{subtitle}</Text>}
        </VStack>
        {actionLabel && onAction && (
          <Button onPress={onAction} colorScheme={color}>
            <Icon as="plus" size={4} mr={2} />
            {actionLabel}
          </Button>
        )}
      </VStack>
    </Center>
  );
}

export function LoadingOverlay({ visible, text }: { visible: boolean; text?: string }) {
  if (!visible) return null;
  const bg = useColorModeValue('white', 'gray.900');
  
  return (
    <Box 
      position="absolute" 
      top={0} 
      left={0} 
      right={0} 
      bottom={0} 
      bg={bg} 
      justifyContent="center" 
      alignItems="center" 
      zIndex={999}
      opacity={0.9}
    >
      <VStack space={3} alignItems="center">
        <Spinner size="lg" color="blue.500" />
        <Text fontSize="md" color="gray.600">{text || 'Loading...'}</Text>
      </VStack>
    </Box>
  );
}

export function Modal({ visible, children, onClose, size = 'md' }: {
  visible: boolean;
  children: React.ReactNode;
  onClose: () => void;
  size?: 'sm' | 'md' | 'lg' | 'full';
}) {
  if (!visible) return null;
  const bg = useColorModeValue('white', 'gray.800');
  const overlayBg = useColorModeValue('rgba(0,0,0,0.5)', 'rgba(0,0,0,0.7)');

  const sizes = {
    sm: '80%',
    md: '90%',
    lg: '95%',
    full: '100%',
  };

  return (
    <Box 
      position="absolute" 
      top={0} 
      left={0} 
      right={0} 
      bottom={0} 
      bg={overlayBg} 
      justifyContent="center" 
      alignItems="center" 
      zIndex={1000}
      onTouchStart={onClose}
    >
      <Box 
        bg={bg} 
        borderRadius="2xl" 
        w={sizes[size]} 
        maxH="90%" 
        overflow="hidden"
        onTouchStart={(e) => e.stopPropagation()}
      >
        {children}
      </Box>
    </Box>
  );
}

export function FormField({ label, error, required, children, hint }: {
  label: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
  hint?: string;
}) {
  const textColor = useColorModeValue('gray.800', 'white');
  const subTextColor = useColorModeValue('gray.500', 'gray.400');

  return (
    <VStack space={1} alignItems="stretch" w="full">
      <HStack alignItems="center">
        <Text fontSize="sm" fontWeight="medium" color={textColor}>
          {label} {required && <Text color="#EF4444">*</Text>}
        </Text>
      </HStack>
      {children}
      {error && <Text fontSize="xs" color="#EF4444">{error}</Text>}
      {hint && !error && <Text fontSize="xs" color={subTextColor}>{hint}</Text>}
    </VStack>
  );
}

export function SegmentedControl({ options, value, onChange, colorScheme = 'blue' }: {
  options: { label: string; value: string; icon?: string }[];
  value: string;
  onChange: (value: string) => void;
  colorScheme?: string;
}) {
  const bg = useColorModeValue('gray.100', 'gray.700');
  const activeBg = `${colorScheme}.500`;
  const activeText = 'white';
  const inactiveText = useColorModeValue('gray.600', 'gray.300');

  return (
    <Box bg={bg} borderRadius="lg" p={1} flexDirection="row">
      {options.map((option, index) => (
        <Pressable
          key={option.value}
          onPress={() => onChange(option.value)}
          style={({ pressed }) => ({
            flex: 1,
            py: 2,
            px: 3,
            borderRadius: 'md',
            bg: value === option.value ? activeBg : pressed ? `${colorScheme}.100` : 'transparent',
            justifyContent: 'center',
            alignItems: 'center',
          })}
          accessibilityRole="button"
          accessibilityState={{ selected: value === option.value }}
        >
          <HStack space={1} alignItems="center">
            {option.icon && <Icon as={option.icon} size={4} color={value === option.value ? activeText : inactiveText} />}
            <Text 
              fontSize="sm" 
              fontWeight={value === option.value ? 'semibold' : 'medium'} 
              color={value === option.value ? activeText : inactiveText}
            >
              {option.label}
            </Text>
          </HStack>
        </Pressable>
      ))}
    </Box>
  );
}

export function Badge({ children, colorScheme = 'blue', size = 'md' }: {
  children: React.ReactNode;
  colorScheme?: string;
  size?: 'sm' | 'md' | 'lg';
}) {
  const sizes = { sm: { px: 2, py: 0.5, fontSize: 'xs' }, md: { px: 3, py: 1, fontSize: 'sm' }, lg: { px: 4, py: 1.5, fontSize: 'md' } };
  const colors = {
    blue: { bg: 'blue.100', color: 'blue.700', darkBg: 'blue.900', darkColor: 'blue.200' },
    green: { bg: 'green.100', color: 'green.700', darkBg: 'green.900', darkColor: 'green.200' },
    yellow: { bg: 'yellow.100', color: 'yellow.700', darkBg: 'yellow.900', darkColor: 'yellow.200' },
    red: { bg: 'red.100', color: 'red.700', darkBg: 'red.900', darkColor: 'red.200' },
    purple: { bg: 'purple.100', color: 'purple.700', darkBg: 'purple.900', darkColor: 'purple.200' },
    gray: { bg: 'gray.100', color: 'gray.700', darkBg: 'gray.700', darkColor: 'gray.200' },
  };
  const color = colors[colorScheme as keyof typeof colors] || colors.blue;
  const bg = useColorModeValue(color.bg, color.darkBg);
  const textColor = useColorModeValue(color.color, color.darkColor);

  return (
    <Box 
      bg={bg} 
      borderRadius="full" 
      px={sizes[size].px} 
      py={sizes[size].py} 
      flexDirection="row" 
      alignItems="center"
    >
      <Text fontSize={sizes[size].fontSize as any} fontWeight="medium" color={textColor}>
        {children}
      </Text>
    </Box>
  );
}

export function Divider({ label }: { label?: string }) {
  const color = useColorModeValue('gray.200', 'gray.700');
  const textColor = useColorModeValue('gray.500', 'gray.400');

  if (!label) {
    return <Box borderBottomWidth={1} borderColor={color} my={4} />;
  }

  return (
    <HStack alignItems="center" my={4}>
      <Box flex={1} borderBottomWidth={1} borderColor={color} />
      <Box px={3}>
        <Text fontSize="xs" fontWeight="medium" color={textColor} textTransform="uppercase">
          {label}
        </Text>
      </Box>
      <Box flex={1} borderBottomWidth={1} borderColor={color} />
    </HStack>
  );
}