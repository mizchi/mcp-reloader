#!/usr/bin/env node
import { buildCommand, parseArgs } from "./parse-args-CR4sYHDY.js";
import { spawn } from "child_process";
import chokidar from "chokidar";

//#region src/wrapper.ts
var ServerWrapper = class {
	serverProcess;
	isRestarting;
	includePatterns;
	command;
	commandArgs;
	isDirty;
	watchers;
	constructor(options) {
		this.serverProcess = null;
		this.isRestarting = false;
		this.includePatterns = options.includePatterns || [];
		this.command = options.command;
		this.commandArgs = options.commandArgs;
		this.isDirty = false;
		this.watchers = [];
	}
	start() {
		console.error("[Wrapper] Starting MCP server...");
		console.error(`[Wrapper] Command: ${this.command} ${this.commandArgs.join(" ")}`);
		if (this.includePatterns.length > 0) console.error(`[Wrapper] Include patterns: ${this.includePatterns.join(", ")}`);
		const env = { ...process.env };
		if (this.includePatterns.length > 0) env.MCP_HOT_RELOAD_INCLUDE = this.includePatterns.join(",");
		this.serverProcess = spawn(this.command, this.commandArgs, {
			stdio: [
				"inherit",
				"inherit",
				"pipe"
			],
			env
		});
		this.serverProcess.stderr?.on("data", (data) => {
			const message = data.toString();
			process.stderr.write(message);
			if (message.includes("marking server as dirty") && !this.isRestarting) {
				this.isDirty = true;
				console.error("[Wrapper] Server marked as dirty, scheduling restart...");
				setTimeout(() => this.restart(), 1e3);
			}
		});
		this.serverProcess.on("exit", (code, signal) => {
			if (!this.isRestarting) {
				console.error(`[Wrapper] Server exited with code ${code}, signal ${signal}`);
				process.exit(code || 0);
			}
		});
		this.serverProcess.on("error", (err) => {
			console.error("[Wrapper] Server process error:", err);
			process.exit(1);
		});
	}
	startWatching() {
		if (this.includePatterns.length > 0) {
			console.error("[Wrapper] Setting up file watchers for include patterns");
			const watcher = chokidar.watch(this.includePatterns, {
				persistent: true,
				ignoreInitial: true,
				cwd: process.cwd()
			});
			watcher.on("all", (event, path) => {
				if (!this.isDirty && !this.isRestarting) {
					console.error(`[Wrapper] Include file ${event}: ${path}, marking for restart`);
					this.isDirty = true;
					setTimeout(() => this.restart(), 1e3);
				}
			});
			this.watchers.push(watcher);
		}
	}
	async restart() {
		if (this.isRestarting || !this.isDirty) return;
		this.isRestarting = true;
		this.isDirty = false;
		console.error("[Wrapper] Restarting server...");
		if (this.serverProcess) {
			this.serverProcess.kill("SIGTERM");
			await new Promise((resolve) => {
				this.serverProcess.on("exit", resolve);
				setTimeout(() => {
					if (this.serverProcess && this.serverProcess.exitCode === null) this.serverProcess.kill("SIGKILL");
				}, 5e3);
			});
		}
		this.isRestarting = false;
		this.start();
	}
	async stop() {
		for (const watcher of this.watchers) await watcher.close();
		if (this.serverProcess) this.serverProcess.kill("SIGTERM");
	}
};
let wrapper = null;
process.on("SIGINT", async () => {
	console.error("[Wrapper] Received SIGINT, shutting down...");
	if (wrapper) await wrapper.stop();
	process.exit(0);
});
process.on("SIGTERM", async () => {
	console.error("[Wrapper] Received SIGTERM, shutting down...");
	if (wrapper) await wrapper.stop();
	process.exit(0);
});
const args = process.argv.slice(2);
const parsedArgs = parseArgs(args);
const { command, args: commandArgs } = buildCommand(parsedArgs);
wrapper = new ServerWrapper({
	includePatterns: parsedArgs.includePatterns,
	command,
	commandArgs
});
wrapper.start();
wrapper.startWatching();

//#endregion
//# sourceMappingURL=wrapper.js.map