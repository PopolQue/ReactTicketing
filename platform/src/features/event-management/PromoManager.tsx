import { useLanguage } from "../../contexts/LanguageContext";
import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../components/Toast';
import Dropdown from '../../components/Dropdown';
import { Link } from 'react-router-dom';
import { ExternalLink } from 'lucide-react';
export default function PromoManager({
  eventId
}: {
  eventId: string;
}) {
  const {
    t
  } = useLanguage();
  const {
    showToast
  } = useToast();
  const [promos, setPromos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    code: '',
    discount_kind: 'percent_off',
    discount_value: ''
  });
  useEffect(() => {
    fetchPromos();
  }, [eventId]);
  const fetchPromos = async () => {
    const {
      data,
      error
    } = await supabase.from('promo_codes').select('*').eq('event_id', eventId).order('created_at', {
      ascending: false
    });
    if (!error && data) {
      setPromos(data);
    }
    setLoading(false);
  };
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const value = form.discount_kind !== 'free' ? parseInt(form.discount_value) : null;
    const {
      data,
      error
    } = await supabase.from('promo_codes').insert([{
      event_id: eventId,
      code: form.code.toUpperCase(),
      discount_kind: form.discount_kind,
      discount_value: value,
      active: true
    }]);
    if (error) {
      showToast("Error creating promo: " + error.message, 'error');
    } else {
      showToast("Promo code created", "success");
      setForm({
        code: '',
        discount_kind: 'percent_off',
        discount_value: ''
      });
      await fetchPromos();
    }
  };
  const deactivate = async (code: string) => {
    await supabase.from('promo_codes').update({
      active: false
    }).eq('event_id', eventId).eq('code', code);
    await fetchPromos();
  };
  if (loading) return <div className="glass-panel" style={{
    padding: '24px'
  }}>{t("loadingPromos")}</div>;
  return <div className="glass-panel" style={{
    padding: '24px'
  }}>
      <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '16px'
    }}>
        <h3 style={{
        margin: 0
      }}>{t("promoCodes")}</h3>
        <Link to={`/organizer/events/${eventId}/promos`} className="btn-secondary" style={{
        padding: '6px 12px',
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        fontSize: '0.85rem',
        textDecoration: 'none'
      }}>{t("batchesExport")}<ExternalLink size={14} />
        </Link>
      </div>
      <p style={{
      color: 'var(--text-secondary)',
      fontSize: '0.9rem',
      marginBottom: '16px',
      marginTop: '-8px'
    }}>{t("createDiscountCodesForYour")}</p>

      <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '12px',
      marginBottom: '24px',
      maxHeight: '250px',
      overflowY: 'auto'
    }}>
        {promos.length === 0 ? <p style={{
        color: 'var(--text-secondary)'
      }}>{t("noPromoCodesAddedYet")}</p> : promos.map((p: any) => {
        const {
          t
        } = useLanguage();
        return <div key={p.id} style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '12px',
          backgroundColor: 'rgba(0,0,0,0.2)',
          borderRadius: '8px'
        }}>
            <div>
              <strong style={{
              display: 'block',
              marginBottom: '4px',
              letterSpacing: '1px'
            }}>{p.code}</strong>
              <div style={{
              fontSize: '0.85rem',
              color: 'var(--text-secondary)'
            }}>
                {p.discount_kind === 'free' ? 'Free Ticket' : p.discount_kind === 'percent_off' ? `${p.discount_value}% Off` : `€${(p.discount_value / 100).toFixed(2)} Off`}
                {' | '}{t("uses")}{p.used_count}/{p.max_uses || '∞'} | {p.active ? <span style={{
                color: '#10b981'
              }}>{t("active")}</span> : <span style={{
                color: '#ef4444'
              }}>{t("inactive")}</span>}
              </div>
            </div>
            {p.active && <button onClick={() => deactivate(p.code)} className="btn-secondary" style={{
            padding: '4px 8px',
            fontSize: '0.8rem',
            borderColor: '#ef4444',
            color: '#ef4444'
          }}>{t("deactivate")}</button>}
          </div>;
      })}
      </div>

      <h4 style={{
      marginTop: '16px',
      marginBottom: '16px',
      borderTop: '1px solid var(--border)',
      paddingTop: '20px'
    }}>{t("addPromoCode")}</h4>
      <form onSubmit={handleCreate} style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '12px'
    }}>
        <input required type="text" placeholder={t("codeEGEarlybird")} className="input-field" value={form.code} onChange={e => setForm({
        ...form,
        code: e.target.value.toUpperCase()
      })} />
        <div style={{
        display: 'flex',
        gap: '12px'
      }}>
          <div style={{
          flex: 1
        }}>
            <Dropdown value={form.discount_kind} onChange={val => setForm({
            ...form,
            discount_kind: val
          })} options={[{
            value: 'percent_off',
            label: 'Percent Off (%)'
          }, {
            value: 'amount_off',
            label: 'Amount Off (€ cents)'
          }, {
            value: 'free',
            label: 'Free Ticket'
          }]} />
          </div>
          {form.discount_kind !== 'free' && <input required type="number" placeholder={t("value")} className="input-field" value={form.discount_value} onChange={e => setForm({
          ...form,
          discount_value: e.target.value
        })} style={{
          flex: 1
        }} />}
        </div>
        <button type="submit" className="btn-secondary" style={{
        marginTop: '8px'
      }}>{t("CreatePromo")}</button>
      </form>
    </div>;
}