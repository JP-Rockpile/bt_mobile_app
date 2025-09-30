import React from 'react';
import { View, StyleSheet, FlatList } from 'react-native';
import { FAB, List, Text, ActivityIndicator, useTheme } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useChatThreads, useCreateThread } from '@/hooks/useChat';
import { useAuthStore } from '@/stores/auth.store';
import { formatRelativeTime } from '@shared/utils';
import type { ChatThread } from '@shared/types';
import type { MainTabScreenProps } from '@/navigation/types';
import { spacing } from '@/theme';

export const HomeScreen: React.FC = () => {
  const theme = useTheme();
  const navigation = useNavigation<MainTabScreenProps<'Home'>['navigation']>();
  const { user } = useAuthStore();
  const { data: threads, isLoading } = useChatThreads(user?.id || '');
  const createThread = useCreateThread();

  const handleCreateThread = async () => {
    try {
      const thread = await createThread.mutateAsync();
      navigation.navigate('ChatDetail', { threadId: thread.id });
    } catch (error) {
      console.error('Failed to create thread:', error);
    }
  };

  const handleThreadPress = (threadId: string) => {
    navigation.navigate('ChatDetail', { threadId });
  };

  const renderThread = ({ item }: { item: ChatThread }) => (
    <List.Item
      title={item.title}
      description={`${item.messageCount} messages • ${formatRelativeTime(item.updatedAt)}`}
      left={(props) => <List.Icon {...props} icon="chat" />}
      right={(props) => <List.Icon {...props} icon="chevron-right" />}
      onPress={() => handleThreadPress(item.id)}
      style={[styles.listItem, { backgroundColor: theme.colors.surface }]}
      accessible
      accessibilityLabel={`Chat: ${item.title}`}
      accessibilityHint="Double tap to open chat"
    />
  );

  if (isLoading) {
    return (
      <View style={[styles.centered, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      edges={['bottom']}
    >
      <FlatList
        data={threads}
        keyExtractor={(item) => item.id}
        renderItem={renderThread}
        contentContainerStyle={styles.listContent}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text variant="bodyLarge" style={styles.emptyText}>
              No chats yet. Start a new conversation!
            </Text>
          </View>
        }
        accessible
        accessibilityLabel="Chat threads list"
      />

      <FAB
        icon="plus"
        style={[styles.fab, { backgroundColor: theme.colors.primary }]}
        onPress={handleCreateThread}
        loading={createThread.isPending}
        accessible
        accessibilityLabel="Create new chat"
        accessibilityRole="button"
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    flexGrow: 1,
  },
  listItem: {
    paddingVertical: spacing.sm,
  },
  separator: {
    height: 1,
    opacity: 0.1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  emptyText: {
    textAlign: 'center',
    opacity: 0.6,
  },
  fab: {
    position: 'absolute',
    margin: spacing.md,
    right: 0,
    bottom: 0,
  },
});
