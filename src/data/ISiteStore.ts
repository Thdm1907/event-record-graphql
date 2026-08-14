import { SiteInfo } from '../domain/SiteInfo.js';

export interface ISiteStore {
  insert(site: Omit<SiteInfo, 'siteId'>): Promise<SiteInfo>;
  findAll(): Promise<SiteInfo[]>;
  findById(siteId: number): Promise<SiteInfo | null>;
  distinctCountries(): Promise<{ country: string; count: number }[]>;
}
