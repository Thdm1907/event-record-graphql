# EventRecording — Node.js + TypeScript + GraphQL
## Architecture Plan

> **For a fresh chat session:** Read plan.md (this file) and design.md before generating any code.
> All architectural decisions are finalised — do not re-ask design questions, proceed directly to scaffolding.
> The source should be generated in this folder (`event-record-graphql/`).

## What the Existing C# System Does

The current solution is a **high-throughput, multi-protocol event ingestion service** across five layered concerns:

| Layer | C# project | Responsibility |
|---|---|---|
| Transport | `Api.App` | REST (ASP.NET MVC) + gRPC — both feed the same pipeline |
| Intake / Queue | `ProcessingEngine` | Persisted async queue via LiteDB, producer-consumer |
| Plugin Dispatch | `EngineManager` | Chain-of-Responsibility over auto-discovered `IEventRecordProcessor` impls |
| Data Access | `DataAccessService.SqlServer / Sqlite` | EF Core + keyed IoC, multi-DB |
| Observability | `PerfCounterHelper` | EventSource-based perf counters (rate, avg, total) |

Key patterns: **Strategy/Plugin**, **Chain of Responsibility**, **Producer-Consumer with durable queue**, **Keyed-IoC multi-backend**, **DTO→Domain mapping**.

---

## Target Stack

### Server

| Concern | Library / Tool |
|---|---|
| Runtime | Node.js 20 LTS |
| Language | TypeScript 5 |
| GraphQL server | Apollo Server 4 + `type-graphql` |
| ORM / DB | Prisma (SQLite provider) |
| JSON store | `fs/promises` — zero deps |
| Validation | `class-validator` (wired into type-graphql) |
| Subscriptions | `graphql-ws` + `ws` |
| Metrics | `prom-client` — `GET /metrics` |
| Logging | Pino |
| Build / Dev | `tsx` (dev), `tsc` (prod) |

### Client (`client/`)

| Concern | Library / Tool |
|---|---|
| Framework | React 18 + TypeScript |
| Build tool | Vite |
| GraphQL client | Apollo Client 3 |
| Hooks | `useQuery`, `useMutation`, `useSubscription` |
| Type generation | `@graphql-codegen/cli` — auto-generates TS types from server schema |
| Styling | Vanilla CSS (no framework) |

> **Dev ports:** Server runs on `:4000`, client Vite dev server on `:3000`. CORS configured on the server for `http://localhost:3000`.

---

## Data Model

### `SiteInfo`

| Field | Type | Notes |
|---|---|---|
| `siteId` | `number` (PK) | Matches `siteId` on `EventRecord` |
| `siteName` | `string` | |
| `addressLine1` | `string` | |
| `addressLine2` | `string?` | Optional |
| `city` | `string` | |
| `state` | `string` | State or province |
| `country` | `string` | |
| `postalCode` | `string` | |

### `EventRecord` (expanded from C# DTO)

| Field | Type | Notes |
|---|---|---|
| `id` | `string` (UUID) | PK |
| `description` | `string` | |
| `eventDateTime` | `string` | ISO 8601 |
| `eventGuid` | `string` | Client-supplied or auto-generated |
| `eventType` | `string` | Type code (e.g. `LOGIN`, `PURCHASE`) |
| `metadata` | `string` | Arbitrary JSON string |
| `siteId` | `number` | FK -> SiteInfo.siteId |
| `createdAt` | `string` (ISO) | Server-stamped |

---

## Repository Interface Split

### `IEventRecordStore`

| Method | Return | Purpose |
|---|---|---|
| `insert(event)` | `Promise<EventRecord>` | Persist new event |
| `findAll()` | `Promise<EventRecord[]>` | List all |
| `findByType(type)` | `Promise<EventRecord[]>` | Filter by event type code |
| `findBySiteId(id)` | `Promise<EventRecord[]>` | Filter by site |
| `distinctTypes()` | `Promise<{type: string, count: number}[]>` | Aggregate |

### `ISiteStore`

| Method | Return | Purpose |
|---|---|---|
| `insert(site)` | `Promise<SiteInfo>` | Persist a new site |
| `findAll()` | `Promise<SiteInfo[]>` | List all sites |
| `findById(siteId)` | `Promise<SiteInfo \| null>` | Look up by PK |
| `distinctCountries()` | `Promise<{country: string, count: number}[]>` | Aggregate |

