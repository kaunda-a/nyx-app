import React from 'react';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
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

interface EnhancedNumbersTableProps {
  numbers: NumberDetails[];
  selectedNumbers: string[];
  onSelectNumber: (numberId: string) => void;
  onSelectAll: () => void;
  onViewDetails: (number: NumberDetails) => void;
  onVerify: (number: NumberDetails) => void;
  onRefresh: (number: NumberDetails) => void;
  onDelete: (number: NumberDetails) => void;
  getProviderIcon: (provider: Provider) => React.ReactNode;
  getStatusBadgeVariant: (status: string) => string;
}

export function EnhancedNumbersTable({
  numbers,
  selectedNumbers,
  onSelectNumber,
  onSelectAll,
  onViewDetails,
  onVerify,
  onRefresh,
  onDelete,
  getProviderIcon,
  getStatusBadgeVariant
}: EnhancedNumbersTableProps) {
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
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12">
              <Checkbox 
                checked={selectedNumbers.length === numbers.length && numbers.length > 0} 
                onCheckedChange={onSelectAll}
              />
            </TableHead>
            <TableHead>Number</TableHead>
            <TableHead>Provider</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Messages</TableHead>
            <TableHead>Verifications</TableHead>
            <TableHead>Last Activity</TableHead>
            <TableHead>Tags</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {numbers.length === 0 ? (
            <TableRow>
              <TableCell colSpan={9} className="h-24 text-center">
                No numbers found
              </TableCell>
            </TableRow>
          ) : (
            numbers.map((number) => (
              <TableRow key={number.id}>
                <TableCell>
                  <Checkbox 
                    checked={selectedNumbers.includes(number.id)} 
                    onCheckedChange={() => onSelectNumber(number.id)}
                  />
                </TableCell>
                <TableCell>
                  <div className="flex items-center space-x-3">
                    <div className="bg-muted rounded-md p-2 relative">
                      <Phone className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <div 
                        className="font-medium cursor-pointer hover:text-primary transition-colors"
                        onClick={() => navigator.clipboard.writeText(number.number)}
                        title="Click to copy"
                      >
                        {formatPhoneNumber(number.number)}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {number.country || 'United States'}
                      </div>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center space-x-2">
                    {getProviderIcon(number.provider)}
                    <span>
                      {number.provider_name || number.provider}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge
                    variant="outline"
                    className={`capitalize ${getStatusBadgeVariant(number.status)}`}
                  >
                    {number.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center">
                    <MessageCircle className="h-4 w-4 mr-2 text-muted-foreground" />
                    <span>{number.message_count || 0}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center">
                    <CheckCircle className="h-4 w-4 mr-2 text-muted-foreground" />
                    <span>{number.verification_count || 0}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center text-muted-foreground">
                    <Clock className="h-3.5 w-3.5 mr-1" />
                    {formatDate(number.last_activity)}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {number.tags.slice(0, 2).map((tag, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                    {number.tags.length > 2 && (
                      <Badge variant="outline" className="text-xs">
                        +{number.tags.length - 2}
                      </Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end space-x-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => onViewDetails(number)}
                      title="View Messages"
                    >
                      <MessageCircle className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => onVerify(number)}
                      title="Verify"
                    >
                      <CheckCircle className="h-4 w-4" />
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => navigator.clipboard.writeText(number.number)}>
                          <Copy className="h-4 w-4 mr-2" />
                          Copy Number
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onViewDetails(number)}>
                          <MessageCircle className="h-4 w-4 mr-2" />
                          View Messages
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onVerify(number)}>
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Verify
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onRefresh(number)}>
                          <RefreshCw className="h-4 w-4 mr-2" />
                          Refresh
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          onClick={() => onDelete(number)}
                          className="text-destructive focus:text-destructive"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
