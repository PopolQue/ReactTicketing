import { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, GeoJSON, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix Leaflet icon issue (client-only)
if (typeof window !== 'undefined') {
  delete (L.Icon.Default.prototype as any)._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  });
}

interface EventMapDisplayProps {
  geometry: any;
  position: [number, number];
  accentColor: string;
}

export function EventMapDisplay({ geometry, position, accentColor }: EventMapDisplayProps) {
  const mapRef = useRef<L.Map>(null);

  useEffect(() => {
    if (mapRef.current && geometry) {
        // Fit bounds to geometry if possible
        try {
            const geoJsonLayer = L.geoJSON(geometry);
            if (geoJsonLayer.getBounds().isValid()) {
                mapRef.current.fitBounds(geoJsonLayer.getBounds(), { padding: [20, 20] });
            }
        } catch (e) {
            console.error('Error fitting bounds:', e);
        }
    }
  }, [geometry]);

  return (
    <div style={{ height: '300px', width: '100%', borderRadius: '16px', overflow: 'hidden', marginTop: '24px', border: '1px solid rgba(255,255,255,0.1)' }}>
      <MapContainer 
        center={position} 
        zoom={13} 
        style={{ height: '100%', width: '100%' }}
        ref={mapRef}
        zoomControl={false}
      >
        {/* Dark Matter style for a prettier, modern look */}
        <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />
        
        <Marker position={position}>
            <Popup>Event Location</Popup>
        </Marker>

        {geometry && (
          <GeoJSON 
            data={geometry} 
            style={{ 
                color: accentColor, 
                weight: 3, 
                fillOpacity: 0.15,
                lineJoin: 'round'
            }} 
          />
        )}
      </MapContainer>
    </div>
  );
}
