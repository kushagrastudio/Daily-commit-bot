require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');

const { loadConfig, saveConfig } = require('./src/configStore');
const { makeCommit } = require('./src/gitCommitter');
const { startScheduler } = require('./src/scheduler');

const app = express();
app.use(bodyParser.json());

const activityLog = [];

// --- Optional simple password gate for /api routes ---
app.use('/api', (req, res, next) => {
  const pw = process.env.DASHBOARD_PASSWORD;
  if (!pw) return next(); // no password configured, open access
  const header = req.headers['x-dashboard-password'];
  if (header === pw) return next();
  return res.status(401).json({ ok: false, error: 'Unauthorized' });
});

app.use(express.static(path.join(__dirname, 'public')));

app.get('/api/config', (req, res) => {
  const config = loadConfig();
  res.json(config);
});

app.post('/api/config', (req, res) => {
  try {
    const updated = saveConfig(req.body);
    startScheduler(activityLog);
    res.json({ ok: true, config: updated });
  } catch (err) {
    res.status(400).json({ ok: false, error: err.message });
  }
});

app.get('/api/log', (req, res) => {
  res.json(activityLog.slice(-50).reverse());
});

app.post('/api/commit-now', async (req, res) => {
  try {
    const config = loadConfig();
    const result = await makeCommit(config);
    activityLog.push({ status: result.skipped ? 'skipped' : 'success', ...result, time: new Date().toISOString() });
    res.json({ ok: true, result });
  } catch (err) {
    activityLog.push({ status: 'error', error: err.message, time: new Date().toISOString() });
    res.status(500).json({ ok: false, error: err.message });
  }
});

app.get('/api/status', (req, res) => {
  const config = loadConfig();
  res.json({
    enabled: config.enabled,
    cronSchedule: config.cronSchedule,
    repoUrl: config.repoUrl,
    hasToken: Boolean(process.env.GITHUB_TOKEN)
  });
});

startScheduler(activityLog);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Daily Commit Bot dashboard running at http://localhost:${PORT}`));
