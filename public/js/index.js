const themeBtn = document.querySelector('[data-theme-toggle]');
const themeLabel = document.querySelector('[data-theme-label]');
const clockBtn = document.querySelector('[data-clock-toggle]');
const clockLabel = document.querySelector('[data-clock-label]');

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

applyTheme(currentTheme());
themeBtn?.addEventListener('click', () => {
  const order = ['auto', 'light', 'dark'];
  applyTheme(order[(order.indexOf(currentTheme()) + 1) % order.length]);
});

function currentClockFormat() {
  return localStorage.getItem('clock-format') === '12h' ? '12h' : '24h';
}

function applyClockFormat(fmt) {
  localStorage.setItem('clock-format', fmt);
  if (clockLabel) clockLabel.textContent = fmt;
  refreshAllTimes();
}

if (clockLabel) clockLabel.textContent = currentClockFormat();
clockBtn?.addEventListener('click', () => {
  applyClockFormat(currentClockFormat() === '24h' ? '12h' : '24h');
});

const is12h = () => currentClockFormat() === '12h';

const api = (p) => fetch(p).then((r) => r.json());

let cachedRecords = null;
let cachedNext = null;

Promise.allSettled([
  api('/get-records'),
  api('/check-cron-status'),
  api('/next-cron-fire'),
]).then(([records, cron, next]) => {
  if (records.status === 'fulfilled') cachedRecords = records.value;
  if (next.status === 'fulfilled') cachedNext = next.value;

  renderHeadline(cachedRecords, cron.status === 'fulfilled' ? cron.value : null);
  renderNext(cachedNext);
  renderLedger(cachedRecords);
});

function refreshAllTimes() {
  if (cachedRecords) renderLedger(cachedRecords);
  if (cachedNext) renderNext(cachedNext);
  tickClock();
}

function renderHeadline(records, cron) {
  const kicker = document.querySelector('[data-status-kicker]');
  const headline = document.querySelector('[data-headline]');
  const sub = document.querySelector('[data-subline]');

  if (!records || records.length === 0) {
    headline.innerHTML = `Awaiting first <em>fire</em>.`;
    sub.textContent = 'no entries on record yet.';
    return;
  }

  const recent = records.slice(0, 5);
  const lastFailed = recent[0].status !== 'success';
  const recentFailures = recent.filter((r) => r.status !== 'success').length;

  if (recentFailures >= 3) {
    kicker.classList.add('is-bad');
    kicker.classList.remove('is-warn');
    headline.innerHTML = `Things are <em>not okay</em>.`;
    sub.textContent = `${recentFailures} of the last ${recent.length} attempts failed. take a look.`;
    return;
  }

  if (lastFailed) {
    kicker.classList.add('is-warn');
    kicker.classList.remove('is-bad');
    headline.innerHTML = `Last fire <em>missed</em>.`;
    sub.textContent = `the most recent attempt did not complete. cron is still scheduled.`;
    return;
  }

  if (cron && cron.isAutomatedLogsActive === false) {
    kicker.classList.add('is-warn');
    headline.innerHTML = `Automation is <em>paused</em>.`;
    sub.textContent = `recent fires were fine. cron is currently not running.`;
    return;
  }

  kicker.classList.remove('is-warn', 'is-bad');
  headline.innerHTML = `Everything <em>is running</em>.`;
  const last = parseEntryDate(recent[0].dateTime);
  if (last) {
    sub.textContent = `last fire ${humanRelative(last)}, all green.`;
  } else {
    sub.textContent = `recent fires all green.`;
  }
}

function renderNext(data) {
  const whenEl = document.querySelector('[data-next-when]');
  const whatEl = document.querySelector('[data-next-what]');
  const hintEl = document.querySelector('[data-next-hint]');

  if (!data || !data.nextFire) {
    whenEl.textContent = 'unscheduled';
    whatEl.textContent = '';
    hintEl.textContent = '';
    return;
  }

  const d = new Date(data.nextFire);
  whenEl.textContent = formatNextWhen(d);
  whatEl.textContent = data.mode === 'in' ? 'clock in' : 'clock out';

  const diffMs = data.nextFire - Date.now();
  hintEl.textContent = `${formatPreciseLocal(d)}, ${formatRelativeFuture(diffMs)} from now (plus a 1 to 30 minute random delay)`;
}

function formatNextWhen(d) {
  const hour = d.toLocaleString('en-US', {
    timeZone: 'Asia/Manila',
    hour: 'numeric',
    minute: '2-digit',
    hour12: is12h(),
  });

  const now = new Date();
  const today = now.toLocaleString('en-US', { timeZone: 'Asia/Manila', day: 'numeric', month: 'numeric', year: 'numeric' });
  const target = d.toLocaleString('en-US', { timeZone: 'Asia/Manila', day: 'numeric', month: 'numeric', year: 'numeric' });

  let prefix;
  if (today === target) {
    prefix = '';
  } else {
    const tomorrow = new Date(now);
    tomorrow.setDate(now.getDate() + 1);
    const tomorrowStr = tomorrow.toLocaleString('en-US', { timeZone: 'Asia/Manila', day: 'numeric', month: 'numeric', year: 'numeric' });
    if (target === tomorrowStr) {
      prefix = 'tomorrow ';
    } else {
      prefix = d.toLocaleString('en-US', { timeZone: 'Asia/Manila', weekday: 'long' }).toLowerCase() + ' ';
    }
  }

  return `${prefix}${hour.toLowerCase()}`;
}

