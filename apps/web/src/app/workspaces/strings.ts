import type { LimitedRole, MemberState, MembershipRole, WorkspaceCommand } from '@rielia/contracts';

export interface Bilingual {
  readonly es: string;
  readonly en: string;
}

export type CommandType = WorkspaceCommand['type'];
export type OutcomeKind = 'success' | 'invalid' | 'forbidden' | 'conflict' | 'error' | 'invitation-link-unavailable';

export const copy = {
  common: {
    skip: { es: 'Ir al contenido', en: 'Skip to content' },
    backHome: { es: 'Volver al inicio', en: 'Back home' },
    account: { es: 'Cuenta en otra pestaña', en: 'Account in a new tab' },
    refresh: { es: 'Actualizar', en: 'Refresh' },
    cancel: { es: 'Cancelar', en: 'Cancel' },
    dismiss: { es: 'Cerrar aviso', en: 'Dismiss notice' },
    discardDraft: { es: 'Descartar borrador', en: 'Discard draft' },
    confirm: { es: 'Confirmar', en: 'Confirm' },
    reviewChange: { es: 'Revisar cambio', en: 'Review change' },
    cancelWaiting: { es: 'Cancelar espera', en: 'Cancel waiting' },
    retrySave: { es: 'Reintentar guardado', en: 'Retry save' },
    switchWorkspace: { es: 'Cambiar a ese espacio', en: 'Switch to that workspace' },
    loadingMore: { es: 'Cargando más…', en: 'Loading more…' },
    role: { es: 'Rol', en: 'Role' },
    state: { es: 'Estado', en: 'State' },
    name: { es: 'Nombre', en: 'Name' },
    email: { es: 'Correo electrónico', en: 'Email address' },
    current: { es: 'Actual', en: 'Current' },
    newValue: { es: 'Nuevo', en: 'New' },
    language: { es: 'Idioma', en: 'Language' },
  },
  header: {
    eyebrow: { es: 'Rielia', en: 'Rielia' },
    title: { es: 'Espacios de trabajo', en: 'Workspaces' },
    lede: {
      es: 'Selecciona un espacio para revisar sus miembros, invitaciones y agentes.',
      en: 'Select a workspace to review its members, invitations and agents.',
    },
  },
  status: {
    loadingTitle: { es: 'Cargando espacios…', en: 'Loading workspaces…' },
    loadingBody: {
      es: 'Comprobando la sesión, los espacios y los permisos actuales.',
      en: 'Checking the session, workspaces and current permissions.',
    },
    disabledTitle: { es: 'Identidad desactivada', en: 'Identity disabled' },
    disabledBody: {
      es: 'Esta instalación no tiene la identidad habilitada. Los espacios, miembros e invitaciones no están disponibles hasta configurarla.',
      en: 'Identity is not enabled for this installation. Workspaces, members and invitations are unavailable until it is configured.',
    },
    signedOutTitle: { es: 'Sin sesión activa', en: 'No active session' },
    signedOutBody: {
      es: 'Inicia sesión para ver tus espacios, aceptar una invitación o recuperar un borrador.',
      en: 'Sign in to view your workspaces, accept an invitation or recover a draft.',
    },
    signIn: { es: 'Iniciar sesión', en: 'Sign in' },
    signInNewTab: { es: 'Iniciar sesión en otra pestaña', en: 'Sign in in a new tab' },
    signInReturn: {
      es: 'Después de iniciar sesión, vuelve a esta página y pulsa Actualizar.',
      en: 'After signing in, return to this page and choose Refresh.',
    },
    signInReturnMemory: {
      es: 'Después de iniciar sesión en la otra pestaña, vuelve aquí y pulsa Actualizar. No recargues esta pestaña: la invitación y el borrador solo existen en su memoria y se perderían.',
      en: 'After signing in in the other tab, return here and choose Refresh. Do not reload this tab: the invitation and draft exist only in its memory and would be lost.',
    },
    memoryKept: {
      es: 'La invitación o el borrador se conservan solo en esta pestaña. Si la cierras o la recargas, tendrás que abrir de nuevo el enlace original.',
      en: 'The invitation or draft is kept only in this tab. If you close or reload it, you will need to reopen the original link.',
    },
    errorTitle: { es: 'No se pudieron cargar los espacios', en: 'Workspaces could not be loaded' },
    errorBody: {
      es: 'El servidor no respondió o devolvió una respuesta inesperada. Comprueba la conexión y vuelve a intentarlo.',
      en: 'The server did not respond or returned an unexpected response. Check the connection and try again.',
    },
    retryLoad: { es: 'Volver a cargar', en: 'Load again' },
    forbiddenTitle: { es: 'Acceso no autorizado', en: 'Access not authorized' },
    forbiddenBody: {
      es: 'El servidor denegó el acceso a este espacio o a esta acción para la sesión actual. Comprueba la cuenta o pide una invitación vigente.',
      en: 'The server denied access to this workspace or action for the current session. Check the account or request a current invitation.',
    },
    emptyTitle: { es: 'Todavía no hay espacios', en: 'No workspaces yet' },
    emptyBody: {
      es: 'Crea un espacio personal o compartido. La pertenencia es obligatoria y cada espacio mantiene separados sus miembros y datos.',
      en: 'Create a personal or shared workspace. Membership is required, and each workspace keeps its members and data separate.',
    },
  },
  workspace: {
    selectorLabel: { es: 'Espacio de trabajo', en: 'Workspace' },
    roleLabel: { es: 'Tu rol', en: 'Your role' },
    ownerLabel: { es: 'Propietario', en: 'Owner' },
    ownerUnavailable: { es: 'No visible en la lista cargada', en: 'Not visible in the loaded list' },
    createTitle: { es: 'Crear un espacio', en: 'Create a workspace' },
    createBody: {
      es: 'El espacio nuevo te añade como propietario. Podrás invitar a otras personas y registrar agentes después.',
      en: 'The new workspace adds you as owner. You can invite people and register agents afterwards.',
    },
    createDisclosure: { es: 'Crear otro espacio', en: 'Create another workspace' },
    nameLabel: { es: 'Nombre del espacio', en: 'Workspace name' },
    nameHint: { es: 'Entre 1 y 200 caracteres.', en: 'Between 1 and 200 characters.' },
    nameRequired: { es: 'Escribe un nombre para el espacio.', en: 'Enter a workspace name.' },
    create: { es: 'Crear espacio', en: 'Create workspace' },
    loadMore: { es: 'Cargar más espacios', en: 'Load more workspaces' },
    switchTitle: { es: 'Cambiar de espacio', en: 'Switch workspace' },
    switchBody: {
      es: 'La selección guardada puede pertenecer a un espacio sin acceso. Elige otro espacio autorizado o quita la selección para salir de este estado.',
      en: 'The saved selection may belong to a workspace without access. Choose another authorized workspace or clear the selection to leave this state.',
    },
    availableTitle: { es: 'Espacios disponibles', en: 'Available workspaces' },
    clearSelection: { es: 'Quitar selección', en: 'Clear selection' },
    chooseWorkspace: { es: 'Elige un espacio', en: 'Choose a workspace' },
    currentSelection: { es: 'Selección actual', en: 'Current selection' },
  },
  members: {
    title: { es: 'Miembros', en: 'Members' },
    body: {
      es: 'Personas y agentes con una membresía en este espacio. El propietario siempre es humano y está protegido.',
      en: 'People and agents with a membership in this workspace. The owner is always human and protected.',
    },
    empty: { es: 'Este espacio no tiene miembros visibles.', en: 'This workspace has no visible members.' },
    human: { es: 'Humano', en: 'Human' },
    agent: { es: 'Agente', en: 'Agent' },
    ownerProtected: {
      es: 'El propietario no se puede cambiar, suspender ni retirar desde esta pantalla.',
      en: 'The owner cannot be changed, suspended or removed from this screen.',
    },
    manage: { es: 'Gestionar miembro', en: 'Manage member' },
    membership: { es: 'Membresía', en: 'Membership' },
    principalState: { es: 'Estado de la identidad', en: 'Identity state' },
    custodian: { es: 'Custodio', en: 'Custodian' },
    custodianUnavailable: { es: 'No visible en la lista cargada', en: 'Not visible in the loaded list' },
    manageInAgents: { es: 'Gestionar en Agentes', en: 'Manage in Agents' },
    roleLabel: { es: 'Rol del miembro', en: 'Member role' },
    roleHint: { es: 'Se aplica en el servidor al confirmar.', en: 'Applied by the server when confirmed.' },
    changeRole: { es: 'Revisar rol', en: 'Review role' },
    suspend: { es: 'Suspender acceso', en: 'Suspend access' },
    restore: { es: 'Restaurar acceso', en: 'Restore access' },
    remove: { es: 'Retirar del espacio', en: 'Remove from workspace' },
    principalInactive: {
      es: 'La identidad de esta persona no está activa. La membresía no se modifica desde esta pantalla.',
      en: 'This person’s identity is not active. Membership is not changed from this screen.',
    },
    revokedNote: {
      es: 'La membresía está retirada de forma terminal. El historial de autoría se conserva y no se puede volver a unir mediante una invitación.',
      en: 'The membership is permanently removed. Authorship history is preserved, and the person cannot rejoin through an invitation.',
    },
    suspendedNote: {
      es: 'El acceso está suspendido. Puedes restaurarlo o retirar la membresía.',
      en: 'Access is suspended. You can restore it or remove the membership.',
    },
    confirmRoleTitle: { es: 'Cambiar el rol del miembro', en: 'Change member role' },
    confirmSuspendTitle: { es: 'Suspender el acceso del miembro', en: 'Suspend member access' },
    confirmRestoreTitle: { es: 'Restaurar el acceso del miembro', en: 'Restore member access' },
    confirmRemoveTitle: { es: 'Retirar al miembro del espacio', en: 'Remove member from workspace' },
    roleConsequence: {
      es: 'El nuevo rol se aplica en el servidor y cambia lo que esta persona puede hacer. El historial de autoría no cambia.',
      en: 'The new role is applied by the server and changes what this person can do. Authorship history does not change.',
    },
    suspendConsequence: {
      es: 'Se bloquea su acceso hasta que lo restaures. El historial de autoría se conserva.',
      en: 'Access is blocked until you restore it. Authorship history is preserved.',
    },
    restoreConsequence: {
      es: 'La persona recupera el acceso con su rol actual. El servidor vuelve a comprobar la membresía en cada solicitud.',
      en: 'The person regains access with their current role. The server rechecks membership on every request.',
    },
    removeConsequence: {
      es: 'Se revoca su acceso al espacio. No podrá volver a unirse mediante una invitación y el historial de autoría se conserva.',
      en: 'Workspace access is revoked. The person cannot rejoin through an invitation, and authorship history is preserved.',
    },
    loadMore: { es: 'Cargar más miembros', en: 'Load more members' },
    countOne: { es: 'miembro', en: 'member' },
    countMany: { es: 'miembros', en: 'members' },
  },
  agents: {
    title: { es: 'Agentes autónomos', en: 'Autonomous agents' },
    body: {
      es: 'Identidades no humanas con una membresía limitada. No pueden ser propietarias ni administrar personas, y su custodio es una persona administradora activa.',
      en: 'Nonhuman identities with limited membership. They cannot be owners or administer people, and their custodian is an active human administrator.',
    },
    empty: { es: 'Este espacio no tiene agentes visibles.', en: 'This workspace has no visible agents.' },
    registerTitle: { es: 'Registrar un agente', en: 'Register an agent' },
    registerBody: {
      es: 'El registro crea solo la identidad del agente y su membresía limitada. Las credenciales de conexión no forman parte de esta versión.',
      en: 'Registration creates only the agent identity and its limited membership. Connection credentials are not part of this version.',
    },
    nameLabel: { es: 'Nombre del agente', en: 'Agent name' },
    nameHint: { es: 'Entre 1 y 200 caracteres.', en: 'Between 1 and 200 characters.' },
    nameRequired: { es: 'Escribe un nombre para el agente.', en: 'Enter an agent name.' },
    roleLabel: { es: 'Rol del agente', en: 'Agent role' },
    roleHint: {
      es: 'Los agentes solo pueden tener el rol de miembro o lector.',
      en: 'Agents can only have the member or viewer role.',
    },
    custodianLabel: { es: 'Custodio', en: 'Custodian' },
    custodianPlaceholder: { es: 'Elige una persona', en: 'Choose a person' },
    custodianHint: {
      es: 'Debe ser una persona propietaria o administradora activa. El agente no hereda los permisos del custodio.',
      en: 'Must be an active human owner or administrator. The agent does not inherit the custodian’s permissions.',
    },
    custodianRequired: { es: 'Elige una persona custodio.', en: 'Choose a custodian.' },
    noCustodians: {
      es: 'No hay personas administradoras activas disponibles como custodio. Añade o restaura una antes de registrar el agente.',
      en: 'No active human administrators are available as custodian. Add or restore one before registering the agent.',
    },
    moreMembers: {
      es: 'Hay más miembros sin cargar; pueden incluir custodios o agentes. Carga la lista completa para revisarlos.',
      en: 'More members are not loaded; they may include custodians or agents. Load the full list to review them.',
    },
    register: { es: 'Registrar agente', en: 'Register agent' },
    currentCustodian: { es: 'Custodio actual', en: 'Current custodian' },
    changeCustodian: { es: 'Cambiar custodio', en: 'Change custodian' },
    newCustodian: { es: 'Nuevo custodio', en: 'New custodian' },
    noOtherCustodian: {
      es: 'No hay otra persona administradora activa disponible.',
      en: 'No other active human administrator is available.',
    },
    suspend: { es: 'Suspender agente', en: 'Suspend agent' },
    restore: { es: 'Restaurar agente', en: 'Restore agent' },
    retire: { es: 'Retirar identidad del agente', en: 'Retire agent identity' },
    revokedNote: {
      es: 'La identidad del agente está retirada de forma terminal. No se puede reactivar; el historial se conserva.',
      en: 'The agent identity is permanently retired. It cannot be reactivated; history is preserved.',
    },
    membershipNotActive: {
      es: 'La membresía del agente no está activa. Los controles de identidad no se muestran desde esta pantalla.',
      en: 'The agent’s membership is not active. Identity controls are not shown from this screen.',
    },
    confirmSuspendTitle: { es: 'Suspender al agente', en: 'Suspend agent' },
    confirmRestoreTitle: { es: 'Restaurar al agente', en: 'Restore agent' },
    confirmRetireTitle: { es: 'Retirar la identidad del agente', en: 'Retire agent identity' },
    confirmCustodianTitle: { es: 'Cambiar el custodio del agente', en: 'Change agent custodian' },
    suspendConsequence: {
      es: 'El agente no podrá iniciar nuevas acciones hasta que lo restaures. El historial se conserva.',
      en: 'The agent cannot start new actions until restored. History is preserved.',
    },
    restoreConsequence: {
      es: 'El agente vuelve a estar activo con su rol actual. El servidor comprueba de nuevo su estado y permisos.',
      en: 'The agent becomes active with its current role. The server rechecks its state and permissions.',
    },
    retireConsequence: {
      es: 'La identidad queda retirada de forma terminal y no podrá reactivarse. El historial de autoría se conserva.',
      en: 'The identity is permanently retired and cannot be reactivated. Authorship history is preserved.',
    },
    custodianConsequence: {
      es: 'El nuevo custodio debe ser una persona administradora activa. Gestiona la identidad; el agente no hereda los permisos del custodio.',
      en: 'The new custodian must be an active human administrator. They manage the identity; the agent does not inherit the custodian’s permissions.',
    },
    loadMore: { es: 'Cargar más miembros', en: 'Load more members' },
    countOne: { es: 'agente visible', en: 'visible agent' },
    countMany: { es: 'agentes visibles', en: 'visible agents' },
  },
  invitations: {
    title: { es: 'Invitaciones', en: 'Invitations' },
    body: {
      es: 'Invita a personas con un rol limitado. La invitación es de un solo uso, caduca en 7 días y requiere una cuenta con el correo invitado.',
      en: 'Invite people with a limited role. The invitation is single-use, expires in 7 days and requires an account with the invited email.',
    },
    empty: { es: 'No hay invitaciones en este espacio.', en: 'There are no invitations in this workspace.' },
    emailLabel: { es: 'Correo de la persona invitada', en: 'Invitee email address' },
    emailHint: {
      es: 'La cuenta debe usar exactamente este correo al aceptar.',
      en: 'The account must use exactly this email when accepting.',
    },
    emailRequired: { es: 'Escribe un correo válido.', en: 'Enter a valid email address.' },
    roleLabel: { es: 'Rol de la invitación', en: 'Invitation role' },
    roleHint: { es: 'Se aplica al aceptar y el servidor vuelve a comprobarlo.', en: 'Applied on acceptance; the server rechecks it.' },
    create: { es: 'Crear invitación', en: 'Create invitation' },
    noEmailNote: {
      es: 'Esta versión no envía correo. El enlace se muestra una sola vez después de crear la invitación; cópialo y compártelo por un canal de confianza.',
      en: 'This version sends no email. The link is shown once after creating the invitation; copy it and share it through a trusted channel.',
    },
    pendingNote: {
      es: 'Las invitaciones pendientes aparecen abajo. Revisa y revoca una anterior antes de crear otra para el mismo correo.',
      en: 'Pending invitations appear below. Review and revoke an earlier one before creating another for the same email.',
    },
    issuer: { es: 'Emitida por', en: 'Issued by' },
    expires: { es: 'Caduca', en: 'Expires' },
    revoke: { es: 'Revocar invitación', en: 'Revoke invitation' },
    confirmRevokeTitle: { es: 'Revocar la invitación', en: 'Revoke invitation' },
    revokeConsequence: {
      es: 'El enlace dejará de funcionar. Si la persona ya la aceptó, el servidor rechazará la revocación.',
      en: 'The link will stop working. If the person already accepted it, the server rejects the revocation.',
    },
    pending: { es: 'Pendiente', en: 'Pending' },
    expired: { es: 'Caducada', en: 'Expired' },
    accepted: { es: 'Aceptada', en: 'Accepted' },
    revoked: { es: 'Revocada', en: 'Revoked' },
    loadMore: { es: 'Cargar más invitaciones', en: 'Load more invitations' },
    countOne: { es: 'invitación', en: 'invitation' },
    countMany: { es: 'invitaciones', en: 'invitations' },
    linkTitle: { es: 'Enlace de invitación de un solo uso', en: 'Single-use invitation link' },
    linkBody: {
      es: 'Se muestra una sola vez y no se guarda en el navegador. Cópialo ahora y compártelo por un canal de confianza.',
      en: 'It is shown once and is not stored in the browser. Copy it now and share it through a trusted channel.',
    },
    linkLabel: { es: 'Enlace para copiar', en: 'Link to copy' },
    copy: { es: 'Copiar enlace', en: 'Copy link' },
    copied: { es: 'Enlace copiado.', en: 'Link copied.' },
    copyFailed: {
      es: 'No se pudo copiar automáticamente. El enlace está seleccionado; cópialo manualmente.',
      en: 'Automatic copy failed. The link is selected; copy it manually.',
    },
    done: { es: 'Listo', en: 'Done' },
    detectedTitle: { es: 'Invitación detectada', en: 'Invitation detected' },
    detectedBody: {
      es: 'El enlace contiene una invitación. Nada se acepta automáticamente: aceptar requiere una sesión con el correo invitado y tu confirmación explícita.',
      en: 'The link contains an invitation. Nothing is accepted automatically: accepting requires a session with the invited email and your explicit confirmation.',
    },
    detectedSignedOut: {
      es: 'El enlace contiene una invitación. Inicia sesión en otra pestaña para conservarla en esta; después vuelve aquí y pulsa Actualizar.',
      en: 'The link contains an invitation. Sign in in another tab to keep it here, then return and choose Refresh.',
    },
    detectedDisabled: {
      es: 'El enlace contiene una invitación, pero la identidad está desactivada en esta instalación, así que no se puede aceptar.',
      en: 'The link contains an invitation, but identity is disabled for this installation, so it cannot be accepted.',
    },
    accept: { es: 'Aceptar invitación', en: 'Accept invitation' },
    dismiss: { es: 'Descartar invitación', en: 'Dismiss invitation' },
    checkAccount: {
      es: 'Si el servidor rechazó la invitación, comprueba que la sesión usa el correo invitado o pide una invitación nueva.',
      en: 'If the server rejected the invitation, check that the session uses the invited email or request a new invitation.',
    },
    dismissWarning: {
      es: 'El enlace no se guarda. Si descartas la invitación, tendrás que abrir de nuevo el enlace original.',
      en: 'The link is not stored. If you dismiss the invitation, you will need to reopen the original link.',
    },
  },
  operation: {
    pendingTitle: { es: 'Guardando el cambio', en: 'Saving the change' },
    pendingBody: {
      es: 'El servidor está procesando la solicitud. Puedes cancelar la espera; reintentar después no duplica un cambio que ya se haya aplicado.',
      en: 'The server is processing the request. You can cancel waiting; retrying later does not duplicate a change that was already applied.',
    },
    successTitle: { es: 'Cambio guardado', en: 'Change saved' },
    successGeneric: { es: 'El servidor confirmó el cambio.', en: 'The server confirmed the change.' },
    successRefreshFailed: {
      es: 'El cambio se guardó, pero la lista no se pudo actualizar. No lo envíes de nuevo; actualiza cuando vuelva la conexión.',
      en: 'The change was saved, but the list could not refresh. Do not submit it again; refresh when the connection returns.',
    },
    successRefreshForbidden: {
      es: 'El cambio se guardó, pero la sesión ya no puede leer este espacio. Actualiza o cambia de cuenta para revisar el resultado.',
      en: 'The change was saved, but the session can no longer read this workspace. Refresh or switch accounts to review the result.',
    },
    invalidTitle: { es: 'Datos rechazados', en: 'Data rejected' },
    invalidBody: {
      es: 'El servidor rechazó los datos. Revisa el formulario y vuelve a intentarlo; el borrador se conserva en esta pestaña.',
      en: 'The server rejected the data. Review the form and try again; the draft is kept in this tab.',
    },
    forbiddenTitle: { es: 'Acción denegada', en: 'Action denied' },
    forbiddenBody: {
      es: 'El servidor denegó esta acción para la sesión o el rol actual. No se aplicó ningún cambio.',
      en: 'The server denied this action for the current session or role. No change was applied.',
    },
    conflictTitle: { es: 'El registro cambió mientras tanto', en: 'The record changed in the meantime' },
    conflictBody: {
      es: 'Otra persona o agente guardó una versión más reciente. Actualiza, revisa la versión actual y vuelve a enviar; el borrador se conserva.',
      en: 'Another person or agent saved a newer version. Refresh, review the current version and submit again; the draft is kept.',
    },
    errorTitle: { es: 'No se pudo confirmar el cambio', en: 'The change could not be confirmed' },
    errorBody: {
      es: 'Revisa la conexión y reintenta. Si el servidor ya lo aplicó, el reintento no lo duplica.',
      en: 'Check the connection and retry. If the server already applied it, the retry does not duplicate it.',
    },
    canceledTitle: { es: 'Espera cancelada', en: 'Waiting canceled' },
    canceledBody: {
      es: 'La solicitud dejó de esperar en esta pestaña. Puedes reintentar el mismo cambio sin duplicarlo si el servidor ya lo aplicó.',
      en: 'The request stopped waiting in this tab. You can retry the same change without duplication if the server already applied it.',
    },
    retryScope: {
      es: 'El reintento pertenece al espacio original.',
      en: 'The retry belongs to the original workspace.',
    },
    retryOtherScope: {
      es: 'Cambia al espacio original antes de reintentar. El reintento no se redirige en silencio.',
      en: 'Switch to the original workspace before retrying. The retry is not silently redirected.',
    },
    draftScope: {
      es: 'Hay un borrador en esta pestaña para otro espacio. Cambia a ese espacio o descártalo antes de empezar otro cambio.',
      en: 'A draft in this tab belongs to another workspace. Switch to that workspace or discard it before starting another change.',
    },
    draftScopeTitle: { es: 'Borrador de otro espacio', en: 'Draft from another workspace' },
    inviteRecoveryTitle: { es: 'No se pudo confirmar el enlace de invitación', en: 'The invitation link could not be confirmed' },
    inviteRecoveryBody: {
      es: 'El servidor pudo haber creado la invitación, pero no devolvió su enlace. No la envíes de nuevo sin comprobarlo. Actualiza la lista, localiza la invitación pendiente y revócala explícitamente; después crea una nueva.',
      en: 'The server may have created the invitation but did not return its link. Do not submit it again without checking. Refresh the list, find the pending invitation and revoke it explicitly; then create a new one.',
    },
    inviteRecoveryReload: {
      es: 'Si la invitación no aparece, recarga la página y revisa la lista antes de invitar de nuevo. No se conserva un enlace que el servidor no devolvió.',
      en: 'If the invitation does not appear, reload the page and check the list before inviting again. A link the server did not return is not kept.',
    },
    refreshList: { es: 'Actualizar lista', en: 'Refresh list' },
    scopeLabel: { es: 'Ámbito', en: 'Scope' },
    draftLabel: { es: 'Borrador en esta pestaña', en: 'Draft in this tab' },
  },
} as const;

