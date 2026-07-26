import { describe, it, expect, vi } from 'vitest';
import { WebhookService } from '../WebhookService';

describe('WebhookService', () => {
  const webhookService = new WebhookService();

  it('registers and retrieves active subscriptions', () => {
    const sub = webhookService.registerSubscription({
      eventId: 'evt_1',
      url: 'https://example.com/webhook',
      events: ['ticket.scanned', 'ticket.issued'],
      active: true,
    });

    expect(sub.id).toBeDefined();
    expect(sub.eventId).toBe('evt_1');

    const subs = webhookService.getSubscriptions('evt_1');
    expect(subs).toHaveLength(1);
  });

  it('builds payload with HMAC signature when secret is provided', async () => {
    const sub = webhookService.registerSubscription({
      eventId: 'evt_1',
      url: 'https://example.com/webhook',
      events: ['ticket.scanned'],
      secret: 'super-secret-key',
      active: true,
    });

    const payload = await webhookService.buildPayload(sub, 'ticket.scanned', { ticketId: 't_100' });
    expect(payload.signature).toBeDefined();
    expect(typeof payload.signature).toBe('string');
  });

  it('dispatches webhook requests to registered endpoints', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
    });

    const results = await webhookService.dispatchEvent('evt_1', 'ticket.scanned', { ticketId: 't_100' }, mockFetch as any);
    expect(mockFetch).toHaveBeenCalled();
    expect(results).toHaveLength(2); // From both registered subscriptions
  });
});
