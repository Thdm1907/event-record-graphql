import { PrismaClient } from '@prisma/client';
import { IEventRecordStore } from '../IEventRecordStore.js';
import { EventRecord } from '../../domain/EventRecord.js';

export class PrismaEventRecordStore implements IEventRecordStore {
  constructor(private prisma: PrismaClient) {}

  async insert(event: EventRecord): Promise<EventRecord> {
    const created = await this.prisma.eventRecord.create({
      data: {
        id: event.id,
        description: event.description,
        eventDateTime: event.eventDateTime,
        eventGuid: event.eventGuid,
        eventType: event.eventType,
        metadata: event.metadata,
        createdAt: new Date(event.createdAt),
        siteId: event.siteId
      }
    });

    return {
      id: created.id,
      description: created.description,
      eventDateTime: created.eventDateTime,
      eventGuid: created.eventGuid,
      eventType: created.eventType,
      metadata: created.metadata,
      siteId: created.siteId,
      createdAt: created.createdAt.toISOString()
    };
  }

  async findAll(skip: number = 0, take: number = 100): Promise<EventRecord[]> {
    const records = await this.prisma.eventRecord.findMany({
      skip,
      take,
      orderBy: { createdAt: 'desc' }
    });

    return records.map((r) => ({
      id: r.id,
      description: r.description,
      eventDateTime: r.eventDateTime,
      eventGuid: r.eventGuid,
      eventType: r.eventType,
      metadata: r.metadata,
      siteId: r.siteId,
      createdAt: r.createdAt.toISOString()
    }));
  }

  async findByType(type: string): Promise<EventRecord[]> {
    const records = await this.prisma.eventRecord.findMany({
      where: {
        eventType: {
          equals: type
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return records.map((r) => ({
      id: r.id,
      description: r.description,
      eventDateTime: r.eventDateTime,
      eventGuid: r.eventGuid,
      eventType: r.eventType,
      metadata: r.metadata,
      siteId: r.siteId,
      createdAt: r.createdAt.toISOString()
    }));
  }

  async findBySiteId(siteId: number): Promise<EventRecord[]> {
    const records = await this.prisma.eventRecord.findMany({
      where: { siteId },
      orderBy: { createdAt: 'desc' }
    });

    return records.map((r) => ({
      id: r.id,
      description: r.description,
      eventDateTime: r.eventDateTime,
      eventGuid: r.eventGuid,
      eventType: r.eventType,
      metadata: r.metadata,
      siteId: r.siteId,
      createdAt: r.createdAt.toISOString()
    }));
  }

  async distinctTypes(): Promise<{ type: string; count: number }[]> {
    const grouped = await this.prisma.eventRecord.groupBy({
      by: ['eventType'],
      _count: {
        eventType: true
      }
    });

    return grouped.map((g) => ({
      type: g.eventType,
      count: g._count.eventType
    }));
  }
}
