import { useState, useEffect } from 'react'
import { Shield, Activity, AlertTriangle, Eye, Clock, MapPin, Smartphone, Monitor, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useSettings } from '../../context/settings-context'

export function SecurityForm() {
  const {
    account,
    securityEvents,
    securityAnalytics,
    isLoading,
    loadSecurityEvents,
    loadSecurityAnalytics,
    refetchAccount
  } = useSettings()

  const [isRefreshing, setIsRefreshing] = useState(false)

  // Load data on mount
  useEffect(() => {
    refetchAccount()
    loadSecurityEvents(25)
    loadSecurityAnalytics()
  }, [refetchAccount, loadSecurityEvents, loadSecurityAnalytics])

  const handleRefresh = async () => {
    setIsRefreshing(true)
    try {
      await Promise.all([
        refetchAccount(),
        loadSecurityEvents(25),
        loadSecurityAnalytics()
      ])
    } finally {
      setIsRefreshing(false)
    }
  }

  const getEventIcon = (eventType: string) => {
    switch (eventType) {
      case 'login':
        return <Eye className="h-4 w-4 text-blue-600" />
      case 'failed_login':
        return <AlertTriangle className="h-4 w-4 text-red-600" />
      case 'password_change':
        return <Shield className="h-4 w-4 text-green-600" />
      case '2fa_change':
        return <Shield className="h-4 w-4 text-purple-600" />
      default:
        return <Activity className="h-4 w-4 text-gray-600" />
    }
  }

  const getEventBadge = (eventType: string) => {
    switch (eventType) {
      case 'login':
        return <Badge variant="default">Login</Badge>
      case 'failed_login':
        return <Badge variant="destructive">Failed Login</Badge>
      case 'password_change':
        return <Badge variant="default">Password Change</Badge>
      case '2fa_change':
        return <Badge variant="secondary">2FA Change</Badge>
      default:
        return <Badge variant="outline">Activity</Badge>
    }
  }

  if (isLoading) {
    return <div className="flex items-center justify-center p-8">Loading security monitor...</div>
  }

  return (
    <div className="space-y-6">
      {/* Security Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Account Status */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Account Status</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {account?.two_factor_enabled ? 'Secure' : 'Basic'}
            </div>
            <p className="text-xs text-muted-foreground">
              {account?.two_factor_enabled
                ? '2FA enabled for enhanced security'
                : '2FA disabled - consider enabling'
              }
            </p>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recent Events</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{securityEvents.length}</div>
            <p className="text-xs text-muted-foreground">
              Security events in the last 30 days
            </p>
          </CardContent>
        </Card>

        {/* Last Login */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Last Login</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {account?.last_login
                ? new Date(account.last_login).toLocaleDateString()
                : 'Never'
              }
            </div>
            <p className="text-xs text-muted-foreground">
              {account?.last_login
                ? new Date(account.last_login).toLocaleTimeString()
                : 'No login recorded'
              }
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Security Analytics */}
      {securityAnalytics && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Security Analytics
            </CardTitle>
            <CardDescription>
              Overview of your account security metrics
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {securityAnalytics.recent_logins || 0}
                </div>
                <p className="text-sm text-muted-foreground">Recent Logins</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {securityAnalytics.two_factor_enabled || 0}
                </div>
                <p className="text-sm text-muted-foreground">2FA Enabled</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {securityAnalytics.recent_password_changes || 0}
                </div>
                <p className="text-sm text-muted-foreground">Password Changes</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">
                  {securityAnalytics.recent_security_events || 0}
                </div>
                <p className="text-sm text-muted-foreground">Security Events</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Security Events Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                Recent Security Events
              </CardTitle>
              <CardDescription>
                Monitor recent security activity on your account
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isRefreshing}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {securityEvents.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Event</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>IP Address</TableHead>
                  <TableHead>User Agent</TableHead>
                  <TableHead>Time</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {securityEvents.map((event, index) => (
                  <TableRow key={index}>
                    <TableCell className="flex items-center gap-2">
                      {getEventIcon(event.event_type)}
                      {event.event_type.replace('_', ' ').toUpperCase()}
                    </TableCell>
                    <TableCell>
                      {getEventBadge(event.event_type)}
                    </TableCell>
                    <TableCell className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {event.ip_address || 'Unknown'}
                    </TableCell>
                    <TableCell className="flex items-center gap-1">
                      {event.user_agent?.includes('Mobile') ? (
                        <Smartphone className="h-3 w-3" />
                      ) : (
                        <Monitor className="h-3 w-3" />
                      )}
                      {event.user_agent ?
                        event.user_agent.split(' ')[0] :
                        'Unknown Device'
                      }
                    </TableCell>
                    <TableCell>
                      {new Date(event.timestamp).toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8">
              <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No security events found</p>
              <p className="text-sm text-muted-foreground">
                Security events will appear here as they occur
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Security Recommendations */}
      <Alert>
        <Shield className="h-4 w-4" />
        <AlertDescription>
          <div className="space-y-2">
            <p className="font-medium">Security Recommendations:</p>
            <ul className="text-sm space-y-1">
              {!account?.two_factor_enabled && (
                <li>• Enable two-factor authentication for enhanced security</li>
              )}
              <li>• Review security events regularly for suspicious activity</li>
              <li>• Use strong, unique passwords for your account</li>
              <li>• Keep your contact information up to date for security alerts</li>
            </ul>
          </div>
        </AlertDescription>
      </Alert>
    </div>
  )
}
