interface TalentIAMarkProps {
  className?: string;
}

export function TalentIAMark({ className = '' }: TalentIAMarkProps) {
  return (
    <span className={`talentia-mark ${className}`} role="img" aria-label="TalentIA">
      <svg viewBox="0 0 64 64" aria-hidden="true">
        <circle cx="26" cy="22" r="9" fill="currentColor" />
        <path d="M9 53c0-10 7.6-17 17-17s17 7 17 17c0 2-1.5 3-3.5 3h-27C10.5 56 9 55 9 53Z" fill="currentColor" />
        <path d="M49 7c.8 5.4 2.6 7.2 8 8-5.4.8-7.2 2.6-8 8-.8-5.4-2.6-7.2-8-8 5.4-.8 7.2-2.6 8-8Z" fill="currentColor" />
        <path d="M47 28c.35 2.3 1.1 3.05 3.4 3.4-2.3.35-3.05 1.1-3.4 3.4-.35-2.3-1.1-3.05-3.4-3.4 2.3-.35 3.05-1.1 3.4-3.4Z" fill="currentColor" opacity=".78" />
      </svg>
    </span>
  );
}
