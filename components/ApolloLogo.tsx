export default function ApolloLogo({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <svg
        viewBox="0 0 64 64"
        className="h-10 w-10 drop-shadow-[0_0_12px_rgba(0,217,255,0.7)]"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="apollo-grad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#00D9FF" />
            <stop offset="100%" stopColor="#0066FF" />
          </linearGradient>
        </defs>
        <path
          d="M32 6 L58 56 L46 56 L40 44 L24 44 L18 56 L6 56 Z M28 36 L36 36 L32 22 Z"
          fill="url(#apollo-grad)"
        />
      </svg>
      <span className="font-display text-2xl font-bold tracking-wider neon-text">
        apollo
      </span>
    </div>
  );
}
