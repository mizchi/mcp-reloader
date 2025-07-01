import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { spawn } from "child_process";

async function testHotReload() {
  console.log("Starting MCP server...");
  
  const serverProcess = spawn("node", ["src/server.js"], {
    cwd: process.cwd(),
    stdio: ["pipe", "pipe", "pipe"]
  });

  const transport = new StdioClientTransport({
    command: "node",
    args: ["src/server.js"]
  });

  const client = new Client({
    name: "test-client",
    version: "1.0.0"
  }, {
    capabilities: {}
  });

  let toolsChangedCount = 0;
  
  client.setNotificationHandler({
    method: "tools/list_changed"
  }, async () => {
    toolsChangedCount++;
    console.log(`Received tools/list_changed notification (count: ${toolsChangedCount})`);
    
    const tools = await client.request({
      method: "tools/list"
    });
    console.log("Current tools:", tools.tools.map(t => t.name).join(", "));
  });

  try {
    await client.connect(transport);
    console.log("Connected to server");

    console.log("\n1. Initial tools list:");
    const initialTools = await client.request({
      method: "tools/list"
    });
    console.log("Tools:", initialTools.tools.map(t => t.name).join(", "));

    console.log("\n2. Testing echo tool:");
    const echoResult = await client.request({
      method: "tools/call",
      params: {
        name: "echo",
        arguments: { message: "Hello MCP!" }
      }
    });
    console.log("Echo result:", echoResult.content[0].text);

    console.log("\n3. Testing get_time tool:");
    const timeResult = await client.request({
      method: "tools/call",
      params: {
        name: "get_time",
        arguments: { format: "iso" }
      }
    });
    console.log("Time result:", timeResult.content[0].text);

    console.log("\n4. Hot reload test:");
    console.log("Add/modify/delete tool files in src/tools/ to test hot reload");
    console.log("The server will automatically detect changes and send notifications");
    console.log("\nPress Ctrl+C to exit...");

    await new Promise(() => {});
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await client.close();
    serverProcess.kill();
  }
}

testHotReload().catch(console.error);