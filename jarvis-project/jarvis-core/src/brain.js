const Groq = require("groq-sdk");
const { getHistory, appendMessage } = require("./memory");
const { getToolDefinitions, isClientSkill, runServerSkill } = require("./skills");
const { setPending, getPending, clearPending } = require("./pending");

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const MODEL = "llama-3.3-70b-versatile";

const SYSTEM_PROMPT = `You are Jarvis, a capable and concise personal assistant.
Speak plainly, get to the point, and use tools when they let you give a more
accurate or useful answer instead of guessing.`;

function toGroqTools(tools) {
  return tools.map((t) => ({
    type: "function",
    function: {
      name: t.name,
      description: t.description,
      parameters: t.input_schema,
    },
  }));
}

async function think(sessionId, userMessage, capabilities = []) {
  appendMessage(sessionId, "user", userMessage);
  const history = getHistory(sessionId).map((m) => ({ role: m.role, content: m.content }));
  const messages = [{ role: "system", content: SYSTEM_PROMPT }, ...history];
  return runLoop(sessionId, messages, capabilities);
}

async function continueAfterAction(sessionId, toolUseId, actionResult, capabilities = []) {
  const pending = getPending(sessionId);
  if (!pending || pending.toolCallId !== toolUseId) {
    throw new Error("No matching pending action for this session.");
  }
  clearPending(sessionId);

  const history = getHistory(sessionId).map((m) => ({ role: m.role, content: m.content }));
  const messages = [{ role: "system", content: SYSTEM_PROMPT }, ...history];
  messages.push(pending.assistantMessage);
  messages.push({
    role: "tool",
    tool_call_id: toolUseId,
    content: JSON.stringify(actionResult),
  });

  return runLoop(sessionId, messages, capabilities);
}

async function runLoop(sessionId, messages, capabilities) {
  const tools = toGroqTools(getToolDefinitions(capabilities));

  for (let i = 0; i < 5; i++) {
    const response = await groq.chat.completions.create({
      model: MODEL,
      messages,
      tools: tools.length ? tools : undefined,
      max_tokens: 1024,
    });

    const msg = response.choices[0].message;

    if (!msg.tool_calls || msg.tool_calls.length === 0) {
      const reply = msg.content || "";
      appendMessage(sessionId, "assistant", reply);
      return { reply };
    }

    const clientCall = msg.tool_calls.find((tc) => isClientSkill(tc.function.name));
    if (clientCall) {
      setPending(sessionId, msg, clientCall.id);
      return {
        pendingAction: {
          name: clientCall.function.name,
          input: JSON.parse(clientCall.function.arguments || "{}"),
          toolUseId: clientCall.id,
        },
      };
    }

    messages.push(msg);
    for (const tc of msg.tool_calls) {
      let result;
      try {
        result = await runServerSkill(tc.function.name, JSON.parse(tc.function.arguments || "{}"));
      } catch (err) {
        result = { error: err.message };
      }
      messages.push({ role: "tool", tool_call_id: tc.id, content: JSON.stringify(result) });
    }
  }

  const fallback = "I'm having trouble completing that request right now.";
  appendMessage(sessionId, "assistant", fallback);
  return { reply: fallback };
}

module.exports = { think, continueAfterAction };
