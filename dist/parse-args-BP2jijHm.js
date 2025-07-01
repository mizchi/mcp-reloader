import { parseArgs } from "node:util";

//#region src/parse-args.ts
function parseArgs$1(argv) {
	const result = {
		includePatterns: [],
		command: null,
		commandArgs: [],
		rawArgs: []
	};
	const cmdIndex = argv.findIndex((arg) => arg.startsWith("cmd:"));
	if (cmdIndex !== -1) {
		result.command = argv[cmdIndex].slice(4);
		result.commandArgs = argv.slice(cmdIndex + 1);
		return result;
	}
	const dashIndex = argv.indexOf("--");
	const argsToParseIndex = dashIndex === -1 ? argv.length : dashIndex;
	const argsToParse = argv.slice(0, argsToParseIndex);
	const { values, positionals } = parseArgs({
		args: argsToParse,
		options: { include: {
			type: "string",
			multiple: true,
			default: []
		} },
		strict: false,
		allowPositionals: true
	});
	if (values.include) result.includePatterns = Array.isArray(values.include) ? values.include : [values.include];
	if (dashIndex !== -1 && dashIndex < argv.length - 1) {
		result.command = argv[dashIndex + 1];
		result.commandArgs = argv.slice(dashIndex + 2);
	}
	result.rawArgs = positionals;
	return result;
}
function buildCommand(parsedArgs) {
	if (parsedArgs.command) return {
		command: parsedArgs.command,
		args: parsedArgs.commandArgs
	};
	return {
		command: "node",
		args: ["dist/server.js"]
	};
}

//#endregion
export { buildCommand, parseArgs$1 as parseArgs };
//# sourceMappingURL=parse-args-BP2jijHm.js.map