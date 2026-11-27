import { z } from 'zod';
import {
  collaborationCursorSchema,
  discoveryIdentifierSchema,
  taskSearchSchema,
  taskFiltersSchema,
} from '../index.js';
import { createSchemaExporter } from './schema-export.js';
import { checkBindings, admissionBindings, transformBindings } from './schema-bindings.js';
import { operations, type ApiOperation } from './operations.js';
import { wireSchemas } from './wire-schemas.js';

type Json = z.core.JSONSchema.BaseSchema;
export type OpenApiDocument = {
  openapi: string;
  paths: Record<string, Record<string, unknown>>;
  components: { schemas: Record<string, Json>; securitySchemes: Record<string, unknown> };
  [key: string]: unknown;
};
const reference = (name: string) => ({ $ref: `#/components/schemas/${name}` });
const cursor128 = discoveryIdentifierSchema;
const cursor2048 = collaborationCursorSchema;
const view = z.enum(['active', 'archived']);
const scope = z.enum(['mine', 'search']);
// These two protocol enums contain no runtime refinements and are explicit route metadata.
function queryFields(id: string): Record<string, z.core.$ZodType> {
  switch (id) {
    case 'H05':
      return { view, cursor: cursor128 };
    case 'H12':
    case 'H15':
    case 'H56':
    case 'H59':
    case 'H61':
      return { cursor: cursor128 };
    case 'H16':
      return { view, cursor: cursor2048, ...taskFiltersSchema.shape };
    case 'H23':
      return { destination: discoveryIdentifierSchema, cursor: cursor2048 };
    case 'H26':
    case 'H28':
    case 'H29':
    case 'H32':
    case 'H36':
    case 'H37':
    case 'H38':
    case 'H39':
    case 'H40':
    case 'H52':
      return { cursor: cursor2048 };
    case 'H49':
      return {
        scope,
        q: taskSearchSchema,
        view,
        project: discoveryIdentifierSchema,
        ...taskFiltersSchema.shape,
        cursor: cursor2048,
      };
    default:
      return {};
  }
}
function sessionSecurity() {
  return [{ HttpsWebSession: [] }, { LocalHttpWebSession: [] }];
}
function errorResponses(op: ApiOperation): Record<string, unknown> {
  const codes = ['H01', 'H02'].includes(op.id)
    ? []
    : ['H03', 'H55'].includes(op.id)
      ? [503]
      : [400, 401, 403, ...(op.conflict ? [409] : []), 503];
  return Object.fromEntries([
    ...codes.map((code) => [
      String(code),
      {
        description:
          'Existing controlled error; response body explicitly unmodeled. Runtime envelope and scoped projection admission remain canonical.',
      },
    ]),
    [
      'default',
      {
        description:
          'Framework or unexpected error; response body explicitly unmodeled. An omitted schema does not mean an empty body.',
      },
    ],
  ]);
}

