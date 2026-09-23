import React from 'react';

interface FireGoatLogoProps {
  size?: number;
  className?: string;
  withGlow?: boolean;
}

/**
 * FireGoatLogo / HorizonGoatLogo — Isotipo y Mascota Oficial de Horizon
 * La Cabra de Fuego (丁未) esculpida en arcilla 3D táctil con cuernos en ochre,
 * rostro en brand pink, aura de fuego y estética Clay pura (GEMINI.md).
 */
export const FireGoatLogo: React.FC<FireGoatLogoProps> = ({
  size = 36,
  className = '',
  withGlow = true,
}) => {
  return (
    <div
      className={`fire-goat-logo-container ${className}`}
      style={{
        width: size,
        height: size,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        filter: withGlow ? 'drop-shadow(0 4px 10px rgba(255, 107, 90, 0.35))' : undefined,
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
          {/* Flame Gradient - Fire Spirit */}
          <linearGradient id="fireFlameGrad" x1="50" y1="6" x2="50" y2="40" gradientUnits="userSpaceOnUse">
            <stop stopColor="#f6d888" />
            <stop offset="0.35" stopColor="#e8b94a" />
            <stop offset="0.7" stopColor="#ffb084" />
            <stop offset="1" stopColor="#ff6b5a" />
          </linearGradient>

          {/* Goat Face Clay 3D Gradient - Warm Dawn Terracotta Coral */}
          <radialGradient id="goatFaceGrad" cx="50" cy="52" r="28" gradientUnits="userSpaceOnUse">
            <stop stopColor="#ff9688" />
            <stop offset="0.5" stopColor="#ff6b5a" />
            <stop offset="0.85" stopColor="#d94b38" />
            <stop offset="1" stopColor="#9e3223" />
          </radialGradient>

          {/* Horns Ochre Clay Gradient */}
          <linearGradient id="hornLeftGrad" x1="16" y1="28" x2="42" y2="56" gradientUnits="userSpaceOnUse">
            <stop stopColor="#f6d888" />
            <stop offset="0.5" stopColor="#e8b94a" />
            <stop offset="0.85" stopColor="#c59124" />
            <stop offset="1" stopColor="#875e0c" />
          </linearGradient>

          <linearGradient id="hornRightGrad" x1="84" y1="28" x2="58" y2="56" gradientUnits="userSpaceOnUse">
            <stop stopColor="#f6d888" />
            <stop offset="0.5" stopColor="#e8b94a" />
            <stop offset="0.85" stopColor="#c59124" />
            <stop offset="1" stopColor="#875e0c" />
          </linearGradient>

          {/* Snout Cream Gradient */}
          <linearGradient id="snoutGrad" x1="50" y1="60" x2="50" y2="76" gradientUnits="userSpaceOnUse">
            <stop stopColor="#fffaf0" />
            <stop offset="0.7" stopColor="#f5f0e0" />
            <stop offset="1" stopColor="#ebe6d6" />
          </linearGradient>

          {/* Beard Flame Gradient */}
          <linearGradient id="beardFlameGrad" x1="50" y1="75" x2="50" y2="98" gradientUnits="userSpaceOnUse">
            <stop stopColor="#ff6b5a" />
            <stop offset="0.6" stopColor="#ffb084" />
            <stop offset="1" stopColor="#e8b94a" />
          </linearGradient>
        </defs>

        {/* 1. Backdrop Flame Aura */}
        <g className="clay-float-slow">
          <path
            d="M 50 6 C 56 16, 62 22, 57 32 C 54 37, 46 37, 43 32 C 38 22, 44 16, 50 6 Z"
            fill="url(#fireFlameGrad)"
          />
          <path
            d="M 40 16 C 44 24, 46 28, 42 34 C 39 38, 33 36, 33 31 C 33 24, 37 21, 40 16 Z"
            fill="#e8b94a"
            fillOpacity="0.9"
          />
          <path
            d="M 60 16 C 56 24, 54 28, 58 34 C 61 38, 67 36, 67 31 C 67 24, 63 21, 60 16 Z"
            fill="#ffb084"
            fillOpacity="0.95"
          />
        </g>

        {/* 2. Tactile Clay Horns */}
        <path
          d="M 37 36 C 20 23, 8 36, 12 52 C 14 59, 22 61, 24 55 C 22 47, 26 39, 39 42 Z"
          fill="url(#hornLeftGrad)"
          filter="drop-shadow(0 2px 3px rgba(10,26,26,0.18))"
        />
        <path d="M 21 34 C 23 38, 25 43, 27 48" stroke="#fffaf0" strokeWidth="2" strokeLinecap="round" strokeOpacity="0.6" />
        <path d="M 14 44 C 17 48, 20 53, 22 56" stroke="#875e0c" strokeWidth="1.6" strokeLinecap="round" strokeOpacity="0.4" />

        <path
          d="M 63 36 C 80 23, 92 36, 88 52 C 86 59, 78 61, 76 55 C 78 47, 74 39, 61 42 Z"
          fill="url(#hornRightGrad)"
          filter="drop-shadow(0 2px 3px rgba(10,26,26,0.18))"
        />
        <path d="M 79 34 C 77 38, 75 43, 73 48" stroke="#fffaf0" strokeWidth="2" strokeLinecap="round" strokeOpacity="0.6" />
        <path d="M 86 44 C 83 48, 80 53, 78 56" stroke="#875e0c" strokeWidth="1.6" strokeLinecap="round" strokeOpacity="0.4" />

        {/* 3. Drooping Clay Ears */}
        <path d="M 32 45 C 19 46, 17 53, 24 56 C 29 57, 33 52, 33 47 Z" fill="#ff6b5a" />
        <ellipse cx="25" cy="51" rx="4" ry="2" fill="#ffb084" />

        <path d="M 68 45 C 81 46, 83 53, 76 56 C 71 57, 67 52, 67 47 Z" fill="#ff6b5a" />
        <ellipse cx="75" cy="51" rx="4" ry="2" fill="#ffb084" />

        {/* 4. Goat Head Base */}
        <path
          d="M 33 39 C 32 32, 68 32, 67 39 C 68 50, 65 65, 59 73 C 55 77, 45 77, 41 73 C 35 65, 32 50, 33 39 Z"
          fill="url(#goatFaceGrad)"
          filter="drop-shadow(0 4px 6px rgba(10,26,26,0.22))"
        />
        <ellipse cx="45" cy="40" rx="7" ry="4" fill="#ffffff" fillOpacity="0.3" />

        {/* 5. Forehead Fire Crest Emblem */}
        <path d="M 50 34 C 53 40, 56 43, 53 47 C 51 50, 47 49, 47 45 C 47 41, 49 38, 50 34 Z" fill="#f6d888" />
        <circle cx="50.2" cy="45" r="1.5" fill="#ff6b5a" />

        {/* 6. Noble Goat Eyes */}
        <ellipse cx="40" cy="52" rx="4" ry="3.2" fill="#0a0a0a" />
        <ellipse cx="38.8" cy="50.8" rx="1.5" ry="1.2" fill="#ffffff" />
        <line x1="37.5" y1="52" x2="42.5" y2="52" stroke="#ffb084" strokeWidth="1" strokeLinecap="round" />

        <ellipse cx="60" cy="52" rx="4" ry="3.2" fill="#0a0a0a" />
        <ellipse cx="58.8" cy="50.8" rx="1.5" ry="1.2" fill="#ffffff" />
        <line x1="57.5" y1="52" x2="62.5" y2="52" stroke="#ffb084" strokeWidth="1" strokeLinecap="round" />

        {/* 7. Clay Snout & Nose */}
        <path d="M 40 62 C 40 59, 60 59, 60 62 C 62 70, 58 75, 50 75 C 42 75, 38 70, 40 62 Z" fill="url(#snoutGrad)" />
        <ellipse cx="50" cy="63" rx="6" ry="2" fill="#ffffff" fillOpacity="0.6" />
        <ellipse cx="47" cy="67.5" rx="1.2" ry="1.8" fill="#0a0a0a" transform="rotate(-15 47 67.5)" />
        <ellipse cx="53" cy="67.5" rx="1.2" ry="1.8" fill="#0a0a0a" transform="rotate(15 53 67.5)" />
        <path d="M 48 71 Q 50 72.5 52 71" stroke="#0a0a0a" strokeWidth="1.4" strokeLinecap="round" />

        {/* 8. Fire Beard */}
        <path
          d="M 46 75 C 43 85, 49 93, 47 98 C 52 92, 57 88, 54 75 Z"
          fill="url(#beardFlameGrad)"
          filter="drop-shadow(0 2px 4px rgba(255,107,90,0.4))"
        />
        <path d="M 49 76 C 48 83, 52 87, 51 91 C 53 87, 55 83, 53 76 Z" fill="#f6d888" fillOpacity="0.8" />
      </svg>
    </div>
  );
};

export const HorizonGoatLogo = FireGoatLogo;
export const Clay2027Logo = FireGoatLogo;
export const ClayLogo = FireGoatLogo;

