//#region src/tools/debug.js
var debug_default = {
	name: "debug_info",
	description: "Get debug information about the MCP server",
	inputSchema: {
		type: "object",
		properties: { type: {
			type: "string",
			enum: [
				"env",
				"tools",
				"memory",
				"all"
			],
			description: "Type of debug info to retrieve",
			default: "all"
		} }
	},
	handler: async ({ type = "all" }) => {
		const debugInfo = {};
		if (type === "env" || type === "all") debugInfo.environment = {
			nodeVersion: process.version,
			platform: process.platform,
			uptime: process.uptime(),
			cwd: process.cwd(),
			timestamp: (/* @__PURE__ */ new Date()).toISOString()
		};
		if (type === "memory" || type === "all") {
			const mem = process.memoryUsage();
			debugInfo.memory = {
				rss: `${Math.round(mem.rss / 1024 / 1024)}MB`,
				heapTotal: `${Math.round(mem.heapTotal / 1024 / 1024)}MB`,
				heapUsed: `${Math.round(mem.heapUsed / 1024 / 1024)}MB`,
				external: `${Math.round(mem.external / 1024 / 1024)}MB`
			};
		}
		if (type === "tools" || type === "all") debugInfo.tools = { message: "Tool list would be shown here if accessible from handler context" };
		return JSON.stringify(debugInfo, null, 2);
	}
};

//#endregion
export { debug_default as default };
//# sourceMappingURL=debug.js.map