import React from 'react';
import { render } from '@testing-library/react-native';
import { Provider as PaperProvider } from 'react-native-paper';
import { ChatMessage } from '@/components/ChatMessage';
import type { ChatMessage as ChatMessageType } from '@shared/types';

const mockMessage: ChatMessageType = {
  id: '1',
  chatId: 'thread-1',
  role: 'user',
  content: 'Test message',
  timestamp: new Date().toISOString(),
};

const renderWithTheme = (component: React.ReactElement) => {
  return render(<PaperProvider>{component}</PaperProvider>);
};

describe('ChatMessage Component', () => {
  it('should render user message correctly', () => {
    const { getByText } = renderWithTheme(<ChatMessage message={mockMessage} />);
    expect(getByText('Test message')).toBeTruthy();
  });

  it('should render assistant message correctly', () => {
    const assistantMessage = { ...mockMessage, role: 'assistant' as const };
    const { getByText } = renderWithTheme(<ChatMessage message={assistantMessage} />);
    expect(getByText('Test message')).toBeTruthy();
  });

  it('should display bet recommendation when present', () => {
    const messageWithBet: ChatMessageType = {
      ...mockMessage,
      role: 'assistant',
      metadata: {
        betRecommendation: {
          id: 'bet-1',
          sport: 'NFL',
          league: 'NFL',
          event: 'Team A vs Team B',
          eventDate: new Date().toISOString(),
          betType: 'Moneyline',
          selection: 'Team A',
          odds: 150,
          oddsFormat: 'american' as const,
          stake: 50,
          potentialPayout: 125,
          sportsbook: {
            id: 'dk',
            name: 'DraftKings',
            deepLinkScheme: 'draftkings',
          },
        },
      },
    };

    const { getByText } = renderWithTheme(<ChatMessage message={messageWithBet} />);
    expect(getByText('🎯 Bet Recommendation')).toBeTruthy();
  });

  it('should be accessible', () => {
    const { getByLabelText } = renderWithTheme(<ChatMessage message={mockMessage} />);
    expect(getByLabelText(/You said:/)).toBeTruthy();
  });
});
