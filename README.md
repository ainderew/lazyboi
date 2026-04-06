# lazyboi

A small Node service that runs scheduled browser-based tasks against a configurable web target, mirrors events to Slack, persists everything to SQLite, and ships with a cockpit-style dashboard for live status.

Built as a personal sandbox for experimenting with Puppeteer scheduling, ambient dashboards, and Slack web automation without third-party app approvals.

## Features

- **Cron-driven Puppeteer flows** with per-run randomized offsets, configurable via a single file.
- **Parallel Slack relay** that posts to a channel through your existing web session — no Slack app, no admin OAuth.
- **Persistent browser profile** stored on disk so manual logins survive restarts and re-deploys.
- **SQLite event log** with success/fail status, viewable as JSON or via the dashboard.
- **Cockpit dashboard** at `/` — live gauge widget, telemetry cells, mission log, dual themes (auto/light/dark) and 24h/12h clock toggle.
- **Failure screenshots** captured automatically to `logs/screenshots/` for headless debugging.

## Stack

Node 20 LTS · Express · node-cron · Puppeteer · sqlite3 · Winston · pm2 (production) · vanilla HTML/CSS/JS dashboard.

## Quick start

```bash
git clone git@github.com:ainderew/lazyboi.git
cd lazyboi
npm install
cp .env.example .env
# fill in .env
npm start
```

The server starts on `http://localhost:4200`. Open `/` for the dashboard.

> **Local Puppeteer note:** if the bundled Chromium fails to launch on macOS, edit `service/Slack.service.js` and `service/Attendance.service.js` to point `executablePath` at your installed Chrome binary.

## Configuring the target

The Puppeteer flow lives in `service/Attendance.service.js → performAutomatedAttendance`. It's a single function: navigate to a URL, fill a username/password, click a button, verify success. Adapt the selectors and URL to whatever target you're automating.

Username and target URL are currently hardcoded — change them in that one file. Password is read from `process.env.PASS`.

## Slack relay setup

The Slack relay reuses your real Slack web session via a persistent Puppeteer profile (`db/slack-session/`). You log in once manually; the session is reused indefinitely. No Slack app to register, no workspace admin approval needed.

### Locally

```bash
curl http://localhost:4200/slack-setup
```

A real browser window opens at the Slack workspace login. Sign in, then close the window. Done.

Test:

```bash
curl http://localhost:4200/test-slack
```

### On a headless VPS

A VPS has no display. `/slack-setup` runs Chromium headlessly with remote debugging exposed on port `9222`. Connect from your local Chrome via SSH port forwarding:

```bash
# 1. forward the VPS debug port to your laptop
ssh -L 9222:localhost:9222 root@your-vps

# 2. trigger setup
curl http://your-vps:4200/slack-setup

# 3. open chrome://inspect locally
#    → Configure → add `localhost:9222`
#    → Click "inspect" on the Slack tab → log in
#    → Hit /slack-setup-close (or close the tab) when done
```

Sessions persist for months. Repeat the flow if it ever expires.

## Routes

| Route | Purpose |
|---|---|
| `GET /` | Dashboard |
| `GET /next-cron-fire` | JSON: next scheduled fire timestamp + mode |
| `GET /check-cron-status` | JSON: cron arm state |
| `GET /get-records` | JSON: recent event log |
| `GET /test-login` | Trigger the primary flow on demand (debug) |
| `GET /test-logout` | Trigger the secondary flow on demand (debug) |
| `GET /test-slack` | Send a test Slack message |
| `GET /slack-setup` | Open the Slack login flow |

## Schedules

Cron schedules live in `utils/cronManagement.js`:

```js
const CRON_SCHEDULES = {
  timeInTime:  '0 21 * * 1-5',
  timeOutTime: '0 6 * * 2-6',
};
```

Each scheduled run is also offset by a random 1–30 minute delay (see `Attendance.service.js → scheduleAttendance`) so consecutive runs never land on identical timestamps.

## Production deployment (Ubuntu VPS)

```bash
# 1. install Node 20 + Chromium
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs chromium-browser

# 2. clone + install
git clone git@github.com:ainderew/lazyboi.git /root/lazyboi
cd /root/lazyboi
npm install --production

# 3. configure
cp .env.example .env
nano .env
# at minimum set:
#   NODE_ENV=production
#   PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

# 4. dirs
mkdir -p logs/screenshots db/slack-session

# 5. process manager
sudo npm install -g pm2
pm2 start server.js --name lazyboi
pm2 save
pm2 startup    # follow the printed command
```

Then do the [headless Slack setup](#on-a-headless-vps).

## Project layout

```
controller/        – route handlers
db/                – sqlite db + persisted slack browser profile
logs/              – winston logs + puppeteer screenshots
public/            – dashboard (index.html, css, js)
routes/            – express routers
service/
  Attendance.service.js     – primary puppeteer flow + cron orchestration
  Slack.service.js          – slack puppeteer flow
  RecordKeeping.service.js  – sqlite writes
utils/
  cronManagement.js – cron schedule definitions
  logger.js         – winston setup
  config.js         – in-memory state shared with the dashboard
server.js          – express bootstrap
```

## Notes

- Selectors in `Attendance.service.js` are tied to a specific target site. If the upstream DOM changes you'll need to re-tune them.
- Failure screenshots in `logs/screenshots/` are the fastest way to debug headless failures.
- The dashboard reads everything from the existing JSON endpoints — it has no build step. Edit, refresh, done.

## License

Personal sandbox. No license. Fork it, gut it, use the bits you need.
