/*
 * MCP Script Runner — Fluent definitions.
 *
 * Exposes an MCP (streamable-HTTP / JSON-RPC 2.0) endpoint as a Scripted REST
 * API. The platform enforces authentication (basic auth OR OAuth); the ACL
 * below gates the endpoint on the `mcp_script_runner` role.
 *
 * URL (global scope): POST /api/global/mcp_script_runner  (no trailing slash)
 *
 * NOTE: This app is GLOBAL scope, so its Scripted REST scripts run on the
 * legacy Rhino (ES5) engine. The route handlers are therefore written as
 * INLINE ES5 strings — the now-sdk module loader (`const { x } = require(...)`)
 * uses ES6 syntax Rhino rejects, so we avoid module imports here.
 */
import {
    RestApi,
    Acl,
    Role,
    Table,
    StringColumn,
    MultiLineTextColumn,
    BooleanColumn,
    IntegerColumn,
    DateTimeColumn,
    ReferenceColumn,
    ApplicationMenu,
    Record,
    UiPage,
} from '@servicenow/sdk/core'

// Role granted to principals allowed to invoke the script runner.
const scriptRunnerRole = Role({
    name: 'mcp_script_runner',
    description: 'Grants access to the MCP Script Runner endpoint, which executes arbitrary server-side JavaScript. Treat as a high-privilege grant.',
})

// ACL: only authenticated users with the role (or admins) may execute the endpoint.
const executeAcl = Acl({
    $id: Now.ID['mcp_acl_execute'],
    type: 'rest_endpoint',
    name: 'mcp_script_runner_execute',
    operation: 'execute',
    active: true,
    adminOverrides: true,
    roles: [scriptRunnerRole],
    script: `answer = gs.hasRole('mcp_script_runner');`,
    description: 'Restricts the MCP Script Runner endpoint to the mcp_script_runner role.',
})

export const u_mcp_script_execution = Table({
    name: 'u_mcp_script_execution',
    label: 'MCP Script Execution',
    display: 'u_executed_at',
    audit: true,
    allowWebServiceAccess: true,
    createAccessControls: true,
    userRole: scriptRunnerRole,
    schema: {
        u_executed_at: DateTimeColumn({ label: 'Executed at', mandatory: true, readOnly: true }),
        u_user: ReferenceColumn({ label: 'User', referenceTable: 'sys_user', readOnly: true }),
        u_user_name: StringColumn({ label: 'User name', maxLength: 120, readOnly: true }),
        u_script: MultiLineTextColumn({ label: 'Script', maxLength: 65000, readOnly: true }),
        u_result: MultiLineTextColumn({ label: 'Result', maxLength: 65000, readOnly: true }),
        u_is_error: BooleanColumn({ label: 'Error', readOnly: true }),
        u_error_message: StringColumn({ label: 'Error message', maxLength: 1000, readOnly: true }),
        u_elapsed_ms: IntegerColumn({ label: 'Elapsed ms', readOnly: true }),
    },
})

export const mcp_script_execution_read_acl = Acl({
    $id: Now.ID['mcp_script_execution_read_acl'],
    type: 'record',
    table: 'u_mcp_script_execution',
    operation: 'read',
    active: true,
    adminOverrides: true,
    roles: [scriptRunnerRole],
    description: 'Allows MCP Script Runner users to read execution audit records.',
})

const adminPageHtml = `
<div id="mcp-script-runner-admin" class="mcp-admin">
  <style>
    .mcp-admin {
      color: #1f2933;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif;
      padding: 18px 22px 28px;
    }
    .mcp-admin__bar {
      align-items: center;
      display: flex;
      gap: 14px;
      justify-content: space-between;
      margin-bottom: 12px;
    }
    .mcp-admin__actions {
      align-items: center;
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      justify-content: flex-end;
    }
    .mcp-admin__title {
      font-size: 21px;
      font-weight: 650;
      line-height: 1.25;
      margin: 0;
    }
    .mcp-admin__meta {
      color: #52616f;
      font-size: 12px;
      margin-top: 3px;
    }
    .mcp-admin__button {
      background: #ffffff;
      border: 1px solid #8fa0b3;
      border-radius: 4px;
      color: #1f2933;
      cursor: pointer;
      font-size: 13px;
      min-height: 32px;
      padding: 6px 12px;
    }
    .mcp-admin__button:hover {
      background: #eef4fb;
      border-color: #4f7396;
    }
    .mcp-admin__button[disabled] {
      cursor: not-allowed;
      opacity: 0.65;
    }
    .mcp-admin__link {
      color: #315f8b;
      font-size: 13px;
      font-weight: 600;
      text-decoration: none;
      white-space: nowrap;
    }
    .mcp-admin__link:hover {
      text-decoration: underline;
    }
    .mcp-admin__config {
      border: 1px solid #d8dde6;
      border-radius: 6px;
      margin-bottom: 16px;
      overflow: hidden;
    }
    .mcp-admin__config-head {
      align-items: center;
      background: #f8fafc;
      border-bottom: 1px solid #e6e9ef;
      display: flex;
      gap: 10px;
      justify-content: space-between;
      padding: 10px 12px;
    }
    .mcp-admin__config-title-wrap {
      min-width: 0;
    }
    .mcp-admin__config-head-actions {
      align-items: center;
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
      justify-content: flex-end;
    }
    .mcp-admin__section-title {
      color: #1f2933;
      font-size: 14px;
      font-weight: 700;
      margin: 0;
    }
    .mcp-admin__config-summary {
      color: #52616f;
      font-size: 12px;
    }
    .mcp-admin__config-message {
      color: #52616f;
      font-size: 13px;
      padding: 10px 12px 0;
    }
    .mcp-admin__config-message--error {
      color: #b42318;
    }
    .mcp-admin__config-table {
      border-collapse: collapse;
      min-width: 980px;
      table-layout: fixed;
      width: 100%;
    }
    .mcp-admin__config-table th,
    .mcp-admin__config-table td {
      border-bottom: 1px solid #e6e9ef;
      font-size: 13px;
      padding: 9px 10px;
      text-align: left;
      vertical-align: top;
    }
    .mcp-admin__config-table th {
      background: #ffffff;
      color: #3b4651;
      font-weight: 650;
      white-space: nowrap;
    }
    .mcp-admin__config-table tr:last-child td {
      border-bottom: 0;
    }
    .mcp-admin__step-title {
      font-weight: 650;
    }
    .mcp-admin__step-detail {
      color: #52616f;
      margin-top: 3px;
    }
    .mcp-admin__step-instructions {
      color: #334155;
      margin-top: 6px;
    }
    .mcp-admin__step-instructions-label {
      font-weight: 650;
    }
    .mcp-admin__step-instructions-list {
      margin: 4px 0 0 18px;
      padding: 0;
    }
    .mcp-admin__step-instructions-list li {
      margin: 3px 0;
    }
    .mcp-admin__config-body--collapsed {
      display: none;
    }
    .mcp-admin__cell-actions {
      align-items: center;
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }
    .mcp-admin__executions-head {
      align-items: center;
      border-top: 1px solid #d8dde6;
      display: flex;
      gap: 12px;
      justify-content: space-between;
      padding-top: 12px;
    }
    .mcp-admin__status {
      color: #52616f;
      font-size: 13px;
      margin: 10px 0;
      min-height: 18px;
    }
    .mcp-admin__status--error {
      color: #b42318;
    }
    .mcp-admin__table-wrap {
      border: 1px solid #d8dde6;
      border-radius: 6px;
      overflow-x: auto;
    }
    .mcp-admin__table {
      border-collapse: collapse;
      min-width: 920px;
      table-layout: fixed;
      width: 100%;
    }
    .mcp-admin__table th,
    .mcp-admin__table td {
      border-bottom: 1px solid #e6e9ef;
      font-size: 13px;
      padding: 9px 10px;
      text-align: left;
      vertical-align: top;
    }
    .mcp-admin__table th {
      background: #f6f8fa;
      color: #3b4651;
      font-weight: 650;
      white-space: nowrap;
    }
    .mcp-admin__row-toggle {
      background: transparent;
      border: 0;
      color: #315f8b;
      cursor: pointer;
      font-size: 18px;
      height: 26px;
      line-height: 20px;
      padding: 0;
      width: 26px;
    }
    .mcp-admin__summary {
      cursor: pointer;
    }
    .mcp-admin__summary:hover td {
      background: #f8fbff;
    }
    .mcp-admin__badge {
      border-radius: 999px;
      display: inline-block;
      font-size: 12px;
      font-weight: 650;
      line-height: 1;
      padding: 4px 8px;
    }
    .mcp-admin__badge--ok {
      background: #e7f5ea;
      color: #166534;
    }
    .mcp-admin__badge--error {
      background: #fdecec;
      color: #b42318;
    }
    .mcp-admin__badge--not-ok {
      background: #fff4d6;
      color: #8a4b00;
    }
    .mcp-admin__details[hidden] {
      display: none;
    }
    .mcp-admin__details-cell {
      background: #fbfcfe;
      padding: 14px 16px 18px !important;
    }
    .mcp-admin__details-grid {
      display: grid;
      gap: 12px;
      grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
    }
    .mcp-admin__panel-title {
      color: #3b4651;
      font-size: 12px;
      font-weight: 700;
      margin: 0 0 6px;
      text-transform: uppercase;
    }
    .mcp-admin__codebox {
      background: #101820;
      border: 1px solid #2e3b46;
      border-radius: 6px;
      color: #d7e2ec;
      font-family: "SFMono-Regular", Consolas, "Liberation Mono", monospace;
      font-size: 12px;
      line-height: 1.5;
      margin: 0;
      max-height: 460px;
      min-height: 180px;
      overflow: auto;
      padding: 12px;
      white-space: pre;
    }
    .mcp-token--keyword { color: #8dd3ff; }
    .mcp-token--string { color: #a6e3a1; }
    .mcp-token--number { color: #f9d877; }
    .mcp-token--comment { color: #8996a3; }
    .mcp-token--operator { color: #ffb86c; }
    .mcp-token--heading { color: #8dd3ff; font-weight: 700; }
    .mcp-token--error { color: #ff8b8b; font-weight: 700; }
    .mcp-token--muted { color: #8996a3; }
    .mcp-admin__truncate {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    @media (max-width: 900px) {
      .mcp-admin {
        padding: 14px;
      }
      .mcp-admin__bar {
        align-items: flex-start;
        flex-direction: column;
      }
      .mcp-admin__actions {
        justify-content: flex-start;
      }
      .mcp-admin__details-grid {
        grid-template-columns: 1fr;
      }
    }
  </style>

  <div class="mcp-admin__bar">
    <div>
      <h1 class="mcp-admin__title">MCP Script Runner Admin</h1>
    </div>
    <div class="mcp-admin__actions">
      <button id="mcp-admin-config-refresh" class="mcp-admin__button" type="button">Check config</button>
      <button id="mcp-admin-refresh" class="mcp-admin__button" type="button">Refresh executions</button>
    </div>
  </div>

  <section class="mcp-admin__config" aria-labelledby="mcp-admin-config-title">
    <div class="mcp-admin__config-head">
      <div class="mcp-admin__config-title-wrap">
        <h2 id="mcp-admin-config-title" class="mcp-admin__section-title">Configuration status</h2>
      </div>
      <div class="mcp-admin__config-head-actions">
        <div id="mcp-admin-config-summary" class="mcp-admin__config-summary">Checking...</div>
        <button id="mcp-admin-config-toggle" class="mcp-admin__button" type="button" aria-expanded="false" aria-controls="mcp-admin-config-body">Show</button>
      </div>
    </div>
    <div id="mcp-admin-config-body" class="mcp-admin__config-body mcp-admin__config-body--collapsed">
      <div id="mcp-admin-config-message" class="mcp-admin__config-message">Loading setup checks...</div>
      <div class="mcp-admin__table-wrap">
        <table class="mcp-admin__config-table">
          <thead>
            <tr>
              <th style="width: 110px;">Status</th>
              <th>Configuration step</th>
              <th style="width: 240px;">Action</th>
            </tr>
          </thead>
          <tbody id="mcp-admin-config-rows"></tbody>
        </table>
      </div>
    </div>
  </section>

  <div class="mcp-admin__executions-head">
    <div id="mcp-admin-meta" class="mcp-admin__meta">Latest 20 executions</div>
    <a class="mcp-admin__link" href="/u_mcp_script_execution_list.do?sysparm_query=ORDERBYDESCsys_created_on" target="_blank" rel="noopener">Open table</a>
  </div>

  <div id="mcp-admin-status" class="mcp-admin__status">Loading...</div>

  <div class="mcp-admin__table-wrap">
    <table class="mcp-admin__table">
      <thead>
        <tr>
          <th style="width: 42px;"></th>
          <th style="width: 180px;">Executed</th>
          <th style="width: 160px;">User</th>
          <th style="width: 90px;">Status</th>
          <th style="width: 90px;">Elapsed</th>
          <th>Script preview</th>
        </tr>
      </thead>
      <tbody id="mcp-admin-rows"></tbody>
    </table>
  </div>
</div>`

