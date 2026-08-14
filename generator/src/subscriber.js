"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EventSubscriber = void 0;
const graphql_ws_1 = require("graphql-ws");
const ws_1 = __importDefault(require("ws"));
const pino_1 = __importDefault(require("pino"));
const logger = (0, pino_1.default)({
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
class EventSubscriber {
    client = null;
    unsubscribe = null;
    start(wsEndpoint) {
        logger.info({ wsEndpoint }, 'Connecting WebSocket subscription for onEventRecorded...');
        this.client = (0, graphql_ws_1.createClient)({
            url: wsEndpoint,
            webSocketImpl: ws_1.default
        });
        this.unsubscribe = this.client.subscribe({ query: ON_EVENT_RECORDED_SUBSCRIPTION }, {
            next: (data) => {
                const event = data?.data?.onEventRecorded;
                if (event) {
                    logger.info({ id: event.id, siteId: event.siteId, type: event.eventType, description: event.description }, '📡 [SUBSCRIPTION ECHO] Event broadcast received from server');
                }
            },
            error: (err) => {
                logger.error({ err }, 'WebSocket subscription error');
            },
            complete: () => {
                logger.info('WebSocket subscription completed');
            }
        });
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
exports.EventSubscriber = EventSubscriber;
