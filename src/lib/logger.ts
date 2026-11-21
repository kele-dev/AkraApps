export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface StructuredLogEntry {
  level: LogLevel;
  timestamp: string;
  event: string;
  context: Record<string, unknown>;
}

const SENSITIVE_KEYS = new Set([
  'email',
  'token',
  'password',
  'secret',
  'authorization',
  'cookie',
  'apikey',
  'api_key',
  'uid',
  'displayname',
  'username',
]);

const sanitizeContext = (context: Record<string, unknown> = {}): Record<string, unknown> => {
  const sanitized: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(context)) {
    if (SENSITIVE_KEYS.has(key.toLowerCase())) {
      sanitized[key] = '[REDACTED]';
      continue;
    }

    if (key === 'error') {
      if (value instanceof Error) {
        sanitized.errorName = value.name;
        sanitized.errorMessage = value.message;
      } else if (value !== undefined && value !== null) {
        sanitized.errorMessage = String(value);
      }
      continue;
    }

    sanitized[key] = value;
  }

  return sanitized;
};

/** Build a structured, PII-redacted log record. */
export const formatStructuredLog = (
  level: LogLevel,
  event: string,
  context: Record<string, unknown> = {}
): StructuredLogEntry => ({
  level,
  timestamp: new Date().toISOString(),
  event,
  context: sanitizeContext(context),
});

const emit = (level: LogLevel, event: string, context?: Record<string, unknown>) => {
  const entry = formatStructuredLog(level, event, context);
  if (level === 'error') {
    console.error(entry.event, entry);
  } else if (level === 'warn') {
    console.warn(entry.event, entry);
  } else if (level === 'debug') {
    console.debug(entry.event, entry);
  } else {
    console.info(entry.event, entry);
  }
};

export const logger = {
  debug: (event: string, context?: Record<string, unknown>) => emit('debug', event, context),
  info: (event: string, context?: Record<string, unknown>) => emit('info', event, context),
  warn: (event: string, context?: Record<string, unknown>) => emit('warn', event, context),
  error: (event: string, context?: Record<string, unknown>) => emit('error', event, context),
};
