package com.example.ecotrack.ui.auth

import android.widget.Toast
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.ecotrack.data.repository.EcoTrackRepository

@Composable
fun ProfileAuthScreen() {
    val userSession by EcoTrackRepository.userSession.collectAsState()
    val reports by EcoTrackRepository.reports.collectAsState()
    val context = LocalContext.current

    var isEditing by remember { mutableStateOf(false) }
    var editName by remember { mutableStateOf(userSession.name) }
    var editEmail by remember { mutableStateOf(userSession.email) }
    var editOrgName by remember { mutableStateOf(userSession.orgName) }
    var editServiceArea by remember { mutableStateOf(userSession.serviceArea) }

    val myReportsCount = reports.count { EcoTrackRepository.isMyReport(it) }
    val myVerifiedCount = reports.count { EcoTrackRepository.isMyReport(it) && it.status == "verified" }
    val ecoPoints = (myReportsCount * 20) + (myVerifiedCount * 50)

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(Color(0xFFF8FAFC))
            .verticalScroll(rememberScrollState())
            .padding(16.dp)
            .padding(bottom = 80.dp)
    ) {
        // Current Profile Card
        Card(
            shape = RoundedCornerShape(20.dp),
            colors = CardDefaults.cardColors(containerColor = Color.White),
            elevation = CardDefaults.cardElevation(defaultElevation = 2.dp),
            modifier = Modifier.fillMaxWidth()
        ) {
            Column(modifier = Modifier.padding(18.dp)) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Surface(
                        shape = CircleShape,
                        color = when (userSession.role) {
                            "org" -> Color(0xFF0284C7)
                            "admin" -> Color(0xFFD97706)
                            else -> Color(0xFF10B981)
                        },
                        modifier = Modifier.size(54.dp)
                    ) {
                        Box(contentAlignment = Alignment.Center) {
                            Icon(
                                imageVector = when (userSession.role) {
                                    "org" -> Icons.Default.Business
                                    "admin" -> Icons.Default.AdminPanelSettings
                                    else -> Icons.Default.Person
                                },
                                contentDescription = null,
                                tint = Color.White,
                                modifier = Modifier.size(28.dp)
                            )
                        }
                    }

                    Spacer(modifier = Modifier.width(14.dp))

                    Column(modifier = Modifier.weight(1f)) {
                        Text(
                            text = userSession.name,
                            fontWeight = FontWeight.ExtraBold,
                            fontSize = 18.sp,
                            color = Color(0xFF0F172A)
                        )
                        Text(
                            text = userSession.email,
                            fontSize = 12.sp,
                            color = Color(0xFF64748B)
                        )

                        Spacer(modifier = Modifier.height(4.dp))
                        Surface(
                            color = when (userSession.role) {
                                "org" -> Color(0xFFE0F2FE)
                                "admin" -> Color(0xFFFEF3C7)
                                else -> Color(0xFFECFDF5)
                            },
                            shape = RoundedCornerShape(8.dp)
                        ) {
                            Text(
                                text = when (userSession.role) {
                                    "org" -> "NGO / MUNICIPAL CREW"
                                    "admin" -> "CITY MUNICIPAL ADMIN"
                                    else -> "CITIZEN EXPLORER"
                                },
                                fontSize = 10.sp,
                                fontWeight = FontWeight.Bold,
                                color = when (userSession.role) {
                                    "org" -> Color(0xFF0369A1)
                                    "admin" -> Color(0xFF92400E)
                                    else -> Color(0xFF047857)
                                },
                                modifier = Modifier.padding(horizontal = 8.dp, vertical = 2.dp)
                            )
                        }
                    }
                }

                if (userSession.role == "citizen") {
                    Spacer(modifier = Modifier.height(16.dp))
                    HorizontalDivider(color = Color(0xFFF1F5F9))
                    Spacer(modifier = Modifier.height(14.dp))

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Column {
                            Text("Eco Citizen Points", fontSize = 11.sp, fontWeight = FontWeight.Bold, color = Color(0xFF64748B))
                            Text("Level 2 Eco Guardian", fontSize = 13.sp, fontWeight = FontWeight.Bold, color = Color(0xFF0F172A))
                        }
                        Surface(
                            color = Color(0xFFECFDF5),
                            shape = RoundedCornerShape(12.dp)
                        ) {
                            Text(
                                text = "+$ecoPoints pts",
                                fontSize = 15.sp,
                                fontWeight = FontWeight.ExtraBold,
                                color = Color(0xFF047857),
                                modifier = Modifier.padding(horizontal = 12.dp, vertical = 6.dp)
                            )
                        }
                    }
                } else if (userSession.role == "org") {
                    Spacer(modifier = Modifier.height(16.dp))
                    HorizontalDivider(color = Color(0xFFF1F5F9))
                    Spacer(modifier = Modifier.height(14.dp))

                    Column {
                        Text("Service Jurisdiction", fontSize = 11.sp, fontWeight = FontWeight.Bold, color = Color(0xFF64748B))
                        Text(userSession.serviceArea, fontSize = 13.sp, fontWeight = FontWeight.Bold, color = Color(0xFF0369A1))
                        Spacer(modifier = Modifier.height(6.dp))
                        Text("Crew Capacity: ${userSession.crewSize}", fontSize = 12.sp, color = Color(0xFF475569))
                        Text("Helpline: ${userSession.phone}", fontSize = 12.sp, color = Color(0xFF475569))
                    }
                }
            }
        }

        Spacer(modifier = Modifier.height(20.dp))

        // Role Switcher & Presets
        Text(
            text = "Switch Account Role & Dashboard",
            fontWeight = FontWeight.Bold,
            fontSize = 15.sp,
            color = Color(0xFF0F172A)
        )
        Text(
            text = "Select a role to open its dedicated workflow and tools",
            fontSize = 12.sp,
            color = Color(0xFF64748B)
        )

        Spacer(modifier = Modifier.height(12.dp))

        // Preset 1: Citizen
        RoleAccountCard(
            title = "Citizen Explorer",
            subtitle = "Report garbage, track cleanups, earn Eco Points",
            role = "citizen",
            isSelected = userSession.role == "citizen",
            icon = Icons.Default.Person,
            color = Color(0xFF10B981),
            onClick = {
                EcoTrackRepository.switchRole("citizen")
                Toast.makeText(context, "Switched to Citizen Mode", Toast.LENGTH_SHORT).show()
            }
        )

        Spacer(modifier = Modifier.height(8.dp))

        // Preset 2: NGO
        RoleAccountCard(
            title = "Green Earth Foundation (NGO)",
            subtitle = "Claim reports, dispatch crews, submit cleanup proof",
            role = "org",
            isSelected = userSession.role == "org",
            icon = Icons.Default.Business,
            color = Color(0xFF0284C7),
            onClick = {
                EcoTrackRepository.switchRole("org")
                Toast.makeText(context, "Switched to NGO Mode", Toast.LENGTH_SHORT).show()
            }
        )

        Spacer(modifier = Modifier.height(8.dp))

        // Preset 3: Admin
        RoleAccountCard(
            title = "City Municipal Admin",
            subtitle = "Verify cleanup proofs, approve reports, track citywide metrics",
            role = "admin",
            isSelected = userSession.role == "admin",
            icon = Icons.Default.AdminPanelSettings,
            color = Color(0xFFD97706),
            onClick = {
                EcoTrackRepository.switchRole("admin")
                Toast.makeText(context, "Switched to Admin Mode", Toast.LENGTH_SHORT).show()
            }
        )

        Spacer(modifier = Modifier.height(24.dp))

        // Edit Profile Form
        Card(
            shape = RoundedCornerShape(20.dp),
            colors = CardDefaults.cardColors(containerColor = Color.White),
            elevation = CardDefaults.cardElevation(defaultElevation = 1.dp),
            modifier = Modifier.fillMaxWidth()
        ) {
            Column(modifier = Modifier.padding(16.dp)) {
                Text(
                    text = "Custom Account Credentials",
                    fontWeight = FontWeight.Bold,
                    fontSize = 14.sp,
                    color = Color(0xFF0F172A)
                )
                Spacer(modifier = Modifier.height(10.dp))

                OutlinedTextField(
                    value = editName,
                    onValueChange = { editName = it },
                    label = { Text("Display Name / Organization Name", fontSize = 11.sp) },
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(12.dp)
                )

                Spacer(modifier = Modifier.height(8.dp))

                OutlinedTextField(
                    value = editEmail,
                    onValueChange = { editEmail = it },
                    label = { Text("Email Address", fontSize = 11.sp) },
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(12.dp)
                )

                if (userSession.role == "org") {
                    Spacer(modifier = Modifier.height(8.dp))
                    OutlinedTextField(
                        value = editServiceArea,
                        onValueChange = { editServiceArea = it },
                        label = { Text("Service Jurisdiction Area", fontSize = 11.sp) },
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(12.dp)
                    )
                }

                Spacer(modifier = Modifier.height(12.dp))

                Button(
                    onClick = {
                        EcoTrackRepository.updateProfile(
                            name = editName,
                            email = editEmail,
                            role = userSession.role,
                            orgName = if (userSession.role == "org") editName else userSession.orgName,
                            serviceArea = editServiceArea
                        )
                        Toast.makeText(context, "Profile updated!", Toast.LENGTH_SHORT).show()
                    },
                    modifier = Modifier.fillMaxWidth().height(46.dp),
                    shape = RoundedCornerShape(12.dp),
                    colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF10B981))
                ) {
                    Text("Save Account Changes", fontWeight = FontWeight.Bold, fontSize = 13.sp)
                }
            }
        }
    }
}

