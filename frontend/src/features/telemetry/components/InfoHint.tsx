"use client";

interface InfoHintProps {
  label: string;
  children: string;
}

/** An accessible, hover/focus explanation for dashboard concepts. */
export function InfoHint({ label, children }: InfoHintProps) {
  return (
    <span className="relative inline-flex group align-middle">
      <button
        type="button"
        className="ml-1 inline-flex h-4 w-4 items-center justify-center rounded-full border border-[var(--text-dim)] text-[10px] text-[var(--text-muted)] hover:border-[#00ffcc] hover:text-[#00ffcc] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#00ffcc]"
        aria-label={label}
      >
        ?
      </button>
      <span
        role="tooltip"
        className="pointer-events-none absolute left-0 top-6 z-20 hidden w-64 rounded border border-[var(--border)] bg-[var(--surface-elevated)] p-2 font-sans text-xs normal-case leading-relaxed text-[var(--foreground)] shadow-xl group-hover:block group-focus-within:block"
      >
        {children}
      </span>
    </span>
  );
}
