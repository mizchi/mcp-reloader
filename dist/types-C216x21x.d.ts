//#region src/types.d.ts
interface Tool {
  name: string;
  description?: string;
  inputSchema?: {
    type: string;
    properties?: Record<string, any>;
    required?: string[];
  };
  handler: (params: any) => Promise<string | any>;
}
interface ParsedArgs {
  includePatterns: string[];
  command: string | null;
  commandArgs: string[];
  rawArgs: string[];
}
interface WrapperOptions {
  includePatterns: string[];
  command: string;
  commandArgs: string[];
}
//# sourceMappingURL=types.d.ts.map
//#endregion
export { ParsedArgs, Tool, WrapperOptions };
//# sourceMappingURL=types-C216x21x.d.ts.map