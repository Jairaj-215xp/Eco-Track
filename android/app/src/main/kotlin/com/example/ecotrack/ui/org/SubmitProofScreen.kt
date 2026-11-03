package com.example.ecotrack.ui.org

import android.Manifest
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.net.Uri
import android.widget.Toast
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
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
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.core.content.FileProvider
import coil.compose.AsyncImage
import com.example.ecotrack.data.model.Report
import com.example.ecotrack.data.repository.EcoTrackRepository
import com.example.ecotrack.utils.DeviceLocationHelper
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import java.io.ByteArrayOutputStream
import java.io.File

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun SubmitProofScreen(
    report: Report,
    onProofSubmitted: () -> Unit,
    onBack: () -> Unit
) {
    val context = LocalContext.current
    val scope = rememberCoroutineScope()
    var isSubmitting by remember { mutableStateOf(false) }

    var photoFile by remember {
        val dir = File(context.cacheDir, "camera_photos").apply { mkdirs() }
        mutableStateOf(File(dir, "proof_${System.currentTimeMillis()}.jpg"))
    }

    var capturedProofUri by remember { mutableStateOf<Uri?>(null) }
    var galleryProofUri by remember { mutableStateOf<Uri?>(null) }
    var sampleProofUrl by remember { mutableStateOf<String?>("https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&q=80&w=800") }

    var cleanedKg by remember { mutableStateOf("25") }
    var notes by remember { mutableStateOf("Crew completed thorough cleanup and sanitized the spot.") }

    val cameraLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.TakePicture()
    ) { success ->
        if (success) {
            capturedProofUri = Uri.fromFile(photoFile)
            galleryProofUri = null
            sampleProofUrl = null
            Toast.makeText(context, "After-cleanup photo captured!", Toast.LENGTH_SHORT).show()
        }
    }

    val cameraPermissionLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.RequestPermission()
    ) { isGranted ->
        if (isGranted) {
            val dir = File(context.cacheDir, "camera_photos").apply { mkdirs() }
            val newFile = File(dir, "proof_${System.currentTimeMillis()}.jpg")
            photoFile = newFile
            val uri = FileProvider.getUriForFile(context, "${context.packageName}.fileprovider", newFile)
            cameraLauncher.launch(uri)
        } else {
            Toast.makeText(context, "Camera permission needed", Toast.LENGTH_SHORT).show()
        }
    }

    val galleryLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.GetContent()
    ) { uri ->
        if (uri != null) {
            galleryProofUri = uri
            capturedProofUri = null
            sampleProofUrl = null
            Toast.makeText(context, "Proof image selected from gallery", Toast.LENGTH_SHORT).show()
        }
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Submit Cleanup Proof", fontWeight = FontWeight.Bold, fontSize = 18.sp) },
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
            // Task info
            Card(
                shape = RoundedCornerShape(16.dp),
                colors = CardDefaults.cardColors(containerColor = Color.White),
                elevation = CardDefaults.cardElevation(defaultElevation = 1.dp),
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(modifier = Modifier.padding(14.dp)) {
                    Text("Original Waste Report", fontSize = 12.sp, fontWeight = FontWeight.Bold, color = Color(0xFF64748B))
                    Spacer(modifier = Modifier.height(4.dp))
                    Text(report.address, fontWeight = FontWeight.Bold, fontSize = 14.sp, color = Color(0xFF0F172A))
                    Spacer(modifier = Modifier.height(8.dp))

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        Box(
                            modifier = Modifier
                                .weight(1f)
                                .height(120.dp)
                                .clip(RoundedCornerShape(12.dp))
                                .background(Color(0xFFF1F5F9))
                        ) {
                            AsyncImage(
                                model = report.photoUrl,
                                contentDescription = "Before Photo",
                                modifier = Modifier.fillMaxSize(),
                                contentScale = ContentScale.Crop
                            )
                            Surface(
                                color = Color.Black.copy(alpha = 0.6f),
                                shape = RoundedCornerShape(6.dp),
                                modifier = Modifier.align(Alignment.BottomStart).padding(6.dp)
                            ) {
                                Text("BEFORE", color = Color.White, fontSize = 10.sp, fontWeight = FontWeight.Bold, modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp))
                            }
                        }

                        Box(
                            modifier = Modifier
                                .weight(1f)
                                .height(120.dp)
                                .clip(RoundedCornerShape(12.dp))
                                .border(1.dp, Color(0xFF10B981), RoundedCornerShape(12.dp))
                                .background(Color(0xFFECFDF5))
                        ) {
                            val activeProofModel = capturedProofUri ?: galleryProofUri ?: sampleProofUrl
                            if (activeProofModel != null) {
                                AsyncImage(
                                    model = activeProofModel,
                                    contentDescription = "After Photo",
                                    modifier = Modifier.fillMaxSize(),
                                    contentScale = ContentScale.Crop
                                )
                                Surface(
                                    color = Color(0xFF10B981),
                                    shape = RoundedCornerShape(6.dp),
                                    modifier = Modifier.align(Alignment.BottomStart).padding(6.dp)
                                ) {
                                    Text("AFTER CLEANUP", color = Color.White, fontSize = 10.sp, fontWeight = FontWeight.Bold, modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp))
                                }
                            } else {
                                Column(
                                    modifier = Modifier.fillMaxSize(),
                                    verticalArrangement = Arrangement.Center,
                                    horizontalAlignment = Alignment.CenterHorizontally
                                ) {
                                    Icon(Icons.Default.AddAPhoto, contentDescription = null, tint = Color(0xFF10B981))
                                    Text("Capture After Photo", fontSize = 10.sp, fontWeight = FontWeight.Bold, color = Color(0xFF047857))
                                }
                            }
                        }
                    }
                }
            }

            Spacer(modifier = Modifier.height(14.dp))

            // Action to take photo
            Card(
                shape = RoundedCornerShape(16.dp),
                colors = CardDefaults.cardColors(containerColor = Color.White),
                elevation = CardDefaults.cardElevation(defaultElevation = 1.dp),
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(modifier = Modifier.padding(14.dp)) {
                    Text("Capture After-Cleanup Photo", fontWeight = FontWeight.Bold, fontSize = 14.sp)
                    Spacer(modifier = Modifier.height(10.dp))

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        Button(
                            onClick = {
                                if (DeviceLocationHelper.hasCameraPermission(context)) {
                                    val dir = File(context.cacheDir, "camera_photos").apply { mkdirs() }
                                    val newFile = File(dir, "proof_${System.currentTimeMillis()}.jpg")
                                    photoFile = newFile
                                    val uri = FileProvider.getUriForFile(context, "${context.packageName}.fileprovider", newFile)
                                    cameraLauncher.launch(uri)
                                } else {
                                    cameraPermissionLauncher.launch(Manifest.permission.CAMERA)
                                }
                            },
                            modifier = Modifier.weight(1f),
                            shape = RoundedCornerShape(12.dp),
                            colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF0EA5E9))
                        ) {
                            Icon(Icons.Default.CameraAlt, contentDescription = null, modifier = Modifier.size(16.dp))
                            Spacer(modifier = Modifier.width(6.dp))
                            Text("Camera", fontSize = 12.sp, fontWeight = FontWeight.Bold)
                        }

                        OutlinedButton(
                            onClick = { galleryLauncher.launch("image/*") },
                            modifier = Modifier.weight(1f),
                            shape = RoundedCornerShape(12.dp)
                        ) {
                            Icon(Icons.Default.PhotoLibrary, contentDescription = null, modifier = Modifier.size(16.dp))
                            Spacer(modifier = Modifier.width(6.dp))
                            Text("Gallery", fontSize = 12.sp, fontWeight = FontWeight.Bold)
                        }
                    }
                }
            }

            Spacer(modifier = Modifier.height(14.dp))

            // Cleaned weight & crew notes
            Card(
                shape = RoundedCornerShape(16.dp),
                colors = CardDefaults.cardColors(containerColor = Color.White),
                elevation = CardDefaults.cardElevation(defaultElevation = 1.dp),
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(modifier = Modifier.padding(14.dp)) {
                    Text("Cleanup Metrics & Notes", fontWeight = FontWeight.Bold, fontSize = 14.sp)
                    Spacer(modifier = Modifier.height(10.dp))

                    OutlinedTextField(
                        value = cleanedKg,
                        onValueChange = { cleanedKg = it },
                        modifier = Modifier.fillMaxWidth(),
                        label = { Text("Estimated Waste Removed (kg)", fontSize = 11.sp) },
                        leadingIcon = { Icon(Icons.Default.Scale, contentDescription = null, tint = Color(0xFF0EA5E9)) },
                        shape = RoundedCornerShape(12.dp)
                    )

                    Spacer(modifier = Modifier.height(10.dp))

                    OutlinedTextField(
                        value = notes,
                        onValueChange = { notes = it },
                        modifier = Modifier.fillMaxWidth(),
                        label = { Text("Crew Remarks & Sanitization Notes", fontSize = 11.sp) },
                        shape = RoundedCornerShape(12.dp),
                        minLines = 2
                    )
                }
            }

            Spacer(modifier = Modifier.height(20.dp))

            // Submit Proof Button
            Button(
                onClick = {
                    isSubmitting = true
                    scope.launch {
                        val imageBytes: ByteArray? = withContext(Dispatchers.IO) {
                            try {
                                when {
                                    capturedProofUri != null -> {
                                        val input = context.contentResolver.openInputStream(capturedProofUri!!)
                                        val bmp = BitmapFactory.decodeStream(input)
                                        input?.close()
                                        if (bmp != null) {
                                            val stream = ByteArrayOutputStream()
                                            bmp.compress(Bitmap.CompressFormat.JPEG, 85, stream)
                                            stream.toByteArray()
                                        } else null
                                    }
                                    galleryProofUri != null -> {
                                        val input = context.contentResolver.openInputStream(galleryProofUri!!)
                                        val bmp = BitmapFactory.decodeStream(input)
                                        input?.close()
                                        if (bmp != null) {
                                            val stream = ByteArrayOutputStream()
                                            bmp.compress(Bitmap.CompressFormat.JPEG, 85, stream)
                                            stream.toByteArray()
                                        } else null
                                    }
                                    else -> null
                                }
                            } catch (e: Exception) {
                                null
                            }
                        }

                        EcoTrackRepository.submitCleanupProof(
                            reportId = report.id,
                            proofBytes = imageBytes,
                            proofUrl = sampleProofUrl
                        )
                        isSubmitting = false
                        Toast.makeText(context, "Proof Verified! Task Completed.", Toast.LENGTH_SHORT).show()
                        onProofSubmitted()
                    }
                },
                enabled = !isSubmitting,
                modifier = Modifier
                    .fillMaxWidth()
                    .height(52.dp),
                shape = RoundedCornerShape(16.dp),
                colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF0EA5E9))
            ) {
                if (isSubmitting) {
                    CircularProgressIndicator(color = Color.White, modifier = Modifier.size(20.dp))
                } else {
                    Icon(Icons.Default.CheckCircle, contentDescription = null, modifier = Modifier.size(18.dp))
                    Spacer(modifier = Modifier.width(8.dp))
                    Text("Verify & Complete Task", fontWeight = FontWeight.Bold, fontSize = 14.sp)
                }
            }
        }
    }
}
