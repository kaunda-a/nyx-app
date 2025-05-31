import { useState, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { 
  IconSearch, 
  IconFilter, 
  IconFilterOff,
  IconDeviceMobile,
  IconBrandAndroid,
  IconBrandApple
} from '@tabler/icons-react'
import { type DeviceFilters } from '../data/schema'
import { usePhone } from '../context/phone-context'

export function DeviceFilters() {
  const { filters, setFilters } = usePhone()
  const [localFilters, setLocalFilters] = useState<DeviceFilters>(filters)
  const [isFiltering, setIsFiltering] = useState(false)
  
  // Update local filters when global filters change
  useEffect(() => {
    setLocalFilters(filters)
    
    // Check if any filters are active
    const hasActiveFilters = Object.values(filters).some(value => 
      value !== undefined && value !== '' && value !== null
    )
    setIsFiltering(hasActiveFilters)
  }, [filters])
  
  // Handle filter changes
  const handleFilterChange = (key: keyof DeviceFilters, value: string | null) => {
    setLocalFilters(prev => ({
      ...prev,
      [key]: value === '' ? undefined : value
    }))
  }
  
  // Apply filters
  const applyFilters = () => {
    setFilters(localFilters)
  }
  
  // Clear all filters
  const clearFilters = () => {
    const emptyFilters: DeviceFilters = {}
    setLocalFilters(emptyFilters)
    setFilters(emptyFilters)
  }
  
  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search devices..."
            className="pl-9"
            value={localFilters.search || ''}
            onChange={e => handleFilterChange('search', e.target.value)}
            onKeyDown={e => e.key === 'Enter' && applyFilters()}
          />
        </div>
        
        <div className="flex gap-2 flex-wrap sm:flex-nowrap">
          <Select
            value={localFilters.os || ''}
            onValueChange={value => handleFilterChange('os', value)}
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="OS Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All OS Types</SelectItem>
              <SelectItem value="android">
                <div className="flex items-center">
                  <IconBrandAndroid className="mr-2 h-4 w-4" />
                  Android
                </div>
              </SelectItem>
              <SelectItem value="ios">
                <div className="flex items-center">
                  <IconBrandApple className="mr-2 h-4 w-4" />
                  iOS
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
          
          <Select
            value={localFilters.status || ''}
            onValueChange={value => handleFilterChange('status', value)}
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Statuses</SelectItem>
              <SelectItem value="running">Running</SelectItem>
              <SelectItem value="stopped">Stopped</SelectItem>
              <SelectItem value="error">Error</SelectItem>
            </SelectContent>
          </Select>
          
          <Select
            value={localFilters.protectionLevel || ''}
            onValueChange={value => handleFilterChange('protectionLevel', value)}
          >
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Protection Level" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Protection Levels</SelectItem>
              <SelectItem value="basic">Basic</SelectItem>
              <SelectItem value="enhanced">Enhanced</SelectItem>
              <SelectItem value="maximum">Maximum</SelectItem>
            </SelectContent>
          </Select>
          
          <div className="flex gap-2">
            <Button 
              variant="secondary" 
              onClick={applyFilters}
              size="icon"
              title="Apply Filters"
            >
              <IconFilter className="h-4 w-4" />
            </Button>
            
            {isFiltering && (
              <Button 
                variant="outline" 
                onClick={clearFilters}
                size="icon"
                title="Clear Filters"
              >
                <IconFilterOff className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
