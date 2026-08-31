#!/usr/bin/env bash
# Add the SUNAGO Matrix MCP server to Claude Code.
#
# --scope user makes it available in every project. Drop the flag to add it to
# the current project only.
#
# After this, run /mcp in a Claude Code session and complete the browser
# sign-in. The token is stored and refreshed automatically.
set -euo pipefail

claude mcp add --transport http sunago-matrix --scope user https://sunago-matrix.com/mcp

echo
echo "Added. Now run /mcp in a Claude Code session to sign in,"
echo "then ask your assistant to call whoami."
