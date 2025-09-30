import React from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { List, Switch, Divider, Button, useTheme } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '@/stores/auth.store';
import { useUIStore } from '@/stores/ui.store';
import { databaseService } from '@/services/database.service';
import { notificationService } from '@/services/notification.service';
import { spacing } from '@/theme';
import Constants from 'expo-constants';

export const SettingsScreen: React.FC = () => {
  const theme = useTheme();
  const { user, logout } = useAuthStore();
  const { theme: themeMode, setTheme, effectiveTheme } = useUIStore();

  const handleThemeChange = (value: 'light' | 'dark' | 'system') => {
    setTheme(value);
  };

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          await logout();
        },
      },
    ]);
  };

  const handleClearData = () => {
    Alert.alert(
      'Clear Local Data',
      'This will delete all locally stored messages. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            await databaseService.clearAllData();
            Alert.alert('Success', 'Local data cleared');
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      edges={['bottom']}
    >
      <ScrollView contentContainerStyle={styles.content}>
        <List.Section>
          <List.Subheader>Account</List.Subheader>
          <List.Item
            title={user?.name || user?.email}
            description={user?.email}
            left={(props) => <List.Icon {...props} icon="account" />}
            accessible
            accessibilityLabel={`Logged in as ${user?.name || user?.email}`}
          />
        </List.Section>

        <Divider />

        <List.Section>
          <List.Subheader>Appearance</List.Subheader>
          <List.Item
            title="Light Theme"
            right={() => (
              <Switch
                value={themeMode === 'light'}
                onValueChange={() => handleThemeChange('light')}
              />
            )}
            onPress={() => handleThemeChange('light')}
            accessible
            accessibilityLabel="Use light theme"
            accessibilityRole="switch"
          />
          <List.Item
            title="Dark Theme"
            right={() => (
              <Switch
                value={themeMode === 'dark'}
                onValueChange={() => handleThemeChange('dark')}
              />
            )}
            onPress={() => handleThemeChange('dark')}
            accessible
            accessibilityLabel="Use dark theme"
            accessibilityRole="switch"
          />
          <List.Item
            title="System Default"
            right={() => (
              <Switch
                value={themeMode === 'system'}
                onValueChange={() => handleThemeChange('system')}
              />
            )}
            onPress={() => handleThemeChange('system')}
            accessible
            accessibilityLabel="Use system theme"
            accessibilityRole="switch"
          />
        </List.Section>

        <Divider />

        <List.Section>
          <List.Subheader>Data & Storage</List.Subheader>
          <List.Item
            title="Clear Local Data"
            description="Remove all locally stored messages"
            left={(props) => <List.Icon {...props} icon="delete" />}
            onPress={handleClearData}
            accessible
            accessibilityLabel="Clear local data"
            accessibilityHint="Double tap to clear all local messages"
          />
        </List.Section>

        <Divider />

        <List.Section>
          <List.Subheader>About</List.Subheader>
          <List.Item
            title="Version"
            description={`${Constants.expoConfig?.version || '1.0.0'} (${
              Constants.expoConfig?.extra?.appEnv || 'development'
            })`}
            left={(props) => <List.Icon {...props} icon="information" />}
          />
          <List.Item
            title="Push Token"
            description={notificationService.getExpoPushToken()?.slice(0, 20) + '...' || 'N/A'}
            left={(props) => <List.Icon {...props} icon="bell" />}
          />
        </List.Section>

        <View style={styles.buttonContainer}>
          <Button
            mode="contained"
            onPress={handleLogout}
            style={styles.logoutButton}
            buttonColor={theme.colors.error}
            accessible
            accessibilityLabel="Logout button"
            accessibilityRole="button"
          >
            Logout
          </Button>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
  },
  buttonContainer: {
    padding: spacing.lg,
    marginTop: spacing.lg,
  },
  logoutButton: {
    borderRadius: 8,
  },
});
