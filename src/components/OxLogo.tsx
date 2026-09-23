import React from 'react';

interface OxLogoProps {
  size?: number;
  className?: string;
  withGlow?: boolean;
}

/**
 * OxLogo — Símbolo del Año del Buey (牛)
 * Esculpido en arcilla 3D táctil con cuernos ochre y tonos terracota, estética Clay pura (GEMINI.md).
 */
export const OxLogo: React.FC<OxLogoProps> = ({
  size = 36,
  className = '',
  withGlow = true,
}) => {
  return (
    <div
      className={`ox-logo-container ${className}`}
      style={{
        width: size,
        height: size,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        filter: withGlow ? 'drop-shadow(0 4px 10px rgba(232, 185, 74, 0.4))' : undefined,
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
          {/* Ox Face Clay Gradient */}
          <radialGradient id="oxFaceGrad" cx="50" cy="50" r="32" gradientUnits="userSpaceOnUse">
            <stop stopColor="#ffb084" />
            <stop offset="0.55" stopColor="#e8b94a" />
            <stop offset="0.88" stopColor="#c59124" />
            <stop offset="1" stopColor="#875e0c" />
          </radialGradient>

          {/* Horn Left Gradient */}
          <linearGradient id="oxHornLeftGrad" x1="20" y1="20" x2="38" y2="40" gradientUnits="userSpaceOnUse">
            <stop stopColor="#fffaf0" />
            <stop offset="0.3" stopColor="#e8b94a" />
            <stop offset="0.75" stopColor="#a97615" />
            <stop offset="1" stopColor="#573c05" />
          </linearGradient>

          {/* Horn Right Gradient */}
          <linearGradient id="oxHornRightGrad" x1="80" y1="20" x2="62" y2="40" gradientUnits="userSpaceOnUse">
            <stop stopColor="#fffaf0" />
            <stop offset="0.3" stopColor="#e8b94a" />
            <stop offset="0.75" stopColor="#a97615" />
            <stop offset="1" stopColor="#573c05" />
          </linearGradient>

          {/* Muzzle Gradient */}
          <linearGradient id="oxMuzzleGrad" x1="50" y1="58" x2="50" y2="82" gradientUnits="userSpaceOnUse">
            <stop stopColor="#fffaf0" />
            <stop offset="0.7" stopColor="#f5f0e0" />
            <stop offset="1" stopColor="#ebe6d6" />
          </linearGradient>
        </defs>

        {/* 1. Mighty Ox Horns */}
        <path
          d="M 32 38 C 12 36, 6 18, 14 10 C 22 18, 26 28, 38 34 Z"
          fill="url(#oxHornLeftGrad)"
          filter="drop-shadow(0 2px 4px rgba(10,26,26,0.2))"
        />
        <path d="M 17 14 C 20 22, 26 30, 34 35" stroke="#fffaf0" strokeWidth="1.8" strokeLinecap="round" strokeOpacity="0.6" />

        <path
          d="M 68 38 C 88 36, 94 18, 86 10 C 78 18, 74 28, 62 34 Z"
          fill="url(#oxHornRightGrad)"
          filter="drop-shadow(0 2px 4px rgba(10,26,26,0.2))"
        />
        <path d="M 83 14 C 80 22, 74 30, 66 35" stroke="#fffaf0" strokeWidth="1.8" strokeLinecap="round" strokeOpacity="0.6" />

        {/* 2. Side Ears */}
        <path d="M 28 44 C 14 44, 12 52, 22 56 C 28 56, 32 50, 31 45 Z" fill="#c59124" />
        <ellipse cx="22" cy="50" rx="4" ry="2.2" fill="#ffb084" />

        <path d="M 72 44 C 86 44, 88 52, 78 56 C 72 56, 68 50, 69 45 Z" fill="#c59124" />
        <ellipse cx="78" cy="50" rx="4" ry="2.2" fill="#ffb084" />

        {/* 3. Ox Head Base */}
        <path
          d="M 30 36 C 30 30, 70 30, 70 36 C 73 52, 71 68, 64 74 C 58 79, 42 79, 36 74 C 29 68, 27 52, 30 36 Z"
          fill="url(#oxFaceGrad)"
          filter="drop-shadow(0 4px 6px rgba(10,26,26,0.22))"
        />
        {/* Clay Forehead Highlight */}
        <ellipse cx="44" cy="38" rx="8" ry="4" fill="#ffffff" fillOpacity="0.3" />
        {/* Forehead Hair Tuft */}
        <path d="M 48 30 C 50 25, 53 25, 52 32 Z" fill="#fffaf0" />
        <path d="M 45 32 C 48 27, 51 27, 49 34 Z" fill="#ffb084" />

        {/* 4. Gentle Eyes */}
        <ellipse cx="38" cy="46" rx="4.5" ry="3.5" fill="#0a0a0a" />
        <ellipse cx="36.5" cy="45" rx="1.5" ry="1.2" fill="#ffffff" />
        <path d="M 34 42 Q 38 40 42 42" stroke="#875e0c" strokeWidth="1.2" strokeLinecap="round" />

        <ellipse cx="62" cy="46" rx="4.5" ry="3.5" fill="#0a0a0a" />
        <ellipse cx="60.5" cy="45" rx="1.5" ry="1.2" fill="#ffffff" />
        <path d="M 58 42 Q 62 40 66 42" stroke="#875e0c" strokeWidth="1.2" strokeLinecap="round" />

        {/* 5. Broad Clay Muzzle */}
        <ellipse
          cx="50"
          cy="66"
          rx="18"
          ry="13"
          fill="url(#oxMuzzleGrad)"
          filter="drop-shadow(0 2px 3px rgba(10,26,26,0.12))"
        />
        {/* Nostrils */}
        <ellipse cx="43" cy="67" rx="2.5" ry="3.2" fill="#0a0a0a" transform="rotate(-15 43 67)" />
        <ellipse cx="57" cy="67" rx="2.5" ry="3.2" fill="#0a0a0a" transform="rotate(15 57 67)" />

        {/* Golden Nose Ring */}
        <path
          d="M 44 72 C 44 80, 56 80, 56 72"
          stroke="#e8b94a"
          strokeWidth="2.5"
          strokeLinecap="round"
          fill="none"
          filter="drop-shadow(0 1px 2px rgba(10,26,26,0.25))"
        />
        <path d="M 47 77 C 49 78.5, 51 78.5, 53 77" stroke="#fffaf0" strokeWidth="1" strokeLinecap="round" fill="none" />
      </svg>
    </div>
  );
};

export default OxLogo;
