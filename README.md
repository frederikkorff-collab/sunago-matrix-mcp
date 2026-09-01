# SUNAGO Matrix MCP Server

**Connect Claude, Cursor, VS Code or any MCP client to your consulting firm's project data.**

A remote [Model Context Protocol](https://modelcontextprotocol.io) server for
[SUNAGO Matrix](https://sunago-matrix.com), the professional services automation platform for
consulting and engineering firms. It exposes projects, CRM, tasks, timesheets, expenses, resource
planning, HR and reporting as **105 tools**, so you can ask an AI assistant about your own
business instead of exporting a spreadsheet.

```
https://sunago-matrix.com/mcp
```

No install, no API key, no npm package. It is a hosted remote server: point a client at the URL,
sign in, and every call runs as you, under your own permissions.

| | |
| --- | --- |
| **Endpoint** | `https://sunago-matrix.com/mcp` |
| **Transport** | Streamable HTTP |
| **Auth** | OAuth 2.1, discovered from RFC 9728 protected-resource metadata |
| **Tools** | 105 (31 read-only, 74 can write) |
| **Prompts** | 4 |
| **Registry name** | `com.sunago-matrix/matrix` |
| **Product page** | [AI project management](https://sunago-matrix.com/ai-project-management) |

---

## Quick start

**Claude Code**

```bash
claude mcp add --transport http sunago-matrix https://sunago-matrix.com/mcp
```

Then run `/mcp` in a session and complete the browser sign-in.

**Claude (web and desktop)** - add a custom connector pointing at `https://sunago-matrix.com/mcp`.

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

Full instructions, including troubleshooting, are in [QUICKSTART.md](QUICKSTART.md). Ready-made
config files are in [`examples/`](examples).

Once connected, ask your assistant to call `whoami`. It answers with who you are signed in as and
which permissions you hold, which confirms the connection and tells the assistant what it is
allowed to attempt.

---

## What you can ask it

- *Which projects are running over budget right now, and by how much?*
- *Log six hours on the Novo Nordisk integration for Tuesday, non-billable.*
- *Who is allocated above 100 percent in the next three weeks?*
- *What is in my pipeline that has not moved in a month?*
- *Which fixed-fee milestones are due but still not marked invoiced?*
- *Add a risk to the Aarhus rollout: the client's test environment is not ready.*

Four named prompts ship with the server, so a client can offer these without anyone knowing a
tool name: **what is waiting on me**, **project status**, **log time** and **ready to invoice**.

Two conveniences worth knowing about:

- **Names work as well as ids.** Reference arguments accept a name as readily as a UUID, resolved
  in the wrapper every tool runs through. Say "Novo Nordisk" or a colleague's name; if it matches
  more than one record the tool returns every candidate rather than guessing.
- **Lists always paginate.** Every list response carries `pagination.total` and `has_more`, so an
  assistant that totals one page is told it is counting wrong.

---

## The tools

105 tools across the product. Full reference with the permission behind each one:
**[TOOLS.md](TOOLS.md)**.

| Area | Tools | What it covers |
| --- | --- | --- |
| [Projects](TOOLS.md#projects) | 39 | Projects, team, materials, external services, risks, budgets, billing plans, invoicing settings |
| [CRM](TOOLS.md#crm) | 20 | Leads, contacts, deals, follow-ups |
| [Time and expenses](TOOLS.md#time-and-expenses) | 13 | Logging hours, approvals, out-of-pocket expenses |
| [Tasks](TOOLS.md#tasks) | 8 | Tasks on projects and the dependencies between them |
| [Resource planning](TOOLS.md#resource-planning) | 4 | Allocating people across projects over time |
| [HR](TOOLS.md#hr) | 4 | Employees and the workspace's own roles |
| [Notes](TOOLS.md#notes) | 4 | Notes with @-mentions on a lead, deal, contact or task |
| [Notifications](TOOLS.md#notifications) | 4 | Your own notifications, and messages to colleagues |
| [Contracts](TOOLS.md#contracts) | 3 | Contracts attached to deals and projects |
| [Proposals](TOOLS.md#proposals) | 1 | Proposal documents, read-only by choice |
| [Reports](TOOLS.md#reports) | 1 | Finished reports rather than raw rows |
| [Recycle bin](TOOLS.md#recycle-bin) | 1 | Deleted records, kept for 30 days |
| [Identity](TOOLS.md#identity) | 1 | Who you are and what you may see |
| [Meta](TOOLS.md#meta) | 2 | Find a tool by keyword, call one by name |

---

## What it is allowed to touch

Worth reading before connecting an assistant to a system that holds your project economy. The
full model is in **[PERMISSIONS.md](PERMISSIONS.md)**; the shape of it:

**It runs as you.** Every call carries your own verified session token and reaches the database as
you, under row-level security. There is no service-role key anywhere in the server and no
administrative bypass, so a connection cannot reach a workspace you do not belong to.

**Your existing permissions still apply.** Each tool checks the same feature permission the
Matrix interface checks, and a refusal names the permission that is missing so you know what to
ask an admin for.

**Deletion is not uniform, and the docs say so.** Five deletes are soft: 30 days in the recycle
bin, admin only. Thirteen are permanent, and ten of those refuse to run until a human supplies an
exact confirmation phrase. Twelve tools in all are restricted to workspace admins.

**Money is gated separately.** Four tools read financial data behind `finance.view`; four write
behind `finance.create` or `finance.edit`. No tool issues an invoice, sends one, or records a
payment. No tool reads or writes an annual salary, a gross hourly rate, a national ID, or any
bank or card detail.

**Two capabilities go further than the rest, and are documented rather than left to be
discovered:** the cost per hour derived from salary is returned per named employee by the
utilisation report and by the cost repair tool, to callers who already hold `reports.view` or
`time.approve`; and `hr_update_employee` can grant or remove workspace administrator rights
behind `hr.edit`. Both are the same authority the person already has in the Matrix interface.

**Everything is written down.** Every write leaves an audit row carrying the tool, the caller and
the arguments as the server resolved them, written by the wrapper all 105 tools run through.
Writes are capped at 120 per minute per user. Reads are neither recorded nor limited.

---

## About SUNAGO Matrix

[SUNAGO Matrix](https://sunago-matrix.com) is
[professional services automation software](https://sunago-matrix.com/features) built for
consulting and engineering firms: the pipeline, the proposal and its digital signature, the
resource plan, the project, the hours logged against it, the expenses, and the reporting over the
top, in one system.

What separates it from the category is how it costs work. Most systems derive an hourly cost by
dividing annual salary by a nominal year. Matrix derives it from capacity, vacation and the
utilisation a person actually achieves, and carries that rate through every margin and forecast
in the product. That is why the MCP server can answer "is this project making money" rather than
only "how many hours were logged".

- [Project cost tracking](https://sunago-matrix.com/features/project-cost-tracking) - real cost per hour, live margin, forecast at completion
- [Resource planning](https://sunago-matrix.com/features/resource-planning) - capacity and allocation across consultants
- [Timesheet software](https://sunago-matrix.com/features/timesheet-software) - billable and non-billable time with approvals
- [CRM for consulting firms](https://sunago-matrix.com/features/crm-consulting-firms) - pipeline, proposals and contracts
- [Cloud project management](https://sunago-matrix.com/features/cloud-project-management) - budgets, phases, milestones, dependencies
- [KPI reporting](https://sunago-matrix.com/features/consulting-kpi-reporting) - utilisation, realisation and firm-level KPIs
- [Pricing](https://sunago-matrix.com/prices) - one plan, every module included, 14-day free trial

Not building an assistant? There is also a
[REST API, webhooks and a Zapier integration](https://sunago-matrix.com/api-docs).

---

## Documentation

| | |
| --- | --- |
| [QUICKSTART.md](QUICKSTART.md) | Connecting each client, first calls, troubleshooting |
| [TOOLS.md](TOOLS.md) | All 105 tools and the permission behind each |
| [PERMISSIONS.md](PERMISSIONS.md) | The authorisation model in full |
| [CHANGELOG.md](CHANGELOG.md) | Changes to the tool surface |
| [server.json](server.json) | MCP Registry metadata |
| [examples/](examples) | Configuration files to copy |

## How this stays true

Nothing countable in this repository is written by hand. `data/tools.json` is generated from the
server's own tool definitions and from the permission gate each handler runs before it acts, and
`TOOLS.md` is rendered from that. The prose claims are checked too: `data/verified-claims.json`
lists every factual statement made here and on
[sunago-matrix.com/ai-project-management](https://sunago-matrix.com/ai-project-management), each
paired with the file and pattern in the server source that proves it. A claim without a check does not get published.

This exists because an earlier draft of these pages carried six statements that were not true of
the code. The numbers were generated and were right; the sentences were hand-written and were
not.

## Reporting a problem

Open an issue here for anything about the documentation or the tool surface. For anything
touching your own workspace data, or a suspected security issue, email
[sunago@sunago-group.com](mailto:sunago@sunago-group.com) rather than filing publicly.

## Licence

[MIT](LICENSE). The documentation and configuration examples here are free to copy and adapt.
SUNAGO Matrix itself is a commercial service, and this licence grants no right to it or to the
SUNAGO name and marks.
