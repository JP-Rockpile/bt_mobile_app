describe('Authentication Flow', () => {
  beforeAll(async () => {
    await device.launchApp({
      newInstance: true,
      permissions: { notifications: 'YES' }
    });
  });

  beforeEach(async () => {
    await device.reloadReactNative();
  });

  it('should show auth screen on first launch', async () => {
    await expect(element(by.text('Bet Think'))).toBeVisible();
    await expect(element(by.text('Your AI Sports Betting Assistant'))).toBeVisible();
    await expect(element(by.text('Sign In with Auth0'))).toBeVisible();
  });

  it('should show features on auth screen', async () => {
    await expect(element(by.text('AI-Powered Insights'))).toBeVisible();
    await expect(element(by.text('Real-Time Analysis'))).toBeVisible();
    await expect(element(by.text('Secure & Private'))).toBeVisible();
  });

  it('should initiate login flow when sign in button is tapped', async () => {
    await element(by.text('Sign In with Auth0')).tap();
    
    // Wait for Auth0 Universal Login to load
    await waitFor(element(by.id('auth0-login-container')))
      .toBeVisible()
      .withTimeout(10000);
  });

  it('should navigate to chat screen after successful authentication', async () => {
    // Mock successful authentication
    await device.launchApp({
      newInstance: false,
      launchArgs: { mockAuth: 'true' }
    });

    await element(by.text('Sign In with Auth0')).tap();
    
    // Should navigate to chat screen
    await waitFor(element(by.text('Bet Think Assistant')))
      .toBeVisible()
      .withTimeout(5000);
    
    await expect(element(by.id('chat-input'))).toBeVisible();
  });

  it('should show error message on authentication failure', async () => {
    // Mock authentication failure
    await device.launchApp({
      newInstance: false,
      launchArgs: { mockAuthError: 'true' }
    });

    await element(by.text('Sign In with Auth0')).tap();
    
    await waitFor(element(by.text('Authentication Failed')))
      .toBeVisible()
      .withTimeout(5000);
  });

  it('should handle logout correctly', async () => {
    // Start with authenticated state
    await device.launchApp({
      newInstance: false,
      launchArgs: { mockAuth: 'true' }
    });

    await element(by.text('Sign In with Auth0')).tap();
    
    // Navigate to settings/profile
    await element(by.id('profile-tab')).tap();
    await element(by.text('Sign Out')).tap();
    
    // Confirm logout
    await element(by.text('Yes, Sign Out')).tap();
    
    // Should return to auth screen
    await waitFor(element(by.text('Sign In with Auth0')))
      .toBeVisible()
      .withTimeout(5000);
  });
});