export const subjectLabel = {
  workspace: { es: 'Espacio', en: 'Workspace' },
  member: { es: 'Miembro', en: 'Member' },
  agent: { es: 'Agente', en: 'Agent' },
  invitation: { es: 'Invitación', en: 'Invitation' },
} as const;

export const roleName = {
  owner: { es: 'Propietario', en: 'Owner' },
  admin: { es: 'Administrador', en: 'Admin' },
  member: { es: 'Miembro', en: 'Member' },
  viewer: { es: 'Lector', en: 'Viewer' },
} as const satisfies Record<MembershipRole, Bilingual>;

export const limitedRoleName = {
  admin: roleName.admin,
  member: roleName.member,
  viewer: roleName.viewer,
} as const satisfies Record<LimitedRole, Bilingual>;

export const agentRoleName = {
  member: { es: 'Miembro', en: 'Member' },
  viewer: { es: 'Lector', en: 'Viewer' },
} as const satisfies Record<'member' | 'viewer', Bilingual>;

export const stateName = {
  active: { es: 'Activo', en: 'Active' },
  suspended: { es: 'Suspendido', en: 'Suspended' },
  revoked: { es: 'Retirado', en: 'Revoked' },
} as const satisfies Record<MemberState, Bilingual>;

export const invitationStateName = {
  pending: copy.invitations.pending,
  expired: copy.invitations.expired,
  accepted: copy.invitations.accepted,
  revoked: copy.invitations.revoked,
} as const satisfies Record<'pending' | 'expired' | 'accepted' | 'revoked', Bilingual>;

