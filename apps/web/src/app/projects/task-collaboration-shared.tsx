'use client';

import type { useProjectTasks } from '../../lib/use-project-tasks';
import { copy, type Lang } from './strings';

export type ProjectTasksHook = ReturnType<typeof useProjectTasks>;

type ProvenanceLike = {
  executionMode: 'human' | 'delegated' | 'autonomous' | 'system';
  source: 'web' | 'mcp' | 'internal';
};

export function formatTimestamp(value: string, lang: Lang): string {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return value;
  return new Intl.DateTimeFormat(lang === 'es' ? 'es-ES' : 'en-GB', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}

export function provenanceLabel(provenance: ProvenanceLike, lang: Lang): string {
  if (provenance.executionMode === 'system') return copy.collaboration.systemActor[lang];
  if (provenance.executionMode === 'autonomous') {
    return provenance.source === 'mcp'
      ? `${copy.task.autonomousAgent[lang]} · MCP`
      : copy.task.autonomousAgent[lang];
  }
  if (provenance.executionMode === 'delegated') {
    return provenance.source === 'mcp'
      ? `${copy.task.throughClient[lang]} MCP`
      : copy.task.throughClient[lang];
  }
  return copy.task.throughWeb[lang];
}

export function actorKindLabel(kind: string, lang: Lang): string | null {
  if (kind === 'agent') return copy.task.agentBadge[lang];
  if (kind === 'system') return copy.task.systemBadge[lang];
  return null;
}
