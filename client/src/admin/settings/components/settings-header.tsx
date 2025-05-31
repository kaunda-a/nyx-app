import React from 'react';
import { cn } from '@/lib/utils';
import { NeonText } from '@/admin/settings/components/ui/neon-text';
import { GradientBorder } from '@/admin/settings/components/ui/gradient-border';
import { styles } from '@/admin/settings/styles';

interface SettingsHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  description?: string;
  accentColor?: 'blue' | 'purple' | 'pink' | 'green' | 'red' | 'yellow';
  variant?: 'default' | 'neon' | 'gradient';
  actions?: React.ReactNode;
}

/**
 * SettingsHeader component for settings page headers
 *
 * Variants:
 * - default: Simple header
 * - neon: Neon text header
 * - gradient: Gradient border header
 */
export function SettingsHeader({
  title,
  description,
  accentColor = 'blue',
  variant = 'default',
  actions,
  className,
  ...props
}: SettingsHeaderProps) {
  // Map accent colors to neon variants
  const neonVariantMap = {
    blue: 'blue',
    purple: 'purple',
    pink: 'pink',
    green: 'green',
    red: 'red',
    yellow: 'yellow',
  };

  // Map accent colors to gradient variants
  const gradientVariantMap = {
    blue: 'blue',
    purple: 'purple',
    pink: 'purple',
    green: 'green',
    red: 'red',
    yellow: 'rainbow',
  };

  // Render title based on variant
  const renderTitle = () => {
    switch (variant) {
      case 'neon':
        return (
          <NeonText
            variant={neonVariantMap[accentColor]}
            intensity="medium"
            as="h1"
            className="text-3xl font-bold tracking-tight"
          >
            {title}
          </NeonText>
        );
      case 'gradient':
        return (
          <span className={cn(
            "bg-gradient-to-r bg-clip-text text-transparent font-bold text-3xl tracking-tight",
            accentColor === 'blue' && "from-blue-600 to-cyan-500",
            accentColor === 'purple' && "from-purple-600 to-pink-500",
            accentColor === 'pink' && "from-pink-600 to-rose-500",
            accentColor === 'green' && "from-green-600 to-emerald-500",
            accentColor === 'red' && "from-red-600 to-orange-500",
            accentColor === 'yellow' && "from-yellow-600 to-amber-500"
          )}>
            {title}
          </span>
        );
      default:
        return (
          <h1 className={cn(
            "text-3xl font-bold tracking-tight",
            `text-${accentColor}-500`
          )}>
            {title}
          </h1>
        );
    }
  };

  // Render header content
  const headerContent = (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
      <div className="space-y-1">
        {renderTitle()}
        {description && (
          <p className="text-muted-foreground">
            {description}
          </p>
        )}
      </div>
      {actions && (
        <div className="flex items-center gap-2">
          {actions}
        </div>
      )}
    </div>
  );

  // Render header based on variant
  if (variant === 'gradient') {
    return (
      <GradientBorder
        variant={gradientVariantMap[accentColor]}
        animate={true}
        intensity="low"
        borderWidth="thin"
        className={cn("mb-8", className)}
        {...props}
      >
        <div className="p-6">
          {headerContent}
        </div>
      </GradientBorder>
    );
  }

  return (
    <div
      className={cn("mb-8", className)}
      {...props}
    >
      {headerContent}
    </div>
  );
}

export default SettingsHeader;
