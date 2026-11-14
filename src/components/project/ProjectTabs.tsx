'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cx } from '@/components/ui';
import type { ID } from '@/lib/types';

const SHOW_SUMMARY = process.env.NEXT_PUBLIC_FEATURE_AI_SUMMARY === '1';

export default function ProjectTabs({ projectId }: { projectId: ID }) {
  const pathname = usePathname();
  const base = `/project/${projectId}`;

  const tabs = [
    { href: base, label: 'Tasks', exact: true },
    { href: `${base}/notes`, label: 'Notes' },
    { href: `${base}/polls`, label: 'Polls' },
    { href: `${base}/files`, label: 'Files' },
    ...(SHOW_SUMMARY ? [{ href: `${base}/summary`, label: 'AI Summary' }] : []),
  ];

  const path = pathname.replace(/\/$/, '');

  return (
    <nav aria-label="Project sections" className="flex gap-2 overflow-x-auto border-b border-nyx-border px-6 py-3">
      {tabs.map((tab) => {
        const active = tab.exact ? path === tab.href : path === tab.href || path.startsWith(`${tab.href}/`);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            aria-current={active ? 'page' : undefined}
            className={cx(
              'whitespace-nowrap rounded-xl border px-5 py-2.5 font-geist-mono text-sm transition-colors',
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
