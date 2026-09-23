import React from 'react';

interface HorseLogoProps {
  size?: number;
  className?: string;
  withGlow?: boolean;
}

/**
 * HorseLogo — Símbolo del Año del Caballo (马)
 * Esculpido en arcilla 3D táctil con crin en ochre y tonos coral y peach (GEMINI.md).
 */
export const HorseLogo: React.FC<HorseLogoProps> = ({
  size = 36,
  className = '',
  withGlow = true,
}) => {
  return (
    <div
      className={`horse-logo-container ${className}`}
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
          {/* Horse Head Gradient */}
          <radialGradient id="horseFaceGrad" cx="50" cy="50" r="32" gradientUnits="userSpaceOnUse">
            <stop stopColor="#ffb084" />
            <stop offset="0.5" stopColor="#ff6b5a" />
            <stop offset="0.85" stopColor="#d94b38" />
            <stop offset="1" stopColor="#9e3223" />
          </radialGradient>

          {/* Golden Clay Mane Gradient */}
          <linearGradient id="horseManeGrad" x1="50" y1="8" x2="50" y2="44" gradientUnits="userSpaceOnUse">
            <stop stopColor="#fdf0cd" />
            <stop offset="0.4" stopColor="#e8b94a" />
            <stop offset="1" stopColor="#c59124" />
          </linearGradient>

          {/* Muzzle Gradient */}
          <linearGradient id="horseMuzzleGrad" x1="50" y1="62" x2="50" y2="82" gradientUnits="userSpaceOnUse">
            <stop stopColor="#fffaf0" />
            <stop offset="0.75" stopColor="#f5f0e0" />
            <stop offset="1" stopColor="#ebe6d6" />
          </linearGradient>
        </defs>

        {/* 1. Pointy Alert Ears */}
        {/* Left ear */}
        <path
          d="M 34 32 C 28 16, 32 8, 38 12 C 42 16, 44 26, 40 34 Z"
          fill="#ff6b5a"
          filter="drop-shadow(0 2px 3px rgba(10,26,26,0.18))"
        />
        <path d="M 35 18 C 34 14, 36 12, 38 14 C 40 16, 41 22, 38 26" fill="#ffb084" />

        {/* Right ear */}
        <path
          d="M 66 32 C 72 16, 68 8, 62 12 C 58 16, 56 26, 60 34 Z"
          fill="#ff6b5a"
          filter="drop-shadow(0 2px 3px rgba(10,26,26,0.18))"
        />
        <path d="M 65 18 C 66 14, 64 12, 62 14 C 60 16, 59 22, 62 26" fill="#ffb084" />

        {/* 2. Flowing Golden Clay Mane Top */}
        <path
          d="M 44 8 C 48 4, 52 4, 56 8 C 58 18, 62 24, 58 32 C 54 36, 46 36, 42 32 C 38 24, 40 16, 44 8 Z"
          fill="url(#horseManeGrad)"
          filter="drop-shadow(0 2px 4px rgba(10,26,26,0.2))"
        />
        <path d="M 48 10 C 50 16, 52 24, 50 28" stroke="#fffaf0" strokeWidth="1.5" strokeLinecap="round" />

        {/* 3. Horse Head Base */}
        <path
          d="M 33 34 C 31 28, 69 28, 67 34 C 70 48, 66 66, 60 72 C 54 77, 46 77, 40 72 C 34 66, 30 48, 33 34 Z"
          fill="url(#horseFaceGrad)"
          filter="drop-shadow(0 4px 6px rgba(10,26,26,0.22))"
        />
        {/* Clay Face highlight */}
        <ellipse cx="44" cy="38" rx="6" ry="3.5" fill="#ffffff" fillOpacity="0.3" />

        {/* Forehead Star / Blaze */}
        <polygon points="50,38 52,43 50,47 48,43" fill="#fffaf0" />

        {/* 4. Spirited Eyes */}
        <ellipse cx="38" cy="48" rx="4.5" ry="3.8" fill="#0a0a0a" />
        <circle cx="36.5" cy="46.5" r="1.5" fill="#ffffff" />
        <ellipse cx="62" cy="48" rx="4.5" ry="3.8" fill="#0a0a0a" />
        <circle cx="60.5" cy="46.5" r="1.5" fill="#ffffff" />

        {/* 5. Sleek Clay Muzzle */}
        <ellipse cx="50" cy="67" rx="13" ry="9" fill="url(#horseMuzzleGrad)" />
        {/* Nostrils */}
        <ellipse cx="44" cy="67" rx="2" ry="2.8" fill="#0a0a0a" transform="rotate(-15 44 67)" />
        <ellipse cx="56" cy="67" rx="2" ry="2.8" fill="#0a0a0a" transform="rotate(15 56 67)" />
        {/* Soft mouth line */}
        <path d="M 47 72 Q 50 73.5 53 72" stroke="#0a0a0a" strokeWidth="1.2" strokeLinecap="round" />
      </svg>
    </div>
  );
};

export default HorseLogo;
