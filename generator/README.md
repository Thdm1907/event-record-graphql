# Live Event Generator Console App (`generator/`)

The Event Generator is a TypeScript CLI console application that continuously feeds realistic `recordEvent` GraphQL mutations to the live `event-record-graphql` server.

## Features

- Configurable ingestion rate (interval, burst size).
- Targeted site IDs and event type filtering.
- Dry-run mode for previewing generated payload mutations.
- Optional WebSocket subscription listener (`--subscribe`) to echo server broadcast events in real-time.
- Structured logging with `pino` and `pino-pretty`.

## Usage

From the workspace root:

```bash
# Stream 1 event every 2 seconds (default)
npm run generate

# Stream 5 events every 200 ms to sites 1–5
npm run generate -- --interval 200 --burst 5 --site-ids 1,2,3,4,5

# Dry run (log mutations without calling the server)
npm run generate -- --dry-run

# Enable WebSocket subscription echo
npm run generate -- --subscribe --interval 1000
```

## CLI Options

| Flag | Default | Description |
|---|---|---|
| `-e, --endpoint <url>` | `http://localhost:4000/graphql` | GraphQL server endpoint |
| `-i, --interval <ms>` | `2000` | Milliseconds between event batches |
| `-b, --burst <n>` | `1` | Number of mutations per batch |
| `-s, --site-ids <list>` | `1-20` | Comma-separated list or range of siteIds |
| `-t, --types <list>` | `LOGIN,LOGOUT,PURCHASE,SENSOR_ALERT,MAINTENANCE,AUDIT` | Allowed event types |
| `-d, --duration <s>` | `0` | Run duration in seconds (`0` = infinite) |
| `--dry-run` | `false` | Print mutations without sending network requests |
| `--subscribe` | `false` | Connect WebSocket subscription and echo server broadcast events |
