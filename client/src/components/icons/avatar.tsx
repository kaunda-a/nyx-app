import { type ReactElement } from 'react'
import { cn } from '@/lib/utils'

type BaseAvatarProps = React.SVGProps<SVGSVGElement>
type InitialsAvatarProps = BaseAvatarProps & { initials: string }

type AvatarOptionType = {
  'abstract-1': (props: BaseAvatarProps) => ReactElement
  'abstract-2': (props: BaseAvatarProps) => ReactElement
  'abstract-3': (props: BaseAvatarProps) => ReactElement
  'initials': (props: InitialsAvatarProps) => ReactElement
}

export const avatarOptions: AvatarOptionType = {
  'abstract-1': (props: BaseAvatarProps) => (
    <svg viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <rect width="80" height="80" rx="40" fill="#FF3D00" />
      <path d="M20 20h40v40H20z" fill="#FFB300" />
      <circle cx="40" cy="40" r="16" fill="#FFF" />
    </svg>
  ),
  'abstract-2': (props: BaseAvatarProps) => (
    <svg viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <rect width="80" height="80" rx="40" fill="#2196F3" />
      <path d="M30 20l30 40H20l30-40z" fill="#BBDEFB" />
    </svg>
  ),
  'abstract-3': (props: BaseAvatarProps) => (
    <svg viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <rect width="80" height="80" rx="40" fill="#4CAF50" />
      <circle cx="40" cy="40" r="20" fill="#C8E6C9" />
      <path d="M35 35h10v10H35z" fill="#4CAF50" />
    </svg>
  ),
  'initials': (props: InitialsAvatarProps) => (
    <svg viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <rect width="80" height="80" rx="40" fill="#6366F1" />
      <text
        x="40"
        y="48"
        fontSize="28"
        fill="#FFF"
        textAnchor="middle"
        fontFamily="system-ui"
        fontWeight="bold"
      >
        {props.initials}
      </text>
    </svg>
  )
}

export type AvatarType = keyof typeof avatarOptions

interface AvatarProps extends BaseAvatarProps {
  type?: AvatarType
  initials?: string
  className?: string
}

export function Avatar({ type = 'abstract-1', initials = 'U', className, ...props }: AvatarProps): ReactElement {
  if (type === 'initials') {
    return (
      <div className={cn('inline-block', className)}>
        {avatarOptions[type]({ ...props, initials } as InitialsAvatarProps)}
      </div>
    )
  }

  return (
    <div className={cn('inline-block', className)}>
      {avatarOptions[type](props)}
    </div>
  )
}
