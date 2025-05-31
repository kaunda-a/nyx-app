import { Logo } from '@/components/icons/logo'

interface Props {
  children: React.ReactNode
}

export default function AuthLayout({ children }: Props) {
  return (
    <div className='container grid h-svh flex-col items-center justify-center bg-primary-foreground lg:max-w-none lg:px-0'>
      <div className='mx-auto flex w-full flex-col justify-center space-y-2 sm:w-[480px] lg:p-8'>
        <div className='mb-4 flex flex-col items-center justify-center space-y-2'>
          <Logo size={40} />
          <div className="text-center">
            <h1 className='text-2xl font-semibold'>Nyx</h1>
            <p className="text-sm text-muted-foreground">
              Undetectable Browser
            </p>
          </div>
        </div>
        {children}
      </div>
    </div>
  )
}
