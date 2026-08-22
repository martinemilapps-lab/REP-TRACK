'use client';

import React, { useId } from 'react';

interface CapsuleProps {
  color?: string;
  width?: number;
  height?: number;
  className?: string;
  style?: React.CSSProperties;
}

function MedicalCapsule({
  color = '#F5A623',
  width = 105,
  height = 38,
  style = {},
  className = '',
}: CapsuleProps) {
  const generatedId = useId();
  const safeId = `cap-${generatedId.replace(/[^a-zA-Z0-9]/g, '')}`;
  const radius = height / 2;
  const halfWidth = width / 2;

  return (
    <div
      className={`absolute select-none pointer-events-none drop-shadow-md transition-transform ${className}`}
      style={{
        width,
        height,
        willChange: 'transform',
        transform: 'translate3d(0,0,0)',
        backfaceVisibility: 'hidden',
        WebkitBackfaceVisibility: 'hidden',
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
        style={{
          shapeRendering: 'geometricPrecision',
          textRendering: 'geometricPrecision',
        }}
      >
        <defs>
          {/* Primary Color Half Gradient */}
          <linearGradient id={`capsuleGrad-${safeId}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={color} stopOpacity="0.9" />
            <stop offset="70%" stopColor={color} stopOpacity="0.8" />
            <stop offset="100%" stopColor="#C27803" stopOpacity="0.75" />
          </linearGradient>

          {/* Crisp Pure White Half Gradient */}
          <linearGradient id={`whiteHalfGrad-${safeId}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.95" />
            <stop offset="70%" stopColor="#F9FAFB" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#E5E7EB" stopOpacity="0.8" />
          </linearGradient>

          {/* Gloss Top Specular Highlight */}
          <linearGradient id={`glossGrad-${safeId}`} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.75" />
            <stop offset="50%" stopColor="#FFFFFF" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0.65" />
          </linearGradient>

          {/* Bottom Ambient Shadow */}
          <linearGradient id={`bottomShadowGrad-${safeId}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="transparent" />
            <stop offset="100%" stopColor="rgba(0,0,0,0.1)" />
          </linearGradient>
        </defs>

        {/* Pill Outer Shell */}
        <rect
          x="1"
          y="1"
          width={width - 2}
          height={height - 2}
          rx={radius - 1}
          fill="none"
          stroke="#E2E2D8"
          strokeWidth="1.5"
        />

        {/* Left Colored Half */}
        <path
          d={`M ${radius} 1.5 
              L ${halfWidth} 1.5 
              L ${halfWidth} ${height - 1.5} 
              L ${radius} ${height - 1.5} 
              A ${radius - 1.5} ${radius - 1.5} 0 0 1 ${radius} 1.5 Z`}
          fill={`url(#capsuleGrad-${safeId})`}
        />

        {/* Right White Half */}
        <path
          d={`M ${halfWidth} 1.5 
              L ${width - radius} 1.5 
              A ${radius - 1.5} ${radius - 1.5} 0 0 1 ${width - radius} ${height - 1.5} 
              L ${halfWidth} ${height - 1.5} Z`}
          fill={`url(#whiteHalfGrad-${safeId})`}
        />

        {/* Bottom Ambient Soft Shadow */}
        <rect
          x="1"
          y="1"
          width={width - 2}
          height={height - 2}
          rx={radius - 1}
          fill={`url(#bottomShadowGrad-${safeId})`}
        />

        {/* Center Divider Groove Line */}
        <line
          x1={halfWidth}
          y1="1.5"
          x2={halfWidth}
          y2={height - 1.5}
          stroke="#CBD5E1"
          strokeWidth="1.5"
        />

        {/* Gloss Top Specular Highlight */}
        <rect
          x={radius * 0.7}
          y={height * 0.16}
          width={width - radius * 1.4}
          height={height * 0.22}
          rx={height * 0.11}
          fill={`url(#glossGrad-${safeId})`}
        />
      </svg>
    </div>
  );
}

export function MedicalBackground() {
  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 pointer-events-none overflow-hidden z-0 select-none"
      style={{
        transform: 'translate3d(0,0,0)',
        WebkitTransform: 'translate3d(0,0,0)',
      }}
    >
      {/* Ambient Gradient Glow Spheres */}
      <div className="absolute -top-24 -end-24 w-[460px] h-[460px] bg-gradient-to-br from-[#FDE68A] via-[#FEF3C7] to-transparent rounded-full blur-3xl opacity-60 pointer-events-none" />
      <div className="absolute top-1/3 -start-32 w-[400px] h-[400px] bg-gradient-to-tr from-[#FFFBEB] via-[#FEF3C7] to-transparent rounded-full blur-3xl opacity-50 pointer-events-none" />
      <div className="absolute -bottom-24 end-1/3 w-[460px] h-[460px] bg-gradient-to-tl from-[#FDE68A] to-transparent rounded-full blur-3xl opacity-45 pointer-events-none" />

      {/* Floating Medical Capsules (Exact same 7 capsules across all screen sizes) */}

      {/* Capsule 1: Top-Left (Smooth Float 1) */}
      <MedicalCapsule
        color="#F5A623"
        width={115}
        height={40}
        className="animate-capsule-smooth-1 opacity-80"
        style={{ top: '7%', left: '5%' }}
      />

      {/* Capsule 2: Top-Right (Smooth Float 2) */}
      <MedicalCapsule
        color="#E59819"
        width={100}
        height={35}
        className="animate-capsule-smooth-2 opacity-75"
        style={{ top: '12%', right: '7%' }}
      />

      {/* Capsule 3: Mid-Left (Smooth Float 3) */}
      <MedicalCapsule
        color="#D97706"
        width={108}
        height={38}
        className="animate-capsule-smooth-3 opacity-80"
        style={{ top: '44%', left: '3%' }}
      />

      {/* Capsule 4: Mid-Right (Smooth Float 4) */}
      <MedicalCapsule
        color="#F59E0B"
        width={120}
        height={42}
        className="animate-capsule-smooth-4 opacity-80"
        style={{ top: '48%', right: '4%' }}
      />

      {/* Capsule 5: Upper-Center Drift (Smooth Float 5) */}
      <MedicalCapsule
        color="#F5A623"
        width={90}
        height={32}
        className="animate-capsule-smooth-5 opacity-70"
        style={{ top: '24%', right: '30%' }}
      />

      {/* Capsule 6: Lower-Left Zone (Smooth Float 6) */}
      <MedicalCapsule
        color="#C27803"
        width={105}
        height={36}
        className="animate-capsule-smooth-6 opacity-75"
        style={{ bottom: '14%', left: '8%' }}
      />

      {/* Capsule 7: Bottom-Right Corner (Smooth Float 1) */}
      <MedicalCapsule
        color="#E59819"
        width={110}
        height={38}
        className="animate-capsule-smooth-1 opacity-80"
        style={{ bottom: '9%', right: '11%' }}
      />

      {/* Dynamic Animated Medical Cross / Plus Signs */}
      <div
        className="absolute text-[var(--gold)] text-2xl font-black animate-cross-smooth select-none"
        style={{ top: '18%', left: '16%', animationDelay: '0s' }}
      >
        ✚
      </div>
      <div
        className="absolute text-[var(--gold-light)] text-xl font-black animate-cross-smooth select-none"
        style={{ top: '32%', right: '18%', animationDelay: '2s' }}
      >
        ✚
      </div>
      <div
        className="absolute text-[var(--gold-dark)] text-lg font-bold animate-cross-smooth select-none"
        style={{ bottom: '28%', left: '22%', animationDelay: '4s' }}
      >
        ✚
      </div>
      <div
        className="absolute text-[var(--gold)] text-xl font-black animate-cross-smooth select-none"
        style={{ bottom: '34%', right: '15%', animationDelay: '6s' }}
      >
        ✚
      </div>
    </div>
  );
}
