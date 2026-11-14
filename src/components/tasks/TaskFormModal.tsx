'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { Button, ErrorBanner, FIELD_CLASS, Modal, PRIORITIES, cx } from '@/components/ui';
import { useActor } from '@/hooks/useActor';
import { useTaskApi } from '@/hooks/useTaskApi';
import type { Member, Task, TaskPriority } from '@/lib/types';

export interface TaskFormModalProps {
  open: boolean;
  onClose: () => void;
  /** Task to edit; omit to create a new one. */
  task?: Task | null;
  members: Member[];
  onSaved: (task: Task) => void;
}

interface Values {
  title: string;
  description: string;
  priority: TaskPriority;
  due_date: string;
  assignee_id: string;
}

function initialValues(task?: Task | null): Values {
  return {
    title: task?.title ?? '',
    description: task?.description ?? '',
    priority: task?.priority ?? 'medium',
    due_date: task?.due_date ?? '',
    assignee_id: task?.assignee_id ?? '',
  };
}

const BAD_DATE = "That date doesn't exist. Check the day and month.";

export default function TaskFormModal({ open, onClose, task, members, onSaved }: TaskFormModalProps) {
  const api = useTaskApi();
  const actor = useActor();
  const [values, setValues] = useState<Values>(() => initialValues(task));
  const [titleError, setTitleError] = useState<string | null>(null);
  // The browser reports an impossible date (e.g. 31/02) as an empty value plus validity.badInput.
  const [dueBadInput, setDueBadInput] = useState(false);
  const [dueError, setDueError] = useState<string | null>(null);
  const [error, setError] = useState<unknown>(null);
  const [saving, setSaving] = useState(false);
  const editing = !!task;

  // Reset the form each time it opens.
  useEffect(() => {
    if (open) {
      setValues(initialValues(task));
      setTitleError(null);
      setDueBadInput(false);
      setDueError(null);
      setError(null);
      setSaving(false);
    }
  }, [open, task]);

  function set<K extends keyof Values>(key: K, value: Values[K]) {
    setValues((v) => ({ ...v, [key]: value }));
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    const title = values.title.trim();
    if (!title) return setTitleError('Give the task a title.');
    if (title.length > 200) return setTitleError('Keep the title under 200 characters.');
    if (dueBadInput) return setDueError(BAD_DATE); // otherwise it would silently save as "no due date"
    if (!actor) return;

    const fields = {
      title,
      description: values.description.trim() || null,
      priority: values.priority,
      due_date: values.due_date || null,
      assignee_id: values.assignee_id || null,
    };

    setSaving(true);
    setError(null);
    try {
      const saved = editing
        ? await api.updateTask(task.id, fields)
        : await api.createTask({ ...fields, description: fields.description ?? undefined }, actor);
      onSaved(saved);
      onClose();
    } catch (err) {
      setError(err);
      setSaving(false);
    }
  }

  const formId = 'task-form';

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editing ? 'Edit task' : 'New task'}
      dismissible={!saving}
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" form={formId} loading={saving}>
            {editing ? 'Save changes' : 'Create task'}
          </Button>
        </>
      }
    >
      <form id={formId} onSubmit={submit} noValidate className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="task-title" className="text-sm font-medium text-slate-300">
            Title
          </label>
          <input
            id="task-title"
            value={values.title}
            onChange={(e) => {
              set('title', e.target.value);
              setTitleError(null);
            }}
            placeholder="eg: Write the methodology section"
            aria-invalid={!!titleError}
            className={cx(FIELD_CLASS, titleError && 'border-nyx-coral')}
          />
          {titleError && <p className="text-xs text-nyx-coral">{titleError}</p>}
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="task-description" className="text-sm font-medium text-slate-300">
            Description <span className="font-normal text-slate-500">(optional)</span>
          </label>
          <textarea
            id="task-description"
            rows={3}
            value={values.description}
            onChange={(e) => set('description', e.target.value)}
            className={cx(FIELD_CLASS, 'resize-y')}
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="task-priority" className="text-sm font-medium text-slate-300">
              Priority
            </label>
            <select
              id="task-priority"
              value={values.priority}
              onChange={(e) => set('priority', e.target.value as TaskPriority)}
              className={FIELD_CLASS}
            >
              {PRIORITIES.map((p) => (
                <option key={p.key} value={p.key}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="task-due" className="text-sm font-medium text-slate-300">
              Due date
            </label>
            <input
              id="task-due"
              type="date"
              value={values.due_date}
              onChange={(e) => {
                set('due_date', e.target.value);
                setDueBadInput(e.target.validity.badInput);
                setDueError(null);
              }}
              onBlur={(e) => e.target.validity.badInput && setDueError(BAD_DATE)}
              aria-invalid={!!dueError}
              className={cx(FIELD_CLASS, dueError && 'border-nyx-coral')}
            />
            {dueError && <p className="text-xs text-nyx-coral">{dueError}</p>}
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="task-assignee" className="text-sm font-medium text-slate-300">
              Assignee
            </label>
            <select
              id="task-assignee"
              value={values.assignee_id}
              onChange={(e) => set('assignee_id', e.target.value)}
              className={FIELD_CLASS}
            >
              <option value="">Unassigned</option>
              {members.map((m) => (
                <option key={m.user_id} value={m.user_id}>
                  {m.display_name}
                  {m.user_id === actor?.user_id ? ' (you)' : ''}
                </option>
              ))}
            </select>
          </div>
        </div>

        <ErrorBanner error={error} />
      </form>
    </Modal>
  );
}
