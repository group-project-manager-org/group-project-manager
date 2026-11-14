'use client';

import { useRef, useState, type DragEvent } from 'react';
import { RiUploadCloud2Line } from 'react-icons/ri';
import { Button, cx } from '@/components/ui';

export interface DropZoneProps {
  onFiles: (files: File[]) => void;
  disabled?: boolean;
  maxLabel: string;
}

/** Drag-and-drop area plus a "Browse" button. Accepts several files at once. */
export default function DropZone({ onFiles, disabled, maxLabel }: DropZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);
  // dragenter/leave fire for children too; count them so the highlight doesn't flicker.
  const depth = useRef(0);

  function handleDrop(e: DragEvent) {
    e.preventDefault();
    depth.current = 0;
    setOver(false);
    if (disabled) return;
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) onFiles(files);
  }

  return (
    <div
      onDragEnter={(e) => {
        e.preventDefault();
        depth.current++;
        setOver(true);
      }}
      onDragOver={(e) => e.preventDefault()}
      onDragLeave={() => {
        depth.current = Math.max(0, depth.current - 1);
        if (depth.current === 0) setOver(false);
      }}
      onDrop={handleDrop}
      className={cx(
        'flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed px-6 py-10 text-center transition-colors',
        over ? 'border-nyx-violet bg-nyx-violet/10' : 'border-nyx-border bg-nyx-card-alt',
      )}
    >
      <RiUploadCloud2Line size={36} aria-hidden className={over ? 'text-nyx-violet' : 'text-nyx-muted'} />
      <p className="text-sm text-slate-300">
        {over ? 'Drop to upload' : 'Drag files here to share them with your group'}
      </p>
      <Button variant="ghost" size="sm" onClick={() => inputRef.current?.click()} disabled={disabled}>
        Browse files
      </Button>
      <p className="font-geist-mono text-[11px] text-nyx-muted">Up to {maxLabel} per file</p>
      <input
        ref={inputRef}
        type="file"
        multiple
        hidden
        onChange={(e) => {
          const files = Array.from(e.target.files ?? []);
          e.target.value = ''; // allow picking the same file again
          if (files.length > 0) onFiles(files);
        }}
      />
    </div>
  );
}
