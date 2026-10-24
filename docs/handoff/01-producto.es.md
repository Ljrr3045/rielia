# Rielia — Plan de producto

**Decisión del usuario — 24/10/2026:** un lanzamiento público con actualizaciones continuas; MCP personal actúa en nombre del usuario y los agentes autónomos tienen identidad propia.

**Ampliación de marketing y assets:** 24 de octubre de 2026; landing y kit v0.1 añadidos al alcance.

**Fecha del plan y de la investigación:** 18 de octubre de 2026.  
**Actualización de dirección UI/UX:** 24 de octubre de 2026; no se vuelve a investigar el stack ni la disponibilidad de marca.  
**Estado:** propuesta de planificación; no equivale a una aplicación implementada.  
**Nombre de trabajo:** Rielia; disponibilidad comercial, registral y de dominio no confirmada.  
**Destinatarios:** fundador y colaboradores de producto, diseño, ingeniería y comunidad.

**Versión en inglés:** [Product plan](01-product.en.md).  
**Documentos complementarios:** [Arquitectura y plan técnico](02-arquitectura-plan-tecnico.es.md) · [Estrategia y desarrollo de branding](03-branding.es.md) · [Guía de UI/UX para desarrollo](04-ui-ux-development-guide.es.md) · [Landing](05-landing-page-plan.es.md) · [Assets](06-brand-assets-guide.es.md).  
**Entrada para agentes:** [START HERE](00-START-HERE.md).

## Índice

