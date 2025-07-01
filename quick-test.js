#!/usr/bin/env node
import { spawn } from "child_process";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

async function quickTest() {
  console.log("🚀 Quick Hot-Reload Test\n");
  
  // Start server first
  console.log("Starting MCP server...");
  const serverProcess = spawn("node", ["src/server.js"], {
    stdio: ['pipe', 'pipe', 'inherit']
  });
  
  // Give server time to start
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  const transport = new StdioClientTransport({
    command: "node",
    args: ["src/server.js"]
  });

  const client = new Client({
    name: "quick-test",
    version: "1.0.0"
  });

  try {
    await client.connect(transport);
    console.log("✅ Connected to server\n");

    // List current tools
    const tools = await client.listTools();
    console.log("📋 Current tools:");
    tools.tools.forEach(t => console.log(`  - ${t.name}`));

    // Test echo with new features
    console.log("\n🔊 Testing modified echo:");
    const result = await client.callTool("echo", {
      message: "Hot reload works!",
      emoji: true
    });
    console.log(`  ${result.content[0].text}`);

    // Test debug tool
    console.log("\n🐛 Testing debug tool:");
    const debugResult = await client.callTool("debug_info", { type: "memory" });
    const debugInfo = JSON.parse(debugResult.content[0].text);
    console.log("  Memory usage:", debugInfo.memory);

  } catch (error) {
    console.error("❌ Error:", error.message);
  } finally {
    await client.close();
    serverProcess.kill();
  }
}

quickTest().catch(console.error);