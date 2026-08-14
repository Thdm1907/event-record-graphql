import pino from 'pino';
import { parseConfig } from './config.js';
import { createRandomEventInput } from './eventFactory.js';
import { EventSender } from './sender.js';
import { EventSubscriber } from './subscriber.js';

const logger = pino({
  transport: {
    target: 'pino-pretty',
    options: { colorize: true }
  }
});

async function main() {
  const config = parseConfig();

  logger.info(
    {
      endpoint: config.endpoint,
      intervalMs: config.interval,
      burst: config.burst,
      siteIds: config.siteIds.length <= 5 ? config.siteIds : `${config.siteIds.length} sites (${config.siteIds[0]}-${config.siteIds[config.siteIds.length - 1]})`,
      types: config.types,
      durationSec: config.duration > 0 ? config.duration : 'infinite',
      dryRun: config.dryRun,
      subscribe: config.subscribe
    },
    '🚀 Starting Event Generator Console App'
  );

  const sender = new EventSender(config.endpoint);
  let subscriber: EventSubscriber | null = null;

  if (config.subscribe) {
    const wsUrl = config.endpoint.replace(/^http/, 'ws');
    subscriber = new EventSubscriber();
    subscriber.start(wsUrl);
  }

  let totalSent = 0;

  const timer = setInterval(async () => {
    for (let i = 0; i < config.burst; i++) {
      const input = createRandomEventInput(config.siteIds, config.types);
      const success = await sender.sendEvent(input, config.dryRun);
      if (success) {
        totalSent++;
      }
    }
  }, config.interval);

  const stop = () => {
    logger.info({ totalSent }, '🛑 Stopping Event Generator...');
    clearInterval(timer);
    if (subscriber) {
      subscriber.stop();
    }
    process.exit(0);
  };

  process.on('SIGINT', stop);
  process.on('SIGTERM', stop);

  if (config.duration > 0) {
    setTimeout(() => {
      logger.info({ durationSec: config.duration }, 'Duration limit reached');
      stop();
    }, config.duration * 1000);
  }
}

main().catch((err) => {
  logger.error({ err }, 'Fatal error in generator main');
  process.exit(1);
});