export const kindName = {
  human: copy.members.human,
  agent: copy.members.agent,
} as const satisfies Record<'human' | 'agent', Bilingual>;

export const roleDescription = {
  admin: {
    es: 'Puede administrar miembros, invitaciones y agentes, excepto al propietario.',
    en: 'Can manage members, invitations and agents, except the owner.',
  },
  member: {
    es: 'Puede crear y editar trabajo donde tenga acceso.',
    en: 'Can create and edit work where authorized.',
  },
  viewer: {
    es: 'Puede consultar el trabajo sin modificarlo.',
    en: 'Can view work without modifying it.',
  },
};

export const pendingText: Record<CommandType, Bilingual> = {
  'create-workspace': { es: 'Creando el espacio…', en: 'Creating the workspace…' },
  invite: { es: 'Creando la invitación…', en: 'Creating the invitation…' },
  'revoke-invitation': { es: 'Revocando la invitación…', en: 'Revoking the invitation…' },
  'accept-invitation': { es: 'Aceptando la invitación…', en: 'Accepting the invitation…' },
  'update-member': { es: 'Actualizando al miembro…', en: 'Updating the member…' },
  'register-agent': { es: 'Registrando al agente…', en: 'Registering the agent…' },
  'manage-agent': { es: 'Actualizando al agente…', en: 'Updating the agent…' },
};

