import type { z } from 'zod';
import { taskProperties, taskStatusSchema } from '../index.js';
import { activityChangeValueSchemas } from '../task-collaboration-schemas.js';
import { closedSprintCapabilitiesSchema } from '../sprint-schemas.js';
import { sprintTransitionWireSchema } from '../task-planning-schemas.js';

type Json = z.core.JSONSchema.BaseSchema;
type Predicate = (value: Record<string, unknown>) => unknown;
function property(json: Json, key: string): Json {
  const value = json.properties?.[key];
  if (!value || typeof value !== 'object') throw new Error(`Missing relation property: ${key}`);
  return value;
}
function nonNull(json: Json): Json {
  const alternatives = json.anyOf;
  if (
    !alternatives ||
    alternatives.length !== 2 ||
    alternatives.some((value) => typeof value !== 'object' || value === null)
  )
    throw new Error('Expected canonical nullable relation field');
  const values = alternatives.filter((value) => value.type !== 'null');
  if (values.length !== 1) throw new Error('Expected one non-null relation field');
  return values[0]!;
}

// These finite partitions use the actual registered predicate, not a second
// implementation of its condition. Base field constraints come from canonical
// schema conversion. Equality, totals and current authority remain runtime-only.
function closingBinding(json: Json, predicate: Predicate, target: string): Json {
  const cases: Json[] = [];
  for (const destination of [null, 'backlog', 'export_target']) {
    for (const version of [null, 1]) {
      if (!predicate({ destination, [target]: version, total: 0, pendingParticipants: 0 }))
        continue;
      cases.push({
        properties: {
          destination:
            destination === 'export_target'
              ? { allOf: [nonNull(property(json, 'destination')), { not: { const: 'backlog' } }] }
              : destination === null
                ? { type: 'null' }
                : { const: destination },
          [target]: version === null ? { type: 'null' } : nonNull(property(json, target)),
        },
      });
    }
  }
  return { anyOf: cases };
}
function carriedOutcome(json: Json, predicate: Predicate): Json {
  const cases: Json[] = [];
  const dispositions = property(json, 'disposition').enum;
  if (!dispositions) throw new Error('Missing canonical disposition enum');
  for (const disposition of dispositions) {
    for (const targetSprintId of [null, 'export_target']) {
      for (const targetParticipationId of [null, 'export_visit']) {
        if (!predicate({ disposition, targetSprintId, targetParticipationId })) continue;
        cases.push({
          properties: {
            disposition: { const: disposition },
            targetSprintId:
              targetSprintId === null
                ? { type: 'null' }
                : nonNull(property(json, 'targetSprintId')),
            targetParticipationId:
              targetParticipationId === null
                ? { type: 'null' }
                : nonNull(property(json, 'targetParticipationId')),
          },
        });
      }
    }
  }
  return { anyOf: cases };
}
function parentBinding(json: Json, predicate: Predicate, nullable: boolean): Json {
  const cases: Json[] = [];
  for (const linked of [false, true]) {
    for (const versioned of [false, true]) {
      const sample = {
        ...(linked ? { parentTaskId: 'export_parent' } : nullable ? { parentTaskId: null } : {}),
        ...(versioned ? { expectedParentVersion: 1 } : {}),
      };
      if (!predicate(sample)) continue;
      cases.push({
        ...(linked || nullable
          ? {
              required: ['parentTaskId'],
              properties: {
                parentTaskId: linked
                  ? nullable
                    ? nonNull(property(json, 'parentTaskId'))
                    : property(json, 'parentTaskId')
                  : { type: 'null' },
              },
            }
          : { not: { required: ['parentTaskId'] } }),
        allOf: [
          versioned
            ? { required: ['expectedParentVersion'] }
            : { not: { required: ['expectedParentVersion'] } },
        ],
      });
    }
  }
  return { anyOf: cases };
}
function participationBinding(json: Json, predicate: Predicate): Json {
  const cases: Json[] = [];
  for (const current of [null, 'export_current'])
    for (const source of [null, 1])
      for (const target of [null, 'export_target'])
        for (const version of [null, 1]) {
          const sample = {
            expectedCurrentParticipationId: current,
            expectedSourceVersion: source,
            targetSprintId: target,
            expectedTargetVersion: version,
          };
          if (!predicate(sample)) continue;
          cases.push({
            properties: Object.fromEntries(
              Object.entries(sample).map(([key, value]) => [
                key,
                value === null ? { type: 'null' } : nonNull(property(json, key)),
              ]),
            ),
          });
        }
  return { anyOf: cases };
}

