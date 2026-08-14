import 'reflect-metadata';
import dotenv from 'dotenv';
dotenv.config();

import http from 'http';
import express from 'express';
import cors from 'cors';
import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import { ApolloServerPluginDrainHttpServer } from '@apollo/server/plugin/drainHttpServer';
import { buildSchema } from 'type-graphql';
import { WebSocketServer } from 'ws';
import { useServer } from 'graphql-ws/lib/use/ws';
import { createPubSub } from '@graphql-yoga/subscription';
import pino from 'pino';

import { createStores } from './data/StoreFactory.js';
import { EngineManager } from './processing/EngineManager.js';
import { LogProcessor } from './processors/LogProcessor.js';
import { StoreProcessor } from './processors/StoreProcessor.js';
import { EventRecordService } from './processing/EventRecordService.js';
import { SiteResolver } from './graphql/resolvers/SiteResolver.js';
import { EventRecordResolver } from './graphql/resolvers/EventRecordResolver.js';
import { createSiteLoader, GraphQLContext } from './graphql/context/GraphQLContext.js';
import { MetricsService } from './metrics/MetricsService.js';

const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport: {
    target: 'pino-pretty',
    options: { colorize: true }
  }
});

async function startServer() {
  const port = parseInt(process.env.PORT || '4000', 10);
  const stores = createStores();
  logger.info({ backend: process.env.DATA_STORE || 'json' }, 'Data store initialized');

  const pubSub = createPubSub();
  const engineManager = new EngineManager();

  // Register pipeline processors
  engineManager.registerProcessor(new LogProcessor());
  engineManager.registerProcessor(new StoreProcessor(stores.eventRecordStore));

  const eventRecordService = new EventRecordService(stores.siteStore, engineManager, pubSub);

  // Build TypeGraphQL schema
  const schema = await buildSchema({
    resolvers: [SiteResolver, EventRecordResolver],
    pubSub,
    validate: true
  });

  const app = express();
  const httpServer = http.createServer(app);

  // Create WebSocket Server for Subscriptions (noServer: true to prevent EADDRINUSE)
  const wsServer = new WebSocketServer({
    noServer: true,
    path: '/graphql'
  });

  const serverCleanup = useServer(
    {
      schema,
      context: () => ({
        siteStore: stores.siteStore,
        eventRecordStore: stores.eventRecordStore,
        eventRecordService,
        pubSub,
        siteLoader: createSiteLoader(stores.siteStore)
      })
    },
    wsServer
  );

  httpServer.on('upgrade', (request, socket, head) => {
    const { pathname } = new URL(request.url || '', `http://${request.headers.host}`);
    if (pathname === '/graphql') {
      wsServer.handleUpgrade(request, socket, head, (ws) => {
        wsServer.emit('connection', ws, request);
      });
    }
  });

  // Apollo Server 4 setup
  const server = new ApolloServer<GraphQLContext>({
    schema,
    plugins: [
      ApolloServerPluginDrainHttpServer({ httpServer }),
      {
        async serverWillStart() {
          return {
            async drainServer() {
              await serverCleanup.dispose();
            }
          };
        }
      }
    ]
  });

  await server.start();

  // Prometheus Metrics endpoint
  app.get('/metrics', async (_req, res) => {
    try {
      res.set('Content-Type', MetricsService.getMetricsContentType());
      res.end(await MetricsService.getMetrics());
    } catch (ex) {
      res.status(500).end(ex);
    }
  });

  app.use(
    '/graphql',
    cors<cors.CorsRequest>({
      origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
      credentials: true
    }),
    express.json(),
    expressMiddleware(server, {
      context: async () => ({
        siteStore: stores.siteStore,
        eventRecordStore: stores.eventRecordStore,
        eventRecordService,
        pubSub,
        siteLoader: createSiteLoader(stores.siteStore)
      })
    })
  );

  await new Promise<void>((resolve) => httpServer.listen({ port, host: '0.0.0.0' }, resolve));
  logger.info(`🚀 Server ready at http://localhost:${port}/graphql`);
  logger.info(`📊 Prometheus metrics exposed at http://localhost:${port}/metrics`);
  logger.info(`📡 Subscriptions ready at ws://localhost:${port}/graphql`);
}

startServer().catch((err) => {
  logger.error({ err }, 'Failed to start server');
  process.exit(1);
});
