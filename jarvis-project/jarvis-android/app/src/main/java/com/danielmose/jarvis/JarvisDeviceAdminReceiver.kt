package com.danielmose.jarvis

import android.app.admin.DeviceAdminReceiver

// Android requires a receiver class to exist for a device-admin app, even
// if it doesn't do anything on enable/disable itself. The actual lock
// action is triggered from DeviceActions.kt via DevicePolicyManager,
// only after the user has activated admin for this app in Settings.
class JarvisDeviceAdminReceiver : DeviceAdminReceiver()
