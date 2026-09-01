# Permissions and authorisation

Connecting an AI assistant to a system that holds your project economy is a decision about
trust, and it should be made on specifics. This document is the specifics.

Every claim here is checkable against [TOOLS.md](TOOLS.md), which is generated from the server's
own tool definitions and from the permission gate each handler runs before it acts.

## The short version

| | |
| --- | --- |
| Tools | 105 |
| Read-only | 31 |
| Can write | 74 |
| Behind a `finance` permission | 8 (4 read, 4 write) |
| Delete, recoverable for 30 days | 5 |
| Delete, permanent | 13 |
| Require a human-supplied confirmation phrase | 10 |
| Restricted to workspace admins | 12 |
| Rate limit | 120 writes per minute per user |

## 1. Every call runs as you

There is no service account and no shared key.

When you connect a client, you complete an OAuth sign-in against the same identity provider the
Matrix application uses. The client receives a token for **your** account. Every tool call
carries that token, the server verifies it against the issuer's published keys, and then uses it
to talk to the database, so every query runs under row-level security **as you**.

The consequences are worth stating plainly:

- An assistant connected as you can reach exactly the workspace you belong to, and no other.
- It cannot do anything your own account cannot already do in the Matrix interface. There is no
  administrative path through the server that bypasses your permissions. That is not the same as
  saying it can do nothing privileged: if your account holds `hr.edit`, it can grant workspace
  administrator rights, which is covered under section 3.
- Revoking your Matrix access revokes the assistant's, because they are the same access.
- Clearing the client's stored credentials ends the connection immediately.

The token's audience is checked as a token-acceptance policy, not as an authorisation decision.
Authorisation is entirely the row-level security and the permission checks described below.

## 2. Your existing permissions still apply

Matrix has a feature permission system that an admin manages: `crm.view`, `projects.edit`,
`finance.view` and so on. Every tool checks the same permission the Matrix interface checks,
before it does anything.

If you do not hold the permission, the tool refuses with a message naming exactly what is
missing:

```
You don't have access to Finance in Matrix (missing 'finance.view' permission).
Ask an admin to grant it.
```

That message is designed to be relayed to you verbatim, so a refusal tells you what to ask for
rather than looking like a broken integration.

| Area | To read | To write |
| --- | --- | --- |
| Contracts | `contracts.view` | `contracts.create`, `contracts.edit` |
| CRM | `crm.view` | `crm.create`, `crm.edit` |
| Finance | `finance.view` | `finance.create`, `finance.edit` |
| HR | `hr.view` | `hr.create`, `hr.edit` |
| Projects | `projects.view` | `projects.create`, `projects.edit` |
| Proposals | `offers.view` | read-only through MCP |
| Reports | `reports.view` | read-only through MCP |
| Resource planning | `resources.view` | `resources.create`, `resources.edit`, `resources.delete` |
| Risks | `risks.view` | `risks.create`, `risks.edit`, `risks.delete` |
| Tasks | `tasks.view` | `tasks.create`, `tasks.edit` |
| Time and expenses | `time.view` | `time.create`, `time.edit`, `time.delete`, `time.approve` |

Notes are checked against whatever they hang off: a note on a deal needs the CRM permission, a
note on a task needs the task permission.

A handful of tools list no feature permission because they act only on the caller's own records
(`whoami`, your own notifications) or are pure metadata (`tool_search`). Row-level security is
what constrains those.

## 3. Financial data: read is not write

Money is gated separately from everything else, and reading it is a different permission from
changing it. Eight of the 105 tools touch financial data at all.

### The four that read, behind `finance.view`

| Tool | What it returns |
| --- | --- |
| `projects_get_financials` | Budget, spent to date, forecast at completion, revenue, profit and loss, forecast margin, for one project |
| `projects_get_finance` | The project finance snapshots, newest first |
| `projects_get_invoicing` | A project's invoicing settings |
| `projects_get_billing_plan` | The fixed-fee milestone plan a project is invoiced against |

### The four that write, behind `finance.create` or `finance.edit`

| Tool | What it changes |
| --- | --- |
| `projects_create_billing_milestone` | Adds a fixed-fee billing milestone to a project's billing plan |
| `projects_update_billing_milestone` | Updates one |
| `projects_delete_billing_milestone` | Deletes one, permanently, and only with a confirmation phrase |
| `projects_update_invoicing` | Billing model, currency, VAT rate, payment terms, invoice frequency, expense markup, approval type |

That is the entire financial write surface.

### What no tool on the server can do

- **Issue an invoice, send one, or record a payment against one.** There is no such tool. The
  finance writes above change a project's billing milestones and its invoicing settings, and stop
  there.
- **Read or write a salary.** No tool on the server touches `annual_gross_salary`,
  `hourly_gross_rate` or the national ID columns in either direction. `hr_get_employees` selects a
  fixed column list, and none of them are on it, whatever permissions the caller holds. The cost
  per hour derived from salary is a different matter, and is set out below rather than left to be
  discovered.
- **Touch bank details, card details, or anything else that could move money out of the
  business.** No such data is exposed and no such tool exists.
- **Assign a role your workspace has not defined.** Roles are validated against the roles your
  workspace actually has, read at the moment of the call rather than from a copy, because which
  roles exist is a per-workspace question and a guard against privilege escalation must not depend
  on a snapshot being current. Anything outside that list is refused, with the valid options
  named. `hr_get_roles` returns the same list, so an assistant can look before it writes.
