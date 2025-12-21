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

      {/* Vision UI Aurora orbs - Intensified neon colors */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {/* Primary neon cyan orb - top left */}
        <div
          className="absolute -left-[20%] -top-[20%] h-[60%] w-[60%] rounded-full opacity-40"
          style={{
            background: 'radial-gradient(circle, oklch(0.72 0.24 210 / 70%) 0%, transparent 70%)',
            filter: 'blur(100px)',
            animation: 'aurora-float 20s ease-in-out infinite',
          }}
        />

        {/* Violet orb - top right */}
        <div
          className="absolute -right-[15%] -top-[10%] h-[50%] w-[50%] rounded-full opacity-35"
          style={{
            background: 'radial-gradient(circle, oklch(0.68 0.28 285 / 70%) 0%, transparent 70%)',
            filter: 'blur(100px)',
            animation: 'aurora-float 25s ease-in-out infinite reverse',
            animationDelay: '-5s',
          }}
        />

        {/* Magenta orb - bottom center */}
        <div
          className="absolute -bottom-[20%] left-[20%] h-[55%] w-[55%] rounded-full opacity-30"
          style={{
            background: 'radial-gradient(circle, oklch(0.70 0.30 320 / 60%) 0%, transparent 70%)',
            filter: 'blur(120px)',
            animation: 'aurora-float 22s ease-in-out infinite',
            animationDelay: '-10s',
          }}
        />

        {/* Purple orb - center right */}
        <div
          className="absolute -right-[10%] top-[30%] h-[45%] w-[45%] rounded-full opacity-30"
          style={{
            background: 'radial-gradient(circle, oklch(0.65 0.30 300 / 60%) 0%, transparent 70%)',
            filter: 'blur(110px)',
            animation: 'aurora-float 18s ease-in-out infinite reverse',
            animationDelay: '-8s',
          }}
        />

        {/* Teal orb - bottom left */}
        <div
          className="absolute -bottom-[10%] -left-[10%] h-[40%] w-[40%] rounded-full opacity-35"
          style={{
            background: 'radial-gradient(circle, oklch(0.68 0.20 190 / 60%) 0%, transparent 70%)',
            filter: 'blur(90px)',
            animation: 'aurora-float 24s ease-in-out infinite',
            animationDelay: '-3s',
          }}
        />
      </div>

      {/* Vision UI Grid pattern overlay - Neon cyan lines */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.025]"
        style={{
          backgroundImage: `
            linear-gradient(oklch(0.72 0.24 210 / 30%) 1px, transparent 1px),
            linear-gradient(90deg, oklch(0.72 0.24 210 / 30%) 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px',
        }}
      />

      {/* Radial gradient overlay for depth - Vision UI purple-black */}
      {showRadialGradient && (
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background: 'radial-gradient(ellipse 80% 50% at 50% 0%, transparent 0%, oklch(0.09 0.02 270) 100%)',
          }}
        />
      )}

      {/* Content */}
      <div className="relative z-10">{children}</div>
    </div>
  );
}
