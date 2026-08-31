# Quickstart

Connecting an AI assistant to your SUNAGO Matrix workspace takes about a minute. There is
nothing to install and no key to generate.

```
https://sunago-matrix.com/mcp
```

## Before you start

You need two things:

- **A SUNAGO Matrix account.** The connection signs you in as yourself, so nothing has to be set
  up in the workspace first, and you do not need to be an admin.
- **A client that supports remote MCP servers.** If yours predates remote server support, it
  will not find this one.

You do not need an API key, a client secret, an allowlist entry, or any configuration on our
side.

## Claude Code

```bash
claude mcp add --transport http sunago-matrix https://sunago-matrix.com/mcp
```

Then start a session and run:

```
/mcp
```

Follow the browser sign-in. The token is stored and refreshed automatically.

Add `--scope user` to make the server available in every project rather than only the current
one:

```bash
claude mcp add --transport http sunago-matrix --scope user https://sunago-matrix.com/mcp
```

Recent versions can also authenticate straight from the shell with `claude mcp login
sunago-matrix`, and clear the stored credentials with `claude mcp logout sunago-matrix`.

## Claude (web and desktop)

Add it as a **custom connector**:

1. Open your connector settings in Claude.
2. Choose to add a custom connector.
3. Paste `https://sunago-matrix.com/mcp` as the remote MCP server URL.
4. Add it, and complete the Matrix sign-in when Claude sends you there.

Leave the advanced OAuth client id and secret fields empty. The server registers clients
dynamically, so there is nothing to fill in.

The connector then appears in the tools menu of a new conversation. Anthropic's own walkthrough
is [here](https://support.claude.com/en/articles/11175166-get-started-with-custom-connectors-using-remote-mcp).

## Cursor

Put this in `.cursor/mcp.json` in the project, or in `~/.cursor/mcp.json` to have it everywhere:

```json
{
  "mcpServers": {
    "sunago-matrix": {
      "url": "https://sunago-matrix.com/mcp"
    }
  }
}
```

Cursor starts the OAuth flow the first time a tool is called.

## VS Code

Put this in `.vscode/mcp.json` in the workspace:

```json
{
  "servers": {
    "sunago-matrix": {
      "type": "http",
      "url": "https://sunago-matrix.com/mcp"
    }
  }
}
```

## Any other client

The server speaks MCP over streamable HTTP and authenticates with OAuth 2.1. A client that
supports remote MCP servers needs only the URL: it discovers where to sign in from the
protected-resource metadata the server publishes, per RFC 9728.

```bash
curl https://sunago-matrix.com/.well-known/oauth-protected-resource/mcp
```

```json
{
  "resource": "https://sunago-matrix.com/mcp",
  "authorization_servers": ["https://<project>.supabase.co/auth/v1"],
  "bearer_methods_supported": ["header"],
  "resource_name": "Sunago Matrix"
}
```

An unauthenticated request answers `401` with a `WWW-Authenticate` header naming that document,
which is how a client finds its way in.

## Your first calls

**Confirm the connection.** Ask the assistant to call `whoami`. It comes back with who you are
signed in as and which feature permissions you hold. That both proves the connection works and
tells the assistant what it is allowed to attempt, which makes everything after it better.

**Then ask a real question.** These each exercise a different part of the server:

- *"What is waiting on me?"* - one of the four built-in prompts, and a good first read.
- *"Which projects are running over budget?"* - reads projects and their financials. Needs
  `finance.view`; if you do not have it, the tool says so by name.
- *"Log four hours on <project> for yesterday."* - a write, so you can see what one looks like
  before you rely on it.

**Ask it to look something up by name.** Every reference argument takes a name as readily as an
id, so "how is the Novo Nordisk project going" works without you finding a UUID first. Where a
name is ambiguous the tool returns every candidate rather than picking one, and the assistant
should put the choice back to you.

## When something goes wrong

**"You don't have access to X in Matrix (missing 'x.view' permission)."**
Working as intended. The server refuses anything your own Matrix account cannot do, and names
the permission so you know what to ask an admin for. This is not a connection problem.

**The client cannot find the server.**
Check the URL has no trailing slash and no path after `/mcp`. Then confirm the client supports
remote MCP servers at all; a client that only supports local `stdio` servers cannot connect to
this one, and there is no local shim to install.

**Sign-in opens but never comes back.**
In Claude Code, if the browser redirect fails you can paste the full callback URL from the
address bar into the prompt the CLI shows. Elsewhere, clear the client's stored credentials for
this server and connect again.

**A tool returns nothing where you expected rows.**
Check `pagination.total` in the response rather than counting the rows you can see. Lists
paginate, and `has_more` tells you whether the page is the whole answer. Also note that lists of
leads, deals, projects and tasks default to **active** records: archived projects and tasks, and
leads and deals in a terminal status, are left out unless you ask for them. Every response says
which in `meta.scope_note`.

**A destructive tool refuses.**
Some tools require a confirmation phrase supplied by a human. The tool tells the assistant
exactly what phrase it needs, and tells it in as many words not to invent one. Give it to the
assistant yourself, or run the deletion in Matrix.

**Writes start failing after a burst.**
Writes are limited to 120 per minute per user. That ceiling is far above deliberate use, so
hitting it usually means an agent is looping. Reads are not limited.

## Where to go next

- [TOOLS.md](TOOLS.md) - every tool and the permission behind it
- [PERMISSIONS.md](PERMISSIONS.md) - the authorisation model, including read against write on
  financial data
- [sunago-matrix.com/mcp](https://sunago-matrix.com/mcp) - the same material as a web page
