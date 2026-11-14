'use client';

import { useEffect, useRef, useState } from 'react';
import { RiDeleteBinLine, RiPushpin2Fill, RiPushpin2Line } from 'react-icons/ri';
import { Button, ErrorBanner, cx, timeAgo } from '@/components/ui';
import type { Note, NoteColor } from '@/lib/types';

export const NOTE_COLORS: { key: NoteColor; label: string; card: string; swatch: string }[] = [
  { key: 'violet', label: 'Violet', card: 'bg-nyx-violet/15 border-l-nyx-violet', swatch: 'bg-nyx-violet' },
  { key: 'gold', label: 'Gold', card: 'bg-nyx-gold/15 border-l-nyx-gold', swatch: 'bg-nyx-gold' },
  { key: 'mint', label: 'Mint', card: 'bg-nyx-mint/15 border-l-nyx-mint', swatch: 'bg-nyx-mint' },
  { key: 'coral', label: 'Coral', card: 'bg-nyx-coral/15 border-l-nyx-coral', swatch: 'bg-nyx-coral' },
];
const colorMeta = (c: NoteColor) => NOTE_COLORS.find((x) => x.key === c) ?? NOTE_COLORS[0];

export const NOTE_MAX = 1000;

/** Content + colour editor, used for new notes and for editing your own. */
export function NoteEditor({
  initialContent = '',
  initialColor = 'violet',
  saveLabel,
  onSave,
  onCancel,
}: {
  initialContent?: string;
  initialColor?: NoteColor;
  saveLabel: string;
  onSave: (content: string, color: NoteColor) => Promise<void>;
  onCancel: () => void;
}) {
  const [content, setContent] = useState(initialContent);
  const [color, setColor] = useState<NoteColor>(initialColor);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.focus();
    el.setSelectionRange(el.value.length, el.value.length);
  }, []);

  async function save() {
    const text = content.trim();
    if (!text) return setError('Write something first.');
    if (text.length > NOTE_MAX) return setError(`Notes can be up to ${NOTE_MAX} characters.`);
    setSaving(true);
    setError(null);
    try {
      await onSave(text, color);
    } catch (e) {
      setError(e);
      setSaving(false);
    }
  }

  return (
    <div className={cx('flex flex-col gap-3 rounded-2xl border border-nyx-border border-l-4 p-4', colorMeta(color).card)}>
      <textarea
        ref={ref}
        rows={4}
        value={content}
        onChange={(e) => setContent(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Escape') onCancel();
          if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) void save();
        }}
        placeholder="Share an idea or suggestion…"
        aria-label="Note text"
        className="w-full resize-y rounded-lg border border-nyx-border bg-nyx-bg/60 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 outline-none focus:border-nyx-violet"
      />
      <div className="flex flex-wrap items-center gap-2">
        <div role="radiogroup" aria-label="Note colour" className="flex gap-1.5">
          {NOTE_COLORS.map((c) => (
            <button
              key={c.key}
              type="button"
              role="radio"
              aria-checked={color === c.key}
              aria-label={c.label}
              onClick={() => setColor(c.key)}
              className={cx(
                'h-6 w-6 rounded-full transition-transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white',
                c.swatch,
                color === c.key ? 'scale-110 ring-2 ring-white/80 ring-offset-2 ring-offset-nyx-card' : 'opacity-70 hover:opacity-100',
              )}
            />
          ))}
        </div>
        <span className={cx('ml-auto font-geist-mono text-[11px]', content.trim().length > NOTE_MAX ? 'text-nyx-coral' : 'text-nyx-muted')}>
          {content.trim().length}/{NOTE_MAX}
        </span>
        <Button variant="ghost" size="sm" onClick={onCancel} disabled={saving}>
          Cancel
        </Button>
        <Button size="sm" onClick={() => void save()} loading={saving}>
          {saveLabel}
        </Button>
      </div>
      <ErrorBanner error={error} />
    </div>
  );
}

export interface NoteCardProps {
  note: Note;
  isMine: boolean;
  canDelete: boolean;
  onTogglePin: (note: Note) => void;
  onSave: (note: Note, content: string, color: NoteColor) => Promise<void>;
  onDelete: (note: Note) => void;
}

export default function NoteCard({ note, isMine, canDelete, onTogglePin, onSave, onDelete }: NoteCardProps) {
  const [editing, setEditing] = useState(false);

  if (editing) {
    return (
      <NoteEditor
        initialContent={note.content}
        initialColor={note.color}
        saveLabel="Save"
        onSave={async (content, color) => {
          await onSave(note, content, color);
          setEditing(false);
        }}
        onCancel={() => setEditing(false)}
      />
    );
  }

  return (
    <article className={cx('group flex flex-col gap-3 rounded-2xl border border-nyx-border border-l-4 p-4', colorMeta(note.color).card)}>
      <div className="flex items-start gap-2">
        {isMine ? (
          <button
            type="button"
            onClick={() => setEditing(true)}
            aria-label="Edit note"
            className="flex-1 whitespace-pre-wrap break-words rounded text-left text-sm leading-relaxed text-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nyx-violet"
          >
            {note.content}
          </button>
        ) : (
          <p className="flex-1 whitespace-pre-wrap break-words text-sm leading-relaxed text-slate-100">{note.content}</p>
        )}
        <button
          type="button"
          onClick={() => onTogglePin(note)}
          aria-pressed={note.pinned}
          aria-label={note.pinned ? 'Unpin note' : 'Pin note'}
          title={note.pinned ? 'Unpin' : 'Pin to top'}
          className={cx(
            'shrink-0 rounded p-1 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nyx-violet',
            note.pinned ? 'text-nyx-gold' : 'text-nyx-muted opacity-60 hover:text-nyx-gold hover:opacity-100',
          )}
        >
          {note.pinned ? <RiPushpin2Fill aria-hidden /> : <RiPushpin2Line aria-hidden />}
        </button>
      </div>

      <div className="mt-auto flex items-center gap-2 font-geist-mono text-[11px] text-nyx-muted">
        {note.pinned && <span aria-hidden>📌</span>}
        <span className="truncate">{note.user_name}</span>
        <span aria-hidden>·</span>
        {/* No "(edited)" label: pinning also bumps updated_at (B6), so it can't tell edits apart. */}
        <time dateTime={note.created_at}>{timeAgo(note.created_at)}</time>
        {canDelete && (
          <button
            type="button"
            onClick={() => onDelete(note)}
            aria-label="Delete note"
            className="ml-auto rounded p-1 opacity-0 transition-opacity hover:text-nyx-coral focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nyx-violet group-hover:opacity-100"
          >
            <RiDeleteBinLine aria-hidden />
          </button>
        )}
      </div>
    </article>
  );
}
