const fs = require("fs");
const path = require("path");

const DATA_DIR = path.join(__dirname, "..", "data");
const PENDING_FILE = path.join(DATA_DIR, "pending.json");

function ensureStore() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(PENDING_FILE)) fs.writeFileSync(PENDING_FILE, JSON.stringify({}), "utf8");
}

function loadAll() {
  ensureStore();
  try {
    return JSON.parse(fs.readFileSync(PENDING_FILE, "utf8"));
  } catch {
    return {};
  }
}

function saveAll(data) {
  ensureStore();
  fs.writeFileSync(PENDING_FILE, JSON.stringify(data, null, 2), "utf8");
}

function setPending(sessionId, assistantMessage, toolCallId) {
  const all = loadAll();
  all[sessionId] = { assistantMessage, toolCallId };
  saveAll(all);
}

function getPending(sessionId) {
  return loadAll()[sessionId] || null;
}

function clearPending(sessionId) {
  const all = loadAll();
  delete all[sessionId];
  saveAll(all);
}

module.exports = { setPending, getPending, clearPending };
