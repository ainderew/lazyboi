// ─── theme ─────────────────────────────────────────────────────────────────

const themeBtn = document.querySelector('[data-theme-toggle]');
const themeLabel = document.querySelector('[data-theme-label]');

function currentTheme() {
  const stored = localStorage.getItem('theme');
  if (stored === 'light' || stored === 'dark') return stored;
  return 'auto';
}

function applyTheme(mode) {
  if (mode === 'auto') {
    const sysDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    document.documentElement.dataset.theme = sysDark ? 'dark' : 'light';
    localStorage.removeItem('theme');
  } else {
    document.documentElement.dataset.theme = mode;
    localStorage.setItem('theme', mode);
  }
  if (themeLabel) themeLabel.textContent = mode;
}

applyTheme(currentTheme());
themeBtn?.addEventListener('click', () => {
  const order = ['auto', 'light', 'dark'];
  applyTheme(order[(order.indexOf(currentTheme()) + 1) % order.length]);
});

// ─── data ──────────────────────────────────────────────────────────────────

const api = (p) => fetch(p, { cache: 'no-store' }).then((r) => r.json());

const cache = { records: null, cron: null, next: null, syncedAt: null, prevNextFire: null };

async function load() {
  const [records, cron, next] = await Promise.allSettled([
    api('/get-records'),
    api('/check-cron-status'),
    api('/next-cron-fire'),
  ]);
  if (records.status === 'fulfilled') cache.records = records.value;
  if (cron.status === 'fulfilled') cache.cron = cron.value;
  if (next.status === 'fulfilled') {
    cache.next = next.value;
    if (cache.next?.nextFire && cache.next.nextFire !== cache.prevNextFire) {
      cache.prevNextFire = cache.next.nextFire;
      // anchor for progress bar — assume "interval" since last successful run or 24h fallback
    }
  }
  cache.syncedAt = new Date();
  render();
}

document.querySelector('[data-refresh]')?.addEventListener('click', () => load());
load();
setInterval(load, 60_000);

// ─── render ────────────────────────────────────────────────────────────────

function render() {
  renderHero();
  renderCard('in');
  renderCard('out');
  renderRecent();
  renderSync();
}

function renderHero() {
  const hero = document.querySelector('[data-hero]');
  const line = document.querySelector('[data-hero-line]');
  const sub = document.querySelector('[data-hero-sub]');
  const badge = document.querySelector('[data-hero-badge]');

  const records = cache.records || [];
  const cronOff = cache.cron && cache.cron.isAutomatedLogsActive === false;

  if (!records.length) {
    hero.dataset.hero = 'idle';
    badge.textContent = 'standby';
    line.textContent = 'No runs yet';
    sub.textContent = 'Waiting for the first one.';
    return;
  }

  const recent = records.slice(0, 5);
  const failed = recent.filter((r) => r.status !== 'success').length;
  const lastDate = parseEntryDate(recent[0].dateTime);

  if (failed >= 3) {
    hero.dataset.hero = 'bad';
    badge.textContent = 'critical';
    line.textContent = 'Something is broken';
    sub.textContent = `${failed} of the last ${recent.length} runs failed. Take a look at the recent runs below.`;
    return;
  }
  if (cronOff) {
    hero.dataset.hero = 'warn';
    badge.textContent = 'paused';
    line.textContent = 'Cron is paused';
    sub.textContent = 'Nothing will run until it’s restarted.';
    return;
  }
  if (failed >= 1) {
    hero.dataset.hero = 'warn';
    badge.textContent = 'attention';
    line.textContent = 'Last run failed';
    sub.textContent = 'Cron is still scheduled — the next attempt should recover.';
    return;
  }

  hero.dataset.hero = 'ok';
  badge.textContent = 'all good';
  line.textContent = 'Everything is running';
  sub.textContent = lastDate ? `Last run ${humanRelative(lastDate)}, all green.` : 'Recent runs all green.';
}

function renderCard(mode) {
  const card = document.querySelector(`.card[data-track="${mode}"]`);
  if (!card) return;
  const records = cache.records || [];
  const entries = records.filter((r) => r.type && r.type.startsWith(mode) && !r.type.includes('slack'));
  const last = entries[0];
  const lastDate = last ? parseEntryDate(last.dateTime) : null;
  const next = cache.next;

  let state = 'idle';
  let label = 'No runs';
  if (last) {
    if (last.status === 'success') { state = 'ok'; label = 'Working'; }
    else { state = 'bad'; label = 'Failing'; }
  }
  card.dataset.state = state;
  card.querySelector('[data-status]').textContent = label;
  card.querySelector('[data-last]').textContent = lastDate ? humanRelative(lastDate) : '—';

  const nextEl = card.querySelector('[data-next]');
  if (next && next.mode === mode && next.nextFire) {
    nextEl.textContent = formatNextWhen(new Date(next.nextFire));
  } else {
    nextEl.textContent = '—';
  }

  renderSpark(card.querySelector('[data-spark]'), entries);
}

function renderSpark(container, entries) {
  if (!container) return;
  const days = [];
  const now = new Date();
  for (let i = 13; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    days.push({ key: dayKey(d), label: dayLabel(d), state: isWeekend(d) ? 'weekend' : 'miss' });
  }
  for (const e of entries) {
    const d = parseEntryDate(e.dateTime);
    if (!d) continue;
    const slot = days.find((x) => x.key === dayKey(d));
    if (!slot) continue;
    if (e.status === 'success') slot.state = 'ok';
    else if (slot.state !== 'ok') slot.state = 'bad';
  }
  container.innerHTML = days
    .map((d) => `<div class="spark__cell" data-state="${d.state}" data-label="${d.label}"></div>`)
    .join('');
}

