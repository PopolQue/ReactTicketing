import { StorageAdapter } from "../types/adapter.types";
import { PromoCode } from "../types/promo.types";
import { Order } from "../types/ticket.types";

export class PromoService {
  constructor(private adapter: StorageAdapter) {}

  async validate(code: string, order: Order): Promise<boolean> {
    const promo = await this.adapter.getPromoCode(code);
    if (!promo || !promo.active) return false;
    
    if (promo.expiresAt && promo.expiresAt < new Date()) return false;
    if (promo.maxUses !== undefined && promo.usedCount >= promo.maxUses) return false;

    // Check if appliesTo matches
    if (promo.appliesTo && promo.appliesTo.length > 0) {
        const itemIds = order.items.map(item => item.ticketTypeId);
        const hasMatch = promo.appliesTo.some(id => itemIds.includes(id));
        if (!hasMatch) return false;
    }

    return true;
  }
}
