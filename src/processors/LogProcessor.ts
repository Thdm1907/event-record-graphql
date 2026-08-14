import pino from 'pino';
import { IEventRecordProcessor } from './IEventRecordProcessor.js';
import { EventRecord } from '../domain/EventRecord.js';

const logger = pino({
  name: 'LogProcessor'
});

export class LogProcessor implements IEventRecordProcessor {
  name = 'LogProcessor';

  async process(event: EventRecord): Promise<void> {
    logger.info(
      { id: event.id, siteId: event.siteId, type: event.eventType, description: event.description },
      'Processing event in LogProcessor'
    );
  }
}
