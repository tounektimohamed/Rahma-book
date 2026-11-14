import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description?: string;
  children?: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm?: () => void;
  onClose: () => void;
  destructive?: boolean;
}

export function ConfirmDialog({
  open,
  title,
  description,
  children,
  confirmLabel,
  cancelLabel = 'Close',
  onConfirm,
  onClose,
  destructive = false,
}: ConfirmDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      dialog.showModal();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  if (!open) return null;

  return (
    <dialog
      ref={dialogRef}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClick={(e) => {
        if (e.target === dialogRef.current) onClose();
      }}
      className="m-auto w-[min(92vw,480px)] rounded-2xl bg-[#FFF9F2] text-[#443B3B] border border-[#EADFD7] shadow-xl p-0 backdrop:bg-[#443B3B]/40"
    >
      <div className="p-6 space-y-4">
        <div className="flex items-start justify-between gap-4">
          <h3 className="text-lg font-bold text-[#443B3B]">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            aria-label={cancelLabel}
            className="p-2 rounded-lg text-[#443B3B]/70 hover:bg-[#F8E8DC] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {description && (
          <p className="text-sm text-[#706464] leading-relaxed">{description}</p>
        )}

        {children && <div className="text-sm text-[#443B3B] leading-relaxed">{children}</div>}

        <div className="pt-2 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium rounded-xl border border-[#EADFD7] bg-white text-[#443B3B] hover:bg-[#F8E8DC]/60 transition-colors cursor-pointer"
          >
            {cancelLabel}
          </button>
          {onConfirm && confirmLabel && (
            <button
              type="button"
              onClick={onConfirm}
              className={`px-4 py-2 text-sm font-semibold rounded-xl transition-colors cursor-pointer ${
                destructive
                  ? 'bg-[#B44343] text-white hover:bg-[#993636]'
                  : 'bg-[#443B3B] text-[#FFF9F2] hover:bg-[#332B2B]'
              }`}
            >
              {confirmLabel}
            </button>
          )}
        </div>
      </div>
    </dialog>
  );
}
