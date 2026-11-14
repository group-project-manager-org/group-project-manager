/** Mocks for src/lib/db/notes.ts (NEXT_PUBLIC_USE_MOCKS=1). */
import type { Actor, ID, Member, Note, NoteColor } from '@/lib/types';
import { delay, me } from './mocks';

const notesByProject = new Map<ID, Note[]>();
let nextId = 700_000;
const iso = (hoursAgo: number) => new Date(Date.now() - hoursAgo * 3_600_000).toISOString();

function seed(projectId: ID, members: Member[], actor: Actor | null): Note[] {
  const who = (i: number) => members[i % Math.max(1, members.length)] ?? { ...me(actor) };
  const mk = (i: number, content: string, color: NoteColor, pinned: boolean, hoursAgo: number): Note => ({
    id: ++nextId,
    project_id: projectId,
    user_id: who(i).user_id,
    user_name: who(i).display_name,
    content,
    color,
    pinned,
    created_at: iso(hoursAgo),
    updated_at: iso(hoursAgo),
  });
  return [
    mk(0, 'Marking rubric: 40% analysis, 30% research, 20% structure, 10% referencing.', 'gold', true, 48),
    mk(1, 'Idea: open the presentation with a short real-world case to hook the audience.', 'violet', false, 5),
    mk(2, "Library has a free workshop on APA referencing Thursday 2pm. Worth it?", 'mint', false, 26),
    mk(3, 'Reminder: the submission portal closes at 11:59pm, not midnight!', 'coral', false, 70),
  ];
}

function notes(projectId: ID, members: Member[], actor: Actor | null): Note[] {
  let list = notesByProject.get(projectId);
  if (!list) {
    list = seed(projectId, members, actor);
    notesByProject.set(projectId, list);
  }
  return list;
}

function findNote(noteId: ID): Note {
  for (const list of notesByProject.values()) {
    const n = list.find((x) => x.id === noteId);
    if (n) return n;
  }
  throw new Error('Note not found.');
}

export async function mockListNotes(projectId: ID, members: Member[], actor: Actor | null): Promise<Note[]> {
  await delay();
  return notes(projectId, members, actor).map((n) => ({ ...n }));
}

export async function mockCreateNote(
  projectId: ID,
  input: { content: string; color?: NoteColor },
  actor: Actor,
  members: Member[],
): Promise<Note> {
  await delay(250);
  const now = new Date().toISOString();
  const n: Note = {
    id: ++nextId,
    project_id: projectId,
    user_id: actor.user_id,
    user_name: actor.display_name,
    content: input.content,
    color: input.color ?? 'violet',
    pinned: false,
    created_at: now,
    updated_at: now,
  };
  notes(projectId, members, actor).push(n);
  return { ...n };
}

export async function mockUpdateNote(
  noteId: ID,
  patch: Partial<Pick<Note, 'content' | 'color' | 'pinned'>>,
  actor: Actor | null,
): Promise<Note> {
  await delay(200);
  const n = findNote(noteId);
  const editsContent = patch.content !== undefined || patch.color !== undefined;
  if (editsContent && n.user_id !== me(actor).user_id) throw new Error('Only the author can edit this note.');
  Object.assign(n, patch, { updated_at: new Date().toISOString() });
  return { ...n };
}

export async function mockDeleteNote(noteId: ID): Promise<void> {
  await delay(200);
  for (const [pid, list] of notesByProject) notesByProject.set(pid, list.filter((n) => n.id !== noteId));
}
