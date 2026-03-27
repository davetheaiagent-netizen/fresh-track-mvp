import React, { useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Button, Card, List, Divider } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { signOut } from '../services/supabase';

export default function SettingsScreen() {
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut();
    router.replace('/auth');
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text variant="headlineMedium" style={styles.title}>
          ⚙️ Settings
        </Text>
      </View>

      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            Notifications
          </Text>
          
          <List.Item
            title="Notification Settings"
            description="Configure alerts and reminders"
            left={props => <List.Icon {...props} icon="bell-outline" />}
            right={props => <List.Icon {...props} icon="chevron-right" />}
            onPress={() => router.push('/notifications')}
          />
        </Card.Content>
      </Card>

      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            Account
          </Text>
          
          <List.Item
            title="Email Notifications"
            description="your@email.com"
            left={props => <List.Icon {...props} icon="email-outline" />}
            onPress={() => {}}
          />
          <Divider />
          
          <List.Item
            title="Change Password"
            left={props => <List.Icon {...props} icon="lock-outline" />}
            onPress={() => {}}
          />
          <Divider />
          
          <List.Item
            title="Delete Account"
            titleStyle={{ color: '#EF4444' }}
            left={props => <List.Icon {...props} icon="delete-outline" color="#EF4444" />}
            onPress={() => {}}
          />
        </Card.Content>
      </Card>

      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            Data & Privacy
          </Text>
          
          <List.Item
            title="Export My Data"
            description="Download all your tracked items"
            left={props => <List.Icon {...props} icon="download-outline" />}
            onPress={() => {}}
          />
          <Divider />
          
          <List.Item
            title="Privacy Policy"
            left={props => <List.Icon {...props} icon="shield-check-outline" />}
            onPress={() => {}}
          />
          <Divider />
          
          <List.Item
            title="Terms of Service"
            left={props => <List.Icon {...props} icon="file-document-outline" />}
            onPress={() => {}}
          />
        </Card.Content>
      </Card>

      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            About
          </Text>
          
          <List.Item
            title="Version"
            description="1.0.0"
            left={props => <List.Icon {...props} icon="information-outline" />}
          />
          <Divider />
          
          <List.Item
            title="Rate FreshTrack"
            left={props => <List.Icon {...props} icon="star-outline" />}
            onPress={() => {}}
          />
          <Divider />
          
          <List.Item
            title="Share with Friends"
            left={props => <List.Icon {...props} icon="share-variant-outline" />}
            onPress={() => {}}
          />
        </Card.Content>
      </Card>

      <Button
        mode="outlined"
        onPress={handleSignOut}
        style={styles.signOutButton}
        textColor="#EF4444"
        icon="logout"
      >
        Sign Out
      </Button>

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
  card: {
    margin: 16,
    marginTop: 0,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
  },
  sectionTitle: {
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  signOutButton: {
    marginHorizontal: 16,
    marginTop: 8,
    borderColor: '#EF4444',
  },
});
