// Example tool that Claude Code might create for file operations
export default {
  name: "file_operations",
  description: "Read, write, and manipulate files",
  inputSchema: {
    type: "object",
    properties: {
      operation: {
        type: "string",
        enum: ["read", "write", "append", "exists", "delete"],
        description: "The file operation to perform"
      },
      path: {
        type: "string",
        description: "Path to the file"
      },
      content: {
        type: "string",
        description: "Content to write (for write/append operations)"
      },
      encoding: {
        type: "string",
        default: "utf8",
        description: "File encoding"
      }
    },
    required: ["operation", "path"]
  },
  handler: async ({ operation, path, content, encoding = "utf8" }) => {
    const fs = await import('fs/promises');
    const { existsSync } = await import('fs');
    
    try {
      switch (operation) {
        case "read":
          const data = await fs.readFile(path, encoding);
          return data;
          
        case "write":
          if (!content) throw new Error("Content is required for write operation");
          await fs.writeFile(path, content, encoding);
          return `Successfully wrote to ${path}`;
          
        case "append":
          if (!content) throw new Error("Content is required for append operation");
          await fs.appendFile(path, content, encoding);
          return `Successfully appended to ${path}`;
          
        case "exists":
          return existsSync(path) ? "File exists" : "File does not exist";
          
        case "delete":
          await fs.unlink(path);
          return `Successfully deleted ${path}`;
          
        default:
          throw new Error(`Unknown operation: ${operation}`);
      }
    } catch (error) {
      return `Error: ${error.message}`;
    }
  }
};