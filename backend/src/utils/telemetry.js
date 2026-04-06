const { NodeSDK } = require('@opentelemetry/sdk-node');
const { getNodeAutoInstrumentations } = require('@opentelemetry/auto-instrumentations-node');
const { OTLPTraceExporter } = require('@opentelemetry/exporter-trace-otlp-grpc');
const { Resource } = require('@opentelemetry/resources');
const { SemanticResourceAttributes } = require('@opentelemetry/semantic-conventions');

/**
 * PRODUCTION-GRADE OBSERVABILITY (OpenTelemetry)
 * Provides distributed tracing for the entire request lifecycle.
 * Exports to any OTLP-compliant collector (Jaeger, Honeycomb, Zipkin).
 */

const sdk = new NodeSDK({
  resource: new Resource({
    [SemanticResourceAttributes.SERVICE_NAME]: process.env.OTEL_SERVICE_NAME || 'syncmesh-forge-backend',
    [SemanticResourceAttributes.DEPLOYMENT_ENVIRONMENT]: process.env.NODE_ENV || 'development',
  }),
  traceExporter: new OTLPTraceExporter({
    url: process.env.OTEL_EXPORTER_OTLP_ENDPOINT || 'http://localhost:4317',
  }),
  instrumentations: [
    getNodeAutoInstrumentations({
      // We can disable specific instrumentations if they're too noisy
      '@opentelemetry/instrumentation-fs': { enabled: false },
    }),
  ],
});

// Graceful shutdown
process.on('SIGTERM', () => {
  sdk.shutdown()
    .then(() => console.log('Tracing terminated'))
    .catch((error) => console.log('Error terminating tracing', error));
});

module.exports = {
  start: () => {
    try {
      sdk.start();
      console.log('✅ OpenTelemetry tracing started');
    } catch (err) {
      console.warn('⚠️ OpenTelemetry failed to start (non-fatal):', err.message);
    }
  }
};
