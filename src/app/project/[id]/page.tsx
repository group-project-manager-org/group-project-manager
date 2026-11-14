'use client'

import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import TaskCard from '@/components/TaskCard'
import TaskFormModal from '@/components/tasks/TaskFormModal'
import { useProjectContext } from '@/components/project/ProjectContext'
import {
    AddButton,
    ConfirmDialog,
    EmptyState,
    ErrorBanner,
    FIELD_CLASS,
    LoadingBlock,
    STATUSES,
    cx,
} from '@/components/ui'
import { useActor } from '@/hooks/useActor'
import { useAsync } from '@/hooks/useAsync'
import { useRealtime } from '@/hooks/useRealtime'
import { useTaskApi } from '@/hooks/useTaskApi'
import type { Task, TaskPriority, TaskStatus } from '@/lib/types'

type Filter = 'all' | 'mine' | TaskStatus
type Sort = 'due' | 'priority' | 'created'

const PRIORITY_RANK: Record<TaskPriority, number> = { high: 0, medium: 1, low: 2 }

const SORTERS: Record<Sort, (a: Task, b: Task) => number> = {
    // No due date goes last.
    due: (a, b) => (a.due_date ?? '9999').localeCompare(b.due_date ?? '9999') || a.position - b.position,
    priority: (a, b) => PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority] || a.position - b.position,
    created: (a, b) => b.created_at.localeCompare(a.created_at),
}

/**
 * Tasks tab. Tasks are grouped into one section per status; the filter can
 * narrow to "assigned to me" or a single status.
 */
