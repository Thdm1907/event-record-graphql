import { PrismaClient } from '@prisma/client';
import { ISiteStore } from '../ISiteStore.js';
import { SiteInfo } from '../../domain/SiteInfo.js';

export class PrismaSiteStore implements ISiteStore {
  constructor(private prisma: PrismaClient) {}

  async insert(site: Omit<SiteInfo, 'siteId'>): Promise<SiteInfo> {
    const created = await this.prisma.siteInfo.create({
      data: {
        siteName: site.siteName,
        addressLine1: site.addressLine1,
        addressLine2: site.addressLine2 || null,
        city: site.city,
        state: site.state,
        country: site.country,
        postalCode: site.postalCode
      }
    });

    return {
      siteId: created.siteId,
      siteName: created.siteName,
      addressLine1: created.addressLine1,
      addressLine2: created.addressLine2,
      city: created.city,
      state: created.state,
      country: created.country,
      postalCode: created.postalCode
    };
  }

  async findAll(): Promise<SiteInfo[]> {
    const sites = await this.prisma.siteInfo.findMany({
      orderBy: { siteId: 'asc' }
    });

    return sites.map((s) => ({
      siteId: s.siteId,
      siteName: s.siteName,
      addressLine1: s.addressLine1,
      addressLine2: s.addressLine2,
      city: s.city,
      state: s.state,
      country: s.country,
      postalCode: s.postalCode
    }));
  }

  async findById(siteId: number): Promise<SiteInfo | null> {
    const site = await this.prisma.siteInfo.findUnique({
      where: { siteId }
    });

    if (!site) return null;

    return {
      siteId: site.siteId,
      siteName: site.siteName,
      addressLine1: site.addressLine1,
      addressLine2: site.addressLine2,
      city: site.city,
      state: site.state,
      country: site.country,
      postalCode: site.postalCode
    };
  }

  async distinctCountries(): Promise<{ country: string; count: number }[]> {
    const grouped = await this.prisma.siteInfo.groupBy({
      by: ['country'],
      _count: {
        country: true
      }
    });

    return grouped.map((g) => ({
      country: g.country,
      count: g._count.country
    }));
  }
}
