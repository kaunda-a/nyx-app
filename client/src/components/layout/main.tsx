import React from 'react'
import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

// Inline cn function to avoid import issues during build
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

interface MainProps extends React.HTMLAttributes<HTMLElement> {
  fixed?: boolean
  ref?: React.Ref<HTMLElement>
}

export const Main = ({ fixed, ...props }: MainProps) => {
  return (
    <main
      className={cn(
        'peer-[.header-fixed]/header:mt-16',
        'px-4 py-6',
        fixed && 'fixed-main flex flex-grow flex-col overflow-hidden'
      )}
      {...props}
    />
  )
}

Main.displayName = 'Main'
