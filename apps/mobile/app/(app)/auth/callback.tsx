import React, { useEffect } from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { View } from 'react-native';
import { ActivityIndicator, Text } from 'react-native-paper';

export default function AuthCallback() {
  const router = useRouter();
  const params = useLocalSearchParams();

  useEffect(() => {
    // Placeholder; real Auth0 handling wired in auth provider
    router.replace('/');
  }, [router, params]);

  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <ActivityIndicator />
      <Text>Signing you in...</Text>
    </View>
  );
}

