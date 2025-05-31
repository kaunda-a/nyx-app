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
  RefreshCw,
  Server,
  BarChart,
  Plus,
  CheckCircle2,
  Shield
} from 'lucide-react';
import { useProxies } from '../context/proxies-context';

import { ProxiesGrid } from './proxies-grid';
import { ProxiesTable } from './proxies-table';

export function ProxiesDashboard() {
  const {
    proxies,
    isLoading,
    error,
    filters,
    setFilters,
    refetchProxies,
    deleteProxy,
    checkProxyHealth,
    selectedProxy,
    selectProxy
  } = useProxies();

  const [view, setView] = useState<'grid' | 'table'>('grid');
  const [activeTab, setActiveTab] = useState('proxies');
  const [showCreateDrawer, setShowCreateDrawer] = useState(false);
  const [showEditDrawer, setShowEditDrawer] = useState(false);

  // Proxy statistics
  const proxyStats = {
    totalProxies: proxies?.length || 0,
    activeProxies: proxies?.filter(p => p.status === 'active')?.length || 0,
    averageSpeed: proxies?.length ?
      Math.round(proxies.reduce((sum, p) => sum + p.average_response_time, 0) / proxies.length) : 0,
    successRate: proxies?.length ?
      Math.round((proxies.reduce((sum, p) => sum + p.success_count, 0) /
      Math.max(proxies.reduce((sum, p) => sum + p.success_count + p.failure_count, 0), 1)) * 100 * 10) / 10 : 0,
    countries: proxies ? [...new Set(proxies.map(p => p.geolocation?.country).filter(Boolean))].length : 0,
    types: proxies ? [...new Set(proxies.map(p => p.protocol))].length : 0,
  };

  // Fetch proxies on component mount
  useEffect(() => {
    refetchProxies();
  }, [refetchProxies]);

  // Handle proxy edit
  const handleEditProxy = (proxy: any) => {
    selectProxy(proxy);
    setShowEditDrawer(true);
  };

  // Handle proxy delete
  const handleDeleteProxy = (id: string) => {
    if (window.confirm('Are you sure you want to delete this proxy?')) {
      deleteProxy(id);
    }
  };

  // Handle proxy health check
  const handleHealthCheck = async (id: string) => {
    try {
      await checkProxyHealth(id);
    } catch (error) {
      console.error('Health check failed:', error);
    }
  };

  // Get unique countries from proxies
  const getUniqueCountries = () => {
    return proxies ? [...new Set(proxies.map(p => p.geolocation?.country).filter(Boolean))] : [];
  };

  // Get unique types from proxies (protocols)
  const getUniqueTypes = () => {
    return proxies ? [...new Set(proxies.map(p => p.protocol))] : [];
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Proxies</h2>
        <div className="flex items-center space-x-2">
          <Button onClick={() => setShowCreateDrawer(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Proxy
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="proxies" className="flex items-center">
            <Server className="h-4 w-4 mr-2" />
            Proxies
          </TabsTrigger>
          <TabsTrigger value="metrics" className="flex items-center">
            <BarChart className="h-4 w-4 mr-2" />
            Metrics
          </TabsTrigger>
          <TabsTrigger value="validator" className="flex items-center">
            <CheckCircle2 className="h-4 w-4 mr-2" />
            Validator
          </TabsTrigger>
        </TabsList>

        <TabsContent value="proxies" className="space-y-4 mt-4">
          <div className="flex flex-col md:flex-row md:items-center space-y-4 md:space-y-0 md:space-x-4">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search proxies..."
                className="pl-8"
                value={filters.search || ''}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              />
            </div>

            <div className="flex items-center space-x-2">
              <Select
                value={filters.protocol || 'all'}
                onValueChange={(value) => setFilters({ ...filters, protocol: value === 'all' ? undefined : value })}
              >
                <SelectTrigger className="w-[130px]">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {getUniqueTypes().map(type => (
                    <SelectItem key={type} value={type}>{type.toUpperCase()}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={filters.status || 'all'}
                onValueChange={(value) => setFilters({ ...filters, status: value === 'all' ? undefined : value })}
              >
                <SelectTrigger className="w-[130px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="error">Error</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={filters.country || 'all'}
                onValueChange={(value) => setFilters({ ...filters, country: value === 'all' ? undefined : value })}
              >
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Country" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Countries</SelectItem>
                  {getUniqueCountries().map(country => (
                    <SelectItem key={country} value={country}>{country}</SelectItem>
                  ))}
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
                <CardTitle>Proxy List</CardTitle>
                <div className="flex items-center space-x-2">
                  <Badge variant="outline" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">
                    {proxyStats.activeProxies} Active
                  </Badge>
                  <Badge variant="outline">
                    {proxyStats.totalProxies} Total
                  </Badge>
                </div>
              </div>
              <CardDescription>
                Manage your proxies for enhanced privacy and anti-detection
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
                  <Button variant="outline" onClick={refetchProxies}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Retry
                  </Button>
                </div>
              ) : proxies.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8">
                  <Server className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground mb-2">No proxies found</p>
                  <Button onClick={() => setShowCreateDrawer(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Proxy
                  </Button>
                </div>
              ) : view === 'grid' ? (
                <ProxiesGrid
                  proxies={proxies}
                  onEdit={handleEditProxy}
                  onDelete={handleDeleteProxy}
                  onHealthCheck={handleHealthCheck}
                />
              ) : (
                <ProxiesTable
                  proxies={proxies}
                  onEdit={handleEditProxy}
                  onDelete={handleDeleteProxy}
                  onHealthCheck={handleHealthCheck}
                />
              )}
            </CardContent>
            <CardFooter className="flex justify-between">
              <div className="text-sm text-muted-foreground">
                Showing {proxies?.length || 0} proxies
              </div>
              <Button variant="outline" size="sm" onClick={refetchProxies}>
                <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </CardFooter>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Performance</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-sm">
                    <span>Average Speed</span>
                    <span className="font-medium">{proxyStats.averageSpeed}ms</span>
                  </div>
                  <Progress value={Math.min(proxyStats.averageSpeed / 10, 100)} className="h-1" />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center text-sm">
                    <span>Success Rate</span>
                    <Badge variant="outline" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">
                      {proxyStats.successRate}%
                    </Badge>
                  </div>
                  <Progress value={proxyStats.successRate} className="h-1" />
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm">Countries</span>
                  <span className="text-sm font-medium">{proxyStats.countries}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Protocol Types</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-sm">
                    <span>HTTP</span>
                    <span className="font-medium">{proxies?.filter(p => p.protocol === 'http')?.length || 0}</span>
                  </div>
                  <Progress value={proxies?.length ? (proxies?.filter(p => p.protocol === 'http')?.length || 0) / proxies.length * 100 : 0} className="h-1" />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center text-sm">
                    <span>SOCKS5</span>
                    <span className="font-medium">{proxies?.filter(p => p.protocol === 'socks5')?.length || 0}</span>
                  </div>
                  <Progress value={proxies?.length ? (proxies?.filter(p => p.protocol === 'socks5')?.length || 0) / proxies.length * 100 : 0} className="h-1" />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center text-sm">
                    <span>SOCKS4</span>
                    <span className="font-medium">{proxies?.filter(p => p.protocol === 'socks4')?.length || 0}</span>
                  </div>
                  <Progress value={proxies?.length ? (proxies?.filter(p => p.protocol === 'socks4')?.length || 0) / proxies.length * 100 : 0} className="h-1" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Status Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                      <span className="text-sm">Active</span>
                    </div>
                    <span className="text-sm font-medium">{proxyStats.activeProxies}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-gray-300 rounded-full mr-2"></div>
                      <span className="text-sm">Inactive</span>
                    </div>
                    <span className="text-sm font-medium">{proxies?.filter(p => p.status === 'inactive')?.length || 0}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
                      <span className="text-sm">Error</span>
                    </div>
                    <span className="text-sm font-medium">{proxies?.filter(p => p.status === 'error')?.length || 0}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Shield className="w-3 h-3 text-blue-500 mr-2" />
                      <span className="text-sm">Authenticated</span>
                    </div>
                    <span className="text-sm font-medium">{proxies?.filter(p => p.username)?.length || 0}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="metrics" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Proxy Metrics</CardTitle>
              <CardDescription>
                Performance analytics and usage statistics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center py-8">
                <p className="text-muted-foreground">Metrics dashboard coming soon...</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="validator" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Proxy Validator</CardTitle>
              <CardDescription>
                Test and validate proxy connections
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center py-8">
                <p className="text-muted-foreground">Proxy validator coming soon...</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
