'use client'

import { useState } from 'react'
import { useSupabase } from '../../lib/supabaseClient'
import { useUser  } from "@clerk/nextjs";
import Link from 'next/link'
import UserNav from "../../components/UseNav";

export default function AddGrpAssignment() {
    const [name, setName] = useState('')
    const [dueDate, setDueDate] = useState('')
    const [members, setMembers] = useState('')
    const supabase = useSupabase()

    const { user } = useUser();
    if(!user) {
        alert("You must login first!!!!")
        return
    }

    function getDateString() {
        const date = new Date()
        return date.toISOString().split("T")[0];
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        const { error } = await supabase
        .from('projects')
        .insert({ user_id: user.id, project_name: name, due_date: dueDate});
        console.log(error);
    }

    

    return (
        <main className="min-h-screen bg-[#0B0817] text-slate-100">
        <nav className="flex items-center justify-between border-b border-[#2C2650] px-6 py-4">
            <div>
            <p className="text-lg font-semibold tracking-tight">Group Project Manager</p>
            <p className="text-sm text-slate-400">
                Keep your team aligned and moving forward.
            </p>
            </div>

            <UserNav />
        </nav>

        <section className="mx-auto flex max-w-2xl flex-col gap-8 px-6 py-16">
            <div className="space-y-2">
            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                New Group Assignment
            </h1>
            <p className="text-slate-400">
                Fill in the details below to create a new assignment for your group.
            </p>
            </div>

            <form
            onSubmit={handleSubmit}
            className="flex flex-col gap-6 rounded-2xl border border-[#2C2650] bg-[#13102A] p-8 shadow-lg shadow-black/20"
            >
            <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-slate-300">
                Assignment Name
                </label>
                <input
                type="text"
                placeholder="eg: Cybersecurity Assignment 1"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="rounded-lg border border-[#2C2650] bg-[#0B0817] px-4 py-3 text-slate-100 placeholder:text-slate-500 outline-none transition-colors focus:border-[#8B6FFF]"
                />
            </div>

            <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-slate-300">
                Assignment Due On
                </label>
                <input
                type="date"
                min = {getDateString()}
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="rounded-lg border border-[#2C2650] bg-[#0B0817] px-4 py-3 text-slate-100 outline-none transition-colors focus:border-[#8B6FFF] [color-scheme:dark]"
                />
            </div>

            <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-slate-300">
                Add Group Members
                </label>
                <input
                type="text"
                placeholder="eg: alice@example.com, bob@example.com"
                value={members}
                onChange={(e) => setMembers(e.target.value)}
                className="rounded-lg border border-[#2C2650] bg-[#0B0817] px-4 py-3 text-slate-100 placeholder:text-slate-500 outline-none transition-colors focus:border-[#8B6FFF]"
                />
            </div>

            <button
                type = "submit"
                className="mt-2 flex h-14 w-full items-center justify-center rounded-xl bg-gradient-to-br from-[#8B6FFF] to-[#6a4ee0] text-lg font-semibold font-geist-mono text-white shadow-lg shadow-[#8B6FFF]/30 transition-transform hover:scale-[1.02]"
            >
                Create Assignment
            </button>
            </form>
        </section>
        </main>
    )
}