"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseConfig = parseConfig;
const commander_1 = require("commander");
function parseConfig() {
    const program = new commander_1.Command();
    program
        .name('event-generator')
        .description('Console app that continuously streams random recordEvent mutations to GraphQL server')
        .option('-e, --endpoint <url>', 'GraphQL server endpoint', 'http://localhost:4040/graphql')
        .option('-i, --interval <ms>', 'Milliseconds between event batches', '2000')
        .option('-b, --burst <n>', 'Number of events per batch', '1')
        .option('-s, --site-ids <list>', 'Comma-separated site IDs to target (or 1-20 range)', '1-20')
        .option('-t, --types <list>', 'Comma-separated event types', 'LOGIN,LOGOUT,PURCHASE,SENSOR_ALERT,MAINTENANCE,AUDIT')
        .option('-d, --duration <s>', 'Duration in seconds (0 = run until process is terminated)', '0')
        .option('--dry-run', 'Print mutations to console without sending network requests', false)
        .option('--subscribe', 'Open WebSocket subscription and echo server broadcast events', false)
        .parse(process.argv);
    const opts = program.opts();
    // Parse siteIds (e.g., "1-20" or "1,2,3")
    let siteIds = [];
    const rawSiteIds = opts.siteIds;
    if (rawSiteIds.includes('-')) {
        const [startStr, endStr] = rawSiteIds.split('-');
        const start = parseInt(startStr || '1', 10);
        const end = parseInt(endStr || '20', 10);
        for (let i = start; i <= end; i++) {
            siteIds.push(i);
        }
    }
    else {
        siteIds = rawSiteIds.split(',').map((id) => parseInt(id.trim(), 10)).filter((id) => !isNaN(id));
    }
    if (siteIds.length === 0) {
        siteIds = Array.from({ length: 20 }, (_, i) => i + 1);
    }
    const types = opts.types.split(',').map((t) => t.trim().toUpperCase()).filter(Boolean);
    return {
        endpoint: opts.endpoint,
        interval: parseInt(opts.interval, 10),
        burst: parseInt(opts.burst, 10),
        siteIds,
        types,
        duration: parseInt(opts.duration, 10),
        dryRun: Boolean(opts.dryRun),
        subscribe: Boolean(opts.subscribe)
    };
}
