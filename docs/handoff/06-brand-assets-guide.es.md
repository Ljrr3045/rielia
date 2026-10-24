# Rielia — Kit de marca y guía de assets

**Aclaración de alcance — 24/10/2026:** este archivo inventaría propuestas anteriores. La dirección vigente de la landing está en [05 — Lineamientos de diseño](05-landing-page-plan.es.md). La vista local y las composiciones previas no son el diseño elegido ni recursos obligatorios. La petición actual es planificación documental; producción e integración se decidirán después.

**Fecha:** 24 de octubre de 2026.  
**Versión del kit:** 0.1, propuesta visual para revisión e integración futura.  
**English:** [Brand kit and asset guide](06-brand-assets-guide.en.md).  
**Contexto:** [Branding](03-branding.es.md) · [UI/UX](04-ui-ux-development-guide.es.md) · [Landing](05-landing-page-plan.es.md).

## 1. Qué se entrega

Archivos reales utilizables como punto de partida: símbolo y wordmark vectoriales, variantes de logo, iconos, banners, tarjetas sociales, ilustración editorial y gráfico de proyecto vacío. Se incluyen exportaciones raster y una galería para revisar el conjunto.

El nombre Rielia sigue siendo provisional. El kit es una propuesta concreta; la elección anterior de referencias de UI no equivale a aprobación final de este logo. No se declara disponibilidad registral ni una identidad legalmente exclusiva.

Los logos, iconos y gráficos sin texto son compartidos por ES/EN. Los banners, tarjetas sociales, copy, documentación y vistas de landing tienen variantes localizadas. Evitar duplicar archivos idénticos solo para cambiar la etiqueta de idioma.

## 2. Galería y catálogo

El ZIP de entrega excluye el prototipo anterior de la landing. Las galerías siguientes muestran únicamente el kit de recursos; el diseño vigente se consulta en el documento 05.

- [Galería de recursos ES](assets/index.es.html).
- [Manifest con dimensiones, formatos, tamaños y hashes](assets/manifest.json).

| ID | Recurso | Archivos principales | Uso |
| --- | --- | --- | --- |
| AS01 | Logo horizontal | [SVG](assets/common/logo-horizontal.svg), [PNG](assets/common/logo-horizontal.png), [inverso SVG](assets/common/logo-horizontal-inverse.svg), [monocromo SVG](assets/common/logo-monochrome.svg) | Header, portada, footer, comunicación de producto |
| AS02 | Símbolo e iconos | [Símbolo SVG](assets/common/logo-mark.svg), [favicon SVG](assets/common/favicon.svg), [16 px](assets/common/favicon-16.png), [32 px](assets/common/favicon-32.png), [192 px](assets/common/app-icon-192.png), [512 px](assets/common/app-icon-512.png), [Apple 180 px](assets/common/apple-touch-icon.png) | Navegador, acceso web instalado y superficies pequeñas |
| AS03 | Ilustración editorial | [PNG original](assets/common/hero-editorial.png), [WebP 1600](assets/common/hero-editorial-1600.webp), [WebP 800](assets/common/hero-editorial-800.webp) | Sección narrativa de landing, presentaciones y comunicación |
| AS04 | Banner de landing | [SVG ES](assets/es/banner-landing.svg), [PNG ES](assets/es/banner-landing.png) | Imagen de campaña/portada de 1600×900; no sustituye texto HTML |
| AS05 | Tarjeta para compartir | [SVG ES](assets/es/social-card.svg), [PNG ES](assets/es/social-card.png) | Open Graph/social de 1200×630; usar PNG para compatibilidad |
| AS06 | Banner de repositorio | [SVG ES](assets/es/repository-banner.svg), [PNG ES](assets/es/repository-banner.png) | Portada de documentación/repositorio de 1600×480 |
| AS07 | Proyecto vacío | [SVG](assets/common/empty-project.svg) | Estado vacío de 320×220; título y CTA se renderizan aparte |

Existen exportaciones PNG de los cuatro logos y [banner](assets/en/banner-landing.png), [social](assets/en/social-card.png) y [repositorio](assets/en/repository-banner.png) en inglés. El manifest es el inventario exacto de archivos entregados, no una lista de recursos futuros.

## 3. Concepto de identidad

El símbolo construye una R a partir de dos trazos que comparten dirección. La ilustración desarrolla la misma idea: dos vías de trabajo convergen en un resultado ordenado. Esto alude a personas y agentes dentro del mismo plan, sin representar al agente como un robot ni sugerir que la app ejecuta código.

El wordmark está dibujado mediante paths SVG propios; no necesita descargar una fuente para representar el nombre. El texto editorial de los banners usa Arial/Helvetica/sans-serif como fallback; no se distribuyen archivos de fuentes. Inter continúa como candidata para la interfaz de producción, con su licencia y archivos a revisar al integrarla.

Paleta base: slate `#0F172A`, teal `#0F766E`, mint `#5EEAD4`, paper `#F8FAFC`. Las composiciones respetan la dirección sobria del branding; los gráficos de producto son conceptos originales con datos ficticios claramente identificados.

## 4. Uso del logo

