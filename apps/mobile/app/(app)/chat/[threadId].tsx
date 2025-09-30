import React, { useEffect, useMemo, useRef, useState } from 'react';
import { FlatList, KeyboardAvoidingView, Platform, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { TextInput, Button, Text, ActivityIndicator, Portal, Modal, Card } from 'react-native-paper';
import * as Linking from 'expo-linking';
import { logger } from '@betthink/shared';
import { useAuth } from '../../../src/features/auth/AuthProvider';
import { fetchSSE } from '../../../src/features/chat/sse';

type Message = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
};

export default function ChatThread() {
  const { threadId } = useLocalSearchParams<{ threadId: string }>();
  const { ensureFreshToken } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [betSheet, setBetSheet] = useState<null | {
    id: string;
    market: string;
    selection: string;
    odds: number;
    stakeSuggested: number;
    sportsbook: string;
    potentialPayout: number;
    deeplink: string;
  }>(null);

  const listRef = useRef<FlatList<Message>>(null);

  useEffect(() => {
    listRef.current?.scrollToEnd({ animated: true });
  }, [messages.length]);

  const onSend = async () => {
    if (!input.trim()) return;
    const userMsg: Message = { id: Date.now().toString(), role: 'user', content: input };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);
    try {
      const token = await ensureFreshToken();
      let assistant: Message = { id: `${Date.now()}-asst`, role: 'assistant', content: '' };
      setMessages((prev) => [...prev, assistant]);
      await fetchSSE(
        `/v1/chat/stream?threadId=${threadId || 'new'}`,
        { message: userMsg.content },
        (chunk: string) => {
          assistant = { ...assistant, content: assistant.content + chunk };
          setMessages((prev) => prev.map((m) => (m.id === assistant.id ? assistant : m)));
          if (chunk.includes('bet_recommendation')) {
            try {
              const payload = JSON.parse(chunk);
              setBetSheet({
                id: payload.id,
                market: payload.market,
                selection: payload.selection,
                odds: payload.odds,
                stakeSuggested: payload.stakeSuggested,
                sportsbook: payload.sportsbook,
                potentialPayout: payload.potentialPayout,
                deeplink: payload.deeplink,
              });
            } catch (e) {
              logger.warn('Failed to parse recommendation', { e: String(e) });
            }
          }
        },
        { headers: token ? { Authorization: `Bearer ${token}` } : undefined },
      );
    } catch (e) {
      logger.error('SSE stream error', { e: String(e) });
    } finally {
      setLoading(false);
    }
  };

  const confirmBet = async () => {
    if (!betSheet) return;
    setBetSheet(null);
    await Linking.openURL(betSheet.deeplink);
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={{ padding: 12 }}>
            <Text accessibilityLabel={`${item.role} message`}>{item.content}</Text>
          </View>
        )}
      />
      <View style={{ flexDirection: 'row', padding: 12, gap: 8 }}>
        <TextInput
          accessibilityLabel="Message input"
          value={input}
          onChangeText={setInput}
          style={{ flex: 1 }}
          mode="outlined"
          returnKeyType="send"
          onSubmitEditing={onSend}
        />
        <Button mode="contained" onPress={onSend} accessibilityLabel="Send message" disabled={loading}>
          {loading ? <ActivityIndicator animating accessibilityLabel="Loading" /> : 'Send'}
        </Button>
      </View>
      <Portal>
        <Modal visible={!!betSheet} onDismiss={() => setBetSheet(null)} contentContainerStyle={{ margin: 16 }}>
          {betSheet && (
            <Card accessibilityLabel="Confirm Bet Sheet">
              <Card.Title title="Confirm Bet" subtitle={betSheet.sportsbook} />
              <Card.Content>
                <Text>Market: {betSheet.market}</Text>
                <Text>Selection: {betSheet.selection}</Text>
                <Text>Odds: {betSheet.odds}</Text>
                <Text>Stake: {betSheet.stakeSuggested}</Text>
                <Text>Potential Payout: {betSheet.potentialPayout}</Text>
              </Card.Content>
              <Card.Actions>
                <Button onPress={() => setBetSheet(null)}>Cancel</Button>
                <Button mode="contained" onPress={confirmBet} accessibilityLabel="Confirm bet">
                  Confirm
                </Button>
              </Card.Actions>
            </Card>
          )}
        </Modal>
      </Portal>
    </KeyboardAvoidingView>
  );
}

