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
  MoreVertical, 
  Trash2, 
  RefreshCw, 
  CheckCircle, 
  Copy, 
  MessageCircle, 
  Phone, 
  ExternalLink, 
  Clock, 
  Calendar, 
  Tag
} from 'lucide-react';
import { NumberDetails, Provider } from '../types';
import { formatDistanceToNow } from 'date-fns';

interface NumbersGridProps {
  numbers: NumberDetails[];
  selectedNumbers: string[];
  onSelectNumber: (numberId: string) => void;
  onViewDetails: (number: NumberDetails) => void;
  onVerify: (number: NumberDetails) => void;
  onRefresh: (number: NumberDetails) => void;
  onDelete: (number: NumberDetails) => void;
  getProviderIcon: (provider: Provider) => React.ReactNode;
  getStatusBadgeVariant: (status: string) => string;
}

export function NumbersGrid({
  numbers,
  selectedNumbers,
  onSelectNumber,
  onViewDetails,
  onVerify,
  onRefresh,
  onDelete,
  getProviderIcon,
  getStatusBadgeVariant
}: NumbersGridProps) {
  // Format date
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Never';
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    } catch (e) {
      return 'Invalid date';
    }
  };
  
  // Format phone number
  const formatPhoneNumber = (number: string) => {
    if (!number) return '';
    
    // Format US numbers like (123) 456-7890
    if (number.startsWith('+1') && number.length === 12) {
      return `(${number.substring(2, 5)}) ${number.substring(5, 8)}-${number.substring(8)}`;
    }
    
    return number;
  };
  
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {numbers.map((number) => (
        <Card 
          key={number.id} 
          className={`overflow-hidden transition-all hover:shadow-md ${
            selectedNumbers.includes(number.id) ? 'ring-2 ring-primary' : ''
          }`}
          onClick={() => onSelectNumber(number.id)}
        >
          <CardHeader className="p-4 pb-2">
            <div className="flex justify-between items-start">
              <CardTitle className="text-base flex items-center">
                {getProviderIcon(number.provider)}
                <span className="ml-2 truncate">{number.provider_name || number.provider}</span>
              </CardTitle>
              <Badge
                variant="outline"
                className={`capitalize ${getStatusBadgeVariant(number.status)}`}
              >
                {number.status}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="space-y-4">
              <div className="flex justify-center items-center py-4">
                <div className="relative">
                  <div className="bg-muted rounded-full p-6 relative overflow-hidden group">
                    <Phone className="h-6 w-6 text-primary" />
                    <div className="absolute inset-0 bg-primary/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <Copy className="h-4 w-4 text-primary" />
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="text-center">
                <div 
                  className="text-xl font-bold cursor-pointer hover:text-primary transition-colors"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigator.clipboard.writeText(number.number);
                  }}
                  title="Click to copy"
                >
                  {formatPhoneNumber(number.number)}
                </div>
                <div className="text-sm text-muted-foreground mt-1">
                  {number.country || 'United States'}
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between items-center text-sm">
                  <div className="flex items-center text-muted-foreground">
                    <MessageCircle className="h-3.5 w-3.5 mr-1" />
                    <span>Messages:</span>
                  </div>
                  <span className="font-medium">{number.message_count || 0}</span>
                </div>
                
                <div className="flex justify-between items-center text-sm">
                  <div className="flex items-center text-muted-foreground">
                    <CheckCircle className="h-3.5 w-3.5 mr-1" />
                    <span>Verifications:</span>
                  </div>
                  <span className="font-medium">{number.verification_count || 0}</span>
                </div>
                
                <div className="flex justify-between items-center text-sm">
                  <div className="flex items-center text-muted-foreground">
                    <Calendar className="h-3.5 w-3.5 mr-1" />
                    <span>Acquired:</span>
                  </div>
                  <span className="font-medium">
                    {formatDate(number.created_at)}
                  </span>
                </div>
                
                <div className="flex justify-between items-center text-sm">
                  <div className="flex items-center text-muted-foreground">
                    <Clock className="h-3.5 w-3.5 mr-1" />
                    <span>Last Activity:</span>
                  </div>
                  <span className="font-medium">
                    {formatDate(number.last_activity)}
                  </span>
                </div>
              </div>
              
              {number.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {number.tags.slice(0, 3).map((tag, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                  {number.tags.length > 3 && (
                    <Badge variant="outline" className="text-xs">
                      +{number.tags.length - 3}
                    </Badge>
                  )}
                </div>
              )}
            </div>
          </CardContent>
          <CardFooter className="p-4 flex justify-between border-t">
            <Button
              variant="default"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onViewDetails(number);
              }}
              className="flex-1 mr-2"
            >
              <MessageCircle className="h-4 w-4 mr-2" />
              Messages
            </Button>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                <Button variant="outline" size="icon">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                <DropdownMenuItem onClick={(e) => {
                  e.stopPropagation();
                  navigator.clipboard.writeText(number.number);
                }}>
                  <Copy className="h-4 w-4 mr-2" />
                  Copy Number
                </DropdownMenuItem>
                <DropdownMenuItem onClick={(e) => {
                  e.stopPropagation();
                  onVerify(number);
                }}>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Verify
                </DropdownMenuItem>
                <DropdownMenuItem onClick={(e) => {
                  e.stopPropagation();
                  onRefresh(number);
                }}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(number);
                  }}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}
