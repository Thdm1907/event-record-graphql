import fs from 'fs/promises';
import path from 'path';
import { ISiteStore } from '../ISiteStore.js';
import { SiteInfo } from '../../domain/SiteInfo.js';

export class JsonSiteStore implements ISiteStore {
  private filePath: string;

  constructor(filePath?: string) {
    this.filePath = filePath || path.join(process.cwd(), 'data', 'sites.json');
  }

  private async readAll(): Promise<SiteInfo[]> {
    try {
      const data = await fs.readFile(this.filePath, 'utf-8');
      return JSON.parse(data) as SiteInfo[];
    } catch (err: any) {
      if (err.code === 'ENOENT') {
        return [];
      }
      throw err;
    }
  }

  private async writeAll(sites: SiteInfo[]): Promise<void> {
    const dir = path.dirname(this.filePath);
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(this.filePath, JSON.stringify(sites, null, 2), 'utf-8');
  }

  async insert(siteInput: Omit<SiteInfo, 'siteId'>): Promise<SiteInfo> {
    const sites = await this.readAll();
    const maxId = sites.reduce((max, s) => Math.max(max, s.siteId), 0);
    const newSite: SiteInfo = {
      ...siteInput,
      siteId: maxId + 1
    };
    sites.push(newSite);
    await this.writeAll(sites);
    return newSite;
  }

  async findAll(): Promise<SiteInfo[]> {
    return this.readAll();
  }

  async findById(siteId: number): Promise<SiteInfo | null> {
    const sites = await this.readAll();
    return sites.find((s) => s.siteId === siteId) || null;
  }

  async distinctCountries(): Promise<{ country: string; count: number }[]> {
    const sites = await this.readAll();
    const countsMap = new Map<string, number>();

    for (const site of sites) {
      const count = countsMap.get(site.country) || 0;
      countsMap.set(site.country, count + 1);
    }

    return Array.from(countsMap.entries()).map(([country, count]) => ({ country, count }));
  }
}
