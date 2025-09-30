import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { BetRecommendation } from '@types/index';

interface BetRecommendationCardProps {
  recommendation: BetRecommendation;
  onPress: () => void;
}

export default function BetRecommendationCard({ recommendation, onPress }: BetRecommendationCardProps) {
  const getConfidenceColor = (confidence: string) => {
    switch (confidence) {
      case 'high': return '#4CAF50';
      case 'medium': return '#FF9800';
      case 'low': return '#F44336';
      default: return '#757575';
    }
  };

  return (
    <Pressable onPress={onPress} style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.sport}>{recommendation.sport}</Text>
        <View style={[styles.confidenceBadge, { backgroundColor: getConfidenceColor(recommendation.confidence) }]}>
          <Text style={styles.confidenceText}>{recommendation.confidence.toUpperCase()}</Text>
        </View>
      </View>
      
      <Text style={styles.event}>{recommendation.event}</Text>
      <Text style={styles.market}>{recommendation.market}</Text>
      <Text style={styles.selection}>{recommendation.selection}</Text>
      
      <View style={styles.details}>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Odds:</Text>
          <Text style={styles.detailValue}>{recommendation.odds.toFixed(2)}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Stake:</Text>
          <Text style={styles.detailValue}>${recommendation.stake.toFixed(2)}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Potential Payout:</Text>
          <Text style={styles.detailValueHighlight}>${recommendation.potentialPayout.toFixed(2)}</Text>
        </View>
      </View>
      
      <View style={styles.footer}>
        <Text style={styles.sportsbook}>{recommendation.sportsbook.name}</Text>
        <Text style={styles.ctaText}>Tap to review bet →</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sport: {
    fontSize: 14,
    fontWeight: '600',
    color: '#757575',
    textTransform: 'uppercase',
  },
  confidenceBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  confidenceText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  event: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212121',
    marginBottom: 4,
  },
  market: {
    fontSize: 14,
    color: '#616161',
    marginBottom: 2,
  },
  selection: {
    fontSize: 15,
    fontWeight: '500',
    color: '#007AFF',
    marginBottom: 12,
  },
  details: {
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    paddingTop: 12,
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  detailLabel: {
    fontSize: 14,
    color: '#757575',
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#212121',
  },
  detailValueHighlight: {
    fontSize: 14,
    fontWeight: '700',
    color: '#4CAF50',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    paddingTop: 12,
  },
  sportsbook: {
    fontSize: 13,
    color: '#616161',
  },
  ctaText: {
    fontSize: 13,
    color: '#007AFF',
    fontWeight: '500',
  },
});