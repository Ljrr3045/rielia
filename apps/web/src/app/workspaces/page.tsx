import type { Metadata } from 'next';
import { WorkspaceView } from './workspace-view';

export const metadata: Metadata = {
  title: 'Espacios de trabajo · Rielia',
  description: 'Selección y administración de espacios, miembros, invitaciones y agentes. Workspace, member, invitation and agent administration.',
  robots: { index: false, follow: false },
};

export default function WorkspacesPage() {
  return <WorkspaceView />;
}
