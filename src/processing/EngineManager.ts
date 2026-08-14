import { IEventRecordProcessor } from '../processors/IEventRecordProcessor.js';
import { EventRecord } from '../domain/EventRecord.js';
import { MetricsService } from '../metrics/MetricsService.js';

export class EngineManager {
  private processors: IEventRecordProcessor[] = [];

  registerProcessor(processor: IEventRecordProcessor): void {
    this.processors.push(processor);
  }

  async processEvent(event: EventRecord): Promise<void> {
    for (const processor of this.processors) {
      try {
        await processor.process(event);
      } catch (error) {
        MetricsService.processorErrorsTotal.inc({ processor: processor.name });
        throw new Error(`Processor '${processor.name}' failed: ${(error as Error).message}`);
      }
    }
  }
}
