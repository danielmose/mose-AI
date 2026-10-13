// These tools are NOT executed on the server. The server can't reach into
// a phone. Instead, when Claude calls one of these, brain.js pauses the
// conversation and hands the action to whichever client made the request
// (the Android app) to actually perform, using permissions that phone's
// owner granted through Android's own system dialogs. The client then
// reports the result back via POST /chat/action-result to continue.
//
// Only offered to clients that declare `"capabilities": ["device_control"]`
// in their request — a plain web chat session never sees these tools.
//
// Deliberately not included: unlocking the device. Android does not allow
// any app, regardless of permissions granted, to dismiss the lock screen
// without the owner's own PIN/pattern/biometric. That's an OS-level
// security boundary, not a missing feature here.

module.exports = [
  {
    name: "open_app",
    description: "Open an app on the user's phone by its package name.",
    input_schema: {
      type: "object",
      properties: {
        package_name: {
          type: "string",
          description: "Android package name, e.g. com.spotify.music",
        },
      },
      required: ["package_name"],
    },
    client: true,
  },
  {
    name: "lock_device",
    description: "Lock the user's phone screen immediately.",
    input_schema: {
      type: "object",
      properties: {},
    },
    client: true,
  },
];
