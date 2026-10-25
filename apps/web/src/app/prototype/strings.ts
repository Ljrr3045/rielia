import type { PrototypeError, PrototypeView, TaskPriority, TaskStatus } from '../../lib/task-prototype/types';

export type Lang = 'es' | 'en';

export interface Copy {
  skipLink: string;
  prototypeLabel: string;
  fictionalData: string;
  memoryOnly: string;
  demoOptions: string;
  simulateFailure: string;
  failureArmed: string;
  resetSeeded: string;
  resetEmpty: string;
  resetWarning: string;
  resetConfirm: string;
  resetCancel: string;
  cancel: string;
  language: string;
  workspaceLabel: string;
  myWork: string;
  projects: string;
  myTasks: string;
  list: string;
  board: string;
  sprints: string;
  projectLabel: string;
  openMenu: string;
  closeMenu: string;
  mainNavigation: string;
  viewNavigation: string;
  newTask: string;
  newSprint: string;
  filters: string;
  filterPanel: string;
  search: string;
  searchPlaceholder: string;
  clearSearch: string;
  status: string;
  priority: string;
  assignee: string;
  label: string;
  sprint: string;
  all: string;
  unassigned: string;
  noSprint: string;
  clearFilters: string;
  taskList: string;
  boardList: string;
  detailRegion: string;
  edit: string;
  close: string;
  createdBy: string;
  assignedTo: string;
  labels: string;
  dueDate: string;
  points: string;
  description: string;
  noDescription: string;
  agent: string;
  you: string;
  throughWeb: string;
  throughClient: string;
  autonomousAgent: string;
  changeStatusFor: (key: string) => string;
  addTaskTo: (name: string) => string;
  openTaskDetail: (key: string) => string;
  boardColumn: string;
  emptyColumn: string;
  addTask: string;
  missingTaskTitle: string;
  missingTaskBody: string;
  closeDetail: string;
  properties: string;
  provenance: string;
  taskKey: string;
  noDueDate: string;
  unestimated: string;
  noLabels: string;
  pointsShort: string;
  pointsShortPlural: string;
  emptyProjectTitle: string;
  emptyProjectBody: string;
  emptyMyTasksTitle: string;
  emptyMyTasksBody: string;
  noResultsTitle: string;
  noResultsBody: string;
  viewAllTasks: string;
  createTask: string;
  createFirstTask: string;
  createTaskTitle: string;
  editTaskTitle: string;
  titleLabel: string;
  titlePlaceholder: string;
  descriptionLabel: string;
  descriptionPlaceholder: string;
  dueDateHint: string;
  pointsHint: string;
  moreDetails: string;
  fewerDetails: string;
  saveTask: string;
  saving: string;
  discardDraft: string;
  discardDraftTitle: string;
  discardDraftBody: string;
  keepEditing: string;
  discard: string;
  errorSummary: string;
  versionConflictAction: string;
  optional: string;
  required: string;
  savingTask: string;
  savingStatus: string;
  savingSprint: string;
  startingSprint: string;
  closingSprint: string;
  savedTask: string;
  savedStatus: string;
  savedSprint: string;
  startedSprint: string;
  closedSprint: string;
  saveError: string;
  retry: string;
  draftKept: string;
  planned: string;
  active: string;
  closed: string;
  sprintGoal: string;
  sprintDates: string;
  sprintScope: string;
  editPlan: string;
  startSprint: string;
  closeSprintAction: string;
  sprintTasks: string;
  sprintPoints: string;
  sprintUnestimated: string;
  doneTasks: string;
  canceledTasks: string;
  unfinishedTasks: string;
  noSprintsTitle: string;
  noSprintsBody: string;
  noScope: string;
  activeSprintExists: string;
  createSprintTitle: string;
  editSprintTitle: string;
  sprintNameLabel: string;
  sprintNamePlaceholder: string;
  sprintGoalLabel: string;
  sprintGoalPlaceholder: string;
  startDateLabel: string;
  endDateLabel: string;
  endDateHint: string;
  scopeLabel: string;
  scopeHint: string;
  scopeSelected: (count: number) => string;
  scopeEmpty: string;
  saveSprint: string;
  createSprint: string;
  discardSprint: string;
  closeSprintTitle: string;
  closeSprintSummary: string;
  closeSprintUnfinishedHelp: string;
  destinationLabel: string;
  destinationBacklog: string;
  destinationSprint: string;
  noOtherSprint: string;
  retryFrozenDestination: string;
  canceledNotDelivered: string;
  closedDestinationBacklog: string;
  closedDestinationSprint: (name: string) => string;
  filtersCount: (count: number) => string;
  taskCount: (count: number) => string;
  pointsTotal: (count: number) => string;
  unestimatedCount: (count: number) => string;
}

