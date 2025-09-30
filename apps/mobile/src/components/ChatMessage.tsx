import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Card, useTheme } from 'react-native-paper';
import { formatRelativeTime } from '@shared/utils';
import type { ChatMessage as ChatMessageType } from '@shared/types';
import { spacing, borderRadius } from '@/theme';

interface ChatMessageProps {
  message: ChatMessageType;
  showBetRecommendation?: (recommendationId: string) => void;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({ message, showBetRecommendation }) => {
  const theme = useTheme();
  const isUser = message.role === 'user';
  const hasBetRecommendation = !!message.metadata?.betRecommendation;

  return (
    <View
      style={[
        styles.container,
        isUser ? styles.userContainer : styles.assistantContainer,
      ]}
      accessible
      accessibilityRole="text"
      accessibilityLabel={`${isUser ? 'You' : 'Assistant'} said: ${message.content}`}
    >
      <Card
        style={[
          styles.card,
          {
            backgroundColor: isUser
              ? theme.colors.primary
              : theme.colors.surfaceVariant,
          },
        ]}
        elevation={1}
      >
        <Card.Content>
          <Text
            variant="bodyMedium"
            style={[
              styles.content,
              { color: isUser ? theme.colors.onPrimary : theme.colors.onSurface },
            ]}
          >
            {message.content}
          </Text>

          {hasBetRecommendation && (
            <Card
              style={[styles.betCard, { backgroundColor: theme.colors.tertiaryContainer }]}
              onPress={() =>
                showBetRecommendation?.(message.metadata!.betRecommendation!.id)
              }
              accessible
              accessibilityRole="button"
              accessibilityLabel="View bet recommendation"
            >
              <Card.Content>
                <Text variant="titleSmall" style={styles.betTitle}>
                  🎯 Bet Recommendation
                </Text>
                <Text variant="bodySmall">Tap to view details</Text>
              </Card.Content>
            </Card>
          )}

          <Text
            variant="labelSmall"
            style={[
              styles.timestamp,
              { color: isUser ? theme.colors.onPrimary : theme.colors.onSurfaceVariant },
            ]}
          >
            {formatRelativeTime(message.timestamp)}
          </Text>
        </Card.Content>
      </Card>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    maxWidth: '80%',
  },
  userContainer: {
    alignSelf: 'flex-end',
  },
  assistantContainer: {
    alignSelf: 'flex-start',
  },
  card: {
    borderRadius: borderRadius.lg,
  },
  content: {
    lineHeight: 20,
  },
  timestamp: {
    marginTop: spacing.xs,
    opacity: 0.7,
  },
  betCard: {
    marginTop: spacing.md,
    borderRadius: borderRadius.md,
  },
  betTitle: {
    marginBottom: spacing.xs,
  },
});
