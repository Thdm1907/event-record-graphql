import { v4 as uuidv4 } from 'uuid';
import { PubSub } from '@graphql-yoga/subscription';
import { EventRecord } from '../domain/EventRecord.js';
import { ISiteStore } from '../data/ISiteStore.js';
import { EngineManager } from './EngineManager.js';
import { MetricsService } from '../metrics/MetricsService.js';

export interface EventRecordInputData {
  description: string;
  eventDateTime: string;
  eventGuid?: string;
  eventType: string;
  metadata: string;
  siteId: number;
}

export const EVENT_RECORDED_TOPIC = 'EVENT_RECORDED';

export class EventRecordService {
  constructor(
    private siteStore: ISiteStore,
    private engineManager: EngineManager,
    private pubSub: PubSub<any>
  ) {}

  async record(input: EventRecordInputData): Promise<EventRecord> {
    MetricsService.eventsRecordedTotal.inc();

    // Referentially validate siteId
    const site = await this.siteStore.findById(input.siteId);
    if (!site) {
      throw new Error(`Invalid siteId: Site with ID ${input.siteId} does not exist.`);
    }

    const now = new Date().toISOString();
    const event: EventRecord = {
      id: uuidv4(),
      description: input.description,
      eventDateTime: input.eventDateTime,
      eventGuid: input.eventGuid || uuidv4(),
      eventType: input.eventType,
      metadata: input.metadata,
      siteId: input.siteId,
      createdAt: now
    };

    const timer = MetricsService.pipelineDurationHistogram.startTimer();
    try {
      // TODO: replace with queue.enqueue() for async ingestion in high-throughput setup
      await this.engineManager.processEvent(event);
      MetricsService.eventsProcessedTotal.inc();
    } finally {
      timer();
    }

    await this.pubSub.publish(EVENT_RECORDED_TOPIC, event);

    return event;
  }
}
