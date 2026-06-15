export interface PayPalOrderRequest {
  intent: 'CAPTURE' | 'AUTHORIZE';
  purchase_units: {
    payee: {
      merchant_id: string;
    };
    amount: {
      currency_code: string;
      value: string;
    };
    reference_id?: string;
  }[];
}

export interface PayPalOrderResponse {
  id: string;
  status: string;
  links: { href: string; rel: string; method: string }[];
}
