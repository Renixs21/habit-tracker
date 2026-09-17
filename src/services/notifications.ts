import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { Habit, ReminderConfig } from '../types';
import { NOTIFICATION_CHANNELS } from '../constants';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export async function registerForPushNotificationsAsync(): Promise<string | null> {
  let token = null;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(NOTIFICATION_CHANNELS.HABIT_REMINDER, {
      name: 'Habit Reminders',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#3B82F6',
    });
    await Notifications.setNotificationChannelAsync(NOTIFICATION_CHANNELS.STREAK_MILESTONE, {
      name: 'Streak Milestones',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 500, 250, 500],
      lightColor: '#F59E0B',
    });
    await Notifications.setNotificationChannelAsync(NOTIFICATION_CHANNELS.WEEKLY_REPORT, {
      name: 'Weekly Reports',
      importance: Notifications.AndroidImportance.DEFAULT,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#8B5CF6',
    });
  }

  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') {
      console.warn('Failed to get push token for push notification!');
      return null;
    }
    token = (await Notifications.getExpoPushTokenAsync({
      projectId: Constants.expoConfig?.extra?.eas?.projectId,
    })).data;
  } else {
    console.warn('Must use physical device for Push Notifications');
  }

  return token;
}

export async function scheduleHabitReminder(habit: Habit): Promise<string | null> {
  if (!habit.reminder?.enabled) return null;

  const { time, offsetMinutes = 0, repeat, snoozeInterval } = habit.reminder;
  const [hours, minutes] = time.split(':').map(Number);
  
  let trigger: Notifications.NotificationTriggerInput;
  
  if (repeat === 'daily') {
    trigger = {
      type: 'daily' as const,
      hour: hours,
      minute: minutes,
    };
  } else if (repeat === 'weekly') {
    trigger = {
      type: 'weekly' as const,
      hour: hours,
      minute: minutes,
      weekday: new Date().getDay() + 1, // 1-7 (Sunday-Saturday)
    };
  } else {
    const now = new Date();
    const triggerDate = new Date(now);
    triggerDate.setHours(hours, minutes, 0, 0);
    if (triggerDate <= now) {
      triggerDate.setDate(triggerDate.getDate() + 1);
    }
    trigger = {
      type: 'date' as const,
      date: triggerDate,
    };
  }

  const identifier = await Notifications.scheduleNotificationAsync({
    content: {
      title: `Time for "${habit.name}"`,
      body: habit.description || `Don't forget to complete your habit!`,
      data: { habitId: habit.id, type: 'habit_reminder' },
      sound: 'default',
    },
    trigger,
  });

  return identifier;
}

export async function cancelHabitReminder(notificationId: string): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(notificationId);
}

export async function cancelAllHabitReminders(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
}

export async function sendStreakMilestoneNotification(streak: number, habitName: string): Promise<void> {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: `🔥 ${streak}-Day Streak!`,
      body: `Amazing! You've maintained a ${streak}-day streak for "${habitName}"`,
      data: { type: 'streak_milestone', streak },
      sound: 'default',
    },
    trigger: null, // Show immediately
  });
}

export async function sendWeeklyReportNotification(completionRate: number): Promise<void> {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: '📊 Weekly Report Ready',
      body: `You completed ${completionRate}% of your habits this week. Tap to see details!`,
      data: { type: 'weekly_report' },
      sound: 'default',
    },
    trigger: null,
  });
}

export async function sendCustomNotification(title: string, body: string, data?: Record<string, unknown>): Promise<void> {
  await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      data: data || {},
      sound: 'default',
    },
    trigger: null,
  });
}

export function addNotificationListener(
  onReceive: (notification: Notifications.Notification) => void,
  onResponse: (response: Notifications.NotificationResponse) => void
): { remove: () => void } {
  const receiveListener = Notifications.addNotificationReceivedListener(onReceive);
  const responseListener = Notifications.addNotificationResponseReceivedListener(onResponse);
  
  return {
    remove: () => {
      receiveListener.remove();
      responseListener.remove();
    },
  };
}

export async function getScheduledNotifications(): Promise<Notifications.NotificationRequest[]> {
  return Notifications.getAllScheduledNotificationsAsync();
}

export async function getBadgeCount(): Promise<number> {
  return Notifications.getBadgeCountAsync();
}

export async function setBadgeCount(count: number): Promise<void> {
  await Notifications.setBadgeCountAsync(count);
}

export async function scheduleSnooze(habit: Habit, snoozeMinutes: number): Promise<string | null> {
  const trigger: Notifications.TimeIntervalNotificationTrigger = {
    type: 'timeInterval',
    seconds: snoozeMinutes * 60,
    repeats: false,
  };

  return Notifications.scheduleNotificationAsync({
    content: {
      title: `Snooze: "${habit.name}"`,
      body: `You snoozed this habit for ${snoozeMinutes} minutes.`,
      data: { habitId: habit.id, type: 'snooze' },
      sound: 'default',
    },
    trigger,
  });
}