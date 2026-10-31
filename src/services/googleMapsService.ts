import { setOptions, importLibrary } from '@googlemaps/js-api-loader';

const GOOGLE_MAPS_API_KEY = (import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '').trim();

export const isGoogleMapsConfigured = Boolean(
  GOOGLE_MAPS_API_KEY && 
  GOOGLE_MAPS_API_KEY !== 'YOUR_GOOGLE_MAPS_API_KEY' &&
  !GOOGLE_MAPS_API_KEY.includes('placeholder')
);

let optionsConfigured = false;

function ensureOptions() {
  if (!optionsConfigured && isGoogleMapsConfigured) {
    setOptions({
      key: GOOGLE_MAPS_API_KEY,
      v: 'weekly'
    });
    optionsConfigured = true;
  }
}

/**
 * Loads the core Google Maps library along with Places and Geocoding
 */
export async function loadGoogleMapsCore(): Promise<typeof google.maps.Map> {
  if (!isGoogleMapsConfigured) {
    throw new Error('Google Maps API key is not configured.');
  }

  ensureOptions();
  const mapsLib = await importLibrary('maps');
  await importLibrary('places');
  try {
    await importLibrary('geocoding');
  } catch (e) {
    // Geocoding is often available in core
  }
  return mapsLib.Map;
}

/**
 * Reverse geocodes coordinates to a clean human-readable address with high precision
 */
export async function reverseGeocodeCoords(lat: number, lng: number): Promise<string> {
  // 1. Try Google Maps Geocoder first if configured
  if (isGoogleMapsConfigured && window.google?.maps?.Geocoder) {
    try {
      const geocoder = new google.maps.Geocoder();
      const response = await geocoder.geocode({
        location: { lat, lng }
      });

      if (response.results && response.results.length > 0) {
        // Return most detailed address (usually index 0)
        return response.results[0].formatted_address;
      }
    } catch (err) {
      console.warn('Google reverse geocode failed, falling back:', err);
    }
  }

  // 2. High-precision OpenStreetMap Nominatim reverse geocode fallback
  try {
    const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=19&addressdetails=1`, {
      headers: {
        'Accept-Language': 'en',
      }
    });
    if (res.ok) {
      const data = await res.json();
      return data.display_name || `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
    }
  } catch (e) {
    console.error('Fallback geocode failed:', e);
  }

  return `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
}

/**
 * Forward geocodes an address or landmark text into exact coordinates
 */
export async function geocodeAddress(query: string): Promise<{ lat: number; lng: number; address: string } | null> {
  const cleanQuery = query.trim();
  if (!cleanQuery) return null;

  // 1. Try Google Geocoder
  if (isGoogleMapsConfigured && window.google?.maps?.Geocoder) {
    try {
      const geocoder = new google.maps.Geocoder();
      const response = await geocoder.geocode({ address: cleanQuery });

      if (response.results && response.results.length > 0) {
        const result = response.results[0];
        return {
          lat: result.geometry.location.lat(),
          lng: result.geometry.location.lng(),
          address: result.formatted_address
        };
      }
    } catch (err) {
      console.warn('Google forward geocode error:', err);
    }
  }

  // 2. Fallback to OpenStreetMap Nominatim Search API
  try {
    const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(cleanQuery)}&limit=1&addressdetails=1`, {
      headers: { 'Accept-Language': 'en' }
    });
    if (res.ok) {
      const data = await res.json();
      if (data && data.length > 0) {
        return {
          lat: parseFloat(data[0].lat),
          lng: parseFloat(data[0].lon),
          address: data[0].display_name
        };
      }
    }
  } catch (e) {
    console.error('Nominatim forward geocode error:', e);
  }

  return null;
}

/**
 * High-accuracy multi-sampling device GPS position
 * Sets maximumAge: 0 to ensure fresh hardware fix instead of stale ISP cache
 */
export function getCurrentDeviceLocation(): Promise<{ lat: number; lng: number; accuracyM: number }> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      return reject(new Error('Geolocation is not supported by your browser'));
    }

    let bestReading: { lat: number; lng: number; accuracyM: number } | null = null;
    let watchId: number | null = null;
    let timer: any = null;

    const cleanup = () => {
      if (watchId !== null) navigator.geolocation.clearWatch(watchId);
      if (timer !== null) clearTimeout(timer);
    };

    // Use watchPosition for up to 3.5 seconds to get the most accurate fix
    watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const accuracy = Math.round(pos.coords.accuracy || 50);
        const current = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracyM: accuracy
        };

        if (!bestReading || accuracy < bestReading.accuracyM) {
          bestReading = current;
        }

        // If accuracy is high (< 25 meters), resolve immediately!
        if (accuracy < 25) {
          cleanup();
          resolve(current);
        }
      },
      (_err) => {
        // Fallback to single getCurrentPosition if watch has an issue
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            cleanup();
            resolve({
              lat: pos.coords.latitude,
              lng: pos.coords.longitude,
              accuracyM: Math.round(pos.coords.accuracy || 30)
            });
          },
          (err2) => {
            cleanup();
            reject(err2);
          },
          { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
        );
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0 // Do not use stale cache
      }
    );

    // Timeout after 3.5 seconds and return best acquired fix
    timer = setTimeout(() => {
      cleanup();
      if (bestReading) {
        resolve(bestReading);
      } else {
        reject(new Error('GPS location timeout'));
      }
    }, 3500);
  });
}
