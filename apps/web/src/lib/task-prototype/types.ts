/** Fictional, memory-only T01 adapter. These are NOT public API/domain contracts. */
export type TaskStatus = 'backlog' | 'todo' | 'in_progress' | 'done' | 'canceled';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';
export type PrototypeView = 'my-tasks' | 'list' | 'board' | 'sprints';
export type PrototypeScenario = 'seeded' | 'empty';

export interface DemoPrincipal {
  readonly id: string;
  readonly name: string;
  readonly kind: 'human' | 'agent';
}
export type DemoProvenance =
  | { readonly mode: 'human'; readonly source: 'web' }
  | { readonly mode: 'delegated'; readonly source: 'mcp'; readonly clientName: string }
  | { readonly mode: 'autonomous'; readonly source: 'mcp'; readonly clientName: string };

export interface TaskFields {
  readonly title: string;
  readonly description: string;
  readonly status: TaskStatus;
  readonly priority: TaskPriority;
  readonly assigneeId: string | null;
  readonly labelIds: readonly string[];
  readonly dueDate: string | null;
  readonly points: number | null;
}
export interface DemoTask extends TaskFields {
  readonly id: string;
  readonly key: string;
  readonly workspaceId: string;
  readonly projectId: string;
  readonly createdByPrincipalId: string;
  readonly provenance: DemoProvenance;
  readonly sprintId: string | null;
  readonly version: number;
}
export interface TaskDraft extends TaskFields {
  readonly taskId: string;
  readonly expectedVersion: number | null;
}
export type ClosureDestination =
  | { readonly kind: 'backlog' }
  | { readonly kind: 'sprint'; readonly sprintId: string };
export interface SprintSummary {
  readonly doneTaskIds: readonly string[];
  readonly canceledTaskIds: readonly string[];
  readonly unfinishedTaskIds: readonly string[];
}
export interface SprintFields {
  readonly name: string;
  readonly goal: string;
  /** Project-local ISO dates; endsOn is exclusive. Demo project uses UTC. */
  readonly startsOn: string;
  readonly endsOn: string;
}
export interface DemoSprint extends SprintFields {
  readonly id: string;
  readonly state: 'planned' | 'active' | 'closed';
  readonly closure: (SprintSummary & { readonly destination: ClosureDestination }) | null;
}
export interface SprintDraft extends SprintFields {
  readonly sprintId: string;
  readonly taskIds: readonly string[];
}
export interface TaskFilters {
  readonly search: string;
  readonly status: TaskStatus | 'all';
  readonly priority: TaskPriority | 'all';
  readonly assigneeId: string; // all | unassigned | principal ID
  readonly labelId: string; // all | label ID
  readonly sprintId: string; // all | backlog (no sprint) | sprint ID
}
export interface PrototypeError {
  readonly code: 'validation' | 'invalid-action' | 'version-conflict' | 'simulated-save';
  readonly message: string;
  readonly field: string | null;
}
/** Feedback/retry belongs to this operation, independently of navigation or selection. */
export type SaveContext =
  | { readonly kind: 'task'; readonly taskId: string }
  | { readonly kind: 'status'; readonly taskId: string; readonly status: TaskStatus }
  | { readonly kind: 'sprint'; readonly sprintId: string }
  | { readonly kind: 'start-sprint'; readonly sprintId: string }
  /** Null destination represents a rejected close without a destination; never a captured retry. */
  | { readonly kind: 'close-sprint'; readonly sprintId: string; readonly destination: ClosureDestination | null };
export type SaveKind = SaveContext['kind'];
export interface PrototypeState {
  readonly workspace: { readonly id: string; readonly name: string };
  readonly project: { readonly id: string; readonly key: string; readonly name: string; readonly description: string; readonly timeZone: string };
  readonly currentPrincipalId: string;
  readonly principals: readonly DemoPrincipal[];
  readonly statuses: readonly { readonly id: TaskStatus; readonly name: string }[];
  readonly labels: readonly { readonly id: string; readonly name: string }[];
  readonly tasks: readonly DemoTask[];
  readonly sprints: readonly DemoSprint[];
  readonly view: PrototypeView;
  readonly filters: TaskFilters;
  readonly visibleTasks: readonly DemoTask[];
  readonly columns: readonly { readonly status: TaskStatus; readonly tasks: readonly DemoTask[] }[];
  readonly selectedTaskId: string | null;
  readonly selectedTask: DemoTask | null;
  readonly taskDraft: TaskDraft | null;
  readonly sprintDraft: SprintDraft | null;
  /** Latest feedback only. Unbound action errors have null context, never the selected record. */
  readonly save: { readonly status: 'idle' | 'pending' | 'saved' | 'error'; readonly kind: SaveKind | null; readonly context: SaveContext | null; readonly error: PrototypeError | null };
  /** Captured previous failed save remains retryable even when a rejected patch shows a field error. */
  readonly canRetry: boolean;
  /** Captured operation iff canRetry; independent of the latest save feedback. */
  readonly retryContext: SaveContext | null;
  readonly nextSaveWillFail: boolean;
  readonly scenario: PrototypeScenario;
}
export interface TaskPrototypeActions {
  setView(view: PrototypeView): void;
  setFilters(filters: Partial<TaskFilters>): void;
  clearFilters(): void;
  selectTask(taskId: string | null): void;
  beginCreateTask(status?: TaskStatus): void;
  beginEditTask(taskId: string): void;
  updateTaskDraft(fields: Partial<TaskFields>): void;
  discardTaskDraft(): void;
  saveTask(): Promise<boolean>;
  moveTask(taskId: string, status: TaskStatus): Promise<boolean>;
  beginCreateSprint(): void;
  beginEditSprint(sprintId: string): void;
  updateSprintDraft(fields: Partial<SprintFields & { taskIds: readonly string[] }>): void;
  discardSprintDraft(): void;
  saveSprint(): Promise<boolean>;
  startSprint(sprintId: string): Promise<boolean>;
  closeSprint(sprintId: string, destination: ClosureDestination): Promise<boolean>;
  retrySave(): Promise<boolean>;
  simulateNextSaveFailure(): void;
  reset(scenario?: PrototypeScenario): void;
}
export interface TaskPrototypeAdapter {
  getSnapshot(): PrototypeState;
  subscribe(listener: () => void): () => void;
  readonly actions: TaskPrototypeActions;
}
