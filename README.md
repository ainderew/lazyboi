# lazyboi

## Run it

You'll need Node 20 and Chromium installed somewhere on your machine.

```bash
git clone git@github.com:ainderew/lazyboi.git
cd lazyboi
npm install
cp .env.example .env
```

Open `.env` and fill in `PASS` and `SLACK_CHANNEL_ID`. If you're on a server, also set `NODE_ENV=production` and point `PUPPETEER_EXECUTABLE_PATH` at your Chromium binary (usually `/usr/bin/chromium-browser` on Ubuntu).

Then:

```bash
npm start
```

Server runs on `http://localhost:4200`. The dashboard is at `/`.

## Slack login (one time)

The Slack relay piggybacks on a real browser session, so you log in once and it stays logged in.

Local:

```bash
curl http://localhost:4200/slack-setup
```

A browser pops up. Log into Slack, close it, done. Test with `curl http://localhost:4200/test-slack`.

On a headless VPS, forward the debug port and use chrome://inspect:

```bash
ssh -L 9222:localhost:9222 root@your-vps
curl http://your-vps:4200/slack-setup
```

Then open `chrome://inspect` locally, add `localhost:9222` under Configure, and click inspect on the Slack tab to log in. Sessions last months.

## Schedule

Edit `utils/cronManagement.js`. Standard cron syntax, Asia/Manila timezone. Each run gets a random 1 to 30 minute offset on top.

## Production

```bash
sudo apt install -y nodejs chromium-browser
git clone git@github.com:ainderew/lazyboi.git /root/lazyboi
cd /root/lazyboi
npm install --production
cp .env.example .env  # edit it
mkdir -p logs/screenshots db/slack-session
sudo npm install -g pm2
pm2 start server.js --name lazyboi
pm2 save && pm2 startup
```

## Useful routes

- `/` dashboard
- `/test-login`, `/test-logout` trigger flows on demand
- `/test-slack` send a test message
- `/slack-setup` open the Slack login flow
- `/get-records`, `/check-cron-status`, `/next-cron-fire` JSON
