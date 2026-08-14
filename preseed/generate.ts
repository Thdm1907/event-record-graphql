import fs from 'fs';
import path from 'path';
import { faker } from '@faker-js/faker';
import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

interface SiteInfo {
  siteId: number;
  siteName: string;
  addressLine1: string;
  addressLine2: string | null;
  city: string;
  state: string;
  country: string;
  postalCode: string;
}

interface EventRecord {
  id: string;
  description: string;
  eventDateTime: string;
  eventGuid: string;
  eventType: string;
  metadata: string;
  siteId: number;
  createdAt: string;
}

const EVENT_TYPES = [
  'LOGIN',
  'LOGOUT',
  'PURCHASE',
  'SENSOR_ALERT',
  'MAINTENANCE',
  'AUDIT'
];

const EVENT_DESCRIPTIONS: Record<string, string[]> = {
  LOGIN: ['User login succeeded', 'Mobile app session initiated', 'SSO authentication successful', 'Admin login from console'],
  LOGOUT: ['User logged out cleanly', 'Session timeout expired', 'Token revoked by system', 'User closed session'],
  PURCHASE: ['Item purchased in store', 'Subscription renewed', 'Bulk inventory ordered', 'Gift card redeemed'],
  SENSOR_ALERT: ['Temperature threshold exceeded', 'Motion sensor triggered', 'Pressure drop detected', 'Door opened outside operating hours'],
  MAINTENANCE: ['Routine HVAC service', 'Firmware upgrade completed', 'Backup generator tested', 'Filter replaced'],
  AUDIT: ['Security policy updated', 'User permissions modified', 'Export report downloaded', 'System settings changed']
};

function getRandomElement<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)]!;
}

async function generatePreseedData() {
  console.log('Starting preseed generation...');
  const outputDir = path.resolve(__dirname, 'data');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const sitesJsonPath = path.join(outputDir, 'sites.json');
  const eventsJsonPath = path.join(outputDir, 'events.json');
  const dbPath = path.join(outputDir, 'events.db');

  if (fs.existsSync(dbPath)) {
    fs.unlinkSync(dbPath);
  }

  console.log('Generating 20 sites...');
  const sites: SiteInfo[] = [];
  const countries = ['United States', 'Canada', 'United Kingdom', 'Australia'];

  for (let i = 1; i <= 20; i++) {
    const country = getRandomElement(countries);
    sites.push({
      siteId: i,
      siteName: `${faker.company.name()} - Facility #${i}`,
      addressLine1: faker.location.streetAddress(),
      addressLine2: Math.random() > 0.7 ? faker.location.secondaryAddress() : null,
      city: faker.location.city(),
      state: faker.location.state(),
      country,
      postalCode: faker.location.zipCode()
    });
  }

  console.log('Generating events per site (random 5 to 300)...');
  const events: EventRecord[] = [];

  for (const site of sites) {
    const eventCount = Math.floor(Math.random() * (300 - 5 + 1)) + 5;
    for (let j = 0; j < eventCount; j++) {
      const type = getRandomElement(EVENT_TYPES);
      const descList = EVENT_DESCRIPTIONS[type] || ['Generic event occurred'];
      const desc = getRandomElement(descList);
      const eventDate = faker.date.recent({ days: 30 });
      const createdDate = new Date(eventDate.getTime() + Math.floor(Math.random() * 5000));

      events.push({
        id: uuidv4(),
        description: desc,
        eventDateTime: eventDate.toISOString(),
        eventGuid: uuidv4(),
        eventType: type,
        metadata: JSON.stringify({
          source: 'preseed-generator',
          severity: Math.random() > 0.8 ? 'HIGH' : 'NORMAL',
          payload: { tick: j + 1 }
        }),
        siteId: site.siteId,
        createdAt: createdDate.toISOString()
      });
    }
  }

  console.log(`Writing ${sites.length} sites to ${sitesJsonPath}...`);
  fs.writeFileSync(sitesJsonPath, JSON.stringify(sites, null, 2), 'utf-8');

  console.log(`Writing ${events.length} events to ${eventsJsonPath}...`);
  fs.writeFileSync(eventsJsonPath, JSON.stringify(events, null, 2), 'utf-8');

  console.log(`Populating SQLite database at ${dbPath} using Prisma...`);
  const formattedDbUrl = `file:${dbPath.replace(/\\/g, '/')}`;
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: formattedDbUrl
      }
    }
  });

  await prisma.$connect();

  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "SiteInfo" (
      "siteId" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
      "siteName" TEXT NOT NULL,
      "addressLine1" TEXT NOT NULL,
      "addressLine2" TEXT,
      "city" TEXT NOT NULL,
      "state" TEXT NOT NULL,
      "country" TEXT NOT NULL,
      "postalCode" TEXT NOT NULL
    );
  `);

  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "EventRecord" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "description" TEXT NOT NULL,
      "eventDateTime" TEXT NOT NULL,
      "eventGuid" TEXT NOT NULL UNIQUE,
      "eventType" TEXT NOT NULL,
      "metadata" TEXT NOT NULL,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "siteId" INTEGER NOT NULL,
      FOREIGN KEY ("siteId") REFERENCES "SiteInfo" ("siteId") ON DELETE RESTRICT ON UPDATE CASCADE
    );
  `);

  for (const s of sites) {
    await prisma.siteInfo.create({
      data: {
        siteName: s.siteName,
        addressLine1: s.addressLine1,
        addressLine2: s.addressLine2,
        city: s.city,
        state: s.state,
        country: s.country,
        postalCode: s.postalCode
      }
    });
  }

  const chunkSize = 100;
  for (let i = 0; i < events.length; i += chunkSize) {
    const chunk = events.slice(i, i + chunkSize);
    await prisma.$transaction(
      chunk.map((e) =>
        prisma.eventRecord.create({
          data: {
            id: e.id,
            description: e.description,
            eventDateTime: e.eventDateTime,
            eventGuid: e.eventGuid,
            eventType: e.eventType,
            metadata: e.metadata,
            createdAt: new Date(e.createdAt),
            siteId: e.siteId
          }
        })
      )
    );
  }

  await prisma.$disconnect();

  console.log('✅ Preseed generation complete!');
  console.log(`- Sites generated: ${sites.length}`);
  console.log(`- Events generated: ${events.length}`);
  console.log(`- Files created in ${outputDir}:`);
  console.log('  * sites.json');
  console.log('  * events.json');
  console.log('  * events.db');
}

generatePreseedData().catch((err) => {
  console.error('Preseed failed:', err);
  process.exit(1);
});
