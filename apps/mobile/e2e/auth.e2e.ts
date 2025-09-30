import { by, device, element, expect as detoxExpect } from 'detox';

describe('Authentication Flow', () => {
  beforeAll(async () => {
    await device.launchApp({ newInstance: true });
  });

  beforeEach(async () => {
    await device.reloadReactNative();
  });

  it('should display auth screen on first launch', async () => {
    await detoxExpect(element(by.text('Bet Think'))).toBeVisible();
    await detoxExpect(element(by.text('Sign In'))).toBeVisible();
  });

  it('should navigate to Auth0 login on sign in tap', async () => {
    await element(by.text('Sign In')).tap();
    // Note: Testing actual Auth0 flow requires mocking or test credentials
  });

  // Add more auth flow tests
});
