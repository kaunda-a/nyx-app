import { Logo } from '@/components/icons/logo'
import { UserAuthForm } from './components/user-auth-form'

export default function SignIn2() {
  return (
    <div className='container relative grid h-svh flex-col items-center justify-center lg:max-w-none lg:grid-cols-2 lg:px-0'>
      <div className='relative hidden h-full flex-col bg-muted p-10 text-white dark:border-r lg:flex'>
        <div className='absolute inset-0 bg-zinc-900' />
        <div className='relative z-20 flex items-center text-lg font-medium'>
          <Logo size={32} />
          <span className="ml-2">Nyx</span>
        </div>

        <div className='relative z-20 flex flex-col items-center justify-center flex-1'>
          <Logo size={180} className="mb-8" />
          <h2 className="text-3xl font-bold mb-4">Nyx Browser</h2>
          <p className="text-xl text-center text-muted-foreground">
            Undetectable Browser
          </p>
        </div>

        <div className='relative z-20 mt-auto'>
          <blockquote className='space-y-2'>
            <p className='text-lg'>
              &ldquo;Experience the web with complete privacy and undetectability. 
              Nyx Browser sets new standards in anonymous browsing.&rdquo;
            </p>
            <footer className='text-sm'>Security Expert</footer>
          </blockquote>
        </div>
      </div>
      <div className='lg:p-8'>
        <div className='mx-auto flex w-full flex-col justify-center space-y-2 sm:w-[350px]'>
          <div className='flex flex-col space-y-2 text-left'>
            <h1 className='text-2xl font-semibold tracking-tight'>Login</h1>
            <p className='text-sm text-muted-foreground'>
              Enter your email and password below <br />
              to log into your account
            </p>
          </div>
          <UserAuthForm />
          <p className='px-8 text-center text-sm text-muted-foreground'>
            By clicking login, you agree to our{' '}
            <a
              href='/terms'
              className='underline underline-offset-4 hover:text-primary'
            >
              Terms of Service
            </a>{' '}
            and{' '}
            <a
              href='/privacy'
              className='underline underline-offset-4 hover:text-primary'
            >
              Privacy Policy
            </a>
            .
          </p>
        </div>
      </div>
    </div>
  )
}