- [0. Lectura rápida y decisiones recomendadas](#0-lectura-rápida-y-decisiones-recomendadas)
- [1. Estrategia de producto](#1-estrategia-de-producto)
- [2. Alcance funcional y actualización continua](#2-alcance-funcional-y-actualización-continua)
- [3. Experiencia de usuario y responsive](#3-experiencia-de-usuario-y-responsive)
- [4. Historias y aceptación](#4-historias-y-aceptación)
- [5. Validación y métricas](#5-validación-y-métricas)
- [6. Open source y sostenibilidad](#6-open-source-y-sostenibilidad)

---

## 0. Lectura rápida y decisiones recomendadas

Construir una plataforma de gestión de proyectos, tareas y sprints, de código abierto y autoalojable, que permita trabajar desde una interfaz web o desde agentes de desarrollo con los mismos permisos y reglas.

La oportunidad está en unir **planificación clara, control sobre los datos y colaboración práctica entre personas y agentes**. La amplitud funcional de Trello, Linear y ClickUp sirve como horizonte; intentar reproducirlos completos en la primera versión haría difícil entregar una experiencia coherente.

| Decisión | Recomendación | Motivo principal |
| --- | --- | --- |
| Público inicial | Desarrolladores independientes y equipos pequeños que usan agentes | Permite validar el flujo que motiva este proyecto |
| Producto completo | Gestión de trabajo con Kanban, Scrum y vistas alternativas | Atiende el alcance solicitado sin imponer Scrum a todos |
| Núcleo de trabajo | Proyectos, tareas, colaboración básica, sprints y MCP por terminal | Ya permite gestionar un proyecto real de principio a fin |
| Arquitectura | Next.js + NestJS en monorepo TypeScript | API y dominio independientes de la interfaz; reutilización por MCP |
| Backend | Monolito modular y un proceso de trabajos asíncronos | Evita microservicios y conserva una separación operativa útil |
| Identidad | Better Auth alojado dentro del backend, sujeto a prueba inicial | Encaja con autoalojamiento y la dirección actual del ecosistema Auth.js |
| Datos | PostgreSQL + Prisma; cola sobre PostgreSQL | Reduce servicios necesarios en el VPS |
| MCP | Adaptador local `stdio` y acceso remoto con OAuth verificados | Transportes de un mismo producto, sin etapas de lanzamiento |
| Despliegue | Imágenes Docker versionadas, Dokploy y PostgreSQL privado | Portabilidad y recuperación reproducible |
| Interfaz | Web adaptable a móvil, tableta y escritorio; español e inglés | Acceso completo sin desarrollar apps nativas inicialmente |
| Marca | Territorio de claridad y avance; Rielia como candidato provisional | Comunica orden sin limitar el producto a IA o Scrum |
| Licencia propuesta | Apache-2.0 | Prioriza adopción y contribución; decisión a cerrar antes de publicar |

**Resultado esperado:** una persona puede crear su proyecto, convertir ideas en tickets, priorizar, planificar un sprint, delegar a un agente, revisar cambios y cerrar trabajo con un historial comprensible.

### 0.1 Alcance de este documento

El plan original reunía las tres entregas solicitadas, ahora distribuidas en documentos complementarios:

1. **Producto:** problema, usuarios, funcionalidades, UX, prioridades, historias, métricas y validación.
2. **Arquitectura y plan técnico:** decisiones, datos, identidad, API, MCP, Docker/Dokploy, operación y backlog de ingeniería.
3. **Branding:** posicionamiento, territorios, nombres, tono, identidad visual y mensajes de lanzamiento.

Este documento de producto conserva el contexto general de decisiones; la arquitectura detallada y el desarrollo de marca se encuentran en sus archivos respectivos.

Los archivos `product-development-strategist.md` y `development-planning-architect.md` se utilizaron como **referencia metodológica**. Sus instrucciones internas se distinguen de los requisitos del usuario: no autorizan implementaciones, despliegues, compras ni nuevas acciones externas. Se tomaron de ellos criterios de evidencia, simplicidad, trazabilidad y aceptación verificable.

Este trabajo es planificación. No se ha construido una aplicación, probado su capacidad, configurado el VPS ni publicado una marca.

### 0.2 Evidencia y supuestos

| Tipo | Contenido | Consecuencia |
| --- | --- | --- |
| Confirmado por el usuario | Uso personal y por terceros; open source; tareas y sprints; social login; VPS con Dokploy; Docker; PostgreSQL u otra DB en Dokploy; MCP; responsive | Restricciones base |
| Supuesto de planificación | Proyecto nuevo, mantenido inicialmente por una persona o equipo pequeño | Arquitectura pequeña y entregas verticales |
| Supuesto de producto | Primeros usuarios: desarrolladores independientes y equipos de 2–15 personas | Simplificar jerarquía y onboarding; validar el segmento |
| Supuesto de despliegue | Una instalación puede contener varios workspaces aislados | Multiusuario y multitenencia desde el modelo de datos |
| Supuesto de acceso | Registro abierto, por invitación o cerrado según configuración de cada instalación | Permite operar tu instancia personal y una instalación abierta |
| Supuesto de idiomas | Español e inglés, sin traducción automática de contenido de usuarios | Base de internacionalización desde el comienzo |
| Desconocido | Recursos actuales del VPS, presupuesto, dedicación y fecha objetivo | No se promete calendario ni capacidad medida |
| Desconocido | Países de lanzamiento, obligaciones locales y política de monetización | Revisar antes de abrir un servicio público |
| Investigado | Documentación pública enlazada, consultada el 18/10/2026 | Sustenta capacidades documentadas; no demuestra compatibilidad en este proyecto |

Las recomendaciones son decisiones de diseño razonadas, no resultados de entrevistas, benchmarks o pruebas de integración.

## 1. Estrategia de producto

### 1.1 Tesis y problema

**Hipótesis:** quienes combinan desarrollo humano con agentes necesitan un lugar compartido donde el plan y el estado del trabajo sigan siendo comprensibles, editables y verificables.

Hoy pueden usar un gestor de tareas, repositorios, Markdown y conversaciones separadas. El coste aparece al copiar contexto, perder decisiones, duplicar tickets o actualizar estados manualmente. Este problema se infiere de la necesidad expresada por el usuario; falta validarlo con otras personas.

**Trabajo principal:** “Cuando tengo una idea o un conjunto de cambios, quiero convertirlos en trabajo ordenado y delegable, para avanzar sin perder el contexto ni el control de las decisiones”.

**Visión:** un espacio de trabajo abierto en el que personas y agentes compartan proyectos, tareas, prioridades y resultados.

### 1.2 Usuarios, actores y necesidades

Todos los segmentos siguientes son hipótesis, salvo el fundador como primer usuario declarado.

| Actor | Contexto, necesidad y alternativa actual | Barrera o disparador | Prioridad e impacto |
| --- | --- | --- | --- |
| Desarrollador independiente | Varios proyectos; necesita saber qué hacer y delegar; usa tickets, notas o Markdown | Mantener el tablero al día cuesta más que escribir una lista | Primario: captura rápida, modo personal, MCP y exportación |
| Equipo pequeño de desarrollo | Comparte backlog y entregas; usa Linear, Trello, ClickUp o GitHub Issues | Cambios de prioridad, tickets incompletos y contexto repartido | Primario: roles, sprints, comentarios e historial |
| Responsable de producto o proyecto | Prioriza y revisa alcance; usa documentos y vistas de trabajo | Necesita comprender bloqueos y cambios sin revisar cada conversación | Primario: backlog, objetivo del sprint, filtros y reportes |
| Colaborador ocasional | Revisa o comenta en proyectos específicos | Acceso excesivo o navegación compleja | Colaboración: permisos limitados y enlaces directos |
| Administrador de una instalación | Opera Dokploy, backups, usuarios y actualizaciones | Temor a perder datos o romper una actualización | Primario: instalación documentada, recuperación y diagnóstico |
| Cliente MCP delegado | Herramienta usada en nombre de una persona | Confundir canal con autor | Autor humano y procedencia visible |
| Agente autónomo | Miembro de tipo agente con ejecución externa e identidad propia | Necesita permisos y responsabilidad propios | Actor del trabajo: tareas, comentarios y asignaciones atribuibles |
| Contribuidor open source | Quiere corregir o ampliar el proyecto | Arranque difícil y reglas de contribución poco claras | Primario: entorno reproducible y módulos documentados |

La persona que usa, la que administra y una eventual persona que paga pueden ser diferentes. No se requiere comprador en la primera etapa.

### 1.3 Alternativas y aprendizajes

| Alternativa | Hecho documentado relevante | Patrón a adoptar | Decisión propia |
| --- | --- | --- | --- |
| Trello | Ofrece tableros y vistas como tabla, calendario y timeline; dispone de automatizaciones | Comprensión visual inmediata y reglas sencillas | Un tablero será una vista de las tareas, no otra base de datos |
| Linear | Documenta ciclos y un MCP para consultar y modificar objetos como issues, proyectos y comentarios | Flujo rápido de tickets, ciclos y acceso desde agentes | Mantener interacciones rápidas con contratos públicos claros |
| ClickUp | Documenta sprints, vistas, campos personalizados y MCP oficial | Flexibilidad y distintas formas de mirar el mismo trabajo | Incorporar flexibilidad progresivamente, sin mostrar todo desde el inicio |
| Plane | Presenta opciones de autoalojamiento | Estudiar el coste real de instalar y actualizar una alternativa | Comparar antes de invertir; el autoalojamiento tampoco es diferenciación exclusiva |
| GitHub Issues + Markdown | Alternativa de trabajo a evaluar con usuarios, sin inventariar aquí todas sus capacidades | Cercanía al código y facilidad de versionar documentos | Importación y enlaces al repositorio antes que sincronización bidireccional |
| Notas y hojas de cálculo | Sustituto hipotético de baja fricción | Captura libre y rápida | Crear una tarea debe requerir inicialmente solo título y proyecto |

Fuentes: [vistas de Trello](https://trello.com/views), [automatización de Trello](https://support.atlassian.com/trello/docs/automation-overview/), [ciclos de Linear](https://linear.app/docs/use-cycles), [MCP de Linear](https://linear.app/docs/mcp), [sprints de ClickUp](https://help.clickup.com/hc/en-us/articles/6310087298327-Monitor-and-report-on-your-sprints), [campos de ClickUp](https://help.clickup.com/hc/en-us/articles/6330455628439-Show-Custom-Fields-in-tasks-and-views), [MCP de ClickUp](https://help.clickup.com/hc/en-us/sections/37731627018647-ClickUp-MCP) y [Plane](https://plane.so/).

**Inferencia estratégica:** “tenemos MCP” no basta como promesa diferenciadora. La apuesta es la calidad del flujo completo, los permisos comprensibles, la trazabilidad y una instalación que puedas mantener tú mismo. No se atribuyen quejas o preferencias a usuarios de competidores sin investigación.

### 1.4 Tres rutas posibles

| Ruta | Valor | Coste y riesgo | Juicio |
| --- | --- | --- | --- |
| Gestor general para cualquier departamento | Mercado potencial amplio | Gran superficie funcional y muchos flujos diferentes | Horizonte, no punto de entrada |
| Gestor para desarrolladores y equipos pequeños con agentes | Conecta con tu uso personal y una necesidad concreta | Hay competencia y debe demostrarse el beneficio | **Recomendada** |
| Capa MCP sobre un gestor existente | Validación rápida de automatización | Menor control del producto y dependencia de otra plataforma | Alternativa si el objetivo prioritario pasa a ser ahorrar tiempo de desarrollo |

Antes de construir el producto completo, realizar un ejercicio con un proyecto real en una alternativa autoalojable. Si resuelve suficientemente la necesidad, comparar contribuir allí frente a mantener un producto propio. La decisión propuesta sigue siendo construir, por el objetivo explícito de crear tu aplicación y su experiencia integrada.

### 1.5 Principios de producto

1. Una tarea representa el mismo trabajo en lista, tablero, sprint, API y MCP.
2. Capturar requiere poco; planificar permite profundizar.
3. Scrum es optativo: un proyecto puede operar con Kanban sin sprints.
4. Los agentes actúan con permisos y atribución; no reciben acceso implícito de administrador.
5. La interfaz muestra quién cambió qué y permite recuperarse de errores habituales.
6. Los datos se pueden exportar y una instalación se puede restaurar.
7. Lo avanzado aparece cuando ayuda a resolver una necesidad concreta.

## 2. Alcance funcional y actualización continua

### 2.1 Definición de “core”

El objetivo es cubrir los flujos esenciales de gestión del trabajo presentes en las referencias, no prometer paridad con todos sus productos, planes comerciales, integraciones o funciones de IA.

El producto tendrá **un único lanzamiento público y actualización continua**. La landing no expone etapas de acceso ni una secuencia de versiones de lanzamiento.

Para ordenar dependencias de ingeniería se conservan bloques internos, sin convertirlos en fases públicas:

- **B0 — Fundamentos:** decisiones, pruebas técnicas y contratos.
- **B1 — Núcleo de trabajo:** proyectos, tareas, colaboración, sprints, MCP local y las dos modalidades de identidad de agentes.
- **B2 — Preparación y capacidades complementarias:** aislamiento, operación pública, MCP remoto y el resto del alcance inicial acordado.
- **B3 — Evolución continua:** personalización, automatización e integraciones priorizadas por uso.

El alcance inicial reúne B1/B2 con sus verificaciones técnicas; B3 organiza mejoras posteriores. Las etiquetas B no aparecen en la landing ni implican lanzamientos separados. Antes de abrir al público deben estar completos los controles de seguridad, autoría y recuperación aplicables, T24 y T34. Una actualización posterior se publica al estar verificada, sin volver a denominar el producto como una etapa de lanzamiento.

### 2.2 Mapa de funcionalidades

| ID | Capacidad y mínimo esperado | Bloque interno | Razón y señal de valor |
| --- | --- | --- | --- |
| P01 | Google y GitHub; sesión, cierre y proveedores configurables por instalación | B1 | Acceso sin mantener contraseñas propias |
| P02 | Workspaces personales y compartidos; selector y aislamiento | B1 | Separar proyectos y organizaciones sin mezclar datos |
| P03 | Miembros humanos y agentes autónomos; invitaciones humanas; owner, admin, member y viewer | B1 | Agentes con rol limitado; ownership humano |
| P04 | Proyectos, nombre, clave, descripción, archivo y visibilidad | B1 | Contexto estable para tareas y permisos |
| P05 | Tareas con título, Markdown, tipo, prioridad, responsable humano/agente, fechas, etiquetas y checklist; creador separado | B1 | Planificar sin confundir autoría con asignación |
| P06 | Subtareas de un nivel; relación padre e hijo | B1 | Descomponer sin jerarquía infinita |
| P07 | Estados configurables y categorías semánticas; plantillas Kanban y Scrum | B1 | Adaptarse sin perder significado en reportes |
| P08 | Backlog priorizado, lista y tablero Kanban; filtros esenciales | B1 | Encontrar y ordenar el siguiente trabajo |
| P09 | Sprints, objetivo, fechas, puntos, inicio/cierre y traslado explícito de pendientes | B1 | Planificación iterativa con historial |
| P10 | Comentarios e historial con autor efectivo y procedencia: usuario vía agente, agente autónomo o sistema | B1 | Atribución comprensible sin confundir cliente con miembro |
| P11 | Mis tareas, búsqueda por ID/título y navegación rápida | B1 | Uso diario con poca fricción |
| P12 | Crear, consultar, actualizar y comentar tareas vía MCP local | B1 | Gestionar tickets desde terminales de agentes |
| P13 | Crear proyectos y planificar sprints vía MCP local con roles apropiados | B1 | Delegar la planificación, no solo cambiar estados |
| P14 | Exportación JSON y CSV; archivo y restauración de tareas | B1 | Portabilidad y recuperación de errores |
| P15 | Adjuntos privados con cuotas, descarga autorizada y backup | B2 | Evidencias y materiales de ejecución |
| P16 | Menciones, seguimiento e inbox de notificaciones; correo opcional configurable | B2 | Atención a cambios relevantes sin ruido |
| P17 | Filtros/vistas guardadas y operaciones masivas con vista previa | B2 | Gestionar volúmenes de trabajo |
| P18 | Calendario de fechas y tabla con columnas configurables | B2 | Revisar compromisos desde otra perspectiva |
| P19 | Reportes de sprint: alcance, completado, burndown y velocidad histórica | B2 | Entender previsibilidad y cambios de alcance |
| P20 | Dependencias dirigidas y detección de ciclos; bloqueo visible | B2 | Coordinar secuencias de trabajo |
| P21 | MCP remoto con consentimiento OAuth, revocación y cliente local de respaldo | B2 | Conectar clientes remotos compatibles |
| P22 | Acceso guest limitado a proyectos concretos | B2 | Incorporar revisores externos sin abrir todo el workspace |
| P23 | Importación CSV y JSON del formato propio, con validación previa | B2 | Reducir barreras para migrar |
| P24 | Épicas, hitos y vista roadmap/timeline | B3 | Planificar por encima del ticket |
| P25 | Campos personalizados tipados, con filtros y permisos heredados | B3 | Adaptación a procesos de terceros |
| P26 | Automatizaciones simples: disparador, condición y acción; límites de ejecución | B3 | Reducir trabajo repetitivo de forma previsible |
| P27 | Tareas recurrentes y plantillas de proyecto/tarea/sprint | B3 | Reutilizar procesos habituales |
| P28 | GitHub: enlaces a PR/issues, webhooks verificados y reglas explícitas | B3 | Conectar ejecución y planificación |
| P29 | Webhooks salientes firmados, reintentos y registro de entregas | B3 | Integración con otros sistemas |
| P30 | Tiempo estimado y registro manual de tiempo; carga por persona | B3 | Ayudar a capacidad cuando los usuarios lo necesiten |
| P31 | Documentos breves vinculados al proyecto y búsqueda textual ampliada | B3 | Conservar contexto estable sin construir una suite documental |
| P32 | Importadores específicos para herramientas de referencia | B3 | Migración más cómoda; prioridad según demanda |
| P33 | Temas claro/oscuro, teclado, accesibilidad y responsive | B1 y evolución | Condición transversal, no añadido final |
| P34 | Administración, cuotas, auditoría, backups y guía self-hosted | B1; endurecimiento B2 | Hacer viable operar una instancia ajena |
| P35 | Landing pública ES/EN: propuesta, beneficios, funcionalidades disponibles y CTA estable | B1 / antes del lanzamiento | Un lanzamiento y mejoras continuas, sin roadmap de acceso |
| P36 | Captación opcional de novedades con confirmación, baja y controles de abuso | B1, solo con servicio/políticas listos | Leads confirmados, sin crear cuentas ni exponer direcciones |
| P37 | Kit de marca compartido app/landing, con variantes y recursos localizados | Propuesta B0; integración B1 | Consistencia visual y assets utilizables por agentes |
| P38 | Conexiones en nombre del usuario y agentes autónomos con identidad propia; autores, permisos, asignación y revocación coherentes | B1 | Luis vía MCP sigue siendo Luis; un agente autónomo participa con su identidad |

### 2.3 Límites del MVP y exclusiones del horizonte inicial

B1 permite crear un proyecto real, invitar a un colaborador, organizar su backlog, trabajar por sprint o Kanban y usar un agente sin duplicar el plan.

No se incluyen inicialmente chat general, pizarras, videollamadas, CRM, facturación, nómina, marketplace de plugins, agentes alojados por la propia aplicación, búsqueda vectorial, coedición de documentos tipo Google Docs, escritura offline sincronizada ni aplicaciones móviles nativas. Son productos o riesgos adicionales; solo se reconsideran con evidencia de demanda.

La app no necesita una suscripción a un modelo para gestionar tareas: el usuario conecta sus propios agentes. Una futura asistencia de IA dentro de la interfaz sería una decisión independiente.

### 2.4 Reglas funcionales que deben acordarse antes de programar

- **Tarea:** pertenece a un proyecto y un workspace; tiene un único responsable principal en B1. Los seguidores no son responsables adicionales.
- **Identificador:** UUID interno y clave humana estable, por ejemplo `RIE-123`; números no reutilizables.
- **Jerarquía:** proyecto → tarea → subtarea. Épicas se añaden en B3, sin introducir folders/spaces/lists redundantes.
- **Estados:** nombres libres, asociados a `backlog`, `todo`, `in_progress`, `done` o `canceled` para reglas y reportes.
- **Bloqueo:** condición separada del estado, con motivo; en B2 puede derivar de dependencias. No confundir bloqueado con finalizado.
- **Modo de proyecto:** Kanban por defecto; Scrum añade backlog/sprints y reportes. Cambiar modo conserva tareas e historial.
- **Sprint B1:** pertenece a un proyecto. Solo uno activo por proyecto; próximos sprints pueden coexistir planificados.
- **Alcance del sprint:** una tarea tiene como máximo un sprint vigente; sus participaciones anteriores se conservan.
- **Cierre:** las tareas `done` y `canceled` dejan de estar pendientes; las canceladas se reportan aparte y no suman entrega. Las demás se trasladan a backlog o a un sprint elegido, tras revisar el resumen.
- **Puntos:** estimación opcional, escala configurable sencilla; no convertir automáticamente a horas. Reportar sin estimación como categoría separada.
- **Subtareas:** no completan automáticamente al padre. El cierre del padre con hijos abiertos muestra una advertencia; no altera hijos silenciosamente.
- **Fechas:** vencimiento sin hora se conserva como fecha local; eventos y marcas temporales usan UTC. El sprint usa zona IANA del proyecto y fin exclusivo del intervalo.
- **Archivo:** retira de vistas activas sin perder vínculos. Purga definitiva se limita al owner y no se expone a agentes en B1/B2.
- **Conflictos:** una edición concurrente no sobrescribe cambios sin avisar; se compara versión y se pide revisar.

### 2.5 Identidad y autoría de las acciones con agentes

Conectar un cliente MCP personal **no crea un nuevo miembro ni convierte al agente en autor independiente**. Hay dos modalidades explícitas:

| Caso | Autor de tarea/comentario | Procedencia visible | Permisos |
| --- | --- | --- | --- |
| Luis opera desde la web | Luis | Web | Membresía y acceso actuales de Luis |
| Luis conecta su MCP a Cursor y el agente crea una tarea | Luis | “Luis creó esta tarea mediante Cursor” | Permisos actuales de Luis, recortados por conexión/proyectos/scopes |
| Un agente autónomo registrado como Rielia Builder crea una tarea | Rielia Builder, con etiqueta Agente | “Rielia Builder · Agente creó esta tarea” | Membresía, proyectos y credencial propios del agente |

**Modalidad por defecto: en mi nombre.** La conexión pertenece al usuario y la operación se atribuye a él. Se conserva que fue ejecutada mediante un cliente/conexión, también en comentarios e historial. El canal nunca se oculta: atribución a Luis no significa que haya redactado, leído o aprobado manualmente cada cambio.

**Modalidad autónoma: identidad propia.** Owner/admin crea expresamente un miembro de tipo agente con nombre, responsable humano de gestión, rol limitado y proyectos autorizados. El agente puede ser creador, autor de comentarios y responsable de tareas como participante del trabajo. Se identifica siempre como Agente, sin fingir una persona ni usar el login social de su administrador. No se aloja ni ejecuta dentro de Rielia por tener identidad: su proceso sigue siendo externo.

**Autor, responsable y autorizante son distintos.** Crear no asigna la tarea automáticamente. Una tarea creada por Luis mediante Cursor puede asignarse a Ana o a Rielia Builder. La persona que administra o autorizó un agente autónomo no aparece como creadora de sus tickets. Las automatizaciones internas conservan autor Sistema y su causa.

El historial conserva el actor de cada acción: una tarea creada por Luis no cambia de creador porque luego la edite un agente autónomo. Al revocar una conexión, suspender un miembro o retirar acceso, se bloquean nuevas operaciones sin reasignar autorías anteriores. No cambiar una conexión de modalidad silenciosamente: crear una conexión nueva con confirmación explícita del sujeto.

En listas y filtros, “Creado por Luis” incluye sus acciones delegadas. “Creado por Rielia Builder” incluye las del agente autónomo. La procedencia MCP puede filtrarse aparte. “Mis tareas” se basa en responsable, no en creador. La configuración muestra antes de emitir credenciales “Actuará como Luis” o “Actuará como Rielia Builder · Agente”.

## 3. Experiencia de usuario y responsive

### 3.1 Arquitectura de información

```text
Selector de workspace
├── Mi trabajo
│   ├── Mis tareas
│   └── Inbox [B2]
├── Proyectos
│   └── Proyecto
│       ├── Resumen
│       ├── Backlog
│       ├── Lista / Tablero / Tabla [B2] / Calendario [B2]
│       ├── Sprints [si usa Scrum]
│       ├── Reportes [B2]
│       ├── Roadmap y documentos [B3]
│       └── Configuración
├── Buscar
└── Ajustes
    ├── Miembros y permisos
    ├── Conexiones de agentes
    ├── Exportar / importar
    └── Preferencias
```

Un proyecto contiene tareas. “Tablero” es una vista guardable del proyecto: no crea una jerarquía de trabajo paralela.

### 3.2 Recorridos principales

**Primer acceso:** elegir Google/GitHub → crear o aceptar workspace → crear proyecto → escoger Kanban/Scrum → crear primera tarea. Ofrecer datos de ejemplo opcionales y eliminables. Conectar un agente se presenta después de llegar a una primera tarea útil.

**Trabajo diario:** abrir Mis tareas → filtrar por prioridad o sprint → abrir tarea → ejecutar/comentar → cambiar estado → ver confirmación de guardado. El detalle conserva la posición de la lista al volver.

**Planificar sprint:** revisar backlog → estimar y ordenar → crear sprint con objetivo y fechas → seleccionar tareas y ver suma → iniciar → revisar cambios de alcance → cerrar con resumen y destino de pendientes.

**Usar un agente en mi nombre:** elegir workspace/proyecto → crear conexión “Actuará como Luis” → conceder alcance → configurar cliente → comprobar → gestionar tareas → revisar “Luis mediante Cursor” en la web.

**Incorporar un agente autónomo:** owner/admin registra Rielia Builder · Agente → asigna rol/proyectos y responsable de gestión → emite credencial propia → configura ejecución externa → comprueba tareas, comentarios y asignaciones con autor Rielia Builder.

**Recuperar un fallo:** conservar borrador local mientras la sesión esté activa, explicar el error junto al campo, permitir reintento idempotente y mostrar si el cambio está pendiente o confirmado. Los borradores locales se eliminan al cerrar sesión; no guardar tokens allí.

### 3.3 Distribución por dispositivo

| Anchura orientativa | Navegación y trabajo | Adaptación necesaria |
| --- | --- | --- |
| 320–767 px | Barra superior, selector y navegación inferior de hasta cuatro destinos; menú contextual | Lista predeterminada; detalle a pantalla completa; filtros en panel; botón visible para crear |
| 768–1023 px | Barra lateral plegable, contenido principal amplio | Detalle en panel si cabe; controles táctiles y orientación horizontal |
| 1024–1439 px | Lateral persistente, lista/tablero y detalle lateral | Atajos y selección múltiple; densidad cómoda por defecto |
| ≥1440 px | Múltiples paneles cuando aportan contexto | Limitar ancho de lectura de descripciones; usar espacio adicional para información útil |

Los puntos de corte se validan con el contenido y no con modelos concretos de teléfono.

**Kanban móvil:** mostrar una columna seleccionada, contador y selector de estado; permitir cambiar de columna mediante controles visibles. Una vista de tablero horizontal puede ofrecerse como alternativa explícita, sin desbordar toda la página. Mover tareas debe funcionar con “Cambiar estado / Mover a…”, además del arrastre.

**Calendario y timeline:** agenda vertical en móvil; timeline completo en tableta/escritorio y alternativa de lista por hito. Todas las acciones esenciales deben seguir disponibles.

### 3.4 Bocetos estructurales

```text
Escritorio
┌──────────────┬──────────────────────────────────────┬───────────────────┐
│ Workspace    │ Proyecto · Sprint · Buscar           │ Detalle de tarea  │
│ Mi trabajo   │ Lista | Tablero      + Nueva tarea   │ Estado / prioridad│
│ Proyectos    │ Filtros · Orden · Agrupar            │ Descripción       │
│ Ajustes      │ RIE-12  Corregir login   En progreso  │ Checklist         │
│              │ RIE-13  Documentar MCP   Por hacer    │ Comentarios       │
└──────────────┴──────────────────────────────────────┴───────────────────┘

Móvil
┌───────────────────────────┐
│ Proyecto             +    │
│ Mis tareas · Filtros      │
│ RIE-12 · En progreso      │
│ Corregir login            │
│ Alta · Asignada a ti      │
│───────────────────────────│
│ RIE-13 · Por hacer        │
│ Documentar MCP            │
│───────────────────────────│
│ Trabajo Proyectos Buscar  │
└───────────────────────────┘
```

Son esquemas de navegación, no pantallas finales ni prueba de usabilidad.

### 3.5 Sistema de interacción

- Creación rápida con título; los demás campos se despliegan según necesidad.
- Guardado optimista para cambios pequeños, con estado pendiente y reversión ante fallo. Cerrar sprints o aplicar lotes espera confirmación del servidor.
- Historial legible: “Ana cambió prioridad de Media a Alta” o “Luis creó 4 tareas mediante Cursor” o “Rielia Builder · Agente creó 4 tareas”.
- Actividad de agentes agrupada por ejecución, con detalle disponible; evitar una notificación por cada campo.
- Atajos descubribles: crear tarea, buscar, navegar. No activarlos mientras se escribe ni interferir con funciones del navegador o asistencia.
- Compartir filtros mediante URL; refrescar y volver debe conservar proyecto, vista y selección válida.
- Estados vacíos útiles: explicar qué contiene la vista y ofrecer una acción pertinente.
- Preferencias individuales de densidad y tema, sin alterar la vista del resto del equipo.
- Notificaciones de asignación, menciones y seguimiento; resumen de lotes, preferencias y silencio por proyecto.
- No declarar “guardado” antes de una respuesta válida. Si se pierde conexión, mostrar datos posiblemente desactualizados y desactivar operaciones que no se puedan confirmar.

### 3.6 Accesibilidad y aceptación responsive

Objetivo de implementación: **WCAG 2.2 AA**, sin afirmar certificación. Adoptar contraste de texto normal ≥4.5:1, contraste de componentes/foco pertinente, navegación con teclado, etiquetas, estructura semántica y alternativas al arrastre. Fuente normativa: [referencia WCAG 2.2](https://www.w3.org/WAI/WCAG22/quickref/).

Requisitos propios del producto:

- Áreas táctiles de al menos 44×44 CSS px como pauta de diseño; no presentarlo como el mínimo general exacto de WCAG.
- Foco visible y restaurado al cerrar paneles; sin trampas de teclado.
- Anunciar movimientos, errores y resultados con lector de pantalla sin exceso de anuncios.
- Estado y prioridad con texto/icono, además del color.
- Zoom, texto ampliado, movimiento reducido y temas claro/oscuro.
- Inputs de al menos 16 px en móvil; no bloquear el zoom.
- Respetar safe areas y teclado virtual; ningún botón esencial debe quedar tapado.
- Comprobar 320, 375, 390, 768, 1024 y 1440 px, orientación horizontal y zoom al 200 %; revisar reflow equivalente a 320 CSS px.
- Validar navegadores de escritorio y Safari/Chrome móviles en versiones soportadas que se definan al implementar.

### 3.7 Dirección UI/UX aprobada para desarrollo

El 24 de octubre de 2026 el usuario aprobó la combinación de Linear para estructura de escritorio y trabajo de desarrollo, Asana para claridad de tarjetas y colaboración, Todoist para trabajo personal y móvil, Trello para simplicidad Kanban, y Plane/ClickUp para contrastar vistas avanzadas cuando entren en alcance.

La [Guía de UI/UX para desarrollo](04-ui-ux-development-guide.es.md) centraliza enlaces de Mobbin, decisiones por pantalla, límites de cada referencia, responsive, criterios UX01–UX11 y el procedimiento para agentes. Leerla junto con los P/US relevantes antes de implementar interfaz. Esta aprobación fija una dirección; no valida todavía mockups finales, usabilidad ni todos los comportamientos de los productos de referencia.

Mantener las prioridades internas B1/B2/B3 y el modelo de una tarea con múltiples vistas. Tabla/calendario siguen en B2 y roadmap/timeline en B3. El documento de branding conserva voz y tokens propios.

## 4. Historias y aceptación

Las historias son contratos del comportamiento esperado. Sus dependencias técnicas se desarrollan en el backlog de ingeniería.

| ID / prioridad | Historia | Criterios de aceptación observables |
| --- | --- | --- |
| US01 / B1 | Como usuario, quiero entrar con Google o GitHub para comenzar sin crear contraseña | Login y logout funcionan; cancelación del proveedor permite reintentar; un proveedor no configurado no aparece; sesión expirada conduce a reautenticación sin perder el borrador recuperable |
| US02 / B1 | Como propietario, quiero separar proyectos personales y compartidos | Crear/cambiar workspace conserva el contexto correcto; buscar o consultar un ID ajeno no devuelve datos; la membresía es obligatoria |
| US03 / B1 | Como administrador, quiero invitar con un rol limitado | Invitación de un uso y con vencimiento; aceptación requiere identidad autorizada; viewer no puede modificar; retirar miembro invalida su acceso y sus grants del workspace |
| US04 / B1 | Como creador, quiero capturar una tarea rápidamente | Solo título y proyecto son obligatorios; devuelve ID y enlace; doble envío/reintento no duplica cuando comparte clave de idempotencia; texto inválido muestra error claro |
| US05 / B1 | Como colaborador, quiero encontrar tareas y cambiar su estado desde lista o tablero | Filtros por estado, responsable, prioridad, etiqueta y sprint; ambas vistas reflejan el mismo registro; alternativa de menú/teclado al arrastre |
| US06 / B1 | Como responsable de planificación, quiero ejecutar un sprint | Define objetivo, fechas y alcance; impide segundo sprint activo; cierre presenta tareas terminadas/canceladas/pendientes y exige destino para pendientes |
| US07 / B1 | Como desarrollador, quiero descomponer una tarea y comentar avances | Subtareas de un nivel, checklist y comentarios; autor/fecha identificables; cerrar padre no oculta hijos abiertos |
| US08 / B1 | Como usuario móvil, quiero completar las mismas acciones esenciales | Crear, buscar, editar, comentar y planificar desde 320 px sin desbordamiento de página; formularios y controles utilizables con tacto y teclado |
| US09 / B1 | Como usuario, quiero conectar mi agente para actuar en mi nombre | Muestra “Actuará como Luis”, proyectos/scopes y vencimiento; no crea miembro agente; credencial visible una vez; revocar bloquea siguiente operación |
| US10 / B1 | Como usuario, quiero convertir un plan en tickets y sprint mediante mi agente | Operaciones autorizadas, enlaces/versiones e idempotencia; creador y autor de comentarios son el usuario, con procedencia MCP; no puede elegir otra identidad en el payload |
| US11 / B1 | Como revisor, quiero reconocer autor y canal de cada cambio | “Luis mediante Cursor”, “Rielia Builder · Agente” y “Sistema” se distinguen; conexión/ejecución consultables sin secretos; cambios posteriores no reescriben creador |
| US12 / B1 | Como colaborador, quiero preservar mi edición frente a otro usuario o agente | Si la versión ya cambió, servidor rechaza la mutación conflictiva y ofrece recargar/comparar; no sobrescribe silenciosamente |
| US13 / B1 | Como propietario, quiero conservar y recuperar mis datos | Exportación JSON documentada; CSV para tareas; archivo/restauración mantiene ID; backup probado en una instancia vacía antes de usar datos importantes |
| US14 / B2 | Como revisor, quiero adjuntar evidencia de forma privada | Archivo autorizado por proyecto, con límite y comprobación de tipo; URL pública no permanente; acceso revocado deniega nuevas descargas |
| US15 / B2 | Como colaborador, quiero recibir avisos útiles | Menciones y asignaciones generan inbox; lotes no producen spam; preferencias respetadas; errores de correo no revierten la tarea |
| US16 / B2 | Como planificador, quiero ver fechas, bloqueos y reportes consistentes | Calendario respeta zona/fecha; dependencias sin ciclos; reporte distingue alcance original, incorporado, retirado, cancelado y terminado |
| US17 / B2 | Como usuario de cliente MCP remoto, quiero autorizar acceso desde el navegador | Ve cliente, proyectos y scopes; autorización con PKCE; deniega audiencia incorrecta; revocar grant corta nuevas operaciones; cliente compatible documentado |
| US18 / B2 | Como equipo que migra, quiero revisar una importación antes de aplicarla | Vista previa, mapeo de campos, errores por fila y política de duplicados; importación cancelada no deja tareas parciales sin informar |
| US19 / B3 | Como equipo, quiero adaptar y automatizar mi proceso | Campos tipados, filtros y reglas explícitas; bucles y cuotas controlados; fallos consultables; cambios automáticos tienen autor sistema y causa |
| US20 / B3 | Como desarrollador, quiero vincular ejecución y planificación | Webhook firmado y deduplicado; un PR no cierra tareas si no existe una regla habilitada; se muestra enlace a la evidencia |
| US21 / B1 | Como visitante, quiero entender la propuesta antes de registrarme | Landing pública ES/EN, beneficios y funcionalidades disponibles con actualización continua; CTA real; no requiere login; móvil/teclado utilizables |
| US22 / B1 opcional | Como interesado, quiero recibir novedades y poder dejar de recibirlas | Solicitud genérica, confirmación de email, baja efectiva, propósito visible; no se habilita sin backend/correo/políticas |
| US23 / B1 | Como usuario, quiero reconocer el mismo producto en app y landing | Logo/tokens coherentes, imágenes y copy localizados, assets accesibles, mockups conceptuales identificados |
| US24 / B1 | Como owner/admin, quiero registrar un agente autónomo con identidad propia | Miembro Agente con nombre, responsable humano, rol/proyectos y credencial propia; crea/comenta como él; puede recibir asignación; no obtiene administración humana |
| US25 / B1 | Como equipo, quiero conservar autoría y controlar acceso en ambas modalidades | Filtros por autor/procedencia coherentes; revocación/suspensión bloquea escrituras; reasignación o baja no cambia creador/historial; nuevas credenciales no permiten suplantar otro sujeto |


**Aceptación transversal:** todo acceso aplica permisos en servidor; las pruebas negativas cubren dos workspaces y proyectos privados. La igualdad entre web y agente se refiere al dominio y la política, no a que ambos puedan ejecutar acciones administrativas reservadas a personas.

## 5. Validación y métricas

### 5.1 Supuestos a intentar refutar

| Hipótesis | Experimento de bajo coste | Señal para decidir |
| --- | --- | --- |
| El flujo con agentes ahorra trabajo de planificación | Usar un proyecto real durante dos sprints; comparar creación y actualización manual frente a MCP | Tiempo total, correcciones y duplicados; continuar si mejora sin más errores |
| Otros equipos comparten el problema | Entrevistar 5–8 personas que ya usen agentes y observar su flujo actual | Problema repetido sin sugerir la solución; reformular si solo interesa como curiosidad |
| La jerarquía propuesta resulta comprensible | Sesiones con prototipo de crear tarea, moverla y planificar sprint | Al menos 4 de 5 completan los recorridos esenciales sin intervención, como umbral provisional |
| Autoalojar aporta valor real | Dos personas ajenas instalan una release en entornos documentados | Consiguen login, tarea, MCP y restauración; registrar cada bloqueo |
| La confianza es suficiente para conceder escritura a agentes | Probar consentimiento y revisión de actividad con usuarios | Comprenden qué puede cambiar la conexión y cómo revocarla |
| La marca comunica el producto | Prueba de comprensión con nombres, frase y una pantalla | Recuerdan propósito y distinguen producto de un chatbot o una consultora |

Los tamaños y umbrales son propuestas para aprender, no resultados existentes ni significación estadística.

### 5.2 Indicadores

**Métrica principal:** workspaces con un ciclo de trabajo útil semanal: planifican o priorizan al menos una tarea y registran ejecución/comentario/cierre posterior. Separar acciones web humanas, delegadas y autónomas conservando el autor efectivo, sin contar sincronizaciones automáticas como uso significativo.

| Área | Métrica | Meta inicial propuesta |
| --- | --- | --- |
| Activación | Usuario nuevo crea proyecto y primera tarea | Mediana <5 minutos en prueba guiada mínima |
| Activación MCP | Conexiones que completan consulta y primera mutación válida | Medir embudo y principales errores; objetivo se fija tras las primeras pruebas |
| Uso recurrente | Retención semanal por cohortes y workspaces activos | Establecer baseline propio; no inventar objetivo de mercado |
| Calidad del plan | Tareas creadas mediante agentes, por modalidad, corregidas por duplicado o mal contexto | Registrar causas; cero duplicados debidos a reintentos con la misma clave |
| Confianza | Cambios revertidos, permisos denegados y revocaciones | Revisar incidentes; ningún acceso entre tenants aceptable |
| Operación | Ratio de solicitudes correctas, latencia y trabajos pendientes | Objetivos técnicos en [§8](02-arquitectura-plan-tecnico.es.md#8-calidad-riesgos-y-decisiones) |
| Self-host | Instalaciones y restauraciones completadas siguiendo documentación | Dos instalaciones externas reproducibles antes del lanzamiento público |

No medir productividad individual mediante rankings de tickets o story points. Recoger telemetría agregada, sin títulos, descripciones, tokens ni código; desactivada por defecto en self-host. Los eventos administrativos necesarios para operar la instancia se documentan por separado.

---

## 6. Open source y sostenibilidad

### 6.1 Modelo de distribución

El repositorio contiene el núcleo completo para autoalojar: web, API, MCP, worker, migraciones, contenedores y documentación. Social login, exportación y acceso por agentes no deben depender de una edición comercial para cumplir la promesa inicial.

Una instalación puede ser personal con registro cerrado, compartida por invitación o pública con límites. Que el código sea abierto no implica que tu VPS deba aceptar a todo el mundo sin cuotas ni política operativa.

### 6.2 Licencia y contribuciones

**Propuesta:** Apache-2.0, si el objetivo prioritario es que cualquiera pueda usar, modificar y adoptar el proyecto con pocas barreras, aceptando incluso servicios comerciales derivados. Incluye condiciones sobre redistribución, avisos y concesiones de patentes; no concede por sí sola derechos sobre marcas. Fuente: [texto oficial Apache-2.0](https://www.apache.org/licenses/LICENSE-2.0).

Si el objetivo real incluye exigir publicación de modificaciones de servicios derivados, reabrir la selección antes del lanzamiento; no asumir ese requisito porque el usuario pidió open source. Auditar compatibilidad de licencias de dependencias y conservar sus avisos. Código abierto y política de uso de nombre/logo se documentan por separado.

Material mínimo:

- `README`: propósito, demo propia cuando exista, instalación y límites actuales.
- `LICENSE`, avisos y relación de dependencias/licencias.
- `CONTRIBUTING`: arranque, arquitectura, pruebas, convenciones y cómo proponer cambios.
- `CODE_OF_CONDUCT`, `SECURITY.md` y canal privado para reportar vulnerabilidades.
- Templates de issues/PR, changelog, política de soporte y releases.
- Guía de upgrades, backups, restauración y configuración de proveedores OAuth.
- `AGENTS.md`: cómo trabajar en el repositorio, límites entre módulos, pruebas, gestión de secretos y evidencias necesarias. No guardar credenciales ni instrucciones de producción dentro de tickets.

### 6.3 Gobernanza y sostenibilidad

Inicialmente, un maintainer toma decisiones y registra ADR/RFC para cambios relevantes. Priorizar por problemas reproducibles y uso, no solo por número de solicitudes. Publicar matriz de versiones soportadas cuando exista la primera release.

Hipótesis de sostenibilidad futuras: donaciones/patrocinio, soporte de autoalojamiento y hosting administrado. Validar demanda y coste antes de añadir cobros. No construir billing en el MVP ni prometer alojamiento gratuito ilimitado.

---

## 7. Landing pública, marketing y recursos de marca

La landing explica propuesta, beneficios, funcionalidades y uso del producto para posibles usuarios. La especificación está en [Lineamientos de la landing](05-landing-page-plan.es.md), y el inventario de propuestas visuales en [Assets](06-brand-assets-guide.es.md).

Comunicar **un lanzamiento público y mejoras continuas**. La página no muestra B0–B3, versiones de acceso, tabla de lanzamiento ni lista de espera. La acción principal de producción es “Usar Rielia”; acceso, instalación y código deben tener destinos reales. Un diseño interno puede seguir marcado como concepto mientras no exista el producto; ese aviso no crea una campaña de prelanzamiento.

Antes del lanzamiento: verificar contenido, enlaces, idiomas, responsive, funcionalidades reales, SEO y tratamiento de datos. Una suscripción opcional ofrece novedades continuas del producto, nunca acceso a una supuesta fase futura. T30–T34 describen implementación posterior; no se ha publicado la landing. La vista anterior y el kit v0.1 siguen siendo exploraciones, sin aprobación final de marca.

El mensaje MCP distingue acciones en nombre del usuario y agentes autónomos con identidad propia. No llamar autor independiente al cliente MCP personal. Esta revisión conserva P35–P37 y añade P38 y US24–US25 para ese modelo de identidad.
