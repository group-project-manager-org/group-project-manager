import { RiDeleteBinLine } from "react-icons/ri";
import { FaPencil } from "react-icons/fa6";
import Link from 'next/link'

type GroupAssignmentProps = {
  id: string;
  assignmentName: string;
  dueDate: string
  handleDelete: (id: string) => void
};

export default function GroupAssignment({ id, assignmentName, dueDate, handleDelete }: GroupAssignmentProps) {
  const today = new Date();
  const due = new Date(dueDate);
  due.setHours(23, 59, 0, 0);
  const diffMs = due.getTime() - today.getTime();

  const diffDays = Math.floor(diffMs/ (1000 * 60 * 60 * 24));

  return (
    <div className="mx-auto mb-4 flex w-full max-w-3xl items-center gap-4 rounded-2xl border border-[#2C2650] bg-[#161229] p-4 transition-colors hover:border-[#8B6FFF]/50">
      {/* progress ring */}
      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border-2 border-[#2C2650]">
        <span className="font-mono text-sm text-[#F4D58D]">10%</span>
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
      <Link href = {`/edit-group-assignment/${id}`} className="shrink-0 text-slate-500 hover:text-[#6a4ee0]">
        <FaPencil size="1.5rem"/>
      </Link> 
      <button onClick = {() => {handleDelete(id)}} className="shrink-0 text-slate-500 hover:text-[#FF8A65]">
        <RiDeleteBinLine size="1.5rem"/>
      </button>
    </div>
  );
}