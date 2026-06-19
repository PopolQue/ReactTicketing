import { useState, useEffect, useRef, useCallback } from 'react';
import { MapContainer, TileLayer, FeatureGroup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-draw/dist/leaflet.draw.css';
import { useToast } from '../../components/Toast';

// Lazy load Leaflet (client-only)
let L: any = null;
const initLeaflet = async () => {
  if (!L && typeof window !== 'undefined') {
    L = (await import('leaflet')).default;
    await import('leaflet-draw');
  }
  return L;
};

interface EventGeometry {
  type: string;
  features: GeoJSON.Feature[];
}

interface InteractiveMapManagerProps {
  event: {
    event_geometry?: EventGeometry;
    latitude?: number;
    longitude?: number;
  };
  updateEvent: (updates: { event_geometry: GeoJSON.GeoJsonObject }) => Promise<{ error: any }>;
}

function DrawController({ 
  featureGroupRef, 
  onCreated 
}: { 
  featureGroupRef: React.RefObject<L.FeatureGroup>, 
  onCreated: (e: L.DrawEvents.Created) => void 
}) {
  const map = useMap();
  useEffect(() => {
    if (!featureGroupRef.current) return;

    // Type casting for leaflet-draw extension
    const drawControl = new (L.Control as any).Draw({
      edit: { featureGroup: featureGroupRef.current },
      draw: {
        rectangle: true,
        polygon: true,
        marker: true,
        circle: false,
        circlemarker: false,
        polyline: false
      }
    });
    map.addControl(drawControl);

    map.on(L.Draw.Event.CREATED, onCreated);

    return () => {
      map.removeControl(drawControl);
      map.off(L.Draw.Event.CREATED, onCreated);
    };
  }, [map, featureGroupRef, onCreated]);
  return null;
}

export default function InteractiveMapManager({ event, updateEvent }: InteractiveMapManagerProps) {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const featureGroupRef = useRef<L.FeatureGroup>(null);

  useEffect(() => {
    // Fix Leaflet icon issue
    delete (L.Icon.Default.prototype as any)._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
      iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    });
  }, []);

  // Load initial GeoJSON layers
  useEffect(() => {
    if (event.event_geometry && featureGroupRef.current) {
      featureGroupRef.current.clearLayers(); 

      try {
        L.geoJSON(event.event_geometry as GeoJSON.GeoJsonObject).eachLayer((layer: L.Layer) => {
          featureGroupRef.current?.addLayer(layer);
        });
      } catch (e) {
        console.error('Invalid GeoJSON detected:', e);
      }
    }
  }, [event.event_geometry]);

  const onCreated = useCallback((e: L.DrawEvents.Created) => {
    featureGroupRef.current?.addLayer(e.layer);
  }, []);

  const handleSave = async () => {
    setLoading(true);
    const currentGeoJson = featureGroupRef.current?.toGeoJSON();
    const { error } = await updateEvent({ event_geometry: currentGeoJson as GeoJSON.GeoJsonObject });
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
            <DrawController featureGroupRef={featureGroupRef} onCreated={onCreated} />
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
