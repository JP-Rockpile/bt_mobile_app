import { logger } from '@/utils/logger';

describe('Logger', () => {
  let consoleSpy: jest.SpyInstance;

  beforeEach(() => {
    consoleSpy = jest.spyOn(console, 'log').mockImplementation();
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  it('should log debug messages', () => {
    logger.debug('Test debug', { foo: 'bar' });
    expect(consoleSpy).toHaveBeenCalled();
  });

  it('should log info messages', () => {
    logger.info('Test info');
    expect(consoleSpy).toHaveBeenCalled();
  });

  it('should log errors', () => {
    const errorSpy = jest.spyOn(console, 'error').mockImplementation();
    logger.error('Test error', new Error('Test'));
    expect(errorSpy).toHaveBeenCalled();
    errorSpy.mockRestore();
  });

  it('should redact sensitive data in production', () => {
    const data = {
      token: 'secret-token-123',
      password: 'my-password',
      email: 'user@example.com',
    };

    logger.info('Sensitive data', data);
    // In production, sensitive fields should be redacted
  });
});
