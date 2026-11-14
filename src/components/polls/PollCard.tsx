'use client';

import { RiDeleteBinLine } from 'react-icons/ri';
import { Avatar, Card, Menu, cx, timeAgo } from '@/components/ui';
import type { ID, Member, Poll } from '@/lib/types';

export interface PollCardProps {
  poll: Poll;
  author: Member | undefined;
  canDelete: boolean;
  /** True while a vote for this poll is being saved. */
  voting: boolean;
  onVote: (poll: Poll, optionId: ID) => void;
  onDelete: (poll: Poll) => void;
}

/** One poll: each option is a bar with its share of the votes. Your vote is violet; click another to change it. */
export default function PollCard({ poll, author, canDelete, voting, onVote, onDelete }: PollCardProps) {
  const total = poll.total_votes;

  return (
    <Card className="p-5">
      <div className="mb-4 flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <h3 className="break-words text-[15px] font-semibold text-slate-100">{poll.question}</h3>
          <p className="mt-1 flex items-center gap-1.5 text-[11px] text-nyx-muted">
            <Avatar name={author?.display_name ?? 'Former member'} imageUrl={author?.image_url} seed={poll.user_id} size="xs" />
            {author?.display_name ?? 'Former member'} · {timeAgo(poll.created_at)}
          </p>
        </div>
        {canDelete && (
          <Menu
            label={`Options for poll "${poll.question}"`}
            items={[{ label: 'Delete poll', icon: <RiDeleteBinLine />, danger: true, onSelect: () => onDelete(poll) }]}
          />
        )}
      </div>

      <div className="flex flex-col gap-2" role="radiogroup" aria-label={poll.question}>
        {poll.options.map((option) => {
          const pct = total === 0 ? 0 : Math.round((option.vote_count / total) * 100);
          const mine = poll.my_vote_option_id === option.id;
          return (
            <button
              key={option.id}
              type="button"
              role="radio"
              aria-checked={mine}
              disabled={voting}
              onClick={() => !mine && onVote(poll, option.id)}
              className={cx(
                'relative w-full overflow-hidden rounded-xl border px-4 py-3 text-left text-sm transition-colors',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nyx-violet disabled:cursor-wait',
                mine
                  ? 'border-nyx-violet text-slate-100'
                  : 'border-nyx-border text-slate-300 hover:border-nyx-violet/60 hover:text-slate-100',
              )}
            >
              <span
                aria-hidden
                className={cx('absolute inset-y-0 left-0 transition-all duration-500', mine ? 'bg-nyx-violet/30' : 'bg-nyx-border/60')}
                style={{ width: `${pct}%` }}
              />
              <span className="relative flex items-center justify-between gap-3">
                <span className="flex min-w-0 items-center gap-2">
                  {mine && <span className="text-nyx-violet" aria-hidden>✦</span>}
                  <span className="break-words">{option.option_name}</span>
                </span>
                <span className="shrink-0 font-geist-mono text-xs text-slate-400">
                  {pct}% · {option.vote_count}
                </span>
              </span>
            </button>
          );
        })}
      </div>

      <p className="mt-3 font-geist-mono text-xs text-nyx-muted">
        {total} vote{total === 1 ? '' : 's'}
        {poll.my_vote_option_id === null ? ' · tap an option to vote' : ' · tap another option to change your vote'}
      </p>
    </Card>
  );
}
