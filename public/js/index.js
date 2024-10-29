const testH1 = document.querySelector(".log-container")

const API_ENDPOINT = "http://128.199.145.173:4200"

fetch(`${API_ENDPOINT}/get-records`)
  .then(res => res.json())
  .then(data => displayRecords(data))
  .catch(err => console.log(err))


function displayRecords(timelogs) {
  console.log(timelogs)
  testH1.innerHTML = timelogs.map(el => `
<div class="data-row">
  <span class="value-text">${el.dateTime}</span>
  <span class="value-text">${el.type}</span>
  <span class="value-text ${el.status === "success" ? "success-text" : "fail-text"}">${el.status}</span>
</div> `).join("")
}
