'use client'

import { useMemo, useState } from 'react'
import CreatePollModal from '@/components/polls/CreatePollModal'
import PollCard from '@/components/polls/PollCard'
import { useProjectContext } from '@/components/project/ProjectContext'
import { AddButton, ConfirmDialog, EmptyState, ErrorBanner, LoadingBlock } from '@/components/ui'
import { useActor } from '@/hooks/useActor'
import { useAsync } from '@/hooks/useAsync'
import { useRealtime } from '@/hooks/useRealtime'
import { usePollApi } from '@/hooks/usePollApi'
import type { ID, Poll } from '@/lib/types'

/** Apply a vote change to a poll locally (one vote per member; changing moves it). */
function withVote(poll: Poll, optionId: ID): Poll {
    const prev = poll.my_vote_option_id
    return {
        ...poll,
        my_vote_option_id: optionId,
        total_votes: prev === null ? poll.total_votes + 1 : poll.total_votes,
        options: poll.options.map((o) => ({
            ...o,
            vote_count: o.vote_count + (o.id === optionId ? 1 : 0) - (o.id === prev ? 1 : 0),
        })),
    }
}

export default function PollsPage() {
    const { project, members, myRole } = useProjectContext()
    const actor = useActor()
    const api = usePollApi()

    const { data: polls, loading, error, reload, setData } = useAsync(
        () => api.listPolls(),
        [project.id, actor?.user_id],
        actor !== null,
    )
    useRealtime(['votes'], reload)

    const [createOpen, setCreateOpen] = useState(false)
    const [deleting, setDeleting] = useState<Poll | null>(null)
    const [votingId, setVotingId] = useState<ID | null>(null)
    const [actionError, setActionError] = useState<unknown>(null)

    const membersById = useMemo(() => new Map(members.map((m) => [m.user_id, m])), [members])

    async function handleVote(poll: Poll, optionId: ID) {
        setVotingId(poll.id)
        setActionError(null)
        setData((prev) => prev?.map((p) => (p.id === poll.id ? withVote(p, optionId) : p)) ?? prev) // optimistic
        try {
            await api.vote(poll.id, optionId)
        } catch (e) {
            setData((prev) => prev?.map((p) => (p.id === poll.id ? poll : p)) ?? prev) // roll back
            setActionError(e)
        } finally {
            setVotingId(null)
        }
    }

    let body
    if (error) {
        body = <ErrorBanner error={error} onRetry={reload} />
    } else if ((loading || !actor) && !polls) {
        body = <LoadingBlock label="Loading polls" />
    } else if (!polls || polls.length === 0) {
        body = (
            <EmptyState
                title="No polls yet"
                description="Ask the group to weigh in on a decision."
                action={<AddButton label="New poll" onClick={() => setCreateOpen(true)} />}
            />
        )
    } else {
        body = (
            <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-2">
                {/* Newest first (listPolls returns oldest first). */}
                {[...polls].sort((a, b) => b.created_at.localeCompare(a.created_at)).map((poll) => (
                    <PollCard
                        key={poll.id}
                        poll={poll}
                        author={membersById.get(poll.user_id)}
                        canDelete={poll.user_id === actor?.user_id || myRole === 'owner'}
                        voting={votingId === poll.id}
                        onVote={handleVote}
                        onDelete={setDeleting}
                    />
                ))}
            </div>
        )
    }

    return (
        <>
            {polls && polls.length > 0 && (
                <div className="mb-6">
                    <AddButton label="New poll" onClick={() => setCreateOpen(true)} />
                </div>
            )}
            <ErrorBanner error={actionError} onDismiss={() => setActionError(null)} className="mb-4" />
            {body}

            <CreatePollModal
                open={createOpen}
                onClose={() => setCreateOpen(false)}
                onCreate={api.createPoll}
                onCreated={(poll) => setData((prev) => [poll, ...(prev ?? [])])}
            />
            <ConfirmDialog
                open={deleting !== null}
                title="Delete poll?"
                message={deleting ? `"${deleting.question}" and all its votes will be deleted.` : undefined}
                confirmLabel="Delete poll"
                onConfirm={async () => {
                    if (!deleting) return
                    await api.deletePoll(deleting.id)
                    setData((prev) => prev?.filter((p) => p.id !== deleting.id) ?? prev)
                }}
                onCancel={() => setDeleting(null)}
            />
        </>
    )
}
