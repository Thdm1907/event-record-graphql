# EventRecording — Node.js + TypeScript + GraphQL
## Architecture Plan

> **For a fresh chat session:** Read PLAN.md (this file) and DESIGN.md before generating any code.
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

data/
  events.json
  sites.json
  events.db
```

---

## Open Decisions (resolved via interview)

1. Referential integrity: validate `siteId` on event insert? **→ Validate in both stores**
2. SiteInfo: pre-seeded or writable via GraphQL mutation? **→ Seed script + `createSite` mutation**
3. Pipeline: synchronous or fire-and-forget async? **→ Synchronous with TODO seam**
4. Error handling: fail-fast or resilient? **→ Fail-fast**
5. Input validation strategy? **→ `class-validator` decorators**
6. Pagination? **→ Offset on `events`, none on `sites`**
7. Subscriptions? **→ In scope — `onEventRecorded` via WebSocket**
8. Metrics? **→ In scope — `prom-client` at `GET /metrics`**
9. Frontend placement? **→ Same project, `client/` subfolder, Vite dev server on :3000**
10. Frontend framework? **→ React 18 + TypeScript + Apollo Client**
