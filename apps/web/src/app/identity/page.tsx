'use client';

import Link from 'next/link';
import { useIdentity } from '../../lib/use-identity';
import { IdentityView } from './identity-view';

export default function IdentityPage() {
  const identity = useIdentity();
  return (
    <>
      <a className="skip-link" href="#main">Ir al contenido / Skip to content</a>
      <main id="main" tabIndex={-1}>
        <Link href="/">Volver / <span lang="en">Back</span></Link>
        <header>
          <h1>Prueba de identidad / <span lang="en">Identity spike</span></h1>
        </header>
        <p>
          Acceso experimental con Google o GitHub. No crea espacios de trabajo, tareas ni acceso MCP. / <span lang="en">Experimental sign-in with Google or GitHub. It creates no workspaces, tasks, or MCP access.</span>
        </p>
        <IdentityView
          status={identity.status}
          providers={identity.providers}
          user={identity.session?.user ?? null}
          pending={identity.pending}
          message={identity.message}
          onRetry={() => void identity.refresh()}
          onSignIn={provider => void identity.signIn(provider)}
          onSignOut={() => void identity.signOut()}
        />
      </main>
    </>
  );
}
