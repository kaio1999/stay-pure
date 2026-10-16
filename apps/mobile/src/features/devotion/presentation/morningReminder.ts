import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import type { ReminderSettings } from '../../../core/domain/entities/models';

export const MORNING_REMINDER_ID = 'stay-pure-morning';
const CHANNEL_ID = 'devotional';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function syncMorningReminder(settings: ReminderSettings): Promise<boolean> {
  await Notifications.cancelScheduledNotificationAsync(MORNING_REMINDER_ID);

  if (!settings.enabled) {
    return false;
  }

  const permission = await Notifications.requestPermissionsAsync();
  if (!permission.granted) {
    return false;
  }

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
      name: 'Devocional da manhã',
      importance: Notifications.AndroidImportance.DEFAULT,
      vibrationPattern: [0, 80, 40, 80],
    });
  }

  await Notifications.scheduleNotificationAsync({
    identifier: MORNING_REMINDER_ID,
    content: {
      title: 'Guarde o coração',
      body: 'O devocional de hoje está à espera.',
      sound: 'default',
      ...(Platform.OS === 'android' ? { channelId: CHANNEL_ID } : {}),
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour: settings.hour,
      minute: 0,
    },
  });

  return true;
}