---

## Config-Based Store Factory

`.env` controls backend:

- `DATA_STORE=json`   ->  JsonEventRecordStore  +  JsonSiteStore
- `DATA_STORE=sqlite` ->  PrismaEventRecordStore + PrismaSiteStore

---

## Folder Structure

```
src/
  domain/
    EventRecord.ts
    SiteInfo.ts
  data/
    IEventRecordStore.ts
    ISiteStore.ts
    StoreFactory.ts
    json/
      JsonEventRecordStore.ts
      JsonSiteStore.ts
    prisma/
      schema.prisma
      PrismaEventRecordStore.ts
      PrismaSiteStore.ts
  processing/
    EventRecordService.ts
    EngineManager.ts
  processors/
    IEventRecordProcessor.ts
    LogProcessor.ts
    StoreProcessor.ts
  graphql/
    types/
      EventRecordType.ts
      EventRecordInput.ts
      SiteInfoType.ts
      SiteInfoInput.ts
    resolvers/
      EventRecordResolver.ts
      SiteResolver.ts
  main.ts

data/                        # active runtime data (copy preseed output here to test)
  events.json
  sites.json
  events.db

preseed/                     # offline data generator — run once, copy output manually
  generate.ts                # entry point
  package.json
  tsconfig.json
  README.md
  data/                      # gitignored output
    sites.json
    events.json
    events.db

generator/                   # live event streamer — sends mutations to running server
  src/
    main.ts                  # entry point + CLI arg parsing
    config.ts                # Config type + defaults
    eventFactory.ts          # builds random EventRecordInput objects
    sender.ts                # graphql-request wrapper + retry
    subscriber.ts            # graphql-ws echo loop (--subscribe flag)
  package.json
  tsconfig.json
  README.md
```

---

## Preseed

Standalone offline script that generates static test data. Run once; copy output to `data/` when needed.

### Volume

| Metric | Value |
|---|---|
| Sites | 20 |
| Events per site | Random 5–300 |
| Expected total events | ~3,050 (statistical midpoint) |
| Output formats | `sites.json`, `events.json`, `events.db` |

### Event Types

| Code | Meaning |
|---|---|
| `LOGIN` | User authenticated at site |
| `LOGOUT` | User session ended |
| `PURCHASE` | Transaction completed |
| `SENSOR_ALERT` | IoT / sensor threshold exceeded |
| `MAINTENANCE` | Scheduled or unscheduled maintenance record |
| `AUDIT` | Compliance / audit trail entry |

### Stack

| Concern | Choice | Rationale |
|---|---|---|
| Runtime | `tsx` | Zero-compile script execution |
| SQLite driver | `better-sqlite3` | Synchronous, no Prisma/migrate overhead |
| Fake data | `@faker-js/faker` | Realistic names, addresses, timestamps |
| UUID | `uuid` | Consistent with server `eventGuid` format |

### Usage

```bash
# from repo root (npm workspaces)
npm run preseed

# copy output to active data dir when ready
copy preseed\data\*.json data\
copy preseed\data\events.db data\
```

---

## Generator — Live Event Streamer

Long-running console app that connects to the live GraphQL server and continuously sends `recordEvent` mutations at a configurable rate. Intended for manual load testing and visual demonstration.

### Stack

| Concern | Library | Rationale |
|---|---|---|
| Language | TypeScript 5 | Matches server stack |
| GraphQL mutations | `graphql-request` | Lightweight HTTP client, no Apollo overhead |
| WebSocket echo | `graphql-ws` + `--subscribe` flag | Opt-in round-trip confirmation; off by default |
| CLI args | `commander` | Typed flags with defaults and help text |
| Logging | `pino` + `pino-pretty` | Structured JSON; matches server logging style |
| Fake data | `@faker-js/faker` | Shared with preseed |
| Build / run | `tsx` | Zero-compile dev experience |

### CLI Flags

