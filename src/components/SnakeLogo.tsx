import React from 'react';

interface SnakeLogoProps {
  size?: number;
  className?: string;
  withGlow?: boolean;
}

/**
 * SnakeLogo — Símbolo del Año de la Serpiente (蛇)
 * Esculpido en arcilla 3D táctil con tonos mint, teal y destellos lavanda (GEMINI.md).
 */
export const SnakeLogo: React.FC<SnakeLogoProps> = ({
  size = 36,
  className = '',
  withGlow = true,
}) => {
  return (
    <div
      className={`snake-logo-container ${className}`}
      style={{
        width: size,
        height: size,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        filter: withGlow ? 'drop-shadow(0 4px 10px rgba(164, 212, 197, 0.45))' : undefined,
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
          {/* Snake Body/Head Mint Gradient */}
          <radialGradient id="snakeFaceGrad" cx="50" cy="46" r="30" gradientUnits="userSpaceOnUse">
            <stop stopColor="#d4f2e8" />
            <stop offset="0.5" stopColor="#a4d4c5" />
            <stop offset="0.85" stopColor="#67ab98" />
            <stop offset="1" stopColor="#3d7d6c" />
          </radialGradient>

          {/* Coiled Body Gradient */}
          <linearGradient id="snakeCoilGrad" x1="20" y1="60" x2="80" y2="85" gradientUnits="userSpaceOnUse">
            <stop stopColor="#a4d4c5" />
            <stop offset="0.5" stopColor="#4e9483" />
            <stop offset="1" stopColor="#1a3a3a" />
          </linearGradient>

          {/* Belly Lavender Accent */}
          <linearGradient id="snakeBellyGrad" x1="50" y1="68" x2="50" y2="86" gradientUnits="userSpaceOnUse">
            <stop stopColor="#ffb084" />
            <stop offset="0.6" stopColor="#b8a4ed" />
            <stop offset="1" stopColor="#8d73cf" />
          </linearGradient>
        </defs>

        {/* 1. Coiled Body Base */}
        <path
          d="M 24 74 C 20 62, 34 54, 50 56 C 68 54, 80 64, 76 76 C 72 86, 28 88, 24 74 Z"
          fill="url(#snakeCoilGrad)"
          filter="drop-shadow(0 3px 5px rgba(10,26,26,0.22))"
        />

        {/* Soft belly segment */}
        <path
          d="M 38 72 C 38 68, 62 68, 62 72 C 60 78, 40 78, 38 72 Z"
          fill="url(#snakeBellyGrad)"
          opacity="0.85"
        />

        {/* 2. Snake Head Base */}
        <path
          d="M 30 40 C 26 24, 74 24, 70 40 C 72 58, 62 66, 50 66 C 38 66, 28 58, 30 40 Z"
          fill="url(#snakeFaceGrad)"
          filter="drop-shadow(0 4px 6px rgba(10,26,26,0.25))"
        />
        <ellipse cx="44" cy="32" rx="8" ry="4" fill="#ffffff" fillOpacity="0.3" />

        {/* 3. Forehead Diamond Scales */}
        <polygon points="50,28 54,34 50,40 46,34" fill="#e8b94a" />
        <polygon points="40,34 43,38 40,42 37,38" fill="#b8a4ed" opacity="0.8" />
        <polygon points="60,34 63,38 60,42 57,38" fill="#b8a4ed" opacity="0.8" />

        {/* 4. Bright Expressive Eyes */}
        <ellipse cx="38" cy="45" rx="5" ry="5.5" fill="#0a0a0a" />
        <circle cx="36.5" cy="43" r="1.8" fill="#ffffff" />
        <circle cx="39.5" cy="46.5" r="0.9" fill="#ffb084" />

        <ellipse cx="62" cy="45" rx="5" ry="5.5" fill="#0a0a0a" />
        <circle cx="60.5" cy="43" r="1.8" fill="#ffffff" />
        <circle cx="63.5" cy="46.5" r="0.9" fill="#ffb084" />

        {/* 5. Cute Blushing Cheeks */}
        <ellipse cx="30" cy="52" rx="4" ry="2.2" fill="#ff4d8b" fillOpacity="0.4" />
        <ellipse cx="70" cy="52" rx="4" ry="2.2" fill="#ff4d8b" fillOpacity="0.4" />

        {/* 6. Cute Smile & Forked Tongue */}
        <path d="M 45 56 Q 50 58.5 55 56" stroke="#0a0a0a" strokeWidth="1.6" strokeLinecap="round" />
        <path
          d="M 50 57 L 50 63 L 47 66 M 50 63 L 53 66"
          stroke="#ff4d8b"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
};

export default SnakeLogo;
