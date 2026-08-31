# Changelog

Changes to the SUNAGO Matrix MCP server, and to this documentation.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/). The server reports
its version in `serverInfo`; the current version is **0.3.0**.

Anything that removes a tool, renames one, or narrows what a tool is allowed to do is a
**breaking change** and is called out as one. Adding a tool is not.

## [Unreleased]

### Added

- This documentation repository, and the public
  [/mcp page](https://sunago-matrix.com/mcp) it accompanies.

## [0.3.0] - 2026-08-27

The release that moved the server onto the official MCP SDK and closed most of what was
missing around it. The tool count reached 105, including the two meta tools.

### Added

- **Prompts.** Four named starters a client can offer without anyone knowing a tool name: what is
  waiting on me, project status, log time, ready to invoice. The previous SDK could not expose
  prompts at all.
- **Expenses, notes and notifications.** 17 tools covering out-of-pocket expenses, notes with
  working @-mentions on leads, deals, contacts and tasks, and the caller's own notifications.
- **Deletion and restoration.** Soft delete to a 30-day recycle bin for leads, contacts, deals,
  projects and tasks, with matching restore tools and a searchable `list_trash`.
- **Names in place of ids.** 97 arguments now accept a name as readily as a UUID. The resolution
  happens in the wrapper every tool runs through, so no tool can be left out of it. An ambiguous
  name returns every candidate rather than picking one.
- **An audit trail.** Every write records the tool, the caller and the arguments as resolved,
  written by the wrapper so all tools are covered in one place.
- **Rate limiting on writes.** 120 per minute per user, measured on the audit trail. Reads are
  deliberately not limited.
- **Output schemas** on the 21 list tools.
- **A server icon** (SEP-973), so a connector card shows the SUNAGO mark rather than the mark of
  whoever hosts the endpoint.
- **`hr_get_roles`**, so roles can be validated against the roles a workspace actually has rather
  than against a hardcoded copy of an enum shared across every workspace.

### Changed

- **The implementation.** The server now runs on the official `@modelcontextprotocol/sdk` with a
  purpose-built OAuth resource server over `jose`, replacing a third-party wrapper. No behaviour
  visible to a client changed, but prompts and icons became possible.
- **The address.** Clients now connect to `https://sunago-matrix.com/mcp`, and the server
  advertises that as its resource. The consent screen is served from the SUNAGO domain too.
- **Lists default to active records.** `crm_get_leads`, `crm_get_deals`, `projects_get` and
  `tasks_get` previously counted archived projects and tasks, and leads and deals in a terminal
  status, as though they were live. "How many leads do I have" answered 386 where 265 were open.
  All four now default to active and state what they covered in `meta.scope_note`. **Breaking
  for anyone depending on the old totals.**
- **`projects_create` requires a manager**, matching what the application has always required.
- **`projects_create` answers with open questions** listing what the caller was not asked about.
  It is not validation; the project is created either way.
- **Revenue rules moved into the database**, so a save the application would refuse is refused
  here too, and the refusal says why.

### Fixed

- **Errors reach the agent.** The previous SDK swallowed them: 22 dropped error paths returned
  success, and writes reported an intended count rather than an actual one. A lint rule now
  catches the next occurrence.
- **`crm_create_contact` wrote to columns that do not exist** on the contacts table, so contacts
  were not created. Found by typing the database client, along with 24 other latent errors.
- **`employees.employment_type` and `role` were accepted as free text** where the database holds
  enums.
- **`tasks_get_dependencies` returned an id that could not be used to delete the dependency.**
- **A delete that removed nothing reported success.** It now refuses.

### Removed

- **Third-party telemetry.** Tool calls are no longer reported anywhere outside the workspace's
  own audit trail.

### Deliberately not included

Recorded here because their absence is a decision rather than a gap:

- `proposals_create` and `proposals_update`. Proposals stay read-only through MCP.
- Deleting a contract.
- `hr_delete_employee`.
- Setting the admin flag through `hr_update_employee`. `super_admin` is closed to MCP entirely.
- MCP resources. Everything is reachable through a tool call, and client support is uneven.
- Rate limiting on reads.

## [0.2.x] - 2026-08-02 to 2026-08-06

Not tracked in a changelog at the time. Reconstructed from the commit history for completeness;
treat the detail as indicative rather than exhaustive.

### Added

- The project lifecycle state for a project that has been closed automatically and is waiting on
  a manager's decision.

### Fixed

- `projects_get_pricing_groups` crashed on some workspaces.
- Two id and foreign-key mix-ups in project reads.
- `tool_invoke` ran a target tool's handler without validating against that tool's own input
  schema, so every argument default stayed undefined. A paginated read then came back empty while
  still reporting a non-zero total, which an agent reads as "no data". It now validates first.
- Time and materials projects did not earn revenue correctly.
- Delete guards were inconsistent between tools.

## Earlier

The server existed before this and was not versioned in public. Nothing before 0.2 is documented
here, because the record needed to write it accurately does not exist.
