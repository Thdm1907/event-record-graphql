import { createClient, Client } from 'graphql-ws';
import WebSocket from 'ws';
import pino from 'pino';

const logger = pino({
  transport: {
    target: 'pino-pretty',
    options: { colorize: true }
  }
});

const ON_EVENT_RECORDED_SUBSCRIPTION = `
  subscription OnEventRecorded {
    onEventRecorded {
      id
      description
      eventType
      siteId
      eventDateTime
      createdAt
    }
  }
`;

export class EventSubscriber {
  private client: Client | null = null;
  private unsubscribe: (() => void) | null = null;

  start(wsEndpoint: string) {
    logger.info({ wsEndpoint }, 'Connecting WebSocket subscription for onEventRecorded...');

    this.client = createClient({
      url: wsEndpoint,
      webSocketImpl: WebSocket
    });

    this.unsubscribe = this.client.subscribe(
      { query: ON_EVENT_RECORDED_SUBSCRIPTION },
      {
        next: (data: any) => {
          const event = data?.data?.onEventRecorded;
          if (event) {
            logger.info(
              { id: event.id, siteId: event.siteId, type: event.eventType, description: event.description },
              '📡 [SUBSCRIPTION ECHO] Event broadcast received from server'
            );
          }
        },
        error: (err: any) => {
          logger.error({ err }, 'WebSocket subscription error');
        },
        complete: () => {
          logger.info('WebSocket subscription completed');
        }
      }
    );
  }

  stop() {
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
    }
    if (this.client) {
      this.client.dispose();
      this.client = null;
    }
  }
}
