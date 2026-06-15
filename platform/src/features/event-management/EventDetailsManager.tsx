import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { useToast } from '../../components/Toast';

interface EventDetailsManagerProps {
  event: any;
  updateEvent: (updates: any) => Promise<{ error: any }>;
}

export default function EventDetailsManager({ event, updateEvent }: EventDetailsManagerProps) {
  const { t } = useLanguage();
  const { showToast } = useToast();

  const [details, setDetails] = useState({
    start_date: '',
    location_address: ''
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (event) {
      setDetails({
        start_date: event.start_date ? new Date(event.start_date).toISOString().slice(0, 16) : '',
        location_address: event.location_address || ''
      });
    }
  }, [event]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await updateEvent({
      start_date: new Date(details.start_date).toISOString(),
      location_address: details.location_address
    });

    if (error) {
      showToast(`Error updating details: ${error.message}`, 'error');
    } else {
      showToast('Details updated successfully.', 'success');
    }
    setLoading(false);
  };

  return (
    <div className="glass-panel" style={{ padding: '24px' }}>
      <h3 style={{ margin: '0 0 16px 0', borderBottom: '1px solid var(--border)', paddingBottom: '12px' }}>
        Event Details
      </h3>
      <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div>
          <label style={{ display: 'block', marginBottom: '6px', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Start Date & Time
          </label>
          <input
            required
            type="datetime-local"
            className="input-field"
            value={details.start_date}
            onChange={e => setDetails({ ...details, start_date: e.target.value })}
          />
        </div>
        <div>
          <label style={{ display: 'block', marginBottom: '6px', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Location Address
          </label>
          <input
            type="text"
            className="input-field"
            value={details.location_address}
            onChange={e => setDetails({ ...details, location_address: e.target.value })}
            placeholder="e.g. 123 Event St, City"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="btn-primary"
          style={{ width: '100%', marginTop: '8px' }}
        >
          {loading ? 'Saving...' : 'Save Details'}
        </button>
      </form>
    </div>
  );
}
