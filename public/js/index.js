const testH1 = document.querySelector('.log-container');

//TODO: change before pushing
const isProd = false;
const API_ENDPOINT = isProd ? 'https://workdash.site' : 'http://localhost:4200';
// reminder comment proper

fetch(`${API_ENDPOINT}/get-records`)
  .then((res) => res.json())
  .then((data) => displayRecords(data))
  .catch((err) => console.log(err));

fetch(`${API_ENDPOINT}/check-cron-status`)
  .then((res) => res.json())
  .then((data) => displayCronStatus(data))
  .catch((err) => console.log(err));

fetch(`${API_ENDPOINT}/check-next-sprout-automation`)
  .then((res) => res.json())
  .then((data) => displayNextSproutAutomationTime(data))
  .catch((err) => console.log(err));

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
    ? (indicator.innerHTML = `<img class="indicator-img" src="./assets/check.svg" alt="check mark">`)
    : (indicator.innerHTML = `<img class="indicator-img" src="./assets/warning.svg" alt="check mark">`);
  isAutomatedLogsActive ? (statusText.innerText = 'Running') : 'Not Active';
  isAutomatedLogsActive && indicator.classList.add('active');
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