function formatPreciseLocal(d) {
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

function formatRelativeFuture(ms) {
  if (ms <= 0) return 'firing now';
  const min = Math.round(ms / 60000);
  if (min < 60) return `${min} min`;
  const hr = Math.floor(min / 60);
  const restMin = min % 60;
  if (hr < 24) return restMin === 0 ? `${hr}h` : `${hr}h ${restMin}m`;
  const day = Math.floor(hr / 24);
  return `${day}d ${hr % 24}h`;
}

function humanRelative(d) {
  const diff = Date.now() - d.getTime();
  const min = Math.floor(diff / 60000);
  const hr = Math.floor(min / 60);
  const day = Math.floor(hr / 24);
  if (min < 1) return 'a moment ago';
  if (min === 1) return 'a minute ago';
  if (min < 60) return `${min} minutes ago`;
  if (hr === 1) return 'an hour ago';
  if (hr < 24) return `${hr} hours ago`;
  if (day === 1) return 'yesterday';
  if (day < 7) return `${day} days ago`;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function renderLedger(records) {
  const list = document.querySelector('[data-ledger]');
  const count = document.querySelector('[data-record-count]');
  if (!list) return;

  if (!records || records.length === 0) {
    list.innerHTML = `<li class="record__placeholder">no fires recorded yet.</li>`;
    if (count) count.textContent = '0';
    return;
  }

  if (count) count.textContent = String(records.length);

  const groups = groupByDay(records.slice(0, 30));

  list.innerHTML = groups
    .map(
      ({ key, label, weekday, items }) => `
        <li class="record__day">
          <div class="record__day-label">${label}<small>${weekday}</small></div>
          <div class="record__entries">
            ${items.map(renderEntry).join('')}
          </div>
        </li>
      `,
    )
    .join('');
}

function renderEntry(r) {
  const isFail = r.status !== 'success';
  const isOut = r.type.startsWith('out');
  const isSlack = r.type.includes('slack');
  const time = formatEntryTime(r.dateTime);
  const verb = isOut ? 'clock out' : 'clock in';
  const channel = isSlack ? 'slack relay' : 'sprout';

  return `
    <div class="entry ${isOut ? 'entry--out' : 'entry--in'} ${isFail ? 'entry--failed' : ''}">
      <span class="entry__time">${time}</span>
      <span class="entry__action">
        <span class="entry__verb">${verb}</span>
        <span class="entry__channel">${channel}</span>
      </span>
      <span class="entry__mark"></span>
    </div>
  `;
}

function groupByDay(records) {
  const byKey = new Map();
  for (const r of records) {
    const d = parseEntryDate(r.dateTime);
    if (!d) continue;
    const key = d.toLocaleDateString('en-US', { timeZone: 'Asia/Manila', year: 'numeric', month: 'numeric', day: 'numeric' });
    if (!byKey.has(key)) {
      byKey.set(key, {
        key,
        label: d
          .toLocaleDateString('en-US', { timeZone: 'Asia/Manila', month: 'long', day: 'numeric' })
          .toLowerCase(),
        weekday: d
          .toLocaleDateString('en-US', { timeZone: 'Asia/Manila', weekday: 'long' })
          .toLowerCase(),
        items: [],
      });
    }
    byKey.get(key).items.push(r);
  }
  return [...byKey.values()];
}

function parseEntryDate(raw) {
  if (!raw) return null;
  const cleaned = raw.replace(' at ', ' ');
  const d = new Date(cleaned);
  return isNaN(d.getTime()) ? null : d;
}

function formatEntryTime(raw) {
  const d = parseEntryDate(raw);
  if (!d) return raw;
  return d
    .toLocaleString('en-US', {
      timeZone: 'Asia/Manila',
      hour: is12h() ? 'numeric' : '2-digit',
      minute: '2-digit',
      hour12: is12h(),
    })
    .toLowerCase();
}

function tickClock() {
  const now = document.querySelector('[data-now]');
  const today = document.querySelector('[data-today]');
  const d = new Date();

  if (now) {
    now.textContent = d
      .toLocaleString('en-US', {
        timeZone: 'Asia/Manila',
        hour: is12h() ? 'numeric' : '2-digit',
        minute: '2-digit',
        hour12: is12h(),
      })
      .toLowerCase();
  }

  if (today) {
    today.textContent = d
      .toLocaleDateString('en-US', {
        timeZone: 'Asia/Manila',
        weekday: 'long',
        month: 'long',
        day: 'numeric',
      })
      .toLowerCase();
  }
}

tickClock();
setInterval(tickClock, 30000);
