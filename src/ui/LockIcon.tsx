export function LockIcon({ size = 10 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 12 12" aria-hidden="true">
      <rect x="2" y="5.2" width="8" height="5.8" rx="1.2" fill="currentColor" />
      <path d="M3.9 5.4V3.9a2.1 2.1 0 0 1 4.2 0v1.5" fill="none" stroke="currentColor" strokeWidth="1.3" />
    </svg>
  );
}
