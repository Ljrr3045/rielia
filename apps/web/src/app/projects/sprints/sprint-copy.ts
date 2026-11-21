import type { Bilingual } from '../strings';

export const sprintCopy = {
  title: { es: 'Sprints', en: 'Sprints' },
  choose: { es: 'Elegir sprint', en: 'Choose sprint' },
  chooseHint: {
    es: 'Elige un sprint para revisar su objetivo y alcance.',
    en: 'Choose a sprint to review its goal and scope.',
  },
  create: { es: 'Crear sprint', en: 'Create sprint' },
  edit: { es: 'Editar sprint', en: 'Edit sprint' },
  settings: { es: 'Configuración de planificación', en: 'Planning settings' },
  planned: { es: 'Planificado', en: 'Planned' },
  active: { es: 'Activo', en: 'Active' },
  closed: { es: 'Cerrado', en: 'Closed' },
  goal: { es: 'Objetivo', en: 'Goal' },
  name: { es: 'Nombre', en: 'Name' },
  startDate: { es: 'Fecha de inicio', en: 'Start date' },
  endDate: { es: 'Fecha de fin (exclusiva)', en: 'End date (exclusive)' },
  datesHint: {
    es: 'El sprint termina al comenzar la fecha de fin; ese día no está incluido.',
    en: 'The sprint ends at the start of the end date; that day is not included.',
  },
  zone: { es: 'Zona horaria del sprint', en: 'Sprint time zone' },
  zoneHint: {
    es: 'La zona queda fijada al crear el sprint.',
    en: 'The time zone is captured when the sprint is created.',
  },
  scope: { es: 'Alcance', en: 'Scope' },
  scopeHint: {
    es: 'Participaciones y estimaciones del servidor. Las tareas retiradas conservan su historial.',
    en: 'Participation and estimates from the server. Removed tasks retain their history.',
  },
  task: { es: 'Tarea', en: 'Task' },
  points: { es: 'Puntos', en: 'Points' },
  totalsBasis: {
    es: 'Los totales de tareas y puntos incluyen solo participaciones de nivel superior. Las subtareas se muestran por separado.',
    en: 'Task and point totals include only top-level participations. Subtasks are shown separately.',
  },
  unestimated: { es: 'Sin estimar', en: 'Unestimated' },
  done: { es: 'Terminadas', en: 'Done' },
  canceled: { es: 'Canceladas', en: 'Canceled' },
  pending: { es: 'Pendientes', en: 'Pending' },
  removed: { es: 'Retirada', en: 'Removed' },
  transferred: { es: 'Transferida', en: 'Transferred' },
  participationClosed: { es: 'Participación cerrada', en: 'Participation closed' },
  current: { es: 'En el sprint', en: 'In this sprint' },
  archivedTask: { es: 'Tarea archivada', en: 'Archived task' },
  child: { es: 'Subtarea', en: 'Subtask' },
  loadMore: { es: 'Cargar más', en: 'Load more' },
  loadingMore: { es: 'Cargando más…', en: 'Loading more…' },
  start: { es: 'Revisar inicio', en: 'Review start' },
  startTitle: { es: 'Iniciar sprint', en: 'Start sprint' },
  startHint: {
    es: 'Revisa el objetivo, las fechas y el alcance antes de iniciar. Solo puede haber un sprint activo en el proyecto.',
    en: 'Review the goal, dates and scope before starting. The project can have only one active sprint.',
  },
  close: { es: 'Revisar cierre', en: 'Review closure' },
  closeTitle: { es: 'Cerrar sprint', en: 'Close sprint' },
  closeHint: {
    es: 'Revisa los resultados y el destino de todo el trabajo pendiente antes de confirmar.',
    en: 'Review the results and the destination of all pending work before confirming.',
  },
  destination: { es: 'Destino del trabajo pendiente', en: 'Pending work destination' },
  chooseDestination: { es: 'Elegir destino', en: 'Choose destination' },
  backlog: { es: 'Backlog (sin sprint)', en: 'Backlog (no sprint)' },
  destinationHint: {
    es: 'Cambiar la selección no cierra el sprint. Solicita una vista previa para revisar esa decisión.',
    en: 'Changing the selection does not close the sprint. Request a preview to review that decision.',
  },
  preview: { es: 'Obtener vista previa', en: 'Get preview' },
  previewTitle: { es: 'Vista previa del cierre', en: 'Closure preview' },
  completePreview: { es: 'Totales completos del servidor', en: 'Complete server totals' },
  pendingParticipants: {
    es: 'Participaciones pendientes que necesitan destino',
    en: 'Pending participations needing a destination',
  },
  previewDestination: { es: 'Destino revisado', en: 'Reviewed destination' },
  confirmClose: { es: 'Confirmar cierre', en: 'Confirm closure' },
  closeConsequence: {
    es: 'El cierre conserva los resultados y no se puede reabrir. Las tareas pendientes conservan su estado al cambiar de sprint.',
    en: 'Closure preserves the results and cannot be reopened. Pending tasks keep their status when moved to another sprint.',
  },
  frozen: { es: 'Resultados al cierre', en: 'Results at closure' },
  frozenHint: {
    es: 'Registro inmutable del cierre. Los cambios posteriores en las tareas no alteran estos resultados.',
    en: 'An immutable closure record. Later task changes do not alter these results.',
  },
  carried: { es: 'Trasladada a otro sprint', en: 'Carried to another sprint' },
  toBacklog: { es: 'Devuelta al backlog', en: 'Returned to backlog' },
  noScope: {
    es: 'Este sprint todavía no tiene participaciones.',
    en: 'This sprint has no participations yet.',
  },
  noOutcomes: {
    es: 'No hay resultados registrados en este cierre.',
    en: 'No outcomes were recorded in this closure.',
  },
  empty: {
    es: 'Todavía no hay sprints. Crea uno con un objetivo y fechas para empezar a planificar.',
    en: 'No sprints yet. Create one with a goal and dates to begin planning.',
  },
  save: { es: 'Guardar cambios', en: 'Save changes' },
  saving: { es: 'Guardando…', en: 'Saving…' },
  cancel: { es: 'Volver', en: 'Back' },
  mode: { es: 'Modo de planificación', en: 'Planning mode' },
  projectZone: { es: 'Zona horaria del proyecto', en: 'Project time zone' },
  scale: { es: 'Escala de puntos', en: 'Point scale' },
  scaleHint: {
    es: 'Valores separados por comas, en orden ascendente. Por ejemplo: 0, 1, 2, 3, 5, 8, 13, 21.',
    en: 'Comma-separated values in ascending order. For example: 0, 1, 2, 3, 5, 8, 13, 21.',
  },
  settingsHint: {
    es: 'La nueva zona se aplica a los sprints que crees después. Los sprints existentes conservan su zona.',
    en: 'The new time zone applies to sprints you create afterward. Existing sprints retain their time zone.',
  },
  estimate: { es: 'Estimación', en: 'Estimate' },
  assignment: { es: 'Participación en sprint', en: 'Sprint participation' },
  apply: { es: 'Guardar participación', en: 'Save participation' },
  saveEstimate: { es: 'Guardar estimación', en: 'Save estimate' },
  taskPlanning: { es: 'Planificación de la tarea', en: 'Task planning' },
  noSelection: { es: 'Ningún sprint seleccionado', en: 'No sprint selected' },
  loaded: { es: 'Cargadas', en: 'Loaded' },
  of: { es: 'de', en: 'of' },
} satisfies Record<string, Bilingual>;

