import { EventRecord } from '../domain/EventRecord.js';

export interface IEventRecordProcessor {
  name: string;
  process(event: EventRecord): Promise<void>;
}
