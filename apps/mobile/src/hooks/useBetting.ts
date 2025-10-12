import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Linking, Platform } from 'react-native';
import { queryKeys } from '@/config/react-query';
import { bettingApi } from '@/api/endpoints';
import { analyticsService } from '@/services/analytics.service';
import { logger } from '@/utils/logger';
import { buildDeepLink, type BetConfirmation, type Sportsbook } from '@betthink/shared';
import type { BetRecommendation } from '@/types/bet';

export const useBetRecommendation = (recommendationId: string) => {
  return useQuery({
    queryKey: queryKeys.betting.recommendation(recommendationId),
    queryFn: () => bettingApi.getBetRecommendation(recommendationId),
    enabled: !!recommendationId,
  });
};

export const useBetHistory = () => {
  return useQuery({
    queryKey: queryKeys.betting.history(),
    queryFn: () => bettingApi.getBetHistory({ page: 1, pageSize: 50 }),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useConfirmBet = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (
      data: Omit<BetConfirmation, 'confirmedAt'>
    ): Promise<{ confirmation: BetConfirmation; redirectUrl: string }> => {
      // Get bet recommendation details
      const recommendation = await bettingApi.getBetRecommendation(data.betRecommendationId);

      // Confirm bet with API
      const confirmation = await bettingApi.confirmBet(data);

      // Build deep link to sportsbook
      const redirectUrl = buildSportsbookDeepLink(recommendation);

      // Track analytics
      analyticsService.trackBetConfirmed(
        recommendation.id,
        recommendation.sport,
        recommendation.stake,
        recommendation.sportsbook.name
      );

      logger.info('Bet confirmed', {
        betId: confirmation.betRecommendationId,
        sportsbook: recommendation.sportsbook.name,
      });

      return { confirmation, redirectUrl };
    },
    onSuccess: ({ confirmation, redirectUrl }) => {
      // Invalidate bet history to refresh
      queryClient.invalidateQueries({ queryKey: queryKeys.betting.history() });

      // Open sportsbook app
      openSportsbookApp(redirectUrl);
    },
    onError: (error) => {
      logger.error('Failed to confirm bet', error);
    },
  });
};

const buildSportsbookDeepLink = (recommendation: BetRecommendation): string => {
  const { sportsbook, betType, selection, odds, stake } = recommendation;

  // Build deep link parameters for guide mode
  const params: Record<string, string> = {
    type: betType,
    selection: selection,
    odds: odds.toString(),
    stake: stake.toString(),
    mode: 'guide', // Guide mode - no programmatic placement
  };

  // Add event details if available
  if (recommendation.event) {
    params.event = recommendation.event;
  }

  const deepLink = buildDeepLink(
    sportsbook.deepLinkScheme,
    sportsbook.deepLinkPath || 'bet',
    params
  );

  logger.debug('Built sportsbook deep link', { deepLink, sportsbook: sportsbook.name });
  return deepLink;
};

const openSportsbookApp = async (deepLink: string) => {
  try {
    const canOpen = await Linking.canOpenURL(deepLink);

    if (canOpen) {
      await Linking.openURL(deepLink);
      analyticsService.trackSportsbookRedirect(
        extractSportsbookFromUrl(deepLink),
        'deep_link'
      );
      logger.info('Opened sportsbook app via deep link', { deepLink });
    } else {
      // Fallback to app store if sportsbook app not installed
      logger.warn('Sportsbook app not installed, redirecting to app store');
      await redirectToAppStore(deepLink);
    }
  } catch (error) {
    logger.error('Failed to open sportsbook app', error);
    throw new Error('Could not open sportsbook app. Please install the app first.');
  }
};

const redirectToAppStore = async (deepLink: string): Promise<void> => {
  // Extract sportsbook identifier from deep link
  const sportsbook = extractSportsbookFromUrl(deepLink);

  // Map sportsbooks to their app store URLs
  const appStoreUrls: Record<string, { ios: string; android: string }> = {
    draftkings: {
      ios: 'https://apps.apple.com/us/app/draftkings-sportsbook-casino/id1375031205',
      android: 'https://play.google.com/store/apps/details?id=com.draftkings.sportsbook',
    },
    fanduel: {
      ios: 'https://apps.apple.com/us/app/fanduel-sportsbook-casino/id1059881100',
      android: 'https://play.google.com/store/apps/details?id=com.fanduel.sportsbook',
    },
    // Add more sportsbooks as needed
  };

  const appStore = appStoreUrls[sportsbook];
  if (!appStore) {
    throw new Error(`Unknown sportsbook: ${sportsbook}`);
  }

  const storeUrl = Platform.OS === 'ios' ? appStore.ios : appStore.android;
  await Linking.openURL(storeUrl);

  analyticsService.trackSportsbookRedirect(sportsbook, 'app_store');
  logger.info('Redirected to app store', { sportsbook, platform: Platform.OS });
};

const extractSportsbookFromUrl = (url: string): string => {
  // Extract sportsbook name from deep link scheme (e.g., "draftkings://..." -> "draftkings")
  const match = url.match(/^(\w+):\/\//);
  return match ? match[1] : 'unknown';
};

export const useCancelBet = () => {
  return useMutation({
    mutationFn: async (recommendationId: string) => {
      // Track cancellation
      analyticsService.trackBetCancelled(recommendationId, 'unknown');
      logger.info('Bet cancelled', { recommendationId });
    },
  });
};
