package com.example.ecotrack.ui

import android.Manifest
import android.content.pm.PackageManager
import androidx.activity.compose.BackHandler
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.Image
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
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
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.core.content.ContextCompat
import com.example.ecotrack.R
import com.example.ecotrack.data.model.Report
import com.example.ecotrack.data.repository.EcoTrackRepository
import com.example.ecotrack.ui.admin.AdminDashboardScreen
import com.example.ecotrack.ui.auth.ProfileAuthScreen
import com.example.ecotrack.ui.feed.FeedScreen
import com.example.ecotrack.ui.myreports.MyReportsScreen
import com.example.ecotrack.ui.org.NgoWorkspaceScreen
import com.example.ecotrack.ui.org.SubmitProofScreen
import com.example.ecotrack.ui.report.NewReportScreen
import com.example.ecotrack.ui.report.ReportDetailScreen
import com.example.ecotrack.utils.DeviceLocationHelper
import kotlinx.coroutines.launch

enum class AppDestination {
    FEED,
    REPORT,
    MY_REPORTS,
    NGO_WORKSPACE,
    ADMIN_HUB,
    PROFILE
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun EcoTrackApp() {
    val context = LocalContext.current
    val scope = rememberCoroutineScope()
    val userSession by EcoTrackRepository.userSession.collectAsState()

    var currentDestination by remember { mutableStateOf(AppDestination.FEED) }
    var inspectingReport by remember { mutableStateOf<Report?>(null) }
    var submittingProofReport by remember { mutableStateOf<Report?>(null) }

    // 1. Startup Permission Request for Camera & Location
    val permissionLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.RequestMultiplePermissions()
    ) { permissions ->
        val locationGranted = permissions[Manifest.permission.ACCESS_FINE_LOCATION] == true ||
                permissions[Manifest.permission.ACCESS_COARSE_LOCATION] == true
        if (locationGranted) {
            scope.launch {
                DeviceLocationHelper.getDeviceLocation(context)
                EcoTrackRepository.refreshReports()
            }
        }
    }

    LaunchedEffect(Unit) {
        val hasCamera = ContextCompat.checkSelfPermission(context, Manifest.permission.CAMERA) == PackageManager.PERMISSION_GRANTED
        val hasFine = ContextCompat.checkSelfPermission(context, Manifest.permission.ACCESS_FINE_LOCATION) == PackageManager.PERMISSION_GRANTED
        val hasCoarse = ContextCompat.checkSelfPermission(context, Manifest.permission.ACCESS_COARSE_LOCATION) == PackageManager.PERMISSION_GRANTED

        if (!hasCamera || !hasFine || !hasCoarse) {
            permissionLauncher.launch(
                arrayOf(
                    Manifest.permission.CAMERA,
                    Manifest.permission.ACCESS_FINE_LOCATION,
                    Manifest.permission.ACCESS_COARSE_LOCATION
                )
            )
        }
    }

    // Handle Android system back button when inspecting or submitting proof
    if (submittingProofReport != null) {
        BackHandler { submittingProofReport = null }
        SubmitProofScreen(
            report = submittingProofReport!!,
            onProofSubmitted = {
                submittingProofReport = null
                inspectingReport = null
                scope.launch { EcoTrackRepository.refreshReports() }
            },
            onBack = { submittingProofReport = null }
        )
        return
    }