const adminPageClientScript = `(function () {
    var tableName = 'u_mcp_script_execution';
    var fields = [
        'sys_id',
        'sys_created_on',
        'u_executed_at',
        'u_user_name',
        'u_script',
        'u_result',
        'u_is_error',
        'u_error_message',
        'u_elapsed_ms'
    ].join(',');
    var endpoint = '/api/now/table/' + tableName +
        '?sysparm_query=' + encodeURIComponent('ORDERBYDESCsys_created_on') +
        '&sysparm_limit=20' +
        '&sysparm_fields=' + encodeURIComponent(fields) +
        '&sysparm_display_value=false';
    var configStatusEndpoint = '/api/global/mcp_script_runner/admin/status';
    var oauthClientEndpoint = '/api/global/mcp_script_runner/admin/oauth-client';
    var assignRolesEndpoint = '/api/global/mcp_script_runner/admin/roles';

    function $(id) {
        return document.getElementById(id);
    }

    function field(row, name) {
        var value = row && row[name];
        if (value === null || value === undefined) {
            return '';
        }
        if (typeof value === 'object') {
            return String(value.display_value || value.value || '');
        }
        return String(value);
    }

    function escapeHtml(value) {
        return String(value || '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    function truncate(value, length) {
        value = String(value || '').replace(/\\s+/g, ' ').trim();
        if (value.length <= length) {
            return value;
        }
        return value.slice(0, length - 1) + '...';
    }

    function apiHeaders(hasBody) {
        var userToken = (window.g_ck || (window.NOW && window.NOW.g_ck) || '');
        var headers = { Accept: 'application/json' };
        if (hasBody) {
            headers['Content-Type'] = 'application/json';
        }
        if (userToken) {
            headers['X-UserToken'] = userToken;
        }
        return headers;
    }

    function tokenClass(token) {
        if (/^\\/\\//.test(token) || /^\\/\\*/.test(token)) {
            return 'mcp-token--comment';
        }
        if (/^["']/.test(token)) {
            return 'mcp-token--string';
        }
        if (/^\\d/.test(token)) {
            return 'mcp-token--number';
        }
        if (/^(break|case|catch|continue|default|delete|do|else|false|finally|for|function|if|in|instanceof|new|null|return|switch|this|throw|true|try|typeof|undefined|var|void|while|with|GlideRecord|GlideDateTime|gs|out|print)$/.test(token)) {
            return 'mcp-token--keyword';
        }
        if (/^[{}()[\\].,;:+\\-*/%=<>!&|?]+$/.test(token)) {
            return 'mcp-token--operator';
        }
        return '';
    }

    function highlightJavaScript(code) {
        var pattern = /(\\/\\*[\\s\\S]*?\\*\\/|\\/\\/[^\\n\\r]*|"(?:\\\\.|[^"\\\\])*"|'(?:\\\\.|[^'\\\\])*'|\\b(?:break|case|catch|continue|default|delete|do|else|false|finally|for|function|if|in|instanceof|new|null|return|switch|this|throw|true|try|typeof|undefined|var|void|while|with|GlideRecord|GlideDateTime|gs|out|print)\\b|\\b\\d+(?:\\.\\d+)?\\b|[{}()[\\].,;:+\\-*/%=<>!&|?]+)/g;
        var html = '';
        var last = 0;
        var match;
        while ((match = pattern.exec(code || '')) !== null) {
            var token = match[0];
            var cls = tokenClass(token);
            html += escapeHtml(code.slice(last, match.index));
            html += cls ? '<span class="' + cls + '">' + escapeHtml(token) + '</span>' : escapeHtml(token);
            last = match.index + token.length;
        }
        html += escapeHtml(String(code || '').slice(last));
        return html;
    }

    function highlightOutput(output) {
        var lines = String(output || '').split(/\\r?\\n/);
        for (var i = 0; i < lines.length; i++) {
            var line = lines[i];
            var escaped = escapeHtml(line);
            if (/^--- .+ ---$/.test(line)) {
                lines[i] = '<span class="mcp-token--heading">' + escaped + '</span>';
            } else if (/^(Error:|.*Exception|.*Error\\b)/.test(line)) {
                lines[i] = '<span class="mcp-token--error">' + escaped + '</span>';
            } else if (/^\\(elapsed /.test(line)) {
                lines[i] = '<span class="mcp-token--muted">' + escaped + '</span>';
            } else {
                lines[i] = escaped
                    .replace(/(&quot;[^&]*?&quot;)/g, '<span class="mcp-token--string">$1</span>')
                    .replace(/\\b(true|false|null|undefined)\\b/g, '<span class="mcp-token--keyword">$1</span>')
                    .replace(/\\b(\\d+(?:\\.\\d+)?)\\b/g, '<span class="mcp-token--number">$1</span>');
            }
        }
        return lines.join('\\n');
    }

    function setStatus(message, isError) {
        var status = $('mcp-admin-status');
        if (!status) {
            return;
        }
        status.textContent = message || '';
        status.className = isError ? 'mcp-admin__status mcp-admin__status--error' : 'mcp-admin__status';
    }

    function setConfigMessage(message, isError) {
        var messageNode = $('mcp-admin-config-message');
        if (!messageNode) {
            return;
        }
        messageNode.textContent = message || '';
        messageNode.className = isError
            ? 'mcp-admin__config-message mcp-admin__config-message--error'
            : 'mcp-admin__config-message';
    }

    function setConfigSummary(message) {
        var summary = $('mcp-admin-config-summary');
        if (summary) {
            summary.textContent = message || '';
        }
    }

    function configBadge(status) {
        if (status === 'ok') {
            return '<span class="mcp-admin__badge mcp-admin__badge--ok">OK</span>';
        }
        return '<span class="mcp-admin__badge mcp-admin__badge--not-ok">Not OK</span>';
    }

    function renderInstructions(instructions) {
        var lines = instructions;
        if (!lines) {
            lines = [];
        }
        if (typeof lines === 'string') {
            lines = [lines];
        }
        if (!lines.length) {
            return '';
        }
        var html = '<div class="mcp-admin__step-instructions"><div class="mcp-admin__step-instructions-label">Instructions</div><ul class="mcp-admin__step-instructions-list">';
        for (var i = 0; i < lines.length; i++) {
            html += '<li>' + escapeHtml(lines[i]) + '</li>';
        }
        html += '</ul></div>';
        return html;
    }

    function renderConfig(steps) {
        var body = $('mcp-admin-config-rows');
        if (!body) {
            return;
        }
        body.innerHTML = '';
        if (!steps || !steps.length) {
            body.innerHTML = '<tr><td colspan="3">No configuration checks returned.</td></tr>';
            return;
        }
        for (var i = 0; i < steps.length; i++) {
            var step = steps[i];
            var actionHtml = '';
            if (step.action && step.action.type === 'create_oauth_client') {
                actionHtml += '<button class="mcp-admin__button" type="button" data-config-action="create-oauth-client">' + escapeHtml(step.action.label || 'Create') + '</button>';
            } else if (step.action && step.action.type === 'assign_missing_roles') {
                actionHtml += '<button class="mcp-admin__button" type="button" data-config-action="assign-roles">' + escapeHtml(step.action.label || 'Assign Roles') + '</button>';
            }
            if (step.link) {
                actionHtml += '<a class="mcp-admin__link" href="' + escapeHtml(step.link) + '" target="_blank" rel="noopener">' + escapeHtml(step.linkLabel || 'Open') + '</a>';
            }
            if (!actionHtml) {
                actionHtml = '<span class="mcp-admin__meta">No action</span>';
            }

            var row = document.createElement('tr');
            row.innerHTML =
                '<td>' + configBadge(step.status) + '</td>' +
                '<td><div class="mcp-admin__step-title">' + escapeHtml(step.label) + '</div>' +
                '<div class="mcp-admin__step-detail">' + escapeHtml(step.detail || '') + '</div>' +
                renderInstructions(step.instructions) + '</td>' +
                '<td><div class="mcp-admin__cell-actions">' + actionHtml + '</div></td>';
            body.appendChild(row);
        }
    }

    function toggleConfigPane() {
        var body = $('mcp-admin-config-body');
        var button = $('mcp-admin-config-toggle');
        if (!body || !button) {
            return;
        }
        var collapsedClass = 'mcp-admin__config-body--collapsed';
        var collapsed = new RegExp('(^|\\\\s)' + collapsedClass + '(\\\\s|$)').test(body.className);
        if (collapsed) {
            body.className = body.className.replace(new RegExp('(^|\\\\s)' + collapsedClass + '(?=\\\\s|$)', 'g'), '').replace(/^\\s+|\\s+$/g, '');
            button.textContent = 'Hide';
            button.setAttribute('aria-expanded', 'true');
        } else {
            body.className = body.className + ' ' + collapsedClass;
            button.textContent = 'Show';
            button.setAttribute('aria-expanded', 'false');
        }
    }

    function loadConfig() {
        setConfigSummary('Checking...');
        setConfigMessage('Loading setup checks...', false);
        fetch(configStatusEndpoint, {
            credentials: 'same-origin',
            headers: apiHeaders(false)
        })
            .then(function (response) {
                if (!response.ok) {
                    throw new Error('Configuration API returned HTTP ' + response.status);
                }
                return response.json();
            })
            .then(function (payload) {
                var result = payload && payload.result ? payload.result : payload;
                var steps = result && result.steps ? result.steps : [];
                renderConfig(steps);
                setConfigSummary(String(result.okCount || 0) + '/' + String(steps.length) + ' OK');
                setConfigMessage(result.notOkCount ? 'Some setup checks need attention.' : 'All detected setup checks are OK.', !!result.notOkCount);
            })
            .catch(function (error) {
                renderConfig([]);
                setConfigSummary('Check failed');
                setConfigMessage('Unable to load configuration status: ' + error.message, true);
            });
    }

    function createOAuthClient(button) {
        var originalText = button.textContent;
        button.disabled = true;
        button.textContent = 'Working...';
        fetch(oauthClientEndpoint, {
            method: 'POST',
            credentials: 'same-origin',
            headers: apiHeaders(true),
            body: '{}'
        })
            .then(function (response) {
                if (!response.ok) {
                    throw new Error('OAuth client API returned HTTP ' + response.status);
                }
                return response.json();
            })
            .then(function (payload) {
                var result = payload && payload.result ? payload.result : payload;
                var secretText = result.client_secret
                    ? ' Client secret: ' + result.client_secret
                    : ' Existing client secret was not changed.';
                setConfigMessage((result.message || 'OAuth client saved.') + secretText, false);
                loadConfig();
            })
            .catch(function (error) {
                setConfigMessage('Unable to create OAuth client: ' + error.message, true);
            })
            .then(function () {
                button.disabled = false;
                button.textContent = originalText;
            });
    }

    function assignRoles(button) {
        var originalText = button.textContent;
        button.disabled = true;
        button.textContent = 'Working...';
        fetch(assignRolesEndpoint, {
            method: 'POST',
            credentials: 'same-origin',
            headers: apiHeaders(true),
            body: '{}'
        })
            .then(function (response) {
                if (!response.ok) {
                    throw new Error('Role assignment API returned HTTP ' + response.status);
                }
                return response.json();
            })
            .then(function (payload) {
                var result = payload && payload.result ? payload.result : payload;
                setConfigMessage(result.message || 'Role assignment complete.', !result.ok);
                loadConfig();
            })
            .catch(function (error) {
                setConfigMessage('Unable to assign roles: ' + error.message, true);
            })
            .then(function () {
                button.disabled = false;
                button.textContent = originalText;
            });
    }

    function renderRows(records) {
        var body = $('mcp-admin-rows');
        if (!body) {
            return;
        }
        body.innerHTML = '';
        if (!records.length) {
            body.innerHTML = '<tr><td colspan="6">No script executions found.</td></tr>';
            return;
        }

        for (var i = 0; i < records.length; i++) {
            var row = records[i];
            var sysId = field(row, 'sys_id') || String(i);
            var detailsId = 'mcp-admin-details-' + sysId.replace(/[^a-zA-Z0-9_-]/g, '');
            var script = field(row, 'u_script');
            var result = field(row, 'u_result');
            var isError = field(row, 'u_is_error') === 'true' || field(row, 'u_is_error') === '1';
            var executed = field(row, 'u_executed_at') || field(row, 'sys_created_on');
            var statusBadge = isError
                ? '<span class="mcp-admin__badge mcp-admin__badge--error">Error</span>'
                : '<span class="mcp-admin__badge mcp-admin__badge--ok">OK</span>';

            var summary = document.createElement('tr');
            summary.className = 'mcp-admin__summary';
            summary.setAttribute('data-details-id', detailsId);
            summary.innerHTML =
                '<td><button class="mcp-admin__row-toggle" type="button" aria-expanded="false" aria-controls="' + detailsId + '">+</button></td>' +
                '<td>' + escapeHtml(executed) + '</td>' +
                '<td class="mcp-admin__truncate" title="' + escapeHtml(field(row, 'u_user_name')) + '">' + escapeHtml(field(row, 'u_user_name')) + '</td>' +
                '<td>' + statusBadge + '</td>' +
                '<td>' + escapeHtml(field(row, 'u_elapsed_ms')) + ' ms</td>' +
                '<td class="mcp-admin__truncate" title="' + escapeHtml(truncate(script, 500)) + '">' + escapeHtml(truncate(script, 140)) + '</td>';

            var details = document.createElement('tr');
            details.id = detailsId;
            details.className = 'mcp-admin__details';
            details.hidden = true;
            details.innerHTML =
                '<td class="mcp-admin__details-cell" colspan="6">' +
                '<div class="mcp-admin__details-grid">' +
                '<section><h2 class="mcp-admin__panel-title">Script</h2><pre class="mcp-admin__codebox"><code>' + highlightJavaScript(script) + '</code></pre></section>' +
                '<section><h2 class="mcp-admin__panel-title">Output</h2><pre class="mcp-admin__codebox"><code>' + highlightOutput(result) + '</code></pre></section>' +
                '</div>' +
                '</td>';

            body.appendChild(summary);
            body.appendChild(details);
        }
    }

    function toggleRow(row) {
        var details = $(row.getAttribute('data-details-id'));
        var button = row.querySelector('.mcp-admin__row-toggle');
        if (!details || !button) {
            return;
        }
        var open = details.hidden;
        details.hidden = !open;
        button.textContent = open ? '-' : '+';
        button.setAttribute('aria-expanded', open ? 'true' : 'false');
    }

    function loadExecutions() {
        setStatus('Loading...', false);
        fetch(endpoint, {
            credentials: 'same-origin',
            headers: apiHeaders(false)
        })
            .then(function (response) {
                if (!response.ok) {
                    throw new Error('Table API returned HTTP ' + response.status);
                }
                return response.json();
            })
            .then(function (payload) {
                var records = payload && payload.result ? payload.result : [];
                renderRows(records);
                setStatus('Showing ' + records.length + ' latest executions.', false);
            })
            .catch(function (error) {
                renderRows([]);
                setStatus('Unable to load script executions: ' + error.message, true);
            });
    }

    document.addEventListener('click', function (event) {
        var target = event.target;
        var action = target && target.closest ? target.closest('[data-config-action]') : null;
        if (action && action.getAttribute('data-config-action') === 'create-oauth-client') {
            event.preventDefault();
            createOAuthClient(action);
            return;
        }
        if (action && action.getAttribute('data-config-action') === 'assign-roles') {
            event.preventDefault();
            assignRoles(action);
            return;
        }
        var row = target && target.closest ? target.closest('.mcp-admin__summary') : null;
        if (row) {
            toggleRow(row);
        }
    });

    window.addEventListener('load', function () {
        var refresh = $('mcp-admin-refresh');
        if (refresh) {
            refresh.addEventListener('click', loadExecutions);
        }
        var configRefresh = $('mcp-admin-config-refresh');
        if (configRefresh) {
            configRefresh.addEventListener('click', loadConfig);
        }
        var configToggle = $('mcp-admin-config-toggle');
        if (configToggle) {
            configToggle.addEventListener('click', toggleConfigPane);
        }
        loadConfig();
        loadExecutions();
    });
})();`

