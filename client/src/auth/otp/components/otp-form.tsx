import { HTMLAttributes, useState } from 'react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useNavigate, useSearch } from '@tanstack/react-router'
import { cn } from '@/lib/utils'
import { toast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { PinInput, PinInputField } from '@/components/pin-input'
import { useAuth } from '@/auth/api/stores/authStore'
import { Logo } from '@/components/icons/logo'

type OtpFormProps = HTMLAttributes<HTMLDivElement>

const formSchema = z.object({
  otp: z
    .string()
    .length(6, { message: 'Please enter a valid 6-digit OTP code.' })
    .regex(/^\d+$/, { message: 'OTP must contain only numbers.' }),
})

export function OtpForm({ className, ...props }: OtpFormProps) {
  const navigate = useNavigate()
  const search = useSearch({ from: '/(auth)/otp' })
  const [isLoading, setIsLoading] = useState(false)
  const [disabledBtn, setDisabledBtn] = useState(true)
  const { verifyOtp } = useAuth()

  // Get email from URL search params
  const email = search.email

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { otp: '' },
  })

  async function onSubmit(data: z.infer<typeof formSchema>) {
    if (!email) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Email is required for OTP verification.',
      })
      return
    }

    try {
      setIsLoading(true)
      await verifyOtp(data.otp, email)
      toast({
        title: 'Success',
        description: 'OTP verification successful.',
      })
      navigate({ 
        to: '/',
        search: { redirect: '/' }
      })
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Invalid OTP code. Please try again.',
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className={cn('grid gap-6', className)} {...props}>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <div className='grid gap-2'>
            <FormField
              control={form.control}
              name='otp'
              render={({ field }) => (
                <FormItem className='space-y-1'>
                  <FormControl>
                    <PinInput
                      {...field}
                      className='flex h-10 justify-between'
                      onComplete={() => setDisabledBtn(false)}
                      onIncomplete={() => setDisabledBtn(true)}
                      type="numeric"
                      otp={true}
                      placeholder="○"
                    >
                      {Array.from({ length: 6 }, (_, i) => {
                        if (i === 3)
                          return <Separator key={i} orientation='vertical' />
                        return (
                          <PinInputField
                            key={i}
                            component={Input}
                            className={`${
                              form.getFieldState('otp').invalid 
                                ? 'border-red-500' 
                                : ''
                            }`}
                            inputMode="numeric"
                            pattern="[0-9]*"
                          />
                        )
                      })}
                    </PinInput>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button
              type="submit"
              disabled={isLoading || disabledBtn}
              className="w-full"
            >
              {isLoading && (
                <Logo className="mr-2 h-4 w-4 animate-spin" />
              )}
              Verify Account
            </Button>
          </div>
        </form>
      </Form>
    </div>
  )
}
