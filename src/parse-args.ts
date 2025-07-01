import { parseArgs as nodeParseArgs } from 'node:util';
import type { ParsedArgs } from './types.js';

export function parseArgs(argv: string[]): ParsedArgs {
  const result: ParsedArgs = {
    includePatterns: [],
    command: null,
    commandArgs: [],
    rawArgs: []
  };

  // Legacy cmd: support - check first
  const cmdIndex = argv.findIndex(arg => arg.startsWith('cmd:'));
  if (cmdIndex !== -1) {
    result.command = argv[cmdIndex].slice(4);
    result.commandArgs = argv.slice(cmdIndex + 1);
    return result;
  }

  // Find -- separator
  const dashIndex = argv.indexOf('--');
  const argsToParseIndex = dashIndex === -1 ? argv.length : dashIndex;
  const argsToParse = argv.slice(0, argsToParseIndex);
  
  // Parse with node:util parseArgs
  const { values, positionals } = nodeParseArgs({
    args: argsToParse,
    options: {
      include: {
        type: 'string',
        multiple: true,
        default: []
      }
    },
    strict: false,
    allowPositionals: true
  });

  // Handle include patterns
  if (values.include) {
    result.includePatterns = Array.isArray(values.include) ? values.include : [values.include];
  }

  // Handle command after --
  if (dashIndex !== -1 && dashIndex < argv.length - 1) {
    result.command = argv[dashIndex + 1];
    result.commandArgs = argv.slice(dashIndex + 2);
  }

  result.rawArgs = positionals;

  return result;
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