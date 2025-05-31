import { useState, useEffect } from 'react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Eye, EyeOff, Shield, Key } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { useSettings } from '../../context/settings-context'

// Password change form schema
const passwordChangeSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string().min(1, 'Please confirm your password'),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
})

// 2FA verification schema
const twoFactorSchema = z.object({
  code: z.string().min(6, 'Code must be 6 digits').max(8, 'Code must be 6-8 characters'),
})

// Account deletion schema
const accountDeleteSchema = z.object({
  password: z.string().min(1, 'Password is required'),
  confirmation: z.string().refine((val) => val === 'DELETE', {
    message: 'Please type DELETE to confirm',
  }),
})

type PasswordChangeValues = z.infer<typeof passwordChangeSchema>
type TwoFactorValues = z.infer<typeof twoFactorSchema>
type AccountDeleteValues = z.infer<typeof accountDeleteSchema>

export function AccountForm() {
  const {
    account,
    isLoading,
    changePassword,
    enableTwoFactor,
    disableTwoFactor,
    verifyTwoFactor,
    deleteAccount,
    getAccountBackup,
    refetchAccount
  } = useSettings()

  const [showPassword, setShowPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [twoFactorSetup, setTwoFactorSetup] = useState<any>(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showBackupDialog, setShowBackupDialog] = useState(false)

  // Password change form
  const passwordForm = useForm<PasswordChangeValues>({
    resolver: zodResolver(passwordChangeSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  })

  // 2FA form
  const twoFactorForm = useForm<TwoFactorValues>({
    resolver: zodResolver(twoFactorSchema),
    defaultValues: { code: '' },
  })

  // Account deletion form
  const deleteForm = useForm<AccountDeleteValues>({
    resolver: zodResolver(accountDeleteSchema),
    defaultValues: {
      password: '',
      confirmation: '' as any, // Allow empty string as initial value
    },
  })

  // Load account data on mount
  useEffect(() => {
    refetchAccount()
  }, [refetchAccount])

  // Handler functions
  const handlePasswordChange = async (data: PasswordChangeValues) => {
    try {
      await changePassword({
        current_password: data.currentPassword,
        new_password: data.newPassword,
      })
      passwordForm.reset()
    } catch (error) {
      // Error handled by context
    }
  }

  const handleEnable2FA = async () => {
    try {
      const setup = await enableTwoFactor()
      setTwoFactorSetup(setup)
    } catch (error) {
      // Error handled by context
    }
  }

  const handleDisable2FA = async (data: TwoFactorValues) => {
    try {
      await disableTwoFactor({ verification_code: data.code })
      twoFactorForm.reset()
    } catch (error) {
      // Error handled by context
    }
  }

  const handleDeleteAccount = async (data: AccountDeleteValues) => {
    try {
      await deleteAccount({
        password: data.password,
        confirmation: data.confirmation,
      })
      setShowDeleteDialog(false)
    } catch (error) {
      // Error handled by context
    }
  }

  const handleBackupAccount = async () => {
    if (!account?.api_key) return
    try {
      await getAccountBackup(account.api_key)
    } catch (error) {
      // Error handled by context
    }
  }

  if (isLoading) {
    return <div className="flex items-center justify-center p-8">Loading account...</div>
  }

  if (!account) {
    return <div className="flex items-center justify-center p-8">No account data available</div>
  }

  return (
    <div className="space-y-6">
      {/* Account Information Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Account Information
          </CardTitle>
          <CardDescription>
            Your account details and security status
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium">Username</Label>
              <p className="text-sm text-muted-foreground">{account.username}</p>
            </div>
            <div>
              <Label className="text-sm font-medium">Email</Label>
              <p className="text-sm text-muted-foreground">{account.email}</p>
            </div>
            <div>
              <Label className="text-sm font-medium">Two-Factor Authentication</Label>
              <div className="flex items-center gap-2">
                <Badge variant={account.two_factor_enabled ? "default" : "secondary"}>
                  {account.two_factor_enabled ? "Enabled" : "Disabled"}
                </Badge>
              </div>
            </div>
            <div>
              <Label className="text-sm font-medium">Account Created</Label>
              <p className="text-sm text-muted-foreground">
                {new Date(account.created_at).toLocaleDateString()}
              </p>
            </div>
          </div>

          {account.last_login && (
            <div>
              <Label className="text-sm font-medium">Last Login</Label>
              <p className="text-sm text-muted-foreground">
                {new Date(account.last_login).toLocaleString()}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Password Change Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            Change Password
          </CardTitle>
          <CardDescription>
            Update your account password for enhanced security
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...passwordForm}>
            <form onSubmit={passwordForm.handleSubmit(handlePasswordChange)} className="space-y-4">
              <FormField
                control={passwordForm.control}
                name="currentPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Current Password</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          type={showPassword ? "text" : "password"}
                          placeholder="Enter current password"
                          {...field}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={passwordForm.control}
                name="newPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>New Password</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          type={showNewPassword ? "text" : "password"}
                          placeholder="Enter new password"
                          {...field}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                        >
                          {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                    </FormControl>
                    <FormDescription>
                      Password must be at least 8 characters long
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={passwordForm.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirm New Password</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="Confirm new password"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" disabled={passwordForm.formState.isSubmitting}>
                {passwordForm.formState.isSubmitting ? "Changing..." : "Change Password"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}
