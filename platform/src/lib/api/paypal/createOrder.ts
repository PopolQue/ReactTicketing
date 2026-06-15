import { PayPalService } from 'reactticket-core/services/PayPalService';

export async function createPayPalOrder(
    organizerPaypalId: string,
    amount: number,
    currency: string,
    orderId: string
) {
    const service = new PayPalService(
        process.env.PAYPAL_CLIENT_ID || '',
        process.env.PAYPAL_CLIENT_SECRET || ''
    );
    
    return await service.createOrder({
        intent: 'CAPTURE',
        purchase_units: [{
            payee: { merchant_id: organizerPaypalId },
            amount: { currency_code: currency, value: (amount / 100).toFixed(2) },
            reference_id: orderId
        }]
    });
}
