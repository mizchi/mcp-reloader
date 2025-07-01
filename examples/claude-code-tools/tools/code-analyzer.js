// Example tool for analyzing code structure
export default {
  name: "analyze_code",
  description: "Analyze code structure and patterns",
  inputSchema: {
    type: "object",
    properties: {
      filePath: {
        type: "string",
        description: "Path to the code file to analyze"
      },
      analysis: {
        type: "string",
        enum: ["functions", "imports", "exports", "classes", "lines"],
        description: "Type of analysis to perform"
      }
    },
    required: ["filePath", "analysis"]
  },
  handler: async ({ filePath, analysis }) => {
    const fs = await import('fs/promises');
    
    try {
      const content = await fs.readFile(filePath, 'utf8');
      const lines = content.split('\n');
      
      switch (analysis) {
        case "functions":
          const functions = content.match(/(?:function\s+(\w+)|const\s+(\w+)\s*=\s*(?:async\s*)?\()/g) || [];
          return `Found ${functions.length} functions:\n${functions.join('\n')}`;
          
        case "imports":
          const imports = lines.filter(line => line.trim().startsWith('import'));
          return `Found ${imports.length} imports:\n${imports.join('\n')}`;
          
        case "exports":
          const exports = lines.filter(line => line.includes('export'));
          return `Found ${exports.length} exports:\n${exports.join('\n')}`;
          
        case "classes":
          const classes = content.match(/class\s+(\w+)/g) || [];
          return `Found ${classes.length} classes:\n${classes.join('\n')}`;
          
        case "lines":
          const nonEmptyLines = lines.filter(line => line.trim().length > 0);
          return `File has ${lines.length} total lines (${nonEmptyLines.length} non-empty)`;
          
        default:
          throw new Error(`Unknown analysis type: ${analysis}`);
      }
    } catch (error) {
      return `Error analyzing file: ${error.message}`;
    }
  }
};