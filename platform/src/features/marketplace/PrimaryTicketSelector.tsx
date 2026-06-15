import { useLanguage } from "../../contexts/LanguageContext";
import React from 'react';
export default function PrimaryTicketSelector({
  event,
  tiers,
  cart,
  updateCart,
  customAccentColor
}: {
  event: any;
  tiers: any[];
  cart: {
    [tierId: string]: number;
  };
  updateCart: (tierId: string, delta: number) => void;
  customAccentColor: string;
}) {
  const {
    t
  } = useLanguage();
  return <div style={{
    borderTop: '1px solid rgba(255,255,255,0.1)',
    paddingTop: '32px'
  }}>
      <h3 style={{
      marginBottom: '24px'
    }}>{t("tickets")}</h3>
      {event.is_external ? <div style={{
      textAlign: 'center',
      padding: '40px',
      border: '1px dashed rgba(255,255,255,0.2)',
      borderRadius: '12px',
      backgroundColor: 'rgba(255,255,255,0.05)'
    }}>
          <h4 style={{
        marginBottom: '16px',
        fontSize: '1.4rem'
      }}>{t("ticketsAvailableOnExternal")}</h4>
          <p style={{
        color: 'rgba(255,255,255,0.7)',
        marginBottom: '24px'
      }}>{t("thisEventIsHostedBy")}{event.organizers?.name || 'an independent organizer'}{t("andTicketsAreSoldExternall")}</p>
          {event.external_ticket_url ? <a href={event.external_ticket_url} target="_blank" rel="noopener noreferrer" className="btn-primary" style={{
        backgroundColor: customAccentColor,
        display: 'inline-block',
        textDecoration: 'none',
        padding: '14px 32px',
        fontSize: '1.1rem'
      }}>{t("getTicketsNow")}</a> : <p style={{
        color: '#ef4444'
      }}>{t("ticketLinkIsCurrentlyUnava")}</p>}
        </div> : tiers.length === 0 ? <div style={{
      textAlign: 'center',
      padding: '40px',
      border: '1px dashed rgba(255,255,255,0.2)',
      borderRadius: '12px'
    }}>
          <p style={{
        color: 'rgba(255,255,255,0.6)'
      }}>{t("theOrganizerHasnTSetUpTi")}</p>
        </div> : <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '16px'
    }}>
          {tiers.map(tier => {
        const {
          t
        } = useLanguage();
        const quantity = cart[tier.id] || 0;
        return <div key={tier.id} className="glass-panel" style={{
          padding: '20px',
          display: 'flex',
          flexWrap: 'wrap',
          gap: '16px',
          justifyContent: 'space-between',
          alignItems: 'center',
          backgroundColor: 'rgba(255,255,255,0.05)'
        }}>
                <div>
                  <h4 style={{
              margin: '0 0 8px 0',
              fontSize: '1.2rem'
            }}>{tier.name}</h4>
                  <p style={{
              color: 'rgba(255,255,255,0.6)',
              margin: 0,
              fontSize: '0.9rem'
            }}>{t("capacity")}{tier.capacity}</p>
                </div>
                <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '24px'
          }}>
                  <div style={{
              fontSize: '1.4rem',
              fontWeight: 600,
              color: 'white'
            }}>
                    €{((tier.pricing?.amount || 0) / 100).toFixed(2)}
                  </div>
                  
                  <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              backgroundColor: 'rgba(0,0,0,0.3)',
              padding: '4px',
              borderRadius: '8px'
            }}>
                    <button onClick={() => updateCart(tier.id, -1)} disabled={quantity === 0} aria-disabled={quantity === 0} aria-label={`Decrease quantity of ${tier.name}`} style={{
                width: '32px',
                height: '32px',
                borderRadius: '4px',
                border: 'none',
                backgroundColor: quantity > 0 ? 'rgba(255,255,255,0.1)' : 'transparent',
                color: 'white',
                cursor: quantity > 0 ? 'pointer' : 'not-allowed'
              }}>-</button>
                    <span style={{
                minWidth: '20px',
                textAlign: 'center',
                fontWeight: 600
              }} aria-live="polite">{quantity}</span>
                    <button onClick={() => updateCart(tier.id, 1)} aria-label={`Increase quantity of ${tier.name}`} style={{
                width: '32px',
                height: '32px',
                borderRadius: '4px',
                border: 'none',
                backgroundColor: 'rgba(255,255,255,0.1)',
                color: 'white',
                cursor: 'pointer'
              }}>+</button>
                  </div>
                </div>
              </div>;
      })}
        </div>}
    </div>;
}