'use client';

import { cn } from '@/lib/utils';

interface AuroraBackgroundProps {
  className?: string;
  children?: React.ReactNode;
  showRadialGradient?: boolean;
}

export function AuroraBackground({
  className,
  children,
  showRadialGradient = true,
}: AuroraBackgroundProps) {
  return (
    <div className={cn('relative min-h-screen overflow-hidden', className)}>
      {/* Base gradient layer */}
      <div className="pointer-events-none absolute inset-0 bg-background" />

      {/* Aurora orbs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {/* Primary cyan orb - top left */}
        <div
          className="absolute -left-[20%] -top-[20%] h-[60%] w-[60%] rounded-full opacity-30"
          style={{
            background: 'radial-gradient(circle, oklch(0.75 0.18 195 / 60%) 0%, transparent 70%)',
            filter: 'blur(80px)',
            animation: 'aurora-float 20s ease-in-out infinite',
          }}
        />

        {/* Violet orb - top right */}
        <div
          className="absolute -right-[15%] -top-[10%] h-[50%] w-[50%] rounded-full opacity-25"
          style={{
            background: 'radial-gradient(circle, oklch(0.65 0.25 300 / 60%) 0%, transparent 70%)',
            filter: 'blur(80px)',
            animation: 'aurora-float 25s ease-in-out infinite reverse',
            animationDelay: '-5s',
          }}
        />

        {/* Magenta orb - bottom center */}
        <div
          className="absolute -bottom-[20%] left-[20%] h-[55%] w-[55%] rounded-full opacity-20"
          style={{
            background: 'radial-gradient(circle, oklch(0.70 0.25 330 / 50%) 0%, transparent 70%)',
            filter: 'blur(100px)',
            animation: 'aurora-float 22s ease-in-out infinite',
            animationDelay: '-10s',
          }}
        />

        {/* Indigo orb - center right */}
        <div
          className="absolute -right-[10%] top-[30%] h-[45%] w-[45%] rounded-full opacity-20"
          style={{
            background: 'radial-gradient(circle, oklch(0.60 0.22 270 / 50%) 0%, transparent 70%)',
            filter: 'blur(90px)',
            animation: 'aurora-float 18s ease-in-out infinite reverse',
            animationDelay: '-8s',
          }}
        />

        {/* Teal orb - bottom left */}
        <div
          className="absolute -bottom-[10%] -left-[10%] h-[40%] w-[40%] rounded-full opacity-25"
          style={{
            background: 'radial-gradient(circle, oklch(0.70 0.15 180 / 50%) 0%, transparent 70%)',
            filter: 'blur(70px)',
            animation: 'aurora-float 24s ease-in-out infinite',
            animationDelay: '-3s',
          }}
        />
      </div>

      {/* Grid pattern overlay */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.015]"
        style={{
          backgroundImage: `
            linear-gradient(oklch(1 0 0 / 50%) 1px, transparent 1px),
            linear-gradient(90deg, oklch(1 0 0 / 50%) 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px',
        }}
      />

      {/* Radial gradient overlay for depth */}
      {showRadialGradient && (
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background: 'radial-gradient(ellipse 80% 50% at 50% 0%, transparent 0%, oklch(0.13 0.02 280) 100%)',
          }}
        />
      )}

      {/* Content */}
      <div className="relative z-10">{children}</div>
    </div>
  );
}
