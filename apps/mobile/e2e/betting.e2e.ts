import { by, device, element, expect as detoxExpect } from 'detox';

describe('Betting Flow', () => {
  beforeAll(async () => {
    await device.launchApp({ newInstance: true });
  });

  it('should display bet recommendation in chat', async () => {
    // Navigate to a chat with a bet recommendation
    // This assumes test data is seeded

    await detoxExpect(element(by.text('🎯 Bet Recommendation'))).toBeVisible();
  });

  it('should open bet confirmation sheet', async () => {
    await element(by.text('🎯 Bet Recommendation')).tap();

    await detoxExpect(element(by.text('Confirm Bet'))).toBeVisible();
    await detoxExpect(element(by.text('Confirm & Open'))).toBeVisible();
  });

  it('should confirm bet and redirect to sportsbook', async () => {
    await element(by.text('Confirm & Open')).tap();

    // Verify deep link opens (mocked in test environment)
    // This would need additional setup for deep link testing
  });

  it('should cancel bet confirmation', async () => {
    await element(by.text('🎯 Bet Recommendation')).tap();
    await element(by.text('Cancel')).tap();

    // Sheet should close
    await detoxExpect(element(by.text('Confirm Bet'))).not.toBeVisible();
  });

  // Add more betting flow tests
});
