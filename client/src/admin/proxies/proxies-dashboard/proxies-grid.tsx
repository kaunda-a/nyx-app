import React from 'react';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import {
  MoreHorizontal,
  Trash,
  Edit,
  Copy,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Globe,
  Shield,
  Clock,
  Server,
  Activity,
  ExternalLink
} from 'lucide-react';
import { ProxyResponse } from '../api';

interface ProxiesGridProps {
  proxies: ProxyResponse[];
  onEdit: (proxy: ProxyResponse) => void;
  onDelete: (id: string) => void;
  onHealthCheck: (id: string) => void;
}

export function ProxiesGrid({ proxies, onEdit, onDelete, onHealthCheck }: ProxiesGridProps) {
  // Get status badge variant
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return (
          <Badge variant="outline" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">
            Active
          </Badge>
        );
      case 'inactive':
        return (
          <Badge variant="outline" className="bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-100">
            Inactive
          </Badge>
        );
      case 'error':
        return (
          <Badge variant="outline" className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100">
            Error
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-100">
            Unknown
          </Badge>
        );
    }
  };

  // Get proxy protocol icon
  const getProtocolIcon = (protocol: string) => {
    switch (protocol.toLowerCase()) {
      case 'http':
      case 'https':
        return <Globe className="h-4 w-4 text-blue-500" />;
      case 'socks5':
        return <Shield className="h-4 w-4 text-purple-500" />;
      case 'socks4':
        return <Server className="h-4 w-4 text-orange-500" />;
      default:
        return <Globe className="h-4 w-4 text-gray-500" />;
    }
  };

  // Format last checked time
  const formatLastChecked = (timestamp: string) => {
    if (!timestamp) return 'Never';

    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 60) {
      return `${diffMins} min${diffMins !== 1 ? 's' : ''} ago`;
    } else if (diffMins < 1440) {
      const hours = Math.floor(diffMins / 60);
      return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
    } else {
      const days = Math.floor(diffMins / 1440);
      return `${days} day${days !== 1 ? 's' : ''} ago`;
    }
  };

  const formatResponseTime = (time: number) => {
    if (time < 1000) {
      return `${time}ms`;
    }
    return `${(time / 1000).toFixed(1)}s`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {proxies.map((proxy) => {
        const successRate = proxy.success_count + proxy.failure_count > 0
          ? Math.round((proxy.success_count / (proxy.success_count + proxy.failure_count)) * 100)
          : 0;

        return (
          <Card key={proxy.id} className="overflow-hidden hover:shadow-lg transition-shadow">
            <CardHeader className="p-4">
              <div className="flex justify-between items-start">
                <CardTitle className="text-base flex items-center">
                  {getProtocolIcon(proxy.protocol)}
                  <span className="ml-2">{proxy.protocol.toUpperCase()}</span>
                </CardTitle>
                {getStatusBadge(proxy.status)}
              </div>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="space-y-4">
                <div className="flex justify-center items-center py-4">
                  <div className="bg-muted rounded-full p-6">
                    <Server className="h-12 w-12 text-muted-foreground" />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Host:</span>
                    <span className="font-medium">{proxy.host}</span>
                  </div>

                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Port:</span>
                    <span className="font-medium">{proxy.port}</span>
                  </div>

                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Location:</span>
                    <div className="flex items-center">
                      <span className="font-medium">{proxy.geolocation?.country || 'Unknown'}</span>
                    </div>
                  </div>

                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Response:</span>
                    <span className="font-medium">{formatResponseTime(proxy.average_response_time)}</span>
                  </div>

                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Success Rate:</span>
                    <span className="font-medium">{successRate}%</span>
                  </div>

                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Last Checked:</span>
                    <div className="flex items-center">
                      <Clock className="h-3.5 w-3.5 mr-1 text-muted-foreground" />
                      <span>{proxy.last_checked ? formatDate(proxy.last_checked) : 'Never'}</span>
                    </div>
                  </div>

                  {proxy.username && (
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-muted-foreground">Auth:</span>
                      <Badge variant="outline" className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100">
                        <Shield className="h-3 w-3 mr-1" />
                        Yes
                      </Badge>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
            <CardFooter className="p-4 flex justify-between">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onHealthCheck(proxy.id)}
              >
                <Activity className="h-4 w-4 mr-2" />
                Test
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Actions</DropdownMenuLabel>
                  <DropdownMenuItem onClick={() => onEdit(proxy)}>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onHealthCheck(proxy.id)}>
                    <Activity className="h-4 w-4 mr-2" />
                    Health Check
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigator.clipboard.writeText(`${proxy.host}:${proxy.port}`)}>
                    <Copy className="h-4 w-4 mr-2" />
                    Copy Details
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Export
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => onDelete(proxy.id)}
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash className="h-4 w-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </CardFooter>
          </Card>
        );
      })}
    </div>
  );
}
