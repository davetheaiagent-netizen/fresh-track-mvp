import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { Item, NotificationPayload } from '../types';
import { differenceInDays, format } from 'date-fns';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export async function requestNotificationPermissions(): Promise<boolean> {
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.log('Failed to get notification permissions');
    return false;
  }

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('expiry-alerts', {
      name: 'Expiry Alerts',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#22C55E',
    });
  }

  return true;
}

export async function scheduleExpiryNotification(item: Item): Promise<string | null> {
  const daysUntilExpiry = differenceInDays(new Date(item.expiry_date), new Date());
  
  if (daysUntilExpiry < 0) return null;

  let triggerDate: Date;
  let notificationTitle: string;
  let notificationBody: string;

  if (daysUntilExpiry === 0) {
    notificationTitle = '⚠️ Use it TODAY!';
    notificationBody = `${item.name} expires today! Make something before it goes bad.`;
    triggerDate = new Date();
    triggerDate.setHours(9, 0, 0, 0);
  } else if (daysUntilExpiry === 1) {
    notificationTitle = '⏰ Expiring Tomorrow';
    notificationBody = `${item.name} expires tomorrow. Here's a recipe idea:`;
    triggerDate = new Date();
    triggerDate.setHours(18, 0, 0, 0);
  } else if (daysUntilExpiry === 2) {
    notificationTitle = '📅 Expiring Soon';
    notificationBody = `${item.name} expires in ${daysUntilExpiry} days.`;
    triggerDate = new Date();
    triggerDate.setHours(10, 0, 0, 0);
  } else {
    return null;
  }

  if (triggerDate.getTime() <= Date.now()) {
    return null;
  }

  const notificationId = await Notifications.scheduleNotificationAsync({
    content: {
      title: notificationTitle,
      body: notificationBody,
      data: { itemId: item.id, type: 'expiry_warning' },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: triggerDate,
    },
  });

  return notificationId;
}

export async function scheduleDailyDigest(items: Item[]): Promise<string | null> {
  const expiringToday = items.filter(item => {
    const days = differenceInDays(new Date(item.expiry_date), new Date());
    return days >= 0 && days <= 2 && item.status === 'active';
  });

  if (expiringToday.length === 0) return null;

  const triggerDate = new Date();
  triggerDate.setDate(triggerDate.getDate() + 1);
  triggerDate.setHours(8, 0, 0, 0);

  const itemsList = expiringToday.slice(0, 3).map(i => `• ${i.name}`).join('\n');

  const notificationId = await Notifications.scheduleNotificationAsync({
    content: {
      title: '🌿 FreshTrack Daily Digest',
      body: `Items expiring soon:\n${itemsList}`,
      data: { type: 'daily_digest' },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: triggerDate,
    },
  });

  return notificationId;
}

export async function cancelNotification(notificationId: string): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(notificationId);
}

export async function cancelAllNotifications(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
}

export async function sendImmediateNotification(payload: NotificationPayload): Promise<void> {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: payload.title,
      body: payload.body,
      data: payload.data,
    },
    trigger: null,
  });
}
