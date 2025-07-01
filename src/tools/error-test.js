export default {
  name: "error_test",
  description: "Test error handling in MCP tools",
  inputSchema: {
    type: "object",
    properties: {
      errorType: {
        type: "string",
        enum: ["throw", "reject", "syntax", "timeout"],
        description: "Type of error to trigger"
      },
      message: {
        type: "string",
        description: "Custom error message",
        default: "Test error"
      }
    },
    required: ["errorType"]
  },
  handler: async ({ errorType, message = "Test error" }) => {
    switch (errorType) {
      case "throw":
        throw new Error(message);
      
      case "reject":
        return Promise.reject(new Error(message));
      
      case "syntax":
        // This will cause a runtime error
        return undefined.nonExistentMethod();
      
      case "timeout":
        // Simulate a long-running operation
        await new Promise(resolve => setTimeout(resolve, 10000));
        return "This should timeout";
      
      default:
        return "Unknown error type";
    }
  }
};