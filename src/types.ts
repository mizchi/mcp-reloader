export interface Tool {
  name: string;
  description?: string;
  inputSchema?: {
    type: string;
    properties?: Record<string, any>;
    required?: string[];
  };
  handler: (params: any) => Promise<string | any>;
}

export interface ParsedArgs {
  includePatterns: string[];
  command: string | null;
  commandArgs: string[];
  rawArgs: string[];
}

export interface WrapperOptions {
  includePatterns: string[];
  command: string;
  commandArgs: string[];
}