#!/usr/bin/env node
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { spawn } from "child_process";
import { writeFile, unlink } from "fs/promises";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function testHotReload() {
  console.log("Starting MCP hot-reload test...\n");

  // Start the server
  const serverProcess = spawn("node", ["src/server.js"], {
    cwd: __dirname,
    stdio: ["pipe", "pipe", "pipe"]
  });

  const transport = new StdioClientTransport({
    command: "node",
    args: ["src/server.js"],
    env: process.env
  });

  const client = new Client({
    name: "test-client",
    version: "1.0.0"
  }, {
    capabilities: {}
  });

  try {
    await client.connect(transport);
    console.log("Connected to MCP server\n");

    // Test 1: List initial tools
    console.log("=== Test 1: List initial tools ===");
    const initialTools = await client.listTools();
    console.log("Initial tools:", initialTools.tools.map(t => t.name));
    console.log();

    // Test 2: Call existing tools
    console.log("=== Test 2: Call existing tools ===");
    const echoResult = await client.callTool("echo", { message: "Hello MCP!" });
    console.log("Echo result:", echoResult.content[0].text);
    
    const timeResult = await client.callTool("get_time", { format: "iso" });
    console.log("Time result:", timeResult.content[0].text);
    console.log();

    // Test 3: Modify existing tool
    console.log("=== Test 3: Modify existing tool (echo.js) ===");
    const modifiedEchoTool = `export default {
  name: "echo",
  description: "Echo back the input message with timestamp",
  inputSchema: {
    type: "object",
    properties: {
      message: {
        type: "string",
        description: "Message to echo"
      }
    },
    required: ["message"]
  },
  handler: async ({ message }) => {
    const timestamp = new Date().toISOString();
    return \`[Modified at \${timestamp}] Echo: \${message}\`;
  }
};`;

    await writeFile(join(__dirname, "src/tools/echo.js"), modifiedEchoTool);
    console.log("Modified echo.js - waiting for hot reload...");
    await delay(2000); // Wait for file watcher

    const modifiedEchoResult = await client.callTool("echo", { message: "Testing hot reload!" });
    console.log("Modified echo result:", modifiedEchoResult.content[0].text);
    console.log();

    // Test 4: Add new tool
    console.log("=== Test 4: Add new tool (random.js) ===");
    const randomTool = `export default {
  name: "random",
  description: "Generate a random number",
  inputSchema: {
    type: "object",
    properties: {
      min: {
        type: "number",
        description: "Minimum value",
        default: 0
      },
      max: {
        type: "number",
        description: "Maximum value",
        default: 100
      }
    }
  },
  handler: async ({ min = 0, max = 100 }) => {
    const randomNum = Math.floor(Math.random() * (max - min + 1)) + min;
    return \`Random number between \${min} and \${max}: \${randomNum}\`;
  }
};`;

    await writeFile(join(__dirname, "src/tools/random.js"), randomTool);
    console.log("Added random.js - waiting for hot reload...");
    await delay(2000);

    const toolsAfterAdd = await client.listTools();
    console.log("Tools after adding:", toolsAfterAdd.tools.map(t => t.name));

    const randomResult = await client.callTool("random", { min: 1, max: 10 });
    console.log("Random result:", randomResult.content[0].text);
    console.log();

    // Test 5: Remove tool
    console.log("=== Test 5: Remove tool (random.js) ===");
    await unlink(join(__dirname, "src/tools/random.js"));
    console.log("Removed random.js - waiting for hot reload...");
    await delay(2000);

    const finalTools = await client.listTools();
    console.log("Final tools:", finalTools.tools.map(t => t.name));

    // Restore original echo.js
    const originalEchoTool = `export default {
  name: "echo",
  description: "Echo back the input message",
  inputSchema: {
    type: "object",
    properties: {
      message: {
        type: "string",
        description: "Message to echo"
      }
    },
    required: ["message"]
  },
  handler: async ({ message }) => {
    return \`Echo: \${message}\`;
  }
};`;
    await writeFile(join(__dirname, "src/tools/echo.js"), originalEchoTool);

    console.log("\n✅ All hot-reload tests completed successfully!");

  } catch (error) {
    console.error("Test failed:", error);
  } finally {
    await client.close();
    serverProcess.kill();
  }
}

testHotReload().catch(console.error);