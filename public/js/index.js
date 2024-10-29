const dotenv = require("dotenv");
dotenv.config();

const testH1 = document.querySelector(".log-container")

const API_ENDPOINT = process.env.API_ENDPOINT
// reminder comment proper
// const API_ENDPOINT = "http://localhost:4200"

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
