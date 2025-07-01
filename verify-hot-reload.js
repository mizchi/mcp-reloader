#!/usr/bin/env node
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

async function verifyHotReload() {
  const transport = new StdioClientTransport({
    command: "node",
    args: ["src/server.js"],
    env: process.env
  });

  const client = new Client({
    name: "verify-client",
    version: "1.0.0"
  }, {
    capabilities: {}
  });

  try {
    console.log("🔗 Connecting to MCP server...");
    await client.connect(transport);
    
    // List tools
    console.log("\n📋 Available tools:");
    const tools = await client.listTools();
    tools.tools.forEach(tool => {
      console.log(`  - ${tool.name}: ${tool.description}`);
    });

    // Test modified echo tool
    console.log("\n🔊 Testing echo tool:");
    const echo1 = await client.callTool("echo", { 
      message: "Hello from hot-reload test!",
      emoji: true 
    });
    console.log("  Result:", echo1.content[0].text);

    // Test debug_info tool
    console.log("\n🐛 Testing debug_info tool:");
    const debug = await client.callTool("debug_info", { type: "env" });
    console.log("  Result:", debug.content[0].text);

    // Test error handling
    console.log("\n❌ Testing error_test tool:");
    try {
      await client.callTool("error_test", { errorType: "throw", message: "Intentional error" });
    } catch (error) {
      console.log("  Expected error caught:", error.message);
    }

    console.log("\n✅ Verification complete!");

  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await client.close();
  }
}

verifyHotReload().catch(console.error);