| Flag | Default | Description |
|---|---|---|
| `--endpoint <url>` | `http://localhost:4000/graphql` | GraphQL server URL |
| `--interval <ms>` | `2000` | Milliseconds between ticks |
| `--burst <n>` | `1` | Mutations sent per tick |
| `--site-ids <list>` | `1-20` (all) | Comma-separated siteIds to target |
| `--types <list>` | all 6 types | Comma-separated event types to emit |
| `--duration <s>` | ∞ | Stop after N seconds |
| `--dry-run` | off | Print mutations, do not send |
| `--subscribe` | off | Open WS subscription and echo broadcasts |

### Usage

```bash
# start server first
npm run dev

# stream 1 event every 2 s (default)
npm run generate

# burst mode: 5 events/s to sites 1–5
npm run generate -- --interval 200 --burst 5 --site-ids 1,2,3,4,5

# dry run — preview output only
npm run generate -- --dry-run

# with subscription echo
npm run generate -- --subscribe
```

---

## Workspace Setup (npm workspaces)

All three packages share a single `node_modules` hoisted to the repo root.

```json
// package.json (root) — workspaces key
{
  "workspaces": ["preseed", "generator"]
}
```

Scripts wired in root `package.json`:

```json
"scripts": {
  "preseed":  "tsx preseed/generate.ts",
  "generate": "tsx generator/src/main.ts"
}
```

---

## Implementation Checklist

### Phase 1: Workspace & Root Setup
- [ ] Root `package.json` with npm workspaces (`preseed`, `generator`, `client`)
- [ ] TypeScript configuration (`tsconfig.json`)
- [ ] Environment file `.env` and `.gitignore` configuration

### Phase 2: Offline Data Preseed (`preseed/`)
- [ ] `preseed/package.json` & `preseed/tsconfig.json`
- [ ] `preseed/generate.ts`: Seed generator (20 sites, 5-300 events/site, 6 event types)
- [ ] Direct export to `preseed/data/sites.json` and `preseed/data/events.json`
- [ ] Direct export to `preseed/data/events.db` via `better-sqlite3`
- [ ] `preseed/README.md` with instructions on copying data to `data/`

### Phase 3: Live Event Generator (`generator/`)
- [ ] `generator/package.json` & `generator/tsconfig.json`
- [ ] `generator/src/config.ts`: CLI arg parser with `commander` (`--endpoint`, `--interval`, `--burst`, etc.)
- [ ] `generator/src/eventFactory.ts`: Random `EventRecordInput` builder using `@faker-js/faker`
- [ ] `generator/src/sender.ts`: `graphql-request` wrapper with error retry
- [ ] `generator/src/subscriber.ts`: `graphql-ws` WebSocket echo loop (`--subscribe`)
- [ ] `generator/src/main.ts`: Console app runner & lifecycle manager
- [ ] `generator/README.md` with usage examples

### Phase 4: GraphQL Server (`src/`)
- [ ] Data domain & types (`SiteInfo`, `EventRecord`)
- [ ] Store interfaces (`IEventRecordStore`, `ISiteStore`)
- [ ] JSON data store (`JsonEventRecordStore`, `JsonSiteStore`)
- [ ] Prisma SQLite store (`schema.prisma`, `PrismaEventRecordStore`, `PrismaSiteStore`)
- [ ] Config-based store factory (`StoreFactory`)
- [ ] Engine Manager & Processor Pipeline (`LogProcessor`, `StoreProcessor`)
- [ ] Apollo Server 4 + `type-graphql` schemas, resolvers & inputs
- [ ] Subscriptions setup (`graphql-ws` + `ws`)
- [ ] Metrics endpoint (`prom-client` on `GET /metrics`)

### Phase 5: Client Application (`client/`)
- [ ] React + TypeScript + Vite scaffolding
- [ ] Apollo Client setup with HTTP & WebSocket links
- [ ] GraphQL Code Generator integration
- [ ] UI Components: EventList, SiteList, EventForm, EventFeed, MetricsSummary
- [ ] Sidebar navigation with React Router

### Phase 6: End-to-End Verification
- [ ] Test preseed generation and data copying to `data/`
- [ ] Verify server starts with both JSON and SQLite backends
- [ ] Run event generator against live GraphQL server and verify incoming events
- [ ] Validate subscription stream on frontend & generator echo


