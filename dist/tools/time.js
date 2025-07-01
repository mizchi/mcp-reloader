//#region src/tools/time.js
var time_default = {
	name: "get_time",
	description: "Get current time",
	inputSchema: {
		type: "object",
		properties: { format: {
			type: "string",
			description: "Time format (iso, unix, locale)",
			enum: [
				"iso",
				"unix",
				"locale"
			]
		} }
	},
	handler: async ({ format = "iso" }) => {
		const now = /* @__PURE__ */ new Date();
		switch (format) {
			case "unix": return String(Math.floor(now.getTime() / 1e3));
			case "locale": return now.toLocaleString();
			default: return now.toISOString();
		}
	}
};

//#endregion
export { time_default as default };
//# sourceMappingURL=time.js.map