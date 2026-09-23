import React from 'react';

interface MonkeyLogoProps {
  size?: number;
  className?: string;
  withGlow?: boolean;
}

/**
 * MonkeyLogo — Símbolo del Año del Mono (猴)
 * Esculpido en arcilla 3D táctil con máscara facial en peach y tonos ochre (GEMINI.md).
 */
export const MonkeyLogo: React.FC<MonkeyLogoProps> = ({
  size = 36,
  className = '',
  withGlow = true,
}) => {
  return (
    <div
      className={`monkey-logo-container ${className}`}
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
          {/* Head Ochre Clay Gradient */}
          <radialGradient id="monkeyHeadGrad" cx="50" cy="50" r="32" gradientUnits="userSpaceOnUse">
            <stop stopColor="#f7d584" />
            <stop offset="0.5" stopColor="#e8b94a" />
            <stop offset="0.85" stopColor="#c59124" />
            <stop offset="1" stopColor="#875e0c" />
          </radialGradient>

          {/* Inner Face Peach Gradient */}
          <radialGradient id="monkeyFaceMaskGrad" cx="50" cy="54" r="26" gradientUnits="userSpaceOnUse">
            <stop stopColor="#fffaf0" />
            <stop offset="0.45" stopColor="#ffcbb0" />
            <stop offset="0.85" stopColor="#ffb084" />
            <stop offset="1" stopColor="#f59462" />
          </radialGradient>
        </defs>

        {/* 1. Big Round Clay Ears */}
        {/* Left ear */}
        <circle cx="22" cy="50" r="14" fill="#e8b94a" filter="drop-shadow(0 2px 4px rgba(10,26,26,0.18))" />
        <circle cx="22" cy="50" r="9" fill="#ffb084" />
        <ellipse cx="20" cy="47" rx="3" ry="1.5" fill="#ffffff" fillOpacity="0.4" />

        {/* Right ear */}
        <circle cx="78" cy="50" r="14" fill="#e8b94a" filter="drop-shadow(0 2px 4px rgba(10,26,26,0.18))" />
        <circle cx="78" cy="50" r="9" fill="#ffb084" />
        <ellipse cx="76" cy="47" rx="3" ry="1.5" fill="#ffffff" fillOpacity="0.4" />

        {/* 2. Outer Ochre Head */}
        <circle
          cx="50"
          cy="50"
          r="30"
          fill="url(#monkeyHeadGrad)"
          filter="drop-shadow(0 4px 6px rgba(10,26,26,0.22))"
        />

        {/* Little hair tuft on top */}
        <path d="M 48 20 C 50 14, 52 14, 53 20 Z" fill="#e8b94a" />
        <path d="M 45 22 C 47 17, 50 17, 49 23 Z" fill="#f7d584" />

        {/* 3. Heart-shaped Peach Face Mask */}
        <path
          d="M 50 36 C 42 30, 30 36, 31 48 C 32 60, 42 74, 50 75 C 58 74, 68 60, 69 48 C 70 36, 58 30, 50 36 Z"
          fill="url(#monkeyFaceMaskGrad)"
          filter="drop-shadow(0 2px 3px rgba(10,26,26,0.12))"
        />

        {/* 4. Playful Mischievous Eyes */}
        <ellipse cx="42" cy="46" rx="4" ry="4.8" fill="#0a0a0a" />
        <circle cx="40.5" cy="44" r="1.6" fill="#ffffff" />
        <circle cx="43.2" cy="47.5" r="0.8" fill="#ffffff" />

        <ellipse cx="58" cy="46" rx="4" ry="4.8" fill="#0a0a0a" />
        <circle cx="56.5" cy="44" r="1.6" fill="#ffffff" />
        <circle cx="59.2" cy="47.5" r="0.8" fill="#ffffff" />

        {/* 5. Blushed Cheeks */}
        <ellipse cx="36" cy="56" rx="3.5" ry="2" fill="#ff4d8b" fillOpacity="0.45" />
        <ellipse cx="64" cy="56" rx="3.5" ry="2" fill="#ff4d8b" fillOpacity="0.45" />

        {/* 6. Nose & Wide Joyful Smile */}
        <ellipse cx="48" cy="55" rx="1.2" ry="1.6" fill="#0a0a0a" />
        <ellipse cx="52" cy="55" rx="1.2" ry="1.6" fill="#0a0a0a" />

        <path
          d="M 40 60 Q 50 68 60 60"
          stroke="#0a0a0a"
          strokeWidth="2"
          strokeLinecap="round"
          fill="none"
        />
        {/* Tongue */}
        <path
          d="M 47 64 Q 50 67 53 64 Z"
          fill="#ff4d8b"
        />
      </svg>
    </div>
  );
};

export default MonkeyLogo;
