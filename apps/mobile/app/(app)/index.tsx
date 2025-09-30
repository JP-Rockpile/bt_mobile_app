import React from 'react';
import { SafeAreaView, View } from 'react-native';
import { Button, Text } from 'react-native-paper';
import { Link } from 'expo-router';
import { useAuth } from '../../src/features/auth/AuthProvider';

export default function Home() {
  const { isAuthenticated, login, logout } = useAuth();
  return (
    <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <View accessible accessibilityLabel="Bet Think home" style={{ gap: 16 }}>
        <Text variant="headlineMedium">Bet Think</Text>
        {isAuthenticated ? (
          <>
            <Link href="/chat/new" asChild>
              <Button mode="contained" accessibilityLabel="Start new chat">Start chatting</Button>
            </Link>
            <Button onPress={logout} accessibilityLabel="Log out">Log out</Button>
          </>
        ) : (
          <Button mode="contained" onPress={login} accessibilityLabel="Log in">Log in</Button>
        )}
      </View>
    </SafeAreaView>
  );
}

