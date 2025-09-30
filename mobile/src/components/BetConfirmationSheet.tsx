import React, { useCallback, useMemo, useRef, forwardRef, useImperativeHandle } from 'react';
import { View, Text, StyleSheet, Pressable, Linking, Alert } from 'react-native';
import BottomSheet, { BottomSheetBackdrop, BottomSheetView } from '@gorhom/bottom-sheet';
import { BetRecommendation } from '@types/index';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface BetConfirmationSheetProps {
  recommendation: BetRecommendation | null;
  onConfirm: (recommendation: BetRecommendation) => void;
  onCancel: () => void;
}

export interface BetConfirmationSheetRef {
  open: () => void;
  close: () => void;
}

const BetConfirmationSheet = forwardRef<BetConfirmationSheetRef, BetConfirmationSheetProps>(
  ({ recommendation, onConfirm, onCancel }, ref) => {
    const insets = useSafeAreaInsets();
    const bottomSheetRef = useRef<BottomSheet>(null);
    const snapPoints = useMemo(() => ['50%', '75%'], []);

    useImperativeHandle(ref, () => ({
      open: () => bottomSheetRef.current?.expand(),
      close: () => bottomSheetRef.current?.close(),
    }));

    const handleConfirm = useCallback(async () => {
      if (!recommendation) return;

      try {
        // Construct deep link to sportsbook
        const deepLink = constructDeepLink(recommendation);
        
        // Check if the sportsbook app is installed
        const canOpen = await Linking.canOpenURL(deepLink);
        
        if (canOpen) {
          await Linking.openURL(deepLink);
          onConfirm(recommendation);
        } else {
          // Fallback to web URL
          await Linking.openURL(recommendation.sportsbook.webUrl);
          onConfirm(recommendation);
        }
        
        bottomSheetRef.current?.close();
      } catch (error) {
        Alert.alert(
          'Unable to Open Sportsbook',
          'Please check if the sportsbook app is installed or try again later.',
          [{ text: 'OK' }]
        );
      }
    }, [recommendation, onConfirm]);

    const constructDeepLink = (bet: BetRecommendation): string => {
      // This would be customized per sportsbook
      const params = new URLSearchParams({
        sport: bet.sport,
        event: bet.event,
        market: bet.market,
        selection: bet.selection,
        odds: bet.odds.toString(),
        stake: bet.stake.toString(),
        guide: 'true' // Enable guide mode
      });
      
      return `${bet.sportsbook.deepLinkScheme}://bet?${params.toString()}`;
    };

    const renderBackdrop = useCallback(
      (props: any) => (
        <BottomSheetBackdrop
          {...props}
          disappearsOnIndex={-1}
          appearsOnIndex={0}
          opacity={0.5}
        />
      ),
      []
    );

    if (!recommendation) return null;

    return (
      <BottomSheet
        ref={bottomSheetRef}
        index={-1}
        snapPoints={snapPoints}
        backdropComponent={renderBackdrop}
        enablePanDownToClose
        onClose={onCancel}
        bottomInset={insets.bottom}
        style={styles.bottomSheet}
      >
        <BottomSheetView style={styles.contentContainer}>
          <View style={styles.header}>
            <Text style={styles.title}>Confirm Your Bet</Text>
            <Text style={styles.subtitle}>Review the details before proceeding</Text>
          </View>

          <View style={styles.betDetails}>
            <View style={styles.detailSection}>
              <Text style={styles.sectionTitle}>Event</Text>
              <Text style={styles.eventName}>{recommendation.event}</Text>
              <Text style={styles.marketName}>{recommendation.market}</Text>
              <Text style={styles.selectionName}>{recommendation.selection}</Text>
            </View>

            <View style={styles.detailSection}>
              <Text style={styles.sectionTitle}>Bet Details</Text>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Odds</Text>
                <Text style={styles.detailValue}>{recommendation.odds.toFixed(2)}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Stake</Text>
                <Text style={styles.detailValue}>${recommendation.stake.toFixed(2)}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Potential Payout</Text>
                <Text style={styles.payoutValue}>${recommendation.potentialPayout.toFixed(2)}</Text>
              </View>
            </View>

            <View style={styles.detailSection}>
              <Text style={styles.sectionTitle}>Sportsbook</Text>
              <Text style={styles.sportsbookName}>{recommendation.sportsbook.name}</Text>
            </View>

            {recommendation.reasoning && (
              <View style={styles.detailSection}>
                <Text style={styles.sectionTitle}>AI Reasoning</Text>
                <Text style={styles.reasoning}>{recommendation.reasoning}</Text>
              </View>
            )}
          </View>

          <View style={styles.disclaimer}>
            <Text style={styles.disclaimerText}>
              You will be redirected to {recommendation.sportsbook.name} to complete your bet.
              Bet Think does not place bets on your behalf.
            </Text>
          </View>

          <View style={styles.actions}>
            <Pressable onPress={onCancel} style={styles.cancelButton}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </Pressable>
            <Pressable onPress={handleConfirm} style={styles.confirmButton}>
              <Text style={styles.confirmButtonText}>Open in {recommendation.sportsbook.name}</Text>
            </Pressable>
          </View>
        </BottomSheetView>
      </BottomSheet>
    );
  }
);

BetConfirmationSheet.displayName = 'BetConfirmationSheet';

export default BetConfirmationSheet;

const styles = StyleSheet.create({
  bottomSheet: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 5,
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  header: {
    alignItems: 'center',
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#212121',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#757575',
  },
  betDetails: {
    flex: 1,
    paddingVertical: 20,
  },
  detailSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#757575',
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  eventName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212121',
    marginBottom: 4,
  },
  marketName: {
    fontSize: 14,
    color: '#616161',
    marginBottom: 2,
  },
  selectionName: {
    fontSize: 15,
    fontWeight: '500',
    color: '#007AFF',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 14,
    color: '#616161',
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#212121',
  },
  payoutValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#4CAF50',
  },
  sportsbookName: {
    fontSize: 15,
    fontWeight: '500',
    color: '#212121',
  },
  reasoning: {
    fontSize: 14,
    color: '#616161',
    lineHeight: 20,
  },
  disclaimer: {
    backgroundColor: '#FFF3E0',
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
  },
  disclaimerText: {
    fontSize: 12,
    color: '#E65100',
    lineHeight: 18,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    paddingBottom: 20,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#757575',
  },
  confirmButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 8,
    backgroundColor: '#007AFF',
    alignItems: 'center',
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});