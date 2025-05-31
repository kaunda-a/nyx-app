import { useState, useEffect } from 'react'
import { Shield, User, Mail, Calendar, Key, Download, Trash2, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
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
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useSettings } from '../../context/settings-context'

export default function ProfileForm() {
  const {
    account,
    isLoading,
    getAccountBackup,
    deleteAccount,
    refetchAccount
  } = useSettings()

  const [showBackupDialog, setShowBackupDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [apiKey, setApiKey] = useState('')
  const [deletePassword, setDeletePassword] = useState('')
  const [deleteConfirmation, setDeleteConfirmation] = useState('')

  // Load account data on mount
  useEffect(() => {
    refetchAccount()
  }, [refetchAccount])

  const handleBackupAccount = async () => {
    if (!apiKey.trim()) return
    try {
      await getAccountBackup(apiKey)
      setShowBackupDialog(false)
      setApiKey('')
    } catch (error) {
      // Error handled by context
    }
  }

  const handleDeleteAccount = async () => {
    if (!deletePassword.trim() || deleteConfirmation !== 'DELETE') return
    try {
      await deleteAccount({
        password: deletePassword,
        confirmation: deleteConfirmation,
      })
      setShowDeleteDialog(false)
    } catch (error) {
      // Error handled by context
    }
  }

  if (isLoading) {
    return <div className="flex items-center justify-center p-8">Loading account overview...</div>
  }

  if (!account) {
    return <div className="flex items-center justify-center p-8">No account data available</div>
  }

  return (
    <div className="space-y-6">
      {/* Account Overview Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Account Overview
          </CardTitle>
          <CardDescription>
            Your account information and security status
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium">Username</Label>
                <p className="text-lg font-semibold">{account.username}</p>
              </div>
              <div>
                <Label className="text-sm font-medium">Email Address</Label>
                <p className="text-lg font-semibold flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  {account.email}
                </p>
              </div>
              <div>
                <Label className="text-sm font-medium">Account Created</Label>
                <p className="text-lg font-semibold flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  {new Date(account.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium">Security Status</Label>
                <div className="flex items-center gap-2 mt-1">
                  <Shield className={`h-4 w-4 ${account.two_factor_enabled ? 'text-green-600' : 'text-orange-600'}`} />
                  <Badge variant={account.two_factor_enabled ? "default" : "secondary"}>
                    {account.two_factor_enabled ? "Secure" : "Basic"}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  {account.two_factor_enabled
                    ? "Two-factor authentication is enabled"
                    : "Consider enabling two-factor authentication"
                  }
                </p>
              </div>

              {account.last_login && (
                <div>
                  <Label className="text-sm font-medium">Last Login</Label>
                  <p className="text-lg font-semibold">
                    {new Date(account.last_login).toLocaleDateString()}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(account.last_login).toLocaleTimeString()}
                  </p>
                </div>
              )}

              <div>
                <Label className="text-sm font-medium">Account ID</Label>
                <p className="text-sm font-mono bg-muted px-2 py-1 rounded">
                  {account.user_id}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Account Actions Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            Account Actions
          </CardTitle>
          <CardDescription>
            Manage your account data and security settings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Account Backup */}
            <Dialog open={showBackupDialog} onOpenChange={setShowBackupDialog}>
              <DialogTrigger asChild>
                <Button variant="outline" className="flex items-center gap-2">
                  <Download className="h-4 w-4" />
                  Backup Account
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Backup Account Data</DialogTitle>
                  <DialogDescription>
                    Create a secure backup of your account data. You'll need your API key to generate the backup.
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                  <div>
                    <Label htmlFor="apiKey">API Key</Label>
                    <Input
                      id="apiKey"
                      type="password"
                      placeholder="Enter your API key"
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                    />
                  </div>
                </div>

                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowBackupDialog(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleBackupAccount} disabled={!apiKey.trim()}>
                    Generate Backup
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* Account Deletion */}
            <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
              <DialogTrigger asChild>
                <Button variant="destructive" className="flex items-center gap-2">
                  <Trash2 className="h-4 w-4" />
                  Delete Account
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-red-600" />
                    Delete Account
                  </DialogTitle>
                  <DialogDescription>
                    This action cannot be undone. This will permanently delete your account and remove all associated data.
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                  <div>
                    <Label htmlFor="deletePassword">Password</Label>
                    <Input
                      id="deletePassword"
                      type="password"
                      placeholder="Enter your password"
                      value={deletePassword}
                      onChange={(e) => setDeletePassword(e.target.value)}
                    />
                  </div>

                  <div>
                    <Label htmlFor="deleteConfirmation">Type "DELETE" to confirm</Label>
                    <Input
                      id="deleteConfirmation"
                      placeholder="DELETE"
                      value={deleteConfirmation}
                      onChange={(e) => setDeleteConfirmation(e.target.value)}
                    />
                  </div>
                </div>

                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
                    Cancel
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={handleDeleteAccount}
                    disabled={!deletePassword.trim() || deleteConfirmation !== 'DELETE'}
                  >
                    Delete Account
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>

      {/* Security Recommendations */}
      <Alert>
        <Shield className="h-4 w-4" />
        <AlertDescription>
          <div className="space-y-2">
            <p className="font-medium">Account Security Tips:</p>
            <ul className="text-sm space-y-1">
              <li>• Keep your account information up to date</li>
              <li>• Enable two-factor authentication for enhanced security</li>
              <li>• Regularly backup your account data</li>
              <li>• Use a strong, unique password for your account</li>
              <li>• Monitor your account activity regularly</li>
            </ul>
          </div>
        </AlertDescription>
      </Alert>
    </div>
  )
}
