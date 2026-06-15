import React, { useEffect, useState, useRef } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';

interface EventMapProps {
  events: any[];
  searchCenter: { lat: number; lng: number };
  setSearchCenter: (center: { lat: number; lng: number }) => void;
  radiusKm: number;
  setRadiusKm: (radius: number) => void;
  startDate: string;
  setStartDate: (date: string) => void;
  endDate: string;
  setEndDate: (date: string) => void;
  locationQuery: string;
  setLocationQuery: (query: string) => void;
  onSelectCity: (city: string | null) => void;
}

export default function EventMap({
  events,
  searchCenter,
  setSearchCenter,
  radiusKm,
  setRadiusKm,
  startDate,
  setStartDate,
  endDate,
  setEndDate,
  locationQuery,
  setLocationQuery,
  onSelectCity,
}: EventMapProps) {
  const { t } = useLanguage();
  const [mapLoaded, setMapLoaded] = useState(false);
  const [geocoding, setGeocoding] = useState(false);
  const [mapTheme, setMapTheme] = useState<'dark-mono' | 'light-mono' | 'cyberpunk' | 'colored'>('dark-mono');
  const [buildingPolygons, setBuildingPolygons] = useState<any[]>([]);

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markerGroupRef = useRef<any>(null);
  const radiusCircleRef = useRef<any>(null);
  const centerMarkerRef = useRef<any>(null);
  const buildingsGroupRef = useRef<any>(null);

  // Map theme styles using CSS filter tweaks over CartoDB Dark Matter or Voyager
  const getMapFilter = () => {
    switch (mapTheme) {
      case 'dark-mono':
        // Raw CartoDB Dark Matter: black/dark grey buildings, white/light grey roads, dark blue/grey water
        return 'none';
      case 'light-mono':
        // Inverted high contrast
        return 'invert(90%) grayscale(100%) contrast(120%)';
      case 'cyberpunk':
        // Accent/neon glow hue shifting
        return 'hue-rotate(260deg) saturate(200%) brightness(90%)';
      case 'colored':
      default:
        // Force fully colored standard map via inverting CartoDB Dark Matter or running plain (fallback colored)
        return 'invert(100%) hue-rotate(180deg) saturate(120%)';
    }
  };

  // 1. Dynamic Script Loading for Leaflet
  useEffect(() => {
    let isMounted = true;

    const loadLeaflet = async () => {
      if ((window as any).L) {
        if (isMounted) setMapLoaded(true);
        return;
      }

      // Load CSS
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      link.integrity = 'sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=';
      link.crossOrigin = '';
      document.head.appendChild(link);

      // Load JS
      const script = document.createElement('script');
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      script.integrity = 'sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=';
      script.crossOrigin = '';
      script.onload = () => {
        if (isMounted) setMapLoaded(true);
      };
      document.body.appendChild(script);
    };

    loadLeaflet();

    return () => {
      isMounted = false;
    };
  }, []);

  // 2. Fetch Building footprints dynamically from Overpass API for events in scope
  useEffect(() => {
    if (!mapLoaded || events.length === 0) return;

    const fetchBuildings = async () => {
      const polys: any[] = [];
      const fetchedCoords = new Set<string>();

      // Simple delay function for throttling
      const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

      for (const event of events) {
        if (event.latitude && event.longitude) {
          const coordKey = `${event.latitude.toFixed(4)},${event.longitude.toFixed(4)}`;
          if (fetchedCoords.has(coordKey)) continue;
          fetchedCoords.add(coordKey);

          // Retry logic (max 2 retries)
          for (let attempt = 0; attempt < 3; attempt++) {
            try {
              const query = `[out:json];(way(around:50, ${event.latitude}, ${event.longitude})[building];relation(around:50, ${event.latitude}, ${event.longitude})[building];);out geom;`;
              const response = await fetch(`https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`);
              
              if (response.ok) {
                const data = await response.json();
                if (data && data.elements && data.elements.length > 0) {
                  const element = data.elements[0];
                  if (element.type === 'way' && element.geometry) {
                    const coordinates = element.geometry.map((pt: any) => [pt.lat, pt.lon]);
                    polys.push({
                      eventId: event.id,
                      coordinates: coordinates,
                    });
                  }
                }
                break; // Success
              } else if (response.status === 429) {
                // Rate limited, wait longer
                await delay(2000 * (attempt + 1));
              } else {
                // Other errors, don't retry immediately
                break;
              }
            } catch (e) {
              // Ignore fetch errors, just continue
            }
          }
          await delay(500); // Throttle requests
        }
      }
      setBuildingPolygons(polys);
    };

    fetchBuildings();
  }, [mapLoaded, events]);

  // 3. Geocoding using Nominatim
  const handleGeocode = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!locationQuery.trim()) return;

    setGeocoding(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(locationQuery)}&limit=1`
      );
      const data = await response.json();
      if (data && data.length > 0) {
        const result = data[0];
        const newCenter = { lat: parseFloat(result.lat), lng: parseFloat(result.lon) };
        setSearchCenter(newCenter);
        onSelectCity(null); // Clear specific list city filter since we geocoded a custom map location
        if (mapRef.current) {
          mapRef.current.setView([newCenter.lat, newCenter.lng], 11);
        }
      }
    } catch (err) {
      console.error('Geocoding failed:', err);
    } finally {
      setGeocoding(false);
    }
  };

  // 4. Initialize Map
  useEffect(() => {
    if (!mapLoaded || !mapContainerRef.current) return;

    const L = (window as any).L;

    if (!mapRef.current) {
      // Create map
      mapRef.current = L.map(mapContainerRef.current, {
        zoomControl: false,
      }).setView([searchCenter.lat, searchCenter.lng], 11);

      // Add zoom control to bottom right
      L.control.zoom({ position: 'bottomright' }).addTo(mapRef.current);

      // Add CartoDB Dark Matter tile layer (natively features black buildings, light roads, dark blue/gray water)
      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        maxZoom: 20,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
      }).addTo(mapRef.current);

      // Layer groups
      buildingsGroupRef.current = L.layerGroup().addTo(mapRef.current);
      markerGroupRef.current = L.layerGroup().addTo(mapRef.current);

      // Map click handler to update search center
      mapRef.current.on('click', (e: any) => {
        const { lat, lng } = e.latlng;
        setSearchCenter({ lat, lng });
        setLocationQuery(`${lat.toFixed(4)}, ${lng.toFixed(4)}`);
        onSelectCity(null); // Clear specific list city filter since we clicked a custom map point
      });
    }

    return () => {
      // Keep map reference persistent across renders, destroy on unmount if needed
    };
  }, [mapLoaded]);

  // Sync map view position when searchCenter changes externally (e.g. from selecting city in list view)
  useEffect(() => {
    if (mapLoaded && mapRef.current) {
      const currentCenter = mapRef.current.getCenter();
      const dist = Math.abs(currentCenter.lat - searchCenter.lat) + Math.abs(currentCenter.lng - searchCenter.lng);
      // Only set view if coordinates changed significantly to avoid feedback loops
      if (dist > 0.0001) {
        mapRef.current.setView([searchCenter.lat, searchCenter.lng], 11);
      }
    }
  }, [mapLoaded, searchCenter]);

  // 5. Update Center Marker & Radius Circle
  useEffect(() => {
    if (!mapLoaded || !mapRef.current) return;
    const L = (window as any).L;

    // Remove old center marker and radius circle
    if (centerMarkerRef.current) mapRef.current.removeLayer(centerMarkerRef.current);
    if (radiusCircleRef.current) mapRef.current.removeLayer(radiusCircleRef.current);

    // Create center icon
    const centerIcon = L.divIcon({
      className: 'custom-center-marker',
      html: `<div style="width: 16px; height: 16px; background-color: #3b82f6; border: 3px solid white; border-radius: 50%; box-shadow: 0 0 10px rgba(0,0,0,0.5);"></div>`,
      iconSize: [16, 16],
      iconAnchor: [8, 8],
    });

    centerMarkerRef.current = L.marker([searchCenter.lat, searchCenter.lng], {
      icon: centerIcon,
      zIndexOffset: 1000,
    }).addTo(mapRef.current);

    // Draw radius circle
    radiusCircleRef.current = L.circle([searchCenter.lat, searchCenter.lng], {
      radius: radiusKm * 1000, // in meters
      color: '#3b82f6',
      fillColor: '#3b82f6',
      fillOpacity: 0.1,
      weight: 1.5,
      dashArray: '5, 5',
    }).addTo(mapRef.current);
  }, [mapLoaded, searchCenter, radiusKm]);

  // 6. Update Event Markers & Highlight Building footprints
  useEffect(() => {
    if (!mapLoaded || !mapRef.current || !markerGroupRef.current || !buildingsGroupRef.current) return;
    const L = (window as any).L;

    // Clear old markers and polygons
    markerGroupRef.current.clearLayers();
    buildingsGroupRef.current.clearLayers();

    // Draw building footprint polygons in brand accent color
    buildingPolygons.forEach((poly) => {
      L.polygon(poly.coordinates, {
        color: 'var(--accent)',
        fillColor: 'var(--accent)',
        fillOpacity: 0.7,
        weight: 2,
        className: 'highlighted-building-polygon',
      }).addTo(buildingsGroupRef.current);
    });

    // Custom event marker icon
    const eventIcon = L.divIcon({
      className: 'custom-event-marker',
      html: `<div style="width: 24px; height: 24px; background-color: var(--accent); border: 2px solid white; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; box-shadow: var(--bloom-glow);">🎉</div>`,
      iconSize: [24, 24],
      iconAnchor: [12, 12],
    });

    // Add new markers
    events.forEach((event) => {
      if (event.latitude === null || event.latitude === undefined || event.longitude === null || event.longitude === undefined) return;
      const marker = L.marker([event.latitude, event.longitude], { icon: eventIcon });

      const dateStr = new Date(event.start_date).toLocaleDateString([], {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      });

      const popupContent = `
        <div class="glass-panel" style="padding: 12px; color: white; font-family: var(--font-family); min-width: 200px;">
          <h4 style="margin: 0 0 4px 0; font-size: 1.1rem; font-weight: 700;">${event.name}</h4>
          <p style="margin: 0 0 8px 0; font-size: 0.85rem; color: #8c9fa8;">📍 ${event.venue} • ${dateStr}</p>
          <a href="/events/${event.id}" class="btn-primary" style="display: block; text-align: center; text-decoration: none; padding: 6px 12px; font-size: 0.85rem; border-radius: 6px;">
            ${t('marketplace.discover.buyTickets') || 'Buy Tickets'}
          </a>
        </div>
      `;

      marker.bindPopup(popupContent, {
        className: 'custom-leaflet-popup',
        closeButton: false,
      });

      markerGroupRef.current.addLayer(marker);
    });
  }, [mapLoaded, events, buildingPolygons]);

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: '24px', height: '600px', width: '100%' }}>
      {/* Map Container */}
      <div style={{ position: 'relative', borderRadius: '16px', overflow: 'hidden', border: '1px solid var(--border)' }}>
        {!mapLoaded && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 10 }}>
            <p style={{ color: 'var(--text-secondary)' }}>Loading interactive map...</p>
          </div>
        )}
        <div ref={mapContainerRef} className="dark-leaflet-map" style={{ width: '100%', height: '100%' }} />

        {/* Dynamic Styles for Leaflet & Dark Theme */}
        <style>{`
          .dark-leaflet-map .leaflet-tile-container {
            filter: ${getMapFilter()};
          }
          .leaflet-container {
            background: #010f14 !important;
          }
          .custom-leaflet-popup .leaflet-popup-content-wrapper {
            background: rgba(1, 15, 20, 0.85) !important;
            backdrop-filter: blur(12px) !important;
            border: 1px solid var(--border) !important;
            border-radius: 12px !important;
            box-shadow: 0 10px 30px rgba(0,0,0,0.5) !important;
            padding: 0 !important;
          }
          .custom-leaflet-popup .leaflet-popup-tip {
            background: rgba(1, 15, 20, 0.85) !important;
            border-left: 1px solid var(--border) !important;
            border-bottom: 1px solid var(--border) !important;
          }
          .custom-leaflet-popup .leaflet-popup-content {
            margin: 0 !important;
          }
          
          /* Pulsing animation on highlighted venue buildings */
          @keyframes building-pulse {
            0% { fill-opacity: 0.55; stroke-width: 1.5px; }
            50% { fill-opacity: 0.85; stroke-width: 3px; }
            100% { fill-opacity: 0.55; stroke-width: 1.5px; }
          }
          .highlighted-building-polygon {
            animation: building-pulse 2s infinite ease-in-out;
            stroke-dasharray: 4, 4;
            filter: drop-shadow(0 0 6px var(--accent));
          }
        `}</style>
      </div>

      {/* Control / Sidebar Panel */}
      <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px', overflowY: 'auto' }}>
        <h3 style={{ margin: 0, fontSize: '1.25rem', borderBottom: '1px solid var(--border)', paddingBottom: '12px' }}>
          Geographic Discovery
        </h3>

        {/* Map Theme Options */}
        <div>
          <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
            Map Style Options
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            <button
              type="button"
              onClick={() => setMapTheme('dark-mono')}
              className={mapTheme === 'dark-mono' ? 'btn-primary' : 'btn-secondary'}
              style={{ padding: '6px 10px', fontSize: '0.75rem', borderRadius: '8px', border: '1px solid var(--border)', cursor: 'pointer', fontWeight: 600 }}
            >
              Dark Mono
            </button>
            <button
              type="button"
              onClick={() => setMapTheme('light-mono')}
              className={mapTheme === 'light-mono' ? 'btn-primary' : 'btn-secondary'}
              style={{ padding: '6px 10px', fontSize: '0.75rem', borderRadius: '8px', border: '1px solid var(--border)', cursor: 'pointer', fontWeight: 600 }}
            >
              Light Mono
            </button>
            <button
              type="button"
              onClick={() => setMapTheme('cyberpunk')}
              className={mapTheme === 'cyberpunk' ? 'btn-primary' : 'btn-secondary'}
              style={{ padding: '6px 10px', fontSize: '0.75rem', borderRadius: '8px', border: '1px solid var(--border)', cursor: 'pointer', fontWeight: 600 }}
            >
              Cyberpunk
            </button>
            <button
              type="button"
              onClick={() => setMapTheme('colored')}
              className={mapTheme === 'colored' ? 'btn-primary' : 'btn-secondary'}
              style={{ padding: '6px 10px', fontSize: '0.75rem', borderRadius: '8px', border: '1px solid var(--border)', cursor: 'pointer', fontWeight: 600 }}
            >
              Colored
            </button>
          </div>
        </div>

        {/* Location Query Nominatim */}
        <form onSubmit={handleGeocode} style={{ display: 'flex', gap: '8px' }}>
          <input
            type="text"
            className="input-field"
            placeholder="Search location..."
            value={locationQuery}
            onChange={(e) => setLocationQuery(e.target.value)}
            style={{ flexGrow: 1 }}
          />
          <button type="submit" className="btn-secondary" style={{ padding: '0 16px' }} disabled={geocoding}>
            {geocoding ? '...' : 'Go'}
          </button>
        </form>

        {/* Radius Filter */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Search Radius</span>
            <span style={{ fontWeight: 600, color: 'var(--accent)' }}>{radiusKm} km</span>
          </div>
          <input
            type="range"
            min="5"
            max="150"
            step="5"
            value={radiusKm}
            onChange={(e) => setRadiusKm(parseInt(e.target.value))}
            style={{ width: '100%', accentColor: 'var(--accent)' }}
          />
        </div>

        {/* Date Filters */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '4px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              From Date
            </label>
            <input
              type="date"
              className="input-field"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              style={{ width: '100%', colorScheme: 'dark' }}
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '4px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              To Date
            </label>
            <input
              type="date"
              className="input-field"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              style={{ width: '100%', colorScheme: 'dark' }}
            />
          </div>
        </div>

        {/* Results Info */}
        <div style={{ borderTop: '1px solid var(--border)', paddingTop: '16px', flexGrow: 1, display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Events Found</span>
            <span className="badge" style={{ backgroundColor: 'var(--accent)', color: 'white', padding: '4px 10px', borderRadius: '12px', fontSize: '0.85rem', fontWeight: 700 }}>
              {events.length}
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '180px', overflowY: 'auto' }}>
            {events.map((event) => (
              <div
                key={event.id}
                onClick={() => {
                  if (mapRef.current) {
                    mapRef.current.setView([event.latitude, event.longitude], 13);
                  }
                }}
                style={{
                  padding: '8px 12px',
                  backgroundColor: 'rgba(255,255,255,0.02)',
                  border: '1px solid rgba(255,255,255,0.05)',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '0.85rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div>
                  <span style={{ fontWeight: 600, display: 'block' }}>{event.name}</span>
                  <span style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>{event.venue}</span>
                </div>
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>
                  {new Date(event.start_date).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
