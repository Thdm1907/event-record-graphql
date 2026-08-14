import fs from 'fs/promises';
import path from 'path';
import { IEventRecordStore } from '../IEventRecordStore.js';
import { EventRecord } from '../../domain/EventRecord.js';

export class JsonEventRecordStore implements IEventRecordStore {
  private filePath: string;

  constructor(filePath?: string) {
    this.filePath = filePath || path.join(process.cwd(), 'data', 'events.json');
  }

  private async readAll(): Promise<EventRecord[]> {
    try {
      const data = await fs.readFile(this.filePath, 'utf-8');
      return JSON.parse(data) as EventRecord[];
    } catch (err: any) {
      if (err.code === 'ENOENT') {
        return [];
      }
      throw err;
    }
  }

  private async writeAll(events: EventRecord[]): Promise<void> {
    const dir = path.dirname(this.filePath);
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(this.filePath, JSON.stringify(events, null, 2), 'utf-8');
  }

  async insert(event: EventRecord): Promise<EventRecord> {
    const events = await this.readAll();
    events.push(event);
    await this.writeAll(events);
    return event;
  }

  async findAll(skip: number = 0, take: number = 100): Promise<EventRecord[]> {
    const events = await this.readAll();
    return events.slice(skip, skip + take);
  }

  async findByType(type: string): Promise<EventRecord[]> {
    const events = await this.readAll();
    return events.filter((e) => e.eventType.toUpperCase() === type.toUpperCase());
  }

  async findBySiteId(siteId: number): Promise<EventRecord[]> {
    const events = await this.readAll();
    return events.filter((e) => e.siteId === siteId);
  }

  async distinctTypes(): Promise<{ type: string; count: number }[]> {
    const events = await this.readAll();
    const countsMap = new Map<string, number>();

    for (const event of events) {
      const count = countsMap.get(event.eventType) || 0;
      countsMap.set(event.eventType, count + 1);
    }

    return Array.from(countsMap.entries()).map(([type, count]) => ({ type, count }));
  }
}
