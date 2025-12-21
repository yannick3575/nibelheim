'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

/**
 * NoiseOverlay - Adds a subtle noise texture to any container
 * Uses SVG fractal noise for a grainy, futuristic feel
 */
interface NoiseOverlayProps {
  className?: string;
  opacity?: number;
}

export function NoiseOverlay({ className, opacity = 0.06 }: NoiseOverlayProps) {
  return (
    <div
      className={cn('noise absolute inset-0 pointer-events-none rounded-[inherit]', className)}
      style={{ opacity }}
    />
  );
}

/**
 * GridPattern - Adds a cyberpunk-style grid overlay
 * Customizable size and opacity
 */
interface GridPatternProps {
  className?: string;
  opacity?: number;
  size?: number;
}

export function GridPattern({
  className,
  opacity = 0.03,
  size = 50,
}: GridPatternProps) {
  return (
    <div
      className={cn('absolute inset-0 pointer-events-none rounded-[inherit]', className)}
      style={{
        opacity,
        backgroundImage: `
          linear-gradient(oklch(0.72 0.24 210 / 10%) 1px, transparent 1px),
          linear-gradient(90deg, oklch(0.72 0.24 210 / 10%) 1px, transparent 1px)
        `,
        backgroundSize: `${size}px ${size}px`,
      }}
    />
  );
}

/**
 * NeonBorderBox - A container with neon border and glow effects
 * Perfect for highlighting important content
 */
interface NeonBorderBoxProps {
  children: React.ReactNode;
  className?: string;
  color?: 'cyan' | 'violet' | 'magenta';
  withNoise?: boolean;
  withGrid?: boolean;
}

export function NeonBorderBox({
  children,
  className,
  color = 'cyan',
  withNoise = true,
  withGrid = false,
}: NeonBorderBoxProps) {
  const colorClasses = {
    cyan: 'neon-border neon-glow',
    violet: 'neon-border-violet neon-glow-violet',
    magenta: 'neon-border-magenta neon-glow-magenta',
  };

  return (
    <div className={cn('glass-vision rounded-xl p-6 relative overflow-hidden', colorClasses[color], className)}>
      {withNoise && <NoiseOverlay />}
      {withGrid && <GridPattern />}
      <div className="relative z-10">{children}</div>
    </div>
  );
}

/**
 * GlassPanel - A glassmorphic panel with all Vision UI effects
 * Use as a base for complex UI sections
 */
interface GlassPanelProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'strong';
  withNoise?: boolean;
  withGrid?: boolean;
  withTopAccent?: boolean;
}

export function GlassPanel({
  children,
  className,
  variant = 'default',
  withNoise = true,
  withGrid = false,
  withTopAccent = true,
}: GlassPanelProps) {
  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-xl',
        variant === 'strong' ? 'glass-vision-strong' : 'glass-vision',
        className
      )}
    >
      {withNoise && <NoiseOverlay opacity={0.04} />}
      {withGrid && <GridPattern opacity={0.02} />}
      {withTopAccent && (
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
      )}
      <div className="relative z-10">{children}</div>
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
    </div>
  );
}

/**
 * NeonText - Text with neon glow effect
 * Use sparingly for emphasis
 */
interface NeonTextProps {
  children: React.ReactNode;
  className?: string;
  color?: 'cyan' | 'violet';
  as?: 'span' | 'p' | 'h1' | 'h2' | 'h3' | 'h4';
}

export function NeonText({
  children,
  className,
  color = 'cyan',
  as: Component = 'span',
}: NeonTextProps) {
  const colorClasses = {
    cyan: 'neon-text',
    violet: 'neon-text-violet',
  };

  return (
    <Component className={cn(colorClasses[color], className)}>
      {children}
    </Component>
  );
}

/**
 * AnimatedGradientBg - Animated gradient background overlay
 * Use for hero sections or featured content
 */
interface AnimatedGradientBgProps {
  className?: string;
  intensity?: 'subtle' | 'strong';
}

export function AnimatedGradientBg({
  className,
  intensity = 'subtle',
}: AnimatedGradientBgProps) {
  return (
    <div
      className={cn(
        'absolute inset-0 pointer-events-none',
        intensity === 'subtle' ? 'animated-gradient-subtle' : 'animated-gradient',
        className
      )}
    />
  );
}