function presencePatch(json: Json, predicate: Predicate, task: boolean): Json {
  const names = task
    ? taskProperties
    : Object.keys(json.properties ?? {}).filter(
        (key) => key !== 'version' && key !== 'expectedVersion',
      );
  if (names.length < 1 || names.length > 7) throw new Error('Unsupported patch partition');
  const accepted = names.filter((key) => predicate({ [key]: true }));
  for (let mask = 0; mask < 2 ** names.length; mask++) {
    const keys = names.filter((_key, index) => mask & (1 << index));
    if (
      !!predicate(Object.fromEntries(keys.map((key) => [key, true]))) !==
      keys.some((key) => accepted.includes(key))
    )
      throw new Error('Unsupported presence refinement');
  }
  if (!accepted.length) throw new Error('Empty presence relation');
  return { anyOf: accepted.map((key) => ({ required: [key] })) };
}
function statePresence(predicate: Predicate, planned: boolean): Json {
  const names = planned ? ['startedAt', 'closedAt'] : ['closedAt'];
  const forbidden = names.filter((key) => !predicate({ [key]: true }));
  for (let mask = 0; mask < 2 ** names.length; mask++) {
    const keys = names.filter((_key, index) => mask & (1 << index));
    if (
      !!predicate(Object.fromEntries(keys.map((key) => [key, true]))) !==
      !keys.some((key) => forbidden.includes(key))
    )
      throw new Error('Unsupported state presence refinement');
  }
  if (!forbidden.length) throw new Error('Empty state presence relation');
  return { not: { anyOf: forbidden.map((key) => ({ required: [key] })) } };
}
function provenanceBinding(json: Json, predicate: Predicate): Json {
  const modes = property(json, 'executionMode').enum;
  const sources = property(json, 'source').enum;
  if (!modes || !sources) throw new Error('Missing canonical provenance enums');
  const cases: Json[] = [];
  for (const executionMode of modes)
    for (const source of sources)
      for (const grantId of [null, 'export_grant']) {
        if (!predicate({ executionMode, source, grantId })) continue;
        cases.push({
          properties: {
            executionMode: { const: executionMode },
            source: { const: source },
            grantId: grantId === null ? { type: 'null' } : nonNull(property(json, 'grantId')),
          },
        });
      }
  return { anyOf: cases };
}
function consequenceBinding(json: Json, predicate: Predicate): Json {
  const dispositions = property(json, 'disposition').enum;
  if (!dispositions) throw new Error('Missing consequence dispositions');
  const cases: Json[] = [];
  for (const status of taskStatusSchema.options)
    for (const disposition of dispositions) {
      // Representative admitted snapshot, not a second validation definition.
      const snapshot = {
        version: 1,
        status,
        estimatePoints: null,
        parentTaskId: null,
        archivedAt: null,
      };
      if (!predicate({ snapshot, disposition })) continue;
      cases.push({
        properties: {
          snapshot: { properties: { status: { const: status } } },
          disposition: { const: disposition },
        },
      });
    }
  return { anyOf: cases };
}

/** Only the reviewed null/presence/disposition partitions are exported here. */
export function applyStructuralRelation(
  id: string,
  json: Json,
  fn: unknown,
  convert: (value: z.core.$ZodType) => Json,
): void {
  if (typeof fn !== 'function') throw new Error('Missing canonical refinement function');
  const predicate = fn as Predicate;
  let relation: Json | undefined;
  switch (id) {
    case 'R004':
      relation = closingBinding(json, predicate, 'expectedTargetVersion');
      break;
    case 'R044':
      relation = closingBinding(json, predicate, 'targetOrdinal');
      break;
    case 'R013':
      relation = parentBinding(json, predicate, false);
      break;
    case 'R039':
      relation = parentBinding(json, predicate, true);
      break;
    case 'R040':
      relation = participationBinding(json, predicate);
      break;
    case 'R031':
    case 'R051':
      relation = carriedOutcome(json, predicate);
      break;
    case 'R019':
    case 'R023':
    case 'R085':
      relation = presencePatch(json, predicate, false);
      break;
    case 'R020':
      relation = presencePatch(json, predicate, true);
      break;
    case 'R046':
      relation = statePresence(predicate, true);
      break;
    case 'R048':
      relation = statePresence(predicate, false);
      break;
    case 'R030':
    case 'R047':
    case 'R074':
      relation = provenanceBinding(json, predicate);
      break;
    case 'R042':
      relation = consequenceBinding(json, predicate);
      break;
    case 'R049':
      relation = { properties: { capabilities: convert(closedSprintCapabilitiesSchema) } };
      break;
    case 'R056':
      relation = convert(sprintTransitionWireSchema);
      break;
    case 'R076':
      relation = {
        anyOf: Object.entries(activityChangeValueSchemas).map(([field, value]) => ({
          properties: { field: { const: field }, before: convert(value), after: convert(value) },
        })),
      };
      break;
    default:
      return;
  }
  if (relation.anyOf?.length === 0) throw new Error('Empty structural relation');
  json.allOf = [...(json.allOf ?? []), relation];
}
