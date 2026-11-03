package com.example.ecotrack.ui.myreports

import androidx.compose.foundation.background
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
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.ecotrack.data.model.Report
import com.example.ecotrack.data.repository.EcoTrackRepository
import com.example.ecotrack.ui.feed.ReportCardItem
import kotlinx.coroutines.launch

@Composable
fun MyReportsScreen(
    onNavigateToReport: () -> Unit,
    onSelectReport: (Report) -> Unit = {}
) {
    val reports by EcoTrackRepository.reports.collectAsState()
    val userSession by EcoTrackRepository.userSession.collectAsState()
    val scope = rememberCoroutineScope()

    // Strictly filter reports submitted by THIS citizen only
    val myReports = reports.filter { EcoTrackRepository.isMyReport(it) }

    val verifiedCount = myReports.count { it.status == "verified" }
    val inProgressCount = myReports.count { it.status == "in_progress" || it.status == "assigned" }
    val ecoPoints = (myReports.size * 20) + (verifiedCount * 50)

    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .background(Color(0xFFF8FAFC)),
        contentPadding = PaddingValues(bottom = 80.dp)
    ) {
        // User Profile Summary Card
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
                                text = "Citizen Profile",
                                fontSize = 12.sp,
                                fontWeight = FontWeight.Bold,
                                color = Color(0xFF10B981)
                            )
                            Text(
                                text = "My Environmental Reports",
                                fontSize = 20.sp,
                                fontWeight = FontWeight.ExtraBold,
                                color = Color(0xFF0F172A)
                            )
                            Text(
                                text = "Tracking reports submitted by ${userSession.email}",
                                fontSize = 12.sp,
                                color = Color(0xFF64748B)
                            )
                        }

                        Button(
                            onClick = onNavigateToReport,
                            colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF10B981)),
                            shape = RoundedCornerShape(12.dp),
                            contentPadding = PaddingValues(horizontal = 12.dp, vertical = 6.dp)
                        ) {
                            Icon(Icons.Default.AddAPhoto, contentDescription = null, modifier = Modifier.size(16.dp))
                            Spacer(modifier = Modifier.width(4.dp))
                            Text("New Report", fontSize = 11.sp, fontWeight = FontWeight.Bold)
                        }
                    }

                    Spacer(modifier = Modifier.height(14.dp))

                    // 4 Metric Badges
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        MetricCard(modifier = Modifier.weight(1f), label = "Total Reports", value = "${myReports.size}", color = Color(0xFF0F172A))
                        MetricCard(modifier = Modifier.weight(1f), label = "Verified Clean", value = "$verifiedCount", color = Color(0xFF10B981))
                        MetricCard(modifier = Modifier.weight(1f), label = "In Progress", value = "$inProgressCount", color = Color(0xFFF59E0B))
                        MetricCard(modifier = Modifier.weight(1f), label = "Eco Points", value = "+$ecoPoints", color = Color(0xFF047857), bg = Color(0xFFECFDF5))
                    }
                }
            }
        }

        if (myReports.isEmpty()) {
            item {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(36.dp),
                    horizontalAlignment = Alignment.CenterHorizontally
                ) {
                    Icon(
                        Icons.Default.Eco,
                        contentDescription = null,
                        modifier = Modifier.size(54.dp),
                        tint = Color(0xFF10B981)
                    )
                    Spacer(modifier = Modifier.height(10.dp))
                    Text(
                        text = "You haven't reported any garbage yet",
                        fontWeight = FontWeight.Bold,
                        color = Color(0xFF0F172A),
                        fontSize = 15.sp
                    )
                    Text(
                        text = "Take a photo of illegal dumping or garbage in Pune to help local NGOs mobilize.",
                        fontSize = 12.sp,
                        color = Color(0xFF64748B),
                        textAlign = androidx.compose.ui.text.style.TextAlign.Center
                    )
                    Spacer(modifier = Modifier.height(16.dp))
                    Button(
                        onClick = onNavigateToReport,
                        colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF10B981)),
                        shape = RoundedCornerShape(12.dp)
                    ) {
                        Icon(Icons.Default.AddAPhoto, contentDescription = null, modifier = Modifier.size(16.dp))
                        Spacer(modifier = Modifier.width(6.dp))
                        Text("Report Your First Spot (+20 Pts)")
                    }
                }
            }
        } else {
            items(myReports, key = { it.id }) { report ->
                ReportCardItem(
                    report = report,
                    isNgo = false,
                    onClick = { onSelectReport(report) },
                    onUpvote = {
                        scope.launch { EcoTrackRepository.upvoteReport(report.id) }
                    }
                )
            }
        }
    }
}

@Composable
fun MetricCard(
    modifier: Modifier = Modifier,
    label: String,
    value: String,
    color: Color,
    bg: Color = Color(0xFFF8FAFC)
) {
    Card(
        modifier = modifier,
        shape = RoundedCornerShape(12.dp),
        colors = CardDefaults.cardColors(containerColor = bg),
        elevation = CardDefaults.cardElevation(defaultElevation = 0.dp)
    ) {
        Column(modifier = Modifier.padding(10.dp)) {
            Text(label, fontSize = 9.sp, fontWeight = FontWeight.Bold, color = Color(0xFF64748B))
            Text(value, fontSize = 15.sp, fontWeight = FontWeight.ExtraBold, color = color)
        }
    }
}