export const mcp_script_runner_admin_page = UiPage({
    $id: Now.ID['mcp_script_runner_admin_page'],
    category: 'general',
    endpoint: 'mcp_script_runner_admin.do',
    description: 'Admin page for reviewing MCP Script Runner script executions.',
    html: adminPageHtml,
    clientScript: adminPageClientScript,
})

const applicationMenu = ApplicationMenu({
    $id: Now.ID['mcp_script_runner_menu'],
    title: 'MCP Script Runner',
    hint: 'MCP Script Runner administration',
    description: 'Administration pages for MCP Script Runner.',
    roles: [scriptRunnerRole],
    active: true,
    order: 500,
})

Record({
    $id: Now.ID['mcp_script_runner_admin_module'],
    table: 'sys_app_module',
    data: {
        title: 'MCP Script Runner Admin',
        application: applicationMenu,
        link_type: 'DIRECT',
        query: 'mcp_script_runner_admin.do',
        hint: 'View recent MCP Script Runner executions',
        roles: ['mcp_script_runner'],
        active: true,
        order: 100,
    },
})

const adminStatusScript = `(function (request, response) {
    var CLIENT_NAME = 'MCP Script Runner Client';
    var SERVER_NAME = 'MCP Script Runner';
    var RUNNER_ROLE = 'mcp_script_runner';
    var REQUIRED_CURRENT_USER_ROLES = [
        RUNNER_ROLE,
        'sn_ai_governance.ai_steward',
        'sn_generative_ai.data_steward',
        'df_data_steward'
    ];
    var MIN_PLATFORM_LABEL = 'Australia Patch 2 Hot Fix 2';

    function writeJson(status, payload) {
        response.setStatus(status);
        try { response.setContentType('application/json'); } catch (e) { /* ignore */ }
        var sw = response.getStreamWriter();
        sw.writeString(JSON.stringify(payload));
    }

    function enc(value) {
        return encodeURIComponent(String(value || ''));
    }

    function instanceBaseUrl() {
        var uri = '';
        try { uri = String(gs.getProperty('glide.servlet.uri') || ''); } catch (e) { uri = ''; }
        if (!uri) {
            try { uri = String(gs.getProperty('glide.url') || ''); } catch (e2) { uri = ''; }
        }
        return uri.replace(/\\/$/, '');
    }

    function tableIsAvailable(tableName) {
        try {
            var gr = new GlideRecord(tableName);
            return gr.isValid();
        } catch (e) {
            return false;
        }
    }

    function listUrl(tableName, query) {
        return '/' + tableName + '_list.do' + (query ? '?sysparm_query=' + enc(query) : '');
    }

    function formUrl(tableName, sysId, fallbackQuery) {
        if (sysId) {
            return '/' + tableName + '.do?sys_id=' + enc(sysId);
        }
        return listUrl(tableName, fallbackQuery || '');
    }

    function machineIdentityAuthzCodeUrl(oauth) {
        if (!oauth || !oauth.sys_id) {
            return '/now/machine-identity-console/inbound-integrations/welcome';
        }
        return '/now/machine-identity-console/authz-code-record/' + enc(oauth.sys_id) + '/' + String(new GlideDateTime().getNumericValue());
    }

    function appManagerUrl() {
        return '/now/app-manager/home';
    }

    function isActiveValue(value) {
        value = String(value || '').toLowerCase();
        return value === 'true' || value === 'active' || value === '1';
    }

    function getValue(gr, fieldName) {
        try {
            if (typeof gr.isValidField === 'function' && !gr.isValidField(fieldName)) {
                return '';
            }
            return String(gr.getValue(fieldName) || '');
        } catch (e) {
            return '';
        }
    }

    function getDisplay(gr, fieldName) {
        try {
            if (typeof gr.isValidField === 'function' && !gr.isValidField(fieldName)) {
                return '';
            }
            return String(gr.getDisplayValue(fieldName) || '');
        } catch (e) {
            return '';
        }
    }

    function moduleExists(queryValue) {
        try {
            var module = new GlideRecord('sys_app_module');
            if (!module.isValid()) { return false; }
            module.addQuery('query', queryValue);
            module.addQuery('active', 'true');
            module.setLimit(1);
            module.query();
            return module.next();
        } catch (e) {
            return false;
        }
    }

    function activePlugin(idValue, nameValue) {
        try {
            var plugin = new GlideRecord('v_plugin');
            if (!plugin.isValid()) { return false; }
            var qc = plugin.addQuery('id', idValue);
            if (nameValue) { qc.addOrCondition('name', nameValue); }
            plugin.query();
            while (plugin.next()) {
                if (isActiveValue(getValue(plugin, 'active'))) {
                    return true;
                }
            }
        } catch (e) {
            return false;
        }
        return false;
    }

    function scopeExists(scopeName) {
        try {
            var scope = new GlideRecord('sys_scope');
            if (!scope.isValid()) { return false; }
            scope.addQuery('scope', scopeName);
            scope.setLimit(1);
            scope.query();
            return scope.next();
        } catch (e) {
            return false;
        }
    }

    function uxRouteExists(routeTypeValue, nameValue) {
        try {
            var route = new GlideRecord('sys_ux_app_route');
            if (!route.isValid()) { return false; }
            if (route.isValidField('route_type')) {
                route.addQuery('route_type', routeTypeValue);
            } else if (route.isValidField('name')) {
                route.addQuery('name', nameValue);
            } else {
                return false;
            }
            route.setLimit(20);
            route.query();
            while (route.next()) {
                var routeType = getValue(route, 'route_type');
                var routeName = getValue(route, 'name') || getDisplay(route, 'name');
                if (routeType === routeTypeValue || routeName === nameValue) {
                    return true;
                }
            }
        } catch (e) {
            return false;
        }
        return false;
    }

    function productVersionInfo() {
        var names = [
            'glide.war',
            'glide.product.version',
            'glide.buildname',
            'glide.build',
            'glide.servlet.version'
        ];
        var values = [];
        var raw = '';
        for (var i = 0; i < names.length; i++) {
            var value = '';
            try { value = String(gs.getProperty(names[i]) || ''); } catch (e) { value = ''; }
            if (value) {
                values.push(names[i] + '=' + value);
                raw += ' ' + value;
            }
        }
        return { raw: raw, values: values };
    }

    function parsePlatformVersion(raw) {
        var normalized = String(raw || '').toLowerCase().replace(/[_-]+/g, ' ');
        var compact = normalized.replace(/\\s+/g, '');
        var releases = [
            { key: 'utah', label: 'Utah' },
            { key: 'vancouver', label: 'Vancouver' },
            { key: 'washingtondc', label: 'Washington DC' },
            { key: 'xanadu', label: 'Xanadu' },
            { key: 'yokohama', label: 'Yokohama' },
            { key: 'zurich', label: 'Zurich' },
            { key: 'australia', label: 'Australia' }
        ];
        var familyIndex = -1;
        var familyLabel = '';
        for (var i = 0; i < releases.length; i++) {
            if (compact.indexOf(releases[i].key) > -1) {
                familyIndex = i;
                familyLabel = releases[i].label;
            }
        }
        var patch = -1;
        var hotfix = -1;
        var patchMatch = normalized.match(/patch\\s*(\\d+)/);
        if (patchMatch) { patch = parseInt(patchMatch[1], 10); }
        var hotfixMatch = normalized.match(/hot\\s*fix\\s*(\\d+)|hotfix\\s*(\\d+)|hf\\s*(\\d+)/);
        if (hotfixMatch) {
            hotfix = parseInt(hotfixMatch[1] || hotfixMatch[2] || hotfixMatch[3], 10);
        }
        return { familyIndex: familyIndex, familyLabel: familyLabel, patch: patch, hotfix: hotfix };
    }

    function platformMeetsMinimum() {
        var info = productVersionInfo();
        var parsed = parsePlatformVersion(info.raw);
        var minIndex = 6; // Australia in the ordered release list above.
        var ok = false;
        if (parsed.familyIndex > minIndex) {
            ok = true;
        } else if (parsed.familyIndex === minIndex) {
            ok = parsed.patch > 2 || (parsed.patch === 2 && parsed.hotfix >= 2);
        }
        var detected = parsed.familyLabel || 'unknown release';
        if (parsed.patch >= 0) {
            detected += ' Patch ' + parsed.patch;
        }
        if (parsed.hotfix >= 0) {
            detected += ' Hot Fix ' + parsed.hotfix;
        }
        var rawDetail = info.values.length ? ' (' + info.values.join('; ') + ')' : '';
        return {
            ok: ok,
            detected: detected,
            detail: ok
                ? 'Detected ' + detected + ', which meets the minimum ' + MIN_PLATFORM_LABEL + '.' + rawDetail
                : 'Detected ' + detected + '. Minimum required is ' + MIN_PLATFORM_LABEL + ' or newer.' + rawDetail
        };
    }

    function findOAuthClient() {
        try {
            var client = new GlideRecord('oauth_entity');
            if (!client.isValid()) { return null; }
            client.addQuery('name', CLIENT_NAME);
            client.addQuery('type', 'client');
            client.orderByDesc('sys_updated_on');
            client.setLimit(1);
            client.query();
            if (!client.next()) { return null; }
            var redirects = getValue(client, 'redirect_url').toLowerCase();
            return {
                sys_id: String(client.getUniqueValue()),
                active: isActiveValue(getValue(client, 'active')),
                client_id: getValue(client, 'client_id'),
                redirect_url: getValue(client, 'redirect_url'),
                scope: getValue(client, 'scope_restriction_status'),
                scopeDisplay: getDisplay(client, 'scope_restriction_status'),
                hasOauthRedirect: redirects.indexOf('/oauth_redirect.do') > -1,
                hasMcpRedirect: redirects.indexOf('/mcp_redirect.do') > -1
            };
        } catch (e) {
            return null;
        }
    }

    function findRoleByName(roleName) {
        try {
            var role = new GlideRecord('sys_user_role');
            if (!role.isValid()) { return null; }
            role.addQuery('name', roleName);
            role.setLimit(1);
            role.query();
            if (!role.next()) { return null; }
            return { sys_id: String(role.getUniqueValue()), name: getValue(role, 'name') };
        } catch (e) {
            return null;
        }
    }

    function currentUserHasAssignedRole(roleId) {
        try {
            var userRole = new GlideRecord('sys_user_has_role');
            if (!userRole.isValid()) { return false; }
            userRole.addQuery('user', gs.getUserID());
            userRole.addQuery('role', roleId);
            userRole.setLimit(1);
            userRole.query();
            return userRole.next();
        } catch (e) {
            return false;
        }
    }

    function currentUserRoleStatus(roleNames) {
        var present = [];
        var missing = [];
        for (var i = 0; i < roleNames.length; i++) {
            var roleName = roleNames[i];
            var role = findRoleByName(roleName);
            if (!role) {
                missing.push(roleName + ' (role record missing)');
            } else if (currentUserHasAssignedRole(role.sys_id)) {
                present.push(roleName);
            } else {
                missing.push(roleName);
            }
        }
        return { ok: missing.length === 0, present: present, missing: missing };
    }

    function findMcpServer() {
        try {
            var server = new GlideRecord('sn_mcp_server');
            if (!server.isValid()) { return null; }
            server.addQuery('name', SERVER_NAME);
            server.orderByDesc('sys_updated_on');
            server.setLimit(1);
            server.query();
            if (!server.next()) { return null; }
            return {
                sys_id: String(server.getUniqueValue()),
                name: getValue(server, 'name'),
                connectionAlias: getValue(server, 'connection_alias'),
                connectionAliasDisplay: getDisplay(server, 'connection_alias')
            };
        } catch (e) {
            return null;
        }
    }

    function findGovernanceDetails() {
        if (!tableIsAvailable('sn_ai_governance_asset_governance_details')) {
            return null;
        }
        function readRecord(gr) {
            return {
                sys_id: String(gr.getUniqueValue()),
                asset: getDisplay(gr, 'asset'),
                status: getValue(gr, 'status'),
                statusDisplay: getDisplay(gr, 'status'),
                assetState: getValue(gr, 'asset_state'),
                assetStateDisplay: getDisplay(gr, 'asset_state'),
                deployedAt: getValue(gr, 'deployed_at'),
                riskScore: getDisplay(gr, 'risk_score')
            };
        }
        try {
            var request = new GlideRecord('sn_ai_governance_assessment_request');
            if (request.isValid()) {
                request.orderByDesc('sys_updated_on');
                request.setLimit(250);
                request.query();
                while (request.next()) {
                    if (getDisplay(request, 'asset') === SERVER_NAME) {
                        var detailId = getValue(request, 'asset');
                        var fromRequest = new GlideRecord('sn_ai_governance_asset_governance_details');
                        if (fromRequest.get(detailId)) {
                            return readRecord(fromRequest);
                        }
                    }
                }
            }
        } catch (eReq) {
            /* fall back to direct governance searches below */
        }
        try {
            var byAsset = new GlideRecord('sn_ai_governance_asset_governance_details');
            byAsset.addQuery('asset.name', SERVER_NAME);
            byAsset.orderByDesc('sys_updated_on');
            byAsset.setLimit(1);
            byAsset.query();
            if (byAsset.next() && getDisplay(byAsset, 'asset') === SERVER_NAME) {
                return readRecord(byAsset);
            }
        } catch (e) {
            /* fall back to display-value scan below */
        }
        try {
            var details = new GlideRecord('sn_ai_governance_asset_governance_details');
            details.orderByDesc('sys_updated_on');
            details.setLimit(250);
            details.query();
            while (details.next()) {
                if (getDisplay(details, 'asset') === SERVER_NAME) {
                    return readRecord(details);
                }
            }
        } catch (e2) {
            return null;
        }
        return null;
    }

    function findBuildAgentSession(mcpServer) {
        try {
            var session = new GlideRecord('sn_mcp_client_server_session_mapping');
            if (!session.isValid()) { return null; }
            session.addQuery('user', gs.getUserID());
            if (mcpServer && mcpServer.sys_id) {
                session.addQuery('mcp_server', mcpServer.sys_id);
            } else {
                session.addQuery('server_name', SERVER_NAME);
            }
            session.orderByDesc('sys_updated_on');
            session.setLimit(1);
            session.query();
            if (!session.next()) { return null; }
            return {
                sys_id: String(session.getUniqueValue()),
                status: getValue(session, 'status'),
                statusDisplay: getDisplay(session, 'status'),
                user: getDisplay(session, 'user'),
                server: getDisplay(session, 'mcp_server') || getValue(session, 'server_name')
            };
        } catch (e) {
            return null;
        }
    }

    function step(id, label, ok, detail, instructions, link, linkLabel, action) {
        var item = {
            id: id,
            label: label,
            status: ok ? 'ok' : 'not_ok',
            detail: detail || '',
            instructions: instructions || [],
            link: link || '',
            linkLabel: linkLabel || 'Open'
        };
        if (action) { item.action = action; }
        return item;
    }

    var baseUrl = instanceBaseUrl();
    var oauth = findOAuthClient();
    var roleStatus = currentUserRoleStatus(REQUIRED_CURRENT_USER_ROLES);
    var mcpServer = findMcpServer();
    var governance = findGovernanceDetails();
    var session = findBuildAgentSession(mcpServer);
    var canCreateOAuth = gs.hasRole('admin');
    var platform = platformMeetsMinimum();

    var hasMcpTables = tableIsAvailable('sn_mcp_server') && tableIsAvailable('cmdb_ci_function_mcp');
    var hasConnectHubRoute = uxRouteExists('connect-hub', 'WDF Connect Hub');
    var buildAgentInstalled = scopeExists('sn_build_agent') || scopeExists('sn_build_agent_pro') || scopeExists('sn_ba_glide_tools');
    var connectHubReady = hasMcpTables && hasConnectHubRoute && buildAgentInstalled;
    var missingPrereqs = [];
    if (!hasConnectHubRoute) { missingPrereqs.push('Connect Hub route'); }
    if (!hasMcpTables) { missingPrereqs.push('required MCP/WDF tables'); }
    if (!buildAgentInstalled) { missingPrereqs.push('Build Agent app'); }
    var connectHubDetail = connectHubReady
        ? 'Connect Hub route, required MCP/WDF tables, and Build Agent are available.'
        : 'Missing ' + missingPrereqs.join(', ') + '.';
    var connectHubLink = connectHubReady ? '/now/wdf-home/connect-hub' : appManagerUrl();
    var connectHubLinkLabel = connectHubReady ? 'Open Connect Hub' : 'Open plugins';

    var oauthOk = !!(oauth && oauth.active && oauth.client_id &&
        oauth.hasOauthRedirect && oauth.hasMcpRedirect &&
        oauth.scope === 'unrestricted');
    var oauthDetail = oauth
        ? 'Client ID ' + oauth.client_id + '; redirects ' + (oauth.hasOauthRedirect && oauth.hasMcpRedirect ? 'OK' : 'missing') + '; scope ' + (oauth.scopeDisplay || oauth.scope || 'unknown') + '.'
        : 'OAuth client named "' + CLIENT_NAME + '" was not found.';
    var oauthAction = !oauthOk && canCreateOAuth
        ? { type: 'create_oauth_client', label: oauth ? 'Fix' : 'Create' }
        : null;

    var roleOk = roleStatus.ok;
    var roleDetail = roleOk
        ? 'Current user ' + gs.getUserName() + ' has all required roles: ' + roleStatus.present.join(', ') + '.'
        : 'Current user ' + gs.getUserName() + ' is missing required roles: ' + roleStatus.missing.join(', ') + '.';
    var roleAction = !roleOk
        ? { type: 'assign_missing_roles', label: 'Assign Roles' }
        : null;

    var connectionOk = !!(mcpServer && mcpServer.connectionAlias);
    var connectionDetail = mcpServer
        ? 'MCP server record exists' + (mcpServer.connectionAliasDisplay ? ' with alias ' + mcpServer.connectionAliasDisplay + '.' : ', but no connection alias is set.')
        : 'No sn_mcp_server record named "' + SERVER_NAME + '" was found.';

    var governanceOk = !!(governance &&
        (governance.status === '2' || governance.statusDisplay === 'Approved') &&
        (governance.assetState === 'deployed' || governance.assetStateDisplay === 'Deployed' || governance.deployedAt));
    var governanceDetail = governance
        ? 'AICT status ' + (governance.statusDisplay || governance.status || 'unknown') + '; state ' + (governance.assetStateDisplay || governance.assetState || 'unknown') + (governance.riskScore ? '; risk ' + governance.riskScore : '') + '.'
        : 'No AI Control Tower governance detail for "' + SERVER_NAME + '" was found.';

    var inboundOk = !!(oauth && oauth.scope === 'unrestricted');
    var inboundDetail = oauth
        ? 'Inbound integration scope is ' + (oauth.scopeDisplay || oauth.scope || 'unknown') + '.'
        : 'OAuth inbound integration is missing because the client is missing.';

    var sessionOk = !!(session && session.status === 'connected');
    var sessionDetail = session
        ? 'Current user session is ' + (session.statusDisplay || session.status) + ' for ' + (session.server || SERVER_NAME) + '.'
        : 'No connected Build Agent MCP session was found for the current user.';

    var steps = [
        step('prereq_platform', 'Prerequisites: Platform release is ' + MIN_PLATFORM_LABEL + ' or newer', platform.ok,
            platform.detail,
            [
                'Confirm the instance is running ' + MIN_PLATFORM_LABEL + ' or newer.',
                'Open stats or system diagnostics to verify the release, patch, and hot fix.',
                'Upgrade or patch the instance before configuring Build Agent MCP servers.'
            ],
            '/stats.do', 'Open stats'),
        step('prereq_plugins', 'Prerequisites: Connect Hub / WDF plugin and Build Agent', connectHubReady,
            connectHubDetail,
            [
                'Install the Connect Hub plugin.',
                'Install Build Agent.',
                'Confirm Workflow Data Fabric / Connect Hub is available.'
            ],
            connectHubLink, connectHubLinkLabel),
        step('step_1_oauth_client', 'Step 1: OAuth client with redirect URLs and Broadly scoped setting', oauthOk,
            oauthDetail,
            [
                'Open System OAuth > Application Registry > New > Create an OAuth API endpoint for external clients.',
                'Name: ' + CLIENT_NAME + '.',
                'Redirect URL: ' + baseUrl + '/oauth_redirect.do,' + baseUrl + '/mcp_redirect.do',
                'Scope Restriction: Broadly scoped. If shown as a checkbox, leave "Allow access only to APIs in selected scope" unchecked.',
                'Submit, then record the generated Client ID and Client Secret.'
            ],
            formUrl('oauth_entity', oauth && oauth.sys_id, 'name=' + CLIENT_NAME), oauth ? 'Open client' : 'Open OAuth clients', oauthAction),
        step('step_2_role', 'Step 2: logged-in user has required roles', roleOk,
            roleDetail,
            [
                'Open User Administration > Users.',
                'Open the logged-in setup / Build Agent user.',
                'Grant ' + REQUIRED_CURRENT_USER_ROLES.join(', ') + '.',
                'Click Check config in this page to refresh configuration status.'
            ],
            listUrl('sys_user_has_role', 'user=' + gs.getUserID() + '^role.nameIN' + REQUIRED_CURRENT_USER_ROLES.join(',')), 'Open role grants', roleAction),
        step('step_3_connect_hub', 'Step 3: MCP connection registered in Connect Hub', connectionOk,
            connectionDetail,
            [
                'Open Workflow Data Fabric > Connect Hub.',
                'Click Create > Model Context Protocol Connector.',
                'Click Create a custom connector at the bottom right.',
                'Server name: ' + SERVER_NAME + '.',
                'System: select an existing system or create a new one named MCP.',
                'Select New connection.',
                'Connection name: ' + SERVER_NAME + '.',
                'Endpoint URL: ' + baseUrl + '/api/global/mcp_script_runner',
                'Authentication Method: OAuth 2.1.',
                'Client Registration Type: Manual Client Registration.',
                'Authorization method: Authorization Code.',
                'Client Authentication: Client Secret Basic.',
                'Client ID / Client Secret: insert the values created in Step 1.',
                'OAuth Auth URL: ' + baseUrl + '/oauth_auth.do',
                'OAuth Token URL: ' + baseUrl + '/oauth_token.do',
                'Save, complete the OAuth login/consent popup by clicking Allow.',
                'Click Check config in this page to refresh configuration status.'
            ],
            mcpServer ? formUrl('sn_mcp_server', mcpServer.sys_id) : connectHubLink, mcpServer ? 'Open server' : connectHubLinkLabel),
        step('step_4_aict', 'Step 4: AI Control Tower asset approved and deployed', governanceOk,
            governanceDetail,
            [
                'Open AI Control Tower home.',
                'Click the AI Assets list button on the left bar.',
                'Under AI asset inventory - Managed, select MCP servers.',
                'Open the ' + SERVER_NAME + ' asset.',
                'Click Request approval.',
                'Click the approval ID shown in the popup.',
                'Assign the approval to yourself.',
                'Advance each playbook step, complete the risk score, then approve/deploy the asset.'
            ],
            governanceOk ? formUrl('sn_ai_governance_asset_governance_details', governance.sys_id) : '/now/ai-control-tower/home', governanceOk ? 'Open approval status' : 'Open AICT'),
        step('step_5_inbound_scope', 'Step 5: OAuth inbound integration is broadly scoped', inboundOk,
            inboundDetail,
            [
                'Open System OAuth > Inbound Integrations.',
                'Find the integration for ' + CLIENT_NAME + '.',
                'Wait a few seconds after the page opens so all fields load.',
                'If an update is needed, Provider name is mandatory; any value is fine, for example "Local".',
                'Confirm "Allow access only to APIs in selected scope" is unchecked.'
            ],
            machineIdentityAuthzCodeUrl(oauth), oauth ? 'Open integration' : 'Open inbound integrations'),
        step('step_6_build_agent', 'Step 6: MCP server enabled in Build Agent', sessionOk,
            sessionDetail,
            [
                'Open the ServiceNow IDE.',
                'Open the Build Agent chat panel.',
                'Click the settings gear icon at the top of the Build Agent chat window.',
                'Enable MCP Servers.',
                'Click the cube icon in the Build Agent chat window.',
                'Confirm ' + SERVER_NAME + ' is listed and enabled.',
                'Click Allow on the first-use MCP server prompt if Build Agent shows it.',
                'This step appears OK only after Build Agent first uses ' + SERVER_NAME + '.',
                'To test the MCP server, ask Build Agent to list the last 10 records from syslog. Build Agent normally does not have direct access to syslog, so this confirms MCP Script Runner is being used.'
            ],
            '/sn_glider_app/ide.do?sysparm_nostack=true', 'Open IDE')
    ];

    var okCount = 0;
    for (var i = 0; i < steps.length; i++) {
        if (steps[i].status === 'ok') { okCount++; }
    }
    writeJson(200, {
        generatedAt: new GlideDateTime().getDisplayValue(),
        instance: baseUrl,
        okCount: okCount,
        notOkCount: steps.length - okCount,
        steps: steps
    });
})(request, response);`

