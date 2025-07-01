export default {
  name: "get_time",
  description: "Get current time",
  inputSchema: {
    type: "object",
    properties: {
      format: {
        type: "string",
        description: "Time format (iso, unix, locale)",
        enum: ["iso", "unix", "locale"]
      }
    }
  },
  handler: async ({ format = "iso" }) => {
    const now = new Date();
    switch (format) {
      case "unix":
        return String(Math.floor(now.getTime() / 1000));
      case "locale":
        return now.toLocaleString();
      default:
        return now.toISOString();
    }
  }
};