package com.example.ecotrack.ui.feed

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
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
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import coil.compose.AsyncImage
import com.example.ecotrack.data.model.Report
import com.example.ecotrack.data.repository.EcoTrackRepository
import kotlinx.coroutines.launch

@Composable
fun FeedScreen(
    onNavigateToReport: () -> Unit,
    onSelectReport: (Report) -> Unit = {}
) {
    val reports by EcoTrackRepository.reports.collectAsState()
    val isLoading by EcoTrackRepository.isLoading.collectAsState()
    val userSession by EcoTrackRepository.userSession.collectAsState()
    val scope = rememberCoroutineScope()

    var selectedStatus by remember { mutableStateOf("all") }
    var selectedCategory by remember { mutableStateOf("all") }
    var searchQuery by remember { mutableStateOf("") }

    val filteredReports = reports.filter { r ->
        val statusMatch = when (selectedStatus) {
            "reported" -> r.status == "reported" && r.assignedOrgId == null
            "in_progress" -> r.status == "in_progress" || r.status == "assigned"
            "verified" -> r.status == "verified"
            else -> true
        }
        val categoryMatch = if (selectedCategory == "all") true else r.wasteType.equals(selectedCategory, ignoreCase = true)
        val searchMatch = if (searchQuery.isBlank()) true else {
            r.address.contains(searchQuery, ignoreCase = true) || r.wasteType.contains(searchQuery, ignoreCase = true)
        }
        statusMatch && categoryMatch && searchMatch
    }

    // Recommended nearest cleanup for NGO
    val recommendedCleanup = if (userSession.role == "org") {
        reports.firstOrNull { it.status == "reported" && it.assignedOrgId == null }
    } else null

    LaunchedEffect(Unit) {
        EcoTrackRepository.refreshReports()
    }

    Scaffold(
        floatingActionButton = {
            if (userSession.role == "citizen") {
                ExtendedFloatingActionButton(
                    onClick = onNavigateToReport,
                    containerColor = Color(0xFF10B981),
                    contentColor = Color.White,
                    icon = { Icon(Icons.Default.AddAPhoto, contentDescription = "Report") },
                    text = { Text("Report Waste", fontWeight = FontWeight.Bold) }
                )
            }
        }
    ) { paddingValues ->
        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
                .background(Color(0xFFF8FAFC)),
            contentPadding = PaddingValues(bottom = 80.dp)
        ) {
            // Header
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
                                    text = if (userSession.role == "org") "Field Operations Feed" else "Community Live Feed",
                                    fontSize = 20.sp,
                                    fontWeight = FontWeight.ExtraBold,
                                    color = Color(0xFF0F172A)
                                )
                                Text(
                                    text = if (userSession.role == "org") "Real-time dispatch stream in Pune" else "Live urban waste reports from citizens",
                                    fontSize = 12.sp,
                                    color = Color(0xFF64748B)
                                )
                            }

                            Surface(
                                color = if (userSession.role == "org") Color(0xFFE0F2FE) else Color(0xFFECFDF5),
                                shape = RoundedCornerShape(10.dp)
                            ) {
                                Text(
                                    text = if (userSession.role == "org") "NGO View" else "Citizen View",
                                    fontWeight = FontWeight.Bold,
                                    fontSize = 11.sp,
                                    color = if (userSession.role == "org") Color(0xFF0369A1) else Color(0xFF047857),
                                    modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp)
                                )
                            }
                        }

                        Spacer(modifier = Modifier.height(12.dp))

                        // Search Bar
                        OutlinedTextField(
                            value = searchQuery,
                            onValueChange = { searchQuery = it },
                            modifier = Modifier.fillMaxWidth(),
                            placeholder = { Text("Search location or waste type...", fontSize = 13.sp) },
                            leadingIcon = { Icon(Icons.Default.Search, contentDescription = "Search", tint = Color(0xFF94A3B8)) },
                            singleLine = true,
                            shape = RoundedCornerShape(14.dp),
                            colors = OutlinedTextFieldDefaults.colors(
                                focusedBorderColor = Color(0xFF10B981),
                                unfocusedBorderColor = Color(0xFFE2E8F0),
                                focusedContainerColor = Color(0xFFF8FAFC),
                                unfocusedContainerColor = Color(0xFFF8FAFC)
                            )
                        )
                    }
                }
            }

            // RECOMMENDED NEAREST CLEANUP BANNER FOR NGO (Matches Website)
            if (userSession.role == "org" && recommendedCleanup != null) {
                item {
                    Card(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(horizontal = 16.dp, vertical = 10.dp),
                        shape = RoundedCornerShape(16.dp),
                        colors = CardDefaults.cardColors(containerColor = Color(0xFFEFF6FF)),
                        border = androidx.compose.foundation.BorderStroke(1.dp, Color(0xFF93C5FD))
                    ) {
                        Column(modifier = Modifier.padding(14.dp)) {
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Icon(Icons.Default.NearMe, contentDescription = null, tint = Color(0xFF0284C7), modifier = Modifier.size(16.dp))
                                Spacer(modifier = Modifier.width(6.dp))
                                Text("RECOMMENDED NEAREST CLEANUP", fontSize = 11.sp, fontWeight = FontWeight.Bold, color = Color(0xFF0284C7))
                            }

                            Spacer(modifier = Modifier.height(6.dp))
                            Text(
                                text = recommendedCleanup.address,
                                fontWeight = FontWeight.Bold,
                                fontSize = 13.sp,
                                color = Color(0xFF1E3A8A)
                            )

                            Spacer(modifier = Modifier.height(8.dp))
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Text(
                                    text = "Waste: ${recommendedCleanup.wasteType.uppercase()} • ${recommendedCleanup.severity.uppercase()}",
                                    fontSize = 11.sp,
                                    color = Color(0xFF3B82F6),
                                    fontWeight = FontWeight.SemiBold
                                )

                                Button(
                                    onClick = {
                                        scope.launch { EcoTrackRepository.claimReport(recommendedCleanup.id) }
                                    },
                                    colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF0284C7)),
                                    shape = RoundedCornerShape(10.dp),
                                    contentPadding = PaddingValues(horizontal = 10.dp, vertical = 4.dp)
                                ) {
                                    Icon(Icons.Default.AssignmentTurnedIn, contentDescription = null, modifier = Modifier.size(14.dp))
                                    Spacer(modifier = Modifier.width(4.dp))
                                    Text("Claim Task", fontSize = 11.sp, fontWeight = FontWeight.Bold)
                                }
                            }
                        }
                    }
                }
            }

            // Status Filter Chips
            item {
                LazyRow(
                    modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 8.dp),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    val statusList = listOf(
                        "all" to "All Reports (${reports.size})",
                        "reported" to "Open",
                        "in_progress" to "In Progress",
                        "verified" to "Verified Clean"
                    )
                    items(statusList) { (key, label) ->
                        FilterChip(
                            selected = selectedStatus == key,
                            onClick = { selectedStatus = key },
                            label = { Text(label, fontSize = 12.sp, fontWeight = FontWeight.SemiBold) },
                            colors = FilterChipDefaults.filterChipColors(
                                selectedContainerColor = Color(0xFF10B981),
                                selectedLabelColor = Color.White,
                                containerColor = Color.White,
                                labelColor = Color(0xFF475569)
                            ),
                            shape = RoundedCornerShape(20.dp)
                        )
                    }
                }
            }

            // Waste Type Chips
            item {
                LazyRow(
                    modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 4.dp),
                    horizontalArrangement = Arrangement.spacedBy(6.dp)
                ) {
                    val categories = listOf("all", "plastic", "organic", "construction", "household")
                    items(categories) { cat ->
                        AssistChip(
                            onClick = { selectedCategory = cat },
                            label = { Text(cat.replaceFirstChar { it.uppercase() }, fontSize = 11.sp) },
                            colors = AssistChipDefaults.assistChipColors(
                                containerColor = if (selectedCategory == cat) Color(0xFFE2E8F0) else Color.White,
                                labelColor = Color(0xFF334155)
                            ),
                            shape = RoundedCornerShape(12.dp)
                        )
                    }
                }
            }

            if (isLoading && reports.isEmpty()) {
                item {
                    Box(modifier = Modifier.fillMaxWidth().height(200.dp), contentAlignment = Alignment.Center) {
                        CircularProgressIndicator(color = Color(0xFF10B981))
                    }
                }
            } else if (filteredReports.isEmpty()) {
                item {
                    Column(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(32.dp),
                        horizontalAlignment = Alignment.CenterHorizontally
                    ) {
                        Icon(Icons.Default.Park, contentDescription = null, modifier = Modifier.size(48.dp), tint = Color(0xFF10B981))
                        Spacer(modifier = Modifier.height(8.dp))
                        Text("No reports found", fontWeight = FontWeight.Bold, color = Color(0xFF1E293B))
                        Text("Try clearing filters or search queries.", fontSize = 12.sp, color = Color(0xFF64748B))
                    }
                }
            } else {
                items(filteredReports, key = { it.id }) { report ->
                    ReportCardItem(
                        report = report,
                        isNgo = userSession.role == "org",
                        onClick = { onSelectReport(report) },
                        onUpvote = {
                            scope.launch { EcoTrackRepository.upvoteReport(report.id) }
                        },
                        onClaim = {
                            scope.launch { EcoTrackRepository.claimReport(report.id) }
                        }
                    )
                }
            }
        }
    }
}

