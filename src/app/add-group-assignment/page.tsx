'use client'

import { useRouter } from 'next/navigation'
import AppNav from '@/components/AppNav'
import ProjectForm from '@/components/ProjectForm'
import { LoadingBlock } from '@/components/ui'
import { useActor } from '@/hooks/useActor'
import { useProjectActions } from '@/hooks/useProjectActions'

export default function AddGroupAssignmentPage() {
    const router = useRouter()
    const actor = useActor()
    const { createProject } = useProjectActions()

    return (
        <main className="min-h-screen bg-nyx-bg text-slate-100">
            <AppNav />
            <section className="mx-auto flex max-w-2xl flex-col gap-8 px-6 py-16">
                <div className="space-y-2">
                    <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">New Group Assignment</h1>
                    <p className="text-slate-400">
                        Fill in the details below. You can add your group members once it&apos;s created.
                    </p>
                </div>

                {/* proxy.ts requires sign-in, so a null actor only means Clerk is still loading. */}
                {!actor ? (
                    <LoadingBlock />
                ) : (
                    <ProjectForm
                        submitLabel="Create Assignment"
                        onSubmit={async ({ project_name, description, due_date }) => {
                            const project = await createProject(
                                { project_name, description: description ?? undefined, due_date },
                                actor,
                            )
                            router.push(`/project/${project.id}`)
                        }}
                    />
                )}
            </section>
        </main>
    )
}
