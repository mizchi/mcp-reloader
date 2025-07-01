#!/bin/bash

echo "🚀 Testing -- (double dash) argument separator"
echo "============================================"
echo ""

# Test 1: Basic usage with --
echo "Test 1: Basic usage with --"
echo "Command: node src/wrapper.js -- node src/server.js"
echo ""

# Test 2: Complex arguments with spaces and special characters
echo "Test 2: Complex arguments with spaces"
echo 'Command: node src/wrapper.js --include "**/*.yaml" -- python script.py --message "Hello World!" --path "/path with spaces/"'
echo ""

# Test 3: Node.js with experimental flags
echo "Test 3: Node.js with experimental flags"
echo "Command: node src/wrapper.js --include '**/*.ts' -- node --experimental-specifier-resolution=node ./dist/server.js --config ./config.json"
echo ""

# Test 4: Comparison with legacy cmd: format
echo "Test 4: Legacy cmd: format (still supported)"
echo "Command: node src/wrapper.js cmd:python server.py --port 3000"
echo ""

echo "Benefits of -- over cmd:"
echo "1. No need to escape colons in file paths"
echo "2. Clearer separation between wrapper args and command args"
echo "3. Standard Unix convention"
echo "4. Easier to use with complex command lines"
echo ""

# Create a test Python script
cat > test-server.py << 'EOF'
#!/usr/bin/env python3
import sys
print(f"Python test server started with args: {sys.argv[1:]}")
while True:
    pass
EOF
chmod +x test-server.py

echo "Running test with --include and -- separator..."
echo "Command: node src/wrapper.js --include 'test-server.py' -- python test-server.py --port 3000 --debug"
echo ""
echo "Expected behavior:"
echo "1. Wrapper starts with include pattern 'test-server.py'"
echo "2. Python script runs with arguments: --port 3000 --debug"
echo "3. If test-server.py is modified, the entire process restarts"
echo ""

# Cleanup
rm -f test-server.py