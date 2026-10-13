require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { think, continueAfterAction } = require("./brain");

const app = express();
app.use(cors());
app.use(express.json());

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

// Any interface (web, voice, mobile, Pi) sends { sessionId, message,
// capabilities } here. capabilities is an optional array — the Android
// app sends ["device_control"] so it's offered device-action tools; a
// plain web chat session omits it and never sees those tools.
//
// Response is either { reply } or, if Claude wants to perform a device
// action, { pendingAction: { name, input, toolUseId } } — the client
// should perform that action locally and report back via
// POST /chat/action-result.
app.post("/chat", async (req, res) => {
  const { sessionId, message, capabilities } = req.body;

  if (!sessionId || !message) {
    return res.status(400).json({ error: "sessionId and message are required" });
  }

  try {
    const result = await think(sessionId, message, capabilities || []);
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Something went wrong processing that request." });
  }
});

// Client reports the outcome of a device action it just performed, so the
// conversation can resume and Claude can respond about what happened.
app.post("/chat/action-result", async (req, res) => {
  const { sessionId, toolUseId, result, capabilities } = req.body;

  if (!sessionId || !toolUseId) {
    return res.status(400).json({ error: "sessionId and toolUseId are required" });
  }

  try {
    const outcome = await continueAfterAction(sessionId, toolUseId, result || {}, capabilities || []);
    res.json(outcome);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Jarvis core API listening on port ${PORT}`);
});
