#!/usr/bin/env node
import { spawn, ChildProcess } from "child_process";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import chokidar from "chokidar";
import { parseArgs, buildCommand } from "./parse-args.js";
import type { WrapperOptions } from './types.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

class ServerWrapper {
  private serverProcess: ChildProcess | null;
  private isRestarting: boolean;
  private includePatterns: string[];
  private command: string;
  private commandArgs: string[];
  private isDirty: boolean;
  private watchers: chokidar.FSWatcher[];

  constructor(options: WrapperOptions) {
    this.serverProcess = null;
    this.isRestarting = false;
    this.includePatterns = options.includePatterns || [];
    this.command = options.command;
    this.commandArgs = options.commandArgs;
    this.isDirty = false;
    this.watchers = [];
  }

  start(): void {
    console.error("[Wrapper] Starting MCP server...");
    console.error(`[Wrapper] Command: ${this.command} ${this.commandArgs.join(' ')}`);
    
    if (this.includePatterns.length > 0) {
      console.error(`[Wrapper] Include patterns: ${this.includePatterns.join(', ')}`);
    }
    
    // Set environment variable for include patterns
    const env = { ...process.env };
    if (this.includePatterns.length > 0) {
      env.MCP_HOT_RELOAD_INCLUDE = this.includePatterns.join(',');
    }
    
    this.serverProcess = spawn(this.command, this.commandArgs, {
      stdio: ["inherit", "inherit", "pipe"],
      env: env
    });

    // Monitor stderr for dirty notifications
    this.serverProcess.stderr?.on("data", (data: Buffer) => {
      const message = data.toString();
      process.stderr.write(message);
      
      // Check for dirty state from the server
      if (message.includes("marking server as dirty") && !this.isRestarting) {
        this.isDirty = true;
        console.error("[Wrapper] Server marked as dirty, scheduling restart...");
        setTimeout(() => this.restart(), 1000); // Delay to batch multiple changes
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

  startWatching(): void {
    // Set up file watchers for include patterns
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
          setTimeout(() => this.restart(), 1000); // Delay to batch multiple changes
        }
      });

      this.watchers.push(watcher);
    }
  }

  async restart(): Promise<void> {
    if (this.isRestarting || !this.isDirty) return;
    
    this.isRestarting = true;
    this.isDirty = false;
    console.error("[Wrapper] Restarting server...");
    
    // Kill the current process
    if (this.serverProcess) {
      this.serverProcess.kill("SIGTERM");
      
      // Wait for process to exit
      await new Promise<void>((resolve) => {
        this.serverProcess!.on("exit", resolve);
        // Force kill after timeout
        setTimeout(() => {
          if (this.serverProcess && this.serverProcess.exitCode === null) {
            this.serverProcess.kill("SIGKILL");
          }
        }, 5000);
      });
    }
    
    // Start new process
    this.isRestarting = false;
    this.start();
  }

  async stop(): Promise<void> {
    // Close all watchers
    for (const watcher of this.watchers) {
      await watcher.close();
    }
    
    // Kill server process
    if (this.serverProcess) {
      this.serverProcess.kill("SIGTERM");
    }
  }
}

// Global wrapper instance for signal handlers
let wrapper: ServerWrapper | null = null;

// Handle signals
process.on("SIGINT", async () => {
  console.error("[Wrapper] Received SIGINT, shutting down...");
  if (wrapper) {
    await wrapper.stop();
  }
  process.exit(0);
});

process.on("SIGTERM", async () => {
  console.error("[Wrapper] Received SIGTERM, shutting down...");
  if (wrapper) {
    await wrapper.stop();
  }
  process.exit(0);
});

// Parse command line arguments
const args = process.argv.slice(2);
const parsedArgs = parseArgs(args);
const { command, args: commandArgs } = buildCommand(parsedArgs);

// Start the wrapper
wrapper = new ServerWrapper({
  includePatterns: parsedArgs.includePatterns,
  command,
  commandArgs
});

wrapper.start();
wrapper.startWatching();