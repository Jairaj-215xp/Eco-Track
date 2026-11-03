package com.example.ecotrack.data.repository

import com.example.ecotrack.data.model.CreateReportPayload
import com.example.ecotrack.data.model.Report
import com.example.ecotrack.data.remote.SupabaseClient
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import java.util.UUID

data class UserSession(
    val id: String = "cit_usr_101",
    val name: String = "Citizen Explorer",
    val email: String = "citizen@ecotrack.org",
    val role: String = "citizen", // "citizen", "org", "admin"
    val orgId: String = "org_green_earth",
    val orgName: String = "Green Earth Foundation",
    val serviceArea: String = "Kothrud & Karve Nagar, Pune",
    val crewSize: String = "15 active volunteers",
    val phone: String = "+91 98230 11223"
)

object EcoTrackRepository {
    private val _userSession = MutableStateFlow(UserSession())
    val userSession: StateFlow<UserSession> = _userSession.asStateFlow()

    private val _reports = MutableStateFlow<List<Report>>(emptyList())
    val reports: StateFlow<List<Report>> = _reports.asStateFlow()

    private val _isLoading = MutableStateFlow(false)
    val isLoading: StateFlow<Boolean> = _isLoading.asStateFlow()

    // Locally tracked submitted report IDs for this session
    private val mySubmittedIds = mutableSetOf<String>()

    private val fallbackReports = listOf(
        Report(
            id = "rep_karve_1",
            photoUrl = "https://images.unsplash.com/photo-1530587191325-3db32d826c18?auto=format&fit=crop&q=80&w=800",
            locationLat = 18.4912,
            locationLng = 73.8217,
            address = "Karve Nagar, Anandnagar, Pune, Maharashtra 411051",
            accuracyM = 12.0,
            wasteType = "plastic",
            severity = "high",
            note = "Accumulated single-use packaging and discarded beverage bottles on pavement.",
            status = "reported",
            reporterId = "cit_usr_101",
            reporterName = "Citizen Explorer",
            reporterEmail = "citizen@ecotrack.org",
            upvotes = 14,
            createdAt = "2026-11-02T18:00:00Z"
        ),
        Report(
            id = "rep_kothrud_2",
            photoUrl = "https://images.unsplash.com/photo-1605600659908-0ef719419d41?auto=format&fit=crop&q=80&w=800",
            locationLat = 18.5074,
            locationLng = 73.8077,
            address = "Near Cummins College Gate, Kothrud, Pune",
            accuracyM = 8.0,
            wasteType = "organic",
            severity = "medium",
            note = "Garden cuttings and decomposing compost along service lane.",
            status = "in_progress",
            reporterId = "cit_usr_202",
            reporterName = "Suresh Patil",
            reporterEmail = "suresh@ecotrack.org",
            assignedOrgId = "org_green_earth",
            assignedOrgName = "Green Earth Foundation",
            upvotes = 9,
            createdAt = "2026-11-02T14:30:00Z"
        ),
        Report(
            id = "rep_deccan_3",
            photoUrl = "https://images.unsplash.com/photo-1618477461853-cf6ed80faba5?auto=format&fit=crop&q=80&w=800",
            locationLat = 18.5167,
            locationLng = 73.8417,
            address = "Deccan Gymkhana, Riverside Road, Pune",
            accuracyM = 15.0,
            wasteType = "construction",
            severity = "high",
            note = "Concrete debris and tile rubble piled on corner.",
            status = "verified",
            reporterId = "cit_usr_101",
            reporterName = "Citizen Explorer",
            reporterEmail = "citizen@ecotrack.org",
            assignedOrgId = "org_green_earth",
            assignedOrgName = "Green Earth Foundation",
            proofUrl = "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&q=80&w=800",
            upvotes = 22,
            createdAt = "2026-11-01T10:15:00Z"
        )
    )

    suspend fun refreshReports() {
        _isLoading.value = true
        val result = SupabaseClient.getReports()
        if (result.isSuccess && result.getOrNull()?.isNotEmpty() == true) {
            val remote = result.getOrNull()!!
            // Merge with local fallback if remote doesn't have our active items
            val existingIds = remote.map { it.id }.toSet()
            val missingLocal = _reports.value.filter { it.id !in existingIds }
            _reports.value = remote + missingLocal
        } else {
            if (_reports.value.isEmpty()) {
                _reports.value = fallbackReports
            }
        }
        _isLoading.value = false
    }