const es: Copy = {
  skipLink: 'Saltar al contenido',
  prototypeLabel: 'Prototipo',
  fictionalData: 'Datos ficticios',
  memoryOnly: 'Los cambios solo viven en esta pestaña',
  demoOptions: 'Opciones de demo',
  simulateFailure: 'Simular fallo al guardar',
  failureArmed: 'Fallo simulado armado para el próximo guardado',
  resetSeeded: 'Restablecer con datos',
  resetEmpty: 'Restablecer vacío',
  resetWarning: 'Se perderán los cambios de esta demo.',
  resetConfirm: 'Sí, restablecer',
  resetCancel: 'Cancelar',
  cancel: 'Cancelar',
  language: 'Idioma',
  workspaceLabel: 'Espacio de trabajo',
  myWork: 'Mi trabajo',
  projects: 'Proyectos',
  myTasks: 'Mis tareas',
  list: 'Lista',
  board: 'Tablero',
  sprints: 'Sprints',
  projectLabel: 'Proyecto',
  openMenu: 'Abrir navegación',
  closeMenu: 'Cerrar navegación',
  mainNavigation: 'Navegación principal',
  viewNavigation: 'Navegación de vistas',
  newTask: 'Nueva tarea',
  newSprint: 'Nuevo sprint',
  filters: 'Filtros',
  filterPanel: 'Filtros de tareas',
  search: 'Buscar',
  searchPlaceholder: 'Buscar por título o clave',
  clearSearch: 'Borrar búsqueda',
  status: 'Estado',
  priority: 'Prioridad',
  assignee: 'Responsable',
  label: 'Etiqueta',
  sprint: 'Sprint',
  all: 'Todos',
  unassigned: 'Sin asignar',
  noSprint: 'Sin sprint',
  clearFilters: 'Quitar filtros',
  taskList: 'Lista de tareas',
  boardList: 'Tablero por estados',
  detailRegion: 'Detalle de la tarea',
  edit: 'Editar',
  close: 'Cerrar',
  createdBy: 'Creada por',
  assignedTo: 'Asignada a',
  labels: 'Etiquetas',
  dueDate: 'Vence',
  points: 'Puntos',
  description: 'Descripción',
  noDescription: 'Sin descripción.',
  agent: 'Agente',
  you: 'Tú',
  throughWeb: 'Desde la web',
  throughClient: 'Mediante Cursor (demo)',
  autonomousAgent: 'Agente autónomo',
  changeStatusFor: key => `Cambiar estado de ${key}`,
  addTaskTo: name => `Añadir tarea a ${name}`,
  openTaskDetail: key => `Abrir ${key}`,
  boardColumn: 'Columna',
  emptyColumn: 'No hay tareas en esta columna.',
  addTask: 'Añadir tarea',
  missingTaskTitle: 'Esta tarea ya no está disponible',
  missingTaskBody: 'Cierra el detalle para volver a la vista anterior.',
  closeDetail: 'Cerrar detalle',
  properties: 'Propiedades',
  provenance: 'Origen',
  taskKey: 'Clave',
  noDueDate: 'Sin fecha',
  unestimated: 'Sin estimar',
  noLabels: 'Sin etiquetas',
  pointsShort: 'pto',
  pointsShortPlural: 'ptos',
  emptyProjectTitle: 'El proyecto empieza con una tarea',
  emptyProjectBody: 'Añade lo primero que quieras mover. Solo necesitas un título.',
  emptyMyTasksTitle: 'No tienes tareas asignadas',
  emptyMyTasksBody: 'Las tareas asignadas a ti aparecerán aquí. Puedes ver todo el proyecto o crear una tarea.',
  noResultsTitle: 'No hay tareas que coincidan',
  noResultsBody: 'Prueba otra búsqueda o quita algunos filtros.',
  viewAllTasks: 'Ver todas las tareas',
  createTask: 'Crear tarea',
  createFirstTask: 'Crear la primera tarea',
  createTaskTitle: 'Nueva tarea',
  editTaskTitle: 'Editar tarea',
  titleLabel: 'Título',
  titlePlaceholder: '¿Qué hay que hacer?',
  descriptionLabel: 'Descripción',
  descriptionPlaceholder: 'Añade contexto, criterios o enlaces.',
  dueDateHint: 'Solo fecha; sin hora.',
  pointsHint: 'Número entero; opcional.',
  moreDetails: 'Añadir detalles',
  fewerDetails: 'Ocultar detalles',
  saveTask: 'Guardar tarea',
  saving: 'Guardando…',
  discardDraft: 'Descartar',
  discardDraftTitle: '¿Descartar este borrador?',
  discardDraftBody: 'Los cambios sin guardar se perderán.',
  keepEditing: 'Seguir editando',
  discard: 'Descartar',
  errorSummary: 'Revisa los campos marcados.',
  versionConflictAction: 'Descartar y revisar',
  optional: 'opcional',
  required: 'obligatorio',
  savingTask: 'Guardando tarea…',
  savingStatus: 'Guardando estado…',
  savingSprint: 'Guardando sprint…',
  startingSprint: 'Iniciando sprint…',
  closingSprint: 'Cerrando sprint…',
  savedTask: 'Tarea guardada.',
  savedStatus: 'Estado actualizado.',
  savedSprint: 'Sprint guardado.',
  startedSprint: 'Sprint iniciado.',
  closedSprint: 'Sprint cerrado.',
  saveError: 'No se pudo guardar',
  retry: 'Reintentar',
  draftKept: 'Tu borrador sigue aquí.',
  planned: 'Planificado',
  active: 'Activo',
  closed: 'Cerrado',
  sprintGoal: 'Objetivo',
  sprintDates: 'Fechas',
  sprintScope: 'Alcance',
  editPlan: 'Editar plan',
  startSprint: 'Iniciar sprint',
  closeSprintAction: 'Cerrar sprint',
  sprintTasks: 'Tareas',
  sprintPoints: 'Puntos',
  sprintUnestimated: 'Sin estimar',
  doneTasks: 'Terminadas',
  canceledTasks: 'Canceladas',
  unfinishedTasks: 'Pendientes',
  noSprintsTitle: 'Todavía no hay sprints',
  noSprintsBody: 'Crea un sprint para agrupar el trabajo de las próximas semanas.',
  noScope: 'Este sprint no tiene tareas.',
  activeSprintExists: 'Ya hay un sprint activo. Ciérralo antes de iniciar otro.',
  createSprintTitle: 'Nuevo sprint',
  editSprintTitle: 'Editar sprint',
  sprintNameLabel: 'Nombre',
  sprintNamePlaceholder: 'Claridad primero',
  sprintGoalLabel: 'Objetivo',
  sprintGoalPlaceholder: '¿Qué queremos conseguir?',
  startDateLabel: 'Inicio',
  endDateLabel: 'Fin',
  endDateHint: 'La fecha de fin es exclusiva.',
  scopeLabel: 'Alcance',
  scopeHint: 'Elige tareas del backlog o de este sprint.',
  scopeSelected: count => `${count} ${count === 1 ? 'tarea seleccionada' : 'tareas seleccionadas'}`,
  scopeEmpty: 'No hay tareas disponibles para añadir.',
  saveSprint: 'Guardar sprint',
  createSprint: 'Crear sprint',
  discardSprint: 'Descartar',
  closeSprintTitle: 'Cerrar sprint',
  closeSprintSummary: 'Resumen del sprint',
  closeSprintUnfinishedHelp: 'Elige dónde continúan las tareas sin terminar.',
  destinationLabel: 'Destino de las tareas pendientes',
  destinationBacklog: 'Volver al backlog',
  destinationSprint: 'Mover a otro sprint planificado',
  noOtherSprint: 'No hay otro sprint planificado.',
  retryFrozenDestination: 'El reintento usará el destino ya elegido.',
  canceledNotDelivered: 'Las tareas canceladas no cuentan como entrega.',
  closedDestinationBacklog: 'Las tareas pendientes volvieron al backlog.',
  closedDestinationSprint: name => `Las tareas pendientes pasaron a ${name}.`,
  filtersCount: count => `${count} ${count === 1 ? 'filtro activo' : 'filtros activos'}`,
  taskCount: count => `${count} ${count === 1 ? 'tarea' : 'tareas'}`,
  pointsTotal: count => `${count} ${count === 1 ? 'punto' : 'puntos'}`,
  unestimatedCount: count => `${count} sin estimar`,
};

