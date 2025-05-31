import { NumberDetails, Provider, Message } from './index';

export enum NumberStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  PENDING = 'pending',
  ERROR = 'error',
  EXPIRED = 'expired'
}

export interface NumberStats {
  totalMessages: number;
  incomingMessages: number;
  outgoingMessages: number;
  verifications: number;
  lastActivity: string | null;
}

export interface NumberFilters {
  provider: string;
  status: string;
  search: string;
  tags: string[];
}

export interface NumberWithStats extends NumberDetails {
  stats?: NumberStats;
}

export interface ProviderInfo {
  id: Provider;
  name: string;
  icon: string;
  capabilities: string[];
  description: string;
}

export interface VerificationService {
  id: string;
  name: string;
  icon: string;
  description: string;
}

export const PROVIDERS: ProviderInfo[] = [
  {
    id: 'textnow',
    name: 'TextNow',
    icon: 'textnow',
    capabilities: ['sms', 'mms', 'voice'],
    description: 'Free texting and calling app with a real US phone number'
  },
  {
    id: 'google_voice',
    name: 'Google Voice',
    icon: 'google',
    capabilities: ['sms', 'mms', 'voice', 'voicemail'],
    description: 'Google Voice provides call forwarding, voicemail, and messaging'
  },
  {
    id: '2ndline',
    name: '2nd Line',
    icon: '2ndline',
    capabilities: ['sms', 'mms', 'voice'],
    description: 'Second phone number for calling and texting'
  },
  {
    id: 'textfree',
    name: 'TextFree',
    icon: 'textfree',
    capabilities: ['sms', 'mms', 'voice'],
    description: 'Free texting and calling with a real phone number'
  }
];

export const VERIFICATION_SERVICES: VerificationService[] = [
  {
    id: 'whatsapp',
    name: 'WhatsApp',
    icon: 'whatsapp',
    description: 'Verify number with WhatsApp'
  },
  {
    id: 'telegram',
    name: 'Telegram',
    icon: 'telegram',
    description: 'Verify number with Telegram'
  },
  {
    id: 'signal',
    name: 'Signal',
    icon: 'signal',
    description: 'Verify number with Signal'
  },
  {
    id: 'facebook',
    name: 'Facebook',
    icon: 'facebook',
    description: 'Verify number with Facebook'
  },
  {
    id: 'twitter',
    name: 'Twitter',
    icon: 'twitter',
    description: 'Verify number with Twitter'
  },
  {
    id: 'instagram',
    name: 'Instagram',
    icon: 'instagram',
    description: 'Verify number with Instagram'
  }
];
