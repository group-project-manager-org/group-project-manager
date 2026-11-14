'use client';

import { useState, type FormEvent } from 'react';
import { Button, ErrorBanner, cx } from '@/components/ui';
import { todayYmd } from '@/lib/utils/dates';

export interface ProjectFormValues {
  project_name: string;
  description: string;
  due_date: string;
}

export interface ProjectFormProps {
  initial?: Partial<ProjectFormValues>;
  submitLabel: string;
  /** Save the values. Throw to show the error above the button. */
  onSubmit: (values: { project_name: string; description: string | null; due_date: string }) => Promise<void>;
}

const NAME_MAX = 200;
const DESC_MAX = 1000;

type FieldErrors = Partial<Record<keyof ProjectFormValues, string>>;

const INPUT =
  'rounded-lg border bg-nyx-bg px-4 py-3 text-slate-100 placeholder:text-slate-500 outline-none transition-colors focus:border-nyx-violet';

const BAD_DATE = "That date doesn't exist. Check the day and month (e.g. there's no 31 February).";

/** Name / description / due date form used by the create and edit pages. */
export default function ProjectForm({ initial, submitLabel, onSubmit }: ProjectFormProps) {
  const [values, setValues] = useState<ProjectFormValues>({
    project_name: initial?.project_name ?? '',
    description: initial?.description ?? '',
    due_date: initial?.due_date ?? '',
  });
  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitError, setSubmitError] = useState<unknown>(null);
  const [saving, setSaving] = useState(false);
  // The browser reports an impossible date (e.g. 31/02) as an empty value plus validity.badInput.
  const [dueBadInput, setDueBadInput] = useState(false);

  // When editing, an existing past due date may be kept as-is; a new date must be today or later.
  const originalDue = initial?.due_date ?? '';

  function set<K extends keyof ProjectFormValues>(key: K, value: string) {
    setValues((v) => ({ ...v, [key]: value }));
    setErrors((e) => ({ ...e, [key]: undefined }));
  }

  function validate(): FieldErrors {
    const e: FieldErrors = {};
    const name = values.project_name.trim();
    if (!name) e.project_name = 'Give the assignment a name.';
    else if (name.length > NAME_MAX) e.project_name = `Keep the name under ${NAME_MAX} characters.`;
    if (values.description.trim().length > DESC_MAX) e.description = `Keep the description under ${DESC_MAX} characters.`;
    if (dueBadInput) e.due_date = BAD_DATE;
    else if (!values.due_date) e.due_date = 'Pick a due date.';
    else if (values.due_date < todayYmd() && values.due_date !== originalDue) e.due_date = "The due date can't be in the past.";
    return e;
  }

  async function handleSubmit(ev: FormEvent) {
    ev.preventDefault();
    const e = validate();
    setErrors(e);
    if (Object.values(e).some(Boolean)) return;

    setSaving(true);
    setSubmitError(null);
    try {
      await onSubmit({
        project_name: values.project_name.trim(),
        description: values.description.trim() || null,
        due_date: values.due_date,
      });
    } catch (err) {
      setSubmitError(err);
      setSaving(false);
    }
    // On success the page navigates away, so `saving` stays true to block double submits.
  }

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="flex flex-col gap-6 rounded-2xl border border-nyx-border bg-nyx-card-alt p-6 shadow-lg shadow-black/20 sm:p-8"
    >
      <Field id="project-name" label="Assignment name" error={errors.project_name} hint={`${values.project_name.trim().length}/${NAME_MAX}`}>
        <input
          id="project-name"
          type="text"
          placeholder="eg: Cybersecurity Assignment 1"
          maxLength={NAME_MAX + 50}
          value={values.project_name}
          onChange={(e) => set('project_name', e.target.value)}
          aria-invalid={!!errors.project_name}
          aria-describedby={errors.project_name ? 'project-name-error' : undefined}
          className={cx(INPUT, errors.project_name ? 'border-nyx-coral' : 'border-nyx-border')}
        />
      </Field>

      <Field id="project-description" label="Description" optional error={errors.description}>
        <textarea
          id="project-description"
          rows={3}
          placeholder="What's the assignment about? Links to the brief, marking rubric…"
          value={values.description}
          onChange={(e) => set('description', e.target.value)}
          aria-invalid={!!errors.description}
          aria-describedby={errors.description ? 'project-description-error' : undefined}
          className={cx(INPUT, 'resize-y', errors.description ? 'border-nyx-coral' : 'border-nyx-border')}
        />
      </Field>

      <Field id="project-due" label="Due date" error={errors.due_date}>
        <input
          id="project-due"
          type="date"
          min={originalDue && originalDue < todayYmd() ? originalDue : todayYmd()}
          value={values.due_date}
          onChange={(e) => {
            set('due_date', e.target.value);
            setDueBadInput(e.target.validity.badInput);
          }}
          onBlur={(e) => e.target.validity.badInput && setErrors((er) => ({ ...er, due_date: BAD_DATE }))}
          aria-invalid={!!errors.due_date}
          aria-describedby={errors.due_date ? 'project-due-error' : undefined}
          className={cx(INPUT, '[color-scheme:dark]', errors.due_date ? 'border-nyx-coral' : 'border-nyx-border')}
        />
      </Field>

      <ErrorBanner error={submitError} />

      <Button type="submit" size="lg" loading={saving} className="mt-2 w-full">
        {submitLabel}
      </Button>
    </form>
  );
}

function Field({
  id,
  label,
  optional,
  hint,
  error,
  children,
}: {
  id: string;
  label: string;
  optional?: boolean;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-baseline justify-between">
        <label htmlFor={id} className="text-sm font-medium text-slate-300">
          {label}
          {optional && <span className="ml-1.5 font-normal text-slate-500">(optional)</span>}
        </label>
        {hint && <span className="font-geist-mono text-[11px] text-slate-500">{hint}</span>}
      </div>
      {children}
      {error && (
        <p id={`${id}-error`} className="text-xs text-nyx-coral">
          {error}
        </p>
      )}
    </div>
  );
}
