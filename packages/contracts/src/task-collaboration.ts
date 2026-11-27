import {
  activityChangeSchema,
  closeWarningSchema,
  taskCommentSchema,
  taskCommentReviewSchema,
  taskCollaborationPageSchemas,
  type ActivityChange,
  type CloseWarning,
  type CollaborationCollection,
  type TaskCollaborationPages,
  type TaskComment,
  type TaskCommentReview,
} from './task-collaboration-schemas.js';
import {
  collaborationActionSchema,
  type TaskCollaborationCommand,
} from './task-collaboration-input-schemas.js';
export {
  collaborationCollections,
  collaborationCollectionSchema,
  taskActivityActions,
  taskActivityFields,
  collaborationCursorSchema,
  taskReferenceSchema,
  collaborationProvenanceSchema,
  taskHistoryProvenanceSchema,
  closeWarningSchema,
  activityChangeSchema,
  taskCommentSchema,
  taskCommentReviewSchema,
  taskActivitySchema,
  collaborationPageSchema,
  taskRelationsSchema,
  taskParentCandidatesSchema,
  checklistItemSchema,
  taskChecklistSchema,
  taskCommentsSchema,
  taskHistorySchema,
  taskCollaborationPageSchemas,
  createTaskFieldsSchema,
  type CollaborationCollection,
  type TaskReference,
  type CollaborationPage,
  type TaskRelations,
  type TaskParentCandidates,
  type ChecklistItem,
  type TaskChecklist,
  type TaskComment,
  type TaskComments,
  type TaskCommentReview,
  type ActivityChange,
  type TaskActivity,
  type TaskHistory,
  type TaskCollaborationPages,
  type CloseWarning,
  type CreateTaskFields,
} from './task-collaboration-schemas.js';
export * from './task-collaboration-input-schemas.js';

// This compatibility selector deliberately accepts partial {type} values. It is
// not a complete command validator; request schemas own actual body admission.
export function isCollaborationCommand(
  value: { type: string } | null,
): value is TaskCollaborationCommand {
  return value !== null && collaborationActionSchema.safeParse(value.type).success;
}
export function isCloseWarning(value: unknown): value is CloseWarning {
  return closeWarningSchema.safeParse(value).success;
}
export function isActivityChange(value: unknown): value is ActivityChange {
  return activityChangeSchema.safeParse(value).success;
}
export function isTaskComment(value: unknown): value is TaskComment {
  return taskCommentSchema.safeParse(value).success;
}
export function isTaskCommentReview(value: unknown): value is TaskCommentReview {
  return taskCommentReviewSchema.safeParse(value).success;
}
export function isCollaborationPage<K extends CollaborationCollection>(
  value: unknown,
  collection: K,
): value is TaskCollaborationPages[K] {
  // Retain the old typed-argument fallback to history for runtime callers.
  const schema =
    collection === 'relations'
      ? taskCollaborationPageSchemas.relations
      : collection === 'parent-candidates'
        ? taskCollaborationPageSchemas['parent-candidates']
        : collection === 'checklist'
          ? taskCollaborationPageSchemas.checklist
          : collection === 'comments'
            ? taskCollaborationPageSchemas.comments
            : taskCollaborationPageSchemas.history;
  return schema.safeParse(value).success;
}
