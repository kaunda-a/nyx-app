import React from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { 
  BarChart, 
  Phone, 
  MessageCircle, 
  CheckCircle, 
  Clock, 
  Calendar, 
  Globe, 
  Tag, 
  Shield, 
  Users, 
  Zap, 
  PhoneCall, 
  PhoneOff
} from 'lucide-react';
import { NumberDetails, Provider } from '../types';
import { NumberStatus, PROVIDERS, VERIFICATION_SERVICES } from '../types/enhanced-types';

interface NumbersStatsProps {
  numbers: NumberDetails[];
}

export function NumbersStats({ numbers }: NumbersStatsProps) {
  // Calculate provider distribution
  const getProviderDistribution = () => {
    const providerCounts: Record<string, number> = {};
    
    numbers.forEach(number => {
      const provider = number.provider;
      providerCounts[provider] = (providerCounts[provider] || 0) + 1;
    });
    
    return Object.entries(providerCounts)
      .map(([provider, count]) => {
        const providerInfo = PROVIDERS.find(p => p.id === provider);
        return {
          provider,
          name: providerInfo?.name || provider,
          count,
          percentage: (count / numbers.length) * 100
        };
      })
      .sort((a, b) => b.count - a.count);
  };
  
  // Calculate status distribution
  const getStatusDistribution = () => {
    const statusCounts: Record<string, number> = {};
    
    numbers.forEach(number => {
      const status = number.status;
      statusCounts[status] = (statusCounts[status] || 0) + 1;
    });
    
    return Object.entries(statusCounts)
      .map(([status, count]) => ({
        status,
        count,
        percentage: (count / numbers.length) * 100
      }))
      .sort((a, b) => b.count - a.count);
  };
  
  // Calculate verification service distribution
  const getVerificationDistribution = () => {
    // In a real implementation, this would use actual data
    // For now, we'll generate random data
    return VERIFICATION_SERVICES.map(service => ({
      service: service.id,
      name: service.name,
      count: Math.floor(Math.random() * 20),
      percentage: Math.floor(Math.random() * 100)
    })).sort((a, b) => b.count - a.count);
  };
  
  // Calculate message statistics
  const getMessageStats = () => {
    const totalMessages = numbers.reduce((sum, number) => sum + (number.message_count || 0), 0);
    const totalVerifications = numbers.reduce((sum, number) => sum + (number.verification_count || 0), 0);
    
    // Calculate average messages per number
    const avgMessages = numbers.length > 0 ? totalMessages / numbers.length : 0;
    
    // Calculate average verifications per number
    const avgVerifications = numbers.length > 0 ? totalVerifications / numbers.length : 0;
    
    return {
      totalMessages,
      totalVerifications,
      avgMessages,
      avgVerifications
    };
  };
  
  // Calculate country distribution
  const getCountryDistribution = () => {
    const countryCounts: Record<string, number> = {};
    
    numbers.forEach(number => {
      const country = number.country || 'United States';
      countryCounts[country] = (countryCounts[country] || 0) + 1;
    });
    
    return Object.entries(countryCounts)
      .map(([country, count]) => ({
        country,
        count,
        percentage: (count / numbers.length) * 100
      }))
      .sort((a, b) => b.count - a.count);
  };
  
  // Calculate tag distribution
  const getTagDistribution = () => {
    const tagCounts: Record<string, number> = {};
    
    numbers.forEach(number => {
      number.tags.forEach(tag => {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1;
      });
    });
    
    return Object.entries(tagCounts)
      .map(([tag, count]) => ({
        tag,
        count,
        percentage: (count / numbers.length) * 100
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10); // Get top 10 tags
  };
  
  // Get provider icon color
  const getProviderColor = (provider: string) => {
    switch (provider) {
      case 'textnow':
        return 'text-blue-500';
      case 'google_voice':
        return 'text-red-500';
      case '2ndline':
        return 'text-green-500';
      case 'textfree':
        return 'text-purple-500';
      default:
        return 'text-gray-500';
    }
  };
  
  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case NumberStatus.ACTIVE:
        return 'text-green-500';
      case NumberStatus.INACTIVE:
        return 'text-gray-500';
      case NumberStatus.PENDING:
        return 'text-yellow-500';
      case NumberStatus.ERROR:
        return 'text-red-500';
      case NumberStatus.EXPIRED:
        return 'text-orange-500';
      default:
        return 'text-gray-500';
    }
  };
  
  const providerDistribution = getProviderDistribution();
  const statusDistribution = getStatusDistribution();
  const verificationDistribution = getVerificationDistribution();
  const messageStats = getMessageStats();
  const countryDistribution = getCountryDistribution();
  const tagDistribution = getTagDistribution();
  
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center">
              <Phone className="h-5 w-5 mr-2 text-primary" />
              Number Statistics
            </CardTitle>
            <CardDescription>
              Overview of your virtual phone numbers
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 mt-2">
              <div className="flex flex-col items-center p-4 bg-muted/50 rounded-md">
                <div className="text-sm text-muted-foreground mb-2">Total Numbers</div>
                <div className="text-3xl font-bold text-primary">
                  {numbers.length}
                </div>
                <div className="text-xs text-muted-foreground mt-2">Across {providerDistribution.length} providers</div>
              </div>
              
              <div className="flex flex-col items-center p-4 bg-muted/50 rounded-md">
                <div className="text-sm text-muted-foreground mb-2">Active Numbers</div>
                <div className="text-3xl font-bold text-green-500">
                  {numbers.filter(n => n.status === NumberStatus.ACTIVE).length}
                </div>
                <div className="text-xs text-muted-foreground mt-2">
                  {Math.round(numbers.filter(n => n.status === NumberStatus.ACTIVE).length / numbers.length * 100)}% of total
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4 mt-4">
              <div className="flex flex-col items-center p-4 bg-muted/50 rounded-md">
                <div className="text-sm text-muted-foreground mb-2">Total Messages</div>
                <div className="text-3xl font-bold text-blue-500">
                  {messageStats.totalMessages}
                </div>
                <div className="text-xs text-muted-foreground mt-2">
                  Avg. {Math.round(messageStats.avgMessages)} per number
                </div>
              </div>
              
              <div className="flex flex-col items-center p-4 bg-muted/50 rounded-md">
                <div className="text-sm text-muted-foreground mb-2">Verifications</div>
                <div className="text-3xl font-bold text-purple-500">
                  {messageStats.totalVerifications}
                </div>
                <div className="text-xs text-muted-foreground mt-2">
                  Avg. {Math.round(messageStats.avgVerifications)} per number
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center">
              <Shield className="h-5 w-5 mr-2 text-primary" />
              Verification Services
            </CardTitle>
            <CardDescription>
              Distribution of verification services used
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 mt-2">
              {verificationDistribution.slice(0, 4).map(({ service, name, count, percentage }) => (
                <div key={service} className="space-y-2">
                  <div className="flex justify-between items-center text-sm">
                    <span className="font-medium">{name}</span>
                    <span>{count} ({Math.round(percentage)}%)</span>
                  </div>
                  <Progress value={percentage} className="h-1" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <Phone className="h-4 w-4 mr-2 text-primary" />
              Provider Distribution
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {providerDistribution.map(({ provider, name, count, percentage }) => (
              <div key={provider} className="space-y-2">
                <div className="flex justify-between items-center text-sm">
                  <div className="flex items-center">
                    <span className={`font-medium ${getProviderColor(provider)}`}>{name}</span>
                  </div>
                  <span>{count} ({Math.round(percentage)}%)</span>
                </div>
                <Progress value={percentage} className="h-1" />
              </div>
            ))}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <CheckCircle className="h-4 w-4 mr-2 text-primary" />
              Status Distribution
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {statusDistribution.map(({ status, count, percentage }) => (
              <div key={status} className="space-y-2">
                <div className="flex justify-between items-center text-sm">
                  <div className="flex items-center">
                    <span className={`font-medium capitalize ${getStatusColor(status)}`}>{status}</span>
                  </div>
                  <span>{count} ({Math.round(percentage)}%)</span>
                </div>
                <Progress value={percentage} className="h-1" />
              </div>
            ))}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <Globe className="h-4 w-4 mr-2 text-primary" />
              Country Distribution
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {countryDistribution.map(({ country, count, percentage }) => (
              <div key={country} className="space-y-2">
                <div className="flex justify-between items-center text-sm">
                  <div className="flex items-center">
                    <span className="font-medium">{country}</span>
                  </div>
                  <span>{count} ({Math.round(percentage)}%)</span>
                </div>
                <Progress value={percentage} className="h-1" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Tag className="h-5 w-5 mr-2 text-primary" />
              Top Tags
            </CardTitle>
            <CardDescription>
              Most frequently used tags for your numbers
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {tagDistribution.length > 0 ? (
                tagDistribution.map(({ tag, count, percentage }) => (
                  <div key={tag} className="flex justify-between items-center">
                    <div className="flex items-center">
                      <Tag className="h-4 w-4 mr-2 text-muted-foreground" />
                      <span className="font-medium">{tag}</span>
                    </div>
                    <div className="flex items-center">
                      <span>{count} numbers</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center text-muted-foreground py-4">
                  No tags found
                </div>
              )}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Clock className="h-5 w-5 mr-2 text-primary" />
              Activity Timeline
            </CardTitle>
            <CardDescription>
              Recent activity with your virtual numbers
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* In a real implementation, this would show actual activity data */}
              <div className="relative pl-6 pb-6 border-l border-muted">
                <div className="absolute -left-1.5 top-0 w-3 h-3 rounded-full bg-green-500"></div>
                <div className="text-sm font-medium">Number Acquired</div>
                <div className="text-xs text-muted-foreground">Today, 10:30 AM</div>
                <div className="text-sm mt-1">New number +1 (555) 123-4567 acquired from TextNow</div>
              </div>
              
              <div className="relative pl-6 pb-6 border-l border-muted">
                <div className="absolute -left-1.5 top-0 w-3 h-3 rounded-full bg-blue-500"></div>
                <div className="text-sm font-medium">Verification Completed</div>
                <div className="text-xs text-muted-foreground">Yesterday, 3:45 PM</div>
                <div className="text-sm mt-1">Number +1 (555) 987-6543 verified with WhatsApp</div>
              </div>
              
              <div className="relative pl-6 pb-6 border-l border-muted">
                <div className="absolute -left-1.5 top-0 w-3 h-3 rounded-full bg-yellow-500"></div>
                <div className="text-sm font-medium">Message Received</div>
                <div className="text-xs text-muted-foreground">2 days ago, 11:20 AM</div>
                <div className="text-sm mt-1">Verification code received on +1 (555) 456-7890</div>
              </div>
              
              <div className="relative pl-6">
                <div className="absolute -left-1.5 top-0 w-3 h-3 rounded-full bg-red-500"></div>
                <div className="text-sm font-medium">Number Expired</div>
                <div className="text-xs text-muted-foreground">3 days ago, 9:15 AM</div>
                <div className="text-sm mt-1">Number +1 (555) 234-5678 expired</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