const en: Copy = {
  skipLink: 'Skip to content',
  prototypeLabel: 'Prototype',
  fictionalData: 'Fictional data',
  memoryOnly: 'Changes live only in this tab',
  demoOptions: 'Demo options',
  simulateFailure: 'Simulate save failure',
  failureArmed: 'Simulated failure armed for the next save',
  resetSeeded: 'Reset with data',
  resetEmpty: 'Reset empty',
  resetWarning: 'This demo’s changes will be lost.',
  resetConfirm: 'Yes, reset',
  resetCancel: 'Cancel',
  cancel: 'Cancel',
  language: 'Language',
  workspaceLabel: 'Workspace',
  myWork: 'My work',
  projects: 'Projects',
  myTasks: 'My tasks',
  list: 'List',
  board: 'Board',
  sprints: 'Sprints',
  projectLabel: 'Project',
  openMenu: 'Open navigation',
  closeMenu: 'Close navigation',
  mainNavigation: 'Main navigation',
  viewNavigation: 'View navigation',
  newTask: 'New task',
  newSprint: 'New sprint',
  filters: 'Filters',
  filterPanel: 'Task filters',
  search: 'Search',
  searchPlaceholder: 'Search by title or key',
  clearSearch: 'Clear search',
  status: 'Status',
  priority: 'Priority',
  assignee: 'Assignee',
  label: 'Label',
  sprint: 'Sprint',
  all: 'All',
  unassigned: 'Unassigned',
  noSprint: 'No sprint',
  clearFilters: 'Clear filters',
  taskList: 'Task list',
  boardList: 'Status board',
  detailRegion: 'Task detail',
  edit: 'Edit',
  close: 'Close',
  createdBy: 'Created by',
  assignedTo: 'Assigned to',
  labels: 'Labels',
  dueDate: 'Due',
  points: 'Points',
  description: 'Description',
  noDescription: 'No description.',
  agent: 'Agent',
  you: 'You',
  throughWeb: 'From web',
  throughClient: 'Through Cursor (demo)',
  autonomousAgent: 'Autonomous agent',
  changeStatusFor: key => `Change status for ${key}`,
  addTaskTo: name => `Add task to ${name}`,
  openTaskDetail: key => `Open ${key}`,
  boardColumn: 'Column',
  emptyColumn: 'No tasks in this column.',
  addTask: 'Add task',
  missingTaskTitle: 'This task is no longer available',
  missingTaskBody: 'Close the detail to return to the previous view.',
  closeDetail: 'Close detail',
  properties: 'Properties',
  provenance: 'Provenance',
  taskKey: 'Key',
  noDueDate: 'No date',
  unestimated: 'Unestimated',
  noLabels: 'No labels',
  pointsShort: 'pt',
  pointsShortPlural: 'pts',
  emptyProjectTitle: 'The project starts with a task',
  emptyProjectBody: 'Add the first thing you want to move forward. A title is enough.',
  emptyMyTasksTitle: 'You have no assigned tasks',
  emptyMyTasksBody: 'Tasks assigned to you will appear here. You can view the whole project or create a task.',
  noResultsTitle: 'No matching tasks',
  noResultsBody: 'Try another search or clear some filters.',
  viewAllTasks: 'View all tasks',
  createTask: 'Create task',
  createFirstTask: 'Create the first task',
  createTaskTitle: 'New task',
  editTaskTitle: 'Edit task',
  titleLabel: 'Title',
  titlePlaceholder: 'What needs doing?',
  descriptionLabel: 'Description',
  descriptionPlaceholder: 'Add context, acceptance criteria, or links.',
  dueDateHint: 'Date only; no time.',
  pointsHint: 'Whole number; optional.',
  moreDetails: 'Add details',
  fewerDetails: 'Hide details',
  saveTask: 'Save task',
  saving: 'Saving…',
  discardDraft: 'Discard',
  discardDraftTitle: 'Discard this draft?',
  discardDraftBody: 'Unsaved changes will be lost.',
  keepEditing: 'Keep editing',
  discard: 'Discard',
  errorSummary: 'Review the marked fields.',
  versionConflictAction: 'Discard and review',
  optional: 'optional',
  required: 'required',
  savingTask: 'Saving task…',
  savingStatus: 'Saving status…',
  savingSprint: 'Saving sprint…',
  startingSprint: 'Starting sprint…',
  closingSprint: 'Closing sprint…',
  savedTask: 'Task saved.',
  savedStatus: 'Status updated.',
  savedSprint: 'Sprint saved.',
  startedSprint: 'Sprint started.',
  closedSprint: 'Sprint closed.',
  saveError: 'Could not save',
  retry: 'Retry',
  draftKept: 'Your draft is still here.',
  planned: 'Planned',
  active: 'Active',
  closed: 'Closed',
  sprintGoal: 'Goal',
  sprintDates: 'Dates',
  sprintScope: 'Scope',
  editPlan: 'Edit plan',
  startSprint: 'Start sprint',
  closeSprintAction: 'Close sprint',
  sprintTasks: 'Tasks',
  sprintPoints: 'Points',
  sprintUnestimated: 'Unestimated',
  doneTasks: 'Done',
  canceledTasks: 'Canceled',
  unfinishedTasks: 'Unfinished',
  noSprintsTitle: 'No sprints yet',
  noSprintsBody: 'Create a sprint to group the next few weeks of work.',
  noScope: 'This sprint has no tasks.',
  activeSprintExists: 'A sprint is already active. Close it before starting another.',
  createSprintTitle: 'New sprint',
  editSprintTitle: 'Edit sprint',
  sprintNameLabel: 'Name',
  sprintNamePlaceholder: 'Clarity first',
  sprintGoalLabel: 'Goal',
  sprintGoalPlaceholder: 'What do we want to achieve?',
  startDateLabel: 'Start',
  endDateLabel: 'End',
  endDateHint: 'The end date is exclusive.',
  scopeLabel: 'Scope',
  scopeHint: 'Choose backlog tasks or tasks already in this sprint.',
  scopeSelected: count => `${count} ${count === 1 ? 'task selected' : 'tasks selected'}`,
  scopeEmpty: 'No tasks are available to add.',
  saveSprint: 'Save sprint',
  createSprint: 'Create sprint',
  discardSprint: 'Discard',
  closeSprintTitle: 'Close sprint',
  closeSprintSummary: 'Sprint summary',
  closeSprintUnfinishedHelp: 'Choose where unfinished tasks continue.',
  destinationLabel: 'Destination for unfinished tasks',
  destinationBacklog: 'Return to backlog',
  destinationSprint: 'Move to another planned sprint',
  noOtherSprint: 'There is no other planned sprint.',
  retryFrozenDestination: 'Retry will use the destination already chosen.',
  canceledNotDelivered: 'Canceled tasks do not count as delivery.',
  closedDestinationBacklog: 'Unfinished tasks returned to the backlog.',
  closedDestinationSprint: name => `Unfinished tasks moved to ${name}.`,
  filtersCount: count => `${count} active ${count === 1 ? 'filter' : 'filters'}`,
  taskCount: count => `${count} ${count === 1 ? 'task' : 'tasks'}`,
  pointsTotal: count => `${count} ${count === 1 ? 'point' : 'points'}`,
  unestimatedCount: count => `${count} unestimated`,
};

