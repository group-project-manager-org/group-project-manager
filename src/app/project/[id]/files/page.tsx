'use client'

import { useState } from 'react'
import { RiDeleteBinLine, RiDownload2Line } from 'react-icons/ri'
import DropZone from '@/components/files/DropZone'
import FileIcon from '@/components/files/FileIcon'
import { useProjectContext } from '@/components/project/ProjectContext'
import {
    Card,
    ConfirmDialog,
    EmptyState,
    ErrorBanner,
    LoadingBlock,
    Spinner,
    errorMessage,
    formatBytes,
    timeAgo,
} from '@/components/ui'
import { useActor } from '@/hooks/useActor'
import { useAsync } from '@/hooks/useAsync'
import { useFileApi } from '@/hooks/useFileApi'
import { MAX_FILE_BYTES } from '@/lib/db/files'
import type { ProjectFile } from '@/lib/types'

interface Upload {
    key: string
    name: string
    size: number
}

const ICON_BUTTON =
    'rounded-lg p-2 text-slate-400 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nyx-violet disabled:opacity-40'

export default function FilesPage() {
    const { project, myRole } = useProjectContext()
    const actor = useActor()
    const api = useFileApi()

    const { data: files, loading, error, reload, setData } = useAsync(() => api.listFiles(), [project.id], true)

    const [uploads, setUploads] = useState<Upload[]>([])
    const [uploadErrors, setUploadErrors] = useState<string[]>([])
    const [deleting, setDeleting] = useState<ProjectFile | null>(null)
    const [downloadingId, setDownloadingId] = useState<number | null>(null)
    const [actionError, setActionError] = useState<unknown>(null)

    async function handleFiles(picked: File[]) {
        if (!actor) return
        const tooBig = picked.filter((f) => f.size > MAX_FILE_BYTES)
        const ok = picked.filter((f) => f.size <= MAX_FILE_BYTES)
        setUploadErrors(tooBig.map((f) => `"${f.name}" is ${formatBytes(f.size)}; the limit is ${formatBytes(MAX_FILE_BYTES)}.`))

        // Upload one at a time so a slow connection isn't swamped.
        for (const file of ok) {
            const key = `${file.name}-${file.size}-${Math.random()}`
            setUploads((u) => [...u, { key, name: file.name, size: file.size }])
            try {
                const row = await api.uploadFile(file, actor)
                setData((prev) => [row, ...(prev ?? [])])
            } catch (e) {
                setUploadErrors((errs) => [...errs, `"${file.name}" failed to upload: ${errorMessage(e)}`])
            } finally {
                setUploads((u) => u.filter((x) => x.key !== key))
            }
        }
    }

    async function download(file: ProjectFile) {
        // Open the tab synchronously (inside the click) so pop-up blockers allow it,
        // then point it at the signed URL once we have it.
        const tab = window.open('', '_blank')
        setDownloadingId(file.id)
        try {
            const url = await api.getDownloadUrl(file)
            if (tab) {
                tab.opener = null
                tab.location.href = url
            } else {
                window.location.href = url
            }
        } catch (e) {
            tab?.close()
            setActionError(e)
        } finally {
            setDownloadingId(null)
        }
    }

    let list
    if (error) {
        list = <ErrorBanner error={error} onRetry={reload} />
    } else if (loading && !files) {
        list = <LoadingBlock label="Loading files" />
    } else if ((!files || files.length === 0) && uploads.length === 0) {
        list = <EmptyState title="No files yet" description="Upload the brief, drafts and anything else the group needs." />
    } else {
        list = (
            <Card className="divide-y divide-nyx-border overflow-hidden">
                {uploads.map((u) => (
                    <div key={u.key} className="flex items-center gap-3 px-4 py-3 text-sm text-slate-400">
                        <Spinner size="sm" label={`Uploading ${u.name}`} />
                        <span className="min-w-0 flex-1 truncate">{u.name}</span>
                        <span className="font-geist-mono text-xs">{formatBytes(u.size)} · uploading…</span>
                    </div>
                ))}
                {(files ?? []).map((f) => {
                    const canDelete = f.user_id === actor?.user_id || myRole === 'owner'
                    return (
                        <div key={f.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 px-4 py-3 sm:flex-nowrap">
                            <FileIcon fileName={f.file_name} mime={f.mime_type} />
                            <div className="min-w-0 flex-1">
                                <p className="truncate text-sm text-slate-100" title={f.file_name}>
                                    {f.file_name}
                                </p>
                                <p className="font-geist-mono text-[11px] text-nyx-muted">
                                    {formatBytes(f.size_bytes)} · {f.user_name} · <time dateTime={f.created_at}>{timeAgo(f.created_at)}</time>
                                </p>
                            </div>
                            <div className="ml-auto flex shrink-0 items-center gap-1">
                                <button
                                    type="button"
                                    onClick={() => void download(f)}
                                    disabled={downloadingId === f.id}
                                    aria-label={`Download ${f.file_name}`}
                                    title="Download"
                                    className={`${ICON_BUTTON} hover:bg-nyx-menu hover:text-nyx-violet`}
                                >
                                    {downloadingId === f.id ? <Spinner size="sm" /> : <RiDownload2Line size={18} aria-hidden />}
                                </button>
                                {canDelete && (
                                    <button
                                        type="button"
                                        onClick={() => setDeleting(f)}
                                        aria-label={`Delete ${f.file_name}`}
                                        title="Delete"
                                        className={`${ICON_BUTTON} hover:bg-nyx-coral/15 hover:text-nyx-coral`}
                                    >
                                        <RiDeleteBinLine size={18} aria-hidden />
                                    </button>
                                )}
                            </div>
                        </div>
                    )
                })}
            </Card>
        )
    }

    return (
        <div className="flex flex-col gap-5">
            <DropZone onFiles={(f) => void handleFiles(f)} disabled={!actor} maxLabel={formatBytes(MAX_FILE_BYTES)} />
            {uploadErrors.length > 0 && (
                <ErrorBanner error={uploadErrors.join(' ')} onDismiss={() => setUploadErrors([])} />
            )}
            <ErrorBanner error={actionError} onDismiss={() => setActionError(null)} />
            {list}

            <ConfirmDialog
                open={deleting !== null}
                title="Delete file?"
                message={deleting ? `"${deleting.file_name}" will be deleted for everyone in the project.` : undefined}
                confirmLabel="Delete file"
                onConfirm={async () => {
                    if (!deleting) return
                    await api.deleteFile(deleting)
                    setData((prev) => prev?.filter((f) => f.id !== deleting.id) ?? prev)
                }}
                onCancel={() => setDeleting(null)}
            />
        </div>
    )
}
