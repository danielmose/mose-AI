package com.danielmose.jarvis

import okhttp3.Call
import okhttp3.Callback
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import org.json.JSONArray
import org.json.JSONObject
import java.io.IOException

// Talks to jarvis-core's /chat and /chat/action-result endpoints. Change
// BASE_URL to wherever you've deployed jarvis-core (a local dev server on
// your own machine's IP for testing, or a real deployment for everyday use).
object JarvisApi {
    const val BASE_URL = "http://10.0.2.2:3000" // 10.0.2.2 = host machine, for the emulator

    private val client = OkHttpClient()
    private val jsonMedia = "application/json; charset=utf-8".toMediaType()

    fun chat(sessionId: String, message: String, onResult: (JSONObject) -> Unit, onError: (String) -> Unit) {
        val body = JSONObject().apply {
            put("sessionId", sessionId)
            put("message", message)
            put("capabilities", JSONArray(listOf("device_control")))
        }
        post("$BASE_URL/chat", body, onResult, onError)
    }

    fun reportActionResult(
        sessionId: String,
        toolUseId: String,
        result: JSONObject,
        onResult: (JSONObject) -> Unit,
        onError: (String) -> Unit,
    ) {
        val body = JSONObject().apply {
            put("sessionId", sessionId)
            put("toolUseId", toolUseId)
            put("result", result)
            put("capabilities", JSONArray(listOf("device_control")))
        }
        post("$BASE_URL/chat/action-result", body, onResult, onError)
    }

    private fun post(url: String, body: JSONObject, onResult: (JSONObject) -> Unit, onError: (String) -> Unit) {
        val request = Request.Builder()
            .url(url)
            .post(body.toString().toRequestBody(jsonMedia))
            .build()

        client.newCall(request).enqueue(object : Callback {
            override fun onFailure(call: Call, e: IOException) {
                onError(e.message ?: "Network error")
            }

            override fun onResponse(call: Call, response: okhttp3.Response) {
                val text = response.body?.string() ?: "{}"
                try {
                    onResult(JSONObject(text))
                } catch (e: Exception) {
                    onError("Bad response from server")
                }
            }
        })
    }
}
