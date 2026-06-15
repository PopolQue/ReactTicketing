import { useLanguage } from "../../contexts/LanguageContext";
import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../components/Toast';
import Dropdown from '../../components/Dropdown';
export default function TicketTiersManager({
  event,
  eventId,
  tiers,
  setTiers,
  updateEvent
}: {
  event: any;
  eventId: string;
  tiers: any[];
  setTiers: any;
  updateEvent: any;
}) {
  const {
    t
  } = useLanguage();
  const {
    showToast
  } = useToast();
  const [tierForm, setTierForm] = useState({
    name: '',
    capacity: ''
  });

  // Pricing state
  const [mode, setMode] = useState<'customer' | 'organizer'>('customer');
  const [inputValue, setInputValue] = useState<string>('');
  const [currency, setCurrency] = useState('EUR');

  // Constants for fees
  const FLAT_FEE_CENTS = 80;
  const VARIABLE_FEE_PERCENT = 4.4;
  const MULTIPLIER = 1 - VARIABLE_FEE_PERCENT / 100;
  const handleExternalUrlUpdate = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const newUrl = e.target.value;
    updateEvent({
      external_ticket_url: newUrl
    });
  };
  const saveExternalUrl = async () => {
    const {
      error
    } = await supabase.from('events').update({
      external_ticket_url: event.external_ticket_url
    }).eq('id', eventId);
    if (error) showToast("Failed to update URL", "error");else showToast("External URL updated successfully", "success");
  };
  const handleCreateTier = async (e: React.FormEvent) => {
    e.preventDefault();
    let priceCents = 0;
    const parsed = parseFloat(inputValue);
    if (!isNaN(parsed) && parsed > 0) {
      if (mode === 'customer') {
        priceCents = Math.round(parsed * 100);
      } else {
        const C = (parsed + FLAT_FEE_CENTS / 100) / MULTIPLIER;
        priceCents = Math.round(C * 100);
      }
    }
    const {
      data,
      error
    } = await supabase.from('ticket_types').insert([{
      id: crypto.randomUUID(),
      event_id: eventId,
      name: tierForm.name,
      pricing: {
        amount: priceCents,
        currency: currency
      },
      capacity: parseInt(tierForm.capacity)
    }]).select();
    if (!error && data) {
      setTiers([...tiers, data[0]]);
      setTierForm({
        name: '',
        capacity: ''
      });
      setInputValue('');
    }
  };
  const getBreakdown = () => {
    const parsed = parseFloat(inputValue);
    if (isNaN(parsed) || parsed <= 0) return null;
    if (mode === 'organizer') {
      const O = parsed;
      const C = (O + FLAT_FEE_CENTS / 100) / MULTIPLIER;
      return `What Customers Pay: ${C.toFixed(2)} ${currency}`;
    } else {
      const C = parsed;
      const O = C * MULTIPLIER - FLAT_FEE_CENTS / 100;
      return `What You Get: ${(O > 0 ? O : 0).toFixed(2)} ${currency}`;
    }
  };
  return <div className="glass-panel" style={{
    padding: '24px'
  }}>
      {event?.is_external ? <div>
          <h3>{t("externalEventLink")}</h3>
          <p style={{
        color: 'var(--text-secondary)'
      }}>{t("thisEventLinksToAnExterna")}</p>
          <div style={{
        marginTop: '16px'
      }}>
            <label style={{
          display: 'block',
          marginBottom: '8px',
          color: 'var(--text-secondary)'
        }}>{t("ticketUrl")}</label>
            <div style={{
          display: 'flex',
          gap: '12px'
        }}>
              <input type="url" className="input-field" value={event?.external_ticket_url || ''} onChange={handleExternalUrlUpdate} placeholder={t("https")} />
              <button onClick={saveExternalUrl} className="btn-secondary">{t("saveUrl")}</button>
            </div>
          </div>
        </div> : <>
          <h3>{t("ticketTiers")}</h3>
          <div style={{
        margin: '20px 0',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px'
      }}>
            {tiers.length === 0 ? <p style={{
          color: 'var(--text-secondary)'
        }}>{t("noTicketsAddedYet")}</p> : tiers.map(tier => {
          const {
            t
          } = useLanguage();
          return <div key={tier.id} style={{
            display: 'flex',
            justifyContent: 'space-between',
            padding: '12px',
            backgroundColor: 'rgba(0,0,0,0.2)',
            borderRadius: '8px'
          }}>
                <div>
                  <strong style={{
                display: 'block',
                marginBottom: '4px'
              }}>{tier.name}</strong>
                  <div style={{
                fontSize: '0.85rem',
                color: 'var(--text-secondary)'
              }}>{t("capacity")}{tier.capacity}</div>
                </div>
                <div style={{
              fontWeight: 600,
              color: 'var(--accent)'
            }}>
                  {((tier.pricing?.amount || 0) / 100).toFixed(2)} {tier.pricing?.currency || 'EUR'}
                </div>
              </div>;
        })}
          </div>

          <h4 style={{
        marginTop: '32px',
        marginBottom: '16px',
        borderTop: '1px solid var(--border)',
        paddingTop: '20px'
      }}>{t("addNewTier")}</h4>
          <form onSubmit={handleCreateTier} style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '12px'
      }}>
            <input required type="text" placeholder={t("tierNameEGVip")} className="input-field" value={tierForm.name} onChange={e => setTierForm({
          ...tierForm,
          name: e.target.value
        })} />
            <div style={{
          display: 'flex',
          gap: '12px'
        }}>
              <div style={{
            display: 'flex',
            flexDirection: 'column',
            flex: 1,
            gap: '4px'
          }}>
                <div style={{
              display: 'flex',
              gap: '8px'
            }}>
                  <div style={{
                flex: 1,
                minWidth: '180px'
              }}>
                    <Dropdown value={mode} onChange={v => setMode(v as any)} options={[{
                  value: "customer",
                  label: "What Customers Pay"
                }, {
                  value: "organizer",
                  label: "What You Get"
                }]} />
                  </div>
                  <input required type="number" step="0.01" min="0" placeholder={t("amount")} className="input-field" value={inputValue} onChange={e => setInputValue(e.target.value)} style={{
                width: '100px'
              }} />
                  <div style={{
                width: '100px'
              }}>
                    <Dropdown value={currency} onChange={v => setCurrency(v)} options={[{
                  value: "USD",
                  label: "USD"
                }, {
                  value: "EUR",
                  label: "EUR"
                }, {
                  value: "GBP",
                  label: "GBP"
                }, {
                  value: "CAD",
                  label: "CAD"
                }]} />
                  </div>
                </div>
                <div style={{
              fontSize: '0.8rem',
              color: 'var(--text-secondary)'
            }}>
                  {getBreakdown()}
                </div>
              </div>
              <input required type="number" min="1" placeholder={t("capacity1")} className="input-field" value={tierForm.capacity} onChange={e => setTierForm({
            ...tierForm,
            capacity: e.target.value
          })} style={{
            width: '120px'
          }} />
            </div>
            <button type="submit" className="btn-secondary" style={{
          marginTop: '8px'
        }}>{t("AddTicketTier")}</button>
          </form>
        </>}
    </div>;
}