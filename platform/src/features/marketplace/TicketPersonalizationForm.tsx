import { useLanguage } from "../../contexts/LanguageContext";
import React from 'react';
export default function TicketPersonalizationForm({
  ticketForm,
  index,
  checkoutFields,
  onAnswerChange
}: {
  ticketForm: any;
  index: number;
  checkoutFields: any[];
  onAnswerChange: (ticketId: string, fieldId: string, value: string) => void;
}) {
  const {
    t
  } = useLanguage();
  return <div style={{
    marginBottom: '24px',
    padding: '20px',
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: '8px'
  }}>
      <h4 style={{
      margin: '0 0 16px 0',
      color: 'var(--accent)'
    }}>{t("ticket")}{index + 1}: {ticketForm.tier.name}</h4>
      
      {checkoutFields.length === 0 ? <p style={{
      color: 'var(--text-secondary)',
      margin: 0
    }}>{t("noAdditionalInformationRequ")}</p> : <div style={{
      display: 'grid',
      gap: '16px'
    }}>
          {checkoutFields.map(f => <div key={f.id}>
              <label style={{
          display: 'block',
          marginBottom: '8px',
          fontSize: '0.9rem',
          color: 'var(--text-secondary)'
        }}>
                {f.label} {f.is_required && <span style={{
            color: '#ef4444'
          }}>*</span>}
              </label>
              <input type={f.field_type === 'EMAIL' ? 'email' : f.field_type === 'PHONE' ? 'tel' : f.field_type === 'AGE' ? 'number' : 'text'} required={f.is_required} className="input-field" value={ticketForm.answers[f.id] || ''} onChange={e => onAnswerChange(ticketForm.id, f.id, e.target.value)} placeholder={`Enter ${f.label.toLowerCase()}`} />
            </div>)}
        </div>}
    </div>;
}