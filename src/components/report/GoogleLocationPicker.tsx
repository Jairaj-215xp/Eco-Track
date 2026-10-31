import React, { useEffect, useRef, useState } from 'react';
import { 
  loadGoogleMapsCore, 
  isGoogleMapsConfigured, 
  reverseGeocodeCoords, 
  geocodeAddress,
  getCurrentDeviceLocation 
} from '../../services/googleMapsService';
import { Navigation, Search, CheckCircle, Loader2, MapPin, AlertCircle, Crosshair, Building2, Landmark } from 'lucide-react';
import { Button } from '../ui/Button';

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
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const markerRef = useRef<google.maps.Marker | null>(null);
  const circleRef = useRef<google.maps.Circle | null>(null);

  const [loadingLocation, setLoadingLocation] = useState(false);
  const [geocoding, setGeocoding] = useState(false);
  const [mapLoaded, setMapLoaded] = useState(false);
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

  // Initialize Google Map
  useEffect(() => {
    let isMounted = true;

    if (!isGoogleMapsConfigured) {
      setMapLoaded(true);
      return;
    }

    loadGoogleMapsCore()
      .then((MapConstructor) => {
        if (!isMounted || !mapContainerRef.current) return;

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

        // Create draggable marker
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

        // Accuracy Circle
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

        // Marker drag end event with precise reverse geocoding
        marker.addListener('dragend', async () => {
          const pos = marker.getPosition();
          if (pos) {
            const newLat = pos.lat();
            const newLng = pos.lng();
            circle.setCenter({ lat: newLat, lng: newLng });
            setGeocoding(true);
            const address = await reverseGeocodeCoords(newLat, newLng);
            setGeocoding(false);
            setBaseDetectedAddress(address);

            // Preserve any user-typed street and landmark
            const parts: string[] = [];
            if (streetDetails.trim()) parts.push(streetDetails.trim());
            if (landmarkDetails.trim()) parts.push(`Near ${landmarkDetails.trim()}`);
            parts.push(address);

            onChange({
              lat: newLat,
              lng: newLng,
              address: parts.join(', '),
              accuracyM: 5
            });
          }
        });

        // Click anywhere on map to instantly move marker
        map.addListener('click', async (e: google.maps.MapMouseEvent) => {
          if (e.latLng) {
            const newLat = e.latLng.lat();
            const newLng = e.latLng.lng();
            marker.setPosition({ lat: newLat, lng: newLng });
            circle.setCenter({ lat: newLat, lng: newLng });
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
              accuracyM: 5
            });
          }
        });

        // Places Autocomplete with country restriction to India
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

        setMapLoaded(true);
      })
      .catch((err) => {
        console.error('Google Maps Load Error:', err);
        setMapLoaded(true);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Update marker position when location prop changes
  useEffect(() => {
    if (markerRef.current && mapInstanceRef.current) {
      markerRef.current.setPosition({ lat: location.lat, lng: location.lng });
      circleRef.current?.setCenter({ lat: location.lat, lng: location.lng });
      circleRef.current?.setRadius(location.accuracyM || 25);
      mapInstanceRef.current.panTo({ lat: location.lat, lng: location.lng });
    }
  }, [location.lat, location.lng]);

  // Handle manual search on Enter key or Search button click
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

      if (mapInstanceRef.current && markerRef.current) {
        mapInstanceRef.current.panTo({ lat: result.lat, lng: result.lng });
        mapInstanceRef.current.setZoom(17);
        markerRef.current.setPosition({ lat: result.lat, lng: result.lng });
        circleRef.current?.setCenter({ lat: result.lat, lng: result.lng });
      }
    }
  };

  // Quick area selection (e.g. Karve Nagar)
  const handleQuickAreaSelect = (areaName: string) => {
    setSearchQuery(areaName);
    geocodeAddress(areaName).then((result) => {
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

        if (mapInstanceRef.current && markerRef.current) {
          mapInstanceRef.current.panTo({ lat: result.lat, lng: result.lng });
          mapInstanceRef.current.setZoom(17);
          markerRef.current.setPosition({ lat: result.lat, lng: result.lng });
          circleRef.current?.setCenter({ lat: result.lat, lng: result.lng });
        }
      }
    });
  };

  // High-accuracy live GPS location tracking
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

      if (mapInstanceRef.current && markerRef.current) {
        mapInstanceRef.current.panTo({ lat: coords.lat, lng: coords.lng });
        mapInstanceRef.current.setZoom(17);
        markerRef.current.setPosition({ lat: coords.lat, lng: coords.lng });
        circleRef.current?.setCenter({ lat: coords.lat, lng: coords.lng });
        circleRef.current?.setRadius(coords.accuracyM);
      }
    } catch (err) {
      console.error('GPS tracking error:', err);
    } finally {
      setLoadingLocation(false);
    }
  };

  const isCoarseAccuracy = (location.accuracyM || 0) > 150;

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
            placeholder="Search area, landmark or street on Google Maps..."
            className="w-full bg-surface-2 border border-border rounded-xl pl-9 pr-16 py-2 text-xs text-ink focus:outline-none focus:ring-2 focus:ring-brand-500 font-medium"
          />
          <button
            type="button"
            onClick={() => handleSearchSubmit()}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] bg-brand-50 hover:bg-brand-100 text-brand-700 px-2 py-0.5 rounded-md font-bold transition-colors"
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
            className="text-[10px] px-2 py-0.5 bg-surface-2 hover:bg-brand-50 hover:text-brand-700 border border-border rounded-lg text-text-muted font-medium shrink-0 transition-colors"
          >
            {area.replace(', Pune', '')}
          </button>
        ))}
      </div>

      {/* Google Map */}
      <div className="flex-1 rounded-[20px] relative overflow-hidden bg-brand-50/50 min-h-[140px] border border-border/80 shrink-0">
        {isGoogleMapsConfigured ? (
          <div ref={mapContainerRef} className="h-full w-full" />
        ) : (
          <div className="h-full w-full relative flex items-center justify-center bg-brand-50">
            <div className="text-center p-4 relative z-10 max-w-sm">
              <MapPin className="w-6 h-6 animate-bounce text-brand-600 mx-auto mb-1" />
              <h4 className="font-bold text-ink text-xs mb-1">GPS Location Locked</h4>
              <p className="text-[11px] text-text-muted">{location.address}</p>
            </div>
          </div>
        )}

        {/* Accuracy badge */}
        <div className="absolute top-2 left-2 z-10 flex flex-col gap-1 max-w-[280px]">
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

        <div className="absolute top-2 right-2 bg-surface/90 backdrop-blur-md px-2.5 py-1 rounded-lg border border-border shadow-xs text-[10px] text-ink font-medium pointer-events-none">
          Drag pin to garbage location
        </div>
      </div>

      {/* NEW: Specific Street & Landmark Details Inputs */}
      <div className="mt-2.5 bg-surface-2/60 border border-border/80 rounded-2xl p-2.5 space-y-2 shrink-0">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-ink flex items-center">
            <Building2 className="w-3.5 h-3.5 mr-1 text-brand-600" /> Precise Street & Landmark Details
          </span>
          <span className="text-[10px] text-text-muted">Helps cleanup crew navigate directly</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <div>
            <div className="relative">
              <input
                type="text"
                value={streetDetails}
                onChange={(e) => handleStreetChange(e.target.value)}
                placeholder="Street name, lane or society (e.g. Lane 3, Dahanukar Colony)..."
                className="w-full bg-surface border border-border rounded-xl px-3 py-1.5 text-xs text-ink focus:outline-none focus:ring-1 focus:ring-brand-500 shadow-2xs"
              />
            </div>
          </div>

          <div>
            <div className="relative">
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
