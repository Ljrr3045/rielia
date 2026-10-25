import Link from 'next/link';
import { isHealthResponse } from '@rielia/contracts';

export const dynamic = 'force-dynamic';

async function checkApi(): Promise<boolean> {
  try {
    const baseUrl = process.env['API_BASE_URL'] ?? 'http://127.0.0.1:3001';
    const response = await fetch(new URL('/api/v1/health', baseUrl), {
      cache: 'no-store',
      signal: AbortSignal.timeout(2000),
    });
    if (!response.ok) return false;
    const body: unknown = await response.json();
    return isHealthResponse(body);
  } catch {
    return false;
  }
}

export default async function Home() {
  const apiAvailable = await checkApi();
  return (
    <>
      <a className="skip-link" href="#main">Ir al contenido / Skip to content</a>
      <main id="main" tabIndex={-1}>
        <header>
          <p className="eyebrow">Rielia · B0</p>
          <h1>Desarrollo <span lang="en">/ Development</span></h1>
        </header>
        <section aria-labelledby="es-heading" lang="es">
          <h2 id="es-heading">Una base técnica para empezar</h2>
          <p>Esta página verifica el arranque de la web y la conexión con la API. Todavía no es una aplicación de gestión de trabajo.</p>
          <p>Hay una prueba de acceso experimental y opcional. El producto real aún no existe; hay un prototipo visual de tareas y sprints con datos ficticios. No hay MCP. El nombre y la identidad visual siguen siendo propuestas.</p>
          <p><Link href="/identity">Prueba de identidad / <span lang="en">Identity spike</span></Link></p>
          <p><Link href="/prototype">Prototipo de tareas / <span lang="en">Task prototype</span></Link></p>
        </section>
        <section aria-labelledby="en-heading" lang="en">
          <h2 id="en-heading">A technical starting point</h2>
          <p>This page checks web startup and the API connection. It is an early development fixture for a future work-management application.</p>
          <p>An optional, experimental sign-in check is available. The real product does not exist yet; a visual task and sprint prototype with fictional data is available. MCP is not implemented. The name and visual identity remain proposals.</p>
          <p><Link href="/identity">Prueba de identidad / <span lang="en">Identity spike</span></Link></p>
          <p><Link href="/prototype">Prototipo de tareas / <span lang="en">Task prototype</span></Link></p>
        </section>
        <section className="status" aria-labelledby="status-heading">
          <h2 id="status-heading">Estado / <span lang="en">Status</span></h2>
          <dl>
            <div><dt>Web</dt><dd>En ejecución / <span lang="en">Running</span></dd></div>
            <div><dt>API</dt><dd data-api-status={apiAvailable ? 'available' : 'unavailable'}>{apiAvailable ? <>Disponible / <span lang="en">Available</span></> : <>No disponible / <span lang="en">Unavailable</span></>}</dd></div>
          </dl>
          <p>Solo se verifica que el proceso responde. <span lang="en">This checks process liveness only.</span></p>
          {!apiAvailable && <p>Inicia la API y vuelve a comprobar. <span lang="en">Start the API and check again.</span></p>}
          <form action="/" method="get">
            <button className="refresh" type="submit">Comprobar de nuevo / <span lang="en">Check again</span></button>
          </form>
        </section>
      </main>
    </>
  );
}
