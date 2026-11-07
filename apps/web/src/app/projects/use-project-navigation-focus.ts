'use client';
import { useState, useRef } from 'react';
import type { MouseEvent as ReactMouseEvent } from 'react';
import {
  type ArchiveView,
  type TaskScope,
  type TaskDiscoveryItem,
  type TaskFilters,
} from '@rielia/contracts';
import type { ProjectTaskState } from '../../lib/project-task-controller';
export interface ProjectNavigationFocusPorts {
  anyPending: boolean;
  discoveryProjectId: ProjectTaskState['discoveryProjectId'];
  openDiscoveryTask: (item: TaskDiscoveryItem) => Promise<void>;
  selectProject: (projectId: string | null) => Promise<void>;
  selectTask: (taskId: string | null) => Promise<void>;
  selection: ProjectTaskState['selection'];
  setDiscoveryProject: (projectId: string | null) => Promise<void>;
  setTaskFilters: (filters: TaskFilters) => Promise<void>;
  setTaskScope: (scope: TaskScope) => Promise<void>;
  setView: (collection: 'projects' | 'tasks', view: ArchiveView) => Promise<void>;
  views: ProjectTaskState['views'];
}

export function useProjectNavigationFocus({
  anyPending,
  discoveryProjectId,
  openDiscoveryTask,
  selectProject,
  selectTask,
  selection,
  setDiscoveryProject,
  setTaskFilters,
  setTaskScope,
  setView,
  views,
}: ProjectNavigationFocusPorts) {
  const [drawerOpen, setDrawerOpen] = useState(false);

  const [captureFocusProjectId, setCaptureFocusProjectId] = useState<string | null>(null);

  const discoveryHeadingRef = useRef<HTMLHeadingElement>(null);

  const discoveryReturnRef = useRef(false);

  const sidebarRef = useRef<HTMLElement>(null);

  const drawerOpenerRef = useRef<HTMLElement | null>(null);

  const returnFocusRef = useRef<HTMLElement | null>(null);

  const hadDetailRef = useRef(false);

  function openDrawer(event: ReactMouseEvent<HTMLButtonElement>) {
    drawerOpenerRef.current = event.currentTarget;
    setDrawerOpen(true);
  }

  function closeDrawer() {
    setDrawerOpen(false);
    requestAnimationFrame(() => {
      const opener = drawerOpenerRef.current;
      if (opener !== null && opener.isConnected) opener.focus();
    });
  }

  function selectTaskFromList(taskId: string, opener: HTMLElement) {
    returnFocusRef.current = opener;
    void selectTask(taskId);
    closeDrawer();
  }

  function discoveryLink(scope: 'mine' | 'search'): string {
    const params = new URLSearchParams();
    if (selection.workspaceId !== null) params.set('workspace', selection.workspaceId);
    params.set('taskScope', scope);
    return `/projects?${params.toString()}`;
  }

  function openDiscoveryRow(item: TaskDiscoveryItem, opener: HTMLElement) {
    returnFocusRef.current = opener;
    void openDiscoveryTask(item);
    if (drawerOpen) closeDrawer();
  }

  function changeDiscoveryScope(scope: 'mine' | 'search') {
    if (anyPending) return;
    void setTaskScope(scope);
    if (drawerOpen) closeDrawer();
  }

  function clearDiscoveryFilters() {
    if (anyPending) return;
    void setTaskFilters({});
    if (discoveryProjectId !== null) void setDiscoveryProject(null);
  }

  function chooseProjectForCapture(projectId: string) {
    if (anyPending) return;
    setCaptureFocusProjectId(projectId);
    void selectProject(projectId);
  }

  function openProject(projectId: string) {
    if (anyPending) return;
    void selectProject(projectId);
    closeDrawer();
  }

  function toggleProjectsView() {
    if (anyPending) return;
    void setView('projects', views.projects === 'active' ? 'archived' : 'active');
    closeDrawer();
  }

  function toggleTasksView() {
    if (anyPending) return;
    void setView('tasks', views.tasks === 'active' ? 'archived' : 'active');
  }
  return {
    drawerOpen,
    setDrawerOpen,
    captureFocusProjectId,
    setCaptureFocusProjectId,
    discoveryHeadingRef,
    discoveryReturnRef,
    sidebarRef,
    returnFocusRef,
    hadDetailRef,
    openDrawer,
    closeDrawer,
    selectTaskFromList,
    discoveryLink,
    openDiscoveryRow,
    changeDiscoveryScope,
    clearDiscoveryFilters,
    chooseProjectForCapture,
    openProject,
    toggleProjectsView,
    toggleTasksView,
  };
}
