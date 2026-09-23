import React from 'react';

interface TigerLogoProps {
  size?: number;
  className?: string;
  withGlow?: boolean;
}

/**
 * TigerLogo — Símbolo del Año del Tigre (虎)
 * Esculpido en arcilla 3D táctil con rayas estilizadas y tonos peach y ochre (GEMINI.md).
 */
export const TigerLogo: React.FC<TigerLogoProps> = ({
  size = 36,
  className = '',
  withGlow = true,
}) => {
  return (
    <div
      className={`tiger-logo-container ${className}`}
      style={{
        width: size,
        height: size,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        filter: withGlow ? 'drop-shadow(0 4px 10px rgba(255, 107, 90, 0.4))' : undefined,
        flexShrink: 0,
        userSelect: 'none',
        transition: 'transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)',
      }}
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ overflow: 'visible' }}
      >
        <defs>
          {/* Tiger Face Gradient */}
          <radialGradient id="tigerFaceGrad" cx="50" cy="52" r="32" gradientUnits="userSpaceOnUse">
            <stop stopColor="#ffb084" />
            <stop offset="0.45" stopColor="#ff855a" />
            <stop offset="0.8" stopColor="#ff6b5a" />
            <stop offset="1" stopColor="#d94b38" />
          </radialGradient>

          {/* Snout Gradient */}
          <linearGradient id="tigerSnoutGrad" x1="50" y1="58" x2="50" y2="78" gradientUnits="userSpaceOnUse">
            <stop stopColor="#fffaf0" />
            <stop offset="0.75" stopColor="#f5f0e0" />
            <stop offset="1" stopColor="#ebe6d6" />
          </linearGradient>
        </defs>

        {/* 1. Round Clay Ears */}
        <circle cx="28" cy="28" r="14" fill="#ff6b5a" filter="drop-shadow(0 3px 4px rgba(10,26,26,0.18))" />
        <circle cx="28" cy="28" r="8" fill="#fffaf0" />
        <circle cx="28" cy="28" r="5" fill="#ffb084" />

        <circle cx="72" cy="28" r="14" fill="#ff6b5a" filter="drop-shadow(0 3px 4px rgba(10,26,26,0.18))" />
        <circle cx="72" cy="28" r="8" fill="#fffaf0" />
        <circle cx="72" cy="28" r="5" fill="#ffb084" />

        {/* 2. Tiger Head Base */}
        <circle
          cx="50"
          cy="54"
          r="30"
          fill="url(#tigerFaceGrad)"
          filter="drop-shadow(0 4px 6px rgba(10,26,26,0.22))"
        />
        {/* Soft highlight */}
        <ellipse cx="44" cy="40" rx="8" ry="4" fill="#ffffff" fillOpacity="0.25" />

        {/* 3. Royal Tiger Forehead Mark (King '王' Motif) */}
        <path d="M 44 32 L 56 32" stroke="#0a0a0a" strokeWidth="2" strokeLinecap="round" />
        <path d="M 46 36 L 54 36" stroke="#0a0a0a" strokeWidth="1.8" strokeLinecap="round" />
        <path d="M 42 40 L 58 40" stroke="#0a0a0a" strokeWidth="2.2" strokeLinecap="round" />
        <path d="M 50 32 L 50 40" stroke="#0a0a0a" strokeWidth="2" strokeLinecap="round" />

        {/* 4. Cheek Clay Stripes */}
        {/* Left stripes */}
        <path d="M 23 50 C 27 51, 30 52, 33 53" stroke="#0a0a0a" strokeWidth="2.2" strokeLinecap="round" />
        <path d="M 22 57 C 26 58, 29 58, 32 58" stroke="#0a0a0a" strokeWidth="2.2" strokeLinecap="round" />
        <path d="M 25 64 C 28 64, 31 63, 34 62" stroke="#0a0a0a" strokeWidth="2.2" strokeLinecap="round" />

        {/* Right stripes */}
        <path d="M 77 50 C 73 51, 70 52, 67 53" stroke="#0a0a0a" strokeWidth="2.2" strokeLinecap="round" />
        <path d="M 78 57 C 74 58, 71 58, 68 58" stroke="#0a0a0a" strokeWidth="2.2" strokeLinecap="round" />
        <path d="M 75 64 C 72 64, 69 63, 66 62" stroke="#0a0a0a" strokeWidth="2.2" strokeLinecap="round" />

        {/* 5. Fierce Yet Cute Eyes */}
        <ellipse cx="38" cy="50" rx="4.5" ry="4" fill="#0a0a0a" />
        <circle cx="36.5" cy="48.5" r="1.6" fill="#ffffff" />
        <circle cx="39.5" cy="51.5" r="0.8" fill="#e8b94a" />

        <ellipse cx="62" cy="50" rx="4.5" ry="4" fill="#0a0a0a" />
        <circle cx="60.5" cy="48.5" r="1.6" fill="#ffffff" />
        <circle cx="63.5" cy="51.5" r="0.8" fill="#e8b94a" />

        {/* 6. Clay Snout & Nose */}
        <ellipse cx="44" cy="67" rx="6.5" ry="5.5" fill="url(#tigerSnoutGrad)" />
        <ellipse cx="56" cy="67" rx="6.5" ry="5.5" fill="url(#tigerSnoutGrad)" />
        <path d="M 45 61 L 55 61 C 55 61, 52 65, 50 66 C 48 65, 45 61, 45 61 Z" fill="#ff4d8b" />
        <ellipse cx="49" cy="62" rx="1.5" ry="0.8" fill="#ffffff" fillOpacity="0.7" />

        {/* Smile & Whiskers dots */}
        <circle cx="42" cy="67" r="0.8" fill="#0a0a0a" />
        <circle cx="45" cy="68" r="0.8" fill="#0a0a0a" />
        <circle cx="55" cy="68" r="0.8" fill="#0a0a0a" />
        <circle cx="58" cy="67" r="0.8" fill="#0a0a0a" />
        <path d="M 48 70 Q 50 72 52 70" stroke="#0a0a0a" strokeWidth="1.2" strokeLinecap="round" />
      </svg>
    </div>
  );
};

export default TigerLogo;
