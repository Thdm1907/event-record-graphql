import { faker } from '@faker-js/faker';
import { v4 as uuidv4 } from 'uuid';

export interface EventRecordInput {
  description: string;
  eventDateTime: string;
  eventGuid: string;
  eventType: string;
  metadata: string;
  siteId: number;
}

const DESCRIPTIONS: Record<string, string[]> = {
  LOGIN: ['User session started', 'SSO login success', 'API key authenticated', 'Console admin login'],
  LOGOUT: ['User logged out', 'Session expired', 'Auth token invalidated'],
  PURCHASE: ['E-commerce order placed', 'Monthly invoice paid', 'Credit card transaction cleared'],
  SENSOR_ALERT: ['Temperature anomaly detected', 'Motion sensor active', 'Vibration alert triggered'],
  MAINTENANCE: ['Routine health check completed', 'Database index defragmented', 'Security patch applied'],
  AUDIT: ['User permissions updated', 'System config exported', 'Password policy changed']
};

export function createRandomEventInput(allowedSiteIds: number[], allowedTypes: string[]): EventRecordInput {
  const siteId = allowedSiteIds[Math.floor(Math.random() * allowedSiteIds.length)] || 1;
  const eventType = allowedTypes[Math.floor(Math.random() * allowedTypes.length)] || 'LOGIN';
  const descList = DESCRIPTIONS[eventType] || ['Live event recorded'];
  const description = descList[Math.floor(Math.random() * descList.length)] || 'Event recorded';

  return {
    description,
    eventDateTime: new Date().toISOString(),
    eventGuid: uuidv4(),
    eventType,
    metadata: JSON.stringify({
      generator: 'event-generator-cli',
      clientVersion: '1.0.0',
      payload: { randomFactor: Math.random() }
    }),
    siteId
  };
}
