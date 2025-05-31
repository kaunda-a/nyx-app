import React from 'react';
import { cn } from '@/lib/utils';
import { NeonText } from '@/admin/settings/components/ui/neon-text';
import { SkeletonLoader } from '@/admin/settings/components/ui/skeleton-loader';
import { styles } from '@/admin/settings/styles';

interface SettingsSectionProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  description?: string;
  accentColor?: 'blue' | 'purple' | 'pink' | 'green' | 'red' | 'yellow';
  neonTitle?: boolean;
  isLoading?: boolean;
  children: React.ReactNode;
}

/**
 * SettingsSection component for grouping related settings
 */
export function SettingsSection({
  title,
  description,
  accentColor = 'blue',
  neonTitle = false,
  isLoading = false,
  className,
  children,
  ...props
}: SettingsSectionProps) {
  // Map accent colors to neon variants
  const neonVariantMap = {
    blue: 'blue',
    purple: 'purple',
    pink: 'pink',
    green: 'green',
    red: 'red',
    yellow: 'yellow',
  };

  return (
    <div
      className={cn(
        "space-y-6",
        className
      )}
      {...props}
    >
      <div className="space-y-1">
        {neonTitle ? (
          <NeonText
            variant={neonVariantMap[accentColor]}
            intensity="medium"
            as="h2"
            className="text-2xl font-bold tracking-tight"
          >
            {title}
          </NeonText>
        ) : (
          <h2 className={cn(
            "text-2xl font-bold tracking-tight",
            `text-${accentColor}-500`
          )}>
            {title}
          </h2>
        )}
        {description && (
          <p className="text-muted-foreground">
            {description}
          </p>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-4">
          <SkeletonLoader variant="card" />
          <SkeletonLoader variant="card" className="h-24" />
          <SkeletonLoader variant="card" className="h-40" />
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
          {children}
        </div>
      )}
    </div>
  );
}

export default SettingsSection;
