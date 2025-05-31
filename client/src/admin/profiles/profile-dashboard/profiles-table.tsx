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
  Play,
  Square,
  Edit,
  Trash,
  Copy,
  ExternalLink,
  Chrome,
  Monitor,
  Globe,
  Shield,
  Clock
} from 'lucide-react';
import { Profile } from '../api';

interface ProfilesTableProps {
  profiles: Profile[];
  activeProfiles: Record<string, {
    isRunning: boolean;
    hasProxy: boolean;
    launchTime?: Date;
  }>;
  onEdit: (profile: Profile) => void;
  onDelete: (id: string) => void;
  onLaunch: (id: string) => void;
  onClose: (id: string) => void;
}

export function ProfilesTable({
  profiles,
  activeProfiles,
  onEdit,
  onDelete,
  onLaunch,
  onClose
}: ProfilesTableProps) {
  const getBrowserIcon = (browser?: string) => {
    switch (browser?.toLowerCase()) {
      case 'chrome':
        return <Chrome className="h-4 w-4" />;
      case 'firefox':
        return <Monitor className="h-4 w-4" />;
      case 'safari':
        return <Globe className="h-4 w-4" />;
      default:
        return <Monitor className="h-4 w-4" />;
    }
  };

  const getStatusBadge = (profileId: string) => {
    const isActive = activeProfiles[profileId]?.isRunning;
    if (isActive) {
      return (
        <Badge variant="outline" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">
          Active
        </Badge>
      );
    }
    return (
      <Badge variant="outline" className="bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-100">
        Inactive
      </Badge>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Profile</TableHead>
            <TableHead>Browser</TableHead>
            <TableHead>OS</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Proxy</TableHead>
            <TableHead>Created</TableHead>
            <TableHead>Last Updated</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {profiles.map((profile) => {
            const isActive = activeProfiles[profile.id]?.isRunning;
            const hasProxy = !!profile.config?.proxy;
            const launchTime = activeProfiles[profile.id]?.launchTime;

            return (
              <TableRow key={profile.id}>
                <TableCell className="font-medium">
                  <div className="flex items-center space-x-2">
                    <div className="relative">
                      {getBrowserIcon(profile.config?.browser)}
                      {isActive && (
                        <div className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      )}
                    </div>
                    <span>{profile.name}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center space-x-1">
                    {getBrowserIcon(profile.config?.browser)}
                    <span className="capitalize">{profile.config?.browser || 'Unknown'}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <span className="capitalize">{profile.config?.os || 'Unknown'}</span>
                </TableCell>
                <TableCell>
                  <div className="flex flex-col space-y-1">
                    {getStatusBadge(profile.id)}
                    {isActive && launchTime && (
                      <span className="text-xs text-muted-foreground">
                        Since {formatDateTime(launchTime.toISOString())}
                      </span>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  {hasProxy ? (
                    <Badge variant="outline" className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100">
                      <Shield className="h-3 w-3 mr-1" />
                      Enabled
                    </Badge>
                  ) : (
                    <span className="text-muted-foreground text-sm">None</span>
                  )}
                </TableCell>
                <TableCell>
                  <span className="text-sm">{formatDate(profile.created_at)}</span>
                </TableCell>
                <TableCell>
                  {profile.updated_at ? (
                    <span className="text-sm">{formatDate(profile.updated_at)}</span>
                  ) : (
                    <span className="text-muted-foreground text-sm">Never</span>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end space-x-2">
                    {isActive ? (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => onClose(profile.id)}
                      >
                        <Square className="h-4 w-4 mr-1" />
                        Close
                      </Button>
                    ) : (
                      <Button 
                        size="sm"
                        onClick={() => onLaunch(profile.id)}
                      >
                        <Play className="h-4 w-4 mr-1" />
                        Launch
                      </Button>
                    )}
                    
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => onEdit(profile)}>
                          <Edit className="mr-2 h-4 w-4" />
                          Edit Profile
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Copy className="mr-2 h-4 w-4" />
                          Duplicate
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <ExternalLink className="mr-2 h-4 w-4" />
                          Export
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          onClick={() => onDelete(profile.id)}
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
