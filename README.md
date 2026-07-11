# MCP Script Runner

MCP Script Runner is a ServiceNow application that exposes a Model Context
Protocol (MCP) server inside a ServiceNow instance. It gives trusted AI clients
such as Build Agent a single tool, `run_script`, that can execute server-side
JavaScript in global scope as the authenticated ServiceNow user.

Download the update set ZIP and import the XML inside it:
[MCP_Script_Runner_1.0.12.xml.zip](https://github.com/Now-Italy-Demo/MCP-Script-Runner/raw/refs/heads/main/MCP_Script_Runner_1.0.12.xml.zip)

This is remote code execution by design. Install it only on instances where you
understand and accept that risk, and grant access only to trusted users.

## What It Does

MCP Script Runner lets Build Agent and other MCP clients:

- Run ServiceNow server-side JavaScript through MCP.
- Query and modify records through GlideRecord.
- Call ServiceNow server APIs available to the authenticated user.
- Return script output directly to the MCP client.
- Audit every script execution and returned result.

The app also includes an admin page, **MCP Script Runner Admin**, that checks
the configuration status and shows the latest script executions.

## Prerequisites

- ServiceNow instance on **Australia Patch 2 Hotfix 1 or newer**.
- **Build Agent** installed.
- **Workflow Data Fabric / Connect Hub** installed.
- Admin access for installation and setup.
- A trusted setup user who can be granted the required roles shown in the admin
  page.

## Installation

1. In ServiceNow, go to **System Update Sets > Retrieved Update Sets**.
2. Download [MCP_Script_Runner_1.0.12.xml.zip](https://github.com/Now-Italy-Demo/MCP-Script-Runner/raw/refs/heads/main/MCP_Script_Runner_1.0.12.xml.zip),
   unzip it, and import the XML update set inside.
3. Preview the update set.
4. Resolve any preview issues if your instance reports them.
5. Commit the update set.
6. Navigate to **MCP Script Runner > MCP Script Runner Admin**.
7. Open **Configuration status** and follow the instructions shown in each step.

The admin page guides you through OAuth client creation, role assignment,
Connect Hub MCP connector setup, AI Control Tower approval, inbound OAuth scope
validation, and Build Agent MCP server enablement.

## Security Notes

- The `run_script` tool executes server-side JavaScript.
- Scripts run as the authenticated ServiceNow user.
- Access is gated by ServiceNow authentication, OAuth/WDF setup, AI Control
  Tower approval, and the `mcp_script_runner` role.
- Every script execution is written to the `u_mcp_script_execution` audit table.
- Do not grant access broadly.

# MCP Script Runner: Capability Bypass Analysis

A comparison of originally listed limitations vs. what can actually be achieved by executing server-side JavaScript via `MCP_Script_Runner`.

## Infrastructure & Administration

| Limitation | Bypassable? | How via MCP_Script_Runner |
|---|---|---|
| Activate/deactivate plugins | Yes | `new GlidePluginManager().activate('com.snc.plugin_id')` or `GlidePluginManagerWorker` |
| Clone or upgrade instances | No | These are HI-level infrastructure operations outside the instance runtime |
| Modify system properties | Yes | `gs.setProperty('property.name', 'value')` |
| Manage MID Servers | Partial | Can query/modify MID records and issue ECC queue commands, but can't control the actual MID host process |

## External Connectivity

| Limitation | Bypassable? | How via MCP_Script_Runner |
|---|---|---|
| Make outbound HTTP/REST calls | Yes | `new sn_ws.RESTMessageV2()` - full control over method, headers, body, auth |
| Access the internet | Yes | Same as above - can fetch any URL the instance network/ACL allows |
| Send emails directly | Yes | `GlideEmailOutbound` for direct send, or `gs.eventQueue()` to trigger a notification |

## File & Binary Operations

| Limitation | Bypassable? | How via MCP_Script_Runner |
|---|---|---|
| Create or edit binary files | Partial | `GlideSysAttachment.write()` can attach base64-encoded content to records, but can't generate complex images/PDFs from scratch without a library |
| Upload/download attachments | Yes | `GlideSysAttachment` - `write()`, `getContent()`, `getContentBase64()`, `copy()`, `deleteAttachment()` |
| Manage instance file storage | Yes | Query/delete/copy via `GlideSysAttachment` and GlideRecord on `sys_attachment` |

## Version Control & DevOps

| Limitation | Bypassable? | How via MCP_Script_Runner |
|---|---|---|
| Git operations | No | Git lives outside the instance - no server-side API for it |
| CI/CD pipelines | Partial | Can trigger external CI/CD via outbound REST calls to Jenkins/GitHub Actions/etc., or use ServiceNow's CICD spoke APIs |
| Export/import Update Sets | Yes | GlideRecord on `sys_update_set` to create/commit; `GlideUpdateSet2` API; can pull remote update sets via `sys_remote_update_set` |

## Instance Operations

| Limitation | Bypassable? | How via MCP_Script_Runner |
|---|---|---|
| Impersonate users | Yes | `new GlideImpersonate().impersonate('user_sys_id')` for query context |
| Modify OOB/system tables | Yes | Background scripts run in global scope as admin - full GlideRecord CRUD on any table |
| Run client-side JavaScript | No | Server-side only - no browser DOM or client-side context available |
| Real-time log monitoring | Partial | Can poll with repeated queries, but can't maintain a persistent stream/tail |
| Cancel running jobs/threads | Yes | Update `sys_trigger` records (`state=4`), delete scheduled jobs, or use `GlideRunScriptJob.cancel()` |

## Scope & Access Limitations

| Limitation | Bypassable? | How via MCP_Script_Runner |
|---|---|---|
| Access scope-protected tables | Yes | GlideRecord in global scope - already demonstrated with `syslog` |
| Create metadata not supported by Fluent | Yes | Insert directly into metadata tables (`sys_script`, `sys_ui_page`, `sys_security_acl`, etc.) via GlideRecord |
| Work across multiple instances | Partial | Can call another instance's REST/Table API via `RESTMessageV2` (requires credentials), but can't execute scripts there |

## UI & Visual

| Limitation | Bypassable? | How via MCP_Script_Runner |
|---|---|---|
| Take visual screenshots | No | No rendering engine server-side - pixels require a browser |
| Edit or preview UI in real-time | No | Server-side can't interact with a live browser session |
| Create custom themes | Yes | Insert/update records in `sp_theme`, `sys_ui_theme`, CSS includes, etc. via GlideRecord |

## Summary Scorecard

| Category | Total | Full | Partial | Cannot |
|---|---:|---:|---:|---:|
| Infrastructure & Admin | 4 | 2 | 1 | 1 |
| External Connectivity | 3 | 3 | 0 | 0 |
| File & Binary | 3 | 2 | 1 | 0 |
| Version Control & DevOps | 3 | 1 | 1 | 1 |
| Instance Operations | 5 | 3 | 1 | 1 |
| Scope & Access | 3 | 2 | 1 | 0 |
| UI & Visual | 3 | 1 | 0 | 2 |
| **TOTAL** | **24** | **14** | **5** | **5** |

## Hard Limitations

These 5 remain regardless of `MCP_Script_Runner`:

1. **Clone or upgrade instances** - HI-level infrastructure operation.
2. **Git operations** - External tooling, not accessible from instance runtime.
3. **Run client-side JavaScript** - Requires a browser; server-side only.
4. **Take visual screenshots** - No rendering engine available server-side.
5. **Edit or preview UI in real-time** - No live browser interaction from server.
