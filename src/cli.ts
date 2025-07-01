#!/usr/bin/env node
import { spawn } from "child_process";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const wrapperPath = join(__dirname, "wrapper.js");

// Pass all arguments to the wrapper
const args = process.argv.slice(2);
const child = spawn("node", [wrapperPath, ...args], {
  stdio: "inherit",
  env: process.env
});

child.on("exit", (code) => {
  process.exit(code || 0);
});