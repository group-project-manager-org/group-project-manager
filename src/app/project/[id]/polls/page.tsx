'use client'
import { use, useEffect, useState } from 'react'
import { useUser } from "@clerk/nextjs"
import { useSupabase } from '../../../../lib/supabaseClient'

type PollOption = {
  id: number
  option_name: string
  vote_count: number
}

type Poll = {
  id: number
  question: string
  options: PollOption[]
  user_voted_option_id: number | null  // which option_id this user voted for
}

export default function PollsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const supabase = useSupabase()
  const [polls, setPolls] = useState<Poll[]>([])
  const [question, setQuestion] = useState('')
  const [options, setOptions] = useState(['', ''])
  const [showForm, setShowForm] = useState(false)
  const { user } = useUser()

  // add a guard for empty pollIds in fetchPolls
const fetchPolls = async () => {
  const { data: pollsData, error: pollsError } = await supabase
    .from('polls')
    .select('id, question')
    .eq('project_id', id)

  if (pollsError || !pollsData) { console.error(pollsError); return }
  if (pollsData.length === 0) { setPolls([]); return }  // ← guard here

  const pollIds = pollsData.map(p => p.id)

  const { data: optionsData, error: optErr } = await supabase
    .from('poll_options')
    .select('id, poll_id, option_name')
    .in('poll_id', pollIds)

  console.log('options:', optionsData, optErr)  // ← check what comes back

  const { data: votesData } = await supabase
    .from('votes')
    .select('poll_id, poll_option_id, user_id')
    .in('poll_id', pollIds)

  const assembled: Poll[] = pollsData.map(poll => {
    const pollOptions = (optionsData || []).filter(o => Number(o.poll_id) === Number(poll.id))
    const pollVotes = (votesData || []).filter(v => Number(v.poll_id) === Number(poll.id))
    const myVote = pollVotes.find(v => v.user_id === user?.id)

    return {
      id: poll.id,
      question: poll.question,
      user_voted_option_id: myVote?.poll_option_id ?? null,
      options: pollOptions.map(opt => ({
        id: opt.id,
        option_name: opt.option_name,
        vote_count: pollVotes.filter(v => Number(v.poll_option_id) === Number(opt.id)).length
      }))
    }
  })

  setPolls(assembled)
}

  useEffect(() => {
    if (user) fetchPolls()
  }, [id, user])

  const totalVotes = (poll: Poll) =>
    poll.options.reduce((a, o) => a + o.vote_count, 0)

  const handleVote = async (poll: Poll, optionId: number) => {
    if (poll.user_voted_option_id !== null || !user) return

    const { error } = await supabase.from('votes').insert({
      poll_id: poll.id,
      poll_option_id: optionId,
      user_id: user.id
    })

    if (error) { console.error(error); return }

    // optimistic update
    setPolls(prev => prev.map(p => {
      if (p.id !== poll.id) return p
      return {
        ...p,
        user_voted_option_id: optionId,
        options: p.options.map(o =>
          o.id === optionId ? { ...o, vote_count: o.vote_count + 1 } : o
        )
      }
    }))
  }

  const handleAddPoll = async () => {
    const filtered = options.filter(o => o.trim())
    if (!question.trim() || filtered.length < 2 || !user) return

    // insert poll
    const { data: pollData, error: pollError } = await supabase
      .from('polls')
      .insert({ project_id: id, question, user_id: user.id })
      .select('id')
      .single()

    if (pollError || !pollData) { console.error(pollError); return }

    // insert options
    const { error: optError } = await supabase.from('poll_options').insert(
      filtered.map(option_name => ({
        poll_id: pollData.id,
        option_name,
        user_id: user.id
      }))
    )

    if (optError) { console.error(optError); return }

    setQuestion('')
    setOptions(['', ''])
    setShowForm(false)
    await fetchPolls()
  }

  return (
    <div className="flex flex-col gap-4 bg-[#0B0817] min-h-screen">

      {polls.length === 0 && !showForm && (
        <div className="rounded-2xl border border-dashed border-[#2C2650] px-6 py-12 text-center">
          <p className="text-slate-100 font-semibold mb-1">No polls yet</p>
          <p className="text-sm text-slate-400 mb-4">Ask the group to weigh in on a decision.</p>
        </div>
      )}

      {polls.map(poll => {
        const total = totalVotes(poll) || 1
        const hasVoted = poll.user_voted_option_id !== null
        return (
          <div key={poll.id} className="rounded-2xl border border-[#2C2650] bg-[#161229] p-5">
            <p className="text-sm font-medium text-slate-100 mb-4">{poll.question}</p>
            <div className="flex flex-col gap-2">
              {poll.options.map(option => {
                const pct = Math.round((option.vote_count / total) * 100)
                const isMyVote = poll.user_voted_option_id === option.id
                return (
                  <button
                    key={option.id}
                    onClick={() => handleVote(poll, option.id)}
                    disabled={hasVoted}
                    className={`relative w-full overflow-hidden rounded-xl border px-4 py-3 text-left text-sm transition-colors
                      ${isMyVote
                        ? 'border-[#8B6FFF] text-slate-100'
                        : hasVoted
                        ? 'border-[#2C2650] text-slate-400 cursor-default'
                        : 'border-[#2C2650] text-slate-300 hover:border-[#8B6FFF] hover:text-slate-100'
                      }`}
                  >
                    {hasVoted && (
                      <span
                        className="absolute inset-y-0 left-0 bg-[#8B6FFF]/20 transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    )}
                    <span className="relative flex justify-between items-center">
                      <span className="flex items-center gap-2">
                        {isMyVote && <span className="text-[#8B6FFF]">✦</span>}
                        {option.option_name}
                      </span>
                      {hasVoted && (
                        <span className="font-geist-mono text-xs text-slate-400">
                          {pct}% · {option.vote_count}
                        </span>
                      )}
                    </span>
                  </button>
                )
              })}
            </div>
            {hasVoted && (
              <p className="mt-3 text-xs text-slate-500 font-geist-mono">
                {totalVotes(poll)} vote{totalVotes(poll) !== 1 ? 's' : ''}
              </p>
            )}
          </div>
        )
      })}

      {showForm && (
        <div className="rounded-2xl border border-[#2C2650] bg-[#161229] p-5 flex flex-col gap-4">
          <p className="text-sm font-semibold text-slate-100">New poll</p>
          <input
            type="text"
            placeholder="Ask a question..."
            value={question}
            onChange={e => setQuestion(e.target.value)}
            className="w-full rounded-xl border border-[#2C2650] bg-[#0B0817] px-4 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:border-[#8B6FFF] focus:outline-none"
          />
          <div className="flex flex-col gap-2">
            {options.map((opt, i) => (
              <input
                key={i}
                type="text"
                placeholder={`Option ${i + 1}`}
                value={opt}
                onChange={e => setOptions(prev => prev.map((o, j) => j === i ? e.target.value : o))}
                className="w-full rounded-xl border border-[#2C2650] bg-[#0B0817] px-4 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:border-[#8B6FFF] focus:outline-none"
              />
            ))}
            <button
            onClick={() => setOptions(prev => [...prev, ''])}
            className="text-xs text-slate-400 hover:text-[#8B6FFF] text-left pl-1 transition-colors"
            >
            + Add option
            </button>
          </div>
          <div className="flex gap-3 justify-end">
            <button
              onClick={() => setShowForm(false)}
              className="rounded-xl border border-[#2C2650] px-4 py-2 text-sm text-slate-400 hover:text-slate-100 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleAddPoll}
              className="rounded-xl bg-gradient-to-br from-[#8B6FFF] to-[#6a4ee0] px-4 py-2 text-sm font-semibold text-white"
            >
              Create poll
            </button>
          </div>
        </div>
      )}

      {!showForm && (
        <button
          onClick={() => setShowForm(true)}
          className="w-full rounded-2xl border border-dashed border-[#2C2650] py-3 text-sm text-slate-400 hover:border-[#8B6FFF] hover:text-[#8B6FFF] transition-colors"
        >
          + New poll
        </button>
      )}

    </div>
  )
}