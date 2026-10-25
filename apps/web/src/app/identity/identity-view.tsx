import { useEffect, useRef } from 'react';
import type { IdentityMessage, IdentityProvider, IdentityState } from '../../lib/identity-controller';

type IdentityStatus = IdentityState['status'];
type IdentityPending = IdentityState['pending'];

export interface IdentityViewProps {
  status: IdentityStatus;
  providers: readonly IdentityProvider[];
  user: { name: string; email: string } | null;
  pending: IdentityPending;
  message: IdentityMessage | null;
  onRetry: () => void;
  onSignIn: (provider: IdentityProvider) => void;
  onSignOut: () => void;
}

const PROVIDER_NAMES: Record<IdentityProvider, string> = { google: 'Google', github: 'GitHub' };

const MESSAGES: Record<NonNullable<IdentityMessage>, { es: string; en: string }> = {
  'sign-in-incomplete': {
    es: 'Acceso cancelado o incompleto. Puedes reintentar.',
    en: 'Sign-in was cancelled or incomplete. You can try again.',
  },
  'sign-in-failed': {
    es: 'No se pudo iniciar el acceso. Reintenta.',
    en: 'Sign-in could not start. Try again.',
  },
  'sign-out-failed': {
    es: 'No se pudo confirmar la salida. Reintenta.',
    en: 'Sign-out could not be confirmed. Try again.',
  },
};

function Bilingual({ es, en }: { es: string; en: string }) {
  return <>{es} / <span lang="en">{en}</span></>;
}

export function IdentityView({ status, providers, user, pending, message, onRetry, onSignIn, onSignOut }: IdentityViewProps) {
  const headingRef = useRef<HTMLHeadingElement>(null);
  const controlRef = useRef<HTMLButtonElement | null>(null);
  const actionRef = useRef(false);

  useEffect(() => {
    if (!actionRef.current || pending !== null) return;
    actionRef.current = false;
    const control = controlRef.current;
    controlRef.current = null;
    const active = document.activeElement;
    if (control !== null && !control.isConnected && (active === null || active === document.body)) {
      headingRef.current?.focus();
    }
  }, [pending, status, message]);

  function act(control: HTMLButtonElement, callback: () => void) {
    if (pending !== null) return;
    controlRef.current = control;
    actionRef.current = true;
    callback();
  }

  const busy = pending !== null || status === 'loading';

  return (
    <section className="status identity-panel" aria-labelledby="identity-heading" aria-busy={busy}>
      <h2 id="identity-heading" ref={headingRef} tabIndex={-1}>
        Sesión / <span lang="en">Session</span>
      </h2>
      <div role="status" aria-live="polite">
        {pending === 'sign-in' && <p><Bilingual es="Iniciando acceso…" en="Starting sign-in…" /></p>}
        {pending === 'sign-out' && <p><Bilingual es="Cerrando sesión…" en="Signing out…" /></p>}
        {pending === null && status === 'loading' && <p><Bilingual es="Comprobando sesión…" en="Checking session…" /></p>}
        {pending === null && status === 'unavailable' && (
          <>
            <p><Bilingual es="No se pudo comprobar la sesión." en="Session status is unavailable." /></p>
            <p><Bilingual es="Vuelve a intentarlo en unos momentos." en="Try again in a moment." /></p>
          </>
        )}
        {pending === null && status === 'disabled' && (
          <p><Bilingual es="La identidad está desactivada en esta instalación." en="Identity is disabled for this installation." /></p>
        )}
        {pending === null && status === 'signed-out' && providers.length === 0 && (
          <p><Bilingual es="No hay proveedores de acceso configurados." en="No sign-in providers are configured." /></p>
        )}
        {pending === null && status === 'signed-out' && providers.length > 0 && (
          <p><Bilingual es="Sin sesión activa." en="Signed out." /></p>
        )}
        {pending === null && status === 'signed-in' && user !== null && (
          <p>
            <Bilingual es="Sesión activa" en="Signed in" />: {user.name} ({user.email})
          </p>
        )}
      </div>
      {message !== null && (
        <p className="notice" role="alert"><Bilingual {...MESSAGES[message]} /></p>
      )}
      {status === 'signed-in' && (
        <div className="identity-actions">
          <button type="button" className="refresh" aria-disabled={pending !== null} onClick={event => act(event.currentTarget, onSignOut)}>
            <Bilingual es="Cerrar sesión" en="Sign out" />
          </button>
        </div>
      )}
      {status === 'signed-out' && providers.length > 0 && (
        <div className="identity-actions">
          {providers.map(provider => (
            <button
              type="button"
              className="refresh"
              key={provider}
              aria-disabled={pending !== null}
              onClick={event => act(event.currentTarget, () => onSignIn(provider))}
            >
              <Bilingual es={`Continuar con ${PROVIDER_NAMES[provider]}`} en={`Continue with ${PROVIDER_NAMES[provider]}`} />
            </button>
          ))}
        </div>
      )}
      {status === 'unavailable' && (
        <div className="identity-actions">
          <button type="button" className="refresh button-secondary" aria-disabled={pending !== null} onClick={event => act(event.currentTarget, onRetry)}>
            <Bilingual es="Comprobar de nuevo" en="Check again" />
          </button>
        </div>
      )}
    </section>
  );
}
