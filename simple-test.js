#!/usr/bin/env node
import { writeFile, unlink } from "fs/promises";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

console.log("🚀 MCP Hot-reload test script");
console.log("=============================\n");

console.log("このスクリプトはホットリロードをテストするためのツール操作を行います。");
console.log("別のターミナルで以下のコマンドを実行してください:");
console.log("\n  npm run dev\n");
console.log("サーバーが起動したら、Enterキーを押してください...");

process.stdin.once('data', async () => {
  try {
    console.log("\n📝 Test 1: 新しいツールを追加 (calculator.js)");
    const calculatorTool = `export default {
  name: "calculator",
  description: "Simple calculator operations",
  inputSchema: {
    type: "object",
    properties: {
      operation: {
        type: "string",
        enum: ["add", "subtract", "multiply", "divide"],
        description: "Operation to perform"
      },
      a: { type: "number", description: "First number" },
      b: { type: "number", description: "Second number" }
    },
    required: ["operation", "a", "b"]
  },
  handler: async ({ operation, a, b }) => {
    let result;
    switch (operation) {
      case "add": result = a + b; break;
      case "subtract": result = a - b; break;
      case "multiply": result = a * b; break;
      case "divide": result = b !== 0 ? a / b : "Error: Division by zero"; break;
    }
    return \`Result of \${a} \${operation} \${b} = \${result}\`;
  }
};`;

    await writeFile(join(__dirname, "src/tools/calculator.js"), calculatorTool);
    console.log("✅ calculator.js を追加しました");
    console.log("   → サーバーログで 'Tool added, reloading...' が表示されるはずです\n");

    console.log("5秒後に次のテストに進みます...");
    await new Promise(resolve => setTimeout(resolve, 5000));

    console.log("📝 Test 2: 既存のツールを変更 (time.js)");
    const modifiedTimeTool = `export default {
  name: "get_time",
  description: "Get current time with emoji",
  inputSchema: {
    type: "object",
    properties: {
      format: {
        type: "string",
        description: "Time format (iso, unix, locale, emoji)",
        enum: ["iso", "unix", "locale", "emoji"]
      }
    }
  },
  handler: async ({ format = "iso" }) => {
    const now = new Date();
    switch (format) {
      case "unix":
        return String(Math.floor(now.getTime() / 1000));
      case "locale":
        return now.toLocaleString();
      case "emoji":
        const hour = now.getHours();
        const emoji = hour < 12 ? "🌅" : hour < 18 ? "☀️" : "🌙";
        return \`\${emoji} \${now.toLocaleTimeString()}\`;
      default:
        return now.toISOString();
    }
  }
};`;

    await writeFile(join(__dirname, "src/tools/time.js"), modifiedTimeTool);
    console.log("✅ time.js を変更しました (emoji formatを追加)");
    console.log("   → サーバーログで 'Tool changed, reloading...' が表示されるはずです\n");

    console.log("5秒後に次のテストに進みます...");
    await new Promise(resolve => setTimeout(resolve, 5000));

    console.log("📝 Test 3: ツールを削除 (calculator.js)");
    await unlink(join(__dirname, "src/tools/calculator.js"));
    console.log("✅ calculator.js を削除しました");
    console.log("   → サーバーログで 'Tool removed, reloading...' が表示されるはずです\n");

    console.log("3秒後に元の状態に戻します...");
    await new Promise(resolve => setTimeout(resolve, 3000));

    // 元のtime.jsに戻す
    const originalTimeTool = `export default {
  name: "get_time",
  description: "Get current time",
  inputSchema: {
    type: "object",
    properties: {
      format: {
        type: "string",
        description: "Time format (iso, unix, locale)",
        enum: ["iso", "unix", "locale"]
      }
    }
  },
  handler: async ({ format = "iso" }) => {
    const now = new Date();
    switch (format) {
      case "unix":
        return String(Math.floor(now.getTime() / 1000));
      case "locale":
        return now.toLocaleString();
      default:
        return now.toISOString();
    }
  }
};`;
    await writeFile(join(__dirname, "src/tools/time.js"), originalTimeTool);
    console.log("✅ time.js を元の状態に戻しました\n");

    console.log("🎉 ホットリロードテスト完了!");
    console.log("\nMCPクライアント（Claude Desktop等）で以下を確認してください:");
    console.log("- ツールリストが自動更新される");
    console.log("- 新しいツールがすぐに使用可能になる");
    console.log("- 変更したツールの新機能が反映される");

  } catch (error) {
    console.error("❌ エラーが発生しました:", error);
  }

  process.exit(0);
});