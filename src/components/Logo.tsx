type LogoProps = {
  className?: string;
  size?: number;
  showWordmark?: boolean;
};

/** Minimal woven queue-line mark — three interwoven arcs */
export function WerfaMark({ size = 32, className = '' }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden
    >
      <rect width="48" height="48" rx="12" fill="#172B2B" />
      <path
        d="M12 30c6-10 18-10 24 0"
        stroke="#DCA84E"
        strokeWidth="2.5"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M12 24c8-12 16-12 24 0"
        stroke="#397C69"
        strokeWidth="2.5"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M12 18c10-8 14-8 24 0"
        stroke="#DCA84E"
        strokeWidth="2.5"
        strokeLinecap="round"
        fill="none"
        opacity="0.85"
      />
      <path
        d="M24 12v24"
        stroke="#397C69"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeDasharray="2 3"
        opacity="0.45"
      />
    </svg>
  );
}

export function Logo({ className = '', size = 32, showWordmark = true }: LogoProps) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <WerfaMark size={size} />
      {showWordmark && (
        <span className="flex flex-col leading-none">
          <span className="text-lg font-bold tracking-tight" style={{ color: 'var(--text)' }}>
            werfa
          </span>
          <span className="text-[10px] font-medium font-ethiopic" style={{ color: 'var(--text-muted)' }}>
            ወረፋ
          </span>
        </span>
      )}
    </span>
  );
}

export default Logo;
