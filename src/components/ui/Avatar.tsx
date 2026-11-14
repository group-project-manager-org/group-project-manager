'use client';

import { useState } from 'react';
import { cx } from './cx';

const SIZES = {
  xs: 'h-5 w-5 text-[9px]',
  sm: 'h-7 w-7 text-xs',
  md: 'h-9 w-9 text-sm',
  lg: 'h-12 w-12 text-base',
} as const;
export type AvatarSize = keyof typeof SIZES;

// Only the four NYX accents (spec §7: no new colours).
const PALETTE = ['bg-nyx-violet', 'bg-nyx-gold', 'bg-nyx-mint', 'bg-nyx-coral'] as const;

function colorFor(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (seed.charCodeAt(i) + ((hash << 5) - hash)) | 0;
  return PALETTE[Math.abs(hash) % PALETTE.length];
}

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

export interface AvatarProps {
  name: string;
  imageUrl?: string | null;
  /** Stable seed for the fallback colour (use the Clerk user id). Defaults to name. */
  seed?: string;
  size?: AvatarSize;
  /** Adds a ring matching the card background, for stacking. */
  ring?: boolean;
  className?: string;
}

export default function Avatar({ name, imageUrl, seed, size = 'sm', ring = false, className }: AvatarProps) {
  const [broken, setBroken] = useState(false);
  const base = cx(
    'inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full font-bold',
    SIZES[size],
    ring && 'ring-2 ring-nyx-card',
    className,
  );

  if (imageUrl && !broken) {
    return (
      // Clerk avatar URLs are external and tiny; next/image would need remotePatterns config for no real gain.
      // eslint-disable-next-line @next/next/no-img-element
      <img src={imageUrl} alt={name} title={name} className={cx(base, 'object-cover')} onError={() => setBroken(true)} />
    );
  }

  return (
    <span role="img" aria-label={name} title={name} className={cx(base, colorFor(seed ?? name), 'text-nyx-bg')}>
      {initials(name)}
    </span>
  );
}

export interface AvatarStackPerson {
  user_id: string;
  display_name: string;
  image_url: string | null;
}

export interface AvatarStackProps {
  people: AvatarStackPerson[];
  /** How many avatars to show before collapsing into "+N". */
  max?: number;
  size?: AvatarSize;
  className?: string;
}

/** Overlapping avatars with a "+N" overflow chip. Accepts `Member[]` directly. */
export function AvatarStack({ people, max = 4, size = 'sm', className }: AvatarStackProps) {
  const shown = people.slice(0, max);
  const extra = people.length - shown.length;
  return (
    <div className={cx('flex -space-x-2', className)} aria-label={`${people.length} member${people.length === 1 ? '' : 's'}`}>
      {shown.map((p) => (
        <Avatar key={p.user_id} name={p.display_name} imageUrl={p.image_url} seed={p.user_id} size={size} ring />
      ))}
      {extra > 0 && (
        <span
          title={people.slice(max).map((p) => p.display_name).join(', ')}
          className={cx(
            'inline-flex shrink-0 items-center justify-center rounded-full bg-nyx-menu font-geist-mono text-slate-300 ring-2 ring-nyx-card',
            SIZES[size],
          )}
        >
          +{extra}
        </span>
      )}
    </div>
  );
}
