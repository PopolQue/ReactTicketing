import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, FeatureGroup, useMapEvents } from 'react-leaflet';
import { EditControl } from 'react-leaflet-draw-next'; // Re-enabled
import 'leaflet/dist/leaflet.css';
import 'leaflet-draw/dist/leaflet.draw.css';
import L from 'leaflet';
import { useLanguage } from '../../contexts/LanguageContext';
import { useToast } from '../../components/Toast';

interface InteractiveMapManagerProps {
  event: any;
  updateEvent: (updates: any) => Promise<{ error: any }>;
}

export default function InteractiveMapManager({ event, updateEvent }: InteractiveMapManagerProps) {
  const { t } = useLanguage();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [geoJson, setGeoJson] = useState<any>(null);
  const featureGroupRef = useRef<L.FeatureGroup>(null);

  useEffect(() => {
    // Fix Leaflet icon issue
    // This needs to be in useEffect to ensure L is loaded
    delete (L.Icon.Default.prototype as any)._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
      iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    });

    if (event && event.event_geometry) {
      setGeoJson(event.event_geometry);
    }
  }, [event]);

  // Load initial GeoJSON layers when featureGroupRef and geoJson are available
  useEffect(() => {
    if (geoJson && featureGroupRef.current) {
      featureGroupRef.current.clearLayers(); // Clear existing layers

      L.geoJSON(geoJson).eachLayer((layer: any) => {
        featureGroupRef.current?.addLayer(layer);
      });
    }
  }, [geoJson]); // Re-run when geoJson changes

  const onCreated = (e: any) => {
    const layer = e.layer;
    const geo = layer.toGeoJSON();
    setGeoJson((prev: any) => ({
      ...prev,
      features: [...(prev?.features || []), geo]
    }));
  };

  const handleSave = async () => {
    setLoading(true);
    // Extract GeoJSON from the FeatureGroup layers
    const currentGeoJson = featureGroupRef.current?.toGeoJSON();
    const { error } = await updateEvent({ event_geometry: currentGeoJson });
    if (error) {
      showToast('Error saving map data.', 'error');
    } else {
      showToast('Map data saved successfully.', 'success');
    }
    setLoading(false);
  };

  const position: [number, number] = [
    event?.latitude || 52.52,
    event?.longitude || 13.40
  ];

  return (
    <div className="glass-panel" style={{ padding: '24px' }}>
      <h3 style={{ margin: '0 0 16px 0', borderBottom: '1px solid var(--border)', paddingBottom: '12px' }}>
        Interactive Map
      </h3>
      <div style={{ height: '400px', width: '100%', marginBottom: '16px' }}>
        <MapContainer center={position} zoom={13} style={{ height: '100%', width: '100%' }}>
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <FeatureGroup ref={featureGroupRef}>
            {featureGroupRef.current && (
              <EditControl
                position="topright"
                onCreated={onCreated}
                featureGroup={featureGroupRef.current}
                draw={{
                  rectangle: true,
                  polygon: true,
                  marker: true,
                  circle: false,
                  circlemarker: false,
                  polyline: false
                }}
              />
            )}
          </FeatureGroup>
        </MapContainer>
      </div>
      <button
        onClick={handleSave}
        disabled={loading}
        className="btn-primary"
        style={{ width: '100%' }}
      >
        {loading ? 'Saving...' : 'Save Map Geometry'}
      </button>
    </div>
  );
}
