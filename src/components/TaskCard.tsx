'use client'

import { useState } from 'react'
import { useUser } from '@clerk/nextjs'
import { useSupabase } from '../lib/supabaseClient'

type Comment = {
  id: number
  user_name: string
  user_id: string
  content: string
  created_at: string
}

type Task = {
  id: number
  title: string
  status: 'not_started' | 'in_progress' | 'review' | 'done'
  created_by: string
  created_by_name: string
  comments: Comment[]
  showComments: boolean
  showStatusMenu: boolean
}

const STATUSES = [
  { key: 'not_started', label: 'Not started', icon: '○' },
  { key: 'in_progress', label: 'Working on it', icon: '◐' },
  { key: 'review', label: 'Will review', icon: '◑' },
  { key: 'done', label: 'Done', icon: '●' },
] as const

// status → { pill text/border, pill bg } — mirrors the NYX status-btn palette
const STATUS_STYLES: Record<Task['status'], { text: string; border: string; bg: string }> = {
  not_started: { text: '#ECE7FF', border: '#5C5577', bg: 'rgba(92,85,119,0.3)' },
  in_progress: { text: '#8B6FFF', border: '#8B6FFF', bg: 'rgba(139,111,255,0.22)' },
  review: { text: '#F4D58D', border: '#F4D58D', bg: 'rgba(244,213,141,0.2)' },
  done: { text: '#6EE7B7', border: '#6EE7B7', bg: 'rgba(110,231,183,0.18)' },
}

