import { IEventRecordProcessor } from './IEventRecordProcessor.js';
import { EventRecord } from '../domain/EventRecord.js';
import { IEventRecordStore } from '../data/IEventRecordStore.js';

export class StoreProcessor implements IEventRecordProcessor {
  name = 'StoreProcessor';

  constructor(private eventRecordStore: IEventRecordStore) {}

  async process(event: EventRecord): Promise<void> {
    await this.eventRecordStore.insert(event);
  }
}
