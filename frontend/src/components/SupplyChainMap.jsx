import React, { useState } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, Popup, ZoomControl } from 'react-leaflet';
import L from 'leaflet';
import { Navigation } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

// Fix for default Leaflet icon assets
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Custom HTML Pin Icons
const createCustomIcon = (color, label, pulse = false) => {
  return L.divIcon({
    className: 'custom-map-marker',
    html: `
      <div style="position: relative; display: flex; align-items: center; justify-content: center; width: 26px; height: 26px;">
        ${pulse ? `<div style="position: absolute; width: 34px; height: 34px; border-radius: 50%; background-color: ${color}; opacity: 0.35; animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>` : ''}
        <div style="width: 18px; height: 18px; border-radius: 50%; background-color: ${color}; border: 2.5px solid #0C0A09; box-shadow: 0 0 12px ${color}; display: flex; align-items: center; justify-content: center;">
          <div style="width: 5px; height: 5px; border-radius: 50%; background-color: #FFFFFF;"></div>
        </div>
      </div>
    `,
    iconSize: [26, 26],
    iconAnchor: [13, 13],
    popupAnchor: [0, -13],
  });
};

const hubIcon = createCustomIcon('#3B82F6', 'HUB', true);
const inboundIcon = createCustomIcon('#EAB308', 'INB');
const outboundIcon = createCustomIcon('#78350F', 'OUT'); // Dark Brown

const SupplyChainMap = ({ mapData }) => {
  const { t } = useLanguage();
  const [filterMode, setFilterMode] = useState('ALL');

  if (!mapData || !mapData.active_warehouse) {
    return (
      <div className="h-96 rounded-2xl glass-card flex items-center justify-center text-stone-500">
        Loading Warehouse Geospatial Routing Network...
      </div>
    );
  }

  const { active_warehouse, inbound_routes = [], outbound_routes = [] } = mapData;

  const showInbound = filterMode === 'ALL' || filterMode === 'INBOUND';
  const showOutbound = filterMode === 'ALL' || filterMode === 'OUTBOUND';

  return (
    <div className="glass-card p-4 sm:p-5 rounded-2xl relative overflow-hidden border border-stone-800">
      {/* Header & Filter Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-stone-800">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-yellow-500/10 border border-yellow-500/20 text-yellow-400">
            <Navigation className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-stone-100 text-base sm:text-lg flex items-center gap-2">
              {t('dashboard.mapTitle')}
              <span className="text-xs font-mono font-medium px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                ACTIVE GEOPATHS
              </span>
            </h3>
            <p className="text-xs text-stone-400">
              Connected lanes to <strong className="text-yellow-400">{active_warehouse.name}</strong> ({active_warehouse.city})
            </p>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 bg-stone-950 p-1 rounded-xl border border-stone-800">
          <button
            onClick={() => setFilterMode('ALL')}
            className={`px-3 py-1 text-xs rounded-lg font-medium transition-all ${
              filterMode === 'ALL'
                ? 'bg-yellow-500 text-stone-950 font-bold shadow-sm'
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            All Lanes ({inbound_routes.length + outbound_routes.length})
          </button>
          <button
            onClick={() => setFilterMode('INBOUND')}
            className={`px-3 py-1 text-xs rounded-lg font-medium transition-all flex items-center gap-1.5 ${
              filterMode === 'INBOUND'
                ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/40 font-bold'
                : 'text-stone-400 hover:text-yellow-400'
            }`}
          >
            <span className="w-2.5 h-2.5 rounded-full bg-[#EAB308]" />
            Inbound ({inbound_routes.length})
          </button>
          <button
            onClick={() => setFilterMode('OUTBOUND')}
            className={`px-3 py-1 text-xs rounded-lg font-medium transition-all flex items-center gap-1.5 ${
              filterMode === 'OUTBOUND'
                ? 'bg-[#78350F]/40 text-amber-200 border border-[#78350F] font-bold'
                : 'text-stone-400 hover:text-amber-300'
            }`}
          >
            <span className="w-2.5 h-2.5 rounded-full bg-[#78350F]" />
            Outbound ({outbound_routes.length})
          </button>
        </div>
      </div>

      {/* Map Container */}
      <div className="h-[440px] w-full rounded-xl overflow-hidden relative border border-stone-800">
        <MapContainer
          center={[active_warehouse.latitude || 25.0, active_warehouse.longitude || 10.0]}
          zoom={2}
          minZoom={2}
          maxZoom={10}
          scrollWheelZoom={false}
          style={{ height: '100%', width: '100%' }}
          zoomControl={false}
        >
          <ZoomControl position="topright" />
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {/* Active Warehouse Facility Node */}
          <Marker position={[active_warehouse.latitude, active_warehouse.longitude]} icon={hubIcon}>
            <Popup>
              <div className="p-2 text-stone-900">
                <div className="flex items-center gap-1.5 font-bold text-blue-700 text-sm">
                  <Navigation className="w-4 h-4" />
                  {active_warehouse.name}
                </div>
                <p className="text-xs text-stone-600 mt-1">
                  Location: {active_warehouse.city} ({active_warehouse.latitude}, {active_warehouse.longitude})
                </p>
                <div className="mt-2 pt-2 border-t border-stone-200 text-xs font-semibold text-stone-700">
                  Active Regional Cross-Dock Terminal
                </div>
              </div>
            </Popup>
          </Marker>

          {/* Inbound Routes (YELLOW #EAB308) */}
          {showInbound &&
            inbound_routes.map((route) => (
              <React.Fragment key={route.route_id}>
                <Polyline
                  positions={[route.origin_coords, route.destination_coords]}
                  pathOptions={{
                    color: '#EAB308', // YELLOW
                    weight: 3.2,
                    opacity: 0.9,
                    dashArray: null,
                  }}
                />
                <Marker position={route.origin_coords} icon={inboundIcon}>
                  <Popup>
                    <div className="p-2 text-stone-900">
                      <div className="text-xs font-bold text-yellow-600 uppercase tracking-wide">
                        Inbound Supplier Shipment
                      </div>
                      <div className="font-bold text-sm text-stone-800 mt-0.5">{route.name}</div>
                      <div className="text-xs text-stone-600 mt-1">Origin: {route.origin}</div>
                      <div className="text-xs text-stone-600">Cargo: <strong>{route.item_type}</strong></div>
                      <div className="text-xs text-stone-600">Lead Time: <strong>{route.lead_time}</strong></div>
                      <div className="text-xs text-stone-600">Avg Monthly: {Number(route.volume).toLocaleString()} units</div>
                    </div>
                  </Popup>
                </Marker>
              </React.Fragment>
            ))}

          {/* Outbound Routes (DARK BROWN #78350F) */}
          {showOutbound &&
            outbound_routes.map((route) => (
              <React.Fragment key={route.route_id}>
                <Polyline
                  positions={[route.origin_coords, route.destination_coords]}
                  pathOptions={{
                    color: '#78350F', // DARK BROWN
                    weight: 3.0,
                    opacity: 0.95,
                    dashArray: '5, 6',
                  }}
                />
                <Marker position={route.destination_coords} icon={outboundIcon}>
                  <Popup>
                    <div className="p-2 text-stone-900">
                      <div className="text-xs font-bold text-amber-900 uppercase tracking-wide">
                        Outbound Customer Delivery
                      </div>
                      <div className="font-bold text-sm text-stone-800 mt-0.5">{route.customer_id}</div>
                      <div className="text-xs text-stone-600 mt-1">Destination: {route.destination} ({route.region})</div>
                      <div className="text-xs text-stone-600">Guaranteed SLA: <strong>{route.sla_hours}</strong></div>
                      <div className="text-xs text-stone-600">Monthly Orders: {Number(route.avg_volume).toLocaleString()} units</div>
                    </div>
                  </Popup>
                </Marker>
              </React.Fragment>
            ))}
        </MapContainer>

        {/* Legend Overlay */}
        <div className="absolute bottom-3 left-3 z-[1000] bg-stone-950/90 backdrop-blur-md px-3.5 py-2.5 rounded-xl border border-stone-700/80 shadow-xl text-xs space-y-2">
          <div className="font-bold text-stone-200 text-[11px] uppercase tracking-wider">
            {t('dashboard.mapTitle')}
          </div>
          <div className="flex items-center gap-2 text-stone-300">
            <span className="w-3.5 h-3.5 rounded-full bg-[#EAB308] border border-black shadow-glow-amber inline-block" />
            <span className="font-medium text-yellow-400">{t('dashboard.inboundLegend')}</span>
          </div>
          <div className="flex items-center gap-2 text-stone-300">
            <span className="w-3.5 h-3.5 rounded-full bg-[#78350F] border border-stone-500 inline-block" />
            <span className="font-medium text-amber-200">{t('dashboard.outboundLegend')}</span>
          </div>
          <div className="flex items-center gap-2 text-stone-300">
            <span className="w-3.5 h-3.5 rounded-full bg-[#3B82F6] border border-black inline-block" />
            <span>Blue: {t('dashboard.activeTerminal')}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SupplyChainMap;
