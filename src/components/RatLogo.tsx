import React from 'react';

interface RatLogoProps {
  size?: number;
  className?: string;
  withGlow?: boolean;
}

/**
 * RatLogo — Símbolo del Año de la Rata (鼠)
 * Esculpido en arcilla 3D táctil con lavanda y peach, estética Clay pura (GEMINI.md).
 */
export const RatLogo: React.FC<RatLogoProps> = ({
  size = 36,
  className = '',
  withGlow = true,
}) => {
  return (
    <div
      className={`rat-logo-container ${className}`}
      style={{
        width: size,
        height: size,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        filter: withGlow ? 'drop-shadow(0 4px 10px rgba(184, 164, 237, 0.4))' : undefined,
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
          {/* Head Lavender Radial */}
          <radialGradient id="ratFaceGrad" cx="50" cy="54" r="30" gradientUnits="userSpaceOnUse">
            <stop stopColor="#dcd0fc" />
            <stop offset="0.5" stopColor="#b8a4ed" />
            <stop offset="0.85" stopColor="#967edb" />
            <stop offset="1" stopColor="#6e55ba" />
          </radialGradient>

          {/* Ear Left Gradient */}
          <radialGradient id="ratEarLeftGrad" cx="24" cy="24" r="18" gradientUnits="userSpaceOnUse">
            <stop stopColor="#ffcbb0" />
            <stop offset="0.6" stopColor="#ffb084" />
            <stop offset="1" stopColor="#e08553" />
          </radialGradient>

          {/* Ear Right Gradient */}
          <radialGradient id="ratEarRightGrad" cx="76" cy="24" r="18" gradientUnits="userSpaceOnUse">
            <stop stopColor="#ffcbb0" />
            <stop offset="0.6" stopColor="#ffb084" />
            <stop offset="1" stopColor="#e08553" />
          </radialGradient>

          {/* Snout Cream Gradient */}
          <linearGradient id="ratSnoutGrad" x1="50" y1="58" x2="50" y2="76" gradientUnits="userSpaceOnUse">
            <stop stopColor="#fffaf0" />
            <stop offset="0.7" stopColor="#f5f0e0" />
            <stop offset="1" stopColor="#ebe6d6" />
          </linearGradient>
        </defs>

        {/* 1. Big Clay Ears Outer */}
        <circle
          cx="26"
          cy="28"
          r="18"
          fill="#b8a4ed"
          filter="drop-shadow(0 3px 5px rgba(10,26,26,0.18))"
        />
        <circle cx="26" cy="28" r="12" fill="url(#ratEarLeftGrad)" />
        <ellipse cx="23" cy="23" rx="4" ry="2" fill="#ffffff" fillOpacity="0.4" />

        <circle
          cx="74"
          cy="28"
          r="18"
          fill="#b8a4ed"
          filter="drop-shadow(0 3px 5px rgba(10,26,26,0.18))"
        />
        <circle cx="74" cy="28" r="12" fill="url(#ratEarRightGrad)" />
        <ellipse cx="71" cy="23" rx="4" ry="2" fill="#ffffff" fillOpacity="0.4" />

        {/* 2. Rat Head Base */}
        <path
          d="M 28 46 C 24 64, 34 82, 50 84 C 66 82, 76 64, 72 46 C 68 34, 32 34, 28 46 Z"
          fill="url(#ratFaceGrad)"
          filter="drop-shadow(0 4px 6px rgba(10,26,26,0.22))"
        />
        <ellipse cx="43" cy="40" rx="8" ry="4" fill="#ffffff" fillOpacity="0.3" />

        {/* 3. Curious Sparkling Eyes */}
        <ellipse cx="38" cy="52" rx="4.5" ry="5" fill="#0a0a0a" />
        <ellipse cx="36.5" cy="50" rx="1.8" ry="1.8" fill="#ffffff" />
        <circle cx="39.5" cy="54" r="0.8" fill="#ffffff" />

        <ellipse cx="62" cy="52" rx="4.5" ry="5" fill="#0a0a0a" />
        <ellipse cx="60.5" cy="50" rx="1.8" ry="1.8" fill="#ffffff" />
        <circle cx="63.5" cy="54" r="0.8" fill="#ffffff" />

        {/* 4. Rosy Cheeks */}
        <ellipse cx="30" cy="62" rx="4" ry="2.5" fill="#ffb084" fillOpacity="0.5" />
        <ellipse cx="70" cy="62" rx="4" ry="2.5" fill="#ffb084" fillOpacity="0.5" />

        {/* 5. Whiskers */}
        <path d="M 22 64 Q 12 62 8 60" stroke="#ffb084" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M 22 68 Q 12 69 8 72" stroke="#ffb084" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M 78 64 Q 88 62 92 60" stroke="#ffb084" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M 78 68 Q 88 69 92 72" stroke="#ffb084" strokeWidth="1.5" strokeLinecap="round" />

        {/* 6. Clay Snout & Button Nose */}
        <ellipse cx="50" cy="66" rx="9" ry="7" fill="url(#ratSnoutGrad)" />
        <ellipse cx="50" cy="63" rx="3" ry="2.2" fill="#ff4d8b" />
        <ellipse cx="49" cy="62.2" rx="1" ry="0.6" fill="#ffffff" />

        {/* 7. Cute Buck Teeth / Smile */}
        <path d="M 48 70 Q 50 71.5 52 70" stroke="#0a0a0a" strokeWidth="1.2" strokeLinecap="round" />
        <rect x="48.5" y="71" width="3" height="3.5" rx="1" fill="#ffffff" stroke="#ebe6d6" strokeWidth="0.8" />
        <line x1="50" y1="71" x2="50" y2="74.5" stroke="#ebe6d6" strokeWidth="0.8" />
      </svg>
    </div>
  );
};

export default RatLogo;
