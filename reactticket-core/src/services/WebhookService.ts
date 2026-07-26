import { WebhookSubscription, WebhookPayload, WebhookEventType } from '../types/webhook.types';
import { generateHMAC } from '../utils/crypto';

export class WebhookService {
  private subscriptions: WebhookSubscription[] = [];

  registerSubscription(sub: Omit<WebhookSubscription, 'id' | 'createdAt'>): WebhookSubscription {
    const subscription: WebhookSubscription = {
      id: `wh_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      ...sub,
      createdAt: new Date(),
    };
    this.subscriptions.push(subscription);
    return subscription;
  }

  getSubscriptions(eventId: string): WebhookSubscription[] {
    return this.subscriptions.filter((s) => s.eventId === eventId && s.active);
  }

  private async secretToKey(secret: string): Promise<CryptoKey> {
    const encoder = new TextEncoder();
    return crypto.subtle.importKey(
      'raw',
      encoder.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign', 'verify']
    );
  }

  async buildPayload<T>(
    subscription: WebhookSubscription,
    eventType: WebhookEventType,
    data: T
  ): Promise<WebhookPayload<T>> {
    const timestamp = new Date().toISOString();
    const payloadId = `evt_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    
    const payload: WebhookPayload<T> = {
      id: payloadId,
      event: eventType,
      timestamp,
      eventId: subscription.eventId,
      data,
    };

    if (subscription.secret) {
      const messageToSign = `${payloadId}.${timestamp}.${JSON.stringify(data)}`;
      const key = await this.secretToKey(subscription.secret);
      const sigBuffer = await generateHMAC(key, messageToSign);
      payload.signature = Array.from(new Uint8Array(sigBuffer))
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('');
    }

    return payload;
  }

  async dispatchEvent<T>(
    eventId: string,
    eventType: WebhookEventType,
    data: T,
    fetchFn: typeof fetch = fetch
  ): Promise<{ subscriptionId: string; status: number; success: boolean }[]> {
    const activeSubs = this.getSubscriptions(eventId).filter((s) => s.events.includes(eventType));
    const results = [];

    for (const sub of activeSubs) {
      try {
        const payload = await this.buildPayload(sub, eventType, data);
        const response = await fetchFn(sub.url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(payload.signature ? { 'X-Signature-SHA256': payload.signature } : {}),
          },
          body: JSON.stringify(payload),
        });

        results.push({
          subscriptionId: sub.id,
          status: response.status,
          success: response.ok,
        });
      } catch (err) {
        results.push({
          subscriptionId: sub.id,
          status: 0,
          success: false,
        });
      }
    }

    return results;
  }
}
