interface InvitationLocation {
  location: Pick<Location, 'hash' | 'pathname' | 'search'>;
  history: Pick<History, 'state' | 'replaceState'>;
  addEventListener(type: 'hashchange', listener: () => void): void;
  removeEventListener(type: 'hashchange', listener: () => void): void;
}

/** Browser lifecycle only; tokens go directly into the controller's memory.
 * replaceState clears the current history entry without another hashchange. */
export function observeWorkspaceInvitations(controller: { captureInvitation(fragment: string): boolean }, browser: InvitationLocation): () => void {
  const capture = () => {
    const fragment = browser.location.hash;
    if (!new URLSearchParams(fragment.replace(/^#/, '')).has('invitation')) return;
    controller.captureInvitation(fragment);
    browser.history.replaceState(browser.history.state, '', browser.location.pathname + browser.location.search);
  };
  browser.addEventListener('hashchange', capture);
  capture();
  return () => browser.removeEventListener('hashchange', capture);
}
