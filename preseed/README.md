# Offline Data Preseed Generator (`preseed/`)

This directory contains standalone scripts to generate test data for the `event-record-graphql` project.

## Features

- Generates **20 sites** with realistic names, addresses, and countries (US, Canada, UK, Australia).
- Generates **5 to 300 random events per site** (~3,000 total events) with ISO 8601 timestamps and random UUIDs.
- Supports 6 distinct event types: `LOGIN`, `LOGOUT`, `PURCHASE`, `SENSOR_ALERT`, `MAINTENANCE`, `AUDIT`.
- Outputs generated data in both **JSON** (`sites.json`, `events.json`) and **SQLite** (`events.db`) formats.
- All output files are placed in `preseed/data/`.

## Running the Preseed Generator

From the repository root:

```bash
npm run preseed
```

Or from the `preseed/` directory:

```bash
npm run preseed
```

## Using the Seeded Data

The generated data remains isolated in `preseed/data/`. To test the application with preseeded data:

**Windows PowerShell:**
```powershell
Copy-Item preseed\data\*.json data\
Copy-Item preseed\data\events.db data\
```

**Bash / macOS / Linux:**
```bash
cp preseed/data/*.json data/
cp preseed/data/events.db data/
```
