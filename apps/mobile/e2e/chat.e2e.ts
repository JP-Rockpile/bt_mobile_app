import { by, device, element, expect as detoxExpect } from 'detox';

describe('Chat Flow', () => {
  beforeAll(async () => {
    // Assume user is already authenticated
    await device.launchApp({ newInstance: true });
  });

  beforeEach(async () => {
    await device.reloadReactNative();
  });

  it('should create a new chat thread', async () => {
    await element(by.id('create-chat-fab')).tap();
    await detoxExpect(element(by.id('chat-input'))).toBeVisible();
  });

  it('should send a message and receive response', async () => {
    await element(by.id('chat-input')).typeText('What are good bets today?');
    await element(by.id('send-button')).tap();

    // Wait for message to appear
    await detoxExpect(element(by.text('What are good bets today?'))).toBeVisible();

    // Wait for assistant response (with timeout)
    await waitFor(element(by.id('assistant-message')))
      .toBeVisible()
      .withTimeout(10000);
  });

  // Add more chat flow tests
});
