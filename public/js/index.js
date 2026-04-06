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

const clockBtn = document.querySelector('[data-clock-toggle]');
const clockLabel = document.querySelector('[data-clock-label]');

function currentClockFormat() {
  return localStorage.getItem('clock-format') === '12h' ? '12h' : '24h';
}

function applyClockFormat(fmt) {
  localStorage.setItem('clock-format', fmt);
  if (clockLabel) clockLabel.textContent = fmt;
  refreshAllTimes();
}

function cycleClockFormat() {
  applyClockFormat(currentClockFormat() === '24h' ? '12h' : '24h');
}

if (clockLabel) clockLabel.textContent = currentClockFormat();
clockBtn?.addEventListener('click', cycleClockFormat);

const is12h = () => currentClockFormat() === '12h';

const api = (p) => fetch(p).then((r) => r.json());

let cachedRecords = null;
let cachedNext = null;

Promise.allSettled([
  api('/get-records'),
  api('/check-cron-status'),
  api('/next-cron-fire'),
]).then(([records, cron, next]) => {
  if (records.status === 'fulfilled') {
    cachedRecords = records.value;
    renderLog(cachedRecords);
  }
  if (cron.status === 'fulfilled') renderCronState(cron.value);
  if (next.status === 'fulfilled') {
    cachedNext = next.value;
    startGauge(cachedNext);
  }
});

function refreshAllTimes() {
  if (cachedRecords) renderLog(cachedRecords);
  if (cachedNext && cachedNext.nextFire) updateGaugeReadout();
  tickClock();
}

function buildTicks() {
  const g = document.querySelector('[data-gauge-ticks]');
  if (!g) return;
  const cx = 210;
  const cy = 210;
  const rOuter = 178;
  const rInnerMinor = 168;
  const rInnerMajor = 158;
  const rLabel = 142;
  const ticks = [];

  for (let i = 0; i < 60; i++) {
    const angle = (i / 60) * Math.PI * 2 - Math.PI / 2;
    const isMajor = i % 5 === 0;
    const x1 = cx + Math.cos(angle) * rOuter;
    const y1 = cy + Math.sin(angle) * rOuter;
    const x2 = cx + Math.cos(angle) * (isMajor ? rInnerMajor : rInnerMinor);
    const y2 = cy + Math.sin(angle) * (isMajor ? rInnerMajor : rInnerMinor);
    ticks.push(
      `<line class="${isMajor ? 'major' : ''}" x1="${x1.toFixed(2)}" y1="${y1.toFixed(2)}" x2="${x2.toFixed(2)}" y2="${y2.toFixed(2)}" stroke-width="${isMajor ? 1.5 : 1}" />`,
    );
  }

  const labels = [
    { hr: 0, label: '24' },
    { hr: 6, label: '06' },
    { hr: 12, label: '12' },
    { hr: 18, label: '18' },
  ];
  for (const { hr, label } of labels) {
    const angle = (hr / 24) * Math.PI * 2 - Math.PI / 2;
    const x = cx + Math.cos(angle) * rLabel;
    const y = cy + Math.sin(angle) * rLabel + 5;
    ticks.push(
      `<text x="${x.toFixed(2)}" y="${y.toFixed(2)}" text-anchor="middle">${label}</text>`,
    );
  }

  g.innerHTML = ticks.join('');
}
buildTicks();

let gaugeTickFn = null;

function startGauge({ nextFire, mode }) {
  const arcs = document.querySelectorAll('.gauge__progress');
  const elapsed = document.querySelector('.gauge__elapsed');
  const needle = document.querySelector('.gauge__needle');
  const modeEl = document.querySelector('[data-mode-display]');
  const etaEl = document.querySelector('[data-eta-display]');
  const preciseEl = document.querySelector('[data-eta-precise]');
  const windowEl = document.querySelector('[data-mode-window]');

  if (!nextFire) {
    if (modeEl) modeEl.textContent = '—';
    if (etaEl) etaEl.textContent = 'no fire';
    return;
  }

  document.body.dataset.mode = mode;
  modeEl.textContent = mode;

  const ONE_DAY = 24 * 60 * 60 * 1000;
  const prev = nextFire - ONE_DAY;

  function tick() {
    const now = Date.now();
    let t = (now - prev) / ONE_DAY;
    t = Math.max(0, Math.min(1, t));

    arcs.forEach((el) => el.setAttribute('stroke-dasharray', `${t} ${1 - t}`));
    elapsed.setAttribute('stroke-dasharray', `${t} ${1 - t}`);

    const deg = t * 360;
    needle.setAttribute('transform', `rotate(${deg.toFixed(2)})`);

    const diff = nextFire - now;
    etaEl.textContent = formatEta(diff);
    preciseEl.textContent = formatPrecise(nextFire);
    if (windowEl) {
      windowEl.textContent = `window: ${formatManila(prev)} → ${formatManila(nextFire)}`;
    }
  }

  gaugeTickFn = tick;
  tick();
  setInterval(tick, 1000);

  setInterval(async () => {
    try {
      const fresh = await api('/next-cron-fire');
      if (fresh.nextFire !== nextFire || fresh.mode !== mode) {
        location.reload();
      }
    } catch {}
  }, 5 * 60 * 1000);
}

