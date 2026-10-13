package com.danielmose.jarvis

import android.os.Bundle
import android.speech.RecognizerIntent
import android.speech.tts.TextToSpeech
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import org.json.JSONObject
import java.util.Locale
import java.util.UUID

data class ChatMessage(val role: String, val text: String)

class MainActivity : ComponentActivity() {

    private var tts: TextToSpeech? = null
    private val sessionId = UUID.randomUUID().toString()

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        tts = TextToSpeech(this) { status ->
            if (status == TextToSpeech.SUCCESS) tts?.language = Locale.getDefault()
        }

        setContent {
            var showPermissions by remember { mutableStateOf(false) }
            if (showPermissions) {
                PermissionsScreen(this)
            } else {
                ChatScreen(
                    activity = this,
                    sessionId = sessionId,
                    speak = { text -> tts?.speak(text, TextToSpeech.QUEUE_FLUSH, null, null) },
                    onOpenPermissions = { showPermissions = true },
                )
            }
        }
    }

    override fun onDestroy() {
        tts?.shutdown()
        super.onDestroy()
    }
}

@Composable
fun ChatScreen(
    activity: MainActivity,
    sessionId: String,
    speak: (String) -> Unit,
    onOpenPermissions: () -> Unit,
) {
    var messages by remember {
        mutableStateOf(listOf(ChatMessage("assistant", "I'm Jarvis. What can I help with?")))
    }
    var input by remember { mutableStateOf("") }
    var sending by remember { mutableStateOf(false) }

    val speechLauncher = rememberLauncherForActivityResult(
        ActivityResultContracts.StartActivityForResult()
    ) { result ->
        val text = result.data
            ?.getStringArrayListExtra(RecognizerIntent.EXTRA_RESULTS)
            ?.firstOrNull()
        if (!text.isNullOrBlank()) input = text
    }

    fun handleResult(json: JSONObject) {
        sending = false
        when {
            json.has("reply") -> {
                val reply = json.getString("reply")
                messages = messages + ChatMessage("assistant", reply)
                speak(reply)
            }
            json.has("pendingAction") -> {
                val action = json.getJSONObject("pendingAction")
                val name = action.getString("name")
                val input2 = action.getJSONObject("input")
                val toolUseId = action.getString("toolUseId")

                val result = DeviceActions.execute(activity, name, input2)

                sending = true
                JarvisApi.reportActionResult(
                    sessionId, toolUseId, result,
                    onResult = { activity.runOnUiThread { handleResult(it) } },
                    onError = { err ->
                        activity.runOnUiThread {
                            sending = false
                            messages = messages + ChatMessage("assistant", "Error: $err")
                        }
                    },
                )
            }
            json.has("error") -> {
                messages = messages + ChatMessage("assistant", "Error: ${json.getString("error")}")
            }
        }
    }

    fun send(text: String) {
        if (text.isBlank() || sending) return
        messages = messages + ChatMessage("user", text)
        input = ""
        sending = true
        JarvisApi.chat(
            sessionId, text,
            onResult = { activity.runOnUiThread { handleResult(it) } },
            onError = { err ->
                activity.runOnUiThread {
                    sending = false
                    messages = messages + ChatMessage("assistant", "Connection error: $err")
                }
            },
        )
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Jarvis") },
                actions = {
                    TextButton(onClick = onOpenPermissions) { Text("Permissions") }
                },
            )
        },
    ) { padding ->
        Column(modifier = Modifier.padding(padding).fillMaxSize()) {
            LazyColumn(
                modifier = Modifier.weight(1f).fillMaxWidth().padding(12.dp),
                verticalArrangement = Arrangement.spacedBy(8.dp),
            ) {
                items(messages) { msg ->
                    Text(
                        text = (if (msg.role == "user") "You: " else "Jarvis: ") + msg.text,
                        style = MaterialTheme.typography.bodyMedium,
                    )
                }
            }

            Row(
                modifier = Modifier.fillMaxWidth().padding(12.dp),
                horizontalArrangement = Arrangement.spacedBy(8.dp),
            ) {
                OutlinedButton(onClick = {
                    val intent = android.content.Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH).apply {
                        putExtra(
                            RecognizerIntent.EXTRA_LANGUAGE_MODEL,
                            RecognizerIntent.LANGUAGE_MODEL_FREE_FORM,
                        )
                    }
                    speechLauncher.launch(intent)
                }) { Text("Mic") }

                OutlinedTextField(
                    value = input,
                    onValueChange = { input = it },
                    modifier = Modifier.weight(1f),
                    enabled = !sending,
                    placeholder = { Text("Ask Jarvis...") },
                )

                Button(onClick = { send(input) }, enabled = !sending && input.isNotBlank()) {
                    Text("Send")
                }
            }
        }
    }
}
