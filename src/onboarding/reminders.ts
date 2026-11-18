import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

const REMINDER_KEY = 'benchless-workout';

export async function syncWorkoutReminders(enabled: boolean, trainingDays: number[], time: string): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  await Promise.all(scheduled
    .filter((item) => item.content.data?.reminderKey === REMINDER_KEY)
    .map((item) => Notifications.cancelScheduledNotificationAsync(item.identifier)));

  if (!enabled || trainingDays.length === 0) return false;

  let permissions = await Notifications.getPermissionsAsync();
  if (permissions.status !== 'granted') permissions = await Notifications.requestPermissionsAsync();
  if (permissions.status !== 'granted') return false;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('training', {
      name: 'Training reminders',
      importance: Notifications.AndroidImportance.DEFAULT,
      vibrationPattern: [0, 180, 120, 180],
      lightColor: '#CDEB8E',
    });
  }

  const [hour, minute] = time.split(':').map(Number);
  await Promise.all(trainingDays.map((day) => Notifications.scheduleNotificationAsync({
    content: {
      title: 'A little time for you.',
      body: 'Your next session is ready when you are.',
      data: { reminderKey: REMINDER_KEY },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
      weekday: ((day + 1) % 7) + 1,
      hour,
      minute,
      ...(Platform.OS === 'android' ? { channelId: 'training' } : {}),
    },
  })));
  return true;
}

export async function hasScheduledWorkoutReminders(): Promise<boolean> {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  return scheduled.some((item) => item.content.data?.reminderKey === REMINDER_KEY);
}
