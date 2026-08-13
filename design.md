# EventRecording — Design Reference

## GraphQL Schema (Planned)

### Types

```graphql
type SiteInfo {
  siteId:       Int!
  siteName:     String!
  addressLine1: String!
  addressLine2: String
  city:         String!
  state:        String!
  country:      String!
  postalCode:   String!
}

type EventRecord {
  id:            ID!
  description:   String!
  eventDateTime: String!
  eventGuid:     String!
  eventType:     String!
  metadata:      String!
  siteId:        Int!
  site:          SiteInfo    # resolved via DataLoader
  createdAt:     String!
}

type EventTypeSummary {
  type:  String!
  count: Int!
}

type CountrySummary {
  country: String!
  count:   Int!
}
```

### Queries

```graphql
type Query {
  events:                    [EventRecord!]!
  eventsByType(type: String!): [EventRecord!]!
  eventsBySite(siteId: Int!):  [EventRecord!]!
  distinctEventTypes:        [EventTypeSummary!]!

  sites:                     [SiteInfo!]!
  site(siteId: Int!):        SiteInfo
  distinctCountries:         [CountrySummary!]!
}
```

### Mutations

```graphql
type Mutation {
  recordEvent(input: EventRecordInput!): EventRecord!
  createSite(input: SiteInfoInput!):     SiteInfo!
}
```

### Subscriptions

```graphql
type Subscription {
  onEventRecorded: EventRecord!   # pushed after pipeline completes
}
```

### Observability

```
GET /metrics   # Prometheus text format, same port as GraphQL
```

Counters tracked:
- `events_recorded_total` — total mutation calls
- `events_processed_total` — total pipeline completions
- `event_pipeline_duration_ms` — histogram of end-to-end pipeline time
- `processor_errors_total` — labelled by processor name

### Inputs

```graphql
input EventRecordInput {
  description:   String!
  eventDateTime: String!
  eventGuid:     String
  eventType:     String!
  metadata:      String!
  siteId:        Int!
}

input SiteInfoInput {
  siteName:     String!
  addressLine1: String!
  addressLine2: String
  city:         String!
  state:        String!
  country:      String!
  postalCode:   String!
}
```

---

## Prisma Schema (SQLite)

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "sqlite"
  url      = "file:./data/events.db"
}

model SiteInfo {
  siteId       Int           @id @default(autoincrement())
  siteName     String
  addressLine1 String
  addressLine2 String?
  city         String
  state        String
  country      String
  postalCode   String
  eventRecords EventRecord[]
}

model EventRecord {
  id            String   @id @default(uuid())
  description   String
  eventDateTime String
  eventGuid     String   @unique
  eventType     String
  metadata      String
  createdAt     DateTime @default(now())
  siteId        Int
  site          SiteInfo @relation(fields: [siteId], references: [siteId])
}
```

---

## Folder Structure

```
event-record-graphql/
├── client/                        # React + TypeScript + Apollo Client (Vite)
│   ├── src/
│   │   ├── components/
│   │   │   ├── EventList.tsx        # useQuery — paginated events table
│   │   │   ├── EventForm.tsx        # useMutation — recordEvent form
│   │   │   ├── SiteList.tsx         # useQuery — sites table
│   │   │   ├── EventFeed.tsx        # useSubscription — live event ticker
│   │   │   └── MetricsSummary.tsx   # useQuery — distinctTypes + distinctCountries
│   │   ├── generated/           # @graphql-codegen output — DO NOT EDIT BY HAND
│   │   │   └── graphql.ts           # auto-generated TS types from server schema
│   │   ├── apollo.ts            # ApolloClient instance (http + ws links)
│   │   └── App.tsx
│   ├── index.html
│   └── vite.config.ts
│
├── src/                           # Server — Node.js + TypeScript
│   ├── domain/
│   │   ├── EventRecord.ts
│   │   └── SiteInfo.ts
│   ├── data/
│   │   ├── IEventRecordStore.ts
│   │   ├── ISiteStore.ts
│   │   ├── StoreFactory.ts
│   │   ├── json/
│   │   │   ├── JsonEventRecordStore.ts
│   │   │   └── JsonSiteStore.ts
│   │   └── prisma/
│   │       ├── schema.prisma
│   │       ├── PrismaEventRecordStore.ts
│   │       └── PrismaSiteStore.ts
│   ├── processing/
│   │   ├── EventRecordService.ts
│   │   └── EngineManager.ts
│   ├── processors/
│   │   ├── IEventRecordProcessor.ts
│   │   ├── LogProcessor.ts
│   │   └── StoreProcessor.ts
│   ├── graphql/
│   │   ├── types/
│   │   │   ├── EventRecordType.ts
│   │   │   ├── EventRecordInput.ts
│   │   │   ├── SiteInfoType.ts
│   │   │   └── SiteInfoInput.ts
│   │   └── resolvers/
│   │       ├── EventRecordResolver.ts
│   │       └── SiteResolver.ts
│   ├── metrics/
│   │   └── MetricsService.ts
│   └── main.ts
│
├── data/
│   ├── events.json
│   ├── sites.json
│   └── events.db
├── scripts/
│   └── seed.ts              # populates sites.json + events.db with sample data
├── codegen.ts             # @graphql-codegen config — points at server schema
├── .env
├── plan.md
├── design.md
├── package.json           # root: server deps + concurrently
└── tsconfig.json
```

---

## JSON File Schema

### `data/sites.json`

```json
[
  {
    "siteId": 1,
    "siteName": "Head Office",
    "addressLine1": "123 Main St",
    "addressLine2": null,
    "city": "Toronto",
    "state": "ON",
    "country": "Canada",
    "postalCode": "M5V 1A1"
  }
]
```

### `data/events.json`

```json
[
  {
    "id": "uuid-v4",
    "description": "User logged in",
    "eventDateTime": "2026-08-13T09:00:00Z",
    "eventGuid": "uuid-v4",
    "eventType": "LOGIN",
    "metadata": "{}",
    "siteId": 1,
    "createdAt": "2026-08-13T09:00:01Z"
  }
]
```

---

## Processing Pipeline

```
GraphQL Mutation: recordEvent(input)
        |
        v
