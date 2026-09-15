const simpleGit = require('simple-git');
const fs = require('fs');
const path = require('path');

const WORKDIR = path.join(__dirname, '..', 'workdir');

function buildAuthUrl(repoUrl, token) {
  if (!repoUrl.startsWith('https://')) {
    throw new Error('repoUrl must be an https:// GitHub URL, e.g. https://github.com/user/repo.git');
  }
  return repoUrl.replace('https://', `https://${token}@`);
}

async function ensureRepo(config) {
  const token = process.env.GITHUB_TOKEN;
  if (!token) throw new Error('GITHUB_TOKEN is not set in the environment');
  if (!config.repoUrl) throw new Error('repoUrl is not configured yet');

  const authUrl = buildAuthUrl(config.repoUrl, token);

  if (!fs.existsSync(WORKDIR)) fs.mkdirSync(WORKDIR, { recursive: true });
  const repoDir = path.join(WORKDIR, config.repoName || 'target-repo');

  if (!fs.existsSync(path.join(repoDir, '.git'))) {
    const git = simpleGit();
    await git.clone(authUrl, repoDir);
  } else {
    const repoGit = simpleGit(repoDir);
    // Refresh the remote URL in case the token or repo changed
    await repoGit.remote(['set-url', 'origin', authUrl]);
    await repoGit.fetch('origin');
    await repoGit.checkout(config.branch || 'main');
    await repoGit.pull('origin', config.branch || 'main');
  }
  return repoDir;
}

async function makeCommit(config) {
  const repoDir = await ensureRepo(config);
  const git = simpleGit(repoDir);

  await git.addConfig('user.name', process.env.GIT_USER_NAME || 'Daily Commit Bot');
  await git.addConfig('user.email', process.env.GIT_USER_EMAIL || 'bot@example.com');

  const relativeFilePath = config.filePath || 'activity-log.md';
  const filePath = path.join(repoDir, relativeFilePath);
  const timestamp = new Date().toISOString();
  const entry = `- ${timestamp}\n`;

  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.appendFileSync(filePath, entry);

  const messages = Array.isArray(config.commitMessages) && config.commitMessages.length
    ? config.commitMessages
    : ['Update log'];
  const message = messages[Math.floor(Math.random() * messages.length)];
  const fullMessage = `${message} - ${timestamp}`;

  await git.add(relativeFilePath);
  const status = await git.status();
  if (status.staged.length === 0) {
    return { skipped: true, reason: 'Nothing to commit', timestamp };
  }

  const commitResult = await git.commit(fullMessage);
  await git.push('origin', config.branch || 'main');

  return { skipped: false, message: fullMessage, timestamp, commitHash: commitResult.commit };
}

module.exports = { makeCommit };
