import config from '../utils/config.js';

function checkCronStatus(_, res) {
  res.json({ isAutomatedLogsActive: config.IS_CRON_JOB_ACTIVE });
}

export default checkCronStatus;
