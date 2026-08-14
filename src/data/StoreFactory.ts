import { PrismaClient } from '@prisma/client';
import { IEventRecordStore } from './IEventRecordStore.js';
import { ISiteStore } from './ISiteStore.js';
import { JsonEventRecordStore } from './json/JsonEventRecordStore.js';
import { JsonSiteStore } from './json/JsonSiteStore.js';
import { PrismaEventRecordStore } from './prisma/PrismaEventRecordStore.js';
import { PrismaSiteStore } from './prisma/PrismaSiteStore.js';

export interface Stores {
  eventRecordStore: IEventRecordStore;
  siteStore: ISiteStore;
  prisma?: PrismaClient;
}

export function createStores(): Stores {
  const storeType = (process.env.DATA_STORE || 'json').toLowerCase();

  if (storeType === 'sqlite') {
    const prisma = new PrismaClient();
    return {
      eventRecordStore: new PrismaEventRecordStore(prisma),
      siteStore: new PrismaSiteStore(prisma),
      prisma
    };
  }

  return {
    eventRecordStore: new JsonEventRecordStore(),
    siteStore: new JsonSiteStore()
  };
}
