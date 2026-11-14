'use client';

import { createContext, useContext, type ReactNode } from 'react';
import type { Member, MemberRole, ProjectSummary } from '@/lib/types';

export interface ProjectContextValue {
  project: ProjectSummary;
  members: Member[];
  myRole: MemberRole;
  /** Re-fetch the project (e.g. after adding a member). */
  reload: () => Promise<void>;
}

const ProjectContext = createContext<ProjectContextValue | null>(null);

export function ProjectProvider({ value, children }: { value: ProjectContextValue; children: ReactNode }) {
  return <ProjectContext.Provider value={value}>{children}</ProjectContext.Provider>;
}

/** Current project for pages under /project/[id]. Only usable inside the project layout. */
export function useProjectContext(): ProjectContextValue {
  const ctx = useContext(ProjectContext);
  if (!ctx) throw new Error('useProjectContext must be used inside src/app/project/[id]/layout.tsx');
  return ctx;
}
