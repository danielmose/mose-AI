import { useState, useRef, useEffect } from "react";
import "./App.css";

const API_URL = import.meta.env.VITE_JARVIS_API_URL || "http://localhost:3000";

// A session id groups a conversation's memory on the server. Persist it in
// localStorage so a reload doesn't start a brand new conversation.
function getSessionId() {
  let id = localStorage.getItem("jarvis-session-id");
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem("jarvis-session-id", id);
  }
  return id;
}

export default function App() {
  const [messages, setMessages] = useState([
    { role: "assistant", content: "I'm Jarvis. What can I help with?" },
  ]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [listening, setListening] = useState(false);
  const sessionId = useRef(getSessionId());
  const scrollRef = useRef(null);
  const recognitionRef = useRef(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Web Speech API voice input. Supported in Chrome/Edge; falls back
  // gracefully (mic button hidden) elsewhere.
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setInput(transcript);
      setListening(false);
    };
    recognition.onerror = () => setListening(false);
    recognition.onend = () => setListening(false);
    recognitionRef.current = recognition;
  }, []);

  function speak(text) {
    if (!window.speechSynthesis) return;
    const utterance = new SpeechSynthesisUtterance(text);
    window.speechSynthesis.speak(utterance);
  }

  function toggleListening() {
    if (!recognitionRef.current) return;
    if (listening) {
      recognitionRef.current.stop();
      setListening(false);
    } else {
      recognitionRef.current.start();
      setListening(true);
    }
  }

  async function sendMessage(text) {
    if (!text.trim() || sending) return;
    setMessages((m) => [...m, { role: "user", content: text }]);
    setInput("");
    setSending(true);

    try {
      const res = await fetch(`${API_URL}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: sessionId.current, message: text }),
      });
      const data = await res.json();

      if (data.reply) {
        setMessages((m) => [...m, { role: "assistant", content: data.reply }]);
        speak(data.reply);
      } else if (data.pendingAction) {
        // Web sessions don't send device_control capability, so this
        // shouldn't normally happen — shown just in case.
        const note = `That needs the Android app (action: ${data.pendingAction.name}).`;
        setMessages((m) => [...m, { role: "assistant", content: note }]);
      } else if (data.error) {
        setMessages((m) => [...m, { role: "assistant", content: `Error: ${data.error}` }]);
      }
    } catch (err) {
      setMessages((m) => [...m, { role: "assistant", content: `Connection error: ${err.message}` }]);
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="app">
      <header className="header">
        <h1>Jarvis</h1>
        <a href="#android" className="android-link">Get the Android app</a>
      </header>

      <main className="chat">
        {messages.map((m, i) => (
          <div key={i} className={`bubble ${m.role}`}>
            {m.content}
          </div>
        ))}
        <div ref={scrollRef} />
      </main>

      <form
        className="composer"
        onSubmit={(e) => {
          e.preventDefault();
          sendMessage(input);
        }}
      >
        {recognitionRef.current && (
          <button
            type="button"
            className={`mic ${listening ? "listening" : ""}`}
            onClick={toggleListening}
            aria-label="Voice input"
          >
            Mic
          </button>
        )}
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask Jarvis anything..."
          disabled={sending}
        />
        <button type="submit" disabled={sending || !input.trim()}>
          Send
        </button>
      </form>

      <section id="android" className="android-panel">
        <h2>Jarvis for Android</h2>
        <p>
          Install the Android app to talk to Jarvis by voice and let it open apps
          or lock your screen — only after you grant those permissions yourself
          through Android's own settings screens.
        </p>
        <a className="download-btn" href="/jarvis.apk" download>
          Download APK
        </a>
        <p className="note">
          Requires allowing installs from this source in your phone's settings.
          Nothing is installed or granted without your explicit confirmation.
        </p>
      </section>
    </div>
  );
}
