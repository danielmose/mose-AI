# Jarvis Core

The core "brain" API for a personal Jarvis-style assistant. Every interface
(web chat, voice, mobile, Raspberry Pi) talks to this one service over HTTP,
so the reasoning, memory, and skills only need to be built once.

## Setup

```powershell
npm install
copy .env.example .env
```

Edit `.env` and add your Anthropic API key.

## Run

```powershell
npm run dev
```

Server starts on `http://localhost:3000`.

## Test it

```powershell
curl -Method Post http://localhost:3000/chat `
  -ContentType "application/json" `
  -Body '{"sessionId":"test1","message":"Hello, who are you?"}'
```

Or with `curl.exe` (plain curl, not the PowerShell alias):

```powershell
curl.exe -X POST http://localhost:3000/chat -H "Content-Type: application/json" -d "{\"sessionId\":\"test1\",\"message\":\"Hello, who are you?\"}"
```

## Structure

```
src/
  server.js    Express app, exposes POST /chat
  brain.js     Calls Claude, loops on tool use, saves conversation turns
  memory.js    File-based per-session conversation history (data/conversations.json)
  skills/      Pluggable capabilities (tools) the brain can call
    index.js   Registry - add new skills here
    time.js    Example skill
```

## Adding a skill

1. Create `src/skills/my_skill.js` following the shape in `time.js`
   (`name`, `description`, `input_schema`, `run`).
2. Require it and add it to the `skills` array in `src/skills/index.js`.
3. Restart the server — Claude will see it as an available tool automatically.

This is where smart-home control, web search, code execution, etc. will
plug in.

## Connecting interfaces

Any client — web UI, voice pipeline, mobile app, Pi satellite — just needs
to `POST /chat` with `{ sessionId, message }` and render the `reply` it gets
back. `sessionId` should stay the same across a single conversation so
memory carries over.

## Next steps

- Web chat interface (React/Vite) hitting this API
- Voice layer: Whisper for speech-to-text in, a TTS service for speech out
- Smart home skill via the Home Assistant API
- Deploy this API (Vercel/Render/etc.) so a Pi client can reach it remotely
