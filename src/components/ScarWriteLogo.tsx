interface Props {
  className?: string;
}

/** Golden fountain pen nib set inside a royal blue precision ledger grid. */
export function ScarWriteLogo({ className }: Props) {
  return (
    <svg
      viewBox="0 0 64 64"
      role="img"
      aria-label="ScarWrite Rapport"
      className={className}
    >
      <defs>
        <linearGradient id="sw-gold" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#F3DE8A" />
          <stop offset="45%" stopColor="#D4AF37" />
          <stop offset="100%" stopColor="#A8862A" />
        </linearGradient>
      </defs>

      <rect
        x="3"
        y="3"
        width="58"
        height="58"
        rx="12"
        fill="#0F2C59"
        stroke="url(#sw-gold)"
        strokeWidth="2.5"
      />

      {/* ledger grid */}
      <g stroke="#D4AF37" strokeOpacity="0.35" strokeWidth="1">
        <path d="M3 22h58M3 36h58M3 50h58" />
        <path d="M20 3v58M40 3v58" />
      </g>

      {/* nib */}
      <path
        d="M32 10 L45 34 C45 44 39 52 32 56 C25 52 19 44 19 34 Z"
        fill="url(#sw-gold)"
      />
      <path d="M32 22 L32 48" stroke="#0F2C59" strokeWidth="2.4" strokeLinecap="round" />
      <circle cx="32" cy="34" r="4.6" fill="#0F2C59" />
      <circle cx="32" cy="34" r="1.8" fill="url(#sw-gold)" />
    </svg>
  );
}