- Logo principal sobre superficies claras; variante inversa sobre oscuras. No cambiar colores por pantalla.
- Reservar alrededor del lockup un espacio mínimo equivalente al 25 % de la altura del símbolo.
- Punto de partida: símbolo de al menos 24 CSS px en UI; para 16 px usar el favicon específico. Lockup horizontal de al menos 112 CSS px y revisar legibilidad en contexto.
- No deformar, inclinar, añadir sombras/glows o encerrar el wordmark en otra tarjeta decorativa.
- No usar el logo como único nombre accesible de una acción. En un enlace a inicio, `alt="Rielia"` o etiqueta equivalente; evitar anunciarlo dos veces.
- Las variantes monocromas mantienen el mismo dibujo. El SVG usa `currentColor`; confirmar su integración si se inserta como SVG inline frente a imagen externa.

Estas son pautas iniciales de producción; la lectura del favicon y de fondos diversos requiere revisión en dispositivos reales antes del lanzamiento.

## 5. Banners e imágenes: integración

Los banners incluyen “Concepto visual / aplicación en desarrollo”. Mantener esa aclaración mientras se usen como propuesta; una futura campaña de lanzamiento deberá sustituir las imágenes conceptuales por evidencia de la release disponible o conservar una etiqueta inequívoca.

En la landing, titulares y botones se implementan en HTML. Usar el banner como recurso de campaña, no como una captura a pantalla completa con todo el texto incrustado. Mostrar el tablero como composición conceptual etiquetada y, más adelante, usar capturas reales sanitizadas de la app.

AS03 es una ilustración editorial generada con ImageGen integrado; los SVG y wordmarks se produjeron como gráficos nativos editables. Las versiones WebP son exportaciones optimizadas del original, sin cambio creativo de contenido. No se usaron capturas de Mobbin como material gráfico redistribuible del kit.

El [prompt exacto y método](assets/generation-prompt.txt) se conserva para reproducibilidad. Ningún archivo de la app o landing debe depender de una URL temporal de generación: todo está guardado en el paquete.

## 6. Accesibilidad y rendimiento

Logo funcional con nombre accesible; ilustraciones decorativas con `alt=""`; capturas informativas con descripción equivalente y texto cercano que explique el beneficio. No usar texto de un PNG como única explicación de una funcionalidad.

Declarar dimensiones para reservar espacio. Elegir `srcset` para AS03 y cargar de forma diferida lo que queda bajo el primer viewport. Conservar PNG original para edición/archivo y preferir WebP para la web. No cargar todos los banners de campaña en la home.

El kit incluye versiones claras/inversas, pero esto no acredita contraste de toda la app. Verificar botones, foco, estados y fondos reales con los criterios de la guía UI/UX.

## 7. Entrega a agentes e integración en repositorio

Estructura entregada:

```text
assets/
  common/              # logos, iconos e ilustraciones independientes del idioma
  es/                  # banners y tarjeta social en español
  en/                  # banners y tarjeta social en inglés
  index.es.html
  index.en.html
  manifest.json
  generation-prompt.txt
```

Guardar este paquete de revisión con la documentación. Para integrar producción, T30 copia los recursos elegidos a `apps/web/public/brand/` o a la ubicación estática estable acordada y actualiza sus rutas. No desplegar automáticamente toda la galería o los documentos dentro de la app pública.

Seleccionar assets desde el manifest; no reconstruir el logo con emojis, iconos de biblioteca o una palabra escrita con otra fuente. Si cambia el nombre o se aprueba otra identidad, crear una versión nueva del kit y actualizar referencias de forma conjunta.

## 8. Aceptación del kit y próximos pasos

- Verificar SVG bien formado, PNG/WebP legibles, tamaños de banners y ausencia de cortes de texto.
- Revisar logo claro/inverso/monocromo y favicon; no evaluar solo la versión grande.
- Conservar hashes, idioma y procedencia en manifest. Los recursos compartidos tienen idioma `und`.
- Probar galerías y landing en móvil/escritorio; comprobar enlaces de descarga y cambio de idioma.
- Antes de publicación comercial, cerrar nombre y aprobar identidad. El kit no modifica por sí mismo la licencia propuesta del código ni define una política final de marca.

**Estado de esta entrega:** archivos, exportaciones, galerías y vista local producidos. La integración en la aplicación, aprobación final de marca, captura real de leads y publicación no se presentan como realizadas.

## 9. Revisión de mensajes para integración futura

Aplicar lanzamiento único y mejoras continuas del documento 05, y autoría de [Producto §2.5](01-producto.es.md#25-identidad-y-autoría-de-las-acciones-con-agentes). Si una composición usa “Agente” como participante genérico, reemplazarlo por “Luis mediante Cursor” en delegación o “Rielia Builder · Agente” en autonomía, con responsable separado del creador. No reutilizar una imagen conceptual que sugiera etapas de acceso o identidad incorrecta.

Los archivos gráficos v0.1 no se regeneran en esta revisión documental; siguen siendo propuestas candidatas. Al producir assets finales, actualizar SVG y exportaciones localizadas conjuntamente y comprobar su coherencia con ambos modos. Logos y gráficos sin autoría no requieren cambios por esta decisión.
