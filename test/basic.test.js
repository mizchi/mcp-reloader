import { parseArgs } from '../dist/parse-args.js';
import assert from 'assert';

// Basic test for parseArgs
const result = parseArgs(['--include', '*.js', '--', 'node', 'server.js']);

assert.deepEqual(result.includePatterns, ['*.js']);
assert.equal(result.command, 'node');
assert.deepEqual(result.commandArgs, ['server.js']);

console.log('✅ Basic tests passed');