package com.example.ecotrack.ui.org

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
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

@Composable
fun NgoWorkspaceScreen(
    onSelectReport: (Report) -> Unit,
    onSubmitProof: (Report) -> Unit
) {
    val reports by EcoTrackRepository.reports.collectAsState()
    val userSession by EcoTrackRepository.userSession.collectAsState()
    val scope = rememberCoroutineScope()

    var activeTab by remember { mutableStateOf(0) } // 0 = Active Tasks, 1 = Available to Claim, 2 = Completed

    val myActiveTasks = reports.filter { r ->
        (r.assignedOrgId == userSession.orgId || r.assignedOrgName == userSession.orgName) &&
        (r.status == "in_progress" || r.status == "assigned" || r.status == "proof_submitted")
    }

    val openTasks = reports.filter { r ->
        r.status == "reported" && r.assignedOrgId == null
    }

    val completedTasks = reports.filter { r ->
        (r.assignedOrgId == userSession.orgId || r.assignedOrgName == userSession.orgName) &&
        r.status == "verified"
    }

    val totalKgCleaned = completedTasks.size * 28 + myActiveTasks.size * 10

    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .background(Color(0xFFF8FAFC)),
        contentPadding = PaddingValues(bottom = 80.dp)
    ) {
        // Header & KPI Metrics
        item {
            Surface(
                color = Color.White,
                shadowElevation = 1.dp
            ) {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(16.dp)
                ) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Column {
                            Text(
                                text = "NGO Field Command",
                                fontSize = 20.sp,
                                fontWeight = FontWeight.ExtraBold,
                                color = Color(0xFF0F172A)
                            )
                            Text(
                                text = userSession.orgName,
                                fontSize = 12.sp,
                                fontWeight = FontWeight.SemiBold,
                                color = Color(0xFF0284C7)
                            )
                        }

                        Surface(
                            color = Color(0xFFE0F2FE),
                            shape = RoundedCornerShape(10.dp)
                        ) {
                            Text(
                                text = "Area: ${userSession.serviceArea.split(',').first()}",
                                color = Color(0xFF0369A1),
                                fontSize = 11.sp,
                                fontWeight = FontWeight.Bold,
                                modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp)
                            )
                        }
                    }

                    Spacer(modifier = Modifier.height(14.dp))

                    // 4 Stat KPI Badges
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        NgoStatCard(modifier = Modifier.weight(1f), label = "Active Tasks", value = "${myActiveTasks.size}", color = Color(0xFF0284C7))
                        NgoStatCard(modifier = Modifier.weight(1f), label = "Available", value = "${openTasks.size}", color = Color(0xFFF59E0B))
                        NgoStatCard(modifier = Modifier.weight(1f), label = "Cleaned", value = "${completedTasks.size}", color = Color(0xFF10B981))
                        NgoStatCard(modifier = Modifier.weight(1f), label = "Waste Kg", value = "${totalKgCleaned}kg", color = Color(0xFF047857))
                    }

                    Spacer(modifier = Modifier.height(14.dp))

                    // 3-Way Tab Selector
                    TabRow(
                        selectedTabIndex = activeTab,
                        containerColor = Color(0xFFF1F5F9),
                        contentColor = Color(0xFF0284C7)
                    ) {
                        Tab(
                            selected = activeTab == 0,
                            onClick = { activeTab = 0 },
                            text = { Text("Active (${myActiveTasks.size})", fontWeight = FontWeight.Bold, fontSize = 11.sp) }
                        )
                        Tab(
                            selected = activeTab == 1,
                            onClick = { activeTab = 1 },
                            text = { Text("Claim Queue (${openTasks.size})", fontWeight = FontWeight.Bold, fontSize = 11.sp) }
                        )
                        Tab(
                            selected = activeTab == 2,
                            onClick = { activeTab = 2 },
                            text = { Text("Completed (${completedTasks.size})", fontWeight = FontWeight.Bold, fontSize = 11.sp) }
                        )
                    }
                }
            }
        }

        val displayList = when (activeTab) {
            0 -> myActiveTasks
            1 -> openTasks
            else -> completedTasks
        }

        if (displayList.isEmpty()) {
            item {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(36.dp),
                    horizontalAlignment = Alignment.CenterHorizontally
                ) {
                    Icon(
                        imageVector = when (activeTab) {
                            0 -> Icons.Default.AssignmentTurnedIn
                            1 -> Icons.Default.CheckCircle
                            else -> Icons.Default.MilitaryTech
                        },
                        contentDescription = null,
                        modifier = Modifier.size(48.dp),
                        tint = Color(0xFF0284C7)
                    )
                    Spacer(modifier = Modifier.height(10.dp))
                    Text(
                        text = when (activeTab) {
                            0 -> "No active claimed tasks right now"
                            1 -> "No unassigned reports in the queue"
                            else -> "No completed cleanups yet"
                        },
                        fontWeight = FontWeight.Bold,
                        color = Color(0xFF0F172A),
                        fontSize = 14.sp
                    )
                    Text(
                        text = when (activeTab) {
                            0 -> "Switch to 'Claim Queue' to mobilize crew for open spots."
                            1 -> "All reported garbage spots in this sector are claimed!"
                            else -> "Submit cleanup proof on active tasks to verify completed cleanups."
                        },
                        fontSize = 12.sp,
                        color = Color(0xFF64748B),
                        textAlign = androidx.compose.ui.text.style.TextAlign.Center
                    )
                }
            }
        } else {
            items(displayList, key = { it.id }) { report ->
                NgoTaskCard(
                    report = report,
                    tab = activeTab,
                    onInspect = { onSelectReport(report) },
                    onClaim = {
                        scope.launch { EcoTrackRepository.claimReport(report.id) }
                    },
                    onSubmitProof = { onSubmitProof(report) }
                )
            }
        }
    }
}