export const sprintNoticeCopy = {
  loading: { es: 'Cargando planificación…', en: 'Loading planning…' },
  verifying: { es: 'Verificando tu sesión…', en: 'Verifying your session…' },
  'signed-out': {
    es: 'Tu sesión necesita verificación. Abre tu cuenta para iniciar sesión y vuelve a verificarla aquí.',
    en: 'Your session needs verification. Open your account to sign in, then verify it again here.',
  },
  forbidden: {
    es: 'No tienes acceso a esta planificación. Puedes volver a comprobar el acceso.',
    en: 'You do not have access to this planning. You can check access again.',
  },
  error: {
    es: 'No se pudo cargar la planificación. Intenta cargarla de nuevo.',
    en: 'Planning could not be loaded. Try loading it again.',
  },
  stale: {
    es: 'Estos datos cambiaron o necesitan actualizarse. Recarga y revisa antes de confirmar.',
    en: 'This data changed or needs refreshing. Reload and review before confirming.',
  },
  readonly: {
    es: 'Solo lectura. Puedes consultar el alcance y el historial.',
    en: 'Read only. You can view scope and history.',
  },
  archived: {
    es: 'Proyecto archivado. Su planificación está disponible en modo de solo lectura.',
    en: 'Archived project. Its planning is available as read only.',
  },
  kanban: {
    es: 'Este proyecto usa Kanban. Los controles de sprints dependen de su configuración y tus permisos actuales.',
    en: 'This project uses Kanban. Sprint controls depend on its settings and your current permissions.',
  },
  pending: {
    es: 'Esperando confirmación del servidor. El cambio todavía no está confirmado.',
    en: 'Waiting for server confirmation. The change is not confirmed yet.',
  },
  confirmed: { es: 'Cambio confirmado por el servidor.', en: 'Change confirmed by the server.' },
  failed: {
    es: 'No se guardó el cambio. Revisa los campos y vuelve a intentarlo; tu borrador se conserva.',
    en: 'The change was not saved. Review the fields and try again; your draft is retained.',
  },
  unknown: {
    es: 'No sabemos si se guardó el cambio. Reintenta la misma operación para comprobarlo. Descartar la recuperación local no deshace un cambio que pudo haberse guardado.',
    en: 'We do not know whether the change was saved. Retry the same operation to check. Discarding local recovery does not undo a change that may have been saved.',
  },
  conflict: {
    es: 'La planificación cambió mientras editabas. Tu borrador se conserva: carga la versión actual, compárala y decide antes de volver a guardar.',
    en: 'Planning changed while you were editing. Your draft is retained: load the current version, compare it and decide before saving again.',
  },
  'close-stale': {
    es: 'La vista previa del cierre ya no está vigente. Descarta esta decisión y solicita una nueva vista previa antes de confirmar.',
    en: 'The closure preview is no longer current. Discard this decision and request a new preview before confirming.',
  },
} satisfies Record<string, Bilingual>;

