package com.example.ecotrack.ui.report

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import coil.compose.AsyncImage
import com.example.ecotrack.data.model.Report
import com.example.ecotrack.data.repository.EcoTrackRepository
import kotlinx.coroutines.launch

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ReportDetailScreen(
    report: Report,
    onBack: () -> Unit,
    onSubmitProof: (Report) -> Unit = {}
) {
    val scope = rememberCoroutineScope()
    val userSession by EcoTrackRepository.userSession.collectAsState()
    var selectedPhotoTab by remember { mutableStateOf(0) } // 0 = Before, 1 = After (if available)

    val isResolved = report.status == "verified"
    val isAssignedToMe = (report.assignedOrgId == userSession.orgId || report.assignedOrgName == userSession.orgName) &&
            (report.status == "in_progress" || report.status == "assigned")

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Report #${report.id.takeLast(6)}", fontWeight = FontWeight.Bold, fontSize = 18.sp) },
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Back")
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = Color.White)
            )
        }
    ) { padding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .background(Color(0xFFF8FAFC))
                .verticalScroll(rememberScrollState())
                .padding(16.dp)
        ) {
            // PHOTO PREVIEW (With Before / After Toggle if resolved)
            Card(
                shape = RoundedCornerShape(20.dp),
                colors = CardDefaults.cardColors(containerColor = Color.White),
                elevation = CardDefaults.cardElevation(defaultElevation = 2.dp),
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(modifier = Modifier.padding(14.dp)) {
                    if (isResolved && report.proofUrl != null) {
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(bottom = 10.dp),
                            horizontalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            FilterChip(
                                selected = selectedPhotoTab == 0,
                                onClick = { selectedPhotoTab = 0 },
                                label = { Text("Original (Before)", fontSize = 12.sp, fontWeight = FontWeight.Bold) },
                                modifier = Modifier.weight(1f)
                            )
                            FilterChip(
                                selected = selectedPhotoTab == 1,
                                onClick = { selectedPhotoTab = 1 },
                                label = { Text("Cleaned (After)", fontSize = 12.sp, fontWeight = FontWeight.Bold) },
                                colors = FilterChipDefaults.filterChipColors(
                                    selectedContainerColor = Color(0xFFECFDF5),
                                    selectedLabelColor = Color(0xFF047857)
                                ),
                                modifier = Modifier.weight(1f)
                            )
                        }
                    }

                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(240.dp)
                            .clip(RoundedCornerShape(16.dp))
                            .background(Color(0xFF0F172A))
                    ) {
                        val activeUrl = if (selectedPhotoTab == 1 && report.proofUrl != null) report.proofUrl else report.photoUrl
                        AsyncImage(
                            model = activeUrl,
                            contentDescription = "Report Image",
                            modifier = Modifier.fillMaxSize(),
                            contentScale = ContentScale.Crop
                        )

                        // Status badge on image
                        Surface(
                            color = when (report.status) {
                                "verified" -> Color(0xFF10B981)
                                "in_progress" -> Color(0xFF0284C7)
                                else -> Color(0xFFF59E0B)
                            },
                            shape = RoundedCornerShape(8.dp),
                            modifier = Modifier.align(Alignment.BottomEnd).padding(10.dp)
                        ) {
                            Text(
                                text = when (report.status) {
                                    "verified" -> "VERIFIED CLEAN"
                                    "in_progress" -> "CREW IN PROGRESS"
                                    else -> "REPORTED"
                                },
                                color = Color.White,
                                fontSize = 11.sp,
                                fontWeight = FontWeight.Bold,
                                modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp)
                            )
                        }
                    }
                }
            }

            Spacer(modifier = Modifier.height(14.dp))

            // LOCATION & DETAILS CARD
            Card(
                shape = RoundedCornerShape(20.dp),
                colors = CardDefaults.cardColors(containerColor = Color.White),
                elevation = CardDefaults.cardElevation(defaultElevation = 2.dp),
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text("Location Details", fontSize = 12.sp, fontWeight = FontWeight.Bold, color = Color(0xFF64748B))
                        Surface(
                            color = Color(0xFFF1F5F9),
                            shape = RoundedCornerShape(8.dp)
                        ) {
                            Text(
                                text = "GPS: ${String.format("%.4f", report.locationLat)}, ${String.format("%.4f", report.locationLng)}",
                                fontSize = 11.sp,
                                fontWeight = FontWeight.SemiBold,
                                color = Color(0xFF475569),
                                modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp)
                            )
                        }
                    }

                    Spacer(modifier = Modifier.height(6.dp))
                    Text(
                        text = report.address,
                        fontWeight = FontWeight.Bold,
                        fontSize = 15.sp,
                        color = Color(0xFF0F172A)
                    )

                    Spacer(modifier = Modifier.height(12.dp))
                    HorizontalDivider(color = Color(0xFFF1F5F9))
                    Spacer(modifier = Modifier.height(12.dp))

                    // Chips for Category, Severity, and Upvotes
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        Surface(
                            color = Color(0xFFECFDF5),
                            shape = RoundedCornerShape(10.dp),
                            modifier = Modifier.weight(1f)
                        ) {
                            Column(modifier = Modifier.padding(10.dp)) {
                                Text("CATEGORY", fontSize = 10.sp, fontWeight = FontWeight.Bold, color = Color(0xFF047857))
                                Text(report.wasteType.uppercase(), fontSize = 13.sp, fontWeight = FontWeight.ExtraBold, color = Color(0xFF065F46))
                            }
                        }

                        Surface(
                            color = when (report.severity.lowercase()) {
                                "high" -> Color(0xFFFEF2F2)
                                "medium" -> Color(0xFFFFFBEB)
                                else -> Color(0xFFF0FDF4)
                            },
                            shape = RoundedCornerShape(10.dp),
                            modifier = Modifier.weight(1f)
                        ) {
                            Column(modifier = Modifier.padding(10.dp)) {
                                Text("SEVERITY", fontSize = 10.sp, fontWeight = FontWeight.Bold, color = Color(0xFFB45309))
                                Text(report.severity.uppercase(), fontSize = 13.sp, fontWeight = FontWeight.ExtraBold, color = Color(0xFF92400E))
                            }
                        }

                        Surface(
                            color = Color(0xFFF8FAFC),
                            shape = RoundedCornerShape(10.dp),
                            border = androidx.compose.foundation.BorderStroke(1.dp, Color(0xFFE2E8F0)),
                            modifier = Modifier
                                .weight(1f)
                                .clickable {
                                    scope.launch { EcoTrackRepository.upvoteReport(report.id) }
                                }
                        ) {
                            Column(modifier = Modifier.padding(10.dp)) {
                                Text("UPVOTES", fontSize = 10.sp, fontWeight = FontWeight.Bold, color = Color(0xFF64748B))
                                Row(verticalAlignment = Alignment.CenterVertically) {
                                    Icon(Icons.Default.ThumbUp, contentDescription = null, tint = Color(0xFF10B981), modifier = Modifier.size(14.dp))
                                    Spacer(modifier = Modifier.width(4.dp))
                                    Text("${report.upvotes}", fontSize = 13.sp, fontWeight = FontWeight.ExtraBold, color = Color(0xFF0F172A))
                                }
                            }
                        }
                    }

                    if (!report.note.isNullOrBlank()) {
                        Spacer(modifier = Modifier.height(12.dp))
                        Text("Citizen Notes", fontSize = 11.sp, fontWeight = FontWeight.Bold, color = Color(0xFF64748B))
                        Spacer(modifier = Modifier.height(4.dp))
                        Text(report.note, fontSize = 13.sp, color = Color(0xFF334155))
                    }

                    if (report.assignedOrgName != null) {
                        Spacer(modifier = Modifier.height(12.dp))
                        Surface(
                            color = Color(0xFFE0F2FE),
                            shape = RoundedCornerShape(12.dp),
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Row(
                                modifier = Modifier.padding(10.dp),
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Icon(Icons.Default.Business, contentDescription = null, tint = Color(0xFF0284C7), modifier = Modifier.size(18.dp))
                                Spacer(modifier = Modifier.width(8.dp))
                                Text(
                                    text = "Assigned to: ${report.assignedOrgName}",
                                    fontSize = 12.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = Color(0xFF0369A1)
                                )
                            }
                        }
                    }
                }
            }

            Spacer(modifier = Modifier.height(16.dp))

            // NGO ACTION BUTTON: Submit Proof if claimed by this NGO
            if (isAssignedToMe) {
                Button(
                    onClick = { onSubmitProof(report) },
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(52.dp),
                    shape = RoundedCornerShape(16.dp),
                    colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF0EA5E9))
                ) {
                    Icon(Icons.Default.CheckCircle, contentDescription = null, modifier = Modifier.size(18.dp))
                    Spacer(modifier = Modifier.width(8.dp))
                    Text("Submit Proof of Cleanup", fontWeight = FontWeight.Bold, fontSize = 14.sp)
                }
            } else if (userSession.role == "org" && report.status == "reported" && report.assignedOrgId == null) {
                Button(
                    onClick = {
                        scope.launch {
                            EcoTrackRepository.claimReport(report.id)
                            onBack()
                        }
                    },
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(52.dp),
                    shape = RoundedCornerShape(16.dp),
                    colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF10B981))
                ) {
                    Icon(Icons.Default.AssignmentTurnedIn, contentDescription = null, modifier = Modifier.size(18.dp))
                    Spacer(modifier = Modifier.width(8.dp))
                    Text("Claim Task & Mobilize Crew", fontWeight = FontWeight.Bold, fontSize = 14.sp)
                }
            }
        }
    }
}
