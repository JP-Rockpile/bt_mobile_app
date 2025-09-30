import React from 'react';
import { View, StyleSheet, FlatList } from 'react-native';
import { List, Text, ActivityIndicator, useTheme, Chip } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useBetHistory } from '@/hooks/useBetting';
import { formatRelativeTime } from '@shared/utils';
import type { BetConfirmation } from '@shared/types';
import { spacing } from '@/theme';

export const HistoryScreen: React.FC = () => {
  const theme = useTheme();
  const { data: bets, isLoading } = useBetHistory();

  const renderBet = ({ item }: { item: BetConfirmation }) => (
    <List.Item
      title={`Bet #${item.betRecommendationId.slice(0, 8)}`}
      description={formatRelativeTime(item.confirmedAt)}
      left={(props) => <List.Icon {...props} icon="cash" />}
      right={() => (
        <Chip
          mode="outlined"
          style={[styles.chip, { borderColor: theme.colors.primary }]}
          textStyle={{ color: theme.colors.primary }}
        >
          Confirmed
        </Chip>
      )}
      style={[styles.listItem, { backgroundColor: theme.colors.surface }]}
      accessible
      accessibilityLabel={`Bet confirmed ${formatRelativeTime(item.confirmedAt)}`}
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
        data={bets}
        keyExtractor={(item) => item.betRecommendationId}
        renderItem={renderBet}
        contentContainerStyle={styles.listContent}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text variant="bodyLarge" style={styles.emptyText}>
              No bet history yet. Start chatting to get recommendations!
            </Text>
          </View>
        }
        accessible
        accessibilityLabel="Bet history list"
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
  chip: {
    marginRight: spacing.md,
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
});
