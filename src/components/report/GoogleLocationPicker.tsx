import React, { useEffect, useRef, useState, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Circle, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { 
  loadGoogleMapsCore, 
  isGoogleMapsConfigured, 
  reverseGeocodeCoords, 
  geocodeAddress,
  getCurrentDeviceLocation,
  googleMapsAuthFailed
} from '../../services/googleMapsService';
import { Navigation, Search, CheckCircle, Loader2, Crosshair, Building2, AlertCircle } from 'lucide-react';
import { Button } from '../ui/Button';
import { useTheme } from '../../contexts/ThemeContext';
import { useAlert } from '../../contexts/AlertContext';

// Fix Leaflet's default icon paths in React
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Custom Eco Marker Pin for Leaflet
const customEcoMarkerIcon = L.divIcon({
  className: 'custom-eco-marker-pin',
  html: `
    <div style="position: relative; width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; cursor: grab;">
      <div style="position: absolute; bottom: -2px; left: 50%; transform: translateX(-50%); width: 14px; height: 5px; background: rgba(0,0,0,0.35); border-radius: 50%; filter: blur(1.5px);"></div>
      <div style="width: 32px; height: 32px; background: linear-gradient(135deg, #10b981 0%, #059669 100%); border-radius: 50% 50% 50% 0; transform: rotate(-45deg); display: flex; align-items: center; justify-content: center; border: 2.5px solid #ffffff; box-shadow: 0 4px 14px rgba(0,0,0,0.35); position: absolute; top: 0; left: 2px;">
        <div style="width: 10px; height: 10px; background: #ffffff; border-radius: 50%; transform: rotate(45deg);"></div>
      </div>
    </div>
  `,
  iconSize: [36, 36],
  iconAnchor: [18, 36],
  popupAnchor: [0, -36],
});

// Component to pan/fly map when center coordinates change & invalidate size on load
function MapController({ center }: { center: [number, number] }) {
  const map = useMap();

  useEffect(() => {
    map.flyTo(center, Math.max(map.getZoom(), 16), { duration: 0.8 });
  }, [center[0], center[1]]);

  useEffect(() => {
    const t1 = setTimeout(() => map.invalidateSize(), 100);
    const t2 = setTimeout(() => map.invalidateSize(), 400);
    const t3 = setTimeout(() => map.invalidateSize(), 800);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [map]);

  return null;
}

// Component to handle map clicks & marker dragging in Leaflet
function LeafletPickerView({
  location,
  onLocationSelected,
}: {
  location: { lat: number; lng: number; accuracyM: number };
  onLocationSelected: (lat: number, lng: number) => void;
}) {
  const markerRef = useRef<L.Marker>(null);

  useMapEvents({
    click(e) {
      onLocationSelected(e.latlng.lat, e.latlng.lng);
    },
  });

  const eventHandlers = useMemo(
    () => ({
      dragend() {
        const marker = markerRef.current;
        if (marker != null) {
          const newPos = marker.getLatLng();
          onLocationSelected(newPos.lat, newPos.lng);
        }
      },
    }),
    [onLocationSelected]
  );

  return (
    <>
      <MapController center={[location.lat, location.lng]} />
      <Marker
        draggable={true}
        eventHandlers={eventHandlers}
        position={[location.lat, location.lng]}
        ref={markerRef}
        icon={customEcoMarkerIcon}
      />
      <Circle
        center={[location.lat, location.lng]}
        radius={location.accuracyM || 25}
        pathOptions={{
          color: '#059669',
          fillColor: '#10b981',
          fillOpacity: 0.18,
          weight: 1.5,
        }}
      />
    </>
  );
}

interface GoogleLocationPickerProps {
  location: { lat: number; lng: number; address: string; accuracyM: number };
  onChange: (newLocation: { lat: number; lng: number; address: string; accuracyM: number }) => void;
  onConfirm: () => void;
}

const POPULAR_PUNE_AREAS = [
  'Karve Nagar, Pune',
  'Kothrud, Pune',
  'Deccan Gymkhana, Pune',
  'Shivajinagar, Pune',
  'Baner, Pune',
  'Viman Nagar, Pune'
];

export function GoogleLocationPicker({
  location,
  onChange,
  onConfirm
}: GoogleLocationPickerProps) {
  const { resolvedTheme } = useTheme();
  const { showAlert } = useAlert();

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const markerRef = useRef<google.maps.Marker | null>(null);
  const circleRef = useRef<google.maps.Circle | null>(null);

  const [useLeaflet, setUseLeaflet] = useState(!isGoogleMapsConfigured || googleMapsAuthFailed);
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [geocoding, setGeocoding] = useState(false);
  const [searchQuery, setSearchQuery] = useState(location.address || '');

  // Detailed address state (Street, Building, Landmark)
  const [streetDetails, setStreetDetails] = useState('');
  const [landmarkDetails, setLandmarkDetails] = useState('');
  const [baseDetectedAddress, setBaseDetectedAddress] = useState(location.address || '');

  // Keep search input synced when address changes from external or geocode
  useEffect(() => {
    if (location.address && location.address !== 'Detecting location...') {
      setSearchQuery(location.address);
      if (!streetDetails && !landmarkDetails) {
        setBaseDetectedAddress(location.address);
      }
    }
  }, [location.address]);

  // Combine base address with user-provided street & landmark
  const updateCombinedAddress = (street: string, landmark: string, base: string) => {
    const parts: string[] = [];
    if (street.trim()) parts.push(street.trim());
    if (landmark.trim()) parts.push(`Near ${landmark.trim()}`);
    if (base.trim()) parts.push(base.trim());

    const combined = parts.join(', ');
    onChange({
      ...location,
      address: combined || base
    });
  };

  const handleStreetChange = (val: string) => {
    setStreetDetails(val);
    updateCombinedAddress(val, landmarkDetails, baseDetectedAddress);
  };

  const handleLandmarkChange = (val: string) => {
    setLandmarkDetails(val);
    updateCombinedAddress(streetDetails, val, baseDetectedAddress);
  };

  // Callback when user drags marker or clicks on Leaflet map
  const handleMapCoordChange = async (newLat: number, newLng: number, accuracy = 5) => {
    setGeocoding(true);
    const address = await reverseGeocodeCoords(newLat, newLng);
    setGeocoding(false);
    setBaseDetectedAddress(address);

    const parts: string[] = [];
    if (streetDetails.trim()) parts.push(streetDetails.trim());
    if (landmarkDetails.trim()) parts.push(`Near ${landmarkDetails.trim()}`);
    parts.push(address);

    onChange({
      lat: newLat,
      lng: newLng,
      address: parts.join(', '),
      accuracyM: accuracy
    });
  };

  // Attempt Google Maps initialization if configured; switch to Leaflet on any error or timeout
  useEffect(() => {
    let isMounted = true;

    if (!isGoogleMapsConfigured || googleMapsAuthFailed) {
      setUseLeaflet(true);
      return;
    }

    const prevAuth = (window as any).gm_authFailure;
    (window as any).gm_authFailure = () => {
      if (isMounted) setUseLeaflet(true);
      if (typeof prevAuth === 'function') prevAuth();
    };

    // Fallback safety timeout if Google Maps takes too long or freezes
    const safetyTimer = setTimeout(() => {
      if (isMounted && !mapInstanceRef.current) {
        setUseLeaflet(true);
      }
    }, 1500);

    loadGoogleMapsCore()
      .then((MapConstructor) => {
        if (!isMounted || !mapContainerRef.current) return;

        try {
          const map = new MapConstructor(mapContainerRef.current, {
            center: { lat: location.lat, lng: location.lng },
            zoom: 16,
            zoomControl: true,
            mapTypeControl: false,
            streetViewControl: false,
            fullscreenControl: false,
            styles: [
              { featureType: 'poi.park', elementType: 'geometry', stylers: [{ color: '#e8f5e9' }] },
              { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#e0f7fa' }] },
              { featureType: 'road', elementType: 'geometry', stylers: [{ lightness: 20 }] }
            ]
          });

          mapInstanceRef.current = map;

          const marker = new google.maps.Marker({
            position: { lat: location.lat, lng: location.lng },
            map,
            draggable: true,
            animation: google.maps.Animation.DROP,
            title: 'Drag to pinpoint exact spot',
            icon: {
              path: 'M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z',
              fillColor: '#16a34a',
              fillOpacity: 1,
              strokeWeight: 2,
              strokeColor: '#FFFFFF',
              scale: 2,
              anchor: new google.maps.Point(12, 22)
            }
          });

          markerRef.current = marker;

          const circle = new google.maps.Circle({
            map,
            center: { lat: location.lat, lng: location.lng },
            radius: location.accuracyM || 25,
            fillColor: '#34d399',
            fillOpacity: 0.18,
            strokeColor: '#059669',
            strokeOpacity: 0.5,
            strokeWeight: 1.5
          });

          circleRef.current = circle;

          marker.addListener('dragend', async () => {
            const pos = marker.getPosition();
            if (pos) {
              const newLat = pos.lat();
              const newLng = pos.lng();
              circle.setCenter({ lat: newLat, lng: newLng });
              handleMapCoordChange(newLat, newLng, 5);
            }
          });

          map.addListener('click', async (e: google.maps.MapMouseEvent) => {
            if (e.latLng) {
              const newLat = e.latLng.lat();
              const newLng = e.latLng.lng();
              marker.setPosition({ lat: newLat, lng: newLng });
              circle.setCenter({ lat: newLat, lng: newLng });
              handleMapCoordChange(newLat, newLng, 5);
            }
          });

          // Places Autocomplete
          if (searchInputRef.current && window.google?.maps?.places) {
            const autocomplete = new google.maps.places.Autocomplete(searchInputRef.current, {
              fields: ['geometry', 'formatted_address', 'name'],
              componentRestrictions: { country: 'in' }
            });

            autocomplete.addListener('place_changed', () => {
              const place = autocomplete.getPlace();
              if (place.geometry?.location) {
                const newLat = place.geometry.location.lat();
                const newLng = place.geometry.location.lng();
                const newAddress = place.formatted_address || place.name || `${newLat}, ${newLng}`;

                map.panTo({ lat: newLat, lng: newLng });
                map.setZoom(17);
                marker.setPosition({ lat: newLat, lng: newLng });
                circle.setCenter({ lat: newLat, lng: newLng });
                setBaseDetectedAddress(newAddress);

                const parts: string[] = [];
                if (streetDetails.trim()) parts.push(streetDetails.trim());
                if (landmarkDetails.trim()) parts.push(`Near ${landmarkDetails.trim()}`);
                parts.push(newAddress);

                onChange({
                  lat: newLat,
                  lng: newLng,
                  address: parts.join(', '),
                  accuracyM: 10
                });
              }
            });
          }
        } catch (innerErr) {
          console.warn('Google Maps initialization failed, switching to Leaflet:', innerErr);
          setUseLeaflet(true);
        }
      })
      .catch((err) => {
        console.warn('Google Maps Load Error, switching to Leaflet:', err);
        if (isMounted) setUseLeaflet(true);
      });

    return () => {
      isMounted = false;
      clearTimeout(safetyTimer);
    };
  }, []);

  // Sync Google Map marker if using Google Maps
  useEffect(() => {
    if (!useLeaflet && markerRef.current && mapInstanceRef.current) {
      markerRef.current.setPosition({ lat: location.lat, lng: location.lng });
      circleRef.current?.setCenter({ lat: location.lat, lng: location.lng });
      circleRef.current?.setRadius(location.accuracyM || 25);
      mapInstanceRef.current.panTo({ lat: location.lat, lng: location.lng });
    }
  }, [location.lat, location.lng, useLeaflet]);

  // Search input handler
  const handleSearchSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim()) return;

    setGeocoding(true);
    const result = await geocodeAddress(searchQuery);
    setGeocoding(false);

    if (result) {
      setBaseDetectedAddress(result.address);

      const parts: string[] = [];
      if (streetDetails.trim()) parts.push(streetDetails.trim());
      if (landmarkDetails.trim()) parts.push(`Near ${landmarkDetails.trim()}`);
      parts.push(result.address);

      onChange({
        lat: result.lat,
        lng: result.lng,
        address: parts.join(', '),
        accuracyM: 15
      });

      if (!useLeaflet && mapInstanceRef.current && markerRef.current) {
        mapInstanceRef.current.panTo({ lat: result.lat, lng: result.lng });
        mapInstanceRef.current.setZoom(17);
        markerRef.current.setPosition({ lat: result.lat, lng: result.lng });
        circleRef.current?.setCenter({ lat: result.lat, lng: result.lng });
      }

      showAlert(`Located "${searchQuery}"! Pin updated.`, 'info', 'Location Found');
    } else {
      showAlert(`Could not find "${searchQuery}". Please drag the pin on the map.`, 'warning', 'Location Search');
    }
  };

  // Quick area selection (e.g. Karve Nagar)
  const handleQuickAreaSelect = (areaName: string) => {
    setSearchQuery(areaName);
    setGeocoding(true);
    geocodeAddress(areaName).then((result) => {
      setGeocoding(false);
      if (result) {
        setBaseDetectedAddress(result.address);

        const parts: string[] = [];
        if (streetDetails.trim()) parts.push(streetDetails.trim());
        if (landmarkDetails.trim()) parts.push(`Near ${landmarkDetails.trim()}`);
        parts.push(result.address);

        onChange({
          lat: result.lat,
          lng: result.lng,
          address: parts.join(', '),
          accuracyM: 20
        });

        if (!useLeaflet && mapInstanceRef.current && markerRef.current) {
          mapInstanceRef.current.panTo({ lat: result.lat, lng: result.lng });
          mapInstanceRef.current.setZoom(17);
          markerRef.current.setPosition({ lat: result.lat, lng: result.lng });
          circleRef.current?.setCenter({ lat: result.lat, lng: result.lng });
        }
      }
    });
  };

  // Live GPS tracking
  const handleTrackCurrentLocation = async () => {
    setLoadingLocation(true);
    try {
      const coords = await getCurrentDeviceLocation();
      setGeocoding(true);
      const address = await reverseGeocodeCoords(coords.lat, coords.lng);
      setGeocoding(false);
      setBaseDetectedAddress(address);

      const parts: string[] = [];
      if (streetDetails.trim()) parts.push(streetDetails.trim());
      if (landmarkDetails.trim()) parts.push(`Near ${landmarkDetails.trim()}`);
      parts.push(address);

      onChange({
        lat: coords.lat,
        lng: coords.lng,
        address: parts.join(', '),
        accuracyM: coords.accuracyM
      });

      if (!useLeaflet && mapInstanceRef.current && markerRef.current) {
        mapInstanceRef.current.panTo({ lat: coords.lat, lng: coords.lng });
        mapInstanceRef.current.setZoom(17);
        markerRef.current.setPosition({ lat: coords.lat, lng: coords.lng });
        circleRef.current?.setCenter({ lat: coords.lat, lng: coords.lng });
        circleRef.current?.setRadius(coords.accuracyM);
      }

      showAlert(`Live GPS locked (±${coords.accuracyM}m accuracy)`, 'success', 'GPS Updated');
    } catch (err: any) {
      console.warn('GPS tracking error:', err);
      showAlert(
        'Could not access live device GPS. Please enable location permissions or drag the pin on the map.',
        'warning',
        'GPS Access Notice'
      );
    } finally {
      setLoadingLocation(false);
    }
  };

  const isCoarseAccuracy = (location.accuracyM || 0) > 150;

  // Leaflet Tile configuration (Carto Dark Matter for Dark mode, OSM for Light mode)
  const leafletTileUrl = resolvedTheme === 'dark'
    ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
    : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';

  const leafletAttribution = resolvedTheme === 'dark'
    ? '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
    : '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>';

  return (
    <div className="bg-surface rounded-[28px] p-3 border border-border flex flex-col h-full min-h-0 shadow-sm overflow-hidden">
      {/* Top Search Bar */}
      <form onSubmit={handleSearchSubmit} className="mb-2 shrink-0 flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
          <input
            ref={searchInputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSearchSubmit();
            }}
            placeholder="Search area, landmark or street (e.g. Kothrud, Baner)..."
            className="w-full bg-surface-2 border border-border rounded-xl pl-9 pr-16 py-2 text-xs text-ink focus:outline-none focus:ring-2 focus:ring-brand-500 font-medium"
          />
          <button
            type="button"
            onClick={() => handleSearchSubmit()}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] bg-brand-50 hover:bg-brand-100 text-brand-700 dark:bg-brand-950 dark:hover:bg-brand-900 dark:text-brand-300 px-2 py-0.5 rounded-md font-bold transition-colors"
          >
            {geocoding ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Search'}
          </button>
        </div>

        <button
          type="button"
          onClick={handleTrackCurrentLocation}
          disabled={loadingLocation}
          className="flex items-center space-x-1.5 px-3 py-2 bg-brand-500 hover:bg-brand-600 text-white rounded-xl text-xs font-bold shrink-0 transition-colors shadow-xs"
          title="Track High-Accuracy GPS"
        >
          {loadingLocation ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Navigation className="w-3.5 h-3.5" />
          )}
          <span>Track Me</span>
        </button>
      </form>

      {/* Quick Jump Buttons */}
      <div className="flex items-center gap-1.5 mb-2 overflow-x-auto no-scrollbar shrink-0 py-0.5">
        <span className="text-[10px] text-text-muted font-bold uppercase shrink-0">Quick Jump:</span>
        {POPULAR_PUNE_AREAS.map((area) => (
          <button
            key={area}
            type="button"
            onClick={() => handleQuickAreaSelect(area)}
            className="text-[10px] px-2 py-0.5 bg-surface-2 hover:bg-brand-50 hover:text-brand-700 dark:hover:bg-brand-950 dark:hover:text-brand-300 border border-border rounded-lg text-text-muted font-medium shrink-0 transition-colors"
          >
            {area.replace(', Pune', '')}
          </button>
        ))}
      </div>

      {/* Interactive Map Container */}
      <div className="flex-1 rounded-[20px] relative overflow-hidden bg-brand-50/50 dark:bg-brand-950/20 min-h-[200px] border border-border/80">
        {useLeaflet ? (
          <div className="h-full w-full relative z-0">
            <MapContainer
              center={[location.lat, location.lng]}
              zoom={16}
              style={{ height: '100%', width: '100%' }}
              zoomControl={true}
            >
              <TileLayer
                key={`${leafletTileUrl}-${resolvedTheme}`}
                attribution={leafletAttribution}
                url={leafletTileUrl}
              />
              <LeafletPickerView
                location={location}
                onLocationSelected={handleMapCoordChange}
              />
            </MapContainer>
          </div>
        ) : (
          <div ref={mapContainerRef} className="h-full w-full" />
        )}

        {/* Accuracy badge */}
        <div className="absolute top-2 left-2 z-[1000] flex flex-col gap-1 max-w-[280px] pointer-events-none">
          <div className="bg-surface/95 backdrop-blur-md px-2.5 py-1 rounded-lg border border-border shadow-xs text-[10px] font-bold flex items-center text-ink">
            <Crosshair className="w-3 h-3 mr-1 text-brand-600 shrink-0" />
            <span>Precision: ±{location.accuracyM || 10}m</span>
          </div>
          {isCoarseAccuracy && (
            <div className="bg-warn-soft/90 backdrop-blur-md px-2.5 py-1 rounded-lg border border-warn/30 text-[10px] text-warn font-semibold flex items-start">
              <AlertCircle className="w-3 h-3 mr-1 mt-0.5 shrink-0" />
              <span>Drag the pin to the exact spot.</span>
            </div>
          )}
        </div>

        {/* Drag pin hint badge */}
        <div className="absolute top-2 right-2 z-[1000] bg-surface/90 backdrop-blur-md px-2.5 py-1 rounded-lg border border-border shadow-xs text-[10px] text-ink font-medium pointer-events-none">
          Drag pin to garbage location
        </div>

        {/* Map engine indicator pill */}
        <div className="absolute bottom-2 left-2 z-[1000] bg-surface/85 backdrop-blur-sm border border-border px-2 py-0.5 rounded-md text-[9px] text-text-muted flex items-center pointer-events-none">
          <span className="w-1.5 h-1.5 rounded-full bg-brand-500 mr-1.5 animate-pulse" />
          <span>{useLeaflet ? 'Interactive OpenStreetMap' : 'Google Maps Engine'}</span>
        </div>
      </div>

      {/* Specific Street & Landmark Details Inputs */}
      <div className="mt-2.5 bg-surface-2/60 border border-border/80 rounded-2xl p-2.5 space-y-2 shrink-0">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-ink flex items-center">
            <Building2 className="w-3.5 h-3.5 mr-1 text-brand-600" /> Precise Street & Landmark Details
          </span>
          <span className="text-[10px] text-text-muted">Helps cleanup crew navigate directly</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <div>
            <input
              type="text"
              value={streetDetails}
              onChange={(e) => handleStreetChange(e.target.value)}
              placeholder="Street name, lane or society (e.g. Lane 3, Dahanukar Colony)..."
              className="w-full bg-surface border border-border rounded-xl px-3 py-1.5 text-xs text-ink focus:outline-none focus:ring-1 focus:ring-brand-500 shadow-2xs"
            />
          </div>

          <div>
            <input
              type="text"
              value={landmarkDetails}
              onChange={(e) => handleLandmarkChange(e.target.value)}
              placeholder="Nearby landmark (e.g. Opp. Cummins College gate, near bus stop)..."
              className="w-full bg-surface border border-border rounded-xl px-3 py-1.5 text-xs text-ink focus:outline-none focus:ring-1 focus:ring-brand-500 shadow-2xs"
            />
          </div>
        </div>
      </div>

      {/* Bottom Confirmation Bar */}
      <div className="mt-2 pt-2 border-t border-border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 shrink-0">
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Confirmed Address</p>
          <p className="text-xs font-semibold text-ink truncate" title={location.address}>
            {location.address}
          </p>
        </div>

        <div className="flex items-center space-x-2 w-full sm:w-auto shrink-0">
          <Button 
            size="sm"
            onClick={onConfirm} 
            className="w-full sm:w-auto px-6 py-2 shadow-sm text-xs bg-brand-500 hover:bg-brand-600 font-bold"
            leftIcon={<CheckCircle className="w-3.5 h-3.5" />}
          >
            Confirm Location
          </Button>
        </div>
      </div>
    </div>
  );
}
