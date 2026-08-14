import promClient from 'prom-client';

export class MetricsService {
  public static readonly register = new promClient.Registry();

  public static readonly eventsRecordedTotal = new promClient.Counter({
    name: 'events_recorded_total',
    help: 'Total recordEvent mutation requests received',
    registers: [MetricsService.register]
  });

  public static readonly eventsProcessedTotal = new promClient.Counter({
    name: 'events_processed_total',
    help: 'Total events successfully processed through pipeline',
    registers: [MetricsService.register]
  });

  public static readonly pipelineDurationHistogram = new promClient.Histogram({
    name: 'event_pipeline_duration_ms',
    help: 'Duration of event processing pipeline in milliseconds',
    buckets: [1, 5, 10, 25, 50, 100, 250, 500, 1000],
    registers: [MetricsService.register]
  });

  public static readonly processorErrorsTotal = new promClient.Counter({
    name: 'processor_errors_total',
    help: 'Total errors encountered by event processors',
    labelNames: ['processor'],
    registers: [MetricsService.register]
  });

  static getMetricsContentType(): string {
    return MetricsService.register.contentType;
  }

  static async getMetrics(): Promise<string> {
    return MetricsService.register.metrics();
  }
}
