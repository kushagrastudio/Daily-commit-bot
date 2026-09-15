# Daily Commit Bot

A small web dashboard that commits and pushes a timestamped log entry to a
GitHub repo on a schedule (default: once a day). Useful for keeping a
personal contribution streak alive on a repo you own.

**Be aware:** these are automated, content-free commits (they just append a
line to a log file). They'll be visible in the repo's commit history to
anyone who looks — this is meant for a personal/sandbox repo, not to
misrepresent real work.

## What's included

```
daily-commit-bot/
├── server.js              # Express app + API routes
├── src/
│   ├── configStore.js      # reads/writes config.json
│   ├── gitCommitter.js     # clones/pulls, edits a file, commits & pushes
│   └── scheduler.js        # node-cron job that calls gitCommitter
├── public/                 # dashboard UI (HTML/CSS/JS)
├── Dockerfile
├── package.json
└── .env.example
```

## 1. Get a GitHub token

Create a Personal Access Token with `repo` scope (classic token) or a
fine-grained token with **Contents: Read & write** on the target repo:
https://github.com/settings/tokens

## 2. Configure environment variables

Copy `.env.example` to `.env` and fill in:

```
GITHUB_TOKEN=ghp_xxx...
GIT_USER_NAME="Your Name"
GIT_USER_EMAIL="you@example.com"
DASHBOARD_PASSWORD=       # optional, protects the dashboard
```

## 3. Run locally

```bash
npm install
npm start
```

Open http://localhost:3000, fill in:
- **Repo URL**: `https://github.com/yourname/yourrepo.git`
- **Branch**: usually `main`
- **File to update**: e.g. `activity-log.md` (created automatically if missing)
- **Cron schedule**: e.g. `0 12 * * *` for daily at 12:00 server time
- Check **Enable automatic daily commits**, then **Save settings**.

Use **Commit now** to trigger one immediately and confirm everything works
before relying on the schedule.

## 4. Deploy it somewhere it'll actually run on a schedule

Running this only on your laptop means the cron job only fires while your
laptop is on. Deploy it to a host that stays up:

### Render / Railway / Fly.io (easiest)
1. Push this project to its own GitHub repo (a *different* repo from the one
   you're auto-committing to).
2. Create a new **Web Service** from that repo on Render/Railway/Fly.
3. Set the environment variables from step 2 in the host's dashboard.
4. Build command: `npm install` — Start command: `npm start`.
5. Once deployed, open the app's URL and configure the target repo the same
   way as step 3.

### Docker (any VPS)
```bash
docker build -t daily-commit-bot .
docker run -d \
  --name daily-commit-bot \
  -p 3000:3000 \
  --env-file .env \
  daily-commit-bot
```

## Pushing this project's own code to GitHub

```bash
cd daily-commit-bot
git init
git add .
git commit -m "Initial commit: daily commit bot"
git branch -M main
git remote add origin https://github.com/yourname/daily-commit-bot.git
git push -u origin main
```

(`.env` and `config.json` are gitignored so your token never gets committed.)

## Notes

- The scheduler runs in the server process, so the app must stay running for
  scheduled commits to fire — that's why step 4 (persistent hosting) matters.
- `config.json` and the `workdir/` clone are created at runtime and are
  gitignored.
- Cron expressions follow standard 5-field syntax (minute hour day month
  weekday), evaluated in the server's local timezone.