function updateGaugeReadout() {
  if (gaugeTickFn) gaugeTickFn();
}

function formatEta(ms) {
  if (ms <= 0) return 'firing';
  const sec = Math.floor(ms / 1000);
  const hr = Math.floor(sec / 3600);
  const min = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  if (hr > 0) return `${pad(hr)}h ${pad(min)}m`;
  if (min > 0) return `${pad(min)}m ${pad(s)}s`;
  return `${pad(s)}s`;
}

function pad(n) {
  return String(n).padStart(2, '0');
}

function formatManila(utcMs) {
  const d = new Date(utcMs);
  return d
    .toLocaleString('en-US', {
      timeZone: 'Asia/Manila',
      hour: 'numeric',
      minute: '2-digit',
      hour12: is12h(),
    })
    .toLowerCase();
}

function formatPrecise(utcMs) {
  const d = new Date(utcMs);
  return d
    .toLocaleString('en-US', {
      timeZone: 'Asia/Manila',
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: is12h() ? 'numeric' : '2-digit',
      minute: '2-digit',
      hour12: is12h(),
    })
    .toLowerCase();
}

function renderCronState(data) {
  const stateEl = document.querySelector('[data-cron-state]');
  const stateLed = document.querySelector('[data-cron-led]');
  const sysLed = document.querySelector('[data-system-led]');
  const sysState = document.querySelector('[data-system-state]');

  const ok = !!data.isAutomatedLogsActive;

  if (stateEl) stateEl.textContent = ok ? 'armed · running' : 'standby';
  if (stateLed) stateLed.classList.toggle('led--ok', ok);

  if (sysState) sysState.textContent = ok ? 'nominal' : 'standby';
  if (sysLed) sysLed.classList.toggle('led--ok', ok);
}

function renderLog(records) {
  const list = document.querySelector('[data-ledger]');
  const count = document.querySelector('[data-ledger-count]');
  const lastTended = document.querySelector('[data-last-tended]');
  if (!list) return;

  if (!records || records.length === 0) {
    list.innerHTML = `<li class="log__row log__row--placeholder">┄ no entries on record ┄</li>`;
    if (count) count.textContent = '00';
    return;
  }

  const rows = records.slice(0, 20).map((r, i) => {
    const isFail = r.status !== 'success';
    const isOut = r.type.startsWith('out');
    const isSlack = r.type.includes('slack');

    const time = formatLogTime(r.dateTime);
    const channel = isSlack ? 'slack · relay' : 'sprout · primary';
    const seq = String(records.length - i).padStart(3, '0');
    const statusLed = isFail ? 'led--err' : 'led--ok';

    return `
      <li class="log__row ${isOut ? 'log__row--out' : 'log__row--in'} ${isFail ? 'log__row--failed' : ''}">
        <span class="log__seq">#${seq}</span>
        <span class="log__time tabular">${time}</span>
        <span class="log__channel">${channel}</span>
        <span class="log__action"></span>
        <span class="log__status"><span class="led ${statusLed}"></span>${r.status}</span>
      </li>
    `;
  });

  list.innerHTML = rows.join('');

  if (count) {
    count.textContent = String(records.length).padStart(2, '0');
  }
  if (lastTended && records[0]) {
    lastTended.textContent = relativeTime(records[0].dateTime);
  }
}

function formatLogTime(raw) {
  const d = parseLogDate(raw);
  if (!d) return raw;
  return d
    .toLocaleString('en-US', {
      timeZone: 'Asia/Manila',
      month: 'short',
      day: '2-digit',
      hour: is12h() ? 'numeric' : '2-digit',
      minute: '2-digit',
      hour12: is12h(),
    })
    .toLowerCase()
    .replace(',', '');
}

function parseLogDate(raw) {
  if (!raw) return null;
  const cleaned = raw.replace(' at ', ' ');
  const d = new Date(cleaned);
  if (isNaN(d.getTime())) return null;
  return d;
}

function relativeTime(raw) {
  const d = parseLogDate(raw);
  if (!d) return '—';
  const diff = Date.now() - d.getTime();
  const min = Math.floor(diff / 60000);
  const hr = Math.floor(min / 60);
  const day = Math.floor(hr / 24);
  if (min < 1) return 't−00:00';
  if (min < 60) return `t−00:${pad(min)}`;
  if (hr < 24) return `t−${pad(hr)}:${pad(min % 60)}`;
  return `t−${day}d ${pad(hr % 24)}h`;
}

function tickClock() {
  const el = document.querySelector('[data-now]');
  if (!el) return;
  const d = new Date();
  el.textContent = d
    .toLocaleString('en-US', {
      timeZone: 'Asia/Manila',
      hour: is12h() ? 'numeric' : '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: is12h(),
    })
    .toLowerCase();
}

tickClock();
setInterval(tickClock, 1000);
