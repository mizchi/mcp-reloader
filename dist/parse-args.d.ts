import { ParsedArgs } from "./types-C216x21x.js";

//#region src/parse-args.d.ts
declare function parseArgs(argv: string[]): ParsedArgs;
declare function buildCommand(parsedArgs: ParsedArgs): {
  command: string;
  args: string[];
};
//# sourceMappingURL=parse-args.d.ts.map
//#endregion
export { buildCommand, parseArgs };
//# sourceMappingURL=parse-args.d.ts.map