#!/bin/bash

echo "🚀 Testing include pattern with auto-restart"
echo "==========================================="
echo ""
echo "Starting MCP server with include pattern: config/**/*.json"
echo ""

# Start the server with include pattern
MCP_HOT_RELOAD_INCLUDE='config/**/*.json' node src/wrapper.js &
SERVER_PID=$!

echo "Server started with PID: $SERVER_PID"
echo "Waiting for server to initialize..."
sleep 3

echo ""
echo "📝 Test 1: Modifying config/example.json"
echo "{\"updated\": true, \"timestamp\": \"$(date)\"}" > config/example.json
echo "Modified config file - server should detect change and mark as dirty"
sleep 3

echo ""
echo "📝 Test 2: Adding new config file"
echo "{\"new\": \"config\", \"test\": true}" > config/new-config.json
echo "Added new config file - server should restart automatically"
sleep 5

echo ""
echo "📝 Test 3: Modifying tool file (should hot-reload without restart)"
cat > src/tools/echo.js << 'EOF'
export default {
  name: "echo",
  description: "Echo with auto-restart test",
  inputSchema: {
    type: "object",
    properties: {
      message: { type: "string", description: "Message to echo" }
    },
    required: ["message"]
  },
  handler: async ({ message }) => {
    return `[Auto-restart test] Echo: ${message}`;
  }
};
EOF
echo "Modified tool file - should hot-reload without restart"
sleep 3

echo ""
echo "🧹 Cleaning up..."
kill $SERVER_PID 2>/dev/null
rm -f config/new-config.json

# Restore original files
cat > config/example.json << 'EOF'
{
  "apiKey": "test-api-key",
  "baseUrl": "https://api.example.com",
  "timeout": 5000,
  "features": {
    "enableCache": true,
    "maxRetries": 3
  }
}
EOF

cat > src/tools/echo.js << 'EOF'
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
EOF

echo ""
echo "✅ Test completed!"
echo ""
echo "What you should have seen in the server logs:"
echo "1. 'Include patterns: config/**/*.json' on startup"
echo "2. 'Include file change: config/example.json, marking server as dirty'"
echo "3. '[Wrapper] Detected dirty state, scheduling restart...'"
echo "4. '[Wrapper] Restarting server...'"
echo "5. Tool changes should hot-reload without server restart"