import type { Metadata } from 'next';
import { ProjectsView } from './projects-view';

export const metadata: Metadata = {
  title: 'Proyectos y tareas · Rielia',
  description: 'Proyectos, tareas, responsables y archivo del espacio actual. Projects, tasks, assignees and archive for the current workspace.',
  robots: { index: false, follow: false },
};

export default function ProjectsPage() {
  return <ProjectsView />;
}
