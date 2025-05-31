import React from 'react';
import { cn } from '@/lib/utils';
import { SkeletonLoader } from '@/admin/settings/components/ui/skeleton-loader';

interface SettingsLayoutProps extends React.HTMLAttributes<HTMLDivElement> {
  sidebar?: React.ReactNode;
  isLoading?: boolean;
  children: React.ReactNode;
}

/**
 * SettingsLayout component for the settings page
 */
export function SettingsLayout({
  sidebar,
  isLoading = false,
  className,
  children,
  ...props
}: SettingsLayoutProps) {
  return (
    <div
      className={cn(
        "flex flex-col space-y-8 lg:flex-row lg:space-x-12 lg:space-y-0",
        className
      )}
      {...props}
    >
      {sidebar && (
        <aside className="lg:w-1/5">
          {isLoading ? (
            <div className="space-y-4">
              <SkeletonLoader variant="text" count={5} />
            </div>
          ) : (
            sidebar
          )}
        </aside>
      )}
      <div className="flex-1 lg:max-w-4xl">
        {isLoading ? (
          <div className="space-y-8">
            <div className="space-y-2">
              <SkeletonLoader variant="text" className="w-1/3 h-8" />
              <SkeletonLoader variant="text" className="w-2/3" />
            </div>
            <div className="space-y-4">
              <SkeletonLoader variant="card" />
              <SkeletonLoader variant="card" className="h-64" />
              <SkeletonLoader variant="card" className="h-40" />
            </div>
          </div>
        ) : (
          children
        )}
      </div>
    </div>
  );
}

export default SettingsLayout;
