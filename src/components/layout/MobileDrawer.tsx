"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { BrandIcon } from "@/components/ui/BrandIcon";

interface MobileDrawerProps {
  id: string;
  open: boolean;
  onClose: () => void;
  titleId: string;
  title: string;
  closeLabel: string;
  children: ReactNode;
}

/**
 * Accessible mobile navigation drawer: traps focus while open, prevents
 * background scroll, closes on Escape, and restores focus to whatever
 * triggered it on close.
 */
export function MobileDrawer({ id, open, onClose, titleId, title, closeLabel, children }: MobileDrawerProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const closeBtnRef = useRef<HTMLButtonElement>(null);
  const triggerRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (open) {
      triggerRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
      const previousOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      closeBtnRef.current?.focus();
      return () => {
        document.body.style.overflow = previousOverflow;
        triggerRef.current?.focus();
      };
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
        return;
      }
      if (e.key !== "Tab") return;
      const panel = panelRef.current;
      if (!panel) return;
      const focusable = panel.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])'
      );
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (!panel.contains(document.activeElement)) {
        e.preventDefault();
        (e.shiftKey ? last : first).focus();
        return;
      }
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 xl:hidden">
      <div className="absolute inset-0 bg-dark-nebula/50" onClick={onClose} aria-hidden="true" />
      <div
        id={id}
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="absolute inset-y-0 start-0 flex w-72 max-w-[85vw] flex-col bg-nav-bg text-nav-fg shadow-xl"
      >
        <div className="flex items-center justify-between border-b border-white/10 p-4">
          <span id={titleId} className="font-heading text-sm font-semibold">
            {title}
          </span>
          <button
            ref={closeBtnRef}
            type="button"
            onClick={onClose}
            aria-label={closeLabel}
            className="chamfer-br-sm p-2 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nebula-aqua"
          >
            <BrandIcon name="close" tone="white" size={20} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}