const adminCreateOAuthClientScript = `(function (request, response) {
    var CLIENT_NAME = 'MCP Script Runner Client';

    function writeJson(status, payload) {
        response.setStatus(status);
        try { response.setContentType('application/json'); } catch (e) { /* ignore */ }
        var sw = response.getStreamWriter();
        sw.writeString(JSON.stringify(payload));
    }

    function instanceBaseUrl() {
        var uri = '';
        try { uri = String(gs.getProperty('glide.servlet.uri') || ''); } catch (e) { uri = ''; }
        if (!uri) {
            try { uri = String(gs.getProperty('glide.url') || ''); } catch (e2) { uri = ''; }
        }
        return uri.replace(/\\/$/, '');
    }

    function compactGuid() {
        var value = '';
        try { value = String(GlideGuid.generate(null)); } catch (e) {
            try { value = String(gs.generateGUID()); } catch (e2) {
                value = String(new GlideDateTime().getNumericValue()) + String(Math.floor(Math.random() * 1000000));
            }
        }
        return value.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
    }

    function generateSecret() {
        try {
            if (typeof GlideSecureRandomUtil !== 'undefined' && GlideSecureRandomUtil.getSecureRandomString) {
                return String(GlideSecureRandomUtil.getSecureRandomString(48));
            }
        } catch (e) {
            /* fall back to GUID material */
        }
        return compactGuid() + compactGuid();
    }

    function setIfField(gr, fieldName, value) {
        try {
            if (typeof gr.isValidField !== 'function' || gr.isValidField(fieldName)) {
                gr.setValue(fieldName, value);
            }
        } catch (e) {
            /* ignore absent fields */
        }
    }

    function findClient() {
        var gr = new GlideRecord('oauth_entity');
        if (!gr.isValid()) { return null; }
        gr.addQuery('name', CLIENT_NAME);
        gr.addQuery('type', 'client');
        gr.orderByDesc('sys_updated_on');
        gr.setLimit(1);
        gr.query();
        return gr.next() ? gr : null;
    }

    if (!gs.hasRole('admin')) {
        writeJson(403, { error: 'Only admin users can create or fix the OAuth client.' });
        return;
    }

    var oauth = new GlideRecord('oauth_entity');
    if (!oauth.isValid()) {
        writeJson(500, { error: 'oauth_entity table is not available.' });
        return;
    }

    var baseUrl = instanceBaseUrl();
    if (!baseUrl) {
        writeJson(500, { error: 'Unable to determine this instance base URL.' });
        return;
    }

    var redirectUrl = baseUrl + '/oauth_redirect.do,' + baseUrl + '/mcp_redirect.do';
    var existing = findClient();
    var created = false;
    var generatedSecret = '';
    if (existing) {
        oauth = existing;
    } else {
        created = true;
        oauth.initialize();
        setIfField(oauth, 'name', CLIENT_NAME);
        setIfField(oauth, 'type', 'client');
        setIfField(oauth, 'client_id', compactGuid().substring(0, 32));
        generatedSecret = generateSecret();
        setIfField(oauth, 'client_secret', generatedSecret);
        setIfField(oauth, 'default_grant_type', 'password');
    }

    setIfField(oauth, 'active', 'true');
    setIfField(oauth, 'redirect_url', redirectUrl);
    setIfField(oauth, 'scope_restriction_status', 'unrestricted');
    setIfField(oauth, 'access_token_lifespan', '1800');
    setIfField(oauth, 'refresh_token_lifespan', '8640000');
    setIfField(oauth, 'auth_code_lifespan', '60');

    var sysId = created ? oauth.insert() : oauth.update();
    if (!sysId) {
        writeJson(500, { error: 'OAuth client save failed.' });
        return;
    }

    writeJson(200, {
        message: created ? 'OAuth client created.' : 'OAuth client updated.',
        sys_id: String(sysId),
        client_id: String(oauth.getValue('client_id') || ''),
        client_secret: generatedSecret,
        redirect_url: redirectUrl,
        scope_restriction_status: 'unrestricted'
    });
})(request, response);`

