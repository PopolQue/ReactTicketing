import { useLanguage } from "../../contexts/LanguageContext";
import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../components/Toast';
import Dropdown from '../../components/Dropdown';
export default function CheckoutFieldsManager({
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
  const [fields, setFields] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // New field state
  const [label, setLabel] = useState('');
  const [fieldType, setFieldType] = useState('TEXT');
  const [isRequired, setIsRequired] = useState(true);
  useEffect(() => {
    fetchFields();
  }, [eventId]);
  const fetchFields = async () => {
    setLoading(true);
    const {
      data,
      error
    } = await supabase.from('event_checkout_fields').select('*').eq('event_id', eventId).order('created_at', {
      ascending: true
    });
    if (data) setFields(data);
    setLoading(false);
  };
  const handleAddField = async (e: React.FormEvent) => {
    e.preventDefault();
    const {
      data,
      error
    } = await supabase.from('event_checkout_fields').insert([{
      event_id: eventId,
      label,
      field_type: fieldType,
      is_required: isRequired
    }]).select();
    if (error) {
      showToast(error.message, 'error');
    } else if (data) {
      setFields([...fields, data[0]]);
      setLabel('');
      setFieldType('TEXT');
      setIsRequired(true);
      showToast('Checkout field added!', 'success');
    }
  };
  const handleDeleteField = async (id: string) => {
    const {
      error
    } = await supabase.from('event_checkout_fields').delete().eq('id', id);
    if (!error) {
      setFields(fields.filter(f => f.id !== id));
      showToast('Field removed', 'success');
    }
  };
  const toggleRequired = async (field: any) => {
    const {
      error
    } = await supabase.from('event_checkout_fields').update({
      is_required: !field.is_required
    }).eq('id', field.id);
    if (!error) {
      setFields(fields.map(f => f.id === field.id ? {
        ...f,
        is_required: !f.is_required
      } : f));
    }
  };
  return <div className="glass-panel" style={{
    padding: '24px'
  }}>
      <h3>{t("customCheckoutForms")}</h3>
      <p style={{
      color: 'var(--text-secondary)',
      fontSize: '0.9rem',
      marginBottom: '24px'
    }}>{t("demandPersonalInformationFr")}</p>

      {loading ? <p>{t("loadingFields")}</p> : <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '12px',
      marginBottom: '32px'
    }}>
          {fields.length === 0 ? <p style={{
        color: 'var(--text-secondary)'
      }}>{t("noCustomFieldsAddedDefaul")}</p> : fields.map(field => {
        const {
          t
        } = useLanguage();
        return <div key={field.id} style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '16px',
          backgroundColor: 'rgba(255,255,255,0.02)',
          borderRadius: '8px',
          border: '1px solid rgba(255,255,255,0.05)'
        }}>
                <div>
                  <h4 style={{
              margin: '0 0 4px 0'
            }}>{field.label}</h4>
                  <span style={{
              fontSize: '0.75rem',
              padding: '2px 6px',
              backgroundColor: 'var(--accent)',
              borderRadius: '4px',
              marginRight: '8px'
            }}>{field.field_type}</span>
                  <label style={{
              fontSize: '0.8rem',
              cursor: 'pointer'
            }}>
                    <input type="checkbox" checked={field.is_required} onChange={() => toggleRequired(field)} style={{
                marginRight: '4px'
              }} />{t("required")}</label>
                </div>
                <button onClick={() => handleDeleteField(field.id)} style={{
            background: 'none',
            border: 'none',
            color: '#ef4444',
            cursor: 'pointer'
          }}>{t("remove")}</button>
              </div>;
      })}
        </div>}

      <h4 style={{
      marginBottom: '16px',
      borderTop: '1px solid var(--border)',
      paddingTop: '20px'
    }}>{t("addNewField")}</h4>
      <form onSubmit={handleAddField} style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '12px'
    }}>
        <input required type="text" placeholder={t("fieldLabelEGDietaryRest")} className="input-field" value={label} onChange={e => setLabel(e.target.value)} />
        <div style={{
        display: 'flex',
        gap: '12px'
      }}>
          <div style={{
          flex: 1
        }}>
            <Dropdown value={fieldType} onChange={val => setFieldType(val)} options={[{
            value: 'TEXT',
            label: 'Short Text'
          }, {
            value: 'EMAIL',
            label: 'Email Address'
          }, {
            value: 'PHONE',
            label: 'Phone Number'
          }, {
            value: 'AGE',
            label: 'Age'
          }, {
            value: 'COUNTRY',
            label: 'Country'
          }, {
            value: 'ZIP',
            label: 'ZIP Code'
          }]} />
          </div>
          <label style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '0 16px'
        }}>
            <input type="checkbox" checked={isRequired} onChange={e => setIsRequired(e.target.checked)} />{t("required")}</label>
        </div>
        <button type="submit" className="btn-secondary" style={{
        marginTop: '8px'
      }}>{t("AddField")}</button>
      </form>
    </div>;
}