function dayKey(d) {
  return d.toLocaleDateString('en-US', { timeZone: 'Asia/Manila', year: 'numeric', month: '2-digit', day: '2-digit' });
}

function dayLabel(d) {
  const md = d.toLocaleDateString('en-US', { timeZone: 'Asia/Manila', month: 'long', day: 'numeric' });
  const wd = d.toLocaleDateString('en-US', { timeZone: 'Asia/Manila', weekday: 'long' });
  return `${md} (${wd})`;
}

function isWeekend(d) {
  const wd = d.toLocaleDateString('en-US', { timeZone: 'Asia/Manila', weekday: 'short' });
  return wd === 'Sat' || wd === 'Sun';
}

function renderRecent() {
  const list = document.querySelector('[data-list]');
  const records = cache.records || [];
  if (!records.length) {
    list.innerHTML = `<li class="recent__empty">no runs yet</li>`;
    return;
  }
  list.innerHTML = records.slice(0, 8).map(renderRow).join('');
}

function renderRow(r) {
  const d = parseEntryDate(r.dateTime);
  const isOut = r.type?.startsWith('out');
  const isSlack = r.type?.includes('slack');
  const what = isSlack ? 'Slack relay' : isOut ? 'Clock out' : 'Clock in';
  const fail = r.status !== 'success';
  return `
    <li class="${fail ? 'run--bad' : ''}">
      <span class="run__pip"></span>
      <span class="run__what">${what}</span>
      <span class="run__when">${d ? humanRelative(d) : '—'}</span>
    </li>
  `;
}

function renderSync() {
  const el = document.querySelector('[data-sync]');
  if (el) el.textContent = cache.syncedAt ? `synced ${shortAgo(cache.syncedAt)}` : '—';
}

// ─── countdown (1s tick) ───────────────────────────────────────────────────

const cdPanel = document.querySelector('[data-countdown]');
const cdTime = document.querySelector('[data-cd-time]');
const cdWhen = document.querySelector('[data-cd-when]');
const cdFill = document.querySelector('[data-cd-fill]');
const mnlEl = document.querySelector('[data-mnl]');

let cdAnchorMs = null; // when this countdown started ticking, for progress bar
let cdAnchorTarget = null;

function tickCountdown() {
  // live manila clock in foot
  if (mnlEl) {
    mnlEl.textContent = new Date().toLocaleTimeString('en-GB', {
      timeZone: 'Asia/Manila', hour: '2-digit', minute: '2-digit', second: '2-digit',
    }) + ' mnl';
  }

  if (!cdPanel) return;
  const next = cache.next;
  if (!next || !next.nextFire) {
    cdPanel.hidden = true;
    return;
  }
  cdPanel.hidden = false;

  const target = next.nextFire;
  if (cdAnchorTarget !== target) {
    cdAnchorTarget = target;
    cdAnchorMs = Date.now();
  }

  const remaining = Math.max(0, target - Date.now());
  cdTime.innerHTML = formatHMS(remaining);

  // progress bar — proportion elapsed since we first saw this target
  const total = Math.max(1, target - cdAnchorMs);
  const elapsed = Math.min(total, Date.now() - cdAnchorMs);
  const pct = Math.round((elapsed / total) * 100);
  cdFill.style.setProperty('--p', `${pct}%`);

  cdWhen.textContent = formatNextWhen(new Date(target));
}

function formatHMS(ms) {
  const total = Math.floor(ms / 1000);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const pad = (n) => String(n).padStart(2, '0');
  return `${pad(h)}<span class="sep">:</span>${pad(m)}<span class="sep">:</span>${pad(s)}`;
}

tickCountdown();
setInterval(tickCountdown, 1000);

// ─── helpers ───────────────────────────────────────────────────────────────

function parseEntryDate(raw) {
  if (!raw) return null;
  if (raw instanceof Date) return raw;
  const d = new Date(String(raw).replace(' at ', ' '));
  return isNaN(d.getTime()) ? null : d;
}

function humanRelative(d) {
  const diff = Date.now() - d.getTime();
  const min = Math.round(diff / 60000);
  const hr = Math.floor(min / 60);
  const day = Math.floor(hr / 24);
  if (Math.abs(min) < 1) return 'just now';
  if (min > 0) {
    if (min < 60) return `${min}m ago`;
    if (hr < 24) return `${hr}h ago`;
    if (day < 7) return `${day}d ago`;
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }
  const fmin = -min;
  const fhr = Math.floor(fmin / 60);
  if (fmin < 60) return `in ${fmin}m`;
  if (fhr < 24) return `in ${fhr}h`;
  return d.toLocaleDateString('en-US', { weekday: 'short' });
}

function shortAgo(d) {
  const s = Math.floor((Date.now() - d.getTime()) / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  return `${Math.floor(m / 60)}h ago`;
}

function formatNextWhen(d) {
  const now = new Date();
  const sameDay = d.toDateString() === now.toDateString();
  const tomorrow = new Date(now);
  tomorrow.setDate(now.getDate() + 1);
  const isTomorrow = d.toDateString() === tomorrow.toDateString();
  const time = d.toLocaleTimeString('en-US', {
    timeZone: 'Asia/Manila', hour: 'numeric', minute: '2-digit',
  }).toLowerCase();
  if (sameDay) return `today ${time}`;
  if (isTomorrow) return `tomorrow ${time}`;
  return d.toLocaleDateString('en-US', { timeZone: 'Asia/Manila', weekday: 'short' }).toLowerCase() + ` ${time}`;
}