const adminAssignRolesScript = `(function (request, response) {
    var RUNNER_ROLE = 'mcp_script_runner';
    var REQUIRED_CURRENT_USER_ROLES = [
        RUNNER_ROLE,
        'sn_ai_governance.ai_steward',
        'sn_generative_ai.data_steward',
        'df_data_steward'
    ];

    function writeJson(status, payload) {
        response.setStatus(status);
        try { response.setContentType('application/json'); } catch (e) { /* ignore */ }
        var sw = response.getStreamWriter();
        sw.writeString(JSON.stringify(payload));
    }

    function findRoleByName(roleName) {
        try {
            var role = new GlideRecord('sys_user_role');
            if (!role.isValid()) { return null; }
            role.addQuery('name', roleName);
            role.setLimit(1);
            role.query();
            if (!role.next()) { return null; }
            return { sys_id: String(role.getUniqueValue()), name: String(role.getValue('name') || '') };
        } catch (e) {
            return null;
        }
    }

    function hasRoleAssignment(userId, roleId) {
        try {
            var userRole = new GlideRecord('sys_user_has_role');
            if (!userRole.isValid()) { return false; }
            userRole.addQuery('user', userId);
            userRole.addQuery('role', roleId);
            userRole.setLimit(1);
            userRole.query();
            return userRole.next();
        } catch (e) {
            return false;
        }
    }

    function assignRole(userId, roleId) {
        var userRole = new GlideRecord('sys_user_has_role');
        if (!userRole.isValid()) {
            return '';
        }
        userRole.initialize();
        userRole.setValue('user', userId);
        userRole.setValue('role', roleId);
        return String(userRole.insert() || '');
    }

    if (!gs.hasRole('admin')) {
        writeJson(403, { error: 'Only admin users can assign setup roles.' });
        return;
    }

    var userId = String(gs.getUserID() || '');
    if (!userId) {
        writeJson(500, { error: 'Unable to determine current user.' });
        return;
    }

    var assigned = [];
    var alreadyAssigned = [];
    var unavailable = [];
    var failed = [];

    for (var i = 0; i < REQUIRED_CURRENT_USER_ROLES.length; i++) {
        var roleName = REQUIRED_CURRENT_USER_ROLES[i];
        var role = findRoleByName(roleName);
        if (!role) {
            unavailable.push(roleName);
            continue;
        }
        if (hasRoleAssignment(userId, role.sys_id)) {
            alreadyAssigned.push(roleName);
            continue;
        }
        var assignmentId = assignRole(userId, role.sys_id);
        if (assignmentId) {
            assigned.push(roleName);
        } else {
            failed.push(roleName);
        }
    }

    var ok = unavailable.length === 0 && failed.length === 0;
    var parts = [];
    if (assigned.length) { parts.push('Assigned: ' + assigned.join(', ') + '.'); }
    if (alreadyAssigned.length) { parts.push('Already assigned: ' + alreadyAssigned.join(', ') + '.'); }
    if (unavailable.length) { parts.push('Role records not found: ' + unavailable.join(', ') + '.'); }
    if (failed.length) { parts.push('Failed to assign: ' + failed.join(', ') + '.'); }
    writeJson(200, {
        ok: ok,
        message: parts.join(' ') || 'No role changes were needed.',
        assigned: assigned,
        already_assigned: alreadyAssigned,
        unavailable: unavailable,
        failed: failed
    });
})(request, response);`

