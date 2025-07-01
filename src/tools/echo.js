export default {
  name: "echo",
  description: "Echo back the input message with timestamp and emoji",
  inputSchema: {
    type: "object",
    properties: {
      message: {
        type: "string",
        description: "Message to echo"
      },
      emoji: {
        type: "boolean",
        description: "Add emoji to response",
        default: false
      }
    },
    required: ["message"]
  },
  handler: async ({ message, emoji = false }) => {
    const timestamp = new Date().toLocaleTimeString();
    const emojiPrefix = emoji ? "🔊 " : "";
    return `${emojiPrefix}[${timestamp}] Echo: ${message}`;
  }
};