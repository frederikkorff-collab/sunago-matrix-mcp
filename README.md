# SUNAGO Matrix MCP Server

Public documentation for the [Model Context Protocol](https://modelcontextprotocol.io) server
that connects AI assistants to a [SUNAGO Matrix](https://sunago-matrix.com) workspace.

```
https://sunago-matrix.com/mcp
```

SUNAGO Matrix is professional services automation software for consulting and engineering firms:
pipeline, proposals, resource planning, projects, timesheets, expenses and reporting in one
system. This server exposes that workspace to an assistant as **105 tools**, so you can ask
about your own business in the assistant you already use.

The server is included on every Matrix plan. There is no separate licence, no per-call charge,
and no API key to create.

## What you can do with it

Once connected, an assistant can answer questions and make changes on your behalf:

- Which projects are running over budget right now, and by how much?
- Log six hours on the Novo Nordisk integration for Tuesday, non-billable.
- Who is allocated above 100 percent in the next three weeks?
- What is in my pipeline that has not moved in a month?
- Which projects have work delivered but nothing invoiced yet?
- Add a risk to the Aarhus rollout: the client's test environment is not ready.

The server also publishes four named prompts, so a client can offer these as starting points
without anyone needing to know a tool name: **what is waiting on me**, **project status**,
**log time** and **ready to invoice**.

## Connect it

Full instructions for each client are in [QUICKSTART.md](QUICKSTART.md). The short version:

**Claude Code**

```bash
claude mcp add --transport http sunago-matrix https://sunago-matrix.com/mcp
```

Then run `/mcp` in a session and sign in through the browser.

**Claude (web and desktop)** - add a custom connector pointing at
`https://sunago-matrix.com/mcp`.

**Cursor** - `.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "sunago-matrix": {
      "url": "https://sunago-matrix.com/mcp"
    }
  }
}
```

**VS Code** - `.vscode/mcp.json`:

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

Ready-to-copy files are in [`examples/`](examples).

Once it is connected, ask your assistant to call `whoami`. It answers with who you are signed in
as and which permissions you hold, which both confirms the connection works and tells the
assistant what it is allowed to attempt.

## What it can touch

This is the part worth reading before you connect anything, and it is covered properly in
[PERMISSIONS.md](PERMISSIONS.md). In summary:

| | |
| --- | --- |
| Tools | 105 |
| Read-only | 31 |
| Can write | 74 |
| Can delete | 19 (5 recoverable, 13 permanent, 1 unlinks rather than deletes) |
| Require a human-supplied confirmation phrase | 10 |
| Behind a `finance` permission | 8 (4 read, 4 write) |

Three properties hold across all of them:

1. **It runs as you.** Every call carries your own verified session token and reaches the
   database as you, under row-level security. There is no shared service key and no
   administrative bypass, so a connection cannot reach a workspace you do not belong to.

2. **Your existing permissions still apply.** Each tool checks the same feature permission the
   Matrix interface checks. Without it, the tool refuses and names the permission that is
   missing, so the assistant can tell you which admin to ask.

3. **Deleting a record is reversible; deleting a line item is not.** The five top-level records
   (lead, contact, deal, project, task) soft-delete to a recycle bin for 30 days and can be
   restored, and only a workspace admin can delete one at all. Line items, and your own notes and
   notifications, are deleted for good, and 10 of those 13 tools refuse to run until a human
   supplies an exact confirmation phrase. [PERMISSIONS.md](PERMISSIONS.md) has the full split.

There is deliberately **no tool** for issuing or sending an invoice, recording a payment,
reading or writing anyone's salary, touching bank or card details, granting permissions,
creating or editing a proposal, deleting a contract, or deleting an employee.

## Documentation

| | |
| --- | --- |
| [QUICKSTART.md](QUICKSTART.md) | Connecting each client, first calls, and what to do when it fails |
| [TOOLS.md](TOOLS.md) | All 105 tools, what each one does, and the permission behind it |
| [PERMISSIONS.md](PERMISSIONS.md) | The authorisation model in full, including read against write on financial data |
| [CHANGELOG.md](CHANGELOG.md) | Every change to the tool surface |
| [examples/](examples) | Configuration files to copy |

## Technical summary

| | |
| --- | --- |
| Endpoint | `https://sunago-matrix.com/mcp` |
| Transport | MCP over streamable HTTP |
| Authentication | OAuth 2.1, discovered from the protected-resource metadata (RFC 9728) |
| Metadata | `https://sunago-matrix.com/.well-known/oauth-protected-resource/mcp` |
| Server version | 0.3.0 |
| Implementation | The official `@modelcontextprotocol/sdk`, with token verification over `jose` |
| Session model | Stateless. A fresh server per request, so no session is shared between callers |
| Rate limit | 120 writes per minute per user. Reads are not limited |
| Audit | Every write is recorded with the tool, the caller and the resolved arguments |

There is no local install, no `npx` command and no process to run. It is a remote server; point a
client at the URL.

## Two conveniences worth knowing about

**Names work as well as ids.** Every reference argument accepts a name as readily as a UUID:
`project_id`, `manager_id`, `employee_id`, `customer_id`, `deal_id`, `lead_id` and the rest. Say
"Novo Nordisk" or "Morten Fabrin" and the server resolves it. If the name matches more than one
record, the tool answers with every candidate and its id so the assistant can ask you rather than
guess.

**Lists always paginate.** Every list response carries `pagination.total` for the full match
count plus `has_more`. An assistant that totals a single page while `has_more` is true is
counting wrong, and the tool descriptions say so.

## Not building an assistant?

SUNAGO Matrix also has a REST API, outbound webhooks and an official Zapier integration, which
cover the same ground for conventional software. See
[sunago-matrix.com/api-docs](https://sunago-matrix.com/api-docs).

## Reporting a problem

Open an issue in this repository for anything about the documentation or the tool surface. For
anything touching your own workspace data, or a suspected security issue, email
[sunago@sunago-group.com](mailto:sunago@sunago-group.com) rather than filing publicly.

## Licence

[MIT](LICENSE). The documentation and configuration examples in this repository are free to
copy and adapt. The SUNAGO Matrix service itself is a commercial product, and the licence here
does not grant any right to it or to the SUNAGO name and marks.