export const successText: Record<CommandType, Bilingual> = {
  'create-workspace': { es: 'Espacio creado.', en: 'Workspace created.' },
  invite: {
    es: 'Invitación creada. El enlace está disponible abajo una sola vez.',
    en: 'Invitation created. Its link is available below once.',
  },
  'revoke-invitation': { es: 'Invitación revocada.', en: 'Invitation revoked.' },
  'accept-invitation': {
    es: 'Invitación aceptada; el espacio se añadió a tu lista.',
    en: 'Invitation accepted; the workspace was added to your list.',
  },
  'update-member': { es: 'Miembro actualizado.', en: 'Member updated.' },
  'register-agent': {
    es: 'Agente registrado como miembro. No se emitieron credenciales.',
    en: 'Agent registered as a member. No credentials were issued.',
  },
  'manage-agent': { es: 'Agente actualizado.', en: 'Agent updated.' },
};

export const commandName: Record<CommandType, Bilingual> = {
  'create-workspace': copy.workspace.createTitle,
  invite: copy.invitations.create,
  'revoke-invitation': copy.invitations.revoke,
  'accept-invitation': copy.invitations.accept,
  'update-member': copy.members.title,
  'register-agent': copy.agents.register,
  'manage-agent': copy.agents.title,
};

export const retryText: Record<CommandType, Bilingual> = {
  'create-workspace': { es: 'Reintentar crear el espacio', en: 'Retry creating the workspace' },
  invite: { es: 'Reintentar crear la invitación', en: 'Retry creating the invitation' },
  'revoke-invitation': { es: 'Reintentar revocar la invitación', en: 'Retry revoking the invitation' },
  'accept-invitation': { es: 'Reintentar aceptar la invitación', en: 'Retry accepting the invitation' },
  'update-member': { es: 'Reintentar actualizar al miembro', en: 'Retry updating the member' },
  'register-agent': { es: 'Reintentar registrar al agente', en: 'Retry registering the agent' },
  'manage-agent': { es: 'Reintentar actualizar al agente', en: 'Retry updating the agent' },
};

export function countText(total: number, one: Bilingual, many: Bilingual): Bilingual {
  const label = total === 1 ? one : many;
  return { es: `${total} ${label.es}`, en: `${total} ${label.en}` };
}