export const sprintReviewCopy = {
  confirmStart: { es: 'Confirmar inicio', en: 'Confirm start' },
  starting: { es: 'Iniciando…', en: 'Starting…' },
  capturedScope: {
    es: 'Alcance revisado al abrir esta decisión',
    en: 'Scope reviewed when this decision was opened',
  },
  history: { es: 'Historial de planificación', en: 'Planning history' },
  sprintHistory: { es: 'Historial del sprint', en: 'Sprint history' },
  taskHistory: { es: 'Historial de planificación de la tarea', en: 'Task planning history' },
  historyHint: {
    es: 'Cambios registrados con su autor y origen. Las tareas conservan su historial al cambiar de sprint.',
    en: 'Recorded changes with their author and source. Tasks keep their history when moved between sprints.',
  },
  historyIdle: {
    es: 'Carga el historial para consultar los cambios registrados.',
    en: 'Load history to view the recorded changes.',
  },
  historyLoading: { es: 'Cargando historial…', en: 'Loading history…' },
  historyRefreshing: { es: 'Actualizando historial…', en: 'Refreshing history…' },
  historyEmpty: {
    es: 'Todavía no hay cambios de planificación registrados.',
    en: 'No planning changes have been recorded yet.',
  },
  historyError: {
    es: 'No se pudo cargar el historial. Vuelve a cargarlo para intentarlo de nuevo.',
    en: 'History could not be loaded. Reload it to try again.',
  },
  historyChanged: {
    es: 'El historial cambió. Vuelve a cargarlo antes de continuar con las siguientes páginas.',
    en: 'History changed. Reload it before continuing to the next pages.',
  },
  historyStale: {
    es: 'Este historial necesita actualizarse. Los registros visibles corresponden a la última lectura.',
    en: 'This history needs refreshing. Visible records are from the last read.',
  },
  reload: { es: 'Volver a cargar', en: 'Reload' },
  loadHistory: { es: 'Cargar historial', en: 'Load history' },
  before: { es: 'Antes', en: 'Before' },
  after: { es: 'Después', en: 'After' },
  status: { es: 'Estado', en: 'Status' },
  parent: { es: 'Tarea principal', en: 'Parent task' },
  topLevel: { es: 'Sin tarea principal', en: 'No parent task' },
  archive: { es: 'Archivo', en: 'Archive' },
  notArchived: { es: 'No archivada', en: 'Not archived' },
  noSnapshot: { es: 'Sin instantánea registrada', en: 'No recorded snapshot' },
  outcome: { es: 'Resultado', en: 'Outcome' },
  target: { es: 'Sprint de destino', en: 'Destination sprint' },
  compare: { es: 'Revisar cambios en conflicto', en: 'Review conflicting changes' },
  draft: { es: 'Tu decisión conservada', en: 'Your retained decision' },
  serverCurrent: { es: 'Versión devuelta por el servidor', en: 'Version returned by the server' },
  compareHint: {
    es: 'Revisa ambas versiones. Cargar datos actuales no reemplaza tu borrador ni guarda cambios.',
    en: 'Review both versions. Loading current data does not replace your draft or save changes.',
  },
  rebase: {
    es: 'Conservar mis cambios sobre los datos revisados',
    en: 'Keep my changes on the reviewed data',
  },
  rebaseHint: {
    es: 'Esta decisión actualiza la base de tu borrador. Guardar sigue siendo una acción separada.',
    en: 'This updates the basis of your draft. Saving remains a separate action.',
  },
  rebaseUnavailable: {
    es: 'Carga los datos actuales y revísalos antes de conservar tus cambios.',
    en: 'Load and review the current data before keeping your changes.',
  },
  discardDecision: { es: 'Descartar esta decisión', en: 'Discard this decision' },
  closeConflict: {
    es: 'El cierre requiere una nueva vista previa. Descarta esta decisión, solicita la vista previa y vuelve a confirmar explícitamente.',
    en: 'Closure requires a new preview. Discard this decision, request the preview and explicitly confirm again.',
  },
  startDecision: { es: 'Iniciar el sprint revisado', en: 'Start the reviewed sprint' },
  closeDecision: {
    es: 'Cerrar el sprint con el destino revisado',
    en: 'Close the sprint with the reviewed destination',
  },
  leaveTitle: { es: 'Resolver cambios antes de salir', en: 'Resolve changes before leaving' },
  leaveHint: {
    es: 'La navegación está en espera. Revisa el trabajo pendiente antes de continuar.',
    en: 'Navigation is waiting. Review the unresolved work before continuing.',
  },
  requestedDestination: { es: 'Destino solicitado', en: 'Requested destination' },
  taskWork: { es: 'Cambios del proyecto o de tareas', en: 'Project or task changes' },
  sprintWork: { es: 'Cambios de planificación', en: 'Planning changes' },
  stay: { es: 'Quedarme aquí', en: 'Stay here' },
  discardContinue: { es: 'Descartar lo local y continuar', en: 'Discard local work and continue' },
  discardHint: {
    es: 'Descartar elimina el borrador o la recuperación local. No deshace cambios que el servidor ya haya guardado.',
    en: 'Discarding removes the local draft or recovery. It does not undo changes the server may already have saved.',
  },
  editEstimate: { es: 'Editar estimación', en: 'Edit estimate' },
  editParticipation: { es: 'Cambiar participación', en: 'Change participation' },
  cancelEdit: { es: 'Cancelar edición', en: 'Cancel editing' },
} satisfies Record<string, Bilingual>;

