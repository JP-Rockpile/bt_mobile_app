import React, { useCallback, useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Button, Divider, useTheme } from 'react-native-paper';
import BottomSheet, { BottomSheetView, BottomSheetBackdrop } from '@gorhom/bottom-sheet';
import type { BottomSheetBackdropProps } from '@gorhom/bottom-sheet';
import { useUIStore } from '@/stores/ui.store';
import { useConfirmBet, useCancelBet } from '@/hooks/useBetting';
import { convertOdds } from '@betthink/shared';
import type { BetRecommendation } from '@/types/bet';
import { spacing, borderRadius } from '@/theme';

export const BetConfirmationSheet: React.FC = () => {
  const theme = useTheme();
  const { isBottomSheetOpen, bottomSheetData, closeBottomSheet } = useUIStore();
  const confirmBet = useConfirmBet();
  const cancelBet = useCancelBet();

  const recommendation: BetRecommendation | null = bottomSheetData;

  const snapPoints = useMemo(() => ['75%'], []);

  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} />
    ),
    []
  );

  const handleConfirm = useCallback(async () => {
    if (!recommendation) return;

    try {
      await confirmBet.mutateAsync({
        betRecommendationId: recommendation.id,
        userId: '', // Set from auth context
        chatId: '', // Set from chat context
        messageId: '', // Set from message context
        redirectedToSportsbook: true,
      });

      closeBottomSheet();
    } catch (error) {
      // Error handling is done in the mutation
    }
  }, [recommendation, confirmBet, closeBottomSheet]);

  const handleCancel = useCallback(() => {
    if (recommendation) {
      cancelBet.mutate(recommendation.id);
    }
    closeBottomSheet();
  }, [recommendation, cancelBet, closeBottomSheet]);

  if (!recommendation) return null;

  const americanOdds = convertOdds(
    recommendation.odds,
    recommendation.oddsFormat,
    'american'
  );

  return (
    <BottomSheet
      index={isBottomSheetOpen ? 0 : -1}
      snapPoints={snapPoints}
      enablePanDownToClose
      onClose={closeBottomSheet}
      backdropComponent={renderBackdrop}
      backgroundStyle={{ backgroundColor: theme.colors.surface }}
      handleIndicatorStyle={{ backgroundColor: theme.colors.outline }}
    >
      <BottomSheetView style={styles.container}>
        <Text variant="headlineSmall" style={styles.title}>
          Confirm Bet
        </Text>

        <View style={[styles.section, { backgroundColor: theme.colors.surfaceVariant }]}>
          <Text variant="titleMedium" style={styles.eventTitle}>
            {recommendation.event}
          </Text>
          <Text variant="bodyMedium" style={styles.league}>
            {recommendation.sport} • {recommendation.league}
          </Text>
        </View>

        <Divider style={styles.divider} />

        <View style={styles.detailsContainer}>
          <DetailRow label="Bet Type" value={recommendation.betType} />
          <DetailRow label="Selection" value={recommendation.selection} />
          <DetailRow label="Odds" value={`${americanOdds > 0 ? '+' : ''}${americanOdds}`} />
          <DetailRow label="Stake" value={`$${recommendation.stake.toFixed(2)}`} />
          <DetailRow
            label="Potential Payout"
            value={`$${recommendation.potentialPayout.toFixed(2)}`}
            highlight
          />
        </View>

        {recommendation.reasoning && (
          <>
            <Divider style={styles.divider} />
            <View style={styles.section}>
              <Text variant="titleSmall" style={styles.reasoningTitle}>
                Why this bet?
              </Text>
              <Text variant="bodyMedium">{recommendation.reasoning}</Text>
            </View>
          </>
        )}

        <View style={styles.sportsbookSection}>
          <Text variant="labelMedium" style={styles.sportsbookLabel}>
            Sportsbook
          </Text>
          <Text variant="bodyLarge" style={styles.sportsbookName}>
            {recommendation.sportsbook.name}
          </Text>
          <Text variant="bodySmall" style={styles.sportsbookNote}>
            You'll be redirected to the {recommendation.sportsbook.name} app in guide mode
          </Text>
        </View>

        <View style={styles.buttonContainer}>
          <Button
            mode="outlined"
            onPress={handleCancel}
            style={styles.cancelButton}
            disabled={confirmBet.isPending}
            accessible
            accessibilityLabel="Cancel bet"
          >
            Cancel
          </Button>
          <Button
            mode="contained"
            onPress={handleConfirm}
            style={styles.confirmButton}
            loading={confirmBet.isPending}
            disabled={confirmBet.isPending}
            accessible
            accessibilityLabel="Confirm bet and open sportsbook"
          >
            Confirm & Open
          </Button>
        </View>
      </BottomSheetView>
    </BottomSheet>
  );
};

interface DetailRowProps {
  label: string;
  value: string;
  highlight?: boolean;
}

const DetailRow: React.FC<DetailRowProps> = ({ label, value, highlight }) => {
  const theme = useTheme();

  return (
    <View style={styles.detailRow}>
      <Text variant="bodyMedium" style={styles.detailLabel}>
        {label}
      </Text>
      <Text
        variant={highlight ? 'titleMedium' : 'bodyLarge'}
        style={[
          styles.detailValue,
          highlight && { color: theme.colors.primary, fontWeight: 'bold' },
        ]}
      >
        {value}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.lg,
  },
  title: {
    marginBottom: spacing.lg,
    textAlign: 'center',
  },
  section: {
    padding: spacing.md,
    borderRadius: borderRadius.md,
  },
  eventTitle: {
    marginBottom: spacing.xs,
  },
  league: {
    opacity: 0.7,
  },
  divider: {
    marginVertical: spacing.md,
  },
  detailsContainer: {
    gap: spacing.sm,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailLabel: {
    opacity: 0.7,
  },
  detailValue: {
    fontWeight: '600',
  },
  reasoningTitle: {
    marginBottom: spacing.sm,
  },
  sportsbookSection: {
    marginTop: spacing.lg,
    alignItems: 'center',
  },
  sportsbookLabel: {
    opacity: 0.7,
    marginBottom: spacing.xs,
  },
  sportsbookName: {
    fontWeight: 'bold',
    marginBottom: spacing.xs,
  },
  sportsbookNote: {
    opacity: 0.6,
    textAlign: 'center',
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.xl,
  },
  cancelButton: {
    flex: 1,
  },
  confirmButton: {
    flex: 2,
  },
});