export default function TasksPage() {
    const { project, members, myRole } = useProjectContext()
    const actor = useActor()
    const api = useTaskApi()
    const searchParams = useSearchParams()

    const { data: tasks, loading, error, reload, setData } = useAsync(() => api.listTasks(), [project.id], true)
    useRealtime(['tasks', 'comments'], reload)

    const [filter, setFilter] = useState<Filter>('all')
    const [sort, setSort] = useState<Sort>('due')
    const [formOpen, setFormOpen] = useState(false)
    const [editing, setEditing] = useState<Task | null>(null)
    const [deleting, setDeleting] = useState<Task | null>(null)
    const [actionError, setActionError] = useState<unknown>(null)
    const [highlightId, setHighlightId] = useState<number | null>(null)

    const membersById = useMemo(() => new Map(members.map((m) => [m.user_id, m])), [members])

    // ?task=ID (from a notification): scroll to the task and highlight it briefly.
    const taskParam = Number(searchParams.get('task'))
    useEffect(() => {
        if (!tasks || !taskParam || !tasks.some((t) => t.id === taskParam)) return
        setFilter('all')
        setHighlightId(taskParam)
        const raf = requestAnimationFrame(() =>
            document.getElementById(`task-${taskParam}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' }),
        )
        const timer = setTimeout(() => setHighlightId(null), 2500)
        return () => {
            cancelAnimationFrame(raf)
            clearTimeout(timer)
        }
    }, [tasks !== null, taskParam]) // eslint-disable-line react-hooks/exhaustive-deps

    function replace(task: Task) {
        setData((prev) => prev?.map((t) => (t.id === task.id ? task : t)) ?? prev)
    }

    async function changeStatus(task: Task, status: TaskStatus) {
        replace({ ...task, status }) // optimistic
        try {
            const saved = await api.updateTask(task.id, { status })
            // Keep local subtasks / comment count; take the server's fields.
            setData((prev) => prev?.map((t) => (t.id === task.id ? { ...t, ...saved, subtasks: t.subtasks, comment_count: t.comment_count } : t)) ?? prev)
        } catch (e) {
            replace(task) // roll back
            setActionError(e)
        }
    }

    const visible = useMemo(() => {
        let list = tasks ?? []
        if (filter === 'mine') list = list.filter((t) => t.assignee_id === actor?.user_id)
        else if (filter !== 'all') list = list.filter((t) => t.status === filter)
        return [...list].sort(SORTERS[sort])
    }, [tasks, filter, sort, actor?.user_id])

    const sections = STATUSES.filter((s) => filter === 'all' || filter === 'mine' || filter === s.key).map((s) => ({
        ...s,
        tasks: visible.filter((t) => t.status === s.key),
    }))

    let body
    if (error) {
        body = <ErrorBanner error={error} onRetry={reload} />
    } else if (loading && !tasks) {
        body = <LoadingBlock label="Loading tasks" />
    } else if (!tasks || tasks.length === 0) {
        body = (
            <EmptyState
                title="No tasks yet"
                description="Break the assignment into tasks and assign them to group members."
                action={<AddButton label="Add task" onClick={() => setFormOpen(true)} />}
            />
        )
    } else if (visible.length === 0) {
        body = <EmptyState title="No tasks match this filter" action={<AddButton label="Show all tasks" onClick={() => setFilter('all')} />} />
    } else {
        body = (
            <div className="flex flex-col gap-8">
                {sections.map((section) =>
                    section.tasks.length === 0 && filter !== section.key ? null : (
                        <section key={section.key} aria-labelledby={`section-${section.key}`}>
                            <h2
                                id={`section-${section.key}`}
                                className="mb-3 flex items-center gap-2 font-geist-mono text-sm text-slate-300"
                            >
                                <span aria-hidden className={cx(TONE_TEXT[section.key])}>{section.icon}</span>
                                {section.label}
                                <span className="rounded-full bg-nyx-menu px-2 py-0.5 text-[11px] text-nyx-muted">{section.tasks.length}</span>
                            </h2>
                            <div className="grid grid-cols-1 items-start gap-4 sm:grid-cols-2 xl:grid-cols-3">
                                {section.tasks.map((t) => (
                                    <TaskCard
                                        key={t.id}
                                        task={t}
                                        membersById={membersById}
                                        myUserId={actor?.user_id ?? null}
                                        myRole={myRole}
                                        highlighted={highlightId === t.id}
                                        onStatusChange={changeStatus}
                                        onEdit={(task) => {
                                            setEditing(task)
                                            setFormOpen(true)
                                        }}
                                        onDelete={setDeleting}
                                        onTaskChange={replace}
                                    />
                                ))}
                            </div>
                        </section>
                    ),
                )}
            </div>
        )
    }

    return (
        <>
            <div className="mb-6 flex flex-wrap items-center gap-3">
                <AddButton
                    label="Add task"
                    onClick={() => {
                        setEditing(null)
                        setFormOpen(true)
                    }}
                />
                <div className="ml-auto flex flex-wrap items-center gap-3">
                    <label className="flex items-center gap-2 font-geist-mono text-xs text-nyx-muted">
                        Show
                        <select value={filter} onChange={(e) => setFilter(e.target.value as Filter)} className={cx(FIELD_CLASS, 'w-auto py-2')}>
                            <option value="all">All tasks</option>
                            <option value="mine">Assigned to me</option>
                            {STATUSES.map((s) => (
                                <option key={s.key} value={s.key}>
                                    {s.label}
                                </option>
                            ))}
                        </select>
                    </label>
                    <label className="flex items-center gap-2 font-geist-mono text-xs text-nyx-muted">
                        Sort
                        <select value={sort} onChange={(e) => setSort(e.target.value as Sort)} className={cx(FIELD_CLASS, 'w-auto py-2')}>
                            <option value="due">Due date</option>
                            <option value="priority">Priority</option>
                            <option value="created">Newest</option>
                        </select>
                    </label>
                </div>
            </div>

            <ErrorBanner error={actionError} onDismiss={() => setActionError(null)} className="mb-4" />
            {body}

            <TaskFormModal
                open={formOpen}
                onClose={() => setFormOpen(false)}
                task={editing}
                members={members}
                onSaved={(saved) =>
                    setData((prev) => {
                        const list = prev ?? []
                        const existing = list.find((t) => t.id === saved.id)
                        return existing
                            ? list.map((t) => (t.id === saved.id ? { ...saved, subtasks: t.subtasks, comment_count: t.comment_count } : t))
                            : [...list, saved]
                    })
                }
            />

            <ConfirmDialog
                open={deleting !== null}
                title="Delete task?"
                message={deleting ? `"${deleting.title}" and its subtasks and comments will be deleted.` : undefined}
                confirmLabel="Delete task"
                onConfirm={async () => {
                    if (!deleting) return
                    await api.deleteTask(deleting.id)
                    setData((prev) => prev?.filter((t) => t.id !== deleting.id) ?? prev)
                }}
                onCancel={() => setDeleting(null)}
            />
        </>
    )
}

const TONE_TEXT: Record<TaskStatus, string> = {
    not_started: 'text-nyx-muted',
    in_progress: 'text-nyx-violet',
    review: 'text-nyx-gold',
    done: 'text-nyx-mint',
}
