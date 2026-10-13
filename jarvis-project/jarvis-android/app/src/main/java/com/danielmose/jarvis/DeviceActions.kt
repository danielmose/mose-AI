package com.danielmose.jarvis

import android.app.admin.DevicePolicyManager
import android.content.ComponentName
import android.content.Context
import org.json.JSONObject

// Executes the device actions Claude asks for, using only permissions the
// phone's owner has explicitly granted through Android's own settings
// screens (see PermissionsScreen.kt). Nothing here runs without that.
object DeviceActions {

    fun execute(context: Context, actionName: String, input: JSONObject): JSONObject {
        return when (actionName) {
            "open_app" -> openApp(context, input.optString("package_name"))
            "lock_device" -> lockDevice(context)
            else -> JSONObject().put("error", "Unknown action: $actionName")
        }
    }

    private fun openApp(context: Context, packageName: String): JSONObject {
        val launchIntent = context.packageManager.getLaunchIntentForPackage(packageName)
        return if (launchIntent != null) {
            context.startActivity(launchIntent)
            JSONObject().put("success", true).put("opened", packageName)
        } else {
            JSONObject().put("error", "App not installed: $packageName")
        }
    }

    private fun lockDevice(context: Context): JSONObject {
        val dpm = context.getSystemService(Context.DEVICE_POLICY_SERVICE) as DevicePolicyManager
        val admin = ComponentName(context, JarvisDeviceAdminReceiver::class.java)

        if (!dpm.isAdminActive(admin)) {
            return JSONObject().put(
                "error",
                "Device admin isn't active. Grant it in Jarvis > Permissions first."
            )
        }

        dpm.lockNow()
        return JSONObject().put("success", true)
    }
}
