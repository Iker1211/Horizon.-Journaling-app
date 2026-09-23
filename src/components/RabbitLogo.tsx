import React from 'react';

interface RabbitLogoProps {
  size?: number;
  className?: string;
  withGlow?: boolean;
}

/**
 * RabbitLogo — Símbolo del Año del Conejo (兔)
 * Esculpido en arcilla 3D táctil con orejas largas y tonos mint y brand pink (GEMINI.md).
 */
export const RabbitLogo: React.FC<RabbitLogoProps> = ({
  size = 36,
  className = '',
  withGlow = true,
}) => {
  return (
    <div
      className={`rabbit-logo-container ${className}`}
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
          {/* Rabbit Face Mint Clay Gradient */}
          <radialGradient id="rabbitFaceGrad" cx="50" cy="58" r="30" gradientUnits="userSpaceOnUse">
            <stop stopColor="#d4f0e7" />
            <stop offset="0.5" stopColor="#a4d4c5" />
            <stop offset="0.85" stopColor="#76b3a1" />
            <stop offset="1" stopColor="#4e8f7c" />
          </radialGradient>

          {/* Left Ear Outer */}
          <linearGradient id="rabbitEarLeftGrad" x1="32" y1="6" x2="38" y2="44" gradientUnits="userSpaceOnUse">
            <stop stopColor="#c5e8dd" />
            <stop offset="0.6" stopColor="#a4d4c5" />
            <stop offset="1" stopColor="#6ea695" />
          </linearGradient>

          {/* Right Ear Outer */}
          <linearGradient id="rabbitEarRightGrad" x1="68" y1="6" x2="62" y2="44" gradientUnits="userSpaceOnUse">
            <stop stopColor="#c5e8dd" />
            <stop offset="0.6" stopColor="#a4d4c5" />
            <stop offset="1" stopColor="#6ea695" />
          </linearGradient>

          {/* Inner Ear Pink */}
          <linearGradient id="rabbitEarPinkGrad" x1="50" y1="12" x2="50" y2="38" gradientUnits="userSpaceOnUse">
            <stop stopColor="#ffb084" />
            <stop offset="0.5" stopColor="#ff85ad" />
            <stop offset="1" stopColor="#ff4d8b" />
          </linearGradient>
        </defs>

        {/* 1. Long Clay Ears */}
        {/* Left Ear */}
        <path
          d="M 32 8 C 24 8, 22 28, 30 46 C 36 46, 42 42, 40 32 C 38 18, 38 8, 32 8 Z"
          fill="url(#rabbitEarLeftGrad)"
          filter="drop-shadow(0 2px 4px rgba(10,26,26,0.18))"
        />
        <path
          d="M 33 13 C 28 13, 27 26, 32 38 C 35 38, 37 34, 36 28 C 36 18, 36 13, 33 13 Z"
          fill="url(#rabbitEarPinkGrad)"
        />

        {/* Right Ear - Slightly tilted cute clay angle */}
        <path
          d="M 68 8 C 76 8, 78 28, 70 46 C 64 46, 58 42, 60 32 C 62 18, 62 8, 68 8 Z"
          fill="url(#rabbitEarRightGrad)"
          filter="drop-shadow(0 2px 4px rgba(10,26,26,0.18))"
        />
        <path
          d="M 67 13 C 72 13, 73 26, 68 38 C 65 38, 63 34, 64 28 C 64 18, 64 13, 67 13 Z"
          fill="url(#rabbitEarPinkGrad)"
        />

        {/* 2. Rabbit Head Base */}
        <circle
          cx="50"
          cy="60"
          r="26"
          fill="url(#rabbitFaceGrad)"
          filter="drop-shadow(0 4px 6px rgba(10,26,26,0.22))"
        />
        <ellipse cx="44" cy="48" rx="7" ry="3.5" fill="#ffffff" fillOpacity="0.35" />

        {/* 3. Cheerful Eyes */}
        <ellipse cx="38" cy="58" rx="4" ry="4.8" fill="#0a0a0a" />
        <circle cx="36.5" cy="56" r="1.6" fill="#ffffff" />
        <circle cx="39.2" cy="59.5" r="0.8" fill="#ffffff" />

        <ellipse cx="62" cy="58" rx="4" ry="4.8" fill="#0a0a0a" />
        <circle cx="60.5" cy="56" r="1.6" fill="#ffffff" />
        <circle cx="63.2" cy="59.5" r="0.8" fill="#ffffff" />

        {/* 4. Soft Blushed Cheeks */}
        <ellipse cx="30" cy="67" rx="4.5" ry="2.8" fill="#ff4d8b" fillOpacity="0.4" />
        <ellipse cx="70" cy="67" rx="4.5" ry="2.8" fill="#ff4d8b" fillOpacity="0.4" />

        {/* 5. Snout & Cute Nose */}
        <ellipse cx="50" cy="68" rx="7" ry="5.5" fill="#fffaf0" />
        <ellipse cx="50" cy="66" rx="2.5" ry="1.8" fill="#ff4d8b" />

        {/* Mouth */}
        <path d="M 47 70 Q 50 71.5 53 70" stroke="#0a0a0a" strokeWidth="1.2" strokeLinecap="round" />
        <path d="M 50 67.8 L 50 70.8" stroke="#0a0a0a" strokeWidth="1.2" strokeLinecap="round" />

        {/* Whiskers */}
        <path d="M 26 69 L 17 68" stroke="#fffaf0" strokeWidth="1.6" strokeLinecap="round" />
        <path d="M 27 72 L 18 73" stroke="#fffaf0" strokeWidth="1.6" strokeLinecap="round" />
        <path d="M 74 69 L 83 68" stroke="#fffaf0" strokeWidth="1.6" strokeLinecap="round" />
        <path d="M 73 72 L 82 73" stroke="#fffaf0" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
    </div>
  );
};

export default RabbitLogo;
