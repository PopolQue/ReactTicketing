import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { useToast } from '../../components/Toast';

interface LocationManagerProps {
  event: any;
  updateEvent: (updates: any) => Promise<{ error: any }>;
}

export default function LocationManager({ event, updateEvent }: LocationManagerProps) {
  const { t } = useLanguage();
  const { showToast } = useToast();

  const [location, setLocation] = useState({
    venue: '',
    city: '',
    country: '',
    latitude: '',
    longitude: ''
  });
  const [loading, setLoading] = useState(false);
  const [geocoding, setGeocoding] = useState(false);

  // Sync state with prop
  useEffect(() => {
    if (event) {
      setLocation({
        venue: event.venue || '',
        city: event.city || '',
        country: event.country || '',
        latitude: event.latitude !== null && event.latitude !== undefined ? event.latitude.toString() : '',
        longitude: event.longitude !== null && event.longitude !== undefined ? event.longitude.toString() : ''
      });
    }
  }, [event]);

  // Use Nominatim to geocode current text values
  const handleGeocode = async () => {
    const searchStr = `${location.venue} ${location.city} ${location.country}`.trim();
    if (!searchStr) {
      showToast('Please enter a venue name, city, or country first.', 'error');
      return;
    }

    setGeocoding(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchStr)}&limit=1`
      );
      const data = await response.json();
      if (data && data.length > 0) {
        const result = data[0];
        setLocation(prev => ({
          ...prev,
          latitude: parseFloat(result.lat).toFixed(6),
          longitude: parseFloat(result.lon).toFixed(6)
        }));
        showToast('Coordinates successfully fetched!', 'success');
      } else {
        // Fallback search with just City and Country
        const fallbackStr = `${location.city} ${location.country}`.trim();
        if (fallbackStr) {
          const fallbackRes = await fetch(
            `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(fallbackStr)}&limit=1`
          );
          const fallbackData = await fallbackRes.json();
          if (fallbackData && fallbackData.length > 0) {
            const result = fallbackData[0];
            setLocation(prev => ({
              ...prev,
              latitude: parseFloat(result.lat).toFixed(6),
              longitude: parseFloat(result.lon).toFixed(6)
            }));
            showToast('Coordinates successfully fetched (based on city/country only)!', 'success');
            return;
          }
        }
        showToast('Could not find coordinates for this location. Please enter them manually.', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Error connecting to geocoding service.', 'error');
    } finally {
      setGeocoding(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const latVal = location.latitude.trim() === '' ? null : parseFloat(location.latitude);
    const lngVal = location.longitude.trim() === '' ? null : parseFloat(location.longitude);

    if (latVal !== null && isNaN(latVal)) {
      showToast('Latitude must be a valid number.', 'error');
      setLoading(false);
      return;
    }
    if (lngVal !== null && isNaN(lngVal)) {
      showToast('Longitude must be a valid number.', 'error');
      setLoading(false);
      return;
    }

    const { error } = await updateEvent({
      venue: location.venue,
      city: location.city,
      country: location.country,
      latitude: latVal,
      longitude: lngVal
    });

    if (error) {
      showToast(`Error updating location: ${error.message}`, 'error');
    } else {
      showToast('Location updated successfully.', 'success');
    }
    setLoading(false);
  };

  return (
    <div className="glass-panel" style={{ padding: '24px' }}>
      <h3 style={{ margin: '0 0 16px 0', borderBottom: '1px solid var(--border)', paddingBottom: '12px' }}>
        Event Location
      </h3>
      <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        
        <div>
          <label style={{ display: 'block', marginBottom: '6px', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Venue Name
          </label>
          <input
            required
            type="text"
            className="input-field"
            value={location.venue}
            onChange={e => setLocation({ ...location, venue: e.target.value })}
            placeholder="e.g. Tresor Club"
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '6px', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              City
            </label>
            <input
              required
              type="text"
              className="input-field"
              value={location.city}
              onChange={e => setLocation({ ...location, city: e.target.value })}
              placeholder="e.g. Berlin"
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '6px', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              Country
            </label>
            <input
              required
              type="text"
              className="input-field"
              value={location.country}
              onChange={e => setLocation({ ...location, country: e.target.value })}
              placeholder="e.g. Germany"
            />
          </div>
        </div>

        <div style={{ backgroundColor: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: '8px', border: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <span style={{ fontSize: '0.9rem', color: 'white', fontWeight: 600 }}>Map Coordinates</span>
            <button
              type="button"
              onClick={handleGeocode}
              disabled={geocoding}
              className="btn-secondary"
              style={{ fontSize: '0.8rem', padding: '4px 12px' }}
            >
              {geocoding ? 'Fetching...' : 'Fetch Coordinates'}
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '4px', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                Latitude
              </label>
              <input
                type="text"
                className="input-field"
                value={location.latitude}
                onChange={e => setLocation({ ...location, latitude: e.target.value })}
                placeholder="e.g. 52.5200"
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '4px', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                Longitude
              </label>
              <input
                type="text"
                className="input-field"
                value={location.longitude}
                onChange={e => setLocation({ ...location, longitude: e.target.value })}
                placeholder="e.g. 13.4050"
              />
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="btn-primary"
          style={{ width: '100%', marginTop: '8px' }}
        >
          {loading ? 'Saving...' : 'Save Location'}
        </button>

      </form>
    </div>
  );
}
