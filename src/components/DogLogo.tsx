import React from 'react';

interface DogLogoProps {
  size?: number;
  className?: string;
  withGlow?: boolean;
}

/**
 * DogLogo — Símbolo del Año del Perro (狗)
 * Esculpido en arcilla 3D táctil con orejas caídas y tonos ochre, cream y pink (GEMINI.md).
 */
export const DogLogo: React.FC<DogLogoProps> = ({
  size = 36,
  className = '',
  withGlow = true,
}) => {
  return (
    <div
      className={`dog-logo-container ${className}`}
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
          {/* Head Ochre Gradient */}
          <radialGradient id="dogHeadGrad" cx="50" cy="50" r="32" gradientUnits="userSpaceOnUse">
            <stop stopColor="#f7d584" />
            <stop offset="0.55" stopColor="#e8b94a" />
            <stop offset="0.88" stopColor="#c59124" />
            <stop offset="1" stopColor="#94650f" />
          </radialGradient>

          {/* Floppy Ear Left Gradient */}
          <linearGradient id="dogEarLeftGrad" x1="20" y1="20" x2="20" y2="60" gradientUnits="userSpaceOnUse">
            <stop stopColor="#ffb084" />
            <stop offset="0.5" stopColor="#e8b94a" />
            <stop offset="1" stopColor="#94650f" />
          </linearGradient>

          {/* Floppy Ear Right Gradient */}
          <linearGradient id="dogEarRightGrad" x1="80" y1="20" x2="80" y2="60" gradientUnits="userSpaceOnUse">
            <stop stopColor="#ffb084" />
            <stop offset="0.5" stopColor="#e8b94a" />
            <stop offset="1" stopColor="#94650f" />
          </linearGradient>

          {/* Muzzle Gradient */}
          <linearGradient id="dogMuzzleGrad" x1="50" y1="56" x2="50" y2="76" gradientUnits="userSpaceOnUse">
            <stop stopColor="#fffaf0" />
            <stop offset="0.75" stopColor="#f5f0e0" />
            <stop offset="1" stopColor="#ebe6d6" />
          </linearGradient>
        </defs>

        {/* 1. Floppy Clay Ears */}
        {/* Left ear */}
        <path
          d="M 30 32 C 16 34, 12 50, 18 64 C 22 72, 28 68, 28 60 C 28 48, 28 40, 32 34 Z"
          fill="url(#dogEarLeftGrad)"
          filter="drop-shadow(0 3px 4px rgba(10,26,26,0.18))"
        />
        {/* Right ear */}
        <path
          d="M 70 32 C 84 34, 88 50, 82 64 C 78 72, 72 68, 72 60 C 72 48, 72 40, 68 34 Z"
          fill="url(#dogEarRightGrad)"
          filter="drop-shadow(0 3px 4px rgba(10,26,26,0.18))"
        />

        {/* 2. Dog Head Base */}
        <circle
          cx="50"
          cy="50"
          r="28"
          fill="url(#dogHeadGrad)"
          filter="drop-shadow(0 4px 6px rgba(10,26,26,0.22))"
        />
        <ellipse cx="44" cy="38" rx="7" ry="3.5" fill="#ffffff" fillOpacity="0.3" />

        {/* Patch around left eye */}
        <ellipse cx="38" cy="46" rx="8" ry="7" fill="#ffb084" fillOpacity="0.8" />

        {/* 3. Loyal Sweet Eyes */}
        <ellipse cx="38" cy="46" rx="4.5" ry="4.8" fill="#0a0a0a" />
        <circle cx="36.5" cy="44" r="1.6" fill="#ffffff" />
        <circle cx="39.2" cy="47.5" r="0.8" fill="#ffffff" />

        <ellipse cx="62" cy="46" rx="4.5" ry="4.8" fill="#0a0a0a" />
        <circle cx="60.5" cy="44" r="1.6" fill="#ffffff" />
        <circle cx="63.2" cy="47.5" r="0.8" fill="#ffffff" />

        {/* Eyebrows */}
        <ellipse cx="38" cy="38" rx="2.5" ry="1.2" fill="#fffaf0" />
        <ellipse cx="62" cy="38" rx="2.5" ry="1.2" fill="#fffaf0" />

        {/* 4. Clay Muzzle & Button Nose */}
        <ellipse cx="50" cy="62" rx="11" ry="8" fill="url(#dogMuzzleGrad)" />
        <ellipse cx="50" cy="58" rx="4" ry="2.8" fill="#0a0a0a" />
        <ellipse cx="48.5" cy="57" rx="1.2" ry="0.8" fill="#ffffff" />

        {/* Mouth line */}
        <path d="M 50 61 L 50 64" stroke="#0a0a0a" strokeWidth="1.2" strokeLinecap="round" />
        <path d="M 44 64 Q 50 67 56 64" stroke="#0a0a0a" strokeWidth="1.2" strokeLinecap="round" fill="none" />

        {/* Happy Tongue */}
        <path
          d="M 47 65 C 47 72, 53 72, 53 65 Z"
          fill="#ff4d8b"
          filter="drop-shadow(0 1px 2px rgba(10,26,26,0.15))"
        />
        <line x1="50" y1="65" x2="50" y2="69" stroke="#ff85ad" strokeWidth="0.8" />
      </svg>
    </div>
  );
};

export default DogLogo;
