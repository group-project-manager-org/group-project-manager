'use client'

import { useState } from 'react'
import NoteCard, { NoteEditor } from '@/components/notes/NoteCard'
import { useProjectContext } from '@/components/project/ProjectContext'
import { AddButton, ConfirmDialog, EmptyState, ErrorBanner, LoadingBlock } from '@/components/ui'
import { useActor } from '@/hooks/useActor'
import { useAsync } from '@/hooks/useAsync'
import { useNoteApi } from '@/hooks/useNoteApi'
import type { Note } from '@/lib/types'

/** Pinned first, then newest (same order as listNotes). */
const byPinnedThenNewest = (a: Note, b: Note) => Number(b.pinned) - Number(a.pinned) || b.created_at.localeCompare(a.created_at)

export default function NotesPage() {
    const { project, myRole } = useProjectContext()
    const actor = useActor()
    const api = useNoteApi()

    const { data, loading, error, reload, setData } = useAsync(() => api.listNotes(), [project.id], true)
    const notes = data ? [...data].sort(byPinnedThenNewest) : null

    const [creating, setCreating] = useState(false)
    const [deleting, setDeleting] = useState<Note | null>(null)
    const [actionError, setActionError] = useState<unknown>(null)

    const replace = (note: Note) => setData((prev) => prev?.map((n) => (n.id === note.id ? note : n)) ?? prev)

    async function togglePin(note: Note) {
        replace({ ...note, pinned: !note.pinned }) // optimistic
        try {
            replace(await api.updateNote(note.id, { pinned: !note.pinned }))
        } catch (e) {
            replace(note)
            setActionError(e)
        }
    }

    const newNote = creating && actor && (
        <NoteEditor
            saveLabel="Add note"
            onCancel={() => setCreating(false)}
            onSave={async (content, color) => {
                const note = await api.createNote({ content, color }, actor)
                setData((prev) => [note, ...(prev ?? [])])
                setCreating(false)
            }}
        />
    )

    let body
    if (error) {
        body = <ErrorBanner error={error} onRetry={reload} />
    } else if (loading && !notes) {
        body = <LoadingBlock label="Loading notes" />
    } else if ((!notes || notes.length === 0) && !creating) {
        body = (
            <EmptyState
                title="No notes yet"
                description="Stick up ideas, links and suggestions for the group."
                action={<AddButton label="Add note" onClick={() => setCreating(true)} />}
            />
        )
    } else {
        body = (
            <div className="grid grid-cols-1 items-start gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {newNote}
                {(notes ?? []).map((note) => (
                    <NoteCard
                        key={note.id}
                        note={note}
                        isMine={note.user_id === actor?.user_id}
                        canDelete={note.user_id === actor?.user_id || myRole === 'owner'}
                        onTogglePin={togglePin}
                        onSave={async (n, content, color) => replace(await api.updateNote(n.id, { content, color }))}
                        onDelete={setDeleting}
                    />
                ))}
            </div>
        )
    }

    return (
        <>
            {notes && (notes.length > 0 || creating) && (
                <div className="mb-6">
                    <AddButton label="Add note" onClick={() => setCreating(true)} disabled={creating} />
                </div>
            )}
            <ErrorBanner error={actionError} onDismiss={() => setActionError(null)} className="mb-4" />
            {body}

            <ConfirmDialog
                open={deleting !== null}
                title="Delete note?"
                message="This note will be removed for everyone in the project."
                confirmLabel="Delete note"
                onConfirm={async () => {
                    if (!deleting) return
                    await api.deleteNote(deleting.id)
                    setData((prev) => prev?.filter((n) => n.id !== deleting.id) ?? prev)
                }}
                onCancel={() => setDeleting(null)}
            />
        </>
    )
}
