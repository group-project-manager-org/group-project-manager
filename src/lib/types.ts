export type ID = number; // bigint identity columns (safe as JS number at our scale)

export type TaskStatus = 'not_started' | 'in_progress' | 'review' | 'done';
export type TaskPriority = 'low' | 'medium' | 'high';
export type MemberRole = 'owner' | 'member';

export interface Member {
  project_id: ID;
  user_id: string;          // Clerk user id
  display_name: string;
  image_url: string | null;
  role: MemberRole;
  joined_at: string;        // ISO timestamp
}

export interface Project {
  id: ID;
  user_id: string;          // owner (Clerk id)
  project_name: string;
  description: string | null;
  due_date: string;         // 'YYYY-MM-DD'
  created_at: string;
}

export interface ProjectSummary extends Project {
  members: Member[];
  task_total: number;
  task_done: number;
  progress: number;         // 0–100 integer, 0 when task_total = 0
  my_role: MemberRole;
}

export interface Subtask {
  id: ID;
  task_id: ID;
  title: string;
  done: boolean;
  position: number;
}

export interface Task {
  id: ID;
  project_id: ID;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  due_date: string | null;  // 'YYYY-MM-DD'
  assignee_id: string | null;
  created_by: string;
  created_by_name: string;
  position: number;
  created_at: string;
  updated_at: string;
  subtasks: Subtask[];
  comment_count: number;
}

export interface Comment {
  id: ID;
  task_id: ID;
  user_id: string;
  user_name: string;
  content: string;
  created_at: string;
}

export type NoteColor = 'violet' | 'gold' | 'mint' | 'coral';

export interface Note {
  id: ID;
  project_id: ID;
  user_id: string;
  user_name: string;
  content: string;
  color: NoteColor;
  pinned: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProjectFile {
  id: ID;
  project_id: ID;
  user_id: string;
  user_name: string;
  file_name: string;
  storage_path: string;
  size_bytes: number;
  mime_type: string | null;
  created_at: string;
}

export interface PollOption { id: ID; poll_id: ID; option_name: string; vote_count: number; }
export interface Poll {
  id: ID;
  project_id: ID;
  question: string;
  user_id: string;
  created_at: string;
  options: PollOption[];
  my_vote_option_id: ID | null;
  total_votes: number;
}

export type NotificationType = 'task_due_soon' | 'task_overdue' | 'project_due_soon' | 'task_assigned' | 'comment_added';
export interface AppNotification {
  id: ID;
  user_id: string;
  project_id: ID | null;
  task_id: ID | null;
  type: NotificationType;
  message: string;
  read_at: string | null;
  created_at: string;
}

export interface MemberSummary {
  user_id: string;
  display_name: string;
  summary: string;
  tasks_done: number;
  tasks_open: number;
}

/** The current user's identity as passed from the client for denormalised name fields. */
export interface Actor { user_id: string; display_name: string; image_url: string | null; }
