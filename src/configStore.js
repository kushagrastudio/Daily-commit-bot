const fs = require('fs');
const path = require('path');

const CONFIG_PATH = path.join(__dirname, '..', 'config.json');

const DEFAULT_CONFIG = {
  repoUrl: '',          // e.g. https://github.com/yourname/yourrepo.git
  repoName: 'target-repo',
  branch: 'main',
  filePath: 'activity-log.md',
  cronSchedule: '0 12 * * *', // every day at 12:00 server time
  commitMessages: [
    'Daily update',
    'Routine sync',
    'Log update',
    'Automated check-in',
    'Housekeeping'
  ],
  enabled: false
};

function loadConfig() {
  if (!fs.existsSync(CONFIG_PATH)) {
    fs.writeFileSync(CONFIG_PATH, JSON.stringify(DEFAULT_CONFIG, null, 2));
  }
  return JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf-8'));
}

function saveConfig(newConfig) {
  const current = loadConfig();
  const merged = { ...current, ...newConfig };
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(merged, null, 2));
  return merged;
}

module.exports = { loadConfig, saveConfig, DEFAULT_CONFIG };
