import { Registry, Counter, Histogram, collectDefaultMetrics } from 'prom-client';

export const registry = new Registry();

// Collect Node.js default metrics (event loop lag, heap size, GC, etc.)
collectDefaultMetrics({ register: registry });

// --- Content Generation Metrics ---

export const contentGenerationDuration = new Histogram({
  name: 'content_generation_duration_seconds',
  help: 'Duration of AI content generation in seconds',
  labelNames: ['type', 'tone', 'length', 'status'] as const,
  buckets: [1, 2, 5, 10, 15, 20, 30, 45, 60],
  registers: [registry],
});

export const contentQualityScore = new Histogram({
  name: 'content_quality_score',
  help: 'Quality score of generated content',
  labelNames: ['type', 'tone'] as const,
  buckets: [0, 30, 50, 60, 70, 75, 80, 85, 90, 95, 100],
  registers: [registry],
});

export const contentRegenerationTotal = new Counter({
  name: 'content_regeneration_total',
  help: 'Total number of content regenerations due to low quality',
  labelNames: ['type', 'original_tone'] as const,
  registers: [registry],
});

export const geminiTokensUsed = new Counter({
  name: 'gemini_tokens_used_total',
  help: 'Total tokens consumed by Gemini API calls',
  labelNames: ['operation'] as const,
  registers: [registry],
});

export const contentRequestsTotal = new Counter({
  name: 'content_requests_total',
  help: 'Total content API requests',
  labelNames: ['endpoint', 'method', 'status_code'] as const,
  registers: [registry],
});

export const generationErrorsTotal = new Counter({
  name: 'generation_errors_total',
  help: 'Total AI generation errors',
  labelNames: ['type', 'error_category'] as const,
  registers: [registry],
});
