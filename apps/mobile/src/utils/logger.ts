import { isProduction } from '@/config';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  level: LogLevel;
  message: string;
  data?: unknown;
  timestamp: string;
}

// Sensitive patterns to redact in production
const SENSITIVE_PATTERNS = [
  /Bearer\s+[\w-]+\.[\w-]+\.[\w-]+/gi, // JWT tokens
  /token['":\s]+[\w-]+/gi, // Generic tokens
  /password['":\s]+[^\s,}]+/gi, // Passwords
  /api[_-]?key['":\s]+[\w-]+/gi, // API keys
  /secret['":\s]+[\w-]+/gi, // Secrets
  /\b[\w._%+-]+@[\w.-]+\.[A-Z|a-z]{2,}\b/gi, // Email addresses (optional)
];

const redactSensitiveData = (data: unknown): unknown => {
  if (!isProduction) return data;

  if (typeof data === 'string') {
    let redacted = data;
    SENSITIVE_PATTERNS.forEach((pattern) => {
      redacted = redacted.replace(pattern, '[REDACTED]');
    });
    return redacted;
  }

  if (Array.isArray(data)) {
    return data.map(redactSensitiveData);
  }

  if (data && typeof data === 'object') {
    const redacted: Record<string, unknown> = {};
    Object.entries(data).forEach(([key, value]) => {
      // Redact entire value if key is sensitive
      if (
        ['token', 'password', 'secret', 'apiKey', 'authorization'].some((pattern) =>
          key.toLowerCase().includes(pattern)
        )
      ) {
        redacted[key] = '[REDACTED]';
      } else {
        redacted[key] = redactSensitiveData(value);
      }
    });
    return redacted;
  }

  return data;
};

class Logger {
  private log(level: LogLevel, message: string, data?: unknown): void {
    const entry: LogEntry = {
      level,
      message,
      data: redactSensitiveData(data),
      timestamp: new Date().toISOString(),
    };

    // In production, only log warnings and errors
    if (isProduction && (level === 'debug' || level === 'info')) {
      return;
    }

    const consoleMethod = level === 'error' ? console.error : level === 'warn' ? console.warn : console.log;

    if (data) {
      consoleMethod(`[${entry.level.toUpperCase()}] ${entry.message}`, entry.data);
    } else {
      consoleMethod(`[${entry.level.toUpperCase()}] ${entry.message}`);
    }

    // In production, send errors to external logging service
    if (isProduction && level === 'error') {
      // This would integrate with Sentry or similar
      this.sendToExternalLogger(entry);
    }
  }

  private sendToExternalLogger(entry: LogEntry): void {
    // Placeholder for external logging service integration
    // In real implementation, this would send to Sentry, Datadog, etc.
  }

  debug(message: string, data?: unknown): void {
    this.log('debug', message, data);
  }

  info(message: string, data?: unknown): void {
    this.log('info', message, data);
  }

  warn(message: string, data?: unknown): void {
    this.log('warn', message, data);
  }

  error(message: string, data?: unknown): void {
    this.log('error', message, data);
  }

  // Convenience method for logging API errors
  apiError(endpoint: string, error: unknown): void {
    this.error(`API Error: ${endpoint}`, {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
  }

  // Convenience method for logging navigation
  navigation(screen: string, params?: unknown): void {
    this.debug(`Navigation: ${screen}`, params);
  }
}

export const logger = new Logger();
