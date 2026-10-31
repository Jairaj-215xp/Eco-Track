import React, { useEffect, useRef, useState } from 'react';
import { Report } from '../../types';
import { useNavigate } from 'react-router-dom';
import { loadGoogleMapsCore, isGoogleMapsConfigured } from '../../services/googleMapsService';
import { MapView as LeafletMapView } from './MapView';

interface GoogleMapViewProps {
  reports: Report[];
  center?: { lat: number; lng: number };
  zoom?: number;
  className?: string;
  onSelectReport?: (report: Report) => void;
}

export function GoogleMapView({
  reports,
  center = { lat: 18.5204, lng: 73.8567 },
  zoom = 13,
  className = 'h-full w-full',
  onSelectReport
}: GoogleMapViewProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);
  const navigate = useNavigate();
  const [loadError, setLoadError] = useState(false);

  // If Google Maps is not configured, fall back to Leaflet map
  if (!isGoogleMapsConfigured || loadError) {
    return (
      <div className={`relative ${className}`}>
        <LeafletMapView reports={reports} center={[center.lat, center.lng]} zoom={zoom} />
        {!isGoogleMapsConfigured && (
          <div className="absolute bottom-2 left-2 z-10 bg-surface/90 backdrop-blur-sm border border-border px-2.5 py-1 rounded-lg text-[10px] text-text-muted flex items-center shadow-xs">
            <span className="w-1.5 h-1.5 rounded-full bg-brand-500 mr-1.5"></span>
            Using OpenStreetMap (Add VITE_GOOGLE_MAPS_API_KEY for Google Maps)
          </div>
        )}
      </div>
    );
  }

  useEffect(() => {
    let isMounted = true;

    loadGoogleMapsCore()
      .then((MapConstructor) => {
        if (!isMounted || !mapRef.current) return;

        const ecoStyle: google.maps.MapTypeStyle[] = [
          { featureType: 'poi.park', elementType: 'geometry', stylers: [{ color: '#e8f5e9' }] },
          { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#e0f7fa' }] },
          { featureType: 'landscape.natural', elementType: 'geometry', stylers: [{ color: '#fbfbfb' }] }
        ];

        const map = new MapConstructor(mapRef.current, {
          center,
          zoom,
          styles: ecoStyle,
          disableDefaultUI: false,
          zoomControl: true,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: true
        });

        mapInstanceRef.current = map;

        // Clear existing markers
        markersRef.current.forEach((m) => m.setMap(null));
        markersRef.current = [];

        const infoWindow = new google.maps.InfoWindow();

        // Add markers for each report
        reports.forEach((report) => {
          const isResolved = report.status === 'verified';
          const isProgress = report.status === 'in_progress';
          
          const markerColor = isResolved ? '#22C55E' : isProgress ? '#F59E0B' : '#EF4444';

          const marker = new google.maps.Marker({
            position: { lat: report.location.lat, lng: report.location.lng },
            map,
            title: `${report.wasteType} Waste - ${report.status}`,
            icon: {
              path: google.maps.SymbolPath.CIRCLE,
              scale: 8,
              fillColor: markerColor,
              fillOpacity: 1,
              strokeWeight: 2,
              strokeColor: '#FFFFFF',
            }
          });

          marker.addListener('click', () => {
            if (onSelectReport) {
              onSelectReport(report);
            }

            const contentString = `
              <div style="font-family: inherit; max-width: 200px; padding: 4px;">
                <img src="${report.photoUrl}" alt="Garbage" style="width: 100%; height: 90px; object-fit: cover; border-radius: 8px; margin-bottom: 6px;" />
                <h4 style="margin: 0 0 4px 0; font-size: 13px; font-weight: bold; text-transform: capitalize;">${report.wasteType.replace('_', ' ')} Waste</h4>
                <p style="margin: 0 0 6px 0; font-size: 11px; color: #64748b;">${report.location.address}</p>
                <div style="display: flex; justify-content: space-between; align-items: center;">
                  <span style="font-size: 10px; font-weight: bold; padding: 2px 6px; border-radius: 4px; background: ${markerColor}20; color: ${markerColor};">${report.status.replace('_', ' ')}</span>
                  <a href="/report/${report.id}" style="font-size: 11px; color: #16a34a; font-weight: bold; text-decoration: none;">View &rarr;</a>
                </div>
              </div>
            `;
            infoWindow.setContent(contentString);
            infoWindow.open(map, marker);
          });

          markersRef.current.push(marker);
        });
      })
      .catch((err) => {
        console.error('Failed to load Google Maps:', err);
        setLoadError(true);
      });

    return () => {
      isMounted = false;
      markersRef.current.forEach((m) => m.setMap(null));
    };
  }, [reports, center.lat, center.lng, zoom]);

  return (
    <div className={`relative rounded-2xl overflow-hidden border border-border shadow-soft ${className}`}>
      <div ref={mapRef} className="h-full w-full" />
    </div>
  );
}
