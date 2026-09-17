import React, { useEffect, useState } from 'react';
import { StyleSheet, Platform } from 'react-native';
import { NativeBaseProvider, ColorModeManager, Box, Center, Spinner, Text, Input, Button, VStack, HStack, Icon } from 'native-base';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { AuthProvider, useAuth } from './src/contexts/AuthContext';
import { HabitProvider } from './src/contexts/HabitContext';
import { initializeFirebase } from './src/services/firebase';
import { registerForPushNotificationsAsync } from './src/services/notifications';
import { DashboardScreen } from './src/screens/DashboardScreen';
import { CalendarScreen } from './src/screens/CalendarScreen';
import { SettingsScreen } from './src/screens/SettingsScreen';
import { HabitFormScreen } from './src/screens/HabitFormScreen';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: string;
          if (route.name === 'Dashboard') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Calendar') {
            iconName = focused ? 'calendar' : 'calendar-outline';
          } else if (route.name === 'Settings') {
            iconName = focused ? 'settings' : 'settings-outline';
          } else {
            iconName = 'home';
          }
          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#3B82F6',
        tabBarInactiveTintColor: '#9CA3AF',
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopWidth: 0,
          elevation: 8,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.1,
          shadowRadius: 8,
        },
        headerShown: false,
      })}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      <Tab.Screen name="Calendar" component={CalendarScreen} />
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
  );
}

function MainStackScreen() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Main" component={TabNavigator} />
      <Stack.Screen name="HabitForm" component={HabitFormScreen} />
    </Stack.Navigator>
  );
}

function AppNavigator() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <Center flex={1}>
        <VStack space={4} alignItems="center">
          <Spinner size="lg" color="blue.500" />
          <Text fontSize="md" color="gray.500">Loading...</Text>
        </VStack>
      </Center>
    );
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {user ? (
        <Stack.Screen name="Main" component={MainStackScreen} />
      ) : (
        <>
          <Stack.Screen name="Auth" component={AuthScreen} />
        </>
      )}
    </Stack.Navigator>
  );
}

function AuthScreen({ navigation }: any) {
  const { signIn, signUp, resetPassword, error, clearError } = useAuth();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!email || !password) return;
    setLoading(true);
    clearError();
    try {
      if (isSignUp) {
        await signUp(email, password, displayName);
      } else {
        await signIn(email, password);
      }
    } catch (err) {
      console.error('Auth error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) return;
    try {
      await resetPassword(email);
      alert('Password reset email sent!');
    } catch (err) {
      console.error('Reset error:', err);
    }
  };

  return (
    <Box flex={1} bg="gray.50" p={4} justifyContent="center">
      <VStack space={4} w="full" maxW="md" alignSelf="center">
        <VStack space={2} alignItems="center">
          <Box bg="blue.500" borderRadius="2xl" size={16} justifyContent="center" alignItems="center">
            <Text fontSize="4xl" fontWeight="bold" color="white">H</Text>
          </Box>
          <Text fontSize="2xl" fontWeight="bold" color="gray.800">Habit Tracker</Text>
          <Text fontSize="md" color="gray.500" textAlign="center">
            Build better habits, one day at a time
          </Text>
        </VStack>

        <VStack space={3} w="full">
          {isSignUp && (
            <VStack space={2} w="full">
              <Text fontSize="sm" fontWeight="medium" color="gray.700" mb={1}>Display Name</Text>
              <Input
                value={displayName}
                onChangeText={setDisplayName}
                placeholder="Enter your name"
                autoCapitalize="words"
              />
            </VStack>
          )}

          <VStack space={2} w="full">
            <Text fontSize="sm" fontWeight="medium" color="gray.700" mb={1}>Email</Text>
            <Input
              value={email}
              onChangeText={setEmail}
              placeholder="Enter your email"
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
            />
          </VStack>

          <VStack space={2} w="full">
            <Text fontSize="sm" fontWeight="medium" color="gray.700" mb={1}>Password</Text>
            <Input
              value={password}
              onChangeText={setPassword}
              placeholder="Enter your password"
              secureTextEntry
              autoComplete={isSignUp ? 'new-password' : 'current-password'}
            />
          </VStack>

          {error && (
            <Text fontSize="sm" color="red.500" textAlign="center">{error}</Text>
          )}

          <Button 
            w="full" 
            onPress={handleSubmit} 
            isLoading={loading} 
            colorScheme="blue"
            size="lg"
          >
            {isSignUp ? 'Create Account' : 'Sign In'}
          </Button>

          {!isSignUp && (
            <Button 
              w="full" 
              variant="ghost" 
              onPress={handleForgotPassword} 
              colorScheme="blue"
            >
              Forgot Password?
            </Button>
          )}

          <HStack space={2} alignItems="center">
            <Box flex={1} borderBottomWidth={1} borderColor="gray.300" />
            <Text fontSize="sm" color="gray.500">or</Text>
            <Box flex={1} borderBottomWidth={1} borderColor="gray.300" />
          </HStack>

          <Button 
            w="full" 
            variant="outline" 
            onPress={() => setIsSignUp(!isSignUp)} 
            colorScheme="gray"
          >
            {isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
          </Button>
        </VStack>
      </VStack>
    </Box>
  );
}

export default function App() {
  const [firebaseReady, setFirebaseReady] = useState(false);

  useEffect(() => {
    initializeFirebase();
    setFirebaseReady(true);
    registerForPushNotificationsAsync();
  }, []);

  if (!firebaseReady) {
    return (
      <Box flex={1} bg="white" justifyContent="center" alignItems="center">
        <Spinner size="lg" color="blue.500" />
      </Box>
    );
  }

  return (
    <NativeBaseProvider>
      <ColorModeManager>
        <NavigationContainer>
          <AuthProvider>
            <HabitProvider>
              <AppNavigator />
            </HabitProvider>
          </AuthProvider>
        </NavigationContainer>
      </ColorModeManager>
    </NativeBaseProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});