// Talks to a Home Assistant instance. Requires HOME_ASSISTANT_URL and
// HOME_ASSISTANT_TOKEN (a long-lived access token, generated from the HA
// user profile page) set in .env. If they're not set, this skill reports
// that it isn't configured rather than failing silently.
module.exports = {
  name: "control_home_device",
  description:
    "Turn a smart home device on or off via Home Assistant (lights, switches, etc).",
  input_schema: {
    type: "object",
    properties: {
      entity_id: {
        type: "string",
        description: "The Home Assistant entity id, e.g. light.living_room",
      },
      action: { type: "string", enum: ["turn_on", "turn_off", "toggle"] },
    },
    required: ["entity_id", "action"],
  },
  client: false,
  async run({ entity_id, action }) {
    const baseUrl = process.env.HOME_ASSISTANT_URL;
    const token = process.env.HOME_ASSISTANT_TOKEN;

    if (!baseUrl || !token) {
      return {
        error:
          "Home Assistant isn't configured yet. Set HOME_ASSISTANT_URL and HOME_ASSISTANT_TOKEN in .env.",
      };
    }

    const domain = entity_id.split(".")[0];
    const res = await fetch(`${baseUrl}/api/services/${domain}/${action}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ entity_id }),
    });

    if (!res.ok) {
      return { error: `Home Assistant returned ${res.status}` };
    }
    return { success: true, entity_id, action };
  },
};