    suspend fun submitReport(
        photoUrl: String,
        locationLat: Double,
        locationLng: Double,
        address: String,
        wasteType: String,
        severity: String,
        note: String,
        imageBytes: ByteArray? = null
    ): Result<Report> {
        val user = _userSession.value

        var finalPhotoUrl = photoUrl
        if (imageBytes != null && imageBytes.isNotEmpty()) {
            val uploadRes = SupabaseClient.uploadImage(imageBytes)
            if (uploadRes.isSuccess) {
                finalPhotoUrl = uploadRes.getOrNull() ?: photoUrl
            }
        }

        val reportId = UUID.randomUUID().toString()
        val payload = CreateReportPayload(
            id = reportId,
            photoUrl = finalPhotoUrl,
            locationLat = locationLat,
            locationLng = locationLng,
            address = address,
            accuracyM = 10.0,
            wasteType = wasteType,
            severity = severity,
            note = note,
            status = "reported",
            reporterId = user.id,
            reporterName = user.name,
            reporterEmail = user.email
        )

        mySubmittedIds.add(reportId)

        val result = SupabaseClient.createReport(payload)
        val created = if (result.isSuccess) {
            result.getOrNull()!!
        } else {
            Report(
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
        }

        _reports.value = listOf(created) + _reports.value.filter { it.id != created.id }
        return Result.success(created)
    }

    suspend fun claimReport(reportId: String): Result<Boolean> {
        val user = _userSession.value
        val res = SupabaseClient.claimTask(reportId, user.orgId, user.orgName)
        _reports.value = _reports.value.map { r ->
            if (r.id == reportId) {
                r.copy(status = "in_progress", assignedOrgId = user.orgId, assignedOrgName = user.orgName)
            } else r
        }
        return res
    }

    suspend fun submitCleanupProof(
        reportId: String,
        proofBytes: ByteArray? = null,
        proofUrl: String? = null
    ): Result<Boolean> {
        var finalProofUrl = proofUrl ?: "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&q=80&w=800"
        if (proofBytes != null && proofBytes.isNotEmpty()) {
            val uploadRes = SupabaseClient.uploadImage(proofBytes, "proof_${System.currentTimeMillis()}.jpg")
            if (uploadRes.isSuccess) {
                finalProofUrl = uploadRes.getOrNull() ?: finalProofUrl
            }
        }

        val res = SupabaseClient.submitProof(reportId, finalProofUrl)
        _reports.value = _reports.value.map { r ->
            if (r.id == reportId) {
                r.copy(status = "verified", proofUrl = finalProofUrl)
            } else r
        }
        return res
    }

    suspend fun verifyReport(reportId: String, approved: Boolean): Result<Boolean> {
        val newStatus = if (approved) "verified" else "reported"
        val res = SupabaseClient.updateReportStatus(reportId, newStatus)
        _reports.value = _reports.value.map { r ->
            if (r.id == reportId) {
                r.copy(status = newStatus)
            } else r
        }
        return res
    }

    suspend fun upvoteReport(reportId: String): Result<Boolean> {
        val target = _reports.value.find { it.id == reportId } ?: return Result.failure(Exception("Not found"))
        val newUpvotes = target.upvotes + 1
        val res = SupabaseClient.upvoteReport(reportId, newUpvotes)
        _reports.value = _reports.value.map { r ->
            if (r.id == reportId) r.copy(upvotes = newUpvotes) else r
        }
        return res
    }

    fun isMyReport(report: Report): Boolean {
        val user = _userSession.value
        return report.id in mySubmittedIds ||
                (report.reporterId != null && report.reporterId == user.id) ||
                (report.reporterEmail != null && report.reporterEmail.equals(user.email, ignoreCase = true))
    }

    fun switchRole(newRole: String) {
        _userSession.value = when (newRole) {
            "org" -> _userSession.value.copy(
                role = "org",
                name = "Green Earth Foundation",
                email = "ops@greenearth.org",
                orgId = "org_green_earth",
                orgName = "Green Earth Foundation",
                serviceArea = "Kothrud & Karve Nagar, Pune"
            )
            "admin" -> _userSession.value.copy(
                role = "admin",
                name = "City Municipal Admin",
                email = "admin@ecotrack.org"
            )
            else -> _userSession.value.copy(
                role = "citizen",
                name = "Citizen Explorer",
                email = "citizen@ecotrack.org"
            )
        }
    }

    fun updateProfile(name: String, email: String, role: String, orgName: String = "", serviceArea: String = "") {
        _userSession.value = _userSession.value.copy(
            name = name,
            email = email,
            role = role,
            orgName = if (orgName.isNotBlank()) orgName else _userSession.value.orgName,
            serviceArea = if (serviceArea.isNotBlank()) serviceArea else _userSession.value.serviceArea
        )
    }
}
