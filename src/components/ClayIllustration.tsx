import React from 'react';

interface ClayIllustrationProps {
  type: 'mountain' | 'hourglass' | 'mascot' | 'stack' | 'target';
  size?: number;
  className?: string;
}

export const ClayIllustration: React.FC<ClayIllustrationProps> = ({
  type,
  size = 200,
  className = '',
}) => {
  if (type === 'mountain') {
    return (
      <svg
        width={size}
        height={size * 0.75}
        viewBox="0 0 320 240"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={`clay-illustration ${className}`}
        style={{ filter: 'drop-shadow(0 12px 20px rgba(10, 26, 26, 0.12))' }}
      >
        <defs>
          {/* Gradients for 3D clay look */}
          <linearGradient id="skyGlow" x1="160" y1="0" x2="160" y2="240" gradientUnits="userSpaceOnUse">
            <stop stopColor="#ffb084" stopOpacity="0.25" />
            <stop offset="1" stopColor="#fffaf0" stopOpacity="0" />
          </linearGradient>

          <linearGradient id="mountainBack" x1="60" y1="60" x2="180" y2="220" gradientUnits="userSpaceOnUse">
            <stop stopColor="#b8a4ed" />
            <stop offset="0.6" stopColor="#9880d8" />
            <stop offset="1" stopColor="#674ea7" />
          </linearGradient>

          <linearGradient id="mountainFront" x1="150" y1="40" x2="280" y2="230" gradientUnits="userSpaceOnUse">
            <stop stopColor="#1a3a3a" />
            <stop offset="0.5" stopColor="#2c5c5c" />
            <stop offset="1" stopColor="#0d1e1e" />
          </linearGradient>

          <linearGradient id="snowCap" x1="200" y1="40" x2="200" y2="100" gradientUnits="userSpaceOnUse">
            <stop stopColor="#ffffff" />
            <stop offset="1" stopColor="#faf5e8" />
          </linearGradient>

          <linearGradient id="sunOrb" x1="70" y1="30" x2="110" y2="70" gradientUnits="userSpaceOnUse">
            <stop stopColor="#ffb084" />
            <stop offset="0.6" stopColor="#ff6b5a" />
            <stop offset="1" stopColor="#e8b94a" />
          </linearGradient>

          <linearGradient id="cloudGrad" x1="180" y1="120" x2="260" y2="150" gradientUnits="userSpaceOnUse">
            <stop stopColor="#ffffff" />
            <stop offset="1" stopColor="#f5f0e0" />
          </linearGradient>
        </defs>

        {/* Ambient Sky Aura */}
        <circle cx="90" cy="50" r="45" fill="url(#sunOrb)" />
        <circle cx="82" cy="42" r="14" fill="#ffffff" fillOpacity="0.4" filter="blur(2px)" />

        {/* Background Mountain (Purple Clay) */}
        <path
          d="M40 220 L110 90 Q120 72 135 90 L210 220 Z"
          fill="url(#mountainBack)"
        />
        {/* Ridge shadow */}
        <path
          d="M125 80 Q130 110 135 150 Q140 180 145 220 L210 220 L135 90 Z"
          fill="#533c8c"
          fillOpacity="0.35"
        />

        {/* Foreground Mountain (Teal Clay Summit) */}
        <path
          d="M120 220 L200 45 Q212 25 224 45 L305 220 Z"
          fill="url(#mountainFront)"
        />
        {/* Mountain Highlight Surface */}
        <path
          d="M200 45 Q212 25 224 45 L215 140 Q210 180 200 220 L120 220 Z"
          fill="#ffffff"
          fillOpacity="0.12"
        />

        {/* Snow Peak / 2027 Target Summit */}
        <path
          d="M192 60 Q212 25 232 60 Q225 78 217 72 Q208 82 201 70 Z"
          fill="url(#snowCap)"
          filter="drop-shadow(0 2px 4px rgba(0,0,0,0.15))"
        />

        {/* 2027 Flag at the Summit */}
        <line x1="212" y1="28" x2="212" y2="8" stroke="#0a0a0a" strokeWidth="3" strokeLinecap="round" />
        <path
          d="M213 9 L242 16 L213 23 Z"
          fill="#ff6b5a"
        />
        <circle cx="212" cy="7" r="3" fill="#e8b94a" />

        {/* Tactile Clay Floating Cloud */}
        <g className="clay-float-slow">
          <ellipse cx="65" cy="140" rx="35" ry="16" fill="url(#cloudGrad)" filter="drop-shadow(0 4px 6px rgba(10,26,26,0.08))" />
          <circle cx="55" cy="132" r="15" fill="#ffffff" />
          <circle cx="75" cy="135" r="12" fill="#ffffff" />
          {/* Cloud highlight */}
          <ellipse cx="60" cy="128" rx="8" ry="4" fill="#ffffff" fillOpacity="0.8" />
        </g>

        {/* Another cloud drifting */}
        <g className="clay-float-alt">
          <ellipse cx="250" cy="165" rx="30" ry="14" fill="url(#cloudGrad)" filter="drop-shadow(0 4px 6px rgba(10,26,26,0.08))" />
          <circle cx="242" cy="158" r="13" fill="#ffffff" />
          <circle cx="258" cy="160" r="10" fill="#ffffff" />
        </g>
      </svg>
    );
  }

  if (type === 'hourglass') {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 200 200"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={`clay-illustration ${className}`}
        style={{ filter: 'drop-shadow(0 8px 16px rgba(10, 26, 26, 0.1))' }}
      >
        <defs>
          <linearGradient id="hgGlass" x1="100" y1="20" x2="100" y2="180" gradientUnits="userSpaceOnUse">
            <stop stopColor="#a4d4c5" stopOpacity="0.4" />
            <stop offset="0.5" stopColor="#fffaf0" stopOpacity="0.1" />
            <stop offset="1" stopColor="#b8a4ed" stopOpacity="0.4" />
          </linearGradient>
          <linearGradient id="hgBase" x1="60" y1="15" x2="140" y2="35" gradientUnits="userSpaceOnUse">
            <stop stopColor="#1a3a3a" />
            <stop offset="1" stopColor="#0a1a1a" />
          </linearGradient>
          <linearGradient id="sandGold" x1="100" y1="80" x2="100" y2="165" gradientUnits="userSpaceOnUse">
            <stop stopColor="#f6d888" />
            <stop offset="0.7" stopColor="#e8b94a" />
            <stop offset="1" stopColor="#cb9c2f" />
          </linearGradient>
        </defs>

        {/* Top & Bottom Caps */}
        <rect x="55" y="20" width="90" height="14" rx="7" fill="url(#hgBase)" />
        <rect x="55" y="166" width="90" height="14" rx="7" fill="url(#hgBase)" />

        {/* Glass Bulb Body */}
        <path
          d="M68 34 C68 75, 92 90, 97 100 C92 110, 68 125, 68 166 L132 166 C132 125, 108 110, 103 100 C108 90, 132 75, 132 34 Z"
          fill="url(#hgGlass)"
          stroke="#e5e5e5"
          strokeWidth="3"
        />

        {/* Upper Sand (Draining) */}
        <path
          d="M74 58 Q100 70 126 58 C124 75 110 88 100 96 C90 88 76 75 74 58 Z"
          fill="url(#sandGold)"
        />

        {/* Flowing trickle */}
        <line x1="100" y1="96" x2="100" y2="140" stroke="#e8b94a" strokeWidth="3" strokeDasharray="4 2" />

        {/* Lower Sand Pile (Accumulating) */}
        <path
          d="M72 165 C76 142 90 134 100 134 C110 134 124 142 128 165 Z"
          fill="url(#sandGold)"
        />

        {/* Glass reflection highlight */}
        <path
          d="M75 42 C74 56 78 72 82 82"
          stroke="#ffffff"
          strokeWidth="3"
          strokeLinecap="round"
          strokeOpacity="0.7"
        />
        <path
          d="M75 125 C74 138 78 152 82 160"
          stroke="#ffffff"
          strokeWidth="3"
          strokeLinecap="round"
          strokeOpacity="0.6"
        />
      </svg>
    );
  }

  if (type === 'mascot') {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 160 160"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={`clay-illustration clay-float-slow ${className}`}
        style={{ filter: 'drop-shadow(0 8px 16px rgba(10, 26, 26, 0.12))' }}
      >
        <defs>
          <linearGradient id="mascotBody" x1="50" y1="30" x2="110" y2="130" gradientUnits="userSpaceOnUse">
            <stop stopColor="#ffb084" />
            <stop offset="0.6" stopColor="#ff6b5a" />
            <stop offset="1" stopColor="#e04b39" />
          </linearGradient>
          <radialGradient id="mascotHighlight" cx="65" cy="55" r="30" gradientUnits="userSpaceOnUse">
            <stop stopColor="#ffffff" stopOpacity="0.5" />
            <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Claymation Creature Body (Soft blob) */}
        <path
          d="M40 75 C35 45, 60 30, 80 30 C105 30, 125 45, 120 75 C118 105, 108 128, 80 128 C52 128, 42 105, 40 75 Z"
          fill="url(#mascotBody)"
        />
        {/* Tactile Highlight */}
        <ellipse cx="68" cy="58" rx="22" ry="16" fill="url(#mascotHighlight)" />

        {/* Big Clay Eyes */}
        <circle cx="68" cy="68" r="8" fill="#0a0a0a" />
        <circle cx="66" cy="65" r="2.8" fill="#ffffff" />

        <circle cx="94" cy="68" r="8" fill="#0a0a0a" />
        <circle cx="92" cy="65" r="2.8" fill="#ffffff" />

        {/* Rosy Cheeks */}
        <ellipse cx="56" cy="78" rx="6" ry="4" fill="#ff6b5a" fillOpacity="0.6" />
        <ellipse cx="106" cy="78" rx="6" ry="4" fill="#ff6b5a" fillOpacity="0.6" />

        {/* Smiling Mouth */}
        <path
          d="M73 82 Q81 90 89 82"
          stroke="#0a0a0a"
          strokeWidth="3.5"
          strokeLinecap="round"
        />

        {/* Small Clay Feet */}
        <ellipse cx="62" cy="128" rx="12" ry="7" fill="#cb9c2f" />
        <ellipse cx="98" cy="128" rx="12" ry="7" fill="#cb9c2f" />

        {/* Antennas / Sparkle on Head */}
        <circle cx="80" cy="22" r="5" fill="#e8b94a" />
        <line x1="80" y1="24" x2="80" y2="30" stroke="#0a0a0a" strokeWidth="2.5" />
      </svg>
    );
  }

  // Fallback / Stack representation
  return (
    <div className={`clay-stack-container ${className}`} style={{ width: size, height: size * 0.75 }}>
      <div className="clay-orb clay-orb-pink" style={{ width: 44, height: 44 }} />
      <div className="clay-orb clay-orb-teal" style={{ width: 38, height: 38, marginLeft: -12 }} />
      <div className="clay-orb clay-orb-ochre" style={{ width: 48, height: 48, marginLeft: -12 }} />
    </div>
  );
};
