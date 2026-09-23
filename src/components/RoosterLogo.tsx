import React from 'react';

interface RoosterLogoProps {
  size?: number;
  className?: string;
  withGlow?: boolean;
}

/**
 * RoosterLogo — Símbolo del Año del Gallo (鸡)
 * Esculpido en arcilla 3D táctil con cresta en coral/pink y pico en ochre (GEMINI.md).
 */
export const RoosterLogo: React.FC<RoosterLogoProps> = ({
  size = 36,
  className = '',
  withGlow = true,
}) => {
  return (
    <div
      className={`rooster-logo-container ${className}`}
      style={{
        width: size,
        height: size,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        filter: withGlow ? 'drop-shadow(0 4px 10px rgba(255, 107, 90, 0.45))' : undefined,
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
          {/* Head Cream Gradient */}
          <radialGradient id="roosterHeadGrad" cx="48" cy="50" r="30" gradientUnits="userSpaceOnUse">
            <stop stopColor="#fffaf0" />
            <stop offset="0.6" stopColor="#f5f0e0" />
            <stop offset="0.88" stopColor="#ebe6d6" />
            <stop offset="1" stopColor="#d1cab5" />
          </radialGradient>

          {/* Comb Coral Gradient */}
          <linearGradient id="roosterCombGrad" x1="50" y1="8" x2="50" y2="36" gradientUnits="userSpaceOnUse">
            <stop stopColor="#ff85ad" />
            <stop offset="0.5" stopColor="#ff4d8b" />
            <stop offset="1" stopColor="#ff6b5a" />
          </linearGradient>

          {/* Beak Ochre Gradient */}
          <linearGradient id="roosterBeakGrad" x1="60" y1="46" x2="84" y2="58" gradientUnits="userSpaceOnUse">
            <stop stopColor="#f7d584" />
            <stop offset="0.6" stopColor="#e8b94a" />
            <stop offset="1" stopColor="#c59124" />
          </linearGradient>
        </defs>

        {/* 1. Sculpted Wavy Crown / Comb */}
        <path
          d="M 36 34 C 28 20, 36 10, 42 14 C 44 8, 54 8, 56 16 C 62 10, 72 14, 68 26 C 66 32, 60 36, 56 36 Z"
          fill="url(#roosterCombGrad)"
          filter="drop-shadow(0 2px 4px rgba(10,26,26,0.2))"
        />
        {/* Comb Highlights */}
        <circle cx="42" cy="18" r="3" fill="#ffffff" fillOpacity="0.4" />
        <circle cx="53" cy="16" r="3.5" fill="#ffffff" fillOpacity="0.4" />
        <circle cx="64" cy="20" r="2.5" fill="#ffffff" fillOpacity="0.4" />

        {/* 2. Rooster Head Base */}
        <circle
          cx="48"
          cy="52"
          r="26"
          fill="url(#roosterHeadGrad)"
          filter="drop-shadow(0 4px 6px rgba(10,26,26,0.2))"
        />

        {/* 3. Neck Feathers (Clay Teal & Mint) */}
        <path d="M 32 70 C 38 82, 58 82, 64 70 C 60 86, 36 86, 32 70 Z" fill="#1a3a3a" />
        <path d="M 38 72 C 44 82, 52 82, 58 72 C 54 84, 42 84, 38 72 Z" fill="#a4d4c5" />

        {/* 4. Proud Eye */}
        <circle cx="44" cy="48" r="5.5" fill="#e8b94a" />
        <circle cx="44" cy="48" r="4" fill="#0a0a0a" />
        <circle cx="42.5" cy="46.5" r="1.5" fill="#ffffff" />

        {/* 5. Golden Curved Beak */}
        <path
          d="M 64 46 L 82 54 L 64 62 C 66 56, 66 52, 64 46 Z"
          fill="url(#roosterBeakGrad)"
          filter="drop-shadow(0 2px 3px rgba(10,26,26,0.18))"
        />
        <line x1="64" y1="54" x2="80" y2="54" stroke="#875e0c" strokeWidth="1.2" strokeLinecap="round" />

        {/* 6. Drooping Clay Wattle */}
        <path
          d="M 54 64 C 54 74, 66 76, 66 66 C 66 62, 58 60, 54 64 Z"
          fill="#ff6b5a"
          filter="drop-shadow(0 2px 3px rgba(10,26,26,0.18))"
        />
        <ellipse cx="61" cy="69" rx="2" ry="3" fill="#ff4d8b" />
      </svg>
    </div>
  );
};

export default RoosterLogo;
