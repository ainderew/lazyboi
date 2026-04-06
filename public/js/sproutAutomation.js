/* ─────────────────────────────────────────────
   lazyboi · still garden
   soft/organic dashboard — ambient + honest
   ───────────────────────────────────────────── */

const MANILA_OFFSET_MS = 8 * 60 * 60 * 1000;

// ─── theme toggle ──────────────────────────
const themeBtn = document.querySelector('[data-theme-toggle]');
const themeLabel = document.querySelector('[data-theme-label]');

function currentTheme() {
  const stored = localStorage.getItem('theme');
  if (stored === 'light' || stored === 'dark') return stored;
  return 'auto';
}

function applyTheme(mode) {
  if (mode === 'auto') {
    delete document.documentElement.dataset.theme;
    localStorage.removeItem('theme');
  } else {
    document.documentElement.dataset.theme = mode;
    localStorage.setItem('theme', mode);
  }
  if (themeLabel) themeLabel.textContent = mode;
}

function cycleTheme() {
  const order = ['auto', 'light', 'dark'];
  const next = order[(order.indexOf(currentTheme()) + 1) % order.length];
  applyTheme(next);
}

applyTheme(currentTheme());
themeBtn?.addEventListener('click', cycleTheme);

// ─── data fetches ──────────────────────────
const api = (p) => fetch(p).then((r) => r.json());

Promise.allSettled([
  api('/get-records'),
  api('/check-cron-status'),
  api('/next-cron-fire'),
]).then(([records, cron, next]) => {
  if (records.status === 'fulfilled') renderLedger(records.value);
  if (cron.status === 'fulfilled') renderCronState(cron.value);
  if (next.status === 'fulfilled') {
    startDial(next.value);
    renderHeroPhrase(next.value);
  }
});

// ─── hero phrase (gentle, not anxious) ────
function renderHeroPhrase({ nextFire, mode }) {
  const el = document.querySelector('[data-cron-phrase]');
  if (!el || !nextFire) return;

  const diffMin = (nextFire - Date.now()) / 60000;
  let phrase;
  if (diffMin < 2) phrase = 'a breath is about to be taken.';
  else if (diffMin < 60) phrase = 'something stirs soon.';
  else if (diffMin < 60 * 6) phrase = 'a quiet afternoon ahead.';
  else phrase = 'everything is calm.';

  el.textContent = phrase;
}

// ─── dial widget ───────────────────────────
const PATH_LEN = 1; // using pathLength="1" so we can use 0..1
const ARC_POINTS = computeArcPoints();

function computeArcPoints() {
  // Sample points along M 40 220 A 160 160 0 0 1 360 220 (semicircle)
  // Center: (200, 220), radius: 160. Angle goes from 180° → 0°.
  const pts = [];
  const steps = 200;
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const angle = Math.PI - t * Math.PI; // π → 0
    pts.push({
      x: 200 + 160 * Math.cos(angle),
      y: 220 - 160 * Math.sin(angle),
      t,
    });
  }
  return pts;
}

function startDial({ nextFire, mode }) {
  const arc = document.querySelector('.dial__arc');
  const pebble = document.querySelector('.dial__pebble');
  const pebbleInner = document.querySelector('.dial__pebble-inner');
  const pebbleGlow = document.querySelector('.dial__pebble-glow');
  const labelEl = document.querySelector('[data-dial-label]');
  const phraseEl = document.querySelector('[data-dial-phrase]');
  const preciseEl = document.querySelector('[data-dial-precise]');

  if (!nextFire) {
    phraseEl.textContent = 'no schedule.';
    preciseEl.textContent = '—';
    return;
  }

  // Set mode on body so the dial colors shift
  document.body.dataset.mode = mode;

  // Anchor the arc to "one full window" — from the previous cron fire to the next
  const prev = previousCronFire(nextFire, mode);
  const total = nextFire - prev;

  labelEl.textContent = `next · ${mode}`;

  function tick() {
    const now = Date.now();
    let t = (now - prev) / total;
    t = Math.max(0, Math.min(1, t));

    // Draw progress arc (0..1 of pathLength=1)
    arc.setAttribute('stroke-dashoffset', String(1 - t));

    // Position pebble along the semicircle
    const pt = sampleArc(t);
    [pebble, pebbleInner, pebbleGlow].forEach((el) => {
      el.setAttribute('cx', pt.x.toFixed(2));
      el.setAttribute('cy', pt.y.toFixed(2));
    });

    // Natural language for the caption
    phraseEl.textContent = naturalPhrase(nextFire - now);
    preciseEl.textContent = formatPreciseTarget(nextFire);
  }

  tick();
  setInterval(tick, 1000);

  // Re-sync with backend every 5 minutes
  setInterval(async () => {
    try {
      const fresh = await api('/next-cron-fire');
      if (fresh.nextFire !== nextFire || fresh.mode !== mode) {
        location.reload();
      }
    } catch {}
  }, 5 * 60 * 1000);
}

function sampleArc(t) {
  const idx = Math.round(t * (ARC_POINTS.length - 1));
  return ARC_POINTS[idx];
}

