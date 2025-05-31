import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';

import {
  LayoutGrid,
  LayoutList,
  Search,
  Filter,
  RefreshCw,
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
  BarChart,
  Plus,
  Activity,
  ExternalLink,
  RotateCw,
  User,
  Monitor,
  Chrome,
  Play,
  Square,
  Fingerprint,
  Settings
} from 'lucide-react';
import { useProfiles } from '../context/profile-context';

import { ProfilesTable } from './profiles-table';
import { ProfilesGrid } from './profiles-grid';

export function ProfileDashboard() {
  const {
    profiles,
    isLoading,
    error,
    filters,
    setFilters,
    activeProfiles,
    refetchProfiles,
    deleteProfile,
    launchProfile,
    closeBrowser
  } = useProfiles();

  const [view, setView] = useState<'grid' | 'table'>('grid');
  const [activeTab, setActiveTab] = useState('profiles');
  const [showCreateDrawer, setShowCreateDrawer] = useState(false);
  const [showEditDrawer, setShowEditDrawer] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState<any | null>(null);

  // Profile statistics
  const profileStats = {
    totalProfiles: profiles?.length || 0,
    activeProfiles: Object.keys(activeProfiles).length,
    averageAge: 15, // days - calculated from profile creation dates
    successRate: 94.2, // percentage
    browsers: profiles ? [...new Set(profiles.map(p => p.config?.browser).filter(Boolean))].length : 0,
    operatingSystems: profiles ? [...new Set(profiles.map(p => p.config?.os).filter(Boolean))].length : 0,
  };

  // Fetch profiles on component mount
  useEffect(() => {
    refetchProfiles();
  }, [refetchProfiles]);

  // Filter profiles based on current filters
  const filteredProfiles = profiles ? profiles.filter(profile => {
    // Search filter
    if (filters.search && !profile.name.toLowerCase().includes(filters.search.toLowerCase())) {
      return false;
    }

    // OS filter
    if (filters.os && profile.config?.os !== filters.os) {
      return false;
    }

    // Browser filter
    if (filters.browser && profile.config?.browser !== filters.browser) {
      return false;
    }

    // Proxy filter
    if (filters.hasProxy !== undefined) {
      const hasProxy = !!profile.config?.proxy;
      if (filters.hasProxy !== hasProxy) {
        return false;
      }
    }

    return true;
  }) : [];

  // Handle profile edit
  const handleEditProfile = (profile: any) => {
    setSelectedProfile(profile);
    setShowEditDrawer(true);
  };

  // Handle profile delete
  const handleDeleteProfile = (id: string) => {
    if (window.confirm('Are you sure you want to delete this profile?')) {
      deleteProfile(id);
    }
  };

  // Handle profile launch
  const handleLaunchProfile = async (id: string) => {
    try {
      await launchProfile(id);
    } catch (error) {
      console.error('Failed to launch profile:', error);
    }
  };

  // Handle browser close
  const handleCloseBrowser = async (id: string) => {
    try {
      await closeBrowser(id);
    } catch (error) {
      console.error('Failed to close browser:', error);
    }
  };

  // Get unique browsers from profiles
  const getUniqueBrowsers = () => {
    return profiles ? [...new Set(profiles.map(p => p.config?.browser).filter(Boolean))] : [];
  };

  // Get unique operating systems from profiles
  const getUniqueOS = () => {
    return profiles ? [...new Set(profiles.map(p => p.config?.os).filter(Boolean))] : [];
  };

  // Update search filter
  const handleSearchChange = (value: string) => {
    setFilters({ ...filters, search: value });
  };

  // Update OS filter
  const handleOSFilterChange = (value: string) => {
    setFilters({ ...filters, os: value === 'all' ? undefined : value });
  };

  // Update browser filter
  const handleBrowserFilterChange = (value: string) => {
    setFilters({ ...filters, browser: value === 'all' ? undefined : value });
  };

  // Update proxy filter
  const handleProxyFilterChange = (value: string) => {
    setFilters({
      ...filters,
      hasProxy: value === 'all' ? undefined : value === 'with-proxy'
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Browser Profiles</h2>
        <div className="flex items-center space-x-2">
          <Button onClick={() => setShowCreateDrawer(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Profile
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="profiles" className="flex items-center">
            <User className="h-4 w-4 mr-2" />
            Profiles
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center">
            <BarChart className="h-4 w-4 mr-2" />
            Analytics
          </TabsTrigger>
          <TabsTrigger value="fingerprints" className="flex items-center">
            <Fingerprint className="h-4 w-4 mr-2" />
            Fingerprints
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profiles" className="space-y-4 mt-4">
          <div className="flex flex-col md:flex-row md:items-center space-y-4 md:space-y-0 md:space-x-4">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search profiles..."
                className="pl-8"
                value={filters.search || ''}
                onChange={(e) => handleSearchChange(e.target.value)}
              />
            </div>

            <div className="flex items-center space-x-2">
              <Select
                value={filters.os || 'all'}
                onValueChange={handleOSFilterChange}
              >
                <SelectTrigger className="w-[130px]">
                  <SelectValue placeholder="OS" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All OS</SelectItem>
                  {getUniqueOS().map(os => (
                    <SelectItem key={os} value={os}>{os}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={filters.browser || 'all'}
                onValueChange={handleBrowserFilterChange}
              >
                <SelectTrigger className="w-[130px]">
                  <SelectValue placeholder="Browser" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Browsers</SelectItem>
                  {getUniqueBrowsers().map(browser => (
                    <SelectItem key={browser} value={browser}>{browser}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={filters.hasProxy === undefined ? 'all' : filters.hasProxy ? 'with-proxy' : 'without-proxy'}
                onValueChange={handleProxyFilterChange}
              >
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Proxy" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Profiles</SelectItem>
                  <SelectItem value="with-proxy">With Proxy</SelectItem>
                  <SelectItem value="without-proxy">Without Proxy</SelectItem>
                </SelectContent>
              </Select>

              <div className="flex items-center space-x-1 rounded-md border p-1">
                <Button
                  variant={view === 'grid' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setView('grid')}
                  className="h-8 w-8 p-0"
                >
                  <LayoutGrid className="h-4 w-4" />
                </Button>
                <Button
                  variant={view === 'table' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setView('table')}
                  className="h-8 w-8 p-0"
                >
                  <LayoutList className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle>Profile List</CardTitle>
                <div className="flex items-center space-x-2">
                  <Badge variant="outline" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">
                    {profileStats.activeProfiles} Active
                  </Badge>
                  <Badge variant="outline">
                    {profileStats.totalProfiles} Total
                  </Badge>
                </div>
              </div>
              <CardDescription>
                Manage your browser profiles for enhanced privacy and anti-detection
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : error ? (
                <div className="flex flex-col items-center justify-center py-8">
                  <p className="text-destructive mb-2">{error.message}</p>
                  <Button variant="outline" onClick={refetchProfiles}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Retry
                  </Button>
                </div>
              ) : filteredProfiles.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8">
                  <User className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground mb-2">No profiles found</p>
                  <Button onClick={() => setShowCreateDrawer(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Profile
                  </Button>
                </div>
              ) : view === 'grid' ? (
                <ProfilesGrid
                  profiles={filteredProfiles}
                  activeProfiles={activeProfiles}
                  onEdit={handleEditProfile}
                  onDelete={handleDeleteProfile}
                  onLaunch={handleLaunchProfile}
                  onClose={handleCloseBrowser}
                />
              ) : (
                <ProfilesTable
                  profiles={filteredProfiles}
                  activeProfiles={activeProfiles}
                  onEdit={handleEditProfile}
                  onDelete={handleDeleteProfile}
                  onLaunch={handleLaunchProfile}
                  onClose={handleCloseBrowser}
                />
              )}
            </CardContent>
            <CardFooter className="flex justify-between">
              <div className="text-sm text-muted-foreground">
                Showing {filteredProfiles.length} of {profiles?.length || 0} profiles
              </div>
              <Button variant="outline" size="sm" onClick={refetchProfiles}>
                <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </CardFooter>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Browser Types</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-sm">
                    <span>Chrome</span>
                    <span className="font-medium">{profiles?.filter(p => p.config?.browser === 'chrome')?.length || 0}</span>
                  </div>
                  <Progress value={profiles?.length ? (profiles?.filter(p => p.config?.browser === 'chrome')?.length || 0) / profiles.length * 100 : 0} className="h-1" />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center text-sm">
                    <span>Firefox</span>
                    <span className="font-medium">{profiles?.filter(p => p.config?.browser === 'firefox')?.length || 0}</span>
                  </div>
                  <Progress value={profiles?.length ? (profiles?.filter(p => p.config?.browser === 'firefox')?.length || 0) / profiles.length * 100 : 0} className="h-1" />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center text-sm">
                    <span>Safari</span>
                    <span className="font-medium">{profiles?.filter(p => p.config?.browser === 'safari')?.length || 0}</span>
                  </div>
                  <Progress value={profiles?.length ? (profiles?.filter(p => p.config?.browser === 'safari')?.length || 0) / profiles.length * 100 : 0} className="h-1" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Average Age</span>
                    <span className="text-sm font-medium">{profileStats.averageAge} days</span>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-sm">
                      <span>Success Rate</span>
                      <Badge variant="outline" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">
                        {profileStats.successRate}%
                      </Badge>
                    </div>
                    <Progress value={profileStats.successRate} className="h-1" />
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-sm">Browsers</span>
                    <span className="text-sm font-medium">{profileStats.browsers}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                      <span className="text-sm">Active</span>
                    </div>
                    <span className="text-sm font-medium">{profileStats.activeProfiles}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-gray-300 rounded-full mr-2"></div>
                      <span className="text-sm">Inactive</span>
                    </div>
                    <span className="text-sm font-medium">{profileStats.totalProfiles - profileStats.activeProfiles}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
                      <span className="text-sm">With Proxy</span>
                    </div>
                    <span className="text-sm font-medium">{profiles?.filter(p => p.config?.proxy)?.length || 0}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Analytics Dashboard</CardTitle>
              <CardDescription>
                Profile usage analytics and insights
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center py-8">
                <p className="text-muted-foreground">Analytics dashboard coming soon...</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="fingerprints" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Fingerprint Management</CardTitle>
              <CardDescription>
                Manage and analyze browser fingerprints
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center py-8">
                <p className="text-muted-foreground">Fingerprint management coming soon...</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}