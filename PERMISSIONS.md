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
| Restricted to workspace admins | 7 |
| Rate limit | 120 writes per minute per user |

## 1. Every call runs as you

There is no service account and no shared key.

When you connect a client, you complete an OAuth sign-in against the same identity provider the
Matrix application uses. The client receives a token for **your** account. Every tool call
carries that token, the server verifies it against the issuer's published keys, and then uses it
to talk to the database, so every query runs under row-level security **as you**.

The consequences are worth stating plainly:

- An assistant connected as you can reach exactly the workspace you belong to, and no other.
- It cannot escalate. There is no administrative path through the server that your own account
  does not already have.
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
- **Read or write anyone's salary or cost rate.** `hr_get_employees` reads from a masked view and
  selects a fixed set of columns; salary and national identifiers are not among them, whatever
  permissions the caller holds. No tool writes them.
- **Touch bank details, card details, or anything else that could move money out of the
  business.** No such data is exposed and no such tool exists.
- **Grant a permission or make someone an admin.** `hr_update_employee` cannot set the admin
  flag, and the `super_admin` role is closed to MCP entirely. Roles are validated against the
  roles your workspace actually has, read at call time.
- **Create or edit a proposal.** Proposals are readable and deliberately not writable here.
- **Delete a contract, or delete an employee.** Neither tool exists.

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
matching `_restore` tool. Deleting a project cascades to its tasks, and restoring it brings them
back. Only a workspace admin can call any of them, regardless of what other permissions they
hold, and `list_trash` is admin-only too.

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
- A destructive tool cannot be triggered without a human.
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
