'use client';

import React from 'react';

interface CapsuleProps {
  color?: string;
  width?: number;
  height?: number;
  rotation?: number;
  className?: string;
  style?: React.CSSProperties;
}

function MedicalCapsule({
  color = '#F5A623',
  width = 90,
  height = 34,
  style = {},
  className = '',
}: CapsuleProps) {
  const radius = height / 2;
  const halfWidth = width / 2;

  return (
    <div
      className={`absolute select-none pointer-events-none drop-shadow-md transition-transform ${className}`}
      style={{
        width,
        height,
        ...style,
      }}
    >
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full"
      >
        <defs>
          {/* Colored Half Gradient */}
          <linearGradient id={`capsuleGrad-${color.replace('#', '')}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={color} stopOpacity="0.85" />
            <stop offset="100%" stopColor={color} stopOpacity="0.65" />
          </linearGradient>

          {/* White Half Gradient */}
          <linearGradient id="whiteHalfGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.95" />
            <stop offset="100%" stopColor="#F8F8F5" stopOpacity="0.75" />
          </linearGradient>

          {/* Gloss Reflection Highlight */}
          <linearGradient id="glossGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.6" />
            <stop offset="50%" stopColor="#FFFFFF" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0.5" />
          </linearGradient>
        </defs>

        {/* Pill Outer Shell with soft border */}
        <rect
          x="1"
          y="1"
          width={width - 2}
          height={height - 2}
          rx={radius - 1}
          fill="none"
          stroke="#E8E8E0"
          strokeWidth="1.5"
        />

        {/* Left / Top Colored Half */}
        <path
          d={`M ${radius} 1.5 
              L ${halfWidth} 1.5 
              L ${halfWidth} ${height - 1.5} 
              L ${radius} ${height - 1.5} 
              A ${radius - 1.5} ${radius - 1.5} 0 0 1 ${radius} 1.5 Z`}
          fill={`url(#capsuleGrad-${color.replace('#', '')})`}
        />

        {/* Right / Bottom White Half */}
        <path
          d={`M ${halfWidth} 1.5 
              L ${width - radius} 1.5 
              A ${radius - 1.5} ${radius - 1.5} 0 0 1 ${width - radius} ${height - 1.5} 
              L ${halfWidth} ${height - 1.5} Z`}
          fill="url(#whiteHalfGrad)"
        />

        {/* Center Divider Groove Line */}
        <line
          x1={halfWidth}
          y1="1.5"
          x2={halfWidth}
          y2={height - 1.5}
          stroke="#DCDCD4"
          strokeWidth="1.5"
        />

        {/* Gloss Top Specular Highlight */}
        <rect
          x={radius * 0.75}
          y={height * 0.18}
          width={width - radius * 1.5}
          height={height * 0.22}
          rx={height * 0.11}
          fill="url(#glossGrad)"
        />
      </svg>
    </div>
  );
}

export function MedicalBackground() {
  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 pointer-events-none overflow-hidden z-0 select-none opacity-90"
    >
      {/* Ambient Gradient Glows */}
      <div className="absolute -top-32 -end-32 w-96 h-96 bg-gradient-to-br from-[#FEF3C7] to-transparent rounded-full blur-3xl opacity-60 pointer-events-none" />
      <div className="absolute top-1/2 -start-32 w-80 h-80 bg-gradient-to-tr from-[#FFFBEB] to-transparent rounded-full blur-3xl opacity-50 pointer-events-none" />
      <div className="absolute -bottom-32 end-1/4 w-96 h-96 bg-gradient-to-tl from-[#FEF3C7] to-transparent rounded-full blur-3xl opacity-40 pointer-events-none" />

      {/* Floating Medical Capsules */}
      {/* Capsule 1 - Top Left Gold */}
      <MedicalCapsule
        color="#F5A623"
        width={105}
        height={38}
        className="animate-capsule-1 opacity-70"
        style={{ top: '8%', left: '5%' }}
      />

      {/* Capsule 2 - Top Right Amber */}
      <MedicalCapsule
        color="#E59819"
        width={85}
        height={30}
        className="animate-capsule-2 opacity-60"
        style={{ top: '14%', right: '7%' }}
      />

      {/* Capsule 3 - Center Left Soft Gold */}
      <MedicalCapsule
        color="#D97706"
        width={95}
        height={34}
        className="animate-capsule-3 opacity-65"
        style={{ top: '48%', left: '2%' }}
      />

      {/* Capsule 4 - Center Right Warm Amber */}
      <MedicalCapsule
        color="#F59E0B"
        width={110}
        height={40}
        className="animate-capsule-4 opacity-70"
        style={{ top: '55%', right: '4%' }}
      />

      {/* Capsule 5 - Bottom Left Gold */}
      <MedicalCapsule
        color="#F5A623"
        width={80}
        height={28}
        className="animate-capsule-2 opacity-55"
        style={{ bottom: '12%', left: '8%' }}
      />

      {/* Capsule 6 - Bottom Right Warm Amber */}
      <MedicalCapsule
        color="#C27803"
        width={90}
        height={32}
        className="animate-capsule-1 opacity-60"
        style={{ bottom: '8%', right: '12%' }}
      />

      {/* Medical Cross / Plus Accents Floating Delicately */}
      <div
        className="absolute text-[var(--gold)] text-2xl font-black animate-plus-float select-none"
        style={{ top: '22%', left: '18%', animationDelay: '0s' }}
      >
        ✚
      </div>
      <div
        className="absolute text-[var(--gold-light)] text-xl font-bold animate-plus-float select-none"
        style={{ top: '35%', right: '22%', animationDelay: '3s' }}
      >
        ✚
      </div>
      <div
        className="absolute text-[var(--gold-dark)] text-lg font-bold animate-plus-float select-none"
        style={{ bottom: '25%', left: '24%', animationDelay: '6s' }}
      >
        ✚
      </div>
      <div
        className="absolute text-[var(--gold)] text-xl font-black animate-plus-float select-none"
        style={{ bottom: '38%', right: '16%', animationDelay: '9s' }}
      >
        ✚
      </div>
    </div>
  );
}
