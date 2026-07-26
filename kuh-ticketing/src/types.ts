import { TicketTypeConfig } from 'reactticket-core';

export interface KuhFestivalConfig {
  festivalName: string;
  tagline: string;
  startDate: string;
  endDate: string;
  location: string;
  primaryColor?: string;
  accentColor?: string;
  bannerImageUrl?: string;
  campingAllowed?: boolean;
}

export interface FestivalTicketTier extends TicketTypeConfig {
  campingIncluded?: boolean;
  vipAccess?: boolean;
  badgeLabel?: string;
  earlyBirdUntil?: string;
}

export interface KuhOrderPayload {
  festivalName: string;
  items: Array<{
    ticketTypeId: string;
    ticketName: string;
    quantity: number;
    priceInCents: number;
  }>;
  buyerEmail: string;
  buyerName: string;
  totalInCents: number;
}
