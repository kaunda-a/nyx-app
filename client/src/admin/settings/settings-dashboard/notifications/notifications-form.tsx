import { useEffect } from 'react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Shield, Bell, AlertTriangle, Activity, Eye, Wifi, Lock, Key } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
} from '@/components/ui/form'
import { Switch } from '@/components/ui/switch'
import { useSettings } from '../../context/settings-context'

// Security-focused notification schema
const notificationsFormSchema = z.object({
  login_notifications: z.boolean(),
  security_alerts: z.boolean(),
  failed_login_alerts: z.boolean(),
  password_change_alerts: z.boolean(),
  two_factor_alerts: z.boolean(),
  account_changes: z.boolean(),
  suspicious_activity: z.boolean(),
  system_updates: z.boolean(),
})

type NotificationsFormValues = z.infer<typeof notificationsFormSchema>

export function NotificationsForm() {
  const {
    isLoading,
    updateNotifications,
    refetchAccount
  } = useSettings()

  const form = useForm<NotificationsFormValues>({
    resolver: zodResolver(notificationsFormSchema),
    defaultValues: {
      login_notifications: true,
      security_alerts: true,
      failed_login_alerts: true,
      password_change_alerts: true,
      two_factor_alerts: true,
      account_changes: true,
      suspicious_activity: true,
      system_updates: false,
    },
  })

  // Load account data and set form values
  useEffect(() => {
    refetchAccount()
  }, [refetchAccount])

  const handleSubmit = async (data: NotificationsFormValues) => {
    try {
      await updateNotifications(data)
      refetchAccount()
    } catch (error) {
      // Error handled by context
    }
  }

  if (isLoading) {
    return <div className="flex items-center justify-center p-8">Loading notification settings...</div>
  }

  return (
    <div className="space-y-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
          {/* Security Notifications Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Security Notifications
              </CardTitle>
              <CardDescription>
                Get notified about important security events and account changes
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="login_notifications"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base flex items-center gap-2">
                        <Eye className="h-4 w-4" />
                        Login Notifications
                      </FormLabel>
                      <FormDescription>
                        Get notified when someone logs into your account
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="security_alerts"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4" />
                        Security Alerts
                        <Badge variant="destructive" className="ml-2">Required</Badge>
                      </FormLabel>
                      <FormDescription>
                        Critical security alerts and warnings (cannot be disabled)
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        disabled
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="failed_login_alerts"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base flex items-center gap-2">
                        <Lock className="h-4 w-4" />
                        Failed Login Attempts
                      </FormLabel>
                      <FormDescription>
                        Get notified about failed login attempts on your account
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password_change_alerts"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base flex items-center gap-2">
                        <Key className="h-4 w-4" />
                        Password Changes
                      </FormLabel>
                      <FormDescription>
                        Get notified when your password is changed
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="two_factor_alerts"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base flex items-center gap-2">
                        <Shield className="h-4 w-4" />
                        Two-Factor Authentication
                      </FormLabel>
                      <FormDescription>
                        Get notified about 2FA changes and backup code usage
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>
          {/* Account Activity Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Account Activity
              </CardTitle>
              <CardDescription>
                Stay informed about changes to your account and profile
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="account_changes"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Account Changes</FormLabel>
                      <FormDescription>
                        Get notified about profile updates and account modifications
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="suspicious_activity"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Suspicious Activity</FormLabel>
                      <FormDescription>
                        Get notified about unusual account activity and potential threats
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* System Notifications Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wifi className="h-5 w-5" />
                System Updates
              </CardTitle>
              <CardDescription>
                Optional notifications about system maintenance and updates
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FormField
                control={form.control}
                name="system_updates"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">System Updates</FormLabel>
                      <FormDescription>
                        Get notified about system maintenance, updates, and new features
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? "Updating..." : "Update Notification Settings"}
          </Button>
        </form>
      </Form>

      {/* Information Alert */}
      <Alert>
        <Bell className="h-4 w-4" />
        <AlertDescription>
          <div className="space-y-2">
            <p className="font-medium">Important Security Information:</p>
            <ul className="text-sm space-y-1">
              <li>• Security alerts cannot be disabled for your protection</li>
              <li>• We recommend keeping login notifications enabled</li>
              <li>• Failed login alerts help detect unauthorized access attempts</li>
              <li>• All notifications are sent to your registered email address</li>
            </ul>
          </div>
        </AlertDescription>
      </Alert>
    </div>
  )
}
