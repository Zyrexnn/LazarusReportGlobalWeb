import { useState, useEffect } from 'react';

interface ShipData {
  mmsi: string;
  name: string;
  lat: number;
  lng: number;
  speed: number;
  heading: number;
  type: string;
}

const DEMO_SHIPS: ShipData[] = [
  { mmsi: '212345670', name: 'PACIFIC VOYAGER', lat: 26.2, lng: 52.5, speed: 12.5, heading: 45, type: 'Tanker' },
  { mmsi: '212345671', name: 'GULF CARRIER', lat: 26.5, lng: 53.0, speed: 8.3, heading: 120, type: 'Cargo' },
  { mmsi: '212345672', name: 'ARABIAN DAWN', lat: 26.0, lng: 51.8, speed: 15.2, heading: 280, type: 'Tanker' },
  { mmsi: '212345673', name: 'HORMUZ SPIRIT', lat: 26.6, lng: 56.2, speed: 6.8, heading: 350, type: 'Container' },
  { mmsi: '212345674', name: 'BAHRAIN STAR', lat: 26.1, lng: 50.6, speed: 0, heading: 0, type: 'Anchored' },
];

// Persian Gulf bounding box
const GULF_CENTER: [number, number] = [26.0, 52.5];
const GULF_ZOOM = 7;

export default function AISMap({ fullPage = false }: { fullPage?: boolean }) {
  const [ships, setShips] = useState<ShipData[]>(DEMO_SHIPS);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [leafletReady, setLeafletReady] = useState(false);

  // Dynamic import of Leaflet (client-side only)
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const loadLeaflet = async () => {
      // Dynamically import Leaflet CSS
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);

      // Import Leaflet
      const L = (await import('leaflet')).default;

      // Wait for CSS to load
      await new Promise((resolve) => setTimeout(resolve, 300));

      const containerId = fullPage ? 'ais-map-full' : 'ais-map-mini';
      const container = document.getElementById(containerId);
      if (!container) return;

      // Clean up existing map
      if ((container as any)._leaflet_id) {
        (container as any)._leaflet_id = null;
        container.innerHTML = '';
      }

      const map = L.map(containerId, {
        center: GULF_CENTER,
        zoom: fullPage ? 8 : GULF_ZOOM,
        zoomControl: fullPage,
        attributionControl: false,
        scrollWheelZoom: fullPage,
        dragging: true,
        touchZoom: true,
      });

      // Dark tile layer
      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        maxZoom: 19,
      }).addTo(map);

      // Custom ship icon
      const shipIcon = L.divIcon({
        className: 'ship-marker',
        html: `<div style="color: #d4af37; font-size: 18px; filter: drop-shadow(0 0 4px rgba(212,175,55,0.5));">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2L4 20h16L12 2zm0 4l5 12H7l5-12z"/>
          </svg>
        </div>`,
        iconSize: [18, 18],
        iconAnchor: [9, 9],
      });

      // Add ship markers
      ships.forEach((ship) => {
        const marker = L.marker([ship.lat, ship.lng], { icon: shipIcon }).addTo(map);
        marker.bindPopup(`
          <div style="font-family: 'Inter', sans-serif; min-width: 160px;">
            <div style="font-weight: 700; color: #d4af37; margin-bottom: 4px; font-size: 13px;">${ship.name}</div>
            <div style="font-size: 11px; color: #e0e0e0; line-height: 1.6;">
              <div>Type: ${ship.type}</div>
              <div>Speed: ${ship.speed} kn</div>
              <div>Heading: ${ship.heading}°</div>
              <div style="color: #888;">MMSI: ${ship.mmsi}</div>
            </div>
          </div>
        `);
      });

      setMapLoaded(true);
      setLeafletReady(true);
    };

    loadLeaflet();
  }, [ships, fullPage]);

  const containerHeight = fullPage ? 'h-[calc(100vh-120px)]' : 'h-48';
  const containerId = fullPage ? 'ais-map-full' : 'ais-map-mini';

  return (
    <div className={`bg-lazarus-dark border border-lazarus-border rounded-xl overflow-hidden ${fullPage ? '' : ''}`}>
      {!fullPage && (
        <div className="flex items-center justify-between px-4 pt-4 pb-2">
          <h3 className="text-lazarus-gold text-xs font-bold tracking-[0.2em] uppercase flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064" />
            </svg>
            AIS Ship Tracker
          </h3>
          <a href="/ship-tracker" className="text-lazarus-muted hover:text-lazarus-gold text-xs transition-colors">
            Full Map →
          </a>
        </div>
      )}

      <div className="relative">
        {!mapLoaded && (
          <div className={`${containerHeight} bg-lazarus-dark flex items-center justify-center`}>
            <div className="text-center">
              <div className="w-6 h-6 border-2 border-lazarus-gold border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
              <p className="text-lazarus-muted text-xs">Loading map...</p>
            </div>
          </div>
        )}
        <div
          id={containerId}
          className={`${containerHeight} w-full ${!mapLoaded ? 'opacity-0 absolute' : 'opacity-100'} transition-opacity duration-300`}
        />
      </div>

      {!fullPage && (
        <div className="px-4 py-2 border-t border-lazarus-border/50">
          <p className="text-lazarus-muted/60 text-[10px]">
            {ships.length} vessels tracked • Persian Gulf & Strait of Hormuz
          </p>
        </div>
      )}
    </div>
  );
}
