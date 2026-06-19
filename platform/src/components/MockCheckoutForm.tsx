import { useLanguage } from "../contexts/LanguageContext";
import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import Modal from './Modal';

interface CheckoutModalProps {
  eventId: string;
  amountCents: number;
  itemName: string;
  onConfirm: (promoCodeObj?: any) => Promise<void>;
  onCancel: () => void;
}

export default function MockCheckoutForm({
  eventId,
  amountCents,
  itemName,
  onConfirm,
  onCancel
}: CheckoutModalProps) {
  const { t } = useLanguage();
  const [loading, setLoading] = useState(false);

  const finalAmountCents = amountCents;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await new Promise(r => setTimeout(r, 1500));
    await onConfirm();
    setLoading(false);
  };

  return (
    <Modal isOpen={true} onClose={onCancel} title={t("secureCheckout")} maxWidth="400px">
      <div>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>
          {t("paymentFor")}<strong>{itemName}</strong>.
        </p>

        <div style={{
          padding: '16px',
          backgroundColor: 'rgba(255,255,255,0.05)',
          borderRadius: '8px',
          marginBottom: '24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px', paddingTop: '8px' }}>
            <strong>{t("total")}</strong>
            <strong style={{ fontSize: '1.2rem', color: 'var(--accent)' }}>
              €{(finalAmountCents / 100).toFixed(2)}
            </strong>
          </div>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
            <button type="button" onClick={onCancel} className="btn-secondary" style={{ flex: 1 }}>
              {t("cancel")}
            </button>
            <button type="submit" disabled={loading} aria-disabled={loading} className="btn-primary" style={{ flex: 1 }}>
              {loading ? 'Processing...' : `Pay €{(finalAmountCents / 100).toFixed(2)}`}
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
}
