import { z } from 'zod';
import { discoveryIdentifierSchema, isRecord } from '@rielia/contracts';

const receiptRecordSchema = z.custom<Record<string, unknown>>(isRecord);
const ordinaryStringSchema = z.string();

// Aborting refinements retain the receipt owners' short-circuit property reads.
// Ignored IDs, operations and extra values must stay unread until their stage.
export const projectPlanningReceiptSchema = receiptRecordSchema.pipe(
  z.object({ kind: z.literal('project-planning') }),
);
export const plannedSprintReceiptSchema = receiptRecordSchema
  .refine((value) => value['kind'] === 'planned-sprint', { abort: true })
  .pipe(z.object({ id: discoveryIdentifierSchema }));

export function sprintScopeReceiptIdentitySchema(target: string, entity: 'task' | 'sprint') {
  return receiptRecordSchema
    .refine((value) => value['id'] === target, { abort: true })
    .refine((value) => value['entity'] === entity, { abort: true });
}
export const taskPlanningReceiptSchema = receiptRecordSchema.pipe(
  z.object({ kind: z.literal('task-planning') }),
);
export function sprintTransitionReceiptSchema(
  action: 'start-sprint' | 'set-task-sprint' | 'estimate-task',
) {
  return (
    receiptRecordSchema
      // The owner historically reads operation before testing the transition tag.
      .transform((value) => ({ operation: value['operation'], kind: value['kind'] }))
      .refine((value) => value.kind === 'sprint-transition', { abort: true })
      .transform((value) => value['operation'])
      .pipe(
        receiptRecordSchema
          .refine((value) => value['type'] === action, { abort: true })
          .refine((value) => discoveryIdentifierSchema.safeParse(value['activityId']).success, {
            abort: true,
          })
          .refine(
            (value) =>
              value['sprintId'] === null ||
              discoveryIdentifierSchema.safeParse(value['sprintId']).success,
            { abort: true },
          )
          .refine(
            (value) =>
              value['enteredVisitId'] === null ||
              discoveryIdentifierSchema.safeParse(value['enteredVisitId']).success,
            { abort: true },
          )
          .refine(
            (value) =>
              value['exitedVisitId'] === null ||
              discoveryIdentifierSchema.safeParse(value['exitedVisitId']).success,
            { abort: true },
          ),
      )
  );
}

export function sprintCloseReceiptSchema(source: string) {
  return receiptRecordSchema
    .refine((value) => value['kind'] === 'sprint-close', { abort: true })
    .refine((value) => value['sprintId'] === source, { abort: true })
    .refine((value) => ordinaryStringSchema.safeParse(value['closureId']).success, {
      abort: true,
    })
    .refine((value) => ordinaryStringSchema.safeParse(value['activityId']).success, {
      abort: true,
    })
    .pipe(z.object({ closureId: ordinaryStringSchema, activityId: ordinaryStringSchema }));
}
