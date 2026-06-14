export type DiscountRule = {
    kind: "percent_off";
    percent: number;
} | {
    kind: "amount_off";
    amountCents: number;
} | {
    kind: "free";
};
export interface PromoCode {
    code: string;
    discount: DiscountRule;
    appliesTo?: string[];
    maxUses?: number;
    usedCount: number;
    expiresAt?: Date;
    createdAt: Date;
    active: boolean;
    batchId?: string;
    sentAt?: Date;
    redeemedAt?: Date;
}
export interface PromoBatch {
    id: string;
    name: string;
    discount: DiscountRule;
    expiresAt: Date;
    codes: PromoCode[];
    archived?: boolean;
}
export interface PromoGenerateOptions {
    count: number;
    discount: DiscountRule;
    appliesTo?: string[];
    maxUses?: number;
    expiresAt?: Date;
}
