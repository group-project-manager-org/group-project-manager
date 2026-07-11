'use client'
import { useEffect, useState } from 'react'
import { use } from "react";
import { useSupabase } from '../../../lib/supabaseClient'
import Link from 'next/link';

export default function Tasks({ params }: { params: Promise<{ id: string }> }) {
  const [name, setName] = useState('')
  const supabase = useSupabase()
  const [dueDate, setDueDate] = useState('')
  const { id } = use(params);

  const today = new Date();
  const due = new Date(dueDate);
  due.setHours(23, 59, 0, 0);
  const diffMs = due.getTime() - today.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  const isUrgent = diffDays <= 2;

  useEffect(() => {
    const fetchProjects = async () => {
      const { data, error } = await supabase.from('projects').select().eq('id', id).single();
      if (error) console.error(error);
      setName(data.project_name)
      setDueDate(data.due_date)
    }
    fetchProjects()
  }, [])

  const navLinks = [
    { href: `/project/${id}/`, label: 'Tasks'},
    { href: `/project/${id}/notes`, label: 'Notes'},
    { href: `/project/${id}/polls`, label: 'Polls'},
    { href: `/project/${id}/files`, label: 'Files'},
  ]

  return (
    <main className="min-h-screen bg-[#0B0817] text-slate-100">

      {/* Header */}
      <div className="border-b border-[#2C2650] px-6 py-6">
        <p className="text-sm font-geist-mono text-[#8B6FFF] mb-1">Project</p>
        <h1 className="text-3xl font-semibold tracking-tight">{name || '...'}</h1>
        <span
          className={`mt-2 inline-block rounded-md px-3 py-1 font-geist-mono text-xs ${
            isUrgent
              ? 'bg-[#FF8A65]/15 text-[#FF8A65]'
              : 'bg-[#8B6FFF]/15 text-[#8B6FFF]'
          }`}
        >
          {diffDays < 0
            ? 'Overdue'
            : diffDays === 0
            ? 'Due today'
            : diffDays === 1
            ? 'Due tomorrow'
            : `Due in ${diffDays} days`}
        </span>
      </div>

      {/* Nav tabs */}
      <nav className="flex gap-2 border-b border-[#2C2650] px-6 py-3 overflow-x-auto">
        {navLinks.map(({ href, label }) => (
          <Link
            key={label}
            href={href}
            className="flex items-center gap-2 rounded-xl border border-[#2C2650] bg-[#161229] px-5 py-2.5 font-geist-mono text-sm text-slate-400 transition-colors hover:border-[#8B6FFF] hover:text-[#8B6FFF] whitespace-nowrap"
          >
            {label}
          </Link>
        ))}
      </nav>

    </main>
  )
}