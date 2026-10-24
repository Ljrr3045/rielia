# Rielia — Lineamientos de diseño de la landing page

**Decisión vigente — 24/10/2026:** un lanzamiento y actualización continua. El copy distingue agente que actúa en nombre del usuario y agente autónomo con identidad propia.

**Revisión:** 24 de octubre de 2026.  
**Entregable:** planificación para agentes; diseño e implementación posteriores.  
**Estado:** dirección recomendada a partir de Mobbin; no es un diseño final aprobado. Rielia sigue siendo un nombre provisional.  
**English:** [Landing page design guidelines](05-landing-page-plan.en.md).  
**Contexto:** [Producto](01-producto.es.md) · [UI/UX de la app](04-ui-ux-development-guide.es.md) · [Branding](03-branding.es.md) · [Arquitectura](02-arquitectura-plan-tecnico.es.md) · [Inventario de assets](06-brand-assets-guide.es.md).

## 1. Alcance y autoridad

Este documento define cómo debe verse, qué debe comunicar y cómo debe comportarse la futura landing de Rielia. Permite que un agente prepare el diseño y, cuando reciba el encargo de desarrollo, lo implemente sin improvisar una plantilla SaaS genérica.

La entrega solicitada es documental. Los HTML y composiciones locales creados anteriormente no constituyen el diseño elegido, una referencia aprobada ni una base que los agentes deban reproducir. Este brief sustituye la dirección anterior de la landing. Los assets existentes son propuestas que se evaluarán según su función; su existencia no obliga a utilizarlos.

La combinación de referencias de la **aplicación** ya aprobada se mantiene en la guía UI/UX. Las referencias de **sitios de marketing** investigadas aquí son una recomendación nueva. Producto define funcionalidades y evolución continua; branding define identidad; arquitectura define contratos. Este documento concreta la presentación pública sin ampliar esos alcances.

## 2. Investigación de landings en Mobbin

Se consultaron secciones de sitios web en Mobbin y se inspeccionaron sus imágenes el 24/10/2026. Son capturas de versiones concretas, algunas históricas; no se afirma que representen los sitios actuales. Las observaciones describen composición visible, no resultados de conversión, accesibilidad o rendimiento medidos.

