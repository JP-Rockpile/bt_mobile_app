import React from 'react';
import { View, Text, StyleSheet, Pressable, ActivityIndicator } from 'react-native';
import { ChatMessage as ChatMessageType, BetRecommendation } from '@types/index';
import { format } from 'date-fns';
import BetRecommendationCard from './BetRecommendationCard';

interface ChatMessageProps {
  message: ChatMessageType;
  onBetPress?: (bet: BetRecommendation) => void;
}

export default function ChatMessage({ message, onBetPress }: ChatMessageProps) {
  const isAssistant = message.role === 'assistant';
  const isStreaming = message.metadata?.isStreaming;

  return (
    <View style={[styles.container, isAssistant ? styles.assistantContainer : styles.userContainer]}>
      <View style={[styles.bubble, isAssistant ? styles.assistantBubble : styles.userBubble]}>
        <Text style={[styles.content, isAssistant ? styles.assistantContent : styles.userContent]}>
          {message.content}
        </Text>
        
        {isStreaming && (
          <ActivityIndicator size="small" color="#007AFF" style={styles.streamingIndicator} />
        )}
        
        {message.metadata?.betRecommendation && onBetPress && (
          <BetRecommendationCard
            recommendation={message.metadata.betRecommendation}
            onPress={() => onBetPress(message.metadata!.betRecommendation!)}
          />
        )}
        
        <Text style={[styles.timestamp, isAssistant ? styles.assistantTimestamp : styles.userTimestamp]}>
          {format(new Date(message.createdAt), 'HH:mm')}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 4,
  },
  assistantContainer: {
    alignItems: 'flex-start',
  },
  userContainer: {
    alignItems: 'flex-end',
  },
  bubble: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 16,
  },
  assistantBubble: {
    backgroundColor: '#F0F0F0',
    borderBottomLeftRadius: 4,
  },
  userBubble: {
    backgroundColor: '#007AFF',
    borderBottomRightRadius: 4,
  },
  content: {
    fontSize: 16,
    lineHeight: 22,
  },
  assistantContent: {
    color: '#000000',
  },
  userContent: {
    color: '#FFFFFF',
  },
  timestamp: {
    fontSize: 12,
    marginTop: 4,
  },
  assistantTimestamp: {
    color: '#666666',
  },
  userTimestamp: {
    color: 'rgba(255, 255, 255, 0.8)',
  },
  streamingIndicator: {
    marginTop: 8,
  },
});