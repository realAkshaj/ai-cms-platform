import pino from 'pino';
import type { TransportTargetOptions } from 'pino';
import { resolve } from 'path';

const LOG_LEVEL = process.env.LOG_LEVEL || 'info';
const NODE_ENV = process.env.NODE_ENV || 'development';
const SERVICE_NAME = 'ai-cms-api';
const SERVICE_VERSION = process.env.npm_package_version || '1.0.0';

// Resolve pino-loki path to handle monorepo hoisting
function resolvePinoLoki(): string {
  try {
    return require.resolve('pino-loki');
  } catch {
    return 'pino-loki';
  }
}

// Build transport targets
const targets: TransportTargetOptions[] = [
  {
    target: 'pino/file',
    options: { destination: 1 }, // stdout
    level: LOG_LEVEL,
  },
];

// Optional: Loki transport for Grafana Cloud
if (process.env.LOKI_HOST) {
  targets.push({
    target: resolvePinoLoki(),
    options: {
      host: process.env.LOKI_HOST,
      basicAuth: {
        username: process.env.LOKI_USERNAME || '',
        password: process.env.LOKI_PASSWORD || '',
      },
      batching: true,
      interval: 5,
      labels: { service: SERVICE_NAME, env: NODE_ENV },
    },
    level: LOG_LEVEL,
  });
}

const transport = targets.length > 1
  ? pino.transport({ targets })
  : pino.transport(targets[0]);

// Mixin to inject OTel trace context into every log line
function traceMixin(): Record<string, string> {
  try {
    const { trace, context } = require('@opentelemetry/api');
    const span = trace.getSpan(context.active());
    if (span) {
      const sc = span.spanContext();
      return { traceId: sc.traceId, spanId: sc.spanId };
    }
  } catch {
    // OTel not available — skip
  }
  return {};
}

export const logger = pino(
  {
    level: LOG_LEVEL,
    base: {
      service: SERVICE_NAME,
      env: NODE_ENV,
      version: SERVICE_VERSION,
    },
    timestamp: pino.stdTimeFunctions.isoTime,
    mixin: traceMixin,
    redact: ['req.headers.authorization', 'req.headers.cookie'],
    formatters: {
      level(label: string) {
        return { level: label };
      },
    },
  },
  transport,
);

/**
 * Create a child logger scoped to a module/context.
 * Usage: const log = createLogger('ai-service');
 */
export function createLogger(context: string) {
  return logger.child({ context });
}

export default logger;
