import type { Metadata } from 'next';
import { PrototypeApp } from './prototype-app';

export const metadata: Metadata = {
  title: 'Prototipo de tareas · Rielia',
  description: 'Prototipo visual de navegación de tareas y sprints con datos ficticios. Visual task and sprint navigation prototype with fictional data.',
  robots: { index: false, follow: false },
};

export default function PrototypePage() {
  return <PrototypeApp />;
}
