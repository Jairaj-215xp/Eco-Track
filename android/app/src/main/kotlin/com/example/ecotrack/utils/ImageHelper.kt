package com.example.ecotrack.utils

import android.content.Context
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.net.Uri
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import java.io.ByteArrayOutputStream
import java.io.InputStream
import kotlin.math.max

object ImageHelper {

    fun compressBitmapToJpeg(bitmap: Bitmap, quality: Int = 85, maxDimension: Int = 1024): ByteArray {
        val width = bitmap.width
        val height = bitmap.height

        val scaledBitmap = if (width > maxDimension || height > maxDimension) {
            val ratio = max(width, height).toFloat() / maxDimension
            val newWidth = (width / ratio).toInt()
            val newHeight = (height / ratio).toInt()
            Bitmap.createScaledBitmap(bitmap, newWidth, newHeight, true)
        } else {
            bitmap
        }

        val out = ByteArrayOutputStream()
        scaledBitmap.compress(Bitmap.CompressFormat.JPEG, quality, out)
        return out.toByteArray()
    }

    suspend fun uriToJpegBytes(context: Context, uri: Uri): ByteArray? = withContext(Dispatchers.IO) {
        try {
            val input: InputStream? = context.contentResolver.openInputStream(uri)
            val bitmap = BitmapFactory.decodeStream(input)
            input?.close()
            if (bitmap != null) {
                compressBitmapToJpeg(bitmap)
            } else {
                null
            }
        } catch (e: Exception) {
            e.printStackTrace()
            null
        }
    }
}
