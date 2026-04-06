# lazyboi

A small personal automation that clocks you in and out of your HR portal on schedule, with a Slack fallback that posts "in"/"out" to a channel as you. Comes with a cockpit-style dashboard at `/`.

> Originally written for [Theoria Medical's Sprout HR portal](https://theoriamedical.hrhub.ph) but the Puppeteer flow can be re-pointed at any portal that takes a username + password.

## What it does

- **Cron-driven attendance** — fires on Mon–Fri at 21:00 and Tue–Sat at 06:00 (Asia/Manila), each with a 1–30 min random delay so it never hits the same time twice.
- **Puppeteer + the HR portal** — opens Chromium, logs in, clicks "Clock In/Out".
- **Slack relay (in parallel)** — posts "in" or "out" to a configured channel as you, using your real Slack web session via a persistent Puppeteer profile.
- **Records everything** to a local SQLite db (`db/`) with success/fail status.
- **Dashboard at `/`** — instrument-style console with a live gauge counting down to the next fire, telemetry cells, and a mission log of recent attempts. Cycle theme (auto/light/dark) and clock format (24h/12h) from the HUD strip.

## Stack

Node 20 LTS · Express · node-cron · Puppeteer · sqlite3 · Winston · pm2 (production) · vanilla HTML/CSS/JS dashboard.

## Quick start (local)

```bash
git clone git@github.com:ainderew/lazyboi.git
cd lazyboi
npm install
cp .env.example .env
# edit .env — at minimum set PASS and SLACK_CHANNEL_ID
npm start
```

The server starts on `http://localhost:4200`. Open `/` for the dashboard.

> **Note on Puppeteer locally:** if the bundled Chromium fails to launch on macOS, edit `service/Slack.service.js` and `service/Attendance.service.js` to point `executablePath` at your installed Chrome (`/Applications/Google Chrome.app/Contents/MacOS/Google Chrome`).

## Slack one-time setup

The Slack relay reuses your real Slack web session — no app, no admin approval, no tokens. You log in once manually in a Puppeteer-controlled browser; the session lives in `db/slack-session/` and is reused for every future fire.

### Locally

```bash
curl http://localhost:4200/slack-setup
```

A real browser window opens at `theoriamedical.slack.com`. Sign in with your email + magic code, then close the window. Done.

Test it:

```bash
curl http://localhost:4200/test-slack
```

### On a headless VPS

A VPS has no display, so `/slack-setup` runs Chromium in headless mode with remote debugging exposed on port `9222`. You connect from your local Chrome via SSH port forwarding:

```bash
# 1. on your laptop: forward the VPS debug port locally
ssh -L 9222:localhost:9222 root@your-vps-ip

# 2. in another shell, kick off the setup
curl http://your-vps-ip:4200/slack-setup

# 3. open chrome://inspect in your local Chrome
#    → Configure → add `localhost:9222`
#    → Click "inspect" on the Slack tab → log in
#    → Hit /slack-setup-close (or close the tab) when done
```

The session persists for months. If it ever expires, repeat the flow.

## Test routes

| Route | What it does |
|---|---|
| `GET /` | Dashboard |
| `GET /test-login` | Force-runs the "in" automation right now |
| `GET /test-logout` | Force-runs the "out" automation right now |
| `GET /test-slack` | Sends a test Slack message |
| `GET /slack-setup` | Opens the Slack login flow |
| `GET /next-cron-fire` | JSON: next scheduled fire time + mode |
| `GET /check-cron-status` | JSON: whether cron is armed |
| `GET /get-records` | JSON: recent timekeeping records |

## Schedule

Edit `utils/cronManagement.js`:

```js
const CRON_SCHEDULES = {
  timeInTime:  '0 21 * * 1-5', // 21:00 Mon–Fri
  timeOutTime: '0 6 * * 2-6',  // 06:00 Tue–Sat
};
```

The actual fire time is offset by a random 1–30 min delay (see `Attendance.service.js → scheduleAttendance`).

## Production deployment (Ubuntu VPS)

```bash
# 1. install Node 20 + Chromium
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs chromium-browser

# 2. clone + install
git clone git@github.com:ainderew/lazyboi.git /root/lazyboi
cd /root/lazyboi
npm install --production

# 3. write .env (NODE_ENV=production, PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser, etc.)
cp .env.example .env
nano .env

# 4. dirs
mkdir -p logs/screenshots db/slack-session

# 5. process manager
sudo npm install -g pm2
pm2 start server.js --name lazyboi
pm2 save
pm2 startup    # follow the printed command
```

Then do the [Slack one-time setup](#on-a-headless-vps) via port forwarding.

## Project layout

```
controller/        – route handlers
db/                – sqlite db + persisted slack browser profile
logs/              – winston logs + puppeteer screenshots
public/            – dashboard (index.html, css, js)
routes/            – express routers
service/
  Attendance.service.js  – sprout puppeteer flow + cron orchestration
  Slack.service.js       – slack puppeteer flow
  RecordKeeping.service.js – sqlite writes
utils/
  cronManagement.js   – cron schedule definitions
  logger.js           – winston setup
  config.js           – in-memory state shared with the dashboard
server.js          – express bootstrap
```

## Caveats

- **Hardcoded username** — `service/Attendance.service.js` types `apiñon` as the HR portal username. Change it to your own if you fork this.
- **Schedules are hardcoded** — change them in `utils/cronManagement.js`.
- **Sprout selectors** — the Puppeteer flow targets specific element IDs and XPath strings on `theoriamedical.hrhub.ph`. If your HR portal is different (or theirs changes), `Attendance.service.js → performAutomatedAttendance` is the only file you need to touch.
- **Failure screenshots** are saved to `logs/screenshots/` so you can see what went wrong in headless mode.

## License

Personal project, no license. Fork it, gut it, do whatever.
