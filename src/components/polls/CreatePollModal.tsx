'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { RiCloseLine } from 'react-icons/ri';
import { Button, ErrorBanner, FIELD_CLASS, Modal } from '@/components/ui';
import type { Poll } from '@/lib/types';

const MIN_OPTIONS = 2;
const MAX_OPTIONS = 6;

export interface CreatePollModalProps {
  open: boolean;
  onClose: () => void;
  onCreate: (question: string, options: string[]) => Promise<Poll>;
  onCreated: (poll: Poll) => void;
}

export default function CreatePollModal({ open, onClose, onCreate, onCreated }: CreatePollModalProps) {
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState<string[]>(['', '']);
  const [error, setError] = useState<unknown>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setQuestion('');
      setOptions(['', '']);
      setError(null);
      setSaving(false);
    }
  }, [open]);

  async function submit(e: FormEvent) {
    e.preventDefault();
    const q = question.trim();
    const opts = options.map((o) => o.trim()).filter(Boolean);
    if (!q) return setError('Write a question.');
    if (opts.length < MIN_OPTIONS) return setError(`Add at least ${MIN_OPTIONS} options.`);
    if (new Set(opts.map((o) => o.toLowerCase())).size !== opts.length) return setError('Each option must be different.');

    setSaving(true);
    setError(null);
    try {
      onCreated(await onCreate(q, opts));
      onClose();
    } catch (err) {
      setError(err);
      setSaving(false);
    }
  }

  const formId = 'create-poll-form';

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="New poll"
      dismissible={!saving}
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" form={formId} loading={saving}>
            Create poll
          </Button>
        </>
      }
    >
      <form id={formId} onSubmit={submit} noValidate className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="poll-question" className="text-sm font-medium text-slate-300">
            Question
          </label>
          <input
            id="poll-question"
            value={question}
            maxLength={300}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Ask the group…"
            className={FIELD_CLASS}
          />
        </div>

        <fieldset className="flex flex-col gap-2">
          <legend className="mb-1.5 text-sm font-medium text-slate-300">
            Options <span className="font-normal text-slate-500">({MIN_OPTIONS}–{MAX_OPTIONS})</span>
          </legend>
          {options.map((opt, i) => (
            <div key={i} className="flex gap-2">
              <input
                value={opt}
                maxLength={120}
                onChange={(e) => setOptions((prev) => prev.map((o, j) => (j === i ? e.target.value : o)))}
                placeholder={`Option ${i + 1}`}
                aria-label={`Option ${i + 1}`}
                className={FIELD_CLASS}
              />
              {options.length > MIN_OPTIONS && (
                <button
                  type="button"
                  onClick={() => setOptions((prev) => prev.filter((_, j) => j !== i))}
                  aria-label={`Remove option ${i + 1}`}
                  className="rounded-lg px-2 text-slate-400 hover:text-nyx-coral focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nyx-violet"
                >
                  <RiCloseLine aria-hidden />
                </button>
              )}
            </div>
          ))}
          {options.length < MAX_OPTIONS && (
            <button
              type="button"
              onClick={() => setOptions((prev) => [...prev, ''])}
              className="self-start rounded font-geist-mono text-xs text-slate-400 transition-colors hover:text-nyx-violet focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nyx-violet"
            >
              + Add option
            </button>
          )}
        </fieldset>

        <ErrorBanner error={error} />
      </form>
    </Modal>
  );
}
