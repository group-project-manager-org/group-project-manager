'use client'

// Header, tabs and project loading live in ./layout.tsx (F1).
// Tasks are still hardcoded mocks until F4 switches to listTasks().
import TaskCard from '@/components/TaskCard'
import type { Task } from '@/components/TaskCard'

const task: Task = {
  id: 3,
  title: 'Competitor research deck',
  status: 'review',
  created_by: 'u2',
  created_by_name: 'Maya Chen',
  showComments: false,
  showStatusMenu: false,
  comments: [
    {
      id: 1,
      user_id: 'u3',
      user_name: 'Jordan Lee',
      content: 'Check slide 4 stats against the latest report before Friday',
      created_at: new Date(Date.now() - 3 * 3600000).toISOString(),
    },
    {
      id: 2,
      user_id: 'u1',
      user_name: 'You',
      content: 'On it — pulling the Q3 numbers now.',
      created_at: new Date(Date.now() - 1 * 3600000).toISOString(),
    },
  ],
}

export default function TasksPage() {
  return (
    <>
      <button className="text-base bg-[#302566] pl-4 pr-4 pt-2 pb-2 rounded-lg hover:bg-[#3a2d7a]">Add Task</button>

      <div className="mt-5 grid grid-cols-1 items-start gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3, 4, 5, 6].map((k) => (
          <TaskCard key={k} task={task} onStatusChange={() => {}} onAddComment={() => {}} />
        ))}
      </div>
    </>
  )
}
