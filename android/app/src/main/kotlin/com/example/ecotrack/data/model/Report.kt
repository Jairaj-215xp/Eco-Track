package com.example.ecotrack.data.model

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

@Serializable
data class TimelineEvent(
    val status: String,
    val at: String,
    @SerialName("by_user") val byUser: String? = null,
    val comment: String? = null
)

@Serializable
data class ProofData(
    @SerialName("media_url") val mediaUrl: String? = null,
    @SerialName("media_type") val mediaType: String? = "image",
    val notes: String? = null,
    @SerialName("cleaned_kg") val cleanedKg: Double? = null,
    @SerialName("submitted_at") val submittedAt: String? = null
)

@Serializable
data class Report(
    val id: String,
    @SerialName("photo_url") val photoUrl: String,
    @SerialName("location_lat") val locationLat: Double,
    @SerialName("location_lng") val locationLng: Double,
    val address: String,
    @SerialName("accuracy_m") val accuracyM: Double? = 10.0,
    @SerialName("waste_type") val wasteType: String,
    val severity: String,
    val note: String? = null,
    val status: String,
    @SerialName("reporter_id") val reporterId: String? = null,
    @SerialName("reporter_name") val reporterName: String? = null,
    @SerialName("reporter_email") val reporterEmail: String? = null,
    @SerialName("assigned_org_id") val assignedOrgId: String? = null,
    @SerialName("assigned_org_name") val assignedOrgName: String? = null,
    @SerialName("proof_url") val proofUrl: String? = null,
    val upvotes: Int = 0,
    @SerialName("created_at") val createdAt: String,
    @SerialName("updated_at") val updatedAt: String? = null
)

@Serializable
data class CreateReportPayload(
    val id: String,
    @SerialName("photo_url") val photoUrl: String,
    @SerialName("location_lat") val locationLat: Double,
    @SerialName("location_lng") val locationLng: Double,
    val address: String,
    @SerialName("accuracy_m") val accuracyM: Double = 10.0,
    @SerialName("waste_type") val wasteType: String,
    val severity: String,
    val note: String? = null,
    val status: String = "reported",
    @SerialName("reporter_id") val reporterId: String? = null,
    @SerialName("reporter_name") val reporterName: String? = null,
    @SerialName("reporter_email") val reporterEmail: String? = null,
    val upvotes: Int = 0
)

@Serializable
data class ClaimReportPayload(
    @SerialName("assigned_org_id") val assignedOrgId: String,
    @SerialName("assigned_org_name") val assignedOrgName: String,
    val status: String = "in_progress"
)

@Serializable
data class SubmitProofPayload(
    @SerialName("proof_url") val proofUrl: String,
    val status: String = "verified"
)

@Serializable
data class Organization(
    val id: String,
    val name: String,
    val type: String,
    @SerialName("service_area") val serviceArea: String,
    val approved: Boolean = true,
    @SerialName("contact_email") val contactEmail: String? = null
)
