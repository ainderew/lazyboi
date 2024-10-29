const CheckRecords = require("./get-records.route")
const CheckCronStatus = require("./check-cron-status.route")
const StartCron = require("./start-cron.route")

module.exports = [
  CheckCronStatus,
  CheckRecords,
  StartCron,
]
