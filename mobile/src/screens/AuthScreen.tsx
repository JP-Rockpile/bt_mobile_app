import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  Image,
  Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '@store/auth.store';
import { logger } from '@utils/logger';

export default function AuthScreen() {
  const { login, isLoading, error } = useAuthStore();
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  const handleLogin = async () => {
    try {
      setIsAuthenticating(true);
      await login();
    } catch (error) {
      logger.error('Authentication failed', error);
      Alert.alert(
        'Authentication Failed',
        'Unable to sign in. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsAuthenticating(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <Text style={styles.logoText}>🎯</Text>
          </View>
          <Text style={styles.title}>Bet Think</Text>
          <Text style={styles.subtitle}>Your AI Sports Betting Assistant</Text>
        </View>

        <View style={styles.features}>
          <View style={styles.feature}>
            <Text style={styles.featureIcon}>🤖</Text>
            <View style={styles.featureContent}>
              <Text style={styles.featureTitle}>AI-Powered Insights</Text>
              <Text style={styles.featureDescription}>
                Get personalized betting recommendations based on advanced analytics
              </Text>
            </View>
          </View>

          <View style={styles.feature}>
            <Text style={styles.featureIcon}>📊</Text>
            <View style={styles.featureContent}>
              <Text style={styles.featureTitle}>Real-Time Analysis</Text>
              <Text style={styles.featureDescription}>
                Access live odds, trends, and expert predictions
              </Text>
            </View>
          </View>

          <View style={styles.feature}>
            <Text style={styles.featureIcon}>🔒</Text>
            <View style={styles.featureContent}>
              <Text style={styles.featureTitle}>Secure & Private</Text>
              <Text style={styles.featureDescription}>
                Your data is encrypted and never shared with third parties
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.authSection}>
          <Pressable
            onPress={handleLogin}
            style={[styles.authButton, isAuthenticating && styles.authButtonDisabled]}
            disabled={isAuthenticating || isLoading}
          >
            {isAuthenticating ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <Text style={styles.authButtonText}>Sign In with Auth0</Text>
              </>
            )}
          </Pressable>

          <Text style={styles.terms}>
            By signing in, you agree to our{' '}
            <Text style={styles.link}>Terms of Service</Text> and{' '}
            <Text style={styles.link}>Privacy Policy</Text>
          </Text>

          {error && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}
        </View>

        <View style={styles.disclaimer}>
          <Text style={styles.disclaimerText}>
            Bet Think provides recommendations only. Always gamble responsibly.
          </Text>
          <Text style={styles.disclaimerText}>
            If you or someone you know has a gambling problem, call 1-800-GAMBLER
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'space-between',
  },
  header: {
    alignItems: 'center',
    paddingTop: 60,
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 20,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  logoText: {
    fontSize: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#212121',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#757575',
    textAlign: 'center',
  },
  features: {
    marginTop: 48,
  },
  feature: {
    flexDirection: 'row',
    marginBottom: 24,
  },
  featureIcon: {
    fontSize: 24,
    marginRight: 16,
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212121',
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 14,
    color: '#616161',
    lineHeight: 20,
  },
  authSection: {
    marginTop: 32,
  },
  authButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  authButtonDisabled: {
    opacity: 0.6,
  },
  authButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  terms: {
    fontSize: 12,
    color: '#757575',
    textAlign: 'center',
    marginTop: 16,
    lineHeight: 18,
  },
  link: {
    color: '#007AFF',
    textDecorationLine: 'underline',
  },
  errorContainer: {
    marginTop: 16,
    padding: 12,
    backgroundColor: '#FFEBEE',
    borderRadius: 8,
  },
  errorText: {
    fontSize: 14,
    color: '#C62828',
    textAlign: 'center',
  },
  disclaimer: {
    paddingVertical: 24,
  },
  disclaimerText: {
    fontSize: 11,
    color: '#9E9E9E',
    textAlign: 'center',
    lineHeight: 16,
    marginBottom: 4,
  },
});