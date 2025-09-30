describe('Chat Flow', () => {
  beforeAll(async () => {
    // Launch app in authenticated state
    await device.launchApp({
      newInstance: true,
      permissions: { notifications: 'YES' },
      launchArgs: { mockAuth: 'true', skipOnboarding: 'true' }
    });
  });

  beforeEach(async () => {
    await device.reloadReactNative();
  });

  it('should display chat screen with empty state', async () => {
    await expect(element(by.text('Welcome to Bet Think!'))).toBeVisible();
    await expect(element(by.text('Try asking:'))).toBeVisible();
    await expect(element(by.id('chat-input'))).toBeVisible();
  });

  it('should show suggestion chips', async () => {
    await expect(element(by.text('What are the best NFL bets for this weekend?'))).toBeVisible();
    await expect(element(by.text('Analyze the Lakers vs Warriors game'))).toBeVisible();
    await expect(element(by.text("What's a good parlay for today?"))).toBeVisible();
  });

  it('should fill input when suggestion chip is tapped', async () => {
    await element(by.text('What are the best NFL bets for this weekend?')).tap();
    
    await expect(element(by.id('chat-input')))
      .toHaveText('What are the best NFL bets for this weekend?');
  });

  it('should send message when send button is tapped', async () => {
    await element(by.id('chat-input')).typeText('Show me NBA games tonight');
    await element(by.id('send-button')).tap();
    
    // Message should appear in chat
    await expect(element(by.text('Show me NBA games tonight'))).toBeVisible();
    
    // Loading indicator should appear
    await expect(element(by.id('message-loading-indicator'))).toBeVisible();
  });

  it('should display AI response with bet recommendation', async () => {
    await element(by.id('chat-input')).typeText('Best bet for Lakers game');
    await element(by.id('send-button')).tap();
    
    // Wait for AI response
    await waitFor(element(by.id('bet-recommendation-card')))
      .toBeVisible()
      .withTimeout(10000);
    
    // Verify bet details are shown
    await expect(element(by.text('NBA'))).toBeVisible();
    await expect(element(by.text('Lakers'))).toBeVisible();
    await expect(element(by.id('bet-odds'))).toBeVisible();
    await expect(element(by.id('bet-stake'))).toBeVisible();
    await expect(element(by.id('bet-payout'))).toBeVisible();
  });

  it('should open bet confirmation sheet when bet card is tapped', async () => {
    // Assuming previous test created a bet recommendation
    await element(by.id('bet-recommendation-card')).tap();
    
    // Bottom sheet should appear
    await waitFor(element(by.text('Confirm Your Bet')))
      .toBeVisible()
      .withTimeout(3000);
    
    await expect(element(by.text('Review the details before proceeding'))).toBeVisible();
    await expect(element(by.id('confirm-bet-button'))).toBeVisible();
    await expect(element(by.id('cancel-bet-button'))).toBeVisible();
  });

  it('should close bet sheet when cancel is tapped', async () => {
    await element(by.id('bet-recommendation-card')).tap();
    await waitFor(element(by.text('Confirm Your Bet'))).toBeVisible();
    
    await element(by.id('cancel-bet-button')).tap();
    
    // Sheet should close
    await waitFor(element(by.text('Confirm Your Bet')))
      .not.toBeVisible()
      .withTimeout(3000);
  });

  it('should handle network errors gracefully', async () => {
    // Simulate offline mode
    await device.disableSynchronization();
    await device.setURLBlacklist(['.*']);
    
    await element(by.id('chat-input')).typeText('Test message');
    await element(by.id('send-button')).tap();
    
    // Error banner should appear
    await waitFor(element(by.text('Unable to send message. Please check your connection.')))
      .toBeVisible()
      .withTimeout(5000);
    
    // Re-enable network
    await device.clearURLBlacklist();
    await device.enableSynchronization();
  });

  it('should handle long messages with scrolling', async () => {
    const longMessage = 'This is a very long message that tests the chat input field expansion and scrolling behavior when users type multiple lines of text';
    
    await element(by.id('chat-input')).typeText(longMessage);
    
    // Input should expand
    await expect(element(by.id('chat-input'))).toBeVisible();
    
    // Should still be able to send
    await element(by.id('send-button')).tap();
    await expect(element(by.text(longMessage))).toBeVisible();
  });

  it('should persist chat history', async () => {
    // Send a message
    await element(by.id('chat-input')).typeText('Remember this message');
    await element(by.id('send-button')).tap();
    
    // Kill and relaunch app
    await device.terminateApp();
    await device.launchApp({
      newInstance: false,
      launchArgs: { mockAuth: 'true' }
    });
    
    // Previous message should still be visible
    await expect(element(by.text('Remember this message'))).toBeVisible();
  });
});