import React from 'react';

/**
 * Authentic UPS Shield Emblem Vector Component
 * Uses official UPS Dark Brown (#351C15) and Vibrant Gold/Yellow (#FFB500 / #EAB308)
 * Perfectly proportioned and centered so 'u', 'p', and 's' sit symmetrically within the shield margins.
 */
export const UPSLogo = ({ className = "w-10 h-10", withGlow = true }) => {
  return (
    <div className={`relative inline-flex items-center justify-center ${className}`}>
      {withGlow && (
        <div className="absolute inset-0 rounded-2xl bg-amber-500/20 blur-md -z-10" />
      )}
      <svg
        viewBox="0 0 100 120"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full drop-shadow-md overflow-visible select-none"
      >
        <defs>
          {/* Authentic UPS Dark Brown Gradient */}
          <linearGradient id="upsBrownGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#4A2617" />
            <stop offset="45%" stopColor="#351C15" />
            <stop offset="100%" stopColor="#1E0E0A" />
          </linearGradient>

          {/* Authentic UPS Gold Gradient */}
          <linearGradient id="upsGoldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFE066" />
            <stop offset="35%" stopColor="#FFB500" />
            <stop offset="85%" stopColor="#E69500" />
            <stop offset="100%" stopColor="#C97A00" />
          </linearGradient>

          {/* Shield Specular Highlight */}
          <linearGradient id="upsShieldShine" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.25" />
            <stop offset="60%" stopColor="#FFFFFF" stopOpacity="0.0" />
          </linearGradient>

          {/* Drop shadow for shield depth */}
          <filter id="shieldShadow" x="-10%" y="-10%" width="120%" height="125%">
            <feDropShadow dx="0" dy="2" stdDeviation="2" floodOpacity="0.35" />
          </filter>
        </defs>

        {/* Outer Gold Shield Border */}
        <path
          d="M 50 4
             C 74 4, 95 10, 96 26
             C 97 54, 88 92, 50 116
             C 12 92, 3 54, 4 26
             C 5 10, 26 4, 50 4 Z"
          fill="url(#upsGoldGrad)"
          filter="url(#shieldShadow)"
        />

        {/* Inner Dark Brown Shield Body */}
        <path
          d="M 50 8
             C 71 8, 90 13.5, 91 28
             C 92 53, 83 89, 50 111
             C 17 89, 8 53, 9 28
             C 10 13.5, 29 8, 50 8 Z"
          fill="url(#upsBrownGrad)"
        />

        {/* Shield Specular Highlights for rich 3D luster */}
        <path
          d="M 50 9
             C 68 9, 86 14, 88 28
             C 89 42, 85 64, 72 82
             C 60 62, 45 35, 50 9 Z"
          fill="url(#upsShieldShine)"
        />

        {/* Iconic "ups" Lettermark — Centered between x=22 and x=78 */}
        <g fill="url(#upsGoldGrad)">
          {/* 'u' letter: x=21 to x=37 */}
          <path
            d="M 21 44
               L 26 44
               L 26 59
               C 26 63.5, 28 65, 31 65
               C 34 65, 36 63.5, 36 59
               L 36 44
               L 41 44
               L 41 59
               C 41 66.5, 37 69.5, 31 69.5
               C 25 69.5, 21 66.5, 21 59
               Z"
          />

          {/* 'p' letter: x=43 to x=59 */}
          <path
            d="M 43 44
               L 48 44
               L 48 48.5
               C 49.5 45.5, 52.5 43.5, 56 43.5
               C 61 43.5, 64 47.5, 64 56.5
               C 64 65.5, 61 69.5, 56 69.5
               C 52.5 69.5, 49.5 67.5, 48 64.5
               L 48 76
               L 43 76
               Z
               M 48 56.5
               C 48 62, 50 65, 53.5 65
               C 57 65, 59 62, 59 56.5
               C 59 51, 57 48, 53.5 48
               C 50 48, 48 51, 48 56.5
               Z"
          />

          {/* 's' letter: x=63 to x=79 (now fits well within x=91 shield boundary) */}
          <path
            d="M 64.5 64.5
               L 68 62.5
               C 69 64, 71 65.5, 73.5 65.5
               C 76 65.5, 77.5 64.5, 77.5 62.8
               C 77.5 58, 65 59.5, 65 50.5
               C 65 46.5, 68.5 43.5, 73.5 43.5
               C 76.5 43.5, 79 44.8, 80.5 46.8
               L 77.2 49
               C 76 47.8, 74.8 47.2, 73.5 47.2
               C 71 47.2, 69.8 48.2, 69.8 49.8
               C 69.8 54.2, 82.5 52.5, 82.5 62.5
               C 82.5 67, 79 69.5, 73.5 69.5
               C 69.5 69.5, 66.2 67.8, 64.5 64.5
               Z"
          />
        </g>
      </svg>
    </div>
  );
};

export default UPSLogo;
