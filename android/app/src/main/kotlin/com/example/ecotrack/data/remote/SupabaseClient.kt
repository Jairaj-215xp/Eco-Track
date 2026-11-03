package com.example.ecotrack.data.remote

import com.example.ecotrack.data.model.ClaimReportPayload
import com.example.ecotrack.data.model.CreateReportPayload
import com.example.ecotrack.data.model.Report
import com.example.ecotrack.data.model.SubmitProofPayload
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import kotlinx.serialization.json.Json
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import java.io.IOException
import java.util.concurrent.TimeUnit

object SupabaseClient {
    private const val SUPABASE_URL = "https://xmabpuvmfnxrybsjjwyx.supabase.co"
    private const val SUPABASE_KEY = "sb_publishable_cKsNz1G65PbQu2p8q0Nb8w_aM-tRh-j"

    private val json = Json {
        ignoreUnknownKeys = true
        isLenient = true
        encodeDefaults = true
    }

    private val client = OkHttpClient.Builder()
        .connectTimeout(15, TimeUnit.SECONDS)
        .readTimeout(15, TimeUnit.SECONDS)
        .build()

    private val mediaTypeJson = "application/json; charset=utf-8".toMediaType()

    suspend fun getReports(): Result<List<Report>> = withContext(Dispatchers.IO) {
        try {
            val request = Request.Builder()
                .url("$SUPABASE_URL/rest/v1/reports?select=*&order=created_at.desc")
                .addHeader("apikey", SUPABASE_KEY)
                .addHeader("Authorization", "Bearer $SUPABASE_KEY")
                .addHeader("Accept", "application/json")
                .get()
                .build()

            client.newCall(request).execute().use { response ->
                if (!response.isSuccessful) {
                    return@withContext Result.failure(IOException("Server error: ${response.code}"))
                }
                val body = response.body?.string().orEmpty()
                val list = json.decodeFromString<List<Report>>(body)
                Result.success(list)
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun createReport(payload: CreateReportPayload): Result<Report> = withContext(Dispatchers.IO) {
        try {
            val bodyString = json.encodeToString(CreateReportPayload.serializer(), payload)
            val request = Request.Builder()
                .url("$SUPABASE_URL/rest/v1/reports")
                .addHeader("apikey", SUPABASE_KEY)
                .addHeader("Authorization", "Bearer $SUPABASE_KEY")
                .addHeader("Content-Type", "application/json")
                .addHeader("Prefer", "return=representation")
                .post(bodyString.toRequestBody(mediaTypeJson))
                .build()

            client.newCall(request).execute().use { response ->
                if (!response.isSuccessful) {
                    return@withContext Result.failure(IOException("Submit error: ${response.code}"))
                }
                val resBody = response.body?.string().orEmpty()
                val createdList = json.decodeFromString<List<Report>>(resBody)
                if (createdList.isNotEmpty()) {
                    Result.success(createdList.first())
                } else {
                    val fallback = Report(
                        id = payload.id,
                        photoUrl = payload.photoUrl,
                        locationLat = payload.locationLat,
                        locationLng = payload.locationLng,
                        address = payload.address,
                        accuracyM = payload.accuracyM,
                        wasteType = payload.wasteType,
                        severity = payload.severity,
                        note = payload.note,
                        status = payload.status,
                        reporterId = payload.reporterId,
                        reporterName = payload.reporterName,
                        reporterEmail = payload.reporterEmail,
                        upvotes = 0,
                        createdAt = java.time.Instant.now().toString()
                    )
                    Result.success(fallback)
                }
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun claimTask(reportId: String, orgId: String, orgName: String): Result<Boolean> = withContext(Dispatchers.IO) {
        try {
            val payload = ClaimReportPayload(assignedOrgId = orgId, assignedOrgName = orgName, status = "in_progress")
            val bodyString = json.encodeToString(ClaimReportPayload.serializer(), payload)
            val request = Request.Builder()
                .url("$SUPABASE_URL/rest/v1/reports?id=eq.$reportId")
                .addHeader("apikey", SUPABASE_KEY)
                .addHeader("Authorization", "Bearer $SUPABASE_KEY")
                .addHeader("Content-Type", "application/json")
                .patch(bodyString.toRequestBody(mediaTypeJson))
                .build()

            client.newCall(request).execute().use { response ->
                Result.success(response.isSuccessful)
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun submitProof(reportId: String, proofUrl: String): Result<Boolean> = withContext(Dispatchers.IO) {
        try {
            val payload = SubmitProofPayload(proofUrl = proofUrl, status = "verified")
            val bodyString = json.encodeToString(SubmitProofPayload.serializer(), payload)
            val request = Request.Builder()
                .url("$SUPABASE_URL/rest/v1/reports?id=eq.$reportId")
                .addHeader("apikey", SUPABASE_KEY)
                .addHeader("Authorization", "Bearer $SUPABASE_KEY")
                .addHeader("Content-Type", "application/json")
                .patch(bodyString.toRequestBody(mediaTypeJson))
                .build()

            client.newCall(request).execute().use { response ->
                Result.success(response.isSuccessful)
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun updateReportStatus(reportId: String, newStatus: String): Result<Boolean> = withContext(Dispatchers.IO) {
        try {
            val body = "{\"status\": \"$newStatus\"}".toRequestBody(mediaTypeJson)
            val request = Request.Builder()
                .url("$SUPABASE_URL/rest/v1/reports?id=eq.$reportId")
                .addHeader("apikey", SUPABASE_KEY)
                .addHeader("Authorization", "Bearer $SUPABASE_KEY")
                .addHeader("Content-Type", "application/json")
                .patch(body)
                .build()

            client.newCall(request).execute().use { response ->
                Result.success(response.isSuccessful)
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun upvoteReport(reportId: String, newCount: Int): Result<Boolean> = withContext(Dispatchers.IO) {
        try {
            val body = "{\"upvotes\": $newCount}".toRequestBody(mediaTypeJson)
            val request = Request.Builder()
                .url("$SUPABASE_URL/rest/v1/reports?id=eq.$reportId")
                .addHeader("apikey", SUPABASE_KEY)
                .addHeader("Authorization", "Bearer $SUPABASE_KEY")
                .addHeader("Content-Type", "application/json")
                .patch(body)
                .build()

            client.newCall(request).execute().use { response ->
                Result.success(response.isSuccessful)
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun uploadImage(bytes: ByteArray, fileName: String = "photo_${System.currentTimeMillis()}.jpg"): Result<String> = withContext(Dispatchers.IO) {
        try {
            val mediaType = "image/jpeg".toMediaType()
            val request = Request.Builder()
                .url("$SUPABASE_URL/storage/v1/object/reports/$fileName")
                .addHeader("apikey", SUPABASE_KEY)
                .addHeader("Authorization", "Bearer $SUPABASE_KEY")
                .addHeader("Content-Type", "image/jpeg")
                .post(bytes.toRequestBody(mediaType))
                .build()

            client.newCall(request).execute().use { response ->
                if (response.isSuccessful) {
                    val publicUrl = "$SUPABASE_URL/storage/v1/object/public/reports/$fileName"
                    Result.success(publicUrl)
                } else {
                    val b64 = android.util.Base64.encodeToString(bytes, android.util.Base64.NO_WRAP)
                    Result.success("data:image/jpeg;base64,$b64")
                }
            }
        } catch (e: Exception) {
            val b64 = android.util.Base64.encodeToString(bytes, android.util.Base64.NO_WRAP)
            Result.success("data:image/jpeg;base64,$b64")
        }
    }
}
