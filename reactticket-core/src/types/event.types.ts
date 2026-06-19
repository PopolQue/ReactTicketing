import { TicketTypeConfig } from './ticket.types';

export interface EventConfig {
  id: string;
  name: string;
  description?: string;
  venue?: string;
  startDate: Date;
  endDate?: Date;
  logoUrl?: string;
  organizerName: string;
  timezone: string;
  ticketTypes: TicketTypeConfig[];
  settings: EventSettings;
}

export interface EventSettings {
  maxOrderSize: number;
  requireBuyerEmail: boolean;
  scanWindowMinutes?: number;
  adminKey: string;
  scanSessionSecret?: string;
  qrSigningSecret?: string;
  scanSessionTTLHours?: number;
  maxClockSkewSeconds?: number;
  locale?: string;
}
