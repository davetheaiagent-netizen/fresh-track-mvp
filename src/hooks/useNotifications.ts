import { useState, useEffect, useCallback } from 'react';
import * as Notifications from 'expo-notifications';
import { Item, NotificationPayload } from '../types';
import { differenceInDays, addDays } from 'date-fns';

export interface NotificationPreferences {
  enabled: boolean;
  dailyDigest: boolean;
  expiryAlerts: boolean;
  digestTime: string;
}

const DEFAULT_PREFERENCES: NotificationPreferences = {
  enabled: true,
  dailyDigest: true,
  expiryAlerts: true,
  digestTime: '08:00',
};

const STORAGE_KEY = '@freshtrack_notifications';

export function useNotifications() {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [preferences, setPreferences] = useState<NotificationPreferences>(DEFAULT_PREFERENCES);
  const [scheduledNotifications, setScheduledNotifications] = useState<string[]>([]);

  useEffect(() => {
    loadPreferences();
    checkPermissions();
    fetchScheduledNotifications();
  }, []);

  const loadPreferences = async () => {
    try {
      const stored = await Notifications.getBadgeCountAsync();
      const data = localStorage.getItem(STORAGE_KEY);
      if (data) {
        setPreferences(JSON.parse(data));
      }
    } catch (error) {
      console.error('Error loading notification preferences:', error);
    }
  };

  const savePreferences = async (newPreferences: NotificationPreferences) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newPreferences));
      setPreferences(newPreferences);
    } catch (error) {
      console.error('Error saving notification preferences:', error);
    }
  };

  const checkPermissions = async () => {
    const { status } = await Notifications.getPermissionsAsync();
    setHasPermission(status === 'granted');
  };

  const requestPermissions = async (): Promise<boolean> => {
    const { status } = await Notifications.requestPermissionsAsync();
    const granted = status === 'granted';
    setHasPermission(granted);
    return granted;
  };

  const fetchScheduledNotifications = async () => {
    const notifications = await Notifications.getAllScheduledNotificationsAsync();
    setScheduledNotifications(notifications.map(n => n.identifier));
  };

  const scheduleExpiryAlert = useCallback(async (item: Item): Promise<string | null> => {
    if (!preferences.enabled || !preferences.expiryAlerts) return null;

    const daysUntilExpiry = differenceInDays(new Date(item.expiry_date), new Date());
    
    if (daysUntilExpiry < 0 || daysUntilExpiry > 3) return null;

    let triggerDate: Date;
    let title: string;
    let body: string;

    if (daysUntilExpiry === 0) {
      title = '⚠️ Use it TODAY!';
      body = `${item.name} expires today! Make something before it goes bad.`;
      triggerDate = new Date();
      triggerDate.setHours(9, 0, 0, 0);
    } else if (daysUntilExpiry === 1) {
      title = '⏰ Expiring Tomorrow';
      body = `${item.name} expires tomorrow. Here's a quick recipe idea:`;
      triggerDate = new Date();
      triggerDate.setHours(18, 0, 0, 0);
    } else {
      title = '📅 Expiring Soon';
      body = `${item.name} expires in ${daysUntilExpiry} days.`;
      triggerDate = new Date();
      triggerDate.setDate(triggerDate.getDate() + daysUntilExpiry - 1);
      triggerDate.setHours(10, 0, 0, 0);
    }

    if (triggerDate.getTime() <= Date.now()) return null;

    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data: { itemId: item.id, type: 'expiry_warning' },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: triggerDate,
      },
    });

    setScheduledNotifications(prev => [...prev, id]);
    return id;
  }, [preferences]);

  const scheduleDailyDigest = useCallback(async (items: Item[]): Promise<string | null> => {
    if (!preferences.enabled || !preferences.dailyDigest) return null;

    const expiringItems = items.filter(item => {
      const days = differenceInDays(new Date(item.expiry_date), new Date());
      return days >= 0 && days <= 3 && item.status === 'active';
    });

    if (expiringItems.length === 0) return null;

    const [hours, minutes] = preferences.digestTime.split(':').map(Number);
    const triggerDate = new Date();
    triggerDate.setHours(hours, minutes, 0, 0);
    
    if (triggerDate.getTime() <= Date.now()) {
      triggerDate.setDate(triggerDate.getDate() + 1);
    }

    const itemsList = expiringItems.slice(0, 5).map(i => `• ${i.name}`).join('\n');

    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: '🌿 FreshTrack Daily Digest',
        body: `You have ${expiringItems.length} item${expiringItems.length > 1 ? 's' : ''} expiring soon:\n${itemsList}`,
        data: { type: 'daily_digest' },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: triggerDate,
      },
    });

    setScheduledNotifications(prev => [...prev, id]);
    return id;
  }, [preferences]);

  const scheduleWeeklyWasteReport = useCallback(async (wastedCount: number): Promise<string | null> => {
    if (!preferences.enabled || wastedCount === 0) return null;

    const triggerDate = new Date();
    triggerDate.setDate(triggerDate.getDate() + (7 - triggerDate.getDay()));
    triggerDate.setHours(10, 0, 0, 0);

    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: '📊 Your Waste Report',
        body: `Last week you wasted ${wastedCount} item${wastedCount > 1 ? 's' : ''}. ${wastedCount > 3 ? 'Let\'s try to do better!' : 'Great job keeping food waste low!'} `,
        data: { type: 'weekly_report' },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: triggerDate,
      },
    });

    setScheduledNotifications(prev => [...prev, id]);
    return id;
  }, [preferences]);

  const cancelNotification = async (id: string) => {
    await Notifications.cancelScheduledNotificationAsync(id);
    setScheduledNotifications(prev => prev.filter(n => n !== id));
  };

  const cancelAllNotifications = async () => {
    await Notifications.cancelAllScheduledNotificationsAsync();
    setScheduledNotifications([]);
  };

  const cancelNotificationsForItem = async (itemId: string) => {
    const notifications = await Notifications.getAllScheduledNotificationsAsync();
    for (const notification of notifications) {
      const data = notification.content.data as any;
      if (data?.itemId === itemId) {
        await Notifications.cancelScheduledNotificationAsync(notification.identifier);
      }
    }
    await fetchScheduledNotifications();
  };

  const sendImmediateNotification = async (payload: NotificationPayload) => {
    if (!preferences.enabled) return;

    await Notifications.scheduleNotificationAsync({
      content: {
        title: payload.title,
        body: payload.body,
        data: payload.data,
      },
      trigger: null,
    });
  };

  const updatePreferences = async (updates: Partial<NotificationPreferences>) => {
    const newPrefs = { ...preferences, ...updates };
    await savePreferences(newPrefs);

    if (!newPrefs.enabled) {
      await cancelAllNotifications();
    } else if (newPrefs.expiryAlerts) {
      const notifications = await Notifications.getAllScheduledNotificationsAsync();
      const expiryNotifications = notifications.filter(n => 
        (n.content.data as any)?.type === 'expiry_warning'
      );
      if (expiryNotifications.length === 0) {
        // Reschedule expiry alerts if none exist
      }
    }
  };

  return {
    hasPermission,
    preferences,
    scheduledNotifications,
    requestPermissions,
    scheduleExpiryAlert,
    scheduleDailyDigest,
    scheduleWeeklyWasteReport,
    cancelNotification,
    cancelAllNotifications,
    cancelNotificationsForItem,
    sendImmediateNotification,
    updatePreferences,
  };
}
