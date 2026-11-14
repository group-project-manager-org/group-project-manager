'use client';

import { useEffect, useState } from 'react';
import { RiDeleteBinLine } from 'react-icons/ri';
import { Avatar, ErrorBanner, Spinner, timeAgo } from '@/components/ui';
import { useActor } from '@/hooks/useActor';
import { useTaskApi } from '@/hooks/useTaskApi';
import type { Comment, Member, Task } from '@/lib/types';

export interface CommentsSectionProps {
  task: Task;
  membersById: Map<string, Member>;
  /** Called with the new comment count after adding / deleting. */
  onCountChange: (count: number) => void;
}

/** Loaded on first render (the parent only mounts it once the section is opened). */
export default function CommentsSection({ task, membersById, onCountChange }: CommentsSectionProps) {
  const api = useTaskApi();
  const actor = useActor();
  const [comments, setComments] = useState<Comment[] | null>(null);
  const [loadError, setLoadError] = useState<unknown>(null);
  const [error, setError] = useState<unknown>(null);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    let stale = false;
    api
      .listComments(task.id)
      .then((c) => !stale && setComments(c))
      .catch((e) => !stale && setLoadError(e));
    return () => {
      stale = true;
    };
    // Load once per task; api identity changes shouldn't refetch.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [task.id]);

  async function submit() {
    const content = draft.trim();
    if (!content || !actor || sending) return;
    if (content.length > 2000) {
      setError('Comments can be up to 2000 characters.');
      return;
    }
    setSending(true);
    setError(null);
    try {
      const c = await api.addComment(task.id, content, actor);
      const next = [...(comments ?? []), c];
      setComments(next);
      onCountChange(next.length);
      setDraft('');
    } catch (e) {
      setError(e);
    } finally {
      setSending(false);
    }
  }

  async function remove(c: Comment) {
    const prev = comments ?? [];
    const next = prev.filter((x) => x.id !== c.id);
    setComments(next);
    onCountChange(next.length);
    try {
      await api.deleteComment(c.id);
    } catch (e) {
      setComments(prev);
      onCountChange(prev.length);
      setError(e);
    }
  }

  return (
    <div className="flex flex-col gap-2.5">
      {loadError ? (
        <ErrorBanner error={loadError} />
      ) : comments === null ? (
        <div className="flex justify-center py-3">
          <Spinner size="sm" label="Loading comments" />
        </div>
      ) : comments.length === 0 ? (
        <p className="py-1 text-center text-[12px] text-nyx-muted">No comments yet. Start the conversation.</p>
      ) : (
        <ul className="flex max-h-72 flex-col gap-2 overflow-y-auto">
          {comments.map((c) => {
            const m = membersById.get(c.user_id);
            return (
              <li key={c.id} className="group flex gap-2.5 rounded-xl bg-nyx-bg p-2.5">
                <Avatar name={c.user_name} imageUrl={m?.image_url} seed={c.user_id} size="xs" className="mt-0.5" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline gap-2">
                    <span className="truncate text-[11.5px] font-semibold">{c.user_name}</span>
                    <time dateTime={c.created_at} className="shrink-0 font-geist-mono text-[10px] text-nyx-muted">
                      {timeAgo(c.created_at)}
                    </time>
                    {c.user_id === actor?.user_id && (
                      <button
                        type="button"
                        onClick={() => void remove(c)}
                        aria-label="Delete comment"
                        className="ml-auto rounded p-0.5 text-nyx-muted opacity-0 transition-opacity hover:text-nyx-coral focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nyx-violet group-hover:opacity-100"
                      >
                        <RiDeleteBinLine size={12} aria-hidden />
                      </button>
                    )}
                  </div>
                  <p className="mt-0.5 whitespace-pre-wrap break-words text-[12px] leading-snug text-nyx-text">{c.content}</p>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <div className="flex items-end gap-2">
        <textarea
          rows={1}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            // Enter sends, Shift+Enter adds a new line.
            if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
              e.preventDefault();
              void submit();
            }
          }}
          placeholder="Add a comment…"
          aria-label="Add a comment"
          className="max-h-32 min-h-[36px] flex-1 resize-y rounded-lg border border-nyx-border bg-nyx-bg px-3 py-2 text-[12px] text-nyx-text placeholder:text-nyx-muted outline-none focus:border-nyx-violet"
        />
        <button
          type="button"
          onClick={() => void submit()}
          disabled={!draft.trim() || sending}
          className="h-9 rounded-lg bg-nyx-violet px-3 text-[11.5px] font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nyx-violet focus-visible:ring-offset-2 focus-visible:ring-offset-nyx-card"
        >
          {sending ? <Spinner size="sm" className="text-white" label="Sending" /> : 'Send'}
        </button>
      </div>
      <ErrorBanner error={error} onDismiss={() => setError(null)} />
    </div>
  );
}
