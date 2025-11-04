export function Spinner({ className, label = 'Loading…' }: { className?: string; label?: string }) {
  return (
    <span role="status" aria-live="polite" className="inline-flex items-center justify-center">
      <svg
        className={className ?? 'h-5 w-5 animate-spin text-brand'}
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
      </svg>
      {label ? <span className="sr-only">{label}</span> : null}
    </span>
  );
}
