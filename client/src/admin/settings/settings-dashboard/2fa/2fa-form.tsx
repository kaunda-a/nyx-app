import { useState, useEffect } from 'react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Shield, ShieldCheck, ShieldX, Key, Copy, QrCode, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
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
import { toast } from '@/hooks/use-toast'

// 2FA verification schema
const twoFactorVerifySchema = z.object({
  code: z.string().min(6, 'Code must be 6 digits').max(8, 'Code must be 6-8 characters'),
})

// 2FA disable schema
const twoFactorDisableSchema = z.object({
  verification_code: z.string().min(6, 'Verification code is required'),
})

type TwoFactorVerifyValues = z.infer<typeof twoFactorVerifySchema>
type TwoFactorDisableValues = z.infer<typeof twoFactorDisableSchema>

export function TwoFactorAuthenticationForm() {
  const {
    account,
    isLoading,
    enableTwoFactor,
    disableTwoFactor,
    verifyTwoFactor,
    refetchAccount
  } = useSettings()

  const [twoFactorSetup, setTwoFactorSetup] = useState<any>(null)
  const [showDisableDialog, setShowDisableDialog] = useState(false)
  const [showBackupCodes, setShowBackupCodes] = useState(false)

  // 2FA verification form
  const verifyForm = useForm<TwoFactorVerifyValues>({
    resolver: zodResolver(twoFactorVerifySchema),
    defaultValues: { code: '' },
  })

  // 2FA disable form
  const disableForm = useForm<TwoFactorDisableValues>({
    resolver: zodResolver(twoFactorDisableSchema),
    defaultValues: { verification_code: '' },
  })

  // Load account data on mount
  useEffect(() => {
    refetchAccount()
  }, [refetchAccount])

  // Handler functions
  const handleEnable2FA = async () => {
    try {
      const setup = await enableTwoFactor()
      setTwoFactorSetup(setup)
      setShowBackupCodes(true)
    } catch (error) {
      // Error handled by context
    }
  }

  const handleVerify2FA = async (data: TwoFactorVerifyValues) => {
    try {
      const result = await verifyTwoFactor({ code: data.code })
      if (result.valid) {
        setTwoFactorSetup(null)
        verifyForm.reset()
        refetchAccount()
      }
    } catch (error) {
      // Error handled by context
    }
  }

  const handleDisable2FA = async (data: TwoFactorDisableValues) => {
    try {
      await disableTwoFactor({ verification_code: data.verification_code })
      setShowDisableDialog(false)
      disableForm.reset()
      refetchAccount()
    } catch (error) {
      // Error handled by context
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast({
      title: 'Copied',
      description: 'Text copied to clipboard',
    })
  }

  if (isLoading) {
    return <div className="flex items-center justify-center p-8">Loading 2FA settings...</div>
  }

  if (!account) {
    return <div className="flex items-center justify-center p-8">No account data available</div>
  }

  return (
    <div className="space-y-6">
      {/* 2FA Status Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {account.two_factor_enabled ? (
              <ShieldCheck className="h-5 w-5 text-green-600" />
            ) : (
              <ShieldX className="h-5 w-5 text-red-600" />
            )}
            Two-Factor Authentication Status
          </CardTitle>
          <CardDescription>
            {account.two_factor_enabled
              ? "Your account is protected with two-factor authentication"
              : "Add an extra layer of security to your account"
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Badge variant={account.two_factor_enabled ? "default" : "secondary"}>
                {account.two_factor_enabled ? "Enabled" : "Disabled"}
              </Badge>
              {account.two_factor_enabled && (
                <span className="text-sm text-muted-foreground">
                  Last updated: {new Date(account.updated_at).toLocaleDateString()}
                </span>
              )}
            </div>

            {!account.two_factor_enabled ? (
              <Button onClick={handleEnable2FA} className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Enable 2FA
              </Button>
            ) : (
              <Dialog open={showDisableDialog} onOpenChange={setShowDisableDialog}>
                <DialogTrigger asChild>
                  <Button variant="destructive" className="flex items-center gap-2">
                    <ShieldX className="h-4 w-4" />
                    Disable 2FA
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5 text-red-600" />
                      Disable Two-Factor Authentication
                    </DialogTitle>
                    <DialogDescription>
                      This will remove the extra security layer from your account.
                      Enter your current 2FA code to confirm.
                    </DialogDescription>
                  </DialogHeader>

                  <Form {...disableForm}>
                    <form onSubmit={disableForm.handleSubmit(handleDisable2FA)} className="space-y-4">
                      <FormField
                        control={disableForm.control}
                        name="verification_code"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Verification Code</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Enter 6-digit code"
                                maxLength={8}
                                {...field}
                              />
                            </FormControl>
                            <FormDescription>
                              Enter the code from your authenticator app
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setShowDisableDialog(false)}>
                          Cancel
                        </Button>
                        <Button type="submit" variant="destructive" disabled={disableForm.formState.isSubmitting}>
                          {disableForm.formState.isSubmitting ? "Disabling..." : "Disable 2FA"}
                        </Button>
                      </DialogFooter>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 2FA Setup Process */}
      {twoFactorSetup && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <QrCode className="h-5 w-5" />
              Set Up Two-Factor Authentication
            </CardTitle>
            <CardDescription>
              Scan the QR code with your authenticator app and enter the verification code
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* QR Code */}
            <div className="flex flex-col items-center space-y-4">
              <div className="p-4 bg-white rounded-lg border">
                <img
                  src={twoFactorSetup.qr_code_url}
                  alt="2FA QR Code"
                  className="w-48 h-48"
                />
              </div>

              <div className="text-center space-y-2">
                <p className="text-sm text-muted-foreground">
                  Can't scan? Enter this code manually:
                </p>
                <div className="flex items-center gap-2">
                  <code className="px-2 py-1 bg-muted rounded text-sm font-mono">
                    {twoFactorSetup.secret}
                  </code>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(twoFactorSetup.secret)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Verification Form */}
            <Form {...verifyForm}>
              <form onSubmit={verifyForm.handleSubmit(handleVerify2FA)} className="space-y-4">
                <FormField
                  control={verifyForm.control}
                  name="code"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Verification Code</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter 6-digit code"
                          maxLength={8}
                          className="text-center text-lg tracking-widest"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Enter the code from your authenticator app to complete setup
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button type="submit" className="w-full" disabled={verifyForm.formState.isSubmitting}>
                  {verifyForm.formState.isSubmitting ? "Verifying..." : "Verify and Enable 2FA"}
                </Button>
              </form>
            </Form>

            {/* Backup Codes */}
            {showBackupCodes && twoFactorSetup.backup_codes && (
              <Alert>
                <Key className="h-4 w-4" />
                <AlertDescription>
                  <div className="space-y-2">
                    <p className="font-medium">Save these backup codes in a safe place:</p>
                    <div className="grid grid-cols-2 gap-2 font-mono text-sm">
                      {twoFactorSetup.backup_codes.map((code: string, index: number) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-muted rounded">
                          <span>{code}</span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => copyToClipboard(code)}
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      These codes can be used to access your account if you lose your authenticator device.
                      Each code can only be used once.
                    </p>
                  </div>
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}

      {/* Information Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            About Two-Factor Authentication
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <h4 className="font-medium">What is 2FA?</h4>
            <p className="text-sm text-muted-foreground">
              Two-factor authentication adds an extra layer of security to your account by requiring
              a second form of verification in addition to your password.
            </p>
          </div>

          <div className="space-y-2">
            <h4 className="font-medium">Recommended Apps</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Google Authenticator</li>
              <li>• Microsoft Authenticator</li>
              <li>• Authy</li>
              <li>• 1Password</li>
            </ul>
          </div>

          <div className="space-y-2">
            <h4 className="font-medium">Security Tips</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Save your backup codes in a secure location</li>
              <li>• Don't share your 2FA codes with anyone</li>
              <li>• Keep your authenticator app updated</li>
              <li>• Consider using multiple backup methods</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
