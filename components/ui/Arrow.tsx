/** Arrow that points the reading direction, flipping itself in Arabic. */
export function Arrow({ className }: { className?: string }) {
  return (
    <span aria-hidden className={`flip-rtl inline-block ${className ?? ""}`}>
      <svg viewBox="0 0 24 24" fill="none" className="size-[1em]">
        <path d="M4 12h15M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </span>
  );
}

/** Arrow for links leaving the site. */
export function ArrowOut({ className }: { className?: string }) {
  return (
    <span aria-hidden className={`flip-rtl inline-block ${className ?? ""}`}>
      <svg viewBox="0 0 24 24" fill="none" className="size-[1em]">
        <path d="M7 17 17 7M8 7h9v9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </span>
  );
}

export function PlayGlyph({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className={`size-[1em] ${className ?? ""}`}>
      <path d="M8 5.5v13l11-6.5-11-6.5Z" fill="currentColor" />
    </svg>
  );
}
