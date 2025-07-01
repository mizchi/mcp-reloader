# MCP Reloader

A hot-reload development tool for building MCP (Model Context Protocol) servers with Claude Code. This tool enables Claude Code to dynamically reload MCP tools as they are modified, making it perfect for iterative development where Claude Code can write and test MCP tools in real-time.

## Overview

MCP Reloader is specifically designed for developers using Claude Code to build MCP tools. It solves the common development pain point where MCP clients need to be restarted whenever server tools are modified. By implementing file watching and the `tools/list_changed` notification, Claude Code can modify tools and immediately test them without manual restarts.

## Key Features for Claude Code Development

- **Real-time Tool Development**: Claude Code can write, modify, and test MCP tools without restarts
- **Dynamic Tool Loading**: Automatically loads JavaScript tools from `tools/` directory
- **Instant Feedback Loop**: Changes are reflected immediately in the MCP client
- **File Watching**: Uses chokidar to detect file changes in real-time
- **Process Wrapping**: Wrap any LSP/MCP process with hot-reload capabilities
- **Auto-restart on Config Changes**: Watch configuration files and restart when needed

## Quick Start with Claude Code

### 1. Create a new MCP project

```bash
mkdir my-mcp-tools
cd my-mcp-tools
mkdir tools
```

### 2. Configure Claude Desktop

Add to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "my-tools": {
      "command": "npx",
      "args": ["mcp-reloader"],
      "cwd": "/path/to/my-mcp-tools"
    }
  }
}
```

### 3. Ask Claude Code to create tools

Now Claude Code can create and modify tools in the `tools/` directory, and they will be automatically available without restarting Claude Desktop!

## Example: Claude Code Creating Tools

Here's how Claude Code can create a tool that will be immediately available:

```javascript
// tools/search-files.js
export default {
  name: "search_files",
  description: "Search for files matching a pattern",
  inputSchema: {
    type: "object",
    properties: {
      pattern: {
        type: "string",
        description: "Glob pattern to search for files"
      },
      directory: {
        type: "string",
        description: "Directory to search in",
        default: "."
      }
    },
    required: ["pattern"]
  },
  handler: async ({ pattern, directory = "." }) => {
    const { glob } = await import('glob');
    const files = await glob(pattern, { cwd: directory });
    return `Found ${files.length} files:\n${files.join('\n')}`;
  }
};
```

Claude Code can create this file, and it will be immediately available to use!

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

## Example: Wrapping Existing MCP Server

Here's how to add hot-reload to any MCP server. This example wraps a simple echo server:

```json
{
  "mcpServers": {
    "echo-with-reload": {
      "command": "npx",
      "args": [
        "mcp-reloader",
        "--include", "examples/echo-server/config.json",
        "--",
        "node",
        "examples/echo-server/server.js"
      ]
    }
  }
}
```

When `config.json` changes, the entire echo server restarts automatically.


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

1. **Tool Files** (`tools/*.js`): Hot-reloaded without process restart
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
                    (--include)            (tools/*.js)
```

## Expected Behavior

### Initial Startup
- Server loads all tools from `tools/`
- Initial tools are immediately available
- Client receives the tool list

### Adding a Tool
- Create new file (e.g., `tools/hello.js`)
- Server detects the new file
- Tool is automatically loaded
- `tools/list_changed` notification sent
- Tool immediately available in client

### Modifying a Tool
- Edit existing file (e.g., `tools/echo.js`)
- Server detects the change
- Tool is reloaded with new implementation
- `tools/list_changed` notification sent
- Updated behavior immediately available

### Deleting a Tool
- Remove file (e.g., `tools/time.js`)
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

This project implements the [Model Context Protocol](https://modelcontextprotocol.io) specification for tool hot-reloading, specifically designed to enhance the Claude Code development experience.