export const copy: Record<Lang, Copy> = { es, en };

export const VIEW_LABELS: Record<Lang, Record<PrototypeView, { title: string; subtitle: string }>> = {
  es: {
    'my-tasks': { title: 'Mis tareas', subtitle: 'Asignadas a ti en el proyecto de demostración' },
    list: { title: 'Lista', subtitle: 'Todas las tareas del proyecto' },
    board: { title: 'Tablero', subtitle: 'Arrastra una tarjeta o cambia su estado' },
    sprints: { title: 'Sprints', subtitle: 'Planifica, inicia y cierra iteraciones' },
  },
  en: {
    'my-tasks': { title: 'My tasks', subtitle: 'Assigned to you in the demo project' },
    list: { title: 'List', subtitle: 'Every task in the project' },
    board: { title: 'Board', subtitle: 'Drag a card or change its status' },
    sprints: { title: 'Sprints', subtitle: 'Plan, start, and close iterations' },
  },
};

const STATUS_LABELS: Record<Lang, Record<TaskStatus, string>> = {
  es: { backlog: 'Backlog', todo: 'Por hacer', in_progress: 'En curso', done: 'Terminada', canceled: 'Cancelada' },
  en: { backlog: 'Backlog', todo: 'To do', in_progress: 'In progress', done: 'Done', canceled: 'Canceled' },
};