// Inline ES5 handler for the MCP message endpoint (POST). Implements MCP
// streamable-HTTP: initialize, notifications/*, ping, tools/list, tools/call.
const mcpPostScript = `(function (request, response) {
    var DEFAULT_PROTOCOL_VERSION = '2025-06-18';
    var SERVER_NAME = 'mcp-script-runner';
    var SERVER_VERSION = '1.0.11';
    var LOG_SOURCE = 'MCPScriptRunner';
    var SERVER_INSTRUCTIONS = 'MCP Script Runner exposes one tool, run_script, which executes server-side JavaScript on this ServiceNow instance (global scope, ES5/Rhino engine), running as the authenticated caller. HOW TO USE: end the script with an expression to return its value; call out(...) or print(...) to emit inline output lines (objects are JSON-stringified). gs.print / gs.info / gs.log write to the system log only and are NOT returned inline. SECURITY: this is remote code execution, gated by the mcp_script_runner role and audit-logged on every call. Prefer read-only queries and be deliberate with writes.';

    function runScriptToolDescriptor() {
        return {
            name: 'run_script',
            description: 'Execute server-side JavaScript on the ServiceNow instance, like a global-scope Background Script, running with the privileges of the authenticated caller. Engine is ES5 (Rhino), global scope. TO RETURN DATA: end the script with an expression and its value is returned. TO EMIT INLINE OUTPUT: call out(...) or print(...) (each call adds a line; object args are JSON-stringified). Note: gs.print / gs.info / gs.log are NOT captured inline, they only go to the system log. Example: var gr = new GlideRecord("incident"); gr.query(); out("count=" + gr.getRowCount()); gr.getRowCount();',
            inputSchema: {
                type: 'object',
                properties: {
                    script: { type: 'string', description: 'Server-side JavaScript to evaluate (ES5/global). End with an expression to return its value; call out(...)/print(...) for inline output.' }
                },
                required: ['script']
            },
            annotations: {
                title: 'Run server-side script',
                readOnlyHint: false,
                destructiveHint: true,
                idempotentHint: false,
                openWorldHint: true
            }
        };
    }

    function safeStringify(value) {
        if (value === undefined) { return 'undefined'; }
        if (value === null) { return 'null'; }
        var t = typeof value;
        if (t === 'string') { return value; }
        if (t === 'number' || t === 'boolean') { return String(value); }
        try { return JSON.stringify(value, null, 2); }
        catch (e) { try { return String(value); } catch (e2) { return '[unserializable value]'; } }
    }

    function executeScript(scriptText) {
        var captured = [];

        // Injected inline-output channel. Scripts call out(...) / print(...) to
        // emit lines into the tool result. Works in Global/Rhino because a
        // DIRECT eval (below) shares this function's lexical scope, so the
        // evaluated code can see these locals. (No gs.* reassignment needed.)
        function out() {
            var a = Array.prototype.slice.call(arguments);
            for (var k = 0; k < a.length; k++) {
                a[k] = (a[k] === null || a[k] === undefined) ? String(a[k]) : (typeof a[k] === 'object' ? JSON.stringify(a[k]) : String(a[k]));
            }
            captured.push(a.join(' '));
        }
        var print = out;

        var methods = ['print', 'info', 'warn', 'error', 'log'];
        var original = {};
        var i;
        for (i = 0; i < methods.length; i++) {
            (function (m) {
                try {
                    if (gs && typeof gs[m] === 'function') {
                        original[m] = gs[m];
                        gs[m] = function () {
                            var args = Array.prototype.slice.call(arguments);
                            captured.push('[gs.' + m + '] ' + args.join(' '));
                            try { return original[m].apply(gs, arguments); } catch (inner) { return undefined; }
                        };
                    }
                } catch (e) { /* not reassignable on this engine */ }
            })(methods[i]);
        }
        var start = new GlideDateTime().getNumericValue();
        var value;
        var errInfo = null;
        try {
            value = eval(scriptText);
        } catch (e) {
            errInfo = {
                name: (e && e.name) ? String(e.name) : 'Error',
                message: (e && e.message) ? String(e.message) : String(e),
                stack: (e && e.stack) ? String(e.stack) : undefined
            };
        } finally {
            for (i = 0; i < methods.length; i++) {
                var mm = methods[i];
                try { if (original[mm]) { gs[mm] = original[mm]; } } catch (e3) { /* ignore */ }
            }
        }
        var elapsedMs = new GlideDateTime().getNumericValue() - start;
        return { value: value, output: captured, error: errInfo, elapsedMs: elapsedMs };
    }

    function formatExecutionResult(exec) {
        var parts = [];
        if (exec.output && exec.output.length > 0) { parts.push('--- Output ---\\n' + exec.output.join('\\n')); }
        if (exec.error) {
            var errText = 'Error: ' + exec.error.name + ': ' + exec.error.message;
            if (exec.error.stack) { errText += '\\n' + exec.error.stack; }
            parts.push(errText);
        } else {
            parts.push('--- Result ---\\n' + safeStringify(exec.value));
        }
        parts.push('(elapsed ' + exec.elapsedMs + ' ms)');
        return { content: [{ type: 'text', text: parts.join('\\n\\n') }], isError: exec.error ? true : false };
    }

    function truncateText(value, maxLength) {
        var text = (value === null || value === undefined) ? '' : String(value);
        if (text.length <= maxLength) { return text; }
        return text.substring(0, maxLength - 18) + '\\n... [truncated]';
    }

    function auditScriptExecution(scriptText, exec, resultPayload) {
        try {
            var resultText = '';
            if (resultPayload && resultPayload.content && resultPayload.content.length > 0) {
                resultText = resultPayload.content[0].text || '';
            }
            var audit = new GlideRecord('u_mcp_script_execution');
            audit.initialize();
            audit.setValue('u_executed_at', new GlideDateTime().getValue());
            audit.setValue('u_user', gs.getUserID());
            audit.setValue('u_user_name', truncateText(gs.getUserName(), 120));
            audit.setValue('u_script', truncateText(scriptText, 65000));
            audit.setValue('u_result', truncateText(resultText, 65000));
            audit.setValue('u_is_error', exec.error ? 'true' : 'false');
            audit.setValue('u_error_message', exec.error ? truncateText(exec.error.name + ': ' + exec.error.message, 1000) : '');
            audit.setValue('u_elapsed_ms', String(exec.elapsedMs));
            audit.insert();
        } catch (auditError) {
            try { gs.warn(LOG_SOURCE + ': failed to audit script execution: ' + auditError); } catch (ignored) { /* ignore */ }
        }
    }

    function jsonRpcResult(id, result) { return { jsonrpc: '2.0', id: id, result: result }; }
    function jsonRpcError(id, code, message, data) {
        var err = { code: code, message: message };
        if (data !== undefined) { err.data = data; }
        return { jsonrpc: '2.0', id: (id === undefined ? null : id), error: err };
    }

    function handleRpcMessage(msg) {
        if (!msg || msg.jsonrpc !== '2.0' || typeof msg.method !== 'string') {
            return jsonRpcError(msg ? msg.id : null, -32600, 'Invalid Request');
        }
        var method = msg.method;
        var id = msg.id;
        var params = msg.params || {};
        var isNotification = (id === undefined || id === null);
        if (method.indexOf('notifications/') === 0) { return null; }
        if (method === 'initialize') {
            var requested = params.protocolVersion || DEFAULT_PROTOCOL_VERSION;
            return jsonRpcResult(id, {
                protocolVersion: requested,
                capabilities: { tools: { listChanged: false } },
                serverInfo: { name: SERVER_NAME, version: SERVER_VERSION },
                instructions: SERVER_INSTRUCTIONS
            });
        }
        if (method === 'ping') { return jsonRpcResult(id, {}); }
        if (method === 'tools/list') { return jsonRpcResult(id, { tools: [runScriptToolDescriptor()] }); }
        if (method === 'tools/call') {
            var toolName = params.name;
            var args = params.arguments || {};
            if (toolName !== 'run_script') { return jsonRpcError(id, -32602, 'Unknown tool: ' + toolName); }
            if (!args.script || typeof args.script !== 'string') {
                return jsonRpcError(id, -32602, 'Invalid params: script (string) is required');
            }
            try {
                gs.info(LOG_SOURCE + ': run_script invoked by ' + gs.getUserName() + ' (' + gs.getUserID() + '); length=' + args.script.length);
            } catch (e) { /* logging must not block */ }
            var exec = executeScript(args.script);
            var toolResult = formatExecutionResult(exec);
            auditScriptExecution(args.script, exec, toolResult);
            return jsonRpcResult(id, toolResult);
        }
        if (isNotification) { return null; }
        return jsonRpcError(id, -32601, 'Method not found: ' + method);
    }

    function writeJson(status, payload) {
        response.setStatus(status);
        try { response.setContentType('application/json'); } catch (e) { /* ignore */ }
        // Use the stream writer so the body is returned verbatim (setBody wraps
        // the payload in a {"result": ...} envelope on Scripted REST).
        var sw = response.getStreamWriter();
        sw.writeString(JSON.stringify(payload));
    }

    // Read the JSON-RPC payload. With consumes=application/json the platform
    // pre-parses the body into request.body.data; fall back to the raw string.
    var parsed = null;
    var hadBody = false;
    try {
        if (request.body) {
            var d = null;
            try { d = request.body.data; } catch (eData) { d = null; }
            if (d !== undefined && d !== null && typeof d === 'object') {
                parsed = d; hadBody = true;
            } else {
                var ds = '';
                try { ds = request.body.dataString; } catch (eStr) { ds = ''; }
                if (ds) { parsed = JSON.parse(ds); hadBody = true; }
            }
        }
    } catch (e) { writeJson(400, jsonRpcError(null, -32700, 'Parse error: invalid JSON')); return; }
    if (!hadBody) { writeJson(400, jsonRpcError(null, -32700, 'Parse error: empty body')); return; }

    if (Object.prototype.toString.call(parsed) === '[object Array]') {
        var responses = [];
        for (var i = 0; i < parsed.length; i++) {
            var r = handleRpcMessage(parsed[i]);
            if (r !== null) { responses.push(r); }
        }
        if (responses.length === 0) { response.setStatus(202); return; }
        writeJson(200, responses);
        return;
    }
    var single = handleRpcMessage(parsed);
    if (single === null) { response.setStatus(202); return; }
    writeJson(200, single);
})(request, response);`

