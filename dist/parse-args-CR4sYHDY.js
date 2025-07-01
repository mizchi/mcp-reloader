//#region src/parse-args.ts
function parseArgs(argv) {
	const args = {
		includePatterns: [],
		command: null,
		commandArgs: [],
		rawArgs: []
	};
	let i = 0;
	while (i < argv.length) {
		const arg = argv[i];
		if (arg === "--include") {
			i++;
			if (i < argv.length) args.includePatterns.push(argv[i]);
		} else if (arg === "--") {
			const remainingArgs = argv.slice(i + 1);
			if (remainingArgs.length > 0) {
				args.command = remainingArgs[0];
				args.commandArgs = remainingArgs.slice(1);
			}
			break;
		} else if (arg.startsWith("cmd:")) {
			args.command = arg.slice(4);
			args.commandArgs = argv.slice(i + 1);
			break;
		} else args.rawArgs.push(arg);
		i++;
	}
	return args;
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
export { buildCommand, parseArgs };
//# sourceMappingURL=parse-args-CR4sYHDY.js.map