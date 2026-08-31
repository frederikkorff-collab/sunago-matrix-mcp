# Tool reference

All 105 tools the server publishes, exactly as a connected client receives them. This file is generated from the server's own definitions; see [CONTRIBUTING](#keeping-this-file-honest) below.

| | |
| --- | --- |
| Tools | 105 |
| Read-only | 31 |
| Can write | 74 |
| Can delete | 19 |
| Require a confirmation phrase | 10 |
| Behind a finance permission | 8 |

The **Permission** column is the check the handler runs before it does anything. It is the same permission the SUNAGO Matrix interface checks, so a tool can do exactly what the signed-in user can already do by hand and nothing more. Tools listing `none` are gated by row-level security alone: they act only on the caller's own records.

## Contents

- [Identity](#identity) (1)
- [CRM](#crm) (20)
- [Projects](#projects) (39)
- [Tasks](#tasks) (8)
- [Time and expenses](#time-and-expenses) (13)
- [Resource planning](#resource-planning) (4)
- [HR](#hr) (4)
- [Proposals](#proposals) (1)
- [Contracts](#contracts) (3)
- [Notes](#notes) (4)
- [Notifications](#notifications) (4)
- [Reports](#reports) (1)
- [Recycle bin](#recycle-bin) (1)
- [Meta](#meta) (2)

## Identity

Who the signed-in person is, and what they are allowed to see.

| Tool | Access | Permission | Notes |
| --- | --- | --- | --- |
| `whoami` | read | none |  |

- **`whoami`** Return the identity of the currently authenticated Sunago Matrix user (auth id, email, employee id, workspace, and feature permissions).

## CRM

Leads, contacts, deals and follow-ups.

| Tool | Access | Permission | Notes |
| --- | --- | --- | --- |
| `crm_create_contact` | write | `crm.create` |  |
| `crm_create_deal` | write | `crm.create` |  |
| `crm_create_followup` | write | `crm.create` |  |
| `crm_create_lead` | write | `crm.create` |  |
| `crm_delete_contact` | write | none | deletes, admin only |
| `crm_delete_deal` | write | none | deletes, admin only |
| `crm_delete_followup` | write | none | deletes, admin only, confirmation required |
| `crm_delete_lead` | write | none | deletes, admin only |
| `crm_get_contacts` | read | `crm.view` |  |
| `crm_get_deals` | read | `crm.view` |  |
| `crm_get_followups` | read | `crm.view` |  |
| `crm_get_leads` | read | `crm.view` |  |
| `crm_log_activity` | write | `crm.edit` |  |
| `crm_restore_contact` | write | none |  |
| `crm_restore_deal` | write | none |  |
| `crm_restore_lead` | write | none |  |
| `crm_update_contact` | write | `crm.edit` |  |
| `crm_update_deal` | write | `crm.edit` |  |
| `crm_update_followup` | write | `crm.edit` |  |
| `crm_update_lead` | write | `crm.edit` |  |

- **`crm_create_contact`** Create a CRM contact: a named person, with their address, phone numbers and CVR/VAT number.
- **`crm_create_deal`** Create a CRM deal: a named opportunity with a value, a stage and a close date.
- **`crm_create_followup`** Create a new follow-up task linked to a lead, deal, or contact.
- **`crm_create_lead`** Create a new CRM lead in the caller's workspace.
- **`crm_delete_contact`** Soft-delete a CRM contact: it moves to the recycle bin for 30 days and can be brought back with crm_restore_contact.
- **`crm_delete_deal`** Soft-delete a CRM deal: it moves to the recycle bin for 30 days and can be brought back with crm_restore_deal.
- **`crm_delete_followup`** PERMANENTLY delete a follow-up.
- **`crm_delete_lead`** Soft-delete a CRM lead: it moves to the recycle bin for 30 days and can be brought back with crm_restore_lead.
- **`crm_get_contacts`** List CRM contacts (RLS-scoped).
- **`crm_get_deals`** List CRM deals (RLS-scoped).
- **`crm_get_followups`** List follow-up tasks (RLS-scoped).
- **`crm_get_leads`** List CRM leads (RLS-scoped).
- **`crm_log_activity`** Append an activity log entry (note, call, meeting, email) to a deal.
- **`crm_restore_contact`** Restore a soft-deleted contact from the recycle bin.
- **`crm_restore_deal`** Restore a soft-deleted deal from the recycle bin.
- **`crm_restore_lead`** Restore a soft-deleted lead from the recycle bin.
- **`crm_update_contact`** Update fields on a contact, including its address, extra phone numbers, CVR/VAT number, collaborator mark and which list it is on.
- **`crm_update_deal`** Update fields on a deal.
- **`crm_update_followup`** Update a follow-up, or close it by passing completed: true - which also stamps completed_at with the current time.
- **`crm_update_lead`** Update fields on a lead.

## Projects

Projects and everything hanging off them: team, materials, risks, billing.

| Tool | Access | Permission | Notes |
| --- | --- | --- | --- |
| `projects_add_document` | write | `projects.edit` |  |
| `projects_add_team_member` | write | `projects.edit` |  |
| `projects_assign_pricing_group` | write | `projects.edit` |  |
| `projects_confirm_completion` | write | `projects.edit` |  |
| `projects_create` | write | `projects.create` |  |
| `projects_create_billing_milestone` | write | `finance.create` |  |
| `projects_create_external_service` | write | `projects.edit` |  |
| `projects_create_material` | write | `projects.edit` |  |
| `projects_create_pricing_group` | write | `projects.edit` |  |
| `projects_create_risk` | write | `risks.create` |  |
| `projects_delete` | write | none | deletes, admin only |
| `projects_delete_billing_milestone` | write | `finance.edit` | deletes, confirmation required |
| `projects_delete_document` | write | none | deletes |
| `projects_delete_external_service` | write | none | deletes |
| `projects_delete_material` | write | none | deletes |
| `projects_delete_pricing_group` | write | `projects.edit` | deletes, confirmation required |
| `projects_delete_risk` | write | `risks.delete` | deletes, confirmation required |
| `projects_get` | read | `projects.view` |  |
| `projects_get_billing_plan` | read | `finance.view` |  |
| `projects_get_external_services` | read | `projects.view` |  |
| `projects_get_finance` | read | `finance.view` |  |
| `projects_get_financials` | read | `finance.view` |  |
| `projects_get_invoicing` | read | `finance.view` |  |
| `projects_get_materials` | read | `projects.view` |  |
| `projects_get_pricing_groups` | read | `projects.view` |  |
| `projects_get_risks` | read | `risks.view` |  |
| `projects_get_team_allocation` | read | `projects.view` |  |
| `projects_reactivate` | write | `projects.edit` |  |
| `projects_remove_team_member` | write | `projects.edit` | deletes |
| `projects_restore` | write | none |  |
| `projects_unassign_pricing_group` | write | `projects.edit` |  |
| `projects_update` | write | `projects.edit` |  |
| `projects_update_billing_milestone` | write | `finance.edit` |  |
| `projects_update_external_service` | write | `projects.edit` |  |
| `projects_update_invoicing` | write | `finance.edit` |  |
| `projects_update_material` | write | `projects.edit` |  |
| `projects_update_pricing_group` | write | `projects.edit` |  |
| `projects_update_risk` | write | `risks.edit` |  |
| `projects_update_team_member` | write | `projects.edit` |  |

- **`projects_add_document`** Register a project document reference.
- **`projects_add_team_member`** Assign an employee to a project.
- **`projects_assign_pricing_group`** Put a project team member on a billing rate group.
- **`projects_confirm_completion`** Confirm that a project the nightly automation closed for passing its end_date really is finished.
- **`projects_create`** Create a new project.
- **`projects_create_billing_milestone`** Add a fixed-fee billing milestone to a project's billing plan - this is what lets a fixed-price project be invoiced in instalments.
- **`projects_create_external_service`** Add an external service line to a project.
- **`projects_create_material`** Add a material line to a project.
- **`projects_create_pricing_group`** Create a billing rate group on a project (e.g.
- **`projects_create_risk`** Log a new project risk.
- **`projects_delete`** Soft-delete a project: it moves to the recycle bin for 30 days (cascading to its tasks) and can be brought back with projects_restore.
- **`projects_delete_billing_milestone`** PERMANENTLY delete a fixed-fee billing milestone.
- **`projects_delete_document`** PERMANENTLY delete a project document ROW.
- **`projects_delete_external_service`** PERMANENTLY delete an external/subcontractor service line from a project.
- **`projects_delete_material`** PERMANENTLY delete a material line from a project.
- **`projects_delete_pricing_group`** PERMANENTLY delete a billing rate group from a project.
- **`projects_delete_risk`** PERMANENTLY delete a project risk.
- **`projects_get`** List projects the signed-in user can see for project management (RLS-scoped).
- **`projects_get_billing_plan`** List fixed-fee billing milestones for a project - the instalment plan a fixed-price project is invoiced against.
- **`projects_get_external_services`** List external/subcontractor service lines on a project, with budgeted vs adjusted cost and markup.
- **`projects_get_finance`** Get latest project finance snapshot(s), newest first.
- **`projects_get_financials`** Full financial picture for one project - budget, spent-to-date, FAC (forecast at completion), revenue, profit/loss and forecasted margin.
- **`projects_get_invoicing`** Get invoicing settings for a project.
- **`projects_get_materials`** List material cost lines on a project, with markup and billable flags.
- **`projects_get_pricing_groups`** List the billing rate groups on a project, including which team members are assigned to each.
- **`projects_get_risks`** List risks (optionally filtered by project).
- **`projects_get_team_allocation`** List team members and their allocations for a project.
- **`projects_reactivate`** Reopen a completed or archived project and give it a new end_date.
- **`projects_remove_team_member`** Take an employee off a project's team.
- **`projects_restore`** Restore a soft-deleted project from the recycle bin.
- **`projects_unassign_pricing_group`** Take a project team member off their billing rate group without removing them from the project.
- **`projects_update`** Update fields on a project, including revenue / revenue_ceiling and the materials, external-services and expense budgets.
- **`projects_update_billing_milestone`** Update a fixed-fee billing milestone.
- **`projects_update_external_service`** Update an external or subcontractor service line.
- **`projects_update_invoicing`** Create or update a project's invoicing settings (upsert on project_id).
- **`projects_update_material`** Update a material line.
- **`projects_update_pricing_group`** Rename a pricing group or change its hourly rate.
- **`projects_update_risk`** Update a project risk.
- **`projects_update_team_member`** Update a project team member's allocation.

## Tasks

Tasks on projects, and the dependencies between them.

| Tool | Access | Permission | Notes |
| --- | --- | --- | --- |
| `tasks_add_dependency` | write | `tasks.edit` |  |
| `tasks_create` | write | `tasks.create` |  |
| `tasks_delete` | write | none | deletes, admin only |
| `tasks_get` | read | `tasks.view` |  |
| `tasks_get_dependencies` | read | `tasks.view` |  |
| `tasks_remove_dependency` | write | `tasks.edit` | deletes, confirmation required |
| `tasks_restore` | write | none |  |
| `tasks_update` | write | `tasks.edit` |  |

- **`tasks_add_dependency`** Record that one task waits on, blocks, or is related to another.
- **`tasks_create`** Create a new task in a project.
- **`tasks_delete`** Soft-delete a task: it moves to the recycle bin for 30 days and can be brought back with tasks_restore.
- **`tasks_get`** List tasks (RLS-scoped).
- **`tasks_get_dependencies`** Everything linked to one task, in both directions: what it is waiting on, what is waiting on it, and what it is merely related to.
- **`tasks_remove_dependency`** PERMANENTLY remove a link between two tasks.
- **`tasks_restore`** Restore a soft-deleted task from the recycle bin.
- **`tasks_update`** Update fields on a task.

## Time and expenses

Logging hours, approving them, and out-of-pocket expenses.

| Tool | Access | Permission | Notes |
| --- | --- | --- | --- |
| `timelog_add_expense` | write | `time.create` |  |
| `timelog_approve_expense` | write | `time.approve` |  |
| `timelog_approve_time` | write | `time.approve` |  |
| `timelog_delete_entry` | write | `time.delete` | deletes, confirmation required |
| `timelog_delete_expense` | write | `time.delete` | deletes, confirmation required |
| `timelog_get_activity_types` | read | `time.view` |  |
| `timelog_get_entries` | read | `time.view` |  |
| `timelog_get_expenses` | read | `time.view` |  |
| `timelog_get_loggable_projects` | read | `time.view` |  |
| `timelog_log_time` | write | `time.create` |  |
| `timelog_recalculate_cost` | write | `time.approve` |  |
| `timelog_update_entry` | write | `time.edit` |  |
| `timelog_update_expense` | write | `time.edit` |  |

- **`timelog_add_expense`** Add an expense for the signed-in user, optionally attached to a project.
- **`timelog_approve_expense`** Approve an expense.
- **`timelog_approve_time`** Approve a time entry.
- **`timelog_delete_entry`** PERMANENTLY delete one or more time entries.
- **`timelog_delete_expense`** PERMANENTLY delete one or more expenses.
- **`timelog_get_activity_types`** List activity types available in the signed-in user's workspace for non-billable time logging.
- **`timelog_get_entries`** List time entries (RLS-scoped).
- **`timelog_get_expenses`** List expenses.
- **`timelog_get_loggable_projects`** List only projects where the signed-in user is assigned as a team member or project manager and can log project time.
- **`timelog_log_time`** Log a time entry for the signed-in user, or for another employee via employee_id (requires time approval rights).
- **`timelog_recalculate_cost`** Repair time entries whose historical_cost_price_per_hour was stamped as 0 because the employee had no salary data when the time was logged.
- **`timelog_update_entry`** Update fields on a draft/rejected time entry.
- **`timelog_update_expense`** Update an expense.

## Resource planning

Allocating people across projects over time.

| Tool | Access | Permission | Notes |
| --- | --- | --- | --- |
| `resources_create_allocation` | write | `resources.create` |  |
| `resources_delete_allocation` | write | `resources.delete` | deletes, confirmation required |
| `resources_get` | read | `resources.view` |  |
| `resources_update_allocation` | write | `resources.edit` |  |

- **`resources_create_allocation`** Manual allocation NOT tied to a project, but to an activity type (e.g.
- **`resources_delete_allocation`** PERMANENTLY delete a manual (non-project) resource allocation.
- **`resources_get`** Unified capacity view.
- **`resources_update_allocation`** Update a manual (non-project) resource allocation.

## HR

Employees and the workspace's own roles.

| Tool | Access | Permission | Notes |
| --- | --- | --- | --- |
| `hr_create_employee` | write | `hr.create` |  |
| `hr_get_employees` | read | `hr.view` |  |
| `hr_get_roles` | read | `hr.view` |  |
| `hr_update_employee` | write | `hr.edit` |  |

- **`hr_create_employee`** Create a new employee record.
- **`hr_get_employees`** List employees.
- **`hr_get_roles`** List the roles defined in the caller's workspace, as set up under Role Management in Matrix.
- **`hr_update_employee`** Update an employee record.

## Proposals

Proposal documents. Read-only through MCP, by choice.

| Tool | Access | Permission | Notes |
| --- | --- | --- | --- |
| `proposals_get` | read | `offers.view` |  |

- **`proposals_get`** List offer documents / proposals (RLS-scoped).

## Contracts

Contracts attached to deals and projects.

| Tool | Access | Permission | Notes |
| --- | --- | --- | --- |
| `contracts_create` | write | `contracts.create` |  |
| `contracts_get` | read | `contracts.view` |  |
| `contracts_update` | write | `contracts.edit` |  |

- **`contracts_create`** Create a contract record.
- **`contracts_get`** List contracts (RLS-scoped).
- **`contracts_update`** Update fields on a contract.

## Notes

Notes with @-mentions on a lead, deal, contact or task.

| Tool | Access | Permission | Notes |
| --- | --- | --- | --- |
| `notes_create` | write | `<parent>.edit` |  |
| `notes_delete` | write | `<parent>.edit` | deletes, confirmation required |
| `notes_get` | read | `<parent>.view` |  |
| `notes_update` | write | `<parent>.edit` |  |

- **`notes_create`** Add a note to a lead, deal, contact or task.
- **`notes_delete`** PERMANENTLY delete one of YOUR OWN notes together with its mentions.
- **`notes_get`** List the notes on a lead, deal, contact or task, newest first, with the author's name and every colleague tagged in each note resolved to a name.
- **`notes_update`** Rewrite one of YOUR OWN notes.

## Notifications

Your own notifications, and messages to colleagues.

| Tool | Access | Permission | Notes |
| --- | --- | --- | --- |
| `notifications_delete` | write | none | deletes, confirmation required |
| `notifications_get` | read | none |  |
| `notifications_mark_read` | write | none |  |
| `notifications_send` | write | none |  |

- **`notifications_delete`** PERMANENTLY delete the signed-in user's own notifications.
- **`notifications_get`** List the signed-in user's own Matrix notifications, newest first.
- **`notifications_mark_read`** Mark the signed-in user's own notifications as read.
- **`notifications_send`** Send an in-app Matrix notification to one or more colleagues in YOUR workspace.

## Reports

Finished reports rather than raw rows.

| Tool | Access | Permission | Notes |
| --- | --- | --- | --- |
| `reports_get` | read | `reports.view`, `crm.view` |  |

- **`reports_get`** Server-side aggregated reports across time, revenue, pipeline and utilization.

## Recycle bin

Deleted records, kept for 30 days.

| Tool | Access | Permission | Notes |
| --- | --- | --- | --- |
| `list_trash` | read | none | admin only |

- **`list_trash`** List soft-deleted records currently in the recycle bin (leads, deals, contacts, tasks, projects).

## Meta

Find a tool by keyword, and call one by name.

| Tool | Access | Permission | Notes |
| --- | --- | --- | --- |
| `tool_invoke` | write | none |  |
| `tool_search` | read | none |  |

- **`tool_invoke`** Invoke a Sunago Matrix MCP tool by its exact name with a JSON arguments object.
- **`tool_search`** Search available Sunago Matrix MCP tools by keyword.

## Keeping this file honest

`data/tools.json` is generated in the product repository from the live tool definitions and the permission gate in each handler, and copied here. `TOOLS.md` is rendered from it by `scripts/build-tools-md.mjs`. Nothing in this file is written by hand, so a tool that changes in the server changes here rather than quietly disagreeing with it.

```bash
node scripts/build-tools-md.mjs --check   # fails if TOOLS.md is stale
```
