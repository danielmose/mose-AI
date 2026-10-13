// Skill registry.
//
// Server skills run right here (web search, Home Assistant, time).
// Client skills (src/skills/device.js) run on the requesting device instead
// — the server hands the action back to the client to execute using
// permissions that device's owner granted directly.
//
// Add a server skill: create a file exporting { name, description,
// input_schema, client:false, run(args) } and require it below.
// Add a client skill: add an entry to device.js's exported array.

const timeSkill = require("./time");
const webSearchSkill = require("./web_search");
const homeAssistantSkill = require("./home_assistant");
const deviceSkills = require("./device");

const serverSkills = [timeSkill, webSearchSkill, homeAssistantSkill];
const clientSkills = deviceSkills;

// capabilities: array of strings the requesting client declares, e.g.
// ["device_control"]. Device tools are only exposed to clients that ask
// for them, so a web chat session never sees "lock_device".
function getToolDefinitions(capabilities = []) {
  const tools = serverSkills.map((s) => ({
    name: s.name,
    description: s.description,
    input_schema: s.input_schema,
  }));

  if (capabilities.includes("device_control")) {
    for (const s of clientSkills) {
      tools.push({
        name: s.name,
        description: s.description,
        input_schema: s.input_schema,
      });
    }
  }

  return tools;
}

function isClientSkill(name) {
  return clientSkills.some((s) => s.name === name);
}

async function runServerSkill(name, args) {
  const skill = serverSkills.find((s) => s.name === name);
  if (!skill) throw new Error(`Unknown server skill: ${name}`);
  return skill.run(args);
}

module.exports = { getToolDefinitions, isClientSkill, runServerSkill };
