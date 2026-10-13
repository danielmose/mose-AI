package com.danielmose.jarvis

import android.Manifest
import android.app.Activity
import android.app.admin.DevicePolicyManager
import android.content.ComponentName
import android.content.Intent
import android.content.pm.PackageManager
import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.core.app.ActivityCompat
import androidx.core.content.ContextCompat

// Every permission here is requested through Android's own system dialogs.
// This screen only launches those dialogs and reports current status —
// it never assumes or auto-grants anything.
@Composable
fun PermissionsScreen(activity: Activity) {
    val context = activity
    var micGranted by remember {
        mutableStateOf(
            ContextCompat.checkSelfPermission(context, Manifest.permission.RECORD_AUDIO) ==
                PackageManager.PERMISSION_GRANTED
        )
    }
    val dpm = context.getSystemService(DevicePolicyManager::class.java)
    val adminComponent = ComponentName(context, JarvisDeviceAdminReceiver::class.java)
    var adminActive by remember { mutableStateOf(dpm.isAdminActive(adminComponent)) }

    Column(
        modifier = Modifier.fillMaxSize().padding(20.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp),
    ) {
        Text("Permissions", style = MaterialTheme.typography.headlineSmall)
        Text(
            "Jarvis only does what these permissions allow, and only after you " +
                "grant them here. Nothing is enabled automatically.",
            style = MaterialTheme.typography.bodyMedium,
        )

        PermissionRow(
            title = "Microphone",
            description = "Needed for voice input.",
            granted = micGranted,
            onRequest = {
                ActivityCompat.requestPermissions(
                    activity, arrayOf(Manifest.permission.RECORD_AUDIO), 100
                )
                micGranted = ContextCompat.checkSelfPermission(
                    context, Manifest.permission.RECORD_AUDIO
                ) == PackageManager.PERMISSION_GRANTED
            },
        )

        PermissionRow(
            title = "Lock screen control",
            description = "Lets Jarvis lock your screen when you ask it to. " +
                "Android does not allow any app to unlock your phone — only lock it.",
            granted = adminActive,
            onRequest = {
                val intent = Intent(DevicePolicyManager.ACTION_ADD_DEVICE_ADMIN).apply {
                    putExtra(DevicePolicyManager.EXTRA_DEVICE_ADMIN, adminComponent)
                    putExtra(
                        DevicePolicyManager.EXTRA_ADD_EXPLANATION,
                        "Allows Jarvis to lock your screen when you ask it to.",
                    )
                }
                activity.startActivity(intent)
                // Re-check after returning from the system screen.
                adminActive = dpm.isAdminActive(adminComponent)
            },
        )
    }
}

@Composable
private fun PermissionRow(
    title: String,
    description: String,
    granted: Boolean,
    onRequest: () -> Unit,
) {
    Column {
        Text(title, style = MaterialTheme.typography.titleMedium)
        Text(description, style = MaterialTheme.typography.bodySmall)
        Spacer(Modifier.height(6.dp))
        if (granted) {
            Text("Granted", color = MaterialTheme.colorScheme.primary)
        } else {
            Button(onClick = onRequest) { Text("Grant") }
        }
    }
}
