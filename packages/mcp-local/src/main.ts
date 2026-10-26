import { McpServer } from '@modelcontextprotocol/server';
import { serveStdio, StdioServerTransport } from '@modelcontextprotocol/server/stdio';
import { z } from 'zod';
import { healthEndpoint } from './config.js';
import { HealthError, readHealth } from './health.js';

try {
  const endpoint = healthEndpoint(process.env);
  const handle = serveStdio(() => {
    const server = new McpServer({ name: 'rielia-local-experimental', version: '0.0.0' });
    server.registerTool('rielia_health', {
      title: 'Experimental Rielia process liveness',
      description: 'Experimental read-only diagnostic: calls the configured Rielia REST process liveness endpoint. '
        + 'Reports process liveness only, not authentication, database health, product readiness, or user capabilities. '
        + 'Takes no arguments; returns only validated public status and service literals. No task data or credentials.',
      inputSchema: z.strictObject({}),
      outputSchema: z.strictObject({ status: z.literal('ok'), service: z.literal('rielia-api') }),
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true },
    }, async (_args, context) => {
      try {
        const health = await readHealth(endpoint, context.mcpReq.signal);
        return { content: [{ type: 'text', text: JSON.stringify(health) }], structuredContent: { ...health } };
      } catch (error) {
        const code = error instanceof HealthError ? error.code : 'LIVENESS_UNAVAILABLE';
        return { isError: true, content: [{ type: 'text', text: code }] };
      }
    });
    return server;
  }, {
    transport: new StdioServerTransport(process.stdin, process.stdout, { maxBufferSize: 16384 }),
    onerror: () => { console.error('MCP transport error.'); },
  });
  const shutdown = (): void => {
    void handle.close().catch(() => { console.error('MCP shutdown failed.'); process.exitCode = 1; });
  };
  process.once('SIGINT', shutdown);
  process.once('SIGTERM', shutdown);
} catch {
  // Never print configuration values or raw SDK/upstream errors.
  console.error('MCP startup failed: invalid configuration; see docs/development/local-mcp.md.');
  process.exitCode = 1;
}
