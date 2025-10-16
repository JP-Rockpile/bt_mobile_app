import React from 'react';
import { View, StyleSheet, ScrollView, Linking, TouchableOpacity, Text } from 'react-native';
import { List, Divider, Button, useTheme } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocation } from '@/hooks/useLocation';
import Constants from 'expo-constants';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function SettingsPage() {
  const theme = useTheme();
  const {
    permissionStatus,
    isLoading,
    error,
    requestPermission,
    isLocationEnabled,
  } = useLocation();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: theme.colors.onBackground }]}>Settings</Text>
        <TouchableOpacity onPress={() => router.back()} style={styles.closeButton} accessibilityRole="button" accessibilityLabel="Close settings">
          <Ionicons name="close" size={24} color={theme.colors.onBackground} />
        </TouchableOpacity>
      </View>
      <ScrollView style={{ backgroundColor: theme.colors.background }} contentContainerStyle={styles.content}>
        <List.Section>
          <List.Subheader>Location Privacy</List.Subheader>
          <List.Item
            title="Location"
            description={`${permissionStatus?.granted
              ? 'Allowed'
              : permissionStatus?.status === 'denied'
              ? 'Denied'
              : 'Not determined'} · Services ${isLocationEnabled ? 'On' : 'Off'}`}
            left={(props) => <List.Icon {...props} icon="map-marker" />}
          />

          <View style={styles.buttonsRow}>
            <Button
              mode="contained"
              onPress={requestPermission}
              disabled={isLoading || permissionStatus?.granted === true}
              style={styles.button}
            >
              {permissionStatus?.granted ? 'Granted' : 'Request Access'}
            </Button>

            <Button
              mode="outlined"
              onPress={() => Linking.openSettings()}
              style={styles.button}
            >
              Open System Settings
            </Button>
          </View>

          {/* Single location item above shows both permission and services state */}
        </List.Section>

        <Divider />

        <List.Section>
          <List.Subheader>About</List.Subheader>
          <List.Item
            title="Version"
            description={`${Constants.expoConfig?.version || '1.0.0'} (${Constants.expoConfig?.extra?.appEnv || 'development'})`}
            left={(props) => <List.Icon {...props} icon="information" />}
          />
        </List.Section>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  closeButton: {
    position: 'absolute',
    right: 12,
    padding: 8,
  },
  content: {
    padding: 16,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
});