export function buildOpenApi(
  entries: readonly ApiOperation[] = operations,
  schemas: readonly (readonly [string, z.core.$ZodType])[] = Object.entries(wireSchemas),
): OpenApiDocument {
  const exporter = createSchemaExporter();
  const components: Record<string, Json> = {};
  for (const [name, schema] of schemas) {
    if (!/^[A-Za-z][A-Za-z0-9]*Schema$/.test(name))
      throw new Error(`Invalid public schema ID: ${name}`);
    if (Object.hasOwn(components, name)) throw new Error(`Duplicate schema ID: ${name}`);
    if (
      !Object.hasOwn(wireSchemas, name) ||
      schema !== wireSchemas[name as keyof typeof wireSchemas]
    )
      throw new Error(`Noncanonical public schema root: ${name}`);
    components[name] = exporter.convert(schema);
  }
  const paths: OpenApiDocument['paths'] = {};
  const ids = new Set<string>();
  for (const op of entries) {
    if (ids.has(op.id)) throw new Error(`Duplicate operation ID: ${op.id}`);
    ids.add(op.id);
    if (!components[op.response] || (op.body !== undefined && !components[op.body]))
      throw new Error(`Missing operation schema: ${op.id}`);
    if ((op.method === 'post') !== (op.body !== undefined))
      throw new Error(`Missing or unexpected request body: ${op.id}`);
    const item = (paths[op.path] ??= {});
    if (item[op.method]) throw new Error(`Duplicate route: ${op.method} ${op.path}`);
    const stream = op.id === 'H50';
    const pub = ['H01', 'H02', 'H55'].includes(op.id);
    const project = Number(op.id.slice(1)) >= 5 && Number(op.id.slice(1)) <= 54;
    const parameters: unknown[] = [];
    for (const match of op.path.matchAll(/\{([^}]+)\}/g))
      parameters.push({
        name: match[1],
        in: 'path',
        required: true,
        schema: op.id === 'H04' ? { type: 'string' } : exporter.convert(discoveryIdentifierSchema),
      });
    const fields = queryFields(op.id);
    for (const [name, schema] of Object.entries(fields))
      parameters.push({ name, in: 'query', required: false, schema: exporter.convert(schema) });
    if (op.method === 'post') {
      parameters.push({
        name: 'Origin',
        in: 'header',
        required: true,
        description: 'Exact configured public origin; never selected by the request.',
        schema: { type: 'string' },
      });
      parameters.push({
        name: 'Sec-Fetch-Site',
        in: 'header',
        required: false,
        schema: { type: 'string', enum: ['same-origin', 'none'] },
      });
      parameters.push({
        name: 'Idempotency-Key',
        in: 'header',
        required: true,
        description:
          'UUID v4, checked in the existing receipt stage after current authority; explicit same-key/body retry only.',
        schema: {
          type: 'string',
          pattern:
            '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-4[0-9a-fA-F]{3}-[89aAbB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$',
        },
      });
    }
    if (stream) {
      parameters.push({
        name: 'Last-Event-ID',
        in: 'header',
        required: false,
        schema: exporter.convert(discoveryIdentifierSchema),
      });
      parameters.push({
        name: 'Origin',
        in: 'header',
        required: false,
        description: 'Must equal configured origin if supplied.',
        schema: { type: 'string' },
      });
      parameters.push({
        name: 'Sec-Fetch-Site',
        in: 'header',
        required: false,
        schema: { type: 'string', enum: ['same-origin', 'none'] },
      });
    }
    const headers: Record<string, unknown> = {
      'Cache-Control': {
        schema: { type: 'string', const: stream ? 'no-store, no-transform' : 'no-store' },
      },
    };
    if (!pub && op.id !== 'H02')
      headers['Set-Cookie'] = {
        description: 'Conditional session renewal/clearing; preserve separate header values.',
        schema: { type: 'string' },
      };
    if (project)
      headers['X-Request-Id'] = {
        description: 'Existing server correlation header.',
        schema: { type: 'string' },
      };
    if (stream) headers['X-Accel-Buffering'] = { schema: { type: 'string', const: 'no' } };
    const success = stream
      ? {
          description:
            'SSE event:update frames, optional opaque id and JSON data; this is not a JSON HTTP response.',
          headers,
          content: {
            'text/event-stream': {
              schema: { type: 'string' },
              'x-rielia-event-data': reference(op.response),
            },
          },
          'x-rielia-framing': {
            event: 'update',
            data: reference(op.response),
            delimiter: '\n\n',
            denied: 'event then close after headers',
            invalidationOnly: true,
          },
        }
      : {
          description: 'Existing canonical successful JSON response.',
          headers,
          content: { 'application/json': { schema: reference(op.response) } },
        };
    item[op.method] = {
      operationId: op.id,
      parameters,
      security: pub ? [] : op.id === 'H03' ? [{}, ...sessionSecurity()] : sessionSecurity(),
      ...(op.body === undefined
        ? {}
        : {
            requestBody: {
              required: true,
              content: { 'application/json': { schema: reference(op.body) } },
            },
          }),
      responses: { [op.method === 'post' ? '201' : '200']: success, ...errorResponses(op) },
      'x-rielia-source': op.controller,
      'x-rielia-surface': ['H01', 'H55'].includes(op.id)
        ? 'api-only'
        : ['H02', 'H03'].includes(op.id)
          ? 'api; Next identity projection proxy'
          : project
            ? 'api; Next project/discovery/events proxy'
            : 'api; Next workspace proxy',
      'x-rielia-query': {
        names: Object.keys(fields),
        unknownRejected: !['H01', 'H02', 'H03', 'H55'].includes(op.id),
        duplicates: project
          ? 'Next rejects before forwarding; Nest retains scalar admission'
          : 'existing API admission; workspace proxy forwards query',
      },
      'x-rielia-runtime-semantics': [
        'HTTP admission order, current authority, scoped response correlations, cookie handling, no-store, timeout/cancellation and explicit same-key recovery remain runtime-owned.',
      ],
    };
  }
  const document: OpenApiDocument = {
    openapi: '3.1.2',
    jsonSchemaDialect: 'https://spec.openapis.org/oas/3.1/dialect/base',
    info: {
      title: 'Rielia current API contracts',
      version: '0.0.0',
      description:
        'Bounded structural contract for the 66 existing Nest operations. A relative API origin does not imply every route is available through Next. Error bodies, raw auth and private internals are explicitly unmodeled; static declarations do not validate responses or authorize operations.',
    },
    servers: [
      {
        url: '/',
        description:
          'Origin of the documented API; existing same-origin routing/proxy topology remains operator-owned.',
      },
    ],
    paths,
    components: {
      schemas: components,
      securitySchemes: {
        HttpsWebSession: {
          type: 'apiKey',
          in: 'cookie',
          name: '__Secure-better-auth.session_token',
          description:
            'Existing Better Auth session for an operator-configured HTTPS origin. Not an interchangeable request-selected authentication mode.',
        },
        LocalHttpWebSession: {
          type: 'apiKey',
          in: 'cookie',
          name: 'better-auth.session_token',
          description:
            'Existing session only for explicitly enabled nonproduction HTTP-loopback configuration. No production HTTP authorization is introduced.',
        },
      },
    },
    'x-rielia-semantic-registry': [
      ...checkBindings,
      ...admissionBindings,
      ...transformBindings,
    ].map(({ id, path, source }) => ({ id, path, source })),
    'x-rielia-excluded-surfaces': [
      'raw /api/auth/*splat Better Auth/OAuth internals',
      'private persisted receipt/cursor/configuration/diagnostic shapes',
      'frontend drafts/commands/prototype and generated framework/Prisma internals',
      'full error envelopes; current/accessCurrent/closeWarning remain existing runtime projections',
    ],
  };
  assertLocalReferences(document);
  return document;
}

/** Closed document: no external fetch or implicit ref resolution is permitted. */
export function assertLocalReferences(document: unknown): void {
  function visit(value: unknown) {
    if (!value || typeof value !== 'object') return;
    for (const [key, child] of Object.entries(value)) {
      if (key === '$ref') {
        if (typeof child !== 'string' || !child.startsWith('#/components/schemas/'))
          throw new Error('External or unsupported reference');
        const name = child.slice('#/components/schemas/'.length);
        const schemas = (document as OpenApiDocument).components?.schemas;
        if (!schemas || !Object.hasOwn(schemas, name))
          throw new Error(`Dangling schema reference: ${name}`);
      } else visit(child);
    }
  }
  visit(document);
}
export function stableJson(value: unknown): string {
  function sorted(input: unknown): unknown {
    if (Array.isArray(input)) return input.map(sorted);
    if (input && typeof input === 'object')
      return Object.fromEntries(
        Object.keys(input)
          .sort()
          .map((key) => [key, sorted((input as Record<string, unknown>)[key])]),
      );
    return input;
  }
  return JSON.stringify(sorted(value), null, 2) + '\n';
}