- **Create or edit a proposal.** Proposals are readable and deliberately not writable here.
- **Delete a contract, or delete an employee.** Neither tool exists.

### The widest thing on this page

`hr_update_employee` can set `is_admin`, behind `hr.edit`. Administrator rights are what
control deletion and the recycle bin, so an assistant connected as someone who can edit HR can
grant or remove them. This is the same authority that person already has in the Matrix interface,
not a new one, and it was a deliberate decision that HR access is a sufficient bar for it. If it
is more than you want an assistant able to do, withhold `hr.edit` from the accounts you connect.
`hr_update_employee` says so in its own description, so a well-behaved agent will tell you before
it acts.

### Where a cost per hour does show up

Salary itself is never exposed. The cost per hour derived from it is, in exactly two places, and
in both to a caller who already sees the same figure in Matrix:

| Tool | Permission | What it returns |
| --- | --- | --- |
| `reports_get` with `kind: employee_utilization` | `reports.view` | A cost per hour per named employee, and the monetary value of any utilisation shortfall. That is what the report is for. |
| `timelog_recalculate_cost` | `time.approve` | The rate it would stamp, per named employee, alongside how many entries it would touch. |

`projects_get_financials` and `projects_get_finance` return aggregates and carry no per-person
rate. Nothing else on the server returns one, and nothing writes one.

### One write that looks larger than it is

`timelog_recalculate_cost` repairs time entries that were stamped with a zero cost rate because
the employee had no salary data when the time was logged. It re-stamps them from the employee's
current rate. Three things bound it: it never overwrites an entry that already carries a real
rate, it requires `time.approve`, and it runs as a preview unless it is explicitly passed
`dry_run: false`.

## 4. Deletion works two different ways

This is the part most often assumed to be uniform. It is not, and the difference follows what is
being deleted.

### Recoverable, and admin only (5 tools)

`crm_delete_lead`, `crm_delete_contact`, `crm_delete_deal`, `projects_delete`, `tasks_delete`

These soft-delete. The record moves to the recycle bin for 30 days and can be restored with the
matching `_restore` tool, and deleting a project takes its tasks with it. Only a workspace admin
can call any of them, regardless of what other permissions they hold. The same is true of the
five restore tools and of `list_trash`, which is why twelve tools in all are admin-gated rather
than the five listed here.

### Permanent (13 tools)

`crm_delete_followup`, `notes_delete`, `notifications_delete`,
`projects_delete_billing_milestone`, `projects_delete_document`,
`projects_delete_external_service`, `projects_delete_material`, `projects_delete_pricing_group`,
`projects_delete_risk`, `resources_delete_allocation`, `tasks_remove_dependency`,
`timelog_delete_entry`, `timelog_delete_expense`

These are line items on a project, and your own notes and notifications. They do not go to the
recycle bin. Ten of the thirteen refuse to run until a human supplies an exact confirmation
phrase:

```
Destructive action requires explicit user confirmation.

To delete <resource>, ask the human running this agent to confirm,
then call this tool again with:
  - confirm: true
  - confirmation_phrase: "<the exact phrase>"

Never fill these in on your own - the human must supply them.
```

The three that do not carry a confirmation phrase are `projects_delete_document`,
`projects_delete_material` and `projects_delete_external_service`. All three still require
`projects.edit`.

One of the ten is conditional rather than absolute: `notifications_delete` asks for a phrase when
several notifications are being deleted at once, and not when a single one is deleted by its id.

`notes_delete` and `notifications_delete` only reach your own records.

### Neither

`projects_remove_team_member` takes an employee off a project's team. It is flagged destructive
because it unlinks something, but nothing is deleted.

## 5. Everything is recorded

Every write leaves a row in an audit trail carrying the tool name, the caller, and the arguments
**as the server resolved them**. That last part matters: because tools accept names in place of
ids, the trail records the record the call actually hit rather than the word the agent typed.

The trail is written by the wrapper that all 105 tools run through, not by each tool
individually, so a tool cannot be added without being covered by it.

The same trail is the rate limiter. Writes are capped at 120 per minute per user, measured on the
audit rows themselves rather than in a separate table. The ceiling is far above deliberate use;
hitting it generally means an agent is looping. Reads are not rate limited, because limiting them
would tax the ordinary call to guard against the rare one.

## 6. What holds these claims true

Annotations like `readOnlyHint` are a promise to the client, and nothing in the protocol enforces
them at runtime. They are enforced here by contract tests that run on every push, over every tool
the server exposes:

- Every tool has a title, annotations, and a description long enough to say both what it does and
  when to reach for it.
- A tool that advertises itself as read-only does not write.
- Every destructive tool says in its own description whether it is reversible or permanent, so
  an agent cannot present one as the other.
- No destructive tool is also marked read-only.
- The data behind [TOOLS.md](TOOLS.md) and the public
  [/mcp page](https://sunago-matrix.com/mcp) is regenerated from the live definitions and compared
  against the committed copy, so a permission gate that disappears from a handler fails the build
  rather than quietly making a published claim false.

Several of these tests have been verified by mutation: a falsified `readOnlyHint` is named by the
suite, a removed permission check fails the page-data comparison, and making a required argument
optional again fails its own test.

## Questions

Anything about this document, the tool surface, or a case it does not cover:
[sunago@sunago-group.com](mailto:sunago@sunago-group.com). For a suspected security issue, email
rather than opening a public issue.
