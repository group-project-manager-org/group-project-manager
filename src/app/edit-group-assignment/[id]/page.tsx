'use client'

import { use } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import AppNav from '@/components/AppNav'
import ProjectForm from '@/components/ProjectForm'
import { Card, ErrorBanner, LoadingBlock } from '@/components/ui'
import { useProject } from '@/hooks/useProject'
import { useProjectActions } from '@/hooks/useProjectActions'

export default function EditGroupAssignmentPage({ params }: { params: Promise<{ id: string }> }) {
    const { id: rawId } = use(params)
    const n = Number(rawId)
    const id = Number.isSafeInteger(n) && n > 0 ? n : null

    const router = useRouter()
    const { data: project, loading, error, reload } = useProject(id)
    const { updateProject } = useProjectActions()

    let body
    if (error) {
        body = <ErrorBanner error={error} onRetry={reload} />
    } else if (id !== null && loading && !project) {
        body = <LoadingBlock label="Loading project" />
    } else if (!project) {
        body = <Message title="Project not found" text="It may have been deleted, or you aren't a member of this project." />
    } else if (project.my_role !== 'owner') {
        body = <Message title="Only the owner can edit this project" text="Ask the project owner to make changes." />
    } else {
        body = (
            <ProjectForm
                key={project.id}
                initial={{
                    project_name: project.project_name,
                    description: project.description ?? '',
                    due_date: project.due_date,
                }}
                submitLabel="Save Changes"
                onSubmit={async (values) => {
                    await updateProject(project.id, values)
                    router.push(`/project/${project.id}`)
                }}
            />
        )
    }

    return (
        <main className="min-h-screen bg-nyx-bg text-slate-100">
            <AppNav />
            <section className="mx-auto flex max-w-2xl flex-col gap-8 px-6 py-16">
                <div className="space-y-2">
                    <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Edit Group Assignment</h1>
                    <p className="text-slate-400">Update the details for your group.</p>
                </div>
                {body}
            </section>
        </main>
    )
}

function Message({ title, text }: { title: string; text: string }) {
    return (
        <Card className="flex flex-col items-center gap-3 p-8 text-center">
            <h2 className="text-xl font-semibold">{title}</h2>
            <p className="text-sm text-slate-400">{text}</p>
            <Link href="/" className="mt-2 font-geist-mono text-sm text-nyx-violet hover:underline">
                Back to home
            </Link>
        </Card>
    )
}
