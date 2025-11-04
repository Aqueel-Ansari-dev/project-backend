'use client';

import { type ReactNode } from 'react';
import { X } from 'lucide-react';
import { Button } from './button';
import { cn } from './cn';

interface ModalProps {
  open: boolean;
  title: string;
  description?: string;
  onClose: () => void;
  children: ReactNode;
}

export function Modal({ open, title, description, onClose, children }: ModalProps) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 px-4 py-6 backdrop-blur">
      <div className="relative w-full max-w-lg rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-xl">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-700 text-slate-300 hover:bg-slate-800"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>
        <div className="pr-10">
          <h2 className="text-lg font-semibold text-white">{title}</h2>
          {description && <p className="mt-1 text-sm text-slate-400">{description}</p>}
        </div>
        <div className="mt-5 space-y-4">{children}</div>
        <div className="mt-6 flex justify-end">
          <Button variant="ghost" onClick={onClose} className={cn('px-4')}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}
