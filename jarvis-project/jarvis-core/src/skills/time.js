// Example skill. Copy this file's shape to add new capabilities
// (smart home control, web search, code execution, etc.).

module.exports = {
  name: "get_current_time",
  description: "Get the current date and time.",
  input_schema: {
    type: "object",
    properties: {},
  },
  async run() {
    return { now: new Date().toString() };
  },
};
