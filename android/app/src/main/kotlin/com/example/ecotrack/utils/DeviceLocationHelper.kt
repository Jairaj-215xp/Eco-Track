package com.example.ecotrack.utils

import android.Manifest
import android.content.Context
import android.content.pm.PackageManager
import android.location.Geocoder
import android.location.Location
import android.location.LocationManager
import android.os.Build
import androidx.core.content.ContextCompat
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import java.util.Locale

data class DeviceLocation(
    val lat: Double,
    val lng: Double,
    val address: String,
    val accuracyM: Double = 10.0
)

object DeviceLocationHelper {

    fun hasLocationPermission(context: Context): Boolean {
        val fine = ContextCompat.checkSelfPermission(context, Manifest.permission.ACCESS_FINE_LOCATION) == PackageManager.PERMISSION_GRANTED
        val coarse = ContextCompat.checkSelfPermission(context, Manifest.permission.ACCESS_COARSE_LOCATION) == PackageManager.PERMISSION_GRANTED
        return fine || coarse
    }

    fun hasCameraPermission(context: Context): Boolean {
        return ContextCompat.checkSelfPermission(context, Manifest.permission.CAMERA) == PackageManager.PERMISSION_GRANTED
    }

    suspend fun getDeviceLocation(context: Context): DeviceLocation = withContext(Dispatchers.IO) {
        if (!hasLocationPermission(context)) {
            return@withContext DeviceLocation(
                lat = 18.4912,
                lng = 73.8217,
                address = "Karve Nagar, Anandnagar, Pune, Maharashtra 411051"
            )
        }

        try {
            val locationManager = context.getSystemService(Context.LOCATION_SERVICE) as LocationManager
            val providers = listOf(LocationManager.GPS_PROVIDER, LocationManager.NETWORK_PROVIDER, LocationManager.PASSIVE_PROVIDER)
            var bestLoc: Location? = null

            for (provider in providers) {
                if (locationManager.isProviderEnabled(provider)) {
                    val loc = try {
                        locationManager.getLastKnownLocation(provider)
                    } catch (e: SecurityException) {
                        null
                    }
                    if (loc != null) {
                        if (bestLoc == null || loc.accuracy < bestLoc.accuracy) {
                            bestLoc = loc
                        }
                    }
                }
            }

            if (bestLoc != null) {
                val addr = reverseGeocode(context, bestLoc.latitude, bestLoc.longitude)
                return@withContext DeviceLocation(
                    lat = bestLoc.latitude,
                    lng = bestLoc.longitude,
                    address = addr,
                    accuracyM = bestLoc.accuracy.toDouble()
                )
            }
        } catch (e: Exception) {
            e.printStackTrace()
        }

        // Default Pune location
        DeviceLocation(
            lat = 18.4912,
            lng = 73.8217,
            address = "Karve Nagar, Anandnagar, Pune, Maharashtra 411051"
        )
    }

    private fun reverseGeocode(context: Context, lat: Double, lng: Double): String {
        try {
            if (Geocoder.isPresent()) {
                val geocoder = Geocoder(context, Locale.getDefault())
                val addresses = geocoder.getFromLocation(lat, lng, 1)
                if (!addresses.isNullOrEmpty()) {
                    val a = addresses[0]
                    val parts = listOfNotNull(
                        a.thoroughfare,
                        a.subLocality,
                        a.locality,
                        a.adminArea,
                        a.postalCode
                    )
                    if (parts.isNotEmpty()) {
                        return parts.joinToString(", ")
                    }
                    return a.getAddressLine(0) ?: "$lat, $lng"
                }
            }
        } catch (e: Exception) {
            // Geocoder service might fail without Play Services, fallback gracefully
        }
        return "Karve Nagar, Pune (${String.format(Locale.US, "%.4f, %.4f", lat, lng)})"
    }
}
