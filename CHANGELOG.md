# Changelog

Changes to the SUNAGO Matrix MCP server, and to this documentation.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/). The server reports
its version in `serverInfo`; the current version is **0.3.0**.

Anything that removes a tool, renames one, or narrows what a tool is allowed to do is a
**breaking change** and is called out as one. Adding a tool is not.

## [Unreleased]

### Added

- This documentation repository, and the public
  [AI project management page](https://sunago-matrix.com/ai-project-management) it accompanies.
- **Names next to ids.** `timelog_get_entries` carries the employee's name and the project's
  title, `resources_get` the employee's name and the project's title and status,
  `crm_get_followups` the name of the lead, deal or contact and of the assignee,
  `projects_get_team_allocation` and `projects_get_risks` the people's names, and both
  `reports_get` kinds that list ids (`time_summary`, `project_finance_summary`) the names too.
- **Weekly utilisation in `resources_get`.** With `from_date` and `to_date` the response carries,
  per employee and per workspace week, capacity hours, committed hours and a percentage computed
  by the same rules as the Resources tab in Matrix: day-level project allocations on projects that
  are neither Completed nor Archived, plus manual allocations, against the employee's own capacity.
  The calculation is a shared module with its own tests.
- **Follow-up filters.** `crm_get_followups` takes `due_after`, `due_before` and `overdue`, and
  every row says whether it is overdue.
- **`hr_get_employees` returns `weekly_capacity_percentage`**, and its `meta` carries the
  workspace's work week (weekly working hours, working days, week start) so the percentage can be
  turned into hours.
- **`reports_get`** `time_summary` groups by day, week or month (`group_by`) and filters by
  employee; `project_finance_summary` filters by manager, pages by cursor and excludes deleted
  projects. `projects_get_risks` filters by manager.
- **`projects_create` asks about pricing groups** when a time-based project is created in Planning
  without any, since until one exists every hour logged invoices as 0.

### Changed

- **`crm_get_followups` defaults to live references.** A follow-up is not deleted with its lead,
  deal or contact (filter, not cascade): it is hidden while the record is in the recycle bin and
  returns when the record is restored. `scope: unavailable` lists the hidden ones, `scope: all`
  both. Before this, 110 open follow-ups on deleted leads were reported as open work in one
  workspace where 30 were.
- **`resources_get` never returns allocations on soft-deleted projects**, and leaves out
  Completed and Archived projects unless `include_finished_projects` is true, matching the
  Resources tab.
- **`projects_get` no longer returns `spent_amount`.** It was a stored column maintained by a
  database trigger and disagreed with the shared finance calculation. Spend, revenue and margin
  come from `projects_get_financials`, which runs the same code as the Project Finance page and
  the nightly snapshot.
- **`projects_get_financials` says what its revenue is made of.** `revenue_breakdown` separates
  the contract sum from rebilled costs on a fixed-price project. When no contract sum is set, the
  percentages are `null` with a warning that says so, rather than a margin against 0.
- **One allocation figure per team member.** `projects_add_team_member` no longer defaults
  `allocation_hours` to 40 on a percentage allocation: a percentage row carries no hours and a
  fixed-hours row no percentage, on create and on update. The descriptions of
  `projects_add_team_member`, `projects_update_team_member`, `projects_get_team_allocation`,
  `resources_get` and `resources_create_allocation` now state that a percentage is a share of the
  employee's **own** weekly capacity (workspace weekly hours × the employee's
  `weekly_capacity_percentage`), not of a full-time week.

### Fixed

- **Automatic finance snapshots counted no logged hours.** The snapshot job called a time-entry
  RPC that raises under the service role, so every scheduled snapshot was written with zero time
  spent. The job now runs the shared finance calculation.

## [0.3.0] - 2026-08-27

The release that moved the server onto the official MCP SDK and closed most of what was
missing around it. It took the catalogue past a hundred tools; the current count is in
[TOOLS.md](TOOLS.md), which is generated rather than written down here, so this file does not
carry a number that goes stale.

### Added

- **Prompts.** Four named starters a client can offer without anyone knowing a tool name: what is
  waiting on me, project status, log time, ready to invoice. The previous SDK could not expose
  prompts at all.
- **Expenses, notes and notifications.** 17 tools covering out-of-pocket expenses, notes with
  working @-mentions on leads, deals, contacts and tasks, and the caller's own notifications.
- **Deletion and restoration.** Soft delete to a 30-day recycle bin for leads, contacts, deals,
  projects and tasks, with matching restore tools and a searchable `list_trash`.
- **Names in place of ids.** Reference arguments accept a name as readily as a UUID. The
  resolution happens in the wrapper every tool runs through, so no tool can be left out of it, and
  it covers project, employee, manager, owner, assignee, customer, contact, deal, lead, task,
  activity type and pricing group references. An ambiguous name returns every candidate rather
  than picking one.
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
- Assigning a role the workspace has not defined. Roles are validated against the workspace's own
  list at call time rather than against a compiled-in copy.
- MCP resources. Everything is reachable through a tool call, and client support is uneven.
- Rate limiting on reads.

## Before 0.3.0 - 2026-08-02 to 2026-08-06

These changes shipped without a version of their own and without a changelog. Reconstructed from
the commit history for completeness; treat the detail as indicative rather than exhaustive, and
note that no release number was ever attached to them.

### Added

- The project lifecycle state for a project that has been closed automatically and is waiting on
  a manager's decision.

### Fixed

- `projects_get_pricing_groups` crashed.
- Two id and foreign-key mix-ups, alongside a set of broken reads.
- `tool_invoke` ran a target tool's handler without validating against that tool's own input
  schema, so every argument default stayed undefined. A paginated read then came back empty while
  still reporting a non-zero total, which an agent reads as "no data". It now validates first.
- Time and materials projects did not earn revenue correctly.
- Delete guards were inconsistent between tools.

## Earlier

The server existed before this and was not versioned in public. Nothing earlier is documented
here, because the record needed to write it accurately does not exist.
