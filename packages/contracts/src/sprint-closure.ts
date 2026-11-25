import {
  closeSprintBindingSchema,
  sprintClosePreviewSchema,
  sprintClosureSchema,
  sprintClosingOutcomePageSchema,
  sprintCloseResultSchema,
  type CloseSprintInput,
  type SprintClosePreview,
  type SprintClosure,
  type SprintClosingOutcomePage,
  type SprintCloseResult,
} from './sprint-closure-schemas.js';

export * from './sprint-closure-schemas.js';
export * from './sprint-closure-input-schemas.js';

// Validation copies may strip ignored keys. Guards always narrow the original object.
export function isCloseSprintInput(value: unknown): value is CloseSprintInput {
  return closeSprintBindingSchema.safeParse(value).success;
}
export function isSprintClosePreview(value: unknown): value is SprintClosePreview {
  return sprintClosePreviewSchema.safeParse(value).success;
}
export function isSprintClosure(value: unknown): value is SprintClosure {
  return sprintClosureSchema.safeParse(value).success;
}
export function isSprintClosingOutcomePage(value: unknown): value is SprintClosingOutcomePage {
  return sprintClosingOutcomePageSchema.safeParse(value).success;
}
export function isSprintCloseResult(value: unknown): value is SprintCloseResult {
  return sprintCloseResultSchema.safeParse(value).success;
}
