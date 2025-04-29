const config = require('../utils/config');

function checkCronStatus(_, res) {
  res.json({ isAutomatedLogsActive: config.IS_CRON_JOB_ACTIVE });
}

module.exports = checkCronStatus;
