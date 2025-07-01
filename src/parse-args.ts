import type { ParsedArgs } from './types.js';

export function parseArgs(argv: string[]): ParsedArgs {
  const args: ParsedArgs = {
    includePatterns: [],
    command: null,
    commandArgs: [],
    rawArgs: []
  };

  let i = 0;
  while (i < argv.length) {
    const arg = argv[i];
    
    if (arg === '--include') {
      // Get the next argument as the include pattern
      i++;
      if (i < argv.length) {
        args.includePatterns.push(argv[i]);
      }
    } else if (arg === '--') {
      // Everything after -- is the command and its arguments
      const remainingArgs = argv.slice(i + 1);
      if (remainingArgs.length > 0) {
        args.command = remainingArgs[0];
        args.commandArgs = remainingArgs.slice(1);
      }
      break; // Stop processing after --
    } else if (arg.startsWith('cmd:')) {
      // Legacy support: Everything after cmd: is the command and its arguments
      args.command = arg.slice(4); // Remove 'cmd:' prefix
      args.commandArgs = argv.slice(i + 1);
      break; // Stop processing after cmd:
    } else {
      args.rawArgs.push(arg);
    }
    i++;
  }

  return args;
}

export function buildCommand(parsedArgs: ParsedArgs): { command: string; args: string[] } {
  if (parsedArgs.command) {
    return {
      command: parsedArgs.command,
      args: parsedArgs.commandArgs
    };
  }
  
  // Default to running the local server
  return {
    command: "node",
    args: ["dist/server.js"]
  };
}