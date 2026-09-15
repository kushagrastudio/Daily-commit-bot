const cron = require('node-cron');
const { makeCommit } = require('./gitCommitter');
const { loadConfig } = require('./configStore');

let task = null;

function startScheduler(activityLog) {
  const config = loadConfig();

  if (task) {
    task.stop();
    task = null;
  }

  if (!config.enabled) {
    return; // scheduler paused until user enables it from the dashboard
  }

  if (!cron.validate(config.cronSchedule)) {
    console.error(`Invalid cron expression: ${config.cronSchedule}`);
    return;
  }

  task = cron.schedule(config.cronSchedule, async () => {
    const currentConfig = loadConfig();
    try {
      const result = await makeCommit(currentConfig);
      activityLog.push({ status: result.skipped ? 'skipped' : 'success', ...result, time: new Date().toISOString() });
    } catch (err) {
      activityLog.push({ status: 'error', error: err.message, time: new Date().toISOString() });
    }
  });

  console.log(`Scheduler active with cron "${config.cronSchedule}"`);
}

module.exports = { startScheduler };