| ID | Referencia y observación visible | Qué adaptar en Rielia | Qué no trasladar |
| --- | --- | --- | --- |
| LPR01 | [Linear — hero](https://mobbin.com/sites/sections/40a46191-a57a-4bab-9a92-94fc14cad817). Titular centrado, explicación breve, una acción destacada y una vista amplia del producto debajo | Jerarquía mensaje → acción → evidencia de producto. El tablero explica la categoría antes de cualquier decoración | Fondo oscuro, gradientes, anuncios promocionales del referente o promesas de una versión ajena |
| LPR02 | [ClickUp — sección de producto](https://mobbin.com/sites/sections/2e29fbe7-7bdd-4574-8b48-138f7770994f). Texto a la izquierda, interfaz a la derecha y categorías sobre el bloque | Relacionar cada beneficio con una vista concreta; usar dos columnas en la sección de planificación | Pestañas obligatorias, múltiples módulos, colores rosas/violetas o afirmaciones de sustituir competidores |
| LPR03 | [Linear — capacidades](https://mobbin.com/sites/sections/2754727c-0d9b-426e-8f87-f3bf560afda4). Módulos de tareas, ciclos, proyectos y backlog con pequeños ejemplos visuales | Nombrar capacidades reconocibles y acompañarlas de evidencia específica | Copiar la cuadrícula de seis tarjetas, mostrar capacidades sin implementar o convertir cada función en decoración |
| LPR04 | [Height — Code to Task](https://mobbin.com/sites/sections/4661d2d5-6de0-4c89-abe6-79f1d910ef02). Mensaje centrado en una acción concreta y una vista de editor que la contextualiza | Explicar la conexión con agentes mediante una secuencia y un ejemplo de tarea/actividad | Afirmar extracción de TODOs, ejecución de código o capacidades no previstas. La captura no demuestra soporte MCP |
| LPR05 | [Campsite — hero](https://mobbin.com/sites/sections/5b4cf5f9-0ea7-4e3b-be27-9ec83d68b42a). Fondo claro, titular corto, CTA dominante y producto debajo | Economía de elementos y espacio suficiente para que el contenido respire | Mensajes sobre vídeo, condiciones de prueba, financiación o identidad del competidor |

**Selección recomendada:** LPR01/LPR05 organizan la apertura; LPR02 orienta las secciones explicativas; LPR03 ayuda a concretar capacidades; LPR04 orienta el relato del flujo con agentes. Se toma una función de cada referencia dentro de un único sistema visual propio.

Se descartaron resultados de aviación, páginas corporativas e integraciones de otros servicios. No se presentan como landings de gestores de tareas por el nombre de la consulta. Usar los enlaces de la tabla como fuentes; no URLs temporales de imágenes de Mobbin. Los agentes deben estudiar las referencias, sin copiar logos, textos ni capturas dentro del producto.

## 3. Dirección visual y mensaje

**Dirección:** una landing clara, serena y centrada en el producto. Fondo claro, titulares de peso, teal en acciones, pocas superficies y ejemplos de trabajo reconocibles. La personalidad procede del lenguaje, el ritmo y la relación entre planificación humana y agentes.

**Público prioritario:** desarrolladores independientes y equipos pequeños que planifican proyectos y trabajan con agentes. El autoalojamiento es una segunda razón de elección. La página debe entenderse por un colaborador que no conoce MCP.

**Promesa:** organizar proyectos, tareas y sprints con contexto compartido entre personas y agentes, manteniendo control sobre el trabajo y la instalación.

En los primeros segundos, la persona debe identificar qué es, para quién sirve, qué aporta la conexión con agentes, qué funciones puede usar y cómo empezar.

| Elemento | Lineamiento para el diseño posterior |
| --- | --- |
| Fondo | `background` claro `#F8FAFC`; `surface` blanco para vistas de producto. Evitar cambiar de fondo en cada sección |
| Texto | `text-primary` `#0F172A`, `text-secondary` `#475569`; usar tokens del branding |
| Acción | Teal `#0F766E` con texto blanco. Mint `#5EEAD4` como acento limitado, nunca texto pequeño sobre blanco |
| Tipografía | Inter candidata y fallback sans del sistema; una familia. Monospace solo en IDs o ejemplos técnicos |
| H1 | Punto de partida: 56–64 px escritorio, 44–48 tablet, 34–40 móvil; interlineado 1.08–1.15. Ajustar con texto real y zoom |
| Otros textos | H2 36–40 px escritorio / 28–32 móvil; cuerpo 18 / 16 px e interlineado 1.5–1.65; ayudas 14 px |
| Anchos | Contenedor máximo 1200 px; texto del hero hasta 800 px; párrafos de 55–70 caracteres por línea cuando haya espacio |
| Ritmo | Escala de branding, ampliada para marketing a 64/80/96 px. Secciones separadas 80–96 px escritorio y 48–64 móvil; espacios internos 16–32 px |
| Superficies | Radio inicial 8 px controles y 12 px vistas; bordes discretos y una sombra suave como máximo en el marco protagonista |
| Iconos | Una familia SVG coherente; acompañan etiquetas, no sustituyen la explicación |

Tema claro como base de la primera landing. No añadir selector de tema ni franja oscura solo por apariencia. Las capturas corresponden a la app real y conservan legibilidad dentro del marco.

## 4. Estructura y composición por sección

Recorrido: **entender → reconocer el trabajo → comprender la conexión con agentes → evaluar control y uso → dar el siguiente paso**.

Esquema documental: navegación → hero/tablero → backlog/sprint → agentes → código abierto/autoalojamiento → novedades opcionales → FAQ → acción final/pie. Una sección de “problema” que repite el hero o una pared de funcionalidades no aportan al recorrido.

### S00. Navegación

Logo/nombre a la izquierda; Producto, Agentes, Código abierto y Preguntas enlazan a secciones. Español / English visible y un único CTA principal estable. Altura orientativa 72 px escritorio / 64 móvil. Si es fija, superficie sólida y espacio reservado; las anclas no ocultan encabezados ni foco.

En móvil: marca, idioma y Menú; enlaces y CTA dentro del menú. Cambiar a este patrón antes de comprimir elementos. “Acceder”, documentación y repositorio solo aparecen con destino real. No añadir precios, ventas o megamenú sin contenido que los justifique.

### S01. Hero con producto protagonista

**Objetivo:** identificar categoría y diferencia sin una introducción abstracta.

Composición centrada: categoría → H1 → párrafo → acción → vista amplia del tablero. La imagen va **debajo** del mensaje, sin competir en otra columna. Referencias LPR01/LPR05.

Copy propuesto para la landing de producción:

> **Gestión de tareas y sprints, de código abierto**
>
> **Tu equipo y tus agentes, en el mismo plan.**
>
> Organiza proyectos y sprints. Gestiona tareas desde la web o con tu agente, conservando tu autoría y el contexto del equipo.
>
> **Usar Rielia**
>
> Código abierto. Trabajo compartido. Mejoras continuas.

La acción abre la entrada real de la aplicación; si hace falta sesión, continúa por login y retorna al destino válido. “Ver cómo funciona” puede enlazar a S02 como secundaria subordinada. Código e instalación van en la sección correspondiente. En el diseño interno se anota el destino pendiente; no se publica un enlace vacío ni se crea una variante de acceso por etapa.

**Vista:** un proyecto, tablero con estados nombrados, tareas legibles y contexto de responsables/prioridades. Marco frontal, sin perspectiva 3D, ventanas flotantes o gráficos superpuestos. Hasta tener captura real, el diseño puede especificar un esquema rotulado **“Concepto de interfaz — producto en desarrollo”**, sin presentarlo como software disponible.

En móvil, mensaje y acción tienen prioridad. Usar captura móvil real cuando exista o un detalle conceptual simplificado y rotulado. No reducir toda la interfaz de escritorio a una miniatura ilegible. Ninguna explicación esencial depende de leer la imagen.

### S02. Planificación: del backlog al sprint

**H2:** “Del backlog al siguiente sprint, con el trabajo claro.”

**Texto:** “Ordena lo pendiente, define un objetivo y reúne las tareas que tu equipo puede abordar. Conserva responsables, prioridades y contexto en el mismo proyecto.” El copy de producción debe coincidir con las funcionalidades realmente implementadas.

Dos columnas en escritorio, aproximadamente 40% texto / 60% vista de planificación de sprint. Lista breve bajo el texto: tareas y subtareas; backlog y tablero; objetivo e historial del sprint. Referencias LPR02/LPR03. No convertirla en tres tarjetas idénticas.

La vista muestra objetivo y tareas asociadas. Evitar velocidad, calendario, dependencias o roadmap si no están en la versión comunicada. En móvil: H2, explicación, beneficios y vista, en ese orden.

### S03. Agentes: en tu nombre o con identidad propia

**H2:** “Trabaja con tu agente sin perder tu autoría.”

**Texto:** “Conecta tu agente de desarrollo mediante MCP para gestionar tareas en tu nombre. Si tu equipo utiliza agentes autónomos, añádelos con identidad y permisos propios.” Explicar MCP una vez como protocolo de acceso autorizado al trabajo del proyecto.

La modalidad principal es personal. Mostrar tres pasos sencillos:

1. **Conecta en tu nombre:** la configuración indica “Actuará como Luis”.
2. **Gestiona tus tareas:** el cliente consulta, crea o actualiza dentro de los proyectos y permisos concedidos.
3. **Conserva el contexto:** tarea creada por Luis e historial “Luis creó esta tarea mediante Cursor”.

Debajo, una explicación breve de autonomía: “Un agente autónomo participa con su propio nombre, puede crear tareas y recibir asignaciones, y siempre aparece identificado como Agente”. Ejemplo separado: “Rielia Builder · Agente creó esta tarea”. No presentar al administrador que lo registró como autor de ese ticket.

Un detalle visual de tarea/historial compara ambos casos y distingue creador de responsable. Crear mediante un agente personal no añade un miembro ni asigna automáticamente la tarea. Referencia LPR04: una acción y su resultado, sin terminal decorativo. El cliente/conexión es procedencia; no una segunda persona en modo delegado.

No simular chats, llamadas ejecutables o ejecución de código. Rielia organiza trabajo; los agentes desarrollan en su entorno. Solo mostrar clientes, permisos y transportes probados, sin prometer aprobación manual universal. En móvil, secuencia y comparación se apilan con etiquetas explícitas. Un futuro vídeo será voluntario y tendrá alternativa textual.

### S04. Código abierto y control de la instalación

**H2:** “Tu trabajo, en una instalación que controlas.”

Explicar proyecto de código abierto, autoalojamiento, exportación disponible y documentación operativa. Enlaces a código/instalación solo cuando existan.

Texto y tres puntos verificables, sin otra cuadrícula. Docker/Dokploy pueden aparecer en una nota técnica; no encabezar con comandos. Aclarar que autoalojar requiere mantener servidor, actualizaciones y backups. No prometer ausencia de costes o mantenimiento.

### S05. Novedades del producto — opcional

Bloque breve: “Rielia mejora contigo”, acompañado de “Nuevas funciones y mejoras continuas para tu forma de trabajar”. Un enlace “Ver novedades” lleva a un changelog con cambios ya publicados.

Mostrar este bloque solo cuando exista contenido real. No incluir calendario de lanzamientos, accesos por versiones, roadmap promocional, fechas prometidas o lista de espera. Si todavía no hay novedades, se omite el bloque sin sustituirlo por datos ficticios. No es una nueva sección protagonista.

### S06. Preguntas frecuentes

Ancho de lectura aproximado 760 px. Cinco preguntas iniciales, respuestas breves y controles accesibles si se usa acordeón:

| Pregunta | Contenido de la respuesta |
| --- | --- |
| ¿Cómo empiezo? | Explicar el acceso real mediante “Usar Rielia” y los proveedores de login habilitados; alternativa de instalación propia con guía verificada |
| ¿Rielia ejecuta código por mí? | El agente desarrolla en su entorno; Rielia organiza tareas y ofrece acceso autorizado por MCP |
| ¿Puedo instalarla en mi servidor? | Enlazar requisitos y guía de autoalojamiento verificados; explicar mantenimiento y backups |
| ¿Funcionará desde el móvil? | Se plantea una web responsive, sin prometer aplicaciones nativas |
| ¿A nombre de quién se crean las tareas desde MCP? | Conexión personal: autor Luis y procedencia visible. Agente autónomo registrado: autor propio con etiqueta Agente. Clientes compatibles se documentan tras probarlos |

Indicar que el nombre es provisional mientras no se cierre el naming, en el estado del proyecto. No mantener ese aviso en una versión con identidad final.

### S07. Acción final y pie

“Un plan claro para lo que vas a construir” y repetición del CTA “Usar Rielia”. Fondo claro y separador, sin otra ilustración protagonista ni urgencia artificial.

Pie: marca, descripción de una línea, idioma y enlaces reales a documentación, repositorio, contacto y políticas aplicables. No inventar empresa, dirección, usuarios, clientes o testimonios. La ausencia de prueba social se resuelve enseñando producto y estado.

## 5. Conversión, estados y microcopy

La landing tiene un CTA principal estable: **“Usar Rielia”**. Comunica el producto y sus mejoras continuas, sin segmentar la visita por un calendario de acceso.

| Acción | Jerarquía | Destino |
| --- | --- | --- |
| Usar Rielia | Principal en navegación, hero y cierre | Entrada real de la aplicación; login cuando sea necesario |
| Ver cómo funciona | Secundaria opcional | S02 y recorrido del producto |
| Instalar en mi servidor | Contextual en S04/pie | Guía y paquete verificados |
| Ver el código | Contextual en S04/pie | Repositorio público real |
| Recibir novedades | Opcional en el pie | Suscripción a actualizaciones, sin prometer acceso anticipado |

Una acción primaria por bloque. No dar igual peso a probar, instalar, ver código y suscribirse; sin popups de entrada ni registro obligatorio para leer. Los destinos se comprueban antes de publicar. Los borradores siguen siendo documentación de diseño, no una web pública de espera.

Si se habilita suscripción: etiqueta “Tu email”, botón “Recibir novedades”, propósito y privacidad. Diseñar vacío, inválido, enviando, solicitud recibida, fallo recuperable, confirmación pendiente/expirada y baja. Respuesta genérica: “Si corresponde, recibirás un email para confirmar tu solicitud”. No confundir envío con suscripción confirmada. Sin correo/backend, omitir formulario activo; contrato futuro en sección 10.

## 6. Responsive e interacciones

| Rango de revisión | Comportamiento esperado |
| --- | --- |
| 320–767 px | Una columna, márgenes 16–24 px, hero sin altura fija, CTA de al menos 44 px de alto; sin scroll horizontal de página |
| 768–1023 px | Márgenes 32 px; columnas solo si textos/vistas siguen legibles. Menú compacto cuando no quepa navegación |
| Desde 1024 px | Contenedor centrado, márgenes de al menos 32 px, secciones explicativas de dos columnas y hero centrado con vista debajo |

Son rangos de composición, no identificación de dispositivos. Revisar 320/390/768/1024/1440 px, horizontal y ampliación de texto, en ES/EN. No fijar botones por la longitud de una traducción.

Enlaces para navegar, botones para actuar. Menú móvil con cierre visible, Escape y devolución de foco. Si es modal, contener foco y bloquear fondo; si se despliega en el flujo, conservar orden natural. FAQ anuncia estado expandido y anclas dejan visible el encabezado destino.

Feedback 120–200 ms sin mover elementos vecinos; respetar movimiento reducido. No scroll secuestrado, parallax, cursor personalizado, carruseles automáticos o contenido invisible por fallos de animación. Navegación y contenido principal siguen disponibles si falla la mejora interactiva.

## 7. Brief de recursos para producir después

| Recurso | Función y especificación | Condición |
| --- | --- | --- |
| Marca horizontal/símbolo | SVG, variante clara y monocroma; legible en cabecera y favicon | Evaluar kit v0.1; no asumir aprobación ni rediseñar para llenar el hero |
| Tablero principal | Captura propia frontal; referencia 1600×1000 y variante móvil específica | Sanitizada y vinculada a release; mientras tanto, concepto rotulado |
| Planificación | Objetivo de sprint y tareas, recorte legible | Capacidad descrita en S02 y estado real |
| Autoría mediante agentes | Comparación “Luis mediante Cursor” / “Rielia Builder · Agente”, con creador y responsable separados | Sin secretos ni funciones inventadas; acompaña S03 |
| Imagen social ES/EN | Formato de trabajo 1200×630; marca, promesa y vista identificada | Comprobar recortes; variantes existentes son candidatas |
| Ilustración opcional | Convergencia de trabajo humano/agente, solo si aporta explicación | No necesaria en primera versión; no sustituye evidencia de producto |

Títulos y CTA serán texto seleccionable, nunca un banner completo rasterizado. Guardar recursos elegidos localmente con dimensiones, procedencia, licencia y release. Gráficos sin texto pueden compartirse entre idiomas. No cargar todas las resoluciones ni usar capturas de competidores como producto propio.

## 8. Reglas para evitar una landing genérica de IA

| Señal genérica | Corrección exigida |
| --- | --- |
| “Revoluciona tu productividad” sin contexto | Nombrar tareas, backlog, sprint y acción facilitada |
| Tres tarjetas iguales en cada bloque | Composición por función: hero, vista editorial, secuencia, lista y FAQ |
| Gradientes/brillos/esferas como foco | Jerarquía y trabajo visible; color para acción y estado |
| Dashboard ficticio lleno de métricas | Tareas coherentes, conceptos rotulados y datos con función |
| Todo depende de “IA” | Explicar qué hace app/agente y sus permisos/límites |
| Copiar cinco referencias a la vez | Un sistema de tipografía, color, espaciado, radios y controles |
| Cifras, testimonios y logos de relleno | Omitir hasta tener evidencia y autorización de uso |
| Controles de imagen que parecen funcionar | Captura identificada; no simular controles activos |

Cada sección responde una pregunta distinta. Si se elimina sin perder información o decisión, simplificarla. Las referencias justifican estructura, no adornos.

## 9. Accesibilidad, SEO y rendimiento previstos

Objetivo: WCAG 2.2 AA. Verificar contraste normal ≥4.5:1, foco visible, teclado, encabezados, etiquetas, alternativas de imagen y zoom. No anunciar decoración como información. Son criterios de aceptación, no certificación obtenida. [Referencia W3C](https://www.w3.org/WAI/WCAG22/quickref/).

Planificar `/es` y `/en` en `apps/web`, con título, descripción, canonical, tarjeta social, idioma visible y alternativas recíprocas. Sitemap solo público; rutas privadas mantienen autorización en servidor. Dominio/URLs finales se configuran cuando existan. [Google Search: versiones localizadas](https://developers.google.com/search/docs/specialty/international/localized-versions), [Next.js: metadata y OG](https://nextjs.org/docs/app/getting-started/metadata-and-og-images).

Priorizar contenido/primera imagen, reservar dimensiones, optimizar formatos y diferir medios inferiores. Evitar vídeo automático y scripts decorativos. Metas a medir al implementar: LCP ≤2.5 s, INP ≤200 ms y CLS ≤0.1 en percentil 75 de visitas, separando móvil/escritorio; laboratorio ayuda antes de tener tráfico. [Web Vitals](https://web.dev/articles/vitals).

Medición mínima propuesta: visitas, clic CTA, apertura de documentación y suscripción confirmada si existe. Sin emails, tokens o datos de proyectos en eventos. Resolver proveedor y consentimiento antes de activar medición; no añadir banner sin propósito.

## 10. Límites técnicos y captación futura

La landing se implementará en Next.js previsto, compartiendo tokens. No requiere otro hosting ni cambia auth, workspace, API o MCP. Mantener Docker/Dokploy y contratos técnicos.

Si se desarrolla captación: `POST /api/v1/marketing/leads` valida email/idioma, deduplica, limita abuso y responde genéricamente. Backend registra solicitud pendiente y token aleatorio hasheado con vencimiento; worker existente confirma por SMTP. GET no cambia suscripción: confirmación/baja son acciones explícitas. Incluir reintentos idempotentes y recuperación.

Guardar pending/confirmed/unsubscribed, propósito, versión de texto y fechas necesarias. Leads accesibles solo a administración de instalación, no roles de workspace/MCP/exportaciones. Suscripción no crea cuenta.

Valores operativos propuestos, a revisar antes de activar: token 24 h; purga de pendientes a 7 días; revisión de retención de confirmados a 90 días del primer lanzamiento o al retirar consentimiento. Son hipótesis de operación. Definir operador/contacto reales, propósito, política y proveedor antes de recoger datos.

## 11. Entrega de agentes y aceptación

Al encargar diseño: wireframe de contenido y especificación de escritorio/móvil, trazables a S00–S07 y LPR01–LPR05. Confirmar funciones/enlaces reales y elegir capturas. Al encargar implementación: aplicar diseño y entregar evidencias de revisión. Una petición de planificación se resuelve con documentos, sin adelantar código, publicación o producción de assets.

| ID | Criterio verificable |
| --- | --- |
| LP01 | Al menos 4 de 5 personas del público identifican categoría, diferencia, forma de uso y siguiente acción sin ayuda; umbral inicial provisional |
| LP02 | Hero con mensaje, CTA estable y vista propia identificada; contenido prioritario en móvil |
| LP03 | Un lanzamiento con actualización continua; sin calendario de acceso ni lista de espera; solo capacidades implementadas |
| LP04 | Agentes: Luis es autor al delegar; agente autónomo tiene identidad propia; creador/responsable separados y procedencia visible |
| LP05 | Revisar ES/EN a 320/390/768/1024/1440 px, zoom/teclado; sin overflow, solapamientos o títulos ocultos |
| LP06 | Menú, FAQ, idioma y CTA funcionan con teclado/táctil; foco, estados y errores claros |
| LP07 | Identidad coherente; revisión contra sección 8 y registro de patrones adaptados/decisiones propias |
| LP08 | Assets con procedencia/tamaño; capturas sanitizadas y conceptos rotulados; sin recursos de competidores en producción |
| LP09 | Enlaces, canonical, idiomas/metadatos válidos; medir rendimiento registrando entorno y método |
| LP10 | Con captación: verificar envío, errores, confirmación, baja y acceso. Sin captación: no hay formulario que simule funcionar |

Conservar backlog: **T30** selección/integración de assets; **T31** landing ES/EN; **T32** captación opcional; **T33** SEO/medición; **T34** revisión y eventual lanzamiento. Vinculados a P35–P38 y US21–US25; T35 fija identidad/autoría. Este brief no los marca como completados.

Pendientes al iniciar desarrollo: naming/identidad finales, capacidades implementadas, dominio, repositorio/acceso, capturas y captación. Valores por defecto mientras tanto: tema claro, hero centrado, tres vistas de producto como máximo, CTA “Usar Rielia” y actualización continua.
