import React, { useEffect } from 'react';
import { View, StyleSheet, Image } from 'react-native';
import { Text, Button, ActivityIndicator, useTheme } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '@/stores/auth.store';
import { spacing } from '@/theme';

export const AuthScreen: React.FC = () => {
  const theme = useTheme();
  const { login, isLoading, error } = useAuthStore();

  const handleLogin = async () => {
    try {
      await login();
    } catch (err) {
      // Error is handled in the store
    }
  };

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" />
        <Text variant="bodyMedium" style={styles.loadingText}>
          Loading...
        </Text>
      </View>
    );
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      edges={['top', 'bottom']}
    >
      <View style={styles.content}>
        <View style={styles.header}>
          <Text
            variant="displaySmall"
            style={[styles.title, { color: theme.colors.primary }]}
          >
            Bet Think
          </Text>
          <Text variant="titleMedium" style={styles.subtitle}>
            Your AI Sports Betting Assistant
          </Text>
        </View>

        <View style={styles.features}>
          <FeatureItem
            icon="💬"
            title="Chat with AI"
            description="Get expert betting insights and recommendations"
          />
          <FeatureItem
            icon="🎯"
            title="Smart Recommendations"
            description="Receive data-driven bet suggestions"
          />
          <FeatureItem
            icon="🔗"
            title="Quick Access"
            description="Seamlessly place bets with your favorite sportsbooks"
          />
        </View>

        <View style={styles.buttonContainer}>
          <Button
            mode="contained"
            onPress={handleLogin}
            style={styles.button}
            contentStyle={styles.buttonContent}
            disabled={isLoading}
            accessible
            accessibilityLabel="Sign in with Auth0"
            accessibilityRole="button"
          >
            Sign In
          </Button>

          {error && (
            <Text
              variant="bodySmall"
              style={[styles.errorText, { color: theme.colors.error }]}
            >
              {error}
            </Text>
          )}

          <Text variant="bodySmall" style={styles.disclaimer}>
            By signing in, you agree to our Terms of Service and Privacy Policy
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
};

interface FeatureItemProps {
  icon: string;
  title: string;
  description: string;
}

const FeatureItem: React.FC<FeatureItemProps> = ({ icon, title, description }) => {
  const theme = useTheme();

  return (
    <View style={styles.featureItem}>
      <Text style={styles.featureIcon}>{icon}</Text>
      <View style={styles.featureText}>
        <Text variant="titleMedium" style={styles.featureTitle}>
          {title}
        </Text>
        <Text
          variant="bodyMedium"
          style={[styles.featureDescription, { color: theme.colors.onSurfaceVariant }]}
        >
          {description}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
    padding: spacing.xl,
  },
  header: {
    alignItems: 'center',
    marginTop: spacing.xxl,
  },
  title: {
    fontWeight: 'bold',
    marginBottom: spacing.sm,
  },
  subtitle: {
    opacity: 0.7,
  },
  features: {
    gap: spacing.lg,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  featureIcon: {
    fontSize: 32,
  },
  featureText: {
    flex: 1,
  },
  featureTitle: {
    marginBottom: spacing.xs,
  },
  featureDescription: {
    lineHeight: 20,
  },
  buttonContainer: {
    gap: spacing.md,
  },
  button: {
    borderRadius: 8,
  },
  buttonContent: {
    paddingVertical: spacing.sm,
  },
  loadingText: {
    marginTop: spacing.md,
    opacity: 0.7,
  },
  errorText: {
    textAlign: 'center',
  },
  disclaimer: {
    textAlign: 'center',
    opacity: 0.6,
    fontSize: 12,
  },
});