// Deterministic avatar color from a user id — same idea as the NYX member palette
const AVATAR_PALETTE = ['#8B6FFF', '#F4D58D', '#6EE7B7', '#FF8A65', '#7FB2FF', '#E281C9']
function avatarColor(seed: string) {
  let hash = 0
  for (let i = 0; i < seed.length; i++) hash = seed.charCodeAt(i) + ((hash << 5) - hash)
  return AVATAR_PALETTE[Math.abs(hash) % AVATAR_PALETTE.length]
}
function initials(name: string) {
  return name.trim().charAt(0).toUpperCase() || '?'
}
function timeAgo(iso: string) {
  const diff = Math.max(0, Date.now() - new Date(iso).getTime())
  const mins = Math.round(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.round(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.round(hrs / 24)}d ago`
}

export default function TaskCard({
  task,
  onStatusChange,
  onAddComment,
}: {
  task: Task
  onStatusChange?: (taskId: number, status: Task['status']) => void
  onAddComment?: (taskId: number, content: string) => void
}) {
  const { user } = useUser()
  const [showComments, setShowComments] = useState(task.showComments ?? false)
  const [showStatusMenu, setShowStatusMenu] = useState(false)
  const [draft, setDraft] = useState('')

  const status = STATUS_STYLES[task.status]
  const statusMeta = STATUSES.find((s) => s.key === task.status)

  function submitComment() {
    const content = draft.trim()
    if (!content) return
    onAddComment?.(task.id, content)
    setDraft('')
  }

  return (
    <>
      {showComments && (
        <div
          className="fixed inset-0 z-30 bg-[#050309]/80 backdrop-blur-sm transition-opacity"
          onClick={() => setShowComments(false)}
        />
      )}
      <div
        className={`relative mx-auto mb-4 w-full max-w-3xl rounded-2xl border border-[#2C2650] bg-[#161229] p-4 font-[Inter,sans-serif] text-[#ECE7FF] transition-colors hover:border-[#8B6FFF]/50 ${
          showComments || showStatusMenu ? 'z-40' : 'z-0'
        }`}
      >
        {/* header */}
      <div className="flex w-full items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span
            className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full text-[13px] font-bold text-[#140d28] font-[Space_Grotesk,sans-serif]"
            style={{ backgroundColor: avatarColor(task.created_by) }}
          >
            {initials(task.created_by_name)}
          </span>
          <div className="min-w-0">
            <div className="truncate text-[14.5px] font-semibold leading-tight font-[Space_Grotesk,sans-serif]">
              {task.title}
            </div>
            <div className="mt-0.5 text-[11.5px] text-[#8A82B0]">
              {task.created_by_name}
            </div>
          </div>
        </div>

        {/* status pill / menu */}
        <div className="relative flex-shrink-0">
          <button
            onClick={() => setShowStatusMenu((v) => !v)}
            className="flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-[11px] font-medium transition-opacity hover:opacity-90"
            style={{ color: status.text, borderColor: status.border, backgroundColor: status.bg }}
          >
            <span>{statusMeta?.icon}</span>
            {statusMeta?.label}
          </button>

          {showStatusMenu && (
            <div className="absolute right-0 z-10 mt-1.5 w-44 overflow-hidden rounded-xl border border-[#2C2650] bg-[#1E1838] p-1 shadow-[0_20px_50px_rgba(0,0,0,0.55)]">
              {STATUSES.map((s) => {
                const active = s.key === task.status
                const sStyle = STATUS_STYLES[s.key]
                return (
                  <button
                    key={s.key}
                    onClick={() => {
                      onStatusChange?.(task.id, s.key)
                      setShowStatusMenu(false)
                    }}
                    className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-[11.5px] transition-colors"
                    style={{
                      color: active ? sStyle.text : '#8A82B0',
                      backgroundColor: active ? sStyle.bg : 'transparent',
                    }}
                  >
                    <span>{s.icon}</span>
                    {s.label}
                  </button>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* footer / comments toggle */}
      <div className="mt-4 flex w-full items-center justify-between border-t border-[#2C2650] pt-3">
        <button
          onClick={() => setShowComments((v) => !v)}
          className="rounded-lg bg-[#302566] px-3 py-1.5 text-[11.5px] font-medium text-[#ECE7FF] transition-colors hover:bg-[#3a2d7a]"
        >
          💬 {task.comments.length > 0 ? `${task.comments.length} comment${task.comments.length === 1 ? '' : 's'}` : 'Comments'}
        </button>
        <span className="font-[JetBrains_Mono,monospace] text-[10.5px] text-[#8A82B0]">#{task.id}</span>
      </div>

      {showComments && (
        <div className="absolute left-0 right-0 top-full z-20 mt-2 flex max-h-80 flex-col gap-2.5 overflow-y-auto rounded-2xl border border-[#2C2650] bg-[#161229] p-4 shadow-[0_20px_50px_rgba(0,0,0,0.55)]">
          {task.comments.length === 0 ? (
            <p className="text-center text-[12px] text-[#8A82B0]">No comments yet — say something.</p>
          ) : (
            task.comments.map((c) => (
              <div key={c.id} className="flex gap-2.5 rounded-xl bg-[#0B0817] p-2.5">
                <span
                  className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-[#140d28] font-[Space_Grotesk,sans-serif]"
                  style={{ backgroundColor: avatarColor(c.user_id) }}
                >
                  {initials(c.user_name)}
                </span>
                <div className="min-w-0">
                  <div className="flex items-baseline gap-2">
                    <span className="text-[11.5px] font-semibold">{c.user_name}</span>
                    <span className="font-[JetBrains_Mono,monospace] text-[10px] text-[#8A82B0]">
                      {timeAgo(c.created_at)}
                    </span>
                  </div>
                  <p className="mt-0.5 text-[12px] leading-snug text-[#ECE7FF]">{c.content}</p>
                </div>
              </div>
            ))
          )}

          <div className="mt-1 flex gap-2">
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && submitComment()}
              placeholder={user ? 'Add a comment…' : 'Sign in to comment'}
              disabled={!user}
              className="flex-1 rounded-lg border border-[#2C2650] bg-[#0B0817] px-3 py-2 text-[12px] text-[#ECE7FF] placeholder:text-[#8A82B0] focus:border-[#8B6FFF] focus:outline-none disabled:opacity-50"
            />
            <button
              onClick={submitComment}
              disabled={!draft.trim()}
              className="rounded-lg bg-[#8B6FFF] px-3 py-2 text-[11.5px] font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-40"
            >
              Send
            </button>
          </div>
        </div>
      )}
      </div>
    </>
  )
}