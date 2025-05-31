import React from 'react';
import { cn } from '@/lib/utils';
import { GlassCard } from '@/admin/settings/components/ui/glass-card';
import { GradientBorder } from '@/admin/settings/components/ui/gradient-border';
import { NeonText } from '@/admin/settings/components/ui/neon-text';
import { MorphismCard } from '@/admin/settings/components/ui/morphism-card';
import { styles } from '@/admin/settings/styles';

interface SettingsCardProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  variant?: 'default' | 'glass' | 'gradient' | 'neon' | 'morphism';
  accentColor?: 'blue' | 'purple' | 'pink' | 'green' | 'red' | 'yellow';
  isActive?: boolean;
  isLoading?: boolean;
  children: React.ReactNode;
}

/**
 * SettingsCard component for Nyx settings UI
 *
 * Variants:
 * - default: Simple card with subtle shadow
 * - glass: Glassmorphism effect
 * - gradient: Gradient border effect
 * - neon: Neon glow effect
 * - morphism: Neumorphic effect
 */
export function SettingsCard({
  title,
  description,
  icon,
  variant = 'default',
  accentColor = 'blue',
  isActive = false,
  isLoading = false,
  className,
  children,
  ...props
}: SettingsCardProps) {
  // Map accent colors to gradient variants
  const gradientVariantMap = {
    blue: 'blue',
    purple: 'purple',
    pink: 'purple',
    green: 'green',
    red: 'red',
    yellow: 'rainbow',
  };

  // Map accent colors to neon variants
  const neonVariantMap = {
    blue: 'blue',
    purple: 'purple',
    pink: 'pink',
    green: 'green',
    red: 'red',
    yellow: 'yellow',
  };

  // Base content styles
  const contentStyles = 'p-6';

  // Render card based on variant
  const renderCard = () => {
    const content = (
      <div className={contentStyles}>
        <div className="flex items-center gap-3 mb-4">
          {icon && (
            <div className={cn(
              "flex items-center justify-center w-10 h-10 rounded-full",
              isActive && `text-${accentColor}-500`
            )}>
              {icon}
            </div>
          )}
          <div>
            {variant === 'neon' && isActive ? (
              <NeonText
                variant={neonVariantMap[accentColor]}
                intensity="medium"
                className="text-lg font-semibold"
              >
                {title}
              </NeonText>
            ) : (
              <h3 className={cn(
                "text-lg font-semibold",
                isActive && `text-${accentColor}-500`
              )}>
                {title}
              </h3>
            )}
            {description && (
              <p className="text-sm text-muted-foreground mt-1">
                {description}
              </p>
            )}
          </div>
        </div>
        <div className="mt-2">{children}</div>
      </div>
    );

    switch (variant) {
      case 'glass':
        return (
          <GlassCard
            variant={isActive ? 'neon' : 'default'}
            intensity="medium"
            hoverEffect={true}
            borderGlow={isActive}
            className={className}
            {...props}
          >
            {content}
          </GlassCard>
        );
      case 'gradient':
        return (
          <GradientBorder
            variant={gradientVariantMap[accentColor]}
            animate={isActive}
            intensity={isActive ? 'high' : 'low'}
            className={className}
            {...props}
          >
            <div className={contentStyles}>
              {content}
            </div>
          </GradientBorder>
        );
      case 'neon':
        return (
          <div
            className={cn(
              "relative rounded-xl overflow-hidden bg-black/40 shadow-lg",
              isActive && `shadow-${accentColor}-500/20`,
              className
            )}
            {...props}
          >
            {isActive && (
              <div className={cn(
                "absolute inset-0 blur-xl opacity-20",
                `bg-${accentColor}-500`
              )} />
            )}
            <div className="relative z-10">
              {content}
            </div>
          </div>
        );
      case 'morphism':
        return (
          <MorphismCard
            variant="neumorphic"
            interactive={true}
            depth="medium"
            className={className}
            {...props}
          >
            {content}
          </MorphismCard>
        );
      default:
        return (
          <div
            className={cn(
              "rounded-xl border bg-card text-card-foreground shadow",
              isActive && "ring-2 ring-offset-2",
              isActive && `ring-${accentColor}-500/50`,
              className
            )}
            {...props}
          >
            {content}
          </div>
        );
    }
  };

  return renderCard();
}

export default SettingsCard;