@Composable
fun NgoStatCard(
    modifier: Modifier = Modifier,
    label: String,
    value: String,
    color: Color
) {
    Card(
        modifier = modifier,
        shape = RoundedCornerShape(12.dp),
        colors = CardDefaults.cardColors(containerColor = Color(0xFFF8FAFC))
    ) {
        Column(modifier = Modifier.padding(8.dp)) {
            Text(label, fontSize = 9.sp, fontWeight = FontWeight.Bold, color = Color(0xFF64748B))
            Text(value, fontSize = 15.sp, fontWeight = FontWeight.ExtraBold, color = color)
        }
    }
}

@Composable
fun NgoTaskCard(
    report: Report,
    tab: Int,
    onInspect: () -> Unit,
    onClaim: () -> Unit,
    onSubmitProof: () -> Unit
) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 16.dp, vertical = 6.dp)
            .clickable { onInspect() },
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(containerColor = Color.White),
        elevation = CardDefaults.cardElevation(defaultElevation = 1.5.dp)
    ) {
        Column(modifier = Modifier.padding(14.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                // Photo
                Box(
                    modifier = Modifier
                        .size(76.dp)
                        .clip(RoundedCornerShape(12.dp))
                        .background(Color(0xFF0F172A))
                ) {
                    val displayImg = if (tab == 2 && report.proofUrl != null) report.proofUrl else report.photoUrl
                    AsyncImage(
                        model = displayImg,
                        contentDescription = null,
                        modifier = Modifier.fillMaxSize(),
                        contentScale = ContentScale.Crop
                    )
                }

                // Info
                Column(modifier = Modifier.weight(1f)) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Surface(
                            color = when (report.severity.lowercase()) {
                                "high" -> Color(0xFFFEF2F2)
                                "medium" -> Color(0xFFFFFBEB)
                                else -> Color(0xFFF0FDF4)
                            },
                            shape = RoundedCornerShape(6.dp)
                        ) {
                            Text(
                                text = report.severity.uppercase(),
                                fontSize = 9.sp,
                                fontWeight = FontWeight.Bold,
                                color = Color(0xFFB45309),
                                modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp)
                            )
                        }

                        Text(
                            text = report.wasteType.uppercase(),
                            fontSize = 10.sp,
                            fontWeight = FontWeight.Bold,
                            color = Color(0xFF64748B)
                        )
                    }

                    Spacer(modifier = Modifier.height(4.dp))
                    Text(
                        text = report.address,
                        fontSize = 13.sp,
                        fontWeight = FontWeight.Bold,
                        color = Color(0xFF0F172A),
                        maxLines = 1
                    )

                    if (!report.note.isNullOrBlank()) {
                        Text(
                            text = report.note,
                            fontSize = 11.sp,
                            color = Color(0xFF64748B),
                            maxLines = 1
                        )
                    }
                }
            }

            Spacer(modifier = Modifier.height(10.dp))

            // Action Button depending on tab
            when (tab) {
                0 -> { // Active Task: Submit Proof
                    Button(
                        onClick = onSubmitProof,
                        modifier = Modifier.fillMaxWidth().height(42.dp),
                        shape = RoundedCornerShape(10.dp),
                        colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF0EA5E9))
                    ) {
                        Icon(Icons.Default.CameraAlt, contentDescription = null, modifier = Modifier.size(16.dp))
                        Spacer(modifier = Modifier.width(6.dp))
                        Text("Submit Proof of Cleanup", fontWeight = FontWeight.Bold, fontSize = 12.sp)
                    }
                }
                1 -> { // Open Queue: Claim Task
                    Button(
                        onClick = onClaim,
                        modifier = Modifier.fillMaxWidth().height(42.dp),
                        shape = RoundedCornerShape(10.dp),
                        colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF10B981))
                    ) {
                        Icon(Icons.Default.AssignmentTurnedIn, contentDescription = null, modifier = Modifier.size(16.dp))
                        Spacer(modifier = Modifier.width(6.dp))
                        Text("Claim Task & Mobilize Crew", fontWeight = FontWeight.Bold, fontSize = 12.sp)
                    }
                }
                2 -> { // Completed: Verified badge
                    Surface(
                        color = Color(0xFFECFDF5),
                        shape = RoundedCornerShape(10.dp),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Row(
                            modifier = Modifier.padding(horizontal = 10.dp, vertical = 6.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Icon(Icons.Default.Verified, contentDescription = null, tint = Color(0xFF10B981), modifier = Modifier.size(16.dp))
                            Spacer(modifier = Modifier.width(6.dp))
                            Text("Cleanup Verified & Completed", fontSize = 11.sp, fontWeight = FontWeight.Bold, color = Color(0xFF047857))
                        }
                    }
                }
            }
        }
    }
}
