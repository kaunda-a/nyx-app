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
  Plus, 
  Search, 
  RefreshCw, 
  MoreVertical, 
  Trash2, 
  Download, 
  Upload, 
  Phone, 
  MessageCircle, 
  CheckCircle, 
  AlertCircle, 
  Clock, 
  Tag, 
  Filter, 
  LayoutGrid, 
  List, 
  Send, 
  PhoneCall, 
  PhoneOff, 
  Settings, 
  Copy, 
  ExternalLink, 
  BarChart, 
  Calendar, 
  Users, 
  Globe, 
  Shield
} from 'lucide-react';
import { useNumbers } from '../context/numbers-context';
import { NumbersTable } from './numbers-table';
import { NumbersGrid } from './enhanced-numbers-grid';
import { NumbersStats } from './enhanced-numbers-stats';
import { NumberDetails, Provider } from '../types';
import { NumberStatus, PROVIDERS, NumberFilters } from '../types/enhanced-types';
import { numbersApi } from '../api/numbers-api';

export function EnhancedNumbersDashboard() {
  const { setOpen, setCurrentNumber } = useNumbers();
  const [numbers, setNumbers] = useState<NumberDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<'grid' | 'table'>('grid');
  const [activeTab, setActiveTab] = useState('numbers');
  const [selectedNumbers, setSelectedNumbers] = useState<string[]>([]);
  const [filters, setFilters] = useState<NumberFilters>({
    provider: 'all',
    status: 'all',
    search: '',
    tags: []
  });
  
  // Fetch numbers on component mount
  useEffect(() => {
    fetchNumbers();
  }, []);
  
  // Fetch numbers from API
  const fetchNumbers = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await numbersApi.list();
      setNumbers(response.data);
    } catch (err) {
      console.error('Failed to fetch numbers:', err);
      setError('Failed to fetch numbers. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  // Filter numbers based on search query and filters
  const filteredNumbers = numbers.filter(number => {
    // Search filter
    if (filters.search && !number.number.includes(filters.search)) {
      return false;
    }
    
    // Provider filter
    if (filters.provider !== 'all' && number.provider !== filters.provider) {
      return false;
    }
    
    // Status filter
    if (filters.status !== 'all' && number.status !== filters.status) {
      return false;
    }
    
    // Tags filter
    if (filters.tags.length > 0 && !filters.tags.some(tag => number.tags.includes(tag))) {
      return false;
    }
    
    return true;
  });
  
  // Handle number selection
  const handleSelectNumber = (numberId: string) => {
    if (selectedNumbers.includes(numberId)) {
      setSelectedNumbers(selectedNumbers.filter(id => id !== numberId));
    } else {
      setSelectedNumbers([...selectedNumbers, numberId]);
    }
  };
  
  // Handle select all numbers
  const handleSelectAll = () => {
    if (selectedNumbers.length === filteredNumbers.length) {
      setSelectedNumbers([]);
    } else {
      setSelectedNumbers(filteredNumbers.map(number => number.id));
    }
  };
  
  // Handle delete selected numbers
  const handleDeleteSelected = () => {
    if (window.confirm(`Are you sure you want to delete ${selectedNumbers.length} numbers?`)) {
      // In a real implementation, this would delete the selected numbers
      console.log('Deleting numbers:', selectedNumbers);
    }
  };
  
  // Handle export selected numbers
  const handleExportSelected = () => {
    const selectedNumbersData = numbers.filter(number => selectedNumbers.includes(number.id));
    console.log('Exporting numbers:', selectedNumbersData);
    // In a real implementation, this would export the selected numbers
  };
  
  // Handle verify selected numbers
  const handleVerifySelected = () => {
    console.log('Verifying numbers:', selectedNumbers);
    // In a real implementation, this would verify the selected numbers
  };
  
  // Handle refresh selected numbers
  const handleRefreshSelected = () => {
    console.log('Refreshing numbers:', selectedNumbers);
    // In a real implementation, this would refresh the selected numbers
  };
  
  // Get unique tags from numbers
  const getUniqueTags = () => {
    const tags = new Set<string>();
    numbers.forEach(number => {
      number.tags.forEach(tag => tags.add(tag));
    });
    return Array.from(tags);
  };
  
  // Get number stats
  const getNumberStats = () => {
    return {
      total: numbers.length,
      active: numbers.filter(n => n.status === NumberStatus.ACTIVE).length,
      inactive: numbers.filter(n => n.status === NumberStatus.INACTIVE).length,
      pending: numbers.filter(n => n.status === NumberStatus.PENDING).length,
      error: numbers.filter(n => n.status === NumberStatus.ERROR).length,
      expired: numbers.filter(n => n.status === NumberStatus.EXPIRED).length,
      byProvider: PROVIDERS.map(provider => ({
        provider: provider.id,
        name: provider.name,
        count: numbers.filter(n => n.provider === provider.id).length
      }))
    };
  };
  
  // Get provider icon
  const getProviderIcon = (provider: Provider) => {
    switch (provider) {
      case 'textnow':
        return <MessageCircle className="h-4 w-4 text-blue-500" />;
      case 'google_voice':
        return <Phone className="h-4 w-4 text-red-500" />;
      case '2ndline':
        return <PhoneCall className="h-4 w-4 text-green-500" />;
      case 'textfree':
        return <MessageCircle className="h-4 w-4 text-purple-500" />;
      default:
        return <Phone className="h-4 w-4" />;
    }
  };
  
  // Get status badge variant
  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case NumberStatus.ACTIVE:
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100';
      case NumberStatus.INACTIVE:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100';
      case NumberStatus.PENDING:
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100';
      case NumberStatus.ERROR:
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100';
      case NumberStatus.EXPIRED:
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-100';
      default:
        return '';
    }
  };
  
  const stats = getNumberStats();
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Virtual Numbers</h2>
        <div className="flex items-center space-x-2">
          <Button onClick={() => setOpen('acquire')}>
            <Plus className="h-4 w-4 mr-2" />
            Acquire Number
          </Button>
        </div>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="numbers" className="flex items-center">
            <Phone className="h-4 w-4 mr-2" />
            Numbers
          </TabsTrigger>
          <TabsTrigger value="stats" className="flex items-center">
            <BarChart className="h-4 w-4 mr-2" />
            Statistics
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="numbers" className="space-y-4 mt-4">
          <div className="flex flex-col md:flex-row md:items-center space-y-4 md:space-y-0 md:space-x-4">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search numbers..."
                className="pl-8"
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <Select
                value={filters.provider}
                onValueChange={(value) => setFilters({ ...filters, provider: value })}
              >
                <SelectTrigger className="w-[130px]">
                  <SelectValue placeholder="Provider" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Providers</SelectItem>
                  {PROVIDERS.map(provider => (
                    <SelectItem key={provider.id} value={provider.id}>
                      <div className="flex items-center">
                        {getProviderIcon(provider.id as Provider)}
                        <span className="ml-2">{provider.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select
                value={filters.status}
                onValueChange={(value) => setFilters({ ...filters, status: value })}
              >
                <SelectTrigger className="w-[130px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value={NumberStatus.ACTIVE}>Active</SelectItem>
                  <SelectItem value={NumberStatus.INACTIVE}>Inactive</SelectItem>
                  <SelectItem value={NumberStatus.PENDING}>Pending</SelectItem>
                  <SelectItem value={NumberStatus.ERROR}>Error</SelectItem>
                  <SelectItem value={NumberStatus.EXPIRED}>Expired</SelectItem>
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
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
          
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle>Virtual Phone Numbers</CardTitle>
                <div className="flex items-center space-x-2">
                  <Badge variant="outline" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">
                    {stats.active} Active
                  </Badge>
                  <Badge variant="outline">
                    {stats.total} Total
                  </Badge>
                </div>
              </div>
              <CardDescription>
                Manage your virtual phone numbers for verification and messaging
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : error ? (
                <div className="flex flex-col items-center justify-center py-8">
                  <p className="text-destructive mb-2">{error}</p>
                  <Button variant="outline" onClick={fetchNumbers}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Retry
                  </Button>
                </div>
              ) : filteredNumbers.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8">
                  <Phone className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground mb-2">No numbers found</p>
                  <Button onClick={() => setOpen('acquire')}>
                    <Plus className="h-4 w-4 mr-2" />
                    Acquire Number
                  </Button>
                </div>
              ) : view === 'grid' ? (
                <NumbersGrid 
                  numbers={filteredNumbers}
                  selectedNumbers={selectedNumbers}
                  onSelectNumber={handleSelectNumber}
                  onViewDetails={(number) => {
                    setCurrentNumber(number);
                    // In a real implementation, this would open a details dialog
                  }}
                  onVerify={(number) => {
                    setCurrentNumber(number);
                    setOpen('verify');
                  }}
                  onRefresh={(number) => {
                    setCurrentNumber(number);
                    setOpen('refresh');
                  }}
                  onDelete={(number) => {
                    setCurrentNumber(number);
                    setOpen('delete');
                  }}
                  getProviderIcon={getProviderIcon}
                  getStatusBadgeVariant={getStatusBadgeVariant}
                />
              ) : (
                <NumbersTable 
                  numbers={filteredNumbers}
                  selectedNumbers={selectedNumbers}
                  onSelectNumber={handleSelectNumber}
                  onSelectAll={handleSelectAll}
                  onViewDetails={(number) => {
                    setCurrentNumber(number);
                    // In a real implementation, this would open a details dialog
                  }}
                  onVerify={(number) => {
                    setCurrentNumber(number);
                    setOpen('verify');
                  }}
                  onRefresh={(number) => {
                    setCurrentNumber(number);
                    setOpen('refresh');
                  }}
                  onDelete={(number) => {
                    setCurrentNumber(number);
                    setOpen('delete');
                  }}
                  getProviderIcon={getProviderIcon}
                  getStatusBadgeVariant={getStatusBadgeVariant}
                />
              )}
            </CardContent>
            <CardFooter className="flex justify-between">
              <div className="flex items-center space-x-2">
                {selectedNumbers.length > 0 && (
                  <>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={handleVerifySelected}
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Verify ({selectedNumbers.length})
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={handleRefreshSelected}
                    >
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Refresh ({selectedNumbers.length})
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={handleDeleteSelected}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete ({selectedNumbers.length})
                    </Button>
                  </>
                )}
              </div>
              <div className="flex items-center space-x-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleExportSelected}
                  disabled={selectedNumbers.length === 0}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export {selectedNumbers.length > 0 ? `(${selectedNumbers.length})` : ''}
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={fetchNumbers}
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
              </div>
            </CardFooter>
          </Card>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center">
                  <Phone className="h-4 w-4 mr-2 text-primary" />
                  Providers
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {stats.byProvider.map(provider => (
                    <div key={provider.provider} className="flex justify-between items-center">
                      <div className="flex items-center">
                        {getProviderIcon(provider.provider as Provider)}
                        <span className="text-sm ml-2">{provider.name}</span>
                      </div>
                      <span className="text-sm font-medium">{provider.count}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center">
                  <CheckCircle className="h-4 w-4 mr-2 text-primary" />
                  Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                      <span className="text-sm">Active</span>
                    </div>
                    <span className="text-sm font-medium">{stats.active}</span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-gray-300 rounded-full mr-2"></div>
                      <span className="text-sm">Inactive</span>
                    </div>
                    <span className="text-sm font-medium">{stats.inactive}</span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-yellow-500 rounded-full mr-2"></div>
                      <span className="text-sm">Pending</span>
                    </div>
                    <span className="text-sm font-medium">{stats.pending}</span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
                      <span className="text-sm">Error</span>
                    </div>
                    <span className="text-sm font-medium">{stats.error}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center">
                  <Tag className="h-4 w-4 mr-2 text-primary" />
                  Tags
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {getUniqueTags().map(tag => (
                    <Badge 
                      key={tag} 
                      variant="outline" 
                      className={filters.tags.includes(tag) ? 'bg-primary text-primary-foreground' : ''}
                      onClick={() => {
                        if (filters.tags.includes(tag)) {
                          setFilters({ ...filters, tags: filters.tags.filter(t => t !== tag) });
                        } else {
                          setFilters({ ...filters, tags: [...filters.tags, tag] });
                        }
                      }}
                    >
                      {tag}
                    </Badge>
                  ))}
                  {getUniqueTags().length === 0 && (
                    <span className="text-sm text-muted-foreground">No tags found</span>
                  )}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center">
                  <Shield className="h-4 w-4 mr-2 text-primary" />
                  Verification Services
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">WhatsApp</span>
                    <Badge variant="outline" className="bg-green-100 text-green-800">
                      {Math.floor(Math.random() * 10) + 1}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Telegram</span>
                    <Badge variant="outline" className="bg-blue-100 text-blue-800">
                      {Math.floor(Math.random() * 10) + 1}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Signal</span>
                    <Badge variant="outline" className="bg-purple-100 text-purple-800">
                      {Math.floor(Math.random() * 10) + 1}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Other</span>
                    <Badge variant="outline" className="bg-gray-100 text-gray-800">
                      {Math.floor(Math.random() * 10) + 1}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="stats" className="space-y-4 mt-4">
          <NumbersStats numbers={numbers} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
