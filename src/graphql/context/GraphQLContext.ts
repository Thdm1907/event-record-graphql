import DataLoader from 'dataloader';
import { PubSub } from '@graphql-yoga/subscription';
import { ISiteStore } from '../../data/ISiteStore.js';
import { IEventRecordStore } from '../../data/IEventRecordStore.js';
import { EventRecordService } from '../../processing/EventRecordService.js';
import { SiteInfo } from '../../domain/SiteInfo.js';

export interface GraphQLContext {
  siteStore: ISiteStore;
  eventRecordStore: IEventRecordStore;
  eventRecordService: EventRecordService;
  pubSub: PubSub<any>;
  siteLoader: DataLoader<number, SiteInfo | null>;
}

export function createSiteLoader(siteStore: ISiteStore): DataLoader<number, SiteInfo | null> {
  return new DataLoader<number, SiteInfo | null>(async (siteIds: readonly number[]) => {
    const sites = await siteStore.findAll();
    const siteMap = new Map<number, SiteInfo>();
    for (const site of sites) {
      siteMap.set(site.siteId, site);
    }
    return siteIds.map((id) => siteMap.get(id) || null);
  });
}
