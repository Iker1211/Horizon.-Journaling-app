import React from 'react';

interface PigLogoProps {
  size?: number;
  className?: string;
  withGlow?: boolean;
}

/**
 * PigLogo — Símbolo del Año del Cerdo (猪)
 * Esculpido en arcilla 3D táctil con hocico prominente y tonos brand pink y peach (GEMINI.md).
 */
export const PigLogo: React.FC<PigLogoProps> = ({
  size = 36,
  className = '',
  withGlow = true,
}) => {
  return (
    <div
      className={`pig-logo-container ${className}`}
      style={{
        width: size,
        height: size,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        filter: withGlow ? 'drop-shadow(0 4px 10px rgba(255, 77, 139, 0.4))' : undefined,
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
          {/* Head Pink Clay Gradient */}
          <radialGradient id="pigHeadGrad" cx="50" cy="50" r="32" gradientUnits="userSpaceOnUse">
            <stop stopColor="#ffb0c8" />
            <stop offset="0.5" stopColor="#ff6e9d" />
            <stop offset="0.85" stopColor="#ff4d8b" />
            <stop offset="1" stopColor="#d92966" />
          </radialGradient>

          {/* Snout Gradient */}
          <radialGradient id="pigSnoutGrad" cx="50" cy="62" r="14" gradientUnits="userSpaceOnUse">
            <stop stopColor="#ffd4e2" />
            <stop offset="0.6" stopColor="#ff85ad" />
            <stop offset="1" stopColor="#ff4d8b" />
          </radialGradient>

          {/* Ear Left Gradient */}
          <linearGradient id="pigEarLeftGrad" x1="24" y1="16" x2="34" y2="40" gradientUnits="userSpaceOnUse">
            <stop stopColor="#ff85ad" />
            <stop offset="0.6" stopColor="#ff4d8b" />
            <stop offset="1" stopColor="#b82758" />
          </linearGradient>

          {/* Ear Right Gradient */}
          <linearGradient id="pigEarRightGrad" x1="76" y1="16" x2="66" y2="40" gradientUnits="userSpaceOnUse">
            <stop stopColor="#ff85ad" />
            <stop offset="0.6" stopColor="#ff4d8b" />
            <stop offset="1" stopColor="#b82758" />
          </linearGradient>
        </defs>

        {/* 1. Folded Triangular Clay Ears */}
        {/* Left ear */}
        <path
          d="M 32 36 C 20 22, 22 14, 30 18 C 36 20, 42 28, 40 38 Z"
          fill="url(#pigEarLeftGrad)"
          filter="drop-shadow(0 2px 3px rgba(10,26,26,0.18))"
        />
        <path d="M 28 20 C 32 24, 36 28, 35 34" stroke="#ffd4e2" strokeWidth="1.2" strokeLinecap="round" />

        {/* Right ear */}
        <path
          d="M 68 36 C 80 22, 78 14, 70 18 C 64 20, 58 28, 60 38 Z"
          fill="url(#pigEarRightGrad)"
          filter="drop-shadow(0 2px 3px rgba(10,26,26,0.18))"
        />
        <path d="M 72 20 C 68 24, 64 28, 65 34" stroke="#ffd4e2" strokeWidth="1.2" strokeLinecap="round" />

        {/* 2. Round Pig Head Base */}
        <circle
          cx="50"
          cy="52"
          r="28"
          fill="url(#pigHeadGrad)"
          filter="drop-shadow(0 4px 6px rgba(10,26,26,0.22))"
        />
        <ellipse cx="44" cy="40" rx="7" ry="3.5" fill="#ffffff" fillOpacity="0.35" />

        {/* 3. Cheerful Eyes */}
        <ellipse cx="38" cy="48" rx="4" ry="4.5" fill="#0a0a0a" />
        <circle cx="36.5" cy="46" r="1.5" fill="#ffffff" />
        <circle cx="39.2" cy="49" r="0.8" fill="#ffffff" />

        <ellipse cx="62" cy="48" rx="4" ry="4.5" fill="#0a0a0a" />
        <circle cx="60.5" cy="46" r="1.5" fill="#ffffff" />
        <circle cx="63.2" cy="49" r="0.8" fill="#ffffff" />

        {/* 4. Rosy Cheeks */}
        <ellipse cx="28" cy="56" rx="4.5" ry="3" fill="#ffb084" fillOpacity="0.6" />
        <ellipse cx="72" cy="56" rx="4.5" ry="3" fill="#ffb084" fillOpacity="0.6" />

        {/* 5. Prominent Clay Snout */}
        <ellipse
          cx="50"
          cy="63"
          rx="13"
          ry="9.5"
          fill="url(#pigSnoutGrad)"
          filter="drop-shadow(0 2px 4px rgba(10,26,26,0.18))"
        />
        <ellipse cx="50" cy="57" rx="8" ry="2" fill="#ffffff" fillOpacity="0.45" />

        {/* Nostrils */}
        <ellipse cx="45" cy="63" rx="2.5" ry="3.5" fill="#0a0a0a" />
        <ellipse cx="44.2" cy="62" rx="0.8" ry="1.2" fill="#ffffff" fillOpacity="0.4" />

        <ellipse cx="55" cy="63" rx="2.5" ry="3.5" fill="#0a0a0a" />
        <ellipse cx="54.2" cy="62" rx="0.8" ry="1.2" fill="#ffffff" fillOpacity="0.4" />

        {/* Sweet Smile underneath */}
        <path d="M 44 75 Q 50 78 56 75" stroke="#0a0a0a" strokeWidth="1.5" strokeLinecap="round" fill="none" />
      </svg>
    </div>
  );
};

export default PigLogo;
