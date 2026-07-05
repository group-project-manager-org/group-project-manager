type GroupAssignmentProps = {
  number: number;
  assignmentName: string;
  dueDate: string
};

export default function GroupAssignment({ number, assignmentName, dueDate }: GroupAssignmentProps) {
  // mock progress for now — swap for real data later
  const total = 5;
  const done = Math.min(number, total);
  const pct = Math.round((done / total) * 100);

  const today = new Date();
  const due = new Date(dueDate);
  due.setHours(23, 59, 0, 0); // 5:00 PM
  const diffMs = due.getTime() - today.getTime();
  console.log(today, due)

  const diffDays = Math.floor(diffMs/ (1000 * 60 * 60 * 24));


  return (
    <div className="mx-auto mb-4 flex w-full max-w-3xl items-center gap-4 rounded-2xl border border-[#2C2650] bg-[#161229] p-4 transition-colors hover:border-[#8B6FFF]/50">
      {/* progress ring */}
      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border-2 border-[#2C2650]">
        <span className="font-mono text-sm text-[#F4D58D]">{pct}%</span>
      </div>

      <div className="min-w-0 flex-1">
        <h3 className="truncate text-lg font-semibold text-slate-100">
          {assignmentName}
        </h3>
        <span className="mt-1 inline-block rounded-md bg-[#8B6FFF]/15 px-2 py-0.5 font-mono text-xs text-[#8B6FFF]">
        Due in {diffDays} days
        </span>
      </div>

      {/* member avatars */}
      <div className="flex shrink-0 -space-x-2">
        {["A", "M", "J"].map((initial, i) => (
          <span
            key={i}
            className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-[#161229] bg-[#F4D58D] text-xs font-bold text-[#1a0d28]"
          >
            {initial}
          </span>
        ))}
        <button className="flex h-7 w-7 items-center justify-center rounded-full border border-dashed border-slate-500 text-slate-400 hover:border-[#8B6FFF] hover:text-[#8B6FFF]">
          +
        </button>
      </div>

      <button className="shrink-0 text-slate-500 hover:text-[#FF8A65]">
        🗑
      </button>
    </div>
  );
}