@Composable
fun ReportCardItem(
    report: Report,
    isNgo: Boolean,
    onClick: () -> Unit = {},
    onUpvote: () -> Unit = {},
    onClaim: () -> Unit = {}
) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 16.dp, vertical = 7.dp)
            .clickable { onClick() },
        shape = RoundedCornerShape(20.dp),
        colors = CardDefaults.cardColors(containerColor = Color.White),
        elevation = CardDefaults.cardElevation(defaultElevation = 1.5.dp)
    ) {
        Column {
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(180.dp)
            ) {
                AsyncImage(
                    model = report.photoUrl,
                    contentDescription = report.wasteType,
                    modifier = Modifier.fillMaxSize(),
                    contentScale = ContentScale.Crop
                )

                Surface(
                    color = Color.Black.copy(alpha = 0.65f),
                    shape = RoundedCornerShape(12.dp),
                    modifier = Modifier.padding(10.dp).align(Alignment.BottomStart)
                ) {
                    Text(
                        text = report.wasteType.uppercase(),
                        color = Color.White,
                        fontSize = 10.sp,
                        fontWeight = FontWeight.Bold,
                        modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp)
                    )
                }

                val (statusBg, statusColor, statusText) = when (report.status) {
                    "verified" -> Triple(Color(0xFFDCFCE7), Color(0xFF15803D), "Verified Clean")
                    "in_progress", "assigned" -> Triple(Color(0xFFFEF3C7), Color(0xFFB45309), "In Progress")
                    else -> Triple(Color(0xFFFFEDD5), Color(0xFFC2410C), "Reported")
                }

                Surface(
                    color = statusBg,
                    shape = RoundedCornerShape(12.dp),
                    modifier = Modifier.padding(10.dp).align(Alignment.TopEnd)
                ) {
                    Text(
                        text = statusText,
                        color = statusColor,
                        fontSize = 10.sp,
                        fontWeight = FontWeight.Bold,
                        modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp)
                    )
                }
            }

            Column(modifier = Modifier.padding(14.dp)) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(Icons.Default.LocationOn, contentDescription = null, tint = Color(0xFF10B981), modifier = Modifier.size(16.dp))
                    Spacer(modifier = Modifier.width(4.dp))
                    Text(
                        text = report.address,
                        fontSize = 13.sp,
                        fontWeight = FontWeight.Bold,
                        color = Color(0xFF0F172A),
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis
                    )
                }

                if (!report.note.isNullOrBlank()) {
                    Spacer(modifier = Modifier.height(4.dp))
                    Text(
                        text = report.note,
                        fontSize = 12.sp,
                        color = Color(0xFF475569),
                        maxLines = 2,
                        overflow = TextOverflow.Ellipsis
                    )
                }

                Spacer(modifier = Modifier.height(10.dp))

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Surface(
                        shape = RoundedCornerShape(12.dp),
                        color = Color(0xFFF1F5F9),
                        modifier = Modifier.clickable { onUpvote() }
                    ) {
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            modifier = Modifier.padding(horizontal = 10.dp, vertical = 6.dp)
                        ) {
                            Icon(Icons.Default.ThumbUp, contentDescription = "Upvote", tint = Color(0xFF10B981), modifier = Modifier.size(14.dp))
                            Spacer(modifier = Modifier.width(4.dp))
                            Text(text = "${report.upvotes}", fontSize = 12.sp, fontWeight = FontWeight.Bold, color = Color(0xFF0F172A))
                        }
                    }

                    if (isNgo && report.status == "reported" && report.assignedOrgId == null) {
                        Button(
                            onClick = onClaim,
                            colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF0EA5E9)),
                            shape = RoundedCornerShape(12.dp),
                            contentPadding = PaddingValues(horizontal = 12.dp, vertical = 6.dp)
                        ) {
                            Icon(Icons.Default.AssignmentTurnedIn, contentDescription = null, modifier = Modifier.size(14.dp))
                            Spacer(modifier = Modifier.width(4.dp))
                            Text("Claim Task", fontSize = 11.sp, fontWeight = FontWeight.Bold)
                        }
                    } else if (report.assignedOrgName != null) {
                        Text(
                            text = "Assigned: ${report.assignedOrgName}",
                            fontSize = 11.sp,
                            fontWeight = FontWeight.SemiBold,
                            color = Color(0xFF0284C7)
                        )
                    }
                }
            }
        }
    }
}
