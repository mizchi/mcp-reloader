#!/usr/bin/env node
import chokidar from "chokidar";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import { readdir } from "fs/promises";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

//#region src/server.ts
const __dirname = dirname(fileURLToPath(import.meta.url));
var HotReloadMCPServer = class {
	server;
	tools;
	toolsDir;
	watcher;
	isDirty;
	includePatterns;
	constructor() {
		this.server = new Server({
			name: "hot-reload-mcp",
			version: "1.0.0"
		}, { capabilities: { tools: {} } });
		this.tools = /* @__PURE__ */ new Map();
		this.toolsDir = join(__dirname, "..", "tools");
		this.watcher = null;
		this.isDirty = false;
		this.includePatterns = [];
		const includeEnv = process.env.MCP_HOT_RELOAD_INCLUDE;
		if (includeEnv) {
			this.includePatterns = includeEnv.split(",").map((p) => p.trim());
			console.error(`Include patterns: ${this.includePatterns.join(", ")}`);
		}
	}
	async loadTools() {
		try {
			const files = await readdir(this.toolsDir);
			const newTools = /* @__PURE__ */ new Map();
			for (const file of files) if (file.endsWith(".js") || file.endsWith(".mjs")) {
				const toolPath = join(this.toolsDir, file);
				try {
					const toolUrl = `file://${toolPath}?t=${Date.now()}`;
					const module = await import(toolUrl);
					if (module.default && module.default.name) {
						newTools.set(module.default.name, module.default);
						console.error(`Loaded tool: ${module.default.name}`);
					}
				} catch (error) {
					console.error(`Failed to load tool ${file}:`, error);
				}
			}
			const oldToolNames = Array.from(this.tools.keys());
			const newToolNames = Array.from(newTools.keys());
			this.tools = newTools;
			const added = newToolNames.filter((name) => !oldToolNames.includes(name));
			const removed = oldToolNames.filter((name) => !newToolNames.includes(name));
			const changed = newToolNames.filter((name) => oldToolNames.includes(name));
			if (added.length > 0 || removed.length > 0 || changed.length > 0) {
				if (this.server.transport) await this.server.notification({ method: "tools/list_changed" });
				console.error(`Tools updated - Added: ${added.length}, Removed: ${removed.length}, Changed: ${changed.length}`);
			}
		} catch (error) {
			console.error("Error loading tools:", error);
		}
	}
	setupHandlers() {
		this.server.setRequestHandler(ListToolsRequestSchema, async () => {
			if (this.isDirty) {
				console.error("Server is dirty, restart required for include pattern changes");
				await this.server.notification({
					method: "server/dirty",
					params: { message: "Server restart required due to include pattern file changes" }
				});
			}
			const tools = Array.from(this.tools.values()).map((tool) => ({
				name: tool.name,
				description: tool.description || "No description",
				inputSchema: tool.inputSchema || {
					type: "object",
					properties: {},
					required: []
				}
			}));
			return { tools };
		});
		this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
			const tool = this.tools.get(request.params.name);
			if (!tool) throw new Error(`Tool not found: ${request.params.name}`);
			try {
				const result = await tool.handler(request.params.arguments || {});
				return { content: [{
					type: "text",
					text: typeof result === "string" ? result : JSON.stringify(result, null, 2)
				}] };
			} catch (error) {
				return {
					content: [{
						type: "text",
						text: `Error: ${error instanceof Error ? error.message : String(error)}`
					}],
					isError: true
				};
			}
		});
	}
	async startWatching() {
		this.watcher = chokidar.watch(this.toolsDir, {
			persistent: true,
			ignoreInitial: true
		});
		this.watcher.on("add", async () => {
			console.error("Tool added, reloading...");
			await this.loadTools();
		});
		this.watcher.on("change", async () => {
			console.error("Tool changed, reloading...");
			await this.loadTools();
		});
		this.watcher.on("unlink", async () => {
			console.error("Tool removed, reloading...");
			await this.loadTools();
		});
		if (this.includePatterns.length > 0) {
			const includeWatcher = chokidar.watch(this.includePatterns, {
				persistent: true,
				ignoreInitial: true,
				cwd: process.cwd()
			});
			includeWatcher.on("all", (event, path) => {
				console.error(`Include file ${event}: ${path}, marking server as dirty`);
				this.isDirty = true;
				if (this.server.transport) this.server.notification({
					method: "server/dirty",
					params: {
						event,
						path,
						message: "Server restart required"
					}
				}).catch((err) => console.error("Failed to send dirty notification:", err));
			});
			console.error(`Watching include patterns: ${this.includePatterns.join(", ")}`);
		}
	}
	async start() {
		await this.loadTools();
		this.setupHandlers();
		await this.startWatching();
		const transport = new StdioServerTransport();
		await this.server.connect(transport);
		console.error("Hot-reload MCP server started");
		if (this.includePatterns.length > 0) console.error(`Include patterns active: ${this.includePatterns.join(", ")}`);
	}
};
process.on("SIGINT", () => {
	console.error("Shutting down gracefully...");
	process.exit(0);
});
process.on("SIGTERM", () => {
	console.error("Shutting down gracefully...");
	process.exit(0);
});
const server = new HotReloadMCPServer();
server.start().catch(console.error);

//#endregion
//# sourceMappingURL=server.js.map