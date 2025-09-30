type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const REDACT_KEYS = ['access_token', 'refresh_token', 'id_token', 'password', 'email'];

function redact(value: unknown): unknown {
  if (value == null) return value;
  if (typeof value === 'string') return value.replace(/[A-Za-z0-9-_]{8,}\.[A-Za-z0-9-_]{8,}\.[A-Za-z0-9-_]{8,}/g, '[redacted.jwt]');
  if (Array.isArray(value)) return value.map(redact);
  if (typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      out[k] = REDACT_KEYS.includes(k) ? '[redacted]' : redact(v);
    }
    return out;
  }
  return value;
}

function log(level: LogLevel, message: string, context?: Record<string, unknown>) {
  const isProd = process.env.NODE_ENV === 'production';
  const payload = isProd ? redact(context) : context;
  // eslint-disable-next-line no-console
  console[level](`[${level.toUpperCase()}] ${message}`, payload ?? '');
}

export const logger = {
  debug: (msg: string, ctx?: Record<string, unknown>) => log('debug', msg, ctx),
  info: (msg: string, ctx?: Record<string, unknown>) => log('info', msg, ctx),
  warn: (msg: string, ctx?: Record<string, unknown>) => log('warn', msg, ctx),
  error: (msg: string, ctx?: Record<string, unknown>) => log('error', msg, ctx),
  redact,
};

