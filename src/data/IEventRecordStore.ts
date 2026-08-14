import { EventRecord } from '../domain/EventRecord.js';

export interface IEventRecordStore {
  insert(event: EventRecord): Promise<EventRecord>;
  findAll(skip?: number, take?: number): Promise<EventRecord[]>;
  findByType(type: string): Promise<EventRecord[]>;
  findBySiteId(siteId: number): Promise<EventRecord[]>;
  distinctTypes(): Promise<{ type: string; count: number }[]>;
}