// Inline ES5 handler for GET: no server-initiated SSE stream is offered.
const mcpGetScript = `(function (request, response) {
    response.setStatus(405);
    try { response.setHeader('Allow', 'POST'); } catch (e) { /* ignore */ }
    try {
        response.setContentType('application/json');
        response.setBody({ jsonrpc: '2.0', id: null, error: { code: -32000, message: 'Method Not Allowed: use POST' } });
    } catch (e) { /* ignore */ }
})(request, response);`

RestApi({
    $id: Now.ID['mcp_script_runner_api'],
    name: 'MCP Script Runner',
    serviceId: 'mcp_script_runner',
    consumes: 'application/json',
    produces: 'application/json',
    shortDescription: 'MCP streamable-HTTP endpoint exposing a run_script tool for server-side JS execution.',
    enforceAcl: [executeAcl],
    routes: [
        {
            $id: Now.ID['mcp_route_post'],
            name: 'mcp_post',
            method: 'POST',
            path: '/',
            consumes: 'application/json',
            produces: 'application/json',
            script: mcpPostScript,
            enforceAcl: [executeAcl],
            shortDescription: 'MCP JSON-RPC message endpoint (initialize, tools/list, tools/call).',
        },
        {
            $id: Now.ID['mcp_route_get'],
            name: 'mcp_get',
            method: 'GET',
            path: '/',
            produces: 'application/json',
            script: mcpGetScript,
            enforceAcl: [executeAcl],
            shortDescription: 'Returns 405 - no server-initiated SSE stream is offered.',
        },
        {
            $id: Now.ID['mcp_route_admin_status'],
            name: 'mcp_admin_status',
            method: 'GET',
            path: '/admin/status',
            produces: 'application/json',
            script: adminStatusScript,
            enforceAcl: [executeAcl],
            shortDescription: 'Returns MCP Script Runner setup status checks for the admin page.',
        },
        {
            $id: Now.ID['mcp_route_admin_oauth_client'],
            name: 'mcp_admin_oauth_client',
            method: 'POST',
            path: '/admin/oauth-client',
            consumes: 'application/json',
            produces: 'application/json',
            script: adminCreateOAuthClientScript,
            enforceAcl: [executeAcl],
            shortDescription: 'Creates or fixes the MCP Script Runner OAuth client configuration.',
        },
        {
            $id: Now.ID['mcp_route_admin_roles'],
            name: 'mcp_admin_roles',
            method: 'POST',
            path: '/admin/roles',
            consumes: 'application/json',
            produces: 'application/json',
            script: adminAssignRolesScript,
            enforceAcl: [executeAcl],
            shortDescription: 'Assigns missing MCP Script Runner setup roles to the current user.',
        },
    ],
})
