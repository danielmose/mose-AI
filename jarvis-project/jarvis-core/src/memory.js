const fs = require("fs");
const path = require("path");

const DATA_DIR = path.join(__dirname, "..", "data");
const MEMORY_FILE = path.join(DATA_DIR, "conversations.json");

function ensureStore() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(MEMORY_FILE)) fs.writeFileSync(MEMORY_FILE, JSON.stringify({}), "utf8");
}

function loadAll() {
  ensureStore();
  const raw = fs.readFileSync(MEMORY_FILE, "utf8");
  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

function saveAll(data) {
  ensureStore();
  fs.writeFileSync(MEMORY_FILE, JSON.stringify(data, null, 2), "utf8");
}

// Returns the message history array for a given session id, creating it if needed.
function getHistory(sessionId) {
  const all = loadAll();
  return all[sessionId] || [];
}

// Appends a user/assistant message pair (or single message) and persists it.
// role: "user" | "assistant"
function appendMessage(sessionId, role, content) {
  const all = loadAll();
  if (!all[sessionId]) all[sessionId] = [];
  all[sessionId].push({ role, content, ts: new Date().toISOString() });
  // Keep only the last 40 messages per session so the context sent to the
  // model doesn't grow without bound.
  if (all[sessionId].length > 40) {
    all[sessionId] = all[sessionId].slice(-40);
  }
  saveAll(all);
}

module.exports = { getHistory, appendMessage };
