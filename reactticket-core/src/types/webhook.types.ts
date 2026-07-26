export type WebhookEventType = 'ticket.scanned' | 'ticket.issued' | 'ticket.cancelled' | 'waitlist.joined';

export interface WebhookSubscription {
  id: string;
  eventId: string;
  url: string;
  events: WebhookEventType[];
  secret?: string;
  active: boolean;
  createdAt: Date;
}

export interface WebhookPayload<T = any> {
  id: string;
  event: WebhookEventType;
  timestamp: string;
  eventId: string;
  data: T;
  signature?: string;
}
