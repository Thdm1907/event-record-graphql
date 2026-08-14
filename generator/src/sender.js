"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EventSender = void 0;
const graphql_request_1 = require("graphql-request");
const pino_1 = __importDefault(require("pino"));
const logger = (0, pino_1.default)({
    transport: {
        target: 'pino-pretty',
        options: { colorize: true }
    }
});
const RECORD_EVENT_MUTATION = (0, graphql_request_1.gql) `
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
class EventSender {
    client;
    constructor(endpoint) {
        this.client = new graphql_request_1.GraphQLClient(endpoint);
    }
    async sendEvent(input, dryRun) {
        if (dryRun) {
            logger.info({ dryRun: true, input }, '[DRY RUN] Would send event mutation');
            return true;
        }
        try {
            const response = await this.client.request(RECORD_EVENT_MUTATION, {
                input
            });
            logger.info({ id: response.recordEvent.id, siteId: input.siteId, type: input.eventType }, '✅ Event successfully recorded');
            return true;
        }
        catch (error) {
            logger.warn({ err: error.message || error, input }, '⚠️ Event mutation failed, retrying once...');
            try {
                const retryResponse = await this.client.request(RECORD_EVENT_MUTATION, {
                    input
                });
                logger.info({ id: retryResponse.recordEvent.id, siteId: input.siteId, type: input.eventType }, '✅ Retry event succeeded');
                return true;
            }
            catch (retryError) {
                logger.error({ err: retryError.message || retryError, input }, '❌ Event mutation failed after retry');
                return false;
            }
        }
    }
}
exports.EventSender = EventSender;
