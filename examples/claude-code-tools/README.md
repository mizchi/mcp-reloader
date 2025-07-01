# Claude Code MCP Tools Example

This example demonstrates how Claude Code can develop MCP tools with hot-reload capability.

## Setup

1. Configure Claude Desktop by adding this to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "claude-tools": {
      "command": "npx",
      "args": ["mcp-reloader"],
      "cwd": "/path/to/mcp-reloader/examples/claude-code-tools"
    }
  }
}
```

2. Restart Claude Desktop

3. Now Claude Code can create and modify tools in the `tools/` directory!

## Example Workflow

Ask Claude Code to:

1. "Create an MCP tool that can read and write files"
2. "Add a tool to search for patterns in files"
3. "Create a tool to run shell commands"
4. "Modify the file reader to support line ranges"

Each time Claude Code creates or modifies a tool, it will be immediately available without restarting Claude Desktop.

## Sample Tools

The `tools/` directory contains example tools that Claude Code might create:

- `file-operations.js` - Read and write files
- `code-analyzer.js` - Analyze code structure
- `git-helper.js` - Git operations

These tools are automatically loaded and can be modified by Claude Code in real-time.