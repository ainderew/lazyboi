const testH1 = document.querySelector('.log-container');

fetch(`/get-records`)
  .then((res) => res.json())
  .then((data) => displayRecords(data))
  .catch((err) => console.log(err));

fetch(`/check-cron-status`)
  .then((res) => res.json())
  .then((data) => displayCronStatus(data))
  .catch((err) => console.log(err));

fetch(`/check-next-sprout-automation`)
  .then((res) => res.json())
  .then((data) => displayNextSproutAutomationTime(data))
  .catch((err) => console.log(err));

startCountdown();

function displayRecords(timelogs) {
  console.log(timelogs);
  testH1.innerHTML = timelogs
    .map(
      (el) => `
<div class="data-row">
  <div class="status-bubble ${el.status === 'success' ? 'success-bubble' : 'fail-bubble'}" ></div>

  <div class="row-text">
   <span class="value-text">${el.dateTime}</span>
   <span class="value-text">${el.type}</span>
   <span class="value-text ${el.status === 'success' ? 'success-text' : 'fail-text'}">${el.status}</span>
  </div>
</div> `,
    )
    .join('');
}

function displayCronStatus(data) {
  const indicator = document.querySelector('.cron-status-indicator');
  const statusText = document.querySelector('.cron-status-text');
  console.log(data);

  const { isAutomatedLogsActive } = data;
  isAutomatedLogsActive
    ? (indicator.innerHTML = `<img class="indicator-img" src="/assets/check.svg" alt="check mark">`)
    : (indicator.innerHTML = `<img class="indicator-img" src="/assets/warning.svg" alt="check mark">`);
  isAutomatedLogsActive ? (statusText.innerText = 'Running') : 'Not Active';
  isAutomatedLogsActive && indicator.classList.add('active');
}

async function startCountdown() {
  const countdownEl = document.querySelector('.cron-countdown');
  const modeEl = document.querySelector('.cron-countdown-mode');
  let target = null;
  let mode = null;

  async function refresh() {
    try {
      const res = await fetch('/next-cron-fire');
      const data = await res.json();
      target = data.nextFire;
      mode = data.mode;
      if (modeEl) modeEl.innerText = mode ? mode.toUpperCase() : '—';
    } catch (err) {
      console.log('countdown refresh failed', err);
    }
  }

  function render() {
    if (!target) {
      countdownEl.innerText = '—';
      return;
    }
    const diff = target - Date.now();
    if (diff <= 0) {
      countdownEl.innerText = 'Firing now…';
      refresh();
      return;
    }
    const h = Math.floor(diff / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    const s = Math.floor((diff % 60000) / 1000);
    countdownEl.innerText = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }

  await refresh();
  render();
  setInterval(render, 1000);
  // Re-sync with backend every 5 minutes in case of clock drift / schedule changes
  setInterval(refresh, 5 * 60 * 1000);
}

function displayNextSproutAutomationTime(data) {
  const { nextSproutAutomation } = data;
  const statusTime = document.querySelector('.cron-next-active-time');
  const statusMode = document.querySelector('.cron-next-active-mode');
  if (!nextSproutAutomation.time) {
    statusTime.innerText = 'No ongoing automation';
    statusMode.innerText = 'N/A';
  } else {
    statusTime.innerText = `${nextSproutAutomation.time}`;
    statusMode.innerText = `${nextSproutAutomation.mode}`;
  }
}
