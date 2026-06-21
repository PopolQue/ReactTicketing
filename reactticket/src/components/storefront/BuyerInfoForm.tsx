import React from 'react';
import { useReactTicket } from '../../hooks/useReactTicket';
import { TicketPersonalization } from 'reactticket-core/types/ticket.types';
import { useI18n } from '../../context/I18nContext';

export const BuyerInfoForm: React.FC = () => {
  const { cart, dispatch, ticketTypes } = useReactTicket();
  const { t } = useI18n();

  const updatePersonalization = (
    ticketTypeId: string,
    index: number,
    field: keyof TicketPersonalization,
    value: string
  ) => {
    const existing = cart.personalizations[ticketTypeId] || [];
    const updated = [...existing];
    updated[index] = { ...updated[index], [field]: value } as TicketPersonalization;
    dispatch({ type: 'SET_PERSONALIZATION', payload: { ticketTypeId, personalizations: updated } });
  };

  return (
    <div style={{ marginTop: '20px' }}>
      <h3>{t('buyer.personalization')}</h3>
      {cart.items.map((item) => {
        const type = ticketTypes.find((t) => t.id === item.ticketTypeId);
        if (!type) return null;

        return (
          <div
            key={item.ticketTypeId}
            style={{ marginBottom: '15px' }}
            role="group"
            aria-label={`Personalization for ${type.name}`}
          >
            <h4>{type.name}</h4>
            {Array.from({ length: item.quantity }).map((_, idx) => {
              const p = (cart.personalizations[item.ticketTypeId] || [])[idx] || {
                name: '',
                surname: '',
                country: '',
                city: '',
                email: '',
                phone: '',
                zip: '',
              };
              const labelPrefix = `${type.name} ticket ${idx + 1}`;
              return (
                <div
                  key={idx}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '5px',
                    marginBottom: '10px',
                  }}
                  role="group"
                  aria-label={labelPrefix}
                >
                  <input
                    aria-label={`${labelPrefix} Name`}
                    placeholder={t('buyer.name')}
                    value={p.name}
                    onChange={(e) =>
                      updatePersonalization(item.ticketTypeId, idx, 'name', e.target.value)
                    }
                  />
                  <input
                    aria-label={`${labelPrefix} Surname`}
                    placeholder={t('buyer.surname')}
                    value={p.surname}
                    onChange={(e) =>
                      updatePersonalization(item.ticketTypeId, idx, 'surname', e.target.value)
                    }
                  />
                  <input
                    aria-label={`${labelPrefix} Email`}
                    type="email"
                    placeholder={t('buyer.email')}
                    value={p.email}
                    onChange={(e) =>
                      updatePersonalization(item.ticketTypeId, idx, 'email', e.target.value)
                    }
                  />
                  <input
                    aria-label={`${labelPrefix} Country`}
                    placeholder={t('buyer.country')}
                    value={p.country}
                    onChange={(e) =>
                      updatePersonalization(item.ticketTypeId, idx, 'country', e.target.value)
                    }
                  />
                  <input
                    aria-label={`${labelPrefix} City`}
                    placeholder={t('buyer.city')}
                    value={p.city}
                    onChange={(e) =>
                      updatePersonalization(item.ticketTypeId, idx, 'city', e.target.value)
                    }
                  />
                  <input
                    aria-label={`${labelPrefix} Phone`}
                    type="tel"
                    placeholder={t('buyer.phone')}
                    value={p.phone || ''}
                    onChange={(e) =>
                      updatePersonalization(item.ticketTypeId, idx, 'phone', e.target.value)
                    }
                  />
                  <input
                    aria-label={`${labelPrefix} ZIP`}
                    placeholder={t('buyer.zip')}
                    value={p.zip || ''}
                    onChange={(e) =>
                      updatePersonalization(item.ticketTypeId, idx, 'zip', e.target.value)
                    }
                  />
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
};