const PRIORITY_LABELS: Record<Lang, Record<TaskPriority, string>> = {
  es: { low: 'Baja', medium: 'Media', high: 'Alta', urgent: 'Urgente' },
  en: { low: 'Low', medium: 'Medium', high: 'High', urgent: 'Urgent' },
};

export function statusLabel(status: TaskStatus, lang: Lang): string {
  return STATUS_LABELS[lang][status];
}

export function priorityLabel(priority: TaskPriority, lang: Lang): string {
  return PRIORITY_LABELS[lang][priority];
}

const SPRINT_STATE_LABELS: Record<Lang, Record<'planned' | 'active' | 'closed', string>> = {
  es: { planned: 'Planificado', active: 'Activo', closed: 'Cerrado' },
  en: { planned: 'Planned', active: 'Active', closed: 'Closed' },
};

export function sprintStateLabel(state: 'planned' | 'active' | 'closed', lang: Lang): string {
  return SPRINT_STATE_LABELS[lang][state];
}

const MONTHS_ES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sept', 'oct', 'nov', 'dic'] as const;
const MONTHS_EN = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'] as const;

export function formatDate(value: string | null, lang: Lang): string {
  if (value === null) return copy[lang].noDueDate;
  const parts = value.split('-');
  const year = Number(parts[0]);
  const month = Number(parts[1]);
  const day = Number(parts[2]);
  if (
    !Number.isInteger(year)
    || !Number.isInteger(month)
    || !Number.isInteger(day)
    || month < 1
    || month > 12
    || day < 1
    || day > 31
  ) {
    return value;
  }
  if (lang === 'es') return `${day} ${MONTHS_ES[month - 1]!} ${year}`;
  return `${MONTHS_EN[month - 1]!} ${day}, ${year}`;
}

