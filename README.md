# MCP Reloader

A hot-reload server implementation for Model Context Protocol (MCP) that enables dynamic tool loading and automatic process restart on configuration changes.

## Overview

MCP Reloader solves the common development pain point where MCP clients need to be restarted whenever server tools are modified. By implementing file watching and the `tools/list_changed` notification, it enables seamless tool updates during development.

## Features

- **Dynamic Tool Loading**: Automatically loads JavaScript tools from `src/tools/` directory
- **Hot Reload**: Tools are reloaded without restarting the MCP client
- **File Watching**: Uses chokidar to detect file changes in real-time
- **Include Patterns**: Watch arbitrary files with glob patterns and restart on changes
- **Process Wrapping**: Wrap any LSP/MCP process with hot-reload capabilities
- **Automatic Notifications**: Sends `tools/list_changed` notifications on tool updates
- **Error Resilience**: Handles tool loading errors gracefully without crashing

## Installation

```bash
# Global installation
npm install -g mcp-reloader

# Or use directly with npx (recommended)
npx mcp-reloader --help
```

## Usage

### Basic Server Start

```bash
# Start default MCP server with hot-reload
npx mcp-reloader

# Or if installed globally
mcp-reloader
```

### Using Include Patterns

Watch additional files and restart the process when they change:

```bash
# Watch configuration files
npx mcp-reloader --include "config/**/*.json" --include "src/lib/**/*.js"

# Or use environment variable
MCP_HOT_RELOAD_INCLUDE='config/**/*.json,src/lib/**/*.js' npx mcp-reloader
```

### Wrapping Custom LSP Servers

Wrap any LSP server with hot-reload capabilities:

```bash
# Wrap a Python LSP server
npx mcp-reloader --include "**/*.yaml" -- python my-lsp-server.py --port 3000

# Wrap a Node.js server with complex arguments
npx mcp-reloader --include "**/*.ts" -- node --experimental-specifier-resolution=node ./dist/server.js --config ./config.json

# Legacy cmd: format (still supported)
npx mcp-reloader cmd:python server.py --port 3000
```

## MCP Client Configuration

Add to your `.mcp.json` or `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "hot-reload": {
      "command": "npx",
      "args": [
        "mcp-reloader",
        "--include", "config/**/*.json",
        "--include", "src/lib/**/*.js"
      ]
    },
    "custom-lsp": {
      "command": "npx",
      "args": [
        "mcp-reloader",
        "--include", "**/*.yaml",
        "--",
        "python",
        "my-lsp-server.py",
        "--config", "server.yaml"
      ]
    }
  }
}
```

## Creating Tools

Add new tools by creating JavaScript files in `src/tools/`:

```javascript
// src/tools/my-tool.js
export default {
  name: "my_tool",
  description: "Description of my tool",
  inputSchema: {
    type: "object",
    properties: {
      param: { 
        type: "string",
        description: "Parameter description"
      }
    },
    required: ["param"]
  },
  handler: async ({ param }) => {
    // Tool implementation
    return `Result: ${param}`;
  }
};
```

The tool will be automatically loaded and available to MCP clients without restart.

## Command Line Arguments

### --include patterns

Specify glob patterns for files to watch. When matched files change, the entire process restarts.

```bash
# Single pattern
npx mcp-reloader --include "config.json"

# Multiple patterns
npx mcp-reloader --include "**/*.yaml" --include "lib/**/*.js"
```

### -- separator

Everything after `--` is treated as the command and its arguments. This makes it easy to pass complex arguments without escaping.

```bash
# Simple command
npx mcp-reloader -- python server.py --port 3000

# Complex Node.js arguments
npx mcp-reloader --include "**/*.ts" -- node --experimental-specifier-resolution=node ./dist/server.js --config ./config.json

# Arguments with spaces and special characters
npx mcp-reloader -- python script.py --message "Hello World!" --path "/path with spaces/"
```

## How It Works

### Two-Level Reload Strategy

1. **Tool Files** (`src/tools/*.js`): Hot-reloaded without process restart
   - File changes are detected by chokidar
   - Tools are dynamically imported with cache busting
   - `tools/list_changed` notification sent to clients
   - MCP clients can immediately use updated tools

2. **Include Pattern Files**: Full process restart
   - Wrapper process monitors specified glob patterns
   - On change, the entire server process is restarted
   - Useful for configuration files or core dependencies

### Architecture

```
┌─────────────┐     ┌─────────────┐     ┌──────────────┐
│ MCP Client  │────▶│   Wrapper   │────▶│  MCP Server  │
└─────────────┘     └─────────────┘     └──────────────┘
                           │                      │
                           ▼                      ▼
                    File Watching           Tool Loading
                    (--include)            (src/tools/*)
```

## Expected Behavior

### Initial Startup
- Server loads all tools from `src/tools/`
- Initial tools like `echo` and `get_time` are available
- Client receives the tool list

### Adding a Tool
- Create new file (e.g., `src/tools/hello.js`)
- Server detects the new file
- Tool is automatically loaded
- `tools/list_changed` notification sent
- Tool immediately available in client

### Modifying a Tool
- Edit existing file (e.g., `src/tools/echo.js`)
- Server detects the change
- Tool is reloaded with new implementation
- `tools/list_changed` notification sent
- Updated behavior immediately available

### Deleting a Tool
- Remove file (e.g., `src/tools/time.js`)
- Server detects the deletion
- Tool is removed from available tools
- `tools/list_changed` notification sent
- Tool no longer callable

### Include Pattern Changes
- Modify watched file (e.g., `config.json`)
- Wrapper detects the change
- Entire server process restarts
- All tools are reloaded with new configuration

## Local Development

For developing mcp-reloader itself:

```bash
# Clone and install
git clone https://github.com/mizchi/mcp-reloader.git
cd mcp-reloader
npm install

# Build TypeScript
npm run build

# Run tests
npm test

# Run development server
npm run dev

# Test hot-reload functionality
./test-include.sh
```

## Comparison with Similar Tools

| Tool | Use Case | State Preservation | MCP Integration |
|------|----------|-------------------|-----------------|
| **mcp-reloader** | MCP/LSP servers | Two-level strategy | Native support |
| **nodemon** | General purpose | No (full restart) | Manual setup |
| **tsx watch** | TypeScript only | No (full restart) | No |
| **Bun --hot** | Bun runtime | Yes | No |

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT

## Acknowledgments

This project implements the [Model Context Protocol](https://modelcontextprotocol.io) specification for tool hot-reloading.