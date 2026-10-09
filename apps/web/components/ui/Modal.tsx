"use client";

import { useEffect, type FormEvent, type ReactNode } from "react";
import { cn } from "@/lib/utils/cn";
import { Button } from "./Button";

const sizes = { sm: "max-w-md", md: "max-w-lg", lg: "max-w-2xl", xl: "max-w-4xl" };

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  size?: keyof typeof sizes;
  children: ReactNode;
  footer?: ReactNode;
  // When provided the body is a <form>; the footer's submit button submits it.
  onSubmit?: (e: FormEvent) => void;
}

export function Modal({ open, onClose, title, description, size = "md", children, footer, onSubmit }: ModalProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;

  const Body = onSubmit ? "form" : "div";

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/50 p-0 sm:p-4" onMouseDown={onClose}>
      <Body
        onSubmit={
          onSubmit
            ? (e: FormEvent) => {
                e.preventDefault();
                onSubmit(e);
              }
            : undefined
        }
        onMouseDown={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={cn(
          "flex max-h-[92vh] w-full flex-col rounded-t-2xl sm:rounded-xl bg-white shadow-xl",
          sizes[size],
        )}
      >
        <div className="flex items-start justify-between gap-4 border-b border-gray-100 px-5 py-4">
          <div>
            <h3 className="text-lg font-bold text-gray-900">{title}</h3>
            {description && <p className="mt-0.5 text-xs text-gray-500">{description}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 cursor-pointer"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>
        {footer && <div className="flex justify-end gap-2 border-t border-gray-100 px-5 py-3">{footer}</div>}
      </Body>
    </div>
  );
}

interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: ReactNode;
  confirmLabel?: string;
  tone?: "danger" | "primary";
  loading?: boolean;
}

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = "Confirm",
  tone = "danger",
  loading,
}: ConfirmDialogProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      size="sm"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button variant={tone} onClick={onConfirm} loading={loading}>
            {confirmLabel}
          </Button>
        </>
      }
    >
      <div className="text-sm text-gray-600">{message}</div>
    </Modal>
  );
}