export function formatSprintRange(startsOn: string, endsOn: string, lang: Lang): string {
  return `${formatDate(startsOn, lang)} – ${formatDate(endsOn, lang)}`;
}

const ES_ERRORS = new Map<string, string>([
  ['Enter a title between 1 and 200 characters.', 'Introduce un título de 1 a 200 caracteres.'],
  ['Keep the description within 5,000 characters.', 'La descripción no puede superar los 5.000 caracteres.'],
  ['Choose a demo status.', 'Elige un estado de la demo.'],
  ['Choose a demo priority.', 'Elige una prioridad de la demo.'],
  ['Choose a demo human or agent, or leave unassigned.', 'Elige una persona o agente de la demo, o deja la tarea sin asignar.'],
  ['Choose demo labels.', 'Elige etiquetas de la demo.'],
  ['Use a valid date (YYYY-MM-DD).', 'Usa una fecha válida (AAAA-MM-DD).'],
  ['Use whole points from 0 to 100, or leave unestimated.', 'Usa puntos enteros de 0 a 100, o deja la tarea sin estimar.'],
  ['Save or discard the current draft first.', 'Guarda o descarta el borrador actual primero.'],
  ['Only planned sprint details and scope can be edited.', 'Solo se pueden editar los detalles y el alcance de un sprint planificado.'],
  ['Enter a sprint name within 100 characters.', 'Introduce un nombre de sprint de hasta 100 caracteres.'],
  ['Enter a sprint goal within 500 characters.', 'Introduce un objetivo de sprint de hasta 500 caracteres.'],
  ['Enter a valid start date.', 'Introduce una fecha de inicio válida.'],
  ['End date must be after start (exclusive end).', 'La fecha de fin debe ser posterior al inicio (fin exclusivo).'],
  ['Select each task once.', 'Selecciona cada tarea una sola vez.'],
  ['Scope can include only backlog tasks or tasks already in this sprint.', 'El alcance solo puede incluir tareas del backlog o de este sprint.'],
  ['This demo task already exists.', 'Esta tarea de la demo ya existe.'],
  ['The task changed. Keep your draft, then discard and reopen to review current data.', 'La tarea cambió. Conserva tu borrador y, después, descártalo y vuelve a abrirla para revisar los datos actuales.'],
  ['The task changed. Review its current state.', 'La tarea cambió. Revisa su estado actual.'],
  ['Demo save failed. Your draft is retained; retry when ready.', 'No se pudo guardar. Tu borrador se conserva; reintenta cuando quieras.'],
  ['Simulated save failure. Nothing was saved; your draft is retained.', 'Fallo de guardado simulado. No se guardó nada; tu borrador se conserva.'],
  ['Only a planned sprint can start.', 'Solo puede iniciarse un sprint planificado.'],
  ['Close the active sprint before starting another.', 'Cierra el sprint activo antes de iniciar otro.'],
  ['Only an active sprint can close.', 'Solo puede cerrarse un sprint activo.'],
  ['Choose an explicit destination for unfinished tasks.', 'Elige un destino explícito para las tareas pendientes.'],
  ['Choose another planned sprint or backlog.', 'Elige otro sprint planificado o el backlog.'],
  ['Demo task was not found.', 'No se encontró la tarea de la demo.'],
  ['Choose a planned demo sprint.', 'Elige un sprint planificado de la demo.'],
]);

export function localizeError(error: PrototypeError, lang: Lang): string {
  if (lang === 'en') return error.message;
  return ES_ERRORS.get(error.message) ?? error.message;
}

export function savePendingLabel(kind: 'task' | 'status' | 'sprint' | 'start-sprint' | 'close-sprint', lang: Lang): string {
  const c = copy[lang];
  if (kind === 'task') return c.savingTask;
  if (kind === 'status') return c.savingStatus;
  if (kind === 'sprint') return c.savingSprint;
  if (kind === 'start-sprint') return c.startingSprint;
  return c.closingSprint;
}

export function saveSavedLabel(kind: 'task' | 'status' | 'sprint' | 'start-sprint' | 'close-sprint', lang: Lang): string {
  const c = copy[lang];
  if (kind === 'task') return c.savedTask;
  if (kind === 'status') return c.savedStatus;
  if (kind === 'sprint') return c.savedSprint;
  if (kind === 'start-sprint') return c.startedSprint;
  return c.closedSprint;
}