function previousCronFire(nextFireUtc, mode) {
  // Previous fire is the same mode, 24h earlier, unless weekend skips apply.
  // For our purposes, use 24h prior — the visual anchor doesn't need to match
  // the exact scheduled previous fire; it just needs to give the pebble a
  // meaningful trajectory from "last event" to "next event".
  const ONE_DAY = 24 * 60 * 60 * 1000;
  return nextFireUtc - ONE_DAY;
}

function naturalPhrase(ms) {
  if (ms <= 0) return 'tending now…';
  const sec = Math.floor(ms / 1000);
  const min = Math.floor(sec / 60);
  const hr = Math.floor(min / 60);
  const day = Math.floor(hr / 24);

  if (sec < 60) return `in ${sec} seconds.`;
  if (min === 1) return 'in about a minute.';
  if (min < 10) return `in about ${min} minutes.`;
  if (min < 60) {
    const rounded = Math.round(min / 5) * 5;
    return `in about ${rounded} minutes.`;
  }
  if (hr < 2) {
    const leftover = min - 60;
    if (leftover < 5) return 'in about an hour.';
    return `in about an hour and ${Math.round(leftover / 5) * 5}.`;
  }
  if (hr < 12) return `in about ${hr} hours.`;
  if (day < 1) return `later today.`;
  if (day === 1) return 'tomorrow morning.';
  return `in ${day} days.`;
}

function formatPreciseTarget(utcMs) {
  const d = new Date(utcMs);
  const opts = {
    timeZone: 'Asia/Manila',
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  };
  return `· ${d.toLocaleString('en-US', opts)} · manila`;
}

// ─── facts / cron state ────────────────────
function renderCronState(data) {
  const el = document.querySelector('[data-cron-state]');
  if (!el) return;
  el.textContent = data.isAutomatedLogsActive
    ? 'running · quietly'
    : 'paused';
}

// ─── ledger ────────────────────────────────
function renderLedger(records) {
  const list = document.querySelector('[data-ledger]');
  const count = document.querySelector('[data-ledger-count]');
  const lastTended = document.querySelector('[data-last-tended]');
  if (!list) return;

  if (!records || records.length === 0) {
    list.innerHTML = `<li class="ledger__row"><span class="ledger__dot"></span><span class="ledger__time">—</span><span class="ledger__verb"><em>the garden is untouched.</em></span><span class="ledger__status">empty</span></li>`;
    if (count) count.textContent = '0 entries';
    return;
  }

  const rows = records.slice(0, 20).map((r) => {
    const isFail = r.status !== 'success';
    const isOut = r.type.startsWith('out');
    const isSlack = r.type.includes('slack');

    let verb;
    if (isOut) {
      verb = isSlack
        ? `whispered <strong>out</strong> on slack.`
        : `clocked <strong>out</strong>.`;
    } else {
      verb = isSlack
        ? `whispered <strong>in</strong> on slack.`
        : `clocked <strong>in</strong>.`;
    }

    const time = formatLedgerTime(r.dateTime);

    return `
      <li class="ledger__row ${isOut ? 'ledger__row--out' : 'ledger__row--in'} ${isFail ? 'ledger__row--failed' : ''}">
        <span class="ledger__dot"></span>
        <span class="ledger__time">${time}</span>
        <span class="ledger__verb">${verb}</span>
        <span class="ledger__status">${r.status}</span>
      </li>
    `;
  });

  list.innerHTML = rows.join('');

  if (count) {
    count.textContent = `${records.length} ${records.length === 1 ? 'entry' : 'entries'}`;
  }

  if (lastTended && records[0]) {
    lastTended.textContent = relativeTime(records[0].dateTime);
  }
}

function formatLedgerTime(raw) {
  // Input like: "April 4, 2026 at 6:03:04 AM"
  const d = parseLedgerDate(raw);
  if (!d) return raw;
  const opts = {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  };
  return d.toLocaleString('en-US', opts).replace(',', ' ·');
}

function parseLedgerDate(raw) {
  if (!raw) return null;
  // "April 4, 2026 at 6:03:04 AM" → parseable after removing " at "
  const cleaned = raw.replace(' at ', ' ');
  const d = new Date(cleaned);
  if (isNaN(d.getTime())) return null;
  return d;
}

function relativeTime(raw) {
  const d = parseLedgerDate(raw);
  if (!d) return '—';
  const diff = Date.now() - d.getTime();
  const min = Math.floor(diff / 60000);
  const hr = Math.floor(min / 60);
  const day = Math.floor(hr / 24);
  if (min < 1) return 'just now';
  if (min < 60) return `${min}m ago`;
  if (hr < 24) return `${hr}h ago`;
  if (day === 1) return 'yesterday';
  return `${day}d ago`;
}

// ─── live footer clock ─────────────────────
function tickNow() {
  const el = document.querySelector('[data-now]');
  if (!el) return;
  const d = new Date();
  el.textContent = d.toLocaleTimeString('en-US', {
    timeZone: 'Asia/Manila',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }) + ' · manila';
}

tickNow();
setInterval(tickNow, 1000);
