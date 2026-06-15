import { supabase } from '../../../lib/supabase';

export async function handlePayPalWebhook(event: any) {
    if (event.event_type === 'PAYMENT.CAPTURE.COMPLETED') {
        const resource = event.resource;
        const paypalOrderId = resource.supplementary_data.related_ids.order_id;
        
        // Call the SQL RPC function we created in the migration
        const { error } = await supabase.rpc('issue_tickets_if_not_issued', {
            p_paypal_order_id: paypalOrderId,
            p_capture_id: resource.id
        });
        
        if (error) {
            console.error('Webhook error:', error);
            throw error;
        }
        return { status: 'success' };
    }
    return { status: 'ignored' };
}