    if (inspectingReport != null) {
        BackHandler { inspectingReport = null }
        ReportDetailScreen(
            report = inspectingReport!!,
            onBack = { inspectingReport = null },
            onSubmitProof = { report ->
                submittingProofReport = report
            }
        )
        return
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        modifier = Modifier.clickable { currentDestination = AppDestination.FEED }
                    ) {
                        Image(
                            painter = painterResource(id = R.drawable.app_logo),
                            contentDescription = "Eco-Track Logo",
                            modifier = Modifier
                                .size(34.dp)
                                .clip(CircleShape),
                            contentScale = ContentScale.Crop
                        )
                        Spacer(modifier = Modifier.width(10.dp))
                        Column {
                            Text(
                                text = "Eco-Track",
                                fontWeight = FontWeight.ExtraBold,
                                fontSize = 18.sp,
                                color = Color(0xFF0F172A)
                            )
                            Text(
                                text = when (userSession.role) {
                                    "org" -> "NGO Field Operations"
                                    "admin" -> "Municipal Command Hub"
                                    else -> "Citizen Cleanliness Action"
                                },
                                fontSize = 10.sp,
                                fontWeight = FontWeight.Medium,
                                color = Color(0xFF64748B)
                            )
                        }
                    }
                },
                actions = {
                    // One-tap Role Switcher Pill
                    Surface(
                        color = when (userSession.role) {
                            "org" -> Color(0xFFE0F2FE)
                            "admin" -> Color(0xFFFEF3C7)
                            else -> Color(0xFFECFDF5)
                        },
                        shape = RoundedCornerShape(20.dp),
                        modifier = Modifier
                            .clickable {
                                // Cycle through roles: Citizen -> NGO -> Admin -> Citizen
                                val next = when (userSession.role) {
                                    "citizen" -> "org"
                                    "org" -> "admin"
                                    else -> "citizen"
                                }
                                EcoTrackRepository.switchRole(next)
                                currentDestination = AppDestination.FEED
                            }
                    ) {
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            modifier = Modifier.padding(horizontal = 10.dp, vertical = 6.dp)
                        ) {
                            Icon(
                                imageVector = when (userSession.role) {
                                    "org" -> Icons.Default.Business
                                    "admin" -> Icons.Default.AdminPanelSettings
                                    else -> Icons.Default.Person
                                },
                                contentDescription = null,
                                tint = when (userSession.role) {
                                    "org" -> Color(0xFF0369A1)
                                    "admin" -> Color(0xFF92400E)
                                    else -> Color(0xFF047857)
                                },
                                modifier = Modifier.size(14.dp)
                            )
                            Spacer(modifier = Modifier.width(4.dp))
                            Text(
                                text = when (userSession.role) {
                                    "org" -> "NGO"
                                    "admin" -> "Admin"
                                    else -> "Citizen"
                                },
                                fontSize = 11.sp,
                                fontWeight = FontWeight.Bold,
                                color = when (userSession.role) {
                                    "org" -> Color(0xFF0369A1)
                                    "admin" -> Color(0xFF92400E)
                                    else -> Color(0xFF047857)
                                }
                            )
                        }
                    }
                    Spacer(modifier = Modifier.width(12.dp))
                },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = Color.White)
            )
        },
        bottomBar = {
            NavigationBar(
                containerColor = Color.White,
                tonalElevation = 6.dp
            ) {
                // 1. Common Feed Tab
                NavigationBarItem(
                    selected = currentDestination == AppDestination.FEED,
                    onClick = { currentDestination = AppDestination.FEED },
                    icon = { Icon(Icons.Default.Public, contentDescription = "Feed") },
                    label = { Text("Feed", fontSize = 11.sp, fontWeight = FontWeight.Bold) },
                    colors = NavigationBarItemDefaults.colors(
                        selectedIconColor = Color(0xFF10B981),
                        selectedTextColor = Color(0xFF10B981),
                        indicatorColor = Color(0xFFECFDF5)
                    )
                )

                // 2. Role-Gated Tabs
                if (userSession.role == "citizen") {
                    // CITIZEN: Report Waste & My Reports
                    NavigationBarItem(
                        selected = currentDestination == AppDestination.REPORT,
                        onClick = { currentDestination = AppDestination.REPORT },
                        icon = { Icon(Icons.Default.AddAPhoto, contentDescription = "Report") },
                        label = { Text("Report", fontSize = 11.sp, fontWeight = FontWeight.Bold) },
                        colors = NavigationBarItemDefaults.colors(
                            selectedIconColor = Color(0xFF10B981),
                            selectedTextColor = Color(0xFF10B981),
                            indicatorColor = Color(0xFFECFDF5)
                        )
                    )

                    NavigationBarItem(
                        selected = currentDestination == AppDestination.MY_REPORTS,
                        onClick = { currentDestination = AppDestination.MY_REPORTS },
                        icon = { Icon(Icons.Default.Person, contentDescription = "My Reports") },
                        label = { Text("My Reports", fontSize = 11.sp, fontWeight = FontWeight.Bold) },
                        colors = NavigationBarItemDefaults.colors(
                            selectedIconColor = Color(0xFF10B981),
                            selectedTextColor = Color(0xFF10B981),
                            indicatorColor = Color(0xFFECFDF5)
                        )
                    )
                } else if (userSession.role == "org") {
                    // NGO: Dedicated NGO Field Workspace (Active tasks, Claim queue, Completed)
                    NavigationBarItem(
                        selected = currentDestination == AppDestination.NGO_WORKSPACE,
                        onClick = { currentDestination = AppDestination.NGO_WORKSPACE },
                        icon = { Icon(Icons.Default.Business, contentDescription = "NGO Hub") },
                        label = { Text("NGO Hub", fontSize = 11.sp, fontWeight = FontWeight.Bold) },
                        colors = NavigationBarItemDefaults.colors(
                            selectedIconColor = Color(0xFF0284C7),
                            selectedTextColor = Color(0xFF0284C7),
                            indicatorColor = Color(0xFFE0F2FE)
                        )
                    )
                } else if (userSession.role == "admin") {
                    // ADMIN: Command Hub & NGO Oversight
                    NavigationBarItem(
                        selected = currentDestination == AppDestination.ADMIN_HUB,
                        onClick = { currentDestination = AppDestination.ADMIN_HUB },
                        icon = { Icon(Icons.Default.AdminPanelSettings, contentDescription = "Admin") },
                        label = { Text("Command", fontSize = 11.sp, fontWeight = FontWeight.Bold) },
                        colors = NavigationBarItemDefaults.colors(
                            selectedIconColor = Color(0xFFD97706),
                            selectedTextColor = Color(0xFFD97706),
                            indicatorColor = Color(0xFFFEF3C7)
                        )
                    )

                    NavigationBarItem(
                        selected = currentDestination == AppDestination.NGO_WORKSPACE,
                        onClick = { currentDestination = AppDestination.NGO_WORKSPACE },
                        icon = { Icon(Icons.Default.Business, contentDescription = "NGO Hub") },
                        label = { Text("NGO Hub", fontSize = 11.sp, fontWeight = FontWeight.Bold) },
                        colors = NavigationBarItemDefaults.colors(
                            selectedIconColor = Color(0xFF0284C7),
                            selectedTextColor = Color(0xFF0284C7),
                            indicatorColor = Color(0xFFE0F2FE)
                        )
                    )
                }

                // 3. Profile & Switch Account Tab
                NavigationBarItem(
                    selected = currentDestination == AppDestination.PROFILE,
                    onClick = { currentDestination = AppDestination.PROFILE },
                    icon = { Icon(Icons.Default.AccountCircle, contentDescription = "Profile") },
                    label = { Text("Profile", fontSize = 11.sp, fontWeight = FontWeight.Bold) },
                    colors = NavigationBarItemDefaults.colors(
                        selectedIconColor = Color(0xFF10B981),
                        selectedTextColor = Color(0xFF10B981),
                        indicatorColor = Color(0xFFECFDF5)
                    )
                )
            }
        }
    ) { innerPadding ->
        Box(modifier = Modifier.padding(innerPadding)) {
            when (currentDestination) {
                AppDestination.FEED -> FeedScreen(
                    onNavigateToReport = { currentDestination = AppDestination.REPORT },
                    onSelectReport = { report -> inspectingReport = report }
                )
                AppDestination.REPORT -> NewReportScreen(
                    onReportSubmitted = { currentDestination = AppDestination.MY_REPORTS },
                    onBack = { currentDestination = AppDestination.FEED }
                )
                AppDestination.MY_REPORTS -> MyReportsScreen(
                    onNavigateToReport = { currentDestination = AppDestination.REPORT },
                    onSelectReport = { report -> inspectingReport = report }
                )
                AppDestination.NGO_WORKSPACE -> NgoWorkspaceScreen(
                    onSelectReport = { report -> inspectingReport = report },
                    onSubmitProof = { report -> submittingProofReport = report }
                )
                AppDestination.ADMIN_HUB -> AdminDashboardScreen(
                    onSelectReport = { report -> inspectingReport = report }
                )
                AppDestination.PROFILE -> ProfileAuthScreen()
            }
        }
    }
}
