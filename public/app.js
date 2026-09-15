function headers() {
  const pw = document.getElementById('password').value;
  const h = { 'Content-Type': 'application/json' };
  if (pw) h['x-dashboard-password'] = pw;
  return h;
}

async function loadConfig() {
  const res = await fetch('/api/config', { headers: headers() });
  if (!res.ok) return;
  const config = await res.json();
  document.getElementById('repoUrl').value = config.repoUrl || '';
  document.getElementById('repoName').value = config.repoName || '';
  document.getElementById('branch').value = config.branch || 'main';
  document.getElementById('filePath').value = config.filePath || 'activity-log.md';
  document.getElementById('cronSchedule').value = config.cronSchedule || '0 12 * * *';
  document.getElementById('commitMessages').value = (config.commitMessages || []).join('\n');
  document.getElementById('enabled').checked = Boolean(config.enabled);
}

async function saveConfig() {
  const body = {
    repoUrl: document.getElementById('repoUrl').value.trim(),
    repoName: document.getElementById('repoName').value.trim() || 'target-repo',
    branch: document.getElementById('branch').value.trim() || 'main',
    filePath: document.getElementById('filePath').value.trim() || 'activity-log.md',
    cronSchedule: document.getElementById('cronSchedule').value.trim() || '0 12 * * *',
    commitMessages: document.getElementById('commitMessages').value
      .split('\n')
      .map(s => s.trim())
      .filter(Boolean),
    enabled: document.getElementById('enabled').checked
  };

  const res = await fetch('/api/config', {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify(body)
  });
  const data = await res.json();
  const statusEl = document.getElementById('saveStatus');
  statusEl.textContent = res.ok ? 'Saved ✓' : `Error: ${data.error}`;
  setTimeout(() => (statusEl.textContent = ''), 3000);
  loadStatus();
}

async function commitNow() {
  const btn = document.getElementById('commitNowBtn');
  btn.disabled = true;
  btn.textContent = 'Committing…';
  const res = await fetch('/api/commit-now', { method: 'POST', headers: headers() });
  const data = await res.json();
  btn.disabled = false;
  btn.textContent = 'Commit now';
  if (!res.ok) alert(`Failed: ${data.error}`);
  loadLog();
}

async function loadStatus() {
  const res = await fetch('/api/status', { headers: headers() });
  if (!res.ok) return;
  const s = await res.json();
  document.getElementById('statusBox').innerHTML = `
    <div>Scheduler: <strong>${s.enabled ? 'Enabled' : 'Disabled'}</strong></div>
    <div>Cron: <strong>${s.cronSchedule}</strong></div>
    <div>Repo: <strong>${s.repoUrl || '(not set)'}</strong></div>
    <div>GitHub token loaded: <strong>${s.hasToken ? 'Yes' : 'No'}</strong></div>
  `;
}

async function loadLog() {
  const res = await fetch('/api/log', { headers: headers() });
  if (!res.ok) return;
  const items = await res.json();
  const list = document.getElementById('logList');
  list.innerHTML = '';
  if (items.length === 0) {
    list.innerHTML = '<li>No activity yet.</li>';
    return;
  }
  for (const item of items) {
    const li = document.createElement('li');
    const cls = item.status === 'success' ? 'status-success' : item.status === 'error' ? 'status-error' : 'status-skipped';
    li.innerHTML = `<span class="${cls}">[${item.status}]</span> ${item.time} — ${item.message || item.error || item.reason || ''}`;
    list.appendChild(li);
  }
}

document.getElementById('saveBtn').addEventListener('click', saveConfig);
document.getElementById('commitNowBtn').addEventListener('click', commitNow);

loadConfig();
loadStatus();
loadLog();
setInterval(loadLog, 15000);
