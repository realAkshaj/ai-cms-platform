import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { OTLPMetricExporter } from '@opentelemetry/exporter-metrics-otlp-http';
import { PeriodicExportingMetricReader } from '@opentelemetry/sdk-metrics';
import { resourceFromAttributes } from '@opentelemetry/resources';
import {
  ATTR_SERVICE_NAME,
  ATTR_SERVICE_VERSION,
} from '@opentelemetry/semantic-conventions';

const OTEL_ENDPOINT = process.env.OTEL_EXPORTER_OTLP_ENDPOINT;
const OTEL_HEADERS = process.env.OTEL_EXPORTER_OTLP_HEADERS;

// Parse headers string into object: "Key1=Value1,Key2=Value2"
function parseHeaders(headersStr?: string): Record<string, string> | undefined {
  if (!headersStr) return undefined;
  return Object.fromEntries(
    headersStr.split(',').map((h) => {
      const [key, ...val] = h.split('=');
      return [key.trim(), val.join('=').trim()];
    }),
  );
}

const headers = parseHeaders(OTEL_HEADERS);

// Only create exporters when endpoint is configured (production)
const traceExporter = OTEL_ENDPOINT
  ? new OTLPTraceExporter({
      url: `${OTEL_ENDPOINT}/v1/traces`,
      headers,
    })
  : undefined;

// Metrics exporter — ships OTel-collected metrics (runtime, HTTP) to Grafana Cloud
const metricReader = OTEL_ENDPOINT
  ? new PeriodicExportingMetricReader({
      exporter: new OTLPMetricExporter({
        url: `${OTEL_ENDPOINT}/v1/metrics`,
        headers,
      }),
      exportIntervalMillis: 15_000, // Push every 15 seconds
    })
  : undefined;

const sdk = new NodeSDK({
  resource: resourceFromAttributes({
    [ATTR_SERVICE_NAME]: 'ai-cms-api',
    [ATTR_SERVICE_VERSION]: process.env.npm_package_version || '1.0.0',
    'deployment.environment': process.env.NODE_ENV || 'development',
  }),
  traceExporter,
  ...(metricReader && { metricReader }),
  instrumentations: [
    getNodeAutoInstrumentations({
      '@opentelemetry/instrumentation-fs': { enabled: false },
      '@opentelemetry/instrumentation-http': { enabled: true },
      '@opentelemetry/instrumentation-express': { enabled: true },
      '@opentelemetry/instrumentation-pg': { enabled: true },
    }),
  ],
});

sdk.start();

process.on('SIGTERM', () => {
  sdk.shutdown().catch(() => {});
});

export { sdk };
