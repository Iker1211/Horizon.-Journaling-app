import React from 'react';

interface DragonLogoProps {
  size?: number;
  className?: string;
  withGlow?: boolean;
}

/**
 * DragonLogo — Símbolo del Año del Dragón (龙)
 * Esculpido en arcilla 3D táctil con astas en ochre y tonos teal y mint (GEMINI.md).
 */
export const DragonLogo: React.FC<DragonLogoProps> = ({
  size = 36,
  className = '',
  withGlow = true,
}) => {
  return (
    <div
      className={`dragon-logo-container ${className}`}
      style={{
        width: size,
        height: size,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        filter: withGlow ? 'drop-shadow(0 4px 10px rgba(26, 58, 58, 0.45))' : undefined,
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
          {/* Dragon Head Teal Clay Gradient */}
          <radialGradient id="dragonFaceGrad" cx="50" cy="52" r="30" gradientUnits="userSpaceOnUse">
            <stop stopColor="#3d7272" />
            <stop offset="0.5" stopColor="#1a3a3a" />
            <stop offset="0.85" stopColor="#0f2626" />
            <stop offset="1" stopColor="#081515" />
          </radialGradient>

          {/* Dragon Horns Ochre Gradient */}
          <linearGradient id="dragonHornGrad" x1="50" y1="6" x2="50" y2="40" gradientUnits="userSpaceOnUse">
            <stop stopColor="#f6d888" />
            <stop offset="0.5" stopColor="#e8b94a" />
            <stop offset="1" stopColor="#a87413" />
          </linearGradient>

          {/* Whisker & Flame Coral */}
          <linearGradient id="dragonFireGrad" x1="50" y1="40" x2="50" y2="90" gradientUnits="userSpaceOnUse">
            <stop stopColor="#ffb084" />
            <stop offset="0.7" stopColor="#ff6b5a" />
            <stop offset="1" stopColor="#d94b38" />
          </linearGradient>
        </defs>

        {/* 1. Branching Antlers / Horns */}
        {/* Left Horn */}
        <path
          d="M 38 34 C 28 20, 16 18, 14 10 C 22 14, 28 20, 32 26 C 26 22, 20 23, 17 21 C 24 26, 32 30, 42 32 Z"
          fill="url(#dragonHornGrad)"
          filter="drop-shadow(0 2px 4px rgba(10,26,26,0.25))"
        />
        {/* Right Horn */}
        <path
          d="M 62 34 C 72 20, 84 18, 86 10 C 78 14, 72 20, 68 26 C 74 22, 80 23, 83 21 C 76 26, 68 30, 58 32 Z"
          fill="url(#dragonHornGrad)"
          filter="drop-shadow(0 2px 4px rgba(10,26,26,0.25))"
        />

        {/* 2. Clay Mane / Tufts behind */}
        <path d="M 28 42 C 16 44, 18 58, 26 62 C 28 54, 30 48, 32 44 Z" fill="#a4d4c5" />
        <path d="M 72 42 C 84 44, 82 58, 74 62 C 72 54, 70 48, 68 44 Z" fill="#a4d4c5" />

        {/* 3. Dragon Head Base */}
        <path
          d="M 32 36 C 30 28, 70 28, 68 36 C 74 48, 72 68, 62 76 C 56 80, 44 80, 38 76 C 28 68, 26 48, 32 36 Z"
          fill="url(#dragonFaceGrad)"
          filter="drop-shadow(0 4px 8px rgba(10,26,26,0.3))"
        />
        <ellipse cx="44" cy="38" rx="7" ry="3.5" fill="#ffffff" fillOpacity="0.2" />

        {/* 4. Imperial Brow & Pearl Crest */}
        <path d="M 32 46 Q 42 42 46 45" stroke="#a4d4c5" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M 68 46 Q 58 42 54 45" stroke="#a4d4c5" strokeWidth="2.5" strokeLinecap="round" />
        {/* Wisdom Pearl on forehead */}
        <circle cx="50" cy="38" r="4.5" fill="#ffb084" />
        <circle cx="50" cy="38" r="3.2" fill="#ff4d8b" />
        <circle cx="49" cy="37" r="1.2" fill="#ffffff" />

        {/* 5. Dragon Eyes */}
        <ellipse cx="39" cy="50" rx="4.5" ry="4" fill="#e8b94a" />
        <ellipse cx="39" cy="50" rx="2.5" ry="3.8" fill="#0a0a0a" />
        <circle cx="38" cy="48.5" r="1.2" fill="#ffffff" />

        <ellipse cx="61" cy="50" rx="4.5" ry="4" fill="#e8b94a" />
        <ellipse cx="61" cy="50" rx="2.5" ry="3.8" fill="#0a0a0a" />
        <circle cx="60" cy="48.5" r="1.2" fill="#ffffff" />

        {/* 6. Dragon Snout & Whiskers */}
        <path
          d="M 36 62 C 36 58, 64 58, 64 62 C 65 72, 60 76, 50 76 C 40 76, 35 72, 36 62 Z"
          fill="#2d5e5e"
        />
        {/* Nostrils */}
        <ellipse cx="44" cy="65" rx="2" ry="2.8" fill="#0a0a0a" />
        <ellipse cx="56" cy="65" rx="2" ry="2.8" fill="#0a0a0a" />

        {/* Flowing Whiskers (Barbel) */}
        <path
          d="M 38 67 C 24 72, 14 68, 12 78 C 16 77, 24 76, 36 71"
          fill="url(#dragonFireGrad)"
        />
        <path
          d="M 62 67 C 76 72, 86 68, 88 78 C 84 77, 76 76, 64 71"
          fill="url(#dragonFireGrad)"
        />

        {/* Cute Teeth */}
        <polygon points="44,72 46,75 48,72" fill="#fffaf0" />
        <polygon points="52,72 54,75 56,72" fill="#fffaf0" />
      </svg>
    </div>
  );
};

export default DragonLogo;
