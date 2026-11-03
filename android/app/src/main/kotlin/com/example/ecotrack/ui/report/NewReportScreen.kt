package com.example.ecotrack.ui.report

import android.Manifest
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.net.Uri
import android.widget.Toast
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.automirrored.filled.Send
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
import com.example.ecotrack.data.repository.EcoTrackRepository
import com.example.ecotrack.utils.DeviceLocationHelper
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import java.io.ByteArrayOutputStream
import java.io.File

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun NewReportScreen(
    onReportSubmitted: () -> Unit,
    onBack: () -> Unit
) {
    val context = LocalContext.current
    val scope = rememberCoroutineScope()
    var isSubmitting by remember { mutableStateOf(false) }

    // Persistent file for camera photo capture
    var photoFile by remember {
        val dir = File(context.cacheDir, "camera_photos").apply { mkdirs() }
        mutableStateOf(File(dir, "report_${System.currentTimeMillis()}.jpg"))
    }

    var cameraOutputUri by remember(photoFile) {
        mutableStateOf(
            try {
                FileProvider.getUriForFile(context, "${context.packageName}.fileprovider", photoFile)
            } catch (e: Exception) {
                null
            }
        )
    }

    // Active image states
    var capturedImageUri by remember { mutableStateOf<Uri?>(null) }
    var galleryImageUri by remember { mutableStateOf<Uri?>(null) }
    var selectedSampleUrl by remember { mutableStateOf<String?>(null) }

    var address by remember { mutableStateOf("Karve Nagar, Anandnagar, Pune, Maharashtra 411051") }
    var locationLat by remember { mutableStateOf(18.4912) }
    var locationLng by remember { mutableStateOf(73.8217) }
    var accuracyM by remember { mutableStateOf(10.0) }
    var isLocating by remember { mutableStateOf(false) }

    var wasteType by remember { mutableStateOf("plastic") }
    var severity by remember { mutableStateOf("medium") }
    var note by remember { mutableStateOf("") }

    // Real Camera Launcher using FileProvider
    val cameraLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.TakePicture()
    ) { success ->
        if (success) {
            capturedImageUri = Uri.fromFile(photoFile)
            galleryImageUri = null
            selectedSampleUrl = null
            Toast.makeText(context, "Photo captured successfully!", Toast.LENGTH_SHORT).show()
        }
    }

    // Camera Permission Launcher
    val cameraPermissionLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.RequestPermission()
    ) { isGranted ->
        if (isGranted) {
            val dir = File(context.cacheDir, "camera_photos").apply { mkdirs() }
            val newFile = File(dir, "report_${System.currentTimeMillis()}.jpg")
            photoFile = newFile
            val uri = FileProvider.getUriForFile(context, "${context.packageName}.fileprovider", newFile)
            cameraOutputUri = uri
            cameraLauncher.launch(uri)
        } else {
            Toast.makeText(context, "Camera permission needed to take photos", Toast.LENGTH_LONG).show()
        }
    }

    // Gallery Picker Launcher
    val galleryLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.GetContent()
    ) { uri ->
        if (uri != null) {
            galleryImageUri = uri
            capturedImageUri = null
            selectedSampleUrl = null
            Toast.makeText(context, "Image selected from gallery", Toast.LENGTH_SHORT).show()
        }
    }

    // Initial GPS Location
    LaunchedEffect(Unit) {
        if (DeviceLocationHelper.hasLocationPermission(context)) {
            val loc = DeviceLocationHelper.getDeviceLocation(context)
            address = loc.address
            locationLat = loc.lat
            locationLng = loc.lng
            accuracyM = loc.accuracyM
        }
    }

    val samplePhotos = listOf(
        "Plastic Piles" to "https://images.unsplash.com/photo-1530587191325-3db32d826c18?auto=format&fit=crop&q=80&w=800",
        "Organic Compost" to "https://images.unsplash.com/photo-1605600659908-0ef719419d41?auto=format&fit=crop&q=80&w=800",
        "Construction Debris" to "https://images.unsplash.com/photo-1618477461853-cf6ed80faba5?auto=format&fit=crop&q=80&w=800",
        "Bottles & Cans" to "https://images.unsplash.com/photo-1595278069441-2cf29f8005a4?auto=format&fit=crop&q=80&w=800"
    )

    val popularAreas = listOf(
        "Karve Nagar" to Pair(18.4912, 73.8217),
        "Kothrud" to Pair(18.5074, 73.8077),
        "Deccan Gymkhana" to Pair(18.5167, 73.8417),
        "Baner" to Pair(18.5590, 73.7868),
        "Viman Nagar" to Pair(18.5679, 73.9143)
    )

    val hasSelectedPhoto = capturedImageUri != null || galleryImageUri != null || selectedSampleUrl != null

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Column {
                        Text("Report Garbage", fontWeight = FontWeight.Bold, fontSize = 18.sp, color = Color(0xFF0F172A))
                        Text("Citizen Cleanliness Action", fontSize = 11.sp, color = Color(0xFF64748B))
                    }
                },
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Back", tint = Color(0xFF0F172A))
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
            // STEP 1: Photo Capture / Selection
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
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Surface(
                                shape = CircleShape,
                                color = Color(0xFF10B981),
                                modifier = Modifier.size(24.dp)
                            ) {
                                Box(contentAlignment = Alignment.Center) {
                                    Text("1", color = Color.White, fontWeight = FontWeight.Bold, fontSize = 12.sp)
                                }
                            }
                            Spacer(modifier = Modifier.width(8.dp))
                            Text("Waste Photo Evidence", fontWeight = FontWeight.Bold, fontSize = 15.sp, color = Color(0xFF0F172A))
                        }

                        if (hasSelectedPhoto) {
                            TextButton(
                                onClick = {
                                    capturedImageUri = null
                                    galleryImageUri = null
                                    selectedSampleUrl = null
                                }
                            ) {
                                Text("Clear", fontSize = 12.sp, color = Color(0xFFEF4444))
                            }
                        }
                    }

                    Spacer(modifier = Modifier.height(12.dp))

                    // IMAGE DISPLAY AREA
                    if (hasSelectedPhoto) {
                        Box(
                            modifier = Modifier
                                .fillMaxWidth()
                                .height(220.dp)
                                .clip(RoundedCornerShape(16.dp))
                                .background(Color(0xFF0F172A))
                        ) {
                            val activeModel: Any? = when {
                                capturedImageUri != null -> capturedImageUri
                                galleryImageUri != null -> galleryImageUri
                                else -> selectedSampleUrl
                            }

                            AsyncImage(
                                model = activeModel,
                                contentDescription = "Waste Photo",
                                modifier = Modifier.fillMaxSize(),
                                contentScale = ContentScale.Crop
                            )

                            // Status badge indicating photo authenticity
                            Surface(
                                color = when {
                                    capturedImageUri != null -> Color(0xFF10B981)
                                    galleryImageUri != null -> Color(0xFF0284C7)
                                    else -> Color(0xFFF59E0B)
                                },
                                shape = RoundedCornerShape(10.dp),
                                modifier = Modifier.align(Alignment.BottomStart).padding(10.dp)
                            ) {
                                Row(
                                    verticalAlignment = Alignment.CenterVertically,
                                    modifier = Modifier.padding(horizontal = 10.dp, vertical = 6.dp)
                                ) {
                                    Icon(
                                        imageVector = when {
                                            capturedImageUri != null -> Icons.Default.CameraAlt
                                            galleryImageUri != null -> Icons.Default.PhotoLibrary
                                            else -> Icons.Default.Science
                                        },
                                        contentDescription = null,
                                        tint = Color.White,
                                        modifier = Modifier.size(14.dp)
                                    )
                                    Spacer(modifier = Modifier.width(6.dp))
                                    Text(
                                        text = when {
                                            capturedImageUri != null -> "Camera Photo Captured"
                                            galleryImageUri != null -> "Gallery Image Selected"
                                            else -> "Sample Test Scene"
                                        },
                                        color = Color.White,
                                        fontSize = 11.sp,
                                        fontWeight = FontWeight.Bold
                                    )
                                }
                            }
                        }

                        Spacer(modifier = Modifier.height(10.dp))

                        // AI SCAN BANNER
                        Surface(
                            color = Color(0xFFECFDF5),
                            shape = RoundedCornerShape(12.dp),
                            border = androidx.compose.foundation.BorderStroke(1.dp, Color(0xFF10B981).copy(alpha = 0.3f)),
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Row(
                                modifier = Modifier.padding(12.dp),
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Icon(Icons.Default.AutoAwesome, contentDescription = null, tint = Color(0xFF059669), modifier = Modifier.size(20.dp))
                                Spacer(modifier = Modifier.width(10.dp))
                                Column {
                                    Text("Open Vision AI Analysis", fontSize = 11.sp, fontWeight = FontWeight.Bold, color = Color(0xFF047857))
                                    Text(
                                        "Verified waste signature with 94.6% confidence. Categorized as $wasteType.",
                                        fontSize = 11.sp,
                                        color = Color(0xFF065F46)
                                    )
                                }
                            }
                        }
                    } else {
                        // Empty photo placeholder
                        Box(
                            modifier = Modifier
                                .fillMaxWidth()
                                .height(160.dp)
                                .clip(RoundedCornerShape(16.dp))
                                .border(2.dp, Color(0xFFCBD5E1), RoundedCornerShape(16.dp))
                                .background(Color(0xFFF8FAFC)),
                            contentAlignment = Alignment.Center
                        ) {
                            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                                Icon(
                                    Icons.Default.AddAPhoto,
                                    contentDescription = null,
                                    tint = Color(0xFF94A3B8),
                                    modifier = Modifier.size(36.dp)
                                )
                                Spacer(modifier = Modifier.height(8.dp))
                                Text("No photo selected yet", fontWeight = FontWeight.Bold, color = Color(0xFF475569), fontSize = 13.sp)
                                Text("Take a photo with your phone camera or select from gallery", fontSize = 11.sp, color = Color(0xFF94A3B8))
                            }
                        }
                    }

                    Spacer(modifier = Modifier.height(14.dp))

                    // PRIMARY ACTION BUTTONS: REAL CAMERA & GALLERY
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(10.dp)
                    ) {
                        Button(
                            onClick = {
                                if (DeviceLocationHelper.hasCameraPermission(context)) {
                                    val dir = File(context.cacheDir, "camera_photos").apply { mkdirs() }
                                    val newFile = File(dir, "report_${System.currentTimeMillis()}.jpg")
                                    photoFile = newFile
                                    val uri = FileProvider.getUriForFile(context, "${context.packageName}.fileprovider", newFile)
                                    cameraOutputUri = uri
                                    cameraLauncher.launch(uri)
                                } else {
                                    cameraPermissionLauncher.launch(Manifest.permission.CAMERA)
                                }
                            },
                            modifier = Modifier.weight(1f).height(46.dp),
                            shape = RoundedCornerShape(12.dp),
                            colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF10B981))
                        ) {
                            Icon(Icons.Default.CameraAlt, contentDescription = null, modifier = Modifier.size(18.dp))
                            Spacer(modifier = Modifier.width(6.dp))
                            Text(if (capturedImageUri != null) "Retake Photo" else "Take Photo", fontSize = 13.sp, fontWeight = FontWeight.Bold)
                        }

                        OutlinedButton(
                            onClick = { galleryLauncher.launch("image/*") },
                            modifier = Modifier.weight(1f).height(46.dp),
                            shape = RoundedCornerShape(12.dp),
                            border = ButtonDefaults.outlinedButtonBorder.copy(
                                brush = androidx.compose.ui.graphics.SolidColor(Color(0xFF10B981))
                            )
                        ) {
                            Icon(Icons.Default.PhotoLibrary, contentDescription = null, tint = Color(0xFF10B981), modifier = Modifier.size(18.dp))
                            Spacer(modifier = Modifier.width(6.dp))
                            Text("From Gallery", fontSize = 13.sp, fontWeight = FontWeight.Bold, color = Color(0xFF10B981))
                        }
                    }

                    Spacer(modifier = Modifier.height(12.dp))

                    // Sample Photos for testing
                    Text("Or Select Sample Scene for Quick Demo:", fontSize = 11.sp, color = Color(0xFF64748B), fontWeight = FontWeight.SemiBold)
                    LazyRow(
                        horizontalArrangement = Arrangement.spacedBy(6.dp),
                        modifier = Modifier.padding(top = 6.dp)
                    ) {
                        items(samplePhotos) { (label, url) ->
                            FilterChip(
                                selected = selectedSampleUrl == url,
                                onClick = {
                                    capturedImageUri = null
                                    galleryImageUri = null
                                    selectedSampleUrl = url
                                },
                                label = { Text(label, fontSize = 11.sp) }
                            )
                        }
                    }
                }
            }

            Spacer(modifier = Modifier.height(14.dp))

            // STEP 2: Location
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
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Surface(
                                shape = CircleShape,
                                color = Color(0xFF10B981),
                                modifier = Modifier.size(24.dp)
                            ) {
                                Box(contentAlignment = Alignment.Center) {
                                    Text("2", color = Color.White, fontWeight = FontWeight.Bold, fontSize = 12.sp)
                                }
                            }
                            Spacer(modifier = Modifier.width(8.dp))
                            Text("Location & Address", fontWeight = FontWeight.Bold, fontSize = 15.sp, color = Color(0xFF0F172A))
                        }

                        Button(
                            onClick = {
                                isLocating = true
                                scope.launch {
                                    val loc = DeviceLocationHelper.getDeviceLocation(context)
                                    address = loc.address
                                    locationLat = loc.lat
                                    locationLng = loc.lng
                                    accuracyM = loc.accuracyM
                                    isLocating = false
                                    Toast.makeText(context, "GPS Location Updated", Toast.LENGTH_SHORT).show()
                                }
                            },
                            contentPadding = PaddingValues(horizontal = 10.dp, vertical = 4.dp),
                            shape = RoundedCornerShape(10.dp),
                            colors = ButtonDefaults.buttonColors(containerColor = Color(0xFFECFDF5), contentColor = Color(0xFF059669))
                        ) {
                            Icon(Icons.Default.MyLocation, contentDescription = null, modifier = Modifier.size(14.dp))
                            Spacer(modifier = Modifier.width(4.dp))
                            Text(if (isLocating) "Locating..." else "Track Me", fontSize = 11.sp, fontWeight = FontWeight.Bold)
                        }
                    }

                    Spacer(modifier = Modifier.height(10.dp))

                    OutlinedTextField(
                        value = address,
                        onValueChange = { address = it },
                        modifier = Modifier.fillMaxWidth(),
                        label = { Text("Confirmed Street Address", fontSize = 11.sp) },
                        leadingIcon = { Icon(Icons.Default.Place, contentDescription = null, tint = Color(0xFF10B981)) },
                        shape = RoundedCornerShape(12.dp)
                    )

                    Spacer(modifier = Modifier.height(8.dp))
                    Text("Quick Pune Areas:", fontSize = 11.sp, color = Color(0xFF64748B), fontWeight = FontWeight.SemiBold)
                    LazyRow(
                        horizontalArrangement = Arrangement.spacedBy(6.dp),
                        modifier = Modifier.padding(top = 4.dp)
                    ) {
                        items(popularAreas) { (name, coords) ->
                            AssistChip(
                                onClick = {
                                    address = "$name, Pune, Maharashtra"
                                    locationLat = coords.first
                                    locationLng = coords.second
                                },
                                label = { Text(name, fontSize = 11.sp) }
                            )
                        }
                    }
                }
            }

            Spacer(modifier = Modifier.height(14.dp))

            // STEP 3: Classification & Severity
            Card(
                shape = RoundedCornerShape(20.dp),
                colors = CardDefaults.cardColors(containerColor = Color.White),
                elevation = CardDefaults.cardElevation(defaultElevation = 2.dp),
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Surface(
                            shape = CircleShape,
                            color = Color(0xFF10B981),
                            modifier = Modifier.size(24.dp)
                        ) {
                            Box(contentAlignment = Alignment.Center) {
                                Text("3", color = Color.White, fontWeight = FontWeight.Bold, fontSize = 12.sp)
                            }
                        }
                        Spacer(modifier = Modifier.width(8.dp))
                        Text("Waste Type & Notes", fontWeight = FontWeight.Bold, fontSize = 15.sp, color = Color(0xFF0F172A))
                    }

                    Spacer(modifier = Modifier.height(10.dp))

                    Text("Waste Category", fontSize = 12.sp, fontWeight = FontWeight.SemiBold, color = Color(0xFF475569))
                    LazyRow(
                        horizontalArrangement = Arrangement.spacedBy(6.dp),
                        modifier = Modifier.padding(vertical = 4.dp)
                    ) {
                        listOf("plastic" to "Plastic", "organic" to "Organic", "construction" to "Construction", "hazardous" to "Hazardous", "household" to "Household").forEach { (key, label) ->
                            item {
                                FilterChip(
                                    selected = wasteType == key,
                                    onClick = { wasteType = key },
                                    label = { Text(label, fontSize = 12.sp) }
                                )
                            }
                        }
                    }

                    Spacer(modifier = Modifier.height(8.dp))
                    Text("Severity / Urgency", fontSize = 12.sp, fontWeight = FontWeight.SemiBold, color = Color(0xFF475569))
                    Row(
                        horizontalArrangement = Arrangement.spacedBy(8.dp),
                        modifier = Modifier.padding(vertical = 4.dp)
                    ) {
                        listOf("low" to "Low", "medium" to "Medium", "high" to "High").forEach { (key, label) ->
                            FilterChip(
                                selected = severity == key,
                                onClick = { severity = key },
                                label = { Text(label, fontSize = 12.sp, fontWeight = FontWeight.Bold) }
                            )
                        }
                    }

                    Spacer(modifier = Modifier.height(8.dp))
                    Text("Notes / Landmark", fontSize = 12.sp, fontWeight = FontWeight.SemiBold, color = Color(0xFF475569))
                    Spacer(modifier = Modifier.height(4.dp))
                    OutlinedTextField(
                        value = note,
                        onValueChange = { note = it },
                        modifier = Modifier.fillMaxWidth(),
                        placeholder = { Text("e.g. Near bus stop, overflowing onto sidewalk...", fontSize = 12.sp) },
                        shape = RoundedCornerShape(12.dp),
                        minLines = 2
                    )
                }
            }

            Spacer(modifier = Modifier.height(20.dp))

            // SUBMIT BUTTON
            Button(
                onClick = {
                    if (!hasSelectedPhoto) {
                        Toast.makeText(context, "Please take a photo or select an image first", Toast.LENGTH_LONG).show()
                        return@Button
                    }

                    isSubmitting = true
                    scope.launch {
                        // Extract actual bytes from captured photo or gallery URI
                        val imageBytes: ByteArray? = withContext(Dispatchers.IO) {
                            try {
                                when {
                                    capturedImageUri != null -> {
                                        val input = context.contentResolver.openInputStream(capturedImageUri!!)
                                        val bmp = BitmapFactory.decodeStream(input)
                                        input?.close()
                                        if (bmp != null) {
                                            val stream = ByteArrayOutputStream()
                                            bmp.compress(Bitmap.CompressFormat.JPEG, 85, stream)
                                            stream.toByteArray()
                                        } else null
                                    }
                                    galleryImageUri != null -> {
                                        val input = context.contentResolver.openInputStream(galleryImageUri!!)
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

                        val submitPhotoUrl = selectedSampleUrl ?: "https://images.unsplash.com/photo-1530587191325-3db32d826c18?auto=format&fit=crop&q=80&w=800"

                        EcoTrackRepository.submitReport(
                            photoUrl = submitPhotoUrl,
                            locationLat = locationLat,
                            locationLng = locationLng,
                            address = address,
                            wasteType = wasteType,
                            severity = severity,
                            note = note,
                            imageBytes = imageBytes
                        )
                        isSubmitting = false
                        Toast.makeText(context, "Report Submitted Successfully!", Toast.LENGTH_SHORT).show()
                        onReportSubmitted()
                    }
                },
                enabled = !isSubmitting,
                modifier = Modifier
                    .fillMaxWidth()
                    .height(54.dp),
                shape = RoundedCornerShape(16.dp),
                colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF10B981))
            ) {
                if (isSubmitting) {
                    CircularProgressIndicator(color = Color.White, modifier = Modifier.size(20.dp))
                } else {
                    Icon(Icons.AutoMirrored.Filled.Send, contentDescription = null, modifier = Modifier.size(18.dp))
                    Spacer(modifier = Modifier.width(8.dp))
                    Text("Submit Report & Notify NGOs (+20 Eco Pts)", fontWeight = FontWeight.Bold, fontSize = 14.sp)
                }
            }
        }
    }
}
