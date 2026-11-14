'use client';

import { useState } from 'react';
import Button from './Button';
import ErrorBanner from './ErrorBanner';
import Modal from './Modal';

export interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  /** Use the coral danger style for the confirm button. Defaults to true. */
  danger?: boolean;
  /**
   * Runs when the user confirms. May be async: the dialog shows a spinner,
   * closes on success, and shows the error inline if it throws.
   */
  onConfirm: () => void | Promise<void>;
  onCancel: () => void;
}

/** Replacement for window.confirm(). */
export default function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Delete',
  cancelLabel = 'Cancel',
  danger = true,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<unknown>(null);

  function cancel() {
    if (busy) return;
    setError(null);
    onCancel();
  }

  async function confirm() {
    setBusy(true);
    setError(null);
    try {
      await onConfirm();
      onCancel();
    } catch (e) {
      setError(e);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={cancel}
      title={title}
      size="sm"
      dismissible={!busy}
      footer={
        <>
          <Button variant="ghost" onClick={cancel} disabled={busy}>
            {cancelLabel}
          </Button>
          <Button variant={danger ? 'danger' : 'primary'} onClick={confirm} loading={busy}>
            {confirmLabel}
          </Button>
        </>
      }
    >
      {message && <p className="text-sm text-slate-300">{message}</p>}
      <ErrorBanner error={error} className="mt-3" />
    </Modal>
  );
}
