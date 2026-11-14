'use client'

import { useEffect, useState } from 'react'
import { RiSparkling2Line } from 'react-icons/ri'
import { useProjectContext } from '@/components/project/ProjectContext'
import { Avatar, Button, Card, EmptyState, ErrorBanner, timeAgo } from '@/components/ui'
import { FEATURE_AI_SUMMARY } from '@/hooks/flags'
import { USE_MOCKS } from '@/hooks/mocks'
import { mockGetMemberSummaries } from '@/hooks/mockSummary'
import { getMemberSummaries, type MemberSummariesResponse } from '@/lib/api'

export default function SummaryPage() {
    const { project, members } = useProjectContext()
    const [result, setResult] = useState<MemberSummariesResponse | null>(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<unknown>(null)
    // Re-render every minute so "Generated 12 min ago" stays current.
    const [, setTick] = useState(0)

    useEffect(() => {
        if (!result) return
        const t = setInterval(() => setTick((n) => n + 1), 60_000)
        return () => clearInterval(t)
    }, [result])

    if (!FEATURE_AI_SUMMARY) {
        return <EmptyState title="AI summaries aren't enabled" description="Set NEXT_PUBLIC_FEATURE_AI_SUMMARY=1 to turn this tab on." />
    }

    async function generate() {
        setLoading(true)
        setError(null)
        try {
            setResult(await (USE_MOCKS ? mockGetMemberSummaries(members) : getMemberSummaries(project.id)))
        } catch (e) {
            setError(e)
        } finally {
            setLoading(false)
        }
    }

    const membersById = new Map(members.map((m) => [m.user_id, m]))

    return (
        <div className="flex flex-col gap-5">
            <Card className="flex flex-wrap items-center gap-4 p-5">
                <RiSparkling2Line size={28} aria-hidden className="shrink-0 text-nyx-violet" />
                <div className="min-w-0 flex-1">
                    <h2 className="font-semibold">Contribution summary</h2>
                    <p className="text-sm text-slate-400">
                        A short, neutral summary of what each member has worked on in the last 14 days, based on tasks, comments,
                        notes and votes. It describes activity only and may miss work done outside NYX.
                    </p>
                    {result && (
                        <p className="mt-1 font-geist-mono text-xs text-nyx-muted">
                            Generated <time dateTime={result.generated_at}>{timeAgo(result.generated_at)}</time>
                            {' · '}refreshes at most once an hour
                        </p>
                    )}
                </div>
                <Button onClick={() => void generate()} loading={loading}>
                    {result ? 'Refresh' : 'Generate summary'}
                </Button>
            </Card>

            <ErrorBanner error={error} onDismiss={() => setError(null)} />

            {loading && !result ? (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2" aria-busy="true" aria-label="Generating summaries">
                    {members.map((m) => (
                        <SkeletonCard key={m.user_id} />
                    ))}
                </div>
            ) : result ? (
                <div className="grid grid-cols-1 items-start gap-4 md:grid-cols-2">
                    {result.members.map((s) => {
                        const m = membersById.get(s.user_id)
                        return (
                            <Card key={s.user_id} className="flex flex-col gap-3 p-5">
                                <div className="flex items-center gap-3">
                                    <Avatar name={s.display_name} imageUrl={m?.image_url} seed={s.user_id} size="md" />
                                    <div className="min-w-0 flex-1">
                                        <h3 className="truncate font-semibold">{s.display_name}</h3>
                                        <p className="font-geist-mono text-xs">
                                            <span className="text-nyx-mint">{s.tasks_done} done</span>
                                            <span className="text-nyx-muted"> · </span>
                                            <span className="text-nyx-violet">{s.tasks_open} open</span>
                                        </p>
                                    </div>
                                </div>
                                <p className="text-sm leading-relaxed text-slate-300">{s.summary}</p>
                            </Card>
                        )
                    })}
                </div>
            ) : (
                !error && (
                    <EmptyState
                        title="No summary yet"
                        description={`Generate one to see what each of the ${members.length} members has been working on.`}
                    />
                )
            )}
        </div>
    )
}

function SkeletonCard() {
    return (
        <Card className="flex animate-pulse flex-col gap-3 p-5">
            <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-full bg-nyx-border" />
                <div className="flex flex-1 flex-col gap-1.5">
                    <div className="h-3.5 w-1/3 rounded bg-nyx-border" />
                    <div className="h-2.5 w-1/4 rounded bg-nyx-border" />
                </div>
            </div>
            <div className="h-3 w-full rounded bg-nyx-border" />
            <div className="h-3 w-5/6 rounded bg-nyx-border" />
            <div className="h-3 w-2/3 rounded bg-nyx-border" />
        </Card>
    )
}
