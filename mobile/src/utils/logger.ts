import config from '@config/index';

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  level: LogLevel;
  message: string;
  data?: any;
  timestamp: Date;
  context?: string;
}

class Logger {
  private isDevelopment = config.environment === 'development';
  private context?: string;

  constructor(context?: string) {
    this.context = context;
  }

  private shouldLog(level: LogLevel): boolean {
    if (this.isDevelopment) return true;
    
    // In production, only log warnings and errors
    return level === 'warn' || level === 'error';
  }

  private formatMessage(entry: LogEntry): string {
    const timestamp = entry.timestamp.toISOString();
    const context = entry.context ? `[${entry.context}]` : '';
    return `${timestamp} [${entry.level.toUpperCase()}]${context} ${entry.message}`;
  }

  private sanitizeData(data: any): any {
    if (!data) return data;
    
    // Remove sensitive information in production
    if (!this.isDevelopment) {
      const sanitized = { ...data };
      const sensitiveKeys = ['password', 'token', 'accessToken', 'refreshToken', 'idToken', 'apiKey', 'secret'];
      
      const recursiveSanitize = (obj: any) => {
        if (typeof obj !== 'object' || obj === null) return obj;
        
        Object.keys(obj).forEach(key => {
          if (sensitiveKeys.some(sensitive => key.toLowerCase().includes(sensitive.toLowerCase()))) {
            obj[key] = '[REDACTED]';
          } else if (typeof obj[key] === 'object') {
            recursiveSanitize(obj[key]);
          }
        });
        
        return obj;
      };
      
      return recursiveSanitize(sanitized);
    }
    
    return data;
  }

  private log(level: LogLevel, message: string, data?: any) {
    if (!this.shouldLog(level)) return;

    const entry: LogEntry = {
      level,
      message,
      data: this.sanitizeData(data),
      timestamp: new Date(),
      context: this.context
    };

    const formattedMessage = this.formatMessage(entry);

    switch (level) {
      case 'debug':
        console.log(formattedMessage, entry.data || '');
        break;
      case 'info':
        console.info(formattedMessage, entry.data || '');
        break;
      case 'warn':
        console.warn(formattedMessage, entry.data || '');
        break;
      case 'error':
        console.error(formattedMessage, entry.data || '');
        break;
    }
  }

  debug(message: string, data?: any) {
    this.log('debug', message, data);
  }

  info(message: string, data?: any) {
    this.log('info', message, data);
  }

  warn(message: string, data?: any) {
    this.log('warn', message, data);
  }

  error(message: string, error?: any) {
    const errorData = error instanceof Error 
      ? { message: error.message, stack: error.stack }
      : error;
    this.log('error', message, errorData);
  }

  withContext(context: string): Logger {
    return new Logger(context);
  }
}

export const logger = new Logger();
export default Logger;