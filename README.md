# EventRecording — GraphQL Ingestion & Telemetry Stack

A high-throughput, multi-backend GraphQL event recording service and real-time dashboard built with **Node.js**, **TypeScript**, **Apollo Server 4**, **TypeGraphQL**, **Prisma (SQLite)**, **React 18**, and **Vite**.

---

## System Overview

The application ingests and processes telemetry/system event records across 5 primary concerns:

```
                  +-----------------------------------+
                  |  generator/ Console App (CLI)     |
                  +-----------------+-----------------+
                                    |
                                    | HTTP Mutation: recordEvent(input)
                                    v
+-----------------+       +-------------------+       +--------------------+
| React Client    | ----> | GraphQL Server    | ----> | Prometheus Metrics |
| (Vite :3000)    | <.... | (Port :4040)      |       | (GET /metrics)     |
+-----------------+  WS   +---------+---------+       +--------------------+
                             |      |
        Chain of Resp. Pipeline      +------> Storage Engine
      LogProcessor + StoreProcessor          (JSON Files or Prisma SQLite)
```

1. **GraphQL Ingestion Server (`src/`)**: Apollo Server 4 + TypeGraphQL server with `recordEvent` mutations, paginated queries, DataLoader N+1 batching, and WebSocket subscriptions (`onEventRecorded`).
2. **Dual Storage Engines (`src/data/`)**: Switchable between lightweight atomic JSON files (`events.json`, `sites.json`) and SQLite database (`events.db`) using the `DATA_STORE` environment variable.
3. **Offline Data Preseed (`preseed/`)**: Standalone script generating 20 realistic sites and 5–300 random events per site (~3,800 records) in both JSON and SQLite formats.
4. **Live Event Generator Console App (`generator/`)**: CLI tool streaming continuous `recordEvent` mutations at configurable rates with automated retry logic and opt-in WebSocket subscription echoing.
5. **React Dashboard Client (`client/`)**: Modern dark-mode dashboard with sidebar navigation, paginated events table, registered sites list, event submission form, live subscription stream, and analytics metrics.

---

## Prerequisites

- **Node.js**: `v20.x` LTS or newer (tested on `v24.x`).
- **npm**: `v10.x` or newer.

---

## Monorepo Architecture

This repository uses **npm workspaces** to manage sub-packages from a single root installation.

```
event-record-graphql/
├── src/                     # GraphQL server source code (Node.js + TypeScript)
│   ├── data/                # Dual data store implementations (JSON & Prisma SQLite)
│   ├── domain/              # Core domain models (SiteInfo, EventRecord)
│   ├── graphql/             # TypeGraphQL resolvers, inputs, types, and context
│   ├── metrics/             # Prometheus metrics service (prom-client)
│   ├── processing/          # EventRecordService & EngineManager pipeline
│   └── processors/         # Chain-of-Responsibility processors (Log, Store)
├── preseed/                 # Offline test data generator script workspace
│   ├── generate.ts          # Entry script (generates 20 sites & 5-300 events/site)
│   └── data/                # Generated preseed output (sites.json, events.json, events.db)
├── generator/               # Live event streamer CLI console app workspace
│   └── src/
│       ├── main.ts          # CLI entry point
│       ├── config.ts        # Commander argument parser
│       ├── eventFactory.ts  # Payload generator (@faker-js/faker)
│       └── sender.ts        # graphql-request wrapper with retry
├── client/                  # React 18 + Apollo Client + Vite frontend workspace
│   └── src/
│       ├── components/      # UI Views (EventList, SiteList, EventForm, EventFeed, MetricsSummary)
│       └── apollo.ts        # Apollo Client (HTTP + WebSocket links)
├── data/                    # Active runtime data directory (JSON & SQLite files)
├── plan.md                  # Implementation specification & architectural rules
├── design.md                # System design reference & schema specifications
└── AGENTS.md                # Engineering standards & verification guidelines
```

---

## Getting Started

### 1. Install Dependencies

Install all hoisted workspace dependencies from the repository root:

```bash
npm install
```

### 2. Configure Environment

Copy `.env.example` to `.env` (defaults to `PORT=4040` and `DATA_STORE=json`):

```bash
cp .env.example .env
```

Environment variable options:

| Variable | Default | Description |
|---|---|---|
| `PORT` | `4040` | Server HTTP & WebSocket port |
| `DATA_STORE` | `json` | Storage backend: `json` or `sqlite` |
| `DATABASE_URL` | `file:../../data/events.db` | SQLite database file path for Prisma |
| `LOG_LEVEL` | `info` | Pino logger verbosity |

---

## Step-by-Step Run Guide

### Step A: Generate Offline Preseed Data

To seed 20 sites and thousands of realistic event records:

```bash
# Run the preseed generator
npm run preseed

# Copy preseeded files to active runtime data folder (Windows PowerShell)
Copy-Item preseed\data\* data\ -Force

# Or on Linux / macOS
cp preseed/data/* data/
```

### Step B: Build and Start the GraphQL Server

```bash
# Build the TypeScript server
npm run build

# Start the server (production mode)
npm run start

# Or start in watch/dev mode
npm run dev
```

Server Endpoints:
- **GraphQL API**: `http://localhost:4040/graphql`
- **WebSocket Subscriptions**: `ws://localhost:4040/graphql`
- **Prometheus Metrics**: `http://localhost:4040/metrics`

### Step C: Stream Live Events (Generator Console App)

In a separate terminal, launch the live event generator to simulate real-time ingestion:

```bash
# Stream 1 event every 2 seconds (default)
npm run generate

# High-throughput burst mode: 5 events per batch every 200 ms for 10 seconds
npm run generate -- --interval 200 --burst 5 --duration 10

# Opt-in WebSocket subscription echo
npm run generate -- --subscribe
```

### Step D: Run the React Dashboard Client

In another terminal, start the Vite frontend development server:

```bash
npm run dev --workspace=client
```

Open `http://localhost:3000` in your browser to view the interactive dashboard:
- `/dashboard` — System statistics & country/type breakdowns
- `/events` — Paginated events table
- `/sites` — Registered site facilities
- `/submit` — Manual event entry form
- `/live` — Real-time WebSocket ticker stream

---

## Verification & Building Commands

### One-Click Windows Build & Clean (`build.bat` & `clean.bat`)

Build all workspaces (dependencies, Prisma client, GraphQL server, preseed generator, generator CLI, and React client) with a single command:

```cmd
build.bat
```

Clean all generated files, build artifacts, preseeded data, and `node_modules` before committing to Git:

```cmd
clean.bat
```

### Manual Component Builds

```bash
# 1. Type-check & build root GraphQL server
npm run build

# 2. Type-check preseed & generator tools
npx tsc -p preseed/tsconfig.json
npx tsc -p generator/tsconfig.json

# 3. Type-check & build React Client
npm run build --workspace=client

# 4. Generate Prisma Client (if modifying Prisma schema)
npm run prisma:generate

# 5. Push Prisma schema changes to SQLite
npm run prisma:push
```

---

## License

MIT
