import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Text, Card, Switch, List, Divider, Button, SegmentedButtons, TimePicker } from 'react-native-paper';
import { useNotifications, NotificationPreferences } from '../hooks/useNotifications';

export default function NotificationsScreen() {
  const {
    hasPermission,
    preferences,
    scheduledNotifications,
    requestPermissions,
    updatePreferences,
    cancelAllNotifications,
  } = useNotifications();

  const [digestTime, setDigestTime] = useState(preferences.digestTime);

  const handleToggle = async (key: keyof NotificationPreferences, value: boolean) => {
    await updatePreferences({ [key]: value });
  };

  const handleTimeChange = async (time: string) => {
    setDigestTime(time);
    await updatePreferences({ digestTime: time });
  };

  const handleRequestPermission = async () => {
    const granted = await requestPermissions();
    if (!granted) {
      Alert.alert(
        'Permission Required',
        'Please enable notifications in your device settings to receive expiry alerts.',
        [{ text: 'OK' }]
      );
    }
  };

  const handleClearNotifications = () => {
    Alert.alert(
      'Clear All Notifications',
      'This will cancel all scheduled notifications. You can reschedule them later.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Clear All', 
          style: 'destructive',
          onPress: cancelAllNotifications 
        },
      ]
    );
  };

  const timeOptions = [
    { value: '07:00', label: '7 AM' },
    { value: '08:00', label: '8 AM' },
    { value: '09:00', label: '9 AM' },
    { value: '18:00', label: '6 PM' },
    { value: '19:00', label: '7 PM' },
  ];

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text variant="headlineMedium" style={styles.title}>
          🔔 Notifications
        </Text>
        <Text variant="bodyMedium" style={styles.subtitle}>
          Stay informed about your food
        </Text>
      </View>

      {hasPermission === false && (
        <Card style={styles.permissionCard}>
          <Card.Content style={styles.permissionContent}>
            <Text variant="titleMedium" style={styles.permissionTitle}>
              Enable Notifications
            </Text>
            <Text variant="bodySmall" style={styles.permissionText}>
              Get alerts when food is about to expire
            </Text>
            <Button mode="contained" onPress={handleRequestPermission} style={styles.permissionButton}>
              Enable Notifications
            </Button>
          </Card.Content>
        </Card>
      )}

      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            Master Controls
          </Text>
          
          <List.Item
            title="Notifications"
            description="Enable or disable all notifications"
            left={props => <List.Icon {...props} icon="bell-outline" />}
            right={() => (
              <Switch
                value={preferences.enabled}
                onValueChange={(value) => handleToggle('enabled', value)}
              />
            )}
          />
        </Card.Content>
      </Card>

      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            Alert Types
          </Text>
          
          <List.Item
            title="Expiry Alerts"
            description="Get notified when items are about to expire"
            left={props => <List.Icon {...props} icon="alert-circle-outline" />}
            right={() => (
              <Switch
                value={preferences.expiryAlerts}
                onValueChange={(value) => handleToggle('expiryAlerts', value)}
                disabled={!preferences.enabled}
              />
            )}
          />
          <Divider />
          
          <List.Item
            title="Daily Digest"
            description="Morning summary of expiring items"
            left={props => <List.Icon {...props} icon="calendar-clock" />}
            right={() => (
              <Switch
                value={preferences.dailyDigest}
                onValueChange={(value) => handleToggle('dailyDigest', value)}
                disabled={!preferences.enabled}
              />
            )}
          />
        </Card.Content>
      </Card>

      {preferences.dailyDigest && preferences.enabled && (
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Digest Time
            </Text>
            <Text variant="bodySmall" style={styles.sectionDescription}>
              When to receive your daily summary
            </Text>
            
            <SegmentedButtons
              value={digestTime}
              onValueChange={handleTimeChange}
              buttons={timeOptions}
              style={styles.timeButtons}
            />
          </Card.Content>
        </Card>
      )}

      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            Scheduled Notifications
          </Text>
          
          <Text variant="bodyMedium" style={styles.notificationCount}>
            {scheduledNotifications.length} notification{scheduledNotifications.length !== 1 ? 's' : ''} scheduled
          </Text>

          {scheduledNotifications.length > 0 && (
            <Button
              mode="outlined"
              onPress={handleClearNotifications}
              style={styles.clearButton}
              textColor="#EF4444"
            >
              Clear All
            </Button>
          )}
        </Card.Content>
      </Card>

      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            What to Expect
          </Text>
          
          <View style={styles.infoList}>
            <View style={styles.infoItem}>
              <Text style={styles.infoIcon}>⚠️</Text>
              <View style={styles.infoContent}>
                <Text variant="bodyMedium" style={styles.infoTitle}>Expiry Warnings</Text>
                <Text variant="bodySmall" style={styles.infoText}>
                  Alerts 1-3 days before items expire
                </Text>
              </View>
            </View>
            
            <View style={styles.infoItem}>
              <Text style={styles.infoIcon}>📅</Text>
              <View style={styles.infoContent}>
                <Text variant="bodyMedium" style={styles.infoTitle}>Daily Digest</Text>
                <Text variant="bodySmall" style={styles.infoText}>
                  Morning summary of items needing attention
                </Text>
              </View>
            </View>
            
            <View style={styles.infoItem}>
              <Text style={styles.infoIcon}>💡</Text>
              <View style={styles.infoContent}>
                <Text variant="bodyMedium" style={styles.infoTitle}>Recipe Suggestions</Text>
                <Text variant="bodySmall" style={styles.infoText}>
                  When items are about to expire, we suggest recipes
                </Text>
              </View>
            </View>
          </View>
        </Card.Content>
      </Card>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    padding: 20,
    paddingTop: 60,
    backgroundColor: '#FFFFFF',
  },
  title: {
    fontWeight: '700',
    color: '#1F2937',
  },
  subtitle: {
    color: '#6B7280',
    marginTop: 4,
  },
  permissionCard: {
    margin: 16,
    marginBottom: 0,
    backgroundColor: '#FEF3C7',
    borderRadius: 16,
  },
  permissionContent: {
    alignItems: 'center',
    padding: 16,
  },
  permissionTitle: {
    fontWeight: '600',
    color: '#92400E',
    marginBottom: 4,
  },
  permissionText: {
    color: '#A16207',
    marginBottom: 16,
  },
  permissionButton: {
    backgroundColor: '#F59E0B',
  },
  card: {
    margin: 16,
    marginBottom: 0,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
  },
  sectionTitle: {
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  sectionDescription: {
    color: '#6B7280',
    marginBottom: 16,
  },
  timeButtons: {
    marginTop: 8,
  },
  notificationCount: {
    color: '#6B7280',
    marginBottom: 12,
  },
  clearButton: {
    borderColor: '#EF4444',
  },
  infoList: {
    gap: 16,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  infoIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    fontWeight: '500',
    color: '#374151',
  },
  infoText: {
    color: '#6B7280',
    marginTop: 2,
  },
});
