const testH1 = document.querySelector(".log-container")

const isProd = true;
const API_ENDPOINT =
  isProd
    ? "http://128.199.145.173:4200"
    : "http://localhost:4200"
// reminder comment proper

fetch(`${API_ENDPOINT}/get-records`)
  .then(res => res.json())
  .then(data => displayRecords(data))
  .catch(err => console.log(err))


function displayRecords(timelogs) {
  console.log(timelogs)
  testH1.innerHTML = timelogs.map(el => `
<div class="data-row">
  <div class="status-bubble ${el.status === "success" ? "success-bubble" : "fail-bubble"}" ></div>

  <div class="row-text">
   <span class="value-text">${el.dateTime}</span>
   <span class="value-text">${el.type}</span>
   <span class="value-text ${el.status === "success" ? "success-text" : "fail-text"}">${el.status}</span>
  </div>
</div> `).join("")
}