EventRecordService.record(input)
  - enrich: generate id, createdAt
  - validate: siteId exists in ISiteStore (throw GraphQL error if not)
  - prom-client: start pipeline timer
        |
        v                                    // TODO: replace with queue.enqueue() for async
EngineManager.processEvent(event)            // FAIL-FAST: throws on first processor error
  - iterates processors in registration order
        |
        +---> LogProcessor.process(event)    // logs to console via pino
        |
        +---> StoreProcessor.process(event)  // persists via IEventRecordStore
        |
        v
  prom-client: record duration, increment counters
        |
        v
  pubSub.publish('EVENT_RECORDED', event)    // triggers Subscription push to WebSocket clients
        |
        v
  return EventRecord to mutation caller
```

---

## Pattern Mapping (C# to TypeScript)

| C# Pattern | C# Implementation | TypeScript Equivalent |
|---|---|---|
| Dual-protocol transport | REST + gRPC controllers | GraphQL mutations + queries |
| `IEventRecordProcessor` | Interface + assembly scan | Interface + manual registration array |
| Chain of Responsibility | `EngineManager.ProcessEventRecord` | `EngineManager.processEvent` for..of loop |
| Keyed IoC backends | Autofac `[KeyFilter]` | `StoreFactory` reads env var |
| EF Core + migrations | `EventRecordSqlServerContext` | Prisma schema + `prisma migrate` |
| AutoMapper | `EventRecordAutoMapper` | Plain TypeScript mapper functions |
| Serilog | Structured logging | Pino |

---

## Decisions Log

| # | Decision | Outcome |
|---|---|---|
| 1 | SQLite (Prisma) + JSON file, both implemented | **Confirmed** |
| 2 | `DATA_STORE` env var selects backend via factory | **Confirmed** |
| 3 | Two interfaces: `IEventRecordStore` + `ISiteStore` | **Confirmed** |
| 4 | `distinctTypes()` on EventRecord, `distinctCountries()` on SiteInfo | **Confirmed** |
| 5 | EventType stays as a string field (no FK table) | **Confirmed** |
| 6 | Referential integrity on insert | **Validate in both stores** — check siteId exists before persisting |
| 7 | SiteInfo writability | **Pre-seeded via seed script + `createSite` mutation** |
| 8 | Processing pipeline | **Synchronous** — `await processEvent()`; TODO comment marks future queue injection point |
| 9 | Error handling in pipeline | **Fail-fast** — first processor failure throws, mutation returns GraphQL error |
| 10 | Input validation | **`class-validator` decorators** on Input types; type-graphql runs validation before resolvers |
| 11 | Pagination | **No pagination on `sites`** (bounded ref data); **offset (`skip`/`take`) on `events`** |
| 12 | Subscriptions | **In scope** — `onEventRecorded` Subscription via WebSocket (`graphql-ws` + `ws`) |
| 13 | Metrics / observability | **In scope** — `prom-client` counters + histograms, exposed at `GET /metrics` |
| 14 | Frontend placement | **Same project, `client/` subfolder** — Vite dev server on `:3000`, server on `:4000` |
| 15 | Frontend framework | **React 18 + TypeScript + Apollo Client** — `useQuery`, `useMutation`, `useSubscription` hooks |
| 16 | App layout / routing | **React Router v6 with sidebar** — `/dashboard`, `/events`, `/sites`, `/submit`, `/live`, `/metrics` |
| 17 | CSS approach | **CSS Modules + CSS custom properties as design tokens** — one `tokens.css`, scoped `.module.css` per component |
| 18 | Form handling | **React Hook Form** — uncontrolled inputs, built-in validation, minimal re-renders |
| 19 | Live subscription display | **Both** — `/live` page (full scrolling log) + global toast notifications on all other pages; single `useSubscription` feeds both surfaces |
| 20 | Loading / error UX | **Skeleton loaders** for tables, inline error banners with retry, toast for mutation success/failure |