@Composable
fun RoleAccountCard(
    title: String,
    subtitle: String,
    role: String,
    isSelected: Boolean,
    icon: androidx.compose.ui.graphics.vector.ImageVector,
    color: Color,
    onClick: () -> Unit
) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .clickable { onClick() },
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(
            containerColor = if (isSelected) color.copy(alpha = 0.08f) else Color.White
        ),
        border = if (isSelected) androidx.compose.foundation.BorderStroke(2.dp, color) else androidx.compose.foundation.BorderStroke(1.dp, Color(0xFFE2E8F0))
    ) {
        Row(
            modifier = Modifier.padding(14.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Surface(
                shape = CircleShape,
                color = if (isSelected) color else Color(0xFFF1F5F9),
                modifier = Modifier.size(42.dp)
            ) {
                Box(contentAlignment = Alignment.Center) {
                    Icon(
                        imageVector = icon,
                        contentDescription = null,
                        tint = if (isSelected) Color.White else Color(0xFF64748B),
                        modifier = Modifier.size(20.dp)
                    )
                }
            }

            Spacer(modifier = Modifier.width(12.dp))

            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = title,
                    fontWeight = FontWeight.Bold,
                    fontSize = 14.sp,
                    color = Color(0xFF0F172A)
                )
                Text(
                    text = subtitle,
                    fontSize = 11.sp,
                    color = Color(0xFF64748B)
                )
            }

            if (isSelected) {
                Icon(
                    imageVector = Icons.Default.CheckCircle,
                    contentDescription = "Active",
                    tint = color,
                    modifier = Modifier.size(22.dp)
                )
            }
        }
    }
}