export const sprintGuardCopy = {
  none: { es: 'Sin cambios pendientes.', en: 'No unresolved changes.' },
  draft: { es: 'Hay un borrador sin guardar.', en: 'There is an unsaved draft.' },
  pending: {
    es: 'Esperando respuesta del servidor. No se puede descartar mientras la operación está en curso.',
    en: 'Waiting for the server. This cannot be discarded while the operation is in progress.',
  },
  recovery: {
    es: 'El resultado del servidor es desconocido. El cambio puede haberse guardado; descartar la recuperación local no lo deshace.',
    en: 'The server outcome is unknown. The change may have been saved; discarding local recovery does not undo it.',
  },
} satisfies Record<string, Bilingual>;

export const sprintHistoryKindCopy = {
  entry: { es: 'Tarea incorporada al sprint', en: 'Task added to sprint' },
  exit: { es: 'Participación finalizada', en: 'Participation ended' },
  'task-change': { es: 'Tarea actualizada', en: 'Task updated' },
  metadata: { es: 'Datos del sprint actualizados', en: 'Sprint details updated' },
  start: { es: 'Sprint iniciado', en: 'Sprint started' },
  estimate: { es: 'Estimación actualizada', en: 'Estimate updated' },
  close: { es: 'Sprint cerrado', en: 'Sprint closed' },
  carryover: { es: 'Trabajo recibido de otro sprint', en: 'Work carried from another sprint' },
  outcome: { es: 'Resultado del cierre registrado', en: 'Closure outcome recorded' },
} satisfies Record<string, Bilingual>;
