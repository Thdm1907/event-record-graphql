import { GraphQLClient, gql } from 'graphql-request';
import pino from 'pino';
import { EventRecordInput } from './eventFactory.js';

const logger = pino({
  transport: {
    target: 'pino-pretty',
    options: { colorize: true }
  }
});

const RECORD_EVENT_MUTATION = gql`
  mutation RecordEvent($input: EventRecordInput!) {
    recordEvent(input: $input) {
      id
      description
      eventDateTime
      eventGuid
      eventType
      siteId
      createdAt
    }
  }
`;

export class EventSender {
  private client: GraphQLClient;

  constructor(endpoint: string) {
    this.client = new GraphQLClient(endpoint);
  }

  async sendEvent(input: EventRecordInput, dryRun: boolean): Promise<boolean> {
    if (dryRun) {
      logger.info({ dryRun: true, input }, '[DRY RUN] Would send event mutation');
      return true;
    }

    try {
      const response = await this.client.request<{ recordEvent: { id: string } }>(RECORD_EVENT_MUTATION, {
        input
      });
      logger.info({ id: response.recordEvent.id, siteId: input.siteId, type: input.eventType }, '✅ Event successfully recorded');
      return true;
    } catch (error: any) {
      logger.warn({ err: error.message || error, input }, '⚠️ Event mutation failed, retrying once...');
      try {
        const retryResponse = await this.client.request<{ recordEvent: { id: string } }>(RECORD_EVENT_MUTATION, {
          input
        });
        logger.info({ id: retryResponse.recordEvent.id, siteId: input.siteId, type: input.eventType }, '✅ Retry event succeeded');
        return true;
      } catch (retryError: any) {
        logger.error({ err: retryError.message || retryError, input }, '❌ Event mutation failed after retry');
        return false;
      }
    }
  }
}
