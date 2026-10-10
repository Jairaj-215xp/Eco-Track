import React from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { Report } from '../../types';
import { useNavigate } from 'react-router-dom';

// Fix for default Leaflet icon paths in React
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

interface MapViewProps {
  reports: Report[];
  center?: [number, number];
  zoom?: number;
}

export function MapView({ reports, center = [18.5204, 73.8567], zoom = 12 }: MapViewProps) {
  const navigate = useNavigate();

  return (
    <div className="h-full w-full rounded-2xl overflow-hidden shadow-soft border border-border z-0">
      <MapContainer center={center} zoom={zoom} style={{ height: '100%', width: '100%' }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {reports.map((report) => (
          <Marker key={report.id} position={[report.location.lat, report.location.lng]}>
            <Popup>
              <div className="p-1 cursor-pointer" onClick={() => navigate(`/report/${report.id}`)}>
                <img src={report.photoUrl} alt="Garbage" className="w-full h-24 object-cover rounded-xl mb-2" />
                <h3 className="font-semibold capitalize mb-1">{report.wasteType.replace('_', ' ')} Waste</h3>
                <p className="text-xs text-text-muted">{report.location.address}</p>
                <button className="mt-2 text-xs text-accent font-medium">View Details &rarr;</button>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
