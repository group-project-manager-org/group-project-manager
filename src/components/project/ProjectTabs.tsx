'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cx } from '@/components/ui';
import { FEATURE_AI_SUMMARY } from '@/hooks/flags';
import type { ID } from '@/lib/types';

export default function ProjectTabs({ projectId }: { projectId: ID }) {
  const pathname = usePathname();
  const navRef = useRef<HTMLElement>(null);
  const base = `/project/${projectId}`;

  const tabs = [
    { href: base, label: 'Tasks', exact: true },
    { href: `${base}/notes`, label: 'Notes' },
    { href: `${base}/polls`, label: 'Polls' },
    { href: `${base}/files`, label: 'Files' },
    ...(FEATURE_AI_SUMMARY ? [{ href: `${base}/summary`, label: 'AI Summary' }] : []),
  ];

  const path = pathname.replace(/\/$/, '');

  // On narrow screens the tabs scroll sideways; keep the active one in view.
  useEffect(() => {
    navRef.current
      ?.querySelector<HTMLElement>('[aria-current="page"]')
      ?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  }, [path]);

  return (
    <nav
      ref={navRef}
      aria-label="Project sections"
      className="scrollbar-none flex snap-x gap-2 overflow-x-auto border-b border-nyx-border px-4 py-3 sm:px-6"
    >
      {tabs.map((tab) => {
        const active = tab.exact ? path === tab.href : path === tab.href || path.startsWith(`${tab.href}/`);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            aria-current={active ? 'page' : undefined}
            className={cx(
              'shrink-0 snap-start whitespace-nowrap rounded-xl border px-4 py-2 font-geist-mono text-sm transition-colors sm:px-5 sm:py-2.5',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nyx-violet',
              active
                ? 'border-nyx-violet bg-nyx-violet/15 text-nyx-violet'
                : 'border-nyx-border bg-nyx-card text-slate-400 hover:border-nyx-violet hover:text-nyx-violet',
            )}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
