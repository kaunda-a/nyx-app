import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
  Edit,
  Trash,
  Copy,
  ExternalLink,
  Activity,
  Shield,
  Globe
} from 'lucide-react';
import { ProxyResponse } from '../api';

interface ProxiesTableProps {
  proxies: ProxyResponse[];
  onEdit: (proxy: ProxyResponse) => void;
  onDelete: (id: string) => void;
  onHealthCheck: (id: string) => void;
}

export function ProxiesTable({
  proxies,
  onEdit,
  onDelete,
  onHealthCheck
}: ProxiesTableProps) {
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

  const getProtocolBadge = (protocol: string) => {
    const colors = {
      http: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100',
      https: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100',
      socks4: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-100',
      socks5: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-100'
    };

    return (
      <Badge variant="outline" className={colors[protocol as keyof typeof colors] || 'bg-gray-100 text-gray-800'}>
        {protocol.toUpperCase()}
      </Badge>
    );
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
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Proxy</TableHead>
            <TableHead>Protocol</TableHead>
            <TableHead>Location</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Response Time</TableHead>
            <TableHead>Success Rate</TableHead>
            <TableHead>Auth</TableHead>
            <TableHead>Last Check</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {proxies.map((proxy) => {
            const successRate = proxy.success_count + proxy.failure_count > 0 
              ? Math.round((proxy.success_count / (proxy.success_count + proxy.failure_count)) * 100)
              : 0;

            return (
              <TableRow key={proxy.id}>
                <TableCell className="font-medium">
                  <div className="flex flex-col">
                    <span>{proxy.host}:{proxy.port}</span>
                    {proxy.geolocation?.city && (
                      <span className="text-xs text-muted-foreground">
                        {proxy.geolocation.city}
                      </span>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  {getProtocolBadge(proxy.protocol)}
                </TableCell>
                <TableCell>
                  <div className="flex items-center space-x-1">
                    <Globe className="h-3 w-3 text-muted-foreground" />
                    <span className="text-sm">
                      {proxy.geolocation?.country || 'Unknown'}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  {getStatusBadge(proxy.status)}
                </TableCell>
                <TableCell>
                  <span className="text-sm">
                    {formatResponseTime(proxy.average_response_time)}
                  </span>
                </TableCell>
                <TableCell>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm">{successRate}%</span>
                    <div className="w-12 bg-gray-200 rounded-full h-1.5 dark:bg-gray-700">
                      <div 
                        className="bg-green-600 h-1.5 rounded-full" 
                        style={{ width: `${successRate}%` }}
                      ></div>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  {proxy.username ? (
                    <Badge variant="outline" className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100">
                      <Shield className="h-3 w-3 mr-1" />
                      Yes
                    </Badge>
                  ) : (
                    <span className="text-muted-foreground text-sm">None</span>
                  )}
                </TableCell>
                <TableCell>
                  {proxy.last_checked ? (
                    <span className="text-sm">{formatDate(proxy.last_checked)}</span>
                  ) : (
                    <span className="text-muted-foreground text-sm">Never</span>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end space-x-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => onHealthCheck(proxy.id)}
                    >
                      <Activity className="h-4 w-4 mr-1" />
                      Test
                    </Button>
                    
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => onEdit(proxy)}>
                          <Edit className="mr-2 h-4 w-4" />
                          Edit Proxy
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onHealthCheck(proxy.id)}>
                          <Activity className="mr-2 h-4 w-4" />
                          Health Check
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Copy className="mr-2 h-4 w-4" />
                          Copy Details
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <ExternalLink className="mr-2 h-4 w-4" />
                          Export
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          onClick={() => onDelete(proxy.id)}
                          className="text-destructive"
                        >
                          <Trash className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
