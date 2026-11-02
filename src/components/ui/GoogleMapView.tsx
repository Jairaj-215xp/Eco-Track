import React, { useEffect, useRef, useState } from 'react';
import { Report } from '../../types';
import { useNavigate } from 'react-router-dom';
import { loadGoogleMapsCore, isGoogleMapsConfigured, googleMapsAuthFailed } from '../../services/googleMapsService';
import { MapView as LeafletMapView } from './MapView';
import { useTheme } from '../../contexts/ThemeContext';

interface GoogleMapViewProps {
  reports: Report[];
  center?: { lat: number; lng: number };
  zoom?: number;
  className?: string;
  onSelectReport?: (report: Report) => void;
}

const lightEcoStyle: google.maps.MapTypeStyle[] = [
  { featureType: 'poi.park', elementType: 'geometry', stylers: [{ color: '#e8f5e9' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#e0f7fa' }] },
  { featureType: 'landscape.natural', elementType: 'geometry', stylers: [{ color: '#fbfbfb' }] }
];

const darkEcoStyle: google.maps.MapTypeStyle[] = [
  { elementType: 'geometry', stylers: [{ color: '#13231d' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#13231d' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#9bb8ab' }] },
  { featureType: 'poi.park', elementType: 'geometry', stylers: [{ color: '#183127' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0d1815' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#1f382f' }] },
  { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#172b24' }] }
];

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
  const [loadError, setLoadError] = useState(googleMapsAuthFailed);
  const { resolvedTheme } = useTheme();

  const shouldUseLeaflet = !isGoogleMapsConfigured || loadError || googleMapsAuthFailed;

  useEffect(() => {
    if (shouldUseLeaflet) return;
    let isMounted = true;

    loadGoogleMapsCore()
      .then((MapConstructor) => {
        if (!isMounted || !mapRef.current) return;

        const activeStyle = resolvedTheme === 'dark' ? darkEcoStyle : lightEcoStyle;

        const map = new MapConstructor(mapRef.current, {
          center,
          zoom,
          styles: activeStyle,
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
        console.warn('Failed to load Google Maps, falling back to Leaflet:', err);
        setLoadError(true);
      });

    return () => {
      isMounted = false;
      markersRef.current.forEach((m) => m.setMap(null));
    };
  }, [reports, center.lat, center.lng, zoom, resolvedTheme, shouldUseLeaflet]);

  // Dynamically update map style if theme changes while map is loaded
  useEffect(() => {
    if (shouldUseLeaflet) return;
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setOptions({
        styles: resolvedTheme === 'dark' ? darkEcoStyle : lightEcoStyle
      });
    }
  }, [resolvedTheme, shouldUseLeaflet]);

  // If Google Maps is not configured or failed, fall back to Leaflet map
  if (shouldUseLeaflet) {
    return (
      <div className={`relative ${className}`}>
        <LeafletMapView reports={reports} center={[center.lat, center.lng]} zoom={zoom} />
      </div>
    );
  }

  return (
    <div className={`relative rounded-2xl overflow-hidden border border-border shadow-soft ${className}`}>
      <div ref={mapRef} className="h-full w-full" />
    </div>
